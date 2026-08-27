import { defineConfig } from 'vitest/config';

// Свой конфиг обязателен: без него vitest поднимается вверх до корня монорепо
// и подхватывает чужой набор тестов.
export default defineConfig({
  test: {
    root: __dirname,
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});
