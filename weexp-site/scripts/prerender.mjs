/**
 * Легкий SSG для клієнтського three.js-SPA (без React-SSR, без браузера — тому
 * безпечно для Vercel-білду). Після vite build генеруємо для кожного маршруту
 * dist/<route>/index.html з правильними head-мета (title/description/canonical/
 * og) і РЕАЛЬНИМ текстовим контентом усередині #root. На клієнті
 * createRoot().render() повністю замінює #root (не hydrate) → жодного mismatch;
 * краулери й AI без JS бачать зміст і мета, а не порожній div. Vercel віддає
 * статичні файли раніше за SPA-rewrite, тож ці сторінки реально доходять.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
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
/*
 * Раніше тут був ulLinks — перелік восьми систем із посиланнями на їхні
 * сторінки. Сторінок більше немає: вони описували нашу внутрішню методологію,
 * були сиротами в дереві й дублювали і девʼять експертиз, і шістнадцять видів
 * аудиту. Кожна стара адреса веде постійним перенаправленням на /services/audit.
 * Сам перелік лишається текстом — він пояснює обсяг роботи, а не продає себе.
 */

// Дзеркало PAGES із src/lib/nav.ts — статика й застосунок мають називати
// сторінки однаково. Перелік звіряє wording.test.ts: доти коментар обіцяв
// цього сторожа, а його не існувало — і меню тут могло розійтися з меню в
// застосунку без жодного сигналу.
/*
 * Дзеркало навігації для статики: те, що в браузері малює SystemShell і
 * SiteFooter, тут треба віддати краулеру без JS.
 *
 * Це ДУБЛЬ src/lib/nav.ts, і він уже одного разу відстав: коли «Експертизи»
 * пішли з головного меню, тут вони лишились другим пунктом. Тепер збіг звіряє
 * тест (src/__tests__/seoOutput.test.ts) — раніше коментар нижче стверджував,
 * що звіряє, а такого тесту не існувало.
 *
 * Порядок і склад — як у підвалі: меню плюс адреси, яких у меню немає, але
 * вхід на них мусить бути (розрахунок, експертизи).
 */
const NAV_PAGES = [
  { to: '/services', uk: 'Послуги', en: 'Services' },
  { to: '/proof', uk: 'Кейси', en: 'Cases' },
  { to: '/expansion', uk: 'Експертизи', en: 'Expertise' },
  { to: '/people', uk: 'Про нас', en: 'About' },
  { to: '/blog', uk: 'Блог', en: 'Blog' },
  { to: '/contact', uk: 'Контакти', en: 'Contacts' },
  { to: '/diagnose', uk: 'Розрахунок', en: 'Estimate' },
];
/*
 * Напрями експертизи: хаб не посилався на них у статиці, і без JS
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
const FORMAT_LINKS = [
  ['/services/audit', '01 Аудит — 4–6 тижнів: магазин $2,900 або весь відділ e-commerce $4,900', '01 Audit — 4–6 weeks: the store $2,900 or the whole e-commerce department $4,900'],
  ['/services/consulting', '02 Консалтинг — $50/год, мін. $1,500/міс: ми архітектор і контроль, руки — ваша команда', '02 Consulting — $50/hr, min. $1,500/mo: we are the architect and the control, your team executes'],
  ['/services/managed', '03 Управління під ключ — від $4,900/міс, 6–12 міс: проєкт ведемо ми, відповідальність наша', '03 Managed delivery — from $4,900/mo, 6–12 mo: we run the project and carry the responsibility'],
];
/*
 * Перелік форматів із посиланнями на їхні сторінки. Доти статика показувала ті
 * самі три рядки простим <li> — тобто три сторінки, на яких тепер тримається
 * структура сайту, були з головної недосяжні без JS. Рівно так само колись
 * виявились сиротами вісім сторінок систем.
 */
