/**
 * HTML → PDF. ВАЖНО: page.pdf() работает ТОЛЬКО в headless-Chromium, а обходной
 * браузер может быть headful (HEADFUL=1 для бот-защиты). Поэтому PDF-рендер
 * держит СОБСТВЕННЫЙ всегда-headless браузер (синглтон на процесс) и игнорирует
 * переданный обходной. Иначе на проде с HEADFUL=1 падал каждый PDF, оставляя
 * только JSON.
 */
import { writeFile } from 'node:fs/promises';
import { chromium, type Browser } from 'playwright';
import { withTimeout } from './util/timeout.js';

const PDF_TIMEOUT_MS = Number(process.env.PDF_TIMEOUT_MS) || 60000;

let pdfBrowser: Browser | null = null;

async function getPdfBrowser(): Promise<Browser> {
  if (pdfBrowser && pdfBrowser.isConnected()) return pdfBrowser;
  const executablePath = process.env.CHROME_PATH || undefined; // тот же escape hatch, что у обхода
  pdfBrowser = await chromium.launch({
    headless: true, // безусловно: PDF в headful невозможен
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  return pdfBrowser;
}

/** Закрыть PDF-браузер (вызывать в конце прогона). */
export async function closePdfBrowser(): Promise<void> {
  await pdfBrowser?.close().catch(() => {});
  pdfBrowser = null;
}

/** Рендер HTML в PDF. Третий аргумент оставлен для совместимости и игнорируется —
 *  рендер всегда идёт в собственном headless-браузере. */
export async function renderPdf(html: string, outPath: string, _crawlBrowser?: Browser): Promise<void> {
  // Весь рендер під жорстким таймаутом: завислий page.pdf()/newContext (зависла
  // headless-вкладка) інакше блокує прогін. Крок-виклик уже в try/catch → пропуск.
  await withTimeout((async () => {
    const b = await getPdfBrowser();
    const ctx = await b.newContext();
    try {
      const page = await ctx.newPage();
      await page.setContent(html, { waitUntil: 'networkidle', timeout: 30000 });
      const buf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
      await writeFile(outPath, buf);
    } finally {
      await ctx.close().catch(() => {});
    }
  })(), PDF_TIMEOUT_MS, `PDF ${outPath.split('/').pop()}`);
}
