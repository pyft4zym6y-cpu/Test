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
  // Фіксована дата: `now` тепер параметр, тож вік стадії перевіряється на
  // календарі. Раніше функція брала Date.now() напряму, і будь-яка фікстура з
  // конкретною датою давала вік «скільки минуло до дня прогону тесту».
  const NOW = Date.parse('2026-08-20T00:00:00Z');
  const movedAt = (iso: string) => row({ updatedAt: iso } as DiagRecord);

  it('без жодної дати — нуль, а не NaN', () => {
    expect(staleDays(row({}))).toBe(0);
  });

  it('рахує повні доби, а не округлює вгору', () => {
    expect(staleDays(movedAt('2026-08-17T00:00:00Z'), NOW)).toBe(3);
    expect(staleDays(movedAt('2026-08-16T23:00:00Z'), NOW)).toBe(3);   // 3 доби + година
  });

  it('рух сьогодні — нуль днів', () => {
    expect(staleDays(movedAt('2026-08-20T00:00:00Z'), NOW)).toBe(0);
  });

  it('дата з майбутнього не дає відʼємний вік', () => {
    expect(staleDays(movedAt('2026-09-01T00:00:00Z'), NOW)).toBe(0);
  });
});

describe('фаза 3 — супровід', () => {
  it('усі проєкти закриті → care', () => {
    const rec = { projects: [{ id: 'p1', title: 'x', published: true, closedAt: '2026-03-01' }] } as DiagRecord;
    const st = auditStatusOf(row(rec));
    expect(st).toBe('care');
    expect(phaseOf(st!)).toBe(3);
  });

  it('один незакритий проєкт лишає клієнта у впровадженні', () => {
    const rec = { projects: [
      { id: 'p1', title: 'x', published: true, closedAt: '2026-03-01' },
      { id: 'p2', title: 'y', published: true },
    ] } as DiagRecord;
    expect(auditStatusOf(row(rec))).toBe('delivery');
  });
});

describe('SLA', () => {
  it('норматив залежить від стадії, а не один на всіх', async () => {
    const { SLA } = await import('../auditRequests');
    expect(SLA.new.breach).toBeLessThan(SLA.filling.breach);
    expect(SLA.review.breach).toBeLessThan(SLA.delivery.breach);
    expect(SLA.denied.breach).toBeGreaterThan(1000);   // відхилене не «зависає»
  });

  it('свіжа стадія — ok, стара — breach', async () => {
    const { slaOf } = await import('../auditRequests');
    const fresh = { funnel: { tierStatus: { DEEP: 'requested' }, tierHistory: { DEEP: [{ st: 'requested', at: new Date().toISOString() }] } } } as DiagRecord;
    expect(slaOf(row(fresh)).state).toBe('ok');
    const old = new Date(Date.now() - 40 * 86400000).toISOString();
    const stale = { funnel: { tierStatus: { DEEP: 'requested' }, tierHistory: { DEEP: [{ st: 'requested', at: old }] } } } as DiagRecord;
    expect(slaOf(row(stale)).state).toBe('breach');
  });

  // Перехід ok → warn → breach на конкретних датах. Саме цього не можна було
  // перевірити, доки staleDays брав Date.now() напряму: тест міг сказати лише
  // «свіже не прострочене», але не де саме проходить межа.
  it('межі стадії «нова заявка» — warn на 1 день, breach на 2', async () => {
    const { slaOf } = await import('../auditRequests');
    const NOW = Date.parse('2026-08-20T00:00:00Z');
    const at = (iso: string) => row({
      funnel: { deepRequested: true, tierStatus: { DEEP: 'requested' } },
      updatedAt: iso,
    } as unknown as DiagRecord);
    expect(slaOf(at('2026-08-20T00:00:00Z'), NOW).state).toBe('ok');
    expect(slaOf(at('2026-08-19T00:00:00Z'), NOW).state).toBe('warn');
    expect(slaOf(at('2026-08-18T00:00:00Z'), NOW).state).toBe('breach');
  });

  it('одна й та сама картка не прострочена на одній стадії й прострочена на іншій', async () => {
    const { slaOf } = await import('../auditRequests');
    const NOW = Date.parse('2026-08-20T00:00:00Z');
    const eightDaysAgo = '2026-08-12T00:00:00Z';
    const asNew = row({
      funnel: { deepRequested: true, tierStatus: { DEEP: 'requested' } }, updatedAt: eightDaysAgo,
    } as unknown as DiagRecord);
    const asFilling = row({
      funnel: { tierStatus: { DEEP: 'filling' } }, updatedAt: eightDaysAgo,
    } as unknown as DiagRecord);
    expect(slaOf(asNew, NOW).state).toBe('breach');       // норматив 2 дні
    expect(slaOf(asFilling, NOW).state).not.toBe('breach'); // норматив 21 день
  });

  it('відхилене не «зависає» навіть через рік', async () => {
    const { slaOf } = await import('../auditRequests');
    const NOW = Date.parse('2026-08-20T00:00:00Z');
    const denied = row({
      funnel: { deepRequested: true, tierStatus: { DEEP: 'rejected' } },
      updatedAt: '2025-08-20T00:00:00Z',
    } as unknown as DiagRecord);
    expect(slaOf(denied, NOW).state).toBe('ok');
  });
});
