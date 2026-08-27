/**
 * Единый источник расчёта: воркер считает Health Score, разрывы, решения и scope
 * ТЕМИ ЖЕ формулами, что и портал — импортируя его чистые модули напрямую
 * (`portal/src/lib/*`, `portal/src/data/*`). Никакого дублирования математики.
 *
 * Питается ответами опросника (map {qid: answer}). На T1 без ответов Health
 * Score = null (движку нужен опросник) — это честно; раскрывается на T2–T3.
 */
import { buildReport } from '../../portal/src/lib/report.ts';
import { runDecisions } from '../../portal/src/lib/engine.ts';
import { bandFor } from '../../portal/src/data/method.ts';
import { PAINS_QID, GOALS_QID } from '../../portal/src/data/pains.ts';

export type EngineGap = { label: string; penalty: number; evidence: string };
export type EngineDecision = { id: string; title: string; impact: number; difficulty: number; timeDays: number; roi: string; playbooks: string[]; why: string[] };
export type EngineRule = { id: string; area: string; trigger: string; playbooks: string; priority: string };

export type EngineResult = {
  score: number | null;
  scoreA: number | null;
  scoreB: number | null;
  band: string | null;
  action: string | null;
  gaps: EngineGap[];
  decisions: EngineDecision[];
  rules: EngineRule[];
  coverage: { answered: number; total: number };
  /** Сколько критических разрывов проверено ответом — без этого scoreB нечитаем. */
  gapCoverage: { checked: number; total: number };
  /** Итог опирается только на зрелость: рисковая половина не проверена. */
  scoreProvisional: boolean;
};

type Answers = Record<string, { answer?: string | null }>;

/** Нормализует вход {qid:"текст"} | {qid:{answer:"текст"}} к форме движка. */
export function normalizeAnswers(raw: Record<string, unknown>): Answers {
  const out: Answers = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v && typeof v === 'object' && 'answer' in (v as any)) out[k] = { answer: String((v as any).answer ?? '') };
    else if (v != null) out[k] = { answer: String(v) };
  }
  return out;
}

export function computeEngine(answers: Answers): EngineResult {
  const painIds = (answers[PAINS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  const goalIds = (answers[GOALS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  const report = buildReport(answers as any, painIds);
  const decisions = runDecisions({ report, rows: answers as any, painIds, goalIds, levers: null, meta: null });
  const band = report.score != null ? bandFor(report.score) : null;
  return {
    score: report.score,
    scoreA: report.scoreA,
    scoreB: report.scoreB,
    band: band?.label ?? null,
    action: band?.action ?? null,
    gaps: report.gaps.map((g: any) => ({ label: g.label, penalty: g.penalty, evidence: g.evidence })),
    decisions: decisions.map((d: any) => ({ id: d.id, title: d.title, impact: d.impact, difficulty: d.difficulty, timeDays: d.timeDays, roi: d.roi, playbooks: d.playbooks, why: d.why })),
    rules: report.rules.map((r: any) => ({ id: r.id, area: r.area, trigger: r.trigger, playbooks: r.playbooks, priority: r.priority })),
    coverage: { answered: report.answeredL1, total: report.totalL1 },
    gapCoverage: report.gapCoverage,
    scoreProvisional: report.scoreProvisional,
  };
}

/** Компактная сводка движка для промпта анализа и материалов. */
export function engineFacts(e: EngineResult): string {
  const L: string[] = [];
  L.push('# РАСЧЁТ ДВИЖКА (та же математика, что в портале — не пересчитывай эти числа)');
  L.push(e.score != null
    ? `Health Score: ${e.score}/100 — «${e.band}». Рекомендация: ${e.action}. (зрелость A ${e.scoreA ?? '—'}, разрывы B ${e.scoreB ?? '—'}). Заполнено ${e.coverage.answered}/${e.coverage.total}.`
    : `Health Score пока не считается: заполнено ${e.coverage.answered}/${e.coverage.total} ответов опросника (нужно больше для 100-балльной шкалы).`);
  // Непроверенный разрыв — не пройденный разрыв. Раньше молчание здесь читалось
  // моделью как «рисков нет»: она видела score и пустой список разрывов.
  const { checked, total } = e.gapCoverage;
  if (e.scoreProvisional) {
    L.push(`⚠️ Оценка ПРЕДВАРИТЕЛЬНАЯ: из ${total} критических разрывов проверено ответом ${checked}. `
      + 'Рисковая половина шкалы не считалась — итог отражает только зрелость. '
      + 'Не делай вывода «рисков нет»: их не проверяли.');
  } else if (checked < total) {
    L.push(`Проверено критических разрывов: ${checked} из ${total} — по остальным данных нет.`);
  }
  if (e.gaps.length) L.push('Критические разрывы: ' + e.gaps.map((g) => `${g.label} (−${g.penalty})`).join('; '));
  else if (checked > 0) L.push(`Из ${checked} проверенных критических разрывов не сработал ни один.`);
  if (e.decisions.length) {
    L.push('Приоритетные решения движка (влияние/сложность, с трассой «почему»):');
    for (const d of e.decisions.slice(0, 8)) L.push(`  · ${d.id} ${d.title} — impact ${d.impact}/слож ${d.difficulty}, ~${d.timeDays}д, ROI ${d.roi}, ПБ: ${d.playbooks.join(', ')} · почему: ${d.why.join('; ')}`);
  }
  return L.join('\n');
}
