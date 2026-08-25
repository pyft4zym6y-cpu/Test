/**
 * Контент-аудит як ЦІЛІСНА НЕЗАЛЕЖНА СИСТЕМА (C1→C7), а не «100 зауважень до текстів».
 *
 * Принцип (аналогічно UX/UI-флоу): контент оцінюємо не як окремі тексти, а як
 * систему, що веде користувача до рішення — закриває попит, знімає заперечення,
 * будує довіру і призводить до цільової дії. Результат — не список правок, а
 * КАРТА: архітектура контенту → Content Score → інвентар типів → поблокові
 * картки (Зараз → Проблема → Як має бути → Рекомендація → Ефект) → Content Gap
 * Map → карта перелінковки → рішення Keep/Merge/Rewrite/Remove/Create → roadmap.
 *
 * Модуль детермінований (жодних викликів моделі): бере факт-слой обходу
 * (блоки, слова, мова, внутрішні посилання) + готовий ContentReport і
 * постраничний site-audit, і збирає з них цілісну систему.
 */
import type { AuditDataset } from './report.js';
import type { PageKind } from './crawl.js';
import type { ContentReport } from './contentaudit.js';
import { buildSiteAudit, type BlockState } from './pagereport.js';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

// C-рівень спайна: послідовність аудиту контенту.
export type ContentLayer = { id: string; title: string; principle: string; state: string };

// Content Score — 10 напрямків, кожен /10.
export type CScoreAxis = { key: string; label: string; score: number; note: string };

// Інвентар типів контенту (крок 4).
export type ContentTypeRow = { name: string; present: boolean; purpose: string; stage: string };

// Поблокова картка контент-аудиту (крок 8) — повна анатомія Fragstore.
export type ContentBlockCard = {
  page: string; pageUrl: string; key: string; name: string;
  purpose: string;      // Призначення — навіщо блок
  audience: string;     // ЦА — для кого
  task: string;         // Задача — яку проблему рішення закриває
  now: string;          // Поточний контент
  problem: string;      // Що не працює
  missing: string;      // Якого контенту бракує
  should: string;       // Як має бути (еталон)
  ux: number; cro: number; seo: number; geo: number; // осі 1..5
  links: string[];      // куди веде (внутрішні посилання)
  cta: string;          // яку дію пропонує
  score: number;        // підсумок 1..5
  priority: Priority;
  recommendation: string;
  effect: string;
};

// Content Gap Map (крок 16).
export type ContentGap = { title: string; why: string; create: string; where: string; priority: Priority };

// Карта перелінковки (крок 15).
export type LinkingMap = {
  pagesAnalyzed: number;
  uniqueInternalUrls: number;       // унікальних внутрішніх URL у карті сайту
  homeOutlinks: number;             // внутрішніх посилань, знайдених на головній
  orphanPages: { label: string; url: string }[];
  deadEndBlocks: number;            // блоки-глухі кути (мали б вести далі, але виходу нема)
  keyPageLinksNow: number;          // посилань дають сильні блоки головної зараз (проєкція)
  keyPageLinksTarget: number;       // дала б повна композиція головної (проєкція)
  keyPageLabel: string;
};

// Рішення по контенту (крок 17).
export type ContentDecision = { verb: 'Keep' | 'Merge' | 'Rewrite' | 'Remove' | 'Create'; count: number; note: string };

export type ContentFlowReport = {
  spine: ContentLayer[];
  score: { axes: CScoreAxis[]; overall: number };
  types: ContentTypeRow[];
  cards: ContentBlockCard[];
  gaps: ContentGap[];
  linking: LinkingMap;
  decisions: ContentDecision[];
  roadmap: { phase: string; items: string[] }[];
};

