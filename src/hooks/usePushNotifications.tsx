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
        console.log('[PushNotifications] Initializing push notifications...');
        console.log('[PushNotifications] Platform:', platform);
        console.log('[PushNotifications] User ID:', user.id);
        
        // Request permission
        let permStatus = await PushNotifications.checkPermissions();
        console.log('[PushNotifications] Permission status:', permStatus.receive);

        if (permStatus.receive === 'prompt') {
          console.log('[PushNotifications] Requesting permissions...');
          permStatus = await PushNotifications.requestPermissions();
          console.log('[PushNotifications] Permission after request:', permStatus.receive);
        }

        if (permStatus.receive !== 'granted') {
          console.log('[PushNotifications] Permission denied');
          return;
        }

        // Register with FCM
        console.log('[PushNotifications] Registering with FCM...');
        await PushNotifications.register();

        // Listen for registration
        await PushNotifications.addListener('registration', async (token) => {
          console.log('[PushNotifications] ✅ Registration success!');
          console.log('[PushNotifications] FCM Token:', token.value.substring(0, 50) + '...');
          
          // Get device information
          const deviceInfo = await Device.getId();
          const deviceName = await Device.getInfo();
          
          console.log('[PushNotifications] Device ID:', deviceInfo.identifier);
          console.log('[PushNotifications] Device Name:', `${deviceName.manufacturer} ${deviceName.model}`);
          
          // Save token to user_devices table
          const { data, error } = await supabase
            .from('user_devices')
            .upsert({ 
              user_id: user.id,
              device_id: deviceInfo.identifier,
              platform: platform,
              fcm_token: token.value,
              device_name: `${deviceName.manufacturer} ${deviceName.model}`,
              last_used_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,device_id'
            })
            .select();

          if (error) {
            console.error('[PushNotifications] ❌ Error saving FCM token:', error);
          } else {
            console.log('[PushNotifications] ✅ FCM token saved to database:', data);
          }
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('[PushNotifications] ❌ Registration error:', error);
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
