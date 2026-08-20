/**
 * Калькулятор · Етап 2 — глибша діагностика за логікою Commerce OS. Після Етапу 1
 * (число-заманка) ставимо ~18 питань, де клієнт переважно ОБИРАЄ варіанти (single/
 * multi), а руками вводить лише посилання на сайт. Відповіді мапляться на бали
 * 0–3 по семи системах → зрілість, bottleneck, уточнена можливість, пріоритети.
 * Свідомо не аудит: оцінка порядку величини, чесно позначена.
 */
import { SYS, type SysKey, type LossInput, type Lang } from './lossModel';

export type Q = {
  id: string;
  system: SysKey;
  text: string;
  textEn: string;
  kind: 'single' | 'multi';
  options: { label: string; score: number }[]; // для single — score рядка; для multi — score за кожен вибір
  optionsEn: string[]; // англійські підписи опцій у ТОМУ Ж порядку (score не дублюємо)
};

export const QUESTIONS: Q[] = [
  // Стратегія
  { id: 's1', system: 'strategy', text: 'Чи є річний план продажів із декомпозицією по каналах і місяцях?', textEn: 'Is there an annual sales plan broken down by channel and month?', kind: 'single',
    options: [{ label: 'Немає — працюємо «як піде»', score: 0 }, { label: 'Є загальні цілі в голові', score: 0.7 }, { label: 'Є цифра на рік, без декомпозиції', score: 1.4 }, { label: 'Є план по місяцях, але не переглядаємо', score: 2 }, { label: 'Є план + регулярний перегляд факту', score: 3 }, { label: 'Важко сказати', score: 1 }],
    optionsEn: ['No — we work as it comes', 'General goals, kept in our heads', 'An annual number, no breakdown', 'A monthly plan, but we never review it', 'A plan + regular review of actuals', 'Hard to say'] },
  { id: 's2', system: 'strategy', text: 'Як ухвалюються рішення про розвиток?', textEn: 'How are growth decisions made?', kind: 'single',
    options: [{ label: 'Інтуїтивно, на досвіді', score: 0 }, { label: 'За порадами / кейсами інших', score: 0.7 }, { label: 'За окремими звітами', score: 1.4 }, { label: 'За регулярними дашбордами', score: 2.2 }, { label: 'За наскрізними даними + юніт-економікою', score: 3 }, { label: 'По-різному, без системи', score: 0.8 }],
    optionsEn: ['Intuitively, from experience', "From others' advice / cases", 'From isolated reports', 'From regular dashboards', 'From end-to-end data + unit economics', 'It varies, no system'] },
  // Комерція
  { id: 'c1', system: 'commercial', text: 'Чим ви керуєте асортиментом?', textEn: 'How do you manage your assortment?', kind: 'single',
    options: [{ label: 'Не керуємо системно', score: 0 }, { label: 'За інтуїцією / «ходовими» позиціями', score: 0.7 }, { label: 'За оборотом', score: 1.4 }, { label: 'За маржею окремих груп', score: 2.2 }, { label: 'ABC/XYZ + contribution', score: 3 }, { label: 'Не впевнений', score: 1 }],
    optionsEn: ['No systematic management', 'By intuition / best-sellers', 'By turnover', 'By margin of specific groups', 'ABC/XYZ + contribution', 'Not sure'] },
  { id: 'c2', system: 'commercial', text: 'Промо і знижки:', textEn: 'Promotions and discounts:', kind: 'single',
    options: [{ label: 'Основний драйвер продажів', score: 0 }, { label: 'Робимо «як у ринку»', score: 0.7 }, { label: 'Часто, без розрахунку', score: 1.2 }, { label: 'Плануємо, рахуємо частково', score: 2 }, { label: 'Плануємо за впливом на маржу', score: 3 }, { label: 'Майже не робимо промо', score: 1.8 }],
    optionsEn: ['The main sales driver', 'We follow the market', 'Often, without calculation', 'Planned, partly calculated', 'Planned by impact on margin', 'We rarely run promos'] },
  // Попит і клієнт
  { id: 'd1', system: 'customer', text: 'Скільки каналів дають більшість продажів?', textEn: 'How many channels drive most of your sales?', kind: 'single',
    options: [{ label: 'Один платний — і страшно його втратити', score: 0 }, { label: 'Один-два платних', score: 1 }, { label: 'Кілька, але без attribution', score: 1.8 }, { label: 'Кілька + органіка', score: 2.4 }, { label: 'Диверсифіковано + attribution', score: 3 }, { label: 'Переважно маркетплейси', score: 1.2 }],
    optionsEn: ['One paid channel — and losing it is scary', 'One or two paid', 'Several, but without attribution', 'Several + organic', 'Diversified + attribution', 'Mostly marketplaces'] },
  { id: 'd2', system: 'customer', text: 'Що з retention налаштовано? (оберіть усе)', textEn: 'What retention is set up? (select all)', kind: 'multi',
    options: [{ label: 'Email / SMS розсилки', score: 1 }, { label: 'Кинутий кошик', score: 1 }, { label: 'Post-purchase ланцюжки', score: 1 }, { label: 'Програма лояльності', score: 1 }, { label: 'Реактивація / win-back', score: 1 }, { label: 'Push / месенджери', score: 1 }, { label: 'Нічого з цього', score: 0 }],
    optionsEn: ['Email / SMS campaigns', 'Abandoned cart', 'Post-purchase flows', 'Loyalty program', 'Reactivation / win-back', 'Push / messengers', 'None of these'] },
  // Досвід і конверсія
  { id: 'e1', system: 'experience', text: 'Мобільна версія сайту:', textEn: 'Mobile version of the site:', kind: 'single',
    options: [{ label: 'Незручна / повільна', score: 0 }, { label: 'Працює, але з тертям', score: 1 }, { label: 'Нормально, окремі проблеми', score: 1.6 }, { label: 'Добре, без A/B тестів', score: 2.2 }, { label: 'Оптимізована, регулярні A/B', score: 3 }, { label: 'Не перевіряли давно', score: 0.8 }],
    optionsEn: ['Clumsy / slow', 'Works, but with friction', 'Okay, some issues', 'Good, no A/B tests', 'Optimized, regular A/B', "Haven't checked in a while"] },
  { id: 'e2', system: 'experience', text: 'Картка товару:', textEn: 'Product page:', kind: 'single',
    options: [{ label: 'Мало інформації', score: 0 }, { label: 'Базова (фото + опис)', score: 1 }, { label: '+ характеристики й наявність', score: 1.7 }, { label: '+ контент і відгуки', score: 2.3 }, { label: 'Повна + порівняння + social proof', score: 3 }, { label: 'У кожної категорії по-різному', score: 1.2 }],
    optionsEn: ['Little information', 'Basic (photo + description)', '+ specs and availability', '+ content and reviews', 'Full + comparison + social proof', 'Different in each category'] },
  { id: 'e3', system: 'experience', text: 'Оформлення замовлення (checkout):', textEn: 'Checkout:', kind: 'single',
    options: [{ label: '5+ кроків, обовʼязкова реєстрація', score: 0 }, { label: '3–4 кроки', score: 1 }, { label: '2 кроки', score: 2 }, { label: '1–2 кроки + гостьовий', score: 3 }, { label: 'В один екран', score: 3 }, { label: 'Не памʼятаю точно', score: 1 }],
    optionsEn: ['5+ steps, registration required', '3–4 steps', '2 steps', '1–2 steps + guest checkout', 'On a single screen', "Don't remember exactly"] },
  // Операції
  { id: 'o1', system: 'operations', text: 'Обробка замовлень:', textEn: 'Order processing:', kind: 'single',
    options: [{ label: 'Вручну (таблиці / месенджери)', score: 0 }, { label: 'Частково автоматично', score: 1 }, { label: 'CRM без SLA', score: 1.7 }, { label: 'Здебільшого автоматично', score: 2.3 }, { label: 'SLA + автоматизація', score: 3 }, { label: 'Через маркетплейс', score: 1.4 }],
    optionsEn: ['Manual (spreadsheets / messengers)', 'Partly automated', 'CRM without SLA', 'Mostly automated', 'SLA + automation', 'Via marketplace'] },
  { id: 'o2', system: 'operations', text: 'Залишки на сайті vs склад:', textEn: 'Site stock vs warehouse:', kind: 'single',
    options: [{ label: 'Часто розходяться', score: 0 }, { label: 'Іноді розходяться', score: 1 }, { label: 'Оновлюємо вручну', score: 1.4 }, { label: 'Синхронні із затримкою', score: 2.2 }, { label: 'Реальний час', score: 3 }, { label: 'Не відстежуємо', score: 0.5 }],
    optionsEn: ['Often out of sync', 'Sometimes out of sync', 'Updated manually', 'Synced with a delay', 'Real time', 'Not tracked'] },
  { id: 'o3', system: 'operations', text: 'Викуп і повернення:', textEn: 'Buy-out and returns:', kind: 'single',
    options: [{ label: 'Не контролюємо', score: 0 }, { label: 'Знаємо приблизно', score: 0.8 }, { label: 'Рахуємо постфактум', score: 1.5 }, { label: 'Контролюємо частину', score: 2.2 }, { label: 'Керуємо системно', score: 3 }, { label: 'Повернень майже немає', score: 2.5 }],
    optionsEn: ['Not controlled', 'Known roughly', 'Counted after the fact', 'Partly controlled', 'Managed systematically', 'Almost no returns'] },
  // Дані і технології
  { id: 't1', system: 'data', text: 'Аналітика:', textEn: 'Analytics:', kind: 'single',
    options: [{ label: 'Немає / не довіряємо', score: 0 }, { label: 'Дивимось у кабінетах реклами', score: 0.8 }, { label: 'GA4 базово', score: 1.5 }, { label: 'GA4 + деякі інтеграції', score: 2.2 }, { label: 'Наскрізна + P&L', score: 3 }, { label: 'Не знаю, що налаштовано', score: 0.6 }],
    optionsEn: ['None / not trusted', 'We look in ad platforms', 'GA4, basic', 'GA4 + some integrations', 'End-to-end + P&L', "Don't know what's set up"] },
  { id: 't2', system: 'data', text: 'Що інтегровано в єдиний контур? (оберіть усе)', textEn: 'What is integrated into one loop? (select all)', kind: 'multi',
    options: [{ label: 'CMS / сайт', score: 0.5 }, { label: 'CRM', score: 0.5 }, { label: 'ERP / облік', score: 0.5 }, { label: 'WMS / склад', score: 0.5 }, { label: 'Маркетинг / реклама', score: 0.5 }, { label: 'BI / дашборди', score: 0.5 }, { label: 'Нічого не інтегровано', score: 0 }],
    optionsEn: ['CMS / site', 'CRM', 'ERP / accounting', 'WMS / warehouse', 'Marketing / ads', 'BI / dashboards', 'Nothing integrated'] },
  { id: 't3', system: 'data', text: 'Єдиний master data (ціни / залишки / статуси)?', textEn: 'A single master data (prices / stock / statuses)?', kind: 'single',
    options: [{ label: 'Немає — дані розсипані', score: 0 }, { label: 'Частково', score: 1 }, { label: 'Ведемо в таблицях', score: 1.4 }, { label: 'Здебільшого єдині', score: 2.2 }, { label: 'Єдине джерело правди', score: 3 }, { label: 'Не впевнений', score: 0.8 }],
    optionsEn: ['None — data is scattered', 'Partly', 'Kept in spreadsheets', 'Mostly unified', 'A single source of truth', 'Not sure'] },
  // Організація
  { id: 'g1', system: 'org', text: 'Ролі й відповідальність:', textEn: 'Roles and responsibility:', kind: 'single',
    options: [{ label: 'Усе на власнику', score: 0 }, { label: 'Кілька людей, ролі розмиті', score: 1 }, { label: 'Є ролі, немає KPI', score: 1.7 }, { label: 'Ролі + KPI, місцями конфліктні', score: 2.3 }, { label: 'Ролі + RACI + KPI', score: 3 }, { label: 'Працюємо з підрядниками', score: 1.4 }],
    optionsEn: ['Everything on the owner', 'A few people, blurred roles', 'Roles exist, no KPIs', 'Roles + KPIs, sometimes conflicting', 'Roles + RACI + KPIs', 'We work with contractors'] },
  { id: 'g2', system: 'org', text: 'Бізнес без вас 2 тижні:', textEn: 'The business without you for 2 weeks:', kind: 'single',
    options: [{ label: 'Зупиниться', score: 0 }, { label: 'Помітно просяде', score: 1 }, { label: 'Протримається на автопілоті', score: 1.8 }, { label: 'Втримається без втрат', score: 2.4 }, { label: 'Працюватиме й зростатиме', score: 3 }, { label: 'Не перевіряли', score: 1 }],
    optionsEn: ['Would stop', 'Would noticeably dip', 'Would hold on autopilot', 'Would hold without losses', 'Would run and grow', "Haven't tested"] },
  // Експансія (8-а система)
  { id: 'x1', system: 'expansion', text: 'Ви продаєте лише на одному ринку — чи виходите за його межі?', textEn: 'You sell in one market only — are you expanding beyond it?', kind: 'single',
    options: [{ label: 'Лише один ринок, і не думали про інші', score: 0 }, { label: 'Хочемо, але не знаємо як', score: 0.8 }, { label: 'Пробували, без системи', score: 1.5 }, { label: 'Є продажі на маркетплейсах ЄС/США', score: 2.2 }, { label: 'Системна присутність на кількох ринках', score: 3 }, { label: 'Нам вистачає свого ринку', score: 1.5 }],
    optionsEn: ['One market only, never considered others', "We want to, but don't know how", 'Tried, without a system', 'We have sales on EU/US marketplaces', 'Systematic presence in several markets', 'Our own market is enough'] },
  { id: 'x2', system: 'expansion', text: 'Що готове до виходу на нові ринки? (оберіть усе)', textEn: 'What is ready for entering new markets? (select all)', kind: 'multi',
    options: [{ label: 'Локалізований сайт / мова', score: 0.7 }, { label: 'Логістика й фулфілмент за кордон', score: 0.7 }, { label: 'Акаунти на маркетплейсах', score: 0.7 }, { label: 'Юридично / податки', score: 0.7 }, { label: 'Нічого з цього', score: 0 }],
    optionsEn: ['Localized site / language', 'Cross-border logistics and fulfillment', 'Marketplace accounts', 'Legal / taxes', 'None of these'] },
];

