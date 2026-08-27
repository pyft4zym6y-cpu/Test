/**
 * Ответ /api/ga4 идёт прямо в рычаги baseline с источником «GA4» — то есть с
 * уровнем достоверности E3, «данные системы» (доверие 90 из 100). Всё, что
 * отсюда выходит, аудит считает измеренным фактом.
 *
 * Свойство GA4 без событий purchase (очень частый случай: аналитика стоит,
 * электронная торговля не настроена) отдаёт сессии и нули по заказам. Раньше
 * эти нули превращались в «CR 0%» и «чек 0 ₴» и ложились в рычаги как замер.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';

// Настоящий ключ, а не заглушка: подпись сервисного аккаунта — часть пути,
// по которому эти числа попадают в отчёт, и подменять её нечестно.
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });

const ORIG = { ...process.env };
afterEach(() => { process.env = { ...ORIG }; vi.unstubAllGlobals(); vi.resetModules(); });

const resStub = () => {
  const r: any = { code: 0, body: null };
  r.status = (c: number) => { r.code = c; return r; };
  r.json = (b: unknown) => { r.body = b; return r; };
  r.setHeader = () => r; r.end = () => r;
  return r;
};

/**
 * Маршрут закрыт requireStaff, а тот спрашивает Supabase, кто пришёл. Подменяем
 * не проверку доступа, а сам ответ Supabase: так тест идёт ровно тем путём, что
 * и прод, и заодно держит сам факт, что ручка закрыта.
 */
const STAFF = { headers: { authorization: 'Bearer t' }, method: 'GET', query: {} };
function stubNetwork(metricValues: { value: string }[] | null) {
  process.env.SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'srv';
  vi.stubGlobal('fetch', vi.fn(async (u: string) => {
    const s = String(u);
    if (s.includes('/auth/v1/user')) return { ok: true, json: async () => ({ id: 'u1', email: 'a@weexp.agency', app_metadata: { role: 'admin' } }) };
    if (s.includes('rpc/weexp_rate_ok')) return { ok: true, json: async () => true };
    if (s.includes('oauth2')) return { ok: true, json: async () => ({ access_token: 't' }) };
    return { ok: true, json: async () => (metricValues ? { rows: [{ metricValues }] } : { rows: [] }) };
  }));
}

/** Легаси-ветка (baseline сайта weexp через сервисный аккаунт): GET /api/ga4. */
async function callLegacy(metricValues: { value: string }[] | null) {
  process.env.GA4_PROPERTY_ID = '123';
  process.env.GA4_SA_EMAIL = 'sa@x.iam.gserviceaccount.com';
  process.env.GA4_SA_KEY = privateKey;
  stubNetwork(metricValues);
  const { default: handler } = await import(/* @vite-ignore */ '../../../api/ga4.js' as string);
  const res = resStub();
  await handler({ ...STAFF }, res);
  return res.body;
}

const V = (sessions: string, transactions: string, revenue: string) =>
  [{ value: sessions }, { value: transactions }, { value: revenue }];

describe('GA4 baseline', () => {
  it('рабочий магазин: конверсия и чек считаются', async () => {
    const b = await callLegacy(V('120000', '3600', '5400000'));
    expect(b.sessionsMonthly).toBe(40000);
    expect(b.ordersMonthly).toBe(1200);
    expect(b.cr).toBe(3);
    expect(b.aov).toBe(1500);
    expect(b.ecommerce).toBe(true);
    expect(b.note).toBeNull();
  });

  /*
   * Ключевой случай: аналитика работает, электронной торговли в ней нет.
   * «CR 0%» и «чек 0 ₴» — это не измерение, а его отсутствие, и попадать в
   * рычаг с меткой «данные системы» они не должны.
   */
  it('GA4 без событий purchase: конверсия и чек не выдаются за ноль', async () => {
    const b = await callLegacy(V('120000', '0', '0'));
    expect(b.sessionsMonthly).toBe(40000);   // сессии измерены — их отдаём
    expect(b.cr).toBeNull();
    expect(b.aov).toBeNull();
    expect(b.ecommerce).toBe(false);
    expect(b.note).toMatch(/purchase/i);
  });

  it('свойство без данных вовсе: сказано, что данных нет', async () => {
    const b = await callLegacy(null);
    expect(b.sessionsMonthly).toBe(0);
    expect(b.cr).toBeNull();
    expect(b.aov).toBeNull();
    expect(b.note).toMatch(/ни одной сессии/i);
  });

  it('не настроен — это ошибка с инструкцией, а не нули', async () => {
    stubNetwork(null);
    delete process.env.GA4_PROPERTY_ID;
    delete process.env.GA4_SA_EMAIL;
    delete process.env.GA4_SA_KEY;
    const { default: handler } = await import(/* @vite-ignore */ '../../../api/ga4.js' as string);
    const res = resStub();
    await handler({ ...STAFF }, res);
    expect(res.body.error).toMatch(/GA4_PROPERTY_ID/);
    expect(res.body.cr).toBeUndefined();
  });

  it('без входа данные клиента не отдаются', async () => {
    stubNetwork(V('120000', '3600', '5400000'));
    const { default: handler } = await import(/* @vite-ignore */ '../../../api/ga4.js' as string);
    const res = resStub();
    await handler({ method: 'GET', query: {}, headers: {} }, res);  // токена нет
    expect(res.code).toBe(401);
    expect(res.body.sessionsMonthly).toBeUndefined();
  });
});
