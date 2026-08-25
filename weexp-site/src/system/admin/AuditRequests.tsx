import { useMemo, useState } from 'react';
import { getProjects, type AdminRow, type TierStatus } from '@/lib/supa';
import { AUDIT_STAGES, OURS, auditStatusOf, lastMoveAt, staleDays, type AuditReqStatus } from './auditRequests';
import { EmptyState, rel } from './shared';

/**
 * «Заявки аудит» — той самий формат, що й «Заявки»: воронка зверху, дошка стадій
 * нижче. Різниця в одному: стадію тут ніхто не проставляє руками — вона
 * ВИВОДИТЬСЯ з дій клієнта й менеджера (див. auditRequests.ts). Кнопки під
 * карткою не «ставлять статус», а виконують дію, після якої статус зміниться сам.
 */
export function AuditRequests({ rows, q, busy, onOpen, onStatus }: {
  rows: AdminRow[] | null;
  q: string;
  busy: string;
  onOpen: (userId: string) => void;
  onStatus: (userId: string, tier: string, status: TierStatus) => void;
}) {
  const [only, setOnly] = useState<AuditReqStatus | 'all' | 'ours'>('all');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows || [])
      .map((r) => ({ r, st: auditStatusOf(r) }))
      .filter((x): x is { r: AdminRow; st: AuditReqStatus } => x.st !== null)
      .filter((x) => !needle || x.r.email.toLowerCase().includes(needle) || (x.r.company || '').toLowerCase().includes(needle))
      .sort((a, b) => lastMoveAt(b.r).localeCompare(lastMoveAt(a.r)));
  }, [rows, q]);

  const count = (k: AuditReqStatus) => list.filter((x) => x.st === k).length;
  const ours = list.filter((x) => OURS.includes(x.st));
  const shown = only === 'all' ? list : only === 'ours' ? ours : list.filter((x) => x.st === only);

  if (rows === null) return <p className="mc-msg mono">Завантаження…</p>;
  if (!list.length) {
    return <EmptyState icon="🔍" text="Заявок на глибокий аудит ще немає. Вони зʼявляться тут автоматично, щойно клієнт натисне «Почати глибокий аудит» у кабінеті." />;
  }

  return (
    <>
      {/* Воронка стадій — як у «Заявках». */}
      <div className="adm-panel">
        <span className="adm-col-h mono">Воронка аудиту · {list.length} заявок · на нашому боці: {ours.length}</span>
        <div className="adm-crmfunnel">
          {AUDIT_STAGES.map((s) => {
            const n = count(s.k); const pct = list.length ? Math.round((n / list.length) * 100) : 0;
            return (
              <div key={s.k} className="adm-cf-row" title={`${s.note} · рухає: ${s.by}`}>
                <span className={`cab-badge mono tst-${s.cls}`}>{s.l}</span>
                <div className="adm-fn-bar"><span className={`adm-fn-fill tst-fill-${s.cls}`} style={{ width: `${Math.max(pct, n ? 4 : 0)}%` }} /></div>
                <span className="adm-fn-n mono">{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Фільтр стадій. «Наш хід» — те, що чекає саме менеджера. */}
      <div className="adm-bulk">
        <button className={`mc-btn sm${only === 'ours' ? '' : ' ghost'}`} onClick={() => setOnly('ours')}>Наш хід · {ours.length}</button>
        <button className={`mc-btn sm${only === 'all' ? '' : ' ghost'}`} onClick={() => setOnly('all')}>Усі · {list.length}</button>
        {AUDIT_STAGES.filter((s) => count(s.k) > 0).map((s) => (
          <button key={s.k} className={`mc-btn sm${only === s.k ? '' : ' ghost'} tst-${s.cls}`} onClick={() => setOnly(s.k)}>{s.l} · {count(s.k)}</button>
        ))}
      </div>

      {/* Дошка стадій — колонками, як у «Заявках». */}
      <div className="adm-board">
        {AUDIT_STAGES.filter((st) => only === 'all' || only === 'ours' || only === st.k).map((st) => {
          const col = shown.filter((x) => x.st === st.k);
          return (
            <div key={st.k} className="adm-col">
              <div className="adm-col-head">
                <span className={`cab-badge mono tst-${st.cls}`}>{st.l}</span>
                <span className="adm-col-n mono">{col.length}</span>
              </div>
              <div className="adm-col-body">
                {col.length === 0 && <p className="mono adm-col-empty">—</p>}
                {col.map(({ r }) => {
                  const days = staleDays(r);
                  return (
                    <div key={r.userId} className="adm-lead-card">
                      <b>{r.company || r.email}</b>
                      <span className="mono adm-lead-sub">{r.email}</span>
                      <span className="mono adm-lead-sub" title={`${st.note} · рухає: ${st.by}`}>рухає: {st.by}</span>
                      <span className="mono adm-lead-at">оновлено {rel(lastMoveAt(r))}{days >= 3 ? ` · ${days} дн. без руху` : ''}</span>
                      {/* На проєктних стадіях картка несе те, що раніше показувала окрема таблиця «Проекти». */}
                      {(() => {
                        const pr = getProjects(r.record);
                        if (!pr.length) return null;
                        const tasks = pr.reduce((n, x) => n + (x.tasks?.length || 0), 0);
                        return (
                          <span className="mono adm-lead-sub">
                            {pr.map((x) => x.title || 'Без назви').join(' · ')} · задач: {tasks}
                            {pr.some((x) => x.published) ? ' · опубліковано' : ' · чернетка'}
                          </span>
                        );
                      })()}
                      <button className="adm-lead-open" onClick={() => onOpen(r.userId)}>Картка клієнта →</button>
                      {(st.k === 'new' || st.k === 'need_data' || st.k === 'denied') && (
                        <div className="mc-row">
                          <button className="mc-btn sm ok" disabled={busy === r.userId} onClick={() => onStatus(r.userId, 'DEEP', 'granted')}>Надати</button>
                          <button className="mc-btn sm" disabled={busy === r.userId} onClick={() => onStatus(r.userId, 'DEEP', 'data')}>Дані</button>
                          <button className="mc-btn sm bad" disabled={busy === r.userId} onClick={() => onStatus(r.userId, 'DEEP', 'rejected')}>Відхилити</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
