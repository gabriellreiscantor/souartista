import type { CapacitorConfig } from '@capacitor/cli';

const isIOS = process.env.PLATFORM === 'ios';
const isDev = process.env.NODE_ENV === 'development';

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
  },
  // Hot reload only for local development - NOT for production builds
  ...(isDev && {
    server: {
      url: 'https://eeefb965-be39-4b04-94b6-0ec88e4c5a55.lovableproject.com?forceHideBadge=true',
      cleartext: true
    }
  })
};

export default config;
