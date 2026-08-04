import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, DEMO } from './supabase';

/** Мета отчёта: статус draft/final, резюме, скрытые риски, деньги, L0-замеры. */
export type LeverKey = 'traffic' | 'cr' | 'aov' | 'pay' | 'redeem' | 'base' | 'repeat' | 'opr';
export type LeverRow = { fact: number; target: number; source?: string };
export type Levers = Record<LeverKey, LeverRow>;

export type Money = {
  show: boolean;
  revenueK?: number; // тыс ₴/мес (старая 2-рычаговая модель)
  cr: number;
  crTarget: number;
  repeat: number;
  repeatTarget: number;
  consMin: number; // ₴/год консервативно
  consMax: number;
  monthly: number;
  comment?: string;
  levers?: Levers; // 8-рычаговый baseline (AD-13)
  waterfall?: { key: LeverKey; label: string; value: number }[]; // вклад рычага, ₴/год
  dateTaken?: string;
  period?: string;
};

export type L0Row = { url: string; kind: 'client' | 'competitor'; score: number | null; lcp: number | null; cls: number | null; error?: string };

export type ScreenCheck = { id: string; label: string; group: string; pass: boolean; detail?: string };
export type ScreenRow = {
  url: string;
  kind: 'client' | 'competitor';
  score: number | null; // % пройденных проверок против голд-стандарта
  checks: ScreenCheck[];
  error?: string;
};

export type BudgetItem = { id: string; qty: number; min: number; max: number; months?: number };
export type Budget = { items: BudgetItem[]; eurRate: number; show?: boolean };

export type ReportMeta = {
  client_id: string;
  status: 'draft' | 'final';
  summary: string | null;
  hidden: string[];
  money: Money | null;
  l0: L0Row[] | null;
  screen: ScreenRow[] | null;
  budget: Budget | null;
  hypotheses: unknown[] | null;
};

const LS_META = 'weexp-demo-meta';
const emptyMeta = (clientId: string): ReportMeta => ({
  client_id: clientId,
  status: 'draft',
  summary: null,
  hidden: [],
  money: null,
  l0: null,
  screen: null,
  budget: null,
  hypotheses: null,
});

export function useReportMeta(clientId: string) {
  const [meta, setMeta] = useState<ReportMeta | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (DEMO) {
      try {
        setMeta({ ...emptyMeta(clientId), ...JSON.parse(localStorage.getItem(LS_META) ?? '{}') });
      } catch {
        setMeta(emptyMeta(clientId));
      }
      return;
    }
    supabase
      .from('report_meta')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()
      .then(({ data }) => setMeta(data ? { ...emptyMeta(clientId), ...data } : emptyMeta(clientId)));
  }, [clientId]);

  const save = useCallback(
    (patch: Partial<ReportMeta>) => {
      setMeta((prev) => {
        const next = { ...(prev ?? emptyMeta(clientId)), ...patch };
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          if (DEMO) localStorage.setItem(LS_META, JSON.stringify(next));
          else supabase.from('report_meta').upsert(next, { onConflict: 'client_id' });
        }, 600);
        return next;
      });
    },
    [clientId],
  );

  return { meta, save };
}

/**
 * 8 рычагов модели выручки Commerce OS (AD-13 Baseline).
 * Выручка/мес = новая (трафик × CR × чек × оплата × выкуп)
 *             + повторная (база × доля повторных/мес × заказов на повторного × чек × оплата × выкуп).
 */
export const LEVER_DEFS: { key: LeverKey; label: string; unit: string; hint: string }[] = [
  { key: 'traffic', label: 'Трафик', unit: 'сессий/мес', hint: 'GA4 → Сессии за месяц' },
  { key: 'cr', label: 'Конверсия', unit: '%', hint: 'GA4 → заказы / сессии' },
  { key: 'aov', label: 'Средний чек', unit: '₴', hint: 'Выгрузка заказов' },
  { key: 'pay', label: 'Оплата заявок', unit: '%', hint: 'Доля заявок, дошедших до оплаты' },
  { key: 'redeem', label: 'Выкуп', unit: '%', hint: 'Доля отправлений, выкупленных на почте' },
  { key: 'base', label: 'Активная база', unit: 'чел', hint: 'CRM → покупатели за 24 мес с контактом' },
  { key: 'repeat', label: 'Повторные за месяц', unit: '%', hint: 'Доля базы, покупающая в месяц (месячная, не lifetime!)' },
  { key: 'opr', label: 'Заказов на повторного', unit: 'шт', hint: 'Среднее заказов повторного клиента в месяц' },
];

