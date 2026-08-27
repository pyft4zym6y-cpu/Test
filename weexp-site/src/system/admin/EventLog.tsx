import { useEffect, useMemo, useState } from 'react';
import { listAdminEvents, type AdminEventRow } from '@/lib/supa';
import { EmptyState, rel } from './shared';
import { actorsOf, filterEvents, findAnomalies, kindsOf, type EventFilter } from './eventAudit';

/**
 * Журнал дій команди. Відповідає на питання, на які раніше в системі відповіді
 * не було: хто видав доступ, хто закрив етап, хто зачепив картку минулого
 * тижня. Пишеться шаром даних автоматично (див. logAdminEvent).
 *
 * Довго тут була половина справи: журнал ПИСАВСЯ, але його ніхто не читав —
 * сто рядків без фільтрів, у яких масове видалення виглядає рівно так само, як
 * звичайний робочий день. Запис і спостереження це різні речі. Тепер зверху —
 * сигнали до перевірки, нижче — фільтри, щоб дійти до потрібного рядка.
 */
const KIND_LABEL: Record<string, string> = {
  tier_status: 'статус доступу',
  tier_clear: 'скидання статусу',
  patch: 'зміна картки',
  projects: 'проекти',
  assessment: 'оцінка модулів',
  deliverable: 'передача документа',
  express: 'експрес-аудит',
  lead: 'лід',
  sufficiency: 'модерація анкети',
  tier: 'доступи',
  user: 'обліковий запис',
};

export function EventLog({ userId, limit = 100 }: { userId?: string; limit?: number }) {
  const [rows, setRows] = useState<AdminEventRow[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [f, setF] = useState<EventFilter>({});

  useEffect(() => {
    let alive = true;
    listAdminEvents(limit, userId).then((r) => { if (alive) { setRows(r.rows); setMissing(!!r.missing); } });
    return () => { alive = false; };
  }, [userId, limit]);

  const all = rows || [];
  // Аномалії рахуємо по ВСІЙ вибірці, а не по відфільтрованій: інакше фільтр
  // ховав би саме те, заради чого сюди й заходять.
  const anomalies = useMemo(() => findAnomalies(all), [all]);
  const shown = useMemo(() => filterEvents(all, f), [all, f]);
  const actors = useMemo(() => actorsOf(all), [all]);
  const kinds = useMemo(() => kindsOf(all), [all]);
  const filtered = Boolean(f.actor || f.kind || f.q);

  if (rows === null) return <p className="mc-msg mono">Завантаження…</p>;
  if (missing) return (
    <p className="adm-hint mono">
      Журнал ще не увімкнено: застосуйте <code>docs/admin-roles-and-events.sql</code> у Supabase SQL Editor.
      До того дії виконуються, але не записуються.
    </p>
  );
  if (!all.length) return <EmptyState icon="🧾" text="Записів ще немає — журнал наповнюється діями команди." />;

  return (
    <div className="adm-log-wrap">
      {anomalies.length > 0 && (
        <div className="adm-anom" role="region" aria-label="Сигнали до перевірки">
          <span className="adm-col-h mono">Варте погляду · {anomalies.length}</span>
          {anomalies.map((a) => (
            <button key={a.id} type="button" className={`adm-anom-row is-${a.level}`}
              onClick={() => setF({ actor: a.actor })}
              title="Показати всі дії цієї людини">
              <b className="mono">{a.actor}</b>
              <span>{a.title}</span>
              <i>{a.why}</i>
              <span className="mono adm-c-date">{rel(a.at)}</span>
            </button>
          ))}
          <p className="adm-hint mono">
            Це сигнали до перевірки, а не звинувачення: сплеск видалень однаково виглядає
            і при зачистці тестових записів, і при помилці в циклі.
          </p>
        </div>
      )}

      <div className="adm-ga-bar adm-log-filters">
        <label className="adm-f-lbl">
          <span className="mono">Хто</span>
          <select className="ab-sel" value={f.actor || ''} onChange={(e) => setF({ ...f, actor: e.target.value || undefined })}>
            <option value="">усі</option>
            {actors.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="adm-f-lbl">
          <span className="mono">Що</span>
          <select className="ab-sel" value={f.kind || ''} onChange={(e) => setF({ ...f, kind: e.target.value || undefined })}>
            <option value="">усе</option>
            {kinds.map((k) => <option key={k} value={k}>{KIND_LABEL[k] || k}</option>)}
          </select>
        </label>
        <input className="ab-inp adm-log-q" type="search" placeholder="Пошук у деталях…"
          aria-label="Пошук у журналі"
          value={f.q || ''} onChange={(e) => setF({ ...f, q: e.target.value || undefined })} />
        {filtered && (
          <button className="mc-btn ghost" onClick={() => setF({})}>Скинути · показано {shown.length} з {all.length}</button>
        )}
      </div>

      {!shown.length ? (
        <EmptyState icon="🔍" text="За цим фільтром записів немає — спробуйте зняти обмеження." />
      ) : (
        <div className="adm-table adm-tr-log">
          <div className="adm-tr adm-th adm-tr-log"><span>Коли</span><span>Хто</span><span>Що</span><span>Деталі</span></div>
          {shown.map((e) => (
            <div key={e.id} className="adm-tr adm-tr-log">
              <span className="mono adm-c-date" title={new Date(e.at).toLocaleString('uk-UA')}>{rel(e.at)}</span>
              <span className="mono">{e.actor}</span>
              <span className="mono">{KIND_LABEL[e.kind] || e.kind}{e.subject ? ` · ${e.subject}` : ''}</span>
              <span className="mono">{e.detail || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
