/**
 * WEEXP Business X-Ray — ядро інтелект-платформи.
 * 18 доменів здоров'я бізнесу у 5 системах → Business Health (0–100)
 * + Independence Score (0–100, 5 рівнів зрілості). Використовується
 * інтерактивним інструментом /diagnose і сторінками /how-it-works/*.
 * Уся математика прозора й детермінована — жодних вигаданих чисел.
 */

export type DomainKey =
  | 'traffic' | 'cac' | 'seo' | 'brand'
  | 'ux' | 'funnel' | 'assortment' | 'pricing'
  | 'repeat' | 'crm' | 'loyalty' | 'ltv'
  | 'fulfilment' | 'erp' | 'team' | 'service'
  | 'analytics' | 'unit';

export type System = {
  key: string;
  title: string;
  domains: { key: DomainKey; label: string }[];
};

export const SYSTEMS: System[] = [
  { key: 'acq', title: 'Залучення', domains: [
    { key: 'traffic', label: 'Трафік і канали' },
    { key: 'cac', label: 'Ефективність реклами · CAC' },
    { key: 'seo', label: 'SEO та органіка' },
    { key: 'brand', label: 'Бренд і попит' },
  ]},
  { key: 'conv', title: 'Конверсія', domains: [
    { key: 'ux', label: 'UX сайту' },
    { key: 'funnel', label: 'Конверсія воронки' },
    { key: 'assortment', label: 'Асортимент і картки' },
    { key: 'pricing', label: 'Ціноутворення' },
  ]},
  { key: 'ret', title: 'Утримання', domains: [
    { key: 'repeat', label: 'Повторні покупки' },
    { key: 'crm', label: 'CRM і сегментація' },
    { key: 'loyalty', label: 'Email і лояльність' },
    { key: 'ltv', label: 'LTV' },
  ]},
  { key: 'ops', title: 'Операції', domains: [
    { key: 'fulfilment', label: 'Логістика і викуп' },
    { key: 'erp', label: 'Склад і ERP' },
    { key: 'team', label: 'Команда і процеси' },
    { key: 'service', label: 'Клієнтський сервіс' },
  ]},
  { key: 'data', title: 'Дані та фінанси', domains: [
    { key: 'analytics', label: 'Наскрізна аналітика' },
    { key: 'unit', label: 'Юніт-економіка · P&L' },
  ]},
];

export const DOMAIN_LABEL: Record<DomainKey, string> = Object.fromEntries(
  SYSTEMS.flatMap((s) => s.domains.map((d) => [d.key, d.label])),
) as Record<DomainKey, string>;

/** Питання X-Ray. answer 0..3 (Ні / Радше ні / Радше так / Так). Кожне мапиться на домени. */
export type Question = { id: string; text: string; domains: DomainKey[] };

export const QUESTIONS: Question[] = [
  { id: 'q1', text: 'Ви точно знаєте вартість залучення клієнта (CAC) по кожному каналу.', domains: ['cac', 'analytics'] },
  { id: 'q2', text: 'Понад третину трафіку приносить органіка й бренд, а не платна реклама.', domains: ['seo', 'brand', 'traffic'] },
  { id: 'q3', text: 'Конверсія сайту вища за 2% і ви знаєте, де саме воронка втрачає гроші.', domains: ['funnel', 'ux'] },
  { id: 'q4', text: 'Картки товару, асортимент і ціни керуються системно, а не «на око».', domains: ['assortment', 'pricing'] },
  { id: 'q5', text: 'Понад чверть виручки дають повторні покупки наявних клієнтів.', domains: ['repeat', 'ltv'] },
  { id: 'q6', text: 'Клієнтська база сегментована, і email/CRM приносять вимірювані продажі.', domains: ['crm', 'loyalty'] },
  { id: 'q7', text: 'Ви рахуєте LTV і тримаєте LTV:CAC на рівні ≥3.', domains: ['ltv', 'unit'] },
  { id: 'q8', text: 'Викуп і доставка під контролем — втрати на логістиці мінімальні.', domains: ['fulfilment'] },
  { id: 'q9', text: 'Склад, замовлення й асортимент зведені в ERP, а не в таблицях.', domains: ['erp'] },
  { id: 'q10', text: 'Процеси описані, а команда працює без щоденного ручного керування власником.', domains: ['team'] },
  { id: 'q11', text: 'Клієнтський сервіс має стандарти й метрики якості.', domains: ['service'] },
  { id: 'q12', text: 'У вас є наскрізна аналітика: від кліка до P&L в одному контурі.', domains: ['analytics', 'unit'] },
  { id: 'q13', text: 'Ви знаєте маржинальність кожної категорії й ухвалюєте рішення за цифрами.', domains: ['unit', 'pricing'] },
  { id: 'q14', text: 'Бренд генерує прямий попит — вас шукають за назвою.', domains: ['brand'] },
  { id: 'q15', text: 'Бізнес може працювати 2 тижні без щоденної участі власника.', domains: ['team', 'service', 'erp'] },
  { id: 'q16', text: 'Рішення про зростання ухвалюються за планом і бенчмарком, а не інтуїтивно.', domains: ['analytics', 'traffic'] },
];

