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
          // Здесь стоял чанк `stages` для stage2/3/4Model. Эти модели —
          // легаси тёмного сайта: цепочку Stage2 → Stage3 → Stage4 не звал
          // никто, но manualChunks перечисляет модули по имени и делает их
          // корнями чанка независимо от графа. Так недостижимый код не просто
          // попадал в сборку — index-чанк начинал импортировать ИЗ него
          // общие зависимости, поднятые Rollup-ом в этот чанк. То есть его
          // скачивал каждый посетитель. Модели удалены вместе с легаси.
        },
      },
    },
  },
});
