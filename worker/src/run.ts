/**
 * Оркестратор аудита. CLI:
 *   npm run audit -- --tier 1 --site https://shop.example \
 *     [--competitor https://a.example --competitor https://b.example] \
 *     [--request "смотрите, анализируйте"] [--out results]
 *
 * Тир T1 (по умолчанию): внешний обход клиента (+конкурентов, если заданы) →
 * L0-датасет + читаемый отчёт наблюдений. Аналитический слой (Claude) и сборка
 * материалов (AD-15, Гант) подключаются следующими модулями поверх датасета.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { launchBrowser, crawlSite } from './crawl.js';
import { renderL0Report, type AuditDataset } from './report.js';
import { TIERS, type Tier } from './tiers.js';

type Args = { tier: Tier; site: string; competitors: string[]; request: string; out: string };

function parseArgs(argv: string[]): Args {
  const a: Args = { tier: 1, site: '', competitors: [], request: '', out: 'results' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--tier') { a.tier = (Number(v) as Tier) || 1; i++; }
    else if (k === '--site') { a.site = v; i++; }
    else if (k === '--competitor') { if (v) a.competitors.push(v); i++; }
    else if (k === '--request') { a.request = v ?? ''; i++; }
    else if (k === '--out') { a.out = v ?? 'results'; i++; }
  }
  return a;
}

function slug(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-'); }
  catch { return 'site'; }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.site) {
    console.error('Нужен --site https://... (опц. --tier 1..4, --competitor <url> ×N, --request "...")');
    process.exit(1);
  }
  const spec = TIERS[args.tier];
  console.log(`▶ Аудит T${args.tier} «${spec.title}»\n  клиент: ${args.site}`);
  if (args.competitors.length) console.log(`  конкуренты: ${args.competitors.join(', ')}`);

  const browser = await launchBrowser();
  try {
    console.log('  · обход клиента…');
    const client = await crawlSite(browser, args.site, 'client');
    const competitors = [];
    if (args.tier >= 2) {
      for (const c of args.competitors) {
        console.log(`  · обход конкурента ${c}…`);
        competitors.push(await crawlSite(browser, c, 'competitor'));
      }
    } else if (args.competitors.length) {
      console.log('  · конкуренты заданы, но на T1 не обходятся (нужен T2+). Пропускаю.');
    }

    const ds: AuditDataset = { tier: args.tier, request: args.request, client, competitors, takenAt: new Date().toISOString() };
    const dir = join(args.out, `${slug(args.site)}-t${args.tier}-${Date.now()}`);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'dataset.json'), JSON.stringify(ds, null, 2), 'utf8');
    await writeFile(join(dir, 'L0-report.md'), renderL0Report(ds), 'utf8');

    const cs = client.pages.filter((p) => p.score !== null);
    console.log(`✓ Готово. Разобрано страниц: ${client.pages.length}${cs.length ? `, ср. соответствие ${Math.round(cs.reduce((s, p) => s + (p.score ?? 0), 0) / cs.length)}%` : ''}`);
    console.log(`  датасет: ${join(dir, 'dataset.json')}`);
    console.log(`  отчёт:   ${join(dir, 'L0-report.md')}`);
  } finally {
    await browser.close().catch(() => {});
  }
}

main().catch((e) => { console.error('Сбой аудита:', e); process.exit(1); });
