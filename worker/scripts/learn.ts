/**
 * LEARNING CORE CLI — конвейер обучения на провалидированных аудитах.
 *
 *   npx tsx scripts/learn.ts ingest --run results/<id> --verdicts <verdicts.json> [--reviewer NAME]
 *   npx tsx scripts/learn.ts build [--out learning/learning-core.json]
 *   npx tsx scripts/learn.ts promote-golden --audit <auditId> [--reviewer NAME]
 *   npx tsx scripts/learn.ts seed        # синтетический леджер для демо/тестов
 *
 * verdicts.json: { reviewer, reviewedAt?, observations?:{...}, findings:[{id,domain,key?,
 *   theme,confidence,priority,verdict,correctedPriority?,note?}] }
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { readLedger, appendLedger, entriesFromRun, ledgerPath } from '../src/learning/ledger.js';
import { buildLearningSnapshot, goldenCandidateFromRun } from '../src/learning/core.js';
import { LedgerEntrySchema } from '../src/learning/schema.js';
import { GoldenCaseSchema } from '../golden/schema.js';
import { METHODOLOGY_VERSION } from '../src/version.js';

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };

async function ingest() {
  const runDir = opt('--run'); const vfile = opt('--verdicts');
  if (!runDir || !vfile) { console.error('ingest: нужны --run и --verdicts'); process.exit(2); }
  const rr = JSON.parse(await readFile(join(runDir, 'audit-run-record.json'), 'utf8'));
  const v = JSON.parse(await readFile(vfile, 'utf8'));
  const observations = { ...(v.observations ?? {}), compliance: rr?.metrics?.compliance ?? undefined };
  Object.keys(observations).forEach((k) => observations[k] === undefined && delete observations[k]);
  const entries = entriesFromRun({
    auditId: rr.auditId,
    findings: v.findings.map((f: any) => ({ id: f.id, domain: f.domain, key: f.key, title: f.theme, confidence: f.confidence, priority: f.priority })),
    verdicts: v.findings.map((f: any) => ({ findingId: f.id, verdict: f.verdict, correctedPriority: f.correctedPriority, note: f.note })),
    reviewer: v.reviewer || opt('--reviewer') || 'unknown',
    reviewedAt: v.reviewedAt || new Date().toISOString(),
    observations, methodologyVersion: rr.methodologyVersion ?? METHODOLOGY_VERSION,
  });
  const n = await appendLedger(entries);
  console.log(`✓ ingest: +${n} записей в ${ledgerPath()} (аудит ${rr.auditId})`);
}

async function build() {
  const { entries, skipped } = await readLedger();
  if (skipped) console.log(`⚠️ пропущено битых строк: ${skipped}`);
  const snap = buildLearningSnapshot(entries, new Date().toISOString());
  const out = opt('--out') || resolve(process.cwd(), 'learning/learning-core.json');
  await mkdir(resolve(out, '..'), { recursive: true });
  await writeFile(out, JSON.stringify(snap, null, 2), 'utf8');
  console.log(`✓ learning-core: ${out}`);
  console.log(`  записей ${snap.ledgerEntries}, аудитов ${snap.distinctAudits}`);
  console.log(`  калибровка: n=${snap.calibration.n}, ECE=${snap.calibration.ece}, надёжна=${snap.calibration.reliable}`);
  console.log(`  паттернов ${snap.patterns.length}, антипаттернов ${snap.antiPatterns.length}, распределений ${snap.benchmarkDistributions.length}, предложений ${snap.suggestions.length}, golden-кандидатов ${snap.goldenCandidateCount}`);
}

async function promoteGolden() {
  const auditId = opt('--audit');
  if (!auditId) { console.error('promote-golden: нужен --audit'); process.exit(2); }
  const { entries } = await readLedger();
  const cand = goldenCandidateFromRun(auditId, entries, opt('--reviewer') || 'unknown', METHODOLOGY_VERSION);
  const parsed = GoldenCaseSchema.parse(cand); // валидируем против golden-схемы
  const file = resolve(process.cwd(), `golden/cases/${parsed.caseId}.json`);
  await writeFile(file, JSON.stringify(parsed, null, 2), 'utf8');
  console.log(`✓ golden-кейс промоутнут: ${file} (тем: ${parsed.expectedFindings.length}, mustNotContain: ${parsed.mustNotContain.length})`);
}

/** Детерминированный синтетический леджер (для демо/тестов; без Math.random). */
async function seed() {
  const domains = ['seo-os', 'checkout-os', 'trust-os', 'ux-os', 'content-os', 'perf-os'];
  const themes: Record<string, string> = {
    'seo-os': 'нет товарной schema', 'checkout-os': 'чекаут: барьеры', 'trust-os': 'нет отзывов/рейтинга',
    'ux-os': 'слабая навигация каталога', 'content-os': 'тонкий контент карточки', 'perf-os': 'preconnect/preload/ALT',
  };
  const rows = [];
  for (let a = 0; a < 12; a++) {
    for (let i = 0; i < domains.length; i++) {
      const d = domains[i];
      // конфидентность и «правильность» детерминированы от индексов, но реалистичны:
      const conf = Math.min(0.98, 0.5 + ((a + i) % 5) * 0.11);
      // seo/checkout/trust почти всегда верны; perf чаще ложные (антипаттерн)
      const correctProb = d === 'perf-os' ? ((a % 3 === 0) ? 1 : 0) : ((a % 7 === 6) ? 0 : 1);
      const verdict = correctProb ? (conf > 0.85 ? 'accepted' : 'corrected') : 'rejected';
      rows.push(LedgerEntrySchema.parse({
        entryId: `le_seed_${a}_${i}`, auditId: `seed-audit-${a}`, findingId: `${d.slice(0, 3).toUpperCase()}-00${i}`,
        domain: d, key: d + ':' + i % 2, theme: themes[d], predictedConfidence: Math.round(conf * 100) / 100,
        predictedPriority: i < 2 ? 'P0' : i < 4 ? 'P1' : 'P2',
        review: { verdict, correctedPriority: verdict === 'corrected' ? 'P1' : null, reviewer: 'seed-reviewer', reviewedAt: '2026-08-19T00:00:00.000Z', note: '' },
        outcome: { status: 'unknown', realizedImpact: null, at: null },
        observations: { compliance: 45 + ((a * 3 + i) % 40), hasProductSchema: d === 'seo-os' ? false : (a % 2 === 0), reviewsPresent: d === 'trust-os' ? false : true },
        methodologyVersion: METHODOLOGY_VERSION,
      }));
    }
  }
  const path = ledgerPath();
  await mkdir(resolve(path, '..'), { recursive: true });
  await writeFile(path, rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  console.log(`✓ seed: ${rows.length} записей → ${path}`);
}

const run = async () => {
  if (cmd === 'ingest') return ingest();
  if (cmd === 'build') return build();
  if (cmd === 'promote-golden') return promoteGolden();
  if (cmd === 'seed') return seed();
  console.error('Команды: ingest | build | promote-golden | seed');
  process.exit(2);
};
run().catch((e) => { console.error(e); process.exit(1); });