const formatLinks = (lang) => `<ul>${FORMAT_LINKS.map(([to, uk, en]) =>
  `<li><a href="${lang === 'en' ? '/en' : ''}${to}">${esc(lang === 'en' ? en : uk)}</a></li>`).join('')}</ul>`;

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
  '/': `<p>We show in numbers how much your store loses every month — from your CRM, ERP and GA4. Then we rebuild what delivers the biggest delta.</p><h2>Three ways to work</h2>${formatLinks('en')}<p>${esc(SERVICES_EN)}</p><h2>What the audit covers</h2>${ul(SYSTEMS_EN)}<p><a href="/en/services/audit">What the audit checks</a></p>`,
  '/proof': `<p>Not promises — before→after deltas from CRM, ERP and GA4. Every case is anonymous; every number is real.</p>${ul(PROOF_EN)}`,
  '/people': `<p>WEEXP was founded by Pavlo Sydorenko, Founder &amp; Architect of Commerce (8+ years in international e-commerce: US · EU · MENA). Each of the eight systems of online sales has an owner accountable for the result — specialists, not generalists.</p>${ul(ROSTER_EN)}`,
  '/expansion': `<p>Europe and the US are a separate business contour. We launch systematically and across all storefronts of a market at once. Priority markets: PL, DE, CZ, USA.</p><h2>Market storefronts</h2>${ul(CHANNELS_EN)}${expansionLinks('en')}`,
  '/diagnose': `<p>One instrument, not two: first we count how much leaks every year; then the map of eight systems, the main bottleneck, a cabinet with your data and an in-depth AI review. These are steps of one diagnosis.</p><h2>Steps of the diagnosis</h2>${ul(DIAG_STEPS_EN)}`,
  '/contact': `<p>Leave a contact — we come back with the first cut of the gap, in money. For e-commerce manufacturers and D2C brands. This is not work yet; this is a diagnosis.</p>`,
  '/services': `<p>We rebuild online sales: we find where the money leaks and close it — with our hands or yours. The formats differ not by «service package» but by who is accountable for the result.</p><h2>Three ways to work</h2>${formatLinks('en')}<p>Step 1 — the audit: without the diagnosis we neither advise nor take over delivery.</p>`,
};

/*
 * Види аудиту мовою клієнта — дзеркало AUDIT_KINDS із src/data/auditScope.ts.
 *
 * Дублюється свідомо: prerender — окремий .mjs без доступу до TS. Саме ці
 * формулювання людина набирає в пошуку («UX/UI аудит», «аудит воронки
 * продажів»), тож без них статика не відповідає на запит, заради якого
 * сторінка написана. Що дубль не розійшовся з джерелом — звіряє
 * auditScope.test.ts.
 */
const AUDIT_KIND_NAMES = [
  'Комплексний UX/UI аудит сайту',
  'Аудит дерева й структури сайту',
  'Аудит воронки продажів',
  'Аудит шляху клієнта (CJM)',
  'Контент-аудит',
  'Первинний SEO-аудит',
  'Маркетинговий аудит',
  'Аудит утримання й CRM',
  'Технологічний аудит',
  'Аудит аналітики й даних',
  'Аудит операційних процесів',
  'Аудит асортименту й ціноутворення',
  'Аудит комерційної моделі',
  'Аудит ринку й позиціонування',
  'Аудит команди й процесів',
  'Аудит потенціалу експансії',
];

