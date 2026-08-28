/**
 * Легкий SSG для клієнтського three.js-SPA (без React-SSR, без браузера — тому
 * безпечно для Vercel-білду). Після vite build генеруємо для кожного маршруту
 * dist/<route>/index.html з правильними head-мета (title/description/canonical/
 * og) і РЕАЛЬНИМ текстовим контентом усередині #root. На клієнті
 * createRoot().render() повністю замінює #root (не hydrate) → жодного mismatch;
 * краулери й AI без JS бачать зміст і мета, а не порожній div. Vercel віддає
 * статичні файли раніше за SPA-rewrite, тож ці сторінки реально доходять.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
// Та сама таблиця, що й у рантаймі (src/lib/seo.tsx) — щоб статика й застосунок
// не розповідали різне про той самий продукт.
const SEO = JSON.parse(await readFile(join(ROOT, 'src', 'lib', 'seo-data.json'), 'utf8'));
const ORIGIN = 'https://weexp.agency';
const SUF = ' · WEEXP';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ul = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
/*
 * Те саме, але кожен пункт — посилання на сторінку системи.
 *
 * Вісім сторінок /systems/* були замкненим кільцем: кожна посилалась лише на
 * сусідні дві, а ззовні в кільце не входило НІЧОГО. Від головної до них не
 * існувало шляху — глибина кліку нескінченна. Це найкомерційніші сторінки
 * сайту (одна на кожну систему), і ні людина їх не знаходила, ні вага
 * посилань з головної до них не доходила.
 */
const ulLinks = (items, slugs, pref = '') => `<ul>${items.map((i, k) =>
  `<li><a href="${pref}/systems/${slugs[k]}">${esc(i)}</a></li>`).join('')}</ul>`;

// Дзеркало PAGES із src/lib/nav.ts — статика й застосунок мають називати
// сторінки однаково. Тест wording.test.ts стереже, щоб переліки не розійшлись.
const NAV_PAGES = [
  { to: '/', uk: 'Головна', en: 'Home' },
  { to: '/systems', uk: 'Системи', en: 'Systems' },
  { to: '/proof', uk: 'Наші перемоги', en: 'Our wins' },
  { to: '/expansion', uk: 'Експертизи', en: 'Expertise' },
  { to: '/people', uk: 'Про нас', en: 'About' },
  { to: '/diagnose', uk: 'Express audit', en: 'Express audit' },
  { to: '/pricing', uk: 'Ціни', en: 'Pricing' },
  { to: '/contact', uk: 'Контакт', en: 'Contact' },
  { to: '/audit-pack', uk: 'Склад пакета аудиту', en: 'Audit pack contents' },
];
/*
 * Шість напрямів експертизи: хаб не посилався на них у статиці, і без JS
 * вони були недосяжні так само, як сторінки систем.
 *
 * Назви беруться з seo-data (та сама таблиця, що дає заголовки самим
 * сторінкам). Спершу тут стояли слуги — «international», «automation» —
 * тобто текст посилання не казав, куди воно веде. Рівно те, за що я
 * чіплявся в аудиті, у власній правці.
 */
