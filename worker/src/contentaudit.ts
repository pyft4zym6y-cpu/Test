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
  unparsed: { label: string; url: string }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: { pr: 'P0' | 'P1' | 'P2'; action: string; effect: string }[];
  verdict: string;
  conclusion: string[];
};

type Spec = { object: string; completeness: string[]; usefulness: string[]; persuasiveness: string[]; intent: string[] };
const CONTENT_SPEC: Partial<Record<PageKind, Spec>> = {
  home: { object: 'Оффер / УТП', completeness: ['hero', 'usp_bar', 'product_grid'], usefulness: ['usp_bar', 'nav'], persuasiveness: ['trust', 'reviews'], intent: ['hero', 'product_grid'] },
  plp: { object: 'Опис категорії', completeness: ['category_title', 'category_description', 'product_count'], usefulness: ['filters', 'sort'], persuasiveness: ['reviews', 'faq'], intent: ['product_grid', 'category_description'] },
  pdp: { object: 'Опис товару', completeness: ['description', 'specifications', 'gallery'], usefulness: ['specifications', 'delivery', 'qa'], persuasiveness: ['reviews', 'trust'], intent: ['price', 'description', 'add_to_cart'] },
  cart: { object: 'Супровід замовлення', completeness: ['order_summary', 'qty_control'], usefulness: ['delivery_calc', 'promo_code'], persuasiveness: ['trust', 'payment'], intent: ['order_summary', 'continue_shopping'] },
  checkout: { object: 'Оформлення замовлення', completeness: ['contact_form', 'delivery_selection', 'payment_selection'], usefulness: ['guest_checkout', 'order_summary'], persuasiveness: ['trust', 'payment'], intent: ['contact_form', 'payment_selection'] },
  content: { object: 'Стаття / матеріал', completeness: ['product_header', 'toc'], usefulness: ['related'], persuasiveness: ['author'], intent: ['related'] },
  faq: { object: 'Відповіді FAQ', completeness: ['faq', 'search'], usefulness: ['related', 'contact_form'], persuasiveness: ['faq', 'contact_form'], intent: ['search', 'faq'] },
  other: { object: 'Службовий / інший контент', completeness: ['product_header', 'nav'], usefulness: ['footer_contacts', 'nav'], persuasiveness: ['trust'], intent: ['nav'] },
};

const KIND_LABEL: Record<PageKind, string> = { home: 'Головна', plp: 'Каталог', pdp: 'Картка', cart: 'Кошик', checkout: 'Оформлення', content: 'Контент', faq: 'FAQ', other: 'Інше' };
const DIM_LABEL: Record<string, string> = { completeness: 'повнота', usefulness: 'корисність', persuasiveness: 'переконливість', intent: 'відповідність інтенту' };

