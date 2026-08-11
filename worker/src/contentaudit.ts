/**
 * Content Audit A0 (A0 §11): оценка контента по способности снижать
 * неопределённость и вести к решению (полнота / полезность / убедительность /
 * соответствие интенту, 1–5), а не «качество текста». На L0 — по наличию
 * решающих блоков (описание, характеристики, доверие, ответы), наблюдение;
 * глубина уточняется данными на A1.
 */
import type { AuditDataset } from './report.js';
import type { PageKind } from './crawl.js';

export type ContentRow = {
  pageType: string; object: string;
  completeness: number; usefulness: number; persuasiveness: number; intent: number;
  crit: 'H' | 'M' | 'L'; note: string;
};
export type ContentReport = {
  client: string; takenAt: string;
  rows: ContentRow[];
  avg: { completeness: number; usefulness: number; persuasiveness: number; intent: number };
  verdict: string;
};

type Spec = { object: string; completeness: string[]; usefulness: string[]; persuasiveness: string[]; intent: string[] };
const CONTENT_SPEC: Partial<Record<PageKind, Spec>> = {
  home: { object: 'Оффер / УТП', completeness: ['hero', 'usp_bar', 'product_grid'], usefulness: ['usp_bar', 'nav'], persuasiveness: ['trust', 'reviews'], intent: ['hero', 'product_grid'] },
  plp: { object: 'Описание категории', completeness: ['category_title', 'category_description', 'product_count'], usefulness: ['filters', 'sort'], persuasiveness: ['reviews', 'faq'], intent: ['product_grid', 'category_description'] },
  pdp: { object: 'Описание товара', completeness: ['description', 'specifications', 'gallery'], usefulness: ['specifications', 'delivery', 'qa'], persuasiveness: ['reviews', 'trust'], intent: ['price', 'description', 'add_to_cart'] },
  content: { object: 'Статья / материал', completeness: ['product_header', 'toc'], usefulness: ['related'], persuasiveness: ['author'], intent: ['related'] },
};

const KIND_LABEL: Record<PageKind, string> = { home: 'Главная', plp: 'Каталог', pdp: 'Карточка', cart: 'Корзина', checkout: 'Чекаут', content: 'Контент', other: 'Прочее' };

function scoreDim(blocks: Record<string, boolean>, keys: string[]): number {
  if (!keys.length) return 1;
  const present = keys.filter((k) => blocks[k]).length;
  return Math.max(1, Math.min(5, Math.round(1 + 4 * (present / keys.length))));
}

export function buildContentAudit(ds: AuditDataset): ContentReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const rows: ContentRow[] = [];
  const seen = new Set<PageKind>();
  for (const p of ds.client.pages) {
    if (p.error || !p.ux || seen.has(p.kind)) continue;
    const spec = CONTENT_SPEC[p.kind];
    if (!spec) continue;
    seen.add(p.kind);
    const b = p.ux?.blocks ?? {};
    const completeness = scoreDim(b, spec.completeness);
    const usefulness = scoreDim(b, spec.usefulness);
    const persuasiveness = scoreDim(b, spec.persuasiveness);
    const intent = scoreDim(b, spec.intent);
    const min = Math.min(completeness, usefulness, persuasiveness, intent);
    const crit: ContentRow['crit'] = (completeness <= 2 || intent <= 2) ? 'H' : (min <= 3 ? 'M' : 'L');
    const weak = [['полнота', completeness], ['полезность', usefulness], ['убедительность', persuasiveness], ['интент', intent]].filter(([, v]) => (v as number) <= 2).map(([k]) => k as string);
    const note = weak.length ? `Слабо: ${weak.join(', ')}` : 'Контент закрывает основные вопросы решения';
    rows.push({ pageType: KIND_LABEL[p.kind], object: spec.object, completeness, usefulness, persuasiveness, intent, crit, note });
  }
  const avgOf = (f: (r: ContentRow) => number) => rows.length ? Math.round((rows.reduce((s, r) => s + f(r), 0) / rows.length) * 10) / 10 : 0;
  const avg = { completeness: avgOf((r) => r.completeness), usefulness: avgOf((r) => r.usefulness), persuasiveness: avgOf((r) => r.persuasiveness), intent: avgOf((r) => r.intent) };
  const overall = rows.length ? (avg.completeness + avg.usefulness + avg.persuasiveness + avg.intent) / 4 : 0;
  const verdict = !rows.length ? 'Контент не оценён — страницы не разобраны.'
    : overall >= 4 ? 'Контент в целом ведёт к решению; точечные усиления убедительности.'
    : overall >= 3 ? 'Контент присутствует, но слабо снимает возражения — не хватает убедительности и полезности.'
    : 'Контент тонкий: не закрывает вопросы выбора и слабо ведёт к покупке.';
  return { client, takenAt: ds.takenAt, rows, avg, verdict };
}
