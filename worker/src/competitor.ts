/**
 * Конкурентный бенчмарк (AD-11). Инновация метода: клиент против рынка по набору
 * параметров со взвешенным индексом, карта «где ведём / где отстаём» и white space
 * (что не делает никто — свободная ниша). Считается детерминированно из обхода
 * клиента и конкурентов (T2+/предзапуск), нарратив — при наличии ключа.
 */
import type { AuditDataset } from './report.js';
import type { SiteCrawl } from './crawl.js';
import { ask, extractJson, hasKey } from './anthropic.js';
import { knowledgeFor } from './knowledge.js';

type Param = { key: string; name: string; weight: number; value: (a: SiteAgg) => number }; // value 0..1

type SiteAgg = {
  name: string;
  isClient: boolean;
  score: number;        // соответствие голд-стандарту 0..100
  search: boolean; filters: boolean; breadcrumbs: boolean; gallery: boolean; variants: boolean;
  reviews: boolean; trust: boolean; analytics: boolean; schemaProduct: boolean; mobile: boolean;
  related: boolean; sitemap: boolean; delivery: boolean;
};

function aggregate(site: SiteCrawl): SiteAgg {
  const anyBlock = (k: string) => site.pages.some((p) => p.ux?.blocks?.[k]);
  const anyCheck = (id: string) => site.pages.some((p) => p.checks.some((c) => c.id === id && c.pass));
  const scored = site.pages.filter((p) => p.score !== null);
  const score = scored.length ? Math.round(scored.reduce((s, p) => s + (p.score ?? 0), 0) / scored.length) : 0;
  return {
    name: site.finalUrl || site.rootUrl,
    isClient: site.kind === 'client',
    score,
    search: anyBlock('search') || anyCheck('search'),
    filters: anyBlock('filters'),
    breadcrumbs: anyBlock('breadcrumbs'),
    gallery: site.pages.some((p) => p.kind === 'pdp' && (p.ux?.galleryImages ?? 0) >= 3) || anyBlock('gallery'),
    variants: anyBlock('variants'),
    reviews: anyBlock('reviews'),
    trust: anyBlock('trust') || anyBlock('payment'),
    analytics: site.tech.analytics.length > 0,
    schemaProduct: anyCheck('schema-product'),
    mobile: anyCheck('viewport'),
    related: anyBlock('related'),
    sitemap: site.sitemapXml,
    delivery: anyBlock('delivery'),
  };
}

const b = (v: boolean) => (v ? 1 : 0);
const PARAMS: Param[] = [
  { key: 'score', name: 'Соответствие голд-стандарту', weight: 3, value: (a) => a.score / 100 },
  { key: 'trust', name: 'Доверие и оплата', weight: 2, value: (a) => b(a.trust) },
  { key: 'reviews', name: 'Отзывы / соц. доказательство', weight: 1.5, value: (a) => b(a.reviews) },
  { key: 'filters', name: 'Фильтры на каталоге', weight: 1.5, value: (a) => b(a.filters) },
  { key: 'gallery', name: 'Галерея товара', weight: 1.5, value: (a) => b(a.gallery) },
  { key: 'mobile', name: 'Мобильная версия', weight: 1.5, value: (a) => b(a.mobile) },
  { key: 'search', name: 'Поиск по сайту', weight: 1, value: (a) => b(a.search) },
  { key: 'breadcrumbs', name: 'Хлебные крошки', weight: 1, value: (a) => b(a.breadcrumbs) },
  { key: 'variants', name: 'Выбор варианта', weight: 1, value: (a) => b(a.variants) },
  { key: 'related', name: 'Cross-sell / похожие', weight: 1, value: (a) => b(a.related) },
  { key: 'analytics', name: 'Аналитика установлена', weight: 1, value: (a) => b(a.analytics) },
  { key: 'schemaProduct', name: 'Schema.org товара', weight: 1, value: (a) => b(a.schemaProduct) },
  { key: 'delivery', name: 'Доставка/оплата на карточке', weight: 1, value: (a) => b(a.delivery) },
  { key: 'sitemap', name: 'Sitemap.xml', weight: 0.5, value: (a) => b(a.sitemap) },
];

const WSUM = PARAMS.reduce((s, p) => s + p.weight, 0);

export type SiteScore = { name: string; isClient: boolean; index: number };
export type ParamRow = { name: string; client: number; marketMax: number; position: 'lead' | 'par' | 'behind' };
export type BenchmarkReport = {
  ranking: SiteScore[];
  clientIndex: number;
  clientRank: number;
  totalSites: number;
  params: ParamRow[];
  whiteSpace: string[];   // параметры, слабые у всех — свободная ниша
  clientLeads: string[];
  clientBehind: string[];
  narrative?: { summary: string; positioning: string; whiteSpace: string };
};

