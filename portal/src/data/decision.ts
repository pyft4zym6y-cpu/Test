/** Шаг «Решение и команда»: полный бриф собственника, карта ЛПР, рамки, паспорт команды. */

export const DECISION_QID = 'DECISION'; // JSON в answers

export type Lpr = { name: string; role: string; influence: string; kpi: string; matters: string };
export type TeamRow = { role: string; name: string; hours: string; area: string };

export type Decision = {
  reason?: string; // причина обращения своими словами
  problems?: string[]; // три главные проблемы по версии владельца
  self?: Record<string, number>; // самооценка: ключ утверждения -> 0..5
  lprs?: Lpr[];
  budget?: { range?: string; tranches?: string; deadline?: string; cash?: string };
  team?: TeamRow[];
  outsource?: string;
};

/** Чек-лист самооценки: расхождение с Health Score — главный аргумент разговора. */
export const SELF_ITEMS: { key: string; label: string }[] = [
  { key: 'strategy', label: 'У нас есть письменная стратегия e-commerce на год вперёд' },
  { key: 'unit', label: 'Мы знаем юнит-экономику каждого канала продаж' },
  { key: 'data', label: 'Решения принимаются на сверенных цифрах, а не на ощущениях' },
  { key: 'funnel', label: 'Мы знаем, где именно теряем клиентов на пути к покупке' },
  { key: 'retention', label: 'Клиентская база системно приносит повторные продажи' },
  { key: 'brand', label: 'Покупатель выбирает нас не только по цене' },
  { key: 'ops', label: 'Заказы, остатки и статусы обрабатываются без ручного труда' },
  { key: 'team', label: 'У каждого ключевого показателя есть владелец в команде' },
  { key: 'tech', label: 'Платформа и IT не ограничивают планы роста' },
  { key: 'finance', label: 'Мы видим прибыль по каналам и категориям ежемесячно' },
];

/** Самооценка 0..100 из чек-листа (среднее × 20); null, пока отвечено меньше 6 пунктов. */
export function selfScore(self?: Record<string, number>): number | null {
  const vals = SELF_ITEMS.map((i) => self?.[i.key]).filter((v): v is number => v != null);
  if (vals.length < 6) return null;
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 20);
}

export const INFLUENCE = ['Принимает решение', 'Влияет на решение', 'Консультирует', 'Исполняет'];
export const BUDGET_RANGES = ['До $5K', '$5–15K', '$15–40K', '$40–80K', 'Более $80K', 'Пока не определён'];
export const TRANCHES = ['Да, транши под результат', 'Предпочитаем фикс', 'Обсудим'];
export const ROLES = ['CEO / Собственник', 'CFO', 'COO', 'Head of E-commerce', 'Маркетинг', 'CRM', 'IT', 'Другое'];