const KIND_LABEL: Record<PageKind, string> = { home: 'Головна', plp: 'Каталог', pdp: 'Картка товару', cart: 'Кошик', checkout: 'Оформлення', content: 'Стаття / контент', faq: 'FAQ', other: 'Службова' };
const clamp5 = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
const half = (n: number) => Math.round(Math.max(1, Math.min(5, n)) * 2) / 2;
const shortUrl = (u: string) => { try { const x = new URL(u); return x.pathname === '/' ? '/' : x.pathname; } catch { return u; } };

/* ── Контентна анатомія блоку: призначення / ЦА / задача / як має бути / бракує /
      CTA / посилання / ефект — детерміновані шаблони, ключ = ключ блоку. ── */
type CTpl = { purpose: string; audience: string; task: string; should: string; missing: string; cta: string; links: string[]; effect: string; geoStrong?: boolean; croStrong?: boolean };
const C_TPL: Record<string, CTpl> = {
  hero: { purpose: 'Позиціонування і головний оффер за 5 секунд', audience: 'Новий відвідувач із реклами/пошуку', task: 'Пояснити «куди я потрапив і що тут є»', should: 'Один головний оффер + підзаголовок вигоди + первинний CTA у каталог. Без каруселі з 5 конкурентних банерів.', missing: 'конкретна вигода під заголовком, первинний CTA', cta: 'Перейти в каталог / до підбірки', links: ['каталог', 'хіти продажу'], effect: 'Швидше розуміння пропозиції, менше відмов на вході', croStrong: true },
  usp_bar: { purpose: 'Причина купувати саме тут', audience: 'Порівнює з конкурентами/маркетплейсом', task: 'Зняти питання «чому ви, а не вони»', should: '4 конкретні переваги з цифрами (термін доставки, гарантія, власне виробництво, повернення) — не «якість і сервіс».', missing: 'цифри й конкретика замість загальних слів', cta: 'Дізнатися про переваги/гарантію', links: ['/garantiya', '/dostavka', '/about'], effect: 'Диференціація від конкурентів, менше «подумаю»', croStrong: true },
  trust: { purpose: 'Знімає заперечення перед оплатою', audience: 'Сумнівається, чи безпечно платити', task: 'Побудувати довіру в точці рішення', should: 'Іконки-гарантії (доставка/оплата/повернення) → повноцінні картки з конкретикою і посиланнями на умови + міні-відгуки.', missing: 'умови під іконками, посилання на політики, соц.доказ', cta: 'Умови повернення / гарантії', links: ['/dostavka', '/oplata', '/garantiya', '/vozvrat'], effect: 'Менше відмов на кроці оплати', croStrong: true },
  reviews: { purpose: 'Соціальний доказ репутації', audience: 'Той, кому потрібне підтвердження від інших', task: 'Підтвердити, що товару/магазину довіряють', should: 'Реальні відгуки з іменами/фото, «підтверджена покупка», агрегатний рейтинг з розміткою, відповіді бренду.', missing: 'фото покупців, розмітка рейтингу, відповіді на негатив', cta: 'Читати всі відгуки', links: ['усі відгуки', 'фото покупців'], effect: 'Зростання довіри, вища конверсія картки', croStrong: true, geoStrong: true },
  faq: { purpose: 'Знімає заперечення + годує AI-видачу', audience: 'Той, у кого залишились питання перед покупкою', task: 'Відповісти на питання вибору прямо', should: 'Акордеон 6–8 питань зі schema.org/FAQPage, відповіді 40–60 слів, тематичні виходи в каталог/умови (не «глухий кут» після відповіді).', missing: 'FAQPage-розмітка, виходи в каталог, реальні питання покупців', cta: 'Не знайшли відповідь → підтримка', links: ['/dostavka', '/oplata', 'каталог'], effect: 'Потрапляння в прямі відповіді та AI-цитування', geoStrong: true },
  qa: { purpose: 'Реальні заперечення від покупців', audience: 'Той, хто шукає відповідь на конкретний сумнів', task: 'Закрити заперечення словами покупців', should: 'Q&A з розміткою QAPage; питання від реальних покупців, самодостатні відповіді, повідомлення про нову відповідь.', missing: 'QAPage-розмітка, форма питання, самодостатні відповіді', cta: 'Задати питання', links: ['схожі питання'], effect: 'Зняті заперечення + унікальний контент для AEO', geoStrong: true },
  description: { purpose: 'Деталі товару під питання вибору', audience: 'Той, хто вирішує «чи підійде мені»', task: 'Дати інформаційний приріст для рішення', should: 'Процес, сировина, цифри виробництва, сценарії використання — те, що цитують генеративні системи. Не переписаний опис постачальника.', missing: 'інформаційний приріст виробника, сценарії, цифри', cta: 'Характеристики / порівняти', links: ['характеристики', 'схожі товари'], effect: 'Рішення без переходу в пошук; AI-цитування', geoStrong: true },
  specifications: { purpose: 'Порівняння і вибір за атрибутами', audience: 'Раціональний покупець, порівнює моделі', task: 'Дати значення, а не лише числа', should: 'Таблиця «значення + сенс»: «300 г/м² · середня щільність». Атрибути з довідника, кожна характеристика перекладена на мову рішення.', missing: 'таблиця, пояснення значень, повнота атрибутів', cta: 'Порівняти з іншими', links: ['порівняння', 'схожі'], effect: 'Швидше рішення, менше повернень «не те» ', geoStrong: true },
  category_description: { purpose: 'Контекст вибору категорії + видимість', audience: 'Той, хто ще звужує вибір', task: 'Пояснити, як обрати в цій категорії', should: 'Короткий корисний вступ (60–90 слів) + перелінковка на підкатегорії/гайди, розгорнутий текст — під сіткою, не «портянка» заради SEO.', missing: 'корисний вступ, перелінковка на підкатегорії/гайди', cta: 'Перейти в підкатегорію / гайд', links: ['підкатегорії', 'гайди'], effect: 'Категорія збирає середньо- і низькочастотний попит', geoStrong: true },
  related: { purpose: 'Альтернатива і зростання чека', audience: 'Той, хто ще обирає або добирає', task: 'Утримати у виборі й підняти AOV', should: 'ТРИ різні блоки: «інші кольори моделі», «з цим беруть», «схожі» — не одна карусель.', missing: 'розділення на 3 сценарії, релевантність добірки', cta: 'Додати супутній / переглянути схоже', links: ['аксесуари', 'схожі товари'], effect: 'Зростання середнього чека і глибини перегляду', croStrong: true },
  category_title: { purpose: 'Підтвердження місця + пошуковий сигнал', audience: 'Прийшов із пошуку за темою', task: 'Підтвердити «я там, де шукав»', should: 'H1 із предметом категорії (не «Каталог»). Категорія — головна посадкова під тематичні запити.', missing: 'предметний H1 замість службового', cta: '', links: [], effect: 'Краща релевантність і клікабельність у пошуку' },
  breadcrumbs: { purpose: 'Положення в структурі + перелінковка ваги', audience: 'Той, хто орієнтується і повертається на рівень вище', task: 'Дати контекст і шлях назад', should: 'Повний шлях із розміткою BreadcrumbList — навігація вгору і передача ваги за структурою.', missing: 'повнота шляху, BreadcrumbList-розмітка', cta: '', links: ['категорія', 'підкатегорія'], effect: 'Краща індексація й навігація, sitelinks у пошуку' },
  product_grid: { purpose: 'Ядро лістингу — залучення в товар', audience: 'Той, хто переглядає асортимент', task: 'Дати сканувати і швидко перейти в товар', should: 'Керовані добірки (бестселери/новинки/сезон); картка: фото, ціна, рейтинг, наявність, швидкі дії. Єдина висота — скановність.', missing: 'керований мерчандайзинг, рейтинг/наявність у картці', cta: 'Перейти в товар', links: ['картка товару'], effect: 'Глибше проникнення в каталог, більше переходів у товар' },
  author: { purpose: 'Експертність матеріалу (E-E-A-T)', audience: 'Читач інформаційного контенту + пошук/AI', task: 'Підтвердити авторитетність джерела', should: 'Автор з експертизою, дата оновлення, коротке біо — сигнали довіри для пошуку та AI-видачі.', missing: 'автор, дата оновлення, експертне біо', cta: '', links: ['інші матеріали автора'], effect: 'Вища довіра пошуку/AI до контенту', geoStrong: true },
  toc: { purpose: 'Навігація по довгому матеріалу', audience: 'Читач довгої статті/гайду', task: 'Дати швидко дійти до потрібного розділу', should: 'Якірний зміст для довгих матеріалів — навігація і sitelinks у видачі.', missing: 'якірний зміст із посиланнями', cta: '', links: ['розділи статті'], effect: 'Краща читабельність + sitelinks' },
  footer_contacts: { purpose: 'Реквізити довіри і навігація', audience: 'Той, хто перевіряє «хто продавець»', task: 'Дати паспорт магазину', should: 'Повні реквізити (юрособа, адреса), робочий e-mail/телефон, правові сторінки, оплата/доставка.', missing: 'повні реквізити, правові сторінки, контакти', cta: 'Контакти / про компанію', links: ['/about', '/contacts', '/dostavka', '/oplata', '/oferta'], effect: 'Довіра до продавця + внутрішня перелінковка' },
};

