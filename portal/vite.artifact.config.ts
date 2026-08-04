import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Демо-сборка одним файлом для публикации как артефакт (HashRouter).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  define: { __ARTIFACT_BUILD__: 'true' },
  build: { outDir: 'dist-artifact', assetsInlineLimit: 100_000_000 },
});
