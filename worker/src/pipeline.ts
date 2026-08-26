/**
 * Конвейер аудита как переиспользуемая функция — общий код для CLI (run.ts) и
 * HTTP-сервера (server.ts). Обход → движок → деньги → анализ → материалы.
 */
import { writeFile, mkdir, readdir, readFile } from 'node:fs/promises';
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
import { reviewDesign } from './designReview.js';
import { auditFromScreenshots, type VisionFile } from './visionAudit.js';
import { renderPresentation } from './export/presentationHtml.js';
import { researchTargetState } from './targetState.js';
import { parseQuestionnaireFile } from './questionnaire.js';
import { renderAuditHtml } from './export/htmlReport.js';
import { renderExecDiagnostic } from './export/execDiagHtml.js';
import { buildSeoArch } from './seoarch.js';
import { renderSeoArchHtml } from './export/seoArchHtml.js';
import { buildTechAudit } from './techaudit.js';
import { renderTechAuditHtml } from './export/techAuditHtml.js';
import { buildContentAudit } from './contentaudit.js';
import { buildContentFlow } from './contentflow.js';
import { renderContentAuditHtml } from './export/contentAuditHtml.js';
import { buildSeoFlow } from './seoflow.js';
import { renderSeoFlowHtml } from './export/seoFlowHtml.js';
import { buildGeoFlow } from './geoflow.js';
import { renderGeoFlowHtml } from './export/geoFlowHtml.js';
import { buildStrategyFlow } from './strategyflow.js';
import { renderStrategyFlowHtml } from './export/strategyFlowHtml.js';
import { buildStructureFlow } from './structureflow.js';
import { renderStructureFlowHtml } from './export/structureFlowHtml.js';
import { buildPageFlow } from './pageflow.js';
import { renderPageFlowHtml } from './export/pageFlowHtml.js';
import { buildBlockFlow } from './blockflow.js';
import { renderBlockFlowHtml } from './export/blockFlowHtml.js';
import { buildMerchFlow } from './merchflow.js';
import { renderMerchFlowHtml } from './export/merchFlowHtml.js';
import { buildCroFlow } from './croflow.js';
import { renderCroFlowHtml } from './export/croFlowHtml.js';
import { buildAnalyticsFlow } from './analyticsflow.js';
import { renderAnalyticsFlowHtml } from './export/analyticsFlowHtml.js';
import { buildCjmFlow } from './cjmflow.js';
import { renderCjmFlowHtml } from './export/cjmFlowHtml.js';
import { buildAuditChain } from './auditchain.js';
import { renderAuditChainHtml } from './export/auditChainHtml.js';
import { buildUnitEcon } from './unitecon.js';
import { renderUnitEconHtml } from './export/unitEconHtml.js';
import { buildGeoExpand } from './geoexpand.js';
import { renderGeoExpandHtml } from './export/geoExpandHtml.js';
import { buildAuditSystem } from './auditsystem.js';
import { renderAuditSystemHtml } from './export/auditSystemHtml.js';
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
import { hasKey, apiErrorHint, resetUsage, getUsage } from './anthropic.js';
import { makeDeadline } from './util/timeout.js';
import type { Analysis } from './analyze.js';
import type { UxUiReport } from './uxui.js';
import type { PrototypeReport } from './prototype.js';
import type { BenchmarkReport } from './competitor.js';
import { renderKnowledge } from './clientKnowledge.js';
import { buildEvidence, evidenceBlock, levelSummary } from './evidence.js';
import { readyExternal } from './connectors.js';
import { cruxBenchmark, cruxToFacts, hasCrux } from './crux.js';

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
  /** База знаний клиента с сайта: профиль, доступы, файлы, оценки, прошлые прогоны.
      Приходит из админки через /api/audit-run — контекст, а не выгрузка данных. */
  knowledge?: Record<string, unknown> | null;
  answersFile?: { path: string; type: string }; // опросник файлом (Excel/Word/PDF) — распознаётся воркером
  baseline?: { levers: Levers; extra?: { name: string; monthly: number }[] } | null;
  out?: string;
  backupPdf?: string;           // (устар.) один PDF — резервный контур
  backupFiles?: { path: string; type: string; name?: string }[]; // набор файлов-скриншотов (пути + MIME)
  log?: (m: string) => void;
};

/**
 * Детектор заглушки: живой сайт вернул плейсхолдер (coming-soon/Hostinger/бот-блок),
 * а не витрину. Признаки: одинаковые тонкие страницы, coming-soon-маркеры, ноль
 * коммерческих сигналов. Триггерит резервный контур по скриншотам.
 */
function detectStub(client: SiteCrawl): boolean {
  const pages = client.pages.filter((p) => !p.error);
  if (!pages.length) return false;
  const COMING = /coming soon|незабаром|briefly unavailable|under construction|maintenance mode|сайт в разработ|у розробц|скоро открыт|новий сайт wordpress|website is coming/i;
  const comingHit = pages.some((p) => COMING.test(p.title) || COMING.test(client.stack?.signals?.join(' ') ?? ''));
  const titles = new Set(pages.map((p) => (p.title || '').trim().toLowerCase()));
  const avgWords = pages.reduce((s, p) => s + (p.ux?.bodyWords ?? 0), 0) / pages.length;
  const noCommerce = !pages.some((p) => (p.ux?.productCards ?? 0) > 4 || p.ux?.priceVisible || p.ux?.addToCartProminent);
  // Заглушка: coming-soon-текст ИЛИ (все страницы одинаковый тонкий контент без коммерции)
  return comingHit || (pages.length >= 2 && titles.size <= 1 && avgWords < 150 && noCommerce);
}

