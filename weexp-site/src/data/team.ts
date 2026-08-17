import type { SystemKey } from '@/data/xray';

/**
 * Команда WEEXP структурована за системами: у кожної зони є власник.
 * Логіка ролі: бізнес-зона → що закриває → основні функції → результат.
 * Не «універсали», а відповідальні за конкретний контур Commerce OS.
 */
export type Role = {
  role: string;
  owns: SystemKey[];   // системи-власності (чипи)
  zone: string;        // бізнес-зона, яку закриває роль
  focus: string;
  expertise: string[]; // основні функції
  exp: string;         // досвід / факт-результат
};

export const TEAM: Role[] = [
  {
    role: 'Founder & Architect of Commerce',
    owns: ['strategy', 'org'],
    zone: 'Стратегія та операційна модель',
    focus: 'Стратегія, операційна модель, governance — щоб бізнес працював без героя.',
    expertise: ['Побудова e-commerce як функції бізнесу', 'Модель росту й управлінський цикл', 'Independence Score як стандарт зрілості'],
    exp: '8+ років у міжнародному e-commerce (US · EU · MENA), бренди Forbes TOP-250',
  },
  {
    role: 'Head of Commerce',
    owns: ['commercial'],
    zone: 'Комерційна ефективність',
    focus: 'Прибуткова комерція: конверсія, чек, повторні, асортимент і промо за маржею.',
    expertise: ['Юніт-економіка по SKU і категоріях', 'ABC/XYZ і керування асортиментом', 'Промо-економіка й contribution margin'],
    exp: 'P&L-відповідальність за портфелі $1–10M обороту',
  },
  {
    role: 'Retention & CRM Architect',
    owns: ['customer'],
    zone: 'Утримання і CRM',
    focus: 'Перетворення трафіку на клієнтів, а клієнтів — на LTV.',
    expertise: ['RFM і lifecycle-сегментація', 'Win-back, abandoned cart, post-purchase', 'Єдиний профіль клієнта, персоналізація'],
    exp: 'Retention-програми з підйомом повторних покупок ×2–4',
  },
  {
    role: 'CRO / UX Lead',
    owns: ['experience'],
    zone: 'Досвід і конверсія',
    focus: 'Робочий шлях клієнта: каталог, картка, checkout, mobile.',
    expertise: ['CRO-процес і A/B-тестування', 'Карта точок втрати користувачів', 'UX за даними, а не за смаком'],
    exp: 'Конверсії в топ-1% сегмента (до 4,2% при нормі 0,7–1,5%)',
  },
  {
    role: 'Operations & Fulfillment Lead',
    owns: ['operations'],
    zone: 'Операції та fulfillment',
    focus: 'Продаж, який реально виконується: від кошика до повернення.',
    expertise: ['SLA обробки, викуп, доставка, повернення', 'Резервування і синхронізація залишків', 'Контроль вартості fulfillment'],
    exp: 'Зниження невикупів і втрат на стиках складу й логістики',
  },
  {
    role: 'Data & BI Engineer',
    owns: ['data'],
    zone: 'Дані та аналітика',
    focus: 'Одне джерело правди: наскрізна аналітика і P&L по e-commerce.',
    expertise: ['GA4, наскрізна аналітика, attribution', 'Unit economics, cohort, contribution margin', 'Дашборди й автоматичні алерти'],
    exp: 'Побудова керованого P&L і достовірних даних із CRM/ERP/GA4',
  },
  {
    role: 'Integration Engineer',
    owns: ['data', 'operations'],
    zone: 'Технології та інтеграції',
    focus: 'Цифрова інфраструктура: CMS / CRM / ERP / WMS / маркетинг як єдиний контур.',
    expertise: ['Інтеграції та master data', 'Моніторинг API, узгодженість цін і залишків', 'Зняття технічного боргу'],
    exp: 'Інтеграційні контури під асортимент до 250K SKU',
  },
  {
    role: 'Demand & SEO Strategist',
    owns: ['customer', 'strategy'],
    zone: 'Органічний попит і SEO',
    focus: 'Стабільне залучення: органіка й бренд замість залежності від платного.',
    expertise: ['Technical + content SEO, привʼязаний до комерції', 'International SEO', 'Керування CAC і міксом каналів'],
    exp: 'Частка безкоштовного трафіку до 45%, зниження CAC',
  },
  {
    role: 'Delivery Lead / PM',
    owns: ['org'],
    zone: 'Виконання і governance',
    focus: 'Виконання хвилями під Definition of Done, без firefighting.',
    expertise: ['Roadmap і пріоритизація impact/effort', 'SOP, база знань, RACI', 'Post-mortem і hypothesis-driven підхід'],
    exp: 'Програми побудови систем 6–12 місяців із передачею клієнту',
  },

  /* ── Розширення ростера: ширші зони Commerce OS ── */
  {
    role: 'Paid & Performance Lead',
    owns: ['customer'],
    zone: 'Платний трафік і performance',
    focus: 'Керований платний ріст: не «залити бюджет», а керувати CAC/ROAS за маржею.',
    expertise: ['Meta/Google/TikTok, структура акаунтів', 'MER, ROAS-цілі, incrementality', 'Креативні цикли й аудиторії'],
    exp: 'Зниження CAC і масштабування при утриманні contribution margin',
  },
  {
    role: 'Marketplace & Expansion Lead',
    owns: ['expansion'],
    zone: 'Маркетплейси й вихід на ринки',
    focus: 'Вихід на ЄС/США як окремий контур: Allegro, Amazon, eBay, локальні майданчики.',
    expertise: ['Market selection і юніт-економіка ринку', 'Лістинги, контент, buy-box', 'Логістика й локалізація під ринок'],
    exp: 'Системний запуск на кількох ринках із нуля',
  },
  {
    role: 'Content & Storytelling Lead',
    owns: ['customer', 'experience'],
    zone: 'Контент і сторітелінг',
    focus: 'Контент, що продає й будує довіру — на сайті, у картці, у каналах.',
    expertise: ['Контент-архітектура під шлях клієнта', 'Product storytelling і UGC', 'Локалізація під ринки'],
    exp: 'Контент, привʼязаний до конверсії, а не до «охоплень»',
  },
  {
    role: 'Brand & Creative Director',
    owns: ['strategy', 'customer'],
    zone: 'Бренд і креатив',
    focus: 'Впізнаваність і сенс: чому бренд обирають, а не лише «дешевше».',
    expertise: ['Позиціонування й tone of voice', 'Візуальна система й креатив-продакшн', 'Бренд-метрики й consistency'],
    exp: 'Побудова premium-сприйняття для D2C-брендів',
  },
  {
    role: 'Pricing & Margin Analyst',
    owns: ['commercial'],
    zone: 'Ціноутворення й маржа',
    focus: 'Ціна як важіль прибутку: правила, еластичність, промо-дисципліна.',
    expertise: ['Цінові правила й коридори', 'Еластичність і конкурентний моніторинг', 'Промо-економіка й markdown-контроль'],
    exp: 'Ріст маржі без втрати обсягу через дисципліну цін',
  },
  {
    role: 'Merchandising Lead',
    owns: ['experience', 'commercial'],
    zone: 'Мерчандайзинг і викладка',
    focus: 'Правильний товар — на правильному місці вітрини у правильний момент.',
    expertise: ['Категорійна викладка й пошук', 'Cross/upsell і бандли', 'Керування асортиментною матрицею'],
    exp: 'Ріст AOV і глибини кошика через мерчандайзинг',
  },
  {
    role: 'Finance / Unit-Economics Partner',
    owns: ['data', 'commercial'],
    zone: 'Фінанси й юніт-економіка',
    focus: 'Рішення за P&L, а не за оборотом: контрибуція, кеш-цикл, окупність.',
    expertise: ['P&L e-commerce і contribution margin', 'Cash conversion cycle', 'Оцінка окупності ініціатив'],
    exp: 'Переведення бізнесу з «обороту» на кероване прибуткове зростання',
  },
  {
    role: 'Legal & Compliance (Markets)',
    owns: ['expansion', 'org'],
    zone: 'Юридика й комплаєнс ринків',
    focus: 'Юрконтур виходу на ринки: структура, податки, споживче право, платежі.',
    expertise: ['Юрособа, оподаткування, VAT/OSS', 'Споживче право ЄС і повернення', 'Payment та KYC-вимоги ринку'],
    exp: 'Легальний запуск на ринках ЄС без сюрпризів',
  },
  {
    role: 'Customer Support & Success Lead',
    owns: ['operations', 'customer'],
    zone: 'Підтримка й customer success',
    focus: 'Досвід після покупки: підтримка, повернення, NPS — як драйвер повторних.',
    expertise: ['SLA підтримки й knowledge base', 'Обробка повернень і скарг', 'NPS і петля зворотного звʼязку'],
    exp: 'Зростання повторних через якісний post-purchase',
  },
  {
    role: 'Analytics · GEO / AI-visibility',
    owns: ['data', 'customer'],
    zone: 'AI/LLM-видимість і GEO',
    focus: 'Щоб бренд знаходили не лише в Google, а й у відповідях AI-систем.',
    expertise: ['Entity/knowledge-архітектура й schema', 'Citation-worthy контент', 'Моніторинг присутності в LLM-відповідях'],
    exp: 'Побудова структурованої присутності під AI-пошук',
  },
];
