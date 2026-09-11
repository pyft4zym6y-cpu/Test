/**
 * Титул і зміст — однією високою сторінкою.
 *
 * Висота фіксована в одну сторінку навмисно: номери аркушів у змісті
 * рахуються зі зсувом на сам зміст, і якщо він займе два аркуші замість
 * одного, усі посилання зсунуться на одиницю. Одна сторінка робить зсув
 * відомим наперед.
 */
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const [, , indexPath, out] = process.argv;
const idx = JSON.parse(await readFile(indexPath, 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const rows = idx.sections.map((s) => `
  <section>
    <h2>${esc(s.name)} <i>${s.items.length}</i></h2>
    <ul>${s.items.map((it) => `
      <li><span class="u">${esc(it.url)}</span><span class="d"></span><span class="t">${esc(it.title)}</span><b>${it.sheet}</b></li>`).join('')}
    </ul>
  </section>`).join('');

const html = `<!doctype html><meta charset="utf-8"><style>
  @font-face{font-family:B;src:local("Arial");}
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1440px;background:#FAF5E9;color:#141210;
    font:15px/1.5 "Helvetica Neue",Arial,sans-serif;padding:80px 96px 64px}
  .kick{font:700 13px/1 monospace;letter-spacing:.18em;text-transform:uppercase;color:#D0230E}
  h1{font:900 76px/0.95 Arial,sans-serif;letter-spacing:-.02em;text-transform:uppercase;margin:18px 0 20px}
  .lead{font-size:19px;max-width:760px;color:#3a3531}
  .meta{margin:28px 0 44px;border:2.5px solid #141210;background:#fff;
    box-shadow:6px 6px 0 #141210;padding:18px 22px;display:flex;gap:44px;flex-wrap:wrap}
  .meta div{font:12px/1.5 monospace;text-transform:uppercase;letter-spacing:.06em;color:#6b6560}
  .meta b{display:block;font:900 26px/1.2 Arial,sans-serif;color:#141210;letter-spacing:-.01em}
  section{margin-bottom:30px;break-inside:avoid}
  h2{font:900 21px/1 Arial,sans-serif;text-transform:uppercase;letter-spacing:.02em;
    border-bottom:2.5px solid #141210;padding-bottom:8px;margin-bottom:10px}
  h2 i{font:700 12px/1 monospace;font-style:normal;color:#D0230E;margin-left:8px}
  li{display:flex;align-items:baseline;gap:8px;padding:3px 0;list-style:none;font-size:14px}
  .u{font:12px/1.5 monospace;color:#D0230E;white-space:nowrap}
  .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:720px;color:#3a3531}
  .d{flex:1;border-bottom:1px dotted #bfb8ad;transform:translateY(-3px)}
  li b{font:700 13px/1 monospace;min-width:34px;text-align:right}
</style>
<div class="kick">WEEXP · вигрузка сайту</div>
<h1>weexp.agency<br>усі сторінки</h1>
<p class="lead">Кожна сторінка сайту надрукована як вона виглядає у браузері на ширині 1440&nbsp;px —
одна сторінка сайту на один аркуш PDF, без розрізів посередині. Номери праворуч — номери аркушів
у цьому файлі. Навігація також доступна закладками PDF.</p>
<div class="meta">
  <div>Сторінок сайту<b>${idx.total}</b></div>
  <div>Аркушів у файлі<b>${idx.sheets}</b></div>
  <div>Зібрано<b>${idx.date}</b></div>
  <div>Ширина макета<b>1440 px</b></div>
</div>
${rows}`;

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await (await br.newContext({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 2 })).newPage();
await p.setContent(html, { waitUntil: 'load' });
await p.emulateMedia({ media: 'screen' });
const h = await p.evaluate(() => Math.ceil(document.body.scrollHeight) + 80);
await p.pdf({ path: out, printBackground: true, width: '1440px', height: `${h}px`,
  margin: { top: '0', right: '0', bottom: '0', left: '0' } });
await br.close();
await writeFile(out + '.height', String(h));
console.log('зміст:', h, 'px, один аркуш');
