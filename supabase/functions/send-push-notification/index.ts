import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  userId?: string;
  title: string;
  body: string;
  link?: string;
  platform?: 'ios' | 'android' | 'all';
}

// Function to get OAuth2 access token from service account
async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  // Create JWT
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Import jose for JWT signing
  const { SignJWT, importPKCS8 } = await import('https://deno.land/x/jose@v5.2.0/index.ts');
  
  const privateKey = await importPKCS8(serviceAccount.private_key, 'RS256');
  
  const jwt = await new SignJWT(payload)
    .setProtectedHeader(header)
    .sign(privateKey);

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('Error getting access token:', error);
    throw new Error('Failed to get OAuth2 access token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, body, link, platform = 'all' }: PushNotificationRequest = await req.json();

    if (!title || !body) {
      throw new Error('Missing required fields: title, body');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Build query for user devices
    let devicesQuery = supabaseAdmin
      .from('user_devices')
      .select('id, user_id, fcm_token, platform, device_name')
      .not('fcm_token', 'is', null);

    // Filter by userId if provided
    if (userId) {
      devicesQuery = devicesQuery.eq('user_id', userId);
    }

    // Filter by platform if specified
    if (platform !== 'all') {
      devicesQuery = devicesQuery.eq('platform', platform);
    }

    const { data: devices, error: devicesError } = await devicesQuery;

    if (devicesError) {
      console.error('Error fetching devices:', devicesError);
      throw devicesError;
    }

    if (!devices || devices.length === 0) {
      console.log('No devices found with FCM tokens');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No devices found with FCM tokens',
          sent: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Get OAuth2 access token
    const accessToken = await getAccessToken();

    // Get project ID from service account
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    const serviceAccount = JSON.parse(serviceAccountJson!);
    const projectId = serviceAccount.project_id;

    let successCount = 0;
    let errorCount = 0;

    // Send notification to all devices
    for (const device of devices) {
      try {
        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
        
        const fcmResponse = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: device.fcm_token,
              notification: {
                title,
                body,
              },
              data: {
                link: link || '',
              },
              android: {
                priority: 'high',
              },
              apns: {
                headers: {
                  'apns-priority': '10',
                },
              },
            },
          }),
        });

        const fcmResult = await fcmResponse.json();

        if (!fcmResponse.ok) {
          console.error(`FCM error for device ${device.id}:`, fcmResult);
          
          // Check for invalid/expired token errors
          const errorCode = fcmResult.error?.code;
          const errorStatus = fcmResult.error?.status;
          const isUnregistered = fcmResult.error?.details?.some(
            (d: any) => d.errorCode === 'UNREGISTERED'
          );

          if (errorCode === 404 || 
              errorCode === 400 ||
              errorStatus === 'NOT_FOUND' || 
              errorStatus === 'INVALID_ARGUMENT' ||
              isUnregistered) {
            console.log(`🗑️ Invalid/expired FCM token, removing device ${device.id}`);
            await supabaseAdmin
              .from('user_devices')
              .delete()
              .eq('id', device.id);
          }
          
          errorCount++;
        } else {
          console.log(`✅ Push sent to device ${device.id} (${device.platform})`);
          
          // Update last_used_at
          await supabaseAdmin
            .from('user_devices')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', device.id);
          
          successCount++;
        }
      } catch (err) {
        console.error(`Error sending push to device ${device.id}:`, err);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Push notifications sent: ${successCount} successful, ${errorCount} failed`,
        sent: successCount,
        failed: errorCount
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