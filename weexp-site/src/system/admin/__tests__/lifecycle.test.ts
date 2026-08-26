import { describe, expect, it } from 'vitest';
import { auditStatusOf, phaseOf, nextStep, blockers, slaOf, STAGE_OF } from '../auditRequests';
import { rowMatches, matchRow } from '../search';
import type { AdminRow, DiagRecord } from '@/lib/supa';

/**
 * Сценарний тест (H7): не окремі функції, а ВЕСЬ шлях клієнта — заявка →
 * доступ → заповнення → модерація → робота → закриття етапу → проєкт →
 * впровадження → супровід. Саме на переходах між станами тут уже ламалось
 * тричі, і кожного разу це було видно лише порожньою колонкою на дошці.
 */
const row = (record: DiagRecord): AdminRow => ({ userId: 'u1', email: 'c@x.com', company: 'Тест', record });
const hist = (st: string, at: string) => ({ funnel: { tierHistory: { DEEP: [{ st, at }] } } });

describe('життєвий цикл клієнта', () => {
  it('проходить усі стадії в правильному порядку і без пропусків', () => {
    const now = new Date().toISOString();
    let rec: DiagRecord = { company: { name: 'Тест', site: 't.com' }, funnel: { tierStatus: { DEEP: 'requested' }, ...hist('requested', now).funnel } } as DiagRecord;
    const seen: string[] = [];
    const step = () => { const st = auditStatusOf(row(rec))!; seen.push(st); return st; };

    expect(step()).toBe('new');                     // клієнт попросив
    expect(nextStep(row(rec)).who).toBe('ми');

    rec = { ...rec, funnel: { ...rec.funnel!, tierStatus: { DEEP: 'granted' } } };
    expect(step()).toBe('granted');                 // менеджер надав — і НЕ провалився у фазу 2
    expect(phaseOf('granted')).toBe(1);
    expect(nextStep(row(rec)).who).toBe('клієнт');

    rec = { ...rec, clientFiles: [{ id: 'f0', title: 'P&L', group: 'report' }] } as DiagRecord;
    expect(step()).toBe('filling');                 // клієнт почав

    rec = { ...rec, deepModeration: { status: 'submitted', at: now } };
    expect(step()).toBe('review');
    expect(nextStep(row(rec)).who).toBe('ми');

    rec = { ...rec, deepModeration: { status: 'clarify', at: now } };
    expect(step()).toBe('clarify');
    rec = { ...rec, deepModeration: { status: 'accepted', at: now } };
    expect(step()).toBe('in_work');

    // Проміжний документ НЕ закриває етап — етап закривається явно.
    rec = { ...rec, sharedDocs: [{ id: 'd1', title: 'чернетка', at: now }] };
    expect(step()).toBe('in_work');
    rec = { ...rec, auditClosedAt: now };
    expect(step()).toBe('done');

    rec = { ...rec, projects: [{ id: 'p1', title: 'Впровадження' }] };
    expect(step()).toBe('project');
    expect(phaseOf('project')).toBe(2);

    rec = { ...rec, projects: [{ id: 'p1', title: 'Впровадження', published: true }] };
    expect(step()).toBe('delivery');

    rec = { ...rec, projects: [{ id: 'p1', title: 'Впровадження', published: true, closedAt: now }] };
    expect(step()).toBe('care');
    expect(phaseOf('care')).toBe(3);                // клієнт не зникає з дошки

    // Жодна стадія не повторилась і жодна не пропущена.
    expect(seen).toEqual(['new', 'granted', 'filling', 'review', 'clarify', 'in_work', 'in_work', 'done', 'project', 'delivery', 'care']);
    // Кожна має підпис для дошки.
    for (const st of new Set(seen)) expect(STAGE_OF[st as keyof typeof STAGE_OF]).toBeTruthy();
  });

  it('норматив стадії застосовується той, що відповідає стадії', () => {
    const old = new Date(Date.now() - 5 * 86400000).toISOString();
    const asNew = { company: { name: 'X' }, funnel: { tierStatus: { DEEP: 'requested' }, tierHistory: { DEEP: [{ st: 'requested', at: old }] } } } as DiagRecord;
    // 5 днів на «Нова» — порушення (норматив 2)…
    expect(slaOf(row(asNew)).state).toBe('breach');
    // …а ті самі 5 днів на «Клієнт заповнює» — ще в межах (норматив 21).
    const asFilling = { ...asNew, clientFiles: [{ id: 'f1', title: 'f', group: 'report' }], funnel: { tierStatus: { DEEP: 'granted' }, tierHistory: { DEEP: [{ st: 'granted', at: old }] } } } as DiagRecord;
    expect(auditStatusOf(row(asFilling))).toBe('filling');
    expect(slaOf(row(asFilling)).state).not.toBe('breach');
  });

  it('блокери змінюються разом із фазою', () => {
    const inAudit = { company: { name: 'X', site: 'x.com' }, funnel: { tierStatus: { DEEP: 'granted' } } } as DiagRecord;
    expect(blockers(row(inAudit))).toContain('не завантажено жодного файлу');
    const inDelivery = { company: { name: 'X', site: 'x.com' }, projects: [{ id: 'p', title: 'P', published: true }] } as DiagRecord;
    expect(blockers(row(inDelivery))).not.toContain('не завантажено жодного файлу');
  });
});

describe('наскрізний пошук', () => {
  const rec = {
    company: { name: 'Ромашка', site: 'romashka.ua' },
    notes: [{ id: 'n1', at: '2026-01-01', text: 'Проблема з Новою Поштою — довгі повернення' }],
    clientFiles: [{ id: 'f2', title: 'Вивантаження замовлень', group: 'export' }],
    accessLog: { 'AC-GA4': { status: 'na', note: 'аналітики немає взагалі' } },
    auditJobs: [{ id: 'r1', at: '2026-02-01', site: 'romashka.ua', status: 'done', summary: 'слабкий чекаут' }],
  } as DiagRecord;

  it('знаходить по нотатці, файлу, доступу і прогону — не лише по email', () => {
    for (const q of ['новою поштою', 'вивантаження', 'аналітики немає', 'чекаут']) {
      expect(rowMatches(row(rec), q)).toBe(true);
    }
    expect(rowMatches(row(rec), 'такого немає ніде')).toBe(false);
  });

  it('каже, ДЕ знайшлось', () => {
    const hits = matchRow(row(rec), 'повернення');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].where).toMatch(/нотатка/);
  });

  it('порожній запит пропускає всіх', () => {
    expect(rowMatches(row(rec), '   ')).toBe(true);
  });
});
