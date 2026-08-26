// Локальна генерація og-картинок 1200×630 у public/og/ (НЕ частина Vercel-збірки:
// потребує chromium). Картинки комітяться в репозиторій.
// Запуск:
//   npm run build            # створює dist-ssr з даними
//   NODE_PATH=<node_modules із playwright-core> \
//   CHROME=<шлях до chromium> FONTS_CSS=<css зі шрифтами data-URI> \
//   node scripts/og-images.mjs
//   npm run build            # ще раз, щоб public/og потрапив у dist
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'og');
mkdirSync(outDir, { recursive: true });

const { COURSES, courseStats, fmtPrice, POSTS, TOTALS } = await import(
  join(root, 'dist-ssr', 'entry-server.js')
);

const fonts = process.env.FONTS_CSS ? readFileSync(process.env.FONTS_CSS, 'utf8') : '';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Єдиний шаблон у комікс-стилі школи: червоний або паперовий фон
function tpl({ bg, eyebrow, title, sub, stats, badge }) {
  const red = bg === 'red';
  const fg = red ? '#fff' : '#111';
  const hi = red
    ? 'background:#fff;color:#FF0000'
    : 'background:#FF0000;color:#fff;box-shadow:5px 5px 0 #111';
  const size = title.length > 46 ? 62 : title.length > 30 ? 74 : 88;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fonts}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:${red ? '#FF0000' : '#FFFDF8'};color:${fg};font-family:'Manrope',sans-serif;position:relative;overflow:hidden;padding:56px 64px;display:flex;flex-direction:column}
