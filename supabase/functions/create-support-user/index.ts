import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the JWT from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the caller is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if caller is admin
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: callerUser.id });
    
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Apenas administradores podem gerenciar usuários' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, name, password, action, userId, deletedUserId } = await req.json();

    // Handle different actions
    if (action === 'create') {
      if (!email || !name || !password) {
        return new Response(JSON.stringify({ error: 'Email, nome e senha são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Creating support user: ${email}`);

      // Create user with admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Profile is created automatically by the handle_new_user trigger
      // Just wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Add support role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: 'support'
        });

      if (roleError) {
        console.error('Error adding role:', roleError);
        // Cleanup
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: 'Erro ao adicionar permissão' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Support user created successfully: ${newUser.user.id}`);

      return new Response(JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        message: 'Funcionário criado com sucesso'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'remove_access') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId é obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Remove support role
      const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'support');

      if (error) {
        console.error('Error removing role:', error);
        return new Response(JSON.stringify({ error: 'Erro ao remover permissão' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Acesso removido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'reset_password') {
      if (!userId || !password) {
        return new Response(JSON.stringify({ error: 'userId e password são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password
      });

      if (error) {
        console.error('Error resetting password:', error);
        return new Response(JSON.stringify({ error: 'Erro ao resetar senha' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Senha resetada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'delete') {
      // SOFT DELETE - Move user to deleted_users table
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId é obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Soft deleting user: ${userId}`);

      // 1. Fetch all user data for backup
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch related data
      const [
        userRolesResult,
        artistsResult,
        musiciansResult,
        venuesResult,
        musicianVenuesResult,
        musicianInstrumentsResult,
        showsResult,
        locomotionResult,
        subscriptionsResult,
        referralCodesResult,
        referralsAsReferrerResult,
        referralsAsReferredResult,
        supportTicketsResult,
        supportResponsesResult
      ] = await Promise.all([
        supabaseAdmin.from('user_roles').select('*').eq('user_id', userId),
        supabaseAdmin.from('artists').select('*').eq('owner_uid', userId),
        supabaseAdmin.from('musicians').select('*').eq('owner_uid', userId),
        supabaseAdmin.from('venues').select('*').eq('owner_uid', userId),
        supabaseAdmin.from('musician_venues').select('*').eq('owner_uid', userId),
        supabaseAdmin.from('musician_instruments').select('*').eq('owner_uid', userId),
        supabaseAdmin.from('shows').select('*').eq('uid', userId),
        supabaseAdmin.from('locomotion_expenses').select('*').eq('uid', userId),
        supabaseAdmin.from('subscriptions').select('*').eq('user_id', userId),
        supabaseAdmin.from('referral_codes').select('*').eq('user_id', userId),
        supabaseAdmin.from('referrals').select('*').eq('referrer_id', userId),
        supabaseAdmin.from('referrals').select('*').eq('referred_id', userId),
        supabaseAdmin.from('support_tickets').select('*').eq('user_id', userId),
        supabaseAdmin.from('support_responses').select('*').eq('user_id', userId)
      ]);

      // 2. Insert into deleted_users table
      const { error: insertError } = await supabaseAdmin
        .from('deleted_users')
        .insert({
          original_user_id: userId,
          deleted_by: callerUser.id,
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          cpf: profile.cpf,
          birth_date: profile.birth_date,
          photo_url: profile.photo_url,
          plan_type: profile.plan_type,
          status_plano: profile.status_plano,
          timezone: profile.timezone,
          gender: profile.gender,
          fcm_token: profile.fcm_token,
          user_roles: userRolesResult.data || [],
          artists: artistsResult.data || [],
          musicians: musiciansResult.data || [],
          venues: venuesResult.data || [],
          musician_venues: musicianVenuesResult.data || [],
          musician_instruments: musicianInstrumentsResult.data || [],
          shows: showsResult.data || [],
          locomotion_expenses: locomotionResult.data || [],
          subscriptions: subscriptionsResult.data || [],
          referral_codes: referralCodesResult.data || [],
          referrals_as_referrer: referralsAsReferrerResult.data || [],
          referrals_as_referred: referralsAsReferredResult.data || [],
          support_tickets: supportTicketsResult.data || [],
          support_responses: supportResponsesResult.data || [],
          status: 'pending_deletion'
        });

      if (insertError) {
        console.error('Error inserting into deleted_users:', insertError);
        return new Response(JSON.stringify({ error: 'Erro ao mover usuário para lixeira' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 3. Delete user from auth (this will cascade delete most data via triggers/policies)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        // Rollback: remove from deleted_users
        await supabaseAdmin.from('deleted_users').delete().eq('original_user_id', userId);
        return new Response(JSON.stringify({ error: 'Erro ao excluir conta' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`User ${userId} moved to trash successfully`);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Usuário movido para lixeira. Será excluído permanentemente em 30 dias.',
        softDeleted: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'restore') {
      // RESTORE user from deleted_users
      if (!deletedUserId) {
        return new Response(JSON.stringify({ error: 'deletedUserId é obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Restoring user from deleted_users: ${deletedUserId}`);

      // 1. Fetch deleted user data
      const { data: deletedUser, error: fetchError } = await supabaseAdmin
        .from('deleted_users')
        .select('*')
        .eq('id', deletedUserId)
        .eq('status', 'pending_deletion')
        .single();

      if (fetchError || !deletedUser) {
        console.error('Error fetching deleted user:', fetchError);
        return new Response(JSON.stringify({ error: 'Usuário deletado não encontrado ou já foi restaurado/excluído' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 2. Create new auth user with same email (new password will be required)
      const tempPassword = crypto.randomUUID().slice(0, 16) + 'Aa1!';
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: deletedUser.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name: deletedUser.name }
      });

      if (createError) {
        console.error('Error creating restored user:', createError);
        return new Response(JSON.stringify({ error: `Erro ao restaurar usuário: ${createError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const newUserId = newUser.user.id;

      // 3. Wait for profile trigger
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4. Update profile with old data
      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({
          name: deletedUser.name,
          phone: deletedUser.phone,
          cpf: deletedUser.cpf,
          birth_date: deletedUser.birth_date,
          photo_url: deletedUser.photo_url,
          plan_type: deletedUser.plan_type,
          status_plano: deletedUser.status_plano,
          timezone: deletedUser.timezone,
          gender: deletedUser.gender
        })
        .eq('id', newUserId);

      if (updateProfileError) {
        console.error('Error updating restored profile:', updateProfileError);
      }

      // 5. Restore user roles
      const userRoles = deletedUser.user_roles as any[] || [];
      for (const role of userRoles) {
        await supabaseAdmin.from('user_roles').insert({
          user_id: newUserId,
          role: role.role
        });
      }

      // 6. Restore artists
      const artists = deletedUser.artists as any[] || [];
      for (const artist of artists) {
        await supabaseAdmin.from('artists').insert({
          owner_uid: newUserId,
          name: artist.name
        });
      }

      // 7. Restore musicians
      const musicians = deletedUser.musicians as any[] || [];
      for (const musician of musicians) {
        await supabaseAdmin.from('musicians').insert({
          owner_uid: newUserId,
          name: musician.name,
          instrument: musician.instrument,
          default_fee: musician.default_fee
        });
      }

      // 8. Restore venues
      const venues = deletedUser.venues as any[] || [];
      for (const venue of venues) {
        await supabaseAdmin.from('venues').insert({
          owner_uid: newUserId,
          name: venue.name,
          address: venue.address
        });
      }

      // 9. Restore musician_venues
      const musicianVenues = deletedUser.musician_venues as any[] || [];
      for (const venue of musicianVenues) {
        await supabaseAdmin.from('musician_venues').insert({
          owner_uid: newUserId,
          name: venue.name,
          address: venue.address
        });
      }

      // 10. Restore musician_instruments
      const musicianInstruments = deletedUser.musician_instruments as any[] || [];
      for (const instrument of musicianInstruments) {
        await supabaseAdmin.from('musician_instruments').insert({
          owner_uid: newUserId,
          name: instrument.name
        });
      }

      // 11. Restore shows
      const shows = deletedUser.shows as any[] || [];
      for (const show of shows) {
        await supabaseAdmin.from('shows').insert({
          uid: newUserId,
          venue_name: show.venue_name,
          date_local: show.date_local,
          time_local: show.time_local,
          fee: show.fee,
          expenses_team: show.expenses_team,
          expenses_other: show.expenses_other,
          duration_hours: show.duration_hours,
          is_private_event: show.is_private_event
        });
      }

      // 12. Restore locomotion expenses
      const locomotionExpenses = deletedUser.locomotion_expenses as any[] || [];
      for (const expense of locomotionExpenses) {
        await supabaseAdmin.from('locomotion_expenses').insert({
          uid: newUserId,
          type: expense.type,
          cost: expense.cost,
          distance_km: expense.distance_km,
          price_per_liter: expense.price_per_liter,
          vehicle_consumption: expense.vehicle_consumption
        });
      }

      // 13. Mark deleted_user as restored
      await supabaseAdmin
        .from('deleted_users')
        .update({
          status: 'restored',
          restored_at: new Date().toISOString(),
          restored_by: callerUser.id
        })
        .eq('id', deletedUserId);

      console.log(`User restored successfully. New user ID: ${newUserId}`);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Usuário restaurado com sucesso! Uma nova senha temporária foi gerada.',
        newUserId,
        tempPassword,
        note: 'O usuário deverá redefinir sua senha no próximo login.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'permanent_delete') {
      // PERMANENT DELETE - Remove from deleted_users
      if (!deletedUserId) {
        return new Response(JSON.stringify({ error: 'deletedUserId é obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Permanently deleting user from trash: ${deletedUserId}`);

      // Mark as permanently deleted
      const { error: updateError } = await supabaseAdmin
        .from('deleted_users')
        .update({
          status: 'permanently_deleted',
          permanently_deleted_at: new Date().toISOString()
        })
        .eq('id', deletedUserId);

      if (updateError) {
        console.error('Error permanently deleting:', updateError);
        return new Response(JSON.stringify({ error: 'Erro ao excluir permanentemente' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`User ${deletedUserId} permanently deleted`);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Usuário excluído permanentemente'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Ação inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
