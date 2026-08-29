/**
 * Генератор OG-карток (1200×630) під кожну ключову сторінку. Запускається ВРУЧНУ
 * (npm run og:gen), не в Vercel-білді: рендерить брендовий HTML-шаблон у
 * Chromium (Playwright) і зберігає PNG у public/og/<slug>.png. Далі prerender.mjs
 * підставляє їх у og:image/twitter:image відповідних маршрутів. Стиль — нео-
 * брутальний .sysx: тепле полотно, чорнильний заголовок, червоний акцент.
 *
 * Шрифти системні (без мережі): нам важлива вага і структура, не точний шрифт.
 */
/*
 * Playwright не в зависимостях сайта: генератор запускается вручную и в сборку
 * Vercel не входит — тянуть браузер в прод ради этого незачем. Пакет лежит в
 * worker/, поэтому пробуем сначала обычное разрешение, потом соседний пакет,
 * и только затем сдаёмся с внятным сообщением, а не со стеком ERR_MODULE_NOT_FOUND.
 */
const { chromium } = await (async () => {
  for (const spec of ['playwright', new URL('../../worker/node_modules/playwright/index.mjs', import.meta.url).href]) {
    try { return await import(spec); } catch { /* пробуем следующий */ }
  }
  throw new Error('og:gen — не найден пакет playwright. Установите его или запустите из worker/.');
})();
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og');
await mkdir(OUT, { recursive: true });

// slug → { kick, title, metric }
const CARDS = [
  { slug: 'home', kick: 'Система зростання', title: 'Система замість героїзму', metric: 'Діагноз у грошах · побудова системи · ЄС і США' },
  { slug: 'proof', kick: 'The Evidence', title: 'Систему видно в цифрах', metric: '×18 обороту · +65% продажів · дельти з CRM/ERP/GA4' },
  { slug: 'people', kick: 'Команда', title: 'Систему будують власники, не герої', metric: 'У кожної з 8 систем — свій відповідальний' },
  { slug: 'expansion', kick: 'Експансія', title: 'Вихід у ЄС і США як система', metric: 'Власний сайт · Amazon · Allegro · локальні маркетплейси' },
  { slug: 'diagnose', kick: 'Express Audit', title: 'Порахуйте, скільки виторгу витікає', metric: 'Безкоштовно · ~2 хв · головний bottleneck + PDF' },
  { slug: 'pricing', kick: 'Формати і ціни', title: 'Три формати — за рівнем відповідальності', metric: 'Аудит · консалтинг · управління під ключ' },
  { slug: 'systems', kick: 'Система зростання', title: 'Вісім систем, з яких складаються продажі', metric: 'Виторг витікає там, де найслабша частина' },
  { slug: 'contact', kick: 'Контакт', title: 'Зростання — це система. Почнімо з діагнозу.', metric: 'Для e-commerce виробників і D2C-брендів' },
];

/*
 * Вісім сторінок систем ділили одну загальну картку /og.png — у стрічці вони
 * виглядали однією й тією ж посиланням. Назва системи та її обіцянка беруться
 * з того самого рядка, що йде в заголовок і опис сторінки (SYSTEMS у
 * prerender.mjs): картка й видача мають казати одне.
 */
const SYSTEM_CARDS = [
  ['strategy-management', '01 · Система', 'Стратегія та управління', 'Стратегія продажів, якою можна керувати'],
  ['commercial-performance', '02 · Система', 'Комерційна ефективність', 'Більше виручки замало — зробіть комерцію прибутковою'],
  ['demand-customer', '03 · Система', 'Попит і клієнт', 'Перетворюйте трафік на клієнтів, а клієнтів на цінність'],
  ['experience-conversion', '04 · Система', 'Досвід і конверсія', 'Зробіть кожен крок клієнта робочим'],
  ['operations-fulfillment', '05 · Система', 'Операції та fulfillment', 'Продавати марно, якщо не можеш доставити'],
  ['data-technology', '06 · Система', 'Дані, технології, інтеграції', 'Один бізнес, одне джерело правди'],
  ['organization-operating-model', '07 · Система', 'Організація та операційна модель', 'Побудуйте бізнес, якому не потрібні герої'],
  ['expansion-markets', '08 · Система', 'Експансія та ринки', 'Вихід на ЄС і США як окремий контур, а не спроба'],
];
for (const [slug, kick, title, metric] of SYSTEM_CARDS)
  CARDS.push({ slug: `sys-${slug}`, kick, title, metric });

/* Шість напрямів експансії ділили одну картку хабу — те саме, що й у систем. */
const EXPANSION_CARDS = [
  ['international', 'Міжнародна експансія', 'ЄС і США як окремий контур, а не спроба'],
  ['automation', 'Бізнес-процеси', 'Автоматизація там, де вона повертає гроші'],
  ['technology', 'E-commerce Technology', 'Стек під задачу, а не задача під стек'],
  ['marketing', 'Маркетинг', 'Канали, які окупаються, а не ті, що модні'],
  ['sales-channels', 'Канали продажів', 'Власний сайт, Amazon, Allegro, локальні маркетплейси'],
  ['data-growth', 'Data & Growth', 'Рішення за цифрами, а не за відчуттям'],
];
for (const [slug, title, metric] of EXPANSION_CARDS)
  CARDS.push({ slug: `exp-${slug}`, kick: 'Експансія', title, metric });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const tpl = (c) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px}
body{background:#FAF5E9;font-family:"Segoe UI",Helvetica,Arial,sans-serif;color:#141210;position:relative;overflow:hidden}
.bar{position:absolute;left:0;top:0;bottom:0;width:16px;background:#F5301C}
.wrap{position:absolute;inset:0;padding:74px 84px 64px 100px;display:flex;flex-direction:column;justify-content:space-between}
.top{display:flex;align-items:center;justify-content:space-between}
.logo{font-weight:800;font-size:34px;letter-spacing:-.01em}
.dot{color:#F5301C}
.badge{font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:#6B675E;font-weight:600}
.kick{font-size:19px;letter-spacing:.16em;text-transform:uppercase;color:#F5301C;font-weight:700;margin-bottom:22px}
.title{font-size:70px;line-height:1.04;font-weight:800;letter-spacing:-.02em;max-width:20ch}
.metric{font-size:24px;color:#3a352f;font-weight:500;max-width:44ch;margin-top:26px}
.foot{display:flex;align-items:center;gap:14px;font-size:18px;color:#6B675E;font-weight:600}
.chip{border:1.5px solid rgba(20,18,16,.2);border-radius:100px;padding:7px 16px}
.grid{position:absolute;right:-120px;top:-120px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle at 40% 40%, rgba(245,48,28,.10), transparent 62%)}
</style></head><body>
<div class="bar"></div><div class="grid"></div>
<div class="wrap">
  <div class="top"><div class="logo">WEEXP<span class="dot">.</span></div><div class="badge">weexp.agency</div></div>
  <div>
    <div class="kick">${esc(c.kick)}</div>
    <div class="title">${esc(c.title)}</div>
    <div class="metric">${esc(c.metric)}</div>
  </div>
  <div class="foot"><span class="chip">Система зростання</span><span class="chip">D2C · e-commerce</span><span class="chip">🇺🇦 Made in Ukraine</span></div>
</div></body></html>`;

const EXE = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
let n = 0;
for (const c of CARDS) {
  await page.setContent(tpl(c), { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(OUT, `${c.slug}.png`), type: 'png' });
  n++;
}
await browser.close();
console.log(`og:gen — wrote ${n} OG cards to public/og/`);
