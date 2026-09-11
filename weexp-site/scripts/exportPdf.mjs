/**
 * Вигрузка сайту в PDF: знімок кожної сторінки на всю висоту.
 *
 * Запускати з теки worker — там лежить playwright:
 *   (у weexp-site) npm run build && npx vite preview --port 4192 &
 *   (у worker)     node ../weexp-site/scripts/exportPdf.mjs http://127.0.0.1:4192 <тека>
 *   python3 scripts/exportPdfBuild.py <тека> index.json index
 *   node scripts/exportPdfContents.mjs index.json contents.pdf
 *   python3 scripts/exportPdfBuild.py <тека> out.pdf final contents.pdf
 *
 * Спершу тут був page.pdf() — він дає текст, який виділяється, але друкує
 * сторінку заново з висотою аркуша замість висоти вікна. Усе, що завʼязане
 * на vh (а на сайті це герої, секції й відступи), роздувалось: головна
 * замість одного аркуша давала вісім. Знімок екрана такої вади не має — він
 * знімає рівно те, що бачить відвідувач, — тож фіделіті переважило
 * виділюваний текст. Текстова версія всіх сторінок є окремо, у CONTENT.md.
 */
import { createRequire } from 'node:module';

/*
 * playwright резолвимо від робочої теки, а не від теки скрипта: сам скрипт
 * живе разом з рештою скриптів сайту, а браузер стоїть у worker/. Звичайний
 * import шукав би модуль поруч зі скриптом і не знаходив.
 */
const { chromium } = createRequire(process.cwd() + '/').call(null, 'playwright');
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] || 'http://127.0.0.1:4190';
const OUT = process.argv[3];
const ONLY = process.argv[4] ? Number(process.argv[4]) : 0;

const W = 1440;
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const xml = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
let urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].replace('https://weexp.agency', '') || '/');

const rank = (u) => (u.endsWith('.html') ? 4 : u.startsWith('/en') ? 3 : u.startsWith('/blog') ? 2 : 1);
const ukOrder = ['/', '/systems', '/proof', '/people', '/expansion', '/pricing', '/diagnose', '/contact', '/audit-pack'];
urls.sort((a, b) => {
  const r = rank(a) - rank(b);
  if (r) return r;
  const ia = ukOrder.indexOf(a), ib = ukOrder.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  return a.localeCompare(b);
});
if (ONLY) urls = urls.slice(0, ONLY);

await mkdir(OUT, { recursive: true });
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await br.newContext({ viewport: { width: W, height: 1000 }, deviceScaleFactor: 1 });

// Згода на cookie — до першого переходу: інакше банер перекриває нижню
// частину першого екрана на кожній з 91 сторінки.
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('weexp:cookie-consent-v1',
      JSON.stringify({ v: 'all', at: new Date().toISOString() }));
  } catch { /* приватний режим */ }
});

const page = await ctx.newPage();
const meta = [];
let i = 0;
for (const u of urls) {
  i++;
  const file = join(OUT, String(i).padStart(3, '0') + '.jpg');
  try {
    await page.goto(BASE + u, { waitUntil: 'networkidle', timeout: 45000 });
    await page.evaluate(() => document.fonts?.ready);
    // Прокрутка до низу й назад: ліниві зображення й анімації появи інакше
    // лишаються ненамальованими й потрапляють у знімок порожніми.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(700);
    const title = await page.title();
    await page.screenshot({ path: file, fullPage: true, type: 'jpeg', quality: 72 });
    const h = await page.evaluate(() => Math.ceil(document.body.scrollHeight));
    meta.push({ url: u, title, h, file });
    console.log(`${String(i).padStart(3)}/${urls.length}  ${u}  ${h}px`);
  } catch (e) {
    meta.push({ url: u, error: String(e).slice(0, 120) });
    console.log(`${String(i).padStart(3)}/${urls.length}  ${u}  ПОМИЛКА: ${String(e).slice(0, 90)}`);
  }
}
await writeFile(join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));
await br.close();
console.log('готово:', meta.filter((m) => !m.error).length, 'з', urls.length);
