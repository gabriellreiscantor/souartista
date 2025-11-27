import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  title: string;
  message: string;
  link?: string;
  userId: string; // REQUIRED - user ID to send notification to
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, message, link, userId }: NotificationRequest = await req.json();

    if (!title || !message || !userId) {
      throw new Error('Missing required fields: title, message, userId');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Cria a notificação USER-SPECIFIC no banco
    const { data: notification, error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        title,
        message,
        link: link || null,
        user_id: userId, // USER-SPECIFIC
        created_by: userId,
      })
      .select()
      .single();

    if (notifError) {
      console.error('Error creating notification:', notifError);
      throw notifError;
    }

    console.log('✅ Notification created for user:', userId);

    // Envia push notification
    try {
      const pushResponse = await supabaseAdmin.functions.invoke('send-push-notification', {
        body: { userId, title, body: message, link },
      });

      if (pushResponse.error) {
        console.error('Error sending push notification:', pushResponse.error);
        // Não falha a requisição se push notification falhar
      } else {
        console.log('✅ Push notification sent');
      }
    } catch (pushError) {
      console.error('Error invoking push notification:', pushError);
      // Não falha a requisição se push notification falhar
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification,
        pushSent: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in create-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});