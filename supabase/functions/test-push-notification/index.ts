import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[test-push-notification] ========================================');
  console.log('[test-push-notification] 🧪 Test function invoked');

  try {
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    console.log('[test-push-notification] Testing push for user:', userId);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check user devices
    const { data: devices, error: devicesError } = await supabaseAdmin
      .from('user_devices')
      .select('*')
      .eq('user_id', userId);

    if (devicesError) {
      throw devicesError;
    }

    console.log('[test-push-notification] User devices:', JSON.stringify(devices, null, 2));

    // Send test notification
    const testTitle = 'Teste de Notificação 🔔';
    const testBody = `Esta é uma notificação de teste enviada em ${new Date().toLocaleString('pt-BR')}`;

    console.log('[test-push-notification] Invoking send-push-notification...');

    const { data: pushResult, error: pushError } = await supabaseAdmin.functions.invoke(
      'send-push-notification',
      {
        body: {
          userId,
          title: testTitle,
          body: testBody,
          link: '/artist/dashboard',
        },
      }
    );

    if (pushError) {
      console.error('[test-push-notification] ❌ Push error:', pushError);
      throw pushError;
    }

    console.log('[test-push-notification] ✅ Push result:', JSON.stringify(pushResult));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test notification sent',
        devices: devices?.length || 0,
        deviceDetails: devices?.map(d => ({
          id: d.id,
          platform: d.platform,
          device_name: d.device_name,
          has_token: !!d.fcm_token,
          token_preview: d.fcm_token?.substring(0, 30) + '...',
          last_used: d.last_used_at,
        })),
        pushResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[test-push-notification] ❌ Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
