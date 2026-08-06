/**
 * Конвейер аудита как переиспользуемая функция — общий код для CLI (run.ts) и
 * HTTP-сервера (server.ts). Обход → движок → деньги → анализ → материалы.
 */
import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { launchBrowser, crawlSite, type SiteCrawl } from './crawl.js';
import { computeEngine, normalizeAnswers, engineFacts, type EngineResult } from './portalEngine.js';
import { computeMoney, moneyFacts, type Levers, type MoneyResult } from './money.js';
import { renderL0Report, type AuditDataset } from './report.js';
import { TIERS, type Tier } from './tiers.js';
import { analyze } from './analyze.js';
import { agentAnalyze } from './agent.js';
import { renderAD15, renderRoadmap, buildAD15Model, clientName } from './deliverables.js';
import { exportAD15Pptx } from './export/pptx.js';
import { exportReportDocx } from './export/docx.js';
import { exportUxUiDocx } from './export/uxuiDocx.js';
import { buildUxUiReport, narrateUxUi, renderUxUiMd } from './uxui.js';
import { exportPrototypeDocx } from './export/prototypeDocx.js';
import { buildPrototypeReport, narratePrototype, renderPrototypeMd } from './prototype.js';
import { exportCoverageDocx } from './export/coverageDocx.js';
import { buildCoverage, renderCoverageMd } from './coverage.js';
import { exportBenchmarkDocx } from './export/benchmarkDocx.js';
import { buildBenchmark, narrateBenchmark, renderBenchmarkMd } from './competitor.js';
import { exportHypothesesDocx } from './export/hypothesesDocx.js';
import { buildHypotheses, renderHypothesesMd } from './hypotheses.js';
import { knowledgeCount } from './knowledge.js';
import { hasKey } from './anthropic.js';

export type AuditOptions = {
  tier?: Tier;
  site?: string;
  competitors?: string[];
  request?: string;
  agentic?: boolean;
  prelaunch?: boolean;
  brief?: string;
  answers?: Record<string, unknown> | null;
  baseline?: { levers: Levers; extra?: { name: string; monthly: number }[] } | null;
  out?: string;
  log?: (m: string) => void;
};

export type AuditResult = { id: string; dir: string; summary: string; files: string[] };

function slug(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-'); }
  catch { return 'site'; }
}

