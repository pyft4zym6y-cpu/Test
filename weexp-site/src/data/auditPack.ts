/**
 * Канонічний склад пакета глибокого аудиту — 5 ЄМКИХ ЗВІТІВ (обіцянка формату 01
 * на /pricing). ЄДИНЕ джерело правди: публічна сторінка «Склад пакета аудиту»
 * і чеклист готовності в картці клієнта (адмінка) читають саме цей перелік.
 *
 * Структура: кожен звіт — самодостатній документ зі змістом, конечною цінністю
 * і логічним завершенням. 13 спеціалізованих аудитів — ГЛАВИ Звіту 2 (кожен зі
 * стандартним каркасом: вердикт → методика → факти vs бенчмарки → знахідки з
 * доказами → рекомендації з власником → звʼязки → що міряти через 90 днів).
 *
 * Легасі-примітка: id глав a01–a19 збережені зі старого 19-артефактного канону,
 * щоб не втратити стани чеклистів у Supabase (packChecklist keyed by id).
 */
export type PackSource = 'worker' | 'admin' | 'portal';

export type PackReport = {
  id: 'r1' | 'r2' | 'r3' | 'r4' | 'r5';
  uk: string; en: string;
  descUk: string; descEn: string;
  /** Конечна цінність звіту одним реченням — «навіщо мені його відкривати». */
  valueUk: string; valueEn: string;
};

export type PackChapter = {
  id: string; report: PackReport['id'];
  uk: string; en: string;
  source: PackSource;
};

export const PACK_REPORTS: PackReport[] = [
  {
    id: 'r1', uk: 'Презентація аудиту', en: 'Audit presentation',
    descUk: 'Дека для зустрічі-читки: діагноз, докази, маршрут, гроші, строки, команда і розподіл ролей.',
    descEn: 'The readout deck: diagnosis, evidence, route, money, timeline, team and role split.',
    valueUk: 'За 40 хвилин зустрічі власник розуміє, де тече, скільки коштує і що робити.',
    valueEn: 'In a 40-minute meeting the owner understands what leaks, what it costs and what to do.',
  },
  {
    id: 'r2', uk: 'Діагностичний звіт: 13 аудитів', en: 'Diagnostic report: the 13 audits',
    descUk: 'Головний том: 13 спеціалізованих аудитів (Business → Expansion) зі спільним каркасом, CJM, зведеним реєстром знахідок, матрицею зрілості і протоколом якості.',
    descEn: 'The main volume: 13 specialised audits (Business → Expansion) on a shared skeleton, CJM, the consolidated findings registry, the maturity matrix and the QA protocol.',
    valueUk: 'Повна картина бізнесу з доказами: кожен висновок можна перевірити до джерела.',
    valueEn: 'The full picture with evidence: every conclusion traceable to its source.',
  },
  {
    id: 'r3', uk: 'Фінансовий звіт: розрив і цільова модель', en: 'Financial report: the gap & target model',
    descUk: 'Головний висновок для CEO, міст P&L від стану А до стану Б, 8 важелів із розрахунками й чутливістю, цільова модель як Definition of Done.',
    descEn: 'The CEO conclusion, the P&L bridge from state A to state B, 8 levers with calculations and sensitivity, the target model as a Definition of Done.',
    valueUk: 'Гроші розриву і вимірні пороги точки Б — мова, якою ухвалюється рішення.',
    valueEn: 'The money of the gap and measurable state-B thresholds — the language decisions are made in.',
  },
  {
    id: 'r4', uk: 'Роадмапа впровадження', en: 'Implementation roadmap',
    descUk: 'Хвилі та Гант А→Б (перша хвиля — по тижнях), беклог із власниками й ресурсною моделлю, план перших 90 днів, реєстр ризиків, лінія автономності власника.',
    descEn: 'Waves and the A→B Gantt (first wave by week), the backlog with owners and a resourcing model, the first-90-days plan, the risk register, the owner-autonomy line.',
    valueUk: 'Виконуваний маршрут: кожна задача має власника, ємність і критерій «зроблено».',
    valueEn: 'An executable route: every task has an owner, capacity and a done-criterion.',
  },
  {
    id: 'r5', uk: 'Пропозиція та передача', en: 'Proposal & handover',
    descUk: 'Комерційна пропозиція з ПОВНИМ бюджетом (включно з підрядниками), гарантійною логікою, і протокол передачі з відкликанням доступів.',
    descEn: 'The commercial proposal with the FULL budget (contractors included), the guarantee logic, and the handover protocol with access revocation.',
    valueUk: 'Чесні умови наступного кроку — і акуратне закриття, якщо кроку не буде.',
    valueEn: 'Honest terms for the next step — and a clean close-out if there is none.',
  },
];


