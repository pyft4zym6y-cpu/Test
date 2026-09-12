/**
 * Склад глибокого аудиту — мовою клієнта.
 *
 * У auditPack.ts уже є AUDIT_BLOCKS: тринадцять доменів діагностики зі
 * зведеними перевірками. Це НАША таксономія — Business, Market, Product,
 * Website, — і вона правильна всередині, але людина, яка вибирає підрядника,
 * шукає очима інші слова: «UX/UI аудит», «контент-аудит», «аудит воронки
 * продажів». Саме їх вона й гуглить.
 *
 * Тому тут — другий зріз того самого аудиту, назвами, які клієнт упізнає.
 * Щоб два переліки не розійшлися, кожен вид прив’язаний до блоку з
 * AUDIT_BLOCKS, і auditScope.test.ts вимагає двох речей: кожен ключ існує, і
 * жоден із тринадцяти блоків не лишився без жодного виду. Інакше ми або
 * обіцяємо те, чого не робимо, або мовчки не згадуємо те, що робимо.
 */
import { AUDIT_BLOCKS } from '@/data/auditPack';

/** Двомовна пара — та сама домовленість, що в services.ts. */
export type P = [uk: string, en: string];

export type AuditKind = {
  /** Ключ блоку з AUDIT_BLOCKS — звідки цей вид бере перевірки. */
  block: string;
  name: P;
  /** Що саме дивимось. Одне речення, без методології. */
  what: P;
};