// Блоки, які НЕ несуть контент-навантаження (чисто UI/механіка) — у контент-картки не йдуть.
const NON_CONTENT = new Set(['search', 'filters', 'sort', 'view_toggle', 'pagination', 'add_to_cart', 'price', 'gallery', 'variants', 'qty_control', 'wishlist', 'promo_code', 'delivery_calc', 'order_summary', 'continue_shopping', 'delivery_selection', 'payment_selection', 'guest_checkout', 'contact_form', 'recently_viewed', 'newsletter', 'product_count', 'delivery', 'payment', 'video']);

const stateScore: Record<BlockState, number> = { ok: 5, weak: 3, check: 2.5, gap: 1 };
const priFor = (state: BlockState, weight: string): Priority => {
  const gapOrWeak = state === 'gap' || state === 'weak';
  const r = gapOrWeak ? (weight === 'core' ? 0 : weight === 'important' ? 1 : 2) : (weight === 'core' ? 1 : weight === 'important' ? 2 : 3);
  return (['P0', 'P1', 'P2', 'P3'] as const)[r];
};

export function buildContentFlow(ds: AuditDataset, content: ContentReport): ContentFlowReport {
  const site = buildSiteAudit(ds);
  const pages = ds.client.pages.filter((p) => !p.error && p.ux);

  // Об'єднана мапа наявних блоків по всьому сайту + сигнали типів контенту.
  const anyBlock = new Set<string>();
  for (const p of pages) for (const [k, v] of Object.entries(p.ux!.blocks ?? {})) if (v) anyBlock.add(k);
  const kinds = new Set(pages.map((p) => p.kind));
  // Внутрішні URL — з карти сайту (site-wide), не з окремих сторінок (обхід зберігає їх агреговано).
  const siteLinks = ds.client.links ?? [];
  const discovered = ds.client.discoveredLinks ?? siteLinks.length;

  /* ── C1: інвентар типів контенту ── */
  const has = (...keys: string[]) => keys.some((k) => anyBlock.has(k));
  const types: ContentTypeRow[] = [
    { name: 'Заголовки (H1/H2/H3)', present: has('category_title', 'product_header', 'hero'), purpose: 'Структура і пошуковий сигнал', stage: 'усі етапи' },
    { name: 'Описи товару', present: has('description'), purpose: 'Інформаційний приріст для рішення', stage: 'Розгляд' },
    { name: 'Характеристики / таблиці', present: has('specifications'), purpose: 'Порівняння за атрибутами', stage: 'Розгляд' },
    { name: 'Переваги / УТП', present: has('usp_bar'), purpose: 'Причина купувати тут', stage: 'Інтерес' },
    { name: 'Відгуки / рейтинги', present: has('reviews'), purpose: 'Соціальний доказ', stage: 'Рішення' },
    { name: 'FAQ / Q&A', present: has('faq', 'qa'), purpose: 'Зняття заперечень + AEO', stage: 'Рішення' },
    { name: 'Блок довіри / гарантії', present: has('trust'), purpose: 'Безпека покупки', stage: 'Рішення' },
    { name: 'SEO-текст категорії', present: has('category_description'), purpose: 'Контекст + видимість', stage: 'Інтерес' },
    { name: 'Експертний / інформаційний контент', present: kinds.has('content'), purpose: 'Попит на верхній воронці, E-E-A-T', stage: 'Обізнаність' },
    { name: 'Cross-sell / підбірки', present: has('related'), purpose: 'Зростання AOV', stage: 'Рішення' },
    { name: 'Хлібні крихти', present: has('breadcrumbs'), purpose: 'Навігація + перелінковка', stage: 'усі етапи' },
    { name: 'Контент-хаб / база знань', present: kinds.has('content') && (content.rows.filter((r) => r.pageType === 'Контент').length > 1), purpose: 'Система інформаційного контенту', stage: 'Обізнаність' },
  ];

  /* ── C2: поблокові контент-картки для ключових сторінок ── */
  const KEY_KINDS: PageKind[] = ['home', 'plp', 'pdp', 'content', 'faq'];
  const cards: ContentBlockCard[] = [];
  for (const pr of site.pages) {
    if (!KEY_KINDS.includes(pr.kind)) continue;
    for (const row of pr.rows) {
      if (NON_CONTENT.has(row.key)) continue;
      const tpl = C_TPL[row.key];
      if (!tpl) continue; // без контентного шаблону — не вигадуємо
      if (row.state === 'ok') continue; // сильний блок правок не потребує
      const base = stateScore[row.state];
      // осі: релевантна вісь = base, інші трохи вищі; GEO/CRO підсилюємо за шаблоном
      const ux = clamp5(base + 0.5);
      const cro = clamp5(tpl.croStrong ? base : base + 1);
      const seo = clamp5(base + 0.5);
      const geo = clamp5(tpl.geoStrong ? base : base + 1);
      const score = half((ux + cro + seo + geo) / 4);
      const problem = row.state === 'gap' ? `Блок відсутній — ${tpl.task.toLowerCase()} не закрито`
        : row.state === 'weak' ? (row.now.replace(/^Слабко:\s*/, '') || 'є, але не за еталоном контенту')
        : 'не підтверджено обходом (можливо приховано / за JS / табом)';
      cards.push({
        page: KIND_LABEL[pr.kind], pageUrl: shortUrl(pr.url), key: row.key, name: row.name,
        purpose: tpl.purpose, audience: tpl.audience, task: tpl.task,
        now: row.now, problem, missing: tpl.missing, should: tpl.should,
        ux, cro, seo, geo, links: row.state === 'check' ? [] : tpl.links, cta: tpl.cta,
        score, priority: priFor(row.state, row.weight),
        recommendation: row.state === 'gap' ? `Створити блок «${row.name}»: ${tpl.should}` : `Довести контент блоку до еталона: ${tpl.should}`,
        effect: tpl.effect,
      });
    }
  }
  // сортуємо: спершу P0, потім за оцінкою (гірші вище)
  const priRank: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  cards.sort((a, b) => priRank[a.priority] - priRank[b.priority] || a.score - b.score);

  /* ── C3: Content Gap Map ── */
  const gaps: ContentGap[] = [];
  if (!kinds.has('content')) gaps.push({ title: 'Немає інформаційного контенту (гайди / «Як обрати»)', why: 'Верхня частина воронки не охоплена: попит «як обрати/порівняти» іде до конкурентів і в AI-видачу', create: 'Гайди «Як обрати …», порівняння матеріалів, розбір характеристик', where: 'Розділ «База знань», перелінкований із категоріями', priority: 'P1' });
  if (!has('faq', 'qa')) gaps.push({ title: 'Немає FAQ / Q&A', why: 'Заперечення не зняті на сайті — покупець іде питати в підтримку або до конкурента; втрата AEO-видачі', create: 'FAQ за категоріями + Q&A на картках зі schema-розміткою', where: 'Категорії, картки товару, окрема сторінка FAQ', priority: 'P0' });
  if (!has('reviews')) gaps.push({ title: 'Немає відгуків / соц. доказу', why: 'Немає підтвердження репутації в точці рішення — вища тривожність, нижча конверсія', create: 'Відгуки з фото/іменами, агрегатний рейтинг із розміткою', where: 'Картки товару, головна, окрема сторінка відгуків', priority: 'P0' });
  if (!has('specifications')) gaps.push({ title: 'Немає структурованих характеристик', why: 'Раціональний вибір неможливий без порівнюваних атрибутів; genAI нема що цитувати', create: 'Таблиці характеристик «значення + сенс» з довідника атрибутів', where: 'Картки товару', priority: 'P1' });
  if (!has('category_description')) gaps.push({ title: 'Немає корисних описів категорій', why: 'Категорії не збирають середньо-/низькочастотний попит і не пояснюють вибір', create: 'Короткий вступ + перелінковка на підкатегорії/гайди', where: 'Сторінки категорій', priority: 'P2' });
  gaps.push({ title: 'Немає контенту «після покупки»', why: 'Retention не підтримано контентом: інструкції, догляд, гарантійні сценарії', create: 'Інструкції з догляду/використання, сторінки гарантійного обслуговування', where: 'База знань + лист після покупки', priority: 'P2' });

  /* ── C4: карта перелінковки ── */
  // orphan: типи сторінок, знайдені картою, але без розбору (наближення orphan-контенту)
  const parsed = new Set(pages.map((p) => shortUrl(p.url)));
  const orphanPages = (ds.client.pageTypes ?? [])
    .filter((t) => t.status === 'найдена' && t.url && !parsed.has(shortUrl(t.url!)))
    .map((t) => ({ label: t.label, url: shortUrl(t.url!) }))
    .slice(0, 8);
  // dead-end блоки на головній: контентні блоки, що МАЮТЬ вести далі (є шаблонні посилання),
  // але їх немає / вони не за еталоном → вихід відсутній.
  const homeRep = site.pages.find((p) => p.kind === 'home');
  const deadEndBlocks = homeRep ? homeRep.rows.filter((r) => !NON_CONTENT.has(r.key) && (C_TPL[r.key]?.links?.length ?? 0) > 0 && r.state !== 'ok').length : 0;
  // Проєкція внутрішніх посилань головної: скільки дають сильні блоки зараз vs скільки дала б повна композиція.
  const keyPageLinksNow = homeRep ? homeRep.rows.filter((r) => r.state === 'ok' && (C_TPL[r.key]?.links?.length ?? 0) > 0).reduce((s, r) => s + C_TPL[r.key]!.links.length, 0) : 0;
  const keyPageLinksTarget = homeRep ? homeRep.rows.filter((r) => !NON_CONTENT.has(r.key) && (C_TPL[r.key]?.links?.length ?? 0) > 0).reduce((s, r) => s + C_TPL[r.key]!.links.length, 0) : 0;
  const linking: LinkingMap = {
    pagesAnalyzed: pages.length, uniqueInternalUrls: siteLinks.length, homeOutlinks: discovered,
    orphanPages, deadEndBlocks,
    keyPageLinksNow, keyPageLinksTarget, keyPageLabel: 'Головна',
  };

  /* ── C5: Content Score — 10 напрямків /10 ── */
  const a = content.avg; // 1..5
  const thinRatio = pages.length ? pages.filter((p) => (p.ux!.bodyWords ?? 0) > 0 && (p.ux!.bodyWords ?? 0) < (p.kind === 'pdp' ? 150 : p.kind === 'content' ? 300 : 80)).length / pages.length : 0;
  const geoSignals = [has('faq', 'qa'), has('description'), has('specifications'), has('author'), has('category_description')].filter(Boolean).length;
  const expertSignals = [kinds.has('content'), has('author'), has('specifications')].filter(Boolean).length;
  const structSignals = [has('breadcrumbs'), has('category_title', 'product_header'), has('toc')].filter(Boolean).length;
  const axes: CScoreAxis[] = [
    { key: 'completeness', label: 'Повнота', score: clamp10(a.completeness * 2), note: 'Чи є на сторінках усе для рішення' },
    { key: 'usefulness', label: 'Корисність', score: clamp10(a.usefulness * 2), note: 'Чи допомагає контент обрати швидше' },
    { key: 'quality', label: 'Якість', score: clamp10(7 - thinRatio * 5), note: `Тонкого контенту ~${Math.round(thinRatio * 100)}% сторінок` },
    { key: 'expertise', label: 'Експертність', score: clamp10(3 + expertSignals * 2), note: 'E-E-A-T: автор, довідник, інфо-контент' },
    { key: 'commercial', label: 'Комерційна ефективність', score: clamp10(a.persuasiveness * 2), note: 'Докази й заклики в точках рішення' },
    { key: 'ux', label: 'UX контенту', score: clamp10(4 + structSignals * 2), note: 'Заголовки, крихти, навігація по тексту' },
    { key: 'seo', label: 'SEO', score: clamp10((has('category_description') ? 3 : 1) + (has('breadcrumbs') ? 2 : 0) + (has('category_title', 'product_header') ? 3 : 1)), note: 'Семантика, заголовки, посадкові' },
    { key: 'geoaeo', label: 'GEO / AEO', score: clamp10(2 + geoSignals * 1.6), note: 'Придатність до AI-видачі (прямі відповіді, факти)' },
    { key: 'linking', label: 'Перелінковка', score: clamp10(Math.min(10, discovered / 10)), note: `~${discovered} внутр. посилань на головній; ${siteLinks.length} унік. URL у карті` },
    { key: 'freshness', label: 'Актуальність', score: 0, note: 'Ціни/наявність/дати — перевіряється після доступу до CMS' },
  ];
  const scored = axes.filter((x) => x.score > 0);
  const overall = scored.length ? clamp10(scored.reduce((s, x) => s + x.score, 0) / scored.length) : 0;

  /* ── C6: рішення Keep/Merge/Rewrite/Remove/Create ── */
  const keep = cards.filter((c) => c.score >= 4).length + site.pages.reduce((s, p) => s + p.rows.filter((r) => r.state === 'ok' && !NON_CONTENT.has(r.key)).length, 0);
  const rewrite = cards.filter((c) => c.priority === 'P1' || c.priority === 'P2').length + Math.round(thinRatio * pages.length);
  const create = gaps.length + cards.filter((c) => c.priority === 'P0').length;
  const decisions: ContentDecision[] = [
    { verb: 'Keep', count: keep, note: 'Сильні блоки/сторінки — залишити як є' },
    { verb: 'Rewrite', count: rewrite, note: 'Слабкий/тонкий контент — переписати до еталона' },
    { verb: 'Create', count: create, note: 'Відсутні блоки і типи контенту — створити' },
    { verb: 'Merge', count: Math.max(0, orphanPages.length - 2), note: 'Дублі й розрізнені матеріали — обʼєднати в хаби' },
    { verb: 'Remove', count: 0, note: 'Кандидати на видалення уточнюються з доступом до аналітики' },
  ];

  /* ── C7: roadmap ── */
  const p0cards = cards.filter((c) => c.priority === 'P0');
  const roadmap = [
    { phase: 'Quick wins (1–2 тижні)', items: [
      ...(has('faq', 'qa') ? [] : ['Додати FAQ зі schema-розміткою на топ-категорії й картки']),
      ...(has('trust') ? ['Підсилити блок довіри конкретикою і посиланнями'] : ['Додати блок довіри в точки рішення']),
      'Прибрати «воду», ущільнити тонкі описи ключових сторінок',
    ] },
    { phase: 'Rewrite (2–4 тижні)', items: [
      'Переписати картки товару під питання вибору (опис-приріст + характеристики таблицею)',
      'Категорійні описи під попит із перелінковкою на підкатегорії',
      ...(p0cards.length ? [`Закрити ${p0cards.length} P0-блоків із поблокових карток`] : []),
    ] },
    { phase: 'New content (1–2 міс)', items: [
      'Контент-хаб: гайди «Як обрати», порівняння, догляд',
      'Q&A з реальних питань покупців + контент «після покупки»',
    ] },
    { phase: 'Linking & hubs (паралельно)', items: [
      `Перелінковка: підняти внутрішні посилання на головній з ~${keyPageLinksNow} до ~${keyPageLinksTarget}, прибрати блоки-глухі кути`,
      'Звʼязати інфо-контент → категорія → товар → комерційна сторінка',
    ] },
    { phase: 'SEO / GEO / AEO', items: [
      'Семантичне покриття категорій, зняття канібалізації й дублів',
      'Структуровані відповіді, таблиці, факти й авторство — під AI-видачу',
    ] },
  ].map((ph) => ({ phase: ph.phase, items: ph.items.filter(Boolean) })).filter((ph) => ph.items.length);

  /* ── Спайн (послідовність аудиту) ── */
  const spine: ContentLayer[] = [
    { id: 'C1', title: 'C1 · Контентна архітектура', principle: 'Спершу система, а не тексти: які типи контенту існують і чи є з них система, а не набір розрізнених сторінок.', state: `${types.filter((t) => t.present).length}/${types.length} типів контенту присутні${kinds.has('content') ? '' : '; немає інформаційного шару (гайди/база знань)'}.` },
    { id: 'C2', title: 'C2 · Постраничний та поблоковий контент', principle: 'Кожен блок ключових сторінок — окрема одиниця розбору: Зараз → Проблема → Як має бути → Рекомендація → Ефект.', state: `${cards.length} блоків потребують контентних правок на ключових сторінках (${cards.filter((c) => c.priority === 'P0').length} × P0).` },
    { id: 'C3', title: 'C3 · Content Gap Map', principle: 'Визначаємо, якого контенту НЕМАЄ взагалі — за потребами користувача, попитом і воронкою.', state: `${gaps.length} контентних розривів; ${gaps.filter((g) => g.priority === 'P0').length} критичних.` },
    { id: 'C4', title: 'C4 · Перелінковка', principle: 'Контент має вести далі: інфо → хаб → категорія → товар → комерційна дія. Без виходів контент — глухий кут.', state: `~${discovered} внутр. посилань на головній; ${orphanPages.length} потенційно orphan-сторінок; ${deadEndBlocks} блоків без виходів.` },
    { id: 'C5', title: 'C5 · Content Score', principle: 'Зводимо оцінку в 10 напрямків — від повноти до GEO/AEO — в єдиний бал, а не в купу зауважень.', state: `Загальний Content Score — ${overall}/10 (актуальність — після доступу до CMS).` },
    { id: 'C6', title: 'C6 · Рішення по контенту', principle: 'Кожна одиниця контенту отримує рішення: Keep / Rewrite / Create / Merge / Remove.', state: `Rewrite — ${rewrite}, Create — ${create}, Keep — ${keep}.` },
    { id: 'C7', title: 'C7 · Контентний Roadmap', principle: 'Фінал — не список правок, а план: quick wins → rewrite → new content → linking → SEO/GEO/AEO.', state: `${roadmap.length} фаз, впорядкованих за Impact×Effort.` },
  ];

  return { spine, score: { axes, overall }, types, cards, gaps, linking, decisions, roadmap };
}