export const DEFAULT_LEVERS: Levers = {
  traffic: { fact: 0, target: 0 },
  cr: { fact: 0, target: 0 },
  aov: { fact: 0, target: 0 },
  pay: { fact: 100, target: 100 },
  redeem: { fact: 100, target: 100 },
  base: { fact: 0, target: 0 },
  repeat: { fact: 0, target: 0 },
  opr: { fact: 1, target: 1 },
};

const monthlyRevenue = (v: Record<LeverKey, number>) => {
  const perOrder = v.aov * (v.pay / 100) * (v.redeem / 100);
  return v.traffic * (v.cr / 100) * perOrder + v.base * (v.repeat / 100) * v.opr * perOrder;
};

/**
 * Цепная атрибуция: вклад рычага i = R(рычаги 1..i цель) − R(рычаги 1..i−1 цель).
 * Σ вкладов = потенциал по построению — контроль сходимости из метода.
 */
export function computeGap8(levers: Levers) {
  const clamp = (k: LeverKey, t: number, f: number) => {
    if (k === 'cr') return Math.min(t, Math.max(f, 0.1) * 3);
    if (k === 'repeat') return Math.min(t, 80);
    if (k === 'pay' || k === 'redeem') return Math.min(t, 100);
    return t;
  };
  const fact = {} as Record<LeverKey, number>;
  const target = {} as Record<LeverKey, number>;
  for (const d of LEVER_DEFS) {
    fact[d.key] = levers[d.key]?.fact ?? 0;
    target[d.key] = clamp(d.key, levers[d.key]?.target ?? 0, fact[d.key]) || fact[d.key];
  }
  const rFact = monthlyRevenue(fact);
  const rTarget = monthlyRevenue(target);
  const waterfall: { key: LeverKey; label: string; value: number }[] = [];
  const cur = { ...fact };
  let prev = rFact;
  for (const d of LEVER_DEFS) {
    cur[d.key] = target[d.key];
    const r = monthlyRevenue(cur);
    waterfall.push({ key: d.key, label: d.label, value: Math.round((r - prev) * 12) });
    prev = r;
  }
  const potential = Math.round((rTarget - rFact) * 12); // ₴/год, полный
  const conservative = Math.round(potential * 0.55);
  return {
    rFact: Math.round(rFact),
    rTarget: Math.round(rTarget),
    potential,
    conservative,
    monthly: Math.round(conservative / 12),
    waterfall: waterfall.filter((w) => w.value !== 0),
    sumCheck: Math.abs(waterfall.reduce((s, w) => s + w.value, 0) - potential) <= Math.max(12, potential * 0.001),
  };
}

/** Расчёт денег — та же цепная модель, что в калькуляторе сайта. */
export function computeMoney(input: {
  revenueK: number;
  cr: number;
  crTarget: number;
  repeat: number;
  repeatTarget: number;
}): Pick<Money, 'consMin' | 'consMax' | 'monthly'> {
  const R = input.revenueK * 1000 * 12;
  const crF = Math.min(Math.max(input.crTarget / Math.max(input.cr, 0.1), 1), 3);
  const rC = Math.min(input.repeat, 80) / 100;
  const rT = Math.max(rC, Math.min(input.repeatTarget, 80) / 100);
  const repF = Math.min(Math.max((1 - rC) / (1 - rT), 1), 1.6);
  const full = R * (crF * repF - 1);
  const cons = full * 0.55;
  return { consMin: Math.round(cons), consMax: Math.round(full), monthly: Math.round(cons / 12) };
}

/** PageSpeed Insights: скорость сайта клиента и конкурентов (mobile). */
export async function runPSI(url: string, key?: string): Promise<Omit<L0Row, 'kind'>> {
  const u = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  u.searchParams.set('url', url);
  u.searchParams.set('strategy', 'mobile');
  u.searchParams.set('category', 'performance');
  if (key) u.searchParams.set('key', key);
  try {
    const r = await fetch(u.toString());
    if (!r.ok) return { url, score: null, lcp: null, cls: null, error: `HTTP ${r.status}` };
    const j = await r.json();
    const lr = j.lighthouseResult;
    return {
      url,
      score: Math.round((lr?.categories?.performance?.score ?? 0) * 100),
      lcp: lr?.audits?.['largest-contentful-paint']?.numericValue
        ? Math.round(lr.audits['largest-contentful-paint'].numericValue / 100) / 10
        : null,
      cls: lr?.audits?.['cumulative-layout-shift']?.numericValue ?? null,
    };
  } catch (e) {
    return { url, score: null, lcp: null, cls: null, error: String(e).slice(0, 80) };
  }
}
