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
    console.error('[send-push-notification] ❌ Error getting access token:', error);
    throw new Error('Failed to get OAuth2 access token');
  }

  const tokenData = await tokenResponse.json();
  console.log('[send-push-notification] ✅ OAuth2 access token obtained successfully');
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[send-push-notification] ========================================');
  console.log('[send-push-notification] 🚀 Function invoked at:', new Date().toISOString());

  try {
    const { userId, title, body, link, platform = 'all' }: PushNotificationRequest = await req.json();

    console.log('[send-push-notification] 📤 Request details:');
    console.log('[send-push-notification]   - userId:', userId || 'ALL USERS');
    console.log('[send-push-notification]   - title:', title);
    console.log('[send-push-notification]   - body:', body?.substring(0, 50) + '...');
    console.log('[send-push-notification]   - link:', link || 'none');
    console.log('[send-push-notification]   - platform:', platform);

    if (!title || !body) {
      console.error('[send-push-notification] ❌ Missing required fields');
      throw new Error('Missing required fields: title, body');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Build query for user devices
    let devicesQuery = supabaseAdmin
      .from('user_devices')
      .select('id, user_id, fcm_token, platform, device_name, last_used_at')
      .not('fcm_token', 'is', null);

    // Filter by userId if provided
    if (userId) {
      console.log('[send-push-notification] 🔍 Filtering by userId:', userId);
      devicesQuery = devicesQuery.eq('user_id', userId);
    }

    // Filter by platform if specified
    if (platform !== 'all') {
      console.log('[send-push-notification] 🔍 Filtering by platform:', platform);
      devicesQuery = devicesQuery.eq('platform', platform);
    }

    const { data: devices, error: devicesError } = await devicesQuery;

    if (devicesError) {
      console.error('[send-push-notification] ❌ Error fetching devices:', devicesError);
      throw devicesError;
    }

    console.log('[send-push-notification] 📱 Total devices found:', devices?.length || 0);

    if (!devices || devices.length === 0) {
      console.log('[send-push-notification] ⚠️ No devices found with FCM tokens');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No devices found with FCM tokens',
          sent: 0,
          failed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Remove duplicate tokens - keep only the most recent device for each token
    const tokenMap = new Map<string, typeof devices[0]>();
    for (const device of devices) {
      const existingDevice = tokenMap.get(device.fcm_token!);
      if (!existingDevice || 
          (device.last_used_at && (!existingDevice.last_used_at || device.last_used_at > existingDevice.last_used_at))) {
        tokenMap.set(device.fcm_token!, device);
      }
    }
    
    const uniqueDevices = Array.from(tokenMap.values());
    console.log('[send-push-notification] 📱 Unique devices (after dedup):', uniqueDevices.length);
    
    if (uniqueDevices.length < devices.length) {
      console.log('[send-push-notification] ⚠️ Removed', devices.length - uniqueDevices.length, 'duplicate tokens');
    }

    // Log device details
    uniqueDevices.forEach((d, i) => {
      console.log(`[send-push-notification]   Device ${i + 1}:`, {
        id: d.id,
        platform: d.platform,
        device_name: d.device_name,
        token_preview: d.fcm_token?.substring(0, 20) + '...',
        last_used: d.last_used_at
      });
    });

    // Get OAuth2 access token
    console.log('[send-push-notification] 🔑 Getting OAuth2 access token...');
    const accessToken = await getAccessToken();

    // Get project ID from service account
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    const serviceAccount = JSON.parse(serviceAccountJson!);
    const projectId = serviceAccount.project_id;
    console.log('[send-push-notification] 🔥 Firebase project:', projectId);

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ deviceId: string; error: string }> = [];

    // Send notification to all unique devices
    console.log('[send-push-notification] 📨 Sending notifications...');
    
    for (const device of uniqueDevices) {
      try {
        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
        
        console.log(`[send-push-notification] 📤 Sending to device ${device.id} (${device.platform})...`);
        
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
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
              },
              android: {
                priority: 'high',
                notification: {
                  channelId: 'default',
                  sound: 'default',
                },
              },
              apns: {
                headers: {
                  'apns-priority': '10',
                  'apns-push-type': 'alert',
                },
                payload: {
                  aps: {
                    alert: {
                      title,
                      body,
                    },
                    sound: 'default',
                    badge: 1,
                    'content-available': 1,
                    'mutable-content': 1,
                  },
                },
              },
            },
          }),
        });

        const fcmResult = await fcmResponse.json();

        if (!fcmResponse.ok) {
          console.error(`[send-push-notification] ❌ FCM error for device ${device.id}:`, JSON.stringify(fcmResult));
          
          // Check for invalid/expired token errors
          const errorCode = fcmResult.error?.code;
          const errorStatus = fcmResult.error?.status;
          const errorMessage = fcmResult.error?.message || 'Unknown FCM error';
          const isUnregistered = fcmResult.error?.details?.some(
            (d: any) => d.errorCode === 'UNREGISTERED'
          );

          errors.push({ deviceId: device.id, error: errorMessage });

          if (errorCode === 404 || 
              errorCode === 400 ||
              errorStatus === 'NOT_FOUND' || 
              errorStatus === 'INVALID_ARGUMENT' ||
              isUnregistered ||
              errorMessage.includes('not a valid FCM registration token') ||
              errorMessage.includes('Requested entity was not found')) {
            console.log(`[send-push-notification] 🗑️ Invalid/expired FCM token, removing device ${device.id}`);
            const { error: deleteError } = await supabaseAdmin
              .from('user_devices')
              .delete()
              .eq('id', device.id);
            
            if (deleteError) {
              console.error(`[send-push-notification] ❌ Failed to delete device ${device.id}:`, deleteError);
            } else {
              console.log(`[send-push-notification] ✅ Device ${device.id} removed from database`);
            }
          }
          
          errorCount++;
        } else {
          console.log(`[send-push-notification] ✅ Push sent successfully to device ${device.id} (${device.platform})`);
          console.log(`[send-push-notification]    FCM message ID:`, fcmResult.name);
          
          // Update last_used_at
          await supabaseAdmin
            .from('user_devices')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', device.id);
          
          successCount++;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[send-push-notification] ❌ Exception sending to device ${device.id}:`, errorMsg);
        errors.push({ deviceId: device.id, error: errorMsg });
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    console.log('[send-push-notification] ========================================');
    console.log('[send-push-notification] 📊 SUMMARY:');
    console.log('[send-push-notification]   - Total devices:', uniqueDevices.length);
    console.log('[send-push-notification]   - Successful:', successCount);
    console.log('[send-push-notification]   - Failed:', errorCount);
    console.log('[send-push-notification]   - Duration:', duration, 'ms');
    if (errors.length > 0) {
      console.log('[send-push-notification]   - Errors:', JSON.stringify(errors));
    }
    console.log('[send-push-notification] ========================================');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Push notifications sent: ${successCount} successful, ${errorCount} failed`,
        sent: successCount,
        failed: errorCount,
        totalDevices: uniqueDevices.length,
        duration: duration,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[send-push-notification] ❌ FATAL ERROR:', error);
    console.error('[send-push-notification] Duration:', duration, 'ms');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, duration }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
