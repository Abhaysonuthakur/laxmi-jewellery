import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,
    host: '127.0.0.1',
    open: false,

    /**
     * Proxy the API in development.
     *
     * This is not a convenience — it is the reason the session cookie works at
     * all. Routing /api through the dev server makes the browser see a
     * same-origin request, so:
     *
     *   - no CORS preflight and no Access-Control-Allow-Credentials dance
     *   - SameSite=Lax actually applies to the cookie
     *   - `Secure` can stay off for http://localhost without the cookie being
     *     rejected as a third-party cookie
     *
     * Pointing the frontend straight at :3001 instead would mean solving all
     * three of those problems at once, and getting the third one wrong in a way
     * that only shows up in Safari.
     */
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: false,
      },
    },
  },

  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        /**
         * Split the heavy WebGL stack away from the shell.
         *
         * Vite 8 runs on Rolldown, which requires the function form — the
         * object form fails with "manualChunks is not a function".
         *
         * Order matters: "@react-three" contains the substring "three", so the
         * r3f test has to come first or the whole 3D stack collapses into one
         * chunk and nothing is deferred.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@react-three')) return 'r3f'
          if (id.includes('three')) return 'three'
          if (
            id.includes('gsap') ||
            id.includes('framer-motion') ||
            id.includes('motion-dom') ||
            id.includes('motion-utils') ||
            id.includes('lenis')
          ) {
            return 'motion'
          }
          if (id.includes('react')) return 'react'
          return 'vendor'
        },
      },
    },
  },
})
