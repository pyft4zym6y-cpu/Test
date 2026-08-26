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
  { key: 'score', name: 'Відповідність золотому стандарту', weight: 3, value: (a) => a.score / 100 },
  { key: 'trust', name: 'Довіра й оплата', weight: 2, value: (a) => b(a.trust) },
  { key: 'reviews', name: 'Відгуки / соц. доказ', weight: 1.5, value: (a) => b(a.reviews) },
  { key: 'filters', name: 'Фільтри в каталозі', weight: 1.5, value: (a) => b(a.filters) },
  { key: 'gallery', name: 'Галерея товару', weight: 1.5, value: (a) => b(a.gallery) },
  { key: 'mobile', name: 'Мобільна версія', weight: 1.5, value: (a) => b(a.mobile) },
  { key: 'search', name: 'Пошук по сайту', weight: 1, value: (a) => b(a.search) },
  { key: 'breadcrumbs', name: 'Хлібні крихти', weight: 1, value: (a) => b(a.breadcrumbs) },
  { key: 'variants', name: 'Вибір варіанта', weight: 1, value: (a) => b(a.variants) },
  { key: 'related', name: 'Cross-sell / схожі', weight: 1, value: (a) => b(a.related) },
  { key: 'analytics', name: 'Аналітика встановлена', weight: 1, value: (a) => b(a.analytics) },
  { key: 'schemaProduct', name: 'Schema.org товару', weight: 1, value: (a) => b(a.schemaProduct) },
  { key: 'delivery', name: 'Доставка/оплата на картці', weight: 1, value: (a) => b(a.delivery) },
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

const SYSTEM = `Ти — стратег з e-commerce. За детермінованим конкурентним бенчмарком вітрин (зважений індекс, позиції за параметрами, white space) збери короткий розбір ринку. Тільки за фактами, це зовнішній обхід — формулюй як спостереження. Відповідай природною УКРАЇНСЬКОЮ мовою.
Поверни СТРОГО JSON: {"summary":"2–3 речення: позиція клієнта на ринку","positioning":"де клієнт веде і де відстає від ринку, з ефектом","whiteSpace":"вільна ніша: чого не робить ніхто і як цим скористатися"}`;

export async function narrateBenchmark(ds: AuditDataset, r: BenchmarkReport): Promise<BenchmarkReport['narrative'] | null> {
  if (!hasKey()) return null;
  const facts = [
    `Клієнт: індекс ${r.clientIndex}/100, місце ${r.clientRank} з ${r.totalSites}.`,
    `Рейтинг: ${r.ranking.map((s) => `${s.isClient ? '★' : ''}${s.name} ${s.index}`).join(' · ')}`,
    `Клієнт веде: ${r.clientLeads.join(', ') || '—'}. Відстає: ${r.clientBehind.join(', ') || '—'}.`,
    `White space (слабко в усіх): ${r.whiteSpace.join(', ') || '—'}.`,
  ].join('\n');
  try {
    const text = await ask(SYSTEM + (await knowledgeFor('analyze', 'market')), facts, 3000);
    const n = extractJson<NonNullable<BenchmarkReport['narrative']>>(text);
    return n.summary ? n : null;
  } catch { return null; }
}

const POS: Record<ParamRow['position'], string> = { lead: '▲ ведемо', par: '≈ нарівні', behind: '▼ відстаємо' };

export function renderBenchmarkMd(ds: AuditDataset, r: BenchmarkReport): string {
  const out: string[] = [];
  out.push(`# Конкурентний бенчмарк — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Клієнт проти ${r.totalSites - 1} конкурент(ів) · зовнішній аудит вітрини_`);
  out.push('');
  if (r.narrative?.summary) { out.push(r.narrative.summary); out.push(''); }
  out.push(`**Індекс клієнта: ${r.clientIndex}/100 — місце ${r.clientRank} з ${r.totalSites}.**`);
  out.push('');
  out.push('## Рейтинг вітрин (зважений індекс)');
  out.push('| # | Сайт | Індекс |');
  out.push('| --- | --- | --- |');
  r.ranking.forEach((s, i) => out.push(`| ${i + 1} | ${s.isClient ? '★ ' : ''}${s.name} | ${s.index} |`));
  out.push('');
  out.push('## Позиції за параметрами (клієнт проти ринку)');
  out.push('| Параметр | Клієнт | Найкращий на ринку | Позиція |');
  out.push('| --- | --- | --- | --- |');
  for (const p of r.params) out.push(`| ${p.name} | ${p.client} | ${p.marketMax} | ${POS[p.position]} |`);
  out.push('');
  if (r.narrative?.positioning) { out.push('### Розбір позиціонування'); out.push(r.narrative.positioning); out.push(''); }
  out.push('## White space — вільна ніша');
  if (r.whiteSpace.length) { out.push('Параметри, слабкі в усіх на ринку (можливість вирватися вперед):'); for (const w of r.whiteSpace) out.push(`- ${w}`); }
  else out.push('Явної вільної ніші за розібраними параметрами не видно — ринок щільний, виграш у виконанні.');
  if (r.narrative?.whiteSpace) { out.push(''); out.push(r.narrative.whiteSpace); }
  out.push('');
  out.push('---');
  out.push('_Індекс — зважена сума параметрів вітрини за зовнішнім обходом. Уточнюється з доступами; параметри й ваги зберігаються._');
  return out.join('\n');
}
