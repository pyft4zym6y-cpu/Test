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
import type { PageAudit, PageKind, Annotation } from './crawl.js';
import { REFERENCE, type Weight } from './prototype.js';

/** 18 измерений метода (та же таксономия, что в эталонах). */
export const DIMS = {
  TECH: 'Техніка', PERF: 'Швидкість', SEO: 'Пошук', AEO: 'Прямі відповіді', GEO: 'AI-видача',
  UX: 'UX', A11Y: 'Доступність', CONT: 'Контент', COMM: 'Комунікація', MKT: 'Маркетинг',
  ANL: 'Аналітика', COMP: 'Конкуренти', LINK: 'Перелінковка', SEC: 'Безпека',
  LAW: 'Право', PRICE: 'Ціна', CRO: 'Конверсія', MOB: 'Мобільні',
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

/** Сквозные требования по типу страницы (наскрізні вимоги из эталонов): не UX-блоки,
 *  а технические/коммерческие требования (TECH/PERF/SEO/ANL/A11Y/PRICE/LAW). */
export type ReqRow = { dims: Dim[]; req: string; why: string };
const REQUIREMENTS: Partial<Record<PageKind, ReqRow[]>> = {
  pdp: [
    { dims: ['TECH', 'SEO'], req: 'Розмітка Product + Offer + AggregateRating + QAPage; один canonical на модель', why: 'Без Offer немає ціни й наявності у видачі; відгуки товару не змішуються з відгуками магазину' },
    { dims: ['PERF'], req: 'Галерея з lazy-load, головне фото в пріоритеті завантаження, формат WebP', why: 'Картка з 5 типами медіа — найважча сторінка сайту, LCP вирішується тут' },
    { dims: ['SEO'], req: 'Title з моделлю, складом і розміром; унікальний description; без «грн грн» від шаблону', why: 'Дефект шаблону множиться на всі картки одразу' },
    { dims: ['CONT'], req: 'Атрибути зі довідника, не руками; фото привʼязані до правильної колекції', why: 'Переплутані фотоактиви — пряма причина повернень «прийшло не те»' },
    { dims: ['ANL'], req: 'Події: перегляд, вибір варіанта, зум фото, розкриття догляду, запит зразка, додавання в кошик', why: 'Без події на вибір варіанта не зрозуміти, який колір/розмір реально беруть' },
    { dims: ['A11Y'], req: 'Свотчі кольору з текстовою назвою; керування галереєю з клавіатури', why: 'Стан, переданий лише кольором, недоступний частині користувачів' },
    { dims: ['PRICE'], req: 'Ціна не вища, ніж у власних каналах на маркетплейсах', why: 'Покупець порівнює за хвилину; дорожче на своєму сайті — втрачена конверсія і довіра' },
    { dims: ['LAW'], req: 'Стара ціна відповідає дійсності; склад і країна походження точні', why: 'Постійна «знижка» від завищеної бази — ризик за законом про рекламу' },
  ],
  plp: [
    { dims: ['SEO', 'TECH'], req: 'Пагінація індексується (rel next/canonical), фасети не плодять дублі URL', why: 'Фільтри без контролю індексації створюють тисячі майже однакових сторінок' },
    { dims: ['SEO', 'CONT'], req: 'Унікальний H1 і SEO-опис категорії; хлібні крихти з розміткою', why: 'Категорія — головна посадкова під тематичні запити' },
    { dims: ['PERF'], req: 'Лінива підвантаження карток, зображення WebP з розмірами', why: 'Довгий лістинг — важка сторінка; CLS і LCP псують видачу і конверсію' },
    { dims: ['ANL'], req: 'Події: застосування фільтра, сортування, перехід у картку', why: 'Без подій фільтрації не видно, де втрачається вибір' },
  ],
  home: [
    { dims: ['SEO', 'TECH'], req: 'Schema Organization + WebSite + SearchAction; один H1', why: 'Базові сутності бренду у видачі та sitelinks-пошук' },
    { dims: ['PERF'], req: 'LCP-банер оптимізовано, шрифти з preload, без банерів-«стрибків»', why: 'Перший екран головної — обличчя швидкості всього сайту' },
    { dims: ['LAW'], req: 'Умови акцій, оферта, контакти і реквізити доступні з футера', why: 'Юридичні сигнали довіри та вимоги закону' },
  ],
  checkout: [
    { dims: ['SEC'], req: 'HTTPS, видимі сигнали безпеки оплати, PCI-сумісний еквайринг', why: 'Тривога безпеки на оплаті — пряма причина покинутих замовлень' },
    { dims: ['ANL'], req: 'Події кожного кроку оформлення (контакти→доставка→оплата→успіх)', why: 'Без покрокових подій не видно, на якому кроці втрачаються замовлення' },
    { dims: ['LAW'], req: 'Підсумкова вартість (доставка, комісії) показана до оплати', why: '39% відмов в оформленні — через приховані витрати, що спливли пізно' },
    { dims: ['A11Y'], req: 'Форми з label, помилки полів доступні й зрозумілі', why: 'Недоступна форма оформлення втрачає частину замовлень мовчки' },
  ],
  faq: [
    { dims: ['AEO', 'GEO'], req: 'Самодостатня відповідь 40–60 слів першою + FAQPage-розмітка', why: 'Саме це потрапляє в блок прямих відповідей і цитується AI-системами' },
    { dims: ['TECH', 'SEO'], req: 'Кожна категорія питань — окремий URL', why: 'Вкладки без адрес: 5 із 6 категорій не існують для пошуку' },
    { dims: ['TECH', 'A11Y'], req: 'Відповіді в HTML (не підвантажуються скриптом), якір на кожне питання, акордеон з клавіатури', why: 'Відповіді в JS — краулер бачить лише заголовки; без якоря підтримка не надішле посилання' },
    { dims: ['CONT'], req: 'Наповнення з реальних звернень (40–50 питань), не вигаданих', why: 'Три питання в категорії — каркас без вмісту; джерело — чат і підтримка' },
    { dims: ['ANL'], req: 'Оцінка корисності відповіді («чи була корисна»)', why: 'Найдешевше джерело даних про те, які відповіді не працюють' },
    { dims: ['LINK', 'CRO'], req: '2–3 виходи з кожної відповіді (каталог/матеріал)', why: 'FAQ відповідає і має вести в товар, а не в глухий кут' },
  ],
  content: [
    { dims: ['AEO', 'GEO'], req: 'Article/FAQPage розмітка; самодостатні відповіді 40–60 слів', why: 'Те, що потрапляє в блок прямих відповідей і цитується AI-системами' },
    { dims: ['LINK'], req: '2–3 посилання зі статті в каталог/суміжні матеріали', why: 'Стаття відповідає і має вести в товар, а не в глухий кут' },
    { dims: ['CONT'], req: 'Автор, дата оновлення, експертність (E-E-A-T)', why: 'Сигнали довіри для пошуку та AI-видачі' },
  ],
};

export type BlockState = 'ok' | 'check' | 'gap'; // ✅ есть · ⚪ проверить · 🔴 нет
export type BlockRow = {
  name: string; role: string; chapter: string; weight: Weight; dims: Dim[];
  state: BlockState; score: number; max: number; wordVerdict: string;
  now: string;    // что сейчас — фактическое наблюдение с измерениями обхода
  should: string; // что должно быть — детальный эталон (Частина А референса)
};
export type PageReport = {
  kind: PageKind; title: string; chapter: string; principle?: string; url: string;
  conclusion: string;     // заголовок-вывод (A0 §8: заголовок = управленческий вывод)
  screenshot?: string;    // первый экран (base64 jpeg) — для скриншота слева (A0 §9)
  annotations: Annotation[]; // маркеры на скриншоте (A0 §9)
  score: number; max: number; complianceScore: number | null; // score голд-стандарта страницы (%)
  counts: { ok: number; check: number; gap: number };
  rows: BlockRow[];
  requirements: ReqRow[]; // сквозные требования (TECH/PERF/SEO/ANL/A11Y/PRICE/LAW)
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
  warning?: string; // пробел покрытия (напр. PDP не разобрана) — вывод с оговоркой
  pageTypes: import('./crawl.js').PageTypeCoverage[]; // карта уникальных типов страниц
  soft404: boolean | null;
};

const MAX_BY_WEIGHT: Record<Weight, number> = { core: 4, important: 3, nice: 2 };

/** «Что сейчас» — фактическое наблюдение по блоку с измерениями обхода (Частина Б референса). */
function nowFor(key: string, p: PageAudit): string {
  const ux = p.ux;
  if (!ux) return 'немає даних обходу';
  const b = ux.blocks ?? {};
  const has = Boolean(b[key]);
  switch (key) {
    case 'gallery': return ux.galleryImages > 0 ? `Галерея: ${ux.galleryImages} зображень${ux.galleryImages < 4 ? ' — менше за еталонні 5 типів медіа' : ''}` : 'Галерею не виявлено';
    case 'nav': return `Пунктів у головному меню: ${ux.navItems}${ux.navItems > 12 ? ' — перевантаження (закон Гіка)' : ''}`;
    case 'search': return has ? 'Пошук виявлено' : 'Пошук не виявлено в DOM';
    case 'breadcrumbs': case 'product_header': case 'category_title':
      return has ? 'Виявлено' : 'Не виявлено';
    case 'price': return ux.priceVisible ? 'Ціна видна одразу' : 'Ціну в першому екрані не виявлено';
    case 'add_to_cart': return ux.addToCartProminent ? `CTA в першому екрані; клікабельних елементів над згином: ${ux.foldButtons}${ux.distinctButtonColors > 3 ? `; кольорів кнопок ${ux.distinctButtonColors} — пріоритет CTA розмито` : ''}` : 'Кнопку купівлі в першому екрані не розпізнано';
    case 'variants': return ux.variantSelector ? 'Вибір варіанта є' : 'Вибір варіанта не виявлено';
    case 'trust': return ux.trustBadges ? 'Сигнали гарантії/повернення знайдено в тексті' : 'Гарантії/повернення в точці рішення не виявлено';
    case 'payment': return ux.paymentIcons ? 'Платіжні сигнали (іконки/способи) є' : 'Платіжні сигнали не виявлено';
    case 'reviews': return ux.reviews ? 'Відгуки/рейтинг виявлено' : 'Відгуки не виявлено на жодному екрані';
    case 'filters': return ux.filters ? 'Фільтри/фасети є' : 'Фільтри не виявлено';
    case 'sort': return ux.sortControl ? 'Сортування є' : 'Сортування не виявлено';
    case 'contact_form': return ux.formFields > 0 ? `Форма: ${ux.formFields} видимих полів${ux.formFields > 8 ? ' — довга (тертя)' : ''}` : 'Форму не виявлено';
    case 'guest_checkout': return ux.guestCheckoutHint ? 'Натяк на гостьове оформлення є' : 'Гостьове оформлення не видно — можливо, потрібна реєстрація';
    default: return has ? 'Виявлено' : 'Не виявлено';
  }
}

/** Понижение балла за слабое качество присутствующего блока (есть ≠ хорошо). */
function qualityPenalty(key: string, p: PageAudit): string | null {
  const ux = p.ux;
  if (!ux) return null;
  if (key === 'gallery' && ux.galleryImages > 0 && ux.galleryImages < 3) return 'галерея тонша за еталон';
  if (key === 'add_to_cart' && ux.distinctButtonColors > 4) return 'пріоритет CTA розмито кольорами кнопок';
  if (key === 'nav' && ux.navItems > 12) return 'меню перевантажене';
  if (key === 'contact_form' && ux.formFields > 8) return 'форма довша за норму';
  return null;
}

/** Блок «есть», если он в карте блоков ИЛИ виден соответствующим измерением UxProbe —
 *  иначе противоречия вида «✕ Сортировка есть» (blocks не знал, а sortControl знал). */
function uxHas(key: string, p: PageAudit): boolean {
  const ux = p.ux;
  if (!ux) return false;
  switch (key) {
    case 'sort': return ux.sortControl;
    case 'filters': return ux.filters;
    case 'trust': return ux.trustBadges;
    case 'payment': return ux.paymentIcons;
    case 'reviews': return ux.reviews;
    case 'variants': return ux.variantSelector;
    case 'price': return ux.priceVisible;
    case 'add_to_cart': return ux.addToCartProminent;
    case 'contact_form': return ux.formFields > 0;
    case 'gallery': return ux.galleryImages > 0;
    case 'breadcrumbs': return ux.breadcrumbs;
    default: return false;
  }
}

/** Слово-вердикт як у референсі: сильно / частково / перевірити / слабко / критично / немає. */
function wordFor(state: BlockState, weight: Weight): string {
  if (state === 'ok') return 'сильно';
  if (state === 'check') return 'перевірити';
  return weight === 'core' ? 'критично' : weight === 'important' ? 'слабко' : 'немає';
}
const CRIT_BY_WEIGHT: Record<Weight, 'Блокирующая' | 'Высокая' | 'Средняя'> = { core: 'Блокирующая', important: 'Высокая', nice: 'Средняя' };
// Блоки, которые на L0 (внешний обход) достоверно не подтвердить при отсутствии —
// помечаем «проверить», а не «нет» (могут быть за табом/в JS/размётке).
const L0_UNCERTAIN = new Set(['qa', 'specifications', 'description', 'category_description', 'faq', 'variants']);

const KIND_LABEL: Record<PageKind, string> = {
  home: 'Головна', plp: 'Каталог', pdp: 'Картка', cart: 'Кошик', checkout: 'Оформлення', content: 'Контент', faq: 'FAQ', other: 'Інше',
};

function buildPage(p: PageAudit): PageReport | null {
  const ref = REFERENCE[p.kind];
  if (!ref) return null;
  const present = p.ux?.blocks ?? {};
  const rows: BlockRow[] = ref.blocks.map((b) => {
    const has = Boolean(present[b.key]) || uxHas(b.key, p);
    const state: BlockState = has ? 'ok' : (b.weight === 'nice' || L0_UNCERTAIN.has(b.key) ? 'check' : 'gap');
    const max = MAX_BY_WEIGHT[b.weight];
    let score = state === 'ok' ? max : state === 'check' ? 1 : 0;
    let word = wordFor(state, b.weight);
    let now = nowFor(b.key, p);
    const penalty = state === 'ok' ? qualityPenalty(b.key, p) : null;
    if (penalty) { score = Math.max(1, score - 1); word = 'частково'; }
    if (state === 'check' && /^Не виявлено/.test(now)) now += ' — можливо за табом/JS, перевірити';
    return { name: b.name, role: b.role, chapter: b.chapter, weight: b.weight, dims: DIM_BY_BLOCK[b.key] ?? ['UX'], state, score, max, wordVerdict: word, now, should: b.detail ?? b.role };
  });
  const score = rows.reduce((s, r) => s + r.score, 0);
  const max = rows.reduce((s, r) => s + r.max, 0);
  const counts = { ok: rows.filter((r) => r.state === 'ok').length, check: rows.filter((r) => r.state === 'check').length, gap: rows.filter((r) => r.state === 'gap').length };
  const strong = rows.filter((r) => r.state === 'ok' && r.weight !== 'nice').map((r) => r.name);
  const fixes = rows.filter((r) => r.state === 'gap').sort((a, b) => b.max - a.max)
    .map((r) => ({ what: `Додати: ${r.name}`, crit: CRIT_BY_WEIGHT[r.weight], why: r.role }));
  const pct = max ? Math.round((score / max) * 100) : 0;
  const conclusion = pageConclusion(ref.title, rows, pct);
  return { kind: p.kind, title: ref.title, chapter: ref.chapter, principle: ref.principle, url: p.finalUrl || p.url, conclusion, screenshot: p.screenshot, annotations: p.ux?.annotations ?? [], score, max, complianceScore: p.score, counts, rows, requirements: REQUIREMENTS[p.kind] ?? [], strong, fixes };
}

/** Заголовок-вивід сторінки: не «Картка товару», а управлінський висновок. */
function pageConclusion(title: string, rows: BlockRow[], pct: number): string {
  const gaps = rows.filter((r) => r.state === 'gap').map((r) => r.name.toLowerCase());
  const has = (re: RegExp) => gaps.some((g) => re.test(g));
  const trust = has(/довір|відгук|гаран/);
  const nav = has(/пошук|фільтр|навігац|перелінк|схож|cross|related/);
  if (pct >= 75) return `${title}: близько до еталона — доробки точкові`;
  if (trust && nav) return `${title} не знімає заперечення і не веде далі: провалено довіру та шлях до рішення`;
  if (trust) return `${title} втрачає довіру: бракує відгуків/гарантій у точці рішення`;
  if (nav) return `${title}: шлях клієнта рветься — немає виходів і перелінковки`;
  if (pct < 40) return `${title}: каркас є, але ключові блоки еталона відсутні`;
  return `${title}: структура робоча, але не добудована до еталона`;
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
    if (v.fail === pages.length) out.push({ title: `«${v.label}» не виконано на жодній сторінці`, detail: `Дефект живе в шаблоні/налаштуваннях, а не на окремій сторінці — виправляється один раз, ефект на всьому сайті.`, dims: DIM_BY_GROUP[v.group] ?? ['TECH'] });
  }
  // Аналітика/платформа як системний сигнал.
  if (!ds.client.tech.analytics.length) out.push({ title: 'Аналітику не виявлено (GA4/GTM/Pixel)', detail: 'Без подій неможливо міряти воронку — рекомендації не можна перевірити грошима.', dims: ['ANL'] });
  if (!ds.client.sitemapXml) out.push({ title: 'Немає sitemap.xml', detail: 'Гірша індексація всього каталогу — системний SEO-ризик.', dims: ['SEO', 'TECH'] });
  // Правило карти сайту: відсутня ОБОВʼЯЗКОВА сторінка — знахідка, а не пропуск.
  for (const t of ds.client.pageTypes ?? []) {
    if (t.mandatory && t.status === 'не найдена') out.push({ title: `Не знайдено обовʼязкову сторінку: ${t.label}`, detail: 'Шукали в sitemap, за посиланнями обходу й пробою стандартних адрес. Для магазину це базова сторінка — її відсутність ламає довіру/право/шлях покупки.', dims: t.id.startsWith('legal') ? ['LAW', 'COMM'] : ['UX', 'CRO'] });
  }
  if (ds.client.soft404 === true) out.push({ title: 'Неіснуючі URL віддають 200 («мʼяка 404»)', detail: 'Сміттєві адреси індексуються як сторінки — роздування індексу й розмивання ваги. Потрібен чесний 404-статус.', dims: ['SEO', 'TECH'] });
  return out.slice(0, 8);
}