const expName = (m, lang) => (lang === 'en' ? m.en[0] : m.uk[0]).split(' — ')[0].replace(' · WEEXP', '');
const expansionLinks = (lang) => {
  const head = lang === 'en' ? 'Areas of expertise' : 'Напрями експертизи';
  const pref = lang === 'en' ? '/en' : '';
  return `<h2>${head}</h2><ul>${Object.entries(SEO.expansion)
    .map(([k, m]) => `<li><a href="${pref}/expansion/${k}">${esc(expName(m, lang))}</a></li>`).join('')}</ul>`;
};
const SYS_SLUGS = ['strategy-management','commercial-performance','demand-customer','experience-conversion','operations-fulfillment','data-technology','organization-operating-model','expansion-markets'];
const SYSTEMS = [
  'Стратегія та управління — стратегія продажів, якою можна керувати',
  'Комерційна ефективність — більше виручки замало, зробіть комерцію прибутковою',
  'Попит і клієнт — перетворюйте трафік на клієнтів, а клієнтів на цінність',
  'Досвід і конверсія — зробіть кожен крок клієнта робочим',
  'Операції та fulfillment — продавати марно, якщо не можеш доставити',
  'Дані, технології, інтеграції — один бізнес, одне джерело правди',
  'Організація та операційна модель — побудуйте бізнес, якому не потрібні герої',
  'Експансія та ринки — вихід на ЄС і США як окремий контур, а не спроба',
];
const SERVICES = 'Веб-розробка, ERP-автоматизація, UX/UI та CRO, SEO, аналітика/BI, retention/CRM, операційна модель та експансія — усі вісім систем під одним дахом.';
const PROOF = [
  'Преміум-текстиль: оборот ×18 (€48K → €900K/рік), конверсія 0,8% → 4,2%',
  'Consumer DTC-бренд: +65% до обороту за 9 місяців, вихід на 6 ринків',
  'Fashion-виробник: знайдено ≥19 млн ₴/рік недоотриманого обороту',
  'Косметичний холдинг: збірка звіту 6 днів → 4 години, точність GA4 78% → 99%',
  'Електроніка: конверсія картки товару ×2,9; checkout 6 → 2 кроки',
];
const ROSTER = [
  'Founder & Architect of Commerce — стратегія, операційна модель, governance',
  'Head of Commerce — прибуткова комерція: конверсія, чек, повторні, маржа',
  'Retention & CRM Architect — трафік у клієнтів, клієнти в LTV',
  'CRO / UX Lead — робочий шлях клієнта: каталог, картка, checkout, mobile',
  'Operations & Fulfillment Lead — SLA, викуп, доставка, повернення',
  'Data & BI Engineer — наскрізна аналітика і P&L по e-commerce',
  'Integration Engineer — CMS/CRM/ERP/WMS як єдиний контур',
  'Demand & SEO Strategist — органіка й бренд замість залежності від платного',
  'Delivery Lead / PM — виконання хвилями під Definition of Done',
];
const CHANNELS = ['Власний сайт', 'Amazon', 'Allegro', 'eBay', 'Kaufland та локальні маркетплейси', 'Etsy'];

/*
 * EN-відповідники спільних блоків. До цього англійські сторінки отримували
 * тільки <h1> і опис — 117–160 символів статики проти 300–998 в українських.
 * Googlebot виконує JS і побачить усе; краулери AI-пошуку здебільшого ні, а
 * robots.txt запрошує їх окремо й свідомо. Виходило запрошення без змісту.
 * Числа, ролі й ринки тут ті самі, що в UK-блоках вище.
 */
const SYSTEMS_EN = [
  'Strategy & Management — a sales strategy you can actually steer',
  'Commercial Performance — more revenue is not enough; make commerce profitable',
  'Demand & Customer — turn traffic into customers, and customers into value',
  'Experience & Conversion — make every step of the customer path work',
  'Operations & Fulfillment — selling is pointless if you cannot deliver',
  'Data, Technology & Integration — one business, one source of truth',
  'Organization & Operating Model — build a business that needs no heroes',
  'Expansion & Markets — the EU and US as a separate contour, not an attempt',
];
const SERVICES_EN = 'Web development, ERP automation, UX/UI and CRO, SEO, analytics/BI, retention/CRM, operating model and expansion — all eight systems under one roof.';
const PROOF_EN = [
  'Premium textiles: turnover ×18 (€48K → €900K/year), conversion 0.8% → 4.2%',
  'Consumer DTC brand: +65% turnover in 9 months, launched in 6 markets',
  'Fashion manufacturer: ≥19M UAH/year of missed turnover identified',
  'Cosmetics holding: report assembly 6 days → 4 hours, GA4 accuracy 78% → 99%',
  'Electronics: product-page conversion ×2.9; checkout 6 → 2 steps',
];
const ROSTER_EN = [
  'Founder & Architect of Commerce — strategy, operating model, governance',
  'Head of Commerce — profitable commerce: conversion, AOV, repeat, margin',
  'Retention & CRM Architect — traffic into customers, customers into LTV',
  'CRO / UX Lead — a working customer path: catalog, product, checkout, mobile',
  'Operations & Fulfillment Lead — SLA, redemption, delivery, returns',
  'Data & BI Engineer — end-to-end analytics and P&L for e-commerce',
  'Integration Engineer — CMS/CRM/ERP/WMS as a single contour',
  'Demand & SEO Strategist — organic and brand instead of paid dependency',
  'Delivery Lead / PM — execution in waves against a Definition of Done',
];
const CHANNELS_EN = ['Own store', 'Amazon', 'Allegro', 'eBay', 'Kaufland and local marketplaces', 'Etsy'];
const DIAG_STEPS = ['Профіль і симптоми', 'Ваш витік у грошах', 'Карта восьми систем', 'Кабінет Tier-2', 'Поглиблений AI-розбір'];
const DIAG_STEPS_EN = ['Profile and symptoms', 'Your leak, in money', 'Map of the eight systems', 'Tier-2 client cabinet', 'In-depth AI review'];
const FORMATS_EN = [
  '01 Audit — 4–6 weeks: store audit $2,900 or full e-commerce department audit $4,900',
  '02 Consulting & support — $50/hour, min. $1,500/month: we are the architect and the control, your team executes',
  '03 Managed — from $4,900/month, 6–12 months: we run the project and carry the responsibility',
];