const ROUTES = [
  /*
   * H1 і лід тут ДУБЛЮЮТЬ перший екран головної (src/system/SystemInMotion.tsx):
   * пошуковий робот бачить цю сторінку, а не React-рендер. Два місця з одним
   * текстом розʼїжджаються мовчки — саме це й сталось, коли герой переписали
   * на потребу клієнта, а тут лишилось «Перебудовуємо онлайн-продажі».
   * Сторож seoOutput звіряє їх; змінюєте один — міняйте обидва.
   */
  { path: '/', og: 'home', title: 'WEEXP — комплексний e-commerce: більше продажів з того самого трафіку',
    desc: 'Беремо всю структуру онлайн-продажів, а не одну ділянку: 13 доменів діагностики, 16 видів аудиту. Показуємо в гривнях, скільки магазин втрачає щомісяця, і перебудовуємо те, що дає найбільшу дельту. Аудит від $2,900, консалтинг від $1,500/міс, управління від $4,900/міс.',
    content: `<h1>Більше продажів з того самого трафіку</h1><p>Показуємо в гривнях, скільки магазин втрачає щомісяця — за вашими CRM, ERP і GA4. Далі перебудовуємо те, що дає найбільшу дельту. Для e-commerce і D2C-брендів.</p><h2>Три формати роботи</h2>${formatLinks('uk')}<p>${esc(SERVICES)}</p><h2>Що охоплює аудит</h2>${ul(SYSTEMS)}<p><a href="/services/audit">Що саме перевіряє аудит</a></p>` },
  { path: '/proof', og: 'proof', title: `Докази — трансформації в цифрах${SUF}`,
    desc: 'Флагманські кейси e-commerce: дельти до→після з CRM/ERP/GA4 — ×18 обороту, +65% продажів, ≥19 млн ₴ розриву. Не обіцянки, а числа.',
    content: `<h1>Кейси</h1><p>Систему видно в цифрах. Не обіцянки — дельти до→після з CRM, ERP і GA4. Кожен кейс анонімний, але число реальне.</p>${ul(PROOF)}` },
  { path: '/people', og: 'people', title: `Люди — власник у кожної системи${SUF}`,
    desc: 'Команда WEEXP структурована за системами: у кожної із восьми систем — свій власник. Систему будують власники, а не герої.',
    content: `<h1>Ми будуємо систему, а не залежність</h1><p>Засновник WEEXP — Павло Сидоренко, Founder & Architect of Commerce (8+ років у міжнародному e-commerce: US · EU · MENA). У кожної з восьми систем онлайн-продажів є відповідальний за результат. Не універсали — власники конкретного контуру.</p>${ul(ROSTER)}` },
  { path: '/expansion', og: 'expansion', title: `Міжнародна експансія — ЄС і США${SUF}`,
    desc: 'Системний вивід брендів на ринки ЄС і США: власний сайт, Amazon, Allegro, eBay та локальні маркетплейси — з локалізацією, логістикою, юридичним контуром і юніт-економікою ринку.',
    content: `<h1>Наші експертизи</h1><p>Девʼять напрямів, якими ми закриваємо задачі. Це не окремі продукти: вони входять у будь-який із трьох форматів — змінюється лише те, хто тримає кермо.</p><h2>Вітрини ринку</h2>${ul(CHANNELS)}${expansionLinks('uk')}` },
  { path: '/diagnose', og: 'diagnose', title: `Діагностика e-commerce — від числа до плану${SUF}`,
    desc: 'Безкоштовний експрес-розрахунок втрат за 5 хвилин, далі глибокий аудит усієї структури e-commerce: 16 аудитів, 13 доменів діагностики, 4–6 тижнів.',
    content: `<h1>Діагностика: почнімо з числа</h1><p>Спершу безкоштовний експрес-розрахунок: скільки виторгу витікає щороку й де головне вузьке місце. Це орієнтир, а не аудит.</p><h2>Кроки діагностики</h2>${ul(['Профіль і симптоми', 'Ваш витік у грошах', 'Карта восьми систем', 'Кабінет Tier-2', 'Поглиблений AI-розбір'])}<h2>Що таке глибокий аудит</h2><p>Повний розбір структури e-commerce за 4–6 тижнів: від комерційної моделі й аналітики до операційних процесів і технологій.</p>${ul(AUDIT_KIND_NAMES)}<p><a href="/services/audit">Формат 01 — Аудит</a> · <a href="/audit-pack">що ви отримаєте на виході</a></p>` },
  { path: '/contact', og: 'contact', title: `Контакт — запит на діагноз${SUF}`,
    desc: 'Залиште контакт — повернемося з планом діагностики у грошах. Для e-commerce виробників і D2C-брендів.',
    content: `<h1>Залишити заявку</h1><p>Напишіть у двох реченнях, що відбувається. Для e-commerce виробників і D2C-брендів. Це ще не робота, це діагноз.</p><h2>Що буде далі</h2>${ul(NEXT_STEPS)}<p>Працюємо з українськими виробниками та D2C-брендами: власний сайт, маркетплейси, вихід на ЄС і США. Пишіть на hello@weexp.agency або лишайте контакт у формі.</p>` },
  { path: '/services', og: 'pricing', title: `Послуги — три формати роботи${SUF}`,
    desc: 'Що робить WEEXP: аудит онлайн-продажів, консалтинг і супровід, управління трансформацією під ключ. Формати відрізняються тим, хто відповідає за результат.',
    content: `<h1>Що ми робимо</h1><p>Перебудовуємо онлайн-продажі: знаходимо, де витікають гроші, і закриваємо це руками — своїми або вашими. Формати відрізняються не «пакетом послуг», а тим, хто відповідає за результат.</p><h2>Три формати роботи</h2>${formatLinks('uk')}<p>Крок 1 — аудит: без діагностики ми не консультуємо і не беремо управління.</p>` },
];

