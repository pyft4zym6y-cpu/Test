/**
 * Калькулятор · Етап 3 (Tier-2) — кабінет кваліфікації ліда. Клієнт реєструється й
 * «занурює» нас у бізнес: спершу — його ціль (точка Б), далі конкуренти (динамічні
 * рядки), сайти-орієнтири (рядок + що подобається) і нативна діагностика за
 * показниками GA4 / Search Console / фінансів / команди. Питання не в лоб, а через
 * вибір. Мета — щоб клієнт САМ побачив вузол і дійшов, що йому потрібні (1) повний
 * розбір командою WEEXP і (2) нова платформа. На виході — Tier-2 звіт з епіфанією
 * (де насправді корінь) і персональними наступними кроками під Definition of Done.
 */
import { SYS, eur, type SysKey } from './lossModel';

export type BlockKind =
  | 'single' | 'multi' | 'number' | 'url' | 'urllist' | 'refs'
  // Глибші типи для Кроку 4 (поглиблений аудит):
  | 'text'      // короткий відкритий (до 1 речення)
  | 'longtext'  // розгорнутий відкритий (до ~7 речень)
  | 'file';     // завантаження файлу (Word/Excel/PDF) за шаблоном
export type Template = { label: string; href: string; labelEn?: string };
export type Block = {
  id: string;
  section: string;
  label: string;
  kind: BlockKind;
  system?: SysKey;
  options?: { label: string; score?: number }[];
  unit?: string;
  placeholder?: string;
  hint?: string;
  addLabel?: string;
  rows?: number;         // для longtext
  maxLen?: number;       // мʼякий ліміт символів (text/longtext)
  accept?: string;       // для file, напр. '.xlsx,.xls,.csv,.pdf,.doc,.docx'
  template?: Template;   // шаблон для завантаження поруч із питанням (file)
  optional?: boolean;    // явно необовʼязкове питання
  // ── EN-двомовність: тільки текст, порядок опцій НЕ змінюється (індекс = скоринг).
  labelEn?: string;
  optionsEn?: string[];  // паралельно options, у ТОМУ Ж порядку
  hintEn?: string;
  placeholderEn?: string;
  addLabelEn?: string;
  unitEn?: string;
};

export type RefItem = { url: string; what: number[] };

export const SECTIONS = [
  'Ваша ціль', 'Конкурентне поле', 'Орієнтири', 'Маркетинг та аналітика', 'Фінанси', 'Позиціонування і бренд', 'Сайт і технології', 'Ринки та експансія', 'Команда і процеси',
] as const;

// EN-підписи секцій (ключ = UA-назва зі SECTIONS).
export const SECTION_EN: Record<string, string> = {
  'Ваша ціль': 'Your goal',
  'Конкурентне поле': 'Competitive field',
  'Орієнтири': 'References',
  'Маркетинг та аналітика': 'Marketing & analytics',
  'Фінанси': 'Finance',
  'Позиціонування і бренд': 'Positioning & brand',
  'Сайт і технології': 'Site & technology',
  'Ринки та експансія': 'Markets & expansion',
  'Команда і процеси': 'Team & processes',
};

export const LIKE_WHAT = [
  { label: 'Візуал / дизайн', labelEn: 'Visual / design' }, { label: 'Логіка / UX', labelEn: 'Logic / UX' }, { label: 'Швидкість і плавність', labelEn: 'Speed & smoothness' },
  { label: 'Контент / картка товару', labelEn: 'Content / product page' }, { label: 'Асортимент / пропозиція', labelEn: 'Assortment / offer' }, { label: 'Довіра / бренд', labelEn: 'Trust / brand' },
];

