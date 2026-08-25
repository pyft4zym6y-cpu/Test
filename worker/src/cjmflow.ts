/**
 * CUSTOMER JOURNEY AUDIT — системна перевірка повного шляху клієнта від першого
 * контакту з брендом до покупки, повторної покупки, лояльності й можливого відходу.
 * Питання: що відбувається з клієнтом на кожному етапі, де виникає friction, чому
 * він рухається (чи ні) далі і наскільки система відповідає його потребам і бізнес-цілям.
 *
 * 15 етапів: Awareness → Discovery → Consideration → Search → Product → Cart →
 * Checkout → Payment → Delivery → Receipt → Usage → Support → Repeat → Loyalty →
 * Advocacy. Групи: Pre-site · On-site · Post-purchase.
 *
 * Два чесні шари:
 *  1) Вимірюване з обходу вітрини: готовність on-site етапів (homepage/catalog/
 *     search/product/cart/checkout), trust-touchpoints, expectation (доставка),
 *     наявність post-purchase-сторінок (support/returns/loyalty), intent-alignment.
 *  2) Вимірюване лише з ДАНИХ/ДОСЛІДЖЕННЯ (позначено): емоції (session recordings/
 *     інтерв'ю), фактичний drop-off (GA4), ефективність pre-site каналів (ad
 *     platforms), якість підтримки/доставки й repeat/churn (CRM). Без вигаданих цифр.
 */
import type { AuditDataset } from './report.js';
import type { PageKind } from './crawl.js';
import { buildSiteAudit } from './pagereport.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type StageGroup = 'Pre-site' | 'On-site' | 'Post-purchase';
export type Source = 'обхід' | 'дані/дослідження';

export type CjLayer = { id: string; title: string; principle: string; state: string };
export type StageRow = {
  stage: string; group: StageGroup; userGoal: string; readiness: number; source: Source;
  friction: string; opportunity: string; priority: Priority;
};
export type PersonaRow = { persona: string; goal: string; aligned: boolean; note: string };
export type TrustRow = { touchpoint: string; ok: boolean; note: string };
export type EmotionRow = { point: string; emotion: string; risk: boolean; note: string };
export type MapRow = { item: string; ok: boolean; note: string };

export type CjmFlowReport = {
  client: string; takenAt: string;
  spine: CjLayer[];
  onsiteReadiness: number;
  maturity: { floor: number; note: string };
  stages: StageRow[];
  personas: PersonaRow[];
  trust: TrustRow[];
  emotional: EmotionRow[];
  expectation: { item: string; promiseObservable: boolean; note: string }[];
  postPurchase: MapRow[];
  opportunities: { type: string; note: string }[];
  roadmap: { phase: string; items: string[] }[];
  artifacts: { n: number; name: string; source: Source }[];
  contextNote: string;
};

const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));

