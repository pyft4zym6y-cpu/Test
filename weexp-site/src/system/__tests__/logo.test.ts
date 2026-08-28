/**
 * Логотип — один знак на весь продукт.
 *
 * До цього «логотипом» був набраний текст: у шапці `<b>WEEXP</b>`, у
 * документах `<div class="logo">WEEXP<span>.</span></div>`. Це різні речі в
 * різних місцях: змінюється шрифт — змінюється знак, і жодне з написань не
 * збігалося зі справжнім логотипом.
 *
 * Тепер геометрія лежить в одному файлі, а UI і друковані документи беруть її
 * звідти. Головне, що стережеться тут: другої копії геометрії не зʼявилось.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOGO_VIEWBOX } from '../Logo';
import { DOC_LOGO, DOC_LOGO_CSS } from '../docLogo';

const root = join(__dirname, '..', '..', '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');
const asset = read('public/brand/weexp-logo.svg');
const logoTsx = read('src/system/Logo.tsx');

/** Числа з усіх path-ів — «відбиток» геометрії, незалежний від форматування. */
const geometry = (svg: string) => (svg.match(/ d="([^"]+)"/g) || []).join('|').replace(/\s+/g, ' ').trim();

describe('джерело знака одне', () => {
  it('файл-джерело існує і містить обидва кольори бренду', () => {
    expect(asset).toContain('#141210');
    expect(asset).toContain('#D0230E');
    expect(asset).toMatch(/viewBox="0 0 \d+ \d+"/);
  });

  it('UI-компонент повторює геометрію файла, а не малює свою', () => {
    const inAsset = geometry(asset);
    const paths = logoTsx.match(/'M[^']+'/g) || [];
    expect(paths.length, 'у Logo.tsx немає шляхів знака').toBe(2);
    for (const d of paths) {
      const path = d.slice(1, -1).replace(/\s+/g, ' ').trim();
      expect(inAsset.includes(path), 'шлях у Logo.tsx розійшовся з public/brand/weexp-logo.svg').toBe(true);
    }
  });

  it('версія для документів — та сама геометрія', () => {
    expect(geometry(DOC_LOGO)).toBe(geometry(asset));
    expect(LOGO_VIEWBOX).toBe((asset.match(/viewBox="([^"]+)"/) || [])[1]);
  });

  it('фавікон побудований із того самого знака', () => {
    const fav = read('public/favicon.svg');
    expect(fav).toContain('#D0230E');
    // Рамка з X — фрагмент повного знака, тому шлях X має збігатися дослівно.
    const x = (asset.match(/#D0230E"[^>]*d="([^"]+)"/) || [])[1];
    expect(fav).toContain(x);
  });
});

describe('знак стоїть там, де раніше був набраний текст', () => {
  const files = {
    'шапка сайту': 'src/system/SystemShell.tsx',
    'кабінет': 'src/system/Cabinet.tsx',
    'адмінка': 'src/system/AdminPanel.tsx',
    'підвал': 'src/system/SiteFooter.tsx',
  };
  for (const [where, path] of Object.entries(files)) {
    it(`${where}: знак замість тексту`, () => {
      const src = read(path);
      expect(src).toMatch(/<Logo\b/);
      expect(src, 'набраний «WEEXP» лишився замість знака').not.toMatch(/<b>WEEXP<\/b>/);
    });
  }

  const docs = {
    'досьє клієнта й документ аудиту': 'src/system/admin/docs.ts',
    'документ пакета': 'src/system/admin/shared.tsx',
    'результат експрес-аудиту': 'src/system/Cabinet.tsx',
    'шаблон аудиту': 'src/system/AuditBuilder.tsx',
  };
  for (const [where, path] of Object.entries(docs)) {
    it(`${where}: знак вбудований у документ`, () => {
      const src = read(path);
      expect(src).toContain('${DOC_LOGO}');
      expect(src).toContain('${DOC_LOGO_CSS}');
      expect(src, 'старий текстовий «логотип» лишився').not.toContain('<div class="logo">WEEXP');
    });
  }

  it('стиль знака в документі не посилається на зовнішній файл', () => {
    // Документ відкривається в новому вікні й може піти клієнту окремим HTML —
    // посилання на /brand у ньому просто не завантажиться.
    expect(DOC_LOGO).toMatch(/^<svg/);
    expect(DOC_LOGO).not.toMatch(/<image|xlink:href|url\(/);
    expect(DOC_LOGO_CSS).toContain('.wx-mark');
  });
});