/* ── Робочі томи пакета (посторінкові) + Гант: 5 томів + Гант ──
   scope: 'both' — входить в обидва аудити ($2,900 і $4,900);
          'dept' — лише в аудит відділу e-commerce ($4,900). */
export type PackVolume = {
  id: string; uk: string; en: string;
  descUk: string; descEn: string;
  vol: string;                 // обсяг (стор./листи)
  scope: 'both' | 'dept';
};
export const PACK_VOLUMES: PackVolume[] = [
  { id: 'tomA', uk: 'Том A · UX/UI посторінково', en: 'Volume A · Page-by-page UX/UI',
    descUk: 'Кожна сторінка комерційного шляху поблочно з оцінкою 0–5 + макети всіх 49 блоків «зараз → як треба» з дельтами; відсутні блоки відрисовані з нуля.',
    descEn: 'Every page of the commercial path block-by-block, scored 0–5, + mock-ups of all 49 blocks "now → should be" with deltas; missing blocks drawn from scratch.',
    vol: '40 стор.', scope: 'both' },
  { id: 'tomB', uk: 'Том B · Контент посторінково', en: 'Volume B · Page-by-page content',
    descUk: '5 критеріїв × усі сторінки + 6 цільових текстів-зразків «зараз → як треба», з яких працює копірайтер.',
    descEn: '5 criteria × all pages + 6 target sample texts "now → should be" a copywriter works from.',
    vol: '8 стор.', scope: 'both' },
  { id: 'tomC', uk: 'Том C · SEO і дерево сайта', en: 'Volume C · SEO & site tree',
    descUk: 'Карта індексації (реальні сторінки проти сміття), семантика кластерами, on-page по шаблонах + 6 SEO-шаблонів «зараз → як треба», перелінковка, GEO-протокол.',
    descEn: 'Indexation map (real pages vs junk), clustered semantics, on-page by template + 6 SEO templates "now → should be", internal linking, GEO protocol.',
    vol: '9 стор.', scope: 'both' },
  { id: 'tomE', uk: 'Том E · Шлях клієнта посторінково', en: 'Volume E · Customer journey',
    descUk: '15 етапів Awareness → Advocacy парами «зараз → як треба» з готовністю /10 і власниками + 2 журні-тести руками, які повторюються на контрольних точках.',
    descEn: '15 stages Awareness → Advocacy as "now → should be" pairs with /10 readiness and owners + 2 hands-on journey tests repeated at checkpoints.',
    vol: '14 стор.', scope: 'both' },
  { id: 'tomD', uk: 'Том D · Стартові шаблони', en: 'Volume D · Starter templates',
    descUk: 'Готові робочі документи для запуску: вакансія PM із процесом найму, політика знижок із заповненим розрахунком, сценарій щотижневої читки на 45 хвилин.',
    descEn: 'Ready working documents for kickoff: a PM job description with hiring process, a discount policy with a worked example, a 45-minute weekly review script.',
    vol: '5 стор.', scope: 'dept' },
  { id: 'gantt', uk: 'Гант-план (Excel)', en: 'Gantt plan (Excel)',
    descUk: 'Повноробочий інструмент, не ілюстрація: задачі з відповідальними (R/A), попередниками, тижневою сіткою і DoD + листи «Легенда», «Підрядники», «Ресурси».',
    descEn: 'A fully working tool, not an illustration: tasks with owners (R/A), predecessors, a weekly grid and DoD + "Legend", "Contractors", "Resources" sheets.',
    vol: '4 листи', scope: 'both' },
];
/* ── 13 аудитів як ОКРЕМІ документи ────────────────────────────────────────
   Раніше вони були главами всередині діагностичного звіту. Тепер кожен —
   самостійний документ, як UX/UI, контент і SEO: свій метод, свій профільний
   набір OS-скілів у рушії (worker/src/domainSkills.ts), свій обсяг.
   `engine` — модулі рушія, які реально збирають цей аудит сьогодні;
   порожній масив означає: документ поки збирається руками аудитора. */
