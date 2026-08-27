/**
 * AI-со-пилот аудита Commerce OS (гибрид).
 *
 * Детерминированное ядро: собирает «снимок» аудита из тех же движков, что и
 * страницы портала (buildReport, runDecisions, forecast, detectContradictions,
 * Health Score), сериализует его в ground-truth для system-prompt Claude и
 * отвечает на типовые вопросы офлайн, когда API недоступен.
 *
 * Числа считает движок — LLM их только объясняет и никогда не выдумывает.
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../App';
import { useAnswers } from './useAnswers';
import { useReportMeta } from './consultant';
import { buildReport, zone, type Report } from './report';
import {
  runDecisions,
  computeConfidence,
  forecast,
  gapCosts,
  type Decision,
} from './engine';
import { detectContradictions } from './contradictions';
import { bandFor } from '../data/method';
import { supabase, DEMO } from './supabase';
import {
  PAINS_QID, GOALS_QID, PASSPORT_QID,
  effectiveNiche, type Passport,
} from '../data/pains';

/* ── Снимок аудита: сериализуемый факт-слой ── */
export type AuditSnapshot = {
  client: { name?: string; niche?: string };
  coverage: { answered: number; total: number; pct: number };
  health: { score: number | null; band?: string; action?: string; scoreA: number | null; scoreB: number | null;
            gapCoverage: { checked: number; total: number }; provisional: boolean };
  confidence: { score: number; factors: { label: string; delta: number }[] };
  money: {
    show: boolean;
    consMin?: number;
    consMax?: number;
    monthly?: number;
    forecast?: { current: number; withProgram: number; upliftPct: number } | null;
    levers?: { key: string; label: string; fact: number; target: number; source?: string; contribYear?: number }[];
  };
  gaps: { id: string; label: string; penalty: number; evidence: string; costYear?: number }[];
  decisions: { id: string; title: string; impact: number; difficulty: number; timeDays: number; roi: string; playbooks: string[]; why: string[] }[];
  problems: { qid: string; question: string; answer: string; zone: string }[];
  rules: { id: string; area: string; trigger: string; playbooks: string; priority: string }[];
  contradictions: { title: string; detail: string }[];
  accessGranted: number;
};

const LEVER_LABELS: Record<string, string> = {
  traffic: 'Трафик (сессии/мес)',
  cr: 'Конверсия, %',
  aov: 'Средний чек, ₴',
  pay: 'Доля оплат, %',
  redeem: 'Выкуп, %',
  base: 'База покупателей',
  repeat: 'Повторные, %/мес',
  opr: 'Заказов на клиента',
};