const NEXT_STEPS = [
  'Короткий дзвінок 20–30 хвилин: що болить, що вже пробували, які цифри є',
  'Перший зріз розриву у грошах — за вашими даними, а не за середніми по ринку',
  'Карта восьми систем: де саме витікає виторг і що чинити першим',
  'Формат співпраці на вибір: аудит, консалтинг і супровід або управління під ключ',
];
const PACK = [
  'Презентація аудиту — головні висновки для власника й ЛПР',
  'Діагностичний звіт: 13 аудитів по восьми системах онлайн-продажів',
  'Фінансовий звіт із містком P&L — де саме втрачається маржа',
  'Роадмапа впровадження хвилями, з Definition of Done на кожну',
  'Комерційна пропозиція і протокол передачі системи',
];

/** Тіло EN-сторінки за її адресою. Порожньо — сторінка обійдеться описом. */
const EN_BODY = {
  '/': `<p>${esc(SERVICES_EN)}</p><h2>Eight systems of online sales</h2>${ulLinks(SYSTEMS_EN, SYS_SLUGS, '/en')}`,
  '/systems': `<p>Online sales are not a set of channels but eight systems working together. Revenue leaks where the weakest one is. Below — each of them: what it solves and how we build it.</p>${ulLinks(SYSTEMS_EN, SYS_SLUGS, '/en')}`,
  '/proof': `<p>Not promises — before→after deltas from CRM, ERP and GA4. Every case is anonymous; every number is real.</p>${ul(PROOF_EN)}`,
  '/people': `<p>WEEXP was founded by Pavlo Sydorenko, Founder &amp; Architect of Commerce (8+ years in international e-commerce: US · EU · MENA). Each of the eight systems of online sales has an owner accountable for the result — specialists, not generalists.</p>${ul(ROSTER_EN)}`,
  '/expansion': `<p>Europe and the US are a separate business contour. We launch systematically and across all storefronts of a market at once. Priority markets: PL, DE, CZ, USA.</p><h2>Market storefronts</h2>${ul(CHANNELS_EN)}${expansionLinks('en')}`,
  '/diagnose': `<p>One instrument, not two: first we count how much leaks every year; then the map of eight systems, the main bottleneck, a cabinet with your data and an in-depth AI review. These are steps of one diagnosis.</p><h2>Steps of the diagnosis</h2>${ul(DIAG_STEPS_EN)}`,
  '/contact': `<p>Leave a contact — we come back with the first cut of the gap, in money. For e-commerce manufacturers and D2C brands at $0.5–10M. This is not work yet; this is a diagnosis.</p>`,
  '/audit-pack': `<p>Before the start you see the full list of documents you will receive: intake (Discovery), the audit core, the evidence base, the plan and the handover.</p>`,
  '/pricing': `<p>The difference is not in «service packages» but in who carries final responsibility for the result.</p>${ul(FORMATS_EN)}<p>Every engagement starts with a diagnosis.</p>`,
};

