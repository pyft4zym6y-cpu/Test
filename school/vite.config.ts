import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // вендорні чанки окремо: код сторінок оновлюється частіше, ніж react —
      // кеш браузера переживає деплої контенту. Для SSR-збірки вимкнено
      // (конфліктує з inlineDynamicImports).
      output: isSsrBuild
        ? {}
        : {
            manualChunks: {
              react: ['react', 'react-dom', 'react-router-dom'],
              motion: ['motion/react'],
            },
          },
    },
  },
}));