/** Собирает снимок из живого состояния аудита (тот же расчёт, что на страницах). */
export function buildSnapshot(
  rows: Parameters<typeof buildReport>[0] & Record<string, { answer?: string | null }>,
  meta: ReturnType<typeof useReportMeta>['meta'],
  accessGranted: number,
): AuditSnapshot {
  const painIds = (rows[PAINS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  const goalIds = (rows[GOALS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  let passport: Passport = {};
  try { passport = JSON.parse(rows[PASSPORT_QID]?.answer ?? '{}'); } catch { passport = {}; }

  const report: Report = buildReport(rows as any, painIds);
  const levers = meta?.money?.levers ?? null;
  const money = meta?.money?.show ? meta.money : null;
  const contradictions = detectContradictions(rows as any);
  const decisions = runDecisions({ report, rows: rows as any, painIds, goalIds, levers, meta });
  const conf = computeConfidence(report, contradictions, accessGranted, meta);
  const fc = forecast(money);
  const costs = gapCosts(report, money);

  const band = report.score !== null ? bandFor(report.score) : undefined;
  const waterfall = new Map((money?.waterfall ?? []).map((w) => [w.key, w.value]));

  return {
    client: { name: passport.name, niche: effectiveNiche(passport) || undefined },
    coverage: {
      answered: report.answeredL1,
      total: report.totalL1,
      pct: report.totalL1 ? Math.round((report.answeredL1 / report.totalL1) * 100) : 0,
    },
    health: { score: report.score, band: band?.label, action: band?.action, scoreA: report.scoreA, scoreB: report.scoreB,
              gapCoverage: report.gapCoverage, provisional: report.scoreProvisional },
    confidence: conf,
    money: {
      show: Boolean(money),
      consMin: money?.consMin,
      consMax: money?.consMax,
      monthly: money?.monthly,
      forecast: fc,
      levers: levers
        ? Object.entries(levers).map(([key, v]) => ({
            key, label: LEVER_LABELS[key] ?? key, fact: v.fact, target: v.target, source: v.source,
            contribYear: waterfall.get(key as any),
          }))
        : undefined,
    },
    gaps: report.gaps.map((g) => ({ id: g.id, label: g.label, penalty: g.penalty, evidence: g.evidence, costYear: costs.get(g.id) })),
    decisions: decisions.map((d: Decision) => ({
      id: d.id, title: d.title, impact: d.impact, difficulty: d.difficulty,
      timeDays: d.timeDays, roi: d.roi, playbooks: d.playbooks, why: d.why,
    })),
    problems: report.problems.slice(0, 14).map((p) => ({
      qid: p.q.id, question: p.q.text, answer: p.answer,
      zone: zone(null).label && p.severity >= 3 ? 'критично' : 'внимание',
    })),
    rules: report.rules.slice(0, 12).map((r) => ({ id: r.id, area: r.area, trigger: r.trigger, playbooks: r.playbooks, priority: r.priority })),
    contradictions: contradictions.map((c) => ({ title: c.rule.id, detail: c.rule.question })),
    accessGranted,
  };
}

const fmt = (n?: number) => (typeof n === 'number' ? n.toLocaleString('ru-RU') : '—');
const fmtMoney = (n?: number) => (typeof n === 'number' ? `${Math.round(n).toLocaleString('ru-RU')} ₴` : '—');

/** Компактный ground-truth для system-prompt Claude (и офлайн-ответов). */
export function snapshotToContext(s: AuditSnapshot): string {
  const L: string[] = [];
  L.push('# ЖИВОЙ СНИМОК АУДИТА (ground truth — не выдумывай числа сверх этого)');
  L.push(`Клиент: ${s.client.name ?? 'не указан'}${s.client.niche ? ` · ниша: ${s.client.niche}` : ''}`);
  L.push(`Заполненность опросника L1: ${s.coverage.answered}/${s.coverage.total} (${s.coverage.pct}%)`);
  L.push(`Доступов выдано: ${s.accessGranted}`);
  L.push(`Уверенность в выводах (Confidence): ${s.confidence.score}/100`);

  if (s.health.score !== null) {
    L.push(`Health Score: ${s.health.score}/100 — «${s.health.band}». Рекомендация метода: ${s.health.action}. (A-зрелость ${s.health.scoreA ?? '—'}, B-разрывы ${s.health.scoreB ?? '—'})`);
    // Непроверенный разрыв — не пройденный разрыв. Без этой строки модель видит
    // высокий балл и пустой список разрывов и делает вывод «рисков нет».
    if (s.health.provisional)
      L.push(`⚠️ Оценка ПРЕДВАРИТЕЛЬНАЯ: из ${s.health.gapCoverage.total} критических разрывов проверено ответом ${s.health.gapCoverage.checked}. Балл отражает только зрелость; вывода «рисков нет» делать нельзя — их не проверяли.`);
  } else
    L.push('Health Score: пока не считается — мало заполненных доменов (нужно ≥30 ответов).');

  if (s.money.show) {
    L.push(`\n## Деньги (недополученный оборот)`);
    L.push(`Консервативно: ${fmtMoney(s.money.consMin)}–${fmtMoney(s.money.consMax)} в год; вклад/мес ≈ ${fmtMoney(s.money.monthly)}.`);
    if (s.money.forecast)
      L.push(`Прогноз 12 мес: текущий ${fmtMoney(s.money.forecast.current)} → с программой ${fmtMoney(s.money.forecast.withProgram)} (+${s.money.forecast.upliftPct}%).`);
    if (s.money.levers?.length) {
      L.push('Рычаги воронки (факт → цель, вклад ₴/год):');
      for (const lv of s.money.levers)
        L.push(`  · ${lv.label}: ${fmt(lv.fact)} → ${fmt(lv.target)}${lv.contribYear ? ` · вклад ${fmtMoney(lv.contribYear)}` : ''}${lv.source ? ` [${lv.source}]` : ''}`);
    }
  } else {
    L.push('\n## Деньги: секция не заполнена (нет baseline трафика/конверсии/чека — считать оборот преждевременно).');
  }

  if (s.gaps.length) {
    L.push('\n## Критические разрывы (Health Score штрафы)');
    for (const g of s.gaps)
      L.push(`  · ${g.id} «${g.label}» (−${g.penalty})${g.costYear ? ` · цена бездействия ≈ ${fmtMoney(g.costYear)}/год` : ''} — ${g.evidence}`);
  }

  if (s.decisions.length) {
    L.push('\n## Решения движка (приоритет = влияние/сложность), с трассой «почему»');
    for (const d of s.decisions.slice(0, 10)) {
      L.push(`  · ${d.id} ${d.title} — impact ${d.impact}/сложность ${d.difficulty}, ~${d.timeDays} дн, ROI ${d.roi}, плейбуки: ${d.playbooks.join(', ')}`);
      for (const w of d.why) L.push(`      — ${w}`);
    }
  }

  if (s.rules.length) {
    L.push('\n## Активированные правила роутинга (разрыв → плейбук)');
    for (const r of s.rules) L.push(`  · ${r.id} [${r.priority}] ${r.area}: ${r.trigger} → ${r.playbooks}`);
  }

  if (s.contradictions.length) {
    L.push('\n## Противоречия в ответах (снижают доверие)');
    for (const c of s.contradictions) L.push(`  · ${c.title} — ${c.detail}`);
  }
  return L.join('\n');
}

/* ── Офлайн-ответчик: когда API-ключ не настроен ── */
type Intent = 'health' | 'money' | 'decisions' | 'fix_first' | 'contradictions' | 'coverage' | 'gaps' | 'help';

function classify(q: string): Intent {
  const t = q.toLowerCase();
  if (/health|скор|зрел|балл|оценк|состояни/.test(t)) return 'health';
  if (/деньг|оборот|₴|выручк|потенциал|прогноз|заработ/.test(t)) return 'money';
  if (/что.*делать|решени|приоритет|план|с чего/.test(t)) return t.includes('перв') || t.includes('снача') ? 'fix_first' : 'decisions';
  if (/противореч|нестыков|расхожд/.test(t)) return 'contradictions';
  if (/заполн|покрыт|сколько.*ответ|прогресс|доступ/.test(t)) return 'coverage';
  if (/разрыв|дыр|пробел|штраф/.test(t)) return 'gaps';
  return 'help';
}

/** Детерминированный ответ по снимку — работает офлайн, без LLM. */
export function localAnswer(q: string, s: AuditSnapshot): string {
  switch (classify(q)) {
    case 'health':
      return s.health.score === null
        ? `Health Score пока не считается: заполнено ${s.coverage.answered}/${s.coverage.total} ответов (нужно ≥30 по ключевым доменам). Заполните опросник — и я покажу балл и зону.`
        : `Health Score: **${s.health.score}/100** — «${s.health.band}».\nРекомендация метода: ${s.health.action}\nСоставляющие: зрелость (A) ${s.health.scoreA ?? '—'}, разрывы (B) ${s.health.scoreB ?? '—'}. Уверенность в выводах — ${s.confidence.score}/100.`;
    case 'money':
      if (!s.money.show) return 'Секция денег ещё не заполнена — нет baseline (трафик, конверсия, чек). До этого любая цифра оборота была бы выдумкой. Занесите 8-рычаговый baseline на странице отчёта — и я посчитаю недополученный оборот и прогноз.';
      return `Недополученный оборот (консервативно): **${fmtMoney(s.money.consMin)}–${fmtMoney(s.money.consMax)} в год**, вклад ≈ ${fmtMoney(s.money.monthly)}/мес.${s.money.forecast ? `\nПрогноз 12 мес: ${fmtMoney(s.money.forecast.current)} → ${fmtMoney(s.money.forecast.withProgram)} (+${s.money.forecast.upliftPct}%).` : ''}\nСчитается цепной атрибуцией по рычагам воронки — суммировать разрывы по рычагам нельзя.`;
    case 'fix_first': {
      const first = s.decisions[0];
      if (!first) return 'Пока недостаточно данных для приоритизации. Заполните боли, цели и ключевые ответы опросника.';
      return `С чего начать — **${first.title}** (${first.id}).\nПочему сначала: ${first.why.join('; ')}.\nЭффект/сложность ${first.impact}/${first.difficulty}, срок ~${first.timeDays} дн, плейбуки: ${first.playbooks.join(', ')}.`;
    }
    case 'decisions':
      if (!s.decisions.length) return 'Движок пока не активировал решений — заполните боли/цели и опросник.';
      return 'Приоритетные решения (влияние/сложность):\n' + s.decisions.slice(0, 5)
        .map((d, i) => `${i + 1}. ${d.title} (${d.id}) — ROI ${d.roi}, ~${d.timeDays} дн · ${d.playbooks.join(', ')}\n   почему: ${d.why[0] ?? ''}`).join('\n');
    case 'contradictions':
      if (!s.contradictions.length) return 'Противоречий в ответах не найдено — доверие к выводам не понижено.';
      return 'Найдены противоречия (стоит уточнить у клиента):\n' + s.contradictions.map((c) => `• ${c.title} — ${c.detail}`).join('\n');
    case 'coverage':
      return `Опросник L1: ${s.coverage.answered}/${s.coverage.total} (${s.coverage.pct}%). Доступов выдано: ${s.accessGranted}. Уверенность в выводах: ${s.confidence.score}/100.\nСильнее всего балл поднимут: ${s.confidence.factors.slice(0, 3).map((f) => f.label).join('; ')}.`;
    case 'gaps':
      if (!s.gaps.length) return 'Критических разрывов не зафиксировано (по контрольным вопросам разрывов нет «Нет»).';
      return 'Критические разрывы (штраф к Health Score):\n' + s.gaps.map((g) => `• ${g.label} (−${g.penalty})${g.costYear ? ` ≈ ${fmtMoney(g.costYear)}/год` : ''}`).join('\n');
    default:
      return 'Я со-пилот аудита Commerce OS. Спросите про Health Score, недополученный оборот, приоритетные решения («с чего начать»), критические разрывы, противоречия в ответах или что запросить у клиента. Для развёрнутых ответов подключите ANTHROPIC_API_KEY в окружении портала.';
  }
}

/* ── Хук: собирает снимок из живого состояния портала ── */
export function useAuditSnapshot(): { snapshot: AuditSnapshot | null; loaded: boolean } {
  const { member } = useApp();
  const { rows, loaded } = useAnswers();
  const { meta } = useReportMeta(member.client_id ?? 'demo');
  const [accessGranted, setAccessGranted] = useState(0);

  useEffect(() => {
    if (DEMO) {
      try {
        const m = JSON.parse(localStorage.getItem('weexp-demo-access') ?? '{}');
        setAccessGranted(Object.values(m).filter((r: any) => r.status === 'Выдан').length);
      } catch { /* noop */ }
      return;
    }
    supabase.from('access_status').select('status').eq('client_id', member.client_id!)
      .then(({ data }) => setAccessGranted((data ?? []).filter((r) => r.status === 'Выдан').length));
  }, [member.client_id]);

  const snapshot = useMemo(
    () => (loaded ? buildSnapshot(rows, meta, accessGranted) : null),
    [rows, meta, accessGranted, loaded],
  );
  return { snapshot, loaded };
}
