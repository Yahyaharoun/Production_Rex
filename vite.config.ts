import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.json',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],

      // ── Manifest ──────────────────────────────────────────────────────────────
      manifest: false,

      // ── Workbox (Service Worker) ──────────────────────────────────────────────
      workbox: {
        // Active immédiatement le nouveau SW sans attendre
        skipWaiting: true,
        clientsClaim: true,

        // Précache tous les assets statiques générés par Vite
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,jpg,jpeg,webp,json}'],

        // SPA fallback : toute navigation renvoie index.html (mode offline)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/supabase\//],

        // Stratégies de cache au runtime
        runtimeCaching: [
          // Supabase API → NetworkFirst (30 s timeout, puis cache 24h)
          {
            urlPattern: /^https:\/\/riodeaaqjckfkyvtjyph\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 // 24 heures
              },
              networkTimeoutSeconds: 30,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  base: '/',
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
