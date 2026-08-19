// Програма «E-Commerce Director» — методологія школи Commerce Architecture.
// База: Ecommerce_Training_ByLevels_v10, розширена за рекомендаціями
// методичного аудиту: бізнес-моделі, CX, маркетингова економіка, data
// architecture, cybersecurity, pricing/merchandising/supply chain,
// GEO/AEO, а також ексклюзивні блоки Full (рівні 13–16).

export type TrackId = 'base' | 'middle' | 'advanced' | 'expert';

export interface Level {
  n: number;
  title: string;
  status: string;
  modules: number;
  questions: number;
  track: TrackId;
  summary: string;
}

export const LEVELS: Level[] = [
  {
    n: 1,
    title: 'Що таке інтернет-магазин і бізнес-модель',
    status: 'Новачок',
    modules: 9,
    questions: 105,
    track: 'base',
    summary:
      'Будова магазину і шлях покупця — плюс бізнес-модель: D2C/B2C/B2B/маркетплейс, revenue models, Business Model Canvas, TAM/SAM/SOM, omnichannel vs multichannel, базові моделі P&L.',
  },
  {
    n: 2,
    title: 'UX/UI, поведінка користувача і CX',
    status: 'Junior',
    modules: 17,
    questions: 185,
    track: 'base',
    summary:
      'Візуальна ієрархія, CRO та A/B-тести, повний цикл UX-досліджень — і окремий блок Customer Experience: CJM, Service Blueprint, NPS/CSAT/CES, post-purchase, delivery і returns experience.',
  },
  {
    n: 3,
    title: 'Воронка, аналітика і маркетингова математика',
    status: 'Junior+',
    modules: 8,
    questions: 120,
    track: 'base',
    summary:
      'Архітектура GA4 і GTM руками: event taxonomy, Data Layer, e-commerce tracking. Когорти, CAC/LTV/MER, contribution margin, моделі атрибуції, incrementality, forecasting і архітектура дашбордів.',
  },
  {
    n: 4,
    title: 'SEO, GEO/AEO і управління розробкою',
    status: 'Middle',
    modules: 13,
    questions: 155,
    track: 'base',
    summary:
      'Technical SEO: Core Web Vitals, crawl budget, faceted navigation, міжнародне SEO, structured data. Новий блок видимості в AI-пошуку: AI Overviews, ChatGPT Search, GEO/AEO, LLM citations. Плюс управління командою розробки.',
  },
  {
    n: 5,
    title: 'Технічна архітектура, дані та безпека',
    status: 'Technical Director',
    modules: 13,
    questions: 135,
    track: 'middle',
    summary:
      'Інтеграції ERP/CRM/PIM/CDP і карта вендорів — плюс Data Architecture (DWH, ETL/ELT, Single Source of Truth, event-driven, API) і Cybersecurity: PCI DSS, GDPR, fraud prevention, backup і disaster recovery.',
  },
  {
    n: 6,
    title: 'Маркетинг, трафік і бренд',
    status: 'Middle+',
    modules: 16,
    questions: 190,
    track: 'middle',
    summary:
      'Channel strategy і full-funnel маркетинг, економіка залучення: incremental CAC, marginal ROAS, media mix modeling. Креативна стратегія і система тестування креативів, UGC, інфлюенсери — і окремий блок бренду: позиціонування, brand equity, brand vs performance.',
  },
  {
    n: 7,
    title: 'CRM, CDP, утримання і LTV',
    status: 'Senior',
    modules: 10,
    questions: 115,
    track: 'middle',
    summary:
      'Архітектура CRM і CDP, Customer 360. RFM, поведінкова і предиктивна сегментація, churn prediction, Next Best Action. Тригерні сценарії, програми лояльності, підписки, win-back — з бібліотекою готових сценаріїв.',
  },
  {
    n: 8,
    title: 'Маркетплейси і міжнародна експансія',
    status: 'Senior+',
    modules: 10,
    questions: 120,
    track: 'middle',
    summary:
      'Marketplace management: P&L каналу, ранжування і реклама, специфіка Rozetka/Prom/Amazon, account health, фулфілмент і повернення. Міжнародна експансія: вибір ринку, country P&L, локалізація, VAT, локальні платежі й логістика.',
  },
  {
    n: 9,
    title: 'Фінанси, pricing, merchandising і supply chain',
    status: 'Lead',
    modules: 16,
    questions: 195,
    track: 'advanced',
    summary:
      'P&L і юніт-економіка до SKU — плюс комерційна математика: цінова стратегія, еластичність, промо-економіка, price waterfall. Category management, ABC/XYZ, GMROI. Demand forecasting, safety stock, економіка stockout і повернень.',
  },
  {
    n: 10,
    title: 'Команда, оргдизайн і управління проєктами',
    status: 'Director−',
    modules: 13,
    questions: 165,
    track: 'advanced',
    summary:
      'Організаційний дизайн e-commerce команди: структура, RACI, найм, матриця компетенцій, KPI tree, OKR, система бонусів. Управління підрядниками й агенціями, портфель проєктів, change management, Agile/Scrum.',
  },
  {
    n: 11,
    title: 'Стратегія, масштабування і директорське мислення',
    status: 'E-Commerce Director',
    modules: 18,
    questions: 190,
    track: 'advanced',
    summary:
      'Стратегічний фреймворк на 1 і 3 роки: growth strategy, експансія за ринками/категоріями/каналами, сценарне планування, антикризове управління. Інвестиційні рішення, CAPEX/OPEX, основи оцінки бізнесу та M&A, Board reporting.',
  },
  {
    n: 12,
    title: 'Консалтинг і Fractional Director',
    status: 'Незалежний експерт',
    modules: 10,
    questions: 103,
    track: 'advanced',
    summary:
      'Монетизація експертизи поза наймом: продаж консалтингу, кілька проєктів одночасно, особистий бренд, юридична і фінансова база — з пакетом шаблонів: договір, КП, звіт клієнту.',
  },

  // ---- Ексклюзивні блоки повного треку (Full) ----
  {
    n: 13,
    title: 'Product Management в e-commerce',
    status: 'Head of Product',
    modules: 10,
    questions: 110,
    track: 'expert',
    summary:
      'Product strategy, vision і roadmap. Discovery, JTBD, продуктові гіпотези та експерименти, North Star Metric, пріоритизація RICE/ICE, продуктова аналітика. Product Manager vs E-commerce Manager.',
  },
  {
    n: 14,
    title: 'Omnichannel і B2B Commerce',
    status: 'Omnichannel Lead',
    modules: 10,
    questions: 110,
    track: 'expert',
    summary:
      'Omnichannel-архітектура: єдиний клієнт, склад, ціни і лояльність; Click & Collect, Ship From Store, social і mobile commerce, omnichannel P&L. B2B: портал, дилерська мережа, customer-specific pricing, EDI, B2B-платежі.',
  },
  {
    n: 15,
    title: 'AI Commerce',
    status: 'AI-Driven Director',
    modules: 10,
    questions: 105,
    track: 'expert',
    summary:
      'AI-стратегія і оцінка зрілості, карта use-case-ів та ROI. AI-агенти й agentic commerce, AI в сервісі, мерчандайзингу, персоналізації, прогнозуванні, контенті та CRM. GEO/AEO і видимість бренду в LLM. AI governance і ризики.',
  },
  {
    n: 16,
    title: 'Capstone: побудова e-commerce бізнесу',
    status: 'Commerce Architect',
    modules: 8,
    questions: 50,
    track: 'expert',
    summary:
      'Доступний лише у Повному шляху. Фінальний проєкт замість теорії: бізнес-модель, аналіз ринку, стратегії продукту/ціни/маркетингу/CRM, P&L і фінмодель, IT- і data-архітектура, оргструктура, KPI tree, roadmap на 12 місяців і стратегія на 3 роки — із захистом перед «власником/інвестором».',
  },
];

export const TOTALS = {
  levels: LEVELS.length,
  modules: LEVELS.reduce((s, l) => s + l.modules, 0),
  questions: LEVELS.reduce((s, l) => s + l.questions, 0),
};

export const TRACKS: { id: TrackId; label: string; range: string }[] = [
  { id: 'base', label: 'Базовий блок', range: 'Рівні 1–4' },
  { id: 'middle', label: 'Середній блок', range: 'Рівні 5–8' },
  { id: 'advanced', label: 'Просунутий блок', range: 'Рівні 9–12' },
  { id: 'expert', label: 'Експертний блок', range: 'Рівні 13–16 · вершина програми' },
];