export type Answers = Record<string, number>; // qid -> 0..3

export type Level = { min: number; max: number; code: string; title: string; line: string };
export const LEVELS: Level[] = [
  { min: 0, max: 20, code: '00–20', title: 'Хаос', line: 'Усе тримається в голові власника. Кожне рішення — вручну.' },
  { min: 20, max: 40, code: '20–40', title: 'Залежність', line: 'Процеси існують, але зав’язані на конкретних людях.' },
  { min: 40, max: 60, code: '40–60', title: 'Функції', line: 'Напрями працюють окремо, але ще не як єдина система.' },
  { min: 60, max: 80, code: '60–80', title: 'Система', line: 'Бізнес масштабується на власній операційній основі.' },
  { min: 80, max: 100, code: '80–100', title: 'Незалежність', line: 'Бізнес здатний працювати й зростати без героя.' },
];

export const levelFor = (score: number): Level =>
  LEVELS.find((l) => score >= l.min && score < l.max) ?? LEVELS[LEVELS.length - 1];

export type XrayResult = {
  health: number;                       // 0..100 середнє по доменах
  independence: number;                 // 0..100 зважене на автономність
  level: Level;
  domainScores: Record<DomainKey, number>; // 0..100 по кожному домену
  systemScores: { key: string; title: string; score: number }[];
  gaps: { key: DomainKey; label: string; score: number }[]; // топ-3 найслабші
};

/** Детермінований підрахунок X-Ray. answer 0..3 → внесок 0..100 у свої домени. */
export function scoreXray(answers: Answers): XrayResult {
  const acc: Record<string, { sum: number; n: number }> = {};
  const add = (k: DomainKey, v: number) => {
    (acc[k] ??= { sum: 0, n: 0 });
    acc[k].sum += v; acc[k].n += 1;
  };
  for (const q of QUESTIONS) {
    const a = Math.max(0, Math.min(3, answers[q.id] ?? 0));
    const v = (a / 3) * 100;
    q.domains.forEach((d) => add(d, v));
  }
  const domainScores = {} as Record<DomainKey, number>;
  (Object.keys(DOMAIN_LABEL) as DomainKey[]).forEach((k) => {
    domainScores[k] = acc[k] ? Math.round(acc[k].sum / acc[k].n) : 0;
  });

  const systemScores = SYSTEMS.map((s) => ({
    key: s.key, title: s.title,
    score: Math.round(s.domains.reduce((a, d) => a + domainScores[d.key], 0) / s.domains.length),
  }));

  const health = Math.round(
    (Object.values(domainScores).reduce((a, v) => a + v, 0)) / Object.keys(domainScores).length,
  );

  // Independence зважує автономність операцій/даних сильніше за трафік.
  const AUTONOMY: DomainKey[] = ['team', 'erp', 'service', 'analytics', 'unit', 'crm', 'repeat', 'ltv'];
  const autoAvg = Math.round(AUTONOMY.reduce((a, k) => a + domainScores[k], 0) / AUTONOMY.length);
  const independence = Math.round(health * 0.45 + autoAvg * 0.55);

  const gaps = (Object.keys(domainScores) as DomainKey[])
    .map((k) => ({ key: k, label: DOMAIN_LABEL[k], score: domainScores[k] }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return { health, independence, level: levelFor(independence), domainScores, systemScores, gaps };
}

/** Груба оцінка річної можливості: чим нижчий Independence, тим більший розрив. */
export function opportunityLabel(independence: number): string {
  if (independence >= 80) return 'точкова оптимізація';
  if (independence >= 60) return '10–20% до обороту';
  if (independence >= 40) return '20–40% до обороту';
  if (independence >= 20) return '40–70% до обороту';
  return '×1,5–2 до обороту';
}
