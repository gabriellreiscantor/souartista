import { useEffect } from 'react';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Device } from '@capacitor/device';
import { useNativePlatform } from './useNativePlatform';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const { isNative, platform } = useNativePlatform();
  const { user } = useAuth();

  useEffect(() => {
    console.log('[PushNotifications] ========== HOOK MOUNTED ==========');
    console.log('[PushNotifications] isNative:', isNative);
    console.log('[PushNotifications] platform:', platform);
    console.log('[PushNotifications] user:', user?.id || 'NO USER');
    
    if (!isNative) {
      console.log('[PushNotifications] ❌ Skipping - NOT native platform');
      return;
    }
    
    if (!user) {
      console.log('[PushNotifications] ❌ Skipping - NO user logged in');
      return;
    }

    console.log('[PushNotifications] ✅ Conditions met, initializing...');

    const initPushNotifications = async () => {
      try {
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
          return;
        }

        console.log('[PushNotifications] ✅ Permission GRANTED');
        
        // Get FCM token directly (this is the key difference!)
        console.log('[PushNotifications] Getting FCM token...');
        const tokenResult = await FirebaseMessaging.getToken();
        const fcmToken = tokenResult.token;
        
        console.log('[PushNotifications] ========== FCM TOKEN RECEIVED ==========');
        console.log('[PushNotifications] Token length:', fcmToken?.length);
        console.log('[PushNotifications] Token preview:', fcmToken ? fcmToken.substring(0, 80) + '...' : 'NO TOKEN');
        
        if (!fcmToken) {
          console.error('[PushNotifications] ❌ No FCM token received');
          return;
        }
        
        // Get device information
        console.log('[PushNotifications] Getting device info...');
        const deviceInfo = await Device.getId();
        const deviceName = await Device.getInfo();
        
        console.log('[PushNotifications] Device ID:', deviceInfo.identifier);
        console.log('[PushNotifications] Device platform:', deviceName.platform);
        console.log('[PushNotifications] Device model:', deviceName.model);
        
        const deviceNameStr = `${deviceName.manufacturer || 'Unknown'} ${deviceName.model || 'Device'}`;
        console.log('[PushNotifications] Device name string:', deviceNameStr);
        
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
          
          // Update token in database
          if (event.token) {
            await supabase
              .from('user_devices')
              .upsert({ 
                user_id: user.id,
                device_id: deviceInfo.identifier,
                platform: platform,
                fcm_token: event.token,
                device_name: deviceNameStr,
                last_used_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,device_id'
              });
          }
        });

        console.log('[PushNotifications] ✅ Firebase Messaging initialized successfully');
        
      } catch (error) {
        console.error('[PushNotifications] ❌ Error initializing Firebase Messaging:', error);
      }
    };

    initPushNotifications();

    // Cleanup
    return () => {
      FirebaseMessaging.removeAllListeners();
    };
  }, [isNative, user, platform]);
};
