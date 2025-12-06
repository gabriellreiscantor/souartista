import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { useNativePlatform } from './useNativePlatform';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const { isNative, platform } = useNativePlatform();
  const { user } = useAuth();

  useEffect(() => {
    if (!isNative || !user) return;

    const initPushNotifications = async () => {
      try {
        console.log('[PushNotifications] ========== INITIALIZING PUSH NOTIFICATIONS ==========');
        console.log('[PushNotifications] Platform:', platform);
        console.log('[PushNotifications] isNative:', isNative);
        console.log('[PushNotifications] User ID:', user.id);
        console.log('[PushNotifications] User Email:', user.email);
        console.log('[PushNotifications] User Agent:', navigator.userAgent);
        
        // Check if plugin is available
        console.log('[PushNotifications] PushNotifications plugin:', typeof PushNotifications);
        console.log('[PushNotifications] Available methods:', Object.keys(PushNotifications));
        
        // Request permission
        console.log('[PushNotifications] Checking permissions...');
        let permStatus = await PushNotifications.checkPermissions();
        console.log('[PushNotifications] Current permission status:', JSON.stringify(permStatus));

        if (permStatus.receive === 'prompt') {
          console.log('[PushNotifications] Permission is prompt, requesting...');
          permStatus = await PushNotifications.requestPermissions();
          console.log('[PushNotifications] Permission after request:', JSON.stringify(permStatus));
        }

        if (permStatus.receive !== 'granted') {
          console.log('[PushNotifications] ❌ Permission DENIED or not granted');
          console.log('[PushNotifications] Final status:', permStatus.receive);
          return;
        }

        console.log('[PushNotifications] ✅ Permission GRANTED');
        
        // Register with APNs/FCM
        console.log('[PushNotifications] Calling PushNotifications.register()...');
        await PushNotifications.register();
        console.log('[PushNotifications] register() called, waiting for registration event...');

        // Listen for registration
        await PushNotifications.addListener('registration', async (token) => {
          console.log('[PushNotifications] ========== REGISTRATION SUCCESS ==========');
          console.log('[PushNotifications] Token received!');
          console.log('[PushNotifications] Token length:', token.value?.length);
          console.log('[PushNotifications] Token preview:', token.value ? token.value.substring(0, 80) + '...' : 'NO TOKEN');
          console.log('[PushNotifications] Full token:', token.value);
          
          // Get device information
          console.log('[PushNotifications] Getting device info...');
          const deviceInfo = await Device.getId();
          const deviceName = await Device.getInfo();
          
          console.log('[PushNotifications] Device ID:', deviceInfo.identifier);
          console.log('[PushNotifications] Device platform:', deviceName.platform);
          console.log('[PushNotifications] Device model:', deviceName.model);
          console.log('[PushNotifications] Device manufacturer:', deviceName.manufacturer);
          console.log('[PushNotifications] Device OS:', deviceName.operatingSystem, deviceName.osVersion);
          
          const deviceNameStr = `${deviceName.manufacturer || 'Unknown'} ${deviceName.model || 'Device'}`;
          console.log('[PushNotifications] Device name string:', deviceNameStr);
          
          // Save token to user_devices table
          console.log('[PushNotifications] Saving token to database...');
          console.log('[PushNotifications] Payload:', {
            user_id: user.id,
            device_id: deviceInfo.identifier,
            platform: platform,
            fcm_token: token.value ? 'TOKEN_PRESENT' : 'NO_TOKEN',
            device_name: deviceNameStr
          });
          
          const { data, error } = await supabase
            .from('user_devices')
            .upsert({ 
              user_id: user.id,
              device_id: deviceInfo.identifier,
              platform: platform,
              fcm_token: token.value,
              device_name: deviceNameStr,
              last_used_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,device_id'
            })
            .select();

          if (error) {
            console.error('[PushNotifications] ❌ Error saving token to DB:', error);
            console.error('[PushNotifications] Error code:', error.code);
            console.error('[PushNotifications] Error message:', error.message);
            console.error('[PushNotifications] Error details:', error.details);
          } else {
            console.log('[PushNotifications] ✅ Token saved to database successfully!');
            console.log('[PushNotifications] Saved data:', JSON.stringify(data));
          }
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('[PushNotifications] ========== REGISTRATION ERROR ==========');
          console.error('[PushNotifications] Error object:', JSON.stringify(error));
          console.error('[PushNotifications] Error message:', error?.error);
        });

        // Listen for incoming notifications
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[PushNotifications] 📬 Notification received:', notification);
          
          // Show toast for foreground notification
          toast({
            title: notification.title || 'Nova notificação',
            description: notification.body,
          });
        });

        // Listen for notification actions
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('[PushNotifications] 👆 Notification tapped:', notification);
          
          // Handle navigation if there's a link in the data
          if (notification.notification.data?.link) {
            console.log('[PushNotifications] Navigating to:', notification.notification.data.link);
            window.location.href = notification.notification.data.link;
          }
        });

        console.log('[PushNotifications] ✅ Push notifications initialized successfully');
        
      } catch (error) {
        console.error('[PushNotifications] ❌ Error initializing push notifications:', error);
      }
    };

    initPushNotifications();

    // Cleanup
    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [isNative, user]);
};
