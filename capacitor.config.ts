import type { CapacitorConfig } from '@capacitor/cli';

const isIOS = process.env.PLATFORM === 'ios';

const config: CapacitorConfig = {
  appId: isIOS ? 'aplicativo.souartista' : 'app.souartista',
  appName: 'SouArtista',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#17061f',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
