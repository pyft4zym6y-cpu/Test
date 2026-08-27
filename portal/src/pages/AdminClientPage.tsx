import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, DEMO } from '../lib/supabase';
import { buildReport } from '../lib/report';
import {
  useReportMeta, runPSI, computeGap8, LEVER_DEFS, DEFAULT_LEVERS,
  type L0Row, type Levers, type LeverKey,
} from '../lib/consultant';
import { PASSPORT_QID, LINKS_QID, PAINS_QID, GOALS_QID, tacticalPainsOf, painById, goalById, type Passport, type Links } from '../data/pains';
import {
  runDecisions, computeConfidence, gapCosts, forecast, activeChains, seedHypotheses,
  type Hypothesis,
} from '../lib/engine';
import { LADDERS, levelFromHealth, EVIDENCE, evidenceForSource, PB_PREREQS } from '../data/engine';
import { DECISION_QID, selfScore, type Decision } from '../data/decision';
import { detectContradictions } from '../lib/contradictions';
import { parseOrdersCsv, type OrdersMetrics } from '../lib/orders';
import { screenUrl } from '../lib/screen';
import { buildGantt, ganttCsv, scopeEffort } from '../lib/gantt';
import { RATE_ITEMS, EUR_RATE_DEFAULT } from '../data/rates';
import { byId, QUESTIONS, ACCESSES } from '../lib/model';
import qmetaRaw from '../data/question-meta.json';
import sheetMetaRaw from '../data/sheet-meta.json';
const SHEET_NAME = sheetMetaRaw as Record<string, string>;
import { AQC_ITEMS, AQC_PAGES, SEVERITY_COLOR, type AqcPage, type AqcVerdict } from '../data/aqc';
import { plan as abPlan, mde as abMde, readResult as abRead } from '../lib/experiments';
const QMETA = qmetaRaw as Record<string, { interp: string; pb: string; deliv: string; kpi: string }>;
import type { AnswerRow } from '../lib/supabase';

const LEVER_SOURCES = ['GA4', 'CRM', 'Выгрузка заказов', 'Кабинет площадки', 'Оценка клиента'];

