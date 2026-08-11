/**
 * Пререндер SPA для поисковиков (техбеклог SEO-аудиту: «SPA отдаёт пустой HTML»).
 * После `npm run build` поднимает статический сервер над dist/, обходит маршруты
 * предустановленным Chromium и сохраняет отрендеренный HTML в dist/<route>/index.html.
 * Vercel отдаёт файлы прежде rewrites (filesystem-first) — поисковик получает
 * контент, гидратация React поверх снапшота работает штатно.
 * Запуск: node scripts/prerender.mjs   (локально/в CI с браузером; НЕ в Vercel build)
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { chromium } from 'playwright';

const DIST = new URL('../dist', import.meta.url).pathname;
const PORT = 4573;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.ico': 'image/x-icon' };

const STATIC_ROUTES = ['/', '/os', '/cases', '/services', '/about', '/blog', '/contact', '/calculator', '/estimate', '/privacy', '/offer'];

async function collectSlugs() {
  const routes = [];
  try {
    const blog = await readFile(new URL('../src/data/blog.ts', import.meta.url), 'utf8');
    for (const m of blog.matchAll(/slug: '([^']+)'/g)) routes.push(`/blog/${m[1]}`);
  } catch { /* noop */ }
  try {
    const cases = await readFile(new URL('../src/pages/CasesPage.tsx', import.meta.url), 'utf8');
    for (const m of cases.matchAll(/slug: '([^']+)'/g)) routes.push(`/cases/${m[1]}`);
  } catch { /* noop */ }
  return routes;
}

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = join(DIST, path);
  const target = existsSync(file) && extname(file) ? file : join(DIST, 'index.html');
  try {
    const body = await readFile(target);
    res.writeHead(200, { 'content-type': MIME[extname(target)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});

const routes = [...STATIC_ROUTES, ...(await collectSlugs())];
await new Promise((r) => server.listen(PORT, r));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage();
let ok = 0;
for (const route of routes) {
  try {
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200); // анимации; networkidle не ждать (бегущая строка)
    const html = await page.content();
    const out = route === '/' ? join(DIST, 'index.html') : join(DIST, route.slice(1), 'index.html');
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, '<!doctype html>\n' + html.replace(/^<!doctype html>\s*/i, ''), 'utf8');
    ok++;
    console.log('✓', route);
  } catch (e) { console.log('⚠', route, String(e).slice(0, 80)); }
}
await browser.close();
server.close();
console.log(`Пререндер: ${ok}/${routes.length} маршрутов → dist/`);
