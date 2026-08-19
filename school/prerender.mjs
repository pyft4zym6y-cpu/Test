// Пререндер усіх маршрутів у статичний HTML (виконується після vite build).
// Пише dist/<route>/index.html з контентом, унікальними title/description,
// canonical і og-тегами — плюс оновлює sitemap.xml із сьогоднішнім lastmod.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
const { render, getSeo, prerenderRoutes, SITE } = await import('./dist-ssr/entry-server.js');

const template = readFileSync(join(dist, 'index.html'), 'utf8');
const routes = prerenderRoutes();

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

for (const route of routes) {
  const seo = getSeo(route);
  const appHtml = render(route);
  let html = template
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(seo.title)}</title>`)
    .replace(
      /<meta\s+name="description"[^>]*\/>/,
      `<meta name="description" content="${esc(seo.description)}" />`,
    )
    .replace(
      /<meta property="og:title"[^>]*\/>/,
      `<meta property="og:title" content="${esc(seo.title)}" />`,
    )
    .replace(
      /<meta\s+property="og:description"[^>]*\/>/,
      `<meta property="og:description" content="${esc(seo.description)}" />`,
    )
    .replace(
      /<meta property="og:url"[^>]*\/>/,
      `<meta property="og:url" content="${seo.canonical}" />`,
    )
    .replace(
      /<link rel="canonical"[^>]*\/>/,
      `<link rel="canonical" href="${seo.canonical}" />`,
    );

  const out = route === '/' ? join(dist, 'index.html') : join(dist, route, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

// sitemap.xml з актуальним lastmod
const today = new Date().toISOString().slice(0, 10);
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  routes
    .filter((r) => !getSeo(r).noindex)
    .map((r) => {
      const loc = SITE + (r === '/' ? '/' : r);
      return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod></url>`;
    })
    .join('\n') +
  '\n</urlset>\n';
writeFileSync(join(dist, 'sitemap.xml'), sitemap);
writeFileSync(join(root, 'public', 'sitemap.xml'), sitemap);

console.log(`prerendered ${routes.length} routes + sitemap`);
