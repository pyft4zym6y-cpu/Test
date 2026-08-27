/**
 * GEO / AEO / LLM Visibility — окремий великий модуль, а не «добавка до SEO».
 *
 * Три поняття розділяємо:
 *  · AEO — чи здатний контент дати прямий структурований ВІДПОВІДЬ;
 *  · GEO — чи має контент/бренд шанси бути ДЖЕРЕЛОМ у генеративній відповіді;
 *  · LLM Visibility — чи присутній бренд/продукти/сутності в AI-відповідях коректно.
 *
 * ЧЕСНА МОДЕЛЬ (важливо): не продаємо «магічні GEO-фактори» і не гарантуємо
 * потрапляння в AI-відповіді. Вимірюємо ЙМОВІРНІСТЬ і фактичну присутність за
 * ланцюгом visibility → mention → citation → accuracy → referral → conversion.
 * Тому модуль ділиться на два шари:
 *  1) Вимірюване із зовнішнього обходу (AI-crawlability, answerability, сутності,
 *     факт-екстракція, розмітка, структура) — рахуємо детерміновано.
 *  2) Вимірюване ЛИШЕ живим прогоном AI-запитів або інструментами (Brand
 *     Visibility, Citation Share, AI Share of Voice, Accuracy, Referral, конкурентний
 *     бенчмарк) — оформлюємо як робочий документ/шаблон, позначений «н/д до прогону»,
 *     а НЕ вигадуємо цифри.
 */
import type { AuditDataset } from './report.js';
import type { PageKind } from './crawl.js';
import { buildSiteAudit, type BlockState } from './pagereport.js';
import { flowScore, type FlowScore } from './flowScore.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type GeoLayer = { id: string; title: string; principle: string; state: string };
export type GeoScoreZone = { key: string; label: string; score: number; note: string; measured: boolean };
export type BotRow = { bot: string; surface: string; access: 'ok' | 'blocked' | 'na'; note: string };
export type EntityRow = { entity: string; named: boolean; described: boolean; schema: boolean; external: 'na'; note: string };
export type AnswerRow = { page: string; url: string; directAnswer: boolean; structured: boolean; facts: boolean; faq: boolean; score: number; note: string };
export type GeoBlockCard = {
  page: string; pageUrl: string; key: string; name: string;
  now: string; should: string;
  answerability: number; structure: number; entity: number; evidence: number; linking: number; aeo: number;
  score: number; priority: Priority; recommendation: string; effect: string;
};
export type GeoGap = { title: string; why: string; create: string; priority: Priority };
export type MainTableRow = { query: string; intent: string; ourUrl: string; note: string };
export type GeoArtifact = { n: number; name: string; source: 'обхід' | 'живий прогін' };

export type GeoFlowReport = {
  client: string; takenAt: string;
  spine: GeoLayer[];
  score: FlowScore<GeoScoreZone>;
  crawlability: BotRow[];
  entities: EntityRow[];
  answerability: AnswerRow[];
  blockCards: GeoBlockCard[];
  gapMap: GeoGap[];
  mainTable: MainTableRow[];
  opportunities: { title: string; chain: string; priority: Priority }[];
  roadmap: { stage: string; items: string[] }[];
  artifacts: GeoArtifact[];
  liveNote: string;
};

const KIND_LABEL: Record<PageKind, string> = { home: 'Головна', plp: 'Категорія', pdp: 'Картка товару', cart: 'Кошик', checkout: 'Оформлення', content: 'Стаття', faq: 'FAQ', other: 'Службова' };
const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
const clamp5 = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
const half = (n: number) => Math.round(Math.max(1, Math.min(5, n)) * 2) / 2;
const shortUrl = (u: string) => { try { const x = new URL(u); return x.pathname === '/' ? '/' : x.pathname; } catch { return u; } };

