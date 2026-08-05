import routingRaw from '../data/routing.json';
import { QUESTIONS, DOMAINS, type Question } from './model';
import { painById } from '../data/pains';
import { MATURITY_DOMAINS, CRITICAL_GAPS, type CriticalGap } from '../data/method';

export type Rule = {
  id: string;
  area: string;
  trigger: string;
  domains: string;
  playbooks: string;
  deliverable: string;
  priority: string;
  impact?: number | null;
  difficulty?: number | null;
  days?: number | null;
  blocking?: boolean;
  effort_days?: number | null;
};
export const RULES = routingRaw as Rule[];

export type Problem = { q: Question; answer: string; severity: number };

export type DomainScore = {
  key: string;
  sheet: string;
  answered: number;
  total: number;
  scorable: number;
  health: number | null; // 0..1
  problems: Problem[];
};

export type FiredGap = CriticalGap & { evidence: string };

export type Report = {
  domains: DomainScore[];
  score: number | null; // 0..100 · 0.6×A + 0.4×B
  scoreA: number | null; // взвешенная зрелость
  scoreB: number | null; // 100 − штрафы
  gaps: FiredGap[];
  answeredL1: number;
  totalL1: number;
  problems: Problem[];
  rules: Rule[];
};

const YES_RE = /^(да|так|yes)/i;
const NO_RE = /^(нет|ні|no)/i;
const PART_RE = /^(частично|частково)/i;

/** «Проблемность» ответа: 1 = проблема, 0.5 = частично, 0 = ок, null = не скорится. */
function problemScore(q: Question & { risk?: string | null }, answer: string): number | null {
  if (!/Да\/Нет/.test(q.type)) return null;
  if (NO_RE.test(answer)) return 1;
  if (PART_RE.test(answer)) return 0.5;
  if (YES_RE.test(answer)) return 0;
  // варианты вида «Давно» и т.п. — считаем половиной
  return 0.5;
}

const norm = (s: string) => s.toLowerCase().replace(/[«»"'ё]/g, (c) => (c === 'ё' ? 'е' : '')).trim();

export function buildReport(
  answers: Record<string, { answer?: string | null }>,
  painIds: string[],
): Report {
  const domains: DomainScore[] = DOMAINS.map((d) => {
    const qs = QUESTIONS.filter((q) => q.domain === d.key && q.level === 'L1');
    let scorable = 0;
    let bad = 0;
    let answered = 0;
    const problems: Problem[] = [];
    for (const q of qs) {
      const a = answers[q.id]?.answer;
      if (!a) continue;
      answered += 1;
      const s = problemScore(q as any, a);
      if (s === null) continue;
      scorable += 1;
      bad += s;
      if (s > 0 && (q as any).risk) {
        problems.push({ q, answer: a, severity: s * ((q as any).weight ?? 2) });
      }
    }
    return {
      key: d.key,
      sheet: d.sheet,
      answered,
      total: qs.length,
      scorable,
      health: scorable >= 3 ? 1 - bad / scorable : null,
      problems: problems.sort((a, b) => b.severity - a.severity),
    };
  });

  /* Score A: взвешенная зрелость 18 доменов (уровень 0–5 из health, вес из матрицы). */
  const bySheet = new Map(domains.map((d) => [d.sheet, d]));
  let wSum = 0;
  let aSum = 0;
  for (const md of MATURITY_DOMAINS) {
    const parts = md.sheets.map((s) => bySheet.get(s)).filter((d) => d && d.health !== null) as DomainScore[];
    if (!parts.length) continue;
    const health = parts.reduce((s, d) => s + (d.health as number), 0) / parts.length;
    wSum += md.weight;
    aSum += health * 100 * md.weight;
  }
  const scoreA = wSum >= 30 ? Math.round(aSum / wSum) : null;

  /* Score B: 100 − штрафы за критические разрывы (разрыв = «Нет» на контрольный вопрос). */
  const gaps: FiredGap[] = [];
  for (const g of CRITICAL_GAPS) {
    const hit = g.qids.find((qid) => {
      const a = answers[qid]?.answer ?? '';
      return NO_RE.test(a);
    });
    if (hit) {
      const q = QUESTIONS.find((x) => x.id === hit);
      gaps.push({ ...g, evidence: q ? `${hit}: ${q.text}` : hit });
    }
  }
  const anyGapAnswered = CRITICAL_GAPS.some((g) => g.qids.some((qid) => answers[qid]?.answer));
  const scoreB = anyGapAnswered ? Math.max(0, 100 - gaps.reduce((s, g) => s + g.penalty, 0)) : null;

  const score =
    scoreA !== null ? Math.round(0.6 * scoreA + 0.4 * (scoreB ?? scoreA)) : null;

  const totalL1 = QUESTIONS.filter((q) => q.level === 'L1').length;
  const answeredL1 = QUESTIONS.filter((q) => q.level === 'L1' && answers[q.id]?.answer).length;

  const problems = domains
    .flatMap((d) => d.problems)
    .sort((a, b) => b.severity - a.severity);

  // Правила: триггер совпадает с болью ИЛИ с ответом-вариантом клиента
  const painTitles = painIds
    .map((id) => painById(id)?.title ?? '')
    .map(norm);
  const answerTexts = Object.values(answers)
    .flatMap((a) => (a.answer ?? '').split(' | ')) // мультивыбор: каждый выбранный вариант отдельно
    .map(norm)
    .filter((t) => t.length > 3 && t.length < 60);
  const rules = RULES.filter((r) => {
    const t = norm(r.trigger ?? '');
    if (!t) return false;
    return (
      painTitles.some((p) => p && (p.includes(t) || t.includes(p))) ||
      answerTexts.some((a) => a === t)
    );
  });
  const prio = (p: string) => (p?.startsWith('P0') ? 0 : p?.startsWith('P1') ? 1 : 2);
  rules.sort((a, b) =>
    Number(Boolean(b.blocking)) - Number(Boolean(a.blocking)) ||
    prio(a.priority) - prio(b.priority) ||
    (b.impact ?? 0) / Math.max(b.difficulty ?? 1, 1) - (a.impact ?? 0) / Math.max(a.difficulty ?? 1, 1));

  return { domains, score, scoreA, scoreB, gaps, answeredL1, totalL1, problems, rules };
}

export function zone(health: number | null): { color: string; label: string } {
  if (health === null) return { color: '#9aa1ab', label: 'мало данных' };
  if (health >= 0.7) return { color: '#4d7c0f', label: 'норма' };
  if (health >= 0.45) return { color: '#b45309', label: 'внимание' };
  return { color: '#dc2626', label: 'критично' };
}
