import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'toilet-pin-icon-thick.svg'],
    manifest: {
      name: 'NYC Public Restrooms',
      short_name: 'NYC Restrooms',
      description: 'Real-time location and status of NYC comfort stations',
      theme_color: '#121212',
      background_color: '#121212',
      icons: [
        {
          src: 'toilet-pin-icon-thick.svg',
          sizes: '192x192 512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      runtimeCaching: [
        {
          urlPattern: /^\/api\/restrooms.*/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'socrata-api-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 7 // Keep for 1 week
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/[abc]\.basemaps\.cartocdn\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'carto-tiles-cache',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
            }
          }
        }
      ]
    }
  }), cloudflare()]
})