body::before{content:'';position:absolute;inset:0;background-image:radial-gradient(${red ? 'rgba(255,255,255,.16)' : 'rgba(17,17,17,.09)'} 1.5px,transparent 1.5px);background-size:17px 17px}
.top{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;margin-bottom:34px}
.brandrow{display:flex;align-items:center;gap:16px}
.logo{width:58px;height:58px;background:#fff;border:3px solid #111;display:flex;align-items:center;justify-content:center;box-shadow:4px 4px 0 #111}
.brand{font-family:'Oswald',sans-serif;font-weight:700;font-size:22px;letter-spacing:2px;text-transform:uppercase;line-height:1.1}
.badge{font-family:'Oswald',sans-serif;font-weight:600;font-size:17px;letter-spacing:2px;text-transform:uppercase;border:3px solid #111;background:#FFD100;color:#111;padding:8px 16px;box-shadow:4px 4px 0 #111}
.eyebrow{position:relative;z-index:2;font-family:'Oswald',sans-serif;font-weight:600;font-size:19px;letter-spacing:4px;text-transform:uppercase;opacity:.85;margin-bottom:14px}
h1{position:relative;z-index:2;font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;font-size:${size}px;line-height:1.03;letter-spacing:-.5px;max-width:1050px}
h1 b{${hi};padding:0 14px;display:inline-block;transform:rotate(-1deg)}
.sub{position:relative;z-index:2;font-family:'Caveat',cursive;font-weight:700;font-size:40px;margin-top:18px;max-width:980px}
.stats{position:relative;z-index:2;display:flex;gap:16px;margin-top:auto}
.stat{border:3px solid #111;background:#fff;color:#111;box-shadow:5px 5px 0 #111;padding:14px 26px;text-align:center}
.stat b{display:block;font-family:'Oswald',sans-serif;font-weight:700;font-size:38px;line-height:1;color:#FF0000}
.stat span{font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:1px}
.url{position:relative;z-index:2;margin-top:auto;align-self:flex-start;font-family:'Oswald',sans-serif;font-weight:600;font-size:24px;letter-spacing:3px;text-transform:uppercase;color:#fff;background:#111;padding:8px 18px}
.stats + .url{margin-top:24px}
</style></head><body>
<div class="top">
  <div class="brandrow">
    <div class="logo"><svg width="34" height="34" viewBox="0 0 120 120" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M60 120C26.8629 120 0 93.1371 0 60V0C22.5654 0 42.2213 12.4569 52.4662 30.8691C38.4788 34.2089 28.0787 46.7902 28.0787 61.8006V63.1443C28.0787 79.9648 41.7146 93.6006 58.5353 93.6006H59.8789L59.8785 61.8006C59.8785 79.3633 74.1159 93.6006 91.6787 93.6006L91.6787 61.8006C91.6787 44.2783 77.5071 30.0661 60 30.0008L60 0H62.5352C94.2722 0 120 25.7279 120 57.4648V60C120 93.1371 93.1371 120 60 120Z" fill="#FF0000"/></svg></div>
    <div class="brand">Commerce<br>Architecture</div>
  </div>
  ${badge ? `<div class="badge">${esc(badge)}</div>` : ''}
</div>
${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
<h1>${title}</h1>
${sub ? `<div class="sub">${esc(sub)}</div>` : ''}
${stats?.length ? `<div class="stats">${stats.map((s) => `<div class="stat"><b>${esc(s.v)}</b><span>${esc(s.l)}</span></div>`).join('')}</div>` : ''}
<div class="url">school.weexp.agency</div>
</body></html>`;
}

// перелік завдань: id → html
const jobs = [];

for (const c of COURSES) {
  const stats = courseStats(c);
  jobs.push({
    file: `course-${c.id}.png`,
    html: tpl({
      bg: 'paper',
      badge: c.expert ? 'Експертний курс ★' : c.kind === 'general' ? 'Загальний трек' : 'Точковий курс',
      eyebrow: 'Курс школи',
      title: esc(c.name),
      sub: c.hook,
      stats: [
        { v: fmtPrice(c.price), l: 'вартість' },
        { v: c.duration, l: 'тривалість' },
        { v: String(stats.modules), l: 'модулів' },
      ],
    }),
  });
}

for (const p of POSTS) {
  jobs.push({
    file: `post-${p.slug}.png`,
    html: tpl({
      bg: 'paper',
      badge: 'Блог',
      eyebrow: p.tags.join(' · '),
      title: esc(p.title),
      stats: [{ v: p.readTime, l: 'читання' }],
    }),
  });
}

const PAGES = {
  home: {
    bg: 'red',
    eyebrow: 'Школа архітекторів e-commerce',
    title: 'Від новачка — до <b>E-Commerce Director</b>',
    stats: [
      { v: String(TOTALS.levels), l: 'рівнів' },
      { v: String(TOTALS.modules), l: 'модулів' },
      { v: String(TOTALS.questions), l: 'питань' },
    ],
  },
  about: {
    bg: 'paper',
    eyebrow: 'Про школу',
    title: 'Ми вчимо <b>архітекторів</b>, а не операторів кнопок',
    sub: 'місія, цінності, методика і засновник',
  },
  courses: {
    bg: 'red',
    eyebrow: 'Каталог курсів',
    title: 'Загальні треки, <b>точкові</b> та експертні курси',
    stats: [{ v: String(COURSES.length), l: 'курсів' }],
  },
  program: {
    bg: 'paper',
    eyebrow: 'Програма школи',
    title: '<b>16 рівнів</b> компетентності',
    stats: [
      { v: String(TOTALS.modules), l: 'модулів' },
      { v: String(TOTALS.questions), l: 'питань' },
    ],
  },
  blog: {
    bg: 'paper',
    eyebrow: 'Блог школи',
    title: 'Розбори <b>без води</b>',
    sub: 'аналітика, фінанси, SEO/GEO, CRM і карʼєра',
  },
  glossary: {
    bg: 'paper',
    eyebrow: 'Глосарій',
    title: 'E-commerce <b>словник</b>',
    sub: 'терміни електронної комерції простою мовою',
  },
  enroll: {
    bg: 'red',
    eyebrow: 'Запис на навчання',
    title: 'Підберемо <b>твій курс</b>',
    sub: 'відповідь протягом одного робочого дня',
  },
  faq: {
    bg: 'paper',
    eyebrow: 'FAQ',
    title: 'Часті <b>питання</b>',
  },
  contacts: {
    bg: 'paper',
    eyebrow: 'Контакти',
    title: 'На звʼязку <b>напряму</b>',
    sub: 'заявки розбирає особисто засновник',
  },
};
for (const [key, cfg] of Object.entries(PAGES)) {
  jobs.push({ file: `page-${key}.png`, html: tpl(cfg) });
}

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const browser = await chromium.launch({
  executablePath: process.env.CHROME,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const job of jobs) {
  const tmp = join(outDir, job.file.replace(/\.png$/, '.html'));
  writeFileSync(tmp, job.html);
  await page.goto('file://' + tmp);
  await page.waitForTimeout(120);
  await page.screenshot({ path: join(outDir, job.file) });
}
await browser.close();
// прибрати тимчасові html
const { unlinkSync, readdirSync } = await import('node:fs');
for (const f of readdirSync(outDir)) if (f.endsWith('.html')) unlinkSync(join(outDir, f));
console.log(`generated ${jobs.length} og images in public/og/`);