const ROUTES = [
  { path: '/', og: 'home', title: 'WEEXP — Commerce OS: система замість героїзму',
    desc: 'Commerce OS для D2C та e-commerce брендів $0.5–10M: діагноз у грошах, побудова системи й вихід на ЄС/США — щоб виторг ріс без вас.',
    content: `<h1>Система замість героїзму</h1><p>Продажі тримаються на людях і ручному режимі, а не на системі. WEEXP — Commerce OS для українських виробників і D2C-брендів $0.5–10M: діагностуємо систему онлайн-продажів, рахуємо розрив у грошах і будуємо систему, щоб бізнес працював без героя.</p><p>${esc(SERVICES)}</p><h2>Вісім систем онлайн-продажів</h2>${ulLinks(SYSTEMS, SYS_SLUGS)}` },
  { path: '/systems', og: 'systems', title: `Вісім систем Commerce OS${SUF}`,
    desc: 'Онлайн-продажі як вісім систем: стратегія, комерція, попит, досвід, операції, дані, організація й експансія. Виторг витікає там, де найслабша.',
    content: `<h1>Система сильна настільки, наскільки сильна найслабша частина</h1><p>Онлайн-продажі — не набір каналів, а вісім систем, які працюють разом. Виторг витікає там, де найслабша. Нижче — кожна: що вона вирішує і як ми її будуємо.</p>${ulLinks(SYSTEMS, SYS_SLUGS)}` },
  { path: '/proof', og: 'proof', title: `Докази — трансформації в цифрах${SUF}`,
    desc: 'Флагманські кейси e-commerce: дельти до→після з CRM/ERP/GA4 — ×18 обороту, +65% продажів, ≥19 млн ₴ розриву. Не обіцянки, а числа.',
    content: `<h1>Систему видно в цифрах</h1><p>Не обіцянки — дельти до→після з CRM, ERP і GA4. Кожен кейс анонімний, але число реальне.</p>${ul(PROOF)}` },
  { path: '/people', og: 'people', title: `Люди — власник у кожної системи${SUF}`,
    desc: 'Команда WEEXP структурована за системами: у кожної із восьми систем — свій власник. Систему будують власники, а не герої.',
    content: `<h1>Систему будують власники, не герої</h1><p>Засновник WEEXP — Павло Сидоренко, Founder & Architect of Commerce (8+ років у міжнародному e-commerce: US · EU · MENA). У кожної з восьми систем онлайн-продажів є відповідальний за результат. Не універсали — власники конкретного контуру.</p>${ul(ROSTER)}` },
  { path: '/expansion', og: 'expansion', title: `Міжнародна експансія — ЄС і США${SUF}`,
    desc: 'Системний вивід брендів на ринки ЄС і США: власний сайт, Amazon, Allegro, eBay та локальні маркетплейси — з локалізацією, логістикою, юридичним контуром і юніт-економікою ринку.',
    content: `<h1>Вихід у ЄС і США як система, не спроба</h1><p>Європа і Штати — окремий бізнес-контур. Виводимо системно й одразу на всіх вітринах ринку. Пріоритетні ринки: PL, DE, CZ, США.</p><h2>Вітрини ринку</h2>${ul(CHANNELS)}${expansionLinks('uk')}` },
  { path: '/diagnose', og: 'diagnose', title: `Діагностика e-commerce — від числа до плану${SUF}`,
    desc: 'Єдина діагностика онлайн-продажів: за 5 хвилин порахуйте втрати, отримайте карту 8 систем, головний bottleneck і кабінет із планом повернення виторгу.',
    content: `<h1>Діагностика e-commerce: від числа до плану</h1><p>Один інструмент, а не два: спершу рахуємо, скільки витікає щороку; далі — карта восьми систем, головний bottleneck, кабінет із вашими даними та поглиблений AI-розбір. Це кроки однієї діагностики.</p><h2>Кроки діагностики</h2>${ul(['Профіль і симптоми', 'Ваш витік у грошах', 'Карта восьми систем', 'Кабінет Tier-2', 'Поглиблений AI-розбір'])}` },
  { path: '/contact', og: 'contact', title: `Контакт — запит на діагноз${SUF}`,
    desc: 'Залиште контакт — повернемося з планом діагностики у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M.',
    content: `<h1>Зростання — це система. Почнімо з діагнозу.</h1><p>Залиште контакт — повернемося з першим зрізом розриву у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M. Це ще не робота, це діагноз.</p><h2>Що буде далі</h2>${ul(NEXT_STEPS)}<p>Працюємо з українськими виробниками та D2C-брендами: власний сайт, маркетплейси, вихід на ЄС і США. Пишіть на hello@weexp.agency або лишайте контакт у формі.</p>` },
  { path: '/audit-pack', og: 'pricing', title: `Склад пакета аудиту — 19 артефактів${SUF}`,
    desc: 'Повний перелік документів глибокого аудиту WEEXP: від брифу й карти доступів до роадмапи хвилями і протоколу передачі.',
    content: `<h1>Пакет аудиту — 19 артефактів</h1><p>До старту ви бачите повний перелік документів, які отримаєте: вхід (Discovery), ядро аудиту, доказова база, план і закриття. Аудит закінчується не презентацією, а переданою системою.</p><h2>Що входить</h2>${ul(PACK)}<p>Кожен артефакт має власника з боку WEEXP і Definition of Done — інакше він не вважається зданим.</p>` },
  { path: '/pricing', og: 'pricing', title: `Формати та ціни${SUF}`,
    desc: 'Три формати співпраці WEEXP — аудит, консалтинг і супровід, управління під ключ. Відкриті ціни; різниця — у тому, хто відповідає за результат.',
    content: `<h1>Три формати — за рівнем нашої відповідальності</h1><p>Різниця не в «пакетах послуг», а в тому, хто несе фінальну відповідальність за результат.</p>${ul(['01 Аудит — 4–6 тижнів: аудит інтернет-магазину $2,900 або аудит відділу e-commerce в цілому $4,900', '02 Консалтинг і супровід — $50/год, мін. $1,500/міс: ми архітектор і контроль, руки клієнта', '03 Управління під ключ — від $4,900/міс, 6–12 міс: проєкт ведемо ми, відповідальність наша'])}<p>Будь-яка співпраця починається з діагностики.</p>` },
];

