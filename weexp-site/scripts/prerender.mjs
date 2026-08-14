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
];
const SERVICES = 'Веб-розробка, ERP-автоматизація, UX/UI та CRO, SEO, аналітика/BI, retention/CRM, операційна модель — усі сім систем під одним дахом.';
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
  { path: '/', title: 'WEEXP — Система замість героїзму',
    desc: 'Операційний партнер з e-commerce для українських виробників і D2C-брендів $0.5–10M: діагноз у грошах, побудова системи, вихід на ринки ЄС і США — і залишаємо все працювати без вас.',
    content: `<h1>Система замість героїзму</h1><p>Продажі тримаються на людях і ручному режимі, а не на системі. WEEXP — операційний партнер з e-commerce для українських виробників і D2C-брендів $0.5–10M: діагностуємо систему онлайн-продажів, рахуємо розрив у грошах і будуємо систему, щоб бізнес працював без героя.</p><p>${esc(SERVICES)}</p><h2>Сім систем онлайн-продажів</h2>${ul(SYSTEMS)}` },
  { path: '/systems', title: `7 систем, у яких бізнес втрачає гроші${SUF}`,
    desc: 'Сім систем онлайн-продажів — від стратегії до організації. Веб-розробка, ERP-автоматизація, UX/UI та CRO, SEO й аналітика під одним дахом. Знайдіть, де витікає виторг.',
    content: `<h1>Де ваш бізнес втрачає гроші?</h1><p>Не сайт і не канал — уся система онлайн-продажів із семи частин. ${esc(SERVICES)}</p>${ul(SYSTEMS)}` },
  { path: '/proof', title: `Докази — трансформації в цифрах${SUF}`,
    desc: 'Флагманські кейси e-commerce: дельти до→після з CRM/ERP/GA4 — ×18 обороту, +65% продажів, ≥19 млн ₴ розриву. Не обіцянки, а числа.',
    content: `<h1>Систему видно в цифрах</h1><p>Не обіцянки — дельти до→після з CRM, ERP і GA4. Кожен кейс анонімний, але число реальне.</p>${ul(PROOF)}` },
  { path: '/people', title: `Люди — власник у кожної системи${SUF}`,
    desc: 'Команда WEEXP структурована за системами: у кожної із семи систем — свій власник. Систему будують власники, а не герої.',
    content: `<h1>Систему будують власники, не герої</h1><p>У кожної з семи систем онлайн-продажів є відповідальний за результат. Не універсали — власники конкретного контуру.</p>${ul(ROSTER)}` },
  { path: '/expansion', title: `Міжнародна експансія — ЄС і США${SUF}`,
    desc: 'Системний вивід брендів на ринки ЄС і США: власний сайт, Amazon, Allegro, eBay та локальні маркетплейси — з локалізацією, логістикою, юридичним контуром і юніт-економікою ринку.',
    content: `<h1>Вихід у ЄС і США як система, не спроба</h1><p>Європа і Штати — окремий бізнес-контур. Виводимо системно й одразу на всіх вітринах ринку. Пріоритетні ринки: PL, DE, CZ, США.</p><h2>Вітрини ринку</h2>${ul(CHANNELS)}` },
  { path: '/diagnose', title: `Business X-Ray — безкоштовний діагноз${SUF}`,
    desc: 'Пройдіть Business X-Ray за 2 хвилини: Independence Score, здоровʼя по 7 системах і головний bottleneck — без реєстрації.',
    content: `<h1>Знайдіть головний bottleneck</h1><p>Business X-Ray за 2 хвилини: оцініть 7 систем онлайн-продажів і отримайте Independence Score, Business Health і вузьке місце, що тримає прибуток — без реєстрації.</p>` },
  { path: '/loss', title: `Калькулятор витрат — скільки ви втрачаєте${SUF}`,
    desc: 'Порахуйте за 5 хвилин, скільки грошей витікає з вітрини щороку — оцінка за вашими даними й бенчмарками. Крок 1 до повної діагностики.',
    content: `<h1>Порахуйте, скільки ви втрачаєте</h1><p>Спершу число: скільки грошей витікає з вітрини щороку. Потім, у повній діагностиці, перетворимо його на карту — де саме й як повернути.</p>` },
  { path: '/contact', title: `Контакт — запит на діагноз${SUF}`,
    desc: 'Залиште контакт — повернемося з планом діагностики у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M.',
    content: `<h1>Зростання — це система. Почнімо з діагнозу.</h1><p>Залиште контакт — повернемося з першим зрізом розриву у грошах. Для e-commerce виробників і D2C-брендів $0.5–10M.</p>` },
];

const canon = (p) => ORIGIN + (p === '/' ? '/' : p);

function build(tpl, r) {
  let h = tpl;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`);
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