export const BLOCKS: Block[] = [
  // 0 — Ваша ціль (точка Б перша: емоційний якір, з якого починається весь шлях)
  { id: 'goal_b', section: 'Ваша ціль', label: 'Куди ви хочете прийти за 12 місяців?', kind: 'multi',
    hint: 'Оберіть усе, що відгукується. Далі весь розбір ведемо саме до цього.',
    labelEn: 'Where do you want to be in 12 months?',
    hintEn: 'Select everything that resonates. We steer the whole analysis toward it.',
    optionsEn: ['Multiplied revenue growth', 'Higher margin and profit', 'Independence from the owner', 'New site / platform', 'New channels and markets', 'Systematic analytics and control'],
    options: [{ label: 'Кратний ріст виторгу' }, { label: 'Вища маржа і прибуток' }, { label: 'Незалежність від власника' }, { label: 'Новий сайт / платформа' }, { label: 'Нові канали й ринки' }, { label: 'Системна аналітика і контроль' }] },

  // 1 — Конкурентне поле (динамічні рядки)
  { id: 'comp_direct', section: 'Конкурентне поле', kind: 'urllist', placeholder: 'https://',
    label: 'Хто ваші прямі конкуренти?', hint: 'Ті, хто продає те саме. Один рядок — один сайт, додайте скільки треба.', addLabel: '+ Ще конкурент',
    labelEn: 'Who are your direct competitors?', hintEn: 'Those selling the same thing. One row per site — add as many as you need.', addLabelEn: '+ Another competitor' },
  { id: 'comp_indirect', section: 'Конкурентне поле', kind: 'urllist', placeholder: 'https://',
    label: 'А хто забирає той самий бюджет і увагу клієнта?', hint: 'Непрямі — інша категорія, але конкурують за ваші гроші клієнта.', addLabel: '+ Ще один',
    labelEn: 'And who takes the same budget and customer attention?', hintEn: 'Indirect ones — a different category, but they compete for your customer’s money.', addLabelEn: '+ Add another' },
  { id: 'cpos', section: 'Конкурентне поле', label: 'Як ви почуваєтесь поруч із ними?', kind: 'single', system: 'strategy',
    labelEn: 'How do you feel next to them?',
    optionsEn: ['Weaker in almost everything', 'We win on price only', 'Similar, no clear edge', 'We have 1–2 strengths', 'We have a clear difference', 'Honestly — we haven’t compared'],
    options: [{ label: 'Слабші майже в усьому', score: 0 }, { label: 'Виграємо лише ціною', score: 0.8 }, { label: 'Схожі, без явної переваги', score: 1.4 }, { label: 'Є 1–2 сильні сторони', score: 2.2 }, { label: 'Маємо чітку різницю', score: 3 }, { label: 'Чесно — не порівнювали', score: 1 }] },

  // 2 — Орієнтири
  { id: 'refs', section: 'Орієнтири', kind: 'refs',
    label: 'На які сайти ви рівняєтесь?', hint: 'Додайте сайт і позначте, що саме вам у ньому подобається. Можна кілька.', addLabel: '+ Ще сайт-орієнтир',
    labelEn: 'Which sites do you aspire to?', hintEn: 'Add a site and mark what you like about it. Several are fine.', addLabelEn: '+ Another reference site' },

  // 3 — Маркетинг та аналітика (нативно: GA4 / Search Console / канали)
  { id: 'm_traffic', section: 'Маркетинг та аналітика', label: 'Звідки зараз приходить більшість покупців?', kind: 'multi',
    labelEn: 'Where do most buyers come from right now?',
    optionsEn: ['Paid advertising', 'SEO / organic', 'Social media', 'Email / CRM', 'Marketplaces', 'Direct and referrals'],
    options: [{ label: 'Платна реклама' }, { label: 'SEO-органіка' }, { label: 'Соцмережі' }, { label: 'Email / CRM' }, { label: 'Маркетплейси' }, { label: 'Прямі й рекомендації' }] },
  { id: 'm_ga4', section: 'Маркетинг та аналітика', label: 'Що ви бачите у своїй аналітиці (GA4)?', kind: 'single', system: 'data',
    labelEn: 'What do you see in your analytics (GA4)?',
    optionsEn: ['Not really set up', 'We look in ad platforms', 'We watch traffic and pageviews', 'We track goal conversions', 'End-to-end — down to revenue and ROI', 'Not sure what’s configured'],
    options: [{ label: 'Толком не налаштована', score: 0 }, { label: 'Дивимось у кабінетах реклами', score: 0.8 }, { label: 'Дивимось трафік і перегляди', score: 1.4 }, { label: 'Рахуємо конверсії по цілях', score: 2.2 }, { label: 'Наскрізна — до доходу й ROI', score: 3 }, { label: 'Не знаю, що налаштовано', score: 0.6 }] },
  { id: 'm_sc', section: 'Маркетинг та аналітика', label: 'Як вас видно в Google (Search Console)?', kind: 'single', system: 'data',
    labelEn: 'How visible are you in Google (Search Console)?',
    optionsEn: ['We don’t track it', 'Rankings are mostly low', 'Growing, but unevenly', 'Top for some queries', 'SEO isn’t a priority for us', 'Not sure'],
    options: [{ label: 'Не відстежуємо', score: 0 }, { label: 'Позиції переважно низькі', score: 1 }, { label: 'Ростемо, але нерівномірно', score: 2 }, { label: 'Топ по частині запитів', score: 3 }, { label: 'SEO для нас не пріоритет', score: 1 }, { label: 'Не знаю', score: 0.6 }] },
  { id: 'm_cac', section: 'Маркетинг та аналітика', label: 'Скільки коштує залучити покупця — відносно чека?', kind: 'single', system: 'customer',
    labelEn: 'How much does it cost to acquire a buyer — relative to the AOV?',
    optionsEn: ['More than the order itself', 'About the same as the order', 'Cheaper, but with no cushion', 'Much cheaper than the order', 'Depends on the channel', 'We haven’t measured CAC'],
    options: [{ label: 'Дорожче за сам чек', score: 0 }, { label: 'Приблизно як чек', score: 1 }, { label: 'Дешевше, але без запасу', score: 2 }, { label: 'Значно дешевше за чек', score: 3 }, { label: 'Залежить від каналу', score: 1.5 }, { label: 'Не рахували CAC', score: 0.5 }] },
  { id: 'm_repeat', section: 'Маркетинг та аналітика', label: 'Скільки покупців повертаються за другою покупкою?', kind: 'single', system: 'customer',
    labelEn: 'How many buyers return for a second purchase?',
    optionsEn: ['Almost none', 'Up to 15%', '15–30%', 'Over 30%', 'One-time purchase product', 'We haven’t measured'],
    options: [{ label: 'Майже ніхто', score: 0 }, { label: 'До 15%', score: 1 }, { label: '15–30%', score: 2 }, { label: 'Понад 30%', score: 3 }, { label: 'Товар разової покупки', score: 1.5 }, { label: 'Не рахували', score: 0.6 }] },

  // 4 — Фінанси
  { id: 'f_margin', section: 'Фінанси', label: 'Яка у вас валова маржа?', kind: 'single', system: 'commercial',
    labelEn: 'What’s your gross margin?',
    optionsEn: ['Up to 20%', '20–35%', '35–50%', '50–65%', 'Over 65%', 'Not measured precisely'],
    options: [{ label: 'До 20%', score: 0 }, { label: '20–35%', score: 1 }, { label: '35–50%', score: 2 }, { label: '50–65%', score: 2.6 }, { label: 'Понад 65%', score: 3 }, { label: 'Не рахували точно', score: 0.8 }] },
  { id: 'f_returns', section: 'Фінанси', label: 'Скільки замовлень зривається (повернення + скасування)?', kind: 'single', system: 'operations',
    labelEn: 'How many orders fall through (returns + cancellations)?',
    optionsEn: ['Over 15%', '8–15%', '4–8%', 'Under 4%', 'Prepaid — almost no fall-throughs', 'We don’t track it'],
    options: [{ label: 'Понад 15%', score: 0 }, { label: '8–15%', score: 1 }, { label: '4–8%', score: 2 }, { label: 'Менше 4%', score: 3 }, { label: 'Передоплата — зривів майже немає', score: 2.6 }, { label: 'Не відстежуємо', score: 0.6 }] },
  { id: 'f_unit', section: 'Фінанси', label: 'Чи заробляєте ви з кожного продажу після реклами?', kind: 'single', system: 'commercial',
    labelEn: 'Do you earn on each sale after advertising?',
    optionsEn: ['No / at a loss', 'On the edge', 'Yes, with a small cushion', 'Yes, consistently', 'We earn on repeats, not the first sale', 'We don’t measure'],
    options: [{ label: 'Ні / у мінус', score: 0 }, { label: 'На межі', score: 1 }, { label: 'Так, з невеликим запасом', score: 2 }, { label: 'Так, стабільно', score: 3 }, { label: 'Заробляємо на повторних, не на першому', score: 1.5 }, { label: 'Не рахуємо', score: 0.5 }] },
  { id: 'f_pnl', section: 'Фінанси', label: 'Наскільки прозорий ваш P&L по e-commerce?', kind: 'single', system: 'commercial',
    labelEn: 'How transparent is your e-commerce P&L?',
    optionsEn: ['None', 'We see turnover', 'Margin by product groups', 'Full P&L + unit economics', 'An accountant keeps it, we don’t see it', 'Not sure'],
    options: [{ label: 'Немає', score: 0 }, { label: 'Бачимо оборот', score: 1 }, { label: 'Є маржа по групах', score: 2 }, { label: 'Повний P&L + unit economics', score: 3 }, { label: 'Веде бухгалтер, ми не бачимо', score: 1 }, { label: 'Не знаю', score: 0.6 }] },
  { id: 'f_aov', section: 'Фінанси', label: 'Середній чек (AOV)', kind: 'number', unit: '€', hint: 'необовʼязково — якщо знаєте', labelEn: 'Average order value (AOV)', hintEn: 'optional — if you know it' },
  { id: 'f_ltv', section: 'Фінанси', label: 'Скільки приносить клієнт за рік (LTV)', kind: 'number', unit: '€', hint: 'необовʼязково', labelEn: 'Revenue per customer per year (LTV)', hintEn: 'optional' },
  { id: 'f_pricing', section: 'Фінанси', label: 'Як ви встановлюєте ціни?', kind: 'single', system: 'commercial',
    labelEn: 'How do you set prices?',
    optionsEn: ['Intuitively / however it goes', 'Cost + %', 'Competitors ± markup', 'By unit economics and value'],
    options: [{ label: 'Інтуїтивно / як вийде', score: 0 }, { label: 'Собівартість + %', score: 1 }, { label: 'Конкуренти ± націнка', score: 1.6 }, { label: 'За юніт-економікою і цінністю', score: 3 }] },

  // 5 — Позиціонування і бренд
  { id: 'b_pos', section: 'Позиціонування і бренд', label: 'Чи є у вас чітке позиціонування?', kind: 'single', system: 'strategy',
    options: [{ label: 'Немає, продаємо ціною', score: 0 }, { label: 'Розмите', score: 1 }, { label: 'Є в голові, не на сайті', score: 1.6 }, { label: 'Є, але не всюди', score: 2.3 }, { label: 'Чітке, послідовне', score: 3 }, { label: 'Важко сказати', score: 1 }] },
  { id: 'b_audience', section: 'Позиціонування і бренд', label: 'Наскільки добре ви знаєте свою аудиторію?', kind: 'single', system: 'strategy',
    options: [{ label: 'Інтуїтивно', score: 0 }, { label: 'Демографія', score: 1 }, { label: 'Сегменти + болі', score: 2 }, { label: 'JTBD + дані', score: 3 }] },
  { id: 'b_content', section: 'Позиціонування і бренд', label: 'Чи працює на вас контент?', kind: 'single', system: 'experience',
    options: [{ label: 'Майже немає', score: 0 }, { label: 'Опис товарів', score: 1 }, { label: '+ гайди / відео', score: 2 }, { label: 'Контент-система', score: 3 }] },
  { id: 'b_social', section: 'Позиціонування і бренд', label: 'Що з довірою (відгуки, UGC, кейси)?', kind: 'single', system: 'experience',
    options: [{ label: 'Немає', score: 0 }, { label: 'Кілька відгуків', score: 1 }, { label: 'Регулярні відгуки', score: 2 }, { label: 'Система UGC + рейтинги', score: 3 }] },
  { id: 'b_service', section: 'Позиціонування і бренд', label: 'Що з клієнтським сервісом і швидкістю відповіді?', kind: 'single', system: 'experience',
    options: [{ label: 'Повільно / нестабільно', score: 0 }, { label: 'Відповідаємо, але без стандартів', score: 1 }, { label: 'Є стандарти й канали', score: 2 }, { label: 'Швидко: стандарти + чат-боти', score: 3 }] },

  // 6 — Сайт і технології (нативно веде до нового сайту й розбору)
  { id: 'd_stack', section: 'Сайт і технології', label: 'На чому побудований ваш сайт?', kind: 'single', system: 'data',
    options: [{ label: 'Конструктор (Tilda, Wix…)', score: 0 }, { label: 'Shopify / готова платформа', score: 1.3 }, { label: 'CMS на шаблоні', score: 1.6 }, { label: 'Кастомна на CMS', score: 2.3 }, { label: 'Headless / кастом', score: 3 }, { label: 'Не знаю', score: 0.8 }] },
  { id: 'site_age', section: 'Сайт і технології', label: 'Коли ви востаннє капітально робили або переробляли сайт?', kind: 'single', system: 'experience',
    hint: 'Не косметика, а платформа й логіка.',
    options: [{ label: '5+ років тому', score: 0 }, { label: '3–4 роки тому', score: 1 }, { label: '1–2 роки тому', score: 2 }, { label: 'Менше року тому', score: 3 }] },
  { id: 'site_audit_age', section: 'Сайт і технології', label: 'А коли востаннє робили незалежний аудит сайту й аналітики?', kind: 'single', system: 'data',
    options: [{ label: 'Ніколи', score: 0 }, { label: '2+ роки тому', score: 1 }, { label: 'Цього року', score: 2 }, { label: 'Робимо регулярно', score: 3 }] },
  { id: 'site_pain', section: 'Сайт і технології', label: 'Що на сайті найбільше стримує продажі? (оберіть усе)', kind: 'multi',
    options: [{ label: 'Швидкість' }, { label: 'Мобільна версія' }, { label: 'Checkout / кошик' }, { label: 'Каталог і пошук' }, { label: 'Картка / контент' }, { label: 'Інтеграції й дані' }, { label: 'Застарілий дизайн' }] },

  // 7 — Ринки та експансія (8-а система)
  { id: 'x_markets', section: 'Ринки та експансія', label: 'На скількох ринках ви зараз продаєте?', kind: 'single', system: 'expansion',
    options: [{ label: 'Один — і не думали про інші', score: 0 }, { label: 'Один + маркетплейси', score: 1.2 }, { label: 'Пробували інші, без системи', score: 1.6 }, { label: '2–3 ринки системно', score: 2.3 }, { label: 'Багато ринків, налагоджено', score: 3 }, { label: 'Нам вистачає свого ринку', score: 1.5 }] },
  { id: 'x_intent', section: 'Ринки та експансія', label: 'Наскільки серйозно дивитесь на вихід у ЄС / США?', kind: 'single', system: 'expansion',
    options: [{ label: 'Не розглядаємо', score: 3 }, { label: 'Цікаво, але страшно / незрозуміло', score: 0.5 }, { label: 'Плануємо в найближчий рік', score: 1.5 }, { label: 'Уже готуємось', score: 2.2 }, { label: 'Уже там продаємо', score: 3 }] },
  { id: 'x_ready', section: 'Ринки та експансія', label: 'Що вже готове до виходу на нові ринки? (оберіть усе)', kind: 'multi',
    options: [{ label: 'Локалізований сайт / мова' }, { label: 'Логістика й фулфілмент за кордон' }, { label: 'Акаунти на маркетплейсах (Amazon, Allegro…)' }, { label: 'Юридично / податки' }, { label: 'Локальний маркетинг' }, { label: 'Нічого з цього' }] },

  // 8 — Команда і процеси (+ намір: з чим потрібна команда)
  { id: 'o_owner', section: 'Команда і процеси', label: 'Хто відповідає за прибуток e-commerce?', kind: 'single', system: 'org',
    options: [{ label: 'Ніхто конкретно', score: 0 }, { label: 'Власник особисто', score: 1 }, { label: 'Маркетолог / керівник частково', score: 1.7 }, { label: 'Керівник напряму', score: 2.3 }, { label: 'Роль + KPI по прибутку', score: 3 }, { label: 'Підрядник / агенція', score: 1.4 }] },
  { id: 'o_sop', section: 'Команда і процеси', label: 'Наскільки бізнес працює без вас (процеси, SOP)?', kind: 'single', system: 'org',
    options: [{ label: 'Усе в головах', score: 0 }, { label: 'Дещо задокументовано', score: 1 }, { label: 'Основні процеси описані', score: 1.8 }, { label: 'Процеси + відповідальні', score: 2.4 }, { label: 'Повна база + онбординг', score: 3 }, { label: 'Не перевіряли', score: 1 }] },
  { id: 'help_want', section: 'Команда і процеси', label: 'З чим вам найбільше потрібна команда поруч? (оберіть усе)', kind: 'multi',
    options: [{ label: 'Повний аудит e-commerce' }, { label: 'Новий сайт' }, { label: 'Трафік і маркетинг' }, { label: 'Аналітика й дані' }, { label: 'Операції й процеси' }, { label: 'Стратегія росту' }] },
];

