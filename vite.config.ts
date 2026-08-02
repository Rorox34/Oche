import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // host: true expose le serveur de dev sur le réseau local et en cloud
  // (Codespaces, accès iPhone via Wi-Fi ou port forwardé).
  server: { host: true },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Oche — Compteur de fléchettes',
        short_name: 'Oche',
        description: 'Compteur de fléchettes 301 / 501, hors-ligne et mobile-first.',
        lang: 'fr',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0c110f',
        theme_color: '#0c110f',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
