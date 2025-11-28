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
        // Request permission
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('Push notification permission denied');
          return;
        }

        // Register with FCM
        await PushNotifications.register();

        // Listen for registration
        await PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token: ' + token.value);
          
          // Get device information
          const deviceInfo = await Device.getId();
          const deviceName = await Device.getInfo();
          
          // Save token to user_devices table
          const { error } = await supabase
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
            });

          if (error) {
            console.error('Error saving FCM token:', error);
          }
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });

        // Listen for incoming notifications
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received:', notification);
          
          // Show toast for foreground notification
          toast({
            title: notification.title || 'Nova notificação',
            description: notification.body,
          });
        });

        // Listen for notification actions
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed:', notification);
          
          // Handle navigation if there's a link in the data
          if (notification.notification.data?.link) {
            window.location.href = notification.notification.data.link;
          }
        });

      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    initPushNotifications();

    // Cleanup
    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [isNative, user]);
};
