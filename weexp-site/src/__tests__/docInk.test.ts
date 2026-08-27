/**
 * Печатаемые документы (экспорт в PDF из кабинета и админки) собираются
 * строками HTML со своим инлайновым CSS и токенов сайта не видят. Поэтому
 * правило «красный, коснувшийся текста, становится чернилами» приходится
 * держать здесь отдельным тестом, а не надеяться на систему токенов.
 *
 * Цена ошибки конкретная: документ печатает клиент. Заголовки разделов шли
 * фирменным #F5301C на 13–14px — контраст 3.95 к белому и 3.60 к бумаге при
 * пороге 4.5. Кнопка «Друк / зберегти в PDF» — белым по #F5301C, те же 3.95.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BRAND, INK, scoreInk, scoreFill } from '../system/docInk';

const hex = (h: string) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (h: string) => { const [r, g, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const WHITE = '#FFFFFF';
const SURFACES = [WHITE, BRAND.paper];          // фоны, на которых печатаются документы
const AA_TEXT = 4.5;                            // обычный текст
const AA_LARGE = 3.0;                           // ≥18.66px bold или ≥24px

describe('палитра печатаемых документов', () => {
  it('каждый цвет чернил читаем на обоих фонах документа', () => {
    for (const [name, c] of Object.entries(INK))
      for (const bg of SURFACES)
        expect(`${name} на ${bg}: ${ratio(c, bg).toFixed(2)}`)
          .toBe(`${name} на ${bg}: ${Math.max(ratio(c, bg), AA_TEXT).toFixed(2)}`);
  });

  it('белая подпись на красной кнопке читается', () => {
    // Кнопка берёт INK.red именно поэтому: на BRAND.red белый даёт 3.95.
    expect(ratio(WHITE, INK.red)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(ratio(WHITE, BRAND.red)).toBeLessThan(AA_TEXT);
  });

  it('фирменный красный годен для крупных начертаний, но не для текста', () => {
    expect(ratio(BRAND.red, WHITE)).toBeGreaterThanOrEqual(AA_LARGE);
    expect(ratio(BRAND.red, WHITE)).toBeLessThan(AA_TEXT);
  });

  it('шкала здоровья: чернила читаемы, заливка — своя роль', () => {
    for (const s of [0, 44, 45, 64, 65, 100])
      for (const bg of SURFACES)
        expect(`балл ${s} на ${bg}`, `контраст ${ratio(scoreInk(s), bg).toFixed(2)}`)
          .toBe(ratio(scoreInk(s), bg) >= AA_TEXT ? `балл ${s} на ${bg}` : 'провал');
    // заливка полосы текстом не является — к ней требование мягче
    expect(scoreFill(30)).toBe(BRAND.red);
    expect(scoreInk(30)).toBe(INK.red);
    expect(scoreFill(30)).not.toBe(scoreInk(30));
  });
});

/** Все модули, которые собирают печатаемый HTML строкой. */
const GENERATORS = (() => {
  const root = join(__dirname, '..', 'system');
  const out: string[] = [];
  (function walk(d: string) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) { if (e !== '__tests__') walk(p); }
      else if (/\.tsx?$/.test(e) && /window\.print\(\)|<!doctype/i.test(readFileSync(p, 'utf8'))) out.push(p);
    }
  })(root);
  return out;
})();

describe('генераторы документов держат правило', () => {
  it('генераторы вообще найдены — иначе тест пустой', () => {
    expect(GENERATORS.length).toBeGreaterThanOrEqual(4);
  });

  it('фирменный красный не используется как цвет мелкого текста', () => {
    /*
     * Разрешённые исключения — крупные начертания, где порог 3.0: логотип
     * (≥20px, 800–900) и крупные числа. Всё остальное `color:#F5301C`
     * означает, что кто-то снова взял заливку в роли чернил.
     */
    const LARGE = /(\.logo|\.big|\.mod-n)\b/;
    const guilty: string[] = [];
    for (const f of GENERATORS) {
      const src = readFileSync(f, 'utf8');
      for (const line of src.split('\n')) {
        if (!/color:#F5301C/i.test(line)) continue;
        // строка CSS может нести несколько правил — проверяем то, что перед color
        for (const m of line.matchAll(/([.#][\w-]+(?:\s*,\s*[.#][\w-]+)*)\s*\{[^}]*color:#F5301C/gi))
          if (!LARGE.test(m[1])) guilty.push(`${f.split('/src/')[1]}: ${m[1]}`);
      }
    }
    expect(guilty).toEqual([]);
  });

  it('кнопка печати не заливается фирменным красным под белым текстом', () => {
    const guilty = GENERATORS
      .filter((f) => /background:#F5301C;color:#fff/i.test(readFileSync(f, 'utf8')))
      .map((f) => f.split('/src/')[1]);
    expect(guilty).toEqual([]);
  });
});
