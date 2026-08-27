/**
 * CRO AUDIT — Conversion Rate Optimization: наскільки сайт СИСТЕМНО перетворює
 * відвідувача на цільову дію. Головне питання: що заважає користувачу зробити
 * потрібну бізнесу дію і які зміни з найбільшою ймовірністю піднімуть конверсію.
 *
 * На відміну від UX: інтерфейс може бути зручним, але погано продавати. CRO зв'язує
 * Traffic → Intent → Experience → Trust → Decision → Action → Conversion → Revenue.
 *
 * Два чесні шари:
 *  1) Вимірюване з обходу: friction (форми/несподівані витрати/гостьовий checkout/
 *     мобільні цілі), trust-сигнали, CTA, value proposition, offer, готовність
 *     воронки за етапами (наявність блоків), AOV-механіки.
 *  2) Вимірюване лише з ДАНИХ (позначено «н/д»): фактична воронка й drop-off,
 *     конверсія за джерелами, revenue per session, A/B-історія, heatmaps, form
 *     analytics. Вхід із GA4/GTM/CRM/heatmap-інструментів. Цифри не вигадуються.
 *
 * Гіпотези — у форматі «Якщо змінимо X, то Y зросте, бо Z», пріоритет ICE
 * (Impact × Confidence × Ease). Benchmark — орієнтир, не доказ «якою має бути CR».
 */
import type { AuditDataset } from './report.js';
import type { PageKind, PageAudit } from './crawl.js';
import { buildSiteAudit, type BlockState } from './pagereport.js';
import { flowScore, type FlowScore } from './flowScore.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type CroLayer = { id: string; title: string; principle: string; state: string };
export type HealthZone = { key: string; label: string; score: number; note: string };
export type ScoreZone = { key: string; label: string; score: number; measured: boolean };
export type FunnelStage = { stage: string; readiness: number; note: string; leakage: 'н/д' };
export type FrictionRow = { point: string; severity: Priority; present: boolean; note: string };
export type MapRow = { item: string; ok: boolean; note: string };
export type CroBlockCard = {
  page: string; key: string; name: string; role: string;
  current: string; problem: string; golden: string; recommendation: string; effect: string; priority: Priority;
};
export type Hypothesis = { text: string; impact: number; confidence: number; ease: number; ice: number; priority: Priority };

export type CroFlowReport = {
  client: string; takenAt: string;
  spine: CroLayer[];
  health: { zones: HealthZone[]; /** null — обходу не було, рахувати нема з чого. */ overall: number | null };
  score: FlowScore<ScoreZone>;
  funnel: FunnelStage[];
  friction: FrictionRow[];
  trustMap: MapRow[];
  objectionMap: MapRow[];
  ctaMap: MapRow[];
  aovMechanics: MapRow[];
  experimentation: { level: number; note: string };
  blockCards: CroBlockCard[];
  hypotheses: Hypothesis[];
  opportunities: { type: string; note: string }[];
  roadmap: { phase: string; items: string[] }[];
  artifacts: { n: number; name: string; source: 'обхід' | 'дані GA/CRM' }[];
  contextNote: string;
};

const KIND_LABEL: Record<PageKind, string> = { home: 'Головна', plp: 'Категорія', pdp: 'Картка товару', cart: 'Кошик', checkout: 'Оформлення', content: 'Стаття', faq: 'FAQ', other: 'Службова' };
const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));

