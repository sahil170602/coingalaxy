import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coingalaxy.app', // Changed .web to .app
  appName: 'Coin Galaxy',
  webDir: 'dist', // Correct for Vite
  server: {
    androidScheme: 'https' // Better for Supabase Auth redirects
  }
};

export default config;