/*
 * Три сторінки форматів співпраці — статикою.
 *
 * Тексти дублюють services.ts навмисно: prerender — окремий .mjs без доступу
 * до TS, і тягнути сюди складання TypeScript заради трьох абзаців дорожче, ніж
 * звірити дубль тестом. Саме так тут уже живе дзеркало меню (NAV_PAGES), і
 * звіряє його wording.test.ts. Ціни й строки звіряє services.test.ts — вони і
 * є те, що розійшлося б найдорожче.
 */

const FORMAT_PAGES = [
  ['audit', 'Аудит онлайн-продажів', 'Аудит', '$2,900 / $4,900 · 4–6 тижнів',
   'Карта: де саме витікають гроші, скільки це коштує на рік і що робити першим. Магазин $2,900 або весь відділ e-commerce $4,900, 4–6 тижнів.',
   'Карта: де саме витікають гроші, скільки це коштує на рік і що робити першим. Обираєте глибину: сам магазин ($2,900) чи весь відділ e-commerce ($4,900).',
   'Кому підходить: у вас сильна внутрішня команда, потрібні не руки, а карта. Впровадження та результат — ваша команда. 100% вартості аудиту зараховується в перший місяць управління під ключ, якщо старт упродовж 30 днів.'],
  ['consulting', 'Консалтинг e-commerce', 'Консалтинг', '$50/год · мінімум 30 год/міс',
   'Зовнішній архітектор для вашої команди: що робити, в якому порядку і чи зроблено якісно. $50/год, мінімум 30 год/міс ($1,500/міс).',
   'Зовнішній архітектор для вашої команди: що робити, в якому порядку і чи зроблено якісно. Рахунок не буває менше $1,500 на місяць.',
   'Кому підходить: у вас є виконавці та проджект-менеджер. Якість рішень і контроль — ми; виконання руками та результат — ваша команда. Старт — після аудиту, початковий термін 3 місяці.'],
  ['managed', 'Управління e-commerce під ключ', 'Управління під ключ', 'від $4,900/міс · 6–12 місяців',
   'Проєкт ведемо ми — план, люди, бюджет і фінальна відповідальність за результат. Від $4,900/міс, 6–12 місяців.',
   'Проєкт ведемо ми — план, люди, бюджет і фінальна відповідальність за результат.',
   'Кому підходить: нема кому вести це зсередини, потрібен результат, а не поради. Пілот — перші 3 місяці з фіксованими KPI першої хвилі, далі 6–12 місяців. Старт — тільки після аудиту.'],
];
for (const [slug, title, short, price, desc, promise, who] of FORMAT_PAGES) {
  ROUTES.push({
    path: `/services/${slug}`, og: 'pricing',
    title: `${title}${SUF}`,
    /*
     * Опис написаний окремо від тексту сторінки, а не склеєний із нього.
     * Перша версія збирала його як `${promise} ${price}.` — виходило 188
     * символів: у видачі обрізалось посеред слова, та ще й з малої літери
     * після крапки. Обидва рази це впіймав seoOutput.test.ts, який дивиться
     * у зібраний dist, а не в наміри в коді.
     */
    desc,
    /*
     * Коротка назва — та сама, що в H1 на сторінці («Аудит», а не «Аудит
     * онлайн-продажів»). Довга лишається в <title> і описі, де вона й працює
     * на пошук. Доти робот бачив одну назву, людина — іншу.
     */
    content: `<h1>${esc(short)}</h1><p>${esc(promise)}</p><p><b>${esc(price)}</b></p><p>${esc(who)}</p>`
      + (slug === 'audit'
        ? `<h2>Що входить у глибокий аудит</h2><p>Це не перевірка сайту: розбираємо всю структуру e-commerce — від комерційної моделі й аналітики до операційних процесів і технологій.</p>${ul(AUDIT_KIND_NAMES)}`
        : '')
      + `<p><a href="/services">Усі три формати роботи</a> · <a href="/pricing">умови поруч</a></p>`,
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
    content: `<h1>${esc(m.uk[0].split(' — ')[0])}</h1><p>${esc(m.uk[1])}</p><h2>Як це вбудовано в систему</h2><p>Напрям не існує окремо: він частина системи зростання і міряється тими самими грошима, що й решта. Спершу діагностика за даними CRM/ERP/GA4, далі — план хвилями з Definition of Done, далі — робота до економіки, а не до звіту.</p><p><a href="/services">Три формати роботи</a> · <a href="/services/audit">що перевіряє аудит</a></p>`,
  });
}

