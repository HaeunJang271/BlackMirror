import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.blackscale.game',
  appName: '검은 저울',
  webDir: 'dist',
  server: { androidScheme: 'https' },
}

export default config