function verdictLine(pct: number): string {
  if (pct >= 75) return 'Вітрина близька до еталона — точкові доробки піднімуть конверсію.';
  if (pct >= 55) return 'Правильний каркас, але ключові блоки довіри й шляху до рішення не добудовані.';
  if (pct >= 35) return 'Базова структура є, втрачаються довіра, відповіді на заперечення й перелінковка — двозначний розрив конверсії.';
  return 'Вітрина далеко від еталона: рветься шлях клієнта на більшості типів сторінок.';
}

/** Journey-связка: интерактивный дефект шага понижает оценку соответствующего
 *  блока страницы (прод-претензия: «карточка 82%, а кнопка "в корзину" не даёт
 *  реакции — как так?»). Статический балл не должен противоречить прохождению. */
export type JourneyLink = { stage: string; status: string; result: string };
const JOURNEY_TO_BLOCK: { stageRe: RegExp; kind: PageKind; blockName: RegExp }[] = [
  { stageRe: /додавання в кошик/i, kind: 'pdp', blockName: /кошик|cta|кнопк/i },
  { stageRe: /^пошук/i, kind: 'home', blockName: /пошук/i },
  { stageRe: /^кошик/i, kind: 'cart', blockName: /склад|вартіст|підсумок|summary/i },
  { stageRe: /^оформлення/i, kind: 'checkout', blockName: /форма|контакт/i },
  { stageRe: /обране/i, kind: 'pdp', blockName: /wishlist|обран/i },
];
function applyJourney(pages: PageReport[], journey: JourneyLink[]): void {
  for (const step of journey) {
    if (step.status !== 'тупик' && step.status !== 'спотыкание') continue;
    const map = JOURNEY_TO_BLOCK.find((m) => m.stageRe.test(step.stage));
    if (!map) continue;
    const page = pages.find((p) => p.kind === map.kind);
    if (!page) continue;
    const row = page.rows.find((r) => map.blockName.test(r.name)) ?? page.rows.find((r) => r.state === 'ok' && /cta|кнопк|кошик|форма/i.test(r.name));
    if (!row || row.state === 'gap') continue;
    const drop = step.status === 'тупик' ? row.score : Math.min(row.score, Math.max(1, row.score - 1));
    page.score -= step.status === 'тупик' ? row.score : row.score - drop;
    row.score = step.status === 'тупик' ? 0 : drop;
    row.state = step.status === 'тупик' ? 'gap' : 'check';
    row.wordVerdict = step.status === 'тупик' ? 'критично' : 'перевірити';
    row.now = `${row.now}. Journey: ${step.result}`;
    page.counts = { ok: page.rows.filter((r) => r.state === 'ok').length, check: page.rows.filter((r) => r.state === 'check').length, gap: page.rows.filter((r) => r.state === 'gap').length };
    page.fixes.unshift({ what: `Інтерактивний дефект (journey): ${step.stage.toLowerCase()}`, crit: step.status === 'тупик' ? 'Блокирующая' : 'Высокая', why: step.result });
  }
}

