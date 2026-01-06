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

    // Verify the caller is support or admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if caller is support or admin
    const { data: isSupport } = await supabaseAdmin.rpc('is_support', { _user_id: callerUser.id });
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: callerUser.id });
    
    if (!isSupport && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, userId, newEmail, newPassword, newName, newPhone } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle different actions
    if (action === 'update_email') {
      if (!newEmail) {
        return new Response(JSON.stringify({ error: 'Novo email é obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Support updating email for user: ${userId}`);

      // Update email in auth
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: newEmail,
        email_confirm: true
      });

      if (authUpdateError) {
        console.error('Error updating auth email:', authUpdateError);
        return new Response(JSON.stringify({ error: authUpdateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update email in profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ email: newEmail, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile email:', profileError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email atualizado com sucesso'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'reset_password') {
      if (!newPassword) {
        return new Response(JSON.stringify({ error: 'Nova senha é obrigatória' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: 'Senha deve ter no mínimo 6 caracteres' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Support resetting password for user: ${userId}`);

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        console.error('Error resetting password:', error);
        return new Response(JSON.stringify({ error: 'Erro ao resetar senha' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Senha resetada com sucesso'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'update_profile') {
      console.log(`Support updating profile for user: ${userId}`);

      const updates: Record<string, string> = { updated_at: new Date().toISOString() };
      
      if (newName) updates.name = newName;
      if (newPhone !== undefined) updates.phone = newPhone;

      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        return new Response(JSON.stringify({ error: 'Erro ao atualizar perfil' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Perfil atualizado com sucesso'
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