// ── Локалізація (EN overlay). Тільки текст; id/score/kind/порядок опцій незмінні,
// тож скоринг за індексом опції не залежить від мови.
export type Lang = 'uk' | 'en';

/** Повертає блок з накладеними EN-полями, якщо lang==='en' (з фолбеком на UA). */
export function localizeBlock(b: Block, lang: Lang): Block {
  if (lang !== 'en') return b;
  return {
    ...b,
    label: b.labelEn ?? b.label,
    hint: b.hintEn ?? b.hint,
    placeholder: b.placeholderEn ?? b.placeholder,
    addLabel: b.addLabelEn ?? b.addLabel,
    unit: b.unitEn ?? b.unit,
    options: b.options ? b.options.map((o, i) => ({ ...o, label: b.optionsEn?.[i] ?? o.label })) : b.options,
    template: b.template ? { ...b.template, label: b.template.labelEn ?? b.template.label } : b.template,
  };
}

/** EN-підпис секції (SECTIONS — прості рядки; фолбек на UA-назву). */
export function localizeSection(name: string, lang: Lang): string {
  return lang === 'en' ? (SECTION_EN[name] ?? name) : name;
}

/** LIKE_WHAT з EN-підписами (для чипів «що подобається»). Порядок незмінний. */
export function localizeLikeWhat(lang: Lang): { label: string }[] {
  return LIKE_WHAT.map((o) => ({ label: lang === 'en' ? (o.labelEn ?? o.label) : o.label }));
}

