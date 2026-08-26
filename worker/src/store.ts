/**
 * Коннектор аудитор ↔ Supabase портала (единый хаб данных). Работает с
 * СУЩЕСТВУЮЩЕЙ схемой опросника (`portal/supabase/schema.sql`), без дублей:
 *   читает  clients (имя) + answers (ответы опросника по client_id)
 *   пишет   report_meta (итог: summary + l0{runId,metrics,files}) — оттуда портал
 *           показывает результат клиенту/оператору.
 *
 * Включается переменными окружения того же проекта Supabase, что и портал:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY  (service role — только на сервере).
 * Нет переменных — коннектор выключен, аудитор работает как раньше (ввод в форме).
 */
const URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_KEY;

export const storeEnabled = (): boolean => Boolean(URL && KEY);

export type ClientBundle = {
  name?: string;
  answers?: Record<string, string> | null; // {question_id: answer} — из таблицы answers
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

/** Тянет имя клиента и его ответы опросника. null — если выключено/не найдено/ошибка. */
export async function getClientBundle(clientId: string): Promise<ClientBundle | null> {
  if (!storeEnabled() || !clientId) return null;
  try {
    const id = encodeURIComponent(clientId);
    const [cRes, aRes] = await Promise.all([
      rest(`clients?id=eq.${id}&select=name&limit=1`),
      rest(`answers?client_id=eq.${id}&select=question_id,answer&limit=2000`),
    ]);
    let name: string | undefined;
    if (cRes.ok) { const rows = (await cRes.json()) as any[]; name = rows?.[0]?.name ?? undefined; }
    let answers: Record<string, string> | null = null;
    if (aRes.ok) {
      const rows = (await aRes.json()) as { question_id: string; answer: string | null }[];
      if (Array.isArray(rows) && rows.length) {
        answers = {};
        for (const r of rows) if (r.question_id && r.answer != null && r.answer !== '') answers[r.question_id] = r.answer;
      }
    }
    if (name === undefined && !answers) return null;
    return { name, answers };
  } catch { return null; }
}

export type RunRecord = { runId: string; summary: string; metrics: unknown; files: { name: string; url: string }[] };

/** Пишет итог прогона в report_meta клиента (upsert по client_id). best-effort. */
export async function saveRun(clientId: string, run: RunRecord): Promise<boolean> {
  if (!storeEnabled() || !clientId) return false;
  try {
    const r = await rest('report_meta?on_conflict=client_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        client_id: clientId,
        status: 'ready',
        summary: run.summary,
        l0: { runId: run.runId, metrics: run.metrics, files: run.files, updatedAt: new Date().toISOString() },
      }),
    });
    return r.ok;
  } catch { return false; }
}

/**
 * Прогін у власну таблицю `audit_runs`. Окремо від report_meta, бо той звʼязаний
 * зовнішнім ключем із таблицею clients ПОРТАЛУ: прогони, запущені з адмінки
 * сайту (де клієнт — це auth uid у diagnostics), туди не вставлялись взагалі, і
 * єдиним слідом лишалися файли на диску контейнера.
 * best-effort: жодна помилка тут не має ламати прогін.
 */
export async function saveRunRow(ownerKey: string | undefined, run: RunRecord & { site?: string; tier?: number; health?: number | null }): Promise<boolean> {
  if (!storeEnabled()) return false;
  try {
    const r = await rest('audit_runs?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: run.runId,
        owner_key: ownerKey || null,
        site: run.site ?? null,
        tier: run.tier ?? null,
        status: 'done',
        summary: run.summary,
        health: run.health ?? null,
        metrics: run.metrics,
        files: run.files,
      }),
    });
    return r.ok;
  } catch { return false; }
}
