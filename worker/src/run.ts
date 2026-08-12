/**
 * CLI-обёртка над конвейером аудита (pipeline.ts).
 *   npm run audit -- --tier 1 --site https://shop.example [--agentic] [--premium] \
 *     [--competitor <url> ×N] [--request "…"] [--answers a.json] [--baseline b.json] \
 *     [--prelaunch --brief "…"] [--out results]
 */
import { readFile } from 'node:fs/promises';
import { runAudit } from './pipeline.js';
import type { Tier } from './tiers.js';

type Args = { tier: Tier; site: string; competitors: string[]; request: string; out: string; agentic: boolean; premium: boolean; answers: string; baseline: string; prelaunch: boolean; brief: string };

function parseArgs(argv: string[]): Args {
  const a: Args = { tier: 1, site: '', competitors: [], request: '', out: 'results', agentic: false, premium: false, answers: '', baseline: '', prelaunch: false, brief: '' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--tier') { a.tier = (Number(v) as Tier) || 1; i++; }
    else if (k === '--site') { a.site = v; i++; }
    else if (k === '--competitor') { if (v) a.competitors.push(v); i++; }
    else if (k === '--request') { a.request = v ?? ''; i++; }
    else if (k === '--out') { a.out = v ?? 'results'; i++; }
    else if (k === '--answers') { a.answers = v ?? ''; i++; }
    else if (k === '--baseline') { a.baseline = v ?? ''; i++; }
    else if (k === '--brief') { a.brief = v ?? ''; i++; }
    else if (k === '--prelaunch') { a.prelaunch = true; }
    else if (k === '--agentic') { a.agentic = true; }
    else if (k === '--premium') { a.premium = true; }
  }
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.site && !args.prelaunch) {
    console.error('Нужен --site https://… , либо --prelaunch (сайта ещё нет) с --brief "…" и конкурентами.');
    process.exit(1);
  }
  const answers = args.answers ? JSON.parse(await readFile(args.answers, 'utf8')) : null;
  const baseline = args.baseline ? JSON.parse(await readFile(args.baseline, 'utf8')) : null;

  const r = await runAudit({
    tier: args.tier, site: args.site, competitors: args.competitors, request: args.request,
    agentic: args.agentic, premium: args.premium, prelaunch: args.prelaunch, brief: args.brief,
    answers, baseline, out: args.out,
  });
  console.log(`✓ Готово: ${r.summary}`);
  console.log(`  папка результата: ${r.dir}`);
}

main().catch((e) => { console.error('Сбой аудита:', e); process.exit(1); });
