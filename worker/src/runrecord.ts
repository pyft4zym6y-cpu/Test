/**
 * AUDIT RUN RECORD — стандартная карточка каждого запуска аудита.
 *
 * Зачем (по замечаниям внешнего аудита): без записи о том, КАКАЯ версия методологии,
 * движка и модели, на КАКИХ входных данных и КАКИХ модулях был получен результат, аудит
 * невоспроизводим. Run Record делает каждый прогон прослеживаемым и повторяемым:
 *   версия методологии/движка/модели · снимок входных данных (+ hash) · какие модули
 *   выполнены/пропущены/упали · счётчики находок и покрытия доказательствами · выходные
 *   артефакты · поля reviewer/approval (separation of duties).
 *
 * Схема валидируется zod (integrity = доказательство, а не декларация). Пишется в
 * results/<id>/audit-run-record.json. См. data room: 18-audit-run-record,
 * evidence-matrix, methodology-governance, change-control.
 */
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { buildInfo, RUN_RECORD_SCHEMA_VERSION, estimateLlmCostUsd, MODEL_PRICE_ASOF } from './version.js';

export const AuditRunRecordSchema = z.object({
  schemaVersion: z.string(),
  auditId: z.string(),
  client: z.string(),
  tier: z.number().int().min(0).max(4),
  takenAt: z.string(),
  generatedAt: z.string(),
  durationMs: z.number().nullable(),

  methodologyVersion: z.string(),
  engineVersion: z.string(),
  model: z.string(),

  config: z.object({
    agentic: z.boolean(),
    prelaunch: z.boolean(),
    premium: z.boolean(),
    webSearch: z.boolean(),
    hasApiKey: z.boolean(),
  }),

  input: z.object({
    site: z.string().nullable(),
    competitors: z.number().int(),
    pagesCrawled: z.number().int(),
    competitorPagesCrawled: z.number().int(),
    backupScreenshots: z.boolean(),
    answersProvided: z.boolean(),
    dataSnapshotSha256: z.string().nullable(),
  }),

  modules: z.object({
    executed: z.array(z.string()),
    skipped: z.array(z.string()),
    failed: z.array(z.string()),
  }),

  findings: z.object({
    total: z.number().int(),
    p0: z.number().int(),
    p1: z.number().int(),
    p2: z.number().int(),
    evidenceCoverage: z.number().nullable(), // доля находок с evidence-ref, 0..1
    avgConfidence: z.number().nullable(),
  }),

  metrics: z.record(z.string(), z.any()),

  // Телеметрия стоимости прогона (unit economics / cost per audit).
  cost: z.object({
    llmCalls: z.number().int(),
    inputTokens: z.number().int(),
    outputTokens: z.number().int(),
    llmCostUsd: z.number().nullable(),
    priceAsOf: z.string(),
    note: z.string(),
  }),

  outputs: z.object({
    fileCount: z.number().int(),
    reportFiles: z.array(z.string()),
  }),

  // Separation of duties: движок ПРОИЗВОДИТ, человек РЕЦЕНЗИРУЕТ и УТВЕРЖДАЕТ.
  review: z.object({
    reviewer: z.string().nullable(),
    reviewedAt: z.string().nullable(),
    approver: z.string().nullable(),
    approvedAt: z.string().nullable(),
    status: z.enum(['produced', 'reviewed', 'approved', 'rejected']),
  }),
});

export type AuditRunRecord = z.infer<typeof AuditRunRecordSchema>;