/** Метадані завантаженого файлу (бінарник — на бекенді; тут — довідка про файл). */
export type FileMeta = { name: string; size: number; type: string; at: string };
export type Stage3Answers = Record<string, number | number[] | string | string[] | RefItem[] | FileMeta>;

export type Reco = { key: 'audit' | 'rebuild'; title: string; reason: string; bullets: string[]; riskReversal: string; cta: string; to: string; strong: boolean };
export type Pain = { label: string; detail: string };
export type RoadmapItem = { title: string; detail: string };

// Болі по системах — людською мовою, для блоку «ключові болі» у звіті.
const SYS_PAIN: Record<SysKey, Pain> = {
  strategy: { label: 'Рішення наосліп', detail: 'Немає моделі росту й управлінського циклу — гроші йдуть не туди' },
  commercial: { label: 'Оборот є, прибутку нема', detail: 'Керуєте оборотом, а не маржею та юніт-економікою' },
  customer: { label: 'Клієнт дорогий і разовий', detail: 'Слабкі утримання й attribution — кожен наступний дорожчає' },
  experience: { label: 'Трафік не конвертує', detail: 'Витоки на сайті: швидкість, картка, checkout' },
  operations: { label: 'Операції зʼїдають маржу', detail: 'Повернення й ручна робота без SLA' },
  data: { label: 'У кожного свої цифри', detail: 'Немає наскрізної аналітики й єдиних даних' },
  org: { label: 'Усе тримається на власнику', detail: 'Немає ролей, KPI і процесів' },
  expansion: { label: 'Уперлися в стелю ринку', detail: 'Один ринок вичерпується, нові — не відкриті системно' },
};

