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
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { launchBrowser, crawlSite } from './crawl.js';
import { computeEngine, normalizeAnswers, engineFacts, type EngineResult } from './portalEngine.js';
import { computeMoney, moneyFacts, type Levers, type MoneyResult } from './money.js';
import { renderL0Report, type AuditDataset } from './report.js';
import { TIERS, type Tier } from './tiers.js';
import { analyze } from './analyze.js';
import { agentAnalyze } from './agent.js';
import { renderAD15, renderRoadmap, buildAD15Model, clientName } from './deliverables.js';
import { exportAD15Pptx } from './export/pptx.js';
import { exportReportDocx } from './export/docx.js';
import { hasKey } from './anthropic.js';

type Args = { tier: Tier; site: string; competitors: string[]; request: string; out: string; agentic: boolean; answers: string; baseline: string };

function parseArgs(argv: string[]): Args {
  const a: Args = { tier: 1, site: '', competitors: [], request: '', out: 'results', agentic: false, answers: '', baseline: '' };
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
    else if (k === '--agentic') { a.agentic = true; }
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
    console.log(`✓ Обход готов. Страниц: ${client.pages.length}${cs.length ? `, ср. соответствие ${Math.round(cs.reduce((s, p) => s + (p.score ?? 0), 0) / cs.length)}%` : ''}`);

    // Движок портала (та же математика): Health Score, разрывы, решения, scope.
    let engine: EngineResult | null = null;
    if (args.answers) {
      try {
        const raw = JSON.parse(await readFile(args.answers, 'utf8'));
        engine = computeEngine(normalizeAnswers(raw));
        await writeFile(join(dir, 'engine.json'), JSON.stringify(engine, null, 2), 'utf8');
        console.log(`  · движок: Health Score ${engine.score ?? '—'}/100, разрывов ${engine.gaps.length}, решений ${engine.decisions.length} (ответов ${engine.coverage.answered}/${engine.coverage.total})`);
      } catch (e) {
        console.log(`  ⚠️ ответы опросника не прочитаны (${String(e).slice(0, 120)}) — движок пропущен`);
      }
    }
    // Деньги (цепная атрибуция) — при baseline (T3+).
    let money: MoneyResult | null = null;
    if (args.baseline) {
      try {
        const raw = JSON.parse(await readFile(args.baseline, 'utf8')) as { levers: Levers; extra?: { name: string; monthly: number }[] };
        money = computeMoney(raw.levers, raw.extra ?? []);
        await writeFile(join(dir, 'money.json'), JSON.stringify(money, null, 2), 'utf8');
        console.log(`  · деньги: недополучено ≈ ${Math.round(money.potentialYear).toLocaleString('ru-RU')} ₴/год (прогноз +${money.forecast.upliftPct}%)${money.invariantOk ? '' : ' ⚠️ инвариант нарушен'}`);
      } catch (e) {
        console.log(`  ⚠️ baseline не прочитан (${String(e).slice(0, 120)}) — деньги пропущены`);
      }
    }
    const grounding = [engine ? engineFacts(engine) : '', money ? moneyFacts(money) : ''].filter(Boolean).join('\n\n') || undefined;

    // Аналитический слой + материалы (нужен ANTHROPIC_API_KEY)
    if (hasKey()) {
      console.log(`  · анализ по методологии (Claude${args.agentic ? ', агентный обход' : ''})…`);
      try {
        let analysis;
        if (args.agentic) {
          try { analysis = await agentAnalyze(browser, ds, { engineFactsStr: grounding }); }
          catch (e) { console.log(`  ⚠️ агентный режим сорвался (${String(e).slice(0, 120)}), откат на одношаговый анализ`); analysis = await analyze(ds, grounding); }
        } else {
          analysis = await analyze(ds, grounding);
        }
        await writeFile(join(dir, 'analysis.json'), JSON.stringify(analysis, null, 2), 'utf8');
        await writeFile(join(dir, 'AD-15.md'), renderAD15(ds, analysis, engine, money), 'utf8');
        await writeFile(join(dir, 'roadmap.md'), renderRoadmap(ds, analysis), 'utf8');
        // Экспорт в файлы для клиента
        const date = new Date(ds.takenAt).toLocaleDateString('ru-RU');
        await exportAD15Pptx(buildAD15Model(ds, analysis, engine, money), { name: clientName(ds), tier: ds.tier, date }, join(dir, 'AD-15.pptx'));
        await exportReportDocx(ds, analysis, engine, money, join(dir, 'audit-report.docx'));
        console.log(`  ✓ материалы собраны: analysis.json, AD-15.md/.pptx, roadmap.md, audit-report.docx`);
      } catch (e) {
        console.log(`  ⚠️ аналитический слой не отработал: ${String(e).slice(0, 160)}`);
      }
    } else {
      console.log('  · ANTHROPIC_API_KEY не задан — только L0-обход и детерминированный отчёт (материалы AD-15/roadmap собираются с ключом).');
    }
    console.log(`  папка результата: ${dir}`);
  } finally {
    await browser.close().catch(() => {});
  }
}

main().catch((e) => { console.error('Сбой аудита:', e); process.exit(1); });
