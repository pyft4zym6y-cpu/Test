/**
 * QUALITY ENGINE — измеряемые показатели качества прогона на реестре находок.
 *
 * Замечания внешнего аудита: ARS должен считаться на реальном прогоне; нужны Evidence
 * Debt, Coverage Map, Audit Reliability Score (provisional — то, что измеримо
 * детерминированно; FP/FN/human — из golden/ревью). Всё честно: помечаем, что измерено,
 * а что pending. Кормит Audit Run Record и Meta-Audit / Quality Gate.
 */
import type { Finding, EvidenceLevel } from './registry.js';

const EVIDENCE_W: Record<EvidenceLevel, number> = { E1: 0.55, E2: 0.72, E3: 0.88, E4: 1.0 };

const hasRef = (f: Finding): boolean =>
  Boolean(f.evidence && (f.evidence.url || f.evidence.dom || f.evidence.test || f.evidence.screenshot));

export type EvidenceClass = 'full' | 'partial' | 'hypothesis';

/** Классификация находки по полноте доказательства. */
export function classifyEvidence(f: Finding): EvidenceClass {
  const lvl = f.evidenceLevel;
  const strong = lvl === 'E3' || lvl === 'E4';
  if (strong && hasRef(f)) return 'full';
  if (hasRef(f) || lvl === 'E2' || lvl === 'E3') return 'partial';
  return 'hypothesis';
}

export type EvidenceDebt = {
  total: number; full: number; partial: number; hypothesis: number;
  debtRatio: number;        // (0.5·partial + hypothesis) / total, 0..1 — «долг доказательств»
  fullyEvidencedRate: number; // full / total
};

export function evidenceDebt(findings: Finding[]): EvidenceDebt {
  const total = findings.length || 1;
  let full = 0, partial = 0, hypothesis = 0;
  for (const f of findings) {
    const c = classifyEvidence(f);
    if (c === 'full') full++; else if (c === 'partial') partial++; else hypothesis++;
  }
  return {
    total: findings.length, full, partial, hypothesis,
    debtRatio: Math.round(((0.5 * partial + hypothesis) / total) * 100) / 100,
    fullyEvidencedRate: Math.round((full / total) * 100) / 100,
  };
}

export type DomainCoverage = {
  domain: string; count: number;
  evidenceCoverage: number; // доля с evidence-ref
  strongEvidence: number;   // доля E3/E4
  avgConfidence: number;    // средняя уверенность
};

/** Карта покрытия по доменам: где проверено глубоко, где поверхностно. */
export function coverageMap(findings: Finding[]): DomainCoverage[] {
  const byDomain = new Map<string, Finding[]>();
  for (const f of findings) {
    const d = f.domain || 'unknown';
    (byDomain.get(d) ?? byDomain.set(d, []).get(d)!).push(f);
  }
  const rows: DomainCoverage[] = [];
  for (const [domain, list] of byDomain) {
    const n = list.length;
    rows.push({
      domain, count: n,
      evidenceCoverage: Math.round((list.filter(hasRef).length / n) * 100) / 100,
      strongEvidence: Math.round((list.filter((f) => f.evidenceLevel === 'E3' || f.evidenceLevel === 'E4').length / n) * 100) / 100,
      avgConfidence: Math.round((list.reduce((s, f) => s + f.confidence, 0) / n) * 100) / 100,
    });
  }
  return rows.sort((a, b) => b.count - a.count);
}

/* ── Audit Reliability Score (provisional) ── */
export type ArsComponents = {
  groundedness: number | null;
  evidenceCoverage: number | null;
  numericalAccuracy: number | null;
  falsePositiveInv: number | null; // 1 − FP rate (из golden/ревью)
  falseNegativeInv: number | null; // 1 − FN rate
  repeatability: number | null;    // из golden regression
  humanValidation: number | null;  // из review-петли
};

// Веса из data room, раздел 20.
const ARS_W: Record<keyof ArsComponents, number> = {
  groundedness: 0.22, evidenceCoverage: 0.18, falsePositiveInv: 0.15,
  falseNegativeInv: 0.15, repeatability: 0.12, humanValidation: 0.10, numericalAccuracy: 0.08,
};

export type ArsResult = {
  provisional: number | null;   // 0..100 по измеримым компонентам (renormalized)
  measuredWeight: number;       // доля веса, реально измеренная (0..1)
  components: ArsComponents;
  measured: (keyof ArsComponents)[];
  pending: (keyof ArsComponents)[];
  note: string;
};

/**
 * Считает provisional ARS по тому, что измеримо на прогоне детерминированно.
 * groundedness ≈ взвешенная сила доказательств; evidenceCoverage = доля с ref;
 * numericalAccuracy = 1, если гейт достижимости пройден (нет выдумок). FP/FN/
 * repeatability/human — null до golden-разметки и ревью.
 */
export function computeArs(findings: Finding[], opts: {
  reachabilityPassed: boolean;
  fromGolden?: { falsePositiveRate?: number; falseNegativeRate?: number; repeatability?: number };
  humanValidationRate?: number | null;
} = { reachabilityPassed: true }): ArsResult {
  const n = findings.length;
  const groundedness = n ? Math.round((findings.reduce((s, f) => s + (EVIDENCE_W[f.evidenceLevel ?? 'E2'] ?? 0.72), 0) / n) * 100) / 100 : null;
  const evidenceCoverage = n ? Math.round((findings.filter(hasRef).length / n) * 100) / 100 : null;
  const numericalAccuracy = opts.reachabilityPassed ? 1 : 0.5;
  const g = opts.fromGolden ?? {};
  const components: ArsComponents = {
    groundedness,
    evidenceCoverage,
    numericalAccuracy,
    falsePositiveInv: g.falsePositiveRate != null ? 1 - g.falsePositiveRate : null,
    falseNegativeInv: g.falseNegativeRate != null ? 1 - g.falseNegativeRate : null,
    repeatability: g.repeatability ?? null,
    humanValidation: opts.humanValidationRate ?? null,
  };
  let num = 0, den = 0;
  const measured: (keyof ArsComponents)[] = [];
  const pending: (keyof ArsComponents)[] = [];
  (Object.keys(ARS_W) as (keyof ArsComponents)[]).forEach((k) => {
    const v = components[k];
    if (v == null) { pending.push(k); return; }
    measured.push(k); num += ARS_W[k] * v; den += ARS_W[k];
  });
  const provisional = den > 0 ? Math.round((num / den) * 100) : null;
  return {
    provisional, measuredWeight: Math.round(den * 100) / 100, components, measured, pending,
    note: `Provisional ARS по ${Math.round(den * 100)}% веса метрики. Не измерены: ${pending.join(', ') || '—'} (нужны golden-разметка FP/FN, regression repeatability, human review).`,
  };
}

export type QualitySummary = {
  ars: ArsResult;
  evidenceDebt: EvidenceDebt;
  coverage: DomainCoverage[];
};

export function buildQualitySummary(findings: Finding[], opts?: Parameters<typeof computeArs>[1]): QualitySummary {
  return { ars: computeArs(findings, opts), evidenceDebt: evidenceDebt(findings), coverage: coverageMap(findings) };
}
