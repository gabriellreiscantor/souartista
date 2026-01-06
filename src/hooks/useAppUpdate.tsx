import { useEffect, useState, useCallback } from 'react';
import { useNativePlatform } from './useNativePlatform';

export const useAppUpdate = () => {
  const { isNative, isIOS, isAndroid } = useNativePlatform();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');
  const [availableVersion, setAvailableVersion] = useState('');
  const [loading, setLoading] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (!isNative) {
      console.log('[useAppUpdate] Not native platform, skipping update check');
      return;
    }

    setLoading(true);
    
    try {
      const { AppUpdate, AppUpdateAvailability } = await import('@capawesome/capacitor-app-update');
      
      console.log('[useAppUpdate] Checking for app update...');
      const info = await AppUpdate.getAppUpdateInfo();
      
      console.log('[useAppUpdate] Update info:', info);
      console.log('[useAppUpdate] Current version:', info.currentVersionName);
      console.log('[useAppUpdate] Available version:', info.availableVersionName);
      console.log('[useAppUpdate] Update availability:', info.updateAvailability);
      
      setCurrentVersion(info.currentVersionName || '');
      setAvailableVersion(info.availableVersionName || '');
      
      const isUpdateAvailable = info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE;
      setUpdateAvailable(isUpdateAvailable);
      
      console.log('[useAppUpdate] Update available:', isUpdateAvailable);
    } catch (error) {
      console.error('[useAppUpdate] Error checking for update:', error);
    } finally {
      setLoading(false);
    }
  }, [isNative]);

  const openStore = useCallback(async () => {
    if (!isNative) return;
    
    try {
      const { AppUpdate } = await import('@capawesome/capacitor-app-update');
      console.log('[useAppUpdate] Opening app store...');
      await AppUpdate.openAppStore();
    } catch (error) {
      console.error('[useAppUpdate] Error opening app store:', error);
    }
  }, [isNative]);

  const dismissUpdate = useCallback(() => {
    // Store dismissal time in localStorage to not show again for a while
    const dismissedAt = new Date().toISOString();
    localStorage.setItem('app_update_dismissed', dismissedAt);
    setUpdateAvailable(false);
  }, []);

  const shouldShowBanner = useCallback(() => {
    if (!updateAvailable) return false;
    
    const dismissedAt = localStorage.getItem('app_update_dismissed');
    if (!dismissedAt) return true;
    
    // Show again after 24 hours
    const dismissedDate = new Date(dismissedAt);
    const now = new Date();
    const hoursSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceDismissed >= 24;
  }, [updateAvailable]);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return { 
    updateAvailable: shouldShowBanner(), 
    currentVersion, 
    availableVersion, 
    loading,
    openStore, 
    checkForUpdate,
    dismissUpdate,
    isNative,
    isIOS,
    isAndroid
  };
};
