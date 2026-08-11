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

/** Сквозные требования по типу страницы (наскрізні вимоги из эталонов): не UX-блоки,
 *  а технические/коммерческие требования (TECH/PERF/SEO/ANL/A11Y/PRICE/LAW). */
export type ReqRow = { dims: Dim[]; req: string; why: string };
const REQUIREMENTS: Partial<Record<PageKind, ReqRow[]>> = {
  pdp: [
    { dims: ['TECH', 'SEO'], req: 'Разметка Product + Offer + AggregateRating + QAPage; один canonical на модель', why: 'Без Offer нет цены и наличия в выдаче; отзывы товара не смешиваются с отзывами магазина' },
    { dims: ['PERF'], req: 'Галерея с lazy-load, главное фото в приоритете загрузки, формат WebP', why: 'Карточка с 5 типами медиа — самая тяжёлая страница сайта, LCP решает здесь' },
    { dims: ['SEO'], req: 'Title с моделью, составом и размером; уникальный description; без «грн грн» от шаблона', why: 'Дефект шаблона множится на все карточки сразу' },
    { dims: ['CONT'], req: 'Атрибуты из справочника, не руками; фото привязаны к правильной коллекции', why: 'Перепутанные фотоактивы — прямая причина возвратов «пришло не то»' },
    { dims: ['ANL'], req: 'События: просмотр, выбор варианта, зум фото, раскрытие ухода, запрос образца, добавление в корзину', why: 'Без события на выбор варианта нельзя понять, какой цвет/размер реально берут' },
    { dims: ['A11Y'], req: 'Свотчи цвета с текстовым названием; управление галереей с клавиатуры', why: 'Состояние, переданное только цветом, недоступно части пользователей' },
    { dims: ['PRICE'], req: 'Цена не выше, чем в собственных каналах на маркетплейсах', why: 'Покупатель сравнивает за минуту; дороже на своём сайте — потерянная конверсия и доверие' },
    { dims: ['LAW'], req: 'Старая цена соответствует действительности; состав и страна происхождения точны', why: 'Постоянная «скидка» от завышенной базы — риск по закону о рекламе' },
  ],
  plp: [
    { dims: ['SEO', 'TECH'], req: 'Пагинация индексируема (rel next/canonical), фасеты не плодят дубли URL', why: 'Фильтры без контроля индексации создают тысячи почти одинаковых страниц' },
    { dims: ['SEO', 'CONT'], req: 'Уникальный H1 и SEO-описание категории; хлебные крошки с разметкой', why: 'Категория — главная посадочная под тематические запросы' },
    { dims: ['PERF'], req: 'Ленивая подгрузка карточек, изображения WebP с размерами', why: 'Длинный листинг — тяжёлая страница; CLS и LCP роняют выдачу и конверсию' },
    { dims: ['ANL'], req: 'События: применение фильтра, сортировка, переход в карточку', why: 'Без событий фильтрации не видно, где теряется выбор' },
  ],
  home: [
    { dims: ['SEO', 'TECH'], req: 'Schema Organization + WebSite + SearchAction; один H1', why: 'Базовые сущности бренда в выдаче и sitelinks-поиск' },
    { dims: ['PERF'], req: 'LCP-баннер оптимизирован, шрифты с preload, без баннеров-«прыжков»', why: 'Первый экран главной — лицо скорости всего сайта' },
    { dims: ['LAW'], req: 'Условия акций, оферта, контакты и реквизиты доступны из футера', why: 'Юридические сигналы доверия и требования закона' },
  ],
  checkout: [
    { dims: ['SEC'], req: 'HTTPS, видимые сигналы безопасности оплаты, PCI-совместимый эквайринг', why: 'Тревога безопасности на оплате — прямая причина брошенных заказов' },
    { dims: ['ANL'], req: 'События каждого шага чекаута (контакты→доставка→оплата→успех)', why: 'Без пошаговых событий не видно, на каком шаге теряются заказы' },
    { dims: ['LAW'], req: 'Итоговая стоимость (доставка, комиссии) показана до оплаты', why: '39% отказов в чекауте — из-за скрытых затрат, всплывших поздно' },
    { dims: ['A11Y'], req: 'Формы с label, ошибки полей доступны и понятны', why: 'Недоступная форма чекаута теряет часть заказов молча' },
  ],
  faq: [
    { dims: ['AEO', 'GEO'], req: 'Самодостаточный ответ 40–60 слов первым + FAQPage-разметка', why: 'Ровно это попадает в блок прямых ответов и цитируется AI-системами' },
    { dims: ['TECH', 'SEO'], req: 'Каждая категория вопросов — отдельный URL', why: 'Вкладки без адресов: 5 из 6 категорий не существуют для поиска' },
    { dims: ['TECH', 'A11Y'], req: 'Ответы в HTML (не подгружаются скриптом), якорь на каждый вопрос, аккордеон с клавиатуры', why: 'Ответы в JS — краулер видит только заголовки; без якоря поддержка не пришлёт ссылку' },
    { dims: ['CONT'], req: 'Наполнение из реальных обращений (40–50 вопросов), не выдуманных', why: 'Три вопроса в категории — каркас без вмісту; источник — чат и поддержка' },
    { dims: ['ANL'], req: 'Оценка полезности ответа («была ли полезна»)', why: 'Самый дешёвый источник данных о том, какие ответы не работают' },
    { dims: ['LINK', 'CRO'], req: '2–3 выхода из каждого ответа (каталог/материал)', why: 'FAQ отвечает и должен вести в товар, а не в тупик' },
  ],
  content: [
    { dims: ['AEO', 'GEO'], req: 'Article/FAQPage разметка; самодостаточные ответы 40–60 слов', why: 'То, что попадает в блок прямых ответов и цитируется AI-системами' },
    { dims: ['LINK'], req: '2–3 ссылки из статьи в каталог/смежные материалы', why: 'Статья отвечает и должна вести в товар, а не в тупик' },
    { dims: ['CONT'], req: 'Автор, дата обновления, экспертность (E-E-A-T)', why: 'Сигналы доверия для поиска и AI-выдачи' },
  ],
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
};

const MAX_BY_WEIGHT: Record<Weight, number> = { core: 4, important: 3, nice: 2 };
const WORD: Record<BlockState, string> = { ok: 'сильно', check: 'проверить', gap: 'нет' };
const CRIT_BY_WEIGHT: Record<Weight, 'Блокирующая' | 'Высокая' | 'Средняя'> = { core: 'Блокирующая', important: 'Высокая', nice: 'Средняя' };
// Блоки, которые на L0 (внешний обход) достоверно не подтвердить при отсутствии —
// помечаем «проверить», а не «нет» (могут быть за табом/в JS/размётке).
const L0_UNCERTAIN = new Set(['qa', 'specifications', 'description', 'category_description', 'faq', 'variants']);

const KIND_LABEL: Record<PageKind, string> = {
  home: 'Главная', plp: 'Каталог', pdp: 'Карточка', cart: 'Корзина', checkout: 'Чекаут', content: 'Контент', faq: 'FAQ', other: 'Прочее',
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
  return { kind: p.kind, title: ref.title, chapter: ref.chapter, principle: ref.principle, url: p.finalUrl || p.url, conclusion, screenshot: p.screenshot, score, max, complianceScore: p.score, counts, rows, requirements: REQUIREMENTS[p.kind] ?? [], strong, fixes };
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
