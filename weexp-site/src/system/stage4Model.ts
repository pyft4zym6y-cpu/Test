/*
 * КРОК 4 — поглиблений аудит (відкривається Access Code). Це продовження
 * анкетування: тут ми йдемо в глибину, де потрібні відкриті відповіді, вивантаження
 * даних і файли за шаблонами. Разом Кроки 1–4 закривають ~85% повної анкети
 * клієнта (26 розділів). Анкета — орієнтир, а не дослівний перелік: формулювання
 * адаптовані під зрозумілий потік, типи питань — багатші (текст/довгий текст/файл).
 */
import type { Block } from './stage3Model';

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

const T = {
  pnl: { label: 'P&L (Excel)', href: '/templates/weexp-pnl.csv' },
  unit: { label: 'Юніт-економіка (Excel)', href: '/templates/weexp-unit-economics.csv' },
  rev: { label: 'Динаміка виручки (Excel)', href: '/templates/weexp-revenue-dynamics.csv' },
  ch: { label: 'Канали продажів (Excel)', href: '/templates/weexp-channels.csv' },
  cjm: { label: 'Карта шляху клієнта (Excel)', href: '/templates/weexp-cjm.csv' },
  access: { label: 'Чек-лист доступів (Excel)', href: '/templates/weexp-data-access.csv' },
};
const FILES = '.xlsx,.xls,.csv,.pdf,.doc,.docx,.numbers,.pages';

