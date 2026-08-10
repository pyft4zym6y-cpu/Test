/**
 * Модель постраничного аудита по эталону (как в PDF-эталонах weexp): на каждый
 * тип страницы — эталонный прототип (блоки) и разбор текущей страницы блок-за-блоком
 * с 3-состоянием (есть / проверить / нет), оценкой и тегами 18 измерений; дерево
 * сайта с постраничными оценками; системные дефекты (сквозные по сайту); приоритет
 * доработок; общий вывод. Питает HTML→PDF-отчёт (export/htmlReport.ts).
 *
 * Данные — из обхода (PageAudit.ux.blocks + checks) и эталона (REFERENCE из
 * prototype.ts). Слой L0: «не обнаружено» ≠ «отсутствует» — часть блоков помечается
 * «проверить», а не «нет».
 */
import type { AuditDataset } from './report.js';
import type { PageAudit, PageKind } from './crawl.js';
import { REFERENCE, type Weight } from './prototype.js';

/** 18 измерений метода (та же таксономия, что в эталонах). */
export const DIMS = {
  TECH: 'Техника', PERF: 'Скорость', SEO: 'Поиск', AEO: 'Прямые ответы', GEO: 'AI-выдача',
  UX: 'UX', A11Y: 'Доступность', CONT: 'Контент', COMM: 'Коммуникация', MKT: 'Маркетинг',
  ANL: 'Аналитика', COMP: 'Конкуренты', LINK: 'Перелинковка', SEC: 'Безопасность',
  LAW: 'Право', PRICE: 'Цена', CRO: 'Конверсия', MOB: 'Мобильные',
} as const;
export type Dim = keyof typeof DIMS;

/** Привязка блока эталона к измерениям (по смыслу из эталонных прототипов). */
const DIM_BY_BLOCK: Record<string, Dim[]> = {
  nav: ['UX', 'LINK', 'SEO'], search: ['UX', 'SEO'], hero: ['CRO', 'MKT', 'COMM'],
  usp_bar: ['COMM', 'CRO'], product_grid: ['UX', 'CRO'], trust: ['COMM', 'CRO', 'SEC'],
  reviews: ['COMM', 'AEO', 'CRO'], newsletter: ['MKT', 'CRO'], footer_contacts: ['COMM', 'LAW', 'LINK'],
  breadcrumbs: ['SEO', 'UX', 'LINK'], category_title: ['SEO', 'UX'], category_description: ['SEO', 'CONT', 'AEO'],
  product_count: ['UX'], filters: ['UX', 'CRO'], sort: ['UX'], view_toggle: ['UX'],
  pagination: ['SEO', 'UX'], faq: ['AEO', 'GEO', 'CONT'],
  product_header: ['SEO', 'AEO', 'A11Y'], gallery: ['UX', 'PERF', 'CRO'], price: ['PRICE', 'CRO', 'CONT'],
  add_to_cart: ['CRO', 'MOB', 'A11Y'], variants: ['UX', 'ANL', 'CONT'], delivery: ['COMM', 'CRO', 'LAW'],
  payment: ['COMM', 'SEC', 'CRO'], description: ['CONT', 'GEO', 'COMP'], specifications: ['CONT', 'AEO', 'UX'],
  qa: ['AEO', 'GEO', 'COMM'], video: ['CONT', 'CRO'], related: ['CRO', 'LINK', 'PRICE'],
  recently_viewed: ['CRO', 'LINK'], author: ['CONT', 'GEO'], toc: ['UX', 'A11Y'], share: ['MKT', 'LINK'],
  qty_control: ['UX', 'CRO'], wishlist: ['CRO', 'LINK'], promo_code: ['CRO', 'PRICE'],
  delivery_calc: ['COMM', 'CRO', 'LAW'], order_summary: ['CRO', 'COMM'], continue_shopping: ['UX', 'LINK'],
  contact_form: ['CRO', 'COMM', 'A11Y'], delivery_selection: ['CRO', 'COMM'], payment_selection: ['CRO', 'SEC'],
  guest_checkout: ['CRO', 'UX'],
};

