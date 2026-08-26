import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Тести на ЗАПИС (E6). Логіка стадій уже під тестами, а помилки збереження —
 * ні, хоча саме вони коштували найдорожче: мовчазний відмовний запис із зеленим
 * тостом, затирання правки колеги, відкат при конфлікті.
 *
 * Supabase мокаємо на рівні query-builder'а: перевіряємо не мережу, а те, які
 * рішення приймає mutateRecord.
 */
type Row = { data: Record<string, unknown> } | null;

const state: { row: Row; updates: Record<string, unknown>[]; allowUpdate: boolean; versionSkew: boolean } = {
  row: null, updates: [], allowUpdate: true, versionSkew: false,
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    from: () => builder(),
    storage: { from: () => ({ remove: async () => ({ error: null }) }) },
  }),
}));

/**
 * Чейнабельна заглушка query-builder'а PostgREST: збирає операцію, а await
 * повертає результат. Так тест перевіряє саме рішення mutateRecord (чи є
 * умова версії, чи перечитує запис, чи бачить нуль оновлених рядків).
 */
function builder() {
  const op: { kind: 'select' | 'update' | 'delete'; filters: Record<string, unknown>; patch?: Record<string, unknown> } = {
    kind: 'select', filters: {},
  };
  const run = () => {
    if (op.kind === 'update') {
      const guard = op.filters['data->>updatedAt'];
      const current = (state.row?.data as { updatedAt?: string } | undefined)?.updatedAt;
      const versionOk = guard === undefined || guard === current;
      if (!state.allowUpdate || !versionOk) return { data: [], error: null };
      state.updates.push(op.patch as Record<string, unknown>);
      state.row = { data: (op.patch as { data: Record<string, unknown> }).data };
      return { data: [{ user_id: 'u1' }], error: null };
    }
    if (op.kind === 'delete') { state.row = null; return { data: [{ user_id: 'u1' }], error: null }; }
    return { data: state.row ? [state.row] : [], error: null };
  };
  const api = {
    select: () => api,
    eq: (col: string, val: unknown) => { op.filters[col] = val; return api; },
    neq: () => api,
    order: () => api,
    limit: () => api,
    range: () => api,
    update: (patch: Record<string, unknown>) => { op.kind = 'update'; op.patch = patch; return api; },
    insert: () => api,
    delete: () => { op.kind = 'delete'; return api; },
    maybeSingle: async () => ({ data: state.row, error: null }),
    then: (resolve: (v: unknown) => void) => resolve(run()),
  };
  return api;
}

const load = async () => {
  vi.resetModules();
  return import('@/lib/supa');
};

beforeEach(() => {
  state.row = { data: { updatedAt: '2026-01-01T00:00:00.000Z', accessLog: { 'AC-GA4': { status: 'granted' } } } };
  state.updates = []; state.allowUpdate = true;
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
});

describe('savePatchFor', () => {
  it('відмова RLS — це помилка, а не тихий успіх', async () => {
    const { savePatchFor } = await load();
    state.allowUpdate = false;
    const r = await savePatchFor('u1', { notes: [] });
    expect(r.ok).toBe(false);
    expect(String(r.error)).toMatch(/RLS|політик/i);
  });

  it('успішний запис зберігає патч і оновлює мітку часу', async () => {
    const { savePatchFor } = await load();
    const r = await savePatchFor('u1', { auditClosedAt: '2026-05-05' });
    expect(r.ok).toBe(true);
    const written = state.updates[0].data as Record<string, unknown>;
    expect(written.auditClosedAt).toBe('2026-05-05');
    expect(written.updatedAt).not.toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('mergeMapFor', () => {
  it('не затирає сусідні ключі, які правив колега', async () => {
    const { mergeMapFor } = await load();
    // Колега вже додав AC-CRM, поки ми правили AC-GA4.
    state.row = { data: { updatedAt: '2026-01-01T00:00:00.000Z', accessLog: { 'AC-GA4': { status: 'granted' }, 'AC-CRM': { status: 'na' } } } };
    const r = await mergeMapFor('u1', 'accessLog', { 'AC-GA4': { status: 'verified' } } as never);
    expect(r.ok).toBe(true);
    const log = (state.updates[0].data as { accessLog: Record<string, { status: string }> }).accessLog;
    expect(log['AC-GA4'].status).toBe('verified');   // наша правка
    expect(log['AC-CRM'].status).toBe('na');         // правка колеги ціла
  });
});

describe('оптимістична конкурентність', () => {
  it('конфлікт версій → правку накладають на СВІЖИЙ запис, а не затирають', async () => {
    const { mutateRecord } = await load();
    // Перше читання бачить версію A. Поки ми «думали», колега записав версію B
    // зі своїм полем — умова версії не спрацює, і має піти повтор на свіжому.
    state.row = { data: { updatedAt: 'A', keptByColleague: 'важливо' } };
    let firstPass = true;
    const r = await mutateRecord('u1', (rec) => {
      if (firstPass) { firstPass = false; state.row = { data: { updatedAt: 'B', keptByColleague: 'важливо' } }; }
      return { ...rec, mine: 'моє' };
    });
    expect(r.ok).toBe(true);
    const written = state.updates[state.updates.length - 1].data as Record<string, unknown>;
    expect(written.mine).toBe('моє');                    // наша зміна дійшла
    expect(written.keptByColleague).toBe('важливо');     // чуже не зникло
    expect(state.updates.length).toBe(1);                // перша спроба нічого не записала
  });

  it('нуль рядків без зміни версії читається як RLS, а не як конфлікт', async () => {
    const { mutateRecord } = await load();
    state.allowUpdate = false;
    const r = await mutateRecord('u1', (rec) => ({ ...rec, x: 1 }));
    expect(r.ok).toBe(false);
    expect(String(r.error)).toMatch(/RLS/);
  });
});
