/**
 * LEDGER IO — append-only JSONL леджер провалидированных находок и исходов.
 *
 * Append-only = дружелюбно к audit trail (раздел 30): записи не переписываются.
 * Путь по умолчанию — LEARNING_LEDGER или worker/learning/ledger.jsonl.
 */
import { readFile, appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { LedgerEntrySchema, type LedgerEntry } from './schema.js';

export const ledgerPath = (): string =>
  process.env.LEARNING_LEDGER || resolve(process.cwd(), 'learning/ledger.jsonl');

const entryId = (auditId: string, findingId: string) =>
  'le_' + createHash('sha256').update(`${auditId}::${findingId}`).digest('hex').slice(0, 12);

/** Читает и валидирует леджер (битые строки пропускаются с подсчётом). */
export async function readLedger(path = ledgerPath()): Promise<{ entries: LedgerEntry[]; skipped: number }> {
  let raw = '';
  try { raw = await readFile(path, 'utf8'); } catch { return { entries: [], skipped: 0 }; }
  const entries: LedgerEntry[] = [];
  let skipped = 0;
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { entries.push(LedgerEntrySchema.parse(JSON.parse(t))); } catch { skipped++; }
  }
  return { entries, skipped };
}

/** Дописывает записи (валидируя каждую). Возвращает число записанных. */
export async function appendLedger(rows: LedgerEntry[], path = ledgerPath()): Promise<number> {
  if (!rows.length) return 0;
  await mkdir(dirname(path), { recursive: true });
  const lines = rows.map((r) => JSON.stringify(LedgerEntrySchema.parse(r))).join('\n') + '\n';
  await appendFile(path, lines, 'utf8');
  return rows.length;
}

/** Форма находки, из которой строится запись леджера (совместима с registry.Finding). */
export type ReviewableFinding = {
  id: string; domain: string; key?: string; title: string;
  confidence: number; priority: 'P0' | 'P1' | 'P2';
};
export type Verdict = {
  findingId: string;
  verdict: 'accepted' | 'rejected' | 'corrected';
  correctedPriority?: 'P0' | 'P1' | 'P2';
  note?: string;
};

/**
 * Собирает записи леджера из провалидированного прогона: находки + вердикты ревьюера
 * (+ наблюдения обхода для бенчмарков). Только находки, у которых есть вердикт.
 */
export function entriesFromRun(args: {
  auditId: string;
  findings: ReviewableFinding[];
  verdicts: Verdict[];
  reviewer: string;
  reviewedAt: string;
  observations?: Record<string, string | number | boolean>;
  methodologyVersion?: string | null;
}): LedgerEntry[] {
  const vmap = new Map(args.verdicts.map((v) => [v.findingId, v]));
  const out: LedgerEntry[] = [];
  for (const f of args.findings) {
    const v = vmap.get(f.id);
    if (!v) continue;
    out.push(LedgerEntrySchema.parse({
      entryId: entryId(args.auditId, f.id),
      auditId: args.auditId,
      findingId: f.id,
      domain: f.domain,
      key: f.key ?? null,
      theme: f.title,
      predictedConfidence: f.confidence,
      predictedPriority: f.priority,
      review: {
        verdict: v.verdict,
        correctedPriority: v.correctedPriority ?? null,
        reviewer: args.reviewer,
        reviewedAt: args.reviewedAt,
        note: v.note ?? '',
      },
      outcome: { status: 'unknown', realizedImpact: null, at: null },
      observations: args.observations ?? {},
      methodologyVersion: args.methodologyVersion ?? null,
    }));
  }
  return out;
}