export const STAGE4_BLOCKS: Block[] = [
  // 1 — Бізнес-модель і гроші
  { id: 's4_model', section: 'Бізнес-модель і гроші', kind: 'longtext', system: 'strategy',
    label: 'Опишіть бізнес-модель одним-двома реченнями: хто платить, за що і чому саме вам.',
    placeholder: 'Хто клієнт, яку цінність він купує, чому обирає вас…', rows: 4 },
  { id: 's4_why_now', section: 'Бізнес-модель і гроші', kind: 'single', system: 'strategy',
    label: 'Чому ви вирішили підсилити проєкт саме зараз?',
    options: [{ label: 'Падають продажі' }, { label: 'Не можемо масштабуватись' }, { label: 'Інвестор/партнер вимагає росту' }, { label: 'Вихід на новий ринок' }, { label: 'Зміна платформи' }, { label: 'Інше' }] },
  { id: 's4_channels_file', section: 'Бізнес-модель і гроші', kind: 'file', accept: FILES, template: T.ch,
    label: 'Частка виручки за каналами — заповніть шаблон і завантажте.',
    placeholder: 'Завантажити канали (Excel)…', optional: true },
  { id: 's4_rev_file', section: 'Бізнес-модель і гроші', kind: 'file', accept: FILES, template: T.rev,
    label: 'Динаміка виручки за 24 місяці по кварталах — за шаблоном.',
    placeholder: 'Завантажити динаміку (Excel)…', optional: true },
  { id: 's4_pnl_file', section: 'Бізнес-модель і гроші', kind: 'file', accept: FILES, template: T.pnl, system: 'commercial',
    label: 'P&L за останні 3 місяці — за шаблоном (можна знеособлено, у %).',
    placeholder: 'Завантажити P&L (Excel)…', optional: true },
  { id: 's4_unit_file', section: 'Бізнес-модель і гроші', kind: 'file', accept: FILES, template: T.unit, system: 'commercial',
    label: 'Юніт-економіка (AOV, CAC, маржа, LTV) — за шаблоном.',
    placeholder: 'Завантажити юніт-економіку (Excel)…', optional: true },
  { id: 's4_channel_risk', section: 'Бізнес-модель і гроші', kind: 'single', system: 'strategy',
    label: 'Якщо найбільший канал завтра відключать — скільки місяців проживе бізнес?',
    options: [{ label: '<1 місяць' }, { label: '1–3 місяці' }, { label: '3–6 місяців' }, { label: '>6 місяців' }, { label: 'Не можемо оцінити' }] },

  // 2 — Клієнт і попит
  { id: 's4_jtbd', section: 'Клієнт і попит', kind: 'longtext', system: 'customer',
    label: 'Яку задачу клієнта розв’язує ваш продукт? Сформулюйте від імені клієнта, а не компанії.',
    placeholder: '«Мені потрібно…, тому я…»', rows: 4 },
  { id: 's4_why_buy', section: 'Клієнт і попит', kind: 'longtext', system: 'customer',
    label: 'Чому клієнти купують саме у вас? Назвіть 3 причини їхніми словами.', rows: 4 },
  { id: 's4_why_buy_proof', section: 'Клієнт і попит', kind: 'single', system: 'customer',
    label: 'Ці причини підтверджені дослідженням чи це думка команди?',
    options: [{ label: 'Дослідження клієнтів' }, { label: 'Дані про поведінку' }, { label: 'Думка команди' }, { label: 'Не перевіряли' }] },
  { id: 's4_objections', section: 'Клієнт і попит', kind: 'multi', system: 'experience',
    label: 'Які заперечення звучать найчастіше? (оберіть усе)',
    options: [{ label: 'Ціна' }, { label: 'Довіра до магазину' }, { label: 'Строки доставки' }, { label: 'Якість' }, { label: 'Гарантія/повернення' }, { label: 'Складно обрати' }, { label: 'Немає потрібної оплати' }] },
  { id: 's4_segments', section: 'Клієнт і попит', kind: 'text', system: 'customer',
    label: 'Які сегменти клієнтів ви розрізняєте і за якою ознакою?', maxLen: 200 },
  { id: 's4_cjm_file', section: 'Клієнт і попит', kind: 'file', accept: FILES, template: T.cjm,
    label: 'Карта шляху клієнта (CJM) хоча б для одного сегмента — за шаблоном.',
    placeholder: 'Завантажити CJM (Excel)…', optional: true },
  { id: 's4_lost_stage', section: 'Клієнт і попит', kind: 'single', system: 'experience',
    label: 'На якому етапі шляху втрачається найбільше клієнтів?',
    options: [{ label: 'Обізнаність' }, { label: 'Розгляд' }, { label: 'Вибір' }, { label: 'Покупка' }, { label: 'Отримання' }, { label: 'Повторна покупка' }] },

  // 3 — Конкуренти і позиціонування
  { id: 's4_competitors', section: 'Конкуренти і позиціонування', kind: 'urllist', placeholder: 'https://',
    label: 'Топ-конкуренти за спаданням загрози — додайте посилання.', addLabel: '+ Ще конкурент' },
  { id: 's4_why_them', section: 'Конкуренти і позиціонування', kind: 'longtext', system: 'strategy',
    label: 'Чому клієнт обирає ключового конкурента, а не вас? Будьте чесні.', rows: 4 },
  { id: 's4_pos_axes', section: 'Конкуренти і позиціонування', kind: 'text', system: 'strategy',
    label: 'За якими двома осями має сенс будувати карту позиціонування у вашій категорії?', maxLen: 160 },
  { id: 's4_moat', section: 'Конкуренти і позиціонування', kind: 'longtext', system: 'strategy',
    label: 'Що вас реально відрізняє (окрім ціни) і чому це важко скопіювати?', rows: 4, optional: true },

  // 4 — Бренд і комунікації
  { id: 's4_brand_pos', section: 'Бренд і комунікації', kind: 'single', system: 'strategy',
    label: 'Наскільки сформульоване позиціонування бренду?',
    options: [{ label: 'Є документ, ним керуємось', score: 3 }, { label: 'Є в голові засновника', score: 2 }, { label: 'Фрагментарно', score: 1 }, { label: 'Немає', score: 0 }] },
  { id: 's4_brand_promise', section: 'Бренд і комунікації', kind: 'text', system: 'strategy',
    label: 'Одне речення: яку обіцянку бренд дає клієнту?', maxLen: 160 },
  { id: 's4_tone', section: 'Бренд і комунікації', kind: 'single', system: 'experience',
    label: 'Чи є єдиний tone of voice і візуальні гайдлайни?',
    options: [{ label: 'Так, гайдлайн + tone of voice' }, { label: 'Частково' }, { label: 'Ні, як вийде' }] },
  { id: 's4_content', section: 'Бренд і комунікації', kind: 'single', system: 'experience',
    label: 'Чи працює на вас контент (системно, а не спорадично)?',
    options: [{ label: 'Системно, з планом' }, { label: 'Нерегулярно' }, { label: 'Майже немає' }] },

  // 5 — Продажі і воронка
  { id: 's4_sales_model', section: 'Продажі і воронка', kind: 'single', system: 'commercial',
    label: 'Як зараз влаштовані продажі?',
    options: [{ label: 'Тільки сайт/самообслуговування' }, { label: 'Сайт + відділ продажів' }, { label: 'Переважно менеджери' }, { label: 'Опт/B2B' }] },
  { id: 's4_funnel_leak', section: 'Продажі і воронка', kind: 'longtext', system: 'experience',
    label: 'Де у воронці найбільша «діра» і чому ви так вважаєте?', rows: 4 },
  { id: 's4_crm', section: 'Продажі і воронка', kind: 'single', system: 'customer',
    label: 'Що з CRM і роботою з базою?',
    options: [{ label: 'CRM + сегменти + автоматизації', score: 3 }, { label: 'CRM є, але база «спить»', score: 1 }, { label: 'Excel/нотатки', score: 0 }, { label: 'Немає', score: 0 }] },
  { id: 's4_retention', section: 'Продажі і воронка', kind: 'single', system: 'customer',
    label: 'Що працює на повернення клієнта? (оберіть головне)',
    options: [{ label: 'Email/CRM-сценарії' }, { label: 'Програма лояльності' }, { label: 'Ретаргетинг' }, { label: 'Нічого системного' }] },

  // 6 — Дані та аналітика
  { id: 's4_access_file', section: 'Дані та аналітика', kind: 'file', accept: FILES, template: T.access, system: 'data',
    label: 'Чек-лист доступів (GA4, GSC, кабінети, CRM) — заповніть, що вже є.',
    placeholder: 'Завантажити чек-лист (Excel)…', optional: true },
  { id: 's4_analytics', section: 'Дані та аналітика', kind: 'single', system: 'data',
    label: 'Наскільки ви довіряєте своїй аналітиці для рішень?',
    options: [{ label: 'Наскрізна, одні цифри для всіх', score: 3 }, { label: 'Є GA4, але дивимось рідко', score: 1 }, { label: 'У кожного свої цифри', score: 0 }, { label: 'Практично не міряємо', score: 0 }] },
  { id: 's4_kpi_weekly', section: 'Дані та аналітика', kind: 'text', system: 'org',
    label: 'Які 3 KPI ви особисто дивитесь щотижня?', maxLen: 200 },
  { id: 's4_kpi_missing', section: 'Дані та аналітика', kind: 'text', system: 'org',
    label: 'Які KPI ви НЕ відстежуєте, але мали б?', maxLen: 200, optional: true },

  // 7 — Операції і команда
  { id: 's4_breaks_first', section: 'Операції і команда', kind: 'single', system: 'operations',
    label: 'Що ламається першим при зростанні ×2?',
    options: [{ label: 'Склад/логістика' }, { label: 'Платформа/сайт' }, { label: 'Команда' }, { label: 'Гроші/закупівлі' }, { label: 'Підтримка/сервіс' }] },
  { id: 's4_owner_dependency', section: 'Операції і команда', kind: 'single', system: 'org',
    label: 'Яка частина бізнесу тримається на одній людині?',
    options: [{ label: 'Майже все на власнику', score: 0 }, { label: 'Кілька ключових зон', score: 1 }, { label: 'Здебільшого делеговано', score: 2 }, { label: 'Працює без героя', score: 3 }] },
  { id: 's4_owner_manual', section: 'Операції і команда', kind: 'text', system: 'org',
    label: 'Що ви робите особисто, хоча не мали б?', maxLen: 200 },
  { id: 's4_sop', section: 'Операції і команда', kind: 'single', system: 'org',
    label: 'Наскільки описані процеси (SOP, ролі, RACI)?',
    options: [{ label: 'Описані й працюють', score: 3 }, { label: 'Частково', score: 1 }, { label: 'У головах', score: 0 }] },
  { id: 's4_governance', section: 'Операції і команда', kind: 'single', system: 'org',
    label: 'Чи є регулярний управлінський цикл (план → факт → причини → дії)?',
    options: [{ label: 'Так, щотижня/щомісяця' }, { label: 'Нерегулярно' }, { label: 'Ні' }] },

  // 8 — Цілі, готовність, ризики
  { id: 's4_target', section: 'Цілі, готовність, ризики', kind: 'text', system: 'strategy',
    label: 'Цільова виручка через 12 місяців (порядок, можна діапазон).', maxLen: 120 },
  { id: 's4_growth_driver', section: 'Цілі, готовність, ризики', kind: 'multi', system: 'strategy',
    label: 'За рахунок чого плануєте рости? (оберіть усе)',
    options: [{ label: 'Нові клієнти' }, { label: 'Повторні продажі' }, { label: 'Середній чек' }, { label: 'Нові ринки' }, { label: 'Нові категорії' }] },
  { id: 's4_90days', section: 'Цілі, готовність, ризики', kind: 'longtext', system: 'strategy',
    label: 'Які 3 задачі мають бути закриті у перші 90 днів?', rows: 4 },
  { id: 's4_ai_ready', section: 'Цілі, готовність, ризики', kind: 'single', system: 'data',
    label: 'Наскільки ви готові впроваджувати AI/автоматизації в процеси?',
    options: [{ label: 'Вже впроваджуємо' }, { label: 'Готові, немає рук' }, { label: 'Цікаво, але не пріоритет' }, { label: 'Поки ні' }] },
  { id: 's4_risk', section: 'Цілі, готовність, ризики', kind: 'longtext', system: 'strategy',
    label: 'Який головний ризик може зупинити ріст у наступні 12 місяців?', rows: 4, optional: true },
  { id: 's4_strategy_file', section: 'Цілі, готовність, ризики', kind: 'file', accept: FILES,
    label: 'Якщо є стратегія/план/презентація — завантажте (будь-який формат).',
    placeholder: 'Завантажити документ…', optional: true },
];
