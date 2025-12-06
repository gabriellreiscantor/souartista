import { Capacitor } from '@capacitor/core';

export const useNativePlatform = () => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform(); // 'ios', 'android', 'web'
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  const isWeb = platform === 'web';
  
  // Debug logging for native platform detection
  console.log('[useNativePlatform] ========== PLATFORM INFO ==========');
  console.log('[useNativePlatform] isNative:', isNative);
  console.log('[useNativePlatform] platform:', platform);
  console.log('[useNativePlatform] isIOS:', isIOS);
  console.log('[useNativePlatform] isAndroid:', isAndroid);
  console.log('[useNativePlatform] isWeb:', isWeb);
  console.log('[useNativePlatform] User Agent:', navigator.userAgent);
  console.log('[useNativePlatform] Capacitor:', typeof Capacitor);
  console.log('[useNativePlatform] Capacitor.isNativePlatform():', Capacitor.isNativePlatform());
  
  return { isNative, platform, isIOS, isAndroid, isWeb };
};
