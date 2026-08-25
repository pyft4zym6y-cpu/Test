import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readdirSync, mkdirSync } from 'node:fs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const pg = await b.newPage();
mkdirSync('pdf', { recursive: true });
for (const f of readdirSync('out').filter((x) => x.endsWith('.html')).sort()) {
  await pg.goto('file://' + process.cwd() + '/out/' + f, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  const deck = f.startsWith('zvit-1');
  await pg.pdf({
    path: 'pdf/' + f.replace('.html', '.pdf'),
    printBackground: true,
    ...(deck ? { width: '1280px', height: '720px', pageRanges: '' } : { format: 'A4' }),
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  console.log('✓', f);
}
await b.close();
