import type { Report } from './report';
import type { AnswerRow } from './supabase';
import type { Levers, Money, ReportMeta } from './consultant';
import type { Contradiction } from './contradictions';
import { CAUSAL_CHAINS, type CausalChain } from '../data/engine';
import { byId } from './model';

/**
 * Decision Engine: IF-условия над ответами, рычагами и результатами скрининга →
 * решение с Impact / Difficulty / сроком / ROI и полной трассой «почему»
 * (объяснимость: каждое решение показывает сработавшие условия и их источники).
 */

export type Ctx = {
  report: Report;
  rows: Record<string, AnswerRow>;
  painIds: string[];
  goalIds: string[];
  levers?: Levers | null;
  meta?: ReportMeta | null;
};

export type Decision = {
  id: string;
  title: string;
  impact: number; // 1–10 влияние на деньги
  difficulty: number; // 1–10 сложность внедрения
  timeDays: number;
  playbooks: string[];
  why: string[]; // сработавшие условия с фактическими значениями
  roi: 'High' | 'Medium' | 'Long-term';
};

const ans = (ctx: Ctx, qid: string) => ctx.rows[qid]?.answer ?? '';
const has = (ctx: Ctx, qid: string, val: string) =>
  ans(ctx, qid).split(' | ').some((p) => p === val || p.startsWith(`${val}:`));
const numAns = (ctx: Ctx, qid: string) => parseFloat(ans(ctx, qid).replace(',', '.')) || null;

type RuleDef = {
  id: string;
  title: string;
  impact: number;
  difficulty: number;
  timeDays: number;
  playbooks: string[];
  eval: (ctx: Ctx) => string[] | null; // null = не сработало; иначе условия с фактами
};

