/**
 * Канонічний склад пакета глибокого аудиту — «19 артефактів» (обіцянка формату 01
 * на /pricing). ЄДИНЕ джерело правди: публічна сторінка «Склад пакета аудиту»
 * і чеклист готовності в картці клієнта (адмінка) читають саме цей перелік.
 * source: worker — генерує рушій Commerce OS (pack.zip); admin — генерується/
 * редагується в адмінці; portal — збирається з даних кабінету клієнта.
 * Структура пакета: 5 ГОЛОВНИХ документів (Презентація · Матриця зрілості ·
 * Роадмапа · План 90 днів · Цільова модель) + 14 ДОДАТКІВ (детальні звіти
 * 12 аудитів, доказова база, сервісні документи). Клієнту передаються ВСІ 19.
 */
export type PackPhase = 'discovery' | 'core' | 'evidence' | 'plan';
export type PackSource = 'worker' | 'admin' | 'portal';
export type PackArtifact = {
  id: string;
  phase: PackPhase;
  uk: string; en: string;
  descUk: string; descEn: string;
  source: PackSource;
  /** core — 5 головних документів; annex — 14 додатків (детальні звіти аудитів + сервісні). ВСІ 19 передаються клієнту. */
  tier: 'core' | 'annex';
};

export const PACK_PHASES: { key: PackPhase; uk: string; en: string }[] = [
  { key: 'discovery', uk: 'Вхід (Discovery)', en: 'Intake (Discovery)' },
  { key: 'core', uk: 'Ядро аудиту', en: 'Audit core' },
  { key: 'evidence', uk: 'Доказова база', en: 'Evidence base' },
  { key: 'plan', uk: 'План і закриття', en: 'Plan & handover' },
];

