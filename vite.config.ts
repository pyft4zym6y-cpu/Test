import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // shadcn-convention alias: "@/..." → src/... (used by @/components/ui/*)
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __ARTIFACT_BUILD__: 'false',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