/* ── CRO-анатомія блоку ── */
type CTpl = { role: string; golden: string; recommendation: string; effect: string; problem: string };
const C_TPL: Record<string, CTpl> = {
  hero: { role: 'Value proposition + first CTA', golden: 'За 5 сек зрозуміло: що, для кого, чому тут; один головний CTA у комерційний сценарій.', recommendation: 'Сфокусувати оффер + первинний CTA.', effect: 'Вищий прохід із входу далі', problem: 'немає чіткого оффера/CTA — розмита пропозиція' },
  usp_bar: { role: 'Motivation / зняття «чому ви»', golden: '4 конкретні переваги з доказами (не «якість і сервіс»).', recommendation: 'Замінити загальні слова конкретикою + докази.', effect: 'Сильніша мотивація до дії', problem: 'мотивація слабка — загальні переваги без доказів' },
  add_to_cart: { role: 'Головна конверсійна дія', golden: 'Домінантний CTA у першому екрані; мікро-довіра під кнопкою.', recommendation: 'Зробити CTA домінантним + мікро-trust під ним.', effect: 'Пряме зростання add-to-cart', problem: 'CTA тоне серед конкурентних елементів' },
  price: { role: 'Ясність ціни/умов (friction)', golden: 'Ціна одразу, наявність і термін доставки поруч із CTA — фінальні умови ДО checkout.', recommendation: 'Показати наявність/доставку біля ціни й CTA.', effect: 'Менше несподіванок → нижчий checkout abandonment', problem: 'умови/наявність не поруч із рішенням' },
  trust: { role: 'Trust / зняття ризику', golden: 'Гарантія/повернення/оплата з конкретикою + міні-докази в точці рішення.', recommendation: 'Вбудувати докази довіри біля CTA.', effect: 'Менше відмов на оплаті', problem: 'ризик не знятий у точці рішення' },
  reviews: { role: 'Social proof', golden: 'Реальні відгуки з фото/іменами, рейтинг біля ціни.', recommendation: 'Винести рейтинг до CTA + живі відгуки.', effect: 'Вища впевненість → конверсія', problem: 'соц. доказ слабкий/далеко від рішення' },
  faq: { role: 'Objection handling', golden: 'Реальні заперечення з прямими відповідями + виходи в комерцію.', recommendation: 'Перебудувати FAQ під заперечення вибору.', effect: 'Зняті заперечення → менше кинутих сесій', problem: 'заперечення не зняті на сторінці' },
  delivery: { role: 'Shipping clarity (friction)', golden: 'Вартість і термін доставки ДО кошика (39% відмов — пізні витрати).', recommendation: 'Показати доставку до кошика.', effect: 'Нижчий checkout abandonment', problem: 'витрати доставки спливають пізно' },
  payment: { role: 'Payment trust', golden: 'Способи оплати видно; логотипи платіжних систем як сигнал.', recommendation: 'Показати способи й логотипи оплати.', effect: 'Менше тертя на оплаті', problem: 'платіжні сигнали слабкі' },
  contact_form: { role: 'Form friction', golden: 'Мінімум полів, маски, автозаповнення, зрозумілі помилки біля поля.', recommendation: 'Скоротити форму + inline-валідація.', effect: 'Нижчий form abandonment', problem: 'форма довша/складніша, ніж треба' },
  guest_checkout: { role: 'Зняття бар’єру реєстрації', golden: 'Гостьове оформлення; акаунт — ПІСЛЯ оплати (−19% покинутих).', recommendation: 'Додати гостьове оформлення.', effect: 'Менше кинутих на реєстрації', problem: 'обов’язкова реєстрація до покупки' },
  related: { role: 'AOV: cross/upsell', golden: '«З цим беруть» / дорожча альтернатива — після рішення, не заважаючи.', recommendation: 'Додати cross/upsell-сценарії.', effect: 'Вищий AOV', problem: 'немає механік підвищення чека' },
  order_summary: { role: 'Прозорість підсумку (friction)', golden: 'Товари+доставка+знижка=підсумок без витрат, що спливають.', recommendation: 'Показувати повний підсумок на кожному кроці.', effect: 'Довіра до суми → завершення', problem: 'підсумок непрозорий / витрати пізно' },
};
const CRO_BLOCKS = new Set(Object.keys(C_TPL));
const priFor = (state: BlockState, weight: string): Priority => {
  const bad = state === 'gap' || state === 'weak';
  const r = bad ? (weight === 'core' ? 0 : weight === 'important' ? 1 : 2) : (weight === 'core' ? 1 : weight === 'important' ? 2 : 3);
  return (['P0', 'P1', 'P2', 'P3'] as const)[r];
};
const chk = (p: PageAudit | undefined, id: string) => !!p?.checks.find((c) => c.id === id)?.pass;

