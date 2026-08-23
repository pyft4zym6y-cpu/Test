/**
 * Канонічний склад пакета глибокого аудиту — «19 артефактів» (обіцянка формату 01
 * на /pricing). ЄДИНЕ джерело правди: публічна сторінка «Склад пакета аудиту»
 * і чеклист готовності в картці клієнта (адмінка) читають саме цей перелік.
 * source: worker — генерує рушій Commerce OS (pack.zip); admin — генерується/
 * редагується в адмінці; portal — збирається з даних кабінету клієнта.
 */
export type PackPhase = 'discovery' | 'core' | 'evidence' | 'plan';
export type PackSource = 'worker' | 'admin' | 'portal';
export type PackArtifact = {
  id: string;
  phase: PackPhase;
  uk: string; en: string;
  descUk: string; descEn: string;
  source: PackSource;
};

export const PACK_PHASES: { key: PackPhase; uk: string; en: string }[] = [
  { key: 'discovery', uk: 'Вхід (Discovery)', en: 'Intake (Discovery)' },
  { key: 'core', uk: 'Ядро аудиту', en: 'Audit core' },
  { key: 'evidence', uk: 'Доказова база', en: 'Evidence base' },
  { key: 'plan', uk: 'План і закриття', en: 'Plan & handover' },
];

