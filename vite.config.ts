import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'AMBER POS',
        short_name: 'AMBER POS',
        description: 'Sistema de punto de venta para restaurantes',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#f59e0b',
        icons: [
          { src: '/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Nunca servir el `index.html` precacheado para las navegaciones: si el
        // service worker conserva un shell viejo, su entry apunta a chunks que
        // el deploy nuevo ya borró y el navegador falla con «Failed to fetch
        // dynamically imported module» (el fallback SPA de Cloudflare devuelve
        // HTML a la ruta del .js). Sin `NavigationRoute` el shell siempre sale
        // de la red; los assets con hash siguen precacheados/cache-first.
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