export const PACK_ARTIFACTS: PackArtifact[] = [
  // ── Вхід (Discovery) ──
  { id: 'a01', phase: 'discovery', uk: 'Бриф ЛПР і профіль компанії', en: 'Decision-maker brief & company profile', descUk: 'Хто ви, як влаштований бізнес, цілі на 6–12 міс — база для всіх висновків.', descEn: 'Who you are, how the business works, 6–12 month goals — the base for every conclusion.', source: 'portal', tier: 'annex' },
  { id: 'a02', phase: 'discovery', uk: 'Карта доступів і даних', en: 'Access & data map', descUk: 'Які системи відкриті, що передано, чого бракує + «Обмеження та припущення»: що НЕ перевірялось і чому.', descEn: 'Which systems were open, what was handed over, what is missing + “Limitations & assumptions”: what was NOT checked and why.', source: 'admin', tier: 'annex' },
  { id: 'a03', phase: 'discovery', uk: 'Знімок експрес-аудиту (baseline)', en: 'Express-audit snapshot (baseline)', descUk: 'Точка «як прийшли»: витік, Business Health, ключова проблема — для чесного «до/після».', descEn: 'The starting point: leak, Business Health, key problem — for an honest before/after.', source: 'portal', tier: 'annex' },
  // ── Ядро аудиту ──
  { id: 'a04', phase: 'core', uk: 'Презентація аудиту (для зустрічі-читки)', en: 'Audit presentation', descUk: 'Слайди для розбору: висновки, цифри + строки, бюджет проєкту, необхідна команда (fulltime/parttime/підрядники) і розподіл — що закриваємо ми, що партнери, що ваша команда.', descEn: 'The readout deck: conclusions, numbers + timeline, project budget, required team (full-time/part-time/contractors) and the split — what we close, what partners do, what your team does.', source: 'worker', tier: 'core' },
  { id: 'a05', phase: 'core', uk: 'Головний висновок (письмове резюме)', en: 'Main conclusion (executive summary)', descUk: '2–3 сторінки тексту для CEO: що працює, що тече, що робити першим. Доповнює презентацію, не дублює її.', descEn: '2–3 pages of text for the CEO: what works, what leaks, what to fix first. Complements the deck, does not duplicate it.', source: 'worker', tier: 'annex' },
  { id: 'a06', phase: 'core', uk: 'Досвід і конверсія', en: 'Experience & conversion', descUk: 'UX/UI, картка, кошик, checkout, mobile, CRO — де саме губляться покупці.', descEn: 'UX/UI, product page, cart, checkout, mobile, CRO — where buyers are lost.', source: 'worker', tier: 'annex' },
  { id: 'a07', phase: 'core', uk: 'Трафік і видимість', en: 'Traffic & visibility', descUk: 'SEO, контент, канали залучення: звідки приходять і чому не приходять більше.', descEn: 'SEO, content, acquisition channels: where traffic comes from and why not more.', source: 'worker', tier: 'annex' },
  { id: 'a08', phase: 'core', uk: 'Бізнес і ринок', en: 'Business & market', descUk: 'Конкурентне поле, ціноутворення, юніт-економіка — позиція в грошах.', descEn: 'Competitive field, pricing, unit economics — your position in money.', source: 'worker', tier: 'annex' },
  { id: 'a09', phase: 'core', uk: 'Health Score і матриця зрілості', en: 'Health Score & maturity matrix', descUk: 'Зрілість систем бізнесу за 18 доменами: L1 Хаос → L5 Оптимізовано.', descEn: 'Business systems maturity across 18 domains: L1 Chaos → L5 Optimized.', source: 'worker', tier: 'core' },
  { id: 'a10', phase: 'core', uk: 'Розрив у грошах: 8 важелів + прогноз 12 міс', en: 'The money gap: 8 levers + 12-month forecast', descUk: 'Причинна карта втрат, baseline і консервативний прогноз відновлення.', descEn: 'Causal loss map, baseline and a conservative recovery forecast.', source: 'worker', tier: 'annex' },
  // ── Доказова база ──
  { id: 'a11', phase: 'evidence', uk: 'Реєстр знахідок з пріоритетами', en: 'Findings registry with priorities', descUk: 'Кожна знахідка: доказ, впевненість, пріоритет P0–P2 — жодних «здається».', descEn: 'Every finding: evidence, confidence, P0–P2 priority — no hand-waving.', source: 'worker', tier: 'annex' },
  { id: 'a12', phase: 'evidence', uk: 'Зведений беклог робіт', en: 'Consolidated work backlog', descUk: 'Знахідки, згорнуті в конкретні роботи з оцінкою ефекту.', descEn: 'Findings rolled into concrete work items with impact estimates.', source: 'worker', tier: 'annex' },
  { id: 'a13', phase: 'evidence', uk: 'Карта шляху клієнта (CJM)', en: 'Customer journey map (CJM)', descUk: 'Реальні сценарії покупця, перевірені кроки, точки відвалу.', descEn: 'Real buyer scenarios, tested steps, drop-off points.', source: 'worker', tier: 'annex' },
  { id: 'a14', phase: 'evidence', uk: 'Протокол якості (QA аудиту)', en: 'Quality protocol (audit QA)', descUk: 'Аудит перевіряє сам себе: узгодженість висновків, покриття доказами.', descEn: 'The audit checks itself: consistency of conclusions, evidence coverage.', source: 'worker', tier: 'annex' },
  // ── План і закриття ──
  { id: 'a15', phase: 'plan', uk: 'Роадмапа хвилями + Гант А→Б', en: 'Roadmap in waves', descUk: 'Скрупульозна дорожня карта з точки А в точку Б: кожен крок по місяцях (діаграма Ганта), бюджет, власник кожної задачі.', descEn: 'A meticulous roadmap from point A to point B: every step by month (Gantt chart), budget, an owner for every task.', source: 'worker', tier: 'core' },
  { id: 'a16', phase: 'plan', uk: 'План перших 90 днів', en: 'First-90-days plan', descUk: 'Операційна деталізація ПЕРШОЇ хвилі роадмапи: швидкі перемоги з P0-знахідок по днях 1–30/31–60/61–90.', descEn: 'The operational detail of the roadmap’s FIRST wave: quick wins from P0 findings across days 1–30/31–60/61–90.', source: 'admin', tier: 'core' },
  { id: 'a17', phase: 'plan', uk: 'Цільова модель (Definition of Done)', en: 'Target model (Definition of Done)', descUk: 'Куди мають прийти метрики: еталони ніші як вимірна мета, а не побажання.', descEn: 'Where the metrics must land: niche benchmarks as a measurable goal.', source: 'admin', tier: 'core' },
  { id: 'a18', phase: 'plan', uk: 'Комерційна пропозиція на впровадження', en: 'Implementation proposal', descUk: 'Формат 02/03 під вашу ситуацію; вартість аудиту зараховується у впровадження.', descEn: 'Format 02/03 for your case; the audit fee is credited toward implementation.', source: 'worker', tier: 'annex' },
  { id: 'a19', phase: 'plan', uk: 'Протокол передачі', en: 'Handover protocol', descUk: 'Що передано, 4 години розборів, дата контрольного дзвінка через 30 днів.', descEn: 'What was handed over, 4 hours of walkthroughs, the 30-day check-in date.', source: 'admin', tier: 'annex' },
];

export const packByPhase = (p: PackPhase) => PACK_ARTIFACTS.filter((a) => a.phase === p);

/* ── Методологія: 12 блоків E-commerce 360° · 150+ спеціалізованих перевірок ──
 * Клієнтська структура діагностики (Business → Market → Product → Customer →
 * Website → SEO/GEO → Marketing → CRM/Retention → Analytics → Operations →
 * Technology → Organization). Всередині кожного блоку — конкретні перевірки;
 * опитувальник (модулі A–P конструктора) і лінзи рушія мапляться на ці блоки. */