export function buildBenchmark(ds: AuditDataset): BenchmarkReport | null {
  const client = ds.client.reachable ? aggregate(ds.client) : null;
  const comps = ds.competitors.filter((c) => c.reachable).map(aggregate);
  if (!client || !comps.length) return null;
  const all = [client, ...comps];

  const index = (a: SiteAgg) => Math.round((PARAMS.reduce((s, p) => s + p.weight * p.value(a), 0) / WSUM) * 100);
  const ranking: SiteScore[] = all.map((a) => ({ name: a.name, isClient: a.isClient, index: index(a) })).sort((x, y) => y.index - x.index);
  const clientIndex = index(client);
  const clientRank = ranking.findIndex((r) => r.isClient) + 1;

  const params: ParamRow[] = PARAMS.map((p) => {
    const cv = p.value(client);
    const marketMax = Math.max(...comps.map((c) => p.value(c)));
    const position: ParamRow['position'] = cv > marketMax + 0.05 ? 'lead' : cv < marketMax - 0.05 ? 'behind' : 'par';
    return { name: p.name, client: Math.round(cv * 100), marketMax: Math.round(marketMax * 100), position };
  });
  const whiteSpace = PARAMS.filter((p) => Math.max(...all.map((a) => p.value(a))) < 0.5).map((p) => p.name);
  const clientLeads = params.filter((p) => p.position === 'lead').map((p) => p.name);
  const clientBehind = params.filter((p) => p.position === 'behind').map((p) => p.name);

  return { ranking, clientIndex, clientRank, totalSites: all.length, params, whiteSpace, clientLeads, clientBehind };
}

const SYSTEM = `Ты — стратег Commerce OS. По детерминированному конкурентному бенчмарку витрин (взвешенный индекс, позиции по параметрам, white space) собери короткий разбор рынка. Только по фактам, это слой L0 (внешний обход) — формулируй как наблюдение. Язык русский.
Верни СТРОГО JSON: {"summary":"2–3 предложения: позиция клиента на рынке","positioning":"где клиент ведёт и где отстаёт от рынка, с эффектом","whiteSpace":"свободная ниша: чего не делает никто и как этим воспользоваться"}`;

export async function narrateBenchmark(ds: AuditDataset, r: BenchmarkReport): Promise<BenchmarkReport['narrative'] | null> {
  if (!hasKey()) return null;
  const facts = [
    `Клиент: индекс ${r.clientIndex}/100, место ${r.clientRank} из ${r.totalSites}.`,
    `Рейтинг: ${r.ranking.map((s) => `${s.isClient ? '★' : ''}${s.name} ${s.index}`).join(' · ')}`,
    `Клиент ведёт: ${r.clientLeads.join(', ') || '—'}. Отстаёт: ${r.clientBehind.join(', ') || '—'}.`,
    `White space (слабо у всех): ${r.whiteSpace.join(', ') || '—'}.`,
  ].join('\n');
  try {
    const text = await ask(SYSTEM + (await knowledgeFor('analyze')), facts, 3000);
    const n = extractJson<NonNullable<BenchmarkReport['narrative']>>(text);
    return n.summary ? n : null;
  } catch { return null; }
}

const POS: Record<ParamRow['position'], string> = { lead: '▲ ведём', par: '≈ наравне', behind: '▼ отстаём' };

export function renderBenchmarkMd(ds: AuditDataset, r: BenchmarkReport): string {
  const out: string[] = [];
  out.push(`# Конкурентный бенчмарк — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Commerce OS · AD-11 · слой L0 · клиент против ${r.totalSites - 1} конкурент(ов) · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}_`);
  out.push('');
  if (r.narrative?.summary) { out.push(r.narrative.summary); out.push(''); }
  out.push(`**Индекс клиента: ${r.clientIndex}/100 — место ${r.clientRank} из ${r.totalSites}.**`);
  out.push('');
  out.push('## Рейтинг витрин (взвешенный индекс)');
  out.push('| # | Сайт | Индекс |');
  out.push('| --- | --- | --- |');
  r.ranking.forEach((s, i) => out.push(`| ${i + 1} | ${s.isClient ? '★ ' : ''}${s.name} | ${s.index} |`));
  out.push('');
  out.push('## Позиции по параметрам (клиент против рынка)');
  out.push('| Параметр | Клиент | Лучший у рынка | Позиция |');
  out.push('| --- | --- | --- | --- |');
  for (const p of r.params) out.push(`| ${p.name} | ${p.client} | ${p.marketMax} | ${POS[p.position]} |`);
  out.push('');
  if (r.narrative?.positioning) { out.push('### Разбор позиционирования'); out.push(r.narrative.positioning); out.push(''); }
  out.push('## White space — свободная ниша');
  if (r.whiteSpace.length) { out.push('Параметры, слабые у всех на рынке (возможность вырваться вперёд):'); for (const w of r.whiteSpace) out.push(`- ${w}`); }
  else out.push('Явной свободной ниши по разобранным параметрам не видно — рынок плотный, выигрыш в исполнении.');
  if (r.narrative?.whiteSpace) { out.push(''); out.push(r.narrative.whiteSpace); }
  out.push('');
  out.push('---');
  out.push('_Индекс — взвешенная сумма параметров витрины по обходу L0. Уточняется с доступами; параметры и веса сохраняются._');
  return out.join('\n');
}
