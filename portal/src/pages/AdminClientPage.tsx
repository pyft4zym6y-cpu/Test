import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, DEMO } from '../lib/supabase';
import { buildReport } from '../lib/report';
import { useReportMeta, computeMoney, runPSI, type L0Row } from '../lib/consultant';
import { PASSPORT_QID, LINKS_QID, PAINS_QID, type Passport, type Links } from '../data/pains';
import { byId } from '../lib/model';
import type { AnswerRow } from '../lib/supabase';

export default function AdminClientPage() {
  const { clientId = 'demo' } = useParams();
  const [rows, setRows] = useState<Record<string, AnswerRow>>({});
  const [loaded, setLoaded] = useState(false);
  const { meta, save } = useReportMeta(clientId);
  const [psiBusy, setPsiBusy] = useState(false);
  const [baseline, setBaseline] = useState({ revenueK: 0, cr: 1.5, crTarget: 2.5, repeat: 15, repeatTarget: 30 });

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

  const money = computeMoney(baseline);

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

      {/* Деньги */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Деньги · baseline и расчёт</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          Вводите значения из проверенных данных (GA4, выгрузка заказов). Модель цепная, показываем
          консервативную нижнюю границу.
        </p>
        <div className="grid cols2" style={{ marginTop: 12 }}>
          {(
            [
              ['revenueK', 'Оборот, тыс ₴/мес'],
              ['cr', 'Конверсия факт, %'],
              ['crTarget', 'Конверсия цель, %'],
              ['repeat', 'Повторные факт, %'],
              ['repeatTarget', 'Повторные цель, %'],
            ] as const
          ).map(([k, label]) => (
            <div key={k}>
              <p className="qtext" style={{ fontSize: 13 }}>{label}</p>
              <input
                type="number"
                value={(baseline as any)[k] || ''}
                onChange={(e) => setBaseline({ ...baseline, [k]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
        {baseline.revenueK > 0 && (
          <p style={{ marginTop: 12 }} className="mono">
            Консервативно ≈ <b>{(money.consMin / 1e6).toFixed(1)} млн ₴/год</b> · полный потенциал до{' '}
            {(money.consMax / 1e6).toFixed(1)} млн ₴ · ≈{Math.round(money.monthly / 1000)} тыс ₴/мес
            промедления
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            className="btn btn-ghost"
            disabled={!baseline.revenueK}
            onClick={() => save({ money: { show: true, ...baseline, ...money } })}
          >
            Показать в отчёте клиента
          </button>
          {meta.money?.show && (
            <button className="chip" onClick={() => save({ money: null })}>Убрать из отчёта</button>
          )}
        </div>
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
