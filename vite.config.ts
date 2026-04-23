import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Actualiza la app automáticamente en el celular cuando subes cambios a Netlify
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'], // Archivos estáticos extra (opcional)
      manifest: {
        name: 'LNKD Games',
        short_name: 'LNKD Games',
        description: 'Dashboard para los resultados diarios de juegos en LinkedIn',
        theme_color: '#ffffff', // El color de la barra superior del celular
        background_color: '#ffffff',
        display: 'standalone', // Esto oculta la barra del navegador (¡la magia de la PWA!)
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
});