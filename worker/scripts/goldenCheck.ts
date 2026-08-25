/**
 * GOLDEN CHECK — regression-раннер по эталонным кейсам.
 *
 * Сверяет ВЫХОД реального прогона (results/<id>/) с ожиданиями golden-кейса:
 * диапазоны метрик, обязательные темы находок (с доказательством), запрет на
 * «галлюцинации» (mustNotContain). Даёт before/after сигнал при изменении модели/
 * промпта/методологии. Выход: PASS/FAIL по каждому чеку + код возврата (1 при провале).
 *
 * Запуск:
 *   npx tsx scripts/goldenCheck.ts --case golden/cases/<file>.json --run results/<id>
 *   npx tsx scripts/goldenCheck.ts --case <file>            # только валидация кейса (dry-run)
 *   npx tsx scripts/goldenCheck.ts --all --run results/<id> # все кейсы
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { GoldenCaseSchema, type GoldenCase } from '../golden/schema.js';

const args = process.argv.slice(2);
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const flag = (n: string) => args.includes(n);

type Check = { name: string; pass: boolean; detail: string; hard: boolean };

const norm = (s: string) => s.toLowerCase().replace(/[^a-zа-яё0-9 ]+/gi, ' ').replace(/\s+/g, ' ').trim();
function themeMatches(theme: string, haystack: string[]): boolean {
  const words = norm(theme).split(' ').filter((w) => w.length > 3);
  const hay = haystack.map(norm).join(' \n ');
  // тема считается найденной, если ≥60% значимых слов встречаются в корпусе находок
  const hit = words.filter((w) => hay.includes(w)).length;
  return words.length > 0 && hit / words.length >= 0.6;
}

function inRange(v: number | null | undefined, r: { min: number | null; max: number | null } | null): boolean {
  if (!r || v == null) return true; // нет ожидания или нет значения → не валим
  if (r.min != null && v < r.min) return false;
  if (r.max != null && v > r.max) return false;
  return true;
}

async function loadRun(dir: string): Promise<{ record: any | null; findingTexts: string[] }> {
  let record: any = null;
  const findingTexts: string[] = [];
  try { record = JSON.parse(await readFile(join(dir, 'audit-run-record.json'), 'utf8')); } catch { /* нет записи */ }
  // корпус текстов находок: backlog + любые *flow/*audit json с title/desc
  const files = await readdir(dir).catch(() => [] as string[]);
  for (const f of files.filter((x) => x.endsWith('.json'))) {
    try {
      const j = JSON.parse(await readFile(join(dir, f), 'utf8'));
      const collect = (o: any) => {
        if (!o || typeof o !== 'object') return;
        for (const k of ['title', 'desc', 'name', 'problem', 'as_is', 'gap', 'recommendation']) {
          if (typeof o[k] === 'string') findingTexts.push(o[k]);
        }
        for (const v of Object.values(o)) { if (Array.isArray(v)) v.forEach(collect); else if (v && typeof v === 'object') collect(v); }
      };
      collect(j);
    } catch { /* skip */ }
  }
  return { record, findingTexts };
}

function evaluate(gc: GoldenCase, run: { record: any | null; findingTexts: string[] }): Check[] {
  const checks: Check[] = [];
  const rec = run.record;
  const m = rec?.metrics ?? {};
  const fnd = rec?.findings ?? {};

  // метрики
  checks.push({ name: 'metrics.compliance', hard: false, ...res(inRange(m.compliance, gc.expectedMetrics.compliance), `compliance=${m.compliance ?? '—'} ∈ ${rng(gc.expectedMetrics.compliance)}`) });
  checks.push({ name: 'metrics.findingsTotal', hard: true, ...res(inRange(fnd.total, gc.expectedMetrics.findingsTotal), `total=${fnd.total ?? '—'} ∈ ${rng(gc.expectedMetrics.findingsTotal)}`) });
  checks.push({ name: 'metrics.p0', hard: false, ...res(inRange(fnd.p0, gc.expectedMetrics.p0), `p0=${fnd.p0 ?? '—'} ∈ ${rng(gc.expectedMetrics.p0)}`) });
  checks.push({ name: 'metrics.evidenceCoverage', hard: true, ...res(inRange(fnd.evidenceCoverage, gc.expectedMetrics.evidenceCoverage), `evidenceCoverage=${fnd.evidenceCoverage ?? '—'} ∈ ${rng(gc.expectedMetrics.evidenceCoverage)}`) });

  // обязательные темы находок
  for (const ef of gc.expectedFindings) {
    const found = themeMatches(ef.theme, run.findingTexts);
    checks.push({ name: `finding: ${ef.theme}`, hard: true, ...res(found, found ? 'найдена' : 'НЕ найдена в находках прогона') });
  }
  // запрет галлюцинаций
  for (const bad of gc.mustNotContain) {
    const present = themeMatches(bad, run.findingTexts);
    checks.push({ name: `mustNotContain: ${bad}`, hard: true, ...res(!present, present ? 'НАРУШЕНО: запрещённое утверждение обнаружено' : 'ок, отсутствует') });
  }
  return checks;
}

const res = (pass: boolean, detail: string) => ({ pass, detail });
const rng = (r: { min: number | null; max: number | null } | null) => (r ? `[${r.min ?? '−∞'}, ${r.max ?? '+∞'}]` : 'любой');

async function runCase(caseFile: string, runDir?: string): Promise<boolean> {
  const raw = JSON.parse(await readFile(caseFile, 'utf8'));
  const gc = GoldenCaseSchema.parse(raw);
  console.log(`\n━━ ${gc.caseId} · ${gc.title}`);
  console.log(`   вход: ${gc.input.site} T${gc.input.tier} (${gc.input.mode})`);
  if (!runDir) {
    console.log(`   ✓ кейс валиден по схеме (dry-run, прогон не указан). Ожиданий: метрик ${Object.values(gc.expectedMetrics).filter(Boolean).length}, тем ${gc.expectedFindings.length}, запретов ${gc.mustNotContain.length}.`);
    return true;
  }
  const run = await loadRun(runDir);
  if (!run.record) console.log(`   ⚠️ audit-run-record.json не найден в ${runDir} — метрики пропущены.`);
  const checks = evaluate(gc, run);
  let hardFail = false;
  for (const c of checks) {
    const mark = c.pass ? '✅' : (c.hard ? '❌' : '⚠️');
    if (!c.pass && c.hard) hardFail = true;
    console.log(`   ${mark} ${c.name} — ${c.detail}`);
  }
  console.log(`   → ${hardFail ? 'FAIL' : 'PASS'} (hard-проверок провалено: ${checks.filter((c) => !c.pass && c.hard).length})`);
  return !hardFail;
}

async function main() {
  const runDir = opt('--run');
  let cases: string[] = [];
  if (flag('--all')) {
    const dir = 'golden/cases';
    cases = (await readdir(dir)).filter((f) => f.endsWith('.json')).map((f) => join(dir, f));
  } else {
    const c = opt('--case');
    if (!c) { console.error('Укажите --case <file> или --all'); process.exit(2); }
    cases = [c];
  }
  let allPass = true;
  for (const c of cases) { const ok = await runCase(c, runDir); allPass = allPass && ok; }
  console.log(`\n${allPass ? '✅ Все golden-проверки пройдены' : '❌ Есть провалы golden-проверок'} (кейсов: ${cases.length})`);
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
