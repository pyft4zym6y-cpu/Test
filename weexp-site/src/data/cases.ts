/** Кейси — єдине джерело правди (з CRM/ERP/GA4). /cases, /cases/:slug.
 *  Структура кейсу — фірмова: BEFORE → DIAGNOSIS → MONEY → BUILD → AFTER → INDEPENDENCE → LEARNING.
 *  LEARNING робить кожен кейс частиною інтелектуального капіталу WEEXP (knowledge flywheel).
 *  Кейси анонімізовані: назви — категорійні, без реальних брендів. Фокус — на WOW-дельтах.
 *  Кожен кейс належить до 1–3 із 8 систем онлайн-продажів (див. xray).
 *
 *  Двомовність: кожен кейс має необовʼязкове поле `en` — англійські версії текстових
 *  полів (числа/hero/slug/systemKeys лишаються без змін). У компонентах рендеримо через
 *  localizeCase(c, lang), який накладає c.en поверх c у EN-режимі (з фолбеком на укр.).
 */
import type { SystemKey } from '@/data/xray';
import type { Lang } from '@/i18n';

export type Metric = { label: string; before: string; after: string; note?: string };
export type Stage = 'Diagnose' | 'Build' | 'Scale' | 'Independence';

export type CaseStudy = {
  slug: string;            // kebab-case unique
  cat: string;             // напр. 'Beauty · DTC' (категорія, НЕ бренд)
  name: string;            // анонімізована, напр. 'Преміум-косметика'
  hero: string;            // головне число, напр. '×3,4' / '+65%' / '≥19 млн ₴'
  heroLabel: string;       // що означає число
  window: string;          // горизонт, напр. '12 місяців'
  lead: string;            // 1 речення-гачок
  systems: SystemKey[];    // 1–3 системи, до яких належить кейс
  stage: Stage;
  before: string;          // 1 речення
  diagnosis: string[];     // 2 буліти
  money: string;           // 1 речення — вплив € / ₴ (wow)
  system: string[];        // 2–3 буліти: що побудував WEEXP
  metrics: Metric[];       // 3–6 метрик до → після (wow-дельти)
  after: string;           // 1 речення результату
  independence: string;    // 1 речення — що клієнт може без WEEXP
  learning: string;        // 1 речення — чого кейс навчив систему WEEXP
  verified?: string;       // джерело перевірки цифр (за замовч. — CRM/ERP/GA4)
  // Реальний відгук — заповнюйте ЛИШЕ з дозволу клієнта (роль обовʼязкова,
  // імʼя за згодою). Порожньо = не показуємо. НЕ вигадувати.
  testimonial?: { quote: string; role: string; name?: string };
  // Англійська версія текстових полів (числа/hero/slug/systemKeys — без змін).
  en?: CaseEn;
};

/** Англійський оверлей: дзеркалить текстові поля кейсу. Числа/hero/slug/systemKeys не входять. */
export type CaseEn = Partial<Pick<CaseStudy,
  | 'cat' | 'name' | 'heroLabel' | 'window' | 'lead' | 'before' | 'diagnosis'
  | 'money' | 'system' | 'metrics' | 'after' | 'independence' | 'learning'
  | 'verified' | 'testimonial'>>;

