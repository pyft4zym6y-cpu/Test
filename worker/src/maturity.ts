/**
 * Матрица зрелости (AD-16). 18 доменов × уровни L1 Хаос → L5 Оптимизировано.
 * На L0 (без доступов) оцениваются только домены, наблюдаемые из обхода
 * (SEO, Платформа, Продукт, Аналитика, Маркетинг); остальные помечаются
 * «нужны данные» и заполняются ответами опросника/доступами (закон метода:
 * структура сохраняется, уточняется уверенность). Детерминированно.
 */
import type { AuditDataset } from './report.js';
import type { SiteCrawl } from './crawl.js';

export type DomainRow = { domain: string; assesses: string; level: number | null; basis: string; source: 'L0' | 'потрібні дані' };
export type MaturityReport = { rows: DomainRow[]; observedAvg: number | null };

const LEVELS = ['—', 'L1 Хаос', 'L2 Повторюване', 'L3 Визначено', 'L4 Кероване', 'L5 Оптимізовано'];

const ratioToLevel = (r: number): number => (r >= 0.85 ? 5 : r >= 0.7 ? 4 : r >= 0.5 ? 3 : r >= 0.3 ? 2 : 1);

function passRatio(site: SiteCrawl, ids: string[]): number {
  let pass = 0, total = 0;
  for (const p of site.pages) for (const c of p.checks) if (ids.includes(c.id)) { total++; if (c.pass) pass++; }
  return total ? pass / total : 0;
}

function anyBlock(site: SiteCrawl, k: string): boolean { return site.pages.some((p) => p.ux?.blocks?.[k]); }

/** L0-оценка зрелости наблюдаемых доменов + плейсхолдеры для остальных. */
export function buildMaturity(ds: AuditDataset): MaturityReport {
  const s = ds.client;
  const pdp = s.pages.find((p) => p.kind === 'pdp');

  // SEO — доля пройденных SEO-проверок.
  const seoR = passRatio(s, ['title', 'desc', 'canonical', 'h1', 'noindex', 'og', 'schema-org', 'schema-product', 'schema-crumbs', 'hreflang']);
  const seoBonus = (s.robotsTxt ? 0.03 : 0) + (s.sitemapXml ? 0.05 : 0);
  const seoLevel = ratioToLevel(Math.min(1, seoR + seoBonus));

  // Платформа — техфундамент.
  const platR = passRatio(s, ['https', 'charset', 'lang', 'preconnect', 'alt', 'lazy', 'errors-soft', 'viewport']);
  const platLevel = ratioToLevel(platR);

  // Продукт — качество товарных данных на карточке.
  let productLevel: number | null = null; let productBasis = 'немає картки у вибірці';
  if (pdp) {
    const bl = pdp.ux?.blocks ?? {};
    const items = ['gallery', 'description', 'specifications', 'variants', 'reviews', 'delivery'];
    const have = items.filter((k) => bl[k]).length + (pdp.checks.some((c) => c.id === 'schema-product' && c.pass) ? 1 : 0);
    productLevel = ratioToLevel(have / (items.length + 1));
    productBasis = `за карткою: заповнено ${have}/${items.length + 1} товарних блоків`;
  }

  // Аналитика — только факт установки (данные — с доступом), потолок L3.
  const analyticsInstalled = s.tech.analytics.length > 0;
  const analyticsLevel = analyticsInstalled ? 3 : 1;
  const analyticsBasis = analyticsInstalled ? `встановлено: ${s.tech.analytics.join(', ')} (якість даних — з доступом)` : 'лічильників не виявлено';

  // Маркетинг — сигналы каналов на витрине.
  const mkt = (anyBlock(s, 'newsletter') ? 1 : 0) + (s.pages.some((p) => p.checks.some((c) => c.id === 'social' && c.pass)) ? 1 : 0) + (analyticsInstalled ? 1 : 0);
  const marketingLevel = mkt >= 3 ? 3 : mkt >= 2 ? 2 : 1;

  const observed: DomainRow[] = [
    { domain: 'SEO', assesses: 'Органічна видимість, техстан, розмітка', level: seoLevel, basis: `SEO-перевірки, sitemap/robots (${Math.round(seoR * 100)}%)`, source: 'L0' },
    { domain: 'Platform', assesses: 'Технобаза, швидкість, гігієна верстки', level: platLevel, basis: `техперевірки (${Math.round(platR * 100)}%)`, source: 'L0' },
    { domain: 'Product', assesses: 'Якість товарних даних (картка)', level: productLevel, basis: productBasis, source: productLevel ? 'L0' : 'потрібні дані' },
    { domain: 'Analytics', assesses: 'Достовірність даних, атрибуція', level: analyticsLevel, basis: analyticsBasis, source: 'L0' },
    { domain: 'Marketing', assesses: 'Канали залучення й утримання на вітрині', level: marketingLevel, basis: `сигнали каналів: ${mkt}/3`, source: 'L0' },
  ];

  const needData = ['Strategy', 'Customer', 'Brand', 'Sales', 'CRM', 'Pricing', 'Operations', 'Marketplace', 'International', 'Finance', 'People', 'AI', 'Governance']
    .map((d): DomainRow => ({ domain: d, assesses: 'заповнюється відповідями опитувальника / доступами', level: null, basis: '—', source: 'потрібні дані' }));

  const rows = [...observed, ...needData];
  const lv = observed.map((r) => r.level).filter((x): x is number => x !== null);
  const observedAvg = lv.length ? Math.round((lv.reduce((a, b) => a + b, 0) / lv.length) * 10) / 10 : null;
  return { rows, observedAvg };
}

export function levelLabel(n: number | null): string { return n === null ? 'потрібні дані' : LEVELS[n]; }

export function renderMaturityMd(ds: AuditDataset, r: MaturityReport): string {
  const out: string[] = [];
  out.push(`# Матриця зрілості — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_18 доменів · L1 Хаос → L5 Оптимізовано · зовнішній аудит вітрини_`);
  out.push('');
  out.push(`Ззовні оцінюються домени, спостережувані з обходу. Середній рівень за спостережуваними: **${r.observedAvg ?? '—'}/5**. Повна матриця 18 доменів заповнюється відповідями опитувальника й доступами; Health Score рахується окремо рушієм.`);
  out.push('');
  out.push('| Домен | Що оцінюється | Рівень | Підстава |');
  out.push('| --- | --- | --- | --- |');
  for (const d of r.rows) out.push(`| ${d.domain} | ${d.assesses} | ${levelLabel(d.level)} | ${d.basis} |`);
  out.push('');
  out.push('---');
  out.push('_L1 Хаос → L2 Повторюване → L3 Визначено → L4 Кероване → L5 Оптимізовано. Домени «потрібні дані» розкриваються на наступних етапах._');
  return out.join('\n');
}
