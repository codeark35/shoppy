import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webp}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/v1\/catalog/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'catalog-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /\/api\/v1\/cart/,
            handler: 'NetworkFirst',
            options: { cacheName: 'cart-cache' },
          },
        ],
      },
      manifest: {
        name: 'Mi Tienda',
        short_name: 'Tienda',
        description: 'Tu tienda online favorita',
        theme_color: '#1A56DB',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5 usa la API antigua de Sass; silenciar hasta Bootstrap 6
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3070',
        changeOrigin: true,
      },
    },
  },
})

