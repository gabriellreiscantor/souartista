import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  userId: string;
  title: string;
  body: string;
  link?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, body, link }: PushNotificationRequest = await req.json();

    if (!userId || !title || !body) {
      throw new Error('Missing required fields: userId, title, body');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's FCM token
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.fcm_token) {
      console.log('No FCM token found for user:', userId);
      return new Response(
        JSON.stringify({ error: 'No FCM token found for user' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    // Send notification via FCM
    const fcmServerKey = Deno.env.get('FIREBASE_SERVER_KEY');
    
    if (!fcmServerKey) {
      throw new Error('FIREBASE_SERVER_KEY not configured');
    }

    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: profile.fcm_token,
        notification: {
          title,
          body,
        },
        data: {
          link: link || '',
        },
        priority: 'high',
      }),
    });

    const fcmResult = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error('FCM error:', fcmResult);
      throw new Error('Failed to send push notification');
    }

    console.log('✅ Push notification sent successfully:', fcmResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push notification sent',
        fcmResult 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
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
