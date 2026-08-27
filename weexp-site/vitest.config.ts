import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Окремий конфіг для тестів. У vite.config.ts його немає свідомо: там живе
 * збірка з manualChunks і `define`, і домішувати туди тестове оточення означає
 * тягнути jsdom у продакшн-конфіг.
 *
 * `environment: jsdom` увімкнено глобально, а не по файлах: логічні тести
 * (SLA, записи, розбір GSC) від наявності DOM не залежать, а компонентні без
 * нього не піднімуться взагалі.
 */
export default defineConfig({
  plugins: [react()],
  define: { __BUILD_TIME__: JSON.stringify('test') },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    restoreMocks: true,
  },
});
