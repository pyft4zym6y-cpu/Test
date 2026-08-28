/**
 * Експертизи мають пояснювати БІЗНЕС-ЗАДАЧУ, а не бути переліком послуг.
 *
 * До цього картка казала «Брендинг · позиціонування, айдентика, tone of voice» —
 * і клієнт мав сам здогадатись, навіщо це йому. Тепер у кожної експертизи є
 * `job`: одне речення мовою власника про ситуацію, яку вона закриває.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EXPERTISES, L } from '../expertises';

describe('склад експертиз', () => {
  const slugs = EXPERTISES.map((e) => e.slug);

  it('додані брендинг, UX/UI і веб-розробка', () => {
    for (const s of ['branding', 'ux-ui', 'web-development']) expect(slugs, s).toContain(s);
  });

  it('наявні напрями лишились на місці', () => {
    for (const s of ['international', 'automation', 'technology', 'marketing', 'sales-channels', 'data-growth']) {
      expect(slugs, s).toContain(s);
    }
  });

  it('slug-и унікальні — інакше дві картки ведуть на одну сторінку', () => {
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('кожна експертиза каже, яку задачу закриває', () => {
  for (const e of EXPERTISES) {
    it(`${e.slug}: задача сформульована двома мовами`, () => {
      for (const lang of ['uk', 'en'] as const) {
        const job = L(e.job, lang);
        expect(job.length, `${e.slug}/${lang}`).toBeGreaterThan(30);
        // Задача — про клієнта, а не про нас: перевіряємо, що це не назва послуги.
        expect(job, `${e.slug}/${lang}`).not.toBe(L(e.title, lang));
      }
    });
  }

  it('задача видима в хабі, а не лише в даних', () => {
    const hub = readFileSync(join(__dirname, '..', 'ExpansionHub.tsx'), 'utf8');
    expect(hub).toMatch(/L\(e\.job, lang\)/);
  });

  it('у кожної експертизи є послуги, результат і процес', () => {
    for (const e of EXPERTISES) {
      expect(e.services.length, e.slug).toBeGreaterThanOrEqual(4);
      expect(e.deliverables.length, e.slug).toBeGreaterThanOrEqual(3);
      expect(e.process.length, e.slug).toBeGreaterThanOrEqual(3);
      expect(L(e.outcome, 'uk').length, e.slug).toBeGreaterThan(20);
    }
  });
});