// Глибокі сторінки послуг (одна на систему) — для індексації комерційної структури.
const SERVICE_META = [
  ['strategy-management', 'Стратегія та управління', 'Strategy & Management'],
  ['commercial-performance', 'Комерційна ефективність', 'Commercial Performance'],
  ['demand-customer', 'Попит і клієнт', 'Demand & Customer'],
  ['experience-conversion', 'Досвід і конверсія', 'Experience & Conversion'],
  ['operations-fulfillment', 'Операції та fulfillment', 'Operations & Fulfillment'],
  ['data-technology', 'Дані, технології, інтеграції', 'Data, Technology & Integration'],
  ['organization-operating-model', 'Організація та операційна модель', 'Organization & Operating Model'],
  ['expansion-markets', 'Експансія та ринки', 'Expansion & Markets'],
];
for (const [slug, title, en] of SERVICE_META) {
  // Обіцянка береться з другої половини рядка SYSTEMS і йде в опис ПІСЛЯ крапки,
  // а там вона з малої літери: у видачі виходило «…докази. один бізнес, одне
  // джерело правди» — речення, що починається з малої. Ставимо велику і крапку.
  const rawPromise = (SYSTEMS.find((s) => s.startsWith(title)) || '').split(' — ')[1] || '';
  const promise = rawPromise ? rawPromise[0].toUpperCase() + rawPromise.slice(1).replace(/\.?$/, '.') : '';
  ROUTES.push({
    path: `/systems/${slug}`,
    // Своя OG-картка на кожну систему: до цього вісім сторінок ділили загальну
    // /og.png і в стрічці виглядали одним і тим самим посиланням.
    og: `sys-${slug}`,
    // Суфікс «— послуга WEEXP · Commerce OS» — 29 символів, і найдовша назва
    // системи виводила заголовок на 62 при межі ~60: у видачі він обрізався.
    // Слово «послуга» ще й не шукають — лишається бренд. Та сама формула, що
    // в ServicePage.tsx: статика й клієнт мають казати одне.
    title: `${title} · Commerce OS · WEEXP`,
    desc: `${title}: проблема → наслідки → діагностика → рішення → процес → результат → докази. ${promise}`.slice(0, 300),
    content: `<h1>${esc(title)}</h1><p>${esc(en)}. ${esc(promise)}</p><h2>Як працюємо</h2><p>Діагностуємо систему за даними (CRM/ERP/GA4), будуємо її під ключ і доводимо до економіки — щоб бізнес працював без героя. Проблема → наслідки → діагностика → рішення → процес → результат → докази → умови.</p>`,
  });
}

