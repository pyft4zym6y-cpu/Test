/**
 * META-AUDIT + QUALITY GATE — «20-й аудитор», который проверяет не клиента, а САМ
 * результат аудита, и физический барьер выдачи.
 *
 * Замечания внешнего аудита: после 19 линз система должна сама проверить полноту,
 * доказательность, противоречия, дедуп, соответствие severity↔evidence, экономику,
 * презентацию — и НЕ выдавать аудит, пока не пройдены обязательные гейты. Детерминированно,
 * без Claude. Дополняет существующий self-QA, превращая его в формальный gate.
 *
 * Гейты: DATA → EVIDENCE → COVERAGE → CONSISTENCY → ECONOMIC → METHODOLOGY → AI-QUALITY →
 * PRESENTATION → (HUMAN REVIEW → APPROVAL — ручные, фиксируются в Run Record.review).
 */
import type { Finding } from './registry.js';
import type { QualitySummary } from './quality.js';

export type GateName =
  | 'DATA' | 'EVIDENCE' | 'COVERAGE' | 'CONSISTENCY' | 'ECONOMIC'
  | 'METHODOLOGY' | 'AI-QUALITY' | 'PRESENTATION';
export type Severity = 'critical' | 'warn' | 'info';

export type Check = { id: string; gate: GateName; severity: Severity; pass: boolean; detail: string };
export type GateResult = { gate: GateName; status: 'PASS' | 'WARN' | 'FAIL'; checks: Check[] };
export type MetaAuditReport = {
  decision: 'DELIVER' | 'DELIVER_WITH_WARNINGS' | 'BLOCK';
  gates: GateResult[];
  blockers: Check[];
  warnings: Check[];
  duplicateCandidates: { key: string; domains: string[]; ids: string[] }[];
  summary: string;
};

export type MetaAuditContext = {
  tier: number;
  prelaunch: boolean;
  findings: Finding[];
  quality: QualitySummary;
  reachabilityPassed: boolean;
  pagesCrawled: number;
  modulesExecuted: string[];
  modulesFailed: string[];
  expectedModules?: string[];
  reportFiles: string[]; // basenames present in run dir
  requiredReports?: string[]; // подстроки обязательных отчётов
  methodologyVersion?: string | null;
  money?: { potentialYear: number } | null;
  brokenLinks?: number | null;
  arsTarget?: number; // порог release gate (по умолчанию не блокирует, warn)
  evidenceCoverageTarget?: number;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, ' ').trim();

