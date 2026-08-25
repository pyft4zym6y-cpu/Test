/**
 * PAGE AUDIT — системний аудит кожної сторінки як самостійного digital-продукту
 * і як ОДИНИЦІ БІЗНЕСУ. Об'єднує UX/UI/Content/SEO/GEO/CRO/Trust/Tech на рівні
 * конкретної сторінки й показує цілісний стан.
 *
 * Structure-аудит відповідає «які сторінки МАЮТЬ існувати». Page Audit — «наскільки
 * кожна конкретна сторінка виконує свою задачу для бізнесу, користувача, SEO,
 * контенту й конверсії». Кожна сторінка отримує картку з 7 питаннями:
 * навіщо · для кого · який Intent · яку дію · що заважає · Golden Standard · що змінити.
 *
 * Детермінований: спирається на site-audit (поблоковий розбір + голд-стандарт),
 * on-page checks і сигнали обходу. Трафік/конверсія/revenue/аналітика — вхід із
 * GA/Search Console, позначено «н/д» (без вигаданих цифр).
 */
import type { AuditDataset } from './report.js';
import type { PageKind, PageAudit } from './crawl.js';
import { buildSiteAudit, type PageReport } from './pagereport.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type PageLayer = { id: string; title: string; principle: string; state: string };
export type DimScore = { key: string; label: string; score: number; measured: boolean };
export type PageCard = {
  page: string; url: string; kind: PageKind;
  purpose: string;        // навіщо існує (стратегічна роль)
  businessRole: string;   // вклад у бізнес
  userIntent: string;     // для кого / який Intent
  goal: string;           // яку дію має викликати
  currentState: string;   // що є зараз
  problems: string[];     // що не працює
  golden: string;         // як має бути (Golden Standard)
  gap: string[];          // чого бракує (елементи голд-стандарту)
  recommendation: string;
  effect: string;
  dims: DimScore[];       // 16 напрямів
  overall: number;        // Page Health Score
  priority: Priority;
};
export type MatrixRow = { page: string; strategic: number; ux: number; content: number; seo: number; cro: number; tech: number; overall: number };
export type PortfolioRow = { bucket: string; pages: string[]; note: string };
export type PageArtifact = { n: number; name: string; source: 'обхід' | 'GA/SC' };

export type PageFlowReport = {
  client: string; takenAt: string;
  spine: PageLayer[];
  matrix: MatrixRow[];
  cards: PageCard[];
  purposeMap: { page: string; purpose: string; businessRole: string; intent: string }[];
  portfolio: PortfolioRow[];
  opportunityNote: string;
  roadmap: { phase: string; pages: string }[];
  artifacts: PageArtifact[];
  overall: number;
  contextNote: string;
};

const KIND_LABEL: Record<PageKind, string> = { home: 'Головна', plp: 'Категорія', pdp: 'Картка товару', cart: 'Кошик', checkout: 'Оформлення', content: 'Стаття', faq: 'FAQ', other: 'Службова' };
const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));

// Стратегічна роль / Intent / ціль за типом сторінки.
const PURPOSE: Partial<Record<PageKind, { purpose: string; role: string; intent: string; goal: string; golden: string }>> = {
  home: { purpose: 'Positioning + Discovery', role: 'Формує довіру й веде в каталог; вхід для більшості джерел', intent: 'Зрозуміти «куди я потрапив» і знайти напрям', goal: 'Перехід у каталог / підбірку', golden: 'Оффер+УТП → категорії/осі → добірки → довіра → відгуки → FAQ → SEO-контент → футер.' },
  plp: { purpose: 'Product Discovery + SEO', role: 'Збирає органіку за категорійними запитами й веде в товар', intent: 'Звузити вибір і перейти в потрібний товар', goal: 'Перехід у картку товару', golden: 'Крихти → H1 → інтро → підкатегорії → фільтри → сортування → сітка → УТП → SEO-текст → FAQ → суміжні категорії.' },
  pdp: { purpose: 'Decision + Purchase', role: 'Основна продажна сторінка: рішення й транзакція', intent: 'Вирішити «чи підійде» і купити', goal: 'Додати в кошик / купити', golden: 'Крихти → галерея → заголовок → ціна → наявність → варіанти → CTA → доставка → переваги → опис → характеристики → відгуки → FAQ → related → cross-sell.' },
  content: { purpose: 'Acquisition + Authority', role: 'Верхня воронка, органіка, E-E-A-T, перелінковка в каталог', intent: 'Розібратись у питанні / як обрати', goal: 'Перехід у категорію/товар', golden: 'H1(питання) → прямий відповідь → зміст → розділи → факти → автор/дата → related → виходи в каталог.' },
  faq: { purpose: 'Objection Handling + AEO', role: 'Знімає заперечення, годує AI-видачу, розвантажує підтримку', intent: 'Отримати відповідь на питання вибору', goal: 'Зняти сумнів → перехід у товар', golden: 'Пошук/H1 → категорії питань → прямі відповіді (FAQPage) → виходи в каталог/умови.' },
  checkout: { purpose: 'Transaction', role: 'Завершення покупки — фінальний крок воронки', intent: 'Оформити замовлення без тертя', goal: 'Завершити замовлення', golden: 'Підсумок → контактні дані → доставка → оплата → гостьове оформлення → елементи довіри.' },
};