export type BlockState = 'ok' | 'check' | 'gap'; // ✅ есть · ⚪ проверить · 🔴 нет
export type BlockRow = {
  name: string; role: string; chapter: string; weight: Weight; dims: Dim[];
  state: BlockState; score: number; max: number; wordVerdict: string;
};
export type PageReport = {
  kind: PageKind; title: string; chapter: string; principle?: string; url: string;
  conclusion: string;     // заголовок-вывод (A0 §8: заголовок = управленческий вывод)
  screenshot?: string;    // первый экран (base64 jpeg) — для скриншота слева (A0 §9)
  score: number; max: number; complianceScore: number | null; // score голд-стандарта страницы (%)
  counts: { ok: number; check: number; gap: number };
  rows: BlockRow[];
  strong: string[];       // что сделано сильно
  fixes: { what: string; crit: 'Блокирующая' | 'Высокая' | 'Средняя'; why: string }[];
};
export type SiteTreeRow = { title: string; url: string; kind: PageKind; score: number; max: number; pct: number };
export type SystemicDefect = { title: string; detail: string; dims: Dim[] };
export type SiteAuditReport = {
  client: string;
  takenAt: string;
  tier: number;
  pages: PageReport[];
  tree: SiteTreeRow[];
  totalScore: number; totalMax: number; totalPct: number;
  systemic: SystemicDefect[];
  verdict: string;
};

const MAX_BY_WEIGHT: Record<Weight, number> = { core: 4, important: 3, nice: 2 };
const WORD: Record<BlockState, string> = { ok: 'сильно', check: 'проверить', gap: 'нет' };
const CRIT_BY_WEIGHT: Record<Weight, 'Блокирующая' | 'Высокая' | 'Средняя'> = { core: 'Блокирующая', important: 'Высокая', nice: 'Средняя' };
// Блоки, которые на L0 (внешний обход) достоверно не подтвердить при отсутствии —
// помечаем «проверить», а не «нет» (могут быть за табом/в JS/размётке).
const L0_UNCERTAIN = new Set(['qa', 'specifications', 'description', 'category_description', 'faq', 'variants']);

const KIND_LABEL: Record<PageKind, string> = {
  home: 'Главная', plp: 'Каталог', pdp: 'Карточка', cart: 'Корзина', checkout: 'Чекаут', content: 'Контент', other: 'Прочее',
};

function buildPage(p: PageAudit): PageReport | null {
  const ref = REFERENCE[p.kind];
  if (!ref) return null;
  const present = p.ux?.blocks ?? {};
  const rows: BlockRow[] = ref.blocks.map((b) => {
    const has = Boolean(present[b.key]);
    const state: BlockState = has ? 'ok' : (b.weight === 'nice' || L0_UNCERTAIN.has(b.key) ? 'check' : 'gap');
    const max = MAX_BY_WEIGHT[b.weight];
    const score = state === 'ok' ? max : state === 'check' ? 1 : 0;
    return { name: b.name, role: b.role, chapter: b.chapter, weight: b.weight, dims: DIM_BY_BLOCK[b.key] ?? ['UX'], state, score, max, wordVerdict: WORD[state] };
  });
  const score = rows.reduce((s, r) => s + r.score, 0);
  const max = rows.reduce((s, r) => s + r.max, 0);
  const counts = { ok: rows.filter((r) => r.state === 'ok').length, check: rows.filter((r) => r.state === 'check').length, gap: rows.filter((r) => r.state === 'gap').length };
  const strong = rows.filter((r) => r.state === 'ok' && r.weight !== 'nice').map((r) => r.name);
  const fixes = rows.filter((r) => r.state === 'gap').sort((a, b) => b.max - a.max)
    .map((r) => ({ what: `Добавить: ${r.name}`, crit: CRIT_BY_WEIGHT[r.weight], why: r.role }));
  const pct = max ? Math.round((score / max) * 100) : 0;
  const conclusion = pageConclusion(ref.title, rows, pct);
  return { kind: p.kind, title: ref.title, chapter: ref.chapter, principle: ref.principle, url: p.finalUrl || p.url, conclusion, screenshot: p.screenshot, score, max, complianceScore: p.score, counts, rows, strong, fixes };
}

