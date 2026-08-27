/**
 * Управление составом команды. Защиты бутстрап-super-админа сверялись с полем
 * `email` из ТЕЛА ЗАПРОСА, а действовали по `userId` — гард и действие не были
 * связаны между собой. Достаточно было не прислать email, и бутстрап-super
 * понижался или удалялся вопреки проверке.
 *
 * Это не повышение привилегий извне: дойти сюда может только другой super.
 * Но рейка стоит именно для этого случая — чтобы один промах не оставил
 * команду без доступа к разделу, в котором эту ошибку исправляют.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';

const ORIG = { ...process.env };
const BOOT = 'pashasidorenko18@gmail.com';   // из списка SUPERS по умолчанию
const BOOT_ID = 'u-boot';

afterEach(() => { process.env = { ...ORIG }; vi.unstubAllGlobals(); vi.resetModules(); });

const resStub = () => {
  const r: any = { code: 0, body: null };
  r.status = (c: number) => { r.code = c; return r; };
  r.json = (b: unknown) => { r.body = b; return r; };
  return r;
};

/** Сеть: кто зовёт (super), кто цель (по id), и что случилось с мутацией. */
function net() {
  const calls: { url: string; method: string }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (u: string, o: any = {}) => {
    const s = String(u);
    const method = o.method || 'GET';
    if (s.endsWith('/auth/v1/user'))
      return { ok: true, json: async () => ({ id: 'u-caller', email: 'other@weexp.agency', app_metadata: { role: 'super' } }) };
    if (/\/admin\/users\/[^/]+$/.test(s)) {
      calls.push({ url: s, method });
      if (method === 'GET') {
        const id = s.split('/').pop();
        return { ok: true, json: async () => ({ id, email: id === BOOT_ID ? BOOT : 'plain@weexp.agency' }) };
      }
      return { ok: true, json: async () => ({}) };
    }
    return { ok: true, json: async () => ({}) };
  }));
  return calls;
}

async function call(body: Record<string, unknown>) {
  process.env.SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'srv';
  const { default: handler } = await import(/* @vite-ignore */ '../../../api/team.js' as string);
  const res = resStub();
  await handler({ method: 'POST', headers: { authorization: 'Bearer t' }, body }, res);
  return res;
}
const mutations = (calls: { method: string }[]) => calls.filter((c) => c.method !== 'GET');

describe('бутстрап-super защищён по id, а не по присланной почте', () => {
  it('понижение с честно указанной почтой отклоняется', async () => {
    const calls = net();
    const res = await call({ action: 'set_role', userId: BOOT_ID, email: BOOT, role: 'manager' });
    expect(String(res.body.error)).toMatch(/знизити бутстрап/);
    expect(mutations(calls)).toEqual([]);
  });

  /*
   * Тот же запрос без поля email. Раньше `String(undefined)` давал 'undefined',
   * в SUPERS его нет — и проверка пропускала.
   */
  it('понижение БЕЗ поля email отклоняется тоже', async () => {
    const calls = net();
    const res = await call({ action: 'set_role', userId: BOOT_ID, role: 'manager' });
    expect(String(res.body.error)).toMatch(/знизити бутстрап/);
    expect(mutations(calls), 'роль всё-таки записали').toEqual([]);
  });

  it('понижение с ЧУЖОЙ почтой в теле отклоняется', async () => {
    const calls = net();
    const res = await call({ action: 'set_role', userId: BOOT_ID, email: 'someone@else.com', role: 'manager' });
    expect(String(res.body.error)).toMatch(/знизити бутстрап/);
    expect(mutations(calls)).toEqual([]);
  });

  it('удаление без email отклоняется', async () => {
    const calls = net();
    const res = await call({ action: 'remove', userId: BOOT_ID });
    expect(String(res.body.error)).toMatch(/видалити бутстрап/);
    expect(mutations(calls)).toEqual([]);
  });

  /*
   * Блокировки защиты не было вовсе, хотя заблокированный super не войдёт
   * вообще — команда запирается так же надёжно, как понижением роли.
   */
  it('блокировка бутстрап-super отклоняется', async () => {
    const calls = net();
    const res = await call({ action: 'ban', userId: BOOT_ID, banned: true });
    expect(String(res.body.error)).toMatch(/заблокувати бутстрап/);
    expect(mutations(calls)).toEqual([]);
  });

  it('разблокировать можно — запирает только блокировка', async () => {
    const calls = net();
    const res = await call({ action: 'ban', userId: BOOT_ID, banned: false });
    expect(res.body.ok).toBe(true);
    expect(mutations(calls)).toHaveLength(1);
  });
});

describe('обычные участники управляются как раньше', () => {
  it('роль обычного участника меняется', async () => {
    const calls = net();
    const res = await call({ action: 'set_role', userId: 'u-plain', role: 'manager' });
    expect(res.body.ok).toBe(true);
    expect(mutations(calls)).toHaveLength(1);
  });

  it('обычный участник удаляется', async () => {
    const calls = net();
    const res = await call({ action: 'remove', userId: 'u-plain', email: 'plain@weexp.agency' });
    expect(res.body.ok).toBe(true);
    expect(mutations(calls).map((c) => c.method)).toEqual(['DELETE']);
  });

  it('свою роль сменить нельзя — рейка на месте', async () => {
    const calls = net();
    const res = await call({ action: 'set_role', userId: 'u-caller', role: 'manager' });
    expect(String(res.body.error)).toMatch(/власну роль/);
    expect(mutations(calls)).toEqual([]);
  });
});

describe('когда цель проверить не удалось', () => {
  it('действие отменяется, а не выполняется вслепую', async () => {
    const calls: { method: string }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (u: string, o: any = {}) => {
      const s = String(u); const method = o.method || 'GET';
      if (s.endsWith('/auth/v1/user'))
        return { ok: true, json: async () => ({ id: 'u-caller', email: 'other@weexp.agency', app_metadata: { role: 'super' } }) };
      if (/\/admin\/users\/[^/]+$/.test(s)) {
        if (method === 'GET') return { ok: false, status: 503, json: async () => ({}) };
        calls.push({ method });
        return { ok: true, json: async () => ({}) };
      }
      return { ok: true, json: async () => ({}) };
    }));
    process.env.SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'srv';
    const { default: handler } = await import(/* @vite-ignore */ '../../../api/team.js' as string);
    const res = resStub();
    await handler({ method: 'POST', headers: { authorization: 'Bearer t' }, body: { action: 'remove', userId: 'u-any' } }, res);
    expect(String(res.body.error)).toMatch(/Не вдалося перевірити/);
    expect(calls).toEqual([]);
  });
});

describe('доступ', () => {
  it('не-super не проходит', async () => {
    vi.stubGlobal('fetch', vi.fn(async (u: string) => (String(u).endsWith('/auth/v1/user')
      ? { ok: true, json: async () => ({ id: 'u-x', email: 'manager@weexp.agency', app_metadata: { role: 'manager' } }) }
      : { ok: true, json: async () => ({}) })));
    const res = await call({ action: 'remove', userId: BOOT_ID });
    expect(res.code).toBe(403);
  });
});