// Мета беремо з спільної таблиці (де вона є) — статика більше не розходиться
// з рантаймом. Тіло сторінки лишається багатим, як було.
for (const r of ROUTES) {
  const m = SEO.routes[r.path];
  if (m) { r.title = m.uk[0]; r.desc = m.uk[1]; }
}

// Підсторінки експертиз: раніше не мали ні статики, ні навіть title у рантаймі.
for (const [slug, m] of Object.entries(SEO.expansion)) {
  ROUTES.push({
    path: `/expansion/${slug}`, og: `exp-${slug}`, title: m.uk[0], desc: m.uk[1],
    // Раніше тіло було одним абзацом — тим самим описом, що вже в <meta>.
    // Додаємо контекст, спільний для всіх напрямів експансії.
    content: `<h1>${esc(m.uk[0].split(' — ')[0])}</h1><p>${esc(m.uk[1])}</p><h2>Як це вбудовано в систему</h2><p>Напрям не існує окремо: він частина Commerce OS і міряється тими самими грошима, що й решта. Спершу діагностика за даними CRM/ERP/GA4, далі — план хвилями з Definition of Done, далі — робота до економіки, а не до звіту.</p>${ulLinks(SYSTEMS, SYS_SLUGS)}`,
  });
}

// EN-двійники. Тіло — з затвердженої EN-мети, а не переклад UK-тексту на око.
const EN = [];
for (const r of ROUTES) {
  const key = r.path;
  const m = SEO.routes[key] || (key.startsWith('/expansion/') ? SEO.expansion[key.slice('/expansion/'.length)] : null);
  if (!m) continue;
  const head = `<h1>${esc(m.en[0].split(' — ')[0].replace(' · WEEXP', ''))}</h1><p>${esc(m.en[1])}</p>`;
  EN.push({
    path: key === '/' ? '/en' : `/en${key}`, og: r.og, lang: 'en',
    title: m.en[0], desc: m.en[1],
    // Підсторінки експансії йдуть спільним хвостом — так само, як українські:
    // напрям не існує окремо, він частина Commerce OS.
    content: head + (EN_BODY[key] ?? (key.startsWith('/expansion/')
      ? `<h2>How it fits the system</h2><p>A direction does not exist on its own: it is part of Commerce OS and is measured in the same money as the rest. First a diagnosis on CRM/ERP/GA4 data, then a plan in waves with a Definition of Done, then work carried through to the economics — not to a report.</p>${ul(SYSTEMS_EN)}`
      : '')),
  });
}
ROUTES.push(...EN);

const canon = (p) => ORIGIN + (p === '/' ? '/' : p);
/** UK ↔ EN + x-default. Раніше hreflang ставив лише JS — краулери без JS його не бачили. */
const altsFor = (path) => {
  const base = path === '/en' ? '/' : path.startsWith('/en/') ? path.slice(3) : path;
  const uk = canon(base);
  const en = canon(base === '/' ? '/en' : `/en${base}`);
  return [['uk', uk], ['en', en], ['x-default', uk]]
    .map(([hl, href]) => `<link rel="alternate" hreflang="${hl}" href="${href}">`).join('');
};

