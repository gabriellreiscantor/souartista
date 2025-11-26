import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.eeefb965be394b0494b60ec88e4c5a55',
  appName: 'SouArtista',
  webDir: 'dist',
  server: {
    url: 'https://eeefb965-be39-4b04-94b6-0ec88e4c5a55.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