/** Локалізоване питання (той самий порядок опцій/score, лише підписи мовою). */
export const localizeQuestion = (q: Q, lang: Lang): Q =>
  lang === 'en'
    ? { ...q, text: q.textEn, options: q.options.map((o, i) => ({ ...o, label: q.optionsEn[i] ?? o.label })) }
    : q;
export const localizeQuestions = (lang: Lang) => QUESTIONS.map((q) => localizeQuestion(q, lang));

export type Stage2Answers = Record<string, number | number[]>;

const ACTION: Record<SysKey, string> = {
  strategy: 'Задати модель росту й управлінський цикл: цілі → декомпозиція → факт → дії.',
  commercial: 'Керувати конверсією, чеком і маржею за юніт-економікою, а не оборотом.',
  customer: 'Побудувати retention і attribution: RFM, win-back, abandoned cart, LTV/CAC.',
  experience: 'Прибрати конверсійні витоки: каталог, картка, checkout, mobile, CRO/A-B.',
  operations: 'Поставити SLA обробки, викуп/доставку й контроль повернень.',
  data: 'Наскрізна аналітика + єдиний master data: одні цифри для всіх рішень.',
  org: 'Операційна модель: ролі, RACI, KPI, SOP — щоб бізнес працював без героя.',
  expansion: 'Вихід у нові ринки як окремий контур: ЄС/США, маркетплейси, локалізація.',
};

