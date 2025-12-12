import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Credenciais da conta de teste da Apple
const TEST_EMAIL = 'tester@souartista.com';
const TEST_PASSWORD = 'AppleTest123';
const TEST_NAME = 'Apple Tester';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Usar service role para operações admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🍎 Starting Apple test account setup...');

    // 1. Verificar se o usuário já existe
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const existingUser = existingUsers.users.find(u => u.email === TEST_EMAIL);
    
    let userId: string;

    if (existingUser) {
      console.log('🍎 Test user exists, updating password...');
      userId = existingUser.id;
      
      // Atualizar senha e confirmar email
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: TEST_PASSWORD,
        email_confirm: true
      });
      
      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }
      
      console.log('🍎 Password updated and email confirmed');
    } else {
      console.log('🍎 Creating new test user...');
      
      // Criar novo usuário
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: TEST_NAME
        }
      });
      
      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }
      
      userId = newUser.user.id;
      console.log('🍎 New user created:', userId);
    }

    // 2. Garantir que o profile existe e está completo
    const { error: upsertProfileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: TEST_EMAIL,
        name: TEST_NAME,
        cpf: '00000000000',
        phone: '+5500000000000',
        birth_date: '1990-01-01',
        status_plano: 'ativo',
        is_verified: true
      }, { onConflict: 'id' });

    if (upsertProfileError) {
      console.error('Error upserting profile:', upsertProfileError);
      throw upsertProfileError;
    }

    console.log('🍎 Profile configured');

    // 3. Garantir que tem role de artista
    // Primeiro verificar se já existe
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingRole) {
      // Atualizar role existente
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: 'artist' })
        .eq('user_id', userId);

      if (roleError) {
        console.error('Error updating role:', roleError);
        throw roleError;
      }
    } else {
      // Inserir nova role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: 'artist' });

      if (roleError) {
        console.error('Error inserting role:', roleError);
        throw roleError;
      }
    }

    console.log('🍎 Role configured as artist');

    // 4. Adicionar shows de demonstração se não existirem
    const { data: existingShows } = await supabaseAdmin
      .from('shows')
      .select('id')
      .eq('uid', userId);

    if (!existingShows || existingShows.length === 0) {
      console.log('🍎 Adding demo shows...');
      
      const today = new Date();
      const shows = [
        {
          uid: userId,
          venue_name: 'Bar do Blues',
          date_local: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time_local: '21:00',
          fee: 1500.00,
          duration_hours: 3,
          is_private_event: false,
          expenses_team: [],
          expenses_other: []
        },
        {
          uid: userId,
          venue_name: 'Restaurante Villa',
          date_local: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time_local: '20:00',
          fee: 2000.00,
          duration_hours: 4,
          is_private_event: false,
          expenses_team: [],
          expenses_other: []
        },
        {
          uid: userId,
          venue_name: 'Casamento Silva',
          date_local: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time_local: '19:00',
          fee: 5000.00,
          duration_hours: 5,
          is_private_event: true,
          expenses_team: [],
          expenses_other: []
        }
      ];

      await supabaseAdmin.from('shows').insert(shows);
    }

    // 5. Adicionar músicos de demonstração se não existirem
    const { data: existingMusicians } = await supabaseAdmin
      .from('musicians')
      .select('id')
      .eq('owner_uid', userId);

    if (!existingMusicians || existingMusicians.length === 0) {
      console.log('🍎 Adding demo musicians...');
      
      const musicians = [
        { owner_uid: userId, name: 'João Guitarrista', instrument: 'Guitarra', default_fee: 300 },
        { owner_uid: userId, name: 'Maria Baterista', instrument: 'Bateria', default_fee: 350 },
        { owner_uid: userId, name: 'Pedro Baixista', instrument: 'Baixo', default_fee: 280 }
      ];

      await supabaseAdmin.from('musicians').insert(musicians);
    }

    // 6. Adicionar venues de demonstração se não existirem
    const { data: existingVenues } = await supabaseAdmin
      .from('venues')
      .select('id')
      .eq('owner_uid', userId);

    if (!existingVenues || existingVenues.length === 0) {
      console.log('🍎 Adding demo venues...');
      
      const venues = [
        { owner_uid: userId, name: 'Bar do Blues', address: 'Rua das Flores, 123 - Centro' },
        { owner_uid: userId, name: 'Restaurante Villa', address: 'Av. Principal, 456 - Jardins' },
        { owner_uid: userId, name: 'Clube Social', address: 'Rua do Clube, 789 - Centro' }
      ];

      await supabaseAdmin.from('venues').insert(venues);
    }

    // 7. Adicionar despesas de locomoção de demonstração se não existirem
    const { data: existingExpenses } = await supabaseAdmin
      .from('locomotion_expenses')
      .select('id')
      .eq('uid', userId);

    if (!existingExpenses || existingExpenses.length === 0) {
      console.log('🍎 Adding demo locomotion expenses...');
      
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      
      // Despesas variadas ao longo dos últimos meses
      const expenses = [
        // Mês atual
        { uid: userId, type: 'uber', cost: 45.50, created_at: new Date(currentYear, currentMonth, 5).toISOString() },
        { uid: userId, type: 'uber', cost: 38.00, created_at: new Date(currentYear, currentMonth, 12).toISOString() },
        { uid: userId, type: 'km', cost: 85.00, distance_km: 50, price_per_liter: 5.89, vehicle_consumption: 10, created_at: new Date(currentYear, currentMonth, 8).toISOString() },
        // Mês passado
        { uid: userId, type: 'uber', cost: 52.00, created_at: new Date(currentYear, currentMonth - 1, 3).toISOString() },
        { uid: userId, type: 'uber', cost: 29.90, created_at: new Date(currentYear, currentMonth - 1, 15).toISOString() },
        { uid: userId, type: 'km', cost: 120.00, distance_km: 80, price_per_liter: 5.99, vehicle_consumption: 12, created_at: new Date(currentYear, currentMonth - 1, 20).toISOString() },
        { uid: userId, type: 'van', cost: 150.00, created_at: new Date(currentYear, currentMonth - 1, 25).toISOString() },
        // 2 meses atrás
        { uid: userId, type: 'uber', cost: 35.00, created_at: new Date(currentYear, currentMonth - 2, 8).toISOString() },
        { uid: userId, type: 'km', cost: 95.00, distance_km: 60, price_per_liter: 5.79, vehicle_consumption: 11, created_at: new Date(currentYear, currentMonth - 2, 18).toISOString() },
        { uid: userId, type: 'onibus', cost: 25.00, created_at: new Date(currentYear, currentMonth - 2, 22).toISOString() },
        // 3 meses atrás
        { uid: userId, type: 'uber', cost: 48.00, created_at: new Date(currentYear, currentMonth - 3, 5).toISOString() },
        { uid: userId, type: 'uber', cost: 42.50, created_at: new Date(currentYear, currentMonth - 3, 14).toISOString() },
        { uid: userId, type: 'aviao', cost: 450.00, created_at: new Date(currentYear, currentMonth - 3, 28).toISOString() },
      ];

      await supabaseAdmin.from('locomotion_expenses').insert(expenses);
    }

    console.log('🍎 Apple test account setup complete!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Apple test account configured successfully',
        credentials: {
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        },
        userId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error setting up test account:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});