export function buildCroFlow(ds: AuditDataset): CroFlowReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const site = buildSiteAudit(ds);
  const pages = ds.client.pages.filter((p) => !p.error && p.ux);
  const byKind = new Map<PageKind, PageAudit>();
  for (const p of pages) if (!byKind.has(p.kind)) byKind.set(p.kind, p);
  const anyBlock = new Set<string>();
  for (const p of pages) for (const [k, v] of Object.entries(p.ux!.blocks ?? {})) if (v) anyBlock.add(k);
  const has = (...k: string[]) => k.some((x) => anyBlock.has(x));
  const kinds = new Set(pages.map((p) => p.kind));
  const analytics = (ds.client.tech?.analytics ?? []).length > 0;
  const pdp = byKind.get('pdp');
  const co = byKind.get('checkout');

  /* ── Conversion Funnel (готовність за етапами; фактичний drop-off — н/д) ── */
  const stageReady = (kind: PageKind, blocks: string[]): number => {
    const pr = site.pages.find((p) => p.kind === kind);
    if (!pr) return 0;
    const present = blocks.filter((k) => pr.rows.some((r) => r.key === k && r.state === 'ok')).length;
    return clamp10((present / Math.max(1, blocks.length)) * 10);
  };
  const funnel: FunnelStage[] = [
    { stage: 'Session → Landing', readiness: stageReady('home', ['hero', 'usp_bar', 'nav']), note: 'Оффер, довіра, вхід у каталог', leakage: 'н/д' },
    { stage: 'Category / Product discovery', readiness: stageReady('plp', ['product_grid', 'filters', 'category_title']), note: 'Discovery: сітка, фільтри, посадкова', leakage: 'н/д' },
    { stage: 'Product interaction', readiness: stageReady('pdp', ['gallery', 'price', 'description', 'add_to_cart']), note: 'Рішення: галерея, ціна, опис, CTA', leakage: 'н/д' },
    { stage: 'Add to Cart', readiness: (pdp?.ux?.addToCartProminent ? 8 : 3), note: 'Помітність головної дії', leakage: 'н/д' },
    { stage: 'Checkout', readiness: stageReady('checkout', ['contact_form', 'delivery_selection', 'payment_selection', 'order_summary']), note: 'Форма, доставка, оплата, підсумок', leakage: 'н/д' },
    { stage: 'Payment → Purchase', readiness: clamp10((co && chk(co, 'https') ? 5 : 3) + (has('payment', 'trust') ? 3 : 0) + (has('guest_checkout') ? 2 : 0)), note: 'Довіра оплати, гостьове оформлення', leakage: 'н/д' },
  ];

  /* ── Friction Map ── */
  const formFields = co?.ux?.formFields ?? pdp?.ux?.formFields ?? 0;
  const tapTargets = Math.max(...pages.map((p) => p.ux?.smallTapTargets ?? 0), 0);
  const friction: FrictionRow[] = [
    { point: 'Пізні витрати доставки (не до кошика)', severity: 'P0', present: !has('delivery') && !kinds.has('checkout'), note: '39% відмов оформлення — через пізні витрати' },
    { point: 'Обов’язкова реєстрація (немає гостьового)', severity: 'P1', present: !has('guest_checkout') && kinds.has('checkout'), note: 'гостьове оформлення: −19% покинутих' },
    { point: 'Задовга форма', severity: 'P1', present: formFields > 6, note: `полів у формі: ${formFields || 'н/д'} (кожне зайве знижує завершення)` },
    { point: 'Дрібні цілі торкання (mobile friction)', severity: 'P2', present: tapTargets > 3, note: `дрібних цілей: ${tapTargets}` },
    { point: 'CTA не домінантний', severity: 'P1', present: !(pdp?.ux?.addToCartProminent), note: 'головна дія тоне серед елементів' },
    { point: 'Непрозорий підсумок замовлення', severity: 'P1', present: kinds.has('checkout') && !has('order_summary'), note: 'витрати, що спливають пізно' },
    { point: 'Немає елементів довіри на оплаті', severity: 'P1', present: !has('trust') || !has('payment'), note: 'ризик не знятий у точці оплати' },
  ];

  /* ── Trust / Objection / CTA / AOV maps ── */
  const trustMap: MapRow[] = [
    { item: 'Гарантія / повернення', ok: has('trust'), note: has('trust') ? 'є' : 'немає' },
    { item: 'Відгуки / рейтинг', ok: has('reviews'), note: has('reviews') ? 'є' : 'немає' },
    { item: 'Платіжні сигнали', ok: has('payment'), note: has('payment') ? 'є' : 'немає' },
    { item: 'Реквізити / контакти', ok: has('footer_contacts'), note: has('footer_contacts') ? 'є' : 'немає' },
    { item: 'HTTPS / безпека', ok: chk(byKind.get('home'), 'https'), note: chk(byKind.get('home'), 'https') ? 'є' : 'перевірити' },
  ];
  const objectionMap: MapRow[] = [
    { item: 'Чи оригінальний / якісний', ok: has('trust') || has('specifications'), note: 'знімається блоком довіри/характеристиками' },
    { item: 'Що з доставкою й термінами', ok: has('delivery'), note: 'блок доставки' },
    { item: 'Як повернути', ok: has('trust'), note: 'гарантія/повернення' },
    { item: 'Чи безпечно платити', ok: has('payment', 'trust'), note: 'платіжні/довіра' },
    { item: 'Залишкові питання', ok: has('faq', 'qa'), note: 'FAQ/Q&A' },
  ];
  const ctaMap: MapRow[] = [
    { item: 'Головна (первинний CTA у каталог)', ok: !!byKind.get('home')?.ux?.primaryCtaAboveFold, note: 'первинний CTA у першому екрані' },
    { item: 'Картка товару («До кошика»)', ok: !!pdp?.ux?.addToCartProminent, note: 'домінантний CTA' },
    { item: 'Категорія (перехід у товар)', ok: has('product_grid'), note: 'картки з дією' },
    { item: 'Checkout (єдиний «Оформити»)', ok: kinds.has('checkout'), note: 'один домінантний CTA оформлення' },
  ];
  const aovMechanics: MapRow[] = [
    { item: 'Cross-sell («з цим беруть»)', ok: has('related'), note: has('related') ? 'є' : 'немає' },
    { item: 'Upsell (Good/Better/Best)', ok: !!pdp?.ux?.variantSelector, note: pdp?.ux?.variantSelector ? 'варіанти є' : 'немає' },
    { item: 'Бандли / набори', ok: false, note: 'потребує перевірки/впровадження' },
    { item: 'Поріг безкоштовної доставки', ok: has('usp_bar', 'delivery'), note: 'поріг із прогресом і добором' },
  ];

  /* ── Experimentation Maturity ── */
  const expLevel = analytics ? 2 : 1;
  const experimentation = { level: expLevel, note: analytics ? 'Аналітика встановлена (L2 — можливі гіпотези). A/B-програма й data-driven optimization — після даних тестів.' : 'Аналітику не виявлено (L1 — зміни ризикують бути субʼєктивними). Почати з встановлення GA4/GTM.' };

  /* ── Block CRO cards ── */
  const KEY: PageKind[] = ['home', 'plp', 'pdp', 'checkout'];
  const blockCards: CroBlockCard[] = [];
  for (const pr of site.pages) {
    if (!KEY.includes(pr.kind)) continue;
    for (const row of pr.rows) {
      if (!CRO_BLOCKS.has(row.key) || row.state === 'ok') continue;
      const tpl = C_TPL[row.key];
      blockCards.push({
        page: KIND_LABEL[pr.kind], key: row.key, name: row.name, role: tpl.role,
        current: row.now, problem: row.state === 'gap' ? `блок відсутній — ${tpl.problem}` : tpl.problem,
        golden: tpl.golden, recommendation: tpl.recommendation, effect: tpl.effect, priority: priFor(row.state, row.weight),
      });
    }
  }
  const priRank: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  blockCards.sort((a, b) => priRank[a.priority] - priRank[b.priority]);

  /* ── Hypothesis Backlog (If X → Y because Z; ICE) ── */
  const H = (text: string, impact: number, confidence: number, ease: number): Hypothesis => {
    // I/C/E за шкалою 1–5; ICE нормалізуємо в 0–10 (макс 5×5×5=125 → /12.5).
    const ice = Math.round((impact * confidence * ease) / 12.5 * 10) / 10;
    const priority: Priority = ice >= 6 ? 'P0' : ice >= 4 ? 'P1' : ice >= 2 ? 'P2' : 'P3';
    return { text, impact, confidence, ease, ice, priority };
  };
  const hypotheses: Hypothesis[] = [];
  if (!has('delivery') && !kinds.has('checkout')) hypotheses.push(H('Якщо показати вартість/термін доставки поруч із ціною й CTA, checkout abandonment знизиться, бо користувач дізнається фінальні умови раніше', 5, 4, 4));
  if (!has('guest_checkout') && kinds.has('checkout')) hypotheses.push(H('Якщо додати гостьове оформлення, кинутих на кроці реєстрації стане менше, бо зникає бар’єр обов’язкового акаунта', 4, 4, 3));
  if (!(pdp?.ux?.addToCartProminent)) hypotheses.push(H('Якщо зробити «До кошика» домінантним CTA з мікро-довірою під ним, add-to-cart зросте, бо головна дія перестане конкурувати з іншими елементами', 5, 4, 4));
  if (!has('trust')) hypotheses.push(H('Якщо вбудувати гарантію/повернення й платіжні сигнали біля CTA, відмов на оплаті стане менше, бо ризик знімається в точці рішення', 4, 4, 3));
  if (!has('reviews')) hypotheses.push(H('Якщо винести рейтинг і живі відгуки до ціни, конверсія картки зросте, бо соц. доказ підтверджує вибір перед дією', 4, 3, 3));
  if (!has('related')) hypotheses.push(H('Якщо додати «з цим беруть»/дорожчу альтернативу після рішення, AOV зросте, бо з’являються керовані cross/upsell', 3, 3, 3));
  hypotheses.sort((a, b) => b.ice - a.ice);

  /* ── Opportunity Map (типи) ── */
  const opportunities = [
    { type: 'Remove friction', note: 'Прибрати пізні витрати, скоротити форми, гостьове оформлення, домінантний CTA' },
    { type: 'Increase trust', note: 'Гарантії/повернення/оплата/відгуки в точках рішення' },
    { type: 'Increase motivation', note: 'Конкретні переваги з доказами замість загальних слів' },
    { type: 'Improve clarity', note: 'Ясна ціна/умови/наступний крок' },
    { type: 'Increase AOV', note: 'Cross/upsell, бандли, поріг безкоштовної доставки' },
    { type: 'Improve retention', note: 'Post-purchase, лояльність, повторна конверсія (після даних)' },
  ];

  /* ── CRO Health Score (5 зон) ── */
  const frictionOpen = friction.filter((f) => f.present).length;
  const conversionReadiness = clamp10(funnel.reduce((s, f) => s + f.readiness, 0) / funnel.length);
  const frictionScore = clamp10(10 - frictionOpen * 1.4);
  const persuasion = clamp10((has('hero') ? 3 : 1) + (has('usp_bar') ? 3 : 0) + (has('reviews') ? 2 : 0) + (has('related') ? 2 : 0));
  const trust = clamp10((trustMap.filter((t) => t.ok).length / trustMap.length) * 10);
  const optMaturity = clamp10(expLevel * 2);
  const health = {
    zones: [
      { key: 'readiness', label: 'Conversion Readiness', score: conversionReadiness, note: 'Готовність воронки конвертувати' },
      { key: 'friction', label: 'Friction (менше = краще)', score: frictionScore, note: `${frictionOpen} точок тертя виявлено` },
      { key: 'persuasion', label: 'Persuasion', score: persuasion, note: 'Наскільки сайт переконує' },
      { key: 'trust', label: 'Trust', score: trust, note: 'Наскільки знято ризики' },
      { key: 'optMaturity', label: 'Optimization Maturity', score: optMaturity, note: `Experimentation L${expLevel}` },
    ],
    overall: pages.length ? clamp10((conversionReadiness + frictionScore + persuasion + trust + optMaturity) / 5) : null,
  };

  /* ── CRO Score (20 напрямів) ── */
  const z = (key: string, label: string, sc: number, measured = true): ScoreZone => ({ key, label, score: measured ? clamp10(sc) : 0, measured });
  const zones = [
      z('strategy', 'Conversion Strategy', (has('hero', 'usp_bar') ? 6 : 3) + (analytics ? 2 : 0)),
      z('funnel', 'Funnel', conversionReadiness),
      z('intent', 'Intent Match', (kinds.has('plp') && kinds.has('pdp') ? 6 : 3) + (has('category_title') ? 2 : 0)),
      z('valueprop', 'Value Proposition', (has('hero') ? 5 : 2) + (has('usp_bar') ? 3 : 0)),
      z('offer', 'Offer', (has('usp_bar') ? 4 : 2) + (has('trust') ? 3 : 0)),
      z('cta', 'CTA', (ctaMap.filter((c) => c.ok).length / ctaMap.length) * 10),
      z('friction', 'Friction', frictionScore),
      z('trust', 'Trust', trust),
      z('objection', 'Objection Handling', (objectionMap.filter((o) => o.ok).length / objectionMap.length) * 10),
      z('forms', 'Forms', formFields ? clamp10(10 - Math.max(0, formFields - 5) * 1.5) : 5),
      z('cart', 'Cart Conversion', (kinds.has('cart') ? 5 : 3) + (has('order_summary') ? 2 : 0)),
      z('checkout', 'Checkout', stageReady('checkout', ['contact_form', 'delivery_selection', 'payment_selection', 'order_summary'])),
      z('payment', 'Payment', has('payment') ? 6 : 3),
      z('shipping', 'Shipping clarity', has('delivery') ? 6 : 3),
      z('aov', 'AOV Strategy', (aovMechanics.filter((a) => a.ok).length / aovMechanics.length) * 10),
      z('crossupsell', 'Cross/Upsell', (has('related') ? 5 : 2) + (pdp?.ux?.variantSelector ? 2 : 0)),
      z('mobile', 'Mobile CRO', clamp10((chk(byKind.get('home'), 'viewport') ? 6 : 2) + (tapTargets <= 3 ? 2 : 0))),
      // Дані:
      z('analytics', 'Behavioral Analytics', analytics ? 4 : 0, analytics),
      z('personalization', 'Personalization', 0, false),
      z('experimentation', 'A/B Experimentation', 0, false),
    ];
  const score = flowScore(zones, pages.length);

  /* ── Roadmap (5 фаз) ── */
  const roadmap = [
    { phase: 'Phase 1 · Critical Friction', items: friction.filter((f) => f.present && (f.severity === 'P0' || f.severity === 'P1')).map((f) => `Прибрати тертя: ${f.point}`) },
    { phase: 'Phase 2 · Core Conversion', items: [...(has('usp_bar') ? [] : ['Сфокусувати value proposition + оффер']), 'Довіра й зняття заперечень у точках рішення', 'Домінантний CTA на ключових сторінках'] },
    { phase: 'Phase 3 · Revenue Optimization', items: [...(has('related') ? ['Розділити cross/upsell-сценарії'] : ['Додати cross/upsell']), 'Бандли + поріг безкоштовної доставки'] },
    { phase: 'Phase 4 · Personalization', items: ['Сегменти й behavioral (recently viewed, повторні) — після даних CRM/аналітики'] },
    { phase: 'Phase 5 · Experimentation', items: [...(analytics ? ['Запустити A/B-програму за гіпотезами (ICE)'] : ['Встановити GA4/GTM, потім A/B-програма']), 'Continuous optimization'] },
  ].map((p) => ({ phase: p.phase, items: p.items.filter(Boolean) })).filter((p) => p.items.length);

  const artNames = ['Conversion Strategy Map', 'Conversion Event Map', 'Conversion Funnel', 'Funnel Leakage Map', 'Traffic → Conversion Matrix', 'Landing Page CRO Audit', 'Intent-to-Page Map', 'Value Proposition Audit', 'Offer Audit', 'CTA Map', 'Friction Map', 'Trust Map', 'Objection Map', 'Form Audit', 'Cart Conversion Audit', 'Checkout Conversion Audit', 'Payment Audit', 'Shipping Audit', 'AOV Opportunity Map', 'Cross-sell / Upsell Map', 'Personalization Audit', 'Behavioral Analytics Audit', 'A/B Testing Audit', 'Golden Standard Benchmark', 'Page CRO Matrix', 'Block CRO Matrix', 'CRO Score', 'CRO Opportunity Map', 'Hypothesis Backlog', 'Prioritization Matrix', 'CRO Roadmap', 'ТЗ / A/B Testing Plan'];
  const DATA = /(Event Map|Funnel Leakage|Traffic → Conversion|Behavioral Analytics|A\/B|Personalization Audit)/;
  const artifacts = artNames.map((name, i) => ({ n: i + 1, name, source: (DATA.test(name) ? 'дані GA/CRM' : 'обхід') as 'обхід' | 'дані GA/CRM' }));

  const contextNote = 'CRO Audit: інтерфейс може бути зручним, але погано продавати. Вимірюване з обходу (friction, trust, CTA, готовність воронки, AOV-механіки) рахуємо детерміновано. Фактична воронка й drop-off, конверсія за джерелами, revenue per session, A/B-історія, heatmaps, form analytics — з даних (GA4/GTM/CRM/heatmap), позначено «н/д». Гіпотези — «Якщо X, то Y, бо Z», пріоритет ICE; benchmark — орієнтир, а не доказ «якою має бути CR».';

  const frictionTop = friction.filter((f) => f.present).slice(0, 2).map((f) => f.point).join('; ');
  const spine: CroLayer[] = [
    { id: 'CRO1', title: 'CRO1 · Conversion Definition & Funnel', principle: 'Спершу — що є конверсією (primary/secondary/micro) і фактична воронка Session→…→Purchase.', state: `Готовність воронки ${conversionReadiness}/10; фактичний drop-off — з даних (н/д).` },
    { id: 'CRO2', title: 'CRO2 · Funnel Leakage & Traffic', principle: 'Де губиться максимум користувачів і як конверсія відрізняється за джерелами.', state: 'Leakage за етапами й конверсія за джерелами — потрібні дані GA4 (н/д).' },
    { id: 'CRO3', title: 'CRO3 · Intent · Value Proposition · Offer', principle: 'Обіцянка = сторінка = дія; за 5–10 сек зрозуміло, навіщо сайт.', state: `Value proposition: ${has('hero') ? 'є' : 'слабка'}; оффер: ${has('usp_bar') ? 'є' : 'загальний'}.` },
    { id: 'CRO4', title: 'CRO4 · Friction', principle: 'Головне питання CRO: що заважає дії — форми, витрати, реєстрація, mobile, непрозорість.', state: `${frictionOpen} точок тертя${frictionTop ? `: ${frictionTop}` : ''}.` },
    { id: 'CRO5', title: 'CRO5 · Trust · Objections · CTA', principle: 'Зняти ризик, закрити заперечення, дати домінантну дію в потрібний момент.', state: `Trust ${trust}/10; заперечень знято ${objectionMap.filter((o) => o.ok).length}/${objectionMap.length}; CTA ${ctaMap.filter((c) => c.ok).length}/${ctaMap.length}.` },
    { id: 'CRO6', title: 'CRO6 · Cart · Checkout · Payment · Shipping', principle: 'Найдорожча зона: прозорий підсумок, гостьове оформлення, ясні витрати й оплата.', state: `Checkout-етап розібрано; критичне тертя — у Friction Map.` },
    { id: 'CRO7', title: 'CRO7 · AOV · Personalization · Experimentation', principle: 'Підвищення чека (cross/upsell/бандли/пороги) і зрілість оптимізації (гіпотези→A/B).', state: `AOV-механік: ${aovMechanics.filter((a) => a.ok).length}/${aovMechanics.length}; Experimentation L${expLevel}.` },
    { id: 'CRO8', title: 'CRO8 · Hypotheses · Score · Roadmap', principle: 'Гіпотези «Якщо X→Y, бо Z» з ICE → CRO Health/Score → gap → roadmap → A/B-план.', state: `CRO Health ${health.overall}/10; Score ${score.overall}/10; гіпотез ${hypotheses.length} (P0: ${hypotheses.filter((h) => h.priority === 'P0').length}).` },
  ];

  return { client, takenAt: ds.takenAt, spine, health, score, funnel, friction, trustMap, objectionMap, ctaMap, aovMechanics, experimentation, blockCards, hypotheses, opportunities, roadmap, artifacts, contextNote };
}
