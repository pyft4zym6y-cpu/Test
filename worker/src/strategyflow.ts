/**
 * STRATEGIC AUDIT — верхньорівневий аудит усього digital/e-commerce проєкту.
 * Відповідає не «чи добре зроблено сайт», а «чи правильно сайт СПРОЄКТОВАНО як
 * інструмент бізнесу»: чи робить сайт саме те, що бізнесу потрібно для зростання
 * виручки, прибутку, бази й бренду. Іде ПЕРШИМ — його висновки стають входом для
 * UX/UI, Content, SEO, GEO/AEO, CRO.
 *
 * Два чесні шари:
 *  1) Вимірюване з сайту (детерміновано): роль сайту, позиціонування, value
 *     proposition, claim→proof, сегментні сценарії, довіра, retention-механіки,
 *     фічі, масштабованість — зі структури й блоків обходу + реконструкції бізнесу
 *     (buildIntelligence).
 *  2) Вимірюване лише з БІЗНЕС-КОНТЕКСТУ (позначено «н/д»): unit-економіка
 *     (AOV/CAC/LTV/маржа), бізнес-цілі, KPI-факт, частка marketplace, дані-стратегія,
 *     обсяг ринку. Не вигадуємо — це вхід із брифу/інтейку.
 */
import type { AuditDataset } from './report.js';
import type { PageKind } from './crawl.js';
import { buildIntelligence } from './intelligence.js';
import { buildMaturity } from './maturity.js';
import { buildSiteAudit, type BlockState } from './pagereport.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type StratLayer = { id: string; title: string; principle: string; state: string };
export type HealthZone = { key: string; label: string; score: number; note: string; measured: boolean };
export type StratScoreZone = { key: string; label: string; score: number; measured: boolean };
export type RoleRow = { role: string; fits: boolean; note: string };
export type ClaimProof = { claim: string; declared: boolean; proven: boolean; note: string };
export type SegmentRow = { segment: string; scenario: string; supported: boolean; note: string };
export type ObjectionRow = { objection: string; closedWhere: string; ok: boolean };
export type FeatureRow = { feature: string; present: boolean; decision: 'Keep' | 'Improve' | 'Create'; value: string };
export type DiffRow = { factor: string; ours: 'сильно' | 'середньо' | 'слабко'; note: string };
export type PageStrat = { page: string; url: string; fn: string; delivers: boolean; note: string };
export type StratBlockCard = {
  page: string; pageUrl: string; key: string; name: string;
  businessPurpose: string; customerPurpose: string; now: string; problem: string; should: string;
  strategicValue: number; businessImpact: string; priority: Priority; recommendation: string;
};
export type RiskRow = { risk: string; severity: Priority; note: string };
export type OppRow = { title: string; chain: string; priority: Priority };
export type StratArtifact = { n: number; name: string; source: 'сайт' | 'бізнес-контекст' };

export type StrategyFlowReport = {
  client: string; takenAt: string; businessType: string; maturityLevel: number; maturityName: string;
  spine: StratLayer[];
  health: { zones: HealthZone[]; overall: number };
  score: { zones: StratScoreZone[]; overall: number };
  roles: RoleRow[];
  positioning: { part: string; present: boolean; note: string }[];
  claims: ClaimProof[];
  segments: SegmentRow[];
  objections: ObjectionRow[];
  features: FeatureRow[];
  differentiation: DiffRow[];
  pages: PageStrat[];
  blockCards: StratBlockCard[];
  risks: RiskRow[];
  opportunities: OppRow[];
  roadmap: { phase: string; items: string[] }[];
  artifacts: StratArtifact[];
  contextNote: string;
};

const KIND_LABEL: Record<PageKind, string> = { home: 'Головна', plp: 'Категорія', pdp: 'Картка товару', cart: 'Кошик', checkout: 'Оформлення', content: 'Стаття', faq: 'FAQ', other: 'Службова' };
const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
const shortUrl = (u: string) => { try { const x = new URL(u); return x.pathname === '/' ? '/' : x.pathname; } catch { return u; } };