// Людино-зрозумілі назви блоків для колонки «Коментар» (що саме додати).
const BLOCK_RU: Record<string, string> = {
  reviews: 'відгуки', trust: 'блок довіри (гарантія/повернення)', specifications: 'характеристики',
  description: 'опис товару', gallery: 'галерею фото', related: 'схожі/супутні товари',
  delivery: 'умови доставки', payment: 'способи оплати', faq: 'часті питання', usp_bar: 'блок переваг',
  category_description: 'SEO-опис категорії', category_title: 'заголовок категорії', newsletter: 'підписку',
  video: 'відео', qa: 'питання-відповіді', specifications_table: 'таблицю характеристик', hero: 'перший екран',
  product_count: 'лічильник товарів', filters: 'фільтри', sort: 'сортування',
};

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
    // Провал ЛЮБОГО измерения (≤2) критичен: страница с убедительностью 1/5 не
    // может быть «средней» (логическая ошибка шкалы из QA-оценки пакета).
    const crit: ContentRow['crit'] = min <= 2 ? 'H' : (min <= 3 ? 'M' : 'L');
    const dims: [string, number][] = [['повнота', completeness], ['корисність', usefulness], ['переконливість', persuasiveness], ['інтент', intent]];
    const weak = dims.filter(([, v]) => v <= 2).map(([k]) => k);
    const missing = [...spec.completeness, ...spec.persuasiveness].filter((k) => !b[k]).slice(0, 3);
    const missingRu = missing.map((k) => BLOCK_RU[k] ?? k);
    const words = p.ux?.bodyWords ?? 0;
    const targetWords = p.kind === 'pdp' ? 150 : p.kind === 'content' ? 300 : 80;
    const thin = words > 0 && words < targetWords;
    // Язык версии vs фактический язык контента (замечание владельца).
    const urlLangM = p.url.match(/\/(ua|uk|ru|en|pl|de)(\/|$)/i);
    const urlLang = urlLangM ? urlLangM[1].toLowerCase().replace('uk', 'ua') : null;
    const cLang = p.ux?.contentLang;
    const langMismatch = urlLang && cLang && cLang !== '?' && cLang !== 'cyr' && urlLang !== cLang;
    const note = [
      weak.length
        ? `Слабко: ${weak.join(', ')}${missingRu.length ? `. Додати: ${missingRu.join(', ')}` : ''}`
        : 'Контент закриває основні питання рішення',
      thin ? `Текст тонкий (~${words} слів) — розширити щонайменше до ~${targetWords}` : '',
      langMismatch ? `⚠ мова версії «${urlLang}», а контент схожий на «${cLang}» — перевірити локалізацію` : '',
    ].filter(Boolean).join('. ');
    rows.push({ pageType: KIND_LABEL[p.kind], url: shortUrl(p.url), object: spec.object, completeness, usefulness, persuasiveness, intent, crit, note });
  }
  // Страницы, найденные картой типов, но не попавшие в разбор — честно перечисляются,
  // а не молчат («нет всех ключевых страниц» из прод-фидбека).
  const parsedUrls = new Set(rows.map((r) => r.url));
  const unparsed = (ds.client.pageTypes ?? [])
    .filter((t) => t.status === 'найдена' && t.url)
    .map((t) => ({ label: t.label, url: shortUrl(t.url!) }))
    .filter((t) => !parsedUrls.has(t.url));

  const avgOf = (f: (r: ContentRow) => number) => rows.length ? Math.round((rows.reduce((s, r) => s + f(r), 0) / rows.length) * 10) / 10 : 0;
  const avg = { completeness: avgOf((r) => r.completeness), usefulness: avgOf((r) => r.usefulness), persuasiveness: avgOf((r) => r.persuasiveness), intent: avgOf((r) => r.intent) };
  const overall = rows.length ? (avg.completeness + avg.usefulness + avg.persuasiveness + avg.intent) / 4 : 0;

  // ── Сильные и слабые стороны — из фактических оценок, с адресами страниц ──
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  for (const [key, label] of Object.entries(DIM_LABEL)) {
    const v = (avg as Record<string, number>)[key];
    if (v >= 4) strengths.push(`${label[0].toUpperCase()}${label.slice(1)} контенту в середньому ${v}/5 — вимір працює на рішення покупця`);
    if (v > 0 && v <= 3.4) weaknesses.push(`${label[0].toUpperCase()}${label.slice(1)} у середньому ${v}/5 — системна слабина, а не проблема окремої сторінки`);
  }
  const strong = rows.filter((r) => r.crit === 'L');
  const critH = rows.filter((r) => r.crit === 'H');
  if (strong.length) strengths.push(`Сторінки, де контент готовий вести до рішення: ${strong.slice(0, 4).map((r) => `${r.pageType} ${r.url}`).join(', ')}${strong.length > 4 ? ` і ще ${strong.length - 4}` : ''}`);
  if (critH.length) weaknesses.push(`Критичні сторінки (контент не відповідає на питання вибору): ${critH.slice(0, 4).map((r) => `${r.pageType} ${r.url}`).join(', ')}${critH.length > 4 ? ` і ще ${critH.length - 4}` : ''}`);

  const recommendations: ContentReport['recommendations'] = [];
  const pdpWeak = rows.filter((r) => r.pageType === 'Картка' && (r.completeness <= 3 || r.persuasiveness <= 3));
  if (pdpWeak.length) recommendations.push({ pr: 'P0', action: `Дозаповнити картки товару (${pdpWeak.length} із розібраних слабкі): опис під питання вибору, характеристики таблицею, живі фото`, effect: 'Покупець ухвалює рішення без переходу в пошук — зростання конверсії картки' });
  if (avg.persuasiveness <= 3 && rows.length) recommendations.push({ pr: 'P0', action: 'Вбудувати докази в точки рішення: відгуки з фото, гарантія/повернення, платіжні логотипи на PDP та оформленні', effect: 'Зняття тривожності на останньому кроці — менше покинутих кошиків' });
  const plpWeak = rows.filter((r) => r.pageType === 'Каталог' && r.completeness <= 3);
  if (plpWeak.length) recommendations.push({ pr: 'P1', action: 'Категорійні описи (верх/низ лістингу) під попит: чим відрізняються товари, як обрати', effect: 'Категорії починають збирати середньо- і низькочастотний попит' });
  if (avg.usefulness <= 3 && rows.length) recommendations.push({ pr: 'P1', action: 'Додати вирішальні блоки корисності: доставка/оплата на картці, Q&A з реальних питань покупців', effect: 'Менше звернень у підтримку до замовлення, коротший шлях до покупки' });
  recommendations.push({ pr: 'P2', action: 'Контент-хаб (гайди/добірки), звʼязаний посиланнями з каталогом', effect: 'Органічний трафік за інформаційним попитом + внутрішня перелінковка' });

  const verdict = !rows.length ? 'Контент не оцінено — сторінки не розібрано.'
    : overall >= 4 ? `Контент загалом веде до рішення (${overall.toFixed(1)}/5 за ${rows.length} сторінками); точкові підсилення переконливості.`
    : overall >= 3 ? `Контент присутній (${overall.toFixed(1)}/5 за ${rows.length} сторінками), але слабко знімає заперечення — бракує переконливості й корисності.`
    : `Контент тонкий (${overall.toFixed(1)}/5 за ${rows.length} сторінками): не закриває питання вибору і слабко веде до покупки.`;

  const worstDim = Object.entries(DIM_LABEL).map(([k, l]) => [l, (avg as Record<string, number>)[k]] as const).sort((a, b) => a[1] - b[1])[0];
  const bestDim = Object.entries(DIM_LABEL).map(([k, l]) => [l, (avg as Record<string, number>)[k]] as const).sort((a, b) => b[1] - a[1])[0];
  const conclusion = !rows.length ? ['Аудит контенту не виконано: жодну сторінку не було розібрано. Це блокер, а не висновок про контент.'] : [
    `Розібрано ${rows.length} сторінок за чотирма вимірами (повнота, корисність, переконливість, відповідність інтенту). Загальний рівень — ${overall.toFixed(1)}/5: ${overall >= 4 ? 'контент виконує комерційну функцію' : overall >= 3 ? 'контент існує, але не доведений до стану «продає сам»' : 'контент зараз не є активом продажів'}. Найсильніший вимір — ${bestDim[0]} (${bestDim[1]}/5), найслабший — ${worstDim[0]} (${worstDim[1]}/5).`,
    critH.length
      ? `Критична зона: ${critH.length} сторінок з оцінкою H — на них покупець не отримує відповіді на питання вибору і йде шукати її в іншому місці (найчастіше — до конкурента або на маркетплейс). Роботу варто починати саме з них: це сторінки, найближчі до грошей.`
      : 'Сторінок з критичним контентом не виявлено: базові питання вибору закриті на всіх розібраних сторінках.',
    `Висновок сформовано за наявністю вирішальних блоків (зовнішній аудит вітрини, спостереження). Він відповідає на питання «чи є на сторінці те, що потрібно для рішення», але не «наскільки добре це написано» — якість тексту, унікальність і тональність перевіряються після передачі доступів (наступний етап) з доступом до контенту та Search Console.`,
  ];

  return { client, takenAt: ds.takenAt, rows, avg, unparsed, strengths, weaknesses, recommendations, verdict, conclusion };
}
