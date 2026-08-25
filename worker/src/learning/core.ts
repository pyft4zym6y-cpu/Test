/**
 * LEARNING CORE — превращает накопленный леджер в знание:
 *  1) калибровка confidence (predicted ↔ actual) + ECE + функция calibratedConfidence;
 *  2) паттерны (частые подтверждаемые находки) и антипаттерны (частые ложные);
 *  3) эмпирические распределения бенчмарков (percentiles) из наблюдений обхода;
 *  4) предложения по методологии (не авто-применяются — это Change Requests);
 *  5) кандидат в golden-кейс из провалидированного прогона (замыкание в regression).
 * Всё детерминированно, с числом наблюдений (n). Порог достаточности честно помечается.
 */
import {
  LearningSnapshotSchema, type LedgerEntry, type LearningSnapshot,
  type Calibration, type Pattern, type BenchmarkDistribution, type MethodologySuggestion,
} from './schema.js';

const MIN_CALIBRATION_N = 30;
const MIN_PATTERN_SUPPORT = 3;
const MIN_BENCHMARK_N = 5;

const isCorrect = (e: LedgerEntry) => e.review.verdict === 'accepted' || e.review.verdict === 'corrected';
const norm = (s: string) => s.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, ' ').trim();

/* ── 1 · Калибровка confidence ── */
export function calibrate(entries: LedgerEntry[]): Calibration {
  const reviewed = entries.filter((e) => e.review.verdict !== undefined);
  const N = reviewed.length;
  const bins: Calibration['bins'] = [];
  for (let i = 0; i < 10; i++) {
    const lo = i / 10, hi = (i + 1) / 10;
    const inBin = reviewed.filter((e) => e.predictedConfidence >= lo && (i === 9 ? e.predictedConfidence <= hi : e.predictedConfidence < hi));
    const n = inBin.length;
    bins.push({
      lo, hi, n,
      avgPredicted: n ? round(inBin.reduce((s, e) => s + e.predictedConfidence, 0) / n) : null,
      actualAccuracy: n ? round(inBin.filter(isCorrect).length / n) : null,
    });
  }
  const nonEmpty = bins.filter((b) => b.n > 0);
  const ece = N ? round(nonEmpty.reduce((s, b) => s + (b.n / N) * Math.abs((b.avgPredicted ?? 0) - (b.actualAccuracy ?? 0)), 0)) : null;
  const reliable = N >= MIN_CALIBRATION_N;
  return {
    n: N, bins, ece, reliable,
    note: reliable
      ? `Калибровка по ${N} проверенным находкам. ECE=${ece} (0 — идеально). confidence можно калибровать calibratedConfidence().`
      : `Недостаточно данных для надёжной калибровки: ${N}/${MIN_CALIBRATION_N}. Кривая справочная; calibratedConfidence вернёт исходное значение.`,
  };
}

/** Калиброванная уверенность: маппинг сырой confidence → эмпирическая точность корзины
 *  (кусочно-линейно по серединам непустых корзин). При недостатке данных — возврат raw. */
export function calibratedConfidence(raw: number, cal: Calibration): number {
  if (!cal.reliable) return raw;
  const pts = cal.bins.filter((b) => b.n > 0 && b.actualAccuracy != null)
    .map((b) => ({ x: (b.avgPredicted ?? (b.lo + b.hi) / 2), y: b.actualAccuracy! }))
    .sort((a, b) => a.x - b.x);
  if (pts.length === 0) return raw;
  if (raw <= pts[0].x) return clamp(pts[0].y);
  if (raw >= pts[pts.length - 1].x) return clamp(pts[pts.length - 1].y);
  for (let i = 1; i < pts.length; i++) {
    if (raw <= pts[i].x) {
      const a = pts[i - 1], b = pts[i];
      const t = (raw - a.x) / (b.x - a.x || 1);
      return clamp(round(a.y + t * (b.y - a.y)));
    }
  }
  return raw;
}

