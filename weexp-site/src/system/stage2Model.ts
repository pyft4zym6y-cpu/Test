/**
 * Калькулятор · Етап 2 — глибша діагностика за логікою Commerce OS. Після Етапу 1
 * (число-заманка) ставимо ~18 питань, де клієнт переважно ОБИРАЄ варіанти (single/
 * multi), а руками вводить лише посилання на сайт. Відповіді мапляться на бали
 * 0–3 по семи системах → зрілість, bottleneck, уточнена можливість, пріоритети.
 * Свідомо не аудит: оцінка порядку величини, чесно позначена.
 */
import { SYS, type SysKey, type LossInput } from './lossModel';

export type Q = {
  id: string;
  system: SysKey;
  text: string;
  kind: 'single' | 'multi';
  options: { label: string; score: number }[]; // для single — score рядка; для multi — score за кожен вибір
};

export const QUESTIONS: Q[] = [
  // Стратегія
  { id: 's1', system: 'strategy', text: 'Чи є річний план продажів із декомпозицією по каналах і місяцях?', kind: 'single',
    options: [{ label: 'Немає', score: 0 }, { label: 'Є загальні цілі', score: 1 }, { label: 'Є план, але не переглядаємо', score: 2 }, { label: 'Є план + регулярний перегляд', score: 3 }] },
  { id: 's2', system: 'strategy', text: 'Як ухвалюються рішення про розвиток?', kind: 'single',
    options: [{ label: 'Інтуїтивно', score: 0 }, { label: 'За окремими звітами', score: 1 }, { label: 'За регулярними дашбордами', score: 2 }, { label: 'За наскрізними даними + юніт-економікою', score: 3 }] },
  // Комерція
  { id: 'c1', system: 'commercial', text: 'Чим ви керуєте асортиментом?', kind: 'single',
    options: [{ label: 'Не керуємо системно', score: 0 }, { label: 'За оборотом', score: 1 }, { label: 'За маржею окремих груп', score: 2 }, { label: 'ABC/XYZ + contribution', score: 3 }] },
  { id: 'c2', system: 'commercial', text: 'Промо і знижки:', kind: 'single',
    options: [{ label: 'Основний драйвер продажів', score: 0 }, { label: 'Часто, без розрахунку', score: 1 }, { label: 'Плануємо, рахуємо частково', score: 2 }, { label: 'Плануємо за впливом на маржу', score: 3 }] },
  // Попит і клієнт
  { id: 'd1', system: 'customer', text: 'Скільки каналів дають більшість продажів?', kind: 'single',
    options: [{ label: 'Один платний', score: 0 }, { label: 'Один-два платних', score: 1 }, { label: 'Кілька, без attribution', score: 2 }, { label: 'Диверсифіковано + attribution', score: 3 }] },
  { id: 'd2', system: 'customer', text: 'Що з retention налаштовано? (оберіть усе)', kind: 'multi',
    options: [{ label: 'Email/SMS', score: 1 }, { label: 'Кинутий кошик', score: 1 }, { label: 'Post-purchase', score: 1 }, { label: 'Лояльність', score: 1 }, { label: 'Реактивація/win-back', score: 1 }] },
  // Досвід і конверсія
  { id: 'e1', system: 'experience', text: 'Мобільна версія:', kind: 'single',
    options: [{ label: 'Незручна/повільна', score: 0 }, { label: 'Працює, але з тертям', score: 1 }, { label: 'Ок, без A/B', score: 2 }, { label: 'Оптимізована, A/B', score: 3 }] },
  { id: 'e2', system: 'experience', text: 'Картка товару:', kind: 'single',
    options: [{ label: 'Мало інформації', score: 0 }, { label: 'Базова', score: 1 }, { label: 'Контент + відгуки', score: 2 }, { label: 'Повна + порівняння + social proof', score: 3 }] },
  { id: 'e3', system: 'experience', text: 'Checkout:', kind: 'single',
    options: [{ label: '5+ кроків, реєстрація', score: 0 }, { label: '3–4 кроки', score: 1 }, { label: '2 кроки', score: 2 }, { label: '1–2 кроки + гостьовий', score: 3 }] },
  // Операції
  { id: 'o1', system: 'operations', text: 'Обробка замовлень:', kind: 'single',
    options: [{ label: 'Вручну', score: 0 }, { label: 'Частково автоматично', score: 1 }, { label: 'Здебільшого автоматично', score: 2 }, { label: 'SLA + автоматизація', score: 3 }] },
  { id: 'o2', system: 'operations', text: 'Залишки на сайті vs склад:', kind: 'single',
    options: [{ label: 'Часто розходяться', score: 0 }, { label: 'Іноді', score: 1 }, { label: 'Синхронні із затримкою', score: 2 }, { label: 'Реальний час', score: 3 }] },
  { id: 'o3', system: 'operations', text: 'Викуп і повернення:', kind: 'single',
    options: [{ label: 'Не контролюємо', score: 0 }, { label: 'Рахуємо постфактум', score: 1 }, { label: 'Контролюємо частину', score: 2 }, { label: 'Керуємо системно', score: 3 }] },
  // Дані і технології
  { id: 't1', system: 'data', text: 'Аналітика:', kind: 'single',
    options: [{ label: 'Немає / не довіряємо', score: 0 }, { label: 'GA4 базово', score: 1 }, { label: 'GA4 + деякі інтеграції', score: 2 }, { label: 'Наскрізна + P&L', score: 3 }] },
  { id: 't2', system: 'data', text: 'Що інтегровано в єдиний контур? (оберіть усе)', kind: 'multi',
    options: [{ label: 'CMS', score: 0.6 }, { label: 'CRM', score: 0.6 }, { label: 'ERP', score: 0.6 }, { label: 'WMS', score: 0.6 }, { label: 'Маркетинг', score: 0.6 }] },
  { id: 't3', system: 'data', text: 'Єдиний master data (ціни/залишки/статуси)?', kind: 'single',
    options: [{ label: 'Немає', score: 0 }, { label: 'Частково', score: 1 }, { label: 'Здебільшого', score: 2 }, { label: 'Єдине джерело правди', score: 3 }] },
  // Організація
  { id: 'g1', system: 'org', text: 'Ролі й відповідальність:', kind: 'single',
    options: [{ label: 'Усе на власнику', score: 0 }, { label: 'Кілька людей', score: 1 }, { label: 'Ролі є, KPI розмиті', score: 2 }, { label: 'Ролі + RACI + KPI', score: 3 }] },
  { id: 'g2', system: 'org', text: 'Бізнес без вас 2 тижні:', kind: 'single',
    options: [{ label: 'Зупиниться', score: 0 }, { label: 'Помітно просяде', score: 1 }, { label: 'Втримається', score: 2 }, { label: 'Працюватиме й зростатиме', score: 3 }] },
];

