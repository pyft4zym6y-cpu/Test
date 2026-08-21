import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  currentUser, isManager, listAllDiagnostics, setTierStatusFor, signTierFile, CONFIGURED,
  type DiagUser, type AdminRow, type TierStatus,
} from '@/lib/supa';
import './system.css';
import './cabinet.css';

/**
 * /manage — консоль менеджера доступів (Етап D). Замикає воронку T1–T4: тут
 * статуси реально проставляються (надано / потрібні дані / відхилено), а клієнт
 * бачить це в кабінеті в реальному часі. Доступ — лише для акаунтів зі списку
 * MANAGER_EMAILS (звірка з увійшлим користувачем + RLS у Supabase).
 */
const TIERS = ['T1', 'T2', 'T3', 'T4'];
const ST: Record<TierStatus | 'none', { txt: string; cls: string }> = {
  none: { txt: 'Не запрошено', cls: 'none' },
  requested: { txt: 'Очікує підтвердження', cls: 'wait' },
  data: { txt: 'Потрібні дані', cls: 'wait' },
  granted: { txt: 'Доступ надано', cls: 'ok' },
  rejected: { txt: 'Відхилено', cls: 'bad' },
};

export function ManagerConsole() {
  const [user, setUser] = useState<DiagUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [busy, setBusy] = useState('');
  const [q, setQ] = useState('');

  const load = () => listAllDiagnostics().then(setRows);
  useEffect(() => {
    currentUser().then((u) => { setUser(u); setChecking(false); if (u && isManager(u)) load(); });
  }, []);

  const setStatus = async (userId: string, tier: string, status: TierStatus) => {
    let reason: string | undefined;
    if ((status === 'rejected' || status === 'data') && typeof window !== 'undefined') {
      reason = window.prompt(status === 'rejected' ? 'Причина відмови (побачить клієнт):' : 'Які дані потрібні (побачить клієнт):') || undefined;
    }
    setBusy(`${userId}:${tier}`);
    const r = await setTierStatusFor(userId, tier, status, reason);
    setBusy('');
    if (!r.ok) { alert('Не вдалося зберегти: ' + (r.error || '')); return; }
    load();
  };

  const openFile = async (path: string) => { const url = await signTierFile(path); if (url) window.open(url, '_blank'); else alert('Файл недоступний.'); };

  if (checking) return <div className="mc"><div className="mc-boot mono">Завантаження…</div></div>;

  if (!CONFIGURED) return <ConsoleShell><p className="mc-msg">Supabase не налаштовано — консоль недоступна.</p></ConsoleShell>;
  if (!user) return <ConsoleShell><p className="mc-msg">Увійдіть акаунтом менеджера. <Link to="/cabinet" className="mc-link">Вхід →</Link></p></ConsoleShell>;
  if (!isManager(user)) return <ConsoleShell><p className="mc-msg">Акаунт <b>{user.email}</b> не має прав менеджера. Додайте його в <code>MANAGER_EMAILS</code> та застосуйте RLS-політику.</p></ConsoleShell>;

  const filtered = (rows || []).filter((r) => !q || r.email.toLowerCase().includes(q.toLowerCase()) || (r.company || '').toLowerCase().includes(q.toLowerCase()));
  const activeTiers = (r: AdminRow) => TIERS.filter((tid) => (r.funnel?.tierStatus?.[tid] || 'none') !== 'none');

  return (
    <ConsoleShell>
      <div className="mc-head">
        <div>
          <span className="sysx-kick">Консоль менеджера</span>
          <h1 className="sysx-display mc-h1">Доступи <span className="hl">T1–T4</span></h1>
        </div>
        <div className="mc-head-r">
          <input className="mc-search" placeholder="Пошук: email або компанія" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="sysx-cta" onClick={load}>Оновити</button>
        </div>
      </div>

      {rows === null ? <p className="mc-msg mono">Завантаження записів…</p>
        : filtered.length === 0 ? <p className="mc-msg mono">Записів поки немає (або порожній результат — перевірте RLS-політику для менеджерів).</p>
        : (
        <div className="mc-list">
          {filtered.map((r) => {
            const reqTiers = activeTiers(r);
            return (
              <div key={r.userId} className="mc-card">
                <div className="mc-card-top">
                  <div>
                    <b className="mc-email">{r.email}</b>
                    {r.company && <span className="mc-company mono"> · {r.company}</span>}
                  </div>
                  {r.updatedAt && <span className="mc-upd mono">{new Date(r.updatedAt).toLocaleString('uk-UA')}</span>}
                </div>
                {reqTiers.length === 0 ? <p className="mc-none mono">Немає активних запитів на рівні.</p> : (
                  <div className="mc-tiers">
                    {reqTiers.map((tid) => {
                      const cur = (r.funnel?.tierStatus?.[tid] || 'none') as TierStatus | 'none';
                      const done = (r.funnel?.tierChecklist?.[tid] || []).length;
                      const files = r.funnel?.tierFiles?.[tid] || [];
                      const b = `${r.userId}:${tid}`;
                      return (
                        <div key={tid} className="mc-tier">
                          <div className="mc-tier-l">
                            <b className="mc-tid">{tid}</b>
                            <span className={`cab-badge mono tst-${ST[cur].cls}`}>{ST[cur].txt}</span>
                            {done > 0 && <span className="mc-meta mono">{done} п. доступу відмічено</span>}
                            {r.funnel?.tierReason?.[tid] && <span className="mc-meta mono">« {r.funnel.tierReason[tid]} »</span>}
                            {files.map((f, i) => <button key={i} className="mc-file mono" onClick={() => openFile(f.path)}>📎 {f.name}</button>)}
                          </div>
                          <div className="mc-tier-act">
                            <button className="mc-btn ok" disabled={busy === b} onClick={() => setStatus(r.userId, tid, 'granted')}>Надати</button>
                            <button className="mc-btn wait" disabled={busy === b} onClick={() => setStatus(r.userId, tid, 'data')}>Потрібні дані</button>
                            <button className="mc-btn bad" disabled={busy === b} onClick={() => setStatus(r.userId, tid, 'rejected')}>Відхилити</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ConsoleShell>
  );
}

function ConsoleShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="sysx mc">
      <div className="mc-in">
        <Link to="/" className="mc-back mono">← weexp.agency</Link>
        {children}
      </div>
    </div>
  );
}