export const AUDIT_KINDS: AuditKind[] = [
  {
    block: 'website',
    name: ['Комплексний UX/UI аудит сайту', 'Full UX/UI audit of the site'],
    what: [
      'Інтерфейс на всіх ключових екранах: головна, каталог, картка товару, кошик, оформлення. Окремо — мобільна версія й доступність.',
      'The interface on every key screen: home, catalog, product page, cart, checkout. Mobile and accessibility reviewed separately.',
    ],
  },
  {
    block: 'website',
    name: ['Аудит дерева й структури сайту', 'Site tree & structure audit'],
    what: [
      'Категорії, підкатегорії, фільтри, навігація та URL: чи знаходить людина товар за два-три кроки й чи не дублюються розділи.',
      'Categories, subcategories, filters, navigation and URLs: whether a person finds the product in two or three steps and whether sections duplicate each other.',
    ],
  },
  {
    block: 'website',
    name: ['Аудит воронки продажів', 'Sales funnel audit'],
    what: [
      'Кожен крок від входу до оплати з цифрами: де саме й скільки людей ви втрачаєте і скільки це коштує на рік.',
      'Every step from entry to payment, with numbers: exactly where and how many people you lose, and what it costs per year.',
    ],
  },
  {
    block: 'customer',
    name: ['Аудит шляху клієнта (CJM)', 'Customer journey audit (CJM)'],
    what: [
      'Від першого дотику до повторної покупки: сегменти, очікування, точки тертя й місця, де клієнт іде до конкурента.',
      'From first touch to repeat purchase: segments, expectations, friction points and the places where the customer leaves for a competitor.',
    ],
  },
  {
    block: 'seo',
    name: ['Контент-аудит', 'Content audit'],
    what: [
      'Описи, фото, відео, тексти категорій і картки товарів: чи відповідають вони на питання покупця й чи достатньо їх для продажу без менеджера.',
      'Descriptions, photos, video, category copy and product cards: whether they answer the buyer’s questions and whether they sell without a salesperson.',
    ],
  },
  {
    block: 'seo',
    name: ['Первинний SEO-аудит', 'Initial SEO audit'],
    what: [
      'Технічна основа, семантика, індексація, мікророзмітка й видимість у пошуку — включно з видимістю в AI-пошуку (GEO/AEO).',
      'Technical foundation, semantics, indexing, structured data and search visibility — including visibility in AI search (GEO/AEO).',
    ],
  },
  {
    block: 'marketing',
    name: ['Маркетинговий аудит', 'Marketing audit'],
    what: [
      'Канали залучення, креативи, структура кампаній і бюджети: скільки коштує замовлення в кожному каналі й де гроші горять дарма.',
      'Acquisition channels, creatives, campaign structure and budgets: what an order costs in each channel and where the money burns for nothing.',
    ],
  },
  {
    block: 'crm',
    name: ['Аудит утримання й CRM', 'Retention & CRM audit'],
    what: [
      'Email, месенджери, push, програма лояльності й сегментація бази: скільки виторгу ви вже могли б брати з наявних клієнтів.',
      'Email, messengers, push, loyalty programme and base segmentation: how much revenue you could already be taking from existing customers.',
    ],
  },
  {
    block: 'technology',
    name: ['Технологічний аудит', 'Technology audit'],
    what: [
      'CMS, хостинг, інтеграції з CRM/ERP/складом, швидкість, Core Web Vitals і безпека: чи витримає система наступне зростання.',
      'CMS, hosting, CRM/ERP/warehouse integrations, performance, Core Web Vitals and security: whether the system will survive the next stage of growth.',
    ],
  },
  {
    block: 'analytics',
    name: ['Аудит аналітики й даних', 'Analytics & data audit'],
    what: [
      'GA4, GTM, атрибуція, наскрізна звітність і якість даних: чи можна взагалі довіряти цифрам, за якими ви ухвалюєте рішення.',
      'GA4, GTM, attribution, end-to-end reporting and data quality: whether the numbers you decide by can be trusted at all.',
    ],
  },
  {
    block: 'operations',
    name: ['Аудит операційних процесів', 'Operations audit'],
    what: [
      'Обробка замовлень, склад і залишки, закупівлі, доставка, повернення й невикуп — усе, що зʼїдає маржу вже після продажу.',
      'Order processing, warehouse and stock, purchasing, delivery, returns and refused parcels — everything that eats margin after the sale.',
    ],
  },
  {
    block: 'product',
    name: ['Аудит асортименту й ціноутворення', 'Assortment & pricing audit'],
    what: [
      'ABC/XYZ, маржинальність по категоріях, промо-економіка й мерчандайзинг: що насправді заробляє, а що лише створює оборот.',
      'ABC/XYZ, margin by category, promo economics and merchandising: what actually earns and what merely creates turnover.',
    ],
  },
  {
    block: 'business',
    name: ['Аудит комерційної моделі', 'Commercial model audit'],
    what: [
      'Юніт-економіка, P&L, каса, канали збуту й B2B/опт: на чому бізнес заробляє сьогодні і де стеля нинішньої моделі.',
      'Unit economics, P&L, cash, sales channels and B2B/wholesale: what the business earns on today and where the current model hits its ceiling.',
    ],
  },
  {
    block: 'market',
    name: ['Аудит ринку й позиціонування', 'Market & positioning audit'],
    what: [
      'Цільова аудиторія, конкуренти, ціновий коридор і бренд: чому обирають вас — і чому обирають не вас.',
      'Target audience, competitors, price corridor and brand: why they choose you — and why they choose someone else.',
    ],
  },
  {
    block: 'organization',
    name: ['Аудит команди й процесів', 'Team & process audit'],
    what: [
      'Ролі, зони відповідальності, KPI, регламенти та якість роботи підрядників: що саме тримається особисто на власнику.',
      'Roles, ownership, KPIs, playbooks and contractor quality: what exactly still rests on the owner personally.',
    ],
  },
  {
    block: 'expansion',
    name: ['Аудит потенціалу експансії', 'Expansion potential audit'],
    what: [
      'Нові ринки, маркетплейси, B2B і нові моделі продажу: де є попит, скільки коштує вхід і чи вистачить маржі.',
      'New markets, marketplaces, B2B and new sales models: where the demand is, what entry costs and whether the margin holds.',
    ],
  },
];

/** Скільки видів аудиту показуємо. Число для тексту — з переліку, не з рядка. */
export const AUDIT_KINDS_COUNT = AUDIT_KINDS.length;

/** Ключі блоків, до яких привʼязані види. Потрібні тесту й нікому більше. */
export const auditBlockKeys = () => new Set(AUDIT_BLOCKS.map((b) => b.key));
