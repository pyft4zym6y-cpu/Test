/*
 * КРОК 4 — поглиблений аудит (відкривається Access Code). Це продовження
 * анкетування: тут ми йдемо в глибину, де потрібні відкриті відповіді, вивантаження
 * даних і файли за шаблонами. Разом Кроки 1–4 закривають ~85% повної анкети
 * клієнта (26 розділів). Анкета — орієнтир, а не дослівний перелік: формулювання
 * адаптовані під зрозумілий потік, типи питань — багатші (текст/довгий текст/файл).
 *
 * Локалізація: кожен user-visible рядок має EN-двійник (labelEn / optionsEn /
 * placeholderEn / addLabelEn, EN-назви секцій і шаблонів). Джерело (UK) незмінне —
 * id/section/kind/accept/rows/template/порядок опцій не чіпаємо. Рендер бере
 * localizeS4Block / localizeS4Section під поточну мову.
 */
import type { Block } from './stage3Model';

type Lang = 'uk' | 'en';

/** Розширений блок Кроку 4 з англійськими двійниками (лише текст, без зміни логіки). */
export type S4Block = Block & {
  labelEn?: string;
  optionsEn?: string[];
  placeholderEn?: string;
  hintEn?: string;
  addLabelEn?: string;
};

export const STAGE4_SECTIONS = [
  'Бізнес-модель і гроші',
  'Клієнт і попит',
  'Конкуренти і позиціонування',
  'Бренд і комунікації',
  'Продажі і воронка',
  'Дані та аналітика',
  'Операції і команда',
  'Цілі, готовність, ризики',
] as const;

// EN-назви секцій у ТОМУ Ж порядку, що й STAGE4_SECTIONS.
const STAGE4_SECTIONS_EN = [
  'Business model & money',
  'Customer & demand',
  'Competitors & positioning',
  'Brand & communications',
  'Sales & funnel',
  'Data & analytics',
  'Operations & team',
  'Goals, readiness, risks',
] as const;

/** Локалізує назву секції (UK-джерело → EN за індексом). */
export function localizeS4Section(name: string, lang: Lang): string {
  if (lang !== 'en') return name;
  const i = STAGE4_SECTIONS.indexOf(name as typeof STAGE4_SECTIONS[number]);
  return i >= 0 ? STAGE4_SECTIONS_EN[i] : name;
}

// Шаблони для завантаження. labelEn — англійська підпис, href незмінний.
type Tpl = { label: string; labelEn: string; href: string };
const T: Record<'pnl' | 'unit' | 'rev' | 'ch' | 'cjm' | 'access', Tpl> = {
  pnl: { label: 'P&L (Excel)', labelEn: 'P&L (Excel)', href: '/templates/weexp-pnl.csv' },
  unit: { label: 'Юніт-економіка (Excel)', labelEn: 'Unit economics (Excel)', href: '/templates/weexp-unit-economics.csv' },
  rev: { label: 'Динаміка виручки (Excel)', labelEn: 'Revenue dynamics (Excel)', href: '/templates/weexp-revenue-dynamics.csv' },
  ch: { label: 'Канали продажів (Excel)', labelEn: 'Sales channels (Excel)', href: '/templates/weexp-channels.csv' },
  cjm: { label: 'Карта шляху клієнта (Excel)', labelEn: 'Customer journey map (Excel)', href: '/templates/weexp-cjm.csv' },
  access: { label: 'Чек-лист доступів (Excel)', labelEn: 'Access checklist (Excel)', href: '/templates/weexp-data-access.csv' },
};
const FILES = '.xlsx,.xls,.csv,.pdf,.doc,.docx,.numbers,.pages';