export type Stage2Answers = Record<string, number | number[]>;

const ACTION: Record<SysKey, string> = {
  strategy: 'Задати модель росту й управлінський цикл: цілі → декомпозиція → факт → дії.',
  commercial: 'Керувати конверсією, чеком і маржею за юніт-економікою, а не оборотом.',
  customer: 'Побудувати retention і attribution: RFM, win-back, abandoned cart, LTV/CAC.',
  experience: 'Прибрати конверсійні витоки: каталог, картка, checkout, mobile, CRO/A-B.',
  operations: 'Поставити SLA обробки, викуп/доставку й контроль повернень.',
  data: 'Наскрізна аналітика + єдиний master data: одні цифри для всіх рішень.',
  org: 'Операційна модель: ролі, RACI, KPI, SOP — щоб бізнес працював без героя.',
};

const W: Record<SysKey, number> = { strategy: 1, commercial: 1, customer: 1.1, experience: 0.9, operations: 1.3, data: 1.2, org: 1.5 };

export type SysMaturity = { key: SysKey; label: string; score: number };
export type Stage2Level = { min: number; code: string; title: string; line: string };
export const LEVELS: Stage2Level[] = [
  { min: 0, code: '00–20', title: 'Хаос', line: 'Усе тримається в голові власника. Кожне рішення — вручну.' },
  { min: 20, code: '20–40', title: 'Залежність', line: 'Процеси існують, але зав’язані на конкретних людях.' },
  { min: 40, code: '40–60', title: 'Функції', line: 'Системи працюють окремо, але ще не як єдине ціле.' },
  { min: 60, code: '60–80', title: 'Система', line: 'Бізнес масштабується на власній операційній основі.' },
  { min: 80, code: '80–100', title: 'Незалежність', line: 'Бізнес здатний працювати й зростати без героя.' },
];
export const levelFor = (s: number) => [...LEVELS].reverse().find((l) => s >= l.min) ?? LEVELS[0];

export type Stage2Result = {
  systems: SysMaturity[];
  overall: number;          // зрілість 0..100
  independence: number;     // зважена автономність 0..100
  level: Stage2Level;
  bottleneck: SysMaturity;
  gaps: SysMaturity[];
  opportunityPct: [number, number]; // діапазон % до обороту
  annualUpside: [number, number];   // € на рік (якщо є виторг)
  priorities: { key: SysKey; text: string }[];
  answered: number; total: number;
};

const qScore = (q: Q, a: number | number[] | undefined): number => {
  if (a == null) return 0;
  if (q.kind === 'single') return q.options[a as number]?.score ?? 0;
  const sel = a as number[];
  return Math.min(3, sel.reduce((s, i) => s + (q.options[i]?.score ?? 0), 0));
};

export function scoreStage2(ans: Stage2Answers, stage1?: LossInput): Stage2Result {
  const systems: SysMaturity[] = SYS.map(({ key, label }) => {
    const qs = QUESTIONS.filter((q) => q.system === key);
    const sum = qs.reduce((s, q) => s + qScore(q, ans[q.id]) / 3 * 100, 0);
    return { key, label, score: qs.length ? Math.round(sum / qs.length) : 0 };
  });
  const overall = Math.round(systems.reduce((a, s) => a + s.score, 0) / systems.length);
  const wsum = Object.values(W).reduce((a, b) => a + b, 0);
  const independence = Math.round(systems.reduce((a, s) => a + s.score * W[s.key], 0) / wsum);
  const sorted = [...systems].sort((a, b) => a.score - b.score);
  const bottleneck = sorted[0];
  const gaps = sorted.slice(0, 3);

  // Можливість: що нижча зрілість — то більший потенціал до обороту.
  const pctMid = Math.max(0.05, Math.min(0.7, (72 - overall) / 100));
  const opportunityPct: [number, number] = [Math.round(pctMid * 60), Math.round(pctMid * 100)];
  const annual = stage1 ? Math.max(0, stage1.monthlyRevenue) * 12 : 0;
  const annualUpside: [number, number] = [Math.round(annual * pctMid * 0.6), Math.round(annual * pctMid)];

  const priorities = sorted.slice(0, 3).map((s) => ({ key: s.key, text: ACTION[s.key] }));
  const answered = QUESTIONS.filter((q) => ans[q.id] != null && (q.kind === 'single' || (ans[q.id] as number[]).length)).length;
  return { systems, overall, independence, level: levelFor(independence), bottleneck, gaps, opportunityPct, annualUpside, priorities, answered, total: QUESTIONS.length };
}