/* ── 2 · Паттерны и антипаттерны ── */
export function minePatterns(entries: LedgerEntry[]): { patterns: Pattern[]; antiPatterns: Pattern[] } {
  const groups = new Map<string, LedgerEntry[]>();
  for (const e of entries) {
    const sig = `${e.domain}::${e.key ? e.key.toLowerCase() : norm(e.theme ?? '')}`;
    (groups.get(sig) ?? groups.set(sig, []).get(sig)!).push(e);
  }
  const all: Pattern[] = [];
  for (const [signature, list] of groups) {
    const support = list.length;
    if (support < MIN_PATTERN_SUPPORT) continue;
    all.push({
      signature,
      domain: list[0].domain,
      theme: list[0].theme ?? signature,
      support,
      acceptRate: round(list.filter(isCorrect).length / support),
      avgConfidence: round(list.reduce((s, e) => s + e.predictedConfidence, 0) / support),
    });
  }
  return {
    patterns: all.filter((p) => p.acceptRate >= 0.6).sort((a, b) => b.support - a.support),
    antiPatterns: all.filter((p) => p.acceptRate <= 0.4).sort((a, b) => b.support - a.support),
  };
}

/* ── 3 · Эмпирические распределения бенчмарков ── */
export function aggregateBenchmarks(entries: LedgerEntry[]): BenchmarkDistribution[] {
  const numeric = new Map<string, number[]>();
  const boolean = new Map<string, boolean[]>();
  for (const e of entries) {
    for (const [k, v] of Object.entries(e.observations)) {
      if (typeof v === 'number') (numeric.get(k) ?? numeric.set(k, []).get(k)!).push(v);
      else if (typeof v === 'boolean') (boolean.get(k) ?? boolean.set(k, []).get(k)!).push(v);
    }
  }
  const out: BenchmarkDistribution[] = [];
  for (const [metric, vals] of numeric) {
    if (vals.length < MIN_BENCHMARK_N) continue;
    const s = [...vals].sort((a, b) => a - b);
    out.push({
      metric, kind: 'numeric', n: s.length,
      min: s[0], p25: pct(s, 0.25), median: pct(s, 0.5), p75: pct(s, 0.75), max: s[s.length - 1],
      mean: round(s.reduce((a, b) => a + b, 0) / s.length), shareTrue: null,
    });
  }
  for (const [metric, vals] of boolean) {
    if (vals.length < MIN_BENCHMARK_N) continue;
    out.push({
      metric, kind: 'boolean', n: vals.length,
      min: null, p25: null, median: null, p75: null, max: null, mean: null,
      shareTrue: round(vals.filter(Boolean).length / vals.length),
    });
  }
  return out.sort((a, b) => b.n - a.n);
}

/** Перцентиль клиента в накопленном распределении (для Benchmark Intelligence). */
export function clientPercentile(value: number, dist: BenchmarkDistribution): number | null {
  if (dist.kind !== 'numeric' || dist.n === 0) return null;
  // приблизительно по 5 опорным точкам (min/p25/median/p75/max)
  const pts = [[dist.min!, 0], [dist.p25!, 25], [dist.median!, 50], [dist.p75!, 75], [dist.max!, 100]] as [number, number][];
  if (value <= pts[0][0]) return 0;
  if (value >= pts[4][0]) return 100;
  for (let i = 1; i < pts.length; i++) {
    if (value <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return Math.round(y0 + ((value - x0) / (x1 - x0 || 1)) * (y1 - y0));
    }
  }
  return null;
}

