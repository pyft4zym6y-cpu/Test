/**
 * Надсилання повного звіту про клієнта команді (на пошту). Фронт не має SMTP,
 * тож шлемо структурований payload на конфігурований вебхук
 * (VITE_REPORT_WEBHOOK — Formspree / Make / n8n / Supabase Edge Function), який
 * і відправляє лист. Якщо вебхук не заданий — не блокуємо клієнта: повертаємо
 * mode:'saved' (дані вже в кабінеті), команда забирає їх із таблиці diagnostics.
 */
export type ReportPayload = {
  email: string;
  site?: string;
  stage1Money?: [number, number];
  overall: number;
  bottleneck: { label: string; score: number };
  epiphany: string;
  goals: string[];
  pains: { label: string; detail: string }[];
  roadmap: { title: string; detail: string }[];
  competitors: { direct: string[]; indirect: string[] };
  likes: { url: string; what: string[] }[];
  marketing: { label: string; value: string }[];
  finance: { label: string; value: string }[];
  completeness: number;
  createdAt: string;
};

const WEBHOOK = (import.meta.env.VITE_REPORT_WEBHOOK as string | undefined) || '';

export async function sendReport(payload: ReportPayload): Promise<{ ok: boolean; mode: 'sent' | 'saved' }> {
  if (!WEBHOOK) return { ok: true, mode: 'saved' };
  try {
    const res = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ subject: `WEEXP — новий Tier-2 лід: ${payload.email}`, ...payload }),
    });
    return { ok: res.ok, mode: 'sent' };
  } catch {
    return { ok: false, mode: 'saved' };
  }
}
