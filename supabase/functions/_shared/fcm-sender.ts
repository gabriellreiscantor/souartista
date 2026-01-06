// Shared FCM (Firebase Cloud Messaging) sender for edge functions
// This avoids the issue of edge functions calling other edge functions via functions.invoke()

interface SendPushParams {
  supabaseAdmin: any;
  userId: string;
  title: string;
  body: string;
  link?: string;
  data?: Record<string, string>;
}

interface DeviceInfo {
  id: string;
  fcm_token: string;
  platform: string;
}

// Get Firebase OAuth2 access token
export async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  // Create JWT header
  const header = { alg: 'RS256', typ: 'JWT' };

  // Create JWT payload
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  // Base64url encode
  const base64UrlEncode = (obj: object): string => {
    const str = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(str);
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);
  const unsignedToken = `${headerEncoded}.${payloadEncoded}`;

  // Convert PEM to CryptoKey
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${unsignedToken}.${signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Send push notification directly via FCM API
export async function sendPushToUser(params: SendPushParams): Promise<{ success: boolean; sent: number; failed: number }> {
  const { supabaseAdmin, userId, title, body, link, data } = params;
  
  let sent = 0;
  let failed = 0;

  try {
    // Fetch user devices
    const { data: devices, error: devicesError } = await supabaseAdmin
      .from('user_devices')
      .select('id, fcm_token, platform')
      .eq('user_id', userId)
      .not('fcm_token', 'is', null);

    if (devicesError) {
      console.error(`[fcm-sender] Error fetching devices for ${userId}:`, devicesError);
      return { success: false, sent: 0, failed: 1 };
    }

    if (!devices || devices.length === 0) {
      console.log(`[fcm-sender] No devices found for user ${userId}`);
      return { success: true, sent: 0, failed: 0 };
    }

    // Get access token
    const accessToken = await getAccessToken();
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!);
    const projectId = serviceAccount.project_id;

    // Deduplicate tokens
    const uniqueDevices = devices.reduce((acc: DeviceInfo[], device: DeviceInfo) => {
      if (!acc.find(d => d.fcm_token === device.fcm_token)) {
        acc.push(device);
      }
      return acc;
    }, []);

    console.log(`[fcm-sender] Sending to ${uniqueDevices.length} devices for user ${userId}`);

    for (const device of uniqueDevices) {
      try {
        const fcmMessage: any = {
          message: {
            token: device.fcm_token,
            notification: {
              title,
              body,
            },
            data: {
              ...(data || {}),
              ...(link ? { link } : {}),
            },
            // iOS APNS configuration - CRITICAL for background notifications
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
            // Android configuration
            android: {
              priority: 'high',
              notification: {
                title,
                body,
                sound: 'default',
                channelId: 'default',
              },
            },
          },
        };

        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fcmMessage),
          }
        );

        if (response.ok) {
          sent++;
          console.log(`[fcm-sender] ✅ Sent to device ${device.id} (${device.platform})`);
        } else {
          const errorData = await response.json();
          console.error(`[fcm-sender] ❌ FCM error for device ${device.id}:`, errorData);
          
          // Remove invalid tokens
          if (errorData.error?.details?.some((d: any) => 
            d.errorCode === 'UNREGISTERED' || d.errorCode === 'INVALID_ARGUMENT'
          )) {
            console.log(`[fcm-sender] Removing invalid token for device ${device.id}`);
            await supabaseAdmin
              .from('user_devices')
              .update({ fcm_token: null })
              .eq('id', device.id);
          }
          
          failed++;
        }
      } catch (deviceError) {
        console.error(`[fcm-sender] Error sending to device ${device.id}:`, deviceError);
        failed++;
      }
    }

    return { success: sent > 0 || failed === 0, sent, failed };
  } catch (error) {
    console.error(`[fcm-sender] Error sending push to user ${userId}:`, error);
    return { success: false, sent: 0, failed: 1 };
  }
}
