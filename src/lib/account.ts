/*
 * Кабінет клієнта — легка клієнтська сесія та сховище (MVP на localStorage).
 * Архітектурно відокремлено, щоб згодом підключити реальну авторизацію (magic-link
 * / Supabase) без переписування UI: замінюється лише реалізація цих функцій.
 *
 * ЧЕСНО: це MVP без серверної автентифікації — вхід за email лише позначає локальну
 * сесію в цьому браузері (як демо-режим). Реальні доступи/дані — на наступному кроці.
 */

const SESSION_KEY = 'weexp-account-v1';
const COMPANY_KEY = 'weexp-company-v1';
const AUDIT_KEY = 'weexp-audit-v1'; // пише калькулятор аудиту

export type Session = { email: string; name?: string; loggedInAt: string };
export type Company = {
  name: string; site: string; niche: string; revenue: string;
  channels: string[]; contactName: string; contactPhone: string; notes: string;
};
export type AuditRecord = {
  id: string; kind: 'express' | 'deep'; at: string; niche: string;
  potentialCons: number | null; confidence: number | null; raw?: unknown;
};

const read = <T,>(k: string): T | null => {
  try { return JSON.parse(localStorage.getItem(k) || 'null') as T; } catch { return null; }
};
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } };

/* ── сесія ── */
export const getSession = (): Session | null => read<Session>(SESSION_KEY);
export function login(email: string, name?: string): Session {
  const s: Session = { email: email.trim().toLowerCase(), name, loggedInAt: new Date().toISOString() };
  write(SESSION_KEY, s);
  return s;
}
export function logout() { localStorage.removeItem(SESSION_KEY); }

/* ── профіль компанії ── */
export const EMPTY_COMPANY: Company = { name: '', site: '', niche: '', revenue: '', channels: [], contactName: '', contactPhone: '', notes: '' };
export const getCompany = (): Company => ({ ...EMPTY_COMPANY, ...(read<Company>(COMPANY_KEY) || {}) });
export const saveCompany = (c: Company) => write(COMPANY_KEY, c);

/* ── аудити (підтягуються з калькулятора + збережені) ── */
export function getAudits(): AuditRecord[] {
  const out: AuditRecord[] = [];
  const calc = read<{ state?: { nicheId?: string }; result?: { potentialCons?: number; confidence?: number }; at?: string }>(AUDIT_KEY);
  if (calc?.at) {
    out.push({
      id: 'express-' + calc.at,
      kind: 'express',
      at: calc.at,
      niche: calc.state?.nicheId || '—',
      potentialCons: calc.result?.potentialCons ?? null,
      confidence: calc.result?.confidence ?? null,
      raw: calc,
    });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