export type AuditMetrics = {
  compliance: number | null;
  confidence: { score: number; base: number } | null;
  health: number | null;
  benchmarkIndex: number | null;
  aqcFails: number | null;
  potentialYear: number | null;
};
export type AuditResult = { id: string; dir: string; summary: string; files: string[]; metrics: AuditMetrics; maturity?: import('./maturity.js').MaturityReport | null; findings?: import('./learning/ledger.js').ReviewableFinding[] };

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
  const t0 = Date.now(); // старт прогона — для durationMs в Audit Run Record
  resetUsage(); // обнуляем счётчик токенов на прогон (cost per audit)
  const prelaunch = Boolean(opts.prelaunch);
  const tier: Tier = prelaunch ? 0 : ((opts.tier ?? 1) as Tier);
  const site = normalizeUrl(opts.site ?? '');
  const competitors = (opts.competitors ?? []).map(normalizeUrl).filter(Boolean);
  if (!site && !prelaunch) throw new Error('Нужен site (или prelaunch для проекта без сайта)');

  const spec = TIERS[tier];
  // Вотчдог прогону: важкі необов'язкові Claude-блоки (преміум-експерти, синтез,
  // КП) пропускаються, якщо прогін перевищив ліміт — краще завершити з готовим,
  // ніж молотити годину. Пер-крокові таймаути й так не дають зависнути.
  const deadline = makeDeadline(Number(process.env.AUDIT_MAX_MINUTES) || 30);
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
        // Резервный контур: если приложен PDF со скриншотами — не падаем, а
        // переключаемся на разбор зрением (ниже, в блоке UX/UI).
        if (opts.backupPdf) {
          log(`⚠️ живого доступа нет (${reason}) → резервный контур: разбор по скриншотам из PDF`);
        } else {
          log(`✖ доступ к сайту не получен — аудит остановлен: ${reason}`);
          throw new Error(
            `Не удалось получить доступ к сайту ${site}: ${reason}. ` +
            `${reachabilityDiagnosis(client)} ` +
            `Аудит НЕ проводился — данные не собраны, фиктивные выводы не выпускаются.`,
          );
        }
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

    // Поле важнее лаборатории: CrUX даёт реальных пользователей и, главное,
    // измеряет конкурентов без единого доступа к ним.
    let cruxFacts = '';
    if (site && hasCrux()) {
      const b = await cruxBenchmark(site, comps.map((c) => c.finalUrl || c.rootUrl).filter(Boolean), log);
      if (b.client || b.competitors.length) {
        cruxFacts = cruxToFacts(b);
        log(`✓ CrUX: клиент ${b.client?.insufficientData ? 'ниже порога публикации' : 'есть'}, конкурентов ${b.competitors.length}`);
      }
    }
    const ds: AuditDataset = {
      tier, request: opts.request ?? '', client, competitors: comps, takenAt: new Date().toISOString(),
      ...(cruxFacts ? { crux: cruxFacts } : {}),
      // База знаний + разбор её по уровням достоверности. Второе важнее: без
      // него аудитор не отличает «клиент сказал» от «мы прочитали в его системе»,
      // а расхождение между ними — это находка, а не помеха.
      ...(opts.knowledge ? { knowledge: renderKnowledge(opts.knowledge) } : {}),
      ...(() => {
        const sources = buildEvidence(opts.knowledge as Record<string, unknown> | undefined, readyExternal());
        if (!sources.length) return {};
        const n = levelSummary(sources);
        log(`· уровни данных: L1 ${n.L1} · L2 ${n.L2} · L3 ${n.L3} · слово клиента ${n.C}`);
        return { evidence: evidenceBlock(sources) };
      })(),
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
    // Захоплення HTML кожної лінзи для групування в тематичні документи (композер
    // збирає з них 5 розділів + висновок). cap() зберігає й повертає html далі в рендер.
    const lensHtml: Record<string, string> = {};
    const cap = (k: string, html: string): string => { lensHtml[k] = html; return html; };
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
        await renderPdf(cap('journey', renderJourneyHtml(journeyReport)), join(dir, 'Карта-пути-клиента-A0.pdf'), browser);
        log(`✓ Карта пути клиента A0 (PDF): пройдено ${journeyReport.passed}/${journeyReport.steps.length}, тупиков ${journeyReport.deadends}`);
      } catch (e) { log(`⚠️ Карта пути клиента не собралась (${String(e).slice(0, 120)})`); }

      try {
        siteAudit = buildSiteAudit(ds, { journey: journeySteps });
        // Резервный контур: живой сайт — заглушка/недоступен, а приложен PDF со
        // скриншотами → строим UX/UI разбор ЗРЕНИЕМ по скриншотам вместо DOM.
        const stub = detectStub(ds.client);
        let fromScreens = false;
        const hasBackup = (opts.backupFiles?.length ?? 0) > 0 || Boolean(opts.backupPdf);
        // Мелкий обход: главная открылась, но вглубь не прошёл (только 1–2 страницы,
        // нет карточки товара). Раньше в этом случае скриншоты игнорировались, т.к.
        // сайт «не заглушка». Теперь: есть скриншоты + мелкий обход → берём скриншоты
        // (оператор загрузил их именно потому, что краулер не дотягивается внутрь).
        const okPages = ds.client.pages.filter((p) => !p.error);
        const hasPdp = okPages.some((p) => p.kind === 'pdp');
        const looksCommerce = okPages.some((p) => ['plp', 'cart', 'checkout'].includes(p.kind)) || (ds.client.links ?? []).length > 100;
        const shallow = okPages.length < 3 || (looksCommerce && !hasPdp);
        const noneAudited = !ds.client.pages.some((p) => p.score !== null);
        if (hasBackup && (stub || !ds.client.reachable || noneAudited || shallow)) {
          const why = stub ? 'заглушка' : !ds.client.reachable ? 'недоступен' : noneAudited ? 'нет данных' : `мелкий обход (${okPages.length} стр., PDP ${hasPdp ? 'есть' : 'нет'})`;
          log(`· резервный контур: живой доступ = ${why} → разбор скриншотов зрением…`);
          // Резолвим набор файлов (пути → base64 + MIME). Совместимость: один backupPdf.
          const specs = opts.backupFiles?.length ? opts.backupFiles : (opts.backupPdf ? [{ path: opts.backupPdf, type: 'application/pdf' }] : []);
          const vfiles = (await Promise.all(specs.slice(0, 50).map(async (f): Promise<VisionFile | null> => {
            const data = await readFile(f.path, 'base64').catch(() => (f.path.length > 200 ? f.path : ''));
            return data ? { data, mediaType: f.type || 'application/pdf', name: f.name } : null;
          }))).filter((x): x is VisionFile => x !== null);
          log(`· резервный контур: файлов к разбору ${vfiles.length}`);
          const vr = await auditFromScreenshots(vfiles, siteAudit.client, log).catch((e) => { log(`⚠️ резервный контур упал (${String(e).slice(0, 80)})`); return null; });
          if (vr?.report?.pages.length) { siteAudit = vr.report; fromScreens = true; log(`✓ UX/UI построен по скриншотам: страниц ${vr.report.pages.length}, соответствие ${vr.report.totalPct}%`); }
          else log('⚠️ резервный контур не дал страниц — остаёмся на разборе живого');
        }
        // Дизайн-ревью со зрением: если UX/UI уже собран по скриншотам — дизайн-вердикт
        // пришёл вместе с ним; иначе смотрим на живые скриншоты обхода.
        if (!fromScreens) try {
          log('· дизайн-ревью со зрением (design director смотрит на страницы)…');
          siteAudit.design = await reviewDesign(ds.client, log) ?? undefined;
          if (siteAudit.design) log(`✓ дизайн-вердикт: ${siteAudit.design.tier} · ${siteAudit.design.overallScore}/10 (${siteAudit.design.source})`);
        } catch (e) { log(`⚠️ дизайн-ревью пропущено (${String(e).slice(0, 90)})`); }
        if (siteAudit.stack?.signals?.length) log(`✓ платформа: ${siteAudit.stack.cms ?? '—'}${siteAudit.stack.templateName ? ` · ${siteAudit.stack.templateName}` : ''}${siteAudit.stack.builder ? ` · ${siteAudit.stack.builder}` : ''}`);
        await writeFile(join(dir, 'pagereport.json'), JSON.stringify(siteAudit, null, 2), 'utf8');
        await renderPdf(cap('uxui', renderAuditHtml(siteAudit, uxui)), join(dir, 'UX-UI-аудит-A0.pdf'), browser);
        log(`✓ UX/UI Audit A0 (PDF): соответствие эталону ${siteAudit.totalPct}%, системных дефектов ${siteAudit.systemic.length}`);
      } catch (e) { log(`⚠️ PDF UX/UI Audit A0 не собрался (${String(e).slice(0, 120)}) — остальные материалы не затронуты`); }

      // SEO Architecture A0 — видимое дерево → проблемные узлы → рекомендуемое (A0 §10).
      try {
        const seo = buildSeoArch(ds); seoReport = seo;
        await writeFile(join(dir, 'seoarch.json'), JSON.stringify(seo, null, 2), 'utf8');
        await renderPdf(cap('seo', renderSeoArchHtml(seo)), join(dir, 'SEO-Architecture-A0.pdf'), browser);
        log(`✓ SEO Architecture A0 (PDF): ссылок ${seo.totals.links}, проблемных узлов ${seo.issues.length}`);
      } catch (e) { log(`⚠️ PDF SEO Architecture A0 не собрался (${String(e).slice(0, 120)})`); }

      // Технический внешний аудит A0 — категории проверок из обхода (A0).
      try {
        const tech = buildTechAudit(ds); techReport = tech;
        await writeFile(join(dir, 'techaudit.json'), JSON.stringify(tech, null, 2), 'utf8');
        await renderPdf(cap('tech', renderTechAuditHtml(tech)), join(dir, 'Технический-аудит-A0.pdf'), browser);
        log(`✓ Технический аудит A0 (PDF): пройдено ${tech.score.pct}%, blocked ${tech.blocked.length}`);
      } catch (e) { log(`⚠️ PDF Технический аудит A0 не собрался (${String(e).slice(0, 120)})`); }

      // Content Audit A0 — контент по способности вести к решению (A0 §11).
      try {
        const content = buildContentAudit(ds); contentReport = content;
        const contentFlow = buildContentFlow(ds, content);
        await writeFile(join(dir, 'contentaudit.json'), JSON.stringify(content, null, 2), 'utf8');
        await renderPdf(cap('content', renderContentAuditHtml(content, contentFlow)), join(dir, 'Content-Audit-A0.pdf'), browser);
        log(`✓ Content Audit A0 (PDF): типов страниц ${content.rows.length}`);
      } catch (e) { log(`⚠️ PDF Content Audit A0 не собрался (${String(e).slice(0, 120)})`); }

      // SEO-аудит как система — 8 артефактов (Strategy/Semantic/Technical/Page/
      // Block/Problem-Opportunity/Score/Roadmap), а не «мета-теги + индексация».
      try {
        const seoFlow = buildSeoFlow(ds);
        await writeFile(join(dir, 'seoflow.json'), JSON.stringify(seoFlow, null, 2), 'utf8');
        await renderPdf(cap('seoflow', renderSeoFlowHtml(seoFlow)), join(dir, 'SEO-аудит-система-A0.pdf'), browser);
        log(`✓ SEO-аудит (система, PDF): SEO Score ${seoFlow.score.overall}/10, проблем ${seoFlow.problems.length}`);
      } catch (e) { log(`⚠️ PDF SEO-аудит (система) не собрался (${String(e).slice(0, 120)})`); }

      // Strategic Audit — верхнеуровневый: правильно ли сайт спроектирован как
      // инструмент бизнеса. Идёт первым; его выводы — вход для остальных аудитов.
      try {
        const strat = buildStrategyFlow(ds);
        await writeFile(join(dir, 'strategyaudit.json'), JSON.stringify(strat, null, 2), 'utf8');
        await renderPdf(cap('strategy', renderStrategyFlowHtml(strat)), join(dir, 'Strategic-Audit-A0.pdf'), browser);
        log(`✓ Strategic Audit (PDF): Health ${strat.health.overall}/10, рисков ${strat.risks.length}`);
      } catch (e) { log(`⚠️ PDF Strategic Audit не собрался (${String(e).slice(0, 120)})`); }

      // Structure & Site Tree Audit — архитектура сайта как система: дерево + граф
      // + коммерческие оси + точки входа/выхода + целевое дерево + roadmap.
      try {
        const structure = buildStructureFlow(ds);
        await writeFile(join(dir, 'structureaudit.json'), JSON.stringify(structure, null, 2), 'utf8');
        await renderPdf(cap('structure', renderStructureFlowHtml(structure)), join(dir, 'Structure-Site-Tree-A0.pdf'), browser);
        log(`✓ Structure & Site Tree (PDF): Health ${structure.health.overall}/10, разрывов ${structure.gaps.length}`);
      } catch (e) { log(`⚠️ PDF Structure & Site Tree не собрался (${String(e).slice(0, 120)})`); }

      // Page Audit — каждая страница как единица бизнеса: 16 направлений на
      // страницу, Page Health Matrix, карточки с 7 вопросами, Golden Standard/Gap.
      try {
        const pageFlow = buildPageFlow(ds);
        await writeFile(join(dir, 'pageaudit.json'), JSON.stringify(pageFlow, null, 2), 'utf8');
        await renderPdf(cap('pageaudit', renderPageFlowHtml(pageFlow)), join(dir, 'Page-Audit-A0.pdf'), browser);
        log(`✓ Page Audit (PDF): Health ${pageFlow.overall}/10, страниц ${pageFlow.cards.length}`);
      } catch (e) { log(`⚠️ PDF Page Audit не собрался (${String(e).slice(0, 120)})`); }

      // Block-by-Block Audit — самый детальный уровень: каждый блок как
      // функциональная единица со всеми линзами (15 направлений), Block Health
      // Matrix, Problem-карточки, Keep/Improve/Move/Merge/Remove/Create. Score ≠ Priority.
      try {
        const blockFlow = buildBlockFlow(ds);
        await writeFile(join(dir, 'blockaudit.json'), JSON.stringify(blockFlow, null, 2), 'utf8');
        await renderPdf(cap('blockaudit', renderBlockFlowHtml(blockFlow)), join(dir, 'Block-by-Block-Audit-A0.pdf'), browser);
        log(`✓ Block-by-Block Audit (PDF): Health ${blockFlow.overall}/10, блоков ${blockFlow.cards.length}`);
      } catch (e) { log(`⚠️ PDF Block-by-Block Audit не собрался (${String(e).slice(0, 120)})`); }

      // E-commerce / Merchandising Audit — управление ассортиментом и коммерческая
      // экспозиция: механики, карточка товара, пути discovery, block-by-block.
      try {
        const merchFlow = buildMerchFlow(ds);
        await writeFile(join(dir, 'merchaudit.json'), JSON.stringify(merchFlow, null, 2), 'utf8');
        await renderPdf(cap('merchaudit', renderMerchFlowHtml(merchFlow)), join(dir, 'Merchandising-Audit-A0.pdf'), browser);
        log(`✓ Merchandising Audit (PDF): Health ${merchFlow.health.overall}/10, разрывов ${merchFlow.gaps.length}`);
      } catch (e) { log(`⚠️ PDF Merchandising Audit не собрался (${String(e).slice(0, 120)})`); }

      // CRO Audit — системное превращение посетителя в целевое действие: воронка,
      // friction/trust/CTA maps, block-cards, гипотезы (ICE), roadmap.
      try {
        const croFlow = buildCroFlow(ds);
        await writeFile(join(dir, 'croaudit.json'), JSON.stringify(croFlow, null, 2), 'utf8');
        await renderPdf(cap('croaudit', renderCroFlowHtml(croFlow)), join(dir, 'CRO-Audit-A0.pdf'), browser);
        log(`✓ CRO Audit (PDF): Health ${croFlow.health.overall}/10, гипотез ${croFlow.hypotheses.length}`);
      } catch (e) { log(`⚠️ PDF CRO Audit не собрался (${String(e).slice(0, 120)})`); }

      // Analytics Audit — система измерения (GA4/GTM/CRM/attribution/reporting).
      // Честно: ~95% требует доступа; обход даёт baseline инструментирования + план.
      try {
        const analyticsFlow = buildAnalyticsFlow(ds);
        await writeFile(join(dir, 'analyticsaudit.json'), JSON.stringify(analyticsFlow, null, 2), 'utf8');
        await renderPdf(cap('analyticsaudit', renderAnalyticsFlowHtml(analyticsFlow)), join(dir, 'Analytics-Audit-A0.pdf'), browser);
        log(`✓ Analytics Audit (PDF): baseline ${analyticsFlow.baseline.instrumentation}/10, L${analyticsFlow.maturity.floor}`);
      } catch (e) { log(`⚠️ PDF Analytics Audit не собрался (${String(e).slice(0, 120)})`); }

      // Customer Journey Audit — полный путь клиента Awareness→Advocacy: on-site
      // этапы, персоны, эмоции, expectation, post-purchase. Data-зависимое — честно «н/д».
      try {
        const cjmFlow = buildCjmFlow(ds);
        await writeFile(join(dir, 'cjmaudit.json'), JSON.stringify(cjmFlow, null, 2), 'utf8');
        await renderPdf(cap('cjmaudit', renderCjmFlowHtml(cjmFlow)), join(dir, 'Customer-Journey-Audit-A0.pdf'), browser);
        log(`✓ Customer Journey Audit (PDF): on-site ${cjmFlow.onsiteReadiness}/10, L${cjmFlow.maturity.floor}`);
      } catch (e) { log(`⚠️ PDF Customer Journey Audit не собрался (${String(e).slice(0, 120)})`); }

      // GEO / AEO / LLM Visibility — отдельный модуль: измеримое из обхода
      // (AI-crawlability, answerability, сущности, разметка) + честный шаблон под
      // живой прогон AI-запросов (без выдуманных данных о цитировании).
      try {
        const geoFlow = buildGeoFlow(ds);
        await writeFile(join(dir, 'geoflow.json'), JSON.stringify(geoFlow, null, 2), 'utf8');
        await renderPdf(cap('geoflow', renderGeoFlowHtml(geoFlow)), join(dir, 'GEO-AEO-LLM-аудит-A0.pdf'), browser);
        log(`✓ GEO/AEO/LLM-аудит (PDF): GEO Score ${geoFlow.score.overall}/10, блоков ${geoFlow.blockCards.length}`);
      } catch (e) { log(`⚠️ PDF GEO/AEO/LLM-аудит не собрался (${String(e).slice(0, 120)})`); }

      // Единая система аудита — связка 6 уровней (Business → Structure → UX/UI →
      // Content → SEO → CRO): конвейер готовности, хендофы и сквозной беклог Impact×Effort.
      try {
        const chain = buildAuditChain(ds);
        await writeFile(join(dir, 'auditchain.json'), JSON.stringify(chain, null, 2), 'utf8');
        await renderPdf(cap('chain', renderAuditChainHtml(chain)), join(dir, 'Единая-система-аудита-A0.pdf'), browser);
        log(`✓ Единая система аудита (PDF): готовность ${chain.overall.value}/100, задач ${chain.backlog.length}`);
      } catch (e) { log(`⚠️ PDF Единая система аудита не собралась (${String(e).slice(0, 120)})`); }

      // Unit Economics Audit — framework + калькулятор-шаблон (100% на бизнес-данных,
      // не измеряется из обхода; числа не выдумываются).
      try {
        const ue = buildUnitEcon(ds);
        await writeFile(join(dir, 'unitecon.json'), JSON.stringify(ue, null, 2), 'utf8');
        await renderPdf(cap('unitecon', renderUnitEconHtml(ue)), join(dir, 'Unit-Economics-Audit-A0.pdf'), browser);
        log(`✓ Unit Economics Audit (PDF): метрик ${ue.decomposition.length}, единиц ${ue.units.length}`);
      } catch (e) { log(`⚠️ PDF Unit Economics не собрался (${String(e).slice(0, 120)})`); }

      // GEO / New Market Expansion — readiness framework: i18n-готовность из обхода +
      // research/intake по рынку (без выдуманных данных о спросе/экономике).
      try {
        const gx = buildGeoExpand(ds);
        await writeFile(join(dir, 'geoexpand.json'), JSON.stringify(gx, null, 2), 'utf8');
        await renderPdf(cap('geoexpand', renderGeoExpandHtml(gx)), join(dir, 'New-Market-Expansion-A0.pdf'), browser);
        log(`✓ New Market Expansion (PDF): i18n readiness ${gx.i18nReadiness.score}/10, критериев ${gx.criteria.length}`);
      } catch (e) { log(`⚠️ PDF New Market Expansion не собрался (${String(e).slice(0, 120)})`); }

      // Master Audit System — связка ВОЕДИНО: реестр всех аудитов по доменам, единый
      // стандарт (12 шагов) + карта находки (17 полей), последовательный ланцюг и
      // сквозной беклог. Главный деливерабл.
      try {
        const sys = buildAuditSystem(ds);
        await writeFile(join(dir, 'auditsystem.json'), JSON.stringify(sys, null, 2), 'utf8');
        await renderPdf(cap('auditsystem', renderAuditSystemHtml(sys)), join(dir, 'Master-Audit-System-A0.pdf'), browser);
        log(`✓ Master Audit System (PDF): аудитов ${sys.coverage.total}, задач ${sys.backlog.length}, готовность ${sys.readiness.value}/10`);
      } catch (e) { log(`⚠️ PDF Master Audit System не собрался (${String(e).slice(0, 120)})`); }

      // Commerce Intelligence Audit A0 — реконструкция бизнеса из сайта (35+ слоёв,
      // цепочки наблюдаем→дедуцируем→проверить→решение, зрелость 1–5). Флагман.
      try {
        const ci = buildIntelligence(ds);
        ciReport = ci;
        if (hasKey()) { log('· Commerce Intelligence: дедукции (Claude)…'); await narrateIntelligence(ds, ci, log); }
        await writeFile(join(dir, 'intelligence.json'), JSON.stringify(ci, null, 2), 'utf8');
        await renderPdf(cap('intelligence', renderIntelligenceHtml(ci)), join(dir, 'Commerce-Intelligence-Audit-A0.pdf'), browser);
        log(`✓ Commerce Intelligence A0 (PDF): зрелость ${ci.maturity.level}/5 «${ci.maturity.name}», слоёв ${ci.layers.length}, цепочек ${ci.chains.length}`);
      } catch (e) { log(`⚠️ Commerce Intelligence не собрался (${String(e).slice(0, 120)})`); }

      // Маркетинговые механики A0 — реестр 34 механик (AOV/retention/конверсия/доверие/охват).
      try {
        const mech = buildMechanics(ds); mechReport = mech;
        await writeFile(join(dir, 'mechanics.json'), JSON.stringify(mech, null, 2), 'utf8');
        await renderPdf(cap('mechanics', renderMechanicsHtml(mech)), join(dir, 'Маркетинговые-механики-A0.pdf'), browser);
        log(`✓ Маркетинговые механики A0 (PDF): активно ${mech.score.have}/${mech.score.measurable} (${mech.score.pct}%)`);
      } catch (e) { log(`⚠️ PDF Маркетинговые механики не собрался (${String(e).slice(0, 120)})`); }

      // Внешний контур: соцсети, инфофон бренда, отзывы (сайт + внешние площадки).
      // Внешний слой собирает Claude web_search; без ключа — честный BLOCKED-режим.
      try {
        const social = await buildSocialAudit(ds, log);
        await writeFile(join(dir, 'social.json'), JSON.stringify(social, null, 2), 'utf8');
        await renderPdf(cap('social', renderSocialHtml(social)), join(dir, 'Аудит-соцсетей-A0.pdf'), browser);
        log(`✓ Аудит соцсетей A0 (PDF): привязано ${social.linked}/${social.profiles.length}${social.searched ? ', внешний поиск выполнен' : ''}`);
      } catch (e) { log(`⚠️ Аудит соцсетей не собрался (${String(e).slice(0, 120)})`); }
      try {
        const mentions = await buildMentionsAudit(ds, log);
        await writeFile(join(dir, 'mentions.json'), JSON.stringify(mentions, null, 2), 'utf8');
        await renderPdf(cap('mentions', renderMentionsHtml(mentions)), join(dir, 'Внешний-инфофон-A0.pdf'), browser);
        log(`✓ Внешний инфофон A0 (PDF): упоминаний ${mentions.mentions.length}${mentions.searched ? '' : ' (поиск заблокирован)'}`);
      } catch (e) { log(`⚠️ Внешний инфофон не собрался (${String(e).slice(0, 120)})`); }
      try {
        const reviews = await buildReviewsAudit(ds, log);
        await writeFile(join(dir, 'reviews.json'), JSON.stringify(reviews, null, 2), 'utf8');
        await renderPdf(cap('reviews', renderReviewsHtml(reviews)), join(dir, 'Аудит-отзывов-A0.pdf'), browser);
        log(`✓ Аудит отзывов A0 (PDF): источников ${reviews.sources.length}`);
      } catch (e) { log(`⚠️ Аудит отзывов не собрался (${String(e).slice(0, 120)})`); }

      // Аудит каналов A0 — внешние сигналы каналов (A0).
      try {
        const channels = buildChannels(ds);
        await writeFile(join(dir, 'channels.json'), JSON.stringify(channels, null, 2), 'utf8');
        await renderPdf(cap('channels', renderChannelsHtml(channels)), join(dir, 'Аудит-каналов-A0.pdf'), browser);
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
        try { await renderPdf(cap('competitor', renderCompetitorHtml(bench, clientName(ds), ds.takenAt)), join(dir, 'Конкурентный-анализ-A0.pdf'), browser); }
        catch (e) { log(`⚠️ PDF Конкурентный анализ A0 не собрался (${String(e).slice(0, 120)})`); }
        log(`✓ бенчмарк: индекс клиента ${bench.clientIndex}/100, место ${bench.clientRank}/${bench.totalSites}`);
      }
    }

    // Опросник файлом (Excel/Word/PDF) → распознаём в карту ответов {qid:{answer}}.
    if (!opts.answers && opts.answersFile) {
      log(`· опитувальник файлом (${opts.answersFile.type || 'файл'}) → розпізнаю…`);
      const parsed = await parseQuestionnaireFile(opts.answersFile.path, opts.answersFile.type, log).catch((e) => { log(`⚠️ опитувальник не розібрано (${String(e).slice(0, 80)})`); return null; });
      if (parsed) opts.answers = parsed;
    }

    // PII-маскирование на входе (жёсткий контроль, не рекомендация): e-mail/телефоны
    // из ответов не попадают ни к Claude, ни в артефакты.
    if (opts.answers) {
      try {
        const { maskDeep } = await import('./pii.js');
        const masked = maskDeep(opts.answers);
        opts.answers = masked.value;
        if (masked.emails || masked.phones) log(`· PII-маскирование ответов: e-mail ${masked.emails}, телефонов ${masked.phones}`);
      } catch (e) { log(`⚠️ PII-маскирование не отработало (${String(e).slice(0, 80)})`); }
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
      await pdf(cap('maturity', renderMaturityPdf(mat, cn, D)), 'Матрица-зрелости-A0.pdf');

      // Scope программы по волнам → PDF.
      const scope = buildScope(ds, { engine, analysis: analysisResult, hasMoney: Boolean(money) });
      await writeFile(join(dir, 'scope.json'), JSON.stringify(scope, null, 2), 'utf8');
      await pdf(renderScopePdf(scope, cn, D), 'Scope-по-волнам-A0.pdf');

      // Цена в канале и роль в цепочке → PDF.
      const pc = buildPriceChannel(ds);
      await writeFile(join(dir, 'pricechannel.json'), JSON.stringify(pc, null, 2), 'utf8');
      await pdf(cap('pricechannel', renderPriceChannelPdf(pc, cn, D)), 'Цена-в-канале-A0.pdf');

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
        if (opts.premium && deadline.exceeded()) {
          log('⚠️ премиум-экспертиза пропущена: превышен лимит времени прогона (AUDIT_MAX_MINUTES)');
        } else if (opts.premium) {
          try {
            const { runExperts } = await import('./experts/runner.js');
            const { applyVerifications } = await import('./registry.js');
            const { renderPremiumHtml } = await import('./export/premiumHtml.js');
            const expertResults = await runExperts({ dataset: ds, baseFindings: registry, log, browser }, { deadline: deadline.exceeded });
            const expertInputs = expertResults.flatMap((r) => r.findings);
            if (expertInputs.length) registry = buildRegistry([...feedFromReports(registryRaw, journeyReport), ...expertInputs], { money });
            const nAdj = applyVerifications(registry, expertResults.flatMap((r) => r.verifications));
            await renderPdf(cap('premium', renderPremiumHtml(cn, ds.takenAt, expertResults)), join(dir, 'Премиум-экспертиза.pdf'), browser);
            log(`✓ Премиум-экспертиза: агентов ${expertResults.filter((r) => r.ran).length}/${expertResults.length}, находок +${expertInputs.length}, перепроверок применено ${nAdj}`);
          } catch (e) { log(`⚠️ премиум-экспертиза не отработала (${String(e).slice(0, 100)})`); }
        }
        const rs = registrySummary(registry);
        await writeFile(join(dir, 'registry.json'), JSON.stringify(registry, null, 2), 'utf8');
        await renderPdf(cap('registry', renderRegistryHtml(cn, ds.takenAt, registry)), join(dir, 'Реестр-находок.pdf'), browser);
        log(`✓ Реестр находок (PDF)${opts.premium ? ' + премиум' : ''}: ${rs.total} находок (P0 ${rs.p0} / P1 ${rs.p1} / P2 ${rs.p2}), exposure ≈ ${rs.exposureYear.toLocaleString('ru-RU')} ₴/год`);
      } catch (e) { log(`⚠️ реестр находок не собран (${String(e).slice(0, 100)})`); }

      // ── Итоговое резюме: команда / сроки / бюджет / тактика vs стратегия из реестра. ──
      if (registry?.length) {
        try {
          const { buildEngagement, renderEngagementHtml } = await import('./engagement.js');
          const eng = buildEngagement(cn, ds.takenAt, registry);
          await renderPdf(cap('engagement', renderEngagementHtml(eng)), join(dir, 'Итоговое-резюме.pdf'), browser);
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
      await pdf(cap('causal', renderCausalPdf(causal, cn, D)), 'Причинно-следственная-карта-A0.pdf');
      log(`✓ метод-документы (PDF): зрелость (набл. ${mat.observedAvg ?? '—'}/5), scope (${scope.waves.reduce((n, w) => n + w.items.length, 0)} активаций), цена в канале`);

      const cov = buildCoverage(ds, { hasEngine: Boolean(engine), hasMoney: Boolean(money), findings: registry ?? [] });
      metrics.confidence = { score: cov.confidence.score, base: cov.confidence.base };
      await writeFile(join(dir, 'coverage.json'), JSON.stringify(cov, null, 2), 'utf8');
      await pdf(renderCoveragePdf(cov, cn, D), 'Охват-и-уверенность-A0.pdf');
      log(`✓ охват аудита + Confidence Score ${cov.confidence.score}/${cov.confidence.base} (${cov.confidence.band})`);

      // Executive Diagnostic A0 — зонтичный клиентский PDF, сводит все аудиты (A0 §13).
      try {
        const execHtml = cap('exec', renderExecDiagnostic(ds, { siteAudit, analysis: analysisResult, engine, money, bench, coverage: cov, registry: registry ?? [] }));
        await renderPdf(execHtml, join(dir, 'Executive-Diagnostic-A0.pdf'), browser);
        log('✓ Executive Diagnostic A0 (PDF): зонтичный отчёт собран');
      } catch (e) { log(`⚠️ Executive Diagnostic не собрался (${String(e).slice(0, 120)}) — остальные материалы не затронуты`); }

      // ФЛАГМАН: «Презентація аудиту» — консультационная арка к решению, со всеми
      // данными (блок А: конкуренты/SEO/journey/механики/контент; блок Б: ресёрч
      // целевого состояния, экономика, GEO). Ведёт собственника к решению.
      if (siteAudit) try {
        const gaps = [
          ...siteAudit.pages.flatMap((p) => p.rows.filter((b) => b.state === 'gap' && b.weight !== 'nice').map((b) => `${p.title}: ${b.name}`)).slice(0, 6),
          ...siteAudit.pageTypes.filter((t) => t.mandatory && t.status === 'не найдена').map((t) => `немає сторінки ${t.label}`).slice(0, 3),
        ];
        // Ресёрч целевого состояния — конструктивная секция «як має бути». НЕ гейтим
        // дедлайном (у web-поиска свой таймаут); иначе на tier-2 он вечно срезался
        // последним. Если не соберётся — презентация покажет честную пометку.
        let research = null;
        if (hasKey()) {
          log('· ресёрч целевого состояния (тренды/конкуренты ниши)…');
          research = await researchTargetState(siteAudit.client, gaps, siteAudit.stack?.cms ?? null, log).catch(() => null);
        }
        const presHtml = renderPresentation(siteAudit, {
          bench, seo: seoReport, journey: journeyReport, mech: mechReport, content: contentReport,
          maturity: ciReport ? { level: ciReport.maturity.level, name: ciReport.maturity.name } : null,
          money, geo: ds.client.ai ?? null, research,
        });
        await renderPdf(cap('presentation', presHtml), join(dir, '0-Презентація-аудиту.pdf'), browser);
        log('✓ Презентація аудиту (флагман пакета) собрана');
      } catch (e) { log(`⚠️ Презентація аудиту не собралась (${String(e).slice(0, 120)})`); }

      // Слой синтеза — взаимосвязи всех линз в один вывод (нужен ключ).
      if (hasKey() && deadline.exceeded()) {
        log('⚠️ синтез и КП пропущены: превышен лимит времени прогона (AUDIT_MAX_MINUTES)');
      } else if (hasKey()) {
        log('· синтез всех линз…');
        const synth = await narrateSynthesis(ds, { uxui, proto, bench, maturity: mat, scope, causal, money, engine, coverage: cov });
        if (synth) {
          await writeFile(join(dir, 'synthesis.json'), JSON.stringify(synth, null, 2), 'utf8');
          await pdf(cap('synthesis', renderSynthesisPdf(synth, cn, D)), 'Синтез-аудита-A0.pdf');
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
        await renderPdf(cap('backlog', renderBacklogHtml(backlog)), join(dir, 'Сводный-бэклог.pdf'), browser);
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

    // ── ГРУПУВАННЯ: 5 тематичних розділів + головний висновок з усіх лінз. ──
    // Клієнт отримує цілісні документи, а не 26 розрізнених. Окремі лінзи лишаються
    // на диску (внутрішній архів). Порожні теми композер відсіює сам.
    if (!prelaunch) {
      try {
        const { buildClientDocuments } = await import('./export/documents.js');
        const clientDocs = buildClientDocuments(lensHtml, { verdicts: {
          experience: siteAudit?.verdict,
          traffic: techReport?.verdict,
        } });
        for (const d of clientDocs) {
          try { await renderPdf(d.html, join(dir, d.file), browser); }
          catch (e) { log(`⚠️ ${d.file}: ${String(e).slice(0, 80)}`); }
        }
        log(`✓ клієнтський пакет: ${clientDocs.length} тематичних документів (розділи + висновок)`);
      } catch (e) { log(`⚠️ групування документів не зібралось (${String(e).slice(0, 120)})`); }
    }

    const files = (await readdir(dir)).sort();
    const cs = client.pages.filter((p) => p.score !== null);
    metrics.compliance = cs.length ? Math.round(cs.reduce((s, p) => s + (p.score ?? 0), 0) / cs.length) : null;

    // ── META-AUDIT + QUALITY GATE: система проверяет САМ результат аудита. ──
    // Считает качество (ARS/Evidence Debt/Coverage) и прогоняет батарею гейтов;
    // критический провал = выдача блокируется. См. data room: 36-closing-the-loop.
    try {
      if (registry && registry.length) {
        const { buildQualitySummary } = await import('./quality.js');
        const { runMetaAudit } = await import('./metaaudit.js');
        const { moduleStatusFromFiles } = await import('./runrecord.js');
        const { METHODOLOGY_VERSION } = await import('./version.js');
        const q = buildQualitySummary(registry, { reachabilityPassed: !prelaunch });
        const { executed } = moduleStatusFromFiles(files);
        const meta = runMetaAudit({
          tier, prelaunch, findings: registry, quality: q, reachabilityPassed: !prelaunch,
          pagesCrawled: client.pages.filter((p) => !p.error).length,
          modulesExecuted: executed, modulesFailed: [], reportFiles: files,
          requiredReports: ['Презентація', 'Сводный-бэклог', 'Протокол-синергии'],
          methodologyVersion: METHODOLOGY_VERSION, money,
          brokenLinks: (ds.client as { linkHealth?: { broken?: unknown[] } })?.linkHealth?.broken?.length ?? null,
          evidenceCoverageTarget: 0.6,
        });
        await writeFile(join(dir, 'quality.json'), JSON.stringify(q, null, 2), 'utf8');
        await writeFile(join(dir, 'meta-audit.json'), JSON.stringify(meta, null, 2), 'utf8');
        (metrics as Record<string, unknown>).qaGate = meta.decision;
        (metrics as Record<string, unknown>).ars = q.ars.provisional;
        (metrics as Record<string, unknown>).evidenceDebt = q.evidenceDebt.debtRatio;
        const icon = meta.decision === 'BLOCK' ? '⛔' : meta.decision === 'DELIVER_WITH_WARNINGS' ? '🟡' : '✅';
        log(`${icon} Meta-Audit / Quality Gate: ${meta.decision} · ARS ${q.ars.provisional ?? '—'}/100 · блокеров ${meta.blockers.length}, предупреждений ${meta.warnings.length}`);
      }
    } catch (e) { log(`⚠️ Meta-Audit не отработал (${String(e).slice(0, 140)})`); }

    // ── AUDIT RUN RECORD: воспроизводимость и трассируемость прогона. ──
    // Штампует версию методологии/движка/модели, снимок входа (+hash), статусы модулей,
    // счётчики находок, покрытие доказательствами, стоимость токенов. См. data room: 18.
    try {
      const { buildRunRecord } = await import('./runrecord.js');
      const reg = registry ?? [];
      const withEvidence = reg.filter((f) => f.evidence && (f.evidence.url || f.evidence.dom || f.evidence.test || f.evidence.screenshot)).length;
      const avgConf = reg.length ? Math.round((reg.reduce((s, f) => s + f.confidence, 0) / reg.length) * 100) / 100 : null;
      const compPages = (comps as { pages?: { error?: unknown }[] }[]).reduce((s, c) => s + (c?.pages?.filter((p) => !p.error).length ?? 0), 0);
      const snap = { site: site || null, tier, takenAt: ds.takenAt, pages: client.pages.map((p) => ({ url: p.url, score: p.score })) };
      const rr = buildRunRecord({
        auditId: id, client: clientName(ds), tier, takenAt: ds.takenAt,
        generatedAt: new Date().toISOString(), durationMs: Date.now() - t0,
        config: {
          agentic: Boolean(opts.agentic), prelaunch, premium: Boolean(opts.premium),
          webSearch: process.env.AUDIT_WEB_SEARCH !== '0', hasApiKey: hasKey(),
        },
        input: {
          site: site || null, competitors: comps.length,
          pagesCrawled: client.pages.filter((p) => !p.error).length, competitorPagesCrawled: compPages,
          backupScreenshots: Boolean((opts as Record<string, unknown>).backupPdf || (opts as Record<string, unknown>).backupFiles || (opts as Record<string, unknown>).uploadBatch),
          answersProvided: Boolean(opts.answers), dataSnapshot: snap,
        },
        files,
        findings: reg.length ? {
          total: reg.length,
          p0: reg.filter((f) => f.priority === 'P0').length,
          p1: reg.filter((f) => f.priority === 'P1').length,
          p2: reg.filter((f) => f.priority === 'P2').length,
          evidenceCoverage: Math.round((withEvidence / reg.length) * 100) / 100,
          avgConfidence: avgConf,
        } : {},
        metrics: metrics as unknown as Record<string, unknown>,
        usage: getUsage(),
      });
      await writeFile(join(dir, 'audit-run-record.json'), JSON.stringify(rr, null, 2), 'utf8');
      log(`✓ Audit Run Record: методология ${rr.methodologyVersion}, модулей вып. ${rr.modules.executed.length}, находок ${rr.findings.total}, evidence-покрытие ${rr.findings.evidenceCoverage ?? '—'}`);
    } catch (e) { log(`⚠️ Audit Run Record не собрался (${String(e).slice(0, 140)})`); }

    const parts = [`${files.length} файлов`];
    if (metrics.compliance != null) parts.push(`соответствие ${metrics.compliance}%`);
    if (engine?.score != null) parts.push(`Health Score ${engine.score}/100`);
    if (money) parts.push(`недополучено ≈ ${Math.round(money.potentialYear).toLocaleString('ru-RU')} ₴/год`);
    // Компактный список находок для human-in-the-loop ревью в админке (замыкание
    // цикла обучения): id/домен/ключ/тема/уверенность/приоритет, топ по приоритету.
    const pri = { P0: 0, P1: 1, P2: 2 } as Record<string, number>;
    const reviewable = (registry ?? [])
      .map((f) => ({ id: f.id, domain: f.domain, key: f.key, title: f.title, confidence: f.confidence, priority: f.priority }))
      .sort((a, b) => (pri[a.priority] - pri[b.priority]) || (b.confidence - a.confidence))
      .slice(0, 60);
    return { id, dir, summary: parts.join(' · '), files, metrics, maturity: maturityReport, findings: reviewable };
  } finally {
    await browser.close().catch(() => {});
    await closePdfBrowser();
  }
}