export async function runAudit(opts: AuditOptions): Promise<AuditResult> {
  const log = opts.log ?? ((m: string) => console.log(m));
  const prelaunch = Boolean(opts.prelaunch);
  const tier: Tier = prelaunch ? 0 : ((opts.tier ?? 1) as Tier);
  const site = opts.site ?? '';
  const competitors = opts.competitors ?? [];
  if (!site && !prelaunch) throw new Error('Нужен site (или prelaunch для проекта без сайта)');

  const spec = TIERS[tier];
  log(`▶ ${prelaunch ? 'Предзапуск T0' : `Аудит T${tier}`} «${spec.title}» · ${site || '(сайт в разработке)'}`);
  const kpCount = await knowledgeCount();
  if (kpCount) log(`· пакетов знаний подключено: ${kpCount}`);

  const browser = await launchBrowser();
  try {
    let client: SiteCrawl;
    if (prelaunch) {
      client = { rootUrl: site || '(сайт в разработке)', finalUrl: site || 'Новый проект', kind: 'client', reachable: false, robotsTxt: false, sitemapXml: false, tech: { platform: null, analytics: [], signals: [] }, pages: [], discoveredLinks: 0 };
    } else {
      log('· обход клиента…');
      client = await crawlSite(browser, site, 'client');
    }

    const comps: SiteCrawl[] = [];
    if (prelaunch || tier >= 2) {
      for (const c of competitors) { log(`· обход конкурента ${c}…`); comps.push(await crawlSite(browser, c, 'competitor')); }
    }

    const ds: AuditDataset = {
      tier, request: opts.request ?? '', client, competitors: comps, takenAt: new Date().toISOString(),
      ...(prelaunch ? { mode: 'prelaunch' as const, brief: opts.brief || opts.request || '' } : {}),
    };
    const id = `${prelaunch ? 'prelaunch' : slug(site)}-t${tier}-${Date.now()}`;
    const dir = join(opts.out ?? 'results', id);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'dataset.json'), JSON.stringify(ds, null, 2), 'utf8');
    await writeFile(join(dir, 'L0-report.md'), renderL0Report(ds), 'utf8');

    // UX/UI-разбор дизайна против AQC-эталона — часть первого блока аудита (T1/L0,
    // работает и без доступов). Факт-слой детерминирован; нарратив — при наличии ключа.
    if (!prelaunch) {
      log('· UX/UI-разбор страниц против эталона (AQC)…');
      const uxui = buildUxUiReport(ds);
      if (hasKey()) {
        try { uxui.narrative = (await narrateUxUi(ds, uxui)) ?? undefined; }
        catch (e) { log(`⚠️ нарратив UX/UI не отработал (${String(e).slice(0, 100)}) — оставляю факт-слой`); }
      }
      await writeFile(join(dir, 'uxui.json'), JSON.stringify(uxui, null, 2), 'utf8');
      await writeFile(join(dir, 'UX-UI-разбор.md'), renderUxUiMd(ds, uxui), 'utf8');
      await exportUxUiDocx(ds, uxui, join(dir, 'UX-UI-разбор.docx'));
      log(`✓ UX/UI-разбор: провалов критериев ${uxui.counts.fail} (Critical ${uxui.bySeverity.Critical}, High ${uxui.bySeverity.High})`);

      // Эталонный прототип ↔ композиция клиента (block-by-block, путь клиента против эталона).
      log('· эталонный прототип ↔ композиция клиента…');
      const proto = buildPrototypeReport(ds);
      if (hasKey()) {
        try { proto.narrative = (await narratePrototype(ds, proto)) ?? undefined; }
        catch (e) { log(`⚠️ нарратив прототипа не отработал (${String(e).slice(0, 100)}) — оставляю сверку`); }
      }
      await writeFile(join(dir, 'prototype.json'), JSON.stringify(proto, null, 2), 'utf8');
      await writeFile(join(dir, 'Эталон-vs-композиция.md'), renderPrototypeMd(ds, proto), 'utf8');
      await exportPrototypeDocx(ds, proto, join(dir, 'Эталон-vs-композиция.docx'));
      log(`✓ прототип-сверка: разобрано типов страниц ${proto.pages.length}`);

      // Конкурентный бенчмарк (AD-11) — когда есть обойдённые конкуренты.
      const bench = buildBenchmark(ds);
      if (bench) {
        log('· конкурентный бенчмарк (AD-11)…');
        if (hasKey()) {
          try { bench.narrative = (await narrateBenchmark(ds, bench)) ?? undefined; }
          catch (e) { log(`⚠️ нарратив бенчмарка не отработал (${String(e).slice(0, 100)})`); }
        }
        await writeFile(join(dir, 'benchmark.json'), JSON.stringify(bench, null, 2), 'utf8');
        await writeFile(join(dir, 'Конкурентный-бенчмарк.md'), renderBenchmarkMd(ds, bench), 'utf8');
        await exportBenchmarkDocx(ds, bench, join(dir, 'Конкурентный-бенчмарк.docx'));
        log(`✓ бенчмарк: индекс клиента ${bench.clientIndex}/100, место ${bench.clientRank}/${bench.totalSites}`);
      }
    }

    let engine: EngineResult | null = null;
    if (opts.answers) {
      engine = computeEngine(normalizeAnswers(opts.answers));
      await writeFile(join(dir, 'engine.json'), JSON.stringify(engine, null, 2), 'utf8');
      log(`· движок: Health Score ${engine.score ?? '—'}/100, разрывов ${engine.gaps.length}, решений ${engine.decisions.length}`);
    }

    let money: MoneyResult | null = null;
    if (opts.baseline?.levers) {
      money = computeMoney(opts.baseline.levers, opts.baseline.extra ?? []);
      await writeFile(join(dir, 'money.json'), JSON.stringify(money, null, 2), 'utf8');
      log(`· деньги: недополучено ≈ ${Math.round(money.potentialYear).toLocaleString('ru-RU')} ₴/год`);
    }

    const grounding = [engine ? engineFacts(engine) : '', money ? moneyFacts(money) : ''].filter(Boolean).join('\n\n') || undefined;

    if (hasKey()) {
      log(`· анализ по методологии (Claude${opts.agentic ? ', агентный обход' : ''})…`);
      try {
        let analysis;
        if (opts.agentic) {
          try { analysis = await agentAnalyze(browser, ds, { engineFactsStr: grounding }); }
          catch (e) { log(`⚠️ агентный режим сорвался (${String(e).slice(0, 120)}), откат на одношаговый`); analysis = await analyze(ds, grounding); }
        } else {
          analysis = await analyze(ds, grounding);
        }
        await writeFile(join(dir, 'analysis.json'), JSON.stringify(analysis, null, 2), 'utf8');
        await writeFile(join(dir, 'AD-15.md'), renderAD15(ds, analysis, engine, money), 'utf8');
        await writeFile(join(dir, 'roadmap.md'), renderRoadmap(ds, analysis), 'utf8');
        const date = new Date(ds.takenAt).toLocaleDateString('ru-RU');
        await exportAD15Pptx(buildAD15Model(ds, analysis, engine, money), { name: clientName(ds), tier: ds.tier, date }, join(dir, 'AD-15.pptx'));
        await exportReportDocx(ds, analysis, engine, money, join(dir, 'audit-report.docx'));
        // Реестр гипотез (AD-19) — недоказанное со способом проверки/опровержения.
        const hyp = buildHypotheses(analysis);
        await writeFile(join(dir, 'hypotheses.json'), JSON.stringify(hyp, null, 2), 'utf8');
        await writeFile(join(dir, 'Реестр-гипотез.md'), renderHypothesesMd(ds, hyp), 'utf8');
        await exportHypothesesDocx(ds, hyp, join(dir, 'Реестр-гипотез.docx'));
        log(`✓ материалы собраны: AD-15.pptx, audit-report.docx, roadmap.md, реестр гипотез (${hyp.items.length})`);
      } catch (e) {
        log(`⚠️ аналитический слой не отработал: ${String(e).slice(0, 160)}`);
      }
    } else {
      log('· ANTHROPIC_API_KEY не задан — только обход и L0-отчёт (для AD-15/деньги нужен ключ)');
    }

    if (!prelaunch) {
      const cov = buildCoverage(ds, { hasEngine: Boolean(engine), hasMoney: Boolean(money) });
      await writeFile(join(dir, 'coverage.json'), JSON.stringify(cov, null, 2), 'utf8');
      await writeFile(join(dir, 'Охват-и-уверенность.md'), renderCoverageMd(ds, cov), 'utf8');
      await exportCoverageDocx(ds, cov, join(dir, 'Охват-и-уверенность.docx'));
      log(`✓ охват аудита + Confidence Score ${cov.confidence.score}/${cov.confidence.base} (${cov.confidence.band})`);
    }

    const files = (await readdir(dir)).sort();
    const cs = client.pages.filter((p) => p.score !== null);
    const parts = [`${files.length} файлов`];
    if (cs.length) parts.push(`соответствие ${Math.round(cs.reduce((s, p) => s + (p.score ?? 0), 0) / cs.length)}%`);
    if (engine?.score != null) parts.push(`Health Score ${engine.score}/100`);
    if (money) parts.push(`недополучено ≈ ${Math.round(money.potentialYear).toLocaleString('ru-RU')} ₴/год`);
    return { id, dir, summary: parts.join(' · '), files };
  } finally {
    await browser.close().catch(() => {});
  }
}