/* ── Стратегічна анатомія блоку: бізнес-ціль + як має бути + бізнес-вплив ── */
type BTpl = { biz: string; cust: string; should: string; impact: string };
const B_TPL: Record<string, BTpl> = {
  hero: { biz: 'Позиціонування і перший контакт з оффером', cust: 'Зрозуміти за 5 секунд «куди я потрапив»', should: 'Один головний оффер + вигода + первинний CTA у каталог; не карусель конкурентних банерів.', impact: 'Менше відмов на вході → більше візитів у каталог' },
  usp_bar: { biz: 'Диференціація: причина купувати саме тут', cust: 'Зрозуміти «чому ви, а не конкурент»', should: '4 конкретні переваги з цифрами (доставка/гарантія/виробництво/повернення), не «якість і сервіс».', impact: 'Вища диференціація → нижча чутливість до ціни' },
  trust: { biz: 'Зняття ризику покупки = вища конверсія й LTV', cust: 'Впевненість, що платити безпечно', should: 'Іконки-гарантії → картки з конкретикою й посиланнями + міні-відгуки з переходом у товар.', impact: 'Менше відмов на оплаті → пряме зростання виручки' },
  reviews: { biz: 'Соц. доказ + комерційний перехід у товар', cust: 'Підтвердження від інших покупців', should: 'Відгуки з фото/іменами + КАРТКА товару всередині відгуку — соц. доказ перестає бути «тупиком».', impact: 'Соц. доказ → перехід у товар → вища конверсія' },
  faq: { biz: 'Зняття заперечень до звернення в підтримку + AEO', cust: 'Відповідь на питання вибору', should: 'Реальні decision-питання, прямі відповіді, тематичні виходи в каталог; FAQPage-розмітка.', impact: 'Менше навантаження на підтримку → нижчі витрати; +органіка' },
  related: { biz: 'Зростання середнього чека (AOV) і глибини', cust: 'Альтернатива й доповнення до вибору', should: '«Інші кольори» / «з цим беруть» / «схожі» — три різні сценарії, а не одна карусель.', impact: 'Вищий AOV → більше виручки з того ж трафіку' },
  newsletter: { biz: 'Захоплення контакту → retention-контур', cust: 'Зрозуміла причина лишити контакт', should: 'Захоплення контакту з цінністю (знижка/гайд), єдині умови; вхід у CRM/email.', impact: 'Первинна база для повторних продажів → LTV' },
  category_description: { biz: 'Органічний трафік + пояснення вибору', cust: 'Як обрати в цій категорії', should: 'Короткий корисний вступ + перелінковка; збирає середньо-/низькочастотний попит.', impact: 'Нижча залежність від платного трафіку (CAC)' },
  footer_contacts: { biz: 'Довіра до продавця + правова база', cust: 'Перевірити «хто продавець»', should: 'Повні реквізити, контакти, правові сторінки, оплата/доставка.', impact: 'Довіра до бренду + зняття юридичних ризиків' },
  description: { biz: 'Інформаційний приріст → рішення без менеджера', cust: 'Зрозуміти, чи підійде', should: 'Факти виробника: процес, сировина, сценарії, цифри — не текст постачальника.', impact: 'Рішення без звернень → нижчі витрати, вища конверсія' },
};
const STRAT_BLOCKS = new Set(Object.keys(B_TPL));
const priFor = (state: BlockState, weight: string): Priority => {
  const bad = state === 'gap' || state === 'weak';
  const r = bad ? (weight === 'core' ? 0 : weight === 'important' ? 1 : 2) : (weight === 'core' ? 1 : weight === 'important' ? 2 : 3);
  return (['P0', 'P1', 'P2', 'P3'] as const)[r];
};

