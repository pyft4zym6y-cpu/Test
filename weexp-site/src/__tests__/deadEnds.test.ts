/**
 * ЖОДНОЇ ПУБЛІЧНОЇ СТОРІНКИ БЕЗ НАСТУПНОГО КРОКУ.
 *
 * Глухий кут виглядає безневинно: сторінка зроблена добре, текст дочитано — і
 * далі нічого. Людина закриває вкладку саме в той момент, коли вона найближче
 * до звернення. Найдорожчий випадок на цьому сайті був /blog: сорок чотири
 * статті, головний вхід із пошуку — і в кінці хаба порожнеча, бо фінальний
 * заклик лежав у чанку головної й на інших сторінках не рендерився взагалі.
 *
 * Сторож читає маршрути з App.tsx, знаходить компонент кожного публічного
 * маршруту й вимагає, щоб у ньому був шлях далі: посилання на дію (/diagnose,
 * /contact) — або хоча б на розділ, з якого така дія доступна.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '..');
const app = readFileSync(join(SRC, 'App.tsx'), 'utf8');

/** Дії, якими закінчується шлях клієнта. */
const ACTIONS = ['/diagnose', '/contact'];

/** Закриті поверхні: кабінет і адмінка — там інші правила й інші цілі. */
const CLOSED = /Cabinet|AdminPanel|ProjectView|Login|Auth|NotFound|Legal/i;

/** Компонент → його файл (зокрема ре-експорти з модулів-збірок). */
const componentFile = (name: string): string | null => {
  const direct = join(SRC, 'system', name + '.tsx');
  if (existsSync(direct)) return direct;
  for (const f of readdirSync(join(SRC, 'system')).filter((x) => x.endsWith('.tsx'))) {
    const p = join(SRC, 'system', f);
    if (new RegExp(`export function ${name}\\b`).test(readFileSync(p, 'utf8'))) return p;
  }
  return null;
};

/**
 * Усі адреси, на які веде компонент — прямо або через свої під-компоненти.
 * Один рівень углиб: фінальний заклик лежить в окремому модулі, і сторінка,
 * яка його рендерить, веде далі не гірше за ту, що пише посилання сама.
 */
const exits = (file: string, depth = 1): string[] => {
  const code = readFileSync(file, 'utf8');
  const own = [...code.matchAll(/lp\('([^']+)'\)/g)].map((m) => m[1]);
  if (depth <= 0) return own;
  const nested: string[] = [];
  for (const m of code.matchAll(/<([A-Z][A-Za-z0-9]*)[\s/>]/g)) {
    const f = componentFile(m[1]);
    if (f && f !== file) nested.push(...exits(f, depth - 1));
  }
  return [...own, ...nested];
};

/**
 * Публічні маршрути з App.tsx: шлях → ім'я компонента.
 *
 * Читаємо масив PAGES (`{ path: '/blog', el: <BlogHub /> }`), а не теги
 * <Route>. Перша версія шукала саме <Route path= element=< — і знаходила лише
 * адмінку та редиректи, тобто рівно ті рядки, які сама ж і відкидала. Сторож
 * проходив на порожньому списку: перевірка, яка структурно не може впасти.
 */
const routes = (() => {
  const out: { path: string; comp: string }[] = [];
  for (const m of app.matchAll(/\{\s*path:\s*'([^']+)',\s*el:\s*<([A-Z][A-Za-z0-9]*)/g))
    out.push({ path: m[1], comp: m[2] });
  return out.filter((r) => !CLOSED.test(r.comp));
})();

describe('жодного тупика в шляху клієнта', () => {
  it('маршрути взагалі знайшлись', () => {
    // Сторож, який нічого не знайшов, не може впасти — і тому нічого не стереже.
    expect(routes.map((r) => r.path), 'у App.tsx не розібрано публічних маршрутів')
      .toContain('/blog');
    expect(routes.length).toBeGreaterThan(8);
  });

  it('кожна публічна сторінка веде далі', () => {
    const stuck: string[] = [];
    for (const r of routes) {
      const f = componentFile(r.comp);
      if (!f) continue;                       // компонент за межами src/system — не наша зона
      const out = exits(f);
      if (!out.some((u) => ACTIONS.includes(u) || u.startsWith('/services') || u.startsWith('/expansion')))
        stuck.push(`${r.path} (${r.comp})`);
    }
    expect(stuck, `сторінки без наступного кроку: ${stuck.join(', ')}`).toEqual([]);
  });

  it('фінальний заклик доступний не лише головній', () => {
    /*
     * Він жив усередині HomeBlocks — модуля блоків головної. Технічно
     * експортований, фактично недосяжний: імпортувати чанк головної заради
     * одного блока ніхто б не став, і /blog закінчувався нічим.
     */
    const f = componentFile('ClosingCta');
    expect(f, 'ClosingCta не знайдено').toBeTruthy();
    expect(f!.endsWith('ClosingCta.tsx'), 'фінальний заклик знову лежить усередині блоків головної').toBe(true);
  });
});
