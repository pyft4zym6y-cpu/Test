import type { SystemKey } from '@/data/xray';

/**
 * Команда WEEXP структурована за системами: у кожної зони є власник.
 * Логіка ролі: бізнес-зона → що закриває → основні функції → результат.
 * Не «універсали», а відповідальні за конкретний контур Commerce OS.
 */
export type Role = {
  role: string;
  roleEn?: string;     // EN-підпис ролі (fallback → role)
  name?: string;       // ім'я (показуємо для засновника)
  photo?: string;      // портрет (засновник)
  owns: SystemKey[];   // системи-власності (чипи)
  zone: string;        // бізнес-зона, яку закриває роль
  zoneEn?: string;     // EN
  focus: string;
  focusEn?: string;    // EN
  expertise: string[]; // основні функції
  expertiseEn?: string[]; // EN
  exp: string;         // досвід / факт-результат
  expEn?: string;      // EN
  /** Транслітероване імʼя для EN-сторінки (кирилиця в англійському тексті — не імʼя, а збій). */
  nameEn?: string;
};

export const TEAM: Role[] = [
  {
    role: 'Founder & Architect of Commerce',
    name: 'Павло Сидоренко',
    nameEn: 'Pavlo Sydorenko',
    photo: '/team/pavlo-sydorenko.jpg',
    owns: ['strategy', 'org'],
    zone: 'Стратегія та операційна модель',
    zoneEn: 'Strategy & operating model',
    focus: 'Стратегія, операційна модель, governance — щоб бізнес працював без героя.',
    focusEn: 'Strategy, operating model, governance — so the business runs without a hero.',
    expertise: ['Побудова e-commerce як функції бізнесу', 'Модель росту й управлінський цикл', 'Independence Score як стандарт зрілості'],
    expertiseEn: ['Building e-commerce as a business function', 'Growth model and management cycle', 'Independence Score as a maturity standard'],
    exp: '8+ років у міжнародному e-commerce (US · EU · MENA), бренди Forbes TOP-250',
    expEn: '8+ years in international e-commerce (US · EU · MENA), Forbes TOP-250 brands',
  },
  {
    role: 'Head of Commerce',
    owns: ['commercial'],
    zone: 'Комерційна ефективність',
    zoneEn: 'Commercial performance',
    focus: 'Прибуткова комерція: конверсія, чек, повторні, асортимент і промо за маржею.',
    focusEn: 'Profitable commerce: conversion, AOV, repeats, assortment and promo by margin.',
    expertise: ['Юніт-економіка по SKU і категоріях', 'ABC/XYZ і керування асортиментом', 'Промо-економіка й contribution margin'],
    expertiseEn: ['Unit economics by SKU and category', 'ABC/XYZ and assortment management', 'Promo economics and contribution margin'],
    exp: 'P&L-відповідальність за портфелі $1–10M обороту',
    expEn: 'P&L ownership of $1–10M revenue portfolios',
  },
  {
    role: 'Retention & CRM Architect',
    owns: ['customer'],
    zone: 'Утримання і CRM',
    zoneEn: 'Retention & CRM',
    focus: 'Перетворення трафіку на клієнтів, а клієнтів — на LTV.',
    focusEn: 'Turning traffic into customers, and customers into LTV.',
    expertise: ['RFM і lifecycle-сегментація', 'Win-back, abandoned cart, post-purchase', 'Єдиний профіль клієнта, персоналізація'],
    expertiseEn: ['RFM and lifecycle segmentation', 'Win-back, abandoned cart, post-purchase', 'Unified customer profile, personalization'],
    exp: 'Retention-програми з підйомом повторних покупок ×2–4',
    expEn: 'Retention programs lifting repeat purchases ×2–4',
  },
  {
    role: 'CRO / UX Lead',
    owns: ['experience'],
    zone: 'Досвід і конверсія',
    zoneEn: 'Experience & conversion',
    focus: 'Робочий шлях клієнта: каталог, картка, checkout, mobile.',
    focusEn: 'A customer journey that works: catalog, product page, checkout, mobile.',
    expertise: ['CRO-процес і A/B-тестування', 'Карта точок втрати користувачів', 'UX за даними, а не за смаком'],
    expertiseEn: ['CRO process and A/B testing', 'Map of user drop-off points', 'UX by data, not by taste'],
    exp: 'Конверсії в топ-1% сегмента (до 4,2% при нормі 0,7–1,5%)',
    expEn: 'Conversion in the top 1% of the segment (up to 4.2% vs. 0.7–1.5% norm)',
  },
  {
    role: 'Operations & Fulfillment Lead',
    owns: ['operations'],
    zone: 'Операції та fulfillment',
    zoneEn: 'Operations & fulfillment',
    focus: 'Продаж, який реально виконується: від кошика до повернення.',
    focusEn: 'A sale that actually gets fulfilled: from cart to return.',
    expertise: ['SLA обробки, викуп, доставка, повернення', 'Резервування і синхронізація залишків', 'Контроль вартості fulfillment'],
    expertiseEn: ['Processing SLA, acceptance, delivery, returns', 'Stock reservation and inventory sync', 'Fulfillment cost control'],
    exp: 'Зниження невикупів і втрат на стиках складу й логістики',
    expEn: 'Fewer failed deliveries and losses at the warehouse–logistics seams',
  },
  {
    role: 'Data & BI Engineer',
    owns: ['data'],
    zone: 'Дані та аналітика',
    zoneEn: 'Data & analytics',
    focus: 'Одне джерело правди: наскрізна аналітика і P&L по e-commerce.',
    focusEn: 'A single source of truth: end-to-end analytics and e-commerce P&L.',
    expertise: ['GA4, наскрізна аналітика, attribution', 'Unit economics, cohort, contribution margin', 'Дашборди й автоматичні алерти'],
    expertiseEn: ['GA4, end-to-end analytics, attribution', 'Unit economics, cohorts, contribution margin', 'Dashboards and automated alerts'],
    exp: 'Побудова керованого P&L і достовірних даних із CRM/ERP/GA4',
    expEn: 'Building a managed P&L and trustworthy data from CRM/ERP/GA4',
  },
  {
    role: 'Integration Engineer',
    owns: ['data', 'operations'],
    zone: 'Технології та інтеграції',
    zoneEn: 'Technology & integrations',
    focus: 'Цифрова інфраструктура: CMS / CRM / ERP / WMS / маркетинг як єдиний контур.',
    focusEn: 'Digital infrastructure: CMS / CRM / ERP / WMS / marketing as a single circuit.',
    expertise: ['Інтеграції та master data', 'Моніторинг API, узгодженість цін і залишків', 'Зняття технічного боргу'],
    expertiseEn: ['Integrations and master data', 'API monitoring, price and stock consistency', 'Paying down technical debt'],
    exp: 'Інтеграційні контури під асортимент до 250K SKU',
    expEn: 'Integration circuits for assortments up to 250K SKU',
  },
  {
    role: 'Demand & SEO Strategist',
    owns: ['customer', 'strategy'],
    zone: 'Органічний попит і SEO',
    zoneEn: 'Organic demand & SEO',
    focus: 'Стабільне залучення: органіка й бренд замість залежності від платного.',
    focusEn: 'Stable acquisition: organic and brand instead of dependence on paid.',
    expertise: ['Technical + content SEO, привʼязаний до комерції', 'International SEO', 'Керування CAC і міксом каналів'],
    expertiseEn: ['Technical + content SEO tied to commerce', 'International SEO', 'Managing CAC and the channel mix'],
    exp: 'Частка безкоштовного трафіку до 45%, зниження CAC',
    expEn: 'Organic traffic share up to 45%, lower CAC',
  },
  {
    role: 'Delivery Lead / PM',
    owns: ['org'],
    zone: 'Виконання і governance',
    zoneEn: 'Delivery & governance',
    focus: 'Виконання хвилями під Definition of Done, без firefighting.',
    focusEn: 'Delivery in waves under a Definition of Done, without firefighting.',
    expertise: ['Roadmap і пріоритизація impact/effort', 'SOP, база знань, RACI', 'Post-mortem і hypothesis-driven підхід'],
    expertiseEn: ['Roadmap and impact/effort prioritization', 'SOPs, knowledge base, RACI', 'Post-mortem and hypothesis-driven approach'],
    exp: 'Програми побудови систем 6–12 місяців із передачею клієнту',
    expEn: 'System-building programs of 6–12 months with handover to the client',
  },

  /* ── Розширення ростера: ширші зони Commerce OS ── */
  {
    role: 'Paid & Performance Lead',
    owns: ['customer'],
    zone: 'Платний трафік і performance',
    zoneEn: 'Paid traffic & performance',
    focus: 'Керований платний ріст: не «залити бюджет», а керувати CAC/ROAS за маржею.',
    focusEn: 'Managed paid growth: not “pour in budget”, but steering CAC/ROAS by margin.',
    expertise: ['Meta/Google/TikTok, структура акаунтів', 'MER, ROAS-цілі, incrementality', 'Креативні цикли й аудиторії'],
    expertiseEn: ['Meta/Google/TikTok, account structure', 'MER, ROAS targets, incrementality', 'Creative cycles and audiences'],
    exp: 'Зниження CAC і масштабування при утриманні contribution margin',
    expEn: 'Lower CAC and scaling while holding contribution margin',
  },
  {
    role: 'Marketplace & Expansion Lead',
    owns: ['expansion'],
    zone: 'Маркетплейси й вихід на ринки',
    zoneEn: 'Marketplaces & market entry',
    focus: 'Вихід на ЄС/США як окремий контур: Allegro, Amazon, eBay, локальні майданчики.',
    focusEn: 'EU/US entry as a separate circuit: Allegro, Amazon, eBay, local platforms.',
    expertise: ['Market selection і юніт-економіка ринку', 'Лістинги, контент, buy-box', 'Логістика й локалізація під ринок'],
    expertiseEn: ['Market selection and market unit economics', 'Listings, content, buy-box', 'Logistics and market localization'],
    exp: 'Системний запуск на кількох ринках із нуля',
    expEn: 'Systematic launch across several markets from scratch',
  },
  {
    role: 'Content & Storytelling Lead',
    owns: ['customer', 'experience'],
    zone: 'Контент і сторітелінг',
    zoneEn: 'Content & storytelling',
    focus: 'Контент, що продає й будує довіру — на сайті, у картці, у каналах.',
    focusEn: 'Content that sells and builds trust — on the site, the product page, the channels.',
    expertise: ['Контент-архітектура під шлях клієнта', 'Product storytelling і UGC', 'Локалізація під ринки'],
    expertiseEn: ['Content architecture for the customer journey', 'Product storytelling and UGC', 'Localization for markets'],
    exp: 'Контент, привʼязаний до конверсії, а не до «охоплень»',
    expEn: 'Content tied to conversion, not to “reach”',
  },
  {
    role: 'Brand & Creative Director',
    owns: ['strategy', 'customer'],
    zone: 'Бренд і креатив',
    zoneEn: 'Brand & creative',
    focus: 'Впізнаваність і сенс: чому бренд обирають, а не лише «дешевше».',
    focusEn: 'Recognition and meaning: why the brand is chosen, not just “cheaper”.',
    expertise: ['Позиціонування й tone of voice', 'Візуальна система й креатив-продакшн', 'Бренд-метрики й consistency'],
    expertiseEn: ['Positioning and tone of voice', 'Visual system and creative production', 'Brand metrics and consistency'],
    exp: 'Побудова premium-сприйняття для D2C-брендів',
    expEn: 'Building premium perception for D2C brands',
  },
  {
    role: 'Pricing & Margin Analyst',
    owns: ['commercial'],
    zone: 'Ціноутворення й маржа',
    zoneEn: 'Pricing & margin',
    focus: 'Ціна як важіль прибутку: правила, еластичність, промо-дисципліна.',
    focusEn: 'Price as a profit lever: rules, elasticity, promo discipline.',
    expertise: ['Цінові правила й коридори', 'Еластичність і конкурентний моніторинг', 'Промо-економіка й markdown-контроль'],
    expertiseEn: ['Pricing rules and corridors', 'Elasticity and competitive monitoring', 'Promo economics and markdown control'],
    exp: 'Ріст маржі без втрати обсягу через дисципліну цін',
    expEn: 'Margin growth without losing volume through pricing discipline',
  },
  {
    role: 'Merchandising Lead',
    owns: ['experience', 'commercial'],
    zone: 'Мерчандайзинг і викладка',
    zoneEn: 'Merchandising & assortment display',
    focus: 'Правильний товар — на правильному місці вітрини у правильний момент.',
    focusEn: 'The right product in the right place on the storefront at the right moment.',
    expertise: ['Категорійна викладка й пошук', 'Cross/upsell і бандли', 'Керування асортиментною матрицею'],
    expertiseEn: ['Category display and search', 'Cross/upsell and bundles', 'Assortment matrix management'],
    exp: 'Ріст AOV і глибини кошика через мерчандайзинг',
    expEn: 'Higher AOV and basket depth through merchandising',
  },
  {
    role: 'Finance / Unit-Economics Partner',
    owns: ['data', 'commercial'],
    zone: 'Фінанси й юніт-економіка',
    zoneEn: 'Finance & unit economics',
    focus: 'Рішення за P&L, а не за оборотом: контрибуція, кеш-цикл, окупність.',
    focusEn: 'Decisions by P&L, not by revenue: contribution, cash cycle, payback.',
    expertise: ['P&L e-commerce і contribution margin', 'Cash conversion cycle', 'Оцінка окупності ініціатив'],
    expertiseEn: ['E-commerce P&L and contribution margin', 'Cash conversion cycle', 'Payback assessment of initiatives'],
    exp: 'Переведення бізнесу з «обороту» на кероване прибуткове зростання',
    expEn: 'Moving the business from “revenue” to managed profitable growth',
  },
  {
    role: 'Legal & Compliance (Markets)',
    owns: ['expansion', 'org'],
    zone: 'Юридика й комплаєнс ринків',
    zoneEn: 'Legal & market compliance',
    focus: 'Юрконтур виходу на ринки: структура, податки, споживче право, платежі.',
    focusEn: 'The legal circuit of market entry: structure, taxes, consumer law, payments.',
    expertise: ['Юрособа, оподаткування, VAT/OSS', 'Споживче право ЄС і повернення', 'Payment та KYC-вимоги ринку'],
    expertiseEn: ['Legal entity, taxation, VAT/OSS', 'EU consumer law and returns', 'Payment and market KYC requirements'],
    exp: 'Легальний запуск на ринках ЄС без сюрпризів',
    expEn: 'A legal launch in EU markets with no surprises',
  },
  {
    role: 'Customer Support & Success Lead',
    owns: ['operations', 'customer'],
    zone: 'Підтримка й customer success',
    zoneEn: 'Support & customer success',
    focus: 'Досвід після покупки: підтримка, повернення, NPS — як драйвер повторних.',
    focusEn: 'The post-purchase experience: support, returns, NPS — as a driver of repeats.',
    expertise: ['SLA підтримки й knowledge base', 'Обробка повернень і скарг', 'NPS і петля зворотного звʼязку'],
    expertiseEn: ['Support SLA and knowledge base', 'Handling returns and complaints', 'NPS and the feedback loop'],
    exp: 'Зростання повторних через якісний post-purchase',
    expEn: 'More repeat purchases through a strong post-purchase experience',
  },
  {
    role: 'Analytics · GEO / AI-visibility',
    owns: ['data', 'customer'],
    zone: 'AI/LLM-видимість і GEO',
    zoneEn: 'AI/LLM visibility & GEO',
    focus: 'Щоб бренд знаходили не лише в Google, а й у відповідях AI-систем.',
    focusEn: 'So the brand is found not only in Google, but in the answers of AI systems.',
    expertise: ['Entity/knowledge-архітектура й schema', 'Citation-worthy контент', 'Моніторинг присутності в LLM-відповідях'],
    expertiseEn: ['Entity/knowledge architecture and schema', 'Citation-worthy content', 'Monitoring presence in LLM answers'],
    exp: 'Побудова структурованої присутності під AI-пошук',
    expEn: 'Building a structured presence for AI search',
  },
];

/**
 * Локалізований вигляд ролі: для EN накладає *En-поля з fallback на UA.
 * Так компоненти рендерять r.role / r.zone / r.focus / r.expertise / r.exp
 * без розгалужень за мовою.
 */
export function localizeRole(r: Role, lang: 'uk' | 'en'): Role {
  if (lang !== 'en') return r;
  return {
    ...r,
    // Імʼя теж проходить оверлей: воно було єдиним полем ролі без EN-версії,
    // і на /en/people стояло кирилицею посеред англійського тексту.
    name: r.nameEn ?? r.name,
    role: r.roleEn ?? r.role,
    zone: r.zoneEn ?? r.zone,
    focus: r.focusEn ?? r.focus,
    expertise: r.expertiseEn ?? r.expertise,
    exp: r.expEn ?? r.exp,
  };
}