const RULES: RuleDef[] = [
  {
    id: 'DE-01', title: 'Построить CRM-контур (сегменты + автоматические цепочки)',
    impact: 9, difficulty: 3, timeDays: 30, playbooks: ['PB-08'],
    eval: (c) => {
      const why: string[] = [];
      const email = numAns(c, 'CR-001');
      if (email !== null && email < 10) why.push(`Выручка из email/SMS = ${email}% (норма ≥ 15%) · CR-001`);
      if (has(c, 'CR-004', 'Нет')) why.push('Сегментации базы нет · CR-004 = «Нет»');
      const base = c.levers?.base.fact ?? 0;
      const rep = c.levers?.repeat.fact ?? null;
      if (base > 1000 && rep !== null && rep < 10) why.push(`База ${base} покупателей, повторных лишь ${rep}%/мес — контур окупится быстро`);
      return why.length ? why : null;
    },
  },
  {
    id: 'DE-02', title: 'Посчитать юнит-экономику по каналам и SKU',
    impact: 9, difficulty: 2, timeDays: 21, playbooks: ['PB-12'],
    eval: (c) => {
      const why: string[] = [];
      if (has(c, 'FI-002', 'Нет')) why.push('Юнит-экономика не считается · FI-002 = «Нет»');
      if (has(c, 'FI-127', 'Не распределяются')) why.push('Накладные не распределяются по каналам · FI-127');
      if (c.painIds.includes('ads_expensive')) why.push('Заявленная боль: «Реклама дорожает, прибыль — нет»');
      return why.length >= 1 && (has(c, 'FI-002', 'Нет') || has(c, 'FI-002', 'Частично')) ? why : null;
    },
  },
  {
    id: 'DE-03', title: 'Перестроить аналитику: единый источник правды',
    impact: 8, difficulty: 3, timeDays: 30, playbooks: ['PB-10', 'PB-11'],
    eval: (c) => {
      const why: string[] = [];
      if (has(c, 'AN-003', 'Нет')) why.push('Единого источника правды по выручке нет · AN-003');
      if (has(c, 'AN-002', '>15%') || has(c, 'AN-002', 'Не сверялось')) why.push(`Аналитика и бэкенд: ${ans(c, 'AN-002')} · AN-002`);
      return why.length ? why : null;
    },
  },
  {
    id: 'DE-04', title: 'Технический SEO: вернуть бесплатный канал',
    impact: 7, difficulty: 4, timeDays: 45, playbooks: ['PB-04', 'PB-05'],
    eval: (c) => {
      const why: string[] = [];
      if (has(c, 'SE-002', 'Нет')) why.push('Технический SEO-аудит не проводился · SE-002');
      const client = (c.meta?.screen ?? []).find((s) => s.kind === 'client' && s.score != null);
      if (client) {
        const seoFails = client.checks.filter((x) => x.group === 'SEO' && !x.pass);
        if (seoFails.length >= 4) why.push(`Скрининг: провалено ${seoFails.length}/10 SEO-проверок (${seoFails.slice(0, 3).map((f) => f.label).join(', ')}…)`);
      }
      return why.length ? why : null;
    },
  },
  {
    id: 'DE-05', title: 'CRO-программа: конверсия ниже порога окупаемости трафика',
    impact: 8, difficulty: 4, timeDays: 45, playbooks: ['PB-15', 'PB-02'],
    eval: (c) => {
      const cr = c.levers?.cr.fact ?? null;
      const traffic = c.levers?.traffic.fact ?? 0;
      if (cr !== null && cr > 0 && cr < 1.5 && traffic > 20000)
        return [`CR = ${cr}% при трафике ${traffic.toLocaleString()} сессий/мес — каждые +0.1 п.п. конверсии = деньги без роста бюджета`];
      if (c.painIds.includes('low_conversion')) return ['Заявленная боль: «Низкая конверсия сайта»'];
      return null;
    },
  },
  {
    id: 'DE-06', title: 'Скорость сайта: догнать конкурентов',
    impact: 6, difficulty: 3, timeDays: 30, playbooks: ['PB-14'],
    eval: (c) => {
      const l0 = c.meta?.l0 ?? [];
      const mine = l0.filter((r) => r.kind === 'client' && r.score != null).map((r) => r.score!);
      const their = l0.filter((r) => r.kind === 'competitor' && r.score != null).map((r) => r.score!);
      if (!mine.length || !their.length) return null;
      const my = Math.min(...mine);
      const avg = Math.round(their.reduce((s, v) => s + v, 0) / their.length);
      return my + 10 < avg ? [`PageSpeed: у вас ${my}, у конкурентов в среднем ${avg} — мобильный трафик конвертируется хуже`] : null;
    },
  },
  {
    id: 'DE-07', title: 'Управленческий P&L и финансовая дисциплина',
    impact: 8, difficulty: 3, timeDays: 30, playbooks: ['PB-11', 'PB-53'],
    eval: (c) => {
      const why: string[] = [];
      if (has(c, 'FI-001', 'Нет')) why.push('Управленческого P&L нет · FI-001');
      if (has(c, 'FI-014', 'Нерегулярно')) why.push('Отчётность нерегулярна · FI-014');
      if (c.painIds.includes('cashflow')) why.push('Заявленная боль: «Кассовые разрывы»');
      return why.some((w) => w.includes('FI-001')) ? why : null;
    },
  },
  {
    id: 'DE-08', title: 'Программа лояльности поверх работающего CRM',
    impact: 6, difficulty: 4, timeDays: 45, playbooks: ['PB-09'],
    eval: (c) => {
      const base = c.levers?.base.fact ?? 0;
      const rep = c.levers?.repeat.fact ?? null;
      if (base > 3000 && rep !== null && rep >= 10 && !has(c, 'CR-004', 'Нет'))
        return [`База ${base.toLocaleString()} и повторные ${rep}%/мес — есть на чем строить лояльность (после CRM-контура)`];
      return null;
    },
  },
  {
    id: 'DE-09', title: 'Выход на маркетплейсы ЕС — только после юнит-экономики',
    impact: 7, difficulty: 8, timeDays: 90, playbooks: ['PB-22', 'PB-23'],
    eval: (c) => {
      const why: string[] = [];
      if (c.goalIds.includes('g_eu')) why.push('Цель: «Выход в Европу / экспорт»');
      if (has(c, 'IN-001', 'Да')) why.push('IN-001: хотят в ЕС');
      if (!why.length) return null;
      if (has(c, 'FI-002', 'Нет')) why.push('⚠ Блокер: юнит-экономика не считается (FI-002) — сначала PB-12, иначе маржа в ЕС неизвестна');
      if (has(c, 'IN-020', 'Нет')) why.push('Юрлица в ЕС нет (IN-020) — в план входит юридический контур');
      return why;
    },
  },
  {
    id: 'DE-10', title: 'Автоматизация операций / ERP',
    impact: 7, difficulty: 7, timeDays: 90, playbooks: ['PB-16', 'PB-18'],
    eval: (c) => {
      const why: string[] = [];
      if (has(c, 'SL-012', 'Полностью вручную')) why.push('Заказы обрабатываются полностью вручную · SL-012');
      if (has(c, 'OP-009', 'Нет ERP')) why.push('ERP нет · OP-009');
      if (c.painIds.includes('ops_chaos') || c.painIds.includes('no_scale')) why.push('Заявленная боль: ручные операции / потолок роста');
      return why.length >= 2 ? why : null;
    },
  },
  {
    id: 'DE-11', title: 'Зафиксировать Value Proposition и позиционирование',
    impact: 6, difficulty: 3, timeDays: 21, playbooks: ['PB-39', 'PB-37'],
    eval: (c) => {
      const why: string[] = [];
      if (has(c, 'PX-013', 'Нет')) why.push('Письменного Value Proposition нет · PX-013');
      if (c.painIds.includes('no_brand')) why.push('Заявленная боль: «Не отличаемся от конкурентов»');
      return why.length ? why : null;
    },
  },
  {
    id: 'DE-12', title: 'Чистка ассортимента: разморозить капитал',
    impact: 6, difficulty: 3, timeDays: 21, playbooks: ['PB-28'],
    eval: (c) => {
      const why: string[] = [];
      if (c.painIds.includes('assortment')) why.push('Заявленная боль: «Ассортимент не управляется»');
      if (c.painIds.includes('cashflow')) why.push('Кассовые разрывы — типичный симптом замороженного стока');
      if (has(c, 'PD-005', 'Никак')) why.push('Спрос не прогнозируется · PD-005');
      return why.length >= 2 ? why : null;
    },
  },
];

