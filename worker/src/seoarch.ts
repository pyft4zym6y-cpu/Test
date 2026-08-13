/**
 * SEO Architecture A0 (A0 §10): видимое дерево сайта → проблемные узлы →
 * рекомендуемое действие. На слое L0 строится из внутренних ссылок обхода
 * (структурные дефекты — параметрические дубли, глубина, назначение узлов —
 * видны из одних URL) плюс on-page SEO-проблемы с разобранных страниц.
 */
import type { AuditDataset } from './report.js';
import type { Dim } from './pagereport.js';

export type Purpose = 'commercial' | 'informational' | 'system';
export type TreeNode = { label: string; path: string; count: number; purpose: Purpose; params: number; severity: 'ok' | 'check' | 'gap'; note: string };
export type SeoIssue = { node: string; level: number; purpose: Purpose; problem: string; dupes: string; index: string; action: string; dims: Dim[] };
export type OnPageCell = { ok: boolean; note: string };
export type OnPageRow = { url: string; kind: string; cells: Record<string, OnPageCell> };
export type SeoArchReport = {
  client: string; takenAt: string;
  totals: { links: number; l1: number; paramUrls: number; maxDepth: number; crawled: number };
  indexability: { robots: boolean; sitemap: boolean };
  tree: TreeNode[];
  issues: SeoIssue[];
  onpage: OnPageRow[];
  recommended: string[];
  verdict: string;
};

/** Постраничный on-page срез с фактическими значениями (длина title/description,
 *  число H1 и т.д.) — «слабый SEO-аудит» лечится конкретикой, а не статусами. */
export const ONPAGE_COLS = ['title', 'desc', 'h1', 'canonical', 'schema-product', 'schema-crumbs', 'og'] as const;
export const ONPAGE_LABEL: Record<string, string> = { title: 'Title', desc: 'Description', h1: 'H1', canonical: 'Canonical', 'schema-product': 'Schema Product', 'schema-crumbs': 'Schema Crumbs', og: 'Open Graph' };

function purposeOf(path: string): Purpose {
  if (/(catalog|katalog|category|categor|shop|collection|product|tovar|goods|\/p\/|item|cart|korzina|basket|checkout|order|oform)/i.test(path)) return 'commercial';
  if (/(blog|article|news|about|o-nas|faq|help|dostavka|delivery|payment|oplata|contact|kontakt|guide|care|dogляд|догляд|reviews)/i.test(path)) return 'informational';
  if (/(account|login|signin|register|search|poisk|wp-|admin|tag|cdn|feed|cart\b)/i.test(path)) return 'system';
  return 'informational';
}
const PURPOSE_LABEL: Record<Purpose, string> = { commercial: 'комерційний', informational: 'інформаційний', system: 'системний' };

function segsOf(url: string): { path: string; segs: string[]; hasParams: boolean } {
  try { const u = new URL(url); const segs = u.pathname.split('/').filter(Boolean); return { path: u.pathname, segs, hasParams: u.search.length > 1 }; }
  catch { return { path: url, segs: [], hasParams: false }; }
}

