/**
 * КАНОНИЧЕСКАЯ МОДЕЛЬ УРОВНЕЙ АУДИТА T1–T4.
 *
 * Одна переменная — ГЛУБИНА аудита (T1→T4). Чем выше тир, тем больше входных данных
 * и тем выше достоверность выводов (метод «факт вместо оценки»). Никаких отдельных
 * галочек «глубже / полнее» — это и есть тиры T3/T4, которые включаются выбором глубины.
 *
 * Модель — единый источник правды для:
 *  1) Excel-файла (лист на тир: исчерпывающий перечень вопросов и доступов);
 *  2) интейк-страницы портала (по каждому выбранному блоку раскрываются нужные
 *     доступы/документы/скрипты с приложенным ассетом).
 *
 * У каждого требования (вопрос / доступ / документ) может быть ASSET:
 *  · template     — готовый шаблон-файл, с которым нам удобно работать (скачивается);
 *  · instruction  — инструкция «для чайников», как выдать доступ на стороне клиента;
 *  · script       — скрипт/код (напр. для 100% доступа к сайту) + как запустить.
 */

export type Tier = 1 | 2 | 3 | 4;

export type TierLevel = {
  tier: Tier;
  code: 'T1' | 'T2' | 'T3' | 'T4';
  name: string;
  tagline: string;
  inputs: string;
  unlocks: string[];
  confidence: number; // потолок достоверности выводов, %
  covert: boolean; // подходит для негласного аудита (без ведома площадки)
};

export const TIERS: TierLevel[] = [
  {
    tier: 1,
    code: 'T1',
    name: 'Экспресс — внешний обход',
    tagline: 'Только публичный сайт. Без доступов и документов.',
    inputs: 'ссылка на сайт (+ по желанию конкуренты и текст запроса)',
    unlocks: [
      'структура, дерево и типы страниц',
      'on-page SEO, разметка, индексируемость',
      'GEO/AEO/LLM-видимость (crawlability, answerability)',
      'UX/UI и блочный разбор по эталону',
      'контент-покрытие, merchandising-сигналы, CRO-эвристики',
    ],
    confidence: 35,
    covert: true,
  },
  {
    tier: 2,
    code: 'T2',
    name: 'Базовый — + аналитика и поиск',
    tagline: 'Read-доступ к GA4 и Search Console + ответы на короткий бриф.',
    inputs: 'T1 + GA4 (просмотр), Search Console, ответы на бриф',
    unlocks: [
      'реальная воронка и источники трафика (не эвристика)',
      'поисковые запросы, показы, CTR, позиции',
      'корректность трекинга и событий',
      'разрыв «данные ⇄ то, что видно на сайте»',
    ],
    confidence: 55,
    covert: false,
  },
  {
    tier: 3,
    code: 'T3',
    name: 'Глубокий — + бизнес-данные и кабинеты',
    tagline: 'Выгрузки заказов/товаров, рекламные кабинеты, CRM, полный опросник.',
    inputs: 'T2 + выгрузки (заказы 24 мес, товары+себестоимость), Ads/CRM (просмотр), опросник',
    unlocks: [
      'оценка юнит-экономики (AOV, маржа, повторные, возвраты)',
      'ROI по каналам и медиа-микс',
      'retention/LTV, когорты, отток',
      'приоритезация в деньгах, а не «по ощущениям»',
    ],
    confidence: 78,
    covert: false,
  },
  {
    tier: 4,
    code: 'T4',
    name: 'Полный — живые доступы и интервью',
    tagline: '100% доступ: ERP/финансы/логи, интервью с командой, исследование клиентов.',
    inputs: 'T3 + живые коннекторы (ERP/финансы/склад), админка+логи, интервью, customer research',
    unlocks: [
      'сверка сайта ⇄ бэкенд ⇄ финансы (единая правда)',
      'полная unit economics и P&L-декомпозиция',
      'операционные узкие места (логистика, поддержка, склад)',
      'решения уровня стратегии с максимальной достоверностью',
    ],
    confidence: 92,
    covert: false,
  },
];

export const tierByCode = (code: string): TierLevel | undefined => TIERS.find((t) => t.code === code);

/* ───────────────────────── АССЕТЫ ─────────────────────────
 * template    → скачиваемый файл из /public/templates (поле filename);
 * instruction → инструкция «для чайников» (поле body, показывается инлайн);
 * script      → скрипт/код + как запустить (поле body, с кнопкой «копировать»).
 */
export type AssetKind = 'template' | 'instruction' | 'script';

export type Asset = {
  id: string;
  kind: AssetKind;
  title: string;
  note?: string; // одна строка-пояснение
  filename?: string; // для template: имя файла в /public/templates
  body?: string; // для instruction/script: содержимое (markdown-подобный текст)
  lang?: string; // для script: подсветка/подпись языка
};