const chk = (p: PageAudit | undefined, id: string) => !!p?.checks.find((c) => c.id === id)?.pass;

export function buildPageFlow(ds: AuditDataset): PageFlowReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const site = buildSiteAudit(ds);
  const byUrl = new Map<string, PageAudit>();
  for (const p of ds.client.pages) if (!p.error) byUrl.set(p.finalUrl || p.url, p);
  const analyticsPresent = (ds.client.tech?.analytics ?? []).length > 0;

  const cards: PageCard[] = [];
  for (const pr of site.pages) {
    const meta = PURPOSE[pr.kind];
    if (!meta) continue;
    const pa = byUrl.get(pr.url);
    const pct = pr.complianceScore ?? (pr.max ? Math.round((pr.score / pr.max) * 100) : 0);
    const has = (k: string) => pr.rows.some((r) => r.key === k && r.state === 'ok');
    const total = pr.counts.ok + pr.counts.weak + pr.counts.check + pr.counts.gap || 1;
    const okShare = pr.counts.ok / total;

    // 16 напрямів (0..10). Analytics — н/д (немає GA/SC-даних per-page).
    const seoScore = clamp10((chk(pa, 'title') ? 2.5 : 0) + (chk(pa, 'h1') ? 2.5 : 0) + (chk(pa, 'desc') ? 1.5 : 0) + (chk(pa, 'canonical') ? 1.5 : 0) + (chk(pa, 'schema-crumbs') || chk(pa, 'schema-product') ? 2 : 0));
    const geoScore = clamp10((has('faq') || pr.kind === 'faq' ? 3 : 0) + (has('description') ? 3 : 0) + (has('specifications') ? 2 : 0) + (chk(pa, 'schema-product') ? 2 : 0));
    const croBlocks = pr.kind === 'pdp' ? ['add_to_cart', 'price', 'trust'] : pr.kind === 'plp' ? ['product_grid', 'filters'] : pr.kind === 'home' ? ['hero', 'usp_bar'] : ['related'];
    const croScore = clamp10(4 + croBlocks.filter((k) => has(k)).length / croBlocks.length * 6);
    const trustScore = clamp10((has('trust') ? 4 : 1) + (has('reviews') ? 3 : 0) + (has('footer_contacts') ? 2 : 0));
    const navScore = clamp10((has('breadcrumbs') ? 4 : 1) + (has('nav') ? 3 : 0) + (has('search') ? 2 : 0));
    const linkScore = clamp10((has('breadcrumbs') ? 3 : 0) + (has('related') ? 4 : 1) + (has('category_description') ? 2 : 0));
    const techScore = clamp10((pa && pa.status === 200 ? 4 : 1) + (chk(pa, 'canonical') ? 2 : 0) + (chk(pa, 'noindex') ? 2 : 0) + (ds.client.soft404 ? 0 : 2));
    const mobileScore = clamp10((chk(pa, 'viewport') ? 6 : 2) + ((pa?.ux?.smallTapTargets ?? 0) <= 3 ? 3 : 0));
    const uxScore = clamp10(okShare * 6 + (has('breadcrumbs') ? 1 : 0) + ((pa?.ux?.headingLevels ?? 0) >= 2 ? 2 : 0));
    const uiScore = clamp10(4 + okShare * 4 + ((pa?.ux?.distinctButtonColors ?? 0) >= 1 ? 1 : 0));
    const contentScore = clamp10(okShare * 7 + (has('description') || has('category_description') ? 1.5 : 0));
    const a11yScore = clamp10((chk(pa, 'alt') ? 3 : 1) + (chk(pa, 'viewport') ? 2 : 0) + ((pa?.ux?.baseFontPx ?? 16) >= 14 ? 2 : 0) + 2);
    const strategicFit = clamp10(pct / 10);
    const intentFit = clamp10((pct / 10) * 0.6 + (has('hero') || has('product_header') || has('category_title') || pr.kind === 'faq' ? 4 : 1));
    const bizValue = clamp10((pr.kind === 'pdp' || pr.kind === 'plp' || pr.kind === 'checkout' ? 8 : pr.kind === 'home' ? 7 : 5) * 0.6 + strategicFit * 0.4);

    const dims: DimScore[] = [
      { key: 'strategic', label: 'Strategic Fit', score: strategicFit, measured: true },
      { key: 'intent', label: 'User Intent', score: intentFit, measured: true },
      { key: 'ux', label: 'UX', score: uxScore, measured: true },
      { key: 'ui', label: 'UI', score: uiScore, measured: true },
      { key: 'content', label: 'Content', score: contentScore, measured: true },
      { key: 'seo', label: 'SEO', score: seoScore, measured: true },
      { key: 'geo', label: 'GEO/AEO', score: geoScore, measured: true },
      { key: 'cro', label: 'CRO', score: croScore, measured: true },
      { key: 'trust', label: 'Trust', score: trustScore, measured: true },
      { key: 'nav', label: 'Navigation', score: navScore, measured: true },
      { key: 'link', label: 'Internal Linking', score: linkScore, measured: true },
      { key: 'tech', label: 'Technical Health', score: techScore, measured: true },
      { key: 'mobile', label: 'Mobile', score: mobileScore, measured: true },
      { key: 'a11y', label: 'Accessibility', score: a11yScore, measured: true },
      { key: 'analytics', label: 'Analytics', score: analyticsPresent ? 5 : 0, measured: analyticsPresent },
      { key: 'bizvalue', label: 'Business Value', score: bizValue, measured: true },
    ];
    const measured = dims.filter((d) => d.measured);
    const overall = clamp10(measured.reduce((s, d) => s + d.score, 0) / measured.length);

    // Проблеми й gap — з поблокового розбору.
    const gapRows = pr.rows.filter((r) => r.state === 'gap' && (r.weight === 'core' || r.weight === 'important'));
    const weakRows = pr.rows.filter((r) => r.state === 'weak' && r.weight === 'core');
    const problems: string[] = [];
    for (const r of gapRows.slice(0, 3)) problems.push(`Немає блоку «${r.name}» — ${r.role.toLowerCase()}`);
    for (const r of weakRows.slice(0, 2)) problems.push(`«${r.name}» не за еталоном`);
    if (!chk(pa, 'title') || !chk(pa, 'h1')) problems.push('On-page: Title/H1 поза нормою');
    const gap = gapRows.map((r) => r.name).slice(0, 6);

    const worst = [...dims].filter((d) => d.measured).sort((a, b) => a.score - b.score)[0];
    const priority: Priority = overall < 5 ? 'P0' : overall < 6.5 ? 'P1' : overall < 8 ? 'P2' : 'P3';

    cards.push({
      page: KIND_LABEL[pr.kind], url: pr.url, kind: pr.kind,
      purpose: meta.purpose, businessRole: meta.role, userIntent: meta.intent, goal: meta.goal,
      currentState: `Відповідність голд-стандарту ${pct}%; блоків за еталоном ${pr.counts.ok}/${total}. ${pr.conclusion}`.slice(0, 220),
      problems: problems.length ? problems : ['Критичних проблем не виявлено — тонке налаштування'],
      golden: meta.golden,
      gap: gap.length ? gap : ['Ключові елементи присутні'],
      recommendation: gapRows.length ? `Закрити відсутні елементи (${gapRows.slice(0, 3).map((r) => r.name).join(', ')}) і довести слабкі до еталона; підтягнути найгіршу вісь — ${worst?.label}.` : `Тонке налаштування; фокус на найгіршій осі — ${worst?.label}.`,
      effect: pr.kind === 'pdp' ? 'Рішення без переходу в пошук → вища конверсія картки' : pr.kind === 'plp' ? 'Глибше проникнення в каталог + органіка' : pr.kind === 'home' ? 'Менше відмов на вході, більше в каталог' : pr.kind === 'faq' ? 'Зняті заперечення + AEO' : 'Більше органіки й переходів у комерцію',
      dims, overall, priority,
    });
  }

  // Page Health Matrix.
  const dimVal = (c: PageCard, key: string) => c.dims.find((d) => d.key === key)?.score ?? 0;
  const matrix: MatrixRow[] = cards.map((c) => ({
    page: c.page, strategic: dimVal(c, 'strategic'), ux: dimVal(c, 'ux'), content: dimVal(c, 'content'),
    seo: dimVal(c, 'seo'), cro: dimVal(c, 'cro'), tech: dimVal(c, 'tech'), overall: c.overall,
  }));

  const purposeMap = cards.map((c) => ({ page: c.page, purpose: c.purpose, businessRole: c.businessRole, intent: c.userIntent }));

  // Page Portfolio (класифікація).
  const core = cards.filter((c) => ['home', 'plp', 'pdp', 'checkout'].includes(c.kind)).map((c) => c.page);
  const acq = cards.filter((c) => ['content', 'plp'].includes(c.kind)).map((c) => c.page);
  const weak = cards.filter((c) => c.overall < 6).map((c) => `${c.page} (${c.overall})`);
  const portfolio: PortfolioRow[] = [
    { bucket: 'CORE · Revenue', pages: cards.filter((c) => c.kind === 'pdp' || c.kind === 'checkout').map((c) => c.page), note: 'Прямі продажі — найвищий пріоритет якості' },
    { bucket: 'CORE · Acquisition', pages: [...new Set(acq)], note: 'Органіка й вхід у воронку' },
    { bucket: 'CORE · Discovery/Brand', pages: cards.filter((c) => c.kind === 'home').map((c) => c.page), note: 'Позиціонування й перший контакт' },
    { bucket: 'Потребують уваги (score < 6)', pages: weak.length ? weak : ['—'], note: 'Кандидати на переробку в першу чергу' },
  ];

  const opportunityNote = 'Page Opportunity Map (High/Low Traffic × Conversion) і Page Priority (Business Value × Traffic × Conversion × Severity) будуються після підключення GA/Search Console: expert-оцінка (цей звіт) зіставляється з фактичною поведінкою. Тут пріоритет виставлено за Business Value × Problem Severity з обходу; трафік/конверсія — «н/д».';

  const roadmap = [
    { phase: 'Phase 1 · Critical Pages', pages: 'Головна · Категорія · Картка товару · Оформлення' },
    { phase: 'Phase 2 · Acquisition', pages: 'SEO-категорії · статті/гайди · бренд-сторінки' },
    { phase: 'Phase 3 · Conversion', pages: 'PDP · категорії · чекаут · форми' },
    { phase: 'Phase 4 · Retention', pages: 'кабінет · лояльність · post-purchase' },
    { phase: 'Phase 5 · Supporting', pages: 'сервіс · FAQ · About · контакти · правові' },
  ];

  const A = (n: number, name: string, source: PageArtifact['source']): PageArtifact => ({ n, name, source });
  const artifacts: PageArtifact[] = [
    A(1, 'Complete Page Inventory', 'обхід'), A(2, 'Page Type Map', 'обхід'), A(3, 'Page Purpose Map', 'обхід'),
    A(4, 'Business Role Map', 'обхід'), A(5, 'User Intent Map', 'обхід'), A(6, 'Page Template Map', 'обхід'),
    A(7, 'Page-by-Page Audit', 'обхід'), A(8, 'Page Health Score', 'обхід'), A(9, 'Page Health Matrix', 'обхід'),
    A(10, 'Golden Standard Pages', 'обхід'), A(11, 'Page Gap Map', 'обхід'), A(12, 'Traffic / Conversion Matrix', 'GA/SC'),
    A(13, 'Page Opportunity Map', 'GA/SC'), A(14, 'Orphan / Dead-End Map', 'обхід'), A(15, 'Page Lifecycle Map', 'обхід'),
    A(16, 'Page Priority Matrix', 'GA/SC'), A(17, 'Page Recommendations', 'обхід'), A(18, 'Page Roadmap', 'обхід'),
    A(19, 'ТЗ на шаблони й сторінки', 'обхід'),
  ];

  const overall = cards.length ? clamp10(cards.reduce((s, c) => s + c.overall, 0) / cards.length) : 0;
  const contextNote = 'Page Audit оцінює сторінку не як набір візуальних елементів, а як ОДИНИЦЮ БІЗНЕСУ: об’єднує UX/UI/Content/SEO/GEO/CRO/Trust/Tech на рівні сторінки. Іде після Structure (що має існувати) і перед Block-аудитом (як працює кожен елемент). Вимірюване з обходу рахуємо детерміновано; трафік/конверсія/revenue/A-B — вхід із GA/Search Console, позначено «н/д».';

  const spine: PageLayer[] = [
    { id: 'PG1', title: 'PG1 · Inventory & Purpose', principle: 'Кожна сторінка має одну основну стратегічну функцію; якщо її не описати одним реченням — сигнал.', state: `${cards.length} ключових типів сторінок розібрано; середній Page Health ${overall}/10.` },
    { id: 'PG2', title: 'PG2 · Intent & Promise', principle: 'Intent користувача = обіцянка сторінки = контент = дія. Головна проблема — прийшов за одним, сторінка про інше.', state: `Найслабший Intent-fit: ${[...cards].sort((a, b) => (a.dims.find((d) => d.key === 'intent')!.score) - (b.dims.find((d) => d.key === 'intent')!.score))[0]?.page ?? '—'}.` },
    { id: 'PG3', title: 'PG3 · Structure & Content Completeness', principle: 'Чи є на сторінці всі елементи для її задачі (Content Requirement Matrix за типом).', state: `Сторінок із критичними gap-елементами: ${cards.filter((c) => c.gap.length && c.gap[0] !== 'Ключові елементи присутні').length}/${cards.length}.` },
    { id: 'PG4', title: 'PG4 · UX · UI · Content', principle: 'Об’єднуємо три лінзи на рівні сторінки — не окремі списки, а цілісний стан.', state: `Середні: UX ${avg(cards, 'ux')}, UI ${avg(cards, 'ui')}, Content ${avg(cards, 'content')}.` },
    { id: 'PG5', title: 'PG5 · SEO · GEO/AEO · CRO · Trust', principle: 'Комерційні й пошукові лінзи сторінки разом: видимість, відповіді, конверсія, довіра.', state: `Середні: SEO ${avg(cards, 'seo')}, GEO ${avg(cards, 'geo')}, CRO ${avg(cards, 'cro')}, Trust ${avg(cards, 'trust')}.` },
    { id: 'PG6', title: 'PG6 · Linking · Technical · Mobile · A11y', principle: 'Технічне здоровʼя й доступність сторінки: входи/виходи, статуси, мобільний, доступність.', state: `Середні: Tech ${avg(cards, 'tech')}, Mobile ${avg(cards, 'mobile')}, Linking ${avg(cards, 'link')}.` },
    { id: 'PG7', title: 'PG7 · Golden Standard & Gap', principle: 'Порівняння з еталоном типу сторінки → gap → рекомендація; Golden Standard адаптується під бізнес.', state: `Сторінок нижче 6/10: ${cards.filter((c) => c.overall < 6).length}; нижче 8/10: ${cards.filter((c) => c.overall < 8).length}.` },
    { id: 'PG8', title: 'PG8 · Score · Priority · Roadmap', principle: 'Page Health Matrix → пріоритет (Business Value × Traffic × Conversion × Severity) → roadmap → ТЗ.', state: `P0 сторінок: ${cards.filter((c) => c.priority === 'P0').length}; артефактів ${artifacts.length} (трафік/конверсія — після GA/SC).` },
  ];

  return { client, takenAt: ds.takenAt, spine, matrix, cards, purposeMap, portfolio, opportunityNote, roadmap, artifacts, overall, contextNote };
}

function avg(cards: PageCard[], key: string): number {
  if (!cards.length) return 0;
  return Math.round((cards.reduce((s, c) => s + (c.dims.find((d) => d.key === key)?.score ?? 0), 0) / cards.length) * 10) / 10;
}