/** SHA-256 снимка входных данных — для проверки идентичности входа при повторе. */
export function snapshotHash(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

/**
 * Ожидаемые линзы аудита → файл-артефакт. «Выполнено» определяется по факту наличия
 * артефакта в директории прогона (честно: executed = произведён артефакт), «пропущено» —
 * ожидался, но отсутствует (например, тир не даёт данных). Файлы вне карты не считаются.
 *
 * Имя файла здесь ОБЯЗАНО совпадать с тем, что пайплайн реально пишет. Однажды не
 * совпало у шести линз (`*flow.json` против `*audit.json`) — и они числились
 * пропущенными в каждом прогоне, включая идеальный. Сверку держит lenses.test.ts:
 * он читает pipeline.ts и сопоставляет с вызовами writeFile.
 */
export const EXPECTED_LENSES: { module: string; file: RegExp }[] = [
  { module: 'uxui', file: /^uxui\.json$/ },
  { module: 'journey', file: /^journey\.json$/ },
  { module: 'pagereport', file: /^pagereport\.json$/ },
  { module: 'seoarch', file: /^seoarch\.json$/ },
  { module: 'techaudit', file: /^techaudit\.json$/ },
  { module: 'contentaudit', file: /^contentaudit\.json$/ },
  { module: 'seoflow', file: /^seoflow\.json$/ },
  { module: 'strategyaudit', file: /^strategyaudit\.json$/ },
  { module: 'structureflow', file: /^structure.*\.json$/ },
  { module: 'pageflow', file: /^pageaudit\.json$/ },
  { module: 'blockflow', file: /^blockaudit\.json$/ },
  { module: 'merchflow', file: /^merchaudit\.json$/ },
  { module: 'croflow', file: /^croaudit\.json$/ },
  { module: 'analyticsflow', file: /^analyticsaudit\.json$/ },
  { module: 'cjmflow', file: /^cjmaudit\.json$/ },
  { module: 'geoflow', file: /^geoflow\.json$/ },
  { module: 'auditchain', file: /^auditchain\.json$/ },
  { module: 'unitecon', file: /^unitecon\.json$/ },
  { module: 'geoexpand', file: /^geoexpand\.json$/ },
  { module: 'auditsystem', file: /^auditsystem\.json$/ },
  { module: 'intelligence', file: /^intelligence\.json$/ },
  { module: 'mechanics', file: /^mechanics\.json$/ },
  { module: 'channels', file: /^channels\.json$/ },
  { module: 'competitor', file: /^(competitor|benchmark)\.json$/ },
  { module: 'analysis', file: /^analysis\.json$/ },
  { module: 'backlog', file: /^backlog\.json$/ },
  { module: 'qa', file: /^qa\.json$/ },
];

export function moduleStatusFromFiles(files: string[]): { executed: string[]; skipped: string[] } {
  const executed: string[] = [];
  const skipped: string[] = [];
  for (const { module, file } of EXPECTED_LENSES) {
    if (files.some((f) => file.test(f))) executed.push(module);
    else skipped.push(module);
  }
  return { executed, skipped };
}

export type RunRecordInput = {
  auditId: string;
  client: string;
  tier: number;
  takenAt: string;
  generatedAt: string;
  durationMs?: number | null;
  model?: string;
  config: AuditRunRecord['config'];
  input: Omit<AuditRunRecord['input'], 'dataSnapshotSha256'> & { dataSnapshot?: unknown };
  files: string[];
  failedModules?: string[];
  findings?: Partial<AuditRunRecord['findings']>;
  metrics?: Record<string, unknown>;
  usage?: { calls: number; inputTokens: number; outputTokens: number };
  reportFiles?: string[];
  review?: Partial<AuditRunRecord['review']>;
};

/** Собирает и валидирует Audit Run Record. Бросает, если структура нарушена. */
export function buildRunRecord(inp: RunRecordInput): AuditRunRecord {
  const bi = buildInfo(inp.model);
  const { executed, skipped } = moduleStatusFromFiles(inp.files);
  const failed = inp.failedModules ?? [];
  // модуль, помеченный failed, убираем из executed/skipped, чтобы статусы не пересекались
  const executedClean = executed.filter((m) => !failed.includes(m));
  const skippedClean = skipped.filter((m) => !failed.includes(m));

  const rec: AuditRunRecord = {
    schemaVersion: RUN_RECORD_SCHEMA_VERSION,
    auditId: inp.auditId,
    client: inp.client,
    tier: inp.tier,
    takenAt: inp.takenAt,
    generatedAt: inp.generatedAt,
    durationMs: inp.durationMs ?? null,
    methodologyVersion: bi.methodologyVersion,
    engineVersion: bi.engineVersion,
    model: bi.model,
    config: inp.config,
    input: {
      site: inp.input.site,
      competitors: inp.input.competitors,
      pagesCrawled: inp.input.pagesCrawled,
      competitorPagesCrawled: inp.input.competitorPagesCrawled,
      backupScreenshots: inp.input.backupScreenshots,
      answersProvided: inp.input.answersProvided,
      dataSnapshotSha256: inp.input.dataSnapshot !== undefined ? snapshotHash(inp.input.dataSnapshot) : null,
    },
    modules: { executed: executedClean, skipped: skippedClean, failed },
    findings: {
      total: inp.findings?.total ?? 0,
      p0: inp.findings?.p0 ?? 0,
      p1: inp.findings?.p1 ?? 0,
      p2: inp.findings?.p2 ?? 0,
      evidenceCoverage: inp.findings?.evidenceCoverage ?? null,
      avgConfidence: inp.findings?.avgConfidence ?? null,
    },
    metrics: (inp.metrics ?? {}) as Record<string, unknown>,
    cost: {
      llmCalls: inp.usage?.calls ?? 0,
      inputTokens: inp.usage?.inputTokens ?? 0,
      outputTokens: inp.usage?.outputTokens ?? 0,
      llmCostUsd: inp.usage ? Math.round(estimateLlmCostUsd(inp.usage.inputTokens, inp.usage.outputTokens) * 10000) / 10000 : null,
      priceAsOf: MODEL_PRICE_ASOF,
      note: 'Только стоимость LLM-токенов. Полная cost per audit = + crawl/compute + внешние API + human QA (раздел 32).',
    },
    outputs: { fileCount: inp.files.length, reportFiles: inp.reportFiles ?? inp.files.filter((f) => f.endsWith('.pdf')) },
    review: {
      reviewer: inp.review?.reviewer ?? null,
      reviewedAt: inp.review?.reviewedAt ?? null,
      approver: inp.review?.approver ?? null,
      approvedAt: inp.review?.approvedAt ?? null,
      status: inp.review?.status ?? 'produced',
    },
  };
  return AuditRunRecordSchema.parse(rec);
}