export type PackAudit = {
  id: string; code: string; uk: string; en: string;
  descUk: string;
  skills: string[];        // профільні OS-скіли (+ завжди data/reporting/synthesis)
  engine: string[];        // модулі worker/src, що виробляють документ
  scope: 'both' | 'dept';
};
export const PACK_AUDITS: PackAudit[] = [
  { id: 'a-business', code: 'A1', uk: 'Business-аудит', en: 'Business audit',
    descUk: 'Модель, P&L, юніт-економіка, каса: на чому бізнес заробляє і де втрачає маржу.',
    skills: ['commerce-os', 'finance-os'], engine: ['money', 'unitecon'], scope: 'both' },
  { id: 'a-market', code: 'A2', uk: 'Market-аудит', en: 'Market audit',
    descUk: 'Ринок, конкуренти, позиціонування, бренд і зовнішній інфофон.',
    skills: ['brand-os', 'identity-os'], engine: ['competitor', 'externalAudits'], scope: 'both' },
  { id: 'a-product', code: 'A3', uk: 'Product-аудит', en: 'Product audit',
    descUk: 'Асортимент, ABC/XYZ, ціноутворення, dead stock, глибина категорій.',
    skills: ['product-os', 'merchandising-os', 'pricing-os'], engine: ['pricechannel'], scope: 'both' },
  { id: 'a-customer', code: 'A4', uk: 'Customer-аудит', en: 'Customer audit',
    descUk: 'Сегменти, LTV, retention, когорти, голос клієнта і шлях до повторної покупки.',
    skills: ['retention-os', 'b2b-os'], engine: ['journey'], scope: 'both' },
  { id: 'a-website', code: 'A5', uk: 'Website-аудит', en: 'Website audit',
    descUk: 'Воронка, checkout, mobile, швидкість, доступність — де вітрина втрачає замовлення.',
    skills: ['ux-os', 'build-os'], engine: ['uxui', 'pagereport', 'prototype', 'uxflow'], scope: 'both' },
  { id: 'a-seo', code: 'A6', uk: 'SEO/GEO-аудит', en: 'SEO/GEO audit',
    descUk: 'Індексація, семантика, контент, видимість в AI-пошуку.',
    skills: ['seo-os', 'content-os'], engine: ['seoarch', 'contentaudit'], scope: 'both' },
  { id: 'a-acquisition', code: 'A7', uk: 'Acquisition-аудит', en: 'Acquisition audit',
    descUk: 'Канали, кампанії, креативи, атрибуція, маркетингові механіки.',
    skills: ['paid-os', 'marketplace-os'], engine: ['channels', 'mechanics'], scope: 'both' },
  { id: 'a-crm', code: 'A8', uk: 'CRM/Retention-аудит', en: 'CRM & retention audit',
    descUk: 'База, flows, доставленість, лояльність, реактивація.',
    skills: ['retention-os', 'content-os'], engine: [], scope: 'both' },
  { id: 'a-analytics', code: 'A9', uk: 'Analytics-аудит', en: 'Analytics audit',
    descUk: 'Якість даних, події, атрибуція, BI: чи можна взагалі вірити цифрам.',
    skills: ['data-os', 'reporting-os'], engine: [], scope: 'both' },
  { id: 'a-operations', code: 'A10', uk: 'Operations-аудит', en: 'Operations audit',
    descUk: 'Склад, закупівлі, доставка, повернення, юридичний контур.',
    skills: ['ops-os', 'legal-os'], engine: [], scope: 'dept' },
  { id: 'a-technology', code: 'A11', uk: 'Technology-аудит', en: 'Technology audit',
    descUk: 'Платформа, інтеграції, безпека, bus-factor, AI-готовність.',
    skills: ['build-os', 'ai-os'], engine: ['techaudit'], scope: 'both' },
  { id: 'a-organization', code: 'A12', uk: 'Organization-аудит', en: 'Organization audit',
    descUk: 'Команда, процеси, ритм управління, зрілість, автономність власника.',
    skills: ['people-os'], engine: ['maturity'], scope: 'dept' },
  { id: 'a-expansion', code: 'A13', uk: 'Аудит експансії', en: 'Expansion audit',
    descUk: 'Куди рости далі: нові ринки й країни, маркетплейси, B2B/опт, нові моделі продажу — попит, вартість входу, юридичний контур і те, що зламається першим.',
    skills: ['marketplace-os', 'b2b-os', 'legal-os'], engine: [], scope: 'both' },
];
/** Скільки з 13 аудитів рушій уже вміє збирати сам. */
export const AUDITS_WITH_ENGINE = PACK_AUDITS.filter((a) => a.engine.length > 0).length;

