/**
 * Щоденна перевірка SLA — единственное, что замечает зависшую заявку, пока
 * админку никто не открыл. Проверялись до сих пор только пороги (slaSync), не
 * сам механизм.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';

const ORIG = { ...process.env };
afterEach(() => { process.env = { ...ORIG }; vi.unstubAllGlobals(); vi.resetModules(); });

const DAY = 86_400_000;
const ago = (d: number) => new Date(Date.now() - d * DAY).toISOString();

const resStub = () => {
  const r: any = { code: 0, body: null };
  r.status = (c: number) => { r.code = c; return r; };
  r.json = (b: unknown) => { r.body = b; return r; };
  return r;
};

/** Одна строка выдачи PostgREST: поля выбираются как data->key. */
const row = (over: Record<string, unknown>) => ({ user_id: 'u1', email: 'c@x.ua', ...over });

/**
 * Гоняем настоящий обработчик: подменяем только сеть. notifyOk управляет тем,
 * прошло ли письмо, — это отдельная от расчёта вещь, и её надо видеть.
 */
async function run(rows: Record<string, unknown>[], { notifyOk = true, notifyBody = {} as any } = {}) {
  process.env.SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'srv';
  process.env.CRON_SECRET = 'sekret';
  let served = false;
  vi.stubGlobal('fetch', vi.fn(async (u: string) => {
    const s = String(u);
    if (s.includes('/api/notify')) return { ok: notifyOk, status: notifyOk ? 200 : 500, json: async () => notifyBody };
    if (s.includes('/rest/v1/diagnostics')) {
      if (served) return { ok: true, json: async () => [] };
      served = true;
      return { ok: true, json: async () => rows };
    }
    return { ok: true, json: async () => ({}) };
  }));
  const { default: handler } = await import(/* @vite-ignore */ '../../../api/sla.js' as string);
  const res = resStub();
  await handler({ method: 'GET', headers: { authorization: 'Bearer sekret' }, query: {} }, res);
  return res.body;
}

/** Заявка на стадии «Нова»: стадия двинулась N дней назад. */
const newRequest = (movedDaysAgo: number, touchedDaysAgo = movedDaysAgo) => row({
  funnel: { tierStatus: { DEEP: 'requested' }, tierHistory: { DEEP: [{ at: ago(movedDaysAgo) }] } },
  updatedAt: ago(touchedDaysAgo),
});

describe('часы SLA считают движение стадии, а не любую запись', () => {
  it('заявка, стоящая 9 дней при нормативе 2, — просрочена', async () => {
    const b = await run([newRequest(9)]);
    expect(b.overdue).toBe(1);
    expect(b.items[0].days).toBe(9);
  });

  /*
   * Ключевой случай. updatedAt бумкает на любом записи, в том числе на
   * автосохранении профиля компании, которое делает сам клиент в своём
   * кабинете. Раньше updatedAt входил в источники часов, и активность клиента
   * прятала наш просроченный срок: та же заявка показывала 0 дней и «в норме».
   */
  it('клиент, который печатает у себя, не обнуляет наш просроченный срок', async () => {
    const b = await run([newRequest(9, 0)]);   // стадия стоит 9 дней, запись тронута сегодня
    expect(b.overdue).toBe(1);
    expect(b.items[0].days).toBe(9);
  });

  it('стадия, которая двинулась вчера, не просрочена', async () => {
    const b = await run([newRequest(0)]);
    expect(b.overdue).toBe(0);
  });

  it('порог предупреждения срабатывает раньше порога нарушения', async () => {
    const b = await run([newRequest(1)]);      // norm: warn 1, breach 2
    expect(b.soon).toBe(1);
    expect(b.overdue).toBe(0);
  });

  it('для старой записи без отметок движения берётся updatedAt — но это видно', async () => {
    const b = await run([row({ funnel: { tierStatus: { DEEP: 'requested' } }, updatedAt: ago(9) })]);
    expect(b.overdue).toBe(1);
    expect(b.noClock).toBe(0);
  });

  /*
   * Испорченная дата давала NaN, а NaN не проходит ни одно сравнение с
   * порогом: запись тихо выпадала из проверки вместо того, чтобы в ней
   * оказаться. «Просрочено 0» одинаково означало «ничего не стоит» и «ничего
   * не смогли посчитать».
   */
  it('запись с непригодной датой попадает в счётчик, а не исчезает', async () => {
    const b = await run([row({ funnel: { tierStatus: { DEEP: 'requested' } }, updatedAt: 'не дата' })]);
    expect(b.noClock).toBe(1);
    expect(b.overdue).toBe(0);
  });
});

describe('отказ отправки письма не выдаётся за успех', () => {
  it('письмо ушло — ok', async () => {
    const b = await run([newRequest(9)]);
    expect(b.mailed).toBe(true);
    expect(b.ok).toBe(true);
  });

  /*
   * Письмо — весь продукт этой проверки. Отправка была `.catch(() => {})`:
   * отказ /api/notify глотался, ответ говорил ok, а в журнал шло «проверено N,
   * просрочено M» — так, будто письмо ушло.
   */
  it('письмо не ушло — это не ok', async () => {
    const b = await run([newRequest(9)], { notifyOk: false });
    expect(b.mailed).toBe(false);
    expect(b.ok).toBe(false);
    expect(String(b.mailError)).toMatch(/500/);
  });

  it('notify ответил 200 с полем error — тоже не отправка', async () => {
    const b = await run([newRequest(9)], { notifyBody: { error: 'Уведомления не настроены' } });
    expect(b.mailed).toBe(false);
    expect(String(b.mailError)).toMatch(/не настроены/);
  });

  it('слать было нечего — не отказ и не успех', async () => {
    const b = await run([newRequest(0)]);
    expect(b.mailed).toBeNull();
    expect(b.ok).toBe(true);
  });
});

describe('доступ', () => {
  it('без секрета крона и без сессии команды данные не отдаются', async () => {
    process.env.CRON_SECRET = 'sekret';
    process.env.SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'srv';
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })));
    const { default: handler } = await import(/* @vite-ignore */ '../../../api/sla.js' as string);
    const res = resStub();
    await handler({ method: 'GET', headers: {}, query: {} }, res);
    expect(res.code).toBe(401);
    expect(res.body.checked).toBeUndefined();
  });
});
