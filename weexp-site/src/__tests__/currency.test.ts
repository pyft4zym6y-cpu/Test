/**
 * Валюта експрес-аудиту.
 *
 * До цього був один форматувальник `eur()`: калькулятор приймав ЛИШЕ євро.
 * Український власник — основна аудиторія української версії — мусив
 * перевести свій місячний виторг у євро, щоб скористатися безкоштовним
 * інструментом, а потім перевести результат назад. Це трение стояло просто
 * на головній конверсії сайту.
 *
 * Зробити валюту «просто підписом» було не можна: сума зберігається в заявці,
 * і її потім читають кабінет, адмінка й PDF — адмін побачив би € на числах,
 * які клієнт вводив у гривні. Тому валюта живе в самій заявці.
 *
 * Курсів у продукті немає і не вигадуємо: суми в різних валютах не додаються.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { money, curOf, signOf, groupByCur, CURRENCIES, DEFAULT_CUR, AGENCY_CUR, type Cur } from '../system/systems';
import { computeLoss, project } from '../system/lossModel';

const INPUT = {
  monthlyRevenue: 100_000, aov: 50, conversion: 1.2, repeatRate: 20,
  returnsRate: 10, grossMargin: 40, cac: 20, symptoms: [] as never[],
};

describe('форматування', () => {
  it('усі чотири валюти мають знак і назви', () => {
    expect(CURRENCIES.map((c) => c.code)).toEqual(['UAH', 'USD', 'EUR', 'PLN']);
    for (const c of CURRENCIES) {
      expect(c.sign, `${c.code} без знака`).toBeTruthy();
      expect(c.uk, `${c.code} без укр. назви`).toBeTruthy();
      expect(c.en, `${c.code} без англ. назви`).toBeTruthy();
    }
  });

  it('гривня і злотий пишуться після числа, долар і євро — перед', () => {
    // Так їх пишуть удома; «₴1,200» виглядає як помилка перекладу.
    expect(money(1200, 'UAH')).toMatch(/^1 200 ₴$/);
    expect(money(1200, 'PLN')).toMatch(/^1 200 zł$/);
    expect(money(1200, 'USD')).toBe('$1,200');
    expect(money(1200, 'EUR')).toBe('€1,200');
  });

  it('число одне й те саме в будь-якій валюті — конвертації немає', () => {
    const digits = (s: string) => s.replace(/\D/g, '');
    const all = CURRENCIES.map((c) => digits(money(98_765, c.code)));
    expect(new Set(all).size, `суми розійшлись: ${all.join(' ')}`).toBe(1);
  });

  it('невідома або відсутня валюта читається як історичне євро', () => {
    // Заявки, зроблені до появи вибору, валюти не мають — і були в євро.
    expect(curOf(undefined)).toBe('EUR');
    expect(curOf(null)).toBe('EUR');
    expect(curOf('BTC')).toBe('EUR');
    expect(curOf('UAH')).toBe('UAH');
    expect(DEFAULT_CUR).toBe('EUR');
  });
});

describe('модель не залежить від валюти', () => {
  it('витік у гривні дорівнює витоку в євро — міняється лише підпис', () => {
    const uah = computeLoss({ ...INPUT, currency: 'UAH' });
    const eur = computeLoss({ ...INPUT, currency: 'EUR' });
    expect(uah.total).toBe(eur.total);
    expect(uah.range).toEqual(eur.range);
  });

  it('прогноз підписує суми валютою заявки, а не євро за замовчуванням', () => {
    const p = project({ ...INPUT, currency: 'UAH' }, computeLoss({ ...INPUT, currency: 'UAH' }), 'uk');
    const rows = [...p.income, ...p.unit].map((d) => `${d.before} ${d.after}`).join(' ');
    expect(rows, 'у прогнозі лишились євро').not.toContain('€');
    expect(rows).toContain('₴');
  });

  it('злотий доходить до прогнозу так само', () => {
    const p = project({ ...INPUT, currency: 'PLN' }, computeLoss({ ...INPUT, currency: 'PLN' }), 'uk');
    expect([...p.income].map((d) => d.after).join(' ')).toContain('zł');
  });
});

describe('зведення не складають різні валюти', () => {
  it('дві заявки в різних валютах дають два підсумки, а не один', () => {
    const rows = [
      { cur: 'UAH' as Cur, amount: 100 },
      { cur: 'UAH' as Cur, amount: 50 },
      { cur: 'EUR' as Cur, amount: 7 },
    ];
    const g = groupByCur(rows, (r) => r.cur, (r) => r.amount);
    expect(g).toEqual([{ cur: 'UAH', total: 150, n: 2 }, { cur: 'EUR', total: 7, n: 1 }]);
  });

  it('порожній список — порожній підсумок, а не нуль у якійсь валюті', () => {
    expect(groupByCur([] as { c: Cur; a: number }[], (r) => r.c, (r) => r.a)).toEqual([]);
  });
});

describe('жодне місце не малює гроші, не знаючи їх валюти', () => {
  const SRC = join(__dirname, '..');
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = join(dir, e.name);
      if (e.isDirectory()) return e.name === '__tests__' ? [] : walk(p);
      return /\.tsx?$/.test(e.name) ? [p] : [];
    });

  it('старого форматувальника eur() не лишилось ніде', () => {
    /*
     * Функція `eur()` була в трьох копіях: спільна в systems.ts, своя в
     * ProjectView.tsx і реекспорт через lossModel. Поки вона існує, будь-яке
     * нове місце може випадково намалювати євро на чужих грошах.
     */
    const bad = walk(SRC)
      .filter((f) => /\beur\s*\(/.test(readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')))
      .map((f) => f.slice(SRC.length + 1));
    expect(bad, `лишились виклики eur(): ${bad.join(', ')}`).toEqual([]);
  });

  it('знак валюти не вписаний у підписи полів калькулятора', () => {
    // Поля були підписані «€ / міс» і «€» — саме це й змушувало переводити.
    const calc = readFileSync(join(SRC, 'system', 'LossCalculator.tsx'), 'utf8');
    const fields = /const FIELDS[\s\S]*?\n  \];/.exec(calc);
    expect(fields, 'перелік полів не знайдено').toBeTruthy();
    expect(fields![0], 'у підписах полів знову зашитий знак валюти').not.toMatch(/unit: *'[€$₴]/);
  });

  it('валюта агентства названа окремо від валюти клієнта', () => {
    expect(AGENCY_CUR).toBe('EUR');
    expect(signOf(AGENCY_CUR)).toBe('€');
  });
});
