import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, DEMO, type AnswerRow } from '../lib/supabase';
import { buildReport } from '../lib/report';
import { useReportMeta } from '../lib/consultant';
import { bandFor } from '../data/method';
import {
  PASSPORT_QID, PAINS_QID, PAINS_CUSTOM_QID, GOALS_QID, GOALS, PAINS,
  effectiveNiche, type Passport,
} from '../data/pains';

/** Генератор КП: боль → цена боли → решение → доказательство → scope → бюджет → next steps. */
export default function KpPage() {
  const { clientId = 'demo' } = useParams();
  const [rows, setRows] = useState<Record<string, AnswerRow>>({});
  const { meta } = useReportMeta(clientId);

  useEffect(() => {
    if (DEMO) {
      try { setRows(JSON.parse(localStorage.getItem('weexp-demo-answers') ?? '{}')); } catch { /* noop */ }
      return;
    }
    supabase.from('answers').select('*').eq('client_id', clientId).then(({ data }) => {
      const map: Record<string, AnswerRow> = {};
      (data ?? []).forEach((r) => (map[r.question_id] = r as AnswerRow));
      setRows(map);
    });
  }, [clientId]);

  let passport: Passport = {};
  try { passport = JSON.parse(rows[PASSPORT_QID]?.answer ?? '{}'); } catch { /* noop */ }
  const painIds = (rows[PAINS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  const goalIds = (rows[GOALS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  const customPains = (rows[PAINS_CUSTOM_QID]?.answer ?? '').trim();
  const report = useMemo(() => buildReport(rows, painIds), [rows, painIds]);
  const money = meta?.money?.show ? meta.money : null;

  const waves = useMemo(() => {
    const p0 = report.rules.filter((r) => r.priority?.startsWith('P0'));
    const p1 = report.rules.filter((r) => r.priority?.startsWith('P1'));
    const rest = report.rules.filter((r) => !r.priority?.startsWith('P0') && !r.priority?.startsWith('P1'));
    return [
      { name: 'Волна 1 · 0–3 мес', items: p0.length ? p0 : report.rules.slice(0, 3) },
      { name: 'Волна 2 · 3–6 мес', items: p1 },
      { name: 'Волна 3 · 6–12 мес', items: rest },
    ].filter((w) => w.items.length);
  }, [report.rules]);

  const S = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
    <section className="card" style={{ marginTop: 14, breakInside: 'avoid' }}>
      <p className="eyebrow">{n} · {title}</p>
      <div style={{ marginTop: 8 }}>{children}</div>
    </section>
  );

  return (
    <div className="container report" style={{ padding: '30px 20px 80px' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <Link to={`/admin/c/${clientId}`} className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← К клиенту</Link>
        <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 11 }} onClick={() => window.print()}>Скачать PDF ↓</button>
      </div>

      <p className="eyebrow" style={{ marginTop: 16 }}>weexp · Commerce OS™ · Коммерческое предложение</p>
      <h1 style={{ fontSize: 30 }}>{passport.name ?? 'Клиент'}: программа роста</h1>
      <p className="sub">
        {effectiveNiche(passport)} · {passport.geo ?? ''} · подготовлено {new Date().toLocaleDateString('ru-RU')} ·{' '}
        {meta?.status === 'final' ? 'на основе финальной диагностики' : 'на основе предварительной диагностики'}
      </p>

      <S n="01" title="Боль — почему вы здесь">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
          {painIds.map((id) => <li key={id}>{PAINS.find((p) => p.id === id)?.title}</li>)}
          {customPains && <li>«{customPains}»</li>}
        </ul>
      </S>

      <S n="02" title="Методика — граница факта и допущения">
        <p className="sub" style={{ fontSize: 13, margin: 0 }}>
          Диагноз построен на ответах вашей команды ({report.answeredL1} вопросов) и эталонах
          практики weexp. {money ? 'Деньги посчитаны по вашим данным (baseline зафиксирован).' : 'Деньги будут пересчитаны после фиксации baseline по данным GA4/CRM.'} Все
          целевые диапазоны пересчитываются после первой недели работ.
        </p>
      </S>

      <S n="03" title="Точка А — состояние системы">
        <p style={{ fontSize: 14, margin: 0 }}>
          Health Score: <b className="mono">{report.score ?? '—'}/100</b> — {report.score !== null ? bandFor(report.score).label : ''}.
          Критических разрывов: <b>{report.gaps.length}</b> (суммарный штраф −{report.gaps.reduce((s, g) => s + g.penalty, 0)}).
          Главные: {report.gaps.slice(0, 4).map((g) => g.label).join(' · ') || '—'}.
        </p>
      </S>

      {money && (
        <S n="04" title="Цена бездействия">
          <p style={{ fontSize: 15, margin: 0 }}>
            Консервативно вы недополучаете <b className="mono" style={{ color: '#DB2777' }}>≈{(money.consMin / 1e6).toFixed(1)} млн ₴/год</b>{' '}
            (полный потенциал — до {(money.consMax / 1e6).toFixed(1)} млн ₴). Каждый месяц промедления ≈{' '}
            {Math.round(money.monthly / 1000)} тыс ₴. Рычаги: конверсия {money.cr}% → {money.crTarget}%,
            повторные {money.repeat}% → {money.repeatTarget}%. {money.comment ?? ''}
          </p>
        </S>
      )}

      <S n="05" title="Точка Б — цели 12 месяцев">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
          {goalIds.map((id) => <li key={id}>{GOALS.find((g) => g.id === id)?.title}</li>)}
        </ul>
      </S>

      <S n="06" title="Решение — Commerce OS™">
        <p className="sub" style={{ fontSize: 13, margin: 0 }}>
          Не набор услуг, а операционная система роста: 12 модулей, 56 плейбуков с DoD, 52 эталона
          Gold Standards. Каждый разрыв из диагностики адресуется конкретным плейбуком; бюджет
          защищён траншами под принятый результат.
        </p>
      </S>

      <S n="07" title="Доказательство">
        <p className="sub" style={{ fontSize: 13, margin: 0 }}>
          Кейсы практики: ×18 оборота за 18 мес (€48K → €900K, конверсия 0,8% → 4,2% — топ-1%
          сегмента, ROI года 3.8×) · +65% продаж и 6 новых рынков за 9 мес · 17 000 SKU под
          управлением одной системы. Все цифры — из CRM/ERP/GA4 клиентов.
        </p>
      </S>

      <S n="08" title="Архитектура программы — волны">
        {waves.map((w) => (
          <div key={w.name} style={{ marginBottom: 10 }}>
            <p className="mono" style={{ fontSize: 12, fontWeight: 700, margin: '0 0 4px' }}>{w.name}</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>
              {w.items.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <b>{r.deliverable}</b> <span className="sub">· {r.id} · триггер «{r.trigger}»</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!waves.length && <p className="sub" style={{ fontSize: 13 }}>Scope уточняется после диагностики.</p>}
      </S>

      <S n="09" title="Форматы и бюджет">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
          <li><b>Diagnostic Sprint</b> — $2–6K · 2–4 недели · полный аудит в деньгах, 18 документов</li>
          <li><b>Commerce OS™ Build</b> — $40–80K · 6–12 мес · система под ключ, транши под DoD</li>
          <li><b>Fractional Head of Commerce</b> — $6–20K/мес · руководитель e-commerce без найма</li>
        </ul>
        <p className="sub" style={{ fontSize: 12, marginTop: 8 }}>
          Точный бюджет фиксируется после согласования scope; следующий транш — только после
          принятого результата предыдущего этапа.
        </p>
      </S>

      <S n="10" title="Сценарии">
        <p className="sub" style={{ fontSize: 13, margin: 0 }}>
          «Ничего не делать» {money ? `стоит ≈${Math.round(money.monthly / 1000)} тыс ₴ каждый месяц` : 'консервирует текущие разрывы — конкурент, строящий систему, отрывается'}.
          Старт с Diagnostic Sprint снимает риск: вы видите цифры до того, как вкладываете бюджет
          в исполнение.
        </p>
      </S>

      <S n="11" title="Следующие шаги">
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
          <li>30-мин сессия: разбор этого документа и ответы на вопросы</li>
          <li>Передача двух доступов (GA4 + выгрузка заказов) → фиксация baseline</li>
          <li>Старт Diagnostic Sprint — первые находки через неделю</li>
        </ol>
      </S>

      <p className="sub" style={{ fontSize: 11.5, marginTop: 18 }}>
        weexp · Commerce OS™ · weexp.agency · Прогноз сверяется с фактом на 3, 6 и 12 месяце (XX-01).
      </p>
    </div>
  );
}