/* ── 4 · Предложения по методологии (Change Requests, не авто-применение) ── */
function suggest(entries: LedgerEntry[], cal: Calibration, patterns: Pattern[], anti: Pattern[]): MethodologySuggestion[] {
  const s: MethodologySuggestion[] = [];
  for (const a of anti.slice(0, 10)) s.push({ kind: 'suppress-antipattern', target: a.signature, rationale: `Ложные срабатывания: acceptRate ${a.acceptRate} при support ${a.support}. Кандидат на ужесточение проверки/подавление.`, evidenceN: a.support });
  for (const p of patterns.slice(0, 5)) s.push({ kind: 'promote-pattern', target: p.signature, rationale: `Устойчиво подтверждается (acceptRate ${p.acceptRate}, support ${p.support}). Кандидат в first-class проверку/бенчмарк.`, evidenceN: p.support });
  if (cal.reliable && cal.ece != null && cal.ece > 0.1) s.push({ kind: 'recalibrate', target: 'confidence', rationale: `ECE ${cal.ece} > 0.10 — модель мискалибрована; применять calibratedConfidence() и пересмотреть веса уверенности.`, evidenceN: cal.n });
  for (const b of cal.bins.filter((x) => x.n >= 5 && x.avgPredicted != null && x.actualAccuracy != null && (x.avgPredicted - x.actualAccuracy) > 0.15))
    s.push({ kind: 'tighten-check', target: `confidence-bin ${Math.round(b.lo * 100)}–${Math.round(b.hi * 100)}%`, rationale: `Переуверенность: предсказано ${b.avgPredicted}, реально ${b.actualAccuracy} (n=${b.n}).`, evidenceN: b.n });
  return s;
}

/* ── 5 · Снимок обучения ── */
export function buildLearningSnapshot(entries: LedgerEntry[], generatedAt: string): LearningSnapshot {
  const cal = calibrate(entries);
  const { patterns, antiPatterns } = minePatterns(entries);
  const benchmarkDistributions = aggregateBenchmarks(entries);
  const suggestions = suggest(entries, cal, patterns, antiPatterns);
  const distinctAudits = new Set(entries.map((e) => e.auditId)).size;
  // кандидат в golden — прогон, где ≥5 находок провалидированы (accepted/rejected)
  const byAudit = new Map<string, LedgerEntry[]>();
  for (const e of entries) (byAudit.get(e.auditId) ?? byAudit.set(e.auditId, []).get(e.auditId)!).push(e);
  const goldenCandidateCount = [...byAudit.values()].filter((l) => l.length >= 5).length;
  return LearningSnapshotSchema.parse({
    generatedAt, ledgerEntries: entries.length, distinctAudits,
    calibration: cal, patterns, antiPatterns, benchmarkDistributions, suggestions, goldenCandidateCount,
    note: `Learning Core: ${entries.length} записей, ${distinctAudits} аудитов. Калибровка ${cal.reliable ? 'надёжна' : 'справочна'}; паттернов ${patterns.length}, антипаттернов ${antiPatterns.length}, распределений ${benchmarkDistributions.length}, предложений ${suggestions.length}.`,
  });
}

/* ── golden-кандидат из провалидированного прогона ── */
export function goldenCandidateFromRun(auditId: string, entries: LedgerEntry[], reviewer: string, methodologyVersion: string) {
  const forRun = entries.filter((e) => e.auditId === auditId);
  const accepted = forRun.filter(isCorrect);
  const rejected = forRun.filter((e) => e.review.verdict === 'rejected');
  const themes = (list: LedgerEntry[]) => [...new Set(list.map((e) => e.theme).filter(Boolean))] as string[];
  const obs = forRun[0]?.observations ?? {};
  return {
    caseId: `GC-auto-${auditId.slice(0, 20)}`,
    title: `Авто-кейс из провалидированного прогона ${auditId}`,
    anonymized: true,
    input: { site: 'https://redacted.test/', tier: 1, mode: 'external-crawl', note: 'Авто-сгенерирован Learning Core из провалидированного человеком прогона.' },
    expectedObservations: Object.entries(obs).map(([key, expected]) => ({ key, expected, tolerance: null, verified: true, source: 'провалидированный прогон' })),
    expectedMetrics: { compliance: null, findingsTotal: { min: Math.max(1, accepted.length - 3), max: accepted.length + 5 }, p0: null, evidenceCoverage: null },
    expectedFindings: themes(accepted).map((t) => ({ theme: t, minCount: 1, priorityAtLeast: null, mustHaveEvidence: true })),
    mustNotContain: themes(rejected),
    baseline: { capturedFromRunId: auditId, capturedAt: null, methodologyVersion, reviewer },
  };
}

const round = (n: number) => Math.round(n * 1000) / 1000;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
function pct(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return round(lo === hi ? sorted[lo] : sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]));
}
