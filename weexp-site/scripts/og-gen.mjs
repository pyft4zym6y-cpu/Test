/**
 * Генератор OG-карток (1200×630) під кожну ключову сторінку. Запускається ВРУЧНУ
 * (npm run og:gen), не в Vercel-білді: рендерить брендовий HTML-шаблон у
 * Chromium (Playwright) і зберігає PNG у public/og/<slug>.png. Далі prerender.mjs
 * підставляє їх у og:image/twitter:image відповідних маршрутів. Стиль — нео-
 * брутальний .sysx: тепле полотно, чорнильний заголовок, червоний акцент.
 *
 * Шрифти системні (без мережі): нам важлива вага і структура, не точний шрифт.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og');
await mkdir(OUT, { recursive: true });

// slug → { kick, title, metric }
const CARDS = [
  { slug: 'home', kick: 'Commerce OS', title: 'Система замість героїзму', metric: 'Діагноз у грошах · побудова системи · ЄС і США' },
  { slug: 'proof', kick: 'The Evidence', title: 'Систему видно в цифрах', metric: '×18 обороту · +65% продажів · дельти з CRM/ERP/GA4' },
  { slug: 'people', kick: 'Команда', title: 'Систему будують власники, не герої', metric: 'У кожної з 8 систем — свій відповідальний' },
  { slug: 'expansion', kick: 'Експансія', title: 'Вихід у ЄС і США як система', metric: 'Власний сайт · Amazon · Allegro · локальні маркетплейси' },
  { slug: 'diagnose', kick: 'Express Audit', title: 'Порахуйте, скільки виторгу витікає', metric: 'Безкоштовно · ~2 хв · головний bottleneck + PDF' },
  { slug: 'pricing', kick: 'Формати і ціни', title: 'Три формати — за рівнем відповідальності', metric: 'Аудит · консалтинг · управління під ключ' },
  { slug: 'contact', kick: 'Контакт', title: 'Зростання — це система. Почнімо з діагнозу.', metric: 'Для e-commerce виробників і D2C-брендів $0.5–10M' },
];

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
  <div class="foot"><span class="chip">Commerce OS</span><span class="chip">D2C · e-commerce $0.5–10M</span><span class="chip">🇺🇦 Made in Ukraine</span></div>
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
