import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const placeholderIcon = (size: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#090e10"/><path d="M25 30h50v10H25zm0 15h35v10H25zm0 15h50v10H25z" fill="#f5f7f6"/><circle cx="73" cy="50" r="8" fill="#c2f970"/></svg>`,
  )}`;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'WortSchatz Pro',
        short_name: 'WortSchatz',
        description: 'Немецкий словарь для русскоязычных учащихся',
        lang: 'ru',
        start_url: '/',
        display: 'standalone',
        theme_color: '#090e10',
        background_color: '#090e10',
        icons: [
          { src: placeholderIcon(192), sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: placeholderIcon(512), sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
});
