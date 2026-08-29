/**
 * Головний екран кабінету рахується з запису клієнта — і саме тут найлегше
 * збрехати людині, яка прийшла подивитись стан свого проєкту.
 *
 * Два роди брехні, які цей тест ловить:
 *   1. Число, що суперечить самому собі. Перша версія показувала «40 із 37»:
 *      профіль компанії потрапляв у список «чекаємо від вас», але не в
 *      знаменник готовності.
 *   2. Прохання зробити те, що вже зроблено. Експрес-аудит читався лише з
 *      localStorage цього пристрою — клієнт, який рахував із телефона, на
 *      ноутбуці бачив «Знайомство» і «пройдіть експрес-аудит».
 *
 * Обидві не падають, не ламають складання і не помітні на порожньому записі —
 * тільки на реальному стані клієнта.
 */
import { describe, it, expect } from 'vitest';
import { buildDash, activeProject } from '@/system/cabinetDashboard';
import { ACCESS_CATALOG, REQUIRED_FILES } from '@/data/accessCatalog';
import type { DiagRecord } from '@/lib/supa';

const EXPRESS = { at: '2026-06-28T12:00:00Z', total: 1_840_000, range: [1_290_000, 1_840_000] as [number, number], overallHealth: 47 };
const FULL_PROFILE = { name: 'ACME', site: 'acme.ua', niche: 'Home' };
const allAccess = () => Object.fromEntries(ACCESS_CATALOG.map((a) => [a.id, { status: 'granted' as const }]));
const allFiles = () => REQUIRED_FILES.map((f, i) => ({ id: 'f' + i, reqId: f.reqId, group: f.group, status: 'uploaded' as const }));

describe('готовність рахується без протиріч', () => {
  it('знаменник дорівнює всьому, що може потрапити в список', () => {
    const d = buildDash({}, null);
    expect(d.pending.length, 'у порожньому записі чекаємо на все').toBe(d.readiness.total);
    expect(d.readiness.done).toBe(0);
  });

  it('зроблене зменшує список і збільшує готовність на ту саму величину', () => {
    const rec: DiagRecord = { company: FULL_PROFILE };
    const d = buildDash(rec, null);
    const full = buildDash({}, null);
    expect(full.pending.length - d.pending.length, 'профіль закрив 3 пункти').toBe(3);
    expect(d.readiness.done).toBe(3);
    expect(d.readiness.done + d.pending.length).toBe(d.readiness.total);
  });

  it('повністю зібраний клієнт не має жодного відкритого пункту', () => {
    const rec: DiagRecord = { company: FULL_PROFILE, accessLog: allAccess(), clientFiles: allFiles() };
    const d = buildDash(rec, EXPRESS);
    expect(d.pending).toEqual([]);
    expect(d.readiness.done).toBe(d.readiness.total);
  });

  it('доступ «не застосовно» закритий так само, як виданий', () => {
    // Інакше портал вічно просив би доступ до системи, якої в клієнта немає.
    const rec: DiagRecord = { accessLog: { [ACCESS_CATALOG[0].id]: { status: 'na' } } };
    const ids = buildDash(rec, null).pending.map((p) => p.id);
    expect(ids).not.toContain(ACCESS_CATALOG[0].id);
  });
});

describe('наступний крок завжди має власника', () => {
  it('без експрес-аудиту крок за клієнтом', () => {
    const d = buildDash({}, null);
    expect(d.next.owner).toBe('you');
    expect(d.next.to).toBe('audits');
  });

  it('коли є що надати — крок за клієнтом і веде туди, де це роблять', () => {
    const d = buildDash({ company: FULL_PROFILE }, EXPRESS);
    expect(d.next.owner).toBe('you');
    expect(d.next.to).toBe('docs');
  });

  it('коли все зібрано — крок за нами', () => {
    const rec: DiagRecord = { company: FULL_PROFILE, accessLog: allAccess(), clientFiles: allFiles(),
      funnel: { deepRequested: true } };
    const d = buildDash(rec, EXPRESS);
    expect(d.next.owner).toBe('we');
  });

  it('текст кроку є обома мовами', () => {
    for (const rec of [{}, { company: FULL_PROFILE }] as DiagRecord[]) {
      const d = buildDash(rec, EXPRESS);
      expect(d.next.text[0]).toBeTruthy();
      expect(d.next.text[1]).toBeTruthy();
      expect(d.next.text[1], 'англійський текст кирилицею').not.toMatch(/\p{Script=Cyrillic}/u);
    }
  });
});

