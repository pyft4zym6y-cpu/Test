/**
 * LEARNING CORE — схемы леджера исходов и снимка обучения.
 *
 * Замыкание цикла (замечание внешнего аудита, moat): каждый провалидированный аудит
 * порождает записи в append-only леджере (находка → вердикт ревьюера → исход у клиента).
 * Из леджера строится LearningSnapshot: калибровка confidence, паттерны/антипаттерны,
 * эмпирические распределения бенчмарков, кандидаты в golden и предложения по методологии.
 * Ничего не выдумывается: всё считается из накопленных проверенных данных, с числом
 * наблюдений (n) при каждом выводе.
 */
import { z } from 'zod';

/** Вердикт ревью находки (human-in-the-loop): реальна ли находка. */
export const ReviewVerdict = z.enum(['accepted', 'rejected', 'corrected']);
/** Исход у клиента после выдачи (позже по времени). */
export const Outcome = z.enum(['fixed', 'not-fixed', 'unknown']);

export const LedgerEntrySchema = z.object({
  entryId: z.string(),
  auditId: z.string(),
  findingId: z.string(),
  domain: z.string(),
  key: z.string().nullable().default(null),      // семантический ключ дедупа
  theme: z.string().nullable().default(null),    // короткая тема находки
  predictedConfidence: z.number().min(0).max(1), // уверенность модели на момент выдачи
  predictedPriority: z.enum(['P0', 'P1', 'P2']),
  review: z.object({
    verdict: ReviewVerdict,
    correctedPriority: z.enum(['P0', 'P1', 'P2']).nullable().default(null),
    reviewer: z.string(),
    reviewedAt: z.string(),
    note: z.string().default(''),
  }),
  outcome: z.object({
    status: Outcome.default('unknown'),
    realizedImpact: z.number().nullable().default(null),
    at: z.string().nullable().default(null),
  }).default({ status: 'unknown', realizedImpact: null, at: null }),
  // Наблюдения обхода для эмпирических бенчмарков (напр. { hasProductSchema:false, compliance:58 }).
  observations: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  methodologyVersion: z.string().nullable().default(null),
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

/** Одна корзина калибровки. */
export const CalibrationBinSchema = z.object({
  lo: z.number(), hi: z.number(),
  n: z.number().int(),
  avgPredicted: z.number().nullable(),
  actualAccuracy: z.number().nullable(), // (accepted+corrected)/n
});
export type CalibrationBin = z.infer<typeof CalibrationBinSchema>;

export const CalibrationSchema = z.object({
  n: z.number().int(),
  bins: z.array(CalibrationBinSchema),
  ece: z.number().nullable(),           // Expected Calibration Error, 0..1 (меньше — лучше)
  reliable: z.boolean(),                // достаточно ли данных
  note: z.string(),
});
export type Calibration = z.infer<typeof CalibrationSchema>;

export const PatternSchema = z.object({
  signature: z.string(),
  domain: z.string(),
  theme: z.string(),
  support: z.number().int(),            // сколько раз встречалась
  acceptRate: z.number(),               // доля подтверждений среди ревью
  avgConfidence: z.number(),
});
export type Pattern = z.infer<typeof PatternSchema>;

export const BenchmarkDistributionSchema = z.object({
  metric: z.string(),
  kind: z.enum(['numeric', 'boolean']),
  n: z.number().int(),
  // для numeric:
  min: z.number().nullable(), p25: z.number().nullable(), median: z.number().nullable(),
  p75: z.number().nullable(), max: z.number().nullable(), mean: z.number().nullable(),
  // для boolean:
  shareTrue: z.number().nullable(),
});
export type BenchmarkDistribution = z.infer<typeof BenchmarkDistributionSchema>;

export const MethodologySuggestionSchema = z.object({
  kind: z.enum(['suppress-antipattern', 'promote-pattern', 'recalibrate', 'tighten-check']),
  target: z.string(),
  rationale: z.string(),
  evidenceN: z.number().int(),
});
export type MethodologySuggestion = z.infer<typeof MethodologySuggestionSchema>;

export const LearningSnapshotSchema = z.object({
  generatedAt: z.string(),
  ledgerEntries: z.number().int(),
  distinctAudits: z.number().int(),
  calibration: CalibrationSchema,
  patterns: z.array(PatternSchema),
  antiPatterns: z.array(PatternSchema),   // частые ложные срабатывания (низкий acceptRate)
  benchmarkDistributions: z.array(BenchmarkDistributionSchema),
  suggestions: z.array(MethodologySuggestionSchema),
  goldenCandidateCount: z.number().int(),
  note: z.string(),
});
export type LearningSnapshot = z.infer<typeof LearningSnapshotSchema>;
