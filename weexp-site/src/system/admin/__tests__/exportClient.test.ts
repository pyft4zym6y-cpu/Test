/**
 * Вивантаження даних клієнта. Головна вимога тут не технічна, а змістова:
 * два режими не мають плутатись. Один іде КЛІЄНТУ на руки, другий — наш
 * внутрішній знімок. Помилка в цьому місці означає, що клієнт прочитає наші
 * оцінки його ж бізнесу й нотатки команди про нього.
 */
import { describe, it, expect } from 'vitest';
import { buildClientExport, exportFileName } from '../exportClient';
import type { AdminRow } from '@/lib/supa';

const row = {
  userId: 'u-1',
  email: 'Owner@Shop.UA',
  record: {
    company: { name: 'Магазин «Кава»', site: 'shop.ua' },
    accessLog: { 'CB-01': { status: 'granted' } },
    clientFiles: [{ title: 'P&L 2025', group: 'Фінанси' }],
    // Внутрішній шар — те, що клієнту не належить:
    notes: [{ text: 'власник уникає розмови про маржу', at: '2026-08-01' }],
    assessment: { business: { score: 40, gap: 'немає юніт-економіки' } },
    adminFiles: [{ name: 'чернетка.docx' }],
    findingReviews: { f1: { verdict: 'ok' } },
  },
} as unknown as AdminRow;

describe('buildClientExport', () => {
  it('режим «client» прибирає внутрішній шар', () => {
    const e = buildClientExport(row, 'client');
    expect(e.record.notes).toBeUndefined();
    expect(e.record.assessment).toBeUndefined();
    expect(e.record.adminFiles).toBeUndefined();
    expect(e.record.findingReviews).toBeUndefined();
  });

  it('режим «client» лишає те, що клієнту належить', () => {
    const e = buildClientExport(row, 'client');
    expect(e.record.company?.name).toBe('Магазин «Кава»');
    expect(e.record.accessLog).toBeDefined();
    expect(e.record.clientFiles).toHaveLength(1);
  });

  it('називає, що саме виключено: отримувач не має гадати, чи це все', () => {
    const e = buildClientExport(row, 'client');
    expect(e.meta.excluded).toEqual(expect.arrayContaining(['notes', 'assessment', 'adminFiles']));
  });

  it('режим «full» лишає все і попереджає, що клієнту це не віддають', () => {
    const e = buildClientExport(row, 'full');
    expect(e.record.notes).toBeDefined();
    expect(e.record.assessment).toBeDefined();
    expect(e.meta.excluded).toEqual([]);
    expect(e.meta.note).toMatch(/Не передавати клієнту/);
  });

  it('не мутує вихідний запис — інакше експорт стирав би дані в панелі', () => {
    const before = JSON.stringify(row.record);
    buildClientExport(row, 'client');
    expect(JSON.stringify(row.record)).toBe(before);
  });

  it('порожній запис не ламає вивантаження', () => {
    const e = buildClientExport({ userId: 'u', email: 'a@b.c', record: {} } as unknown as AdminRow, 'client');
    expect(e.record).toEqual({});
    expect(e.meta.excluded).toEqual([]);
  });
});

describe('exportFileName', () => {
  it('імʼя з назви компанії, без символів, які ламають файлову систему', () => {
    const n = exportFileName(row, 'client');
    expect(n).toMatch(/^weexp-.+-client-\d{4}-\d{2}-\d{2}\.json$/);
    expect(n).not.toMatch(/[«»@ ]/);
  });

  it('без компанії бере пошту, а не падає', () => {
    const n = exportFileName({ userId: 'u', email: 'owner@shop.ua', record: {} } as unknown as AdminRow, 'full');
    expect(n).toContain('owner-shop-ua');
    expect(n).toContain('-full-');
  });

  it('без компанії й без пошти лишається валідне імʼя', () => {
    const n = exportFileName({ userId: 'u-9', email: '', record: {} } as unknown as AdminRow, 'full');
    expect(n).toMatch(/^weexp-.+\.json$/);
  });
});
