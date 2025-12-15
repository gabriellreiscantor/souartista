import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Credenciais da conta de teste da Apple (ativa)
const TEST_EMAIL = 'tester@souartista.com';
const TEST_PASSWORD = 'AppleTest123';
const TEST_NAME = 'Apple Tester';

// Credenciais da conta de teste da Apple (expirada - para testar paywall)
const EXPIRED_TEST_EMAIL = 'reviewer@souartista.com';
const EXPIRED_TEST_PASSWORD = 'AppleReview123';
const EXPIRED_TEST_NAME = 'Apple Reviewer';

async function setupTestAccount(
  supabaseAdmin: any,
  email: string,
  password: string,
  name: string,
  isExpired: boolean
) {
  console.log(`🍎 Setting up account: ${email} (expired: ${isExpired})`);

  // 1. Verificar se o usuário já existe
  const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    throw listError;
  }

  const existingUser = existingUsers.users.find((u: any) => u.email === email);
  
  let userId: string;

  if (existingUser) {
    console.log(`🍎 User ${email} exists, updating password...`);
    userId = existingUser.id;
    
    // Atualizar senha e confirmar email
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password,
      email_confirm: true
    });
    
    if (updateError) {
      console.error('Error updating user:', updateError);
      throw updateError;
    }
    
    console.log('🍎 Password updated and email confirmed');
  } else {
    console.log(`🍎 Creating new user: ${email}...`);
    
    // Criar novo usuário
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name
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
      email: email,
      name: name,
      cpf: isExpired ? '11111111111' : '00000000000',
      phone: '+5500000000000',
      birth_date: '1990-01-01',
      status_plano: isExpired ? 'inativo' : 'ativo',
      is_verified: true
    }, { onConflict: 'id' });

  if (upsertProfileError) {
    console.error('Error upserting profile:', upsertProfileError);
    throw upsertProfileError;
  }

  console.log('🍎 Profile configured');

  // 3. Garantir que tem role de artista
  const { data: existingRole } = await supabaseAdmin
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingRole) {
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .update({ role: 'artist' })
      .eq('user_id', userId);

    if (roleError) {
      console.error('Error updating role:', roleError);
      throw roleError;
    }
  } else {
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
    
    const expenses = [
      { uid: userId, type: 'uber', cost: 45.50, created_at: new Date(currentYear, currentMonth, 5).toISOString() },
      { uid: userId, type: 'uber', cost: 38.00, created_at: new Date(currentYear, currentMonth, 12).toISOString() },
      { uid: userId, type: 'km', cost: 85.00, distance_km: 50, price_per_liter: 5.89, vehicle_consumption: 10, created_at: new Date(currentYear, currentMonth, 8).toISOString() },
      { uid: userId, type: 'uber', cost: 52.00, created_at: new Date(currentYear, currentMonth - 1, 3).toISOString() },
      { uid: userId, type: 'uber', cost: 29.90, created_at: new Date(currentYear, currentMonth - 1, 15).toISOString() },
      { uid: userId, type: 'km', cost: 120.00, distance_km: 80, price_per_liter: 5.99, vehicle_consumption: 12, created_at: new Date(currentYear, currentMonth - 1, 20).toISOString() },
      { uid: userId, type: 'van', cost: 150.00, created_at: new Date(currentYear, currentMonth - 1, 25).toISOString() },
      { uid: userId, type: 'uber', cost: 35.00, created_at: new Date(currentYear, currentMonth - 2, 8).toISOString() },
      { uid: userId, type: 'km', cost: 95.00, distance_km: 60, price_per_liter: 5.79, vehicle_consumption: 11, created_at: new Date(currentYear, currentMonth - 2, 18).toISOString() },
      { uid: userId, type: 'onibus', cost: 25.00, created_at: new Date(currentYear, currentMonth - 2, 22).toISOString() },
      { uid: userId, type: 'uber', cost: 48.00, created_at: new Date(currentYear, currentMonth - 3, 5).toISOString() },
      { uid: userId, type: 'uber', cost: 42.50, created_at: new Date(currentYear, currentMonth - 3, 14).toISOString() },
      { uid: userId, type: 'aviao', cost: 450.00, created_at: new Date(currentYear, currentMonth - 3, 28).toISOString() },
    ];

    await supabaseAdmin.from('locomotion_expenses').insert(expenses);
  }

  // 8. For expired accounts, create an expired subscription record
  if (isExpired) {
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingSubscription) {
      console.log('🍎 Adding expired subscription for returning user modal...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      await supabaseAdmin.from('subscriptions').insert({
        user_id: userId,
        plan_type: 'monthly',
        status: 'expired',
        amount: 29.90,
        payment_method: 'PIX',
        next_due_date: thirtyDaysAgo.toISOString(),
        updated_at: thirtyDaysAgo.toISOString()
      });
      
      console.log('🍎 Expired subscription created');
    } else {
      // Update existing subscription to expired
      await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: 'expired',
          updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', existingSubscription.id);
    }
  }

  return userId;
}

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

    console.log('🍎 Starting Apple test accounts setup...');

    // Setup active test account
    const activeUserId = await setupTestAccount(
      supabaseAdmin,
      TEST_EMAIL,
      TEST_PASSWORD,
      TEST_NAME,
      false
    );

    // Setup expired test account
    const expiredUserId = await setupTestAccount(
      supabaseAdmin,
      EXPIRED_TEST_EMAIL,
      EXPIRED_TEST_PASSWORD,
      EXPIRED_TEST_NAME,
      true
    );

    console.log('🍎 Apple test accounts setup complete!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Apple test accounts configured successfully',
        accounts: {
          active: {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            status: 'ativo',
            userId: activeUserId
          },
          expired: {
            email: EXPIRED_TEST_EMAIL,
            password: EXPIRED_TEST_PASSWORD,
            status: 'inativo (para testar paywall)',
            userId: expiredUserId
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error setting up test accounts:', error);
    
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