const ACTION_EN: Record<SysKey, string> = {
  strategy: 'Set the growth model and management cycle: goals → breakdown → actuals → actions.',
  commercial: 'Manage conversion, order value and margin by unit economics, not turnover.',
  customer: 'Build retention and attribution: RFM, win-back, abandoned cart, LTV/CAC.',
  experience: 'Close conversion leaks: catalog, product card, checkout, mobile, CRO/A-B.',
  operations: 'Set processing SLAs, buy-out/delivery and returns control.',
  data: 'End-to-end analytics + a single master data: one set of numbers for every decision.',
  org: 'Operating model: roles, RACI, KPIs, SOPs — so the business runs without a hero.',
  expansion: 'Enter new markets as a separate track: EU/US, marketplaces, localization.',
};

/** Локалізований текст пріоритетної дії Етапу 2 за ключем системи. */
export const priorityText = (key: SysKey, lang: Lang): string => (lang === 'en' ? ACTION_EN : ACTION)[key];

const W: Record<SysKey, number> = { strategy: 1, commercial: 1, customer: 1.1, experience: 0.9, operations: 1.3, data: 1.2, org: 1.5, expansion: 0.8 };

export type SysMaturity = { key: SysKey; label: string; score: number };
export type Stage2Level = { min: number; code: string; title: string; line: string; titleEn: string; lineEn: string };
export const LEVELS: Stage2Level[] = [
  { min: 0, code: '00–20', title: 'Хаос', line: 'Усе тримається в голові власника. Кожне рішення — вручну.', titleEn: 'Chaos', lineEn: "Everything lives in the owner's head. Every decision is manual." },
  { min: 20, code: '20–40', title: 'Залежність', line: 'Процеси існують, але зав’язані на конкретних людях.', titleEn: 'Dependence', lineEn: 'Processes exist, but hinge on specific people.' },
  { min: 40, code: '40–60', title: 'Функції', line: 'Системи працюють окремо, але ще не як єдине ціле.', titleEn: 'Functions', lineEn: 'Systems work separately, not yet as one whole.' },
  { min: 60, code: '60–80', title: 'Система', line: 'Бізнес масштабується на власній операційній основі.', titleEn: 'System', lineEn: 'The business scales on its own operational base.' },
  { min: 80, code: '80–100', title: 'Незалежність', line: 'Бізнес здатний працювати й зростати без героя.', titleEn: 'Independence', lineEn: 'The business can run and grow without a hero.' },
];
export const levelFor = (s: number) => [...LEVELS].reverse().find((l) => s >= l.min) ?? LEVELS[0];

/** Локалізований рівень зрілості (той самий min/code, title/line мовою). */
export const localizeLevel = (lvl: Stage2Level, lang: Lang): Stage2Level =>
  lang === 'en' ? { ...lvl, title: lvl.titleEn, line: lvl.lineEn } : lvl;

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
