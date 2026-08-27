/*
 * Експрес-аудит у localStorage — і НІЧОГО більше.
 *
 * Виділено з `cabinetData.ts` навмисно. Там ці три функції жили поруч із
 * `syncExpressToAccount`, яка статично тягне `@/lib/supa`. Через це контактна
 * форма й калькулятор — сторінки для анонімного відвідувача — імпортували один
 * `getExpressAudit` на чотири рядки й отримували разом з ним увесь SDK Supabase
 * (242 кБ). Модуль без залежностей розриває цей ланцюг: публічні сторінки
 * беруть звідси, кабінет — з `cabinetData`, який реекспортує ці ж функції.
 */
import type { LossInput, LossResult } from './lossModel';

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
