import { useEffect, useState } from 'react';
import { listAdminEvents, type AdminEventRow } from '@/lib/supa';
import { EmptyState, rel } from './shared';

/**
 * Журнал дій команди. Відповідає на питання, на які раніше в системі відповіді
 * не було: хто видав доступ, хто закрив етап, хто зачепив картку минулого
 * тижня. Пишеться шаром даних автоматично (див. logAdminEvent).
 */
const KIND_LABEL: Record<string, string> = {
  tier_status: 'статус доступу',
  tier_clear: 'скидання статусу',
  patch: 'зміна картки',
  projects: 'проекти',
  assessment: 'оцінка модулів',
};

export function EventLog({ userId, limit = 100 }: { userId?: string; limit?: number }) {
  const [rows, setRows] = useState<AdminEventRow[] | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    listAdminEvents(limit, userId).then((r) => { if (alive) { setRows(r.rows); setMissing(!!r.missing); } });
    return () => { alive = false; };
  }, [userId, limit]);

  if (rows === null) return <p className="mc-msg mono">Завантаження…</p>;
  if (missing) return (
    <p className="adm-hint mono">
      Журнал ще не увімкнено: застосуйте <code>docs/admin-roles-and-events.sql</code> у Supabase SQL Editor.
      До того дії виконуються, але не записуються.
    </p>
  );
  if (!rows.length) return <EmptyState icon="🧾" text="Записів ще немає — журнал наповнюється діями команди." />;

  return (
    <div className="adm-table adm-tr-log">
      <div className="adm-tr adm-th adm-tr-log"><span>Коли</span><span>Хто</span><span>Що</span><span>Деталі</span></div>
      {rows.map((e) => (
        <div key={e.id} className="adm-tr adm-tr-log">
          <span className="mono adm-c-date" title={new Date(e.at).toLocaleString('uk-UA')}>{rel(e.at)}</span>
          <span className="mono">{e.actor}</span>
          <span className="mono">{KIND_LABEL[e.kind] || e.kind}{e.subject ? ` · ${e.subject}` : ''}</span>
          <span className="mono">{e.detail || '—'}</span>
        </div>
      ))}
    </div>
  );
}
