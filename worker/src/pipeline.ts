/**
 * Конвейер аудита как переиспользуемая функция — общий код для CLI (run.ts) и
 * HTTP-сервера (server.ts). Обход → движок → деньги → анализ → материалы.
 */
import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { launchBrowser, crawlSite, reachabilityDiagnosis, type SiteCrawl } from './crawl.js';
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
import { buildSiteAudit, type SiteAuditReport } from './pagereport.js';
import { renderAuditHtml } from './export/htmlReport.js';
import { renderExecDiagnostic } from './export/execDiagHtml.js';
import { buildSeoArch } from './seoarch.js';
import { renderSeoArchHtml } from './export/seoArchHtml.js';
import { buildTechAudit } from './techaudit.js';
import { renderTechAuditHtml } from './export/techAuditHtml.js';
import { buildContentAudit } from './contentaudit.js';
import { renderContentAuditHtml } from './export/contentAuditHtml.js';
import { renderCompetitorHtml } from './export/competitorHtml.js';
import { renderPdf } from './pdf.js';
import { exportCoverageDocx } from './export/coverageDocx.js';
import { buildCoverage, renderCoverageMd } from './coverage.js';
import { exportBenchmarkDocx } from './export/benchmarkDocx.js';
import { buildBenchmark, narrateBenchmark, renderBenchmarkMd } from './competitor.js';
import { exportHypothesesDocx } from './export/hypothesesDocx.js';
import { buildHypotheses, renderHypothesesMd } from './hypotheses.js';
import { buildMaturity, renderMaturityMd } from './maturity.js';
import { buildScope, renderScopeMd } from './routing.js';
import { buildCausal, renderCausalMd } from './causal.js';
import { buildPriceChannel, renderPriceChannelMd } from './pricechannel.js';
import { exportMaturityDocx, exportScopeDocx, exportCausalDocx, exportPriceChannelDocx, exportSynthesisDocx } from './export/methodDocs.js';
import { buildWorkbook } from './workbook.js';
import { makeXlsx } from './xlsx.js';
import { narrateSynthesis, renderSynthesisMd } from './synthesis.js';
import { buildKp, renderKpMd } from './kp.js';
import { exportKpDocx } from './export/methodDocs.js';
import { knowledgeCount } from './knowledge.js';
import { hasKey } from './anthropic.js';
import type { Analysis } from './analyze.js';
import type { UxUiReport } from './uxui.js';
import type { PrototypeReport } from './prototype.js';
import type { BenchmarkReport } from './competitor.js';

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

export type AuditMetrics = {
  compliance: number | null;
  confidence: { score: number; base: number } | null;
  health: number | null;
  benchmarkIndex: number | null;
  aqcFails: number | null;
  potentialYear: number | null;
};
export type AuditResult = { id: string; dir: string; summary: string; files: string[]; metrics: AuditMetrics };

function slug(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-'); }
  catch { return 'site'; }
}

/** Достроить схему к «голому» домену (lanavitta.com → https://lanavitta.com/),
 *  иначе page.goto падает с «Cannot navigate to invalid URL». */
function normalizeUrl(raw: string): string {
  const s = (raw || '').trim().replace(/\s+/g, '');
  if (!s) return '';
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try { return new URL(withScheme).toString(); } catch { return withScheme; }
}

