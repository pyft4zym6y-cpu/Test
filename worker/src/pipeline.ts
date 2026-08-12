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
import { buildChannels } from './channels.js';
import { renderChannelsHtml } from './export/channelsHtml.js';
import { renderMaturityPdf, renderCoveragePdf, renderHypothesesPdf, renderScopePdf, renderPriceChannelPdf, renderSynthesisPdf, renderCausalPdf } from './export/methodPdf.js';
import { buildIntelligence, narrateIntelligence } from './intelligence.js';
import { renderIntelligenceHtml } from './export/intelligenceHtml.js';
import { buildActivation } from './activation.js';
import { buildMechanics } from './mechanics.js';
import { renderMechanicsHtml } from './export/mechanicsHtml.js';
import { runJourney, buildJourneyReport } from './journey.js';
import { renderJourneyHtml } from './export/journeyHtml.js';
import { buildBacklog, buildBacklogFromRegistry, renderBacklogHtml, type RawRec } from './backlog.js';
import { buildSocialAudit, buildMentionsAudit, buildReviewsAudit } from './externalAudits.js';
import { renderSocialHtml, renderMentionsHtml, renderReviewsHtml } from './export/externalHtml.js';
import { buildQa, renderQaHtml } from './qa.js';
import { renderPdf, closePdfBrowser } from './pdf.js';
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
import { buildKp, renderKpMd, renderKpPdf } from './kp.js';
import { exportKpDocx } from './export/methodDocs.js';
import { knowledgeCount } from './knowledge.js';
import { hasKey, apiErrorHint } from './anthropic.js';
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
  premium?: boolean;            // премиум-экспертиза: подключить внешних профильных агентов
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
  const baseLog = opts.log ?? ((m: string) => console.log(m));
  // Дебаг-журнал: каждая нестыковка/предупреждение прогона фиксируется и попадает
  // в Протокол синергии/QA — находка не теряется в логе, а становится задачей.
  const debugLog: string[] = [];
  const log = (m: string) => { if (/⚠️|✖/.test(m)) debugLog.push(m.replace(/^[⚠️✖]+\s*/, '')); baseLog(m); };
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
        const cc = await crawlSite(browser, c, 'competitor', { maxPages: 6 });
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

    // UX/UI-разбор дизайна против AQC-эталона — часть первого блока аудита (T1/L0,
    // работает и без доступов). Факт-слой детерминирован; нарратив — при наличии ключа.
    let uxui: UxUiReport | null = null;
    let proto: PrototypeReport | null = null;
    let bench: BenchmarkReport | null = null;
    let siteAudit: SiteAuditReport | null = null;
    let ciReport: ReturnType<typeof buildIntelligence> | null = null;
    let contentReport: ReturnType<typeof buildContentAudit> | null = null;
    let mechReport: ReturnType<typeof buildMechanics> | null = null;
    let journeyReport: ReturnType<typeof buildJourneyReport> | null = null;
    let techReport: ReturnType<typeof buildTechAudit> | null = null;
    let seoReport: ReturnType<typeof buildSeoArch> | null = null;
    let maturityReport: ReturnType<typeof buildMaturity> | null = null;
    // Единый реестр находок (строится до причинной карты/охвата/exec — единая точка правды).
    let registry: import('./registry.js').Finding[] | null = null;
    let registryRaw: RawRec[] = [];
    if (!prelaunch) {
      log('· UX/UI-разбор страниц против эталона (AQC)…');
      uxui = buildUxUiReport(ds);
      metrics.aqcFails = uxui.counts.fail;
      if (hasKey()) {
        try { uxui.narrative = (await narrateUxUi(ds, uxui)) ?? undefined; }
        catch (e) { log(`⚠️ нарратив UX/UI не отработал (${String(e).slice(0, 100)}) — оставляю факт-слой`); }
      }
      await writeFile(join(dir, 'uxui.json'), JSON.stringify(uxui, null, 2), 'utf8');
      log(`✓ UX/UI-разбор: провалов критериев ${uxui.counts.fail} (Critical ${uxui.bySeverity.Critical}, High ${uxui.bySeverity.High})`);

      // Эталонный прототип ↔ композиция клиента (block-by-block, путь клиента против эталона).
      log('· эталонный прототип ↔ композиция клиента…');
      proto = buildPrototypeReport(ds);
      if (hasKey()) {
        try { proto.narrative = (await narratePrototype(ds, proto)) ?? undefined; }
        catch (e) { log(`⚠️ нарратив прототипа не отработал (${String(e).slice(0, 100)}) — оставляю сверку`); }
      }
      await writeFile(join(dir, 'prototype.json'), JSON.stringify(proto, null, 2), 'utf8');
      log(`✓ прототип-сверка: разобрано типов страниц ${proto.pages.length}`);

      // UX/UI Audit A0 — клиентский PDF по визуальному стандарту A0 (эталон↔текущая
      // постранично, дерево сайта, системные дефекты, приоритет, вывод). Рендер тем
      // же Chromium. Главный визуальный результат UX/UI-блока.
      // Journey ДО постраничного разбора: интерактивные дефекты walk-through
      // понижают оценки блоков (статический балл не противоречит прохождению).
      let journeySteps: ReturnType<typeof buildJourneyReport>['steps'] = [];
      try {
        log('· journey: прохожу путь клиента (поиск → корзина → чекаут + мобильный)…');
        journeySteps = await runJourney(browser, site, log);
        journeyReport = buildJourneyReport(journeySteps, ds.client.finalUrl, ds.takenAt);
        await writeFile(join(dir, 'journey.json'), JSON.stringify(journeyReport, null, 2), 'utf8');
        await renderPdf(renderJourneyHtml(journeyReport), join(dir, 'Карта-пути-клиента-A0.pdf'), browser);
        log(`✓ Карта пути клиента A0 (PDF): пройдено ${journeyReport.passed}/${journeyReport.steps.length}, тупиков ${journeyReport.deadends}`);
      } catch (e) { log(`⚠️ Карта пути клиента не собралась (${String(e).slice(0, 120)})`); }

      try {
        siteAudit = buildSiteAudit(ds, { journey: journeySteps });
        await writeFile(join(dir, 'pagereport.json'), JSON.stringify(siteAudit, null, 2), 'utf8');
        await renderPdf(renderAuditHtml(siteAudit), join(dir, 'UX-UI-аудит-A0.pdf'), browser);
        log(`✓ UX/UI Audit A0 (PDF): соответствие эталону ${siteAudit.totalPct}%, системных дефектов ${siteAudit.systemic.length}`);
      } catch (e) { log(`⚠️ PDF UX/UI Audit A0 не собрался (${String(e).slice(0, 120)}) — остальные материалы не затронуты`); }

      // SEO Architecture A0 — видимое дерево → проблемные узлы → рекомендуемое (A0 §10).
      try {
        const seo = buildSeoArch(ds); seoReport = seo;
        await writeFile(join(dir, 'seoarch.json'), JSON.stringify(seo, null, 2), 'utf8');
        await renderPdf(renderSeoArchHtml(seo), join(dir, 'SEO-Architecture-A0.pdf'), browser);
        log(`✓ SEO Architecture A0 (PDF): ссылок ${seo.totals.links}, проблемных узлов ${seo.issues.length}`);
      } catch (e) { log(`⚠️ PDF SEO Architecture A0 не собрался (${String(e).slice(0, 120)})`); }

      // Технический внешний аудит A0 — категории проверок из обхода (A0).
      try {
        const tech = buildTechAudit(ds); techReport = tech;
        await writeFile(join(dir, 'techaudit.json'), JSON.stringify(tech, null, 2), 'utf8');
        await renderPdf(renderTechAuditHtml(tech), join(dir, 'Технический-аудит-A0.pdf'), browser);
        log(`✓ Технический аудит A0 (PDF): пройдено ${tech.score.pct}%, blocked ${tech.blocked.length}`);
      } catch (e) { log(`⚠️ PDF Технический аудит A0 не собрался (${String(e).slice(0, 120)})`); }

      // Content Audit A0 — контент по способности вести к решению (A0 §11).
      try {
        const content = buildContentAudit(ds); contentReport = content;
        await writeFile(join(dir, 'contentaudit.json'), JSON.stringify(content, null, 2), 'utf8');
        await renderPdf(renderContentAuditHtml(content), join(dir, 'Content-Audit-A0.pdf'), browser);
        log(`✓ Content Audit A0 (PDF): типов страниц ${content.rows.length}`);
      } catch (e) { log(`⚠️ PDF Content Audit A0 не собрался (${String(e).slice(0, 120)})`); }

      // Commerce Intelligence Audit A0 — реконструкция бизнеса из сайта (35+ слоёв,
      // цепочки наблюдаем→дедуцируем→проверить→решение, зрелость 1–5). Флагман.
      try {
        const ci = buildIntelligence(ds);
        ciReport = ci;
        if (hasKey()) { log('· Commerce Intelligence: дедукции (Claude)…'); await narrateIntelligence(ds, ci, log); }
        await writeFile(join(dir, 'intelligence.json'), JSON.stringify(ci, null, 2), 'utf8');
        await renderPdf(renderIntelligenceHtml(ci), join(dir, 'Commerce-Intelligence-Audit-A0.pdf'), browser);
        log(`✓ Commerce Intelligence A0 (PDF): зрелость ${ci.maturity.level}/5 «${ci.maturity.name}», слоёв ${ci.layers.length}, цепочек ${ci.chains.length}`);
      } catch (e) { log(`⚠️ Commerce Intelligence не собрался (${String(e).slice(0, 120)})`); }

      // Маркетинговые механики A0 — реестр 34 механик (AOV/retention/конверсия/доверие/охват).
      try {
        const mech = buildMechanics(ds); mechReport = mech;
        await writeFile(join(dir, 'mechanics.json'), JSON.stringify(mech, null, 2), 'utf8');
        await renderPdf(renderMechanicsHtml(mech), join(dir, 'Маркетинговые-механики-A0.pdf'), browser);
        log(`✓ Маркетинговые механики A0 (PDF): активно ${mech.score.have}/${mech.score.measurable} (${mech.score.pct}%)`);
      } catch (e) { log(`⚠️ PDF Маркетинговые механики не собрался (${String(e).slice(0, 120)})`); }

      // Внешний контур: соцсети, инфофон бренда, отзывы (сайт + внешние площадки).
      // Внешний слой собирает Claude web_search; без ключа — честный BLOCKED-режим.
      try {
        const social = await buildSocialAudit(ds, log);
        await writeFile(join(dir, 'social.json'), JSON.stringify(social, null, 2), 'utf8');
        await renderPdf(renderSocialHtml(social), join(dir, 'Аудит-соцсетей-A0.pdf'), browser);
        log(`✓ Аудит соцсетей A0 (PDF): привязано ${social.linked}/${social.profiles.length}${social.searched ? ', внешний поиск выполнен' : ''}`);
      } catch (e) { log(`⚠️ Аудит соцсетей не собрался (${String(e).slice(0, 120)})`); }
      try {
        const mentions = await buildMentionsAudit(ds, log);
        await writeFile(join(dir, 'mentions.json'), JSON.stringify(mentions, null, 2), 'utf8');
        await renderPdf(renderMentionsHtml(mentions), join(dir, 'Внешний-инфофон-A0.pdf'), browser);
        log(`✓ Внешний инфофон A0 (PDF): упоминаний ${mentions.mentions.length}${mentions.searched ? '' : ' (поиск заблокирован)'}`);
      } catch (e) { log(`⚠️ Внешний инфофон не собрался (${String(e).slice(0, 120)})`); }
      try {
        const reviews = await buildReviewsAudit(ds, log);
        await writeFile(join(dir, 'reviews.json'), JSON.stringify(reviews, null, 2), 'utf8');
        await renderPdf(renderReviewsHtml(reviews), join(dir, 'Аудит-отзывов-A0.pdf'), browser);
        log(`✓ Аудит отзывов A0 (PDF): источников ${reviews.sources.length}`);
      } catch (e) { log(`⚠️ Аудит отзывов не собрался (${String(e).slice(0, 120)})`); }

      // Аудит каналов A0 — внешние сигналы каналов (A0).
      try {
        const channels = buildChannels(ds);
        await writeFile(join(dir, 'channels.json'), JSON.stringify(channels, null, 2), 'utf8');
        await renderPdf(renderChannelsHtml(channels), join(dir, 'Аудит-каналов-A0.pdf'), browser);
        log(`✓ Аудит каналов A0 (PDF): зашито ${channels.wired}/${channels.rows.length}, blocked ${channels.blocked}`);
      } catch (e) { log(`⚠️ PDF Аудит каналов A0 не собрался (${String(e).slice(0, 120)})`); }

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
        // Реестр гипотез (AD-19) — недоказанное со способом проверки/опровержения → PDF.
        const hyp = buildHypotheses(analysis);
        await writeFile(join(dir, 'hypotheses.json'), JSON.stringify(hyp, null, 2), 'utf8');
        try { await renderPdf(renderHypothesesPdf(hyp, clientName(ds), new Date(ds.takenAt).toLocaleDateString('ru-RU')), join(dir, 'Реестр-гипотез-A0.pdf'), browser); }
        catch (e) { log(`⚠️ PDF Реестр гипотез не собрался (${String(e).slice(0, 120)})`); }
        log(`✓ анализ собран, реестр гипотез (${hyp.items.length})`);
      } catch (e) {
        log(`⚠️ аналитический слой не отработал: ${String(e).slice(0, 160)}${apiErrorHint(e)}`);
      }
    } else {
      log('· ANTHROPIC_API_KEY не задан — только обход и L0-отчёт (для AD-15/деньги нужен ключ)');
    }

    if (!prelaunch) {
      const D = new Date(ds.takenAt).toLocaleDateString('ru-RU');
      const cn = clientName(ds);
      const pdf = async (html: string, name: string) => { try { await renderPdf(html, join(dir, name), browser); } catch (e) { log(`⚠️ PDF ${name} не собрался (${String(e).slice(0, 100)})`); } };

      // Матрица зрелости (AD-16) → PDF-дашборд.
      const mat = buildMaturity(ds); maturityReport = mat;
      await writeFile(join(dir, 'maturity.json'), JSON.stringify(mat, null, 2), 'utf8');
      await pdf(renderMaturityPdf(mat, cn, D), 'Матрица-зрелости-A0.pdf');

      // Scope программы по волнам → PDF.
      const scope = buildScope(ds, { engine, analysis: analysisResult, hasMoney: Boolean(money) });
      await writeFile(join(dir, 'scope.json'), JSON.stringify(scope, null, 2), 'utf8');
      await pdf(renderScopePdf(scope, cn, D), 'Scope-по-волнам-A0.pdf');

      // Цена в канале и роль в цепочке → PDF.
      const pc = buildPriceChannel(ds);
      await writeFile(join(dir, 'pricechannel.json'), JSON.stringify(pc, null, 2), 'utf8');
      await pdf(renderPriceChannelPdf(pc, cn, D), 'Цена-в-канале-A0.pdf');

      // ── ЕДИНЫЙ РЕЕСТР НАХОДОК — строится ДО причинной карты/охвата/exec, чтобы они
      //    читали из него (единая точка правды: одни ID, одна уверенность, одни деньги).
      //    + премиум-экспертиза, если включён тумблер. ──
      registryRaw = [
        ...(siteAudit?.pages.flatMap((p) => p.fixes.map((f) => ({ pr: (f.crit === 'Блокирующая' ? 'P0' : f.crit === 'Высокая' ? 'P1' : 'P2') as RawRec['pr'], action: `${p.title}: ${f.what}`, effect: f.why, source: 'UX/UI' }))) ?? []),
        ...(contentReport?.recommendations.map((r) => ({ ...r, source: 'Контент' })) ?? []),
        ...(mechReport?.recommendations.map((r) => ({ ...r, source: 'Механики' })) ?? []),
        ...(journeyReport?.recommendations.map((r) => ({ ...r, source: 'Путь клиента' })) ?? []),
        ...(techReport?.categories.flatMap((c) => c.checks.filter((ch) => ch.status === 'gap').map((ch) => ({ pr: 'P1' as const, action: ch.rec, effect: `Закрывает «${ch.label}»`, source: 'Технический' }))) ?? []),
        ...(seoReport?.issues.map((i) => ({ pr: (i.level <= 1 ? 'P0' : 'P1') as RawRec['pr'], action: `${i.node}: ${i.action}`, effect: i.problem, source: 'SEO' })) ?? []),
        ...(ciReport?.chains.map((c, i) => ({ pr: (i < 2 ? 'P0' : 'P1') as RawRec['pr'], action: c.action, effect: c.impact, source: 'CI' })) ?? []),
      ];
      try {
        const { feedFromReports } = await import('./registryFeed.js');
        const { buildRegistry, registrySummary } = await import('./registry.js');
        const { renderRegistryHtml } = await import('./export/registryHtml.js');
        registry = buildRegistry(feedFromReports(registryRaw, journeyReport), { money });
        if (opts.premium) {
          try {
            const { runExperts } = await import('./experts/runner.js');
            const { applyVerifications } = await import('./registry.js');
            const { renderPremiumHtml } = await import('./export/premiumHtml.js');
            const expertResults = await runExperts({ dataset: ds, baseFindings: registry, log, browser });
            const expertInputs = expertResults.flatMap((r) => r.findings);
            if (expertInputs.length) registry = buildRegistry([...feedFromReports(registryRaw, journeyReport), ...expertInputs], { money });
            const nAdj = applyVerifications(registry, expertResults.flatMap((r) => r.verifications));
            await renderPdf(renderPremiumHtml(cn, ds.takenAt, expertResults), join(dir, 'Премиум-экспертиза.pdf'), browser);
            log(`✓ Премиум-экспертиза: агентов ${expertResults.filter((r) => r.ran).length}/${expertResults.length}, находок +${expertInputs.length}, перепроверок применено ${nAdj}`);
          } catch (e) { log(`⚠️ премиум-экспертиза не отработала (${String(e).slice(0, 100)})`); }
        }
        const rs = registrySummary(registry);
        await writeFile(join(dir, 'registry.json'), JSON.stringify(registry, null, 2), 'utf8');
        await renderPdf(renderRegistryHtml(cn, ds.takenAt, registry), join(dir, 'Реестр-находок.pdf'), browser);
        log(`✓ Реестр находок (PDF)${opts.premium ? ' + премиум' : ''}: ${rs.total} находок (P0 ${rs.p0} / P1 ${rs.p1} / P2 ${rs.p2}), exposure ≈ ${rs.exposureYear.toLocaleString('ru-RU')} ₴/год`);
      } catch (e) { log(`⚠️ реестр находок не собран (${String(e).slice(0, 100)})`); }

      // ── Итоговое резюме: команда / сроки / бюджет / тактика vs стратегия из реестра. ──
      if (registry?.length) {
        try {
          const { buildEngagement, renderEngagementHtml } = await import('./engagement.js');
          const eng = buildEngagement(cn, ds.takenAt, registry);
          await renderPdf(renderEngagementHtml(eng), join(dir, 'Итоговое-резюме.pdf'), browser);
          log(`✓ Итоговое резюме (PDF): ${eng.tactical.count} тактических / ${eng.strategic.count} стратегических, команда ${eng.team.length} ролей`);
        } catch (e) { log(`⚠️ итоговое резюме не собрано (${String(e).slice(0, 80)})`); }
      }

      // Причинно-следственная карта → PDF (симптом → причина → деньги). Строится
      // ВСЕГДА: без аналитического слоя узлы достраиваются детерминированно из
      // системных дефектов и CI-цепочек; узлы связываются с ID реестра находок.
      const causal = buildCausal(analysisResult, money, {
        systemic: siteAudit?.systemic ?? [],
        chains: ciReport?.chains ?? [],
        findings: registry ?? [],
      });
      await writeFile(join(dir, 'causal.json'), JSON.stringify(causal, null, 2), 'utf8');
      await pdf(renderCausalPdf(causal, cn, D), 'Причинно-следственная-карта-A0.pdf');
      log(`✓ метод-документы (PDF): зрелость (набл. ${mat.observedAvg ?? '—'}/5), scope (${scope.waves.reduce((n, w) => n + w.items.length, 0)} активаций), цена в канале`);

      const cov = buildCoverage(ds, { hasEngine: Boolean(engine), hasMoney: Boolean(money), findings: registry ?? [] });
      metrics.confidence = { score: cov.confidence.score, base: cov.confidence.base };
      await writeFile(join(dir, 'coverage.json'), JSON.stringify(cov, null, 2), 'utf8');
      await pdf(renderCoveragePdf(cov, cn, D), 'Охват-и-уверенность-A0.pdf');
      log(`✓ охват аудита + Confidence Score ${cov.confidence.score}/${cov.confidence.base} (${cov.confidence.band})`);

      // Executive Diagnostic A0 — зонтичный клиентский PDF, сводит все аудиты (A0 §13).
      try {
        const execHtml = renderExecDiagnostic(ds, { siteAudit, analysis: analysisResult, engine, money, bench, coverage: cov, registry: registry ?? [] });
        await renderPdf(execHtml, join(dir, 'Executive-Diagnostic-A0.pdf'), browser);
        log('✓ Executive Diagnostic A0 (PDF): зонтичный отчёт собран');
      } catch (e) { log(`⚠️ Executive Diagnostic не собрался (${String(e).slice(0, 120)}) — остальные материалы не затронуты`); }

      // Слой синтеза — взаимосвязи всех линз в один вывод (нужен ключ).
      if (hasKey()) {
        log('· синтез всех линз…');
        const synth = await narrateSynthesis(ds, { uxui, proto, bench, maturity: mat, scope, causal, money, engine, coverage: cov });
        if (synth) {
          await writeFile(join(dir, 'synthesis.json'), JSON.stringify(synth, null, 2), 'utf8');
          await pdf(renderSynthesisPdf(synth, cn, D), 'Синтез-аудита-A0.pdf');
          log('✓ синтез собран');
        } else { log('· синтез не собран (нет ключа/данных)'); }

        // Коммерческое предложение (КП) — переход аудит → продажа программы.
        if (analysisResult) {
          log('· коммерческое предложение…');
          const kp = await buildKp(ds, { analysis: analysisResult, money, engine, scope });
          if (kp) {
            await exportKpDocx(ds, kp, money, scope, join(dir, 'Коммерческое-предложение.docx'));
            await renderPdf(renderKpPdf(ds, kp, money, scope), join(dir, 'Коммерческое-предложение.pdf'), browser);
            log('✓ КП собрано (PDF + DOCX)');
          }
        }
      }
    }

    // Coverage/Activation Engine (round12): все ли ОБЯЗАТЕЛЬНЫЕ домены типа бизнеса
    // проверены этим прогоном. Молчащий обязательный домен — не «всё хорошо».
    if (!prelaunch) {
      try {
        const produced = await readdir(dir);
        const act = buildActivation(ds, produced);
        await writeFile(join(dir, 'activation.json'), JSON.stringify(act, null, 2), 'utf8');
        log(`${act.complete ? '✓' : '✖'} покрытие доменов (${act.businessType}): ${act.verdict}`);
      } catch (e) { log(`⚠️ активационный гейт не отработал (${String(e).slice(0, 100)})`); }

      // ── Сводный бэклог ИЗ реестра (реестр собран выше — единая точка правды). ──
      try {
        const cn2 = clientName(ds);
        const backlog = registry ? buildBacklogFromRegistry(cn2, ds.takenAt, registry, registryRaw.length) : buildBacklog(cn2, ds.takenAt, registryRaw);
        await writeFile(join(dir, 'backlog.json'), JSON.stringify(backlog, null, 2), 'utf8');
        await renderPdf(renderBacklogHtml(backlog), join(dir, 'Сводный-бэклог.pdf'), browser);
        log(`✓ Сводный бэклог (PDF)${registry ? ' из реестра' : ''}: ${backlog.rawCount} рекомендаций → ${backlog.items.length} работ`);

        // ── Протокол синергии и QA: пакет проверяет сам себя, нестыковки → резолюции. ──
        const qa = await buildQa(cn2, ds.takenAt, {
          siteAudit, content: contentReport, mech: mechReport, journey: journeyReport,
          tech: techReport, seo: seoReport, ci: ciReport, bench, maturity: maturityReport,
          backlog, money,
        }, debugLog, log);
        await writeFile(join(dir, 'qa.json'), JSON.stringify(qa, null, 2), 'utf8');
        await renderPdf(renderQaHtml(qa), join(dir, 'Протокол-синергии-QA-A0.pdf'), browser);
        log(`✓ Протокол синергии/QA (PDF): проверок ${qa.checksRun}, находок ${qa.findings.length}`);
      } catch (e) { log(`⚠️ активационный гейт не отработал (${String(e).slice(0, 100)})`); }
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
    await closePdfBrowser();
  }
}