export const PACK_ARTIFACTS: PackArtifact[] = [
  // ── Вхід (Discovery) ──
  { id: 'a01', phase: 'discovery', uk: 'Бриф ЛПР і профіль компанії', en: 'Decision-maker brief & company profile', descUk: 'Хто ви, як влаштований бізнес, цілі на 6–12 міс — база для всіх висновків.', descEn: 'Who you are, how the business works, 6–12 month goals — the base for every conclusion.', source: 'portal' },
  { id: 'a02', phase: 'discovery', uk: 'Карта доступів і даних', en: 'Access & data map', descUk: 'Які системи відкриті для аудиту, що передано, чого бракує — прозорий периметр.', descEn: 'Which systems are open to the audit, what was handed over, what is missing.', source: 'admin' },
  { id: 'a03', phase: 'discovery', uk: 'Знімок експрес-аудиту (baseline)', en: 'Express-audit snapshot (baseline)', descUk: 'Точка «як прийшли»: витік, Business Health, ключова проблема — для чесного «до/після».', descEn: 'The starting point: leak, Business Health, key problem — for an honest before/after.', source: 'portal' },
  // ── Ядро аудиту ──
  { id: 'a04', phase: 'core', uk: 'Презентація аудиту', en: 'Audit presentation', descUk: 'Флагманський документ: головні висновки, цифри та рішення на одній осі.', descEn: 'The flagship document: key conclusions, numbers and decisions on one axis.', source: 'worker' },
  { id: 'a05', phase: 'core', uk: 'Головний висновок (executive summary)', en: 'Main conclusion (executive summary)', descUk: 'Вердикт по бізнесу людською мовою: що працює, що тече, що робити першим.', descEn: 'The verdict in plain language: what works, what leaks, what to fix first.', source: 'worker' },
  { id: 'a06', phase: 'core', uk: 'Досвід і конверсія', en: 'Experience & conversion', descUk: 'UX/UI, картка, кошик, checkout, mobile, CRO — де саме губляться покупці.', descEn: 'UX/UI, product page, cart, checkout, mobile, CRO — where buyers are lost.', source: 'worker' },
  { id: 'a07', phase: 'core', uk: 'Трафік і видимість', en: 'Traffic & visibility', descUk: 'SEO, контент, канали залучення: звідки приходять і чому не приходять більше.', descEn: 'SEO, content, acquisition channels: where traffic comes from and why not more.', source: 'worker' },
  { id: 'a08', phase: 'core', uk: 'Бізнес і ринок', en: 'Business & market', descUk: 'Конкурентне поле, ціноутворення, юніт-економіка — позиція в грошах.', descEn: 'Competitive field, pricing, unit economics — your position in money.', source: 'worker' },
  { id: 'a09', phase: 'core', uk: 'Health Score і матриця зрілості', en: 'Health Score & maturity matrix', descUk: 'Зрілість систем бізнесу за доменами: L1 Хаос → L5 Оптимізовано.', descEn: 'Business systems maturity by domain: L1 Chaos → L5 Optimized.', source: 'worker' },
  { id: 'a10', phase: 'core', uk: 'Розрив у грошах: 8 важелів + прогноз 12 міс', en: 'The money gap: 8 levers + 12-month forecast', descUk: 'Причинна карта втрат, baseline і консервативний прогноз відновлення.', descEn: 'Causal loss map, baseline and a conservative recovery forecast.', source: 'worker' },
  // ── Доказова база ──
  { id: 'a11', phase: 'evidence', uk: 'Реєстр знахідок з пріоритетами', en: 'Findings registry with priorities', descUk: 'Кожна знахідка: доказ, впевненість, пріоритет P0–P2 — жодних «здається».', descEn: 'Every finding: evidence, confidence, P0–P2 priority — no hand-waving.', source: 'worker' },
  { id: 'a12', phase: 'evidence', uk: 'Зведений беклог робіт', en: 'Consolidated work backlog', descUk: 'Знахідки, згорнуті в конкретні роботи з оцінкою ефекту.', descEn: 'Findings rolled into concrete work items with impact estimates.', source: 'worker' },
  { id: 'a13', phase: 'evidence', uk: 'Карта шляху клієнта (CJM)', en: 'Customer journey map (CJM)', descUk: 'Реальні сценарії покупця, перевірені кроки, точки відвалу.', descEn: 'Real buyer scenarios, tested steps, drop-off points.', source: 'worker' },
  { id: 'a14', phase: 'evidence', uk: 'Протокол якості (QA аудиту)', en: 'Quality protocol (audit QA)', descUk: 'Аудит перевіряє сам себе: узгодженість висновків, покриття доказами.', descEn: 'The audit checks itself: consistency of conclusions, evidence coverage.', source: 'worker' },
  // ── План і закриття ──
  { id: 'a15', phase: 'plan', uk: 'Роадмапа хвилями', en: 'Roadmap in waves', descUk: 'Пріоритети, бюджет, строки, команда — що робити, у якому порядку й чому.', descEn: 'Priorities, budget, timelines, team — what to do, in what order and why.', source: 'worker' },
  { id: 'a16', phase: 'plan', uk: 'План перших 90 днів', en: 'First-90-days plan', descUk: 'Швидкі перемоги з P0-знахідок: що дасть ефект ще до великої трансформації.', descEn: 'Quick wins from P0 findings: impact before the big transformation.', source: 'admin' },
  { id: 'a17', phase: 'plan', uk: 'Цільова модель (Definition of Done)', en: 'Target model (Definition of Done)', descUk: 'Куди мають прийти метрики: еталони ніші як вимірна мета, а не побажання.', descEn: 'Where the metrics must land: niche benchmarks as a measurable goal.', source: 'admin' },
  { id: 'a18', phase: 'plan', uk: 'Комерційна пропозиція на впровадження', en: 'Implementation proposal', descUk: 'Формат 02/03 під вашу ситуацію; вартість аудиту зараховується у впровадження.', descEn: 'Format 02/03 for your case; the audit fee is credited toward implementation.', source: 'worker' },
  { id: 'a19', phase: 'plan', uk: 'Протокол передачі', en: 'Handover protocol', descUk: 'Що передано, 4 години розборів, дата контрольного дзвінка через 30 днів.', descEn: 'What was handed over, 4 hours of walkthroughs, the 30-day check-in date.', source: 'admin' },
];

export const packByPhase = (p: PackPhase) => PACK_ARTIFACTS.filter((a) => a.phase === p);