export type AuditBlock = {
  key: string; uk: string; en: string; taskUk: string; taskEn: string; checks: number;
  /** Які спеціалізовані аудити зведені під цей заголовок (№ з каталогу 150). */
  merges: string;
  /** У яких документах пакета живе результат цього аудиту (id артефактів). */
  docs: string[];
};
export const AUDIT_BLOCKS: AuditBlock[] = [
  { key: 'business', uk: 'Business', en: 'Business', taskUk: 'Зрозуміти економіку: стратегія, бізнес-модель, P&L, юніт-економіка, маржа', taskEn: 'Understand the economics: strategy, business model, P&L, unit economics, margin', checks: 14, merges: '1,2,15,16,82,83,84,110,111,112', docs: ['a08', 'a10'] },
  { key: 'market', uk: 'Market', en: 'Market', taskUk: 'Зрозуміти ринок: ЦА, конкуренти, позиціонування, бренд', taskEn: 'Understand the market: audience, competitors, positioning, brand', checks: 12, merges: '3,6,7,8,143,145', docs: ['a08'] },
  { key: 'product', uk: 'Product', en: 'Product', taskUk: 'Зрозуміти товар: асортимент, ABC/XYZ, ціноутворення, мерчандайзинг', taskEn: 'Understand the product: assortment, ABC/XYZ, pricing, merchandising', checks: 13, merges: '9,10,13,14,17,18,103,104,105,122,124,125', docs: ['a08'] },
  { key: 'customer', uk: 'Customer', en: 'Customer', taskUk: 'Зрозуміти клієнта: CJM, сегменти, LTV, retention, churn', taskEn: 'Understand the customer: CJM, segments, LTV, retention, churn', checks: 13, merges: '4,5,57,58,59,134,137,138', docs: ['a13', 'a06'] },
  { key: 'website', uk: 'Website', en: 'Website', taskUk: 'Підняти конверсію: UX/UI, CRO, воронка, mobile, доступність', taskEn: 'Lift conversion: UX/UI, CRO, funnel, mobile, accessibility', checks: 16, merges: '20,21,22,23,24,25,26,27,28,29,107,126,129', docs: ['a06'] },
  { key: 'seo', uk: 'SEO / GEO / AEO', en: 'SEO / GEO / AEO', taskUk: 'Підняти органічний попит: SEO, контент, видимість в AI-пошуку (LLM)', taskEn: 'Grow organic demand: SEO, content, AI-search (LLM) visibility', checks: 14, merges: '31,32,33,34,35,36,37,38,39,40', docs: ['a07'] },
  { key: 'marketing', uk: 'Marketing', en: 'Marketing', taskUk: 'Підняти acquisition: PPC, Meta, TikTok, Shopping, інфлюенсери, affiliate', taskEn: 'Grow acquisition: PPC, Meta, TikTok, Shopping, influencers, affiliate', checks: 15, merges: '42,43,44,45,46,48,49,50,51,109,144,146,147,148', docs: ['a07'] },
  { key: 'crm', uk: 'CRM / Retention', en: 'CRM / Retention', taskUk: 'Підняти LTV: email, push, месенджери, лояльність, автоматизація', taskEn: 'Grow LTV: email, push, messengers, loyalty, automation', checks: 14, merges: '60,61,62,63,64,65,66,67,68,69,131,139', docs: ['a06', 'a12'] },
  { key: 'analytics', uk: 'Analytics', en: 'Analytics', taskUk: 'Зробити дані достовірними: GA4, GTM, атрибуція, BI, якість даних', taskEn: 'Make the data trustworthy: GA4, GTM, attribution, BI, data quality', checks: 10, merges: '53,54,55,56', docs: ['a07', 'a14'] },
  { key: 'operations', uk: 'Operations', en: 'Operations', taskUk: 'Знизити операційні втрати: склад, закупівлі, fulfillment, доставка, повернення', taskEn: 'Cut operational losses: warehouse, purchasing, fulfillment, delivery, returns', checks: 13, merges: '70,72,74,75,76,78,80,81,85,136', docs: ['a08', 'a12'] },
  { key: 'technology', uk: 'Technology', en: 'Technology', taskUk: 'Забезпечити масштабованість: CMS, ERP, інтеграції, швидкість, безпека', taskEn: 'Ensure scalability: CMS, ERP, integrations, performance, security', checks: 14, merges: '87,88,90,91,92,93,94,96,98,99,100,101', docs: ['a06'] },
  { key: 'organization', uk: 'Organization', en: 'Organization', taskUk: 'Зробити систему керованою: команда, процеси, KPI, підрядники, AI', taskEn: 'Make the system manageable: team, processes, KPIs, contractors, AI', checks: 12, merges: '113,114,115,117,118,119,120,121,150', docs: ['a09', 'a15'] },
];
export const TOTAL_CHECKS = AUDIT_BLOCKS.reduce((s, b) => s + b.checks, 0);

/** Коротка назва документа пакета за id (для мапи «аудит → документ»). */
export const PACK_SHORT: Record<string, string> = Object.fromEntries(
  PACK_ARTIFACTS.map((a) => [a.id, a.uk.replace(/ \(.*\)$/, '')]),
);
