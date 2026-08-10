/**
 * HTML → PDF тем же Chromium (Playwright), что уже стоит для обхода.
 * page.pdf работает только в headless — печатает фон, формат A4 из @page-CSS.
 */
import { writeFile } from 'node:fs/promises';
import type { Browser } from 'playwright';
import { launchBrowser } from './crawl.js';

export async function renderPdf(html: string, outPath: string, browser?: Browser): Promise<void> {
  const own = !browser;
  const b = browser ?? (await launchBrowser());
  const ctx = await b.newContext();
  try {
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: 'networkidle', timeout: 30000 });
    const buf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    await writeFile(outPath, buf);
  } finally {
    await ctx.close().catch(() => {});
    if (own) await b.close().catch(() => {});
  }
}
