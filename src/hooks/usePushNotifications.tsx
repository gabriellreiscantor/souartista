import { useEffect, useRef } from 'react';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Device } from '@capacitor/device';
import { useNativePlatform } from './useNativePlatform';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const { isNative, platform } = useNativePlatform();
  const { user } = useAuth();
  const hasInitialized = useRef(false);
  const currentToken = useRef<string | null>(null);

  useEffect(() => {
    console.log('[PushNotifications] ========== HOOK MOUNTED ==========');
    console.log('[PushNotifications] isNative:', isNative);
    console.log('[PushNotifications] platform:', platform);
    console.log('[PushNotifications] user:', user?.id || 'NO USER');
    console.log('[PushNotifications] hasInitialized:', hasInitialized.current);
    
    if (!isNative) {
      console.log('[PushNotifications] ❌ Skipping - NOT native platform');
      return;
    }
    
    if (!user) {
      console.log('[PushNotifications] ❌ Skipping - NO user logged in');
      return;
    }

    // Prevent multiple initializations
    if (hasInitialized.current) {
      console.log('[PushNotifications] ⏭️ Already initialized, skipping...');
      return;
    }

    console.log('[PushNotifications] ✅ Conditions met, initializing...');

    const initPushNotifications = async () => {
      try {
        hasInitialized.current = true;
        console.log('[PushNotifications] ========== INITIALIZING FIREBASE MESSAGING ==========');
        console.log('[PushNotifications] Platform:', platform);
        console.log('[PushNotifications] User ID:', user.id);
        
        // Check if plugin is available
        console.log('[PushNotifications] FirebaseMessaging plugin:', typeof FirebaseMessaging);
        
        // Request permission
        console.log('[PushNotifications] Checking permissions...');
        let permStatus = await FirebaseMessaging.checkPermissions();
        console.log('[PushNotifications] Current permission status:', JSON.stringify(permStatus));

        if (permStatus.receive === 'prompt') {
          console.log('[PushNotifications] Permission is prompt, requesting...');
          permStatus = await FirebaseMessaging.requestPermissions();
          console.log('[PushNotifications] Permission after request:', JSON.stringify(permStatus));
        }

        if (permStatus.receive !== 'granted') {
          console.log('[PushNotifications] ❌ Permission DENIED or not granted');
          hasInitialized.current = false; // Allow retry
          return;
        }

        console.log('[PushNotifications] ✅ Permission GRANTED');
        
        // Get FCM token directly
        console.log('[PushNotifications] Getting FCM token...');
        const tokenResult = await FirebaseMessaging.getToken();
        const fcmToken = tokenResult.token;
        
        console.log('[PushNotifications] ========== FCM TOKEN RECEIVED ==========');
        console.log('[PushNotifications] Token length:', fcmToken?.length);
        console.log('[PushNotifications] Token preview:', fcmToken ? fcmToken.substring(0, 80) + '...' : 'NO TOKEN');
        
        if (!fcmToken) {
          console.error('[PushNotifications] ❌ No FCM token received');
          hasInitialized.current = false; // Allow retry
          return;
        }

        // Store current token for comparison
        currentToken.current = fcmToken;
        
        // Get device information
        console.log('[PushNotifications] Getting device info...');
        const deviceInfo = await Device.getId();
        const deviceName = await Device.getInfo();
        
        console.log('[PushNotifications] Device ID:', deviceInfo.identifier);
        console.log('[PushNotifications] Device platform:', deviceName.platform);
        console.log('[PushNotifications] Device model:', deviceName.model);
        
        const deviceNameStr = `${deviceName.manufacturer || 'Unknown'} ${deviceName.model || 'Device'}`;
        
        // Get device timezone
        const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
        console.log('[PushNotifications] Device timezone:', deviceTimezone);
        console.log('[PushNotifications] Device name string:', deviceNameStr);
        
        // Check if this token already exists for this user
        console.log('[PushNotifications] Checking for existing device token...');
        const { data: existingDevice, error: checkError } = await supabase
          .from('user_devices')
          .select('id, fcm_token')
          .eq('user_id', user.id)
          .eq('device_id', deviceInfo.identifier)
          .maybeSingle();
        
        if (checkError) {
          console.error('[PushNotifications] Error checking existing device:', checkError);
        }

        // Only update if token is different or device doesn't exist
        if (existingDevice) {
          if (existingDevice.fcm_token === fcmToken) {
            console.log('[PushNotifications] ✅ Token unchanged, updating last_used_at only');
            await supabase
              .from('user_devices')
              .update({ last_used_at: new Date().toISOString() })
              .eq('id', existingDevice.id);
            console.log('[PushNotifications] ✅ last_used_at updated');
            return;
          } else {
            console.log('[PushNotifications] 🔄 Token changed, updating...');
          }
        }

        // Remove any other devices with the same token (cleanup duplicates)
        console.log('[PushNotifications] Cleaning up duplicate tokens...');
        const { error: cleanupError } = await supabase
          .from('user_devices')
          .delete()
          .eq('fcm_token', fcmToken)
          .neq('device_id', deviceInfo.identifier);
        
        if (cleanupError) {
          console.error('[PushNotifications] Error cleaning up duplicates:', cleanupError);
        } else {
          console.log('[PushNotifications] ✅ Duplicate tokens cleaned up');
        }
        
        // Save token to user_devices table
        console.log('[PushNotifications] Saving FCM token to database...');
        
        const { data, error } = await supabase
          .from('user_devices')
          .upsert({ 
            user_id: user.id,
            device_id: deviceInfo.identifier,
            platform: platform,
            fcm_token: fcmToken,
            device_name: deviceNameStr,
            timezone: deviceTimezone,
            last_used_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,device_id'
          })
          .select();

        if (error) {
          console.error('[PushNotifications] ❌ Error saving token to DB:', error);
        } else {
          console.log('[PushNotifications] ✅ FCM token saved to database successfully!');
          console.log('[PushNotifications] Saved data:', JSON.stringify(data));
        }
        
        // Also update timezone in profile
        await supabase
          .from('profiles')
          .update({ timezone: deviceTimezone })
          .eq('id', user.id);

        // Listen for incoming notifications (foreground)
        await FirebaseMessaging.addListener('notificationReceived', (notification) => {
          console.log('[PushNotifications] 📬 Notification received:', notification);
          
          toast({
            title: notification.notification?.title || 'Nova notificação',
            description: notification.notification?.body,
          });
        });

        // Listen for notification taps
        await FirebaseMessaging.addListener('notificationActionPerformed', (notification) => {
          console.log('[PushNotifications] 👆 Notification tapped:', notification);
          
          // Handle navigation if there's a link in the data
          const data = notification.notification?.data as Record<string, unknown> | undefined;
          if (data?.link) {
            console.log('[PushNotifications] Navigating to:', data.link);
            window.location.href = data.link as string;
          }
        });

        // Listen for token refresh
        await FirebaseMessaging.addListener('tokenReceived', async (event) => {
          console.log('[PushNotifications] 🔄 Token refreshed:', event.token?.substring(0, 80) + '...');
          
          // Only update if token is different
          if (event.token && event.token !== currentToken.current) {
            currentToken.current = event.token;
            console.log('[PushNotifications] Token is different, updating in database...');
            
            // Clean up old token entries
            await supabase
              .from('user_devices')
              .delete()
              .eq('fcm_token', event.token)
              .neq('device_id', deviceInfo.identifier);
            
            // Update token in database
            await supabase
              .from('user_devices')
              .upsert({ 
                user_id: user.id,
                device_id: deviceInfo.identifier,
                platform: platform,
                fcm_token: event.token,
                device_name: deviceNameStr,
                timezone: deviceTimezone,
                last_used_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,device_id'
              });
            
            console.log('[PushNotifications] ✅ Refreshed token saved to database');
          } else {
            console.log('[PushNotifications] Token unchanged after refresh event');
          }
        });

        console.log('[PushNotifications] ✅ Firebase Messaging initialized successfully');
        
      } catch (error) {
        console.error('[PushNotifications] ❌ Error initializing Firebase Messaging:', error);
        hasInitialized.current = false; // Allow retry on error
      }
    };

    initPushNotifications();

    // Cleanup
    return () => {
      FirebaseMessaging.removeAllListeners();
    };
  }, [isNative, user, platform]);
};