export type Stage3Result = {
  systems: { key: SysKey; label: string; score: number }[];
  overall: number;
  bottleneck: { key: SysKey; label: string; score: number };
  epiphany: string;
  completeness: number;
  competitors: { direct: string[]; indirect: string[] };
  likes: { url: string; what: string[] }[];
  marketing: { label: string; value: string }[];
  finance: { label: string; value: string }[];
  goals: string[];
  pains: Pain[];
  roadmap: RoadmapItem[];
  recos: Reco[];
  answered: number; total: number;
};

const W: Record<SysKey, number> = { strategy: 1, commercial: 1, customer: 1.1, experience: 0.9, operations: 1.3, data: 1.2, org: 1.5, expansion: 0.8 };
const byId = (id: string) => BLOCKS.find((b) => b.id === id);
const scoreOf = (b: Block, a: Stage3Answers[string]): number | null => {
  if (b.kind === 'single' && b.options) return typeof a === 'number' ? (b.options[a]?.score ?? 0) : null;
  if (b.kind === 'multi' && b.system && Array.isArray(a)) return Math.min(3, a.length * 0.75);
  return null;
};

// Епіфанія: поверхнева версія проблеми (у що клієнт зазвичай вірить) → справжній
// корінь (вузол) → наслідок, поки він не закритий. Ламає хибне переконання.
const EPIPHANY: Record<SysKey, { surface: string; consequence: string }> = {
  strategy: { surface: 'бракує ідей або бюджету на ріст', consequence: 'рішення ухвалюються наосліп, а гроші йдуть не туди' },
  commercial: { surface: 'треба просто більше продажів', consequence: 'оборот росте, а прибуток — ні' },
  customer: { surface: 'проблема у трафіку', consequence: 'кожен наступний клієнт коштує дедалі дорожче' },
  experience: { surface: 'потрібно більше реклами', consequence: 'ви платите за трафік, який не купує' },
  operations: { surface: 'це просто дрібні збої', consequence: 'повернення й ручна робота тихо з’їдають маржу' },
  data: { surface: 'потрібні нові інструменти', consequence: 'у кожного свої цифри, а рішення — інтуїтивні' },
  org: { surface: 'треба просто більше працювати', consequence: 'усе тримається на власнику й не масштабується' },
  expansion: { surface: 'ринок майже вичерпано', consequence: 'ріст упирається в стелю, а нові ринки не відкриті' },
};

