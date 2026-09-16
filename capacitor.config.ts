import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aurarealms.game',
  appName: 'Aura Realms',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#07111f'
  }
};

export default config;
