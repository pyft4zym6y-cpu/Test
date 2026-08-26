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
          // Подписи систем и eur() нужны и калькулятору, и админке. Без явного
          // чанка Rollup склеивал их с чужими модулями, и по имени чанка нельзя
          // было понять, что на самом деле приезжает на экран.
          systems: ['./src/system/systems.ts'],
          // Модели этапов кабинета (stage2/3/4) — только для клиентского
          // кабинета и калькулятора. Отдельным чанком, чтобы не приезжали
          // вместе с SDK Supabase на каждый экран, который его импортирует.
          stages: ['./src/system/stage2Model.ts', './src/system/stage3Model.ts', './src/system/stage4Model.ts'],
        },
      },
    },
  },
});
