/**
 * Коннектор аудитор ↔ Supabase (хаб данных). Делает «карточку клиента» источником
 * правды: аудитор ЧИТАЕТ вход по clientId (сайт, конкуренты, ответы опросника,
 * baseline) и ПИШЕТ результат прогона обратно — чтобы и оператор, и клиент видели
 * итог из одного места, без ручного переноса.
 *
 * Через Supabase REST (без SDK). Включается переменными окружения:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY  (service role — только на сервере).
 * Схема таблиц — worker/supabase/audit-schema.sql. Если переменных нет — коннектор
 * выключен, аудитор работает как раньше (данные вводятся в форме).
 */
const URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_KEY;

export const storeEnabled = (): boolean => Boolean(URL && KEY);

export type ClientBundle = {
  site?: string;
  competitors?: string[];
  request?: string;
  tier?: number;
  answers?: Record<string, unknown> | null;
  baseline?: unknown;
};

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY as string,
      Authorization: `Bearer ${KEY}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

/** Тянет вход аудита по карточке клиента. null — если выключено/не найдено/ошибка. */
export async function getClientBundle(clientId: string): Promise<ClientBundle | null> {
  if (!storeEnabled() || !clientId) return null;
  try {
    const r = await rest(`audit_clients?id=eq.${encodeURIComponent(clientId)}&select=site,competitors,request,tier,answers,baseline&limit=1`);
    if (!r.ok) return null;
    const rows = (await r.json()) as any[];
    const row = rows?.[0];
    if (!row) return null;
    return {
      site: row.site ?? undefined,
      competitors: Array.isArray(row.competitors) ? row.competitors : undefined,
      request: row.request ?? undefined,
      tier: typeof row.tier === 'number' ? row.tier : undefined,
      answers: row.answers ?? null,
      baseline: row.baseline ?? null,
    };
  } catch { return null; }
}

export type RunRecord = { runId: string; summary: string; metrics: unknown; files: { name: string; url: string }[] };

/** Пишет результат прогона в карточку клиента (best-effort — не роняет аудит). */
export async function saveRun(clientId: string, run: RunRecord): Promise<boolean> {
  if (!storeEnabled() || !clientId) return false;
  try {
    const r = await rest('audit_runs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ client_id: clientId, run_id: run.runId, summary: run.summary, metrics: run.metrics, files: run.files }),
    });
    return r.ok;
  } catch { return false; }
}