/** Собирает полную модель постраничного аудита по эталону. */
export function buildSiteAudit(ds: AuditDataset, opts: { journey?: JourneyLink[] } = {}): SiteAuditReport {
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
  if (opts.journey?.length) {
    applyJourney(pages, opts.journey);
    // applyJourney меняет page.score ПОСЛЕ того, как строки дерева уже собраны со
    // старым баллом (строка выше). Без пересинхронизации дерево показывает балл ДО
    // journey (23/27), а детальная карточка — ПОСЛЕ (22/27) — источник расхождения
    // цифр в отчёте. Пересобираем строки дерева из фактического состояния страниц.
    for (const row of tree) {
      if (row.max <= 0) continue; // «(доп.)»-строки живут по compliance %, а не по блок-баллу
      const pg = pages.find((p) => p.kind === row.kind && p.url === row.url) ?? pages.find((p) => p.kind === row.kind);
      if (pg) { row.score = pg.score; row.max = pg.max; row.pct = pg.max ? Math.round((pg.score / pg.max) * 100) : 0; }
    }
  }
  const totalScore = pages.reduce((s, p) => s + p.score, 0);
  const totalMax = pages.reduce((s, p) => s + p.max, 0);
  const totalPct = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;
  let client = ds.client.finalUrl;
  try { client = new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  // Пробел покрытия: коммерческий сайт без разобранной PDP — вывод даём с оговоркой,
  // а не «близко к эталону» (реальный прогон: 88% при полном отсутствии PDP в выборке).
  const hasPdp = pages.some((p) => p.kind === 'pdp');
  const looksCommerce = pages.some((p) => ['plp', 'cart', 'checkout'].includes(p.kind)) || (ds.client.links ?? []).length > 100;
  let verdict = verdictLine(totalPct);
  let warning: string | undefined;
  if (!hasPdp && looksCommerce) {
    warning = 'Картка товару (PDP) не потрапила у вибірку обходу — головний конвертувальний тип сторінки не розібрано. Бал відповідності стосується лише розібраних типів; висновок по вітрині — із застереженням до розбору PDP.';
    verdict = `За розібраними типами — ${totalPct}%, але PDP не розібрано: висновок про вітрину неповний (пробіл покриття, а не «все добре»).`;
  }
  return { client, takenAt: ds.takenAt, tier: ds.tier, pages, tree, totalScore, totalMax, totalPct, systemic: systemicDefects(ds), verdict, warning, pageTypes: ds.client.pageTypes ?? [], soft404: ds.client.soft404 ?? null };
}

export { KIND_LABEL };