export async function runAudit(opts: AuditOptions): Promise<AuditResult> {
  const log = opts.log ?? ((m: string) => console.log(m));
  const metrics: AuditMetrics = { compliance: null, confidence: null, health: null, benchmarkIndex: null, aqcFails: null, potentialYear: null };
  const prelaunch = Boolean(opts.prelaunch);
  const tier: Tier = prelaunch ? 0 : ((opts.tier ?? 1) as Tier);
  const site = normalizeUrl(opts.site ?? '');
  const competitors = (opts.competitors ?? []).map(normalizeUrl).filter(Boolean);
  if (!site && !prelaunch) throw new Error('Нужен site (или prelaunch для проекта без сайта)');

  const spec = TIERS[tier];
  log(`▶ ${prelaunch ? 'Предзапуск T0' : `Аудит T${tier}`} «${spec.title}» · ${site || '(сайт в разработке)'}`);
  const kpCount = await knowledgeCount();
  if (kpCount) log(`· пакетов знаний подключено: ${kpCount}`);

  const browser = await launchBrowser();
  try {
    let client: SiteCrawl;
    if (prelaunch) {
      client = { rootUrl: site || '(сайт в разработке)', finalUrl: site || 'Новый проект', kind: 'client', reachable: false, robotsTxt: false, sitemapXml: false, tech: { platform: null, analytics: [], signals: [] }, pages: [], discoveredLinks: 0, links: [] };
    } else {
      log('· обход клиента…');
      client = await crawlSite(browser, site, 'client');
      // Гейт достижимости: без реального доступа к сайту аудит не проводим и не
      // выдаём фиктивных выводов. Останавливаемся честно, с конкретной причиной,
      // ДО обращения к Claude — иначе модель «аудирует» пустоту и выдаёт отписку.
      const audited = client.pages.some((p) => p.score !== null);
      if (!client.reachable || !audited) {
        const reason = client.error || client.pages[0]?.error || 'сайт не отдал контент (пустой ответ)';
        log(`✖ доступ к сайту не получен — аудит остановлен: ${reason}`);
        throw new Error(
          `Не удалось получить доступ к сайту ${site}: ${reason}. ` +
          `${reachabilityDiagnosis(client)} ` +
          `Аудит НЕ проводился — данные не собраны, фиктивные выводы не выпускаются.`,
        );
      }
    }

    const comps: SiteCrawl[] = [];
    if (prelaunch || tier >= 2) {
      for (const c of competitors) {
        log(`· обход конкурента ${c}…`);
        const cc = await crawlSite(browser, c, 'competitor');
        if (!cc.reachable) log(`⚠️ конкурент ${c} недоступен (${cc.error || 'нет ответа'}) — исключён из бенчмарка`);
        comps.push(cc);
      }
    }

    const ds: AuditDataset = {
      tier, request: opts.request ?? '', client, competitors: comps, takenAt: new Date().toISOString(),
      ...(prelaunch ? { mode: 'prelaunch' as const, brief: opts.brief || opts.request || '' } : {}),
    };
    const id = `${prelaunch ? 'prelaunch' : slug(site)}-t${tier}-${Date.now()}`;
    const dir = join(opts.out ?? 'results', id);
    await mkdir(dir, { recursive: true });
    // dataset.json без тяжёлых скриншотов (они живут в памяти для документов).
    const stripShots = (site: SiteCrawl): SiteCrawl => ({ ...site, pages: site.pages.map(({ screenshot, ...p }) => p) });
    const dsForJson = { ...ds, client: stripShots(ds.client), competitors: ds.competitors.map(stripShots) };
    await writeFile(join(dir, 'dataset.json'), JSON.stringify(dsForJson, null, 2), 'utf8');
    await writeFile(join(dir, 'L0-report.md'), renderL0Report(ds), 'utf8');

    // UX/UI-разбор дизайна против AQC-эталона — часть первого блока аудита (T1/L0,
    // работает и без доступов). Факт-слой детерминирован; нарратив — при наличии ключа.
    let uxui: UxUiReport | null = null;
    let proto: PrototypeReport | null = null;
    let bench: BenchmarkReport | null = null;
    let siteAudit: SiteAuditReport | null = null;
    if (!prelaunch) {
      log('· UX/UI-разбор страниц против эталона (AQC)…');
      uxui = buildUxUiReport(ds);
      metrics.aqcFails = uxui.counts.fail;
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
      proto = buildPrototypeReport(ds);
      if (hasKey()) {
        try { proto.narrative = (await narratePrototype(ds, proto)) ?? undefined; }
        catch (e) { log(`⚠️ нарратив прототипа не отработал (${String(e).slice(0, 100)}) — оставляю сверку`); }
      }
      await writeFile(join(dir, 'prototype.json'), JSON.stringify(proto, null, 2), 'utf8');
      await writeFile(join(dir, 'Эталон-vs-композиция.md'), renderPrototypeMd(ds, proto), 'utf8');
      await exportPrototypeDocx(ds, proto, join(dir, 'Эталон-vs-композиция.docx'));
      log(`✓ прототип-сверка: разобрано типов страниц ${proto.pages.length}`);

      // UX/UI Audit A0 — клиентский PDF по визуальному стандарту A0 (эталон↔текущая
      // постранично, дерево сайта, системные дефекты, приоритет, вывод). Рендер тем
      // же Chromium. Главный визуальный результат UX/UI-блока.
      try {
        siteAudit = buildSiteAudit(ds);
        await writeFile(join(dir, 'pagereport.json'), JSON.stringify(siteAudit, null, 2), 'utf8');
        await renderPdf(renderAuditHtml(siteAudit), join(dir, 'UX-UI-аудит-A0.pdf'), browser);
        log(`✓ UX/UI Audit A0 (PDF): соответствие эталону ${siteAudit.totalPct}%, системных дефектов ${siteAudit.systemic.length}`);
      } catch (e) { log(`⚠️ PDF UX/UI Audit A0 не собрался (${String(e).slice(0, 120)}) — остальные материалы не затронуты`); }

      // SEO Architecture A0 — видимое дерево → проблемные узлы → рекомендуемое (A0 §10).
      try {
        const seo = buildSeoArch(ds);
        await writeFile(join(dir, 'seoarch.json'), JSON.stringify(seo, null, 2), 'utf8');
        await renderPdf(renderSeoArchHtml(seo), join(dir, 'SEO-Architecture-A0.pdf'), browser);
        log(`✓ SEO Architecture A0 (PDF): ссылок ${seo.totals.links}, проблемных узлов ${seo.issues.length}`);
      } catch (e) { log(`⚠️ PDF SEO Architecture A0 не собрался (${String(e).slice(0, 120)})`); }

      // Технический внешний аудит A0 — категории проверок из обхода (A0).
      try {
        const tech = buildTechAudit(ds);
        await writeFile(join(dir, 'techaudit.json'), JSON.stringify(tech, null, 2), 'utf8');
        await renderPdf(renderTechAuditHtml(tech), join(dir, 'Технический-аудит-A0.pdf'), browser);
        log(`✓ Технический аудит A0 (PDF): пройдено ${tech.score.pct}%, blocked ${tech.blocked.length}`);
      } catch (e) { log(`⚠️ PDF Технический аудит A0 не собрался (${String(e).slice(0, 120)})`); }

      // Content Audit A0 — контент по способности вести к решению (A0 §11).
      try {
        const content = buildContentAudit(ds);
        await writeFile(join(dir, 'contentaudit.json'), JSON.stringify(content, null, 2), 'utf8');
        await renderPdf(renderContentAuditHtml(content), join(dir, 'Content-Audit-A0.pdf'), browser);
        log(`✓ Content Audit A0 (PDF): типов страниц ${content.rows.length}`);
      } catch (e) { log(`⚠️ PDF Content Audit A0 не собрался (${String(e).slice(0, 120)})`); }

      // Конкурентный бенчмарк (AD-11) — когда есть обойдённые конкуренты.
      bench = buildBenchmark(ds);
      if (bench) {
        metrics.benchmarkIndex = bench.clientIndex;
        log('· конкурентный бенчмарк (AD-11)…');
        if (hasKey()) {
          try { bench.narrative = (await narrateBenchmark(ds, bench)) ?? undefined; }
          catch (e) { log(`⚠️ нарратив бенчмарка не отработал (${String(e).slice(0, 100)})`); }
        }
        await writeFile(join(dir, 'benchmark.json'), JSON.stringify(bench, null, 2), 'utf8');
        await writeFile(join(dir, 'Конкурентный-бенчмарк.md'), renderBenchmarkMd(ds, bench), 'utf8');
        await exportBenchmarkDocx(ds, bench, join(dir, 'Конкурентный-бенчмарк.docx'));
        try { await renderPdf(renderCompetitorHtml(bench, clientName(ds), ds.takenAt), join(dir, 'Конкурентный-анализ-A0.pdf'), browser); }
        catch (e) { log(`⚠️ PDF Конкурентный анализ A0 не собрался (${String(e).slice(0, 120)})`); }
        log(`✓ бенчмарк: индекс клиента ${bench.clientIndex}/100, место ${bench.clientRank}/${bench.totalSites}`);
      }
    }

    let engine: EngineResult | null = null;
    if (opts.answers) {
      engine = computeEngine(normalizeAnswers(opts.answers));
      metrics.health = engine.score;
      await writeFile(join(dir, 'engine.json'), JSON.stringify(engine, null, 2), 'utf8');
      log(`· движок: Health Score ${engine.score ?? '—'}/100, разрывов ${engine.gaps.length}, решений ${engine.decisions.length}`);
    }

    let money: MoneyResult | null = null;
    if (opts.baseline?.levers) {
      money = computeMoney(opts.baseline.levers, opts.baseline.extra ?? []);
      metrics.potentialYear = money.potentialYear;
      await writeFile(join(dir, 'money.json'), JSON.stringify(money, null, 2), 'utf8');
      log(`· деньги: недополучено ≈ ${Math.round(money.potentialYear).toLocaleString('ru-RU')} ₴/год`);
    }

    const grounding = [engine ? engineFacts(engine) : '', money ? moneyFacts(money) : ''].filter(Boolean).join('\n\n') || undefined;

    let analysisResult: Analysis | null = null;
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
        analysisResult = analysis;
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
      // Матрица зрелости (AD-16).
      const mat = buildMaturity(ds);
      await writeFile(join(dir, 'maturity.json'), JSON.stringify(mat, null, 2), 'utf8');
      await writeFile(join(dir, 'Матрица-зрелости.md'), renderMaturityMd(ds, mat), 'utf8');
      await exportMaturityDocx(ds, mat, join(dir, 'Матрица-зрелости.docx'));

      // Scope программы по волнам (роутинг разрывов в плейбуки).
      const scope = buildScope(ds, { engine, analysis: analysisResult, hasMoney: Boolean(money) });
      await writeFile(join(dir, 'scope.json'), JSON.stringify(scope, null, 2), 'utf8');
      await writeFile(join(dir, 'Scope-по-волнам.md'), renderScopeMd(ds, scope), 'utf8');
      await exportScopeDocx(ds, scope, join(dir, 'Scope-по-волнам.docx'));

      // Цена в канале и роль в цепочке.
      const pc = buildPriceChannel(ds);
      await writeFile(join(dir, 'Цена-в-канале.md'), renderPriceChannelMd(ds, pc), 'utf8');
      await exportPriceChannelDocx(ds, pc, join(dir, 'Цена-в-канале.docx'));

      // Причинно-следственная карта (нужен анализ).
      let causal = null as ReturnType<typeof buildCausal> | null;
      if (analysisResult) {
        causal = buildCausal(analysisResult, money);
        await writeFile(join(dir, 'Причинно-следственная-карта.md'), renderCausalMd(ds, causal), 'utf8');
        await exportCausalDocx(ds, causal, join(dir, 'Причинно-следственная-карта.docx'));
      }
      log(`✓ метод-документы: зрелость (набл. ${mat.observedAvg ?? '—'}/5), scope (${scope.waves.reduce((n, w) => n + w.items.length, 0)} активаций), цена в канале, причинно-следственная карта`);

      const cov = buildCoverage(ds, { hasEngine: Boolean(engine), hasMoney: Boolean(money) });
      metrics.confidence = { score: cov.confidence.score, base: cov.confidence.base };
      await writeFile(join(dir, 'coverage.json'), JSON.stringify(cov, null, 2), 'utf8');
      await writeFile(join(dir, 'Охват-и-уверенность.md'), renderCoverageMd(ds, cov), 'utf8');
      await exportCoverageDocx(ds, cov, join(dir, 'Охват-и-уверенность.docx'));
      log(`✓ охват аудита + Confidence Score ${cov.confidence.score}/${cov.confidence.base} (${cov.confidence.band})`);

      // Executive Diagnostic A0 — зонтичный клиентский PDF, сводит все аудиты (A0 §13).
      try {
        const execHtml = renderExecDiagnostic(ds, { siteAudit, analysis: analysisResult, engine, money, bench, coverage: cov });
        await renderPdf(execHtml, join(dir, 'Executive-Diagnostic-A0.pdf'), browser);
        log('✓ Executive Diagnostic A0 (PDF): зонтичный отчёт собран');
      } catch (e) { log(`⚠️ Executive Diagnostic не собрался (${String(e).slice(0, 120)}) — остальные материалы не затронуты`); }

      // Единая книга аудита (ЕКП) в XLSX — табличные документы одним файлом.
      const compliance0 = client.pages.filter((pp) => pp.score !== null);
      const complianceVal = compliance0.length ? Math.round(compliance0.reduce((s, pp) => s + (pp.score ?? 0), 0) / compliance0.length) : null;
      const hyp2 = analysisResult ? buildHypotheses(analysisResult) : null;
      const sheets = buildWorkbook(ds, { engine, money, maturity: mat, scope, coverage: cov, hypotheses: hyp2, metrics: { compliance: complianceVal } });
      await writeFile(join(dir, 'ЕКП-аудит.xlsx'), makeXlsx(sheets));
      log(`✓ ЕКП-книга (XLSX): листов ${sheets.length}`);

      // Слой синтеза — взаимосвязи всех линз в один вывод (нужен ключ).
      if (hasKey()) {
        log('· синтез всех линз…');
        const synth = await narrateSynthesis(ds, { uxui, proto, bench, maturity: mat, scope, causal, money, engine, coverage: cov });
        if (synth) {
          await writeFile(join(dir, 'synthesis.json'), JSON.stringify(synth, null, 2), 'utf8');
          await writeFile(join(dir, 'Синтез-аудита.md'), renderSynthesisMd(ds, synth), 'utf8');
          await exportSynthesisDocx(ds, synth, join(dir, 'Синтез-аудита.docx'));
          log('✓ синтез собран');
        } else { log('· синтез не собран (нет ключа/данных)'); }

        // Коммерческое предложение (КП) — переход аудит → продажа программы.
        if (analysisResult) {
          log('· коммерческое предложение…');
          const kp = await buildKp(ds, { analysis: analysisResult, money, engine, scope });
          if (kp) {
            await writeFile(join(dir, 'Коммерческое-предложение.md'), renderKpMd(ds, kp, money, scope), 'utf8');
            await exportKpDocx(ds, kp, money, scope, join(dir, 'Коммерческое-предложение.docx'));
            log('✓ КП собрано');
          }
        }
      }
    }

    const files = (await readdir(dir)).sort();
    const cs = client.pages.filter((p) => p.score !== null);
    metrics.compliance = cs.length ? Math.round(cs.reduce((s, p) => s + (p.score ?? 0), 0) / cs.length) : null;
    const parts = [`${files.length} файлов`];
    if (metrics.compliance != null) parts.push(`соответствие ${metrics.compliance}%`);
    if (engine?.score != null) parts.push(`Health Score ${engine.score}/100`);
    if (money) parts.push(`недополучено ≈ ${Math.round(money.potentialYear).toLocaleString('ru-RU')} ₴/год`);
    return { id, dir, summary: parts.join(' · '), files, metrics };
  } finally {
    await browser.close().catch(() => {});
  }
}