export const PACK_DOC_COUNT = PACK_REPORTS.length + PACK_VOLUMES.length + PACK_AUDITS.length; // 5 звітів + 6 томів + 13 аудитів = 24

export const PACK_CHAPTERS: PackChapter[] = [
  // ── r1 · Презентація ──
  { id: 'a04', report: 'r1', uk: 'Дека 16:9: діагноз → докази → маршрут → гроші → команда → точка Б', en: 'The 16:9 deck', source: 'worker' },
  // ── r2 · Діагностичний звіт ──
  { id: 'a01', report: 'r2', uk: 'Контекст і цілі власника (бриф ЛПР, стейкхолдери, обмеження)', en: 'Context & owner goals', source: 'portal' },
  { id: 'a02', report: 'r2', uk: 'Методика, карта даних і обмеження (що НЕ перевірялось і чому)', en: 'Method, data map & limitations', source: 'admin' },
  { id: 'a03', report: 'r2', uk: 'Baseline: знімок експрес-аудиту «як прийшли»', en: 'Baseline: express-audit snapshot', source: 'portal' },
  { id: 'd01', report: 'r2', uk: 'Business-аудит: модель, P&L, юніт-економіка, каса', en: 'Business audit', source: 'worker' },
  { id: 'd02', report: 'r2', uk: 'Market-аудит: ринок, конкуренти, позиціонування, бренд', en: 'Market audit', source: 'worker' },
  { id: 'd03', report: 'r2', uk: 'Product-аудит: асортимент, ABC/XYZ, ціни, dead stock', en: 'Product audit', source: 'worker' },
  { id: 'd04', report: 'r2', uk: 'Customer-аудит: сегменти, LTV, retention, голос клієнта', en: 'Customer audit', source: 'worker' },
  { id: 'd05', report: 'r2', uk: 'Website-аудит: воронка, checkout, mobile, швидкість, a11y', en: 'Website audit', source: 'worker' },
  { id: 'd06', report: 'r2', uk: 'SEO/GEO-аудит: індекс, контент, AI-видимість', en: 'SEO/GEO audit', source: 'worker' },
  { id: 'd07', report: 'r2', uk: 'Acquisition-аудит: канали, кампанії, креативи, атрибуція', en: 'Acquisition audit', source: 'worker' },
  { id: 'd08', report: 'r2', uk: 'CRM/Retention-аудит: база, flows, доставленість, лояльність', en: 'CRM/Retention audit', source: 'worker' },
  { id: 'd09', report: 'r2', uk: 'Analytics-аудит: якість даних, події, атрибуція, BI', en: 'Analytics audit', source: 'worker' },
  { id: 'd10', report: 'r2', uk: 'Operations-аудит: склад, закупівлі, доставка, повернення', en: 'Operations audit', source: 'worker' },
  { id: 'd11', report: 'r2', uk: 'Technology-аудит: платформа, інтеграції, безпека, bus-factor', en: 'Technology audit', source: 'worker' },
  { id: 'd12', report: 'r2', uk: 'Organization-аудит: команда, процеси, ритм, AI-зрілість', en: 'Organization audit', source: 'worker' },
  { id: 'd13', report: 'r2', uk: 'Аудит експансії: нові ринки, маркетплейси, B2B, вартість входу', en: 'Expansion audit', source: 'worker' },
  { id: 'a13', report: 'r2', uk: 'Карта шляху клієнта (CJM): етапи, розриви, моменти істини', en: 'Customer journey map', source: 'worker' },
  { id: 'a09', report: 'r2', uk: 'Матриця зрілості і Health Score: зведення 13 аудитів', en: 'Maturity matrix & Health Score', source: 'worker' },
  { id: 'a11', report: 'r2', uk: 'Зведений реєстр знахідок (ICE з розкладкою, власники)', en: 'Consolidated findings registry', source: 'worker' },
  { id: 'a14', report: 'r2', uk: 'Протокол якості аудиту (як перевірявся сам аудит)', en: 'Audit QA protocol', source: 'worker' },
  // ── r3 · Фінансовий звіт ──
  { id: 'a05', report: 'r3', uk: 'Головний висновок для CEO (3 сторінки тексту)', en: 'The CEO conclusion', source: 'worker' },
  { id: 'm01', report: 'r3', uk: 'Міст P&L: від €А до €Б по важелях і місяцях', en: 'P&L bridge A→B', source: 'worker' },
  { id: 'a10', report: 'r3', uk: '8 важелів: розрахунок, чутливість, чого в оцінці немає', en: '8 levers with sensitivity', source: 'worker' },
  { id: 'a17', report: 'r3', uk: 'Цільова модель (Definition of Done): вимірні пороги точки Б', en: 'Target model (DoD)', source: 'admin' },
  // ── r4 · Роадмапа ──
  { id: 'a15', report: 'r4', uk: 'Хвилі та Гант А→Б (хвиля 1 — по тижнях, з залежностями)', en: 'Waves & Gantt A→B', source: 'worker' },
  { id: 'a12', report: 'r4', uk: 'Беклог: задачі, власники, години, ресурсна модель без перевантажень', en: 'Backlog with resourcing', source: 'worker' },
  { id: 'a16', report: 'r4', uk: 'План перших 90 днів (3 спринти, вимірні цілі дня 90)', en: 'First-90-days plan', source: 'admin' },
  { id: 'm02', report: 'r4', uk: 'Реєстр ризиків впровадження з мітигаціями', en: 'Implementation risk register', source: 'admin' },
  { id: 'm03', report: 'r4', uk: 'Лінія автономності власника: RACI, делегування, тест відпустки', en: 'Owner-autonomy line', source: 'admin' },
  // ── r5 · Пропозиція та передача ──
  { id: 'a18', report: 'r5', uk: 'Комерційна пропозиція (формати, повний бюджет, гарантії)', en: 'Commercial proposal', source: 'worker' },
  { id: 'a19', report: 'r5', uk: 'Протокол передачі, відкликання доступів, контрольний дзвінок', en: 'Handover protocol', source: 'admin' },
];