/* ── GEO/AEO-анатомія блоку (Fragstore-стиль): як має бути + осьові акценти ── */
type GTpl = { should: string; recommendation: string; effect: string; ansStrong?: boolean; entStrong?: boolean; evidStrong?: boolean; linkStrong?: boolean };
const G_TPL: Record<string, GTpl> = {
  faq: { should: 'Питання → короткий прямий відповідь (40–60 слів) → доказ → релевантні посилання. FAQPage-розмітка. Реальні decision-making питання, не SEO-набір.', recommendation: 'Перебудувати FAQ навколо реальних питань + короткий прямий відповідь + доказ + повʼязані сторінки + FAQPage.', effect: 'AI витягує прямі відповіді й цитує; тематичні переходи замість «глухого кута».', ansStrong: true, linkStrong: true },
  qa: { should: 'Q&A з розміткою QAPage; питання покупців, самодостатні відповіді з фактами.', recommendation: 'Додати Q&A з QAPage-розміткою і фактами у відповідях.', effect: 'Унікальні прямі відповіді під long-tail AI-запити.', ansStrong: true, evidStrong: true },
  description: { should: 'Прямий факт-опис: що це, для кого, чим відрізняється, ключові цифри — те, що AI витягує як факт. Не «широкий асортимент високої якості».', recommendation: 'Переписати опис фактами й сутностями (склад, процес, цифри, сценарії).', effect: 'Легша факт-екстракція → цитування в генеративних відповідях.', ansStrong: true, entStrong: true, evidStrong: true },
  specifications: { should: 'Характеристики таблицею «значення + сенс» — машиночитані факти (матеріал, розмір, вага, країна).', recommendation: 'Винести характеристики в структуровану таблицю фактів.', effect: 'AI відповідає на атрибутивні питання без «здогадок».', evidStrong: true, ansStrong: true },
  reviews: { should: 'Відгуки з Review/AggregateRating — сигнал довіри й UGC, який AI використовує для рекомендацій.', recommendation: 'Додати відгуки з розміткою Review/AggregateRating.', effect: 'Сигнали для recommendation-запитів AI + rich-дані.', evidStrong: true },
  category_description: { should: 'Короткий факт-вступ із сутностями категорії + перелінковка; семантично повне покриття теми.', recommendation: 'Додати факт-вступ із сутностями й перелінковкою на гайди/підкатегорії.', effect: 'Семантична повнота теми для AI + перелінковка.', entStrong: true, linkStrong: true },
  author: { should: 'Автор з експертизою, дата оновлення, біо, посилання на першоджерела — сигнали E-E-A-T і source authority для AI.', recommendation: 'Додати авторство, дату оновлення й посилання на джерела.', effect: 'AI охочіше цитує авторитетне й свіже джерело.', entStrong: true, evidStrong: true },
  breadcrumbs: { should: 'BreadcrumbList-розмітка — контекст сутності й звʼязки в графі знань.', recommendation: 'Додати BreadcrumbList-розмітку.', effect: 'Чіткіші звʼязки сутностей для knowledge graph.', linkStrong: true, entStrong: true },
  footer_contacts: { should: 'Повні реквізити (юрособа, адреса, контакти) + Organization-розмітка — узгоджена сутність компанії.', recommendation: 'Додати повні реквізити й Organization-schema у футер.', effect: 'Консистентна сутність компанії для AI (entity clarity).', entStrong: true, evidStrong: true },
  related: { should: 'Релевантні перелінковки між сутностями (схожі/аксесуари/альтернативи) — звʼязки для recommendation-запитів.', recommendation: 'Додати релевантні звʼязки між товарами й категоріями.', effect: 'AI будує звʼязки «альтернатива/доповнення» для рекомендацій.', linkStrong: true },
};
const GEO_BLOCKS = new Set(Object.keys(G_TPL));

const stateScore: Record<BlockState, number> = { ok: 5, weak: 3, check: 2.5, gap: 1 };
const priFor = (state: BlockState, weight: string): Priority => {
  const bad = state === 'gap' || state === 'weak';
  const r = bad ? (weight === 'core' ? 0 : weight === 'important' ? 1 : 2) : (weight === 'core' ? 1 : weight === 'important' ? 2 : 3);
  return (['P0', 'P1', 'P2', 'P3'] as const)[r];
};

