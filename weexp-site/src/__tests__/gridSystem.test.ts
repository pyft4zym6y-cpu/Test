/**
 * Сітка сторінок: міра для абзацу — не міра для заголовка.
 *
 * Системна причина «зажатих» сторінок була одна на всі: max-width, придуманий
 * для довжини рядка тексту (56–62ch), стояв на всьому шапковому блоці — разом
 * із заголовком. На екрані 1846px контейнер мав 1180, а шапка «Про нас» — 564:
 * заголовок ламався на 4 рядки, поки права половина екрана лишалась порожньою.
 *
 * Заміряно до і після (1846×980, кількість рядків H1):
 *   /people  4 → 2      /pricing 4 → 2      /systems 5 → 3
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '..', 'system', 'system.css'), 'utf8');
const rule = (sel: string): string => {
  const at = css.indexOf(sel + ' {');
  expect(at, `правило ${sel} не знайдено`).toBeGreaterThanOrEqual(0);
  return css.slice(at, css.indexOf('}', at));
};

describe('токени сітки', () => {
  it('ширина сторінки й міра рядка оголошені один раз', () => {
    expect(css).toMatch(/:root\s*\{[^}]*--page-w:/);
    expect(css).toMatch(/:root\s*\{[^}]*--measure:/);
  });

  it('контейнери сторінок беруть ширину з токена, а не зі свого числа', () => {
    for (const sel of ['.pric-in', '.about-in', '.syshub-in', '.xhub-in, .xp2-in']) {
      expect(rule(sel), sel).toMatch(/max-width:\s*var\(--page-w\)/);
    }
  });
});

describe('міра стоїть на тексті, а не на шапці', () => {
  it('шапки сторінок більше не обрізані мірою абзацу', () => {
    for (const sel of ['.about-head', '.pric-head', '.syshub-head', '.xhub-head']) {
      const r = rule(sel);
      expect(r, `${sel} знову обрізає заголовок мірою абзацу`).not.toMatch(/max-width:\s*\d+(ch|px)/);
    }
  });

  it('міру отримують саме абзаци', () => {
    expect(rule('.pric-head .sysx-lead')).toMatch(/var\(--measure\)/);
    expect(rule('.about-lead')).toMatch(/var\(--measure\)/);
    expect(rule('.syshub-head .sysx-lead')).toMatch(/var\(--measure\)/);
  });
});

describe('двоколонкова шапка', () => {
  it('заголовок іде на всю ширину, а не в колонку', () => {
    // Інакше дві колонки просто міняють порожнечу праворуч на переноси ліворуч.
    expect(rule('.about-head-full, .pric-head-full')).toMatch(/grid-column:\s*1 \/ -1/);
    const about = readFileSync(join(__dirname, '..', 'system', 'About.tsx'), 'utf8');
    const pricing = readFileSync(join(__dirname, '..', 'system', 'Pricing.tsx'), 'utf8');
    expect(about).toMatch(/about-h1 about-head-full/);
    expect(pricing).toMatch(/pric-h1 pric-head-full/);
  });

  it('на вузькому екрані колонки складаються в одну', () => {
    const at = css.indexOf('@media (max-width: 999px)');
    expect(at).toBeGreaterThan(0);
    expect(css.slice(at, at + 260)).toMatch(/\.about-head, \.pric-head \{ grid-template-columns: 1fr/);
  });
});