export function scoreStage3(ans: Stage3Answers, money?: [number, number]): Stage3Result {
  const systems = SYS.map(({ key, label }) => {
    const bs = BLOCKS.filter((b) => b.system === key);
    const vals = bs.map((b) => scoreOf(b, ans[b.id])).filter((v): v is number => v != null);
    const score = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length / 3 * 100) : 0;
    return { key, label, score };
  });
  const wsum = Object.values(W).reduce((a, b) => a + b, 0);
  const overall = Math.round(systems.reduce((a, s) => a + s.score * W[s.key], 0) / wsum);
  const bottleneck = [...systems].sort((a, b) => a.score - b.score)[0];
  const ep = EPIPHANY[bottleneck.key];
  const epiphany = `Виглядає, ніби ${ep.surface}. Але справжній вузол — «${bottleneck.label}»: поки він не закритий, ${ep.consequence}.`;

  const urlList = (id: string): string[] =>
    (Array.isArray(ans[id]) ? (ans[id] as unknown[]) : []).filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean);
  const competitors = { direct: urlList('comp_direct'), indirect: urlList('comp_indirect') };

  const refsVal: RefItem[] = Array.isArray(ans['refs']) ? (ans['refs'] as unknown[]).filter((r): r is RefItem => !!r && typeof (r as RefItem).url === 'string') as RefItem[] : [];
  const likes = refsVal.filter((r) => r.url.trim()).map((r) => {
    const whatArr: number[] = Array.isArray(r.what) ? (r.what as number[]) : [];
    return { url: r.url.trim(), what: whatArr.map((i) => LIKE_WHAT[i]?.label).filter(Boolean) as string[] };
  });

  const optLabel = (id: string): string => { const b = byId(id); const a = ans[id]; return b?.options && typeof a === 'number' ? (b.options[a]?.label ?? '—') : '—'; };
  const multiLabels = (id: string): string => { const b = byId(id); const a = ans[id]; return b?.options && Array.isArray(a) && a.length ? (a as number[]).map((i) => b.options![i]?.label).filter(Boolean).join(' · ') : '—'; };
  const num = (id: string) => (typeof ans[id] === 'string' && ans[id] !== '' ? String(ans[id]) : '');
  const withUnit = (id: string) => { const b = byId(id)!; const v = num(id); return v ? `${v}${b.unit ?? ''}` : '—'; };

  const marketing = [
    { label: 'Головні канали', value: multiLabels('m_traffic') },
    { label: 'Аналітика (GA4)', value: optLabel('m_ga4') },
    { label: 'Google / Search Console', value: optLabel('m_sc') },
    { label: 'CAC відносно чека', value: optLabel('m_cac') },
    { label: 'Повторні покупки', value: optLabel('m_repeat') },
  ];
  const finance = [
    { label: 'Валова маржа', value: optLabel('f_margin') },
    { label: 'Зриви (повернення)', value: optLabel('f_returns') },
    { label: 'Юніт-економіка', value: optLabel('f_unit') },
    { label: 'Прозорість P&L', value: optLabel('f_pnl') },
    { label: 'AOV', value: withUnit('f_aov') },
    { label: 'LTV', value: withUnit('f_ltv') },
  ];

  const idxOf = (id: string) => (typeof ans[id] === 'number' ? (ans[id] as number) : -1);
  const multiIdx = (id: string): number[] => (Array.isArray(ans[id]) ? (ans[id] as number[]).filter((x) => typeof x === 'number') : []);
  const labelsOf = (id: string, sel: number[]) => { const b = byId(id); return b?.options ? sel.map((i) => b.options![i]?.label).filter(Boolean) as string[] : []; };

  const goals = labelsOf('goal_b', multiIdx('goal_b'));
  const helpSel = labelsOf('help_want', multiIdx('help_want'));
  const painsSel = multiIdx('site_pain');
  const auditAge = idxOf('site_audit_age');
  const siteAge = idxOf('site_age');
  const moneyStr = money && money[0] > 0 ? `${eur(money[0])}–${eur(money[1])}` : '';

  const oldSite = siteAge === 0 || siteAge === 1;
  const answered = BLOCKS.filter((b) => {
    const a = ans[b.id];
    if (a == null) return false;
    if (b.kind === 'urllist') return Array.isArray(a) && (a as string[]).some((s) => typeof s === 'string' && s.trim());
    if (b.kind === 'refs') return Array.isArray(a) && (a as RefItem[]).some((r) => r && r.url && r.url.trim());
    return a !== '' && (!Array.isArray(a) || a.length > 0);
  }).length;
  const completeness = Math.round((answered / BLOCKS.length) * 100);

  // Наступний крок 1 — розбір із командою (лишаємо). Крок 2 — Етап 4 (продовження
  // дослідження до 100% тем і глибини 75%+). Розробку сайта НЕ продаємо в лоб —
  // вона стає одним з векторів дорожньої карти нижче, якщо болить сайт.
  const wantsAudit = auditAge === 0 || auditAge === 1 || helpSel.includes('Повний аудит e-commerce');
  const audit: Reco = {
    key: 'audit',
    title: 'Обговорити з командою WEEXP',
    reason: moneyStr
      ? `Покажемо, як повернути ${moneyStr} — на ваших цифрах, а не загальними порадами.`
      : `Зберемо ваш зріз у план повернення виторгу — на ваших цифрах, а не загальними порадами.`,
    bullets: ['Звіримо оцінку з вашими CRM / GA4', 'Покажемо 3 точки, де витікає найбільше', 'Дамо перші кроки під Definition of Done'],
    riskReversal: '30 хвилин · безкоштовно · без зобовʼязань',
    cta: 'Запланувати зустріч →',
    to: '/contact',
    strong: true,
  };
  const recos = [audit];

  // Ключові болі — реально з відповідей: найслабші системи + конкретні прапорці.
  const weak = [...systems].sort((a, b) => a.score - b.score);
  const painList: Pain[] = [];
  const pushPain = (label: string, detail: string) => { if (!painList.some((p) => p.label === label)) painList.push({ label, detail }); };
  weak.slice(0, 2).forEach((s) => pushPain(SYS_PAIN[s.key].label, SYS_PAIN[s.key].detail));
  if (oldSite) pushPain('Застарілий сайт', `Платформу не оновлювали ${siteAge === 0 ? '5+ років' : '3–4 роки'} — стеля для конверсії й швидкості`);
  else if (painsSel.length) pushPain('Вузькі місця на сайті', `Позначено: ${labelsOf('site_pain', painsSel).slice(0, 3).join(', ')}`);
  if (idxOf('f_returns') === 0) pushPain('Високі зриви замовлень', 'Повернення/скасування понад 15% — прямий мінус до маржі');
  if (idxOf('f_margin') === 0 || idxOf('f_unit') === 0) pushPain('Юніт-економіка не сходиться', 'Прибуток з продажу після реклами під питанням');
  if (idxOf('m_ga4') === 0 || idxOf('m_sc') === 0) pushPain('Аналітика не працює', 'Рішення ухвалюються без наскрізних даних');
  const painsTop = painList.slice(0, 4);

  // Дорожня карта — розмиті вектори «як прийти до результату» (з болів і цілей).
  const roadmap: RoadmapItem[] = [];
  const pushRoad = (title: string, detail: string) => { if (!roadmap.some((r) => r.title === title)) roadmap.push({ title, detail }); };
  pushRoad(`Фундамент: ${bottleneck.label}`, 'Закриваємо вузол, з якого витікає найбільше — далі все множиться.');
  if (goals.includes('Нові канали й ринки')) pushRoad('Експансія в ЄС / США', 'Вихід на Allegro, Amazon і локальні майданчики — окремий бізнес-контур, а не «ще один канал».');
  if (oldSite || painsSel.length) pushRoad('Сайт і платформа', 'Точковий аудит сайту → рішення: цільова доробка чи нова платформа. Без переробок наосліп.');
  if (bottleneck.key === 'org' || bottleneck.key === 'customer' || idxOf('m_repeat') <= 1) pushRoad('CRM і процеси', 'Впровадження CRM, ролі й RACI, системне утримання — щоб бізнес працював без героя.');
  if ((weak.find((s) => s.key === 'data')?.score ?? 100) < 50) pushRoad('Наскрізна аналітика', 'Єдині дані + BI: одні цифри для всіх рішень.');
  const roadmapTop = roadmap.slice(0, 4);

  return { systems, overall, bottleneck, epiphany, completeness, competitors, likes, marketing, finance, goals, pains: painsTop, roadmap: roadmapTop, recos, answered, total: BLOCKS.length };
}