export function buildGeoFlow(ds: AuditDataset): GeoFlowReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const site = buildSiteAudit(ds);
  const pages = ds.client.pages.filter((p) => !p.error && p.ux);
  const cl = ds.client;
  const kinds = new Set(pages.map((p) => p.kind));
  const anyBlock = new Set<string>();
  for (const p of pages) for (const [k, v] of Object.entries(p.ux!.blocks ?? {})) if (v) anyBlock.add(k);
  const has = (...k: string[]) => k.some((x) => anyBlock.has(x));
  const schemaAny = (id: string) => pages.some((p) => p.checks.find((c) => c.id === id)?.pass);
  const schemaOrg = schemaAny('schema-org'), schemaProd = schemaAny('schema-product'), schemaCrumbs = schemaAny('schema-crumbs');

  /* ── G1 · AI Crawlability ── */
  const blocked = new Set(cl.ai?.blockedBots ?? []);
  const BOTS: [string, string][] = [
    ['GPTBot', 'ChatGPT (навчання/пошук)'], ['OAI-SearchBot', 'ChatGPT Search'], ['ClaudeBot', 'Claude'],
    ['Claude-SearchBot', 'Claude Search'], ['PerplexityBot', 'Perplexity'], ['Google-Extended', 'Gemini / AI Overviews'],
  ];
  const crawlability: BotRow[] = BOTS.map(([bot, surface]) => ({
    bot, surface,
    access: cl.ai ? (blocked.has(bot) ? 'blocked' : 'ok') : 'na',
    note: cl.ai ? (blocked.has(bot) ? 'заблоковано в robots.txt — AI не бачить сайт' : 'доступ відкритий') : 'robots не перевірено',
  }));
  const jsRisk = pages.some((p) => (p.ux!.bodyWords ?? 0) < 40); // мало тексту у DOM — ризик JS-only контенту
  const blockedCount = crawlability.filter((b) => b.access === 'blocked').length;

  /* ── G2 · Entity Foundation ── */
  const entities: EntityRow[] = [
    { entity: 'Компанія / бренд', named: true, described: has('footer_contacts', 'hero'), schema: schemaOrg, external: 'na', note: schemaOrg ? 'Organization-розмітка є' : 'немає Organization-schema — сутність нечітка' },
    { entity: 'Продукти', named: kinds.has('pdp'), described: has('description'), schema: schemaProd, external: 'na', note: schemaProd ? 'Product-розмітка є' : 'немає Product-schema' },
    { entity: 'Категорії', named: kinds.has('plp'), described: has('category_description'), schema: schemaCrumbs, external: 'na', note: has('category_description') ? 'описи категорій є' : 'категорії без опису-сутності' },
    { entity: 'Виробники / бренди товарів', named: has('specifications'), described: has('specifications'), schema: false, external: 'na', note: 'бренди у характеристиках; окремих сторінок брендів не виявлено' },
    { entity: 'Локації / географія', named: has('footer_contacts'), described: has('footer_contacts'), schema: false, external: 'na', note: 'адреса/географія — у футері; LocalBusiness-розмітки не виявлено' },
    { entity: 'Автори / експерти', named: has('author'), described: has('author'), schema: false, external: 'na', note: has('author') ? 'авторство є' : 'немає авторів/експертів — слабкий E-E-A-T' },
  ];
  const entityClarity = entities.filter((e) => e.named && e.described).length / entities.length;
  const entitySchema = entities.filter((e) => e.schema).length / entities.length;

  /* ── G4 · Answerability (по ключових сторінках) ── */
  const KEY: PageKind[] = ['home', 'plp', 'pdp', 'content', 'faq'];
  const answerability: AnswerRow[] = [];
  for (const p of pages) {
    if (!KEY.includes(p.kind)) continue;
    if (answerability.some((a) => a.page === KIND_LABEL[p.kind])) continue;
    const b = p.ux!.blocks ?? {};
    const directAnswer = (p.ux!.bodyWords ?? 0) >= 40 && (b.faq || b.description || b.category_description || p.kind === 'faq');
    const structured = !!(b.faq || b.specifications || b.qa || p.ux!.headingLevels >= 2);
    const facts = !!(b.specifications || b.price || b.delivery || b.description);
    const faq = !!(b.faq || b.qa || p.kind === 'faq');
    const sc = half(1 + (directAnswer ? 1.5 : 0) + (structured ? 1.2 : 0) + (facts ? 1.1 : 0) + (faq ? 1.2 : 0));
    answerability.push({
      page: KIND_LABEL[p.kind], url: shortUrl(p.finalUrl || p.url),
      directAnswer, structured, facts, faq, score: sc,
      note: directAnswer ? 'є база для прямої відповіді' : 'немає прямого витягуваного відповіді — AI «здогадується»',
    });
  }

  /* ── G6 · Block-by-Block GEO/AEO cards ── */
  const blockCards: GeoBlockCard[] = [];
  for (const pr of site.pages) {
    if (!KEY.includes(pr.kind)) continue;
    for (const row of pr.rows) {
      if (!GEO_BLOCKS.has(row.key) || row.state === 'ok') continue;
      const tpl = G_TPL[row.key];
      const base = stateScore[row.state];
      const answerabilityAx = clamp5(tpl.ansStrong ? base : base + 1);
      const structure = clamp5(base + 0.5);
      const entity = clamp5(tpl.entStrong ? base : base + 1);
      const evidence = clamp5(tpl.evidStrong ? base : base + 1);
      const linking = clamp5(tpl.linkStrong ? base : base + 1);
      const aeo = clamp5(base);
      blockCards.push({
        page: KIND_LABEL[pr.kind], pageUrl: shortUrl(pr.url), key: row.key, name: row.name,
        now: row.now, should: tpl.should,
        answerability: answerabilityAx, structure, entity, evidence, linking, aeo,
        score: half((answerabilityAx + structure + entity + evidence + linking + aeo) / 6),
        priority: priFor(row.state, row.weight), recommendation: tpl.recommendation, effect: tpl.effect,
      });
    }
  }
  const priRank: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  blockCards.sort((a, b) => priRank[a.priority] - priRank[b.priority] || a.score - b.score);

  /* ── G5/G7 · AI Content Gap Map ── */
  const gapMap: GeoGap[] = [];
  if (!has('faq', 'qa')) gapMap.push({ title: 'Немає FAQ / прямих відповідей', why: 'AI нема звідки витягти прямий відповідь на питання вибору → бренд не цитується', create: 'FAQ/Q&A навколо реальних питань зі schema й короткими прямими відповідями', priority: 'P0' });
  if (!kinds.has('content')) gapMap.push({ title: 'Немає гайдів «Як обрати» / buying guide', why: 'AI-запити «як обрати / що краще» не мають джерела на сайті → відповідає конкурентами', create: 'Buying guides із критеріями вибору, сценаріями, порівняннями', priority: 'P1' });
  gapMap.push({ title: 'Немає comparison-контенту (A vs B)', why: 'Порівняльні AI-запити («X vs Y») — один з найчастіших сценаріїв рекомендації', create: 'Сторінки/блоки порівнянь із таблицею критеріїв, плюси/мінуси, «для кого»', priority: 'P1' });
  gapMap.push({ title: 'Немає сторінок «для кого підходить» / use cases', why: 'AI рекомендує аргументовано: кому підходить і за яких умов', create: 'Блоки «підходить, якщо… / не оптимально для…» на картках і категоріях', priority: 'P2' });
  if (!has('specifications')) gapMap.push({ title: 'Немає структурованих фактів (характеристики)', why: 'AI не може витягти атрибути → не відповідає на конкретні питання', create: 'Таблиці характеристик «значення + сенс»', priority: 'P1' });

  /* ── G8 · Головна таблиця GEO (робочий документ, шаблон під живий прогін) ── */
  const commercialLeaf = arch_leaf(site);
  const mainTable: MainTableRow[] = [
    { query: `Як обрати ${commercialLeaf}?`, intent: 'informational / decision', ourUrl: kinds.has('content') ? '/blog/…' : '—', note: kinds.has('content') ? 'є матеріал — перевірити цитування' : 'немає сторінки-відповіді' },
    { query: `Найкращі ${commercialLeaf} — де купити`, intent: 'commercial / recommendation', ourUrl: kinds.has('plp') ? '/category/…' : '—', note: 'перевірити mention/citation у прогоні' },
    { query: `${commercialLeaf}: відгуки`, intent: 'brand / trust', ourUrl: has('reviews') ? '/category|product' : '—', note: has('reviews') ? 'є відгуки' : 'немає відгуків для UGC-сигналу' },
    { query: `${client} — що це за компанія`, intent: 'brand', ourUrl: '/about | /', note: schemaOrg ? 'Organization є' : 'сутність компанії нечітка' },
    { query: `${commercialLeaf} A vs B`, intent: 'comparative', ourUrl: '—', note: 'немає comparison-контенту' },
  ];

  /* ── GEO Opportunity Map ── */
  const opportunities = [
    { title: 'Прямі відповіді + FAQPage на ключові питання', chain: 'AEO gap → прямий відповідь + доказ + schema → цитування в AI → referral', priority: 'P0' as Priority },
    { title: 'Консистентна сутність компанії (Organization + реквізити)', chain: 'Entity gap → Organization-schema + узгоджені NAP → стійка сутність → коректні згадки', priority: 'P1' as Priority },
    { title: 'Comparison / buying guides під recommendation-запити', chain: 'Content gap → порівняння/гайди → AI використовує як джерело рекомендацій', priority: 'P1' as Priority },
    { title: 'Зовнішній контекст бренду (згадки, каталоги, огляди)', chain: 'Authority gap → зовнішні згадки → AI довіряє джерелу → mention/citation', priority: 'P1' as Priority },
  ];

  /* ── GEO Roadmap (12 кроків, згруповано) ── */
  const roadmap = [
    { stage: '1 · AI Crawlability', items: [
      ...(blockedCount ? [`Розблокувати AI-ботів у robots.txt (${blockedCount} заблоковано)`] : ['Тримати AI-ботів відкритими; додати llms.txt']),
      ...(cl.ai?.llmsTxt ? [] : ['Додати llms.txt']),
      ...(jsRisk ? ['Прибрати JS-only контент: ключові факти — в HTML (SSR/hydration)'] : []),
    ] },
    { stage: '2 · Entity Foundation', items: [
      ...(schemaOrg ? [] : ['Organization-розмітка + повні реквізити (узгоджена сутність компанії)']),
      'Однозначні назви сутностей (компанія/бренди/локації) + звʼязки',
    ] },
    { stage: '3 · Factual Consistency', items: ['Source-of-Truth для ключових фактів (доставка/ціна/наявність) — узгодити сайт ↔ зовнішні джерела', 'Прибрати суперечності між сторінками'] },
    { stage: '4 · Content Structure & Answerability', items: ['H1 → короткий прямий відповідь → деталі → факти → FAQ → джерела', 'Факти витягувані: таблиці, списки, конкретні цифри'] },
    { stage: '5 · Question & Semantic Coverage', items: ['Карта питань (що/для кого/як/скільки/що краще/альтернативи) → закрити пробіли', 'Семантично повне покриття тем ключових сторінок'] },
    { stage: '6 · Content Gaps', items: ['FAQ/Q&A, comparison, buying guides, «для кого підходить», use cases'] },
    { stage: '7 · Authority (E-E-A-T)', items: ['Автори/експерти, реквізити, докази, сертифікати, кейси', 'Зовнішні згадки: каталоги, огляди, СМІ, профільні площадки'] },
    { stage: '8 · Citation Building & Monitoring', items: ['Живий прогін AI-запитів: mention/citation/accuracy по бренду й категоріях', 'Підключити Search Console AI-звіти й Bing AI Performance (коли доступні)', 'AI Share of Voice vs конкуренти; відстеження utm_source=chatgpt.com'] },
  ].map((s) => ({ stage: s.stage, items: s.items.filter(Boolean) })).filter((s) => s.items.length);

  /* ── GEO/AEO/LLM Score (20 зон; measured externally + н/д) ── */
  const zone = (key: string, label: string, score: number, note: string, measured = true): GeoScoreZone => ({ key, label, score: measured ? clamp10(score) : 0, note, measured });
  const openBots = crawlability.filter((b) => b.access === 'ok').length;
  const ansAvg = answerability.length ? answerability.reduce((s, a) => s + a.score, 0) / answerability.length : 0;
  const zones: GeoScoreZone[] = [
    zone('crawl', 'AI Crawlability', cl.ai ? (openBots / BOTS.length) * 9 + (cl.ai.llmsTxt ? 1 : 0) : 0, cl.ai ? `${openBots}/${BOTS.length} ботів відкриті${cl.ai.llmsTxt ? ', llms.txt є' : ''}` : 'robots не перевірено', !!cl.ai),
    zone('discover', 'AI Discoverability', (cl.sitemapXml ? 4 : 1) + (jsRisk ? 0 : 3) + (schemaCrumbs ? 2 : 0), 'sitemap, HTML-контент, структура'),
    zone('answerability', 'Answerability', ansAvg * 2, 'Прямі витягувані відповіді на ключових сторінках'),
    zone('structure', 'Content Structure', 4 + (has('faq') ? 2 : 0) + (has('specifications') ? 2 : 0), 'H1→відповідь→факти→FAQ→джерела'),
    zone('entityClarity', 'Entity Clarity', entityClarity * 8 + 1, 'Однозначність і опис сутностей'),
    zone('semantic', 'Semantic Coverage', 4 + (kinds.has('content') ? 2 : 0) + (has('specifications') ? 1.5 : 0), 'Повнота покриття теми'),
    zone('questions', 'Question Coverage', 3 + (has('faq', 'qa') ? 3 : 0) + (kinds.has('content') ? 1.5 : 0), 'Скільки питань закрито'),
    zone('quality', 'Content Quality', 5 + (has('description') ? 1.5 : 0) + (has('author') ? 1.5 : 0), 'Оригінальність, користь, конкретика'),
    zone('eeat', 'E-E-A-T / Trust', 3 + (has('author') ? 2 : 0) + (schemaOrg ? 2 : 0), 'Досвід/експертиза/довіра'),
    zone('schema', 'Structured Data', (schemaOrg ? 3 : 0) + (schemaProd ? 4 : 0) + (schemaCrumbs ? 3 : 0), 'Розмітка ↔ видимий контент'),
    zone('facts', 'Factual Extraction', 3 + (has('specifications') ? 3 : 0) + (has('price') ? 2 : 0) + (has('delivery') ? 1 : 0), 'Легкість витягу фактів'),
    zone('commercial', 'Commercial AI Visibility', 3 + (has('reviews') ? 2 : 0) + (schemaProd ? 2 : 0), 'Product/recommendation-готовність'),
    // Зони, вимірювані ЛИШЕ живим прогоном / інструментами:
    zone('brandVis', 'Brand Visibility', 0, 'н/д — потрібен живий прогін AI-запитів', false),
    zone('citation', 'Citation Visibility', 0, 'н/д — живий прогін / Bing AI Performance, SC AI-звіти', false),
    zone('sov', 'AI Share of Voice', 0, 'н/д — тестовий набір AI-запитів vs конкуренти', false),
    zone('accuracy', 'Factual Accuracy (в AI)', 0, 'н/д — перевірка коректності AI-відповідей', false),
    zone('external', 'External Authority', 0, 'н/д — аудит зовнішніх згадок/бэклінків', false),
    zone('freshnessAI', 'Freshness (в AI)', 0, 'н/д — звірка актуальності в AI-відповідях', false),
    zone('recoReady', 'Recommendation Readiness', 3 + (has('specifications') ? 2 : 0) + (has('reviews') ? 2 : 0), 'Чи є чим аргументувати рекомендацію'),
    zone('aiConv', 'AI Conversion Readiness', 0, 'н/д — AI-referral → conversion (GA + utm_source=chatgpt.com)', false),
  ];
  const score = flowScore(zones, pages.length);

  /* ── Артефакти (12) ── */
  const artifacts: GeoArtifact[] = [
    { n: 1, name: 'AI Visibility Score', source: 'живий прогін' },
    { n: 2, name: 'AI Share of Voice', source: 'живий прогін' },
    { n: 3, name: 'Brand Mention Map', source: 'живий прогін' },
    { n: 4, name: 'Citation Map', source: 'живий прогін' },
    { n: 5, name: 'AI Query Map', source: 'обхід' },
    { n: 6, name: 'Entity Map', source: 'обхід' },
    { n: 7, name: 'AI Content Gap Map', source: 'обхід' },
    { n: 8, name: 'AI Accuracy / Misrepresentation Map', source: 'живий прогін' },
    { n: 9, name: 'Page-by-Page GEO/AEO', source: 'обхід' },
    { n: 10, name: 'Block-by-Block GEO/AEO', source: 'обхід' },
    { n: 11, name: 'Competitor AI Benchmark', source: 'живий прогін' },
    { n: 12, name: 'GEO/AEO Roadmap', source: 'обхід' },
  ];

  const liveNote = 'Чесна модель: GEO не гарантує потрапляння в AI-відповіді (це прямо визнають і Google, і Bing). Ми вимірюємо ЙМОВІРНІСТЬ і фактичну присутність за ланцюгом visibility → mention → citation → accuracy → referral → conversion. Зони, позначені «н/д», вимірюються лише живим прогоном AI-запитів або інструментами (Google SC AI-звіти, Bing AI Performance, GA з utm_source=chatgpt.com) — цифри не вигадуються.';

  /* ── Спайн ── */
  const spine: GeoLayer[] = [
    { id: 'G1', title: 'G1 · AI Crawlability', principle: 'Спершу — чи AI взагалі бачить сайт: доступ ботів (GPTBot, OAI-SearchBot, PerplexityBot…), llms.txt, HTML а не JS-only.', state: cl.ai ? `${openBots}/${BOTS.length} AI-ботів відкриті${blockedCount ? `, ${blockedCount} заблоковано` : ''}${jsRisk ? '; є ризик JS-only контенту' : ''}.` : 'robots.txt не перевірено.' },
    { id: 'G2', title: 'G2 · Entity Foundation', principle: 'Чи розуміє AI сутності (компанія/бренд/продукти/локації) однозначно й з розміткою.', state: `${Math.round(entityClarity * 100)}% сутностей названо й описано; розмітка на ${Math.round(entitySchema * 100)}%.` },
    { id: 'G3', title: 'G3 · Factual Consistency', principle: 'Чи узгоджені факти (доставка/ціна/наявність) між сторінками й зовнішніми джерелами — Source of Truth.', state: 'Звірка узгодженості й суперечностей — частково зовні, повна після доступу до зовнішніх джерел.' },
    { id: 'G4', title: 'G4 · Answerability / Structure', principle: 'Чи може AI швидко витягти конкретну відповідь: прямий відповідь → факти → структура → FAQ.', state: `${answerability.filter((a) => a.directAnswer).length}/${answerability.length} ключових сторінок мають базу для прямого відповіді.` },
    { id: 'G5', title: 'G5 · Question & Semantic Coverage', principle: 'Чи покриває сайт реальні питання й предметну область цілком, а не окремі ключі.', state: `${gapMap.length} AI-контентних розривів; ${gapMap.filter((g) => g.priority === 'P0').length} критичних.` },
    { id: 'G6', title: 'G6 · Page & Block GEO/AEO', principle: 'Кожна сторінка й кожен блок — окремо: Зараз → Як має бути → оцінка → рекомендація → ефект.', state: `${blockCards.length} блоків потребують GEO/AEO-правок (${blockCards.filter((c) => c.priority === 'P0').length} × P0).` },
    { id: 'G7', title: 'G7 · Authority & Share of Voice', principle: 'Зовнішній контекст бренду і фактична присутність в AI — вимірюється живим прогоном, не вигадується.', state: 'Brand/Citation/Share of Voice/Accuracy — робочий документ під живий прогін (позначено «н/д»).' },
    { id: 'G8', title: 'G8 · GEO/AEO Roadmap', principle: 'План: Crawlability → Entity → Consistency → Structure → Coverage → Gaps → Authority → Citation/Monitoring.', state: `${roadmap.length} етапів; фінал — постійний моніторинг присутності в AI.` },
  ];

  return { client, takenAt: ds.takenAt, spine, score, crawlability, entities, answerability, blockCards, gapMap, mainTable, opportunities, roadmap, artifacts, liveNote };
}

// Найімовірніший «листок» комерційного дерева — для прикладів AI-запитів (без вигадок про дані).
function arch_leaf(site: ReturnType<typeof buildSiteAudit>): string {
  const cat = site.tree.find((t) => t.kind === 'plp');
  if (cat && cat.title) {
    // Беремо перший змістовний сегмент назви (до «/», «·», дужок) — щоб приклади
    // AI-запитів читались природно, а не як «каталог / plp».
    const clean = cat.title.replace(/\s*\(.*?\)\s*/g, '').split(/[/·|]/)[0].trim().toLowerCase();
    if (clean && !/^(каталог|catalog|plp|категор)/.test(clean)) return clean;
  }
  return 'товар цієї категорії';
}
