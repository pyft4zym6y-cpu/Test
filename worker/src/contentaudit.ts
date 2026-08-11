/**
 * Content Audit A0 (A0 §11): оценка контента по способности снижать
 * неопределённость и вести к решению (полнота / полезность / убедительность /
 * соответствие интенту, 1–5), а не «качество текста». На L0 — по наличию
 * решающих блоков (описание, характеристики, доверие, ответы), наблюдение;
 * глубина уточняется данными на A1.
 * Анализируются ВСЕ разобранные страницы (прод-урок: «один представитель типа»
 * скрывал разброс качества внутри типа), плюс агрегат по типам.
 */
import type { AuditDataset } from './report.js';
import type { PageKind } from './crawl.js';

export type ContentRow = {
  pageType: string; url: string; object: string;
  completeness: number; usefulness: number; persuasiveness: number; intent: number;
  crit: 'H' | 'M' | 'L'; note: string;
};
export type ContentReport = {
  client: string; takenAt: string;
  rows: ContentRow[];
  avg: { completeness: number; usefulness: number; persuasiveness: number; intent: number };
  strengths: string[];
  weaknesses: string[];
  recommendations: { pr: 'P0' | 'P1' | 'P2'; action: string; effect: string }[];
  verdict: string;
  conclusion: string[];
};

type Spec = { object: string; completeness: string[]; usefulness: string[]; persuasiveness: string[]; intent: string[] };
const CONTENT_SPEC: Partial<Record<PageKind, Spec>> = {
  home: { object: 'Оффер / УТП', completeness: ['hero', 'usp_bar', 'product_grid'], usefulness: ['usp_bar', 'nav'], persuasiveness: ['trust', 'reviews'], intent: ['hero', 'product_grid'] },
  plp: { object: 'Описание категории', completeness: ['category_title', 'category_description', 'product_count'], usefulness: ['filters', 'sort'], persuasiveness: ['reviews', 'faq'], intent: ['product_grid', 'category_description'] },
  pdp: { object: 'Описание товара', completeness: ['description', 'specifications', 'gallery'], usefulness: ['specifications', 'delivery', 'qa'], persuasiveness: ['reviews', 'trust'], intent: ['price', 'description', 'add_to_cart'] },
  cart: { object: 'Сопровождение заказа', completeness: ['order_summary', 'qty_control'], usefulness: ['delivery_calc', 'promo_code'], persuasiveness: ['trust', 'payment'], intent: ['order_summary', 'continue_shopping'] },
  checkout: { object: 'Оформление заказа', completeness: ['contact_form', 'delivery_selection', 'payment_selection'], usefulness: ['guest_checkout', 'order_summary'], persuasiveness: ['trust', 'payment'], intent: ['contact_form', 'payment_selection'] },
  content: { object: 'Статья / материал', completeness: ['product_header', 'toc'], usefulness: ['related'], persuasiveness: ['author'], intent: ['related'] },
  faq: { object: 'Ответы FAQ', completeness: ['faq', 'search'], usefulness: ['related', 'contact_form'], persuasiveness: ['faq', 'contact_form'], intent: ['search', 'faq'] },
  other: { object: 'Служебный / прочий контент', completeness: ['product_header', 'nav'], usefulness: ['footer_contacts', 'nav'], persuasiveness: ['trust'], intent: ['nav'] },
};

const KIND_LABEL: Record<PageKind, string> = { home: 'Главная', plp: 'Каталог', pdp: 'Карточка', cart: 'Корзина', checkout: 'Чекаут', content: 'Контент', faq: 'FAQ', other: 'Прочее' };
const DIM_LABEL: Record<string, string> = { completeness: 'полнота', usefulness: 'полезность', persuasiveness: 'убедительность', intent: 'соответствие интенту' };

function scoreDim(blocks: Record<string, boolean>, keys: string[]): number {
  if (!keys.length) return 1;
  const present = keys.filter((k) => blocks[k]).length;
  return Math.max(1, Math.min(5, Math.round(1 + 4 * (present / keys.length))));
}

