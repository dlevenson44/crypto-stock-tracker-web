import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // TWELVE_DATA_API_KEY has no VITE_ prefix on purpose: it is injected into
  // proxied requests here and never shipped to the browser.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    server: {
      port: 3000,
      proxy: {
        '/td': {
          target: 'https://api.twelvedata.com',
          changeOrigin: true,
          headers: {
            Authorization: `apikey ${env.TWELVE_DATA_API_KEY ?? ''}`,
          },
          rewrite: (path) => path.replace(/^\/td/, ''),
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
