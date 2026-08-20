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

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const ORIGIN = 'https://weexp.agency';
const SUF = ' · WEEXP';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ul = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

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

const ROUTES = [
  { path: '/', title: 'WEEXP — Commerce OS: система замість героїзму',
    desc: 'Commerce OS для D2C та e-commerce брендів $0.5–10M: діагноз у грошах, побудова системи й вихід на ЄС/США — щоб виторг ріс без вас.',
    content: `<h1>Система замість героїзму</h1><p>Продажі тримаються на людях і ручному режимі, а не на системі. WEEXP — Commerce OS для українських виробників і D2C-брендів $0.5–10M: діагностуємо систему онлайн-продажів, рахуємо розрив у грошах і будуємо систему, щоб бізнес працював без героя.</p><p>${esc(SERVICES)}</p><h2>Вісім систем онлайн-продажів</h2>${ul(SYSTEMS)}` },
  { path: '/proof', title: `Докази — трансформації в цифрах${SUF}`,
    desc: 'Флагманські кейси e-commerce: дельти до→після з CRM/ERP/GA4 — ×18 обороту, +65% продажів, ≥19 млн ₴ розриву. Не обіцянки, а числа.',
    content: `<h1>Систему видно в цифрах</h1><p>Не обіцянки — дельти до→після з CRM, ERP і GA4. Кожен кейс анонімний, але число реальне.</p>${ul(PROOF)}` },
  { path: '/people', title: `Люди — власник у кожної системи${SUF}`,
    desc: 'Команда WEEXP структурована за системами: у кожної із восьми систем — свій власник. Систему будують власники, а не герої.',
    content: `<h1>Систему будують власники, не герої</h1><p>У кожної з восьми систем онлайн-продажів є відповідальний за результат. Не універсали — власники конкретного контуру.</p>${ul(ROSTER)}` },
  { path: '/expansion', title: `Міжнародна експансія — ЄС і США${SUF}`,
    desc: 'Системний вивід брендів на ринки ЄС і США: власний сайт, Amazon, Allegro, eBay та локальні маркетплейси — з локалізацією, логістикою, юридичним контуром і юніт-економікою ринку.',
    content: `<h1>Вихід у ЄС і США як система, не спроба</h1><p>Європа і Штати — окремий бізнес-контур. Виводимо системно й одразу на всіх вітринах ринку. Пріоритетні ринки: PL, DE, CZ, США.</p><h2>Вітрини ринку</h2>${ul(CHANNELS)}` },
  { path: '/diagnose', title: `Діагностика e-commerce — від числа до плану${SUF}`,
    desc: 'Єдина діагностика онлайн-продажів: за 5 хвилин порахуйте втрати, отримайте карту 8 систем, головний bottleneck і кабінет із планом повернення виторгу.',
    content: `<h1>Діагностика e-commerce: від числа до плану</h1><p>Один інструмент, а не два: спершу рахуємо, скільки витікає щороку; далі — карта восьми систем, головний bottleneck, кабінет із вашими даними та поглиблений AI-розбір. Це кроки однієї діагностики.</p><h2>Кроки діагностики</h2>${ul(['Профіль і симптоми', 'Ваш витік у грошах', 'Карта восьми систем', 'Кабінет Tier-2', 'Поглиблений AI-розбір'])}` },
  { path: '/contact', title: `Контакт — запит на діагноз${SUF}`,
    desc: 'Залиште контакт — повернемося з планом діагностики у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M.',
    content: `<h1>Зростання — це система. Почнімо з діагнозу.</h1><p>Залиште контакт — повернемося з першим зрізом розриву у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M.</p>` },
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
  const promise = (SYSTEMS.find((s) => s.startsWith(title)) || '').split(' — ')[1] || '';
  ROUTES.push({
    path: `/systems/${slug}`,
    title: `${title} — послуга WEEXP · Commerce OS`,
    desc: `${title}: проблема → наслідки → діагностика → рішення → процес → результат → докази. ${promise}`.slice(0, 300),
    content: `<h1>${esc(title)}</h1><p>${esc(en)}. ${esc(promise)}</p><h2>Як працюємо</h2><p>Діагностуємо систему за даними (CRM/ERP/GA4), будуємо її під ключ і доводимо до економіки — щоб бізнес працював без героя. Проблема → наслідки → діагностика → рішення → процес → результат → докази → умови.</p>`,
  });
}

const canon = (p) => ORIGIN + (p === '/' ? '/' : p);

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
  h = h.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canon(r.path)}$2`);
  h = h.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(r.title)}$2`);
  h = h.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(r.desc)}$2`);
  h = h.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(r.title)}$2`);
  h = h.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(r.desc)}$2`);
  // Контент усередині #root (клієнт замінює його при render). Прихований від FOUC.
  h = h.replace('<div id="root"></div>', `<div id="root"><div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">${r.content}</div></div>`);
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
console.log(`prerender: wrote ${n} static route pages`);
