import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Мітка збірки — щоб на живому сайті було видно, що деплой застосувався
// (у мікропідвалі). Формується на кожній збірці Vercel.
const BUILD_TIME = new Date().toISOString().slice(0, 16).replace('T', ' ');

export default defineConfig({
  plugins: [react()],
  define: { __BUILD_TIME__: JSON.stringify(BUILD_TIME) },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],           // тяжёлый WebGL — отдельный кешируемый чанк
          motion: ['framer-motion'],  // анимации — свой чанк
        },
      },
    },
  },
});
