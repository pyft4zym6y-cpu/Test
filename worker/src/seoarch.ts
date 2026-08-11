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
export type SeoArchReport = {
  client: string; takenAt: string;
  totals: { links: number; l1: number; paramUrls: number; maxDepth: number; crawled: number };
  indexability: { robots: boolean; sitemap: boolean };
  tree: TreeNode[];
  issues: SeoIssue[];
  recommended: string[];
  verdict: string;
};

function purposeOf(path: string): Purpose {
  if (/(catalog|katalog|category|categor|shop|collection|product|tovar|goods|\/p\/|item|cart|korzina|basket|checkout|order|oform)/i.test(path)) return 'commercial';
  if (/(blog|article|news|about|o-nas|faq|help|dostavka|delivery|payment|oplata|contact|kontakt|guide|care|dogляд|догляд|reviews)/i.test(path)) return 'informational';
  if (/(account|login|signin|register|search|poisk|wp-|admin|tag|cdn|feed|cart\b)/i.test(path)) return 'system';
  return 'informational';
}
const PURPOSE_LABEL: Record<Purpose, string> = { commercial: 'коммерческий', informational: 'информационный', system: 'системный' };

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

  // Группировка по L1-сегменту.
  const groups = new Map<string, { count: number; params: number; children: Set<string>; purpose: Purpose }>();
  for (const p of parsed) {
    const l1 = p.segs[0] ?? '/';
    const g = groups.get(l1) ?? { count: 0, params: 0, children: new Set<string>(), purpose: 'informational' as Purpose };
    g.count += 1; if (p.hasParams) g.params += 1; if (p.segs[1]) g.children.add(p.segs[1]);
    groups.set(l1, g);
  }
  const tree: TreeNode[] = Array.from(groups.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 12).map(([label, g]) => {
    const severity: TreeNode['severity'] = g.params >= 8 ? 'gap' : g.params >= 3 ? 'check' : 'ok';
    const note = g.params >= 3 ? `${g.params} URL с параметрами — риск дублей` : `${g.children.size} подраздел.`;
    return { label: label === '/' ? '(корень)' : `/${label}/`, path: '/' + label, count: g.count, purpose: purposeFor('/' + label, g.params), params: g.params, severity, note };
  });

  // Проблемные узлы (§10): on-page с разобранных страниц + структурные.
  const issues: SeoIssue[] = [];
  const SEO_LABEL: Record<string, string> = { title: 'Title', desc: 'Meta description', canonical: 'Canonical', h1: 'H1', 'schema-product': 'Schema Product', 'schema-org': 'Schema Organization', og: 'Open Graph', hreflang: 'hreflang', noindex: 'noindex' };
  for (const p of ds.client.pages) {
    if (p.error || !p.checks.length) continue;
    const fails = p.checks.filter((c) => c.group === 'SEO' && !c.pass).map((c) => SEO_LABEL[c.id] ?? c.label);
    if (!fails.length) continue;
    const { segs, path } = segsOf(p.finalUrl || p.url);
    issues.push({ node: path || '/', level: Math.max(1, segs.length), purpose: purposeFor(path), problem: `Нет: ${fails.join(', ')}`, dupes: '—', index: ds.client.sitemapXml ? 'в sitemap' : 'нет sitemap', action: 'Заполнить мета/разметку на шаблоне типа страницы', dims: ['SEO', 'TECH'] });
  }
  // Структурные дефекты из дерева.
  const paramNode = tree.find((t) => t.severity === 'gap');
  if (paramNode) issues.push({ node: paramNode.path, level: 1, purpose: paramNode.purpose, problem: `Параметрические дубли: ${paramNode.params} URL с параметрами в одном разделе`, dupes: 'да', index: 'риск раздувания индекса', action: 'Canonical на базовую страницу, фасеты закрыть от индексации/через robots', dims: ['SEO', 'TECH'] });
  if (maxDepth >= 4) issues.push({ node: `глубина ${maxDepth}`, level: maxDepth, purpose: 'commercial', problem: 'Глубокая вложенность каталога — важные страницы далеко от корня', dupes: '—', index: 'хуже сканируется', action: 'Уплостить дерево, добавить хабы/перелинковку', dims: ['SEO', 'LINK'] });
  if (!ds.client.sitemapXml) issues.push({ node: '/sitemap.xml', level: 1, purpose: 'system', problem: 'Нет sitemap.xml', dupes: '—', index: 'нет карты для поисковика', action: 'Сгенерировать и отправить sitemap.xml в Search Console', dims: ['SEO', 'TECH'] });

  const recommended: string[] = [
    'Одна модель = одна карточка (canonical), варианты — параметром; убрать дубли «цвет как страница»',
    'Категории с уникальным H1 + SEO-описанием как посадочные под тематические запросы',
    ds.client.sitemapXml ? 'Держать sitemap.xml в актуальном состоянии' : 'Добавить sitemap.xml и robots-директивы для фасетов',
    'Хлебные крошки с разметкой на всех уровнях + перелинковка длинного хвоста',
  ];
  const paramShare = links.length ? Math.round((paramUrls / links.length) * 100) : 0;
  const verdict = !links.length ? 'Дерево не собрано — сайт недоступен/тонкий обход.'
    : paramShare >= 25 ? `Дерево засорено параметрами (${paramShare}% URL) — приоритет: канонизация и контроль фасетов.`
    : issues.length ? 'Каркас дерева читаемый, но есть узлы с SEO-пробелами и структурными рисками.'
    : 'Структура дерева в целом здоровая по внешним признакам.';

  return { client, takenAt: ds.takenAt, totals: { links: links.length, l1: groups.size, paramUrls, maxDepth, crawled: ds.client.pages.filter((p) => !p.error).length }, indexability: { robots: ds.client.robotsTxt, sitemap: ds.client.sitemapXml }, tree, issues, recommended, verdict };
}