export const ASSETS: Record<string, Asset> = {
  /* ── Шаблоны выгрузок (template) ── */
  'tpl-orders': {
    id: 'tpl-orders',
    kind: 'template',
    title: 'Шаблон выгрузки заказов (24 мес)',
    note: 'Колонки, которые нужны для расчёта денег. E-mail можно захешировать.',
    filename: 'orders-template.csv',
  },
  'tpl-products': {
    id: 'tpl-products',
    kind: 'template',
    title: 'Шаблон выгрузки товаров + себестоимости',
    note: 'SKU, цена, закупка, остаток, категория — основа маржи и ассортимента.',
    filename: 'products-cogs-template.csv',
  },
  'tpl-pnl': {
    id: 'tpl-pnl',
    kind: 'template',
    title: 'Шаблон управленческого P&L (12–24 мес)',
    note: 'Помесячно: выручка, COGS, маркетинг, опер. расходы. Для unit economics.',
    filename: 'pnl-template.csv',
  },
  'tpl-adspend': {
    id: 'tpl-adspend',
    kind: 'template',
    title: 'Шаблон медиа-плана / расходов на рекламу',
    note: 'Канал, месяц, расход, конверсии, доход — для ROI по каналам.',
    filename: 'ad-spend-template.csv',
  },
  'tpl-interview': {
    id: 'tpl-interview',
    kind: 'template',
    title: 'Гайд интервью с командой (T4)',
    note: 'Список вопросов по ролям: маркетинг, продукт, операции, поддержка.',
    filename: 'interview-guide.md',
  },
  'tpl-survey': {
    id: 'tpl-survey',
    kind: 'template',
    title: 'Анкета для клиентов (Voice of Customer)',
    note: 'Готовый опрос: причины покупки, барьеры, NPS. Вы делаете рассылку.',
    filename: 'customer-survey.md',
  },

  /* ── Инструкции «для чайников» (instruction) ── */
  'ins-ga4': {
    id: 'ins-ga4',
    kind: 'instruction',
    title: 'Как дать доступ к Google Analytics 4 (просмотр)',
    note: '2 минуты. Мы никогда не просим пароль — только приглашение на e-mail.',
    body: [
      '1. Откройте analytics.google.com под аккаунтом-владельцем.',
      '2. Внизу слева нажмите ⚙ «Администратор».',
      '3. В колонке «Ресурс» (Property) выберите «Управление доступом к ресурсу».',
      '4. Справа вверху «+» → «Добавить пользователей».',
      '5. Введите e-mail, который мы прислали.',
      '6. Роль — «Аналитик» (Viewer/Analyst). Снимите галочку «Уведомить по почте», если хотите.',
      '7. Нажмите «Добавить». Готово — напишите в комментарии «выдал».',
      '',
      'Мы получаем только просмотр. Менять настройки и данные мы не можем.',
    ].join('\n'),
  },
  'ins-gsc': {
    id: 'ins-gsc',
    kind: 'instruction',
    title: 'Как дать доступ к Google Search Console',
    note: 'Доступ на чтение поисковых данных: запросы, показы, ошибки индексации.',
    body: [
      '1. Откройте search.google.com/search-console.',
      '2. Выберите нужный ресурс (домен) вверху слева.',
      '3. ⚙ «Настройки» → «Пользователи и разрешения».',
      '4. «Добавить пользователя».',
      '5. E-mail — тот, что мы прислали. Разрешение — «Полный» (это доступ на чтение отчётов).',
      '6. «Добавить». Напишите в комментарии «выдал».',
    ].join('\n'),
  },
  'ins-gtm': {
    id: 'ins-gtm',
    kind: 'instruction',
    title: 'Как дать доступ к Google Tag Manager (чтение)',
    body: [
      '1. Откройте tagmanager.google.com.',
      '2. Выберите аккаунт и контейнер сайта.',
      '3. «Администрирование» → «Управление пользователями».',
      '4. «+» → «Добавить пользователей», введите наш e-mail.',
      '5. Права аккаунта — «Чтение», права контейнера — «Чтение». «Пригласить».',
    ].join('\n'),
  },
  'ins-google-ads': {
    id: 'ins-google-ads',
    kind: 'instruction',
    title: 'Как дать доступ к Google Ads (только чтение)',
    body: [
      '1. Войдите в ads.google.com.',
      '2. Вверху справа «Инструменты» (⚙) → раздел «Настройка» → «Доступ и безопасность».',
      '3. «+» → введите наш e-mail.',
      '4. Уровень доступа — «Только чтение». «Отправить приглашение».',
      '5. Скажите нам номер аккаунта (10 цифр вверху) — ускорит подтверждение.',
    ].join('\n'),
  },
  'ins-meta-ads': {
    id: 'ins-meta-ads',
    kind: 'instruction',
    title: 'Как дать доступ к Meta Ads (Facebook/Instagram)',
    body: [
      '1. Откройте business.facebook.com → «Настройки компании» (Business Settings).',
      '2. Слева «Пользователи» → «Люди» → «Добавить».',
      '3. Введите наш e-mail, назначьте роль «Сотрудник».',
      '4. Далее выберите рекламный аккаунт → доступ «Аналитик» (только просмотр).',
      '5. «Пригласить». Пришлите нам ID рекламного аккаунта.',
    ].join('\n'),
  },
  'ins-site-admin': {
    id: 'ins-site-admin',
    kind: 'instruction',
    title: 'Как дать доступ к админке сайта (просмотр)',
    note: 'Создайте отдельного пользователя с ролью «просмотр/менеджер», а не делитесь своим.',
    body: [
      'Общий принцип (Shopify, WooCommerce, Хорошоп, Bitrix, OpenCart и др.):',
      '1. В админке найдите раздел «Пользователи / Сотрудники / Персонал».',
      '2. Создайте нового пользователя на присланный e-mail.',
      '3. Роль — с правами «просмотр» (или «менеджер без изменения цен/заказов»).',
      '4. Сохраните. Пришлите нам адрес входа в админку.',
      '',
      'Если платформа не умеет роли «только чтение» — заведите временного пользователя',
      'с минимальными правами, а после аудита удалите его.',
    ].join('\n'),
  },
  'ins-hosting': {
    id: 'ins-hosting',
    kind: 'instruction',
    title: 'Как дать логи и доступ к хостингу (read-only)',
    note: 'Пароли — только через одноразовую ссылку (Bitwarden Send / 1Password).',
    body: [
      'Что нужно (любой из вариантов):',
      '· доступ «только чтение» к панели хостинга (cPanel/ISPmanager/облако);',
      '· или SSH-пользователь read-only;',
      '· или просто выгрузка логов веб-сервера за 30 дней (access.log) файлом.',
      '',
      'Пароль/ключ никогда не пишите в форму — отправьте одноразовой ссылкой,',
      'а в комментарии укажите «отправлено ссылкой».',
    ].join('\n'),
  },
  'ins-crm-export': {
    id: 'ins-crm-export',
    kind: 'instruction',
    title: 'Как выгрузить заказы из CRM/платформы',
    note: 'Подходит вместо живого доступа: выгрузка за 24 мес в CSV/XLSX.',
    body: [
      'KeyCRM / RetailCRM / Bitrix24 / платформа магазина:',
      '1. Раздел «Заказы» → фильтр по датам (последние 24 месяца).',
      '2. «Экспорт» → CSV или XLSX.',
      '3. Нужные колонки см. в приложенном шаблоне (номер, дата, сумма, клиент, канал, статус).',
      '4. Если e-mail/телефон клиента чувствительны — замените на хеш или ID.',
      '5. Загрузите файл в защищённую папку (ссылку пришлём) или прямо здесь.',
    ].join('\n'),
  },
  'ins-figma': {
    id: 'ins-figma',
    kind: 'instruction',
    title: 'Как дать доступ к Figma (макеты / дизайн-система)',
    body: [
      '1. Откройте файл в Figma → кнопка «Share» вверху справа.',
      '2. Введите наш e-mail, права «can view».',
      '3. «Send». Или пришлите ссылку с доступом «Anyone with the link — can view».',
    ].join('\n'),
  },

  /* ── Инструкции по доступу к сайту (instruction) ── */
  'ins-screenshots': {
    id: 'ins-screenshots',
    kind: 'instruction',
    title: 'Как прислать сайт скриншотами (если он вообще не открывается извне)',
    note: 'Крайний случай: сайт за заглушкой / во внутренней сети / жёсткая защита. Разберём его зрением.',
    body: [
      'Если снаружи сайт недоступен (внутренняя сеть, «под замком», антибот-заглушка) —',
      'пришлите полностраничные скриншоты, по странице на лист, одним PDF:',
      '',
      '1. Откройте ключевые страницы: главная, категория, карточка товара, корзина, чекаут,',
      '   «о нас», контакты, доставка/оплата.',
      '2. Сделайте ПОЛНОСТРАНИЧНЫЙ скриншот каждой:',
      '     · Chrome: Ctrl+Shift+P → «Capture full size screenshot», либо',
      '     · расширение типа «GoFullPage».',
      '3. Соберите картинки в один PDF (по странице на лист) и пришлите.',
      '',
      'Мы разберём структуру, блоки, контент и UX зрением — как если бы обходили сайт.',
      'В портале «Запустить аудит» есть поле для такого резервного PDF.',
    ].join('\n'),
  },
  'ins-crawler-access': {
    id: 'ins-crawler-access',
    kind: 'instruction',
    title: 'Пустить наш краулер (лучший путь — обходим сами)',
    note: 'Цель — построить РЕАЛЬНОЕ дерево сайта, не полагаясь на sitemap. Достаточно пустить нас на 2–3 дня.',
    body: [
      'Лучший вариант — мы обходим сайт сами: рекурсивно, с отрисовкой JS (для UX/UI),',
      'находя скрытые и orphan-страницы, которых нет в sitemap. От вас — только пустить',
      'наш краулер на окно аудита (2–3 дня):',
      '',
      '1. robots.txt — разрешите наш user-agent:',
      '     User-agent: WeexpAudit',
      '     Allow: /',
      '2. Cloudflare / WAF / антибот — добавьте правило-исключение (allowlist) для:',
      '     · user-agent «WeexpAudit», либо',
      '     · наших IP-адресов (пришлём списком), либо',
      '     · временно снизьте бот-защиту на указанных путях.',
      '3. «Under Attack Mode» / JS-challenge / капча — на окно аудита отключите для нашего',
      '   user-agent, иначе краулер видит заглушку защиты, а не сайт.',
      '4. Rate limit — поднимите порог или исключите наш UA (обходим бережно).',
      '',
      'Запускать ничего не нужно — дальше работаем мы. Если пустить не получается —',
      'используйте скрипт «рендер-краулер у себя»: он запускается изнутри вашей сети,',
      'и внешние ограничения ему не мешают.',
    ].join('\n'),
  },
  'ins-platform-urls': {
    id: 'ins-platform-urls',
    kind: 'instruction',
    title: 'Полный список URL из CMS/платформы (ground truth)',
    note: 'Sitemap неполон и врёт — истина обо ВСЕХ страницах живёт в базе платформы.',
    body: [
      'Sitemap может отсутствовать, быть неполным или неверным. Настоящий список всех',
      'страниц знает только ваша CMS/платформа. Выгрузите ПОЛНЫЙ перечень URL (товары +',
      'категории + статические + блог), включая незалинкованные и не попавшие в sitemap:',
      '',
      '· Shopify: Admin → Products / Pages / Collections → Export (CSV);',
      '· WooCommerce/WordPress: Инструменты → Экспорт → «Всё»; или плагин экспорта URL;',
      '· Хорошоп / Bitrix / OpenCart: выгрузка каталога (все товары и категории) + список CMS-страниц;',
      '· Любая платформа: выгрузка таблицы страниц/товаров со слагами (URL).',
      '',
      'Нужны только адреса (по одному в строке) и, если можно, флаг «опубликовано/скрыто».',
      'Мы сверим это с обходом: что есть в базе, но никуда не залинковано — orphan;',
      'что залинковано, но отдаёт 404 — «призрак»; чего нет в sitemap — дыра индексации.',
    ].join('\n'),
  },

  /* ── Скрипты (script) ── */
  'scr-site-audit': {
    id: 'scr-site-audit',
    kind: 'script',
    title: 'Рендер-краулер сайта (запуск у себя, если сайт закрыт/за Cloudflare)',
    note: 'Строит полное дерево из ОТРИСОВАННЫХ страниц по ссылкам, не полагаясь на sitemap. Ловит скрытые/orphan-страницы и рендерит JS для UX/UI. Запускается изнутри вашей сети — внешняя защита не мешает.',
    lang: 'javascript',
    body:
`// weexp-crawl.mjs — полный РЕНДЕР-краул сайта для аудита WEEXP.
// Зачем: построить реальное дерево сайта и найти то, чего НЕТ в sitemap —
// скрытые, orphan- и «призрачные» страницы, хаос в иерархии — и оценить UX/UI
// по ОТРИСОВАННЫМ (JS) страницам. Не зависит от корректности sitemap.
//
// Как: рекурсивно обходит внутренние ссылки из отрисованного DOM (headless
// Chromium), подмешивает sitemap/robots и типовые пути как подсказки, снимает
// статус, заголовок, H1, объём текста и способ обнаружения каждой страницы.
//
// Запуск НА МАШИНЕ КЛИЕНТА (так обходятся IP-фильтры и Cloudflare):
//   npm i playwright && npx playwright install chromium
//   node weexp-crawl.mjs https://ВАШ-САЙТ --max 3000 --out inventory.jsonl
// Если сайт за паролем/защитой:
//   --auth ЛОГИН:ПАРОЛЬ                     (HTTP basic / staging)
//   --header "CF-Access-Client-Id: ..."      (Cloudflare Access и любой заголовок)
import { chromium } from 'playwright';
import { appendFileSync, writeFileSync } from 'node:fs';

const a = process.argv.slice(2);
const start = a[0];
if (!start) { console.error('Укажите URL: node weexp-crawl.mjs https://site'); process.exit(1); }
const opt = (name, def) => { const i = a.indexOf(name); return i >= 0 ? a[i + 1] : def; };
const MAX = parseInt(opt('--max', '3000'), 10);
const OUT = opt('--out', 'inventory.jsonl');
const origin = new URL(start).origin;
const norm = (u) => { try { const x = new URL(u, origin); x.hash = ''; return x.origin === origin ? x.href : null; } catch { return null; } };

const httpCredentials = (() => { const v = opt('--auth', ''); if (!v) return undefined; const [username, ...p] = v.split(':'); return { username, password: p.join(':') }; })();
const extraHTTPHeaders = (() => { const v = opt('--header', ''); if (!v) return undefined; const i = v.indexOf(':'); return { [v.slice(0, i).trim()]: v.slice(i + 1).trim() }; })();

writeFileSync(OUT, '');
const seen = new Set();
const queue = [];
const push = (u, depth, via) => { const nrm = norm(u); if (nrm && !seen.has(nrm)) { seen.add(nrm); queue.push([nrm, depth, via]); } };

// 1) seeds: старт + типовые пути + sitemap/robots (как ПОДСКАЗКА, не как истина)
push(start, 0, 'seed');
for (const p of ['/', '/sitemap.xml', '/catalog', '/products', '/blog', '/search', '/account', '/cart', '/checkout']) push(origin + p, 0, 'probe');
try {
  const rob = await (await fetch(origin + '/robots.txt')).text();
  for (const line of rob.split('\\n')) {
    const m = line.match(/^\\s*Sitemap:\\s*(\\S+)/i);
    if (m) { try { const sm = await (await fetch(m[1])).text(); for (const loc of sm.match(/<loc>([^<]+)<\\/loc>/g) || []) push(loc.replace(/<\\/?loc>/g, ''), 0, 'sitemap'); } catch {} }
  }
} catch {}

// 2) рекурсивный РЕНДЕР-обход
const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: 'WeexpAudit/1.0 (+audit)', httpCredentials, extraHTTPHeaders, ignoreHTTPSErrors: true });
let n = 0;
while (queue.length && n < MAX) {
  const [url, depth, via] = queue.shift();
  const page = await ctx.newPage();
  let status = 0, title = '', h1 = '', words = 0, links = [];
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    status = resp ? resp.status() : 0;
    title = await page.title().catch(() => '');
    h1 = await page.$eval('h1', (e) => e.innerText.trim()).catch(() => '');
    words = await page.evaluate(() => (document.body ? document.body.innerText.trim().split(/\\s+/).length : 0)).catch(() => 0);
    links = await page.$$eval('a[href]', (as) => as.map((x) => x.href)).catch(() => []);
  } catch (e) { status = -1; }
  appendFileSync(OUT, JSON.stringify({ url, depth, via, status, title, h1, words, out_links: links.length }) + '\\n');
  for (const l of links) push(l, depth + 1, 'link');
  await page.close();
  n++;
  if (n % 25 === 0) console.log(n + ' страниц... в очереди ' + queue.length);
}
await browser.close();
console.log('Готово: ' + n + ' страниц → ' + OUT + '. Пришлите этот файл — он даёт полное дерево, включая скрытые и orphan-страницы.');`,
  },
  'scr-ga4-export': {
    id: 'scr-ga4-export',
    kind: 'script',
    title: 'Экспорт ключевых отчётов GA4 (если не даёте доступ)',
    note: 'Альтернатива живому доступу: выгрузите 4 отчёта за 12 мес.',
    lang: 'text',
    body: [
      'Выгрузите из GA4 (кнопка «Поделиться/Экспорт» → CSV) за последние 12 месяцев:',
      '1. Отчёт «Привлечение трафика» (Traffic acquisition) — по источникам/каналам.',
      '2. Отчёт «Изучение пути» или «Воронка» (если настроена).',
      '3. «Монетизация» → «Обзор электронной торговли» (доход, конверсия, AOV).',
      '4. «Взаимодействие» → «Страницы и экраны» (топ-страницы).',
      'Пришлите 4 CSV. Мы сведём их с данными обхода сайта.',
    ].join('\n'),
  },
};

export const assetOf = (id?: string): Asset | undefined => (id ? ASSETS[id] : undefined);

/* ───────────────────────── ТРЕБОВАНИЯ И БЛОКИ ───────────────────────── */
export type ReqKind = 'question' | 'access' | 'document';

export const REQ_LABEL: Record<ReqKind, string> = {
  question: 'Вопрос',
  access: 'Доступ',
  document: 'Документ / выгрузка',
};

export type Requirement = {
  id: string;
  kind: ReqKind;
  title: string;
  why: string;
  tier: Tier; // с какого тира это требование появляется
  assetId?: string; // приложенный шаблон/инструкция/скрипт
  fallback?: string; // worst-case: что делаем, если этого НЕТ / недоступно (всегда есть путь)
};

export type AuditBlock = {
  id: string;
  name: string;
  domain: string;
  tagline: string;
  minTier: Tier; // с какого тира блок вообще доступен
  reqs: Requirement[];
};

const R = (
  id: string,
  kind: ReqKind,
  tier: Tier,
  title: string,
  why: string,
  assetId?: string,
  fallback?: string,
): Requirement => ({ id, kind, title, why, tier, assetId, fallback });

export const BLOCKS: AuditBlock[] = [
  {
    id: 'foundation',
    name: 'Рамка и бриф',
    domain: 'Business & Strategy',
    tagline: 'Контекст, цель аудита, ниша, средний чек — чтобы выводы были «про вас».',
    minTier: 1,
    reqs: [
      R('fnd-url', 'access', 1, 'URL сайта клиента', 'Точка входа для всего обхода.'),
      R('fnd-comp', 'question', 1, 'Ссылки на 2–5 конкурентов', 'Эталон и бенчмарк рынка.'),
      R('fnd-goal', 'question', 1, 'Цель аудита и главная боль сейчас', 'Приоритезация фокуса.'),
      R('fnd-niche', 'question', 2, 'Ниша, гео, средний чек, ключевые категории', 'Калибровка эталона под ваш рынок.'),
      R('fnd-model', 'question', 3, 'Бизнес-модель, юрлица, налоговые режимы', 'Основа для юнит-экономики и рисков.'),
      R('fnd-team', 'question', 4, 'Кто в команде, зоны ответственности, подрядчики', 'Кому адресовать ТЗ и кто внедряет.', 'tpl-interview'),
    ],
  },
  {
    id: 'recon',
    name: 'Реконструкция и сверка данных (worst-case)',
    domain: 'Technology & Data',
    tagline: 'Исходим из худшего: нет доступа к сайту, нет sitemap, нет CRM и отчётов. Всё равно достаём максимум из самого сайта и внешних источников — и сверяем цифры между собой.',
    minTier: 1,
    reqs: [
      R('rec-visual', 'access', 1, 'Резервный PDF со скриншотами (если сайт не открывается извне)', 'Разбираем структуру и визуал зрением, даже когда сайт закрыт/за заглушкой.', 'ins-screenshots', 'Нет и скриншотов → Web Archive (история страниц) + кэш поисковиков + site: в выдаче.'),
      R('rec-structure', 'question', 1, 'Дерево без sitemap — из множества источников', 'Полная карта, даже если sitemap/robots отсутствуют или врут.', undefined, 'Рендер-обход по ссылкам + выгрузка URL платформы + Web Archive + «site:» в поиске + прайс-агрегаторы.'),
      R('rec-sales-site', 'question', 1, 'Сигналы продаж из самого сайта (без CRM)', 'Прокси спроса, когда данных о продажах нет: кол-во и даты отзывов, бейджи «продано/хит», доля out-of-stock, частота новинок, динамика остатков при повторном обходе.'),
      R('rec-sales-ext', 'question', 2, 'Внешние сигналы спроса (для сверки)', 'Similarweb (трафик), маркетплейсы (кол-во отзывов/продаж), прайс-агрегаторы (Hotline/Price.ua), Google Trends, Ad Library.'),
      R('rec-sales-data', 'document', 2, 'Любые данные о продажах — файл/скрин/выгрузка', 'Даже частичные: сверяем с сигналами из сайта и внешними. Совпадает — уверенность растёт; расходится — это находка.', 'tpl-orders', 'Нет CRM и отчётов → работаем на сигналах сайта+внешних, оценку честно помечаем «оценка, не факт».'),
      R('rec-crosscheck', 'question', 2, 'Сверка одной метрики из ≥2 источников', 'Каждую ключевую цифру (трафик, заказы, спрос, ассортимент) берём минимум из двух независимых источников и показываем расхождение, а не одну цифру «на веру».'),
    ],
  },
  {
    id: 'strategic',
    name: 'Стратегический аудит',
    domain: 'Business & Strategy',
    tagline: 'Цели ⇄ УТП ⇄ рынок ⇄ ресурсы: во что играет бизнес и чем побеждает.',
    minTier: 1,
    reqs: [
      R('str-usp', 'question', 1, 'В чём ваше УТП/позиционирование одним предложением', 'Сверка заявленного с тем, что видно на сайте.'),
      R('str-goals', 'question', 2, 'Бизнес-цели на 6–12 мес и метрики успеха', 'Привязка находок к целям.'),
      R('str-eco', 'document', 3, 'Управленческий P&L за 12–24 мес', 'Стратегия без экономики — гипотеза.', 'tpl-pnl'),
      R('str-interview', 'access', 4, 'Интервью с собственником/CEO (60 мин)', 'Скрытые ограничения, амбиции, red lines.', 'tpl-interview'),
    ],
  },
  {
    id: 'structure',
    name: 'Структура и дерево сайта',
    domain: 'Experience',
    tagline: 'Карта страниц, типы, вложенность, навигация, orphan-страницы.',
    minTier: 1,
    reqs: [
      R('sct-crawl', 'access', 1, 'Публичный сайт (рендер-обход)', 'Строим дерево из отрисованных страниц: типы, вложенность, навигация — по факту, не по карте.', undefined, 'Сайт не открывается извне → рендер-краулер у себя (ниже) или скриншоты PDF; дерево — из ссылок, выгрузки URL платформы и Web Archive, а не из sitemap.'),
      R('sct-sitemap', 'document', 2, 'sitemap.xml и robots.txt (как подсказка)', 'Стартовые сигналы. Могут быть неполными/неверными — не единственный источник.'),
      R('sct-allow', 'access', 2, 'Пустить наш краулер: allowlist UA/IP, снять антибот на окно аудита', 'Полный обход даже при Cloudflare/WAF: ловим скрытые и orphan-страницы, рендерим JS для UX/UI.', 'ins-crawler-access'),
      R('sct-export', 'document', 3, 'Полный список URL из CMS/платформы (ground truth)', 'Истина обо ВСЕХ страницах, включая незалинкованные и не попавшие в sitemap.', 'ins-platform-urls'),
      R('sct-script', 'access', 3, 'Если сайт закрыт/за Cloudflare — запустить наш рендер-краулер у себя', 'Полный обход изнутри вашей сети, минуя IP-фильтры и защиту; отдаёт полное дерево.', 'scr-site-audit'),
    ],
  },
  {
    id: 'page',
    name: 'Страничный аудит',
    domain: 'Experience',
    tagline: 'Каждая ключевая страница по эталону: цель, блоки, соответствие роли.',
    minTier: 1,
    reqs: [
      R('pg-crawl', 'access', 1, 'Публичный сайт (обход ключевых типов)', 'Разбор главной, категории, карточки, корзины.', undefined, 'Визуал недоступен → полностраничные скриншоты PDF (разбираем зрением) или Web Archive/кэш поисковиков.'),
      R('pg-behavior', 'access', 2, 'GA4: страницы и экраны', 'Какие страницы реально смотрят и где выход.', 'ins-ga4'),
      R('pg-heatmap', 'access', 3, 'Hotjar / Clarity (записи, тепловые карты)', 'Как ведут себя на странице на самом деле.'),
    ],
  },
  {
    id: 'block',
    name: 'Поблочный аудит',
    domain: 'Experience',
    tagline: 'Каждый блок страницы: назначение, состояние, эталон, приоритет.',
    minTier: 1,
    reqs: [
      R('blk-crawl', 'access', 1, 'Публичный сайт (детекция блоков)', 'Наличие/качество ключевых блоков по эталону.'),
      R('blk-design', 'access', 3, 'Figma-макеты / дизайн-система', 'Сверка реализации с задуманным.', 'ins-figma'),
    ],
  },
  {
    id: 'uxui',
    name: 'UX/UI аудит',
    domain: 'Experience',
    tagline: 'Юзабилити, визуальная иерархия, доступность, мобильный опыт.',
    minTier: 1,
    reqs: [
      R('ux-crawl', 'access', 1, 'Публичный сайт (эвристики UX/UI)', 'Разбор по эвристикам и эталону.'),
      R('ux-analytics', 'access', 2, 'GA4: устройства, вовлечённость', 'Где мобайл проседает против десктопа.', 'ins-ga4'),
      R('ux-records', 'access', 3, 'Записи сессий (Hotjar/Clarity)', 'Реальные затыки в интерфейсе.'),
      R('ux-brand', 'document', 3, 'Бренд-бук / гайдлайны', 'Оценка на соответствие фирменному стилю.'),
    ],
  },
  {
    id: 'content',
    name: 'Контент-аудит',
    domain: 'Experience',
    tagline: 'Тексты, карточки, категорийный контент, тональность, полнота.',
    minTier: 1,
    reqs: [
      R('cnt-crawl', 'access', 1, 'Публичный сайт (контент-покрытие)', 'Полнота и качество контента по критериям.'),
      R('cnt-search', 'access', 2, 'Search Console: запросы', 'Под какие запросы контента не хватает.', 'ins-gsc'),
      R('cnt-plan', 'document', 3, 'Контент-план и tone of voice (если есть)', 'Сверка с редполитикой.'),
    ],
  },
  {
    id: 'seo',
    name: 'SEO-аудит',
    domain: 'Technology & Data',
    tagline: 'On-page, разметка, индексируемость, техничка, поисковая видимость.',
    minTier: 1,
    reqs: [
      R('seo-crawl', 'access', 1, 'Публичный сайт (on-page + разметка)', 'Title/desc/H1/schema/hreflang/canonical из обхода.'),
      R('seo-gsc', 'access', 2, 'Google Search Console', 'Реальные запросы, показы, CTR, ошибки индексации.', 'ins-gsc'),
      R('seo-tools', 'document', 2, 'Доступ к Ahrefs/Serpstat или разрешение на наш', 'Ссылочный профиль и видимость конкурентов.'),
      R('seo-logs', 'document', 4, 'Логи сервера за 30 дней', 'Как боты реально краулят сайт (crawl budget).', 'ins-hosting'),
    ],
  },
  {
    id: 'geo',
    name: 'GEO / AEO / LLM-видимость',
    domain: 'Technology & Data',
    tagline: 'Видимость в AI-выдаче: crawlability для LLM, answerability, сущности.',
    minTier: 1,
    reqs: [
      R('geo-crawl', 'access', 1, 'Публичный сайт + llms.txt/robots', 'Доступность для AI-ботов, структура ответов.'),
      R('geo-brand', 'question', 3, 'Ключевые бренд-запросы и факты о бренде', 'Что LLM должны знать и цитировать.'),
      R('geo-live', 'document', 4, 'Разрешение на живой прогон AI-запросов', 'Реальные цитирования в ChatGPT/Perplexity/AI Overviews.'),
    ],
  },
  {
    id: 'merch',
    name: 'E-commerce / Merchandising',
    domain: 'Commerce & Conversion',
    tagline: 'Каталог, карточка, фильтры, витрина, кросс-сейл, работа с ассортиментом.',
    minTier: 1,
    reqs: [
      R('mch-crawl', 'access', 1, 'Публичный сайт (каталог и карточка)', 'Мерчендайзинг-сигналы из обхода.'),
      R('mch-products', 'document', 3, 'Выгрузка товаров + себестоимости + остатки', 'ABC-анализ, маржа по категориям, вымывание.', 'tpl-products'),
      R('mch-sales', 'document', 3, 'Продажи по SKU за 12 мес', 'Что реально продаётся vs что на витрине.', 'tpl-orders', 'Нет данных о продажах → прокси-спрос: кол-во/даты отзывов, сортировка «хиты», доля out-of-stock, повторный обход остатков; сверяем с внешними.'),
    ],
  },
  {
    id: 'cro',
    name: 'CRO — конверсия',
    domain: 'Commerce & Conversion',
    tagline: 'Барьеры конверсии, доверие, оффер, форма, чекаут; гипотезы ICE.',
    minTier: 1,
    reqs: [
      R('cro-crawl', 'access', 1, 'Публичный сайт (CRO-эвристики)', 'Барьеры и трение из обхода по эталону.'),
      R('cro-funnel', 'access', 2, 'GA4: воронка и конверсии', 'Где реально теряются деньги в воронке.', 'ins-ga4'),
      R('cro-checkout', 'access', 3, 'Тестовый заказ / доступ к чекауту', 'Пройти путь до оплаты и найти трение.', 'ins-site-admin'),
      R('cro-ab', 'document', 4, 'История A/B-тестов (если были)', 'Что уже проверяли, чтобы не повторяться.'),
    ],
  },
  {
    id: 'analytics',
    name: 'Аналитика и трекинг',
    domain: 'Technology & Data',
    tagline: 'Корректность GA4/GTM/пикселей, события, e-commerce-трекинг, атрибуция.',
    minTier: 2,
    reqs: [
      R('an-ga4', 'access', 2, 'Google Analytics 4 (просмотр)', 'Аудит настройки, событий, воронок.', 'ins-ga4', 'Нет GA4/аналитики → трафик из Similarweb + серверные логи; сверяем оценку с заказами и внешними сигналами.'),
      R('an-gtm', 'access', 2, 'Google Tag Manager (чтение)', 'Аудит тегов и триггеров.', 'ins-gtm'),
      R('an-ecom', 'access', 3, 'Enhanced e-commerce / серверный трекинг', 'Полнота данных о покупках.', 'scr-ga4-export'),
      R('an-recon', 'document', 4, 'Сверка: заказы CRM ⇄ конверсии GA4', 'Насколько данным можно верить.', 'tpl-orders'),
    ],
  },
  {
    id: 'journey',
    name: 'Customer Journey (CJM)',
    domain: 'Customer',
    tagline: 'Путь клиента от осознания до повтора; точки боли и разрывы каналов.',
    minTier: 1,
    reqs: [
      R('cjm-crawl', 'access', 1, 'Публичный сайт (сборка пути из обхода)', 'Реконструкция шагов пути по сайту.'),
      R('cjm-analytics', 'access', 2, 'GA4: пути и источники', 'Реальные переходы между этапами.', 'ins-ga4'),
      R('cjm-crm', 'document', 3, 'Выгрузка заказов с каналами и повторами', 'Повторные покупки и удержание по когортам.', 'tpl-orders'),
      R('cjm-voice', 'document', 4, 'Опрос клиентов / интервью', 'Голос клиента: почему покупают и уходят.', 'tpl-survey'),
    ],
  },
  {
    id: 'channels',
    name: 'Каналы и медиа-микс',
    domain: 'Commerce & Conversion',
    tagline: 'Платные и органические каналы, распределение бюджета, ROI, атрибуция.',
    minTier: 2,
    reqs: [
      R('ch-ga4', 'access', 2, 'GA4: источники и каналы', 'Вклад каналов в трафик и доход.', 'ins-ga4'),
      R('ch-google-ads', 'access', 3, 'Google Ads (просмотр)', 'Структура, расход, эффективность.', 'ins-google-ads'),
      R('ch-meta-ads', 'access', 3, 'Meta Ads (просмотр)', 'Кампании, креативы, аудитории.', 'ins-meta-ads'),
      R('ch-spend', 'document', 3, 'Медиа-план / расходы по каналам', 'Свести расход с доходом → ROI/MER.', 'tpl-adspend'),
    ],
  },
  {
    id: 'retention',
    name: 'Retention / CRM / Voice of Customer',
    domain: 'Customer',
    tagline: 'Удержание, email/SMS, программы лояльности, отзывы и NPS.',
    minTier: 3,
    reqs: [
      R('ret-esp', 'access', 3, 'ESP/CRM (Klaviyo/eSputnik/…) — просмотр', 'Аудит цепочек, сегментов, доставляемости.', 'ins-crm-export'),
      R('ret-orders', 'document', 3, 'Выгрузка заказов 24 мес (повторы)', 'Когорты, LTV, доля повторных.', 'tpl-orders'),
      R('ret-reviews', 'document', 3, 'Экспорт отзывов / NPS', 'Голос клиента в цифрах.'),
      R('ret-survey', 'document', 4, 'Исследование клиентов (анкета)', 'Причины оттока и лояльности.', 'tpl-survey'),
    ],
  },
  {
    id: 'unitecon',
    name: 'Unit Economics',
    domain: 'Economics & Expansion',
    tagline: 'Экономика одной единицы: AOV, маржа, CAC, LTV, окупаемость, возвраты.',
    minTier: 3,
    reqs: [
      R('ue-orders', 'document', 3, 'Выгрузка заказов 24 мес', 'AOV, частота, возвраты, повторные.', 'tpl-orders', 'Нет CRM/выгрузки → сигналы спроса из сайта (отзывы и их даты, динамика остатков, «продано/хит») + внешние (маркетплейсы, агрегаторы) → оценка со сверкой, честно помечаем.'),
      R('ue-products', 'document', 3, 'Товары + себестоимость', 'Валовая маржа по SKU/категориям.', 'tpl-products'),
      R('ue-spend', 'document', 3, 'Расходы на маркетинг по каналам', 'CAC и окупаемость привлечения.', 'tpl-adspend'),
      R('ue-pnl', 'document', 4, 'Управленческий P&L (полный)', 'Fully-loaded costs, контрибуция, чистая маржа.', 'tpl-pnl'),
      R('ue-live', 'access', 4, 'Живой доступ к ERP/финансам (1С/Odoo/…)', 'Сверка и максимальная достоверность цифр.'),
    ],
  },
  {
    id: 'ops',
    name: 'Операции / логистика / поддержка',
    domain: 'Operations',
    tagline: 'Фулфилмент, сроки сборки, перевозчики, склад, служба поддержки.',
    minTier: 3,
    reqs: [
      R('ops-ship', 'question', 3, 'Перевозчики, тарифы, сроки сборки и упаковки', 'Влияние логистики на маржу и опыт.'),
      R('ops-support', 'document', 3, 'Выгрузка тикетов поддержки за 6 мес', 'Топ-причины обращений = дыры в продукте.'),
      R('ops-erp', 'access', 4, 'ERP/склад (1С/МойСклад/Odoo) — просмотр', 'Остатки, оборачиваемость, дефициты.'),
      R('ops-interview', 'access', 4, 'Интервью с операционной командой', 'Узкие места, которых не видно в данных.', 'tpl-interview'),
    ],
  },
  {
    id: 'expansion',
    name: 'New Market Expansion (GEO)',
    domain: 'Economics & Expansion',
    tagline: 'Готовность к выходу в новую страну/регион: i18n, спрос, барьеры, Go/No-Go.',
    minTier: 1,
    reqs: [
      R('exp-i18n', 'access', 1, 'Публичный сайт (i18n-готовность)', 'Мовные версии, hreflang, валюты — из обхода.'),
      R('exp-market', 'question', 3, 'Целевые рынки и гипотезы спроса', 'Куда и почему; данные для research.'),
      R('exp-geo-eco', 'document', 3, 'Юнит-экономика с учётом логистики/мит новой гео', 'Не разрушит ли выход экономику.', 'tpl-pnl'),
      R('exp-legal', 'document', 4, 'Право/налоги/платежи целевого рынка', 'Барьеры входа и требования.'),
    ],
  },
];

/* ───────────────────────── ХЕЛПЕРЫ ───────────────────────── */
export const blockById = new Map(BLOCKS.map((b) => [b.id, b]));

/** Блоки, доступные на данном тире. */
export const blocksForTier = (tier: Tier): AuditBlock[] => BLOCKS.filter((b) => b.minTier <= tier);

/** Требования блока, активные на данном тире (кумулятивно: всё до тира включительно). */
export const reqsForBlockTier = (block: AuditBlock, tier: Tier): Requirement[] =>
  block.reqs.filter((r) => r.tier <= tier);

/** Все требования на тире, помеченные блоком (для Excel и сводок). */
export type FlatReq = Requirement & { blockId: string; blockName: string; domain: string };

export const flatReqsAtTier = (tier: Tier): FlatReq[] =>
  blocksForTier(tier).flatMap((b) =>
    reqsForBlockTier(b, tier).map((r) => ({ ...r, blockId: b.id, blockName: b.name, domain: b.domain })),
  );

/** Требования, впервые появляющиеся ровно на этом тире (дельта). */
export const newReqsAtTier = (tier: Tier): FlatReq[] => flatReqsAtTier(tier).filter((r) => r.tier === tier);
