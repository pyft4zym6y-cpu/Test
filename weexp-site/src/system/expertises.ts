/**
 * Фокусні експертизи WEEXP (хаб «Експансія»). Кожна — окрема підсторінка
 * /expansion/:slug зі своїм описом. Двомовно (uk, en) через кортежі + L().
 * Міжнародна експансія лишається однією з експертиз (колишня /expansion).
 */
export type Lng = 'uk' | 'en';
type P = [string, string]; // [uk, en]
export const L = (p: P, lang: Lng): string => (lang === 'en' ? p[1] : p[0]);

export type Expertise = {
  slug: string;
  tag: P;
  title: P;
  tagline: P;          // рукописний акцент
  intro: P;
  services: { name: P; desc: P }[];
  deliverables: P[];
  process: { t: P; d: P }[];
  outcome: P;
};

export const EXPERTISES: Expertise[] = [
  {
    slug: 'international',
    tag: ['Ринки ЄС і США', 'EU & US markets'],
    title: ['Міжнародна експансія', 'International expansion'],
    tagline: ['Вихід за межі одного ринку — системно.', 'Beyond a single market — systematically.'],
    intro: [
      'Виводимо бренд на ЄС/США як систему, а не «спробуємо й подивимось»: вибір ринку за юніт-економікою, юрособа й податки, локалізація, власний сайт і маркетплейси, логістика та перші продажі.',
      'We take a brand into the EU/US as a system, not «let’s try and see»: market choice by unit economics, legal entity and taxes, localization, own site and marketplaces, logistics and first sales.',
    ],
    services: [
      { name: ['Вибір ринку', 'Market selection'], desc: ['Попит, конкуренція, CAC і розмір категорії — куди йти першими.', 'Demand, competition, CAC and category size — where to go first.'] },
      { name: ['Інфраструктура', 'Infrastructure'], desc: ['Юрособа, VAT/OSS, платежі й розрахунки під ринок.', 'Legal entity, VAT/OSS, payments and settlements for the market.'] },
      { name: ['Локалізація', 'Localization'], desc: ['Мова, контент, ціни й офер під локального клієнта.', 'Language, content, prices and offer for the local customer.'] },
      { name: ['Канали', 'Channels'], desc: ['Власний сайт + Amazon / Allegro / локальні маркетплейси.', 'Own site + Amazon / Allegro / local marketplaces.'] },
      { name: ['Логістика й fulfillment', 'Logistics & fulfillment'], desc: ['Склади, доставка, повернення й penetration маркетплейсів.', 'Warehousing, delivery, returns and marketplace penetration.'] },
      { name: ['Юніт-економіка ринку', 'Market unit economics'], desc: ['Рахуємо маржу до запуску, а не після перших збитків.', 'We model margin before launch, not after the first losses.'] },
    ],
    deliverables: [
      ['Карта пріоритетних ринків із обґрунтуванням', 'Prioritized market map with rationale'],
      ['Модель юніт-економіки на ринок', 'Per-market unit-economics model'],
      ['План запуску на 90 днів', '90-day launch plan'],
      ['Чек-лист legal / tax / payment', 'Legal / tax / payment checklist'],
    ],
    process: [
      { t: ['Аудит готовності', 'Readiness audit'], d: ['Продукт, маржа, запас операцій на 6–12 міс.', 'Product, margin, 6–12 mo operational runway.'] },
      { t: ['Вибір ринку', 'Market choice'], d: ['Один перший ринок за економікою, не «усе одразу».', 'One first market by economics, not «all at once».'] },
      { t: ['Інфраструктура', 'Infrastructure'], d: ['Юрособа, податки, платежі, логістика.', 'Entity, taxes, payments, logistics.'] },
      { t: ['Запуск', 'Launch'], d: ['Лістинги, контент, перший трафік і замовлення.', 'Listings, content, first traffic and orders.'] },
      { t: ['Оптимізація', 'Optimization'], d: ['Доводимо до позитивної економіки й плейбуку.', 'To positive economics and a repeatable playbook.'] },
    ],
    outcome: [
      'Перший ринок, доведений до позитивної економіки, і повторюваний плейбук для наступних.',
      'A first market taken to positive economics, and a repeatable playbook for the next ones.',
    ],
  },
  {
    slug: 'automation',
    tag: ['Операції без ручного режиму', 'Operations without manual mode'],
    title: ['Автоматизація процесів', 'Process automation'],
    tagline: ['Щоб бізнес працював без героїзму.', 'So the business runs without heroics.'],
    intro: [
      'Прибираємо ручну роботу, з якої витікають час і гроші: CRM і воронка продажів, інтеграції ERP / склад / доставка, автоматичні сценарії та звітність у реальному часі.',
      'We remove the manual work that leaks time and money: CRM and sales pipeline, ERP / warehouse / delivery integrations, automated scenarios and real-time reporting.',
    ],
    services: [
      { name: ['CRM і pipeline', 'CRM & pipeline'], desc: ['Єдина воронка продажів зі статусами й відповідальними.', 'One sales pipeline with statuses and owners.'] },
      { name: ['Інтеграції', 'Integrations'], desc: ['ERP, склад, каса, доставка, платежі — в один контур.', 'ERP, warehouse, POS, delivery, payments — into one loop.'] },
      { name: ['Автосценарії', 'Auto-scenarios'], desc: ['Тригери, розсилки, зміни статусів, нагадування.', 'Triggers, campaigns, status changes, reminders.'] },
      { name: ['Єдина звітність / BI', 'Unified reporting / BI'], desc: ['Одні цифри для всіх рішень, а не в кожного свої.', 'One set of numbers for all decisions, not per-person.'] },
      { name: ['Ролі й регламенти', 'Roles & playbooks'], desc: ['RACI, зони відповідальності, повторювані процеси.', 'RACI, ownership zones, repeatable processes.'] },
      { name: ['Документообіг і задачі', 'Docs & task flow'], desc: ['Задачі, погодження й документи без хаосу в чатах.', 'Tasks, approvals and docs without chat chaos.'] },
    ],
    deliverables: [
      ['Карта процесів as-is → to-be', 'Process map as-is → to-be'],
      ['Налаштована CRM та інтеграції', 'Configured CRM and integrations'],
      ['Дашборд ключових метрик', 'Key-metrics dashboard'],
      ['Регламенти й ролі команди', 'Playbooks and team roles'],
    ],
    process: [
      { t: ['Аудит процесів', 'Process audit'], d: ['Де саме ручна робота й втрати.', 'Where the manual work and losses are.'] },
      { t: ['Дизайн to-be', 'To-be design'], d: ['Як має працювати без героїзму.', 'How it should run without heroics.'] },
      { t: ['Впровадження', 'Implementation'], d: ['CRM, інтеграції, сценарії.', 'CRM, integrations, scenarios.'] },
      { t: ['Навчання', 'Enablement'], d: ['Команда працює в системі, а не повз неї.', 'The team works in the system, not around it.'] },
      { t: ['Підтримка', 'Support'], d: ['Стабілізація й розвиток контуру.', 'Stabilization and further development.'] },
    ],
    outcome: [
      'Менше ручних дій і помилок, прозорі цифри, бізнес не залежить від пам’яті окремих людей.',
      'Fewer manual steps and errors, transparent numbers, a business that doesn’t depend on individuals’ memory.',
    ],
  },
  {
    slug: 'web',
    tag: ['Сайт як актив, не витрата', 'A site as an asset, not a cost'],
    title: ['Веб розробка', 'Web development'],
    tagline: ['Вітрина, що продає, а не просто «є».', 'A storefront that sells, not just «exists».'],
    intro: [
      'Проєктуємо й будуємо e-commerce, який конвертує: від UX і швидкості до інтеграцій та аналітики. Magento, Shopify чи headless — обираємо під задачу, а не під моду.',
      'We design and build e-commerce that converts: from UX and speed to integrations and analytics. Magento, Shopify or headless — chosen for the task, not the trend.',
    ],
    services: [
      { name: ['Платформа', 'Platform'], desc: ['Magento / Shopify / custom / headless — під ваш кейс.', 'Magento / Shopify / custom / headless — for your case.'] },
      { name: ['UX/UI і CRO', 'UX/UI & CRO'], desc: ['Каталог, картка, checkout — під конверсію.', 'Catalog, product, checkout — built for conversion.'] },
      { name: ['Швидкість', 'Speed'], desc: ['Core Web Vitals і продуктивність під мобайл.', 'Core Web Vitals and mobile performance.'] },
      { name: ['Інтеграції', 'Integrations'], desc: ['CRM / ERP / платежі / маркетплейси / доставка.', 'CRM / ERP / payments / marketplaces / delivery.'] },
      { name: ['Аналітика', 'Analytics'], desc: ['GA4 / GTM, події, наскрізний трекінг.', 'GA4 / GTM, events, end-to-end tracking.'] },
      { name: ['Підтримка й розвиток', 'Support & growth'], desc: ['Спринти покращень, а не «здали й забули».', 'Improvement sprints, not «ship and forget».'] },
    ],
    deliverables: [
      ['Прототип і дизайн під конверсію', 'Conversion-focused prototype and design'],
      ['Робочий сайт із інтеграціями', 'Live site with integrations'],
      ['Налаштована наскрізна аналітика', 'Configured end-to-end analytics'],
      ['Документація й доступи', 'Documentation and access handover'],
    ],
    process: [
      { t: ['Дискавері', 'Discovery'], d: ['Цілі, аудиторія, обмеження, метрики.', 'Goals, audience, constraints, metrics.'] },
      { t: ['Прототип', 'Prototype'], d: ['Структура й ключові екрани.', 'Structure and key screens.'] },
      { t: ['Дизайн', 'Design'], d: ['Візуал під бренд і конверсію.', 'Visual for brand and conversion.'] },
      { t: ['Розробка', 'Development'], d: ['Платформа, інтеграції, швидкість.', 'Platform, integrations, speed.'] },
      { t: ['Запуск', 'Launch'], d: ['Реліз, аналітика й оптимізація.', 'Release, analytics and optimization.'] },
    ],
    outcome: [
      'Швидкий, керований сайт із наскрізною аналітикою — основа для зростання, а не постійний головний біль.',
      'A fast, manageable site with end-to-end analytics — a foundation for growth, not a constant headache.',
    ],
  },
  {
    slug: 'marketing',
    tag: ['Трафік і попит під економіку', 'Traffic and demand for the economics'],
    title: ['Маркетинг', 'Marketing'],
    tagline: ['Не «більше реклами» — більше прибутку.', 'Not «more ads» — more profit.'],
    intro: [
      'Будуємо маркетинг, що працює на юніт-економіку: перформанс, SEO, контент, CRM-маркетинг і утримання. Кожен канал — із метрикою й відповідальним, а не «для галочки».',
      'We build marketing that works for unit economics: performance, SEO, content, CRM marketing and retention. Every channel has a metric and an owner, not «just because».',
    ],
    services: [
      { name: ['Performance', 'Performance'], desc: ['Google / Meta / маркетплейси під CAC і ROAS.', 'Google / Meta / marketplaces for CAC and ROAS.'] },
      { name: ['SEO і контент', 'SEO & content'], desc: ['Органіка як актив із передбачуваним трафіком.', 'Organic as an asset with predictable traffic.'] },
      { name: ['CRM-маркетинг', 'CRM marketing'], desc: ['Утримання, повторні продажі, LTV.', 'Retention, repeat sales, LTV.'] },
      { name: ['Аналітика й атрибуція', 'Analytics & attribution'], desc: ['Чесні цифри по каналах, а не «десь спрацювало».', 'Honest per-channel numbers, not «something worked».'] },
      { name: ['Позиціонування', 'Positioning'], desc: ['Меседжинг і офер, що відбудовують від конкурентів.', 'Messaging and offer that stand apart from competitors.'] },
      { name: ['Креатив і лендінги', 'Creative & landing pages'], desc: ['Креатив і сторінки під конверсію, а не лайки.', 'Creative and pages for conversion, not likes.'] },
    ],
    deliverables: [
      ['Медіаплан під CAC / ROAS', 'Media plan for CAC / ROAS'],
      ['Дерево метрик і атрибуція', 'Metrics tree and attribution'],
      ['Календар контенту', 'Content calendar'],
      ['Звітність із висновками', 'Reporting with conclusions'],
    ],
    process: [
      { t: ['Аудит каналів', 'Channel audit'], d: ['Що працює, що зливає бюджет.', 'What works, what burns budget.'] },
      { t: ['Стратегія', 'Strategy'], d: ['Канали й метрики під економіку.', 'Channels and metrics for the economics.'] },
      { t: ['Запуск', 'Launch'], d: ['Кампанії, контент, креатив.', 'Campaigns, content, creative.'] },
      { t: ['Оптимізація', 'Optimization'], d: ['Ріжемо неефективне, підсилюємо робоче.', 'Cut the ineffective, scale the working.'] },
      { t: ['Масштабування', 'Scaling'], d: ['Зростання без втрати економіки.', 'Growth without breaking the economics.'] },
    ],
    outcome: [
      'Передбачуваний потік клієнтів із контрольованою вартістю й зростанням LTV.',
      'A predictable flow of customers with controlled cost and growing LTV.',
    ],
  },
];

export const expertiseBySlug = (slug: string | undefined): Expertise | undefined =>
  EXPERTISES.find((e) => e.slug === slug);
