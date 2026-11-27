import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'black-scale',
  brand: { displayName: '검은 저울', primaryColor: '#C59B43', icon: '' },
  web: {
    host: 'localhost',
    port: 5173,
    commands: { dev: 'vite', build: 'tsc -b && vite build' },
  },
  permissions: [],
  outdir: 'dist',
})
