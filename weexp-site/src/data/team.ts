import type { SystemKey } from '@/data/xray';

/**
 * Команда WEEXP структурована за системами: у кожної системи є власник.
 * Це і є доказ підходу — не «універсали», а відповідальні за конкретний контур.
 */
export type Role = {
  role: string;
  owns: SystemKey[];
  focus: string;
  expertise: string[];
  exp: string;      // досвід/факт
};

export const TEAM: Role[] = [
  {
    role: 'Founder & Architect of Commerce',
    owns: ['strategy', 'org'],
    focus: 'Стратегія, операційна модель, governance — щоб бізнес працював без героя.',
    expertise: ['Побудова e-commerce як функції бізнесу', 'Модель росту й управлінський цикл', 'Independence Score як стандарт зрілості'],
    exp: '8+ років у міжнародному e-commerce (US · EU · MENA), бренди Forbes TOP-250',
  },
  {
    role: 'Head of Commerce',
    owns: ['commercial'],
    focus: 'Прибуткова комерція: конверсія, чек, повторні, асортимент і промо за маржею.',
    expertise: ['Юніт-економіка по SKU і категоріях', 'ABC/XYZ і керування асортиментом', 'Промо-економіка й contribution margin'],
    exp: 'P&L-відповідальність за портфелі $1–10M обороту',
  },
  {
    role: 'Retention & CRM Architect',
    owns: ['customer'],
    focus: 'Перетворення трафіку на клієнтів, а клієнтів — на LTV.',
    expertise: ['RFM і lifecycle-сегментація', 'Win-back, abandoned cart, post-purchase', 'Єдиний профіль клієнта, персоналізація'],
    exp: 'Retention-програми з підйомом повторних покупок ×2–4',
  },
  {
    role: 'CRO / UX Lead',
    owns: ['experience'],
    focus: 'Робочий шлях клієнта: каталог, картка, checkout, mobile.',
    expertise: ['CRO-процес і A/B-тестування', 'Карта точок втрати користувачів', 'UX за даними, а не за смаком'],
    exp: 'Конверсії в топ-1% сегмента (до 4,2% при нормі 0,7–1,5%)',
  },
  {
    role: 'Operations & Fulfillment Lead',
    owns: ['operations'],
    focus: 'Продаж, який реально виконується: від кошика до повернення.',
    expertise: ['SLA обробки, викуп, доставка, повернення', 'Резервування і синхронізація залишків', 'Контроль вартості fulfillment'],
    exp: 'Зниження невикупів і втрат на стиках складу й логістики',
  },
  {
    role: 'Data & BI Engineer',
    owns: ['data'],
    focus: 'Одне джерело правди: наскрізна аналітика і P&L по e-commerce.',
    expertise: ['GA4, наскрізна аналітика, attribution', 'Unit economics, cohort, contribution margin', 'Дашборди й автоматичні алерти'],
    exp: 'Побудова керованого P&L і достовірних даних із CRM/ERP/GA4',
  },
  {
    role: 'Integration Engineer',
    owns: ['data', 'operations'],
    focus: 'Цифрова інфраструктура: CMS / CRM / ERP / WMS / маркетинг як єдиний контур.',
    expertise: ['Інтеграції та master data', 'Моніторинг API, узгодженість цін і залишків', 'Зняття технічного боргу'],
    exp: 'Інтеграційні контури під асортимент до 250K SKU',
  },
  {
    role: 'Demand & SEO Strategist',
    owns: ['customer', 'strategy'],
    focus: 'Стабільне залучення: органіка й бренд замість залежності від платного.',
    expertise: ['SEO, привʼязаний до комерції', 'Контент, що продає', 'Керування CAC і міксом каналів'],
    exp: 'Частка безкоштовного трафіку до 45%, зниження CAC',
  },
  {
    role: 'Delivery Lead / PM',
    owns: ['org'],
    focus: 'Виконання хвилями під Definition of Done, без firefighting.',
    expertise: ['Roadmap і пріоритизація impact/effort', 'SOP, база знань, RACI', 'Post-mortem і hypothesis-driven підхід'],
    exp: 'Програми побудови систем 6–12 місяців із передачею клієнту',
  },
];
