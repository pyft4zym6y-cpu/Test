/**
 * Что из src/ вообще попадает в приложение.
 *
 * Легаси тёмного сайта выведен из употребления (все старые маршруты
 * 301-редиректятся, см. комментарий в App.tsx), но файлы остались: 126 модулей,
 * до которых от точки входа не дойти. Это не безобидно — их правят по ошибке.
 * Я сам в этом сеансе отредактировал Hero.tsx и HomeJourney.tsx, считая их
 * живыми: они выглядят как обычные компоненты главной, и ничто на них не
 * указывает, что главная — это SystemInMotion.
 *
 * Тест не требует удалить легаси (это отдельное решение). Он требует, чтобы
 * недостижимое НЕ РОСЛО: новый мёртвый файл — это либо забытая ветка работы,
 * либо компонент, который забыли подключить к маршруту.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';

const ROOT = join(__dirname, '..');

/**
 * Сколько модулей сейчас недостижимо. Число можно только УМЕНЬШАТЬ — оно и есть
 * мера того, сколько легаси осталось разобрать.
 */
const LEGACY_BUDGET = 126;

/** Не участвуют в графе по своей природе: их подключает сборщик, а не импорт. */
const INFRA = new Set(['vite-env.d.ts', 'test/setup.ts']);

function allSources(): string[] {
  const out: string[] = [];
  (function walk(d: string) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) { if (e !== '__tests__') walk(p); }
      else if (/\.(tsx?|css)$/.test(e)) out.push(p);
    }
  })(ROOT);
  return out;
}

function resolveSpec(spec: string, from: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(from), spec);
  else return null;                                  // пакет из node_modules
  const cands = extname(base) ? [base]
    : ['.ts', '.tsx', '.css', '/index.ts', '/index.tsx'].map((x) => base + x);
  return cands.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

function reachable(): Set<string> {
  const entries = ['main.tsx', 'App.tsx'].map((f) => join(ROOT, f)).filter(existsSync);
  const seen = new Set(entries);
  const queue = [...entries];
  while (queue.length) {
    const f = queue.pop()!;
    const src = readFileSync(f, 'utf8');
    const specs = [
      ...[...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]),
      ...[...src.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1]),   // lazy()
      ...[...src.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)].map((m) => m[1]),      // css-побочный
    ];
    for (const s of specs) {
      const r = resolveSpec(s, f);
      if (r && !seen.has(r)) { seen.add(r); queue.push(r); }
    }
  }
  return seen;
}

const dead = (() => {
  const seen = reachable();
  return allSources()
    .filter((f) => !seen.has(f))
    .map((f) => f.slice(ROOT.length + 1))
    .filter((f) => !INFRA.has(f))
    .sort();
})();

describe('достижимость модулей от точки входа', () => {
  it('граф вообще строится — иначе тест ничего не значит', () => {
    expect(reachable().size).toBeGreaterThan(50);
  });

  it('недостижимого не становится больше', () => {
    // Упал с числом БОЛЬШЕ бюджета — появился новый мёртвый файл.
    // МЕНЬШЕ — легаси почистили, уменьшите LEGACY_BUDGET до нового числа.
    expect(dead.length, `недостижимо ${dead.length} файлов:\n${dead.join('\n')}`)
      .toBeLessThanOrEqual(LEGACY_BUDGET);
  });

  it('живые точки входа маршрутов достижимы — проверка самого метода', () => {
    const seen = [...reachable()].map((f) => f.slice(ROOT.length + 1));
    for (const f of ['system/SystemInMotion.tsx', 'system/Cabinet.tsx', 'system/AdminPanel.tsx',
                     'system/LossCalculator.tsx', 'lib/liteVisuals.ts']) {
      expect(seen, f).toContain(f);
    }
  });

  it('легаси тёмного сайта в приложение не попадает', () => {
    // Обратная сторона: эти файлы обязаны оставаться недостижимыми, пока их не
    // удалили. Если один из них подключили — это возврат к двум айдентикам.
    for (const f of ['pages/Home.tsx', 'components/Hero.tsx', 'Layout.tsx']) {
      expect(dead, f).toContain(f);
    }
  });
});
