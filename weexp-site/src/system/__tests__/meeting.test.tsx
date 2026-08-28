/**
 * Наступний крок після експрес-аудиту.
 *
 * У картці завершеного аудиту було три дії: «Завантажити PDF», «Згорнути
 * результати», «Перерахувати». Клієнт, якого цифра зачепила, не мав куди
 * натиснути — сценарій обривався саме там, де починався інтерес.
 *
 * Тепер: результат → «Запланувати зустріч» → запит (формат і зручний час) →
 * підтвердження. Запит іде в ту саму CRM, що й заявки з сайту, тож далі
 * працює звичний шлях «заявка → проєкт».
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SRC_LABEL, ACCESS_SOURCES } from '../admin/shared';

const src = readFileSync(join(__dirname, '..', 'Cabinet.tsx'), 'utf8');

describe('запит на зустріч', () => {
  it('кнопка стоїть саме в картці завершеного експрес-аудиту', () => {
    // Саме той ряд дій, де раніше сценарій обривався: PDF · згорнути · перерахувати.
    const from = src.indexOf("t('Завантажити PDF'");
    expect(from, 'ряд дій картки аудиту не знайдено').toBeGreaterThan(0);
    const card = src.slice(from, src.indexOf('Видалити аудит', from));
    expect(card).toMatch(/Запланувати зустріч/);
    expect(card).toMatch(/go\('meet'\)/);
  });

  it('запит іде в CRM окремим джерелом і видно, звідки він', () => {
    expect(src).toMatch(/source: 'cabinet-meeting'/);
    expect(SRC_LABEL['cabinet-meeting']).toBe('Кабінет · запит на зустріч');
  });

  it('зустріч не ховається з дошки заявок як службове джерело', () => {
    // ACCESS_SOURCES прибирає з дошки запити доступів. Зустріч — комерційна
    // заявка: сховати її означало б втратити найгарячіший контакт.
    expect(ACCESS_SOURCES).not.toContain('cabinet-meeting');
  });

  it('невдале надсилання не видається за успіх', () => {
    const fn = src.slice(src.indexOf('function Meeting('), src.indexOf('function Collab('));
    expect(fn).toMatch(/if \(res !== 'ok'\)/);
    expect(fn).toMatch(/setErr\(/);
    // Підтвердження ставиться лише після успішної відправки.
    expect(fn.indexOf("setSent(true)")).toBeGreaterThan(fn.indexOf("if (res !== 'ok')"));
  });

  it('підтвердження каже, що буде далі, а не просто «дякуємо»', () => {
    const fn = src.slice(src.indexOf('function Meeting('), src.indexOf('function Collab('));
    expect(fn).toMatch(/Ми напишемо й запропонуємо час/);
    expect(fn).toMatch(/протягом робочого дня/);
  });

  it('календар не імітується — питаємо зручний час, а не показуємо слоти', () => {
    const fn = src.slice(src.indexOf('function Meeting('), src.indexOf('function Collab('));
    expect(fn).toMatch(/MEET_WHEN/);
    expect(fn).not.toMatch(/slot|Slot|calendly|Calendly/);
  });
});
