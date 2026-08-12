import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
