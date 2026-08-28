/**
 * Правило, яке фарбує тло, мусить фарбувати й текст.
 *
 * `.adm-uhead-cell` задавав `background: var(--deep)`, а колір брав від батька.
 * У шапці картки клієнта батько світлий — усе читалось. Але ті самі клітинки
 * стоять у тілі картки, у блоці «Наступний крок»: там колір успадковується з
 * тіла сторінки — темне чорнило на темному тлі. Контраст ≈ 1:1, блок фізично
 * неможливо прочитати, і жоден тест кольорів цього не бачив: обидва значення
 * поодинці «правильні», ламає їх лише сусідство.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '..', 'system', 'cabinet.css'), 'utf8');

/** Тіло правила за селектором (перше входження). */
const ruleOf = (sel: string): string => {
  const at = css.indexOf(sel + ' {');
  expect(at, `правило ${sel} не знайдено`).toBeGreaterThanOrEqual(0);
  return css.slice(at, css.indexOf('}', at));
};

describe('тло без кольору тексту', () => {
  /** Селектори, які фарбують тло в темний токен і тому мусять задати колір. */
  const DARK = ['.adm-uhead-cell', '.adm-uhead-row'];

  for (const sel of DARK) {
    it(`${sel} задає колір тексту разом із тлом`, () => {
      const r = ruleOf(sel);
      expect(r).toMatch(/background:[^;]*var\(--deep\)/);
      // Або власний color, або клітинки всередині — для рядка-контейнера.
      const ownColor = /(^|;)\s*color:/.test(r);
      const childColor = sel === '.adm-uhead-row' ? /\.adm-uhead-cell\s*\{[^}]*color:/.test(css) : false;
      expect(ownColor || childColor, `${sel} малює темне тло, але не задає колір тексту`).toBe(true);
    });
  }

  it('блок «Наступний крок» у картці заявки — панель, а не сірий дрібний текст', () => {
    const r = ruleOf('.adm-nextstep');
    expect(r).toMatch(/border:/);
    expect(ruleOf('.adm-nextstep-p')).toMatch(/color:[^;]*var\(--charcoal\)/);
  });
});