export function buildCjmFlow(ds: AuditDataset): CjmFlowReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const site = buildSiteAudit(ds);
  const pages = ds.client.pages.filter((p) => !p.error && p.ux);
  const links = ds.client.links ?? [];
  const lpath = (h: string) => { try { return new URL(h).pathname.toLowerCase(); } catch { return ''; } };
  const hasLink = (re: RegExp) => links.some((h) => re.test(lpath(h)));
  const anyBlock = new Set<string>();
  for (const p of pages) for (const [k, v] of Object.entries(p.ux!.blocks ?? {})) if (v) anyBlock.add(k);
  const has = (...k: string[]) => k.some((x) => anyBlock.has(x));
  const kinds = new Set(pages.map((p) => p.kind));
  const analytics = (ds.client.tech?.analytics ?? []).length > 0;
  const stageReady = (kind: PageKind, blocks: string[]): number => {
    const pr = site.pages.find((p) => p.kind === kind);
    if (!pr) return 0;
    const present = blocks.filter((k) => pr.rows.some((r) => r.key === k && r.state === 'ok')).length;
    return clamp10((present / Math.max(1, blocks.length)) * 10);
  };

  /* ── 15 етапів шляху ── */
  const S = (stage: string, group: StageGroup, userGoal: string, readiness: number, source: Source, friction: string, opportunity: string, priority: Priority): StageRow => ({ stage, group, userGoal, readiness, source, friction, opportunity, priority });
  const searchReady = has('search') ? 8 : 3;
  const stages: StageRow[] = [
    S('Awareness', 'Pre-site', 'Дізнатись про бренд/товар', 0, 'дані/дослідження', 'Ефективність каналів — з ad-платформ', 'Охоплення й меседж під сегмент', 'P2'),
    S('Discovery / Consideration', 'Pre-site', 'Зрозуміти, чи підходить', 0, 'дані/дослідження', 'Проміжний контент/огляди — поза сайтом', 'Контент під верхню воронку (див. Content/GEO)', 'P2'),
    S('First contact → Homepage', 'On-site', 'Зрозуміти «куди я потрапив»', stageReady('home', ['hero', 'usp_bar', 'nav']), 'обхід', has('hero') ? '' : 'немає чіткого оффера на вході', 'Оффер + вхід у каталог за 5 сек', has('hero') ? 'P3' : 'P1'),
    S('Search', 'On-site', 'Знайти товар «своїми словами»', searchReady, 'обхід', has('search') ? '' : 'немає пошуку — розрив discovery', 'Пошук із підказками/синонімами', has('search') ? 'P3' : 'P1'),
    S('Category / Product discovery', 'On-site', 'Звузити вибір', stageReady('plp', ['product_grid', 'filters', 'category_title']), 'обхід', has('filters') ? '' : 'слабкі фільтри', 'Discovery: фільтри, керований ranking', 'P2'),
    S('Product evaluation', 'On-site', 'Вирішити «чи підійде»', stageReady('pdp', ['gallery', 'price', 'description', 'reviews']), 'обхід', has('description') ? '' : 'тонкий опис/немає доказів', 'Опис-приріст, характеристики, відгуки', 'P1'),
    S('Add to Cart', 'On-site', 'Покласти в кошик', (pages.find((p) => p.kind === 'pdp')?.ux?.addToCartProminent ? 8 : 3), 'обхід', pages.find((p) => p.kind === 'pdp')?.ux?.addToCartProminent ? '' : 'CTA не домінантний', 'Домінантний CTA + мікро-довіра', 'P1'),
    S('Cart', 'On-site', 'Перевірити замовлення', (kinds.has('cart') ? 6 : 3) + (has('order_summary') ? 2 : 0), 'обхід', has('order_summary') ? '' : 'непрозорий підсумок', 'Прозорий підсумок + добір до порогу', 'P2'),
    S('Checkout / Payment', 'On-site', 'Оформити без тертя', stageReady('checkout', ['contact_form', 'delivery_selection', 'payment_selection', 'order_summary']), 'обхід', has('guest_checkout') ? '' : 'обов’язкова реєстрація / пізні витрати', 'Гостьове оформлення, ясні витрати', 'P1'),
    S('Delivery', 'Post-purchase', 'Отримати вчасно', (has('delivery') || hasLink(/dostavka|delivery/) ? 6 : 3), 'обхід', has('delivery') || hasLink(/dostavka/) ? 'умови є — фактична якість з даних' : 'умови доставки не на видноті', 'Прозорі терміни + трекінг (з даних)', 'P2'),
    S('Receipt / Usage', 'Post-purchase', 'Розібратись із товаром', 0, 'дані/дослідження', 'Підтвердження/освіта — email/CRM', 'Onboarding-контент, інструкції', 'P2'),
    S('Support', 'Post-purchase', 'Вирішити проблему', (hasLink(/contact|kontakt|support|help/) ? 6 : 3), 'обхід', hasLink(/support|help|contact/) ? 'канали є — SLA/контекст з даних' : 'підтримка не знайдена', 'Доступні канали + контекст (не питати заново)', 'P2'),
    S('Repeat Purchase', 'Post-purchase', 'Купити знову', (hasLink(/account|cabinet|loyalty/) ? 5 : 1) + (has('newsletter') ? 2 : 0), 'обхід', hasLink(/account|loyalty/) ? 'контур є — repeat rate з CRM' : 'немає retention-контуру', 'Кабінет + лояльність + email', hasLink(/account|loyalty/) ? 'P2' : 'P1'),
    S('Loyalty', 'Post-purchase', 'Стати постійним', (hasLink(/loyalty|bonus|cashback/) ? 6 : 1), 'обхід', hasLink(/loyalty|bonus/) ? '' : 'немає програми лояльності', 'Програма лояльності', 'P2'),
    S('Advocacy', 'Post-purchase', 'Рекомендувати', (hasLink(/referral|invite|otzyv|review/) ? 5 : 2), 'обхід', hasLink(/referral|invite/) ? '' : 'немає referral/UGC-механік', 'Review→Referral→Reward', 'P3'),
  ];
  const onsite = stages.filter((s) => s.group === 'On-site');
  const onsiteReadiness = clamp10(onsite.reduce((s, x) => s + x.readiness, 0) / Math.max(1, onsite.length));

  /* ── Journey Maturity floor ── */
  const omniSignals = [hasLink(/account/), hasLink(/loyalty/), analytics, hasLink(/support|help/)].filter(Boolean).length;
  const floor = onsiteReadiness >= 5 ? (omniSignals >= 3 ? 3 : 2) : 1;
  const maturity = { floor, note: `L1 Touchpoint · L2 Funnel · L3 Journey · L4 Omnichannel · L5 Adaptive. Оцінка з вітрини — нижня межа L${floor}; повний рівень (omnichannel/adaptive) підтверджується даними CRM/marketing/support.` };

  /* ── Personas × intent alignment ── */
  const personas: PersonaRow[] = [
    { persona: 'New customer', goal: 'Швидко зрозуміти й обрати', aligned: has('hero', 'usp_bar'), note: has('usp_bar') ? 'оффер/переваги є' : 'слабкий вхідний контекст' },
    { persona: 'Returning customer', goal: 'Швидко повторити покупку', aligned: hasLink(/account|cabinet/), note: hasLink(/account/) ? 'кабінет є' : 'немає швидкого повтору' },
    { persona: 'Mobile customer', goal: 'Купити з телефону без тертя', aligned: pages.every((p) => (p.ux?.smallTapTargets ?? 0) <= 4), note: 'мобільні цілі торкання прийнятні' },
    { persona: 'High-value / gift buyer', goal: 'Подарунковий/преміум сценарій', aligned: hasLink(/gift|podar/), note: hasLink(/gift|podar/) ? 'подарунковий розділ є' : 'немає окремого сценарію' },
    { persona: 'Price-sensitive', goal: 'Знайти вигоду', aligned: hasLink(/sale|akci|skidk/), note: hasLink(/sale|akci/) ? 'sale-розділ є' : 'немає явних вигід' },
    { persona: 'Organic vs Paid visitor', goal: 'Landing відповідає обіцянці', aligned: kinds.has('plp') && kinds.has('content'), note: 'посадкові під різні intent — частково' },
  ];

  /* ── Trust touchpoints ── */
  const trust: TrustRow[] = [
    { touchpoint: 'Reviews / social proof', ok: has('reviews'), note: has('reviews') ? 'є' : 'немає' },
    { touchpoint: 'Guarantees / returns', ok: has('trust') || hasLink(/garant|vozvrat|return/), note: has('trust') ? 'є' : 'перевірити' },
    { touchpoint: 'Payment security', ok: has('payment'), note: has('payment') ? 'є' : 'немає' },
    { touchpoint: 'Delivery information', ok: has('delivery') || hasLink(/dostavka|delivery/), note: 'умови доставки' },
    { touchpoint: 'Company information', ok: has('footer_contacts') || hasLink(/about|contact/), note: 'реквізити/контакти' },
  ];

  /* ── Emotional Journey (шаблон; фактичні емоції — дослідження) ── */
  const emotional: EmotionRow[] = [
    { point: 'Перший екран', emotion: 'Confusion → Interest', risk: !has('hero'), note: has('hero') ? 'оффер орієнтує' : 'ризик розгубленості без чіткого оффера' },
    { point: 'Вибір товару', emotion: 'Interest → Confidence', risk: !has('description', 'specifications'), note: 'докази/деталі знімають сумнів' },
    { point: 'Оплата', emotion: 'Anxiety', risk: !has('trust') || !has('payment'), note: 'тривога зростає без сигналів довіри/оплати' },
    { point: 'Після оплати', emotion: 'Relief → Satisfaction', risk: true, note: 'підтвердження/освіта/підтримка — вимірюється дослідженням/CRM' },
  ];

  /* ── Expectation management (Promise → Reality) ── */
  const expectation = [
    { item: 'Обіцянка доставки (реклама) ↔ фактичні терміни на сайті', promiseObservable: has('delivery') || hasLink(/dostavka/), note: 'ключовий journey mismatch: «завтра» в рекламі vs «3–5 днів» на checkout — звірка з ad-копіями (дані)' },
    { item: 'Ціна/акція в рекламі ↔ ціна на сторінці', promiseObservable: hasLink(/sale|akci/), note: 'звірка потребує ad-даних' },
    { item: 'Наявність у рекламі ↔ наявність на сайті', promiseObservable: kinds.has('pdp'), note: 'OOS-товар з реклами — критичний mismatch (дані фіда)' },
  ];

  /* ── Post-purchase touchpoints ── */
  const postPurchase: MapRow[] = [
    { item: 'Order confirmation / thank-you', ok: hasLink(/thank|spasibo|dyakuye|success/), note: 'сторінка подяки' },
    { item: 'Support channels', ok: hasLink(/contact|support|help|kontakt/), note: 'канали підтримки' },
    { item: 'Returns / warranty', ok: hasLink(/return|vozvrat|garant|obmin/), note: 'повернення/гарантія' },
    { item: 'Reviews request', ok: has('reviews'), note: 'збір відгуків' },
    { item: 'Loyalty / referral', ok: hasLink(/loyalty|bonus|referral|invite/), note: 'утримання/адвокатство' },
    { item: 'Repeat purchase (account)', ok: hasLink(/account|cabinet|lk/), note: 'кабінет для повтору' },
  ];

  /* ── Opportunity Map ── */
  const opportunities = [
    { type: 'Reduce friction', note: 'Прибрати зайві кроки, пізні витрати, обов’язкову реєстрацію' },
    { type: 'Increase clarity', note: 'Дати потрібну інформацію в потрібний момент' },
    { type: 'Increase trust', note: 'Зняти anxiety в точках рішення й оплати' },
    { type: 'Increase speed', note: 'Пришвидшити завершення задачі' },
    { type: 'Personalize', note: 'Показати релевантний шлях під сегмент/intent' },
    { type: 'Retain', note: 'Створити наступний interaction (retention-контур)' },
  ];

  /* ── Roadmap (5 фаз) ── */
  const roadmap = [
    { phase: 'Phase 1 · Mapping', items: ['Персони, lifecycle, touchpoints, канали — з інтейку/даних'] },
    { phase: 'Phase 2 · Friction Removal', items: stages.filter((s) => s.friction && s.priority === 'P1').slice(0, 4).map((s) => `${s.stage}: ${s.friction}`) },
    { phase: 'Phase 3 · Integration', items: ['Звʼязати marketing/website/CRM/support/analytics (єдиний контекст клієнта)'] },
    { phase: 'Phase 4 · Personalization', items: ['Адаптувати journey під сегмент/поведінку (після даних)'] },
    { phase: 'Phase 5 · Continuous Optimization', items: ['Постійно: Journey → Friction → Conversion → Retention → LTV'] },
  ].map((p) => ({ phase: p.phase, items: p.items.filter(Boolean) })).filter((p) => p.items.length);

  const artNames = ['Journey Scope', 'Persona Journey Map', 'Customer Goal Audit', 'Intent Audit', 'Customer Questions Audit', 'Customer Anxiety Audit', 'Trust Journey', 'First Contact Audit', 'Ad → Website Journey', 'Search → Website Journey', 'Homepage Journey', 'Category Journey', 'Product Discovery Journey', 'Product Evaluation Journey', 'Add-to-Cart Journey', 'Cart Journey', 'Checkout Journey', 'Payment Journey', 'Delivery Journey', 'Post-Purchase Journey', 'Support Journey', 'Repeat Purchase Journey', 'Loyalty Journey', 'Advocacy Journey', 'Emotional Journey', 'Expectation Management', 'Journey Friction Map', 'Journey Opportunity Map', 'Journey Maturity', 'Journey Roadmap', 'ТЗ на покращення шляху'];
  const OBHID = /(Homepage|Category|Product Discovery|Product Evaluation|Add-to-Cart|Cart|Checkout|Trust Journey|Opportunity|Maturity|Roadmap|Expectation)/;
  const artifacts = artNames.map((name, i) => ({ n: i + 1, name, source: (OBHID.test(name) ? 'обхід' : 'дані/дослідження') as Source }));

  const contextNote = 'Customer Journey Audit: on-site етапи (homepage→checkout), trust-touchpoints, expectation і наявність post-purchase-сторінок — з обходу вітрини. Емоції (session recordings/інтерв’ю), фактичний drop-off (GA4), ефективність pre-site каналів (ad-платформи), якість підтримки/доставки й repeat/churn (CRM) — з даних/досліджень, позначено. Цифри не вигадуються.';

  const p1 = stages.filter((s) => s.priority === 'P1').length;
  const spine: CjLayer[] = [
    { id: 'CJ1', title: 'CJ1 · Scope · Personas · Intent', principle: 'Шлях не можна аналізувати для «середнього клієнта»: сегменти, їхні цілі й intent на кожному етапі.', state: `${personas.length} персон; вирівняно з інтерфейсом ${personas.filter((p) => p.aligned).length}/${personas.length}.` },
    { id: 'CJ2', title: 'CJ2 · Pre-site (Awareness→Consideration)', principle: 'До сайту: реклама/пошук/соцмережі/marketplace — ефективність вимірюється ad-даними.', state: 'Pre-site етапи — потрібні дані каналів (позначено).' },
    { id: 'CJ3', title: 'CJ3 · On-site (Homepage→Checkout)', principle: 'Головний вимірюваний шар: чи легко пройти від входу до оплати без тертя.', state: `Готовність on-site шляху ${onsiteReadiness}/10; ${p1} етапів × P1.` },
    { id: 'CJ4', title: 'CJ4 · Trust & Emotional Journey', principle: 'Крива емоцій Confusion→Interest→Confidence→Anxiety→Relief; тривога зростає до оплати — знімається довірою.', state: `Trust-touchpoints: ${trust.filter((t) => t.ok).length}/${trust.length}; емоції — дослідження.` },
    { id: 'CJ5', title: 'CJ5 · Expectation Management', principle: 'Promise → Reality: «доставка завтра» в рекламі vs «3–5 днів» на checkout — критичний mismatch.', state: 'Обіцянки на сайті видно; звірка з рекламою — з ad-даних.' },
    { id: 'CJ6', title: 'CJ6 · Post-purchase (Delivery→Advocacy)', principle: 'Після покупки: доставка, підтримка, повтор, лояльність, адвокатство — часто найслабший шар.', state: `Post-purchase-сторінок: ${postPurchase.filter((p) => p.ok).length}/${postPurchase.length}; якість — з CRM.` },
    { id: 'CJ7', title: 'CJ7 · Friction & Opportunity Map', principle: 'Де клієнт зупиняється і які можливості: Reduce friction/Increase clarity·trust·speed/Personalize/Retain.', state: `Етапів із тертям: ${stages.filter((s) => s.friction).length}.` },
    { id: 'CJ8', title: 'CJ8 · Maturity · Roadmap', principle: 'Зрілість L1–L5 (Touchpoint→Adaptive) і план: Mapping→Friction Removal→Integration→Personalization→Optimization.', state: `Journey Maturity floor L${floor}; roadmap ${roadmap.length} фаз.` },
  ];

  return { client, takenAt: ds.takenAt, spine, onsiteReadiness, maturity, stages, personas, trust, emotional, expectation, postPurchase, opportunities, roadmap, artifacts, contextNote };
}
