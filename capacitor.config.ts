import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.labtech.geolab',
  appName: 'LabTech GeoLab',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    App: {
      launchAutoHide: false
    },
    StatusBar: {
      backgroundColor: '#3880ff',
      style: 'light'
    }
  }
};

export default config;