export const chaptersOf = (r: PackReport['id']) => PACK_CHAPTERS.filter((c) => c.report === r);
export const TOTAL_CHAPTERS = PACK_CHAPTERS.length;

/** Легасі-аліас: плаский список глав (чеклист адмінки, генератори). */
export const PACK_ARTIFACTS = PACK_CHAPTERS;

/* ── Методологія: 13 аудитів E-commerce 360° · 150+ спеціалізованих перевірок ──
 * Кожен аудит — глава Звіту 2 зі СПІЛЬНИМ КАРКАСОМ із 7 секцій:
 * 1. Вердикт (рівень зрілості, висновок, топ-3 знахідки, гроші блоку)
 * 2. Методика і дані (що перевірялось, джерела, період, що НЕ перевірялось)
 * 3. Факти проти бенчмарків (таблиці метрик із джерелами порогів)
 * 4. Знахідки з доказами (кожна: доказ → розрахунок ефекту → ризик)
 * 5. Рекомендації (хвиля, власник, зусилля, метрика контролю)
 * 6. Звʼязки з іншими аудитами (що блокує / що розблоковує)
 * 7. Що міряти через 90 днів (випереджальні індикатори)
 * Внесок аудиту в гроші йде у Звіт 3 (важелі), задачі — у Звіт 4 (беклог). */