export function runMetaAudit(ctx: MetaAuditContext): MetaAuditReport {
  const checks: Check[] = [];
  const add = (id: string, gate: GateName, severity: Severity, pass: boolean, detail: string) =>
    checks.push({ id, gate, severity, pass, detail });

  const f = ctx.findings;
  const evCov = ctx.quality.evidenceDebt.total ? ctx.quality.ars.components.evidenceCoverage ?? 0 : 0;
  const evTarget = ctx.evidenceCoverageTarget ?? 0.6;

  /* ── DATA ── */
  add('data.reachable', 'DATA', 'critical', ctx.prelaunch || ctx.reachabilityPassed,
    ctx.reachabilityPassed ? 'сайт достижим / есть резервные скриншоты' : 'сайт недостижим и нет резерва — прогон не должен порождать находки');
  add('data.pages', 'DATA', 'critical', ctx.prelaunch || ctx.pagesCrawled > 0,
    `страниц обойдено: ${ctx.pagesCrawled}`);

  /* ── EVIDENCE ── */
  add('evidence.coverage', 'EVIDENCE', evCov < 0.3 ? 'critical' : 'warn', evCov >= evTarget,
    `evidence-покрытие ${Math.round(evCov * 100)}% (порог ${Math.round(evTarget * 100)}%)`);
  const p0NoEvidence = f.filter((x) => x.priority === 'P0' && !(x.evidence && (x.evidence.url || x.evidence.dom || x.evidence.test || x.evidence.screenshot)));
  add('evidence.p0-backed', 'EVIDENCE', 'critical', p0NoEvidence.length === 0,
    p0NoEvidence.length ? `P0 без доказательства: ${p0NoEvidence.length} (${p0NoEvidence.slice(0, 3).map((x) => x.id).join(', ')})` : 'все P0 имеют доказательство');
  add('evidence.debt', 'EVIDENCE', 'info', true,
    `Evidence Debt: full ${ctx.quality.evidenceDebt.full} · partial ${ctx.quality.evidenceDebt.partial} · hypothesis ${ctx.quality.evidenceDebt.hypothesis} (debtRatio ${ctx.quality.evidenceDebt.debtRatio})`);

  /* ── COVERAGE ── */
  const missing = (ctx.expectedModules ?? []).filter((m) => !ctx.modulesExecuted.includes(m));
  add('coverage.modules', 'COVERAGE', 'warn', missing.length === 0,
    missing.length ? `не выполнены модули: ${missing.join(', ')}` : `модулей выполнено: ${ctx.modulesExecuted.length}`);
  add('coverage.failed', 'COVERAGE', ctx.modulesFailed.length > 3 ? 'critical' : 'warn', ctx.modulesFailed.length === 0,
    ctx.modulesFailed.length ? `упавшие модули: ${ctx.modulesFailed.join(', ')}` : 'упавших модулей нет');
  add('coverage.findings', 'COVERAGE', 'critical', ctx.prelaunch || f.length > 0, `находок в реестре: ${f.length}`);

  /* ── CONSISTENCY ── */
  const ids = f.map((x) => x.id);
  const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  add('consistency.unique-ids', 'CONSISTENCY', 'critical', dupIds.length === 0,
    dupIds.length ? `дублирующиеся ID: ${[...new Set(dupIds)].join(', ')}` : 'ID уникальны');
  // severity ↔ evidence: P0 при низкой уверенности — подозрительно
  const p0LowConf = f.filter((x) => x.priority === 'P0' && x.confidence < 0.5);
  add('consistency.severity-evidence', 'CONSISTENCY', 'warn', p0LowConf.length === 0,
    p0LowConf.length ? `P0 при уверенности <0.5: ${p0LowConf.length}` : 'severity согласован с уверенностью');
  // циклы в dependsOn
  add('consistency.no-cycles', 'CONSISTENCY', 'warn', !hasDependencyCycle(f), 'зависимости находок без циклов');

  /* ── ECONOMIC ── */
  const exposure = f.reduce((s, x) => s + (x.revenueExposure || 0), 0);
  const potential = ctx.money?.potentialYear ?? null;
  const econOk = exposure >= 0 && (potential == null || exposure <= potential * 1.05);
  add('economic.exposure-sane', 'ECONOMIC', 'warn', econOk,
    potential != null ? `Σ exposure ${Math.round(exposure).toLocaleString('ru-RU')} ≤ потенциал ${Math.round(potential).toLocaleString('ru-RU')} ₴/год` : `Σ exposure ${Math.round(exposure).toLocaleString('ru-RU')} ₴/год (потенциал не задан)`);
  add('economic.no-nan', 'ECONOMIC', 'critical', f.every((x) => Number.isFinite(x.revenueExposure) && Number.isFinite(x.priorityScore)),
    'денежные поля находок конечны (нет NaN/Inf)');

  /* ── METHODOLOGY ── */
  add('methodology.version', 'METHODOLOGY', 'warn', Boolean(ctx.methodologyVersion),
    ctx.methodologyVersion ? `версия методологии: ${ctx.methodologyVersion}` : 'версия методологии не проставлена');

  /* ── AI-QUALITY ── */
  const ars = ctx.quality.ars.provisional;
  const arsTarget = ctx.arsTarget ?? null;
  add('ai.ars', 'AI-QUALITY', 'warn', arsTarget == null || (ars != null && ars >= arsTarget),
    ars != null ? `provisional ARS ${ars}/100 (измерено веса ${Math.round(ctx.quality.ars.measuredWeight * 100)}%${arsTarget != null ? `, порог ${arsTarget}` : ''})` : 'ARS не посчитан (нет находок)');
  // «галлюцинация денег»: находка утверждает измеренные деньги на низком тире без данных
  const moneyClaims = f.filter((x) => ctx.tier < 3 && /\b(грн|₴|\$|€|\d{4,})\b/.test(`${x.as_is ?? ''} ${x.title}`) && /измерен|факт|составля|потер[яи]/i.test(`${x.as_is ?? ''} ${x.title}`));
  add('ai.no-fabricated-money', 'AI-QUALITY', 'warn', moneyClaims.length === 0,
    moneyClaims.length ? `подозрение на измеренные деньги без данных (T${ctx.tier}): ${moneyClaims.length}` : 'нет утверждений измеренных денег без данных');

  /* ── PRESENTATION ── */
  for (const req of ctx.requiredReports ?? []) {
    const present = ctx.reportFiles.some((x) => norm(x).includes(norm(req)));
    add(`presentation.has:${req}`, 'PRESENTATION', 'warn', present, present ? `есть: ${req}` : `отсутствует обязательный отчёт: ${req}`);
  }
  if (ctx.brokenLinks != null) add('presentation.broken-links', 'PRESENTATION', 'info', ctx.brokenLinks === 0, `битых ссылок на сайте: ${ctx.brokenLinks}`);

  /* ── дубликаты-кандидаты (кросс-модульный дедуп) ── */
  const byKey = new Map<string, Finding[]>();
  for (const x of f) { const k = x.key ? x.key.toLowerCase() : norm(x.title); (byKey.get(k) ?? byKey.set(k, []).get(k)!).push(x); }
  const duplicateCandidates = [...byKey.entries()]
    .filter(([, list]) => new Set(list.map((x) => x.domain)).size > 1)
    .map(([key, list]) => ({ key, domains: [...new Set(list.map((x) => x.domain))], ids: list.map((x) => x.id) }));

  /* ── свод по гейтам ── */
  const gateNames: GateName[] = ['DATA', 'EVIDENCE', 'COVERAGE', 'CONSISTENCY', 'ECONOMIC', 'METHODOLOGY', 'AI-QUALITY', 'PRESENTATION'];
  const gates: GateResult[] = gateNames.map((gate) => {
    const gc = checks.filter((c) => c.gate === gate);
    const critFail = gc.some((c) => !c.pass && c.severity === 'critical');
    const warnFail = gc.some((c) => !c.pass && c.severity === 'warn');
    return { gate, status: critFail ? 'FAIL' : warnFail ? 'WARN' : 'PASS', checks: gc };
  });

  const blockers = checks.filter((c) => !c.pass && c.severity === 'critical');
  const warnings = checks.filter((c) => !c.pass && c.severity === 'warn');
  const decision: MetaAuditReport['decision'] = blockers.length ? 'BLOCK' : warnings.length ? 'DELIVER_WITH_WARNINGS' : 'DELIVER';
  const summary = decision === 'BLOCK'
    ? `ВЫДАЧА ЗАБЛОКИРОВАНА: критических провалов ${blockers.length} (${blockers.map((b) => b.id).join(', ')})`
    : decision === 'DELIVER_WITH_WARNINGS'
      ? `Можно выдавать с оговорками: предупреждений ${warnings.length}. Требуется human review/approval.`
      : 'Все автоматические гейты пройдены. Требуется финальный human review/approval.';

  return { decision, gates, blockers, warnings, duplicateCandidates, summary };
}

function hasDependencyCycle(f: Finding[]): boolean {
  const byId = new Map(f.map((x) => [x.id, x.dependsOn ?? []]));
  const state = new Map<string, 0 | 1 | 2>();
  const dfs = (id: string): boolean => {
    if (state.get(id) === 1) return true;
    if (state.get(id) === 2) return false;
    state.set(id, 1);
    for (const dep of byId.get(id) ?? []) { if (byId.has(dep) && dfs(dep)) return true; }
    state.set(id, 2);
    return false;
  };
  for (const id of byId.keys()) if (dfs(id)) return true;
  return false;
}