export function runDecisions(ctx: Ctx): Decision[] {
  const out: Decision[] = [];
  for (const r of RULES) {
    const why = r.eval(ctx);
    if (!why) continue;
    const ratio = r.impact / r.difficulty;
    out.push({
      id: r.id, title: r.title, impact: r.impact, difficulty: r.difficulty,
      timeDays: r.timeDays, playbooks: r.playbooks, why,
      roi: ratio >= 2.5 ? 'High' : ratio >= 1.2 ? 'Medium' : 'Long-term',
    });
  }
  // приоритет: отношение влияния к сложности, затем влияние
  return out.sort((a, b) => b.impact / b.difficulty - a.impact / a.difficulty || b.impact - a.impact);
}

/* ── Confidence Score: доверие к выводам отчёта ── */
export type Confidence = { score: number; factors: { label: string; delta: number }[] };

export function computeConfidence(
  report: Report,
  contradictions: Contradiction[],
  accessGranted: number,
  meta?: ReportMeta | null,
  decisionFilled?: boolean,
): Confidence {
  const factors: { label: string; delta: number }[] = [];
  const add = (label: string, delta: number) => { if (delta !== 0) factors.push({ label, delta }); };

  const coverage = report.totalL1 ? report.answeredL1 / report.totalL1 : 0;
  add(`Заполненность опросника ${Math.round(coverage * 100)}%`, Math.round(coverage * 40));
  add(`Доступы и выгрузки: ${accessGranted}/26`, Math.round((Math.min(accessGranted, 12) / 12) * 15));

  const levers = meta?.money?.levers;
  if (levers) {
    const sys = Object.values(levers).filter((l) => l.source && l.source !== 'Оценка клиента').length;
    add(`Baseline из данных систем: ${sys}/8 рычагов`, Math.round((sys / 8) * 20));
  } else add('Baseline не зафиксирован', 0);

  if ((meta?.l0 ?? []).length || (meta?.screen ?? []).length) add('Внешние замеры (PSI/скрининг) сделаны', 8);
  if (decisionFilled) add('Бриф ЛПР и рамки заполнены', 7);
  add(`Противоречия в ответах: ${contradictions.length}`, -Math.min(contradictions.length * 3, 15));
  if (meta?.status === 'final') add('Проверено консультантом', 10);

  const score = Math.max(5, Math.min(100, factors.reduce((s, f) => s + f.delta, 0)));
  return { score, factors };
}