export function buildSeoArch(ds: AuditDataset): SeoArchReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const links = ds.client.links ?? [];
  const parsed = links.map(segsOf);
  const paramUrls = parsed.filter((p) => p.hasParams).length;
  const maxDepth = parsed.reduce((m, p) => Math.max(m, p.segs.length), 0);

  // Назначение узла надёжнее по типу разобранной страницы, чем по ключевым словам
  // (не знает локальных товарных слов). L1-сегмент коммерческого типа страницы → коммерческий.
  const commercialSegs = new Set<string>();
  for (const p of ds.client.pages) {
    if (['plp', 'pdp', 'cart', 'checkout'].includes(p.kind)) { const s = segsOf(p.finalUrl || p.url).segs[0]; if (s) commercialSegs.add(s); }
  }
  const purposeFor = (path: string, params = 0): Purpose => {
    const s = segsOf(path).segs[0] ?? '';
    if (commercialSegs.has(s)) return 'commercial';
    if (params >= 8) return 'commercial'; // фасетный раздел с параметрами — почти всегда каталог
    return purposeOf(path);
  };

  // Группировка по L1-сегменту. Одиночные дефисные слаги в корне — почти всегда
  // товары/страницы с SEO-URL (прод-кейс: 755 «разделов» по 1 URL) — агрегируем
  // в один узел, а не раздуваем дерево.
  const groups = new Map<string, { count: number; params: number; children: Set<string>; purpose: Purpose }>();
  let rootSlugCount = 0;
  for (const p of parsed) {
    const l1 = p.segs[0] ?? '/';
    if (p.segs.length === 1 && /-/.test(l1) && l1.length >= 10) { rootSlugCount++; continue; }
    const g = groups.get(l1) ?? { count: 0, params: 0, children: new Set<string>(), purpose: 'informational' as Purpose };
    g.count += 1; if (p.hasParams) g.params += 1; if (p.segs[1]) g.children.add(p.segs[1]);
    groups.set(l1, g);
  }
  const tree: TreeNode[] = Array.from(groups.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 12).map(([label, g]) => {
    const severity: TreeNode['severity'] = g.params >= 8 ? 'gap' : g.params >= 3 ? 'check' : 'ok';
    const note = g.params >= 3 ? `${g.params} URL з параметрами — ризик дублів` : `${g.children.size} підрозд.`;
    return { label: label === '/' ? '(корінь)' : `/${label}/`, path: '/' + label, count: g.count, purpose: purposeFor('/' + label, g.params), params: g.params, severity, note };
  });
  if (rootSlugCount >= 20) tree.unshift({ label: '(слаги в корені — ймовірно товари)', path: '/', count: rootSlugCount, purpose: 'commercial', params: 0, severity: 'check', note: `${rootSlugCount} поодиноких URL у корені — картки з SEO-адресами; підтвердити розбором PDP` });

  // Проблемные узлы (§10): on-page с разобранных страниц + структурные.
  const issues: SeoIssue[] = [];
  const SEO_LABEL: Record<string, string> = { title: 'Title', desc: 'Meta description', canonical: 'Canonical', h1: 'H1', 'schema-product': 'Schema Product', 'schema-org': 'Schema Organization', og: 'Open Graph', hreflang: 'hreflang', noindex: 'noindex' };
  for (const p of ds.client.pages) {
    if (p.error || !p.checks.length) continue;
    const { segs, path } = segsOf(p.finalUrl || p.url);
    const purpose = purposeFor(path);
    // Не требовать товарную разметку от контентных страниц, Organization — не с главной:
    // иначе шум «Schema Product на /about» хоронит реальные проблемы.
    const fails = p.checks.filter((c) => {
      if (c.group !== 'SEO' || c.pass) return false;
      if (c.id === 'schema-product') return p.kind === 'pdp' || p.kind === 'plp';
      if (c.id === 'schema-org') return p.kind === 'home';
      if (c.id === 'hreflang') return false; // сайт-уровневая настройка — не постраничная проблема
      return true;
    }).map((c) => SEO_LABEL[c.id] ?? c.label);
    if (!fails.length) continue;
    issues.push({ node: path || '/', level: Math.max(1, segs.length), purpose, problem: `Поза нормою: ${fails.join(', ')}`, dupes: '—', index: ds.client.sitemapXml ? 'у sitemap' : 'немає sitemap', action: 'Заповнити мета/розмітку на шаблоні типу сторінки', dims: ['SEO', 'TECH'] });
  }
  // Структурные дефекты из дерева.
  const paramNode = tree.find((t) => t.severity === 'gap');
  if (paramNode) issues.push({ node: paramNode.path, level: 1, purpose: paramNode.purpose, problem: `Параметричні дублі: ${paramNode.params} URL з параметрами в одному розділі`, dupes: 'так', index: 'ризик роздування індексу', action: 'Canonical на базову сторінку, фасети закрити від індексації/через robots', dims: ['SEO', 'TECH'] });
  if (maxDepth >= 4) issues.push({ node: `глибина ${maxDepth}`, level: maxDepth, purpose: 'commercial', problem: 'Глибока вкладеність каталогу — важливі сторінки далеко від кореня', dupes: '—', index: 'гірше сканується', action: 'Сплостити дерево, додати хаби/перелінковку', dims: ['SEO', 'LINK'] });
  if (!ds.client.sitemapXml) issues.push({ node: '/sitemap.xml', level: 1, purpose: 'system', problem: 'Немає sitemap.xml', dupes: '—', index: 'немає карти для пошуковика', action: 'Згенерувати й надіслати sitemap.xml у Search Console', dims: ['SEO', 'TECH'] });

  // Постраничный on-page: фактические значения из проверок (detail).
  const KIND_RU: Record<string, string> = { home: 'Головна', plp: 'Каталог', pdp: 'Картка', cart: 'Кошик', checkout: 'Оформлення', content: 'Контент', faq: 'FAQ', other: 'Інше' };
  const onpage: OnPageRow[] = ds.client.pages.filter((p) => !p.error && p.checks.length).map((p) => {
    const { path } = segsOf(p.finalUrl || p.url);
    const cells: Record<string, OnPageCell> = {};
    for (const id of ONPAGE_COLS) {
      const c = p.checks.find((x) => x.id === id);
      if (!c) { cells[id] = { ok: false, note: '—' }; continue; }
      // Schema Product требуем только там, где он уместен — на остальных «н/з».
      if (id === 'schema-product' && !['pdp', 'plp'].includes(p.kind)) { cells[id] = { ok: true, note: 'н/з' }; continue; }
      cells[id] = { ok: c.pass, note: c.detail ?? (c.pass ? 'є' : 'немає') };
    }
    return { url: path || '/', kind: KIND_RU[p.kind] ?? p.kind, cells };
  });

  const recommended: string[] = [
    'Одна модель = одна картка (canonical), варіанти — параметром; прибрати дублі «колір як сторінка»',
    'Категорії з унікальним H1 + SEO-описом як посадкові під тематичні запити',
    ds.client.sitemapXml ? 'Тримати sitemap.xml в актуальному стані' : 'Додати sitemap.xml і robots-директиви для фасетів',
    'Хлібні крихти з розміткою на всіх рівнях + перелінковка довгого хвоста',
  ];
  const paramShare = links.length ? Math.round((paramUrls / links.length) * 100) : 0;
  const verdict = !links.length ? 'Дерево не зібрано — сайт недоступний/тонкий обхід.'
    : paramShare >= 25 ? `Дерево засмічене параметрами (${paramShare}% URL) — пріоритет: канонізація і контроль фасетів.`
    : issues.length ? 'Каркас дерева читабельний, але є вузли з SEO-прогалинами й структурними ризиками.'
    : 'Структура дерева загалом здорова за зовнішніми ознаками.';

  return { client, takenAt: ds.takenAt, totals: { links: links.length, l1: groups.size, paramUrls, maxDepth, crawled: ds.client.pages.filter((p) => !p.error).length }, indexability: { robots: ds.client.robotsTxt, sitemap: ds.client.sitemapXml }, tree, issues, onpage, recommended, verdict };
}
