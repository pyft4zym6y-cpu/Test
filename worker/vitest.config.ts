import { defineConfig } from 'vitest/config';

/** Свой конфиг, иначе vitest поднимается к корню репозитория и пытается
 *  прочитать vite.config.ts сайта — там vite, которого в воркере нет. */
export default defineConfig({
  test: { include: ['src/**/*.test.ts'], environment: 'node', root: __dirname },
});
