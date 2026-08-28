import { useEffect, useMemo, useState } from 'react';
import { findAuditIdByCode, loadAuditAnswers, type AdminRow, type AuditAnswer } from '@/lib/supa';
import { loadTemplate, type AuditTemplate } from '../auditTemplate';
import { money as fmt, curOf, AGENCY_CUR } from '../systems';
import { Block, rel } from './shared';
import { nextStep, readiness, blockers, money, timeline, auditStatusOf, STAGE_OF, phaseOf, PHASES } from './auditRequests';

/**
 * Верхній блок картки клієнта: те, що менеджер має побачити ПЕРШИМ, не гортаючи
 * вкладки — що робити зараз, скільки даних уже є, що заважає, скільки грошей у
 * гри і що відбувалось. Усе виводиться з запису, нічого не вводиться руками.
 */
function Bar({ label, done, total, hint }: { label: string; done: number; total: number; hint?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const cls = pct >= 80 ? 'ok' : pct >= 30 ? 'wait' : 'bad';
  return (
    <div className="adm-cf-row" title={hint}>
      <span className={`cab-badge mono tst-${cls}`}>{label}</span>
      <div className="adm-fn-bar"><span className={`adm-fn-fill tst-fill-${cls}`} style={{ width: `${Math.max(pct, done ? 4 : 0)}%` }} /></div>
      <span className="adm-fn-n mono">{done}/{total}</span>
    </div>
  );
}

export function ClientBrief({ row, code }: { row: AdminRow; code?: string }) {
  const [tpl, setTpl] = useState<AuditTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, AuditAnswer>>({});

  // Заповненість анкети живе в audit_answers, а не в записі — тягнемо за кодом.
  useEffect(() => {
    let alive = true;
    (async () => {
      const t = await loadTemplate();
      const id = code ? await findAuditIdByCode(code) : null;
      const a = id ? await loadAuditAnswers(id) : {};
      if (alive) { setTpl(t); setAnswers(a); }
    })();
    return () => { alive = false; };
  }, [code]);

  const q = useMemo(() => {
    let total = 0, done = 0;
    (tpl?.blocks || []).forEach((b) => b.questions.forEach((x) => {
      total++; const a = answers[x.key];
      if (a && a.value != null && a.value !== '') done++;
    }));
    return { total, done };
  }, [tpl, answers]);

  const st = auditStatusOf(row);
  const step = nextStep(row);
  const r = readiness(row);
  const blk = blockers(row);
  const m = money(row);
  const events = timeline(row);

  return (
    <>
      <Block title="Наступний крок">
        <div className="adm-uhead-row">
          <div className="adm-uhead-cell">
            <i className="mono">Фаза проєкту</i>
            <b>{st ? PHASES[phaseOf(st)].l : '—'}</b>
          </div>
          <div className="adm-uhead-cell">
            <i className="mono">Стадія</i>
            <b>{st ? STAGE_OF[st].l : 'Заявки немає'}</b>
          </div>
          <div className="adm-uhead-cell">
            <i className="mono">Хід за</i>
            <b className={step.who === 'ми' ? 'tst-bad' : ''}>{step.who === 'ми' ? 'нами' : 'клієнтом'}</b>
          </div>
        </div>
        <p>{step.text}</p>
        {blk.length > 0 && (
          <ul className="adm-kv">
            {blk.map((b, i) => <li key={i}><i>заважає</i><span>{b}</span></li>)}
          </ul>
        )}
      </Block>

      <Block title="Готовність даних">
        <div className="adm-crmfunnel">
          <Bar label="Анкета" done={q.done} total={q.total || 1} hint="відповіді в опитувальнику глибокого аудиту" />
          <Bar label="Доступи" done={r.accessGiven + r.accessNa} total={r.accessTotal} hint="надано або позначено «не потрібно» з каталогу доступів" />
          <Bar label="Файли" done={r.files} total={Math.max(r.files, 8)} hint="файли й вивантаження, завантажені клієнтом" />
        </div>
        <ul className="adm-kv">
          <li><i>Маркетплейси</i><span>{r.marketplaces || '—'}</span></li>
          <li><i>Прогони рушія</i><span>{r.jobs || '—'}</span></li>
          <li><i>Модулів оцінено</i><span>{r.scored || '—'}</span></li>
          <li><i>Документів передано</i><span>{r.shared || '—'}</span></li>
        </ul>
      </Block>

      <Block title="Гроші">
        <ul className="adm-kv">
          <li><i>Оцінка втрат (експрес)</i><span>{m.expressTotal != null ? `${fmt(m.expressTotal, m.expressCur)} / рік` : '—'}</span></li>
          {m.expressRange && <li><i>Діапазон</i><span>{fmt(m.expressRange[0], m.expressCur)}–{fmt(m.expressRange[1], m.expressCur)}</span></li>}
          <li><i>Business Health</i><span>{m.health != null ? `${m.health}/100` : '—'}</span></li>
          <li><i>Бюджет проєктів</i><span>{m.budget ? fmt(m.budget, AGENCY_CUR) : '—'}</span></li>
          <li><i>Оплачено</i><span>{m.paid ? fmt(m.paid, AGENCY_CUR) : '—'}</span></li>
          <li><i>Очікує оплати</i><span>{m.pending ? fmt(m.pending, AGENCY_CUR) : '—'}</span></li>
          {/* Дві половини економіки клієнта досі жили окремо: платежі в проєкті,
              ставки в проєкт-офісі. Зіставлення не було ніде. */}
          <li><i>Наші витрати</i><span>{m.cost ? `${fmt(m.cost, AGENCY_CUR)} · ${m.hours} год` : '—'}</span></li>
          <li><i>Маржа</i><span className={m.margin < 0 ? 'tst-bad' : ''}>
            {m.cost || m.paid ? `${fmt(m.margin, AGENCY_CUR)}${m.marginPct != null ? ` · ${m.marginPct}%` : ''}` : '—'}
          </span></li>
        </ul>
      </Block>

      <Block title="Хронологія">
        {events.length === 0 ? <p className="mono adm-empty">Подій ще немає — стрічка заповниться, щойно клієнт зробить перший крок або команда змінить статус.</p> : (
          <ul className="adm-kv">
            {events.map((e, i) => (
              <li key={i}><i>{rel(e.at)} · {e.who}</i><span>{e.text}</span></li>
            ))}
          </ul>
        )}
      </Block>
    </>
  );
}