export const STAGE4_BLOCKS: S4Block[] = [
  // 1 — Бізнес-модель і гроші
  { id: 's4_model', section: 'Бізнес-модель і гроші', kind: 'longtext', system: 'strategy',
    label: 'Опишіть бізнес-модель одним-двома реченнями: хто платить, за що і чому саме вам.',
    labelEn: 'Describe your business model in one or two sentences: who pays, for what, and why you.',
    placeholder: 'Хто клієнт, яку цінність він купує, чому обирає вас…',
    placeholderEn: 'Who the customer is, the value they buy, why they choose you…', rows: 4 },
  { id: 's4_why_now', section: 'Бізнес-модель і гроші', kind: 'single', system: 'strategy',
    label: 'Чому ви вирішили підсилити проєкт саме зараз?',
    labelEn: 'Why have you decided to strengthen the project right now?',
    options: [{ label: 'Падають продажі' }, { label: 'Не можемо масштабуватись' }, { label: 'Інвестор/партнер вимагає росту' }, { label: 'Вихід на новий ринок' }, { label: 'Зміна платформи' }, { label: 'Інше' }],
    optionsEn: ['Sales are falling', 'We can’t scale', 'Investor/partner demands growth', 'Entering a new market', 'Platform change', 'Other'] },
  { id: 's4_channels_file', section: 'Бізнес-модель і гроші', kind: 'file', accept: FILES, template: T.ch,
    label: 'Частка виручки за каналами — заповніть шаблон і завантажте.',
    labelEn: 'Revenue share by channel — fill in the template and upload.',
    placeholder: 'Завантажити канали (Excel)…', placeholderEn: 'Upload channels (Excel)…', optional: true },
  { id: 's4_rev_file', section: 'Бізнес-модель і гроші', kind: 'file', accept: FILES, template: T.rev,
    label: 'Динаміка виручки за 24 місяці по кварталах — за шаблоном.',
    labelEn: 'Revenue dynamics over 24 months by quarter — using the template.',
    placeholder: 'Завантажити динаміку (Excel)…', placeholderEn: 'Upload dynamics (Excel)…', optional: true },
  { id: 's4_pnl_file', section: 'Бізнес-модель і гроші', kind: 'file', accept: FILES, template: T.pnl, system: 'commercial',
    label: 'P&L за останні 3 місяці — за шаблоном (можна знеособлено, у %).',
    labelEn: 'P&L for the last 3 months — using the template (anonymized, in %, is fine).',
    placeholder: 'Завантажити P&L (Excel)…', placeholderEn: 'Upload P&L (Excel)…', optional: true },
  { id: 's4_unit_file', section: 'Бізнес-модель і гроші', kind: 'file', accept: FILES, template: T.unit, system: 'commercial',
    label: 'Юніт-економіка (AOV, CAC, маржа, LTV) — за шаблоном.',
    labelEn: 'Unit economics (AOV, CAC, margin, LTV) — using the template.',
    placeholder: 'Завантажити юніт-економіку (Excel)…', placeholderEn: 'Upload unit economics (Excel)…', optional: true },
  { id: 's4_channel_risk', section: 'Бізнес-модель і гроші', kind: 'single', system: 'strategy',
    label: 'Якщо найбільший канал завтра відключать — скільки місяців проживе бізнес?',
    labelEn: 'If your largest channel were cut off tomorrow — how many months would the business survive?',
    options: [{ label: '<1 місяць' }, { label: '1–3 місяці' }, { label: '3–6 місяців' }, { label: '>6 місяців' }, { label: 'Не можемо оцінити' }],
    optionsEn: ['<1 month', '1–3 months', '3–6 months', '>6 months', 'Can’t estimate'] },

  // 2 — Клієнт і попит
  { id: 's4_jtbd', section: 'Клієнт і попит', kind: 'longtext', system: 'customer',
    label: 'Яку задачу клієнта розв’язує ваш продукт? Сформулюйте від імені клієнта, а не компанії.',
    labelEn: 'What customer job does your product solve? Phrase it from the customer’s side, not the company’s.',
    placeholder: '«Мені потрібно…, тому я…»', placeholderEn: '“I need…, so I…”', rows: 4 },
  { id: 's4_why_buy', section: 'Клієнт і попит', kind: 'longtext', system: 'customer',
    label: 'Чому клієнти купують саме у вас? Назвіть 3 причини їхніми словами.',
    labelEn: 'Why do customers buy from you specifically? Give 3 reasons in their words.', rows: 4 },
  { id: 's4_why_buy_proof', section: 'Клієнт і попит', kind: 'single', system: 'customer',
    label: 'Ці причини підтверджені дослідженням чи це думка команди?',
    labelEn: 'Are these reasons backed by research or are they the team’s opinion?',
    options: [{ label: 'Дослідження клієнтів' }, { label: 'Дані про поведінку' }, { label: 'Думка команди' }, { label: 'Не перевіряли' }],
    optionsEn: ['Customer research', 'Behavioral data', 'Team’s opinion', 'Haven’t checked'] },
  { id: 's4_objections', section: 'Клієнт і попит', kind: 'multi', system: 'experience',
    label: 'Які заперечення звучать найчастіше? (оберіть усе)',
    labelEn: 'Which objections come up most often? (select all)',
    options: [{ label: 'Ціна' }, { label: 'Довіра до магазину' }, { label: 'Строки доставки' }, { label: 'Якість' }, { label: 'Гарантія/повернення' }, { label: 'Складно обрати' }, { label: 'Немає потрібної оплати' }],
    optionsEn: ['Price', 'Trust in the store', 'Delivery times', 'Quality', 'Warranty/returns', 'Hard to choose', 'No suitable payment option'] },
  { id: 's4_segments', section: 'Клієнт і попит', kind: 'text', system: 'customer',
    label: 'Які сегменти клієнтів ви розрізняєте і за якою ознакою?',
    labelEn: 'Which customer segments do you distinguish, and by what criterion?', maxLen: 200 },
  { id: 's4_cjm_file', section: 'Клієнт і попит', kind: 'file', accept: FILES, template: T.cjm,
    label: 'Карта шляху клієнта (CJM) хоча б для одного сегмента — за шаблоном.',
    labelEn: 'Customer journey map (CJM) for at least one segment — using the template.',
    placeholder: 'Завантажити CJM (Excel)…', placeholderEn: 'Upload CJM (Excel)…', optional: true },
  { id: 's4_lost_stage', section: 'Клієнт і попит', kind: 'single', system: 'experience',
    label: 'На якому етапі шляху втрачається найбільше клієнтів?',
    labelEn: 'At which stage of the journey do you lose the most customers?',
    options: [{ label: 'Обізнаність' }, { label: 'Розгляд' }, { label: 'Вибір' }, { label: 'Покупка' }, { label: 'Отримання' }, { label: 'Повторна покупка' }],
    optionsEn: ['Awareness', 'Consideration', 'Selection', 'Purchase', 'Delivery', 'Repeat purchase'] },

  // 3 — Конкуренти і позиціонування
  { id: 's4_competitors', section: 'Конкуренти і позиціонування', kind: 'urllist', placeholder: 'https://',
    label: 'Топ-конкуренти за спаданням загрози — додайте посилання.',
    labelEn: 'Top competitors in descending order of threat — add links.',
    addLabel: '+ Ще конкурент', addLabelEn: '+ Another competitor' },
  { id: 's4_why_them', section: 'Конкуренти і позиціонування', kind: 'longtext', system: 'strategy',
    label: 'Чому клієнт обирає ключового конкурента, а не вас? Будьте чесні.',
    labelEn: 'Why does the customer choose your key competitor over you? Be honest.', rows: 4 },
  { id: 's4_pos_axes', section: 'Конкуренти і позиціонування', kind: 'text', system: 'strategy',
    label: 'За якими двома осями має сенс будувати карту позиціонування у вашій категорії?',
    labelEn: 'Which two axes make sense for a positioning map in your category?', maxLen: 160 },
  { id: 's4_moat', section: 'Конкуренти і позиціонування', kind: 'longtext', system: 'strategy',
    label: 'Що вас реально відрізняє (окрім ціни) і чому це важко скопіювати?',
    labelEn: 'What truly sets you apart (beyond price) and why is it hard to copy?', rows: 4, optional: true },

  // 4 — Бренд і комунікації
  { id: 's4_brand_pos', section: 'Бренд і комунікації', kind: 'single', system: 'strategy',
    label: 'Наскільки сформульоване позиціонування бренду?',
    labelEn: 'How well-defined is your brand positioning?',
    options: [{ label: 'Є документ, ним керуємось', score: 3 }, { label: 'Є в голові засновника', score: 2 }, { label: 'Фрагментарно', score: 1 }, { label: 'Немає', score: 0 }],
    optionsEn: ['There’s a document we follow', 'It’s in the founder’s head', 'Fragmented', 'None'] },
  { id: 's4_brand_promise', section: 'Бренд і комунікації', kind: 'text', system: 'strategy',
    label: 'Одне речення: яку обіцянку бренд дає клієнту?',
    labelEn: 'One sentence: what promise does the brand make to the customer?', maxLen: 160 },
  { id: 's4_tone', section: 'Бренд і комунікації', kind: 'single', system: 'experience',
    label: 'Чи є єдиний tone of voice і візуальні гайдлайни?',
    labelEn: 'Is there a unified tone of voice and visual guidelines?',
    options: [{ label: 'Так, гайдлайн + tone of voice' }, { label: 'Частково' }, { label: 'Ні, як вийде' }],
    optionsEn: ['Yes, guidelines + tone of voice', 'Partially', 'No, ad hoc'] },
  { id: 's4_content', section: 'Бренд і комунікації', kind: 'single', system: 'experience',
    label: 'Чи працює на вас контент (системно, а не спорадично)?',
    labelEn: 'Does content work for you (systematically, not sporadically)?',
    options: [{ label: 'Системно, з планом' }, { label: 'Нерегулярно' }, { label: 'Майже немає' }],
    optionsEn: ['Systematically, with a plan', 'Irregularly', 'Almost none'] },

  // 5 — Продажі і воронка
  { id: 's4_sales_model', section: 'Продажі і воронка', kind: 'single', system: 'commercial',
    label: 'Як зараз влаштовані продажі?',
    labelEn: 'How are sales set up today?',
    options: [{ label: 'Тільки сайт/самообслуговування' }, { label: 'Сайт + відділ продажів' }, { label: 'Переважно менеджери' }, { label: 'Опт/B2B' }],
    optionsEn: ['Website/self-service only', 'Website + sales team', 'Mostly sales reps', 'Wholesale/B2B'] },
  { id: 's4_funnel_leak', section: 'Продажі і воронка', kind: 'longtext', system: 'experience',
    label: 'Де у воронці найбільша «діра» і чому ви так вважаєте?',
    labelEn: 'Where is the biggest “leak” in the funnel, and why do you think so?', rows: 4 },
  { id: 's4_crm', section: 'Продажі і воронка', kind: 'single', system: 'customer',
    label: 'Що з CRM і роботою з базою?',
    labelEn: 'What about CRM and working with your database?',
    options: [{ label: 'CRM + сегменти + автоматизації', score: 3 }, { label: 'CRM є, але база «спить»', score: 1 }, { label: 'Excel/нотатки', score: 0 }, { label: 'Немає', score: 0 }],
    optionsEn: ['CRM + segments + automations', 'CRM exists, but the base is “asleep”', 'Excel/notes', 'None'] },
  { id: 's4_retention', section: 'Продажі і воронка', kind: 'single', system: 'customer',
    label: 'Що працює на повернення клієнта? (оберіть головне)',
    labelEn: 'What drives customers to return? (pick the main one)',
    options: [{ label: 'Email/CRM-сценарії' }, { label: 'Програма лояльності' }, { label: 'Ретаргетинг' }, { label: 'Нічого системного' }],
    optionsEn: ['Email/CRM flows', 'Loyalty program', 'Retargeting', 'Nothing systematic'] },

  // 6 — Дані та аналітика
  { id: 's4_access_file', section: 'Дані та аналітика', kind: 'file', accept: FILES, template: T.access, system: 'data',
    label: 'Чек-лист доступів (GA4, GSC, кабінети, CRM) — заповніть, що вже є.',
    labelEn: 'Access checklist (GA4, GSC, ad accounts, CRM) — fill in what you already have.',
    placeholder: 'Завантажити чек-лист (Excel)…', placeholderEn: 'Upload checklist (Excel)…', optional: true },
  { id: 's4_analytics', section: 'Дані та аналітика', kind: 'single', system: 'data',
    label: 'Наскільки ви довіряєте своїй аналітиці для рішень?',
    labelEn: 'How much do you trust your analytics for decisions?',
    options: [{ label: 'Наскрізна, одні цифри для всіх', score: 3 }, { label: 'Є GA4, але дивимось рідко', score: 1 }, { label: 'У кожного свої цифри', score: 0 }, { label: 'Практично не міряємо', score: 0 }],
    optionsEn: ['End-to-end, one set of numbers for everyone', 'We have GA4 but rarely look', 'Everyone has their own numbers', 'We barely measure'] },
  { id: 's4_kpi_weekly', section: 'Дані та аналітика', kind: 'text', system: 'org',
    label: 'Які 3 KPI ви особисто дивитесь щотижня?',
    labelEn: 'Which 3 KPIs do you personally review every week?', maxLen: 200 },
  { id: 's4_kpi_missing', section: 'Дані та аналітика', kind: 'text', system: 'org',
    label: 'Які KPI ви НЕ відстежуєте, але мали б?',
    labelEn: 'Which KPIs do you NOT track but should?', maxLen: 200, optional: true },

  // 7 — Операції і команда
  { id: 's4_breaks_first', section: 'Операції і команда', kind: 'single', system: 'operations',
    label: 'Що ламається першим при зростанні ×2?',
    labelEn: 'What breaks first when you grow ×2?',
    options: [{ label: 'Склад/логістика' }, { label: 'Платформа/сайт' }, { label: 'Команда' }, { label: 'Гроші/закупівлі' }, { label: 'Підтримка/сервіс' }],
    optionsEn: ['Warehouse/logistics', 'Platform/website', 'Team', 'Cash/procurement', 'Support/service'] },
  { id: 's4_owner_dependency', section: 'Операції і команда', kind: 'single', system: 'org',
    label: 'Яка частина бізнесу тримається на одній людині?',
    labelEn: 'How much of the business rests on a single person?',
    options: [{ label: 'Майже все на власнику', score: 0 }, { label: 'Кілька ключових зон', score: 1 }, { label: 'Здебільшого делеговано', score: 2 }, { label: 'Працює без героя', score: 3 }],
    optionsEn: ['Almost everything on the owner', 'A few key areas', 'Mostly delegated', 'Runs without a hero'] },
  { id: 's4_owner_manual', section: 'Операції і команда', kind: 'text', system: 'org',
    label: 'Що ви робите особисто, хоча не мали б?',
    labelEn: 'What do you do personally that you shouldn’t?', maxLen: 200 },
  { id: 's4_sop', section: 'Операції і команда', kind: 'single', system: 'org',
    label: 'Наскільки описані процеси (SOP, ролі, RACI)?',
    labelEn: 'How well are processes documented (SOPs, roles, RACI)?',
    options: [{ label: 'Описані й працюють', score: 3 }, { label: 'Частково', score: 1 }, { label: 'У головах', score: 0 }],
    optionsEn: ['Documented and working', 'Partially', 'In people’s heads'] },
  { id: 's4_governance', section: 'Операції і команда', kind: 'single', system: 'org',
    label: 'Чи є регулярний управлінський цикл (план → факт → причини → дії)?',
    labelEn: 'Is there a regular management cycle (plan → actual → causes → actions)?',
    options: [{ label: 'Так, щотижня/щомісяця' }, { label: 'Нерегулярно' }, { label: 'Ні' }],
    optionsEn: ['Yes, weekly/monthly', 'Irregularly', 'No'] },

  // 8 — Цілі, готовність, ризики
  { id: 's4_target', section: 'Цілі, готовність, ризики', kind: 'text', system: 'strategy',
    label: 'Цільова виручка через 12 місяців (порядок, можна діапазон).',
    labelEn: 'Target revenue in 12 months (order of magnitude, a range is fine).', maxLen: 120 },
  { id: 's4_growth_driver', section: 'Цілі, готовність, ризики', kind: 'multi', system: 'strategy',
    label: 'За рахунок чого плануєте рости? (оберіть усе)',
    labelEn: 'What will drive your growth? (select all)',
    options: [{ label: 'Нові клієнти' }, { label: 'Повторні продажі' }, { label: 'Середній чек' }, { label: 'Нові ринки' }, { label: 'Нові категорії' }],
    optionsEn: ['New customers', 'Repeat sales', 'Average order value', 'New markets', 'New categories'] },
  { id: 's4_90days', section: 'Цілі, готовність, ризики', kind: 'longtext', system: 'strategy',
    label: 'Які 3 задачі мають бути закриті у перші 90 днів?',
    labelEn: 'Which 3 tasks must be closed in the first 90 days?', rows: 4 },
  { id: 's4_ai_ready', section: 'Цілі, готовність, ризики', kind: 'single', system: 'data',
    label: 'Наскільки ви готові впроваджувати AI/автоматизації в процеси?',
    labelEn: 'How ready are you to adopt AI/automation in your processes?',
    options: [{ label: 'Вже впроваджуємо' }, { label: 'Готові, немає рук' }, { label: 'Цікаво, але не пріоритет' }, { label: 'Поки ні' }],
    optionsEn: ['Already adopting', 'Ready, but no hands', 'Curious, but not a priority', 'Not yet'] },
  { id: 's4_risk', section: 'Цілі, готовність, ризики', kind: 'longtext', system: 'strategy',
    label: 'Який головний ризик може зупинити ріст у наступні 12 місяців?',
    labelEn: 'What is the main risk that could stall growth over the next 12 months?', rows: 4, optional: true },
  { id: 's4_strategy_file', section: 'Цілі, готовність, ризики', kind: 'file', accept: FILES,
    label: 'Якщо є стратегія/план/презентація — завантажте (будь-який формат).',
    labelEn: 'If you have a strategy/plan/presentation — upload it (any format).',
    placeholder: 'Завантажити документ…', placeholderEn: 'Upload document…', optional: true },
];

/**
 * Локалізує блок під мову. UK — повертає як є; EN — підставляє labelEn / optionsEn /
 * placeholderEn / hintEn / addLabelEn і англійський підпис шаблону, не чіпаючи
 * id/section/kind/score/href і порядок опцій.
 */
export function localizeS4Block(b: S4Block, lang: Lang): Block {
  if (lang !== 'en') return b;
  const tpl = b.template as (Tpl | undefined);
  return {
    ...b,
    label: b.labelEn ?? b.label,
    options: b.options?.map((o, i) => ({ ...o, label: b.optionsEn?.[i] ?? o.label })),
    placeholder: b.placeholderEn ?? b.placeholder,
    hint: b.hintEn ?? b.hint,
    addLabel: b.addLabelEn ?? b.addLabel,
    template: tpl ? { label: tpl.labelEn ?? tpl.label, href: tpl.href } : b.template,
  };
}