describe('експрес-аудит береться і з акаунта, не лише з пристрою', () => {
  it('знімок в акаунті рахується так само, як локальний', () => {
    // Клієнт міг рахувати з телефона, а зайти з ноутбука: без цього портал
    // просив би пройти аудит того, хто його вже пройшов.
    const rec = { express: { ...EXPRESS, primary: 'operations' } } as unknown as DiagRecord;
    const d = buildDash(rec, null);
    expect(d.numbers?.leak).toBe(EXPRESS.total);
    expect(d.stage.key, 'стадія відкотилась на «Знайомство»').not.toBe('intro');
    expect(d.next.to, 'просимо пройти аудит, який уже пройдено').not.toBe('audits');
  });

  it('локальний запис має пріоритет над знімком', () => {
    // Локальний свіжіший: людина щойно перерахувала і має побачити нове число.
    const rec = { express: { ...EXPRESS, total: 1 } } as unknown as DiagRecord;
    const d = buildDash(rec, EXPRESS);
    expect(d.numbers?.leak).toBe(EXPRESS.total);
  });
});

describe('стадія проєкту', () => {
  it('порожній запис — знайомство', () => {
    expect(buildDash({}, null).stage.key).toBe('intro');
  });

  it('активний проєкт перекриває стадії аудиту', () => {
    const rec = { projects: [{ id: 'p', title: 'Побудова', status: 'active' }] } as unknown as DiagRecord;
    expect(buildDash(rec, EXPRESS).stage.key).toBe('project:active');
  });

  it('активний проєкт обирається серед кількох', () => {
    const rec = { projects: [
      { id: 'a', status: 'done' }, { id: 'b', status: 'active' }, { id: 'c', status: 'archived' },
    ] } as unknown as DiagRecord;
    expect(activeProject(rec)?.id).toBe('b');
  });

  it('без активного береться незакритий, а не будь-який', () => {
    const rec = { projects: [
      { id: 'a', status: 'done' }, { id: 'b', status: 'paused' },
    ] } as unknown as DiagRecord;
    expect(activeProject(rec)?.id).toBe('b');
  });
});

describe('передане клієнту', () => {
  it('без позначки часу подія не існує', () => {
    /*
     * Те саме правило, що в timeline.ts: показати документ без дати означає
     * вигадати, коли його передали. Порожній блок чесніший.
     */
    const rec = { sharedDocs: [{ id: 'd', title: 'Звіт', at: '' }] } as unknown as DiagRecord;
    expect(buildDash(rec, null).delivered).toEqual([]);
  });

  it('свіже — зверху', () => {
    const rec = { sharedDocs: [
      { id: 'old', title: 'Старий', at: '2026-01-01T00:00:00Z' },
      { id: 'new', title: 'Новий', at: '2026-08-01T00:00:00Z' },
    ] } as unknown as DiagRecord;
    expect(buildDash(rec, null).delivered.map((d) => d.id)).toEqual(['new', 'old']);
  });

  it('передані глави пакета теж рахуються', () => {
    const rec = { packChecklist: { d01: { st: 'delivered', at: '2026-08-01T00:00:00Z' }, d02: { st: 'ready' } } } as unknown as DiagRecord;
    const got = buildDash(rec, null).delivered;
    expect(got).toHaveLength(1);
    expect(got[0].id).toBe('pack:d01');
  });
});

describe('валюта і підписи', () => {
  it('валюта повертається разом із сумою, а не шукається окремо', () => {
    /*
     * Число бралось із buildDash (який уміє впасти на знімок в акаунті), а
     * валюта — з локального запису. Коли локального не було, гривнева сума
     * показувалась зі знаком євро: помилка у сорок разів у тому самому числі,
     * заради якого клієнт відкрив портал.
     */
    const rec = { express: { ...EXPRESS, input: { currency: 'UAH' } } } as unknown as DiagRecord;
    const d = buildDash(rec, null);
    expect(d.numbers?.currency).toBe('UAH');
    expect(d.numbers?.leak).toBe(EXPRESS.total);
  });

  it('файл названий документом, а не своїм описом', () => {
    // У даних `type` — назва («Звіти перевізників»), `title` — що має бути
    // всередині. Взявши title, список читався як уривки без назв.
    const d = buildDash({}, EXPRESS);
    const file = d.pending.find((p) => p.id === 'rf-carriers');
    expect(file?.label).toBe('Звіти перевізників');
    expect(file?.why).toBe('Строки, статуси, пошкодження');
  });

  it('у кожного пункту очікування є куди піти', () => {
    for (const p of buildDash({}, null).pending) {
      expect(p.to, `${p.id}: нема адреси`).toBeTruthy();
      expect(p.label, `${p.id}: нема назви`).toBeTruthy();
    }
  });
});
