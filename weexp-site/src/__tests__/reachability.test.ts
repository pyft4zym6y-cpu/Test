/**
 * Что из src/ вообще попадает в приложение.
 *
 * Легаси тёмного сайта (126 модулей, до которых от точки входа не дойти)
 * удалено — до этого оно жило в дереве и его правили по ошибке: в одном из
 * сеансов были отредактированы Hero.tsx и HomeJourney.tsx как живые компоненты
 * главной, хотя главная — это SystemInMotion.
 *
 * Теперь бюджет нулевой, и тест держит уже не остаток легаси, а простое
 * правило: недостижимых модулей быть не должно. Новый мёртвый файл — это либо
 * забытая ветка работы, либо компонент, который забыли подключить к маршруту.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';

const ROOT = join(__dirname, '..');

/** Недостижимых быть не должно. Число можно только УМЕНЬШАТЬ, и оно уже ноль. */
const LEGACY_BUDGET = 0;

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

  it('недостижимых модулей нет', () => {
    // Упал — появился файл, до которого от main.tsx/App.tsx не дойти.
    // Либо подключите его к маршруту, либо удалите: третьего состояния,
    // в котором мёртвый код просто лежит рядом с живым, больше нет.
    expect(dead, `недостижимо ${dead.length} файлов`).toEqual([]);
    expect(dead.length).toBeLessThanOrEqual(LEGACY_BUDGET);
  });

  it('живые точки входа маршрутов достижимы — проверка самого метода', () => {
    const seen = [...reachable()].map((f) => f.slice(ROOT.length + 1));
    for (const f of ['system/SystemInMotion.tsx', 'system/Cabinet.tsx', 'system/AdminPanel.tsx',
                     'system/LossCalculator.tsx', 'lib/liteVisuals.ts']) {
      expect(seen, f).toContain(f);
    }
  });

  it('легаси тёмного сайта не вернулось в дерево', () => {
    // Раньше эти файлы обязаны были оставаться недостижимыми; теперь их просто
    // нет. Появление любого из них означает возврат ко второй айдентике —
    // тогда это осознанное решение, а не случайный `git checkout` из истории.
    for (const f of ['pages/Home.tsx', 'components/Hero.tsx', 'Layout.tsx',
                     'system/Stage2.tsx', 'system/stage2Model.ts']) {
      expect(existsSync(join(ROOT, f)), `${f} снова в дереве`).toBe(false);
    }
  });

  it('манифест чанков не называет файлов, которых нет', () => {
    /*
     * manualChunks перечисляет модули по имени и делает их корнями чанка
     * независимо от графа импортов. Чанк `stages` держал в сборке три
     * недостижимые модели этапов, и index-чанк импортировал ИЗ него общие
     * зависимости, поднятые туда Rollup-ом, — то есть мёртвый код скачивал
     * каждый посетитель. Имя в конфиге сборки — такая же ссылка, как import.
     */
    const cfg = readFileSync(join(ROOT, '..', 'vite.config.ts'), 'utf8');
    for (const m of cfg.matchAll(/'(\.\/src\/[^']+)'/g)) {
      const rel = m[1].replace('./src/', '');
      expect(existsSync(join(ROOT, rel)), `vite.config.ts ссылается на ${rel}`).toBe(true);
    }
  });
});