/** Заголовок-вывод страницы (A0 §8): не «Карточка товара», а управленческий вывод. */
function pageConclusion(title: string, rows: BlockRow[], pct: number): string {
  const gaps = rows.filter((r) => r.state === 'gap').map((r) => r.name.toLowerCase());
  const has = (re: RegExp) => gaps.some((g) => re.test(g));
  const trust = has(/довери|отзыв|гаран/);
  const nav = has(/поиск|фильтр|навигац|перелин|похож|cross|related/);
  if (pct >= 75) return `${title}: близко к эталону — доработки точечные`;
  if (trust && nav) return `${title} не снимает возражения и не ведёт дальше: провалены доверие и путь к решению`;
  if (trust) return `${title} теряет доверие: не хватает отзывов/гарантий в точке решения`;
  if (nav) return `${title}: путь клиента рвётся — нет выходов и перелинковки`;
  if (pct < 40) return `${title}: каркас есть, но ключевые блоки эталона отсутствуют`;
  return `${title}: структура рабочая, но не достроена до эталона`;
}

/** Сквозные (системные) дефекты: проверки голд-стандарта, проваленные на ВСЕХ разобранных страницах. */
function systemicDefects(ds: AuditDataset): SystemicDefect[] {
  const pages = ds.client.pages.filter((p) => !p.error && p.checks.length);
  if (pages.length < 2) return [];
  const out: SystemicDefect[] = [];
  const byId = new Map<string, { label: string; group: string; fail: number }>();
  for (const p of pages) for (const c of p.checks) {
    const cur = byId.get(c.id) ?? { label: c.label, group: c.group, fail: 0 };
    if (!c.pass) cur.fail += 1;
    byId.set(c.id, cur);
  }
  const DIM_BY_GROUP: Record<string, Dim[]> = { SEO: ['SEO'], UX: ['UX', 'CRO'], 'Техника': ['TECH'] };
  for (const [, v] of byId) {
    if (v.fail === pages.length) out.push({ title: `«${v.label}» не выполнено ни на одной странице`, detail: `Дефект живёт в шаблоне/настройках, а не на отдельной странице — правится один раз, эффект на всём сайте.`, dims: DIM_BY_GROUP[v.group] ?? ['TECH'] });
  }
  // Аналитика/платформа как системный сигнал.
  if (!ds.client.tech.analytics.length) out.push({ title: 'Аналитика не обнаружена (GA4/GTM/Pixel)', detail: 'Без событий невозможно измерять воронку — рекомендации нельзя проверить деньгами.', dims: ['ANL'] });
  if (!ds.client.sitemapXml) out.push({ title: 'Нет sitemap.xml', detail: 'Хуже индексация всего каталога — системный SEO-риск.', dims: ['SEO', 'TECH'] });
  return out.slice(0, 6);
}

function verdictLine(pct: number): string {
  if (pct >= 75) return 'Витрина близка к эталону — точечные доработки поднимут конверсию.';
  if (pct >= 55) return 'Правильный каркас, но ключевые блоки доверия и пути к решению не достроены.';
  if (pct >= 35) return 'Базовая структура есть, теряются доверие, ответы на возражения и перелинковка — двузначный разрыв конверсии.';
  return 'Витрина далеко от эталона: рвётся путь клиента на большинстве типов страниц.';
}

/** Собирает полную модель постраничного аудита по эталону. */
export function buildSiteAudit(ds: AuditDataset): SiteAuditReport {
  const seen = new Set<PageKind>();
  const pages: PageReport[] = [];
  const tree: SiteTreeRow[] = [];
  for (const p of ds.client.pages) {
    if (p.error || !p.checks.length) continue;
    const pr = seen.has(p.kind) ? null : buildPage(p);
    if (pr) { pages.push(pr); seen.add(p.kind); tree.push({ title: pr.title, url: pr.url, kind: p.kind, score: pr.score, max: pr.max, pct: pr.max ? Math.round((pr.score / pr.max) * 100) : 0 }); }
    else if (REFERENCE[p.kind]) {
      // тип уже разобран — в дерево добавим краткой строкой по compliance
      const ref = REFERENCE[p.kind]!;
      tree.push({ title: `${ref.title} (доп.)`, url: p.finalUrl || p.url, kind: p.kind, score: 0, max: 0, pct: p.score ?? 0 });
    }
  }
  const totalScore = pages.reduce((s, p) => s + p.score, 0);
  const totalMax = pages.reduce((s, p) => s + p.max, 0);
  const totalPct = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  return { client, takenAt: ds.takenAt, tier: ds.tier, pages, tree, totalScore, totalMax, totalPct, systemic: systemicDefects(ds), verdict: verdictLine(totalPct) };
}

export { KIND_LABEL };
