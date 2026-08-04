import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, DEMO } from './supabase';

/** Мета отчёта: статус draft/final, резюме, скрытые риски, деньги, L0-замеры. */
export type Money = {
  show: boolean;
  revenueK: number; // тыс ₴/мес
  cr: number;
  crTarget: number;
  repeat: number;
  repeatTarget: number;
  consMin: number; // ₴/год консервативно
  consMax: number;
  monthly: number;
  comment?: string;
};

export type L0Row = { url: string; kind: 'client' | 'competitor'; score: number | null; lcp: number | null; cls: number | null; error?: string };

export type ReportMeta = {
  client_id: string;
  status: 'draft' | 'final';
  summary: string | null;
  hidden: string[];
  money: Money | null;
  l0: L0Row[] | null;
};

const LS_META = 'weexp-demo-meta';
const emptyMeta = (clientId: string): ReportMeta => ({
  client_id: clientId,
  status: 'draft',
  summary: null,
  hidden: [],
  money: null,
  l0: null,
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
