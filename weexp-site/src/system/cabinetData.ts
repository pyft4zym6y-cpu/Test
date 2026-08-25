/*
 * Дані кабінету — тонкий шар над калькулятором (lossModel) і сховищем (supa).
 * Кабінет — ХАБ однієї воронки, а не окремий інструмент:
 *   Відвідувач → Експрес-витік (калькулятор) → Акаунт → Профіль компанії
 *   → Глибокий аудит (Stage3, Tier-2) → Знахідки/План → Співпраця.
 * Експрес-витік зберігається локально одразу (без реєстрації), щоб «Мої аудити»
 * показали число ще до входу; профіль і воронка — у DiagRecord (Supabase/local).
 */
import type { LossInput, LossResult } from './lossModel';
import { loadDiag, saveDiag, type DiagRecord, type DiagUser } from '@/lib/supa';

const EXPRESS_KEY = 'weexp:express-audit-v1';

export type ExpressAudit = {
  at: string;
  input: LossInput;
  total: number;
  range: [number, number];
  primary: string;
  secondary?: string;
  overallHealth: number;
  health?: { key: string; score: number }[];   // здоров'я 8 систем
  leaks?: { key: string; amount: number }[];    // джерела витоку, €/рік
  actions?: string[];                            // ключі рекомендацій
};

/** Калькулятор викликає це на кроці «витік» — повний знімок для кабінету й адмінки. */
export function saveExpressAudit(input: LossInput, res: LossResult): void {
  const rec: ExpressAudit = {
    at: new Date().toISOString(), input,
    total: res.total, range: res.range, primary: res.primary, secondary: res.secondary, overallHealth: res.overallHealth,
    health: res.health.map((h) => ({ key: h.key, score: h.score })),
    leaks: res.leaks.map((l) => ({ key: l.key, amount: l.amount })),
    actions: res.actions.map((a) => a.key),
  };
  try { localStorage.setItem(EXPRESS_KEY, JSON.stringify(rec)); } catch { /* noop */ }
}

export function getExpressAudit(): ExpressAudit | null {
  try { const r = localStorage.getItem(EXPRESS_KEY); return r ? (JSON.parse(r) as ExpressAudit) : null; } catch { return null; }
}

/** Видалити збережений експрес-аудит (кнопка «Видалити» в кабінеті). */
export function clearExpressAudit(): void {
  try { localStorage.removeItem(EXPRESS_KEY); } catch { /* noop */ }
}

/**
 * Прив'язати локальний експрес-аудит до акаунту: записати знімок у DiagRecord
 * (Supabase/local), щоб клієнт бачив свій аудит після реєстрації на будь-якому
 * пристрої, а адмін — у панелі. Викликається, щойно в кабінеті з'являється user.
 * Ідемпотентно: якщо той самий знімок (за `at`) вже в записі — не перезаписує.
 */
export async function syncExpressToAccount(user: DiagUser | null): Promise<boolean> {
  if (!user) return false;
  const ex = getExpressAudit();
  if (!ex) return false;
  try {
    const rec = await loadDiag(user);
    if (rec.express?.at === ex.at) return false;   // вже синхронізовано
    await saveDiag(user, {
      express: {
        at: ex.at, total: ex.total, range: ex.range, primary: ex.primary, secondary: ex.secondary,
        overallHealth: ex.overallHealth, symptoms: ex.input.symptoms, source: 'cabinet',
        input: {
          monthlyRevenue: ex.input.monthlyRevenue, aov: ex.input.aov, conversion: ex.input.conversion,
          repeatRate: ex.input.repeatRate, returnsRate: ex.input.returnsRate, grossMargin: ex.input.grossMargin, cac: ex.input.cac,
        },
        health: ex.health, leaks: ex.leaks, actions: ex.actions,
      },
      stage1Money: ex.range,
    });
    return true;
  } catch { return false; }
}

export type JourneyStep = { id: string; label: string; hint: string; done: boolean; current: boolean };

/**
 * Один наскрізний шлях клієнта: де він зараз і що наступне. Стадії рахуються з
 * реального стану (експрес-витік, сесія, профіль, глибокий аудит, заявка).
 */
export function buildJourney(opts: { loggedIn: boolean; rec: DiagRecord | null; express: ExpressAudit | null }): JourneyStep[] {
  const { loggedIn, rec, express } = opts;
  const company = rec?.company;
  const deepDone = Boolean(rec?.stage3 && Object.keys(rec.stage3).length > 0);
  const collabDone = Boolean(rec?.funnel?.leadAt);
  const flags = [
    { id: 'express', label: 'Експрес-витік', hint: 'калькулятор дав число', done: Boolean(express || rec?.stage1Money) },
    { id: 'account', label: 'Акаунт у кабінеті', hint: 'вхід за email', done: loggedIn },
    { id: 'profile', label: 'Профіль компанії', hint: 'дані магазину', done: Boolean(company?.name && company?.site) },
    { id: 'deep', label: 'Глибокий аудит', hint: 'Tier-2 розбір систем', done: deepDone },
    { id: 'findings', label: 'Знахідки та план', hint: 'дорожня карта під DoD', done: false },
    { id: 'collab', label: 'Співпраця', hint: 'заявка на розбір', done: collabDone },
  ];
  const firstUndone = flags.findIndex((f) => !f.done);
  return flags.map((f, i) => ({ ...f, current: i === firstUndone }));
}
