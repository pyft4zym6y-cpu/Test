/**
 * GOLDEN DATASET — схема эталонного кейса для regression-тестирования.
 *
 * Зачем (замечания внешнего аудита, P0): после изменения модели/промпта/методологии/
 * скоринга нужно доказать, что качество не деградировало. Golden case фиксирует
 * ВХОД (ссылка + тир + режим) и ОЖИДАЕМЫЙ ВЫХОД (диапазоны метрик, ожидаемые темы
 * находок, счётчики по приоритетам) с допусками. Прогон сверяется с эталоном →
 * before/after regression. См. data room: 21-golden-dataset-and-regression.
 *
 * Значения-эталоны получаются из ПРОВЕРЕННОГО человеком прогона (reviewer), а не
 * выдумываются. Незаполненное помечается null и не участвует в проверке.
 */
import { z } from 'zod';

/** Диапазон допуска [min, max] (включительно) или точное значение. */
export const RangeSchema = z.object({ min: z.number().nullable(), max: z.number().nullable() });
export type Range = z.infer<typeof RangeSchema>;

export const ExpectedFindingSchema = z.object({
  theme: z.string(),               // семантическая тема, напр. 'нет товарной schema'
  minCount: z.number().int().nullable(), // сколько раз минимум ожидаем встретить
  priorityAtLeast: z.enum(['P0', 'P1', 'P2']).nullable(),
  mustHaveEvidence: z.boolean().default(true),
});

export const GoldenCaseSchema = z.object({
  caseId: z.string(),
  title: z.string(),
  anonymized: z.boolean(),
  input: z.object({
    site: z.string(),
    tier: z.number().int().min(0).max(4),
    mode: z.enum(['external-crawl', 'with-analytics', 'with-data', 'full']),
    note: z.string().optional(),
  }),
  // Ожидаемые НАБЛЮДЕНИЯ (факты внешнего обхода — устойчивы, можно жёстко сверять).
  expectedObservations: z.array(z.object({
    key: z.string(),
    expected: z.union([z.string(), z.number(), z.boolean()]),
    tolerance: z.number().nullable().default(null),
    verified: z.boolean().default(false),
    source: z.string().default(''),
  })),
  // Ожидаемые МЕТРИКИ прогона (диапазоны — устойчивость к шуму).
  expectedMetrics: z.object({
    compliance: RangeSchema.nullable(),
    findingsTotal: RangeSchema.nullable(),
    p0: RangeSchema.nullable(),
    evidenceCoverage: RangeSchema.nullable(), // 0..1
  }),
  // Ожидаемые темы находок (что аудит ОБЯЗАН найти на этом кейсе).
  expectedFindings: z.array(ExpectedFindingSchema),
  // Что НЕ должно появляться (защита от галлюцинаций / ложных срабатываний).
  mustNotContain: z.array(z.string()).default([]),
  baseline: z.object({
    capturedFromRunId: z.string().nullable(),
    capturedAt: z.string().nullable(),
    methodologyVersion: z.string().nullable(),
    reviewer: z.string().nullable(),
  }),
});

export type GoldenCase = z.infer<typeof GoldenCaseSchema>;
export type ExpectedFinding = z.infer<typeof ExpectedFindingSchema>;
