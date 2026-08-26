import { describe, expect, it } from 'vitest';
import { auditStatusOf, phaseOf, blockers, nextStep, staleDays } from '../auditRequests';
import type { AdminRow, DiagRecord } from '@/lib/supa';

/**
 * Похідний статус — серце розділу «Аудит і проєкти»: його ніхто не проставляє
 * руками, тому помилка тут не видно доти, доки хтось не помітить порожню
 * колонку. Три реальні баги знайшлися саме тут, тож фіксуємо поведінку.
 */
const row = (record: DiagRecord): AdminRow => ({ userId: 'u1', email: 'a@b.c', record });
const tier = (v: Record<string, string>): DiagRecord => ({ funnel: { tierStatus: v } } as DiagRecord);

describe('auditStatusOf', () => {
  it('не заявка, якщо клієнт нічого не просив', () => {
    expect(auditStatusOf(row({}))).toBeNull();
  });

  it('запит клієнта → new', () => {
    expect(auditStatusOf(row(tier({ DEEP: 'requested' })))).toBe('new');
    expect(auditStatusOf(row({ funnel: { deepRequested: true } } as DiagRecord))).toBe('new');
  });

  it('доступ надано, клієнт ще не почав → granted (а не filling)', () => {
    expect(auditStatusOf(row(tier({ DEEP: 'granted' })))).toBe('granted');
  });

  it('клієнт щось заповнив → filling', () => {
    const rec = { ...tier({ DEEP: 'granted' }), clientFiles: [{ title: 'x', group: 'report' }] } as DiagRecord;
    expect(auditStatusOf(row(rec))).toBe('filling');
  });

  it('старий відхилений T2 не робить «denied» клієнта з виданим DEEP', () => {
    expect(auditStatusOf(row(tier({ T2: 'rejected', DEEP: 'granted' })))).toBe('granted');
  });

  it('легасі-запис без ключа DEEP читається за старшинством, а не за порядком', () => {
    expect(auditStatusOf(row(tier({ T1: 'rejected', T3: 'granted' })))).toBe('granted');
    expect(auditStatusOf(row(tier({ T1: 'rejected', T2: 'data' })))).toBe('need_data');
  });

  it('переданий проміжний документ НЕ закриває аудит', () => {
    const rec = { ...tier({ DEEP: 'granted' }), deepModeration: { status: 'accepted', at: '2026-01-01' }, sharedDocs: [{ id: 'd1', title: 'чернетка', at: '2026-01-02' }] } as DiagRecord;
    expect(auditStatusOf(row(rec))).toBe('in_work');
  });

  it('явне закриття етапу → done', () => {
    const rec = { ...tier({ DEEP: 'granted' }), deepModeration: { status: 'accepted', at: '2026-01-01' }, auditClosedAt: '2026-02-01' } as DiagRecord;
    expect(auditStatusOf(row(rec))).toBe('done');
  });

  it('видача доступу не перекидає клієнта у фазу впровадження', () => {
    const st = auditStatusOf(row(tier({ DEEP: 'granted' })));
    expect(st).not.toBeNull();
    expect(phaseOf(st!)).toBe(1);
  });

  it('проект → фаза 2; опублікований проект → delivery', () => {
    const base = tier({ DEEP: 'granted' });
    const withProject = { ...base, projects: [{ id: 'p1', title: 'x' }] } as DiagRecord;
    expect(auditStatusOf(row(withProject))).toBe('project');
    const published = { ...base, projects: [{ id: 'p1', title: 'x', published: true }] } as DiagRecord;
    expect(auditStatusOf(row(published))).toBe('delivery');
  });

  it('модерація перекриває заповнення', () => {
    const base = tier({ DEEP: 'granted' });
    expect(auditStatusOf(row({ ...base, deepModeration: { status: 'submitted', at: '2026-01-01' } } as DiagRecord))).toBe('review');
    expect(auditStatusOf(row({ ...base, deepModeration: { status: 'clarify', at: '2026-01-01' } } as DiagRecord))).toBe('clarify');
  });
});

describe('nextStep', () => {
  it('на «new» і «review» хід наш, на «granted» і «clarify» — клієнта', () => {
    expect(nextStep(row(tier({ DEEP: 'requested' }))).who).toBe('ми');
    expect(nextStep(row(tier({ DEEP: 'granted' }))).who).toBe('клієнт');
    const rec = { ...tier({ DEEP: 'granted' }), deepModeration: { status: 'submitted', at: '2026-01-01' } } as DiagRecord;
    expect(nextStep(row(rec)).who).toBe('ми');
  });
});

describe('blockers', () => {
  it('на фазі аудиту вимагають доступи й файли', () => {
    const rec = { ...tier({ DEEP: 'granted' }), company: { name: 'X', site: 'x.com' } } as DiagRecord;
    const b = blockers(row(rec));
    expect(b).toContain('не надано жодного доступу');
    expect(b).toContain('не завантажено жодного файлу');
  });

  it('на фазі впровадження не вимагають файли аудиту', () => {
    const rec = { company: { name: 'X', site: 'x.com' }, projects: [{ id: 'p1', title: 'x' }] } as DiagRecord;
    const b = blockers(row(rec));
    expect(b).not.toContain('не завантажено жодного файлу');
    expect(b).toContain('проект не опублікований клієнту');
  });

  it('порожній профіль блокує на будь-якій фазі', () => {
    expect(blockers(row(tier({ DEEP: 'granted' })))).toContain('не вказаний сайт — рушій нема куди запускати');
  });
});

describe('staleDays', () => {
  it('без жодної дати — нуль, а не NaN', () => {
    expect(staleDays(row({}))).toBe(0);
  });
});
