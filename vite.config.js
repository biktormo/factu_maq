import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // <-- 1. IMPORTAR

export default defineConfig({
  plugins: [
    react(),
    // --- 2. AÑADIR LA CONFIGURACIÓN DEL PLUGIN PWA ---
    VitePWA({
      registerType: 'autoUpdate', // Actualiza la PWA automáticamente
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'], // Archivos para cachear
      manifest: {
        name: 'SARTOR - Facturación Maquinaria',
        short_name: 'Facturación Maquinaria',
        description: 'Dashboard de análisis de facturación para maquinaria John Deere.',
        theme_color: '#367C2B', // Verde John Deere
        background_color: '#ffffff', // Fondo para la pantalla de carga
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Icono adaptable
          }
        ]
      }
    })
  ],
  // (La sección 'css' con la configuración de PostCSS no cambia, si la tienes aquí)
});