// FAQPage і Service лишаємо ТІЛЬКИ на головній (де FAQ/послуга справді на сторінці);
// на інших сторінках Google вимагає видимий контент під розмітку — тож віддаємо
// лише Organization + WebSite, щоб не ловити structured-data-невідповідність.
const MINIMAL_LD = `<script type="application/ld+json">\n{"@context":"https://schema.org","@graph":[{"@type":"ProfessionalService","@id":"${ORIGIN}/#org","name":"WEEXP","url":"${ORIGIN}/","logo":"${ORIGIN}/apple-touch-icon.png","image":"${ORIGIN}/og.png","areaServed":["UA","EU","US"],"email":"hello@weexp.agency","sameAs":["https://www.linkedin.com/company/weexp"]},{"@type":"WebSite","@id":"${ORIGIN}/#site","url":"${ORIGIN}/","name":"WEEXP","inLanguage":"uk","publisher":{"@id":"${ORIGIN}/#org"}}]}\n</script>`;

function build(tpl, r) {
  let h = tpl;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`);
  if (r.path !== '/') h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, MINIMAL_LD);
  h = h.replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(r.desc)}$2`);
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canon(r.path)}$2`);
  if (r.lang === 'en') h = h.replace(/<html([^>]*)lang="[^"]*"/, '<html$1lang="en"');
  h = h.replace('</head>', `${altsFor(r.path)}</head>`);
  h = h.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canon(r.path)}$2`);
  h = h.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(r.title)}$2`);
  h = h.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(r.desc)}$2`);
  h = h.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(r.title)}$2`);
  h = h.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(r.desc)}$2`);
  // Пер-маршрутна OG-картинка (за наявності): краулери бачать її у статиці.
  if (r.og) {
    const img = `${ORIGIN}/og/${r.og}.png`;
    h = h.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${img}$2`);
    h = h.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${img}$2`);
  }
  /*
   * Статична навігація на КОЖНІЙ сторінці.
   *
   * Меню й підвал малює React, тому в статиці посилань на сусідні сторінки не
   * було зовсім: без JS сайт не обходився, а вага посилань нікуди не текла.
   * Саме через це вісім сторінок /systems/* і виявились сиротами — їх не
   * тримало ніщо, крім кільця одна на одну.
   */
  const pref = r.lang === 'en' ? '/en' : '';
  const alt = r.lang === 'en' ? (r.path.replace(/^\/en/, '') || '/') : `/en${r.path === '/' ? '' : r.path}`;
  const nav = `<nav aria-label="${r.lang === 'en' ? 'Site' : 'Сайт'}"><ul>${NAV_PAGES.map(
    (p) => `<li><a href="${p.to === '/' ? (pref || '/') : pref + p.to}">${esc(r.lang === 'en' ? p.en : p.uk)}</a></li>`,
  ).join('')}<li><a href="${alt}">${r.lang === 'en' ? 'Українська' : 'English'}</a></li></ul></nav>`;

  // Контент усередині #root (клієнт замінює його при render). Прихований від FOUC.
  h = h.replace('<div id="root"></div>', `<div id="root"><div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">${r.content}${nav}</div></div>`);
  return h;
}

const tpl = await readFile(join(DIST, 'index.html'), 'utf8');
let n = 0;
for (const r of ROUTES) {
  const html = build(tpl, r);
  const out = r.path === '/' ? join(DIST, 'index.html') : join(DIST, r.path.replace(/^\//, ''), 'index.html');
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, html, 'utf8');
  n++;
}
// Карту сайту пишемо з ТОГО САМОГО списку маршрутів. Доти вона велася руками і
// встигла розійтися: обіцяла 13 адрес, для яких статики не існувало.
const EXTRA = ['/privacy.html', '/oferta.html'];
const urls = [...ROUTES.map((r) => r.path), ...EXTRA];
const body = urls.map((p) => `  <url><loc>${ORIGIN}${p === '/' ? '/' : p}</loc></url>`).join('\n');
await writeFile(join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, 'utf8');

console.log(`prerender: wrote ${n} static route pages + sitemap (${urls.length} urls)`);