/*
 * Блог: хаб і кожна стаття як статичні сторінки.
 *
 * Читаємо ті самі JSON, з яких зібраний застосунок, — джерело одне. Тіло
 * статті у статику йде скорочено: пряма відповідь, лід і заголовки H2. Цього
 * достатньо, щоб краулер і AI-видача без JS бачили, ПРО ЩО стаття й яка в неї
 * структура; повний текст віддає застосунок. Копіювати лонгрид у другий
 * формат означало б завести другу версію правди.
 */
/*
 * Назви підсторінок для тексту посилань — із lib/nav.ts, а не третім списком.
 *
 * Перша версія підписувала посилання в статиці самим шляхом:
 * «/systems/commercial-performance». Це не текст посилання, а адреса; ні
 * людині, ні краулеру вона нічого не каже — рівно та сама вада, через яку
 * колись шість напрямів експансії були підписані слугами.
 */
const NAV_SRC = await readFile(join(ROOT, 'src', 'lib', 'nav.ts'), 'utf8');
const NAMES = new Map(
  [...NAV_SRC.matchAll(/\{ to: '([^']+)', uk: '([^']+)', en: '([^']+)' \}/g)].map((m) => [m[1], m[2]]),
);
const nameOfPath = (p) => NAMES.get(p) || p;

const BLOG_DIR = join(ROOT, 'src', 'content', 'blog');
const blogFiles = (await readdir(BLOG_DIR).catch(() => [])).filter((f) => f.endsWith('.json'));
const BLOG = [];
for (const f of blogFiles) {
  BLOG.push(JSON.parse(await readFile(join(BLOG_DIR, f), 'utf8')));
}
BLOG.sort((a, b) => (a.published < b.published ? 1 : -1));

if (BLOG.length) {
  ROUTES.push({
    path: '/blog', og: 'home',
    title: SEO.routes['/blog'].uk[0], desc: SEO.routes['/blog'].uk[1],
    content: `<h1>Практика e-commerce — без загальних слів</h1><p>${esc(SEO.routes['/blog'].uk[1])}</p><h2>Статті</h2><ul>${
      BLOG.map((a) => `<li><a href="/blog/${a.slug}">${esc(a.title)}</a> — ${esc(a.description)}</li>`).join('')}</ul>`,
  });
  for (const a of BLOG) {
    ROUTES.push({
      path: `/blog/${a.slug}`, og: 'home',
      title: (a.seoTitle || a.title).slice(0, 60),
      desc: a.description,
      content: `<h1>${esc(a.title)}</h1><p>${esc(a.answer)}</p><p>${esc(a.lead)}</p>`
        + a.sections.map((x) => `<h2>${esc(x.h)}</h2>`).join('')
        + `<h2>Часті питання</h2><ul>${a.faq.map((f) => `<li><b>${esc(f.q)}</b> ${esc(f.a)}</li>`).join('')}</ul>`
        + `<p>Читати далі: ${a.pages.map((p) => `<a href="${p}">${esc(nameOfPath(p))}</a>`).join(' · ')}</p>`,
    });
  }
}

/**
 * Блок «Статті по темі» у статиці — той самий, що малює BlogTeaser у застосунку.
 *
 * Без нього краулер без JS не мав ЖОДНОГО шляху від головної до блогу: меню
 * блогу не містить, а хаб ні звідки не лінкувався. Сорок статей були в карті
 * сайту й недосяжні по посиланнях — рівно та сама хвороба, що колись була у
 * восьми сторінок /systems/*. Порядок відбору повторює articlesFor():
 * спершу ті, для яких ця сторінка стоїть ПЕРШОЮ в pages.
 */
function blogBlock(path) {
  const mine = BLOG.filter((a) => a.pages.includes(path));
  if (!mine.length) return '';
  const primary = mine.filter((a) => a.pages[0] === path);
  const rest = mine.filter((a) => a.pages[0] !== path);
  const items = [...primary, ...rest].slice(0, 5);
  return `<section aria-label="Статті по темі"><h2>Статті по темі</h2><ul>${
    items.map((a) => `<li><a href="/blog/${a.slug}">${esc(a.title)}</a></li>`).join('')
  }</ul><p><a href="/blog">Усі статті</a></p></section>`;
}

// EN-двійники. Тіло — з затвердженої EN-мети, а не переклад UK-тексту на око.
// Блог поки лише українською, тому EN-двійників у нього немає: сторінка
// англійською з українськими лонгридами обіцяє те, чого немає.
const EN = [];
for (const r of ROUTES) {
  const key = r.path;
  if (key === '/blog' || key.startsWith('/blog/')) continue;
  const m = SEO.routes[key] || (key.startsWith('/expansion/') ? SEO.expansion[key.slice('/expansion/'.length)] : null);
  if (!m) continue;
  const head = `<h1>${esc(m.en[0].split(' — ')[0].replace(' · WEEXP', ''))}</h1><p>${esc(m.en[1])}</p>`;
  EN.push({
    path: key === '/' ? '/en' : `/en${key}`, og: r.og, lang: 'en',
    title: m.en[0], desc: m.en[1],
    // Підсторінки експансії йдуть спільним хвостом — так само, як українські:
    // напрям не існує окремо, він частина системи зростання.
    content: head + (EN_BODY[key] ?? (key.startsWith('/expansion/')
      ? `<h2>How it fits the system</h2><p>A direction does not exist on its own: it is part of the growth system and is measured in the same money as the rest. First a diagnosis on CRM/ERP/GA4 data, then a plan in waves with a Definition of Done, then work carried through to the economics — not to a report.</p>${ul(SYSTEMS_EN)}`
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

/**
 * Підставити значення між двома захопленими групами.
 *
 * Чому не рядок-заміна. Було `h.replace(/(...)(")/, `$1${esc(r.desc)}$2`)`, і в
 * рядку заміни `$1`/`$2` — посилання на групи. Щойно в тексті зʼявилась ціна
 * «$2,900», `$2` усередині неї теж стало посиланням: підставилась закривальна
 * лапка, атрибут обірвався на «Магазин », а решта опису поїхала в розмітку.
 *
 * Помилка була латентною роками: у жодному title чи description доти не було
 * знака долара. Впіймав її seoOutput.test.ts — тим, що дивиться у зібраний
 * dist, а не в наміри в коді.
 *
 * Функція-заміна знімає будь-яке тлумачення `$` у значенні.
 */
const between = (h, re, value) => h.replace(re, (_, a, b) => a + value + b);

function build(tpl, r) {
  let h = tpl;
  h = h.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(r.title)}</title>`);
  if (r.path !== '/') h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, MINIMAL_LD);
  h = between(h, /(<meta name="description" content=")[^"]*(")/, esc(r.desc));
  h = between(h, /(<link rel="canonical" href=")[^"]*(")/, canon(r.path));
  if (r.lang === 'en') h = h.replace(/<html([^>]*)lang="[^"]*"/, '<html$1lang="en"');
  h = h.replace('</head>', `${altsFor(r.path)}</head>`);
  h = between(h, /(<meta property="og:url" content=")[^"]*(")/, canon(r.path));
  h = between(h, /(<meta property="og:title" content=")[^"]*(")/, esc(r.title));
  h = between(h, /(<meta property="og:description" content=")[^"]*(")/, esc(r.desc));
  h = between(h, /(<meta name="twitter:title" content=")[^"]*(")/, esc(r.title));
  h = between(h, /(<meta name="twitter:description" content=")[^"]*(")/, esc(r.desc));
  // Пер-маршрутна OG-картинка (за наявності): краулери бачать її у статиці.
  if (r.og) {
    const img = `${ORIGIN}/og/${r.og}.png`;
    h = between(h, /(<meta property="og:image" content=")[^"]*(")/, img);
    h = between(h, /(<meta name="twitter:image" content=")[^"]*(")/, img);
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
  // Блок статей — лише на українських сторінках поза самим блогом: рівно там,
  // де його малює BlogTeaser у застосунку.
  const blog = r.lang === 'en' || r.path === '/blog' || r.path.startsWith('/blog/') ? '' : blogBlock(r.path);
  // Теж функція-заміна: у тілі сторінки трапляються і ціни, і «$&».
  h = h.replace('<div id="root"></div>', () => `<div id="root"><div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">${r.content}${blog}${nav}</div></div>`);
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