export function buildStrategyFlow(ds: AuditDataset): StrategyFlowReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const ci = buildIntelligence(ds);
  const maturity = buildMaturity(ds);
  const site = buildSiteAudit(ds);
  const pages = ds.client.pages.filter((p) => !p.error && p.ux);
  const links = ds.client.links ?? [];
  const lpath = (h: string) => { try { return new URL(h).pathname.toLowerCase(); } catch { return ''; } };
  const hasLink = (re: RegExp) => links.some((h) => re.test(lpath(h)));
  const anyBlock = new Set<string>();
  for (const p of pages) for (const [k, v] of Object.entries(p.ux!.blocks ?? {})) if (v) anyBlock.add(k);
  const has = (...k: string[]) => k.some((x) => anyBlock.has(x));
  const kinds = new Set(pages.map((p) => p.kind));
  const analytics = !!(ci.config.analytics && ci.config.analytics !== '—');
  const langs = ci.config.langs ?? [];

  /* ── ST4 · Роль сайту ── */
  const roles: RoleRow[] = [
    { role: 'Основний канал продажу', fits: kinds.has('pdp') && kinds.has('checkout'), note: kinds.has('checkout') ? 'є повний шлях покупки на сайті' : 'немає повного checkout — можливо, продажі йдуть в інші канали' },
    { role: 'Каталог / вітрина', fits: kinds.has('plp') && kinds.has('pdp'), note: 'категорії й картки товару присутні' },
    { role: 'Бренд-платформа', fits: has('hero', 'usp_bar') && kinds.has('content'), note: has('usp_bar') ? 'є оффер і УТП' : 'слабкі бренд-сигнали' },
    { role: 'Retention-платформа', fits: hasLink(/account|cabinet|lk|loyalty|bonus/) || has('newsletter'), note: hasLink(/account|loyalty/) ? 'є кабінет/лояльність' : 'немає retention-контуру (кабінет/лояльність)' },
    { role: 'Інформаційний ресурс / авторитет', fits: kinds.has('content'), note: kinds.has('content') ? 'є інфо-контент' : 'немає інфо-шару' },
  ];

  /* ── ST6 · Positioning ── */
  const positioning = [
    { part: 'WHO — хто ми', present: has('hero', 'footer_contacts'), note: has('footer_contacts') ? 'реквізити/бренд є' : 'сутність компанії нечітка' },
    { part: 'FOR WHOM — для кого', present: has('usp_bar') || kinds.has('content'), note: 'аудиторія рідко явно названа — перевірити на головній' },
    { part: 'WHAT — що продаємо', present: kinds.has('plp') || kinds.has('pdp'), note: 'каталог визначає предмет' },
    { part: 'WHY US — чому ми', present: has('usp_bar'), note: has('usp_bar') ? 'є блок переваг' : 'немає явного «чому ми»' },
    { part: 'PROOF — доказ', present: has('trust', 'reviews'), note: has('trust', 'reviews') ? 'є довіра/відгуки' : 'бракує доказів' },
  ];
  const posScore = positioning.filter((p) => p.present).length / positioning.length;

  /* ── ST8 · USP claim → proof ── */
  const claims: ClaimProof[] = [
    { claim: 'Швидка доставка', declared: has('usp_bar', 'delivery'), proven: has('delivery') || hasLink(/dostavka|delivery/), note: has('delivery') ? 'умови доставки є — перевірити конкретику (терміни/служби)' : 'декларація без сторінки-доказу' },
    { claim: 'Гарантія / повернення', declared: has('trust', 'usp_bar'), proven: hasLink(/garant|vozvrat|return|obmin/), note: hasLink(/garant|return/) ? 'сторінка гарантії/повернення є' : 'немає сторінки-доказу гарантії' },
    { claim: 'Оригінальність / якість', declared: has('usp_bar', 'trust'), proven: has('specifications') || hasLink(/sertif|certif|brand/), note: 'потрібні сертифікати/бренди як доказ' },
    { claim: 'Безпечна оплата', declared: has('trust'), proven: has('payment') || hasLink(/oplata|payment/), note: has('payment') ? 'способи оплати видно' : 'платіжні сигнали слабкі' },
  ];

  /* ── ST9/10 · Сегментні сценарії ── */
  const segments: SegmentRow[] = [
    { segment: 'Купити для себе', scenario: 'основний B2C-шлях', supported: kinds.has('pdp'), note: 'базовий шлях покупки' },
    { segment: 'Купити подарунок', scenario: 'подарунковий сценарій', supported: hasLink(/podar|gift|present/), note: hasLink(/gift|podar/) ? 'є подарунковий розділ' : 'немає подарункового сценарію/підбірок' },
    { segment: 'Опт / B2B', scenario: 'оптова закупівля', supported: hasLink(/opt|b2b|wholesale|korp|horeca/), note: hasLink(/opt|b2b/) ? 'є B2B-розділ' : 'немає B2B-сценарію (якщо релевантно)' },
    { segment: 'Повторний покупець', scenario: 'retention-шлях', supported: hasLink(/account|loyalty|bonus/) || has('newsletter'), note: hasLink(/account|loyalty/) ? 'є кабінет/лояльність' : 'немає підтримки повторної покупки' },
  ];

  /* ── ST14 · Карта заперечень ── */
  const objections: ObjectionRow[] = [
    { objection: 'Чи оригінальний товар?', closedWhere: 'блок довіри / сертифікати / бренд', ok: has('trust') || has('specifications') },
    { objection: 'Що з доставкою і термінами?', closedWhere: 'блок доставки / сторінка доставки', ok: has('delivery') || hasLink(/dostavka|delivery/) },
    { objection: 'Як повернути, якщо не підійде?', closedWhere: 'гарантія/повернення', ok: hasLink(/garant|vozvrat|return/) },
    { objection: 'Чи безпечно платити?', closedWhere: 'платіжні сигнали / блок довіри', ok: has('payment', 'trust') },
    { objection: 'Чи можна довіряти магазину?', closedWhere: 'відгуки / реквізити / соц. доказ', ok: has('reviews', 'footer_contacts') },
  ];

  /* ── ST30 · Feature Audit ── */
  const feat = (name: string, present: boolean, valueIf: string): FeatureRow => ({ feature: name, present, decision: present ? 'Improve' : 'Create', value: valueIf });
  const features: FeatureRow[] = [
    feat('Особистий кабінет', hasLink(/account|cabinet|lk/), 'база retention і повторних продажів (LTV)'),
    feat('Програма лояльності', hasLink(/loyalty|bonus|cashback/), 'повторні покупки, утримання'),
    feat('Wishlist / обране', has('wishlist') || hasLink(/wishlist|favorite/), 'збереження наміру, повернення'),
    feat('Порівняння товарів', hasLink(/compare|sravnenie/), 'допомога у виборі → конверсія'),
    feat('Рекомендації / cross-sell', has('related'), 'зростання AOV'),
    feat('Підбір / калькулятор / конфігуратор', hasLink(/calc|podbor|configurat/), 'зняття складності вибору → конверсія'),
    feat('Підписка / recurring', hasLink(/subscri|podpisk/), 'передбачувана виручка'),
  ];

  /* ── ST28 · Диференціація (наш сигнал; дані конкурентів — окремо) ── */
  const sig = (b: boolean, strongExtra = false): DiffRow['ours'] => (b ? (strongExtra ? 'сильно' : 'середньо') : 'слабко');
  const differentiation: DiffRow[] = [
    { factor: 'Асортимент / каталог', ours: sig(ci.config.products > 100, ci.config.products > 500), note: `~${ci.config.products} товарів, ${ci.config.categories} категорій (реконструкція)` },
    { factor: 'Контент / експертиза', ours: sig(kinds.has('content')), note: kinds.has('content') ? 'є інфо-контент' : 'немає інфо-шару' },
    { factor: 'Довіра / соц. доказ', ours: sig(has('trust') && has('reviews'), false), note: 'trust/відгуки — див. Trust Strategy' },
    { factor: 'Сервіс (підбір/консультація)', ours: sig(hasLink(/calc|podbor|consult/)), note: 'сервісні механіки як диференціатор' },
    { factor: 'Loyalty / retention', ours: sig(hasLink(/loyalty|account/)), note: 'retention-контур' },
    { factor: 'Аналітика / дані', ours: sig(analytics), note: analytics ? `аналітика: ${ci.config.analytics}` : 'аналітику не виявлено' },
  ];

  /* ── ST40 · Стратегічний аудит сторінок ── */
  const PAGE_FN: Partial<Record<PageKind, string>> = {
    home: 'Позиціонування · discovery · trust · навігація · acquisition',
    plp: 'Product discovery · SEO · merchandising · conversion',
    pdp: 'Рішення · довіра · транзакція',
    content: 'Acquisition · authority · SEO/GEO',
    faq: 'Зняття заперечень · AEO · підтримка',
    checkout: 'Транзакція · зняття тертя на оплаті',
  };
  const pageStrat: PageStrat[] = [];
  for (const p of pages) {
    const fn = PAGE_FN[p.kind]; if (!fn) continue;
    if (pageStrat.some((x) => x.page === KIND_LABEL[p.kind])) continue;
    const tr = site.tree.find((x) => x.kind === p.kind);
    const pct = tr ? tr.pct : 0;
    const delivers = pct >= 65;
    pageStrat.push({ page: KIND_LABEL[p.kind], url: shortUrl(p.finalUrl || p.url), fn, delivers, note: tr ? `відповідність еталону ${pct}% — ${delivers ? 'функцію виконує' : 'бізнес-функція недовиконана'}` : 'не розібрано' });
  }

  /* ── ST41 · Стратегічний аудит блоків (Fragstore-анатомія) ── */
  const KEY: PageKind[] = ['home', 'plp', 'pdp'];
  const blockCards: StratBlockCard[] = [];
  for (const pr of site.pages) {
    if (!KEY.includes(pr.kind)) continue;
    for (const row of pr.rows) {
      if (!STRAT_BLOCKS.has(row.key) || row.state === 'ok') continue;
      const tpl = B_TPL[row.key];
      // Стратегічна цінність = наскільки цей блок важливий для бізнесу (потенціал),
      // а не наскільки він зараз зроблений: зламаний core-блок має ВИСОКУ цінність
      // виправлення. Базується на вазі + піднімається, якщо блок відсутній/слабкий.
      const strategicValue = row.weight === 'core' ? 5 : row.weight === 'important' ? 4 : 3;
      blockCards.push({
        page: KIND_LABEL[pr.kind], pageUrl: shortUrl(pr.url), key: row.key, name: row.name,
        businessPurpose: tpl.biz, customerPurpose: tpl.cust, now: row.now,
        problem: row.state === 'gap' ? 'блок відсутній — бізнес-функція не працює' : row.state === 'weak' ? 'є, але не виконує бізнес-функцію за еталоном' : 'не підтверджено обходом',
        should: tpl.should, strategicValue,
        businessImpact: tpl.impact, priority: priFor(row.state, row.weight),
        recommendation: row.state === 'gap' ? `Створити «${row.name}»: ${tpl.should}` : `Довести «${row.name}» до бізнес-еталона: ${tpl.should}`,
      });
    }
  }
  const priRank: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  blockCards.sort((a, b) => priRank[a.priority] - priRank[b.priority]);

  /* ── ST37 · Стратегічні ризики ── */
  const risks: RiskRow[] = [];
  if (!hasLink(/account|loyalty|bonus/) && !has('newsletter')) risks.push({ risk: 'Немає retention-контуру', severity: 'P0', note: 'кожна покупка — «одноразова»; зростання лише через дорогий платний трафік (CAC)' });
  if (!kinds.has('content')) risks.push({ risk: 'Залежність від платного трафіку', severity: 'P1', note: 'слабка органіка/контент → високий CAC, вразливість до вартості реклами' });
  if (!has('usp_bar')) risks.push({ risk: 'Слабка диференціація', severity: 'P1', note: 'немає явного «чому ми» → конкуренція ціною' });
  if (!analytics) risks.push({ risk: 'Немає аналітики / first-party data', severity: 'P1', note: 'рішення без даних; немає customer intelligence' });
  if (langs.length <= 1 && !hasLink(/\/(en|pl|de)(\/|$)/)) risks.push({ risk: 'Обмежена масштабованість на нові ринки', severity: 'P2', note: 'одна мовна версія — бар’єр для міжнародного росту' });
  if (!has('trust') || !has('reviews')) risks.push({ risk: 'Слабка система довіри', severity: 'P1', note: 'заперечення не зняті системно → нижча конверсія й LTV' });

  /* ── ST38/45 · Стратегічні можливості ── */
  const opportunities: OppRow[] = [
    { title: 'Побудувати retention-контур (кабінет + лояльність + email)', chain: 'Немає повторних → база + loyalty → повторні покупки → LTV↑, залежність від CAC↓', priority: risks.some((r) => r.risk.includes('retention')) ? 'P0' : 'P1' },
    { title: 'Розвинути органічний канал (контент + SEO + GEO)', chain: 'Високий CAC → контент-хаб + семантика → органіка → нижча залежність від paid', priority: 'P1' },
    { title: 'Підсилити диференціацію (сервіс: підбір/консультація/гарантії)', chain: 'Конкуренція ціною → сервісні механіки → унікальна цінність → маржа', priority: 'P1' },
    { title: 'Зростання AOV (cross-sell/upsell/бандли)', chain: 'Низький чек → рекомендації й набори → AOV↑ → виручка з того ж трафіку', priority: 'P2' },
  ];

  /* ── Strategic Health Score (5 великих зон) ── */
  const bizFit = clamp10((roles.filter((r) => r.fits).length / roles.length) * 6 + posScore * 4);
  const marketFit = clamp10(posScore * 5 + (segments.filter((s) => s.supported).length / segments.length) * 5);
  const productFit = clamp10((features.filter((f) => f.present).length / features.length) * 6 + (objections.filter((o) => o.ok).length / objections.length) * 4);
  const growthPot = clamp10((kinds.has('content') ? 3 : 0) + (langs.length > 1 ? 2 : 0) + (analytics ? 2 : 0) + (hasLink(/account|loyalty/) ? 3 : 0));
  const econPot = clamp10((has('related') ? 3 : 1) + (hasLink(/account|loyalty/) ? 3 : 1) + (has('trust', 'reviews') ? 3 : 1));
  const health: { zones: HealthZone[]; overall: number } = {
    zones: [
      { key: 'bizFit', label: 'Business Fit', score: bizFit, note: 'Відповідність сайту бізнес-моделі й ролі', measured: true },
      { key: 'marketFit', label: 'Market Fit', score: marketFit, note: 'Відповідність ринку, сегментам, позиціонуванню', measured: true },
      { key: 'productFit', label: 'Digital Product Fit', score: productFit, note: 'Чи закриває задачі користувачів (фічі, заперечення)', measured: true },
      { key: 'growthPot', label: 'Growth Potential', score: growthPot, note: 'Здатність масштабуватися (органіка/гео/retention/дані)', measured: true },
      { key: 'econPot', label: 'Economic Potential', score: econPot, note: 'Вплив на revenue/margin/LTV (AOV, retention, довіра)', measured: true },
    ],
    overall: clamp10((bizFit + marketFit + productFit + growthPot + econPot) / 5),
  };

  /* ── Strategic Score (22 зони: measured + бізнес-контекст) ── */
  const z = (key: string, label: string, score: number, measured = true): StratScoreZone => ({ key, label, score: measured ? clamp10(score) : 0, measured });
  const trustShare = [has('trust'), has('reviews'), has('footer_contacts'), analytics].filter(Boolean).length;
  const score = {
    zones: [
      z('align', 'Business Alignment', bizFit),
      z('bmodel', 'Business Model Fit', (roles.filter((r) => r.fits).length / roles.length) * 10),
      z('positioning', 'Positioning', posScore * 10),
      z('valueprop', 'Value Proposition', (has('hero') ? 5 : 2) + (has('usp_bar') ? 3 : 0) + (has('trust') ? 2 : 0)),
      z('audience', 'Target Audience Fit', (segments.filter((s) => s.supported).length / segments.length) * 10),
      z('needs', 'Customer Needs / Objections', (objections.filter((o) => o.ok).length / objections.length) * 10),
      z('diff', 'Differentiation', (differentiation.filter((d) => d.ours !== 'слабко').length / differentiation.length) * 10),
      z('product', 'Product Strategy', 4 + (has('product_grid') ? 3 : 0) + (has('related') ? 2 : 0)),
      z('trust', 'Trust Strategy', trustShare * 2.5),
      z('retention', 'Retention Strategy', (hasLink(/account|loyalty/) ? 5 : 1) + (has('newsletter') ? 3 : 0)),
      z('brand', 'Brand Strategy', (has('hero') ? 3 : 1) + (has('usp_bar') ? 3 : 0) + (kinds.has('content') ? 2 : 0)),
      z('channel', 'Channel Strategy', 3 + (kinds.has('content') ? 2 : 0) + (analytics ? 2 : 0)),
      z('scalability', 'Scalability', 3 + (langs.length > 1 ? 3 : 0) + (ci.config.products > 200 ? 2 : 0)),
      z('competitive', 'Competitive Position', (differentiation.filter((d) => d.ours === 'сильно').length) * 3 + 2),
      z('opps', 'Strategic Opportunities', Math.min(10, opportunities.length * 2 + 2)),
      z('risks', 'Strategic Risks (нижче = гірше)', Math.max(1, 10 - risks.length * 1.5)),
      // Бізнес-контекст (н/д):
      z('unitecon', 'Unit Economics (AOV/CAC/LTV)', 0, false),
      z('pricing', 'Pricing Strategy', 0, false),
      z('revenue', 'Revenue Model', 0, false),
      z('omnichannel', 'Omnichannel / Marketplace', 0, false),
      z('data', 'Data Strategy', analytics ? 4 : 0, analytics),
      z('kpi', 'KPI System', 0, false),
    ],
    overall: 0,
  };
  const sm = score.zones.filter((zz) => zz.measured);
  score.overall = sm.length ? clamp10(sm.reduce((s, zz) => s + zz.score, 0) / sm.length) : 0;

  /* ── Roadmap (6 фаз) ── */
  const roadmap = [
    { phase: 'Phase 1 · Critical (заважає бізнесу зараз)', items: [
      ...(risks.some((r) => r.severity === 'P0') ? risks.filter((r) => r.severity === 'P0').map((r) => `Закрити ризик: ${r.risk}`) : []),
      ...(has('trust') ? [] : ['Побудувати систему довіри (зняти заперечення в точках рішення)']),
    ] },
    { phase: 'Phase 2 · Quick Wins (високий ефект / низька вартість)', items: [
      ...(has('usp_bar') ? ['Підсилити УТП конкретикою (claim → proof)'] : ['Додати блок УТП з конкретними перевагами']),
      'Звʼязати відгуки/довіру з карткою товару (соц. доказ → комерційний перехід)',
    ] },
    { phase: 'Phase 3 · Growth (SEO/CRO/merchandising/CRM/content)', items: [
      ...(kinds.has('content') ? ['Розширити контент-хаб і перелінковку'] : ['Запустити контент-хаб (органіка, нижчий CAC)']),
      'Merchandising: виводити маржинальні/стратегічні товари',
    ] },
    { phase: 'Phase 4 · Product (нові механіки)', items: [
      ...(features.filter((f) => !f.present).slice(0, 3).map((f) => `Створити: ${f.feature} — ${f.value}`)),
    ] },
    { phase: 'Phase 5 · Scale (ринки/мови/категорії/канали)', items: [
      ...(langs.length > 1 ? ['Масштабування контенту на наявні мовні версії'] : ['Підготувати архітектуру під нові мови/ринки']),
      'Нові категорії й канали продажу',
    ] },
    { phase: 'Phase 6 · Transformation (перебудова моделі)', items: ['Перегляд digital/e-commerce моделі за даними unit-економіки (після інтейку)'] },
  ].map((p) => ({ phase: p.phase, items: p.items.filter(Boolean) })).filter((p) => p.items.length);

  /* ── Артефакти (20) ── */
  const A = (n: number, name: string, source: StratArtifact['source']): StratArtifact => ({ n, name, source });
  const artifacts: StratArtifact[] = [
    A(1, 'Business Model Map', 'бізнес-контекст'), A(2, 'Business Goals Map', 'бізнес-контекст'),
    A(3, 'Target Audience Map', 'сайт'), A(4, 'Customer Needs / Pain Points Map', 'сайт'),
    A(5, 'Positioning Map', 'сайт'), A(6, 'Value Proposition Audit', 'сайт'),
    A(7, 'Competitive Position Map', 'бізнес-контекст'), A(8, 'Product / Assortment Strategy', 'сайт'),
    A(9, 'Revenue Opportunity Map', 'бізнес-контекст'), A(10, 'Channel Strategy Map', 'бізнес-контекст'),
    A(11, 'Retention Strategy Map', 'сайт'), A(12, 'Strategic Risk Map', 'сайт'),
    A(13, 'Strategic Opportunity Map', 'сайт'), A(14, 'Page Strategic Audit', 'сайт'),
    A(15, 'Block Strategic Audit', 'сайт'), A(16, 'Golden Standard Benchmark', 'бізнес-контекст'),
    A(17, 'Strategic Score', 'сайт'), A(18, 'Impact × Effort Matrix', 'сайт'),
    A(19, 'Strategic Roadmap', 'сайт'), A(20, 'ТЗ / список ініціатив', 'сайт'),
  ];

  const contextNote = 'Strategic Audit іде ПЕРШИМ і задає «навіщо» для решти аудитів. Вимірюване з сайту рахуємо детерміновано; зони unit-економіки (AOV/CAC/LTV/маржа), бізнес-цілей, KPI-факту, частки marketplace, даних-стратегії й обсягу ринку позначені «потрібен бізнес-контекст» — це вхід із брифу/інтейку, а не вигадка.';

  /* ── Спайн ── */
  const spine: StratLayer[] = [
    { id: 'ST1', title: 'ST1 · Business Model & Role', principle: 'Спершу — як сайт вписаний у бізнес-модель і яку роль виконує (продаж/каталог/бренд/retention).', state: `Тип: ${ci.config.businessType}; зрілість L${ci.maturity.level} (${ci.maturity.name}); роль(і) виконуються: ${roles.filter((r) => r.fits).length}/${roles.length}.` },
    { id: 'ST2', title: 'ST2 · Positioning & Value Proposition', principle: 'Чи зрозуміло за 5–10 секунд: хто ми, для кого, що і чому саме тут (WHO/FOR WHOM/WHAT/WHY/PROOF).', state: `Позиціонування закрите на ${Math.round(posScore * 100)}%; claim→proof доведено: ${claims.filter((c) => c.proven).length}/${claims.length}.` },
    { id: 'ST3', title: 'ST3 · Audience · Needs · Objections', principle: 'Чи побудований сайт під сегменти, їхні потреби й заперечення, а не «універсальний homepage».', state: `Сегментних сценаріїв: ${segments.filter((s) => s.supported).length}/${segments.length}; заперечень знято: ${objections.filter((o) => o.ok).length}/${objections.length}.` },
    { id: 'ST4', title: 'ST4 · Market · Competitive · Differentiation', principle: 'Чому обрати нас, якщо конкурент на одну вкладку далі — реальні точки диференціації.', state: `Сильна диференціація за ${differentiation.filter((d) => d.ours === 'сильно').length} факторами; ринок/конкуренти — потрібен бізнес-контекст.` },
    { id: 'ST5', title: 'ST5 · Product · Assortment · Pricing · Revenue', principle: 'Чи виводить сайт саме те, що бізнесу вигідно продавати; джерела виручки.', state: `~${ci.config.products} товарів, ${ci.config.categories} категорій; pricing/revenue-модель — потрібен бізнес-контекст.` },
    { id: 'ST6', title: 'ST6 · Channel · Retention · Data', principle: 'Чи є контур утримання й дані для рішень, чи сайт — «одноразовий продаж».', state: `Retention: ${hasLink(/account|loyalty/) ? 'є контур' : 'немає контуру'}; аналітика: ${analytics ? ci.config.analytics : 'не виявлено'}.` },
    { id: 'ST7', title: 'ST7 · Page & Block Strategic', principle: 'Кожна сторінка й блок — за бізнес-функцією, а не лише за UX: що вони дають бізнесу.', state: `${pageStrat.filter((p) => !p.delivers).length}/${pageStrat.length} ключових сторінок недовиконують бізнес-функцію; блоків із правками ${blockCards.length}.` },
    { id: 'ST8', title: 'ST8 · Gaps · Risks · Opportunities · Roadmap', principle: 'Фінал: стратегічні розриви → ризики й можливості → Impact×Effort → roadmap із бізнес-результатом.', state: `Ризиків ${risks.length} (${risks.filter((r) => r.severity === 'P0').length} × P0), можливостей ${opportunities.length}; roadmap — ${roadmap.length} фаз.` },
  ];

  return {
    client, takenAt: ds.takenAt, businessType: ci.config.businessType, maturityLevel: ci.maturity.level, maturityName: ci.maturity.name,
    spine, health, score, roles, positioning, claims, segments, objections, features, differentiation,
    pages: pageStrat, blockCards, risks, opportunities, roadmap, artifacts, contextNote,
  };
}
