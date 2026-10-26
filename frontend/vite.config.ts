import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': o usuário decide quando atualizar (evita ficar preso numa versão antiga sem aviso)
      registerType: 'prompt',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'RodaTrack',
        short_name: 'RodaTrack',
        description: 'Rastreio de usinagem de rodas e perfil recomendado, com funcionamento offline.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#26394A',
        theme_color: '#26394A',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Só o "app shell" fica em cache. Os dados vivem no IndexedDB (Dexie), não no cache do SW.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest,woff2}'],
        globIgnores: ['**/*.woff'], // só woff2: todos os navegadores-alvo suportam
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    proxy: { '/api': 'http://localhost:8080' },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