/* ── Цена бездействия по каждому разрыву ── */
export function gapCosts(report: Report, money?: Money | null): Map<string, number> {
  const out = new Map<string, number>();
  if (!money?.consMin || !report.gaps.length) return out;
  const totalPenalty = report.gaps.reduce((s, g) => s + g.penalty, 0);
  for (const g of report.gaps) out.set(g.id, Math.round((money.consMin * g.penalty) / totalPenalty));
  return out;
}

/* ── Прогноз 12 месяцев ── */
export function forecast(money?: Money | null): { current: number; withProgram: number; upliftPct: number } | null {
  const levers = money?.levers;
  if (!levers || !money?.consMin) return null;
  const perOrder = levers.aov.fact * (levers.pay.fact / 100) * (levers.redeem.fact / 100);
  const monthly = levers.traffic.fact * (levers.cr.fact / 100) * perOrder
    + levers.base.fact * (levers.repeat.fact / 100) * levers.opr.fact * perOrder;
  const current = Math.round(monthly * 12);
  if (!current) return null;
  return { current, withProgram: current + money.consMin, upliftPct: Math.round((money.consMin / current) * 100) };
}

/* ── Причинные цепочки: какие активны у этого клиента ── */
export function activeChains(ctx: Ctx): (CausalChain & { confirmedRoots: string[] })[] {
  return CAUSAL_CHAINS
    .filter((c) => !c.painId || ctx.painIds.includes(c.painId))
    .map((c) => ({
      ...c,
      confirmedRoots: c.roots
        .filter((r) => r.checkQids.some((q) => {
          const a = ans(ctx, q);
          return a && /нет|вручную|не |никак|>15%/i.test(a);
        }))
        .map((r) => r.cause),
    }))
    .filter((c) => ctx.painIds.includes(c.painId ?? '') || c.confirmedRoots.length);
}

export const qText = (qid: string) => byId.get(qid)?.text ?? qid;

/* ── Гипотезы (Continuous Consulting) ── */
export type Hypothesis = {
  id: string;
  text: string;
  evidence: string;
  confidence: number; // 25/50/75/100 — шкала метода
  validation: string; // как проверяем
  owner: string;
  deadline: string;
  status: 'open' | 'confirmed' | 'rejected';
};

export function seedHypotheses(decisions: Decision[]): Hypothesis[] {
  return decisions.slice(0, 5).map((d, i) => ({
    id: `H-${i + 1}`,
    text: `${d.title} даст измеримый эффект в течение ${d.timeDays} дней`,
    evidence: d.why[0] ?? '',
    confidence: d.roi === 'High' ? 75 : 50,
    validation: 'A/B или до/после по метрике рычага, сверка на 3-м месяце (XX-01)',
    owner: 'weexp',
    deadline: '',
    status: 'open',
  }));
}
