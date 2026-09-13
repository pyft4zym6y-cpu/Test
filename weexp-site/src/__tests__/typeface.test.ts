/**
 * ОДНА ГАРНІТУРА НА ВЕСЬ САЙТ.
 *
 * Було сім: Unbounded і Bricolage Grotesque на заголовки, IBM Plex Sans на
 * текст, IBM Plex Mono на технічні підписи, IBM Plex Serif на курсив, Caveat
 * на рукописний акцент і Golos Text на решту. Накопичувались вони так само, як
 * накопичуються будь-де: кожен окремий випадок був виправданий — «цьому блоку
 * потрібен характерніший заголовок», «підпису пасує моноширинний». Разом це сім
 * різних голосів на одній сторінці й півтора десятка файлів шрифтів у
 * завантаженні першого екрана.
 *
 * Змінні --display / --sans / --mono / --script лишились, бо на них спирається
 * уся верстка, але тепер це імена РОЛЕЙ, а не шрифтів: різницю тримають вага,
 * кегль, розрядка й регістр. Сторож стежить саме за цим — щоб під роллю знову
 * не завелась друга сімʼя.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '..');
const FAMILY = 'Golos Text';

/** Родові імена CSS — це не гарнітури, а вказівка «візьми щось таке». */
const GENERIC = new Set([
  'system-ui', 'ui-monospace', 'sans-serif', 'serif', 'monospace', 'cursive',
  'Arial', 'Segoe UI', 'Menlo', 'inherit', 'initial', 'unset',
]);

/** Усі .css сайту (кабінет і адмінка теж: документи друкуються тим самим). */
const cssFiles = [
  ...readdirSync(join(SRC, 'system')).filter((f) => f.endsWith('.css')).map((f) => join(SRC, 'system', f)),
  join(SRC, 'index.css'),
];

/** Усі .ts/.tsx, де може лежати інлайновий стиль друкованого документа. */
const codeFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? codeFiles(join(dir, e.name))
      : /\.tsx?$/.test(e.name) && !e.name.endsWith('.test.ts') ? [join(dir, e.name)] : []);

/**
 * Імена сімей із одного оголошення font-family.
 *
 * `var(--mono, 'Golos Text', system-ui)` — це теж список сімей: запасні імена
 * всередині var() так само потрапляють на екран, коли змінна не визначена.
 * Тому розгортаємо var() у його список, а не пропускаємо як «щось динамічне»:
 * перша версія розбирача ламалась саме на ньому й зараховувала «sans-serif)»
 * за гарнітуру.
 */
const families = (decl: string): string[] =>
  decl.replace(/var\(\s*--[a-z0-9-]+\s*,?/gi, '').replace(/[()]/g, '')
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter((s) => s && !/^\d/.test(s) && !GENERIC.has(s));

describe('одна гарнітура на весь сайт', () => {
  it('у CSS не оголошено жодної іншої сімʼї', () => {
    const alien: string[] = [];
    for (const f of cssFiles) {
      const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/g))
        for (const fam of families(m[1]))
          if (fam !== FAMILY) alien.push(`${f.split('/').pop()}: ${fam}`);
    }
    expect(alien, `у верстці зʼявилась друга гарнітура: ${alien.join(', ')}`).toEqual([]);
  });

  it('у коді (зокрема в стилях друкованих документів) теж', () => {
    /*
     * Друковані договори й акти малюються інлайновим CSS у новому вікні — у
     * нього не потрапляє жоден файл сайту, тож тут легко завести собі другу
     * гарнітуру непомітно для будь-якої перевірки верстки. Саме так і було:
     * документи набирались IBM Plex, коли на сайті його вже не лишилось.
     */
    const alien: string[] = [];
    for (const f of codeFiles(SRC)) {
      const code = readFileSync(f, 'utf8');
      for (const m of code.matchAll(/font-family\s*:\s*([^;}`'"]+)/g))
        for (const fam of families(m[1]))
          if (fam !== FAMILY) alien.push(`${f.split('/').pop()}: ${fam}`);
    }
    expect(alien, `у коді зʼявилась друга гарнітура: ${alien.join(', ')}`).toEqual([]);
  });

  it('вантажиться рівно одна сімʼя і рівно з одного джерела', () => {
    const idx = readFileSync(join(SRC, 'index.css'), 'utf8');
    const imports = [...idx.matchAll(/@import\s+'([^']*fontsource[^']*)'/g)].map((m) => m[1]);
    expect(imports.length, 'жодного шрифта не вантажиться').toBeGreaterThan(0);
    const pkgs = new Set(imports.map((i) => i.split('/').slice(0, 2).join('/')));
    expect([...pkgs], `вантажиться більше однієї сімʼї: ${[...pkgs].join(', ')}`)
      .toEqual(['@fontsource/golos-text']);
  });

  it('у залежностях не лишилось шрифтів, які більше не вантажаться', () => {
    // Видалений @import лишає пакет у node_modules і в package.json: наступний,
    // хто шукатиме «а який у нас шрифт», знайде шість відповідей.
    const pkg = JSON.parse(readFileSync(join(SRC, '..', 'package.json'), 'utf8'));
    const fonts = Object.keys(pkg.dependencies).filter((d) => d.includes('fontsource'));
    expect(fonts).toEqual(['@fontsource/golos-text']);
  });
});
