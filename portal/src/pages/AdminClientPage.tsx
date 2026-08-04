import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, DEMO } from '../lib/supabase';
import { buildReport } from '../lib/report';
import {
  useReportMeta, runPSI, computeGap8, LEVER_DEFS, DEFAULT_LEVERS,
  type L0Row, type Levers, type LeverKey,
} from '../lib/consultant';
import { PASSPORT_QID, LINKS_QID, PAINS_QID, type Passport, type Links } from '../data/pains';
import { DECISION_QID, selfScore, type Decision } from '../data/decision';
import { detectContradictions } from '../lib/contradictions';
import { byId } from '../lib/model';
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
        .filter((r) => r.answer)
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
        Health Score {report.score ?? '—'} · ответов {report.answeredL1}/{report.totalL1} · рисков{' '}
        {report.problems.length} · разрывов {report.gaps.length}
      </p>

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
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Дата снятия (напр. 04.08.2026)" value={bm.dateTaken ?? ''}
            style={{ maxWidth: 220 }} onChange={(e) => setBaseMeta({ ...bm, dateTaken: e.target.value })} />
          <input type="text" placeholder="Период усреднения (напр. 3 мес)" value={bm.period ?? ''}
            style={{ maxWidth: 220 }} onChange={(e) => setBaseMeta({ ...bm, period: e.target.value })} />
        </div>
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
                    </select>
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
            {gap.sumCheck ? 'Σ вкладов = потенциал ✓' : 'Σ вкладов ≠ потенциал ✗'}
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
            <span style={{ fontSize: 13 }}>{(p.q as any).risk}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