const shortUrl = (u: string) => { try { const x = new URL(u); return x.pathname === '/' ? '/' : x.pathname; } catch { return u; } };

export function buildContentAudit(ds: AuditDataset): ContentReport {
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const rows: ContentRow[] = [];
  for (const p of ds.client.pages) {
    if (p.error || !p.ux) continue;
    const spec = CONTENT_SPEC[p.kind] ?? CONTENT_SPEC.other!;
    const b = p.ux?.blocks ?? {};
    const completeness = scoreDim(b, spec.completeness);
    const usefulness = scoreDim(b, spec.usefulness);
    const persuasiveness = scoreDim(b, spec.persuasiveness);
    const intent = scoreDim(b, spec.intent);
    const min = Math.min(completeness, usefulness, persuasiveness, intent);
    const crit: ContentRow['crit'] = (completeness <= 2 || intent <= 2) ? 'H' : (min <= 3 ? 'M' : 'L');
    const dims: [string, number][] = [['полнота', completeness], ['полезность', usefulness], ['убедительность', persuasiveness], ['интент', intent]];
    const weak = dims.filter(([, v]) => v <= 2).map(([k]) => k);
    const missing = [...spec.completeness, ...spec.persuasiveness].filter((k) => !b[k]).slice(0, 3);
    const note = weak.length
      ? `Слабо: ${weak.join(', ')}${missing.length ? ` — нет блоков: ${missing.join(', ')}` : ''}`
      : 'Контент закрывает основные вопросы решения';
    rows.push({ pageType: KIND_LABEL[p.kind], url: shortUrl(p.url), object: spec.object, completeness, usefulness, persuasiveness, intent, crit, note });
  }
  const avgOf = (f: (r: ContentRow) => number) => rows.length ? Math.round((rows.reduce((s, r) => s + f(r), 0) / rows.length) * 10) / 10 : 0;
  const avg = { completeness: avgOf((r) => r.completeness), usefulness: avgOf((r) => r.usefulness), persuasiveness: avgOf((r) => r.persuasiveness), intent: avgOf((r) => r.intent) };
  const overall = rows.length ? (avg.completeness + avg.usefulness + avg.persuasiveness + avg.intent) / 4 : 0;

  // ── Сильные и слабые стороны — из фактических оценок, с адресами страниц ──
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  for (const [key, label] of Object.entries(DIM_LABEL)) {
    const v = (avg as Record<string, number>)[key];
    if (v >= 4) strengths.push(`${label[0].toUpperCase()}${label.slice(1)} контента в среднем ${v}/5 — измерение работает на решение покупателя`);
    if (v > 0 && v <= 3.4) weaknesses.push(`${label[0].toUpperCase()}${label.slice(1)} в среднем ${v}/5 — системная слабина, а не проблема отдельной страницы`);
  }
  const strong = rows.filter((r) => r.crit === 'L');
  const critH = rows.filter((r) => r.crit === 'H');
  if (strong.length) strengths.push(`Страницы, где контент готов вести к решению: ${strong.slice(0, 4).map((r) => `${r.pageType} ${r.url}`).join(', ')}${strong.length > 4 ? ` и ещё ${strong.length - 4}` : ''}`);
  if (critH.length) weaknesses.push(`Критичные страницы (контент не отвечает на вопросы выбора): ${critH.slice(0, 4).map((r) => `${r.pageType} ${r.url}`).join(', ')}${critH.length > 4 ? ` и ещё ${critH.length - 4}` : ''}`);

  const recommendations: ContentReport['recommendations'] = [];
  const pdpWeak = rows.filter((r) => r.pageType === 'Карточка' && (r.completeness <= 3 || r.persuasiveness <= 3));
  if (pdpWeak.length) recommendations.push({ pr: 'P0', action: `Дозаполнить карточки товара (${pdpWeak.length} из разобранных слабые): описание под вопросы выбора, характеристики таблицей, живые фото`, effect: 'Покупатель принимает решение без ухода в поиск — рост конверсии карточки' });
  if (avg.persuasiveness <= 3 && rows.length) recommendations.push({ pr: 'P0', action: 'Встроить доказательства в точки решения: отзывы с фото, гарантия/возврат, платёжные логотипы на PDP и чекауте', effect: 'Снятие тревожности на последнем шаге — меньше брошенных корзин' });
  const plpWeak = rows.filter((r) => r.pageType === 'Каталог' && r.completeness <= 3);
  if (plpWeak.length) recommendations.push({ pr: 'P1', action: 'Категорийные описания (верх/низ листинга) под спрос: чем отличаются товары, как выбрать', effect: 'Категории начинают собирать средне- и низкочастотный спрос' });
  if (avg.usefulness <= 3 && rows.length) recommendations.push({ pr: 'P1', action: 'Добавить решающие блоки полезности: доставка/оплата на карточке, Q&A из реальных вопросов покупателей', effect: 'Меньше обращений в поддержку до заказа, короче путь к покупке' });
  recommendations.push({ pr: 'P2', action: 'Контент-хаб (гайды/подборки), связанный ссылками с каталогом', effect: 'Органический трафик по информационному спросу + внутренняя перелинковка' });

  const verdict = !rows.length ? 'Контент не оценён — страницы не разобраны.'
    : overall >= 4 ? `Контент в целом ведёт к решению (${overall.toFixed(1)}/5 по ${rows.length} страницам); точечные усиления убедительности.`
    : overall >= 3 ? `Контент присутствует (${overall.toFixed(1)}/5 по ${rows.length} страницам), но слабо снимает возражения — не хватает убедительности и полезности.`
    : `Контент тонкий (${overall.toFixed(1)}/5 по ${rows.length} страницам): не закрывает вопросы выбора и слабо ведёт к покупке.`;

  const worstDim = Object.entries(DIM_LABEL).map(([k, l]) => [l, (avg as Record<string, number>)[k]] as const).sort((a, b) => a[1] - b[1])[0];
  const bestDim = Object.entries(DIM_LABEL).map(([k, l]) => [l, (avg as Record<string, number>)[k]] as const).sort((a, b) => b[1] - a[1])[0];
  const conclusion = !rows.length ? ['Аудит контента не выполнен: ни одна страница не была разобрана. Это блокер, а не вывод о контенте.'] : [
    `Разобрано ${rows.length} страниц по четырём измерениям (полнота, полезность, убедительность, соответствие интенту). Общий уровень — ${overall.toFixed(1)}/5: ${overall >= 4 ? 'контент выполняет коммерческую функцию' : overall >= 3 ? 'контент существует, но не доведён до состояния «продаёт сам»' : 'контент сейчас не является активом продаж'}. Самое сильное измерение — ${bestDim[0]} (${bestDim[1]}/5), самое слабое — ${worstDim[0]} (${worstDim[1]}/5).`,
    critH.length
      ? `Критичная зона: ${critH.length} страниц с оценкой H — на них покупатель не получает ответа на вопросы выбора и уходит искать его в другом месте (чаще всего — к конкуренту или на маркетплейс). Работу стоит начинать именно с них: это страницы, ближайшие к деньгам.`
      : 'Страниц с критичным контентом не выявлено: базовые вопросы выбора закрыты на всех разобранных страницах.',
    `Вывод сформирован по наличию решающих блоков (слой A0, наблюдение). Он отвечает на вопрос «есть ли на странице то, что нужно для решения», но не «насколько хорошо это написано» — качество текста, уникальность и тональность проверяются на A1 с доступом к контенту и Search Console.`,
  ];

  return { client, takenAt: ds.takenAt, rows, avg, strengths, weaknesses, recommendations, verdict, conclusion };
}