export const CASES: CaseStudy[] = [
  {
    slug: 'premium-textile',
    cat: 'Home & Decor · UA → EU',
    name: 'Преміум-текстиль',
    hero: '×18', heroLabel: 'оборот за 18 місяців', window: '18 місяців · ROI 3.8×',
    lead: 'Флагманський кейс: із локального магазину — у бренд з обігом €900K і конверсією топ-1% сегмента.',
    systems: ['strategy', 'commercial', 'customer'], stage: 'Independence',
    before: 'Локальний магазин: оборот €48K/рік, конверсія 0,8%, увесь трафік викуповувався рекламою.',
    diagnosis: [
      'Повторні покупки 12%, органіка 5%, email не приносив нічого.',
      'Рішення ухвалювались наосліп: жодної наскрізної аналітики.',
    ],
    money: 'До €288K маржі на рік недоотримувалось через відсутність системи.',
    system: [
      '7 шарів Commerce OS: від архітектури каталогу до retention-двигуна.',
      'CRO-програма: конверсія 0,8% → 4,2% (норма сегмента 0,7–1,5%).',
      'Retention: email + сегментація підняли повторні з 12% до 28%.',
    ],
    metrics: [
      { label: 'Оборот/рік', before: '€48K', after: '€900K', note: '×18' },
      { label: 'Конверсія', before: '0,8%', after: '4,2%', note: 'топ-1%' },
      { label: 'ROAS', before: '2,1×', after: '4,8×' },
      { label: 'Повторні', before: '12%', after: '28%' },
      { label: 'Органіка', before: '5%', after: '45%' },
      { label: 'Email-частка', before: '0%', after: '18%' },
    ],
    after: 'ROI 3.8× (€288K маржі на €75K інвестицій), стабільний топ-1% конверсії сегмента.',
    independence: 'Система росту працює без щоденної участі засновника.',
    learning: 'CRO + retention дають більший важіль, ніж нарощування рекламного бюджету.',
    en: {
      cat: 'Home & Decor · UA → EU',
      name: 'Premium textiles',
      heroLabel: 'turnover over 18 months',
      window: '18 months · ROI 3.8×',
      lead: 'Flagship case: from a local shop to a brand with €900K turnover and top-1% conversion for its segment.',
      before: 'A local shop: €48K/year turnover, 0.8% conversion, all traffic bought through ads.',
      diagnosis: [
        'Repeat purchases 12%, organic 5%, email delivered nothing.',
        'Decisions made blind: no end-to-end analytics.',
      ],
      money: 'Up to €288K of margin a year left unrealized for lack of a system.',
      system: [
        '7 layers of Commerce OS: from catalog architecture to a retention engine.',
        'CRO program: conversion 0.8% → 4.2% (segment norm 0.7–1.5%).',
        'Retention: email + segmentation lifted repeats from 12% to 28%.',
      ],
      metrics: [
        { label: 'Turnover/year', before: '€48K', after: '€900K', note: '×18' },
        { label: 'Conversion', before: '0.8%', after: '4.2%', note: 'top-1%' },
        { label: 'ROAS', before: '2.1×', after: '4.8×' },
        { label: 'Repeats', before: '12%', after: '28%' },
        { label: 'Organic', before: '5%', after: '45%' },
        { label: 'Email share', before: '0%', after: '18%' },
      ],
      after: 'ROI 3.8× (€288K margin on €75K invested), a steady top-1% conversion for the segment.',
      independence: 'The growth system runs without the founder’s daily involvement.',
      learning: 'CRO + retention give more leverage than scaling the ad budget.',
    },
  },
  {
    slug: 'consumer-dtc',
    cat: 'Beauty · DTC · відомий бренд',
    name: 'Consumer DTC-бренд',
    hero: '+65%', heroLabel: 'до обороту за 9 місяців', window: '2023–2025 · 6 ринків',
    lead: 'Помітний споживчий бренд: масштабування на 6 ринків ЄС і США з перебудовою retention.',
    systems: ['customer', 'operations', 'data'], stage: 'Scale',
    before: 'Сильний бренд, але зростання коштувало дедалі дорожче: CAC $40–50, повторні 14,7%.',
    diagnosis: [
      'Стартова конверсія 0,64% — трафік не окупався системно.',
      'ERP і склад не встигали за амбіціями виходу на нові ринки.',
    ],
    money: 'Кожен новий ринок відкладався через операційні вузькі місця.',
    system: [
      'Retention-двигун: повторні покупки 14,7% → 60%.',
      'Вихід на 6 ринків: US · DE · FR · ES · IT · UK з єдиним контуром даних.',
      'ERP-ефективність +40%: операції перестали гальмувати продажі.',
    ],
    metrics: [
      { label: 'Продажі', before: 'база', after: '+65%', note: '9 міс' },
      { label: 'Повторні', before: '14,7%', after: '60%' },
      { label: 'ERP-ефективність', before: 'база', after: '+40%' },
      { label: 'CAC', before: '$40–50', after: '$26', note: '−45%' },
      { label: 'Ринки', before: '1', after: '6' },
    ],
    after: '+65% до продажів за 9 місяців і масштабована операційна база під експансію.',
    independence: 'Операційна база тримає 6 ринків без ручного режиму.',
    learning: 'Retention — це маржа, яка вже у вас є; вона дешевша за нове залучення.',
    en: {
      cat: 'Beauty · DTC · well-known brand',
      name: 'Consumer DTC brand',
      heroLabel: 'to turnover in 9 months',
      window: '2023–2025 · 6 markets',
      lead: 'A prominent consumer brand: scaling across 6 EU and US markets with a rebuilt retention engine.',
      before: 'A strong brand, but growth kept getting pricier: CAC $40–50, repeats 14.7%.',
      diagnosis: [
        'Starting conversion 0.64% — traffic didn’t pay back systematically.',
        'ERP and warehouse couldn’t keep up with the ambition to enter new markets.',
      ],
      money: 'Every new market slipped because of operational bottlenecks.',
      system: [
        'Retention engine: repeat purchases 14.7% → 60%.',
        'Launch into 6 markets: US · DE · FR · ES · IT · UK on a single data loop.',
        'ERP efficiency +40%: operations stopped holding sales back.',
      ],
      metrics: [
        { label: 'Sales', before: 'baseline', after: '+65%', note: '9 mo' },
        { label: 'Repeats', before: '14.7%', after: '60%' },
        { label: 'ERP efficiency', before: 'baseline', after: '+40%' },
        { label: 'CAC', before: '$40–50', after: '$26', note: '−45%' },
        { label: 'Markets', before: '1', after: '6' },
      ],
      after: '+65% in sales over 9 months and a scalable operational base for expansion.',
      independence: 'The operational base holds 6 markets with no manual mode.',
      learning: 'Retention is margin you already have; it’s cheaper than new acquisition.',
    },
  },
  {
    slug: 'fashion-apparel',
    cat: 'Fashion · Program of Record',
    name: 'Fashion-виробник',
    hero: '≥19 млн ₴', heroLabel: 'недоотриманого обороту на рік', window: 'програма 12 місяців',
    lead: 'Діагностика знайшла ≥19 млн ₴/рік розриву. Побудова системи з окупністю 4–8 місяців.',
    systems: ['commercial', 'operations', 'experience'], stage: 'Diagnose',
    before: 'Оборот 23,2 млн ₴, але 18% замовлень не доходили до викупу. Європа — 0%.',
    diagnosis: [
      'Оплата заявок 63,4%, викуп 82% — гроші губились у логістиці й комунікації.',
      'SEO на позиції 14; готовий під експорт продукт без виходу в ЄС.',
    ],
    money: '≥19 млн ₴/рік недоотриманого обороту — оформлено в бюджет $56–79K з окупністю 4–8 міс.',
    system: [
      'Дорожня карта під DoD: конверсія 3,9% → 4,3–4,5%.',
      'Оплата заявок 63,4% → ≥75%, викуп 82% → ≥88%.',
      'SEO з позиції 14 у топ-5; вихід у Європу 0% → 12–18%.',
    ],
    metrics: [
      { label: 'Оборот', before: '23,2 млн ₴', after: '×2–2,5', note: 'ціль' },
      { label: 'Конверсія', before: '3,9%', after: '4,3–4,5%' },
      { label: 'Оплата заявок', before: '63,4%', after: '≥75%' },
      { label: 'Викуп', before: '82%', after: '≥88%' },
      { label: 'Європа', before: '0%', after: '12–18%' },
    ],
    after: 'Програма з окупністю 4–8 місяців і планом ×2–2,5 до обороту.',
    independence: 'План під DoD, який команда клієнта виконує самостійно.',
    learning: 'Найбільший розрив часто не в маркетингу, а в логістиці й викупі замовлень.',
    en: {
      cat: 'Fashion · Program of Record',
      name: 'Fashion manufacturer',
      heroLabel: 'of turnover missed per year',
      window: '12-month program',
      lead: 'Diagnostics found ≥19M ₴/year of gap. A system built with a 4–8 month payback.',
      before: 'Turnover 23.2M ₴, but 18% of orders never reached redemption. Europe — 0%.',
      diagnosis: [
        'Order payment 63.4%, redemption 82% — money lost in logistics and communication.',
        'SEO at position 14; an export-ready product with no EU presence.',
      ],
      money: '≥19M ₴/year of missed turnover — framed into a $56–79K budget with a 4–8 month payback.',
      system: [
        'A roadmap under DoD: conversion 3.9% → 4.3–4.5%.',
        'Order payment 63.4% → ≥75%, redemption 82% → ≥88%.',
        'SEO from position 14 into the top-5; Europe entry 0% → 12–18%.',
      ],
      metrics: [
        { label: 'Turnover', before: '23.2 млн ₴', after: '×2–2.5', note: 'target' },
        { label: 'Conversion', before: '3.9%', after: '4.3–4.5%' },
        { label: 'Order payment', before: '63.4%', after: '≥75%' },
        { label: 'Redemption', before: '82%', after: '≥88%' },
        { label: 'Europe', before: '0%', after: '12–18%' },
      ],
      after: 'A program with a 4–8 month payback and a plan for ×2–2.5 in turnover.',
      independence: 'A plan under DoD that the client’s team executes on its own.',
      learning: 'The biggest gap is often not in marketing but in logistics and order redemption.',
    },
  },
  {
    slug: 'fmcg-distribution',
    cat: 'FMCG · Дистрибуція',
    name: 'FMCG-дистриб’ютор',
    hero: '17K', heroLabel: 'SKU під контролем системи', window: 'національний масштаб',
    lead: 'Дистрибуція beauty-брендів: 17 000 SKU зведені в керований контур CRM + ERP.',
    systems: ['operations', 'data', 'org'], stage: 'Build',
    before: '17 000 SKU у таблицях; CRM і склад працювали окремо.',
    diagnosis: [
      'Втрати на стиках процесів при кожному замовленні.',
      'Масштаб на UA · PL · NL · CY гальмувався ручними операціями.',
    ],
    money: 'Ручні операції з’їдали маржу й час власника на кожному замовленні.',
    system: [
      'CRM-ефективність +25%: клієнтські дані стали активом.',
      'ERP + аналітика попиту звели 17K SKU у керований контур.',
      'Продажі +40% на національному масштабі.',
    ],
    metrics: [
      { label: 'Продажі', before: 'база', after: '+40%' },
      { label: 'CRM-ефективність', before: 'база', after: '+25%' },
      { label: 'SKU під контролем', before: '—', after: '17 000' },
      { label: 'Ринки', before: 'UA', after: 'UA·PL·NL·CY' },
    ],
    after: 'Керований асортимент із 17 000 SKU і +40% до продажів.',
    independence: 'Операційний контур працює без ручного втручання власника.',
    learning: 'ERP + CRM в одному контурі знімає операційне навантаження з власника.',
    en: {
      cat: 'FMCG · Distribution',
      name: 'FMCG distributor',
      heroLabel: 'SKUs under system control',
      window: 'national scale',
      lead: 'Distribution of beauty brands: 17,000 SKUs brought into a managed CRM + ERP loop.',
      before: '17,000 SKUs in spreadsheets; CRM and warehouse ran separately.',
      diagnosis: [
        'Losses at process seams on every order.',
        'Scaling across UA · PL · NL · CY was held back by manual operations.',
      ],
      money: 'Manual operations ate into margin and the owner’s time on every order.',
      system: [
        'CRM efficiency +25%: customer data became an asset.',
        'ERP + demand analytics brought 17K SKUs into a managed loop.',
        'Sales +40% at national scale.',
      ],
      metrics: [
        { label: 'Sales', before: 'baseline', after: '+40%' },
        { label: 'CRM efficiency', before: 'baseline', after: '+25%' },
        { label: 'SKUs under control', before: '—', after: '17 000' },
        { label: 'Markets', before: 'UA', after: 'UA·PL·NL·CY' },
      ],
      after: 'A managed assortment of 17,000 SKUs and +40% in sales.',
      independence: 'The operational loop runs without the owner’s manual intervention.',
      learning: 'ERP + CRM in one loop takes the operational load off the owner.',
    },
  },
  {
    slug: 'cosmetics-holding',
    cat: 'Beauty · Холдинг брендів',
    name: 'Косметичний холдинг',
    hero: '×3,4', heroLabel: 'швидкість управлінських рішень', window: '10 місяців',
    lead: 'Три бренди в одному холдингу бачили різні цифри — жодній не можна було довіряти.',
    systems: ['strategy', 'data', 'org'], stage: 'Build',
    before: 'Три бренди, три CRM, три версії правди; звіт по холдингу збирався вручну 6 днів.',
    diagnosis: [
      'GA4 недорахував 22% транзакцій; P&L по e-commerce не існувало.',
      'Немає єдиного власника результату — рішення тонули в узгодженнях.',
    ],
    money: 'До €210K/рік маржі втрачалось на хаотичних промо без розрахунку впливу на contribution.',
    system: [
      'Єдине джерело правди: master data + наскрізний P&L по трьох брендах.',
      'Управлінський цикл план→факт→причини→дії з RACI на рівні холдингу.',
      'Дашборди й алерти замість ручних звітів.',
    ],
    metrics: [
      { label: 'Збірка звіту', before: '6 днів', after: '4 години', note: '×36' },
      { label: 'Точність GA4', before: '78%', after: '99%' },
      { label: 'Contribution margin', before: '−3%', after: '+11%' },
      { label: 'Швидкість рішень', before: 'база', after: '×3,4' },
      { label: 'Джерел правди', before: '3', after: '1' },
    ],
    after: 'Холдинг керується як єдиний бізнес: одна панель, один P&L, одна відповідальність.',
    independence: 'Топ-менеджмент ухвалює рішення за даними без залучення WEEXP.',
    learning: 'Без єдиного джерела правди швидкість рішень падає швидше, ніж росте оборот.',
    en: {
      cat: 'Beauty · Brand holding',
      name: 'Cosmetics holding',
      heroLabel: 'speed of management decisions',
      window: '10 months',
      lead: 'Three brands in one holding saw different numbers — none could be trusted.',
      before: 'Three brands, three CRMs, three versions of the truth; the holding report took 6 days to assemble by hand.',
      diagnosis: [
        'GA4 undercounted 22% of transactions; an e-commerce P&L didn’t exist.',
        'No single owner of the result — decisions drowned in approvals.',
      ],
      money: 'Up to €210K/year of margin lost to chaotic promos with no read on contribution impact.',
      system: [
        'A single source of truth: master data + an end-to-end P&L across three brands.',
        'A management cycle plan→actual→causes→actions with RACI at holding level.',
        'Dashboards and alerts instead of manual reports.',
      ],
      metrics: [
        { label: 'Report assembly', before: '6 днів', after: '4 години', note: '×36' },
        { label: 'GA4 accuracy', before: '78%', after: '99%' },
        { label: 'Contribution margin', before: '−3%', after: '+11%' },
        { label: 'Decision speed', before: 'baseline', after: '×3.4' },
        { label: 'Sources of truth', before: '3', after: '1' },
      ],
      after: 'The holding is run as one business: one panel, one P&L, one accountability.',
      independence: 'Top management makes decisions on data without involving WEEXP.',
      learning: 'Without a single source of truth, decision speed falls faster than turnover grows.',
    },
  },
  {
    slug: 'electronics-marketplace',
    cat: 'Electronics · Онлайн-рітейл',
    name: 'Електроніка',
    hero: '×2,9', heroLabel: 'конверсія картки товару', window: '7 місяців',
    lead: 'Трафік був, а картка товару не продавала: люди заходили і йшли без рішення.',
    systems: ['experience', 'commercial'], stage: 'Scale',
    before: 'Складна навігація, 34% залишали кошик, конверсія 0,9% при дорогому трафіку.',
    diagnosis: [
      'Картка без порівнянь, характеристик і social proof — покупець не міг вирішити.',
      'Checkout у 6 кроків з обов’язковою реєстрацією.',
    ],
    money: 'Кожен місяць ~₴4,2 млн обороту губилось у розривах воронки.',
    system: [
      'Перебудова каталогу, фільтрів і картки; блоки порівняння та відгуків.',
      'Checkout 6 → 2 кроки, гостьова оплата; CRO-процес із A/B.',
      'Upsell/cross-sell аксесуарів на картці й у кошику.',
    ],
    metrics: [
      { label: 'Конверсія', before: '0,9%', after: '2,6%', note: '×2,9' },
      { label: 'Кинутий кошик', before: '34%', after: '19%' },
      { label: 'Кроків у checkout', before: '6', after: '2' },
      { label: 'Середній чек', before: 'база', after: '+38%' },
    ],
    after: 'Картка й checkout стали механізмом продажу, а не вітриною.',
    independence: 'Команда веде A/B-тести й релізить гіпотези самостійно.',
    learning: 'У складному товарі рішення купувати ухвалюється на картці, а не в рекламі.',
    en: {
      cat: 'Electronics · Online retail',
      name: 'Electronics',
      heroLabel: 'product-page conversion',
      window: '7 months',
      lead: 'Traffic was there, but the product page didn’t sell: people came and left without deciding.',
      before: 'Complex navigation, 34% abandoned the cart, 0.9% conversion on expensive traffic.',
      diagnosis: [
        'A product page with no comparisons, specs or social proof — buyers couldn’t decide.',
        'A 6-step checkout with mandatory registration.',
      ],
      money: 'Every month ~₴4.2M of turnover leaked through funnel gaps.',
      system: [
        'Rebuilt catalog, filters and product page; comparison and review blocks.',
        'Checkout 6 → 2 steps, guest payment; a CRO process with A/B.',
        'Upsell/cross-sell of accessories on the page and in the cart.',
      ],
      metrics: [
        { label: 'Conversion', before: '0.9%', after: '2.6%', note: '×2.9' },
        { label: 'Cart abandonment', before: '34%', after: '19%' },
        { label: 'Checkout steps', before: '6', after: '2' },
        { label: 'Average order value', before: 'baseline', after: '+38%' },
      ],
      after: 'The product page and checkout became a selling mechanism, not a showcase.',
      independence: 'The team runs A/B tests and ships hypotheses on its own.',
      learning: 'For complex products, the decision to buy is made on the page, not in the ad.',
    },
  },
  {
    slug: 'kids-goods',
    cat: 'Kids · Товари для дітей',
    name: 'Дитячі товари',
    hero: '×2,3', heroLabel: 'LTV клієнта', window: '9 місяців',
    lead: 'Батьки купували раз і зникали — попри те, що потреба поверталася кожні кілька місяців.',
    systems: ['customer', 'experience'], stage: 'Build',
    before: 'Повторні покупки 9%, жодного lifecycle-контуру, mobile-конверсія 0,6%.',
    diagnosis: [
      'Немає сегментації за віком дитини — комунікація нерелевантна.',
      'Мобільна версія втрачала покупця на пошуку й фільтрах.',
    ],
    money: 'До ₴6,8 млн/рік повторного обороту лишалось на столі через відсутність retention.',
    system: [
      'Lifecycle за віком дитини: post-purchase, win-back, abandoned cart.',
      'Перебудова mobile-каталогу й пошуку під сценарій «швидко знайти й купити».',
      'RFM-сегментація й персональні добірки.',
    ],
    metrics: [
      { label: 'LTV', before: 'база', after: '×2,3' },
      { label: 'Повторні', before: '9%', after: '31%' },
      { label: 'Mobile-конверсія', before: '0,6%', after: '2,1%' },
      { label: 'Email-виручка', before: '2%', after: '19%' },
    ],
    after: 'Клієнт повертається за сценарієм росту дитини — без ручних розсилок.',
    independence: 'Маркетинг клієнта веде lifecycle-кампанії у власному контурі.',
    learning: 'Релевантність за життєвим циклом клієнта коштує дешевше за будь-яку знижку.',
    en: {
      cat: 'Kids · Children’s products',
      name: 'Children’s products',
      heroLabel: 'customer LTV',
      window: '9 months',
      lead: 'Parents bought once and vanished — even though the need returned every few months.',
      before: 'Repeat purchases 9%, no lifecycle loop, mobile conversion 0.6%.',
      diagnosis: [
        'No segmentation by the child’s age — communication was irrelevant.',
        'The mobile version lost buyers on search and filters.',
      ],
      money: 'Up to ₴6.8M/year of repeat turnover left on the table for lack of retention.',
      system: [
        'Lifecycle by the child’s age: post-purchase, win-back, abandoned cart.',
        'Rebuilt mobile catalog and search for a “find it and buy it fast” scenario.',
        'RFM segmentation and personalized selections.',
      ],
      metrics: [
        { label: 'LTV', before: 'baseline', after: '×2.3' },
        { label: 'Repeats', before: '9%', after: '31%' },
        { label: 'Mobile conversion', before: '0.6%', after: '2.1%' },
        { label: 'Email revenue', before: '2%', after: '19%' },
      ],
      after: 'Customers come back along the child’s growth timeline — with no manual campaigns.',
      independence: 'The client’s marketing runs lifecycle campaigns in its own loop.',
      learning: 'Relevance across the customer lifecycle costs less than any discount.',
    },
  },
  {
    slug: 'supplements-health',
    cat: 'Supplements · Health & Nutrition',
    name: 'Спортивне харчування',
    hero: '×4,1', heroLabel: 'частка підписної виручки', window: '8 місяців',
    lead: 'Разові покупки в категорії, де клієнт за природою споживає товар щомісяця.',
    systems: ['customer', 'commercial'], stage: 'Scale',
    before: 'Повторні 16%, підписки немає, промо з’їдало маржу — contribution margin −8%.',
    diagnosis: [
      'Немає моделі повторного споживання попри щомісячну потребу.',
      'Знижки як єдиний інструмент — оборот ріс, прибуток падав.',
    ],
    money: 'Промо-хаос коштував до €95K/рік недоотриманої маржі.',
    system: [
      'Підписна модель replenishment із передбачуваним потоком виручки.',
      'Керування асортиментом і промо за contribution, а не оборотом.',
      'Cross-sell стеків і персональні пропозиції за RFM.',
    ],
    metrics: [
      { label: 'Підписна виручка', before: '9%', after: '37%', note: '×4,1' },
      { label: 'Повторні', before: '16%', after: '48%' },
      { label: 'Contribution margin', before: '−8%', after: '+14%' },
      { label: 'Середній чек', before: 'база', after: '+27%' },
    ],
    after: 'Прогнозована підписна виручка й позитивна юніт-економіка.',
    independence: 'Клієнт керує промо за маржинальністю без зовнішнього аналітика.',
    learning: 'У категоріях повторного споживання підписка перемагає знижку на маржі.',
    en: {
      cat: 'Supplements · Health & Nutrition',
      name: 'Sports nutrition',
      heroLabel: 'share of subscription revenue',
      window: '8 months',
      lead: 'One-off purchases in a category where the customer naturally consumes the product every month.',
      before: 'Repeats 16%, no subscriptions, promos eating margin — contribution margin −8%.',
      diagnosis: [
        'No repeat-consumption model despite a monthly need.',
        'Discounts as the only lever — turnover grew, profit fell.',
      ],
      money: 'Promo chaos cost up to €95K/year of unrealized margin.',
      system: [
        'A replenishment subscription model with predictable revenue flow.',
        'Managing assortment and promos by contribution, not turnover.',
        'Cross-sell of stacks and personalized offers by RFM.',
      ],
      metrics: [
        { label: 'Subscription revenue', before: '9%', after: '37%', note: '×4.1' },
        { label: 'Repeats', before: '16%', after: '48%' },
        { label: 'Contribution margin', before: '−8%', after: '+14%' },
        { label: 'Average order value', before: 'baseline', after: '+27%' },
      ],
      after: 'Predictable subscription revenue and positive unit economics.',
      independence: 'The client manages promos by margin without an external analyst.',
      learning: 'In repeat-consumption categories, subscription beats discounting on margin.',
    },
  },
  {
    slug: 'pharmacy-omnichannel',
    cat: 'Pharmacy · Омніканальний рітейл',
    name: 'Аптечна мережа',
    hero: '×3', heroLabel: 'швидша доставка замовлення (SLA 72 → 24 год)', window: '11 місяців',
    lead: 'Онлайн приймав замовлення, які офлайн-мережа фізично не встигала зібрати й видати.',
    systems: ['operations', 'experience', 'org'], stage: 'Build',
    before: 'SLA доставки 72 год, залишки на сайті розходились із реальністю, невикуп 22%.',
    diagnosis: [
      'Онлайн і 140 аптек не мали спільного контуру залишків і статусів.',
      'Немає власника customer journey між e-commerce і роздрібом.',
    ],
    money: 'Невикуп 22% і скасування коштували ~₴9,1 млн/рік обороту.',
    system: [
      'Резервування з найближчої аптеки, єдині залишки в реальному часі.',
      'SLA-статуси від кошика до видачі; click&collect.',
      'RACI між e-commerce, роздрібом і логістикою — один власник journey.',
    ],
    metrics: [
      { label: 'SLA доставки', before: '72 год', after: '24 год', note: '×3' },
      { label: 'Невикуп', before: '22%', after: '7%' },
      { label: 'Точність залишків', before: '81%', after: '99%' },
      { label: 'Click&collect', before: '0%', after: '34%' },
    ],
    after: 'Омніканальний контур: онлайн-замовлення виконуються силами найближчої аптеки.',
    independence: 'Мережа тримає SLA й залишки без ручного зведення.',
    learning: 'Обіцянку доставки визначає операційна модель, а не сторінка сайту.',
    en: {
      cat: 'Pharmacy · Omnichannel retail',
      name: 'Pharmacy chain',
      heroLabel: 'faster order delivery (SLA 72 → 24 h)',
      window: '11 months',
      lead: 'Online took orders the offline chain physically couldn’t pick and hand over in time.',
      before: 'Delivery SLA 72 h, on-site stock diverged from reality, non-redemption 22%.',
      diagnosis: [
        'Online and 140 pharmacies shared no common loop for stock and statuses.',
        'No owner of the customer journey between e-commerce and retail.',
      ],
      money: 'Non-redemption 22% and cancellations cost ~₴9.1M/year of turnover.',
      system: [
        'Reservation from the nearest pharmacy, unified real-time stock.',
        'SLA statuses from cart to handover; click & collect.',
        'RACI across e-commerce, retail and logistics — one owner of the journey.',
      ],
      metrics: [
        { label: 'Delivery SLA', before: '72 год', after: '24 год', note: '×3' },
        { label: 'Non-redemption', before: '22%', after: '7%' },
        { label: 'Stock accuracy', before: '81%', after: '99%' },
        { label: 'Click&collect', before: '0%', after: '34%' },
      ],
      after: 'An omnichannel loop: online orders are fulfilled by the nearest pharmacy.',
      independence: 'The chain holds SLA and stock without manual reconciliation.',
      learning: 'The delivery promise is set by the operating model, not the website page.',
    },
  },
  {
    slug: 'grocery-qcommerce',
    cat: 'Grocery · Q-commerce',
    name: 'Продукти · швидка доставка',
    hero: '18 хв', heroLabel: 'середній час доставки', window: '6 місяців',
    lead: 'Швидка доставка продуктів захлиналась: кожне зростання попиту ламало склад.',
    systems: ['operations', 'data'], stage: 'Scale',
    before: 'Час доставки 47 хв, out-of-stock 14%, прогнозу попиту немає.',
    diagnosis: [
      'Комплектація вручну, маршрути кур’єрів не оптимізовані.',
      'Замовлення на товар, якого немає на dark store.',
    ],
    money: 'Out-of-stock і повільна доставка коштували ~€140K/рік втраченого обороту.',
    system: [
      'Прогноз попиту й авто-поповнення dark stores за даними.',
      'Оптимізація комплектації й маршрутизації кур’єрів.',
      'Наскрізна аналітика SLA по кожному замовленню.',
    ],
    metrics: [
      { label: 'Час доставки', before: '47 хв', after: '18 хв' },
      { label: 'Out-of-stock', before: '14%', after: '3%' },
      { label: 'Замовлень на кур’єра/год', before: 'база', after: '+52%' },
      { label: 'Повторні за 30 днів', before: '28%', after: '54%' },
    ],
    after: 'Q-commerce тримає 18 хв на піку без збоїв складу.',
    independence: 'Прогноз і поповнення працюють автоматично, без ручного планування.',
    learning: 'У q-commerce швидкість — це функція даних про попит, а не кількості кур’єрів.',
    en: {
      cat: 'Grocery · Q-commerce',
      name: 'Groceries · rapid delivery',
      heroLabel: 'average delivery time',
      window: '6 months',
      lead: 'Rapid grocery delivery was choking: every spike in demand broke the warehouse.',
      before: 'Delivery time 47 min, out-of-stock 14%, no demand forecast.',
      diagnosis: [
        'Manual picking, courier routes not optimized.',
        'Orders for items not in the dark store.',
      ],
      money: 'Out-of-stock and slow delivery cost ~€140K/year of lost turnover.',
      system: [
        'Demand forecasting and data-driven auto-replenishment of dark stores.',
        'Optimized picking and courier routing.',
        'End-to-end SLA analytics on every order.',
      ],
      metrics: [
        { label: 'Delivery time', before: '47 хв', after: '18 хв' },
        { label: 'Out-of-stock', before: '14%', after: '3%' },
        { label: 'Orders per courier/hour', before: 'baseline', after: '+52%' },
        { label: 'Repeats in 30 days', before: '28%', after: '54%' },
      ],
      after: 'Q-commerce holds 18 min at peak with no warehouse failures.',
      independence: 'Forecasting and replenishment run automatically, with no manual planning.',
      learning: 'In q-commerce, speed is a function of demand data, not courier headcount.',
    },
  },
  {
    slug: 'auto-parts',
    cat: 'Auto Parts · Запчастини',
    name: 'Автозапчастини',
    hero: '250K', heroLabel: 'SKU у єдиному master data', window: '10 місяців',
    lead: 'Каталог із чвертю мільйона позицій, де клієнт не міг знайти деталь під своє авто.',
    systems: ['data', 'experience'], stage: 'Build',
    before: '250 000 SKU без нормалізації; пошук за VIN не працював, конверсія 0,7%.',
    diagnosis: [
      'Дублі, різні назви й ціни в різних системах — master data розсипано.',
      'Немає підбору за маркою/моделлю — клієнт помилявся з деталлю.',
    ],
    money: 'Помилки підбору давали 19% повернень і ~₴7,4 млн/рік втрат.',
    system: [
      'Єдиний master data на 250K SKU з нормалізацією та крос-номерами.',
      'Підбір за VIN і маркою/моделлю; зрозуміла картка сумісності.',
      'Синхронізовані ціни й залишки в реальному часі.',
    ],
    metrics: [
      { label: 'SKU в master data', before: 'хаос', after: '250 000' },
      { label: 'Конверсія', before: '0,7%', after: '2,4%' },
      { label: 'Повернення', before: '19%', after: '6%' },
      { label: 'Пошук за VIN', before: 'немає', after: '92% успіху' },
    ],
    after: 'Клієнт знаходить точну деталь під своє авто з першого разу.',
    independence: 'Каталог і сумісність оновлюються за регламентом командою клієнта.',
    learning: 'У широкому каталозі якість master data важливіша за обсяг трафіку.',
    en: {
      cat: 'Auto Parts · Spare parts',
      name: 'Auto parts',
      heroLabel: 'SKUs in unified master data',
      window: '10 months',
      lead: 'A quarter-million-item catalog where customers couldn’t find the part for their car.',
      before: '250,000 SKUs with no normalization; VIN search didn’t work, conversion 0.7%.',
      diagnosis: [
        'Duplicates, different names and prices across systems — master data scattered.',
        'No selection by make/model — customers picked the wrong part.',
      ],
      money: 'Fitment errors drove 19% returns and ~₴7.4M/year in losses.',
      system: [
        'Unified master data across 250K SKUs with normalization and cross-references.',
        'Selection by VIN and make/model; a clear compatibility page.',
        'Synchronized real-time prices and stock.',
      ],
      metrics: [
        { label: 'SKUs in master data', before: 'chaos', after: '250 000' },
        { label: 'Conversion', before: '0.7%', after: '2.4%' },
        { label: 'Returns', before: '19%', after: '6%' },
        { label: 'VIN search', before: 'none', after: '92% success' },
      ],
      after: 'Customers find the exact part for their car on the first try.',
      independence: 'The catalog and compatibility are updated by the client’s team on a set procedure.',
      learning: 'In a broad catalog, master-data quality matters more than traffic volume.',
    },
  },
  {
    slug: 'jewelry-brand',
    cat: 'Jewelry · Ювелірний бренд',
    name: 'Ювелірний бренд',
    hero: '×2,6', heroLabel: 'LTV преміум-клієнта', window: '12 місяців',
    lead: 'Дорогий продукт із рідкісною покупкою — клієнт зникав після першого замовлення.',
    systems: ['strategy', 'customer'], stage: 'Independence',
    before: 'Стратегії росту немає, повторні 11%, увесь трафік — платний.',
    diagnosis: [
      'Немає моделі росту й розуміння, за рахунок чого масштабуватись.',
      'Немає програми лояльності й приводів повернутись між покупками.',
    ],
    money: 'До €180K/рік життєвої цінності клієнта не реалізовувалось.',
    system: [
      'Стратегія й модель росту: трафік → конверсія → чек → повторні.',
      'Клубна програма й персональний сервіс за життєвими подіями.',
      'Retention-контур із приводами повернення між покупками.',
    ],
    metrics: [
      { label: 'LTV', before: 'база', after: '×2,6' },
      { label: 'Повторні', before: '11%', after: '29%' },
      { label: 'Органіка', before: '8%', after: '38%' },
      { label: 'Середній чек', before: 'база', after: '+22%' },
    ],
    after: 'Бренд росте за керованою моделлю, а не за рахунок бюджету на рекламу.',
    independence: 'Власник керує моделлю росту за квартальним циклом самостійно.',
    learning: 'Навіть у рідкісній покупці лояльність будує LTV, якщо є привід повернутись.',
    en: {
      cat: 'Jewelry · Jewelry brand',
      name: 'Jewelry brand',
      heroLabel: 'premium-customer LTV',
      window: '12 months',
      lead: 'A high-ticket product with rare purchases — customers disappeared after the first order.',
      before: 'No growth strategy, repeats 11%, all traffic paid.',
      diagnosis: [
        'No growth model and no understanding of what to scale on.',
        'No loyalty program and no reasons to return between purchases.',
      ],
      money: 'Up to €180K/year of customer lifetime value went unrealized.',
      system: [
        'A strategy and growth model: traffic → conversion → order value → repeats.',
        'A club program and personal service around life events.',
        'A retention loop with reasons to return between purchases.',
      ],
      metrics: [
        { label: 'LTV', before: 'baseline', after: '×2.6' },
        { label: 'Repeats', before: '11%', after: '29%' },
        { label: 'Organic', before: '8%', after: '38%' },
        { label: 'Average order value', before: 'baseline', after: '+22%' },
      ],
      after: 'The brand grows on a managed model, not on the ad budget.',
      independence: 'The owner runs the growth model on a quarterly cycle independently.',
      learning: 'Even with rare purchases, loyalty builds LTV when there’s a reason to return.',
    },
  },
  {
    slug: 'sportswear-brand',
    cat: 'Sportswear · Спортивний одяг',
    name: 'Спортивний одяг',
    hero: '+41%', heroLabel: 'до середнього чека', window: '7 місяців',
    lead: 'Продажі росли оборотом, а прибуток стояв на місці — промо з’їдало маржу.',
    systems: ['commercial', 'customer'], stage: 'Scale',
    before: 'ROAS 2,3×, знижки як основний драйвер, повторні 13%.',
    diagnosis: [
      'Немає ABC/XYZ — просувались низькомаржинальні позиції.',
      'Немає upsell/cross-sell комплектів і retention.',
    ],
    money: 'Промо без розрахунку впливу з’їдало до ₴5,6 млн/рік маржі.',
    system: [
      'ABC/XYZ і керування асортиментом за прибутковістю.',
      'Комплекти й cross-sell; персональні пропозиції за RFM.',
      'Retention-двигун і сегментовані кампанії.',
    ],
    metrics: [
      { label: 'Середній чек', before: 'база', after: '+41%' },
      { label: 'ROAS', before: '2,3×', after: '4,1×' },
      { label: 'Повторні', before: '13%', after: '33%' },
      { label: 'Маржа кампаній', before: 'база', after: '+16 п.п.' },
    ],
    after: 'Зростання стало прибутковим: чек і повторні тягнуть маржу, а не знижки.',
    independence: 'Команда планує промо за впливом на contribution самостійно.',
    learning: 'Керування асортиментом за маржею дає ріст прибутку без нового трафіку.',
    en: {
      cat: 'Sportswear · Athletic apparel',
      name: 'Athletic apparel',
      heroLabel: 'to average order value',
      window: '7 months',
      lead: 'Sales grew in turnover while profit stood still — promos ate the margin.',
      before: 'ROAS 2.3×, discounts as the main driver, repeats 13%.',
      diagnosis: [
        'No ABC/XYZ — low-margin items were being pushed.',
        'No upsell/cross-sell bundles and no retention.',
      ],
      money: 'Promos run without impact analysis ate up to ₴5.6M/year of margin.',
      system: [
        'ABC/XYZ and assortment management by profitability.',
        'Bundles and cross-sell; personalized offers by RFM.',
        'A retention engine and segmented campaigns.',
      ],
      metrics: [
        { label: 'Average order value', before: 'baseline', after: '+41%' },
        { label: 'ROAS', before: '2.3×', after: '4.1×' },
        { label: 'Repeats', before: '13%', after: '33%' },
        { label: 'Campaign margin', before: 'baseline', after: '+16 pp' },
      ],
      after: 'Growth became profitable: order value and repeats drive margin, not discounts.',
      independence: 'The team plans promos by contribution impact on its own.',
      learning: 'Managing assortment by margin grows profit without new traffic.',
    },
  },
  {
    slug: 'b2b-industrial',
    cat: 'B2B Industrial · Промислове постачання',
    name: 'B2B-постачальник',
    hero: '≥14 млн ₴', heroLabel: 'недоотриманого обороту на рік', window: 'діагностика + roadmap',
    lead: 'B2B-продажі трималися на кількох менеджерах — без процесів, ролей і даних.',
    systems: ['strategy', 'org', 'data'], stage: 'Diagnose',
    before: 'Усе на 3 ключових менеджерах, немає CRM-дисципліни й наскрізних даних.',
    diagnosis: [
      'Немає ролей, RACI й KPI — firefighting замість розвитку.',
      'Дані про угоди в головах; прогноз продажів неможливий.',
    ],
    money: '≥14 млн ₴/рік недоотриманого обороту через втрачені й забуті угоди.',
    system: [
      'Операційна модель: ролі, RACI, несуперечливі KPI, SOP.',
      'CRM-дисципліна й наскрізні дані по воронці B2B.',
      'Стратегія й roadmap під impact/effort.',
    ],
    metrics: [
      { label: 'Оборот', before: 'база', after: '×1,8–2,2', note: 'ціль' },
      { label: 'Втрачені угоди', before: '31%', after: '≤12%' },
      { label: 'Залежність від людей', before: 'висока', after: 'процеси' },
      { label: 'Прогнозованість', before: 'немає', after: 'воронка + план' },
    ],
    after: 'Roadmap із ролями й даними, що знімає бізнес із кількох героїв.',
    independence: 'Команда веде воронку за SOP і KPI без ручного контролю власника.',
    learning: 'У B2B найбільший розрив — не в трафіку, а в дисципліні процесів і даних.',
    en: {
      cat: 'B2B Industrial · Industrial supply',
      name: 'B2B supplier',
      heroLabel: 'of turnover missed per year',
      window: 'diagnostics + roadmap',
      lead: 'B2B sales rested on a few managers — with no processes, roles or data.',
      before: 'Everything on 3 key managers, no CRM discipline and no end-to-end data.',
      diagnosis: [
        'No roles, RACI or KPIs — firefighting instead of development.',
        'Deal data in people’s heads; sales forecasting impossible.',
      ],
      money: '≥14M ₴/year of missed turnover through lost and forgotten deals.',
      system: [
        'An operating model: roles, RACI, consistent KPIs, SOPs.',
        'CRM discipline and end-to-end data across the B2B funnel.',
        'A strategy and roadmap by impact/effort.',
      ],
      metrics: [
        { label: 'Turnover', before: 'baseline', after: '×1.8–2.2', note: 'target' },
        { label: 'Lost deals', before: '31%', after: '≤12%' },
        { label: 'People dependency', before: 'high', after: 'processes' },
        { label: 'Predictability', before: 'none', after: 'funnel + plan' },
      ],
      after: 'A roadmap with roles and data that lifts the business off a few heroes.',
      independence: 'The team runs the funnel by SOPs and KPIs without the owner’s manual control.',
      learning: 'In B2B the biggest gap is not in traffic but in the discipline of processes and data.',
    },
  },
  {
    slug: 'pet-supplies',
    cat: 'Pet · Зоотовари',
    name: 'Зоотовари',
    hero: '×2,2', heroLabel: 'конверсія після редизайну', window: '6 місяців',
    lead: 'Клієнти не могли швидко знайти корм під свого улюбленця — і йшли до маркетплейсу.',
    systems: ['experience', 'operations'], stage: 'Build',
    before: 'Конверсія 1,0%, out-of-stock 11%, mobile-версія втрачала покупця.',
    diagnosis: [
      'Каталог без фільтрів за твариною, віком і вагою.',
      'Залишки на сайті не відповідали складу — скасування замовлень.',
    ],
    money: 'Скасування й втрачений пошук коштували ~₴3,9 млн/рік обороту.',
    system: [
      'Перебудова каталогу й фільтрів під сценарій підбору корму.',
      'Синхронізація залишків склад ↔ сайт у реальному часі.',
      'Subscription на корм і post-purchase-нагадування.',
    ],
    metrics: [
      { label: 'Конверсія', before: '1,0%', after: '2,2%', note: '×2,2' },
      { label: 'Out-of-stock', before: '11%', after: '2%' },
      { label: 'Скасування', before: '17%', after: '5%' },
      { label: 'Підписки на корм', before: '0%', after: '23%' },
    ],
    after: 'Покупець підбирає корм за 3 кліки, а залишки не підводять на checkout.',
    independence: 'Клієнт керує каталогом і підписками у власному контурі.',
    learning: 'Досвід підбору і чесні залишки утримують клієнта від переходу на маркетплейс.',
    en: {
      cat: 'Pet · Pet supplies',
      name: 'Pet supplies',
      heroLabel: 'conversion after redesign',
      window: '6 months',
      lead: 'Customers couldn’t quickly find the right food for their pet — and left for the marketplace.',
      before: 'Conversion 1.0%, out-of-stock 11%, the mobile version lost buyers.',
      diagnosis: [
        'A catalog with no filters by animal, age and weight.',
        'On-site stock didn’t match the warehouse — order cancellations.',
      ],
      money: 'Cancellations and failed search cost ~₴3.9M/year of turnover.',
      system: [
        'Rebuilt catalog and filters for a food-selection scenario.',
        'Real-time stock sync between warehouse ↔ site.',
        'Food subscriptions and post-purchase reminders.',
      ],
      metrics: [
        { label: 'Conversion', before: '1.0%', after: '2.2%', note: '×2.2' },
        { label: 'Out-of-stock', before: '11%', after: '2%' },
        { label: 'Cancellations', before: '17%', after: '5%' },
        { label: 'Food subscriptions', before: '0%', after: '23%' },
      ],
      after: 'Buyers pick food in 3 clicks, and stock doesn’t fail them at checkout.',
      independence: 'The client manages the catalog and subscriptions in its own loop.',
      learning: 'A good selection experience and honest stock keep customers from switching to the marketplace.',
    },
  },
  {
    slug: 'furniture-eu',
    cat: 'Furniture · UA → EU',
    name: 'Меблі під замовлення',
    hero: '32%', heroLabel: 'частка обороту з ринків ЄС', window: '12 місяців',
    lead: 'Виробник меблів був готовий до експорту, але операційно не тримав доставку в ЄС.',
    systems: ['operations', 'strategy'], stage: 'Scale',
    before: 'Європа 0%, SLA виробництва й доставки непрогнозовані, немає стратегії експорту.',
    diagnosis: [
      'Немає моделі виходу на ринки й декомпозиції цілей.',
      'Логістика великогабариту в ЄС не вибудувана — терміни плавали.',
    ],
    money: 'Незакритий експортний попит — до €260K/рік нереалізованого обороту.',
    system: [
      'Стратегія експансії: пріоритезація ринків PL · DE · CZ.',
      'SLA виробництва й логістики великогабариту під ЄС.',
      'Локалізація сайту, оплат і доставки під кожен ринок.',
    ],
    metrics: [
      { label: 'Частка ЄС', before: '0%', after: '32%' },
      { label: 'SLA доставки', before: 'плавав', after: '14 днів' },
      { label: 'Оборот', before: 'база', after: '+58%' },
      { label: 'Ринки', before: 'UA', after: 'UA·PL·DE·CZ' },
    ],
    after: 'Третина обороту приходить із ЄС на прогнозованій логістиці.',
    independence: 'Команда відкриває нові ринки за відпрацьованим плейбуком.',
    learning: 'Експорт починається не з сайту, а з операційної спроможності доставити.',
    en: {
      cat: 'Furniture · UA → EU',
      name: 'Made-to-order furniture',
      heroLabel: 'share of turnover from EU markets',
      window: '12 months',
      lead: 'A furniture maker was ready to export but operationally couldn’t hold EU delivery.',
      before: 'Europe 0%, production and delivery SLAs unpredictable, no export strategy.',
      diagnosis: [
        'No market-entry model and no breakdown of targets.',
        'Oversized-item logistics into the EU not built out — timelines drifted.',
      ],
      money: 'Unmet export demand — up to €260K/year of unrealized turnover.',
      system: [
        'An expansion strategy: prioritizing markets PL · DE · CZ.',
        'Production and oversized-logistics SLAs for the EU.',
        'Localization of site, payments and delivery for each market.',
      ],
      metrics: [
        { label: 'EU share', before: '0%', after: '32%' },
        { label: 'Delivery SLA', before: 'fluctuated', after: '14 днів' },
        { label: 'Turnover', before: 'baseline', after: '+58%' },
        { label: 'Markets', before: 'UA', after: 'UA·PL·DE·CZ' },
      ],
      after: 'A third of turnover comes from the EU on predictable logistics.',
      independence: 'The team opens new markets with a proven playbook.',
      learning: 'Export begins not with the website but with the operational capability to deliver.',
    },
  },
  {
    slug: 'marketplace-fashion',
    cat: 'Fashion · Мультибрендовий маркетплейс',
    name: 'Fashion-маркетплейс',
    hero: '×2 год', heroLabel: 'онбординг продавця замість тижнів', window: '9 місяців',
    lead: 'Маркетплейс тримався на ручному онбордингу продавців і героїчних зусиллях команди.',
    systems: ['org', 'experience'], stage: 'Independence',
    before: 'Онбординг продавця 2–3 тижні вручну, немає SOP, усе «терміново».',
    diagnosis: [
      'Немає ролей і власника процесів — команда в постійному firefighting.',
      'Картка й каталог продавця збирались вручну, з помилками.',
    ],
    money: 'Повільний онбординг гальмував ріст GMV на ~₴11 млн/рік.',
    system: [
      'SOP і self-service онбординг продавця з валідацією даних.',
      'Ролі, RACI й база знань — бізнес перестав залежати від героїв.',
      'Уніфікована картка й каталог продавця з контролем якості.',
    ],
    metrics: [
      { label: 'Онбординг продавця', before: '2–3 тижні', after: '2 години' },
      { label: 'Активних продавців', before: 'база', after: '+140%' },
      { label: 'Помилки в картках', before: '18%', after: '3%' },
      { label: 'GMV', before: 'база', after: '+63%' },
    ],
    after: 'Маркетплейс масштабує продавців процесами, а не героїзмом команди.',
    independence: 'Продавці підключаються self-service, команда лише контролює якість.',
    learning: 'Масштаб платформи впирається в SOP і ролі раніше, ніж у трафік.',
    en: {
      cat: 'Fashion · Multi-brand marketplace',
      name: 'Fashion marketplace',
      heroLabel: 'seller onboarding instead of weeks',
      window: '9 months',
      lead: 'The marketplace ran on manual seller onboarding and the team’s heroic effort.',
      before: 'Seller onboarding 2–3 weeks by hand, no SOPs, everything “urgent”.',
      diagnosis: [
        'No roles and no process owner — the team in constant firefighting.',
        'Seller pages and catalogs assembled by hand, with errors.',
      ],
      money: 'Slow onboarding held back GMV growth by ~₴11M/year.',
      system: [
        'SOPs and self-service seller onboarding with data validation.',
        'Roles, RACI and a knowledge base — the business stopped depending on heroes.',
        'A unified seller page and catalog with quality control.',
      ],
      metrics: [
        { label: 'Seller onboarding', before: '2–3 тижні', after: '2 години' },
        { label: 'Active sellers', before: 'baseline', after: '+140%' },
        { label: 'Errors in listings', before: '18%', after: '3%' },
        { label: 'GMV', before: 'baseline', after: '+63%' },
      ],
      after: 'The marketplace scales sellers through processes, not team heroics.',
      independence: 'Sellers onboard self-service; the team only controls quality.',
      learning: 'A platform’s scale hits SOPs and roles before it hits traffic.',
    },
  },
];

