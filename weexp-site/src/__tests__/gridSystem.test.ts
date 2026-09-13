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
  /*
   * Тест дивився на Pricing.tsx — сторінку цін, якої більше немає: вона
   * описувала ті самі три формати, що й сторінка послуг. Правило лишилось тим
   * самим і переїхало на /services: заголовок іде на всю ширину, а не в одну
   * з колонок, інакше він ламається на чотири рядки при порожній сусідній.
   */
  it('заголовок і надзаголовок ідуть на всю ширину', () => {
    const srv = readFileSync(join(__dirname, '..', 'system', 'Services.tsx'), 'utf8');
    const h1 = /<h1 className="([^"]+)"/.exec(srv)?.[1] ?? '';
    expect(h1, 'на /services не знайдено H1').toBeTruthy();
    expect(h1, 'H1 сторінки послуг сидить у вузькій колонці').not.toMatch(/-head-l\b|-head-r\b/);
  });
});
