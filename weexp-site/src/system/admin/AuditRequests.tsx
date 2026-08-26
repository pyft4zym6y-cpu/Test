import { useMemo, useState } from 'react';
import { getProjects, type AdminRow, type TierStatus } from '@/lib/supa';
import { AUDIT_STAGES, OURS, PHASES, phaseOf, auditStatusOf, lastMoveAt, slaOf, type AuditReqStatus } from './auditRequests';
import { EmptyState, rel } from './shared';

/**
 * «Заявки аудит» — той самий формат, що й «Заявки»: воронка зверху, дошка стадій
 * нижче. Різниця в одному: стадію тут ніхто не проставляє руками — вона
 * ВИВОДИТЬСЯ з дій клієнта й менеджера (див. auditRequests.ts). Кнопки під
 * карткою не «ставлять статус», а виконують дію, після якої статус зміниться сам.
 */
export function AuditRequests({ rows, q, busy, onOpen, onStatus, onCloseAudit, onStartProject, onCloseDelivery, canAccess }: {
  rows: AdminRow[] | null;
  q: string;
  busy: string;
  onOpen: (userId: string) => void;
  onStatus: (userId: string, tier: string, status: TierStatus) => void;
  onCloseAudit: (userId: string) => void;
  onStartProject: (userId: string) => void;
  onCloseDelivery: (userId: string) => void;
  /** manage_access: аудитор бачить дошку, але не роздає доступи й не рухає етапи. */
  canAccess: boolean;
}) {
  const [only, setOnly] = useState<AuditReqStatus | 'all' | 'ours' | 'overdue'>('all');

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
  // Прострочені — окремий фільтр: це не «наш хід», а те, що вже горить.
  const overdue = list.filter((x) => slaOf(x.r).state === 'breach');
  const shown = only === 'all' ? list : only === 'ours' ? ours : only === 'overdue' ? overdue : list.filter((x) => x.st === only);

  if (rows === null) return <p className="mc-msg mono">Завантаження…</p>;
  if (!list.length) {
    return <EmptyState icon="🔍"
      text="Заявок на глибокий аудит ще немає. Вони зʼявляться тут автоматично, щойно клієнт натисне «Почати глибокий аудит» у кабінеті."
      hint="Стадію тут ніхто не проставляє руками: вона виводиться з даних. Ви натискаєте «Надати» — картка сама переходить у «Доступ надано»; клієнт завантажує файл — у «Клієнт заповнює». Проєкт впровадження зʼявляється тільки після того, як етап «Аудит» закрито кнопкою." />;
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
        <button className={`mc-btn sm${only === 'overdue' ? '' : ' ghost'} bad`} disabled={!overdue.length} onClick={() => setOnly('overdue')}>Прострочено · {overdue.length}</button>
        <button className={`mc-btn sm${only === 'all' ? '' : ' ghost'}`} onClick={() => setOnly('all')}>Усі · {list.length}</button>
        {AUDIT_STAGES.filter((s) => count(s.k) > 0).map((s) => (
          <button key={s.k} className={`mc-btn sm${only === s.k ? '' : ' ghost'} tst-${s.cls}`} onClick={() => setOnly(s.k)}>{s.l} · {count(s.k)}</button>
        ))}
      </div>

      {/* Дошка: стадії згруповані ФАЗАМИ — аудит це етап 1 проєкту, а не окрема гілка. */}
      {PHASES.map((ph) => {
        const stages = AUDIT_STAGES.filter((st) => phaseOf(st.k) === ph.n && (only === 'all' || only === 'ours' || only === st.k));
        if (!stages.length) return null;
        const inPhase = shown.filter((x) => phaseOf(x.st) === ph.n).length;
        return (
        <div key={ph.n} className="adm-phase">
          <div className="adm-phase-h"><b>{ph.l}</b><i className="mono">{ph.note}</i><span className="mono">{inPhase}</span></div>
          <div className="adm-board">
        {stages.map((st) => {
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
                  const sla = slaOf(r);
                  return (
                    <div key={r.userId} className={`adm-lead-card sla-${sla.state}`}>
                      <b>{r.company || r.email}</b>
                      <span className="mono adm-lead-sub">{r.email}</span>
                      <span className="mono adm-lead-sub" title={`${st.note} · рухає: ${st.by}`}>рухає: {st.by}</span>
                      <span className="mono adm-lead-at" title={`норматив стадії — ${sla.limit} дн.`}>
                        оновлено {rel(lastMoveAt(r))}
                        {sla.state !== 'ok' && ` · ${sla.days} дн. без руху${sla.state === 'breach' ? ` (норматив ${sla.limit})` : ''}`}
                      </span>
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
                      {canAccess && (st.k === 'new' || st.k === 'need_data' || st.k === 'denied') && (
                        <div className="mc-row">
                          <button className="mc-btn sm ok" disabled={!!busy} onClick={() => onStatus(r.userId, 'DEEP', 'granted')}>Надати</button>
                          <button className="mc-btn sm" disabled={!!busy} onClick={() => onStatus(r.userId, 'DEEP', 'data')}>Дані</button>
                          <button className="mc-btn sm bad" disabled={!!busy} onClick={() => onStatus(r.userId, 'DEEP', 'rejected')}>Відхилити</button>
                        </div>
                      )}
                      {/* Явні переходи замість побічних ефектів: етап закривається
                          кнопкою, проект заводиться кнопкою — обидва видно в журналі. */}
                      {canAccess && st.k === 'in_work' && (
                        <button className="mc-btn sm ok" disabled={!!busy} onClick={() => onCloseAudit(r.userId)}>Закрити етап «Аудит»</button>
                      )}
                      {canAccess && st.k === 'done' && (
                        <button className="mc-btn sm ok" disabled={!!busy} onClick={() => onStartProject(r.userId)}>Зібрати проект впровадження</button>
                      )}
                      {canAccess && st.k === 'delivery' && (
                        <button className="mc-btn sm ok" disabled={!!busy} onClick={() => onCloseDelivery(r.userId)}>Закрити впровадження</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
          </div>
        </div>
        );
      })}
    </>
  );
}
