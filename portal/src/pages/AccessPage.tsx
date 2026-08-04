import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ACCESSES, ACCESS_GUIDES, STATUSES } from '../lib/model';
import { supabase, type AccessRow } from '../lib/supabase';
import { useApp } from '../App';

export default function AccessPage() {
  const { session, member } = useApp();
  const clientId = member.client_id!;
  const [rows, setRows] = useState<Record<string, AccessRow>>({});
  const [loaded, setLoaded] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    supabase
      .from('access_status')
      .select('*')
      .eq('client_id', clientId)
      .then(({ data }) => {
        const map: Record<string, AccessRow> = {};
        (data ?? []).forEach((r) => (map[r.access_id] = r as AccessRow));
        setRows(map);
        setLoaded(true);
      });
  }, [clientId]);

  const save = (accessId: string, patch: Partial<AccessRow>) => {
    setRows((prev) => {
      const cur = prev[accessId] ?? {
        client_id: clientId,
        access_id: accessId,
        status: 'Не выдан',
        comment: null,
        updated_by: session.user.email ?? null,
      };
      const next = { ...cur, ...patch, updated_by: session.user.email ?? null };
      clearTimeout(timers.current[accessId]);
      timers.current[accessId] = setTimeout(() => {
        supabase.from('access_status').upsert(next, { onConflict: 'client_id,access_id' });
      }, 500);
      return { ...prev, [accessId]: next };
    });
  };

  const done = Object.values(rows).filter((r) => r.status === 'Выдан').length;

  return (
    <div className="container" style={{ padding: '30px 20px 80px' }}>
      <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
        ← На главную
      </Link>
      <h1 style={{ marginTop: 10 }}>Передача доступов</h1>
      <p className="sub" style={{ maxWidth: 640 }}>
        Два доступа разблокируют расчёт денег: <b>AC-01 Google Analytics 4</b> и{' '}
        <b>AC-13 выгрузка заказов</b> — начните с них. Отметьте статус по каждой позиции; у каждой
        есть короткая инструкция «как выдать».
      </p>
      <div className="note" style={{ margin: '14px 0 22px' }}>
        🔒 Мы никогда не просим пароли через формы. Всё выдаётся приглашением на e-mail с правами
        «просмотр» или файлом в защищённую папку. Если без пароля никак — используйте одноразовую
        ссылку (Bitwarden Send / 1Password), а сюда напишите только «отправлено ссылкой».
      </div>
      <p className="mono" style={{ fontWeight: 700, marginBottom: 14 }}>
        Выдано: {done}/{ACCESSES.length}
      </p>

      {!loaded ? (
        <p className="sub">Загрузка…</p>
      ) : (
        ACCESSES.map((a) => {
          const r = rows[a.id];
          const status = r?.status ?? 'Не выдан';
          return (
            <div key={a.id} className="qcard">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <span className="qid">
                    {a.id} · {a.category}
                  </span>
                  <p className="qtext" style={{ marginBottom: 2 }}>
                    {a.system}
                    <span className="tag" style={{ marginLeft: 10 }}>
                      {a.level}
                    </span>
                  </p>
                  <p className="qwhy" style={{ marginBottom: 6 }}>
                    {a.why}
                  </p>
                  {ACCESS_GUIDES[a.id] && (
                    <p style={{ fontSize: 12.5, color: 'var(--lime-dark)', margin: 0 }}>
                      → {ACCESS_GUIDES[a.id]}
                    </p>
                  )}
                </div>
                <select
                  className="status-select"
                  value={status}
                  onChange={(e) => save(a.id, { status: e.target.value })}
                  style={{
                    borderColor:
                      status === 'Выдан' ? 'var(--lime)' : status === 'Нужна помощь' ? 'var(--red)' : undefined,
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              {(status === 'В процессе' || status === 'Нужна помощь' || r?.comment) && (
                <input
                  type="text"
                  style={{ marginTop: 10 }}
                  placeholder="Комментарий: кто выдаёт, когда, что мешает…"
                  value={r?.comment ?? ''}
                  onChange={(e) => save(a.id, { comment: e.target.value })}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