export type AuditBlock = {
  key: string; uk: string; en: string; taskUk: string; taskEn: string; checks: number;
  /** Які спеціалізовані аудити зведені під цей заголовок (№ з каталогу 150). */
  merges: string;
  /** Глава Звіту 2, де живе повний результат аудиту. */
  chapter: string;
};
export const AUDIT_BLOCKS: AuditBlock[] = [
  { key: 'business', uk: 'Business', en: 'Business', taskUk: 'Зрозуміти економіку: стратегія, бізнес-модель, P&L, юніт-економіка, каса, B2B/опт', taskEn: 'Understand the economics: strategy, business model, P&L, unit economics, cash, B2B/wholesale', checks: 14, merges: '1,2,15,16,82,83,84,110,111,112', chapter: 'd01' },
  { key: 'market', uk: 'Market', en: 'Market', taskUk: 'Зрозуміти ринок: ЦА, конкуренти, позиціонування, бренд', taskEn: 'Understand the market: audience, competitors, positioning, brand', checks: 12, merges: '3,6,7,8,143,145', chapter: 'd02' },
  { key: 'product', uk: 'Product', en: 'Product', taskUk: 'Зрозуміти товар: асортимент, ABC/XYZ, ціноутворення, мерчандайзинг', taskEn: 'Understand the product: assortment, ABC/XYZ, pricing, merchandising', checks: 13, merges: '9,10,13,14,17,18,103,104,105,122,124,125', chapter: 'd03' },
  { key: 'customer', uk: 'Customer', en: 'Customer', taskUk: 'Зрозуміти клієнта: CJM, сегменти, LTV, retention, churn', taskEn: 'Understand the customer: CJM, segments, LTV, retention, churn', checks: 13, merges: '4,5,57,58,59,134,137,138', chapter: 'd04' },
  { key: 'website', uk: 'Website', en: 'Website', taskUk: 'Підняти конверсію: UX/UI, CRO, воронка, mobile, доступність', taskEn: 'Lift conversion: UX/UI, CRO, funnel, mobile, accessibility', checks: 16, merges: '20,21,22,23,24,25,26,27,28,29,107,126,129', chapter: 'd05' },
  { key: 'seo', uk: 'SEO / GEO / AEO', en: 'SEO / GEO / AEO', taskUk: 'Підняти органічний попит: SEO, контент, видимість в AI-пошуку (LLM)', taskEn: 'Grow organic demand: SEO, content, AI-search (LLM) visibility', checks: 14, merges: '31,32,33,34,35,36,37,38,39,40', chapter: 'd06' },
  { key: 'marketing', uk: 'Acquisition', en: 'Acquisition', taskUk: 'Підняти acquisition: PPC, Meta, TikTok, Shopping, інфлюенсери, affiliate', taskEn: 'Grow acquisition: PPC, Meta, TikTok, Shopping, influencers, affiliate', checks: 15, merges: '42,43,44,45,46,48,49,50,51,109,144,146,147,148', chapter: 'd07' },
  { key: 'crm', uk: 'CRM / Retention', en: 'CRM / Retention', taskUk: 'Підняти LTV: email, push, месенджери, лояльність, автоматизація', taskEn: 'Grow LTV: email, push, messengers, loyalty, automation', checks: 14, merges: '60,61,62,63,64,65,66,67,68,69,131,139', chapter: 'd08' },
  { key: 'analytics', uk: 'Analytics', en: 'Analytics', taskUk: 'Зробити дані достовірними: GA4, GTM, атрибуція, BI, якість даних', taskEn: 'Make the data trustworthy: GA4, GTM, attribution, BI, data quality', checks: 10, merges: '53,54,55,56', chapter: 'd09' },
  { key: 'operations', uk: 'Operations', en: 'Operations', taskUk: 'Знизити операційні втрати: склад, закупівлі, fulfillment, доставка, повернення', taskEn: 'Cut operational losses: warehouse, purchasing, fulfillment, delivery, returns', checks: 13, merges: '70,72,74,75,76,78,80,81,85,136', chapter: 'd10' },
  { key: 'technology', uk: 'Technology', en: 'Technology', taskUk: 'Забезпечити масштабованість: CMS, ERP, інтеграції, швидкість, безпека', taskEn: 'Ensure scalability: CMS, ERP, integrations, performance, security', checks: 14, merges: '87,88,90,91,92,93,94,96,98,99,100,101', chapter: 'd11' },
  { key: 'organization', uk: 'Organization', en: 'Organization', taskUk: 'Зробити систему керованою: команда, процеси, KPI, підрядники, AI', taskEn: 'Make the system manageable: team, processes, KPIs, contractors, AI', checks: 12, merges: '113,114,115,117,118,119,120,121,150', chapter: 'd12' },
  // Єдиний блок, який НЕ зводить перевірки з каталогу 150: там усі 150 дивляться
  // на те, що працює сьогодні. Експансія дивиться на те, чого ще немає, тому її
  // перевірки — нові, а не перенумеровані старі.
  { key: 'expansion', uk: 'Expansion', en: 'Expansion', taskUk: 'Знайти наступний ринок: країни, маркетплейси, B2B/опт, нові моделі — попит, вартість входу, юридичний контур', taskEn: 'Find the next market: countries, marketplaces, B2B/wholesale, new models — demand, cost of entry, legal perimeter', checks: 12, merges: 'нові перевірки (не зводяться з каталогу 150)', chapter: 'd13' },
];
export const TOTAL_CHECKS = AUDIT_BLOCKS.reduce((s, b) => s + b.checks, 0);

/** Коротка назва глави за id (мапи «аудит → документ», генератори). */
export const PACK_SHORT: Record<string, string> = Object.fromEntries(
  PACK_CHAPTERS.map((c) => [c.id, c.uk.split(':')[0].replace(/ \(.*\)$/, '')]),
);
