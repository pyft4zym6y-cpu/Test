/**
 * Лимит частоты — единственное, что стоит между залипшей кнопкой и счётом за
 * Anthropic, прогоном Playwright на Railway и квотой Google: на нём висят шесть
 * эндпоинтов, четыре из них тратят деньги.
 *
 * Он пропускает запрос на любом сбое, и это правильно — сломанная форма хуже
 * пропущенного лимита. Неправильным было другое: три разных состояния («не
 * настроен», «миграция не применена», «база не ответила») выглядели снаружи
 * одинаково — как разрешение. Узнать, что счётчик не работал ни дня, было
 * неоткуда.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// @ts-expect-error — JS-модуль без типов
import { rateOk, staffRateLimited, clientIp, limiterState } from '../../../api/_lib/guard.js';

const req = (ip = '1.2.3.4') => ({ headers: { 'x-forwarded-for': ip } });
const resStub = () => {
  const r: any = { code: 0, body: null };
  r.status = (c: number) => { r.code = c; return r; };
  r.json = (b: unknown) => { r.body = b; return r; };
  return r;
};
const env = { ...process.env };
beforeEach(() => {
  process.env.SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});
afterEach(() => { process.env = { ...env }; vi.unstubAllGlobals(); });

describe('ключ лимита', () => {
  it('IP берётся из первого x-forwarded-for', () => {
    expect(clientIp({ headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1' } })).toBe('9.9.9.9');
  });
  it('без заголовков — unknown, а не падение', () => {
    expect(clientIp({})).toBe('unknown');
  });
  it('команда лимитируется по id, а не по общему офисному IP', async () => {
    const seen: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_u: string, o: any) => {
      seen.push(JSON.parse(o.body).p_key);
      return { ok: true, json: async () => true };
    }));
    await staffRateLimited(req(), resStub(), { id: 'u-1', email: 'a@b.c' }, 'ai-draft', 30);
    await staffRateLimited(req(), resStub(), { id: 'u-2', email: 'd@e.f' }, 'ai-draft', 30);
    expect(seen).toEqual(['u-1', 'u-2']);
  });
});

describe('состояние лимита видно снаружи', () => {
  it('не настроен — режим off, запрос пропущен', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(await rateOk(req(), 'lead', 10)).toBe(true);
    expect(limiterState.mode).toBe('off');
    expect(limiterState.reason).toMatch(/SERVICE_ROLE_KEY/);
  });

  it('миграция не применена (404) — режим degraded, а не «всё в порядке»', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    expect(await rateOk(req(), 'lead', 10)).toBe(true);
    expect(limiterState.mode).toBe('degraded');
    expect(limiterState.reason).toMatch(/rate-limit\.sql/);
  });

  it('база не ответила — тоже degraded, с причиной', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED'); }));
    expect(await rateOk(req(), 'lead', 10)).toBe(true);
    expect(limiterState.mode).toBe('degraded');
    expect(limiterState.reason).toMatch(/ECONNREFUSED/);
  });

  it('работает — режим on', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => true })));
    expect(await rateOk(req(), 'lead', 10)).toBe(true);
    expect(limiterState.mode).toBe('on');
  });
});

describe('лимит срабатывает', () => {
  it('исчерпан — запрос отклоняется', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => false })));
    expect(await rateOk(req(), 'lead', 10)).toBe(false);
  });

  it('команде отдаётся 429 с названным лимитом и окном', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => false })));
    const res = resStub();
    expect(await staffRateLimited(req(), res, { id: 'u-1' }, 'audit-start', 10, 3600)).toBe(true);
    expect(res.code).toBe(429);
    expect(String(res.body.error)).toMatch(/ліміт 10 за 60 хв/);
  });

  it('в пределах лимита команда не отклоняется', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => true })));
    const res = resStub();
    expect(await staffRateLimited(req(), res, { id: 'u-1' }, 'audit-start', 10)).toBe(false);
    expect(res.code).toBe(0);
  });
});