export default function AdminClientPage() {
  const { clientId = 'demo' } = useParams();
  const [rows, setRows] = useState<Record<string, AnswerRow>>({});
  const [loaded, setLoaded] = useState(false);
  const { meta, save } = useReportMeta(clientId);
  const [psiBusy, setPsiBusy] = useState(false);
  const [leversDraft, setLeversDraft] = useState<Levers | null>(null);
  const [baseMeta, setBaseMeta] = useState<{ dateTaken?: string; period?: string } | null>(null);
  const [orders, setOrders] = useState<OrdersMetrics | null>(null);
  const [ordersErr, setOrdersErr] = useState('');
  const [screenBusy, setScreenBusy] = useState(false);
  const [ga4Msg, setGa4Msg] = useState('');
  const [budgetSel, setBudgetSel] = useState<Record<string, number> | null>(null); // id -> months (0=off, для разовых 1)
  const [eurRate, setEurRate] = useState(EUR_RATE_DEFAULT);
  const [aqcPage, setAqcPage] = useState<AqcPage>('Карточка (PDP)');
  const [aqcBusy, setAqcBusy] = useState('');
  const [ab, setAb] = useState({ mode: 'plan' as 'plan' | 'mde' | 'read', p1: '', lift: '10', weekly: '', weeks: '4', nA: '', cA: '', nB: '', cB: '' });
  const [abOut, setAbOut] = useState('');

  useEffect(() => {
    if (DEMO) {
      try {
        setRows(JSON.parse(localStorage.getItem('weexp-demo-answers') ?? '{}'));
      } catch { /* noop */ }
      setLoaded(true);
      return;
    }
    supabase.from('answers').select('*').eq('client_id', clientId).then(({ data }) => {
      const map: Record<string, AnswerRow> = {};
      (data ?? []).forEach((r) => (map[r.question_id] = r as AnswerRow));
      setRows(map);
      setLoaded(true);
    });
  }, [clientId]);

  let passport: Passport = {};
  let links: Links = { direct: [], indirect: [], refs: [] };
  try { passport = JSON.parse(rows[PASSPORT_QID]?.answer ?? '{}'); } catch { /* noop */ }
  try { links = { direct: [], indirect: [], refs: [], ...JSON.parse(rows[LINKS_QID]?.answer ?? '{}') }; } catch { /* noop */ }
  const painIds = (rows[PAINS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  const report = useMemo(() => buildReport(rows, painIds), [rows, painIds]);

  const hidden = meta?.hidden ?? [];
  const toggleHidden = (qid: string) =>
    save({ hidden: hidden.includes(qid) ? hidden.filter((x) => x !== qid) : [...hidden, qid] });

  const levers = leversDraft ?? meta?.money?.levers ?? DEFAULT_LEVERS;
  const setLever = (k: LeverKey, field: 'fact' | 'target' | 'source', v: string) =>
    setLeversDraft({ ...levers, [k]: { ...levers[k], [field]: field === 'source' ? v : Number(v) } });
  const bm = baseMeta ?? { dateTaken: meta?.money?.dateTaken, period: meta?.money?.period };
  const gap = computeGap8(levers);
  const hasBaseline = gap.rFact > 0;

  const contradictions = useMemo(() => detectContradictions(rows), [rows]);
  let decision: Decision = {};
  try { decision = JSON.parse(rows[DECISION_QID]?.answer ?? '{}'); } catch { /* noop */ }
  const self = selfScore(decision.self);

  /* Decision Engine + Confidence */
  const goalIds = (rows[GOALS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  const [accessGranted, setAccessGranted] = useState(0);
  useEffect(() => {
    if (DEMO) {
      try {
        const m = JSON.parse(localStorage.getItem('weexp-demo-access') ?? '{}');
        setAccessGranted(Object.values(m).filter((r: any) => r.status === 'Выдан').length);
      } catch { /* noop */ }
      return;
    }
    supabase.from('access_status').select('status').eq('client_id', clientId)
      .then(({ data }) => setAccessGranted((data ?? []).filter((r) => r.status === 'Выдан').length));
  }, [clientId]);

  const engineCtx = useMemo(
    () => ({ report, rows, painIds, goalIds, levers: meta?.money?.levers ?? levers, meta }),
    [report, rows, painIds, goalIds, meta, levers],
  );
  const decisions = useMemo(() => runDecisions(engineCtx), [engineCtx]);
  const conf = useMemo(
    () => computeConfidence(report, contradictions, accessGranted, meta, Boolean(decision.reason)),
    [report, contradictions, accessGranted, meta, decision.reason],
  );
  const chains = useMemo(() => activeChains(engineCtx), [engineCtx]);
  const costs = gapCosts(report, meta?.money);
  const fc = forecast(meta?.money);
  const hyps = (meta?.hypotheses as Hypothesis[] | null) ?? [];
  const setHyp = (i: number, patch: Partial<Hypothesis>) =>
    save({ hypotheses: hyps.map((h, j) => (j === i ? { ...h, ...patch } : h)) });

  const scopePbs = useMemo(() => {
    const set = new Set<string>();
    report.rules.forEach((r) => (r.playbooks?.match(/PB-\d+/g) ?? []).forEach((p) => set.add(p)));
    decisions.forEach((d) => d.playbooks.forEach((p) => set.add(p)));
    return set;
  }, [report.rules, decisions]);
  const prereqNotes = [...scopePbs]
    .filter((pb) => PB_PREREQS[pb])
    .map((pb) => `${pb} — только после ${PB_PREREQS[pb].join(', ')}${PB_PREREQS[pb].some((x) => !scopePbs.has(x)) ? ' (пререквизит вне scope — добавить!)' : ''}`);

  const aqcVerdicts: Record<string, Record<string, string>> = (meta?.aqc as any) ?? {};
  const setAqc = (page: string, id: string, v: AqcVerdict | null) => {
    const pageMap = { ...(aqcVerdicts[page] ?? {}) };
    if (v === null) delete pageMap[id];
    else pageMap[id] = v;
    save({ aqc: { ...aqcVerdicts, [page]: pageMap } });
  };
  const aqcManualStats = (() => {
    let passN = 0, failN = 0;
    const critFails: string[] = [];
    for (const it of AQC_ITEMS) {
      const v = aqcVerdicts[it.page]?.[it.id];
      if (v === 'pass') passN++;
      else if (v === 'fail') { failN++; if (it.severity === 'Critical') critFails.push(it.criterion); }
    }
    return { passN, failN, critFails, done: passN + failN };
  })();

  const runAqcAi = async () => {
    const url = (passport.sites ?? []).filter(Boolean)[0];
    if (!url) { setAqcBusy('Нет сайта клиента в паспорте'); return; }
    setAqcBusy('AI-прогон…');
    try {
      const items = AQC_ITEMS.filter((i) => i.page === aqcPage).map(({ id, criterion, pass }) => ({ id, criterion, pass }));
      const r = await fetch('/api/aqc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, page: aqcPage, items }),
      });
      const j = await r.json();
      if (j.error) { setAqcBusy(j.error); return; }
      const pageMap = { ...(aqcVerdicts[aqcPage] ?? {}) };
      for (const v of j.verdicts ?? []) {
        if (pageMap[v.id] === 'pass' || pageMap[v.id] === 'fail') continue; // ручной вердикт не трогаем
        if (v.verdict === 'pass') pageMap[v.id] = 'ai-pass';
        if (v.verdict === 'fail') pageMap[v.id] = 'ai-fail';
      }
      save({ aqc: { ...aqcVerdicts, [aqcPage]: pageMap } });
      /*
       * Обрезанный прогон — не полный прогон. Когда ответ модели упёрся в
       * max_tokens, часть критериев осталась без вердикта, и на экране они
       * выглядят ровно как «ещё не проверенные». Разница между «проверили, всё
       * чисто» и «до них не дошло» должна быть сказана словами.
       */
      const got = (j.verdicts ?? []).length;
      setAqcBusy(j.truncated
        ? `Ответ модели оборван на лимите: вердикты получены только для ${got} из ${items.length} критериев — остальные не проверены. Запустите ещё раз или разбейте страницу.`
        : `AI-гипотезы получены для ${got} из ${items.length} критериев (достоверность 25) — подтвердите руками`);
    } catch {
      setAqcBusy('API недоступно — AI-прогон работает на хостинге Vercel.');
    }
  };

  const runAb = () => {
    const n = (x: string) => parseFloat(x.replace(',', '.')) || 0;
    try {
      if (ab.mode === 'plan') {
        const r = abPlan(n(ab.p1) / 100, n(ab.lift) / 100, n(ab.weekly));
        setAbOut(`Выборка ${r.n.toLocaleString()}/вариант · всего ${r.total.toLocaleString()} · ${r.weeks === Infinity ? '∞' : r.weeks.toFixed(1)} нед${r.tooLong ? ' · ⚠ дольше 8 недель — тест не окупается: радикальнее изменение, уже сегмент или внедрять без теста' : ''}`);
      } else if (ab.mode === 'mde') {
        const r = abMde(n(ab.p1) / 100, n(ab.weekly), n(ab.weeks));
        setAbOut(r === null
          ? `За ${ab.weeks} нед при ${n(ab.weekly).toLocaleString()} сессий/нед не детектируется ничего: выборки не хватает даже на кратный подъём. Нужен другой трафик, другой срок или внедрение без теста.`
          : `За ${ab.weeks} нед при ${n(ab.weekly).toLocaleString()} сессий/нед детектируем подъём от ${(r * 100).toFixed(1)}% относительных — эффекты меньше не увидите`);
      } else {
        const r = abRead(n(ab.nA), n(ab.cA), n(ab.nB), n(ab.cB));
        setAbOut(r === null
          ? 'Нужны все четыре числа: посетители и конверсии по каждому варианту, конверсий не больше посетителей.'
          : `A ${(r.pA * 100).toFixed(2)}% → B ${(r.pB * 100).toFixed(2)}% · подъём ${(r.lift * 100).toFixed(1)}% · p=${r.p.toFixed(4)} · ${r.significant ? '✓ ЗНАЧИМО' : '✗ не значимо (данных не хватило — смотри границы ДИ)'} · ДИ [${(r.ci[0] * 100).toFixed(2)}; ${(r.ci[1] * 100).toFixed(2)}] п.п.`);
      }
    } catch (e) { setAbOut(String(e)); }
  };
  const writeAbToHyp = (hypId: string) => {
    if (!abOut) return;
    save({ hypotheses: hyps.map((h) => (h.id === hypId ? { ...h, validation: `A/B: ${abOut}` } : h)) });
  };

  const onOrdersFile = (f: File) =>
    f.text().then((t) => {
      const r = parseOrdersCsv(t);
      if ('error' in r) { setOrdersErr(r.error); setOrders(null); }
      else { setOrders(r); setOrdersErr(''); }
    });

  const applyOrders = () => {
    if (!orders) return;
    const src = { source: 'Выгрузка заказов' };
    setLeversDraft({
      ...levers,
      aov: { ...levers.aov, fact: orders.aov, ...src },
      base: { ...levers.base, fact: orders.activeBase, ...src },
      repeat: { ...levers.repeat, fact: orders.monthlyRepeatShare, ...src },
      opr: { ...levers.opr, fact: orders.ordersPerRepeat || 1, ...src },
    });
    setBaseMeta({ ...bm, period: `3 мес (${orders.lastMonth})`, dateTaken: new Date().toLocaleDateString('ru-RU') });
  };

  const pullGa4 = async () => {
    setGa4Msg('Запрашиваю GA4…');
    try {
      const j = await (await fetch('/api/ga4')).json();
      if (j.error) { setGa4Msg(j.error); return; }
      /*
       * Записываем в рычаг только то, что GA4 действительно измерил. Свойство
       * без событий purchase отдаёт сессии и нули по заказам, и раньше эти нули
       * ложились в cr и aov с источником «GA4» — то есть с уровнем достоверности
       * E3, «данные системы». Дальше computeConfidence считала их как baseline
       * из систем и поднимала доверие к выводам за два нуля, которых в данных
       * нет. Ноль, которого не измеряли, в рычаг не попадает.
       */
      const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
      setLeversDraft({
        ...levers,
        ...(num(j.sessionsMonthly) ? { traffic: { ...levers.traffic, fact: j.sessionsMonthly, source: 'GA4' } } : {}),
        ...(num(j.cr) ? { cr: { ...levers.cr, fact: j.cr, source: 'GA4' } } : {}),
        ...(num(j.aov) && !levers.aov.fact ? { aov: { ...levers.aov, fact: j.aov, source: 'GA4' } } : {}),
      });
      setGa4Msg(j.note
        ? `GA4 за ${j.period}: ${j.sessionsMonthly} сессий/мес. ${j.note} — конверсию и чек занесите из выгрузки заказов (AC-13).`
        : `GA4 за ${j.period}: ${j.sessionsMonthly} сессий/мес · CR ${j.cr}% · чек ${j.aov}`);
    } catch {
      setGa4Msg('API недоступно — работает на хостинге Vercel, не в демо.');
    }
  };

  const runScreen = async () => {
    setScreenBusy(true);
    const targets = [
      ...(passport.sites ?? []).filter(Boolean).slice(0, 2).map((u) => ({ url: u, kind: 'client' as const })),
      ...links.direct.map((l) => l.url).filter(Boolean).slice(0, 3).map((u) => ({ url: u, kind: 'competitor' as const })),
    ];
    const out = [];
    for (const t of targets) {
      out.push(await screenUrl(t.url, t.kind));
      save({ screen: [...out] });
    }
    setScreenBusy(false);
  };

  const gantt = useMemo(() => buildGantt(report.rules), [report.rules]);
  const downloadGantt = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + ganttCsv(gantt)], { type: 'text/csv;charset=utf-8' }));
    a.download = `gantt-${clientId}.csv`;
    a.click();
  };

  const selMap: Record<string, number> =
    budgetSel ?? Object.fromEntries((meta?.budget?.items ?? []).map((i) => [i.id, i.months ?? 1]));
  const toggleBudget = (id: string) => {
    const item = RATE_ITEMS.find((r) => r.id === id)!;
    setBudgetSel({ ...selMap, [id]: selMap[id] ? 0 : item.type === 'Разовая' ? 1 : item.months ?? 6 });
  };
  const budgetTotals = useMemo(() => {
    let min = 0, max = 0;
    const blocks = new Map<string, { min: number; max: number }>();
    for (const item of RATE_ITEMS) {
      const m = selMap[item.id];
      if (!m) continue;
      const mult = item.type === 'Разовая' ? 1 : m;
      min += item.min * mult;
      max += item.max * mult;
      const b = blocks.get(item.block) ?? { min: 0, max: 0 };
      blocks.set(item.block, { min: b.min + item.min * mult, max: b.max + item.max * mult });
    }
    return { min, max, blocks };
  }, [selMap]);
  const saveBudget = () =>
    save({
      budget: {
        show: true,
        eurRate,
        items: RATE_ITEMS.filter((r) => selMap[r.id]).map((r) => ({
          id: r.id, qty: 1, min: r.min, max: r.max,
          months: r.type === 'Разовая' ? undefined : selMap[r.id],
        })),
      },
    });

  const runL0 = async () => {
    setPsiBusy(true);
    const targets: { url: string; kind: L0Row['kind'] }[] = [
      ...(passport.sites ?? []).filter(Boolean).slice(0, 2).map((u) => ({ url: u, kind: 'client' as const })),
      ...links.direct.map((l) => l.url).filter(Boolean).slice(0, 3).map((u) => ({ url: u, kind: 'competitor' as const })),
    ];
    const out: L0Row[] = [];
    for (const t of targets) {
      const r = await runPSI(t.url, (import.meta as any).env?.VITE_PSI_KEY);
      out.push({ ...r, kind: t.kind });
      save({ l0: [...out] });
    }
    setPsiBusy(false);
  };

  const exportCsv = () => {
    const esc = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const csv = [
      ['ID', 'Домен', 'Вопрос', 'ОТВЕТ КЛИЕНТА', 'Факты', 'Кто', 'Когда'].map(esc).join(';'),
      ...Object.values(rows)
        .filter((r) => r.answer && !r.question_id.startsWith('NOTIFY'))
        .map((r) => {
          const q = byId.get(r.question_id);
          return [r.question_id, q?.domain ?? '', q?.text ?? '', r.answer, r.facts, r.updated_by, (r as any).updated_at ?? '']
            .map(esc)
            .join(';');
        }),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `ekp-answers-${clientId}.csv`;
    a.click();
  };

  /* AI-резюме: тезисы пересчитываются на каждом рендере из текущих ответов —
     то есть обновляются в реальном времени по мере заполнения брифа клиентом. */
  const aiTheses = useMemo(() => {
    const t: string[] = [];
    const pct = report.totalL1 ? Math.round((report.answeredL1 / report.totalL1) * 100) : 0;
    t.push(`Заполнено ${report.answeredL1}/${report.totalL1} вопросов (${pct}%) — ${pct < 25 ? 'самое начало, выводы предварительные' : pct < 60 ? 'середина пути, картина складывается' : 'достаточно для рабочих выводов'}.`);
    if (report.score !== null)
      t.push(`Health Score ${report.score}/100 (зрелость ${report.scoreA ?? '—'}, критические разрывы ${report.scoreB ?? '—'}) · достоверность ${conf.score}%.`);
    const firePains = tacticalPainsOf(painIds);
    if (firePains.length)
      t.push(`🔥 Горящие боли: ${firePains.map((p) => p.title).join('; ')} — сначала стабилизация, потом стратегия.`);
    const strategicPains = painIds.map((id) => painById(id)).filter((p) => p && !firePains.includes(p as any)).slice(0, 3);
    if (strategicPains.length)
      t.push(`Ключевые боли клиента: ${strategicPains.map((p) => p!.title).join('; ')}.`);
    const goals = goalIds.map((id) => goalById(id)).filter(Boolean).slice(0, 3);
    if (goals.length)
      t.push(`Цели: ${goals.map((g) => g!.title).join('; ')}.`);
    if (report.gaps.length)
      t.push(`Критических разрывов: ${report.gaps.length}. Главный — ${report.gaps[0].label}.`);
    const weak = report.domains.filter((d) => d.health !== null && d.health < 0.5).sort((a, b) => (a.health ?? 0) - (b.health ?? 0)).slice(0, 3);
    if (weak.length)
      t.push(`Слабые домены: ${weak.map((d) => `${SHEET_NAME[d.sheet] ?? d.key} (${Math.round((d.health ?? 0) * 100)}%)`).join(', ')}.`);
    if (contradictions.length)
      t.push(`⚠ Противоречий в ответах: ${contradictions.length} (напр., «${contradictions[0].rule.question}») — уточнить на созвоне.`);
    if (decisions.length)
      t.push(`Движок рекомендует первым делом: ${decisions.slice(0, 3).map((d, i) => `${i + 1}) ${d.title}`).join(' · ')}.`);
    if (hasBaseline && gap.conservative > 0)
      t.push(`Разрыв по 8 рычагам: ≈ ${Math.round(gap.conservative / 1000)} тыс ₴/год недополученного оборота (консервативно).`);
    t.push(`Доступы: выдано ${accessGranted}/${ACCESSES.length}.`);
    return t;
  }, [report, conf.score, painIds, goalIds, contradictions, decisions, hasBaseline, gap, accessGranted]);

  const downloadBrief = () => {
    const answered = QUESTIONS.filter((q) => rows[q.id]?.answer && !q.id.startsWith('NOTIFY'));
    const md = [
      `# Бриф · ${passport.name ?? clientId}`,
      `Выгружено: ${new Date().toLocaleString('ru-RU')} · заполнено ${report.answeredL1}/${report.totalL1}`,
      '',
      '## Резюме (AI, по текущим ответам)',
      ...aiTheses.map((x) => `- ${x}`),
      '',
      '## Ответы',
      ...answered.map((q) => `**${q.id} · ${q.text}**\n> ${rows[q.id].answer}${rows[q.id].facts ? `\n> _Факты: ${rows[q.id].facts}_` : ''}\n`),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
    a.download = `brief-${(passport.name ?? clientId).replace(/[^\wа-яіїє-]+/gi, '-')}.md`;
    a.click();
  };

  if (!loaded || !meta) return <div className="container" style={{ paddingTop: 50 }}><p className="sub">Загрузка…</p></div>;

  return (
    <div className="container" style={{ padding: '30px 20px 80px' }}>
      <Link to="/admin" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← Все клиенты</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
        <h1>{passport.name ?? clientId} · консультантская ветка</h1>
        <span className="tag" style={{ color: meta.status === 'final' ? 'var(--lime-dark)' : 'var(--amber)' }}>
          {meta.status === 'final' ? 'ФИНАЛ ОПУБЛИКОВАН' : 'ЧЕРНОВИК'}
        </span>
      </div>
      <p className="sub">
        Health Score {report.score ?? '—'} ·{' '}
        <b style={{ color: conf.score >= 75 ? 'var(--lime-dark)' : conf.score >= 50 ? 'var(--amber)' : 'var(--red)' }}>
          Confidence {conf.score}%
        </b>{' '}
        · ответов {report.answeredL1}/{report.totalL1} · рисков {report.problems.length} · разрывов{' '}
        {report.gaps.length}
      </p>
      {tacticalPainsOf(painIds).length > 0 && (
        <p style={{ fontSize: 13, margin: '6px 0 0', color: 'var(--red)', fontWeight: 700 }}>
          🔥 Горит: {tacticalPainsOf(painIds).map((tp) => tp.title).join(' · ')} — первая помощь в отчёте, доступы {[...new Set(tacticalPainsOf(painIds).flatMap((tp) => tp.accesses ?? []))].join(', ')}
        </p>
      )}
      <details style={{ marginTop: 4 }}>
        <summary className="mono" style={{ fontSize: 11.5, color: 'var(--muted)', cursor: 'pointer' }}>
          Из чего сложилась достоверность {conf.score}% →
        </summary>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12.5 }}>
          {conf.factors.map((f) => (
            <li key={f.label}>
              {f.label}: <b className="mono" style={{ color: f.delta < 0 ? 'var(--red)' : 'var(--lime-dark)' }}>{f.delta > 0 ? '+' : ''}{f.delta}</b>
            </li>
          ))}
        </ul>
      </details>

      {/* AI-резюме: живые тезисы по мере заполнения брифа */}
      <div className="card" style={{ marginTop: 18, borderColor: 'rgba(101,163,13,0.45)', background: 'rgba(163,230,53,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h2>Резюме AI · обновляется по мере заполнения</h2>
          <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }} onClick={downloadBrief}>
            Скачать бриф + резюме (.md) ↓
          </button>
        </div>
        <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 13.5, lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {aiTheses.map((th, i) => <li key={i}>{th}</li>)}
        </ul>
        <p className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
          Тезисы собираются движком из текущих ответов, противоречий и baseline — без ручной
          работы. Чем больше заполнено, тем точнее выводы; файл включает резюме и все ответы.
        </p>
      </div>

      {/* Decision Engine */}
      <div className="card" style={{ marginTop: 18, borderColor: 'rgba(101,163,13,0.45)' }}>
        <h2>Decision Engine · приоритеты ({decisions.length})</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          Решения из IF-правил над ответами, baseline и замерами. Ранжированы по отношению
          влияния к сложности. Каждое решение объяснимо — разверните «почему».
        </p>
        {decisions.length === 0 ? (
          <p className="sub" style={{ fontSize: 12.5 }}>Пока мало данных — правила не сработали.</p>
        ) : (
          decisions.map((d, i) => {
            const quadrant = d.horizon === 'tactical' ? '🔥 Тактика' : d.impact >= 7 && d.difficulty <= 4 ? 'Quick win' : d.impact >= 7 ? 'Стратегическое' : 'Поддерживающее';
            return (
              <div key={d.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontWeight: 800, fontSize: 15 }}>#{i + 1}</span>
                  <b style={{ fontSize: 14 }}>{d.title}</b>
                  <span className="tag" style={{ color: quadrant === 'Quick win' ? 'var(--lime-dark)' : quadrant.startsWith('🔥') ? 'var(--red)' : undefined }}>{quadrant}</span>
                </div>
                <p className="mono" style={{ fontSize: 11.5, margin: '4px 0 0', color: 'var(--muted)' }}>
                  Impact {d.impact}/10 · Сложность {d.difficulty}/10 · ~{d.timeDays} дн. · ROI {d.roi} · {d.playbooks.join(', ')}
                </p>
                <details>
                  <summary className="mono" style={{ fontSize: 11.5, cursor: 'pointer', color: 'var(--lime-dark)' }}>почему →</summary>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 12.5 }}>
                    {d.why.map((w) => <li key={w}>{w}</li>)}
                  </ul>
                </details>
              </div>
            );
          })
        )}
        {prereqNotes.length > 0 && (
          <p className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
            <b>Зависимости плейбуков:</b> {prereqNotes.join(' · ')}
          </p>
        )}
      </div>

      {/* Причинно-следственные цепочки */}
      {chains.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <h2>Причинно-следственные цепочки ({chains.length})</h2>
          <p className="sub" style={{ fontSize: 12.5 }}>
            Симптом → подтверждённые корневые причины → влияние на бизнес. Лечим причину, не симптом.
          </p>
          {chains.map((c) => (
            <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <b style={{ fontSize: 13.5 }}>{c.symptom}</b>
              <p style={{ fontSize: 12.5, margin: '4px 0 0' }}>
                {c.confirmedRoots.length
                  ? <>Подтверждено ответами: {c.confirmedRoots.map((r) => <span key={r} className="chip" style={{ fontSize: 11, marginRight: 6 }}>{r}</span>)}</>
                  : <span className="sub">Корневая причина не подтверждена ответами — проверить на интервью: {c.roots.map((r) => r.cause).join(' / ')}</span>}
              </p>
              <p className="sub" style={{ fontSize: 11.5, margin: '4px 0 0' }}>→ {c.businessImpact} · рычаг: {c.lever}</p>
            </div>
          ))}
        </div>
      )}

      {/* Зрелость процессов */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Зрелость процессов · L1–L5</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          Модель метода: L1 Хаос → L2 Повторяемо → L3 Определено → L4 Управляемо → L5 Оптимизировано.
          Уровень выведен из ответов домена; рядом — что даст следующий уровень.
        </p>
        {LADDERS.map((l) => {
          const ds = report.domains.filter((d) => l.sheets.includes(d.sheet) && d.health !== null);
          if (!ds.length) return null;
          const h = ds.reduce((s, d) => s + (d.health as number), 0) / ds.length;
          const lvl = levelFromHealth(h);
          return (
            <div key={l.domain} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '7px 0', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontWeight: 800, minWidth: 34, color: lvl <= 2 ? 'var(--red)' : lvl === 3 ? 'var(--amber)' : 'var(--lime-dark)' }}>L{lvl}</span>
              <b style={{ fontSize: 13, minWidth: 130 }}>{l.domain}</b>
              <span className="sub" style={{ fontSize: 12 }}>{lvl === 0 ? 'Возможности нет вообще' : l.levels[lvl - 1]}</span>
              {lvl < 5 && <span className="sub" style={{ fontSize: 11.5, color: 'var(--lime-dark)' }}>→ L{lvl + 1}: {l.levels[lvl] ?? l.levels[0]}</span>}
            </div>
          );
        })}
      </div>

      {/* Публикация */}
      <div className="card" style={{ marginTop: 18 }}>
        <h2>Резюме консультанта и публикация</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          Этот текст клиент увидит первым блоком отчёта. Пишите выводы — не пересказ.
        </p>
        <textarea
          style={{ marginTop: 10, minHeight: 110 }}
          placeholder="Три главных вывода, один приоритет, что делаем первым…"
          value={meta.summary ?? ''}
          onChange={(e) => save({ summary: e.target.value })}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            className="btn"
            onClick={() => save({ status: meta.status === 'final' ? 'draft' : 'final' })}
          >
            {meta.status === 'final' ? 'Вернуть в черновик' : 'Опубликовать финальную версию'}
          </button>
          <Link to={`/kp/${clientId}`} className="btn btn-ghost">Сгенерировать КП →</Link>
          <button className="btn btn-ghost" onClick={exportCsv}>Экспорт для ЕКП (CSV) ↓</button>
        </div>
        <p className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
          CSV → в вашу ЕКП-книгу: скрипт <span className="mono">portal/scripts/fill_ekp.py</span>{' '}
          заполняет колонку «ОТВЕТ КЛИЕНТА» по ID вопроса.
        </p>
      </div>

      {/* Деньги · 8 рычагов (AD-13 baseline + AD-04 экономика разрыва) */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Деньги · baseline на 8 рычагов</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          Модель выручки Commerce OS: новая (трафик × CR × чек × оплата × выкуп) + повторная
          (база × повторные/мес × заказов × чек). Вклады рычагов — цепной атрибуцией,
          Σ вкладов = потенциал. Значения — только из проверенных данных.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="Дата снятия (напр. 04.08.2026)" value={bm.dateTaken ?? ''}
            style={{ maxWidth: 220 }} onChange={(e) => setBaseMeta({ ...bm, dateTaken: e.target.value })} />
          <input type="text" placeholder="Период усреднения (напр. 3 мес)" value={bm.period ?? ''}
            style={{ maxWidth: 220 }} onChange={(e) => setBaseMeta({ ...bm, period: e.target.value })} />
          <button className="chip" onClick={pullGa4}>⇓ Подтянуть из GA4</button>
        </div>
        {ga4Msg && <p className="sub" style={{ fontSize: 11.5, marginTop: 6 }}>{ga4Msg}</p>}
        <table className="admin" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Рычаг</th><th>Факт</th><th>Цель</th><th>Источник</th><th>Вклад, ₴/год</th></tr>
          </thead>
          <tbody>
            {LEVER_DEFS.map((d) => {
              const w = gap.waterfall.find((x) => x.key === d.key);
              return (
                <tr key={d.key}>
                  <td>
                    <b style={{ fontSize: 13 }}>{d.label}</b>{' '}
                    <span className="sub" style={{ fontSize: 11 }}>{d.unit}</span>
                    <p className="sub" style={{ fontSize: 10.5, margin: 0 }}>{d.hint}</p>
                  </td>
                  <td><input type="number" value={levers[d.key].fact || ''} style={{ width: 90, padding: '6px 8px' }}
                    onChange={(e) => setLever(d.key, 'fact', e.target.value)} /></td>
                  <td><input type="number" value={levers[d.key].target || ''} style={{ width: 90, padding: '6px 8px' }}
                    onChange={(e) => setLever(d.key, 'target', e.target.value)} /></td>
                  <td>
                    <select value={levers[d.key].source ?? ''} style={{ padding: '6px 8px', fontSize: 12 }}
                      onChange={(e) => setLever(d.key, 'source', e.target.value)}>
                      <option value="">—</option>
                      {LEVER_SOURCES.map((s) => <option key={s}>{s}</option>)}
                    </select>{' '}
                    {(() => {
                      const ev = evidenceForSource(levers[d.key].source);
                      return (
                        <span className="mono" title={EVIDENCE[ev].label} style={{ fontSize: 10, color: EVIDENCE[ev].color, fontWeight: 700 }}>
                          {ev}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="mono" style={{ fontSize: 12, color: (w?.value ?? 0) > 0 ? 'var(--lime-dark)' : 'var(--muted)' }}>
                    {w ? `+${Math.round(w.value / 1000)} тыс` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {hasBaseline && (
          <p style={{ marginTop: 12 }} className="mono">
            Факт ≈ {Math.round(gap.rFact / 1000)} тыс ₴/мес → цель ≈ {Math.round(gap.rTarget / 1000)} тыс ₴/мес ·
            Консервативно <b>≈{(gap.conservative / 1e6).toFixed(1)} млн ₴/год</b> · полный потенциал{' '}
            {(gap.potential / 1e6).toFixed(1)} млн ₴ · промедление ≈{Math.round(gap.monthly / 1000)} тыс ₴/мес ·{' '}
            {gap.finite ? 'Σ вкладов = потенциал (цепная атрибуция, сходится по построению)' : '⚠ рычаг задан не числом — расчёт недействителен'}
          </p>
        )}
        {fc && (
          <p className="sub" style={{ fontSize: 12.5, marginTop: 6 }}>
            Прогноз 12 мес: без изменений ≈ {(fc.current / 1e6).toFixed(1)} млн ₴ · с программой ≈{' '}
            {(fc.withProgram / 1e6).toFixed(1)} млн ₴ (<b style={{ color: 'var(--lime-dark)' }}>+{fc.upliftPct}%</b>, консервативно)
          </p>
        )}
        {costs.size > 0 && (
          <p className="sub" style={{ fontSize: 12.5, marginTop: 4 }}>
            Цена бездействия по разрывам:{' '}
            {report.gaps.slice(0, 4).map((g) => `${g.label} ≈ ${Math.round((costs.get(g.id) ?? 0) / 1000)} тыс ₴/год`).join(' · ')}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            className="btn btn-ghost"
            disabled={!hasBaseline}
            onClick={() =>
              save({
                money: {
                  show: true,
                  cr: levers.cr.fact,
                  crTarget: levers.cr.target,
                  repeat: levers.repeat.fact,
                  repeatTarget: levers.repeat.target,
                  consMin: gap.conservative,
                  consMax: gap.potential,
                  monthly: gap.monthly,
                  levers,
                  waterfall: gap.waterfall,
                  dateTaken: bm.dateTaken,
                  period: bm.period,
                },
              })
            }
          >
            Показать в отчёте клиента
          </button>
          {meta.money?.show && (
            <button className="chip" onClick={() => save({ money: null })}>Убрать из отчёта</button>
          )}
        </div>
      </div>

      {/* Выгрузка заказов → факт по рычагам */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Выгрузка заказов · разбор (AC-13)</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          Загрузите CSV заказов клиента — файл разбирается прямо в браузере, никуда не отправляется.
          Нужны колонки: дата, сумма; желательно клиент, канал, статус.
        </p>
        <input type="file" accept=".csv,.txt" style={{ marginTop: 10 }}
          onChange={(e) => e.target.files?.[0] && onOrdersFile(e.target.files[0])} />
        {ordersErr && <p className="sub" style={{ color: 'var(--red)', fontSize: 12.5 }}>{ordersErr}</p>}
        {orders && (
          <>
            <div className="grid cols2" style={{ marginTop: 12, gap: 8 }}>
              {[
                ['Период', `${orders.firstMonth} → ${orders.lastMonth} (${orders.months} мес, ${orders.rows} строк)`],
                ['Выручка/мес (посл. 3 мес)', `${Math.round(orders.monthlyRevenue / 1000)} тыс ₴ · ${orders.monthlyOrders} заказов`],
                ['Средний чек', `${orders.aov} ₴`],
                ['Активная база', `${orders.activeBase} покупателей`],
                ['Повторные', `${orders.monthlyRepeatShare}% базы/мес · ${orders.ordersPerRepeat} зак./повторного · ${orders.repeatRevenueShare}% выручки`],
                ['Концентрация', `топ-10% клиентов = ${orders.top10Share}% выручки${orders.top10Share > 50 ? ' ⚠' : ''}`],
                ['Возвраты/отмены', `${orders.returnsShare}%${orders.returnsShare > 15 ? ' ⚠' : ''}`],
                ['Каналы', orders.channels.map((c) => `${c.name} ${c.share}%`).join(' · ') || '—'],
              ].map(([k, v]) => (
                <p key={k} style={{ fontSize: 13, margin: 0 }}><b>{k}:</b> <span className="mono" style={{ fontSize: 12 }}>{v}</span></p>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={applyOrders}>
              Подставить факт в baseline ↑
            </button>
          </>
        )}
      </div>

      {/* ЛПР и рамки */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>ЛПР, рамки, команда {self !== null && report.score !== null && (
          <span className="tag" style={{ marginLeft: 8, color: Math.abs(self - report.score) >= 15 ? 'var(--amber)' : undefined }}>
            самооценка {self} vs Health Score {report.score}
          </span>
        )}</h2>
        {!decision.reason && !decision.lprs?.length ? (
          <p className="sub" style={{ fontSize: 12.5 }}>Клиент ещё не заполнил шаг «Решение и команда».</p>
        ) : (
          <>
            {decision.reason && <p style={{ fontSize: 13.5, marginTop: 8 }}>«{decision.reason}»</p>}
            {(decision.problems ?? []).filter(Boolean).length > 0 && (
              <p className="sub" style={{ fontSize: 12.5 }}>
                Проблемы по версии владельца: {(decision.problems ?? []).filter(Boolean).join(' · ')}
              </p>
            )}
            {(decision.lprs ?? []).filter((l) => l.name || l.kpi).map((l, i) => (
              <p key={i} style={{ fontSize: 13, margin: '4px 0' }}>
                <b>{l.name || '—'}</b> · {l.role} · {l.influence}
                {l.kpi && <> · KPI: {l.kpi}</>}
                {l.matters && <span className="sub"> · важно: {l.matters}</span>}
              </p>
            ))}
            <p className="mono" style={{ fontSize: 12, marginTop: 8 }}>
              Бюджет: {decision.budget?.range ?? '—'} · {decision.budget?.tranches ?? ''} · решение:{' '}
              {decision.budget?.deadline ?? '—'} {decision.budget?.cash ? `· кэш: ${decision.budget.cash}` : ''}
            </p>
            {(decision.team ?? []).filter((t) => t.role || t.name).length > 0 && (
              <p className="sub" style={{ fontSize: 12.5 }}>
                Команда: {(decision.team ?? []).filter((t) => t.role || t.name)
                  .map((t) => `${t.role || t.name}${t.hours ? ` (${t.hours} ч/нед)` : ''}`).join(' · ')}
                {decision.outsource ? ` · аутсорс: ${decision.outsource}` : ''}
              </p>
            )}
          </>
        )}
      </div>

      {/* Противоречия → вопросы к интервью */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Вопросы к интервью · противоречия в ответах ({contradictions.length})</h2>
        {contradictions.length === 0 ? (
          <p className="sub" style={{ fontSize: 12.5 }}>
            Противоречий между связанными ответами не найдено (или мало данных).
          </p>
        ) : (
          contradictions.map((c) => (
            <div key={c.rule.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>
                {c.crossRole && <span className="tag" style={{ marginRight: 8, color: 'var(--amber)' }}>разные роли</span>}
                {c.rule.question}
              </p>
              <p className="sub" style={{ fontSize: 11.5, margin: '4px 0 0' }}>
                {c.rule.a.qid} «{c.aText.slice(0, 60)}» → <b>{c.aAnswer}</b>
                {c.aBy ? ` (${c.aBy})` : ''} · {c.rule.b.qid} «{c.bText.slice(0, 60)}» → <b>{c.bAnswer}</b>
                {c.bBy ? ` (${c.bBy})` : ''}
              </p>
            </div>
          ))
        )}
      </div>

      {/* L0 · PSI */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>L0 · Скорость: клиент против конкурентов</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          PageSpeed (mobile) по сайтам клиента ({(passport.sites ?? []).filter(Boolean).length}) и
          прямым конкурентам ({links.direct.length}). Результат попадает в отчёт клиента.
        </p>
        <button className="btn btn-ghost" style={{ marginTop: 10 }} disabled={psiBusy} onClick={runL0}>
          {psiBusy ? 'Прогоняю…' : 'Прогнать PageSpeed'}
        </button>
        {(meta.l0 ?? []).length > 0 && (
          <table className="admin" style={{ marginTop: 12 }}>
            <thead><tr><th>URL</th><th>Кто</th><th>Score</th><th>LCP, c</th><th>CLS</th></tr></thead>
            <tbody>
              {(meta.l0 ?? []).map((r) => (
                <tr key={r.url}>
                  <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.url}</td>
                  <td>{r.kind === 'client' ? 'клиент' : 'конкурент'}</td>
                  <td className="mono" style={{ color: (r.score ?? 0) >= 70 ? 'var(--lime-dark)' : (r.score ?? 0) >= 40 ? 'var(--amber)' : 'var(--red)' }}>
                    {r.score ?? r.error ?? '—'}
                  </td>
                  <td className="mono">{r.lcp ?? '—'}</td>
                  <td className="mono">{r.cls != null ? r.cls.toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* L0-скрининг против голд-стандарта */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Скрининг страниц · вы против конкурентов против голд-стандарта</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          30 автоматических проверок SEO/UX/техники по DOM: сайты клиента и прямые конкуренты.
          Голд-стандарт = 100% проверок. Работает на хостинге (Vercel API); сайты с жёсткой
          бот-защитой честно помечаются как недоступные.
        </p>
        <button className="btn btn-ghost" style={{ marginTop: 10 }} disabled={screenBusy} onClick={runScreen}>
          {screenBusy ? 'Сканирую…' : 'Прогнать скрининг'}
        </button>
        {(meta.screen ?? []).length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
              {(meta.screen ?? []).map((s) => (
                <div key={s.url} className="qcard" style={{ minWidth: 180, flex: 1 }}>
                  <p className="mono" style={{ fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.url.replace(/^https?:\/\//, '')}
                  </p>
                  <p style={{ fontSize: 12, margin: '2px 0' }}>{s.kind === 'client' ? 'клиент' : 'конкурент'}</p>
                  <p className="mono" style={{ fontSize: 22, fontWeight: 800, margin: 0, color: (s.score ?? 0) >= 75 ? 'var(--lime-dark)' : (s.score ?? 0) >= 50 ? 'var(--amber)' : 'var(--red)' }}>
                    {s.score != null ? `${s.score}%` : '—'}
                  </p>
                  {s.error && <p className="sub" style={{ fontSize: 10.5, margin: 0 }}>{s.error}</p>}
                </div>
              ))}
            </div>
            {(() => {
              const withChecks = (meta.screen ?? []).filter((s) => s.checks.length);
              if (!withChecks.length) return null;
              const checkIds = withChecks[0].checks.map((c) => c.id);
              return (
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table className="admin" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Проверка</th>
                        {withChecks.map((s) => (
                          <th key={s.url} style={{ fontSize: 10 }}>
                            {s.kind === 'client' ? '★ ' : ''}{s.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 18)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {checkIds.map((cid) => {
                        const label = withChecks[0].checks.find((c) => c.id === cid);
                        return (
                          <tr key={cid}>
                            <td style={{ fontSize: 12 }}>
                              <span className="sub" style={{ fontSize: 10 }}>{label?.group}</span> {label?.label}
                            </td>
                            {withChecks.map((s) => {
                              const c = s.checks.find((x) => x.id === cid);
                              return (
                                <td key={s.url} className="mono" style={{ color: c?.pass ? 'var(--lime-dark)' : 'var(--red)' }}>
                                  {c ? (c.pass ? '✓' : '✗') : '·'}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* AQC-чеклист витрины */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>AQC-чеклист витрины · {aqcManualStats.done}/{AQC_ITEMS.length} проверено</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          Стандарт Atomic Quality Criteria: находка — это «код · Fail · условие», а не мнение.
          AI-прогон даёт гипотезы с достоверностью 25 (пунктиром) — подтверждайте руками.
        </p>
        <div className="chips" style={{ marginTop: 10 }}>
          {AQC_PAGES.map((pg) => (
            <span key={pg} className={`chip ${aqcPage === pg ? 'on' : ''}`} onClick={() => setAqcPage(pg)}>
              {pg} {(() => { const m = aqcVerdicts[pg] ?? {}; const n = Object.values(m).filter((v) => v === 'pass' || v === 'fail').length; return n ? `· ${n}` : ''; })()}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="chip" onClick={runAqcAi}>🤖 AI-прогон этой страницы</button>
          {aqcBusy && <span className="sub" style={{ fontSize: 11.5 }}>{aqcBusy}</span>}
        </div>
        {AQC_ITEMS.filter((i) => i.page === aqcPage).map((it) => {
          const v = aqcVerdicts[aqcPage]?.[it.id];
          const isAi = v === 'ai-pass' || v === 'ai-fail';
          return (
            <div key={it.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
              <span className="qid" style={{ flexShrink: 0, minWidth: 110 }}>{it.id}</span>
              <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: SEVERITY_COLOR[it.severity], minWidth: 52 }}>{it.severity}</span>
              <div style={{ flex: 1, minWidth: 220 }}>
                <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>{it.criterion}</p>
                <p className="sub" style={{ fontSize: 11.5, margin: 0 }}>Pass: {it.pass}</p>
                {isAi && <p className="sub" style={{ fontSize: 10.5, margin: 0, color: 'var(--amber)' }}>AI-гипотеза (достоверность 25): {v === 'ai-pass' ? 'скорее Pass' : 'скорее Fail'} — подтвердите</p>}
              </div>
              <div className="chips" style={{ flexShrink: 0 }}>
                <span className={`chip ${v === 'pass' ? 'on' : ''}`} style={{ fontSize: 11, borderStyle: v === 'ai-pass' ? 'dashed' : undefined }} onClick={() => setAqc(aqcPage, it.id, v === 'pass' ? null : 'pass')}>Pass</span>
                <span className={`chip ${v === 'fail' ? 'on' : ''}`} style={{ fontSize: 11, color: v === 'fail' ? 'var(--red)' : undefined, borderStyle: v === 'ai-fail' ? 'dashed' : undefined }} onClick={() => setAqc(aqcPage, it.id, v === 'fail' ? null : 'fail')}>Fail</span>
                <span className={`chip ${v === 'na' ? 'on' : ''}`} style={{ fontSize: 11 }} onClick={() => setAqc(aqcPage, it.id, v === 'na' ? null : 'na')}>Н/П</span>
              </div>
            </div>
          );
        })}
        {aqcManualStats.done > 0 && (
          <p className="mono" style={{ fontSize: 12.5, marginTop: 10 }}>
            Итог (ручные вердикты): <b>{Math.round((aqcManualStats.passN / Math.max(aqcManualStats.done, 1)) * 100)}%</b> Pass
            ({aqcManualStats.passN}/{aqcManualStats.done})
            {aqcManualStats.critFails.length > 0 && (
              <span style={{ color: 'var(--red)' }}> · Critical-фейлы: {aqcManualStats.critFails.slice(0, 4).join(' · ')}</span>
            )}
          </p>
        )}
      </div>

      {/* Планировщик A/B */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Планировщик A/B-экспериментов</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          α = 0.05, мощность 80%. Правило метода: тест дольше 8 недель не окупается.
          Вывод можно записать в способ проверки гипотезы.
        </p>
        <div className="chips" style={{ marginTop: 10 }}>
          {([['plan', 'Спланировать тест'], ['mde', 'Что вообще детектируемо'], ['read', 'Прочитать результат']] as const).map(([m, l]) => (
            <span key={m} className={`chip ${ab.mode === m ? 'on' : ''}`} onClick={() => { setAb({ ...ab, mode: m }); setAbOut(''); }}>{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {ab.mode !== 'read' && (
            <>
              <input type="text" placeholder="Базовая CR, %" value={ab.p1} style={{ maxWidth: 130 }} onChange={(e) => setAb({ ...ab, p1: e.target.value })} />
              <input type="text" placeholder="Трафик/нед" value={ab.weekly} style={{ maxWidth: 130 }} onChange={(e) => setAb({ ...ab, weekly: e.target.value })} />
            </>
          )}
          {ab.mode === 'plan' && (
            <input type="text" placeholder="Ожидаемый подъём, %" value={ab.lift} style={{ maxWidth: 170 }} onChange={(e) => setAb({ ...ab, lift: e.target.value })} />
          )}
          {ab.mode === 'mde' && (
            <input type="text" placeholder="Недель" value={ab.weeks} style={{ maxWidth: 100 }} onChange={(e) => setAb({ ...ab, weeks: e.target.value })} />
          )}
          {ab.mode === 'read' && (
            <>
              <input type="text" placeholder="n A" value={ab.nA} style={{ maxWidth: 100 }} onChange={(e) => setAb({ ...ab, nA: e.target.value })} />
              <input type="text" placeholder="конв. A" value={ab.cA} style={{ maxWidth: 100 }} onChange={(e) => setAb({ ...ab, cA: e.target.value })} />
              <input type="text" placeholder="n B" value={ab.nB} style={{ maxWidth: 100 }} onChange={(e) => setAb({ ...ab, nB: e.target.value })} />
              <input type="text" placeholder="конв. B" value={ab.cB} style={{ maxWidth: 100 }} onChange={(e) => setAb({ ...ab, cB: e.target.value })} />
            </>
          )}
          <button className="btn btn-ghost" style={{ padding: '8px 16px' }} onClick={runAb}>Посчитать</button>
          {ab.mode !== 'read' && levers.cr.fact > 0 && (
            <button className="chip" onClick={() => setAb({ ...ab, p1: String(levers.cr.fact), weekly: String(Math.round((levers.traffic.fact || 0) / 4.33)) })}>
              ⇐ из baseline
            </button>
          )}
        </div>
        {abOut && (
          <>
            <p className="mono" style={{ fontSize: 13, marginTop: 10 }}>{abOut}</p>
            {hyps.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="sub" style={{ fontSize: 12 }}>Записать в гипотезу:</span>
                {hyps.map((h) => (
                  <span key={h.id} className="chip" style={{ fontSize: 11 }} onClick={() => writeAbToHyp(h.id)}>{h.id}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Гант · план работ */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>План работ · черновик Ганта ({gantt.length} задач)</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          Фаза 0 фиксирована методикой, волны собраны из сработавших правил роутинга
          (P0 → волна 1). Экспортируйте CSV и доводите в полной книге Ганта (735 задач).
        </p>
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table className="admin" style={{ fontSize: 12.5 }}>
            <thead><tr><th>Фаза</th><th>Задача</th><th>Код</th><th>Старт, нед</th><th>Длит., нед</th><th>DoD</th></tr></thead>
            <tbody>
              {gantt.map((t, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 11.5 }}>{t.phase}</td>
                  <td>{t.name}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{t.deliverable}</td>
                  <td className="mono">{t.startWeek + 1}</td>
                  <td className="mono">{t.weeks}</td>
                  <td className="sub" style={{ fontSize: 11 }}>{t.dod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mono" style={{ fontSize: 12.5, marginTop: 10 }}>
          Трудоёмкость scope: <b>≈{scopeEffort(report.rules)} чел-дней консультанта</b>{' '}
          <span className="sub" style={{ fontSize: 11 }}>— стартовая оценка из правил, калибруется по факту (XX-01)</span>
        </p>
        <button className="btn btn-ghost" style={{ marginTop: 6 }} onClick={downloadGantt}>Экспорт Ганта (CSV) ↓</button>
      </div>

      {/* Бюджет из rate card */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Бюджет · сборка из rate card</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          Отметьте работы программы. Ставки с меткой <b>КП</b> — из реальных полученных
          предложений подрядчиков (факт рынка); остальное — рыночные вилки 2025 (оценка).
          Для ретейнеров укажите месяцы.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
          <span className="sub" style={{ fontSize: 12 }}>Курс €:</span>
          <input type="number" value={eurRate} style={{ maxWidth: 90, padding: '6px 8px' }}
            onChange={(e) => setEurRate(Number(e.target.value) || EUR_RATE_DEFAULT)} />
          <span className="sub" style={{ fontSize: 12 }}>₴/€</span>
        </div>
        {[...new Set(RATE_ITEMS.map((r) => r.block))].map((block) => (
          <div key={block} style={{ marginTop: 10 }}>
            <p className="mono" style={{ fontSize: 11.5, fontWeight: 700, margin: '6px 0 4px' }}>{block}</p>
            {RATE_ITEMS.filter((r) => r.block === block).map((r) => (
              <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0', flexWrap: 'wrap' }}>
                <span className={`chip ${selMap[r.id] ? 'on' : ''}`} style={{ fontSize: 12 }} onClick={() => toggleBudget(r.id)}>
                  {selMap[r.id] ? '✓ ' : ''}{r.name}
                </span>
                {r.confirmed && <span className="tag" style={{ color: 'var(--lime-dark)' }} title={r.source}>КП</span>}
                <span className="mono sub" style={{ fontSize: 11 }}>
                  €{r.min.toLocaleString()}–{r.max.toLocaleString()}{r.type === 'Ретейнер/мес' ? '/мес' : ''}
                </span>
                {r.type === 'Ретейнер/мес' && Boolean(selMap[r.id]) && (
                  <>
                    <input type="number" value={selMap[r.id]} style={{ maxWidth: 64, padding: '4px 6px' }}
                      onChange={(e) => setBudgetSel({ ...selMap, [r.id]: Math.max(0, Number(e.target.value)) })} />
                    <span className="sub" style={{ fontSize: 11 }}>мес</span>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
        {budgetTotals.min > 0 && (
          <>
            <p className="mono" style={{ marginTop: 12, fontSize: 13.5 }}>
              Итого: <b>€{budgetTotals.min.toLocaleString()} – €{budgetTotals.max.toLocaleString()}</b>{' '}
              (≈{Math.round((budgetTotals.min * eurRate) / 1e6 * 10) / 10}–{Math.round((budgetTotals.max * eurRate) / 1e6 * 10) / 10} млн ₴)
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={saveBudget}>Показать бюджет в КП</button>
              {meta.budget?.show && (
                <button className="chip" onClick={() => save({ budget: null })}>Убрать из КП</button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Гипотезы · Continuous Consulting */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Гипотезы · проверяем после старта ({hyps.length})</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          Каждая рекомендация — гипотеза с уверенностью и способом проверки. Сверяются на 3-м,
          6-м и 12-м месяце (XX-01) — так аудит превращается в непрерывный цикл.
        </p>
        {hyps.length === 0 ? (
          <button className="btn btn-ghost" style={{ marginTop: 8 }} disabled={!decisions.length}
            onClick={() => save({ hypotheses: seedHypotheses(decisions) })}>
            Сгенерировать из решений Decision Engine
          </button>
        ) : (
          <>
            {hyps.map((h, i) => (
              <div key={h.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', opacity: h.status === 'rejected' ? 0.5 : 1 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="qid">{h.id}</span>
                  <input type="text" value={h.text} style={{ flex: 1, minWidth: 220, padding: '6px 8px', fontSize: 13 }}
                    onChange={(e) => setHyp(i, { text: e.target.value })} />
                  <select value={h.confidence} style={{ padding: '6px 8px', maxWidth: 150 }}
                    onChange={(e) => setHyp(i, { confidence: Number(e.target.value) })}>
                    {[25, 50, 75, 100].map((v) => <option key={v} value={v}>уверенность {v}</option>)}
                  </select>
                  {(['open', 'confirmed', 'rejected'] as const).map((s) => (
                    <span key={s} className={`chip ${h.status === s ? 'on' : ''}`} style={{ fontSize: 11 }}
                      onClick={() => setHyp(i, { status: s })}>
                      {s === 'open' ? 'открыта' : s === 'confirmed' ? 'подтверждена' : 'отклонена'}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <input type="text" placeholder="Доказательство" value={h.evidence} style={{ flex: 2, minWidth: 180, padding: '6px 8px', fontSize: 12 }}
                    onChange={(e) => setHyp(i, { evidence: e.target.value })} />
                  <input type="text" placeholder="Как проверяем" value={h.validation} style={{ flex: 2, minWidth: 180, padding: '6px 8px', fontSize: 12 }}
                    onChange={(e) => setHyp(i, { validation: e.target.value })} />
                  <input type="text" placeholder="Владелец" value={h.owner} style={{ maxWidth: 110, padding: '6px 8px', fontSize: 12 }}
                    onChange={(e) => setHyp(i, { owner: e.target.value })} />
                  <input type="text" placeholder="Дедлайн" value={h.deadline} style={{ maxWidth: 110, padding: '6px 8px', fontSize: 12 }}
                    onChange={(e) => setHyp(i, { deadline: e.target.value })} />
                </div>
              </div>
            ))}
            <button className="chip" style={{ marginTop: 8 }}
              onClick={() => save({ hypotheses: [...hyps, { id: `H-${hyps.length + 1}`, text: '', evidence: '', confidence: 50, validation: '', owner: '', deadline: '', status: 'open' }] })}>
              + Добавить гипотезу
            </button>
          </>
        )}
      </div>

      {/* Риски: скрытие ложных */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Риски · модерация ({report.problems.length})</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>Скрытые риски не попадут в отчёт клиента.</p>
        {report.problems.slice(0, 40).map((p) => (
          <div key={p.q.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid var(--line)', opacity: hidden.includes(p.q.id) ? 0.45 : 1 }}>
            <button className="chip" style={{ fontSize: 11, flexShrink: 0 }} onClick={() => toggleHidden(p.q.id)}>
              {hidden.includes(p.q.id) ? 'Вернуть' : 'Скрыть'}
            </button>
            <span className="qid" style={{ flexShrink: 0 }}>{p.q.id}</span>
            <span style={{ fontSize: 13 }}>
              {(p.q as any).risk}
              {QMETA[p.q.id]?.interp && (
                <span className="sub" style={{ fontSize: 11.5, display: 'block' }}>
                  Интерпретация: {QMETA[p.q.id].interp}
                  {QMETA[p.q.id].pb ? ` · ${QMETA[p.q.id].pb}` : ''}
                  {QMETA[p.q.id].kpi ? ` · KPI ${QMETA[p.q.id].kpi}` : ''}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