export const caseBySlug = (slug: string) => CASES.find((c) => c.slug === slug);

export const STAGES: Stage[] = ['Diagnose', 'Build', 'Scale', 'Independence'];

/**
 * Локалізований вигляд кейсу: у EN-режимі накладає c.en поверх c (shallow merge,
 * з фолбеком на українські поля, яких немає в en). Числа/hero/slug/systemKeys —
 * без змін. Для UK повертає кейс як є.
 */
export function localizeCase(c: CaseStudy, lang: Lang): CaseStudy {
  return lang === 'en' && c.en ? { ...c, ...c.en } : c;
}

/**
 * Ролевий склад команди кейсу — детермінований, виводиться зі списку систем
 * (`systems`), яких торкнувся кейс. Не вигадуємо конкретних людей (кейси
 * анонімні): показуємо, які ролі/компетенції були задіяні. Кожен кейс веде
 * Head of E-commerce (лід доставки результату). Закриває зауваження «незрозуміло,
 * хто працює над проєктом» без розкриття персональних даних.
 */
const ROLE_UK: Record<SystemKey, string> = {
  strategy: 'E-commerce стратег',
  commercial: 'Performance / комерція',
  customer: 'Retention / CRM',
  experience: 'UX / CRO',
  operations: 'Операції та процеси',
  data: 'Аналітика та BI',
  org: 'Оргдизайн і команда',
  expansion: 'Вихід на ринки',
};
const ROLE_EN: Record<SystemKey, string> = {
  strategy: 'E-commerce Strategist',
  commercial: 'Performance / Commerce',
  customer: 'Retention / CRM',
  experience: 'UX / CRO',
  operations: 'Operations & Process',
  data: 'Analytics & BI',
  org: 'Org Design & Team',
  expansion: 'Market Expansion',
};

export function caseTeam(c: CaseStudy, lang: Lang): string[] {
  const map = lang === 'en' ? ROLE_EN : ROLE_UK;
  const lead = lang === 'en' ? 'Head of E-commerce (delivery lead)' : 'Head of E-commerce (лід проєкту)';
  const seen = new Set<string>();
  const roles: string[] = [];
  for (const k of c.systems) { const r = map[k]; if (r && !seen.has(r)) { seen.add(r); roles.push(r); } }
  return [lead, ...roles];
}
