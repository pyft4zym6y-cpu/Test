import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LEAD_STAGES, FUNNEL } from '../shared';

/**
 * Зеркало админки для Wix (`wix/weexp-admin-wix.html`) — отдельный самодостаточный
 * файл: ни сборки, ни импортов из src. Значит, всё, что он повторяет за
 * приложением (ключи Supabase, названия стадий), расходится молча — увидеть это
 * можно только тестом. Плюс главное: убедиться, что в публичный файл никогда
 * не попадёт серверный ключ.
 */
const ROOT = resolve(__dirname, '../../../../..');
const html = readFileSync(resolve(ROOT, 'wix/weexp-admin-wix.html'), 'utf8');

describe('wix-зеркало: безопасность файла', () => {
  it('не содержит серверных ключей', () => {
    expect(html).not.toMatch(/service_role/i);
    expect(html).not.toMatch(/sb_secret/i);
    expect(html).not.toMatch(/SUPABASE_SERVICE|ANTHROPIC_API_KEY|RESEND_API_KEY/i);
    // JWT с ролью service_role — второй способ протащить тот же ключ.
    expect(html).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./);
  });
  it('не индексируется поисковиками', () => {
    expect(html).toMatch(/<meta name="robots" content="noindex/);
  });
});

describe('wix-зеркало: не разошлось с приложением', () => {
  const supa = readFileSync(resolve(__dirname, '../../../lib/supa.ts'), 'utf8');
  const pick = (src: string, re: RegExp) => { const m = src.match(re); expect(m).toBeTruthy(); return m![1]; };

  it('смотрит в тот же проект Supabase, что и сайт', () => {
    expect(pick(html, /SUPA_URL\s*=\s*'([^']+)'/)).toBe(pick(supa, /FALLBACK_URL\s*=\s*'([^']+)'/));
    expect(pick(html, /SUPA_ANON\s*=\s*'([^']+)'/)).toBe(pick(supa, /FALLBACK_ANON\s*=\s*'([^']+)'/));
  });

  it('стадии заявок совпадают со shared.tsx', () => {
    for (const s of LEAD_STAGES) {
      expect(html).toContain(`k:'${s.k}'`);
      expect(html).toContain(`l:'${s.l}'`);
    }
    // и наоборот: в зеркале нет стадии, которой уже нет в приложении
    const keys = [...html.matchAll(/\{ k:'([a-z_]+)',\s+l:'/g)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(0);
    const known = new Set<string>([...LEAD_STAGES.map((s) => s.k), ...FUNNEL.map((f) => f.k)]);
    for (const k of keys) expect(known.has(k), `лишняя стадия «${k}»`).toBe(true);
  });

  it('стадии клиентской воронки совпадают со shared.tsx', () => {
    for (const f of FUNNEL) { expect(html).toContain(`k:'${f.k}'`); expect(html).toContain(`l:'${f.l}'`); }
  });
});

/* ── Поведение: код действительно поднимается и рисует то, что должен ── */
type Res = { data: unknown; error: { message: string } | null };
const LEADS = [
  { id: 'l1', created_at: '2026-08-20T10:00:00Z', email: 'a@shop.ua', name: 'Анна', status: 'new', source: 'form', task: 'Падає конверсія' },
  { id: 'l2', created_at: '2026-08-19T10:00:00Z', email: 'b@shop.ua', name: 'Богдан', status: 'done', deal: { coopType: 'audit' } },
];
const DIAG = [{ user_id: 'u9', email: 'c@shop.ua', company: { name: 'Крамниця' }, funnel: { tierStatus: { DEEP: 'granted' } }, updatedAt: '2026-08-21T10:00:00Z' }];

/** Что возвращает обновление заявки: пусто = RLS отказала (наш проверяемый случай). */
let updateRows: unknown[] = [];

function fakeClient() {
  const make = (table: string) => {
    let upd = false;
    const o: Record<string, unknown> = {
      then: (res: (r: Res) => void, rej: (e: unknown) => void) => Promise.resolve(
        upd ? { data: updateRows, error: null }
            : { data: table === 'leads' ? LEADS : DIAG, error: null },
      ).then(res, rej),
    };
    for (const m of ['select', 'order', 'limit', 'eq']) o[m] = () => o;
    o.update = () => { upd = true; return o; };
    return o;
  };
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      signInWithPassword: async () => ({ data: { user: { id: 'u1', email: 'hello@weexp.agency', app_metadata: {} } }, error: null }),
      signOut: async () => ({}),
    },
    from: (t: string) => make(t),
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('wix-зеркало: работает', () => {
  let app: HTMLElement;
  beforeAll(async () => {
    const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>')).replace(/<script[\s\S]*?<\/script>/g, '');
    document.body.innerHTML = body;
    const mod = html.match(/<script type="module">([\s\S]*?)<\/script>/)![1]
      .replace(/^import .*$/m, 'const createClient = globalThis.__mkClient;');
    (globalThis as unknown as Record<string, unknown>).__mkClient = fakeClient;
    new Function(mod)();
    await tick();
    app = document.getElementById('app')!;
  });

  it('без сессии показывает вход, а не пустую панель', () => {
    expect(app.querySelector('form.auth')).toBeTruthy();
    expect(app.querySelector('input[type=password]')).toBeTruthy();
  });

  it('после входа рисует заявки по стадиям', async () => {
    (app.querySelector('input[type=email]') as HTMLInputElement).value = 'hello@weexp.agency';
    (app.querySelector('input[type=password]') as HTMLInputElement).value = 'x';
    app.querySelector('form.auth')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await tick(); await tick(); await tick();
    expect(app.textContent).toContain('Анна');
    expect(app.textContent).toContain('Нова');
    expect(app.textContent).toContain('Завершена');
    expect(app.querySelector('.msg.bad')).toBeNull();      // ошибок не выдумали
  });

  it('отказ RLS при смене стадии не выглядит успехом', async () => {
    (app.querySelector('[data-act="lead"][data-id="l1"]') as HTMLElement).click();
    await tick();
    const btn = app.querySelector('[data-act="stage"][data-k="qualified"]') as HTMLElement;
    expect(btn).toBeTruthy();
    updateRows = [];                                        // 200 OK и ноль строк
    btn.click();
    await tick(); await tick();
    expect(app.querySelector('.msg.bad')?.textContent).toMatch(/RLS/);
  });

  it('успешная смена стадии подтверждается', async () => {
    updateRows = [{ id: 'l1' }];
    (app.querySelector('[data-act="stage"][data-k="qualified"]') as HTMLElement).click();
    await tick(); await tick();
    expect(app.querySelector('.msg.bad')).toBeNull();
    expect(app.textContent).toContain('Стадію змінено');
  });

  it('вкладка «Клієнти» показывает клиента и его стадию воронки', async () => {
    (app.querySelector('[data-act="close"]') as HTMLElement)?.click();
    (app.querySelector('[data-act="tab"][data-k="clients"]') as HTMLElement).click();
    await tick();
    expect(app.textContent).toContain('Крамниця');
    expect(app.textContent).toContain('Аудит у роботі');   // tierStatus DEEP=granted
  });
});
