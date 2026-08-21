import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  currentUser, isManager, listAllDiagnostics, listLeads, setTierStatusFor, clearTierStatusFor, setLeadStatus, signTierFile, CONFIGURED,
  MANAGER_EMAILS, type DiagUser, type AdminRow, type LeadRow, type TierStatus, type LeadStatus,
} from '@/lib/supa';
import { eur } from './lossModel';
import './system.css';
import './cabinet.css';

/**
 * /admin — операційна адмінка (єдиний кокпіт власника): дашборд, користувачі,
 * аудити, доступи T1–T4, заявки, налаштування. Дані — з Supabase (`diagnostics`,
 * `leads`). Доступ — лише акаунтам зі списку MANAGER_EMAILS (+ RLS-політика).
 * Контент сайту редагується окремо (зовнішня CMS) — тут операції, не тексти.
 */
type SiteTraffic = {
  period?: string; sessions?: number; users?: number; pageviews?: number; bounceRate?: number;
  sources?: { name: string; sessions: number }[]; pages?: { path: string; views: number }[]; error?: string;
};
type Tab = 'overview' | 'users' | 'audits' | 'access' | 'leads' | 'settings';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Дашборд' },
  { id: 'users', label: 'Користувачі' },
  { id: 'audits', label: 'Аудити' },
  { id: 'access', label: 'Доступи T1–T4' },
  { id: 'leads', label: 'Заявки' },
  { id: 'settings', label: 'Налаштування' },
];
const TIERS = ['T1', 'T2', 'T3', 'T4'];
const ST: Record<TierStatus | 'none', { txt: string; cls: string }> = {
  none: { txt: 'Не запрошено', cls: 'none' }, requested: { txt: 'Очікує', cls: 'wait' },
  data: { txt: 'Потрібні дані', cls: 'wait' }, granted: { txt: 'Надано', cls: 'ok' }, rejected: { txt: 'Відхилено', cls: 'bad' },
};

// Стадії воронки міні-CRM
const LEAD_STAGES: { k: LeadStatus; l: string; cls: string }[] = [
  { k: 'new', l: 'Новий', cls: 'wait' },
  { k: 'progress', l: 'У роботі', cls: 'wait' },
  { k: 'qualified', l: 'Кваліфікований', cls: 'ok' },
  { k: 'proposal', l: 'Пропозиція', cls: 'ok' },
  { k: 'won', l: 'Виграно', cls: 'ok' },
  { k: 'lost', l: 'Втрачено', cls: 'bad' },
];
const stageOf = (l: LeadRow): LeadStatus => l.status || 'new';

/** Відносна дата: «щойно», «5 хв», «3 год», «2 дн», далі — дата. */
function rel(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '';
  const s = Math.max(0, Math.floor((Date.now() - d) / 1000));
  if (s < 60) return 'щойно';
  if (s < 3600) return `${Math.floor(s / 60)} хв`;
  if (s < 86400) return `${Math.floor(s / 3600)} год`;
  if (s < 604800) return `${Math.floor(s / 86400)} дн`;
  try { return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' }); } catch { return ''; }
}

export function AdminPanel() {
  const [user, setUser] = useState<DiagUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [q, setQ] = useState('');
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [traffic, setTraffic] = useState<SiteTraffic | null | undefined>(undefined);
  const [sortKey, setSortKey] = useState<'email' | 'company' | 'tiers' | 'updated'>('updated');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [period, setPeriod] = useState<7 | 30 | 90 | 0>(30);
  const [ask, setAsk] = useState<{ userId: string; tier: string; status: TierStatus } | null>(null);
  const [askReason, setAskReason] = useState('');

  const load = () => {
    listAllDiagnostics().then(setRows);
    listLeads().then(setLeads);
    fetch('/api/ga4-site').then((r) => r.json()).then((j: SiteTraffic) => setTraffic(j)).catch(() => setTraffic(null));
  };
  useEffect(() => { currentUser().then((u) => { setUser(u); setChecking(false); if (u && isManager(u)) load(); }); }, []);

  const metrics = useMemo(() => {
    const r = rows || [];
    const tierReq = r.reduce((n, x) => n + Object.keys(x.funnel?.tierStatus || {}).length, 0);
    const granted = r.reduce((n, x) => n + Object.values(x.funnel?.tierStatus || {}).filter((s) => s === 'granted').length, 0);
    const pending = r.reduce((n, x) => n + Object.values(x.funnel?.tierStatus || {}).filter((s) => s === 'requested' || s === 'data').length, 0);
    return {
      users: r.length, company: r.filter((x) => x.company).length,
      express: r.filter((x) => x.hasExpress).length, deep: r.filter((x) => x.hasDeep).length,
      leadsN: (r.filter((x) => x.funnel?.leadAt).length), tierReq, granted, pending, leadsTable: (leads || []).length,
    };
  }, [rows, leads]);

  // Аналітика дашборда: воронка, розподіл статусів, стрічка останніх подій.
  const analytics = useMemo(() => {
    const r = rows || [];
    const funnel = [
      { k: 'Реєстрації', n: metrics.users },
      { k: 'Експрес-аудит', n: metrics.express },
      { k: 'Профіль компанії', n: metrics.company },
      { k: 'Глибокий аудит', n: metrics.deep },
      { k: 'Заявка', n: Math.max(metrics.leadsN, metrics.leadsTable) },
    ];
    const statusDist = (['requested', 'data', 'granted', 'rejected'] as TierStatus[]).map((s) => ({
      s, n: r.reduce((n, x) => n + Object.values(x.funnel?.tierStatus || {}).filter((v) => v === s).length, 0),
    }));
    type Ev = { at: string; kind: 'user' | 'tier' | 'lead'; label: string; sub?: string };
    const ev: Ev[] = [];
    r.forEach((x) => {
      if (x.updatedAt) ev.push({ at: x.updatedAt, kind: 'user', label: x.email, sub: x.company || 'оновлення профілю' });
      Object.entries(x.funnel?.tierHistory || {}).forEach(([tid, list]) => (list || []).forEach((e) => {
        ev.push({ at: e.at, kind: 'tier', label: x.email, sub: `${tid} → ${ST[e.st].txt}${e.by === 'manager' ? ' · менеджер' : ''}` });
      }));
    });
    (leads || []).forEach((l) => { if (l.at) ev.push({ at: l.at, kind: 'lead', label: l.email || l.phone || 'заявка', sub: l.source }); });
    ev.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
    // Фільтр за періодом (для стрічки й тренду); period=0 → усі.
    const since = period ? Date.now() - period * 86400000 : 0;
    const inPeriod = ev.filter((e) => !since || new Date(e.at).getTime() >= since);
    // Тренд подій по днях за обраний період (макс 30 стовпчиків).
    const days = period || 30;
    const trend = Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
      const t0 = dayStart.getTime() - (Math.min(days, 30) - 1 - i) * 86400000;
      const t1 = t0 + 86400000;
      return { t0, n: ev.filter((e) => { const x = new Date(e.at).getTime(); return x >= t0 && x < t1; }).length };
    });
    return { funnel, statusDist, recent: inPeriod.slice(0, 14), trend };
  }, [rows, leads, metrics, period]);

  if (checking) return <div className="adm"><div className="adm-boot mono">Завантаження…</div></div>;
  if (!CONFIGURED) return <Shell><p className="mc-msg">Supabase не налаштовано — адмінка недоступна.</p></Shell>;
  if (!user) return <Shell><p className="mc-msg">Увійдіть акаунтом адміністратора. <Link to="/cabinet" className="mc-link">Вхід →</Link></p></Shell>;
  if (!isManager(user)) return <Shell><p className="mc-msg">Акаунт <b>{user.email}</b> не має прав адміністратора. Додайте його в <code>MANAGER_EMAILS</code> і застосуйте RLS-політику.</p></Shell>;

  const applyStatus = async (userId: string, tier: string, status: TierStatus, reason?: string) => {
    setBusy(`${userId}:${tier}`);
    const res = await setTierStatusFor(userId, tier, status, reason);
    setBusy('');
    if (!res.ok) { alert('Не вдалося: ' + (res.error || '')); return; }
    load();
  };
  // «Надати» — одразу; «Потрібні дані» / «Відхилити» — через модалку з причиною.
  const setStatus = (userId: string, tier: string, status: TierStatus) => {
    if (status === 'granted') applyStatus(userId, tier, status);
    else { setAsk({ userId, tier, status }); setAskReason(''); }
  };
  const clearTier = async (userId: string, tier: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`Скинути ${tier} до «не запрошено»?`)) return;
    setBusy(`${userId}:${tier}`);
    const res = await clearTierStatusFor(userId, tier);
    setBusy('');
    if (!res.ok) { alert('Не вдалося: ' + (res.error || '')); return; }
    load();
  };
  const openFile = async (path: string) => { const url = await signTierFile(path); if (url) window.open(url, '_blank'); };
  const moveLead = async (id: string, status: LeadStatus) => {
    setBusy('lead:' + id);
    const res = await setLeadStatus(id, status);
    setBusy('');
    if (!res.ok) { alert('Не вдалося: ' + (res.error || '')); return; }
    listLeads().then(setLeads);
  };

  const filtered = (rows || []).filter((r) => !q || r.email.toLowerCase().includes(q.toLowerCase()) || (r.company || '').toLowerCase().includes(q.toLowerCase()));
  const tierCount = (r: AdminRow) => Object.keys(r.funnel?.tierStatus || {}).length;
  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = '', bv: string | number = '';
    if (sortKey === 'email') { av = a.email; bv = b.email; }
    else if (sortKey === 'company') { av = a.company || ''; bv = b.company || ''; }
    else if (sortKey === 'tiers') { av = tierCount(a); bv = tierCount(b); }
    else { av = a.updatedAt || ''; bv = b.updatedAt || ''; }
    return (av < bv ? -1 : av > bv ? 1 : 0) * sortDir;
  });
  const toggleSort = (k: typeof sortKey) => { if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1)); else { setSortKey(k); setSortDir(1); } };
  const sortMark = (k: typeof sortKey) => (sortKey === k ? (sortDir === 1 ? ' ▲' : ' ▼') : '');
  const exportUsersCsv = () => {
    const head = ['email', 'company', 'express', 'deep', 'tiers', 'accessCode', 'updatedAt'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [head.join(',')].concat(sorted.map((r) => [
      r.email, r.company || '', r.hasExpress ? 'yes' : '', r.hasDeep ? 'yes' : '',
      tierCount(r), r.funnel?.accessCode || '', r.updatedAt || '',
    ].map(esc).join(',')));
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'weexp-users.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  const detail = openUser ? (rows || []).find((r) => r.userId === openUser) : null;

  return (
    <div className="sysx adm">
      <aside className="adm-side">
        <Link to="/" className="adm-brand"><b>WEEXP</b><span className="mono">admin</span></Link>
        <nav className="adm-nav">
          {TABS.map((tb) => (
            <button key={tb.id} className={`adm-nav-i${tab === tb.id ? ' on' : ''}`} onClick={() => { setTab(tb.id); setOpenUser(null); }}>{tb.label}</button>
          ))}
        </nav>
        <div className="adm-foot mono">
          <span title={user.email}>{user.email}</span>
          <button onClick={load} className="adm-refresh">↻ оновити</button>
        </div>
      </aside>

      <main className="adm-main">
        {/* ── Дашборд ── */}
        {tab === 'overview' && (
          <section className="adm-sec">
            <div className="adm-sec-head">
              <h1 className="sysx-display adm-h1">Дашборд</h1>
              <div className="adm-period">
                {([7, 30, 90, 0] as const).map((p) => (
                  <button key={p} className={`adm-period-b${period === p ? ' on' : ''}`} onClick={() => setPeriod(p)}>{p === 0 ? 'усі' : `${p}д`}</button>
                ))}
              </div>
            </div>
            <div className="adm-tiles">
              <Tile n={metrics.users} l="Користувачів" />
              <Tile n={metrics.company} l="З профілем компанії" />
              <Tile n={metrics.express} l="Експрес-аудитів" />
              <Tile n={metrics.deep} l="Глибоких аудитів" accent />
              <Tile n={metrics.tierReq} l="Запитів T1–T4" />
              <Tile n={metrics.pending} l="Очікують рішення" accent />
              <Tile n={metrics.granted} l="Доступів надано" />
              <Tile n={metrics.leadsTable || metrics.leadsN} l="Заявок" />
            </div>
            {rows !== null && rows.length === 0 && <p className="mc-msg mono">Продуктових даних поки немає (або порожній результат — перевірте RLS-політику для адмінів у Supabase).</p>}

            {rows !== null && rows.length > 0 && (
              <div className="adm-grid2">
                <div className="adm-panel">
                  <span className="adm-col-h mono">Воронка</span>
                  <div className="adm-funnel">
                    {analytics.funnel.map((f) => {
                      const max = analytics.funnel[0].n || 1;
                      const pct = Math.round((f.n / max) * 100);
                      return (
                        <div key={f.k} className="adm-fn-row">
                          <span className="adm-fn-l">{f.k}</span>
                          <div className="adm-fn-bar"><span className="adm-fn-fill" style={{ width: `${Math.max(pct, 3)}%` }} /></div>
                          <span className="adm-fn-n mono">{f.n}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="adm-panel">
                  <span className="adm-col-h mono">Статуси T1–T4</span>
                  <div className="adm-dist">
                    {analytics.statusDist.map((d) => (
                      <div key={d.s} className="adm-dist-row">
                        <span className={`cab-badge mono tst-${ST[d.s].cls}`}>{ST[d.s].txt}</span>
                        <span className="adm-dist-n mono">{d.n}</span>
                      </div>
                    ))}
                    {analytics.statusDist.every((d) => d.n === 0) && <p className="mono adm-empty">запитів ще немає</p>}
                  </div>
                </div>
              </div>
            )}

            {rows !== null && rows.length > 0 && <Trend data={analytics.trend} />}

            {rows !== null && rows.length > 0 && (
              <div className="adm-panel">
                <span className="adm-col-h mono">Останні події · {period === 0 ? 'усі' : `${period} днів`}</span>
                {analytics.recent.length === 0 ? <p className="mono adm-empty">за період подій немає</p> : (
                  <ul className="adm-feed">
                    {analytics.recent.map((e, i) => (
                      <li key={i} className={`adm-feed-i k-${e.kind}`}>
                        <span className="adm-feed-dot" />
                        <span className="adm-feed-b"><b>{e.label}</b>{e.sub && <i>{e.sub}</i>}</span>
                        <span className="adm-feed-at mono">{rel(e.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <TrafficBlock t={traffic} />
          </section>
        )}

        {/* ── Користувачі ── */}
        {tab === 'users' && (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Користувачі</h1>
              <div className="adm-head-r">
                <input className="mc-search" placeholder="Пошук: email / компанія" value={q} onChange={(e) => setQ(e.target.value)} />
                <button className="sysx-cta" onClick={exportUsersCsv} disabled={sorted.length === 0}>↓ CSV</button>
              </div>
            </div>
            {rows === null ? <p className="mc-msg mono">Завантаження…</p> : sorted.length === 0 ? <EmptyState icon="👥" text={q ? 'Нічого не знайдено за запитом.' : 'Зареєстрованих користувачів поки немає.'} /> : (
              <div className="adm-table adm-tr-users">
                <div className="adm-tr adm-th adm-tr-users">
                  <button className="adm-sort" onClick={() => toggleSort('email')}>Email{sortMark('email')}</button>
                  <button className="adm-sort" onClick={() => toggleSort('company')}>Компанія{sortMark('company')}</button>
                  <span>Аудити</span>
                  <button className="adm-sort" onClick={() => toggleSort('tiers')}>T1–T4{sortMark('tiers')}</button>
                  <button className="adm-sort" onClick={() => toggleSort('updated')}>Активність{sortMark('updated')}</button>
                  <span></span>
                </div>
                {sorted.map((r) => (
                  <div key={r.userId} className="adm-tr adm-tr-users">
                    <a className="adm-c-email adm-mail" href={`mailto:${r.email}`} title="Написати">{r.email}</a>
                    <span className="mono">{r.company || '—'}</span>
                    <span className="mono">{r.hasExpress ? 'E' : '·'} {r.hasDeep ? 'D' : '·'}</span>
                    <span className="mono">{tierCount(r) || '—'}{r.funnel?.accessCode ? ' 🔑' : ''}</span>
                    <span className="mono adm-c-date">{rel(r.updatedAt)}</span>
                    <button className="adm-open" onClick={() => setOpenUser(r.userId)}>Відкрити →</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Аудити ── */}
        {tab === 'audits' && (
          <section className="adm-sec">
            <h1 className="sysx-display adm-h1">Аудити</h1>
            {rows === null ? <p className="mc-msg mono">Завантаження…</p> : (rows || []).length === 0 ? <EmptyState icon="📊" text="Аудитів поки немає." /> : (
              <div className="adm-table">
                <div className="adm-tr adm-th adm-tr-4"><span>Email</span><span>Експрес-витік</span><span>Глибокий</span><span>Рівні</span></div>
                {(rows || []).map((r) => {
                  const money = r.record?.stage1Money;
                  const tiers = Object.entries(r.funnel?.tierStatus || {});
                  return (
                    <button key={r.userId} className="adm-tr adm-tr-4 adm-tr-btn" onClick={() => setOpenUser(r.userId)}>
                      <span className="adm-c-email">{r.email}</span>
                      <span className="mono">{money ? `${eur(money[0])}–${eur(money[1])}` : r.hasExpress ? 'є' : '—'}</span>
                      <span className="mono">{r.hasDeep ? 'у роботі' : '—'}</span>
                      <span className="adm-c-tiers">{tiers.length === 0 ? <i className="mono">—</i> : tiers.map(([tid, s]) => <span key={tid} className={`cab-badge mono tst-${ST[s].cls}`}>{tid}</span>)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Доступи T1–T4 (керування) ── */}
        {tab === 'access' && (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Доступи T1–T4</h1>
              <input className="mc-search" placeholder="Пошук: email / компанія" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            {rows === null ? <p className="mc-msg mono">Завантаження…</p> : (
              <div className="mc-list">
                {filtered.filter((r) => TIERS.some((t) => (r.funnel?.tierStatus?.[t] || 'none') !== 'none')).map((r) => (
                  <div key={r.userId} className="mc-card">
                    <div className="mc-card-top">
                      <div><b className="mc-email">{r.email}</b>{r.company && <span className="mc-company mono"> · {r.company}</span>}</div>
                    </div>
                    {r.funnel?.accessCode ? (
                      <div className="adm-code-banner">
                        <span className="adm-code-banner-l mono">Код доступу видано клієнту</span>
                        <button className="adm-code adm-code-lg" onClick={() => { navigator.clipboard?.writeText(r.funnel!.accessCode!); setBusy('copied:' + r.userId); setTimeout(() => setBusy(''), 1200); }} title="Скопіювати код">
                          {busy === 'copied:' + r.userId ? '✓ скопійовано' : `🔑 ${r.funnel.accessCode}`}
                        </button>
                        <span className="adm-code-banner-h mono">клієнт вводить його у «Глибокому аудиті»</span>
                      </div>
                    ) : (
                      <p className="adm-code-hint mono">Код доступу зʼявиться тут після «Надати» на будь-якому рівні.</p>
                    )}
                    <div className="mc-tiers">
                      {TIERS.filter((tid) => (r.funnel?.tierStatus?.[tid] || 'none') !== 'none').map((tid) => {
                        const cur = (r.funnel?.tierStatus?.[tid] || 'none') as TierStatus | 'none';
                        const files = r.funnel?.tierFiles?.[tid] || [];
                        const b = `${r.userId}:${tid}`;
                        return (
                          <div key={tid} className="mc-tier">
                            <div className="mc-tier-l"><b className="mc-tid">{tid}</b><span className={`cab-badge mono tst-${ST[cur].cls}`}>{ST[cur].txt}</span>
                              {files.map((f, i) => <button key={i} className="mc-file mono" onClick={() => openFile(f.path)}>📎 {f.name}</button>)}</div>
                            <div className="mc-tier-act">
                              <button className="mc-btn ok" disabled={busy === b} onClick={() => setStatus(r.userId, tid, 'granted')}>Надати</button>
                              <button className="mc-btn wait" disabled={busy === b} onClick={() => setStatus(r.userId, tid, 'data')}>Потрібні дані</button>
                              <button className="mc-btn bad" disabled={busy === b} onClick={() => setStatus(r.userId, tid, 'rejected')}>Відхилити</button>
                              <button className="mc-btn ghost" disabled={busy === b} onClick={() => clearTier(r.userId, tid)} title="Скинути до «не запрошено»">✕</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filtered.filter((r) => TIERS.some((t) => (r.funnel?.tierStatus?.[t] || 'none') !== 'none')).length === 0 && <p className="mc-msg mono">Активних запитів на рівні немає.</p>}
              </div>
            )}
          </section>
        )}

        {/* ── Заявки · міні-CRM ── */}
        {tab === 'leads' && (
          <section className="adm-sec">
            <h1 className="sysx-display adm-h1">Заявки · CRM</h1>
            {leads === null ? <p className="mc-msg mono">Завантаження…</p>
              : leads.length === 0 ? <EmptyState icon="✉" text="Заявок ще немає. Вони зʼявляться тут автоматично з форм сайту (і дублюються на пошту)." />
              : (() => {
                const count = (k: LeadStatus) => leads.filter((l) => stageOf(l) === k).length;
                const won = count('won'), total = leads.length, lost = count('lost');
                const conv = total ? Math.round((won / total) * 100) : 0;
                return (
                  <>
                    {/* Воронка */}
                    <div className="adm-panel">
                      <span className="adm-col-h mono">Воронка продажів · {total} заявок · {conv}% виграно</span>
                      <div className="adm-crmfunnel">
                        {LEAD_STAGES.map((s) => {
                          const n = count(s.k); const pct = total ? Math.round((n / total) * 100) : 0;
                          return (
                            <div key={s.k} className="adm-cf-row">
                              <span className={`cab-badge mono tst-${s.cls}`}>{s.l}</span>
                              <div className="adm-fn-bar"><span className={`adm-fn-fill tst-fill-${s.cls}`} style={{ width: `${Math.max(pct, n ? 4 : 0)}%` }} /></div>
                              <span className="adm-fn-n mono">{n}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Пайплайн-дошка */}
                    <div className="adm-board">
                      {LEAD_STAGES.map((s) => {
                        const col = leads.filter((l) => stageOf(l) === s.k);
                        return (
                          <div key={s.k} className="adm-col">
                            <div className="adm-col-head"><span className={`cab-badge mono tst-${s.cls}`}>{s.l}</span><span className="adm-col-n mono">{col.length}</span></div>
                            <div className="adm-col-body">
                              {col.map((l) => (
                                <button key={l.id} className="adm-lead-card" onClick={() => setOpenLead(l.id || '')}>
                                  <b>{l.name || l.email || l.phone || 'Заявка'}</b>
                                  <span className="mono adm-lead-sub">{l.task || l.comment || l.source || '—'}</span>
                                  <span className="mono adm-lead-at">{rel(l.at)}{l.source ? ` · ${l.source}` : ''}</span>
                                </button>
                              ))}
                              {col.length === 0 && <span className="mono adm-col-empty">—</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="adm-hint mono">Виграно: {won} · Втрачено: {lost}. Клік по картці — картка заявки й зміна стадії.</p>
                  </>
                );
              })()}
          </section>
        )}

        {/* ── Налаштування ── */}
        {tab === 'settings' && (
          <section className="adm-sec">
            <h1 className="sysx-display adm-h1">Налаштування</h1>
            <div className="mc-msg">
              <p><b>Адміністратори</b> (список у коді <code>MANAGER_EMAILS</code>):</p>
              <ul className="adm-list">{MANAGER_EMAILS.map((e) => <li key={e} className="mono">{e}</li>)}</ul>
              <p className="adm-hint mono">Щоб додати адміна — впиши email у <code>src/lib/supa.ts → MANAGER_EMAILS</code> і додай його у RLS-політики Supabase (SELECT/UPDATE на <code>diagnostics</code>). Контент сайту редагується в окремій CMS (фаза 2).</p>
            </div>
          </section>
        )}
      </main>

      {/* Панель деталей користувача */}
      {detail && <UserDetail row={detail} onClose={() => setOpenUser(null)} openFile={openFile} onStatus={setStatus} busy={busy} />}
      {/* Панель деталей заявки */}
      {openLead && leads && <LeadDetail lead={leads.find((l) => l.id === openLead)} onClose={() => setOpenLead(null)} onStatus={moveLead} busy={busy} />}

      {/* Модалка причини (замість browser prompt) */}
      {ask && (
        <div className="adm-modal-wrap" onClick={() => setAsk(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <b className="adm-modal-h">{ask.status === 'rejected' ? `Відхилити ${ask.tier}` : `${ask.tier}: запит даних`}</b>
            <p className="adm-modal-p mono">{ask.status === 'rejected' ? 'Причина відмови — її побачить клієнт у кабінеті.' : 'Що саме потрібно від клієнта — він побачить це у кабінеті.'}</p>
            <textarea className="adm-modal-ta" autoFocus rows={3} value={askReason} onChange={(e) => setAskReason(e.target.value)}
              placeholder={ask.status === 'rejected' ? 'Напр.: недостатньо даних для рівня' : 'Напр.: надайте доступ до GA4 та вивантаження замовлень'} />
            <div className="adm-modal-act">
              <button className="mc-btn" onClick={() => setAsk(null)}>Скасувати</button>
              <button className={`mc-btn ${ask.status === 'rejected' ? 'bad' : 'wait'}`} onClick={() => { applyStatus(ask.userId, ask.tier, ask.status, askReason.trim() || undefined); setAsk(null); }}>
                {ask.status === 'rejected' ? 'Відхилити' : 'Запросити дані'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadDetail({ lead, onClose, onStatus, busy }: { lead?: LeadRow; onClose: () => void; onStatus: (id: string, s: LeadStatus) => void; busy: string }) {
  if (!lead) return null;
  const cur = lead.status || 'new';
  const rows: [string, string | undefined][] = [
    ['Дата', lead.at ? new Date(lead.at).toLocaleString('uk-UA') : undefined],
    ['Джерело', lead.source],
    ['Email', lead.email],
    ['Телефон', lead.phone],
    ['Імʼя', lead.name],
    ['Роль', lead.role],
    ['Магазин / сайт', lead.store],
    ['Оборот / міс', lead.turnover],
    ['Задача', lead.task],
    ['Терміни', lead.timeline],
    ['Бюджет', lead.budget],
  ];
  return (
    <div className="adm-drawer-wrap" onClick={onClose}>
      <aside className="adm-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="adm-drawer-head">
          <a className="adm-email adm-mail" href={`mailto:${lead.email || ''}`}>{lead.email || lead.phone || 'Заявка'}</a>
          <button className="adm-x" onClick={onClose}>✕</button>
        </div>
        <div className="adm-drawer-body">
          <Block title="Стадія CRM">
            <div className="adm-stage-pick">
              {LEAD_STAGES.map((s) => (
                <button key={s.k} className={`adm-stage-b tst-${s.cls}${cur === s.k ? ' on' : ''}`} disabled={busy === 'lead:' + lead.id}
                  onClick={() => cur !== s.k && onStatus(lead.id || '', s.k)}>{s.l}</button>
              ))}
            </div>
          </Block>
          <Block title="Заявка">
            <ul className="adm-kv">
              {rows.filter(([, v]) => v).map(([k, v]) => <li key={k}><i>{k}</i><span>{v}</span></li>)}
            </ul>
          </Block>
          {lead.comment && <Block title="Коментар / проблема"><p className="adm-longtext">{lead.comment}</p></Block>}
          {lead.diag && <Block title="Результат діагностики (X-Ray)"><pre className="adm-pre">{lead.diag}</pre></Block>}
          {lead.calc && <Block title="Розрахунок калькулятора"><pre className="adm-pre">{lead.calc}</pre></Block>}
        </div>
      </aside>
    </div>
  );
}

function Tile({ n, l, accent }: { n: number; l: string; accent?: boolean }) {
  return <div className={`adm-tile${accent ? ' accent' : ''}`}><b className="adm-tile-n">{n}</b><span className="adm-tile-l">{l}</span></div>;
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return <div className="adm-empty-box"><span className="adm-empty-ic" aria-hidden="true">{icon}</span><p className="mono">{text}</p></div>;
}

function Trend({ data }: { data: { t0: number; n: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  const total = data.reduce((s, d) => s + d.n, 0);
  return (
    <div className="adm-panel adm-trend">
      <span className="adm-col-h mono">Активність по днях · {total} подій</span>
      <div className="adm-trend-bars">
        {data.map((d, i) => (
          <span key={i} className={`adm-trend-bar${d.n > 0 ? ' has' : ''}`} style={{ height: `${d.n ? Math.max(Math.round((d.n / max) * 100), 6) : 2}%` }}
            title={`${new Date(d.t0).toLocaleDateString('uk-UA')}: ${d.n}`} />
        ))}
      </div>
    </div>
  );
}

function TrafficBlock({ t }: { t: SiteTraffic | null | undefined }) {
  if (t === undefined) return <div className="adm-traffic"><span className="sysx-kick">Трафік сайту · GA4</span><p className="mono adm-hint">Завантаження…</p></div>;
  if (t === null || t.error) return (
    <div className="adm-traffic">
      <span className="sysx-kick">Трафік сайту · GA4</span>
      <p className="mono adm-hint">{t?.error || 'Дані трафіку недоступні тут (працює на проді). Потрібні env GA4_SITE_PROPERTY_ID / GA4_SA_EMAIL / GA4_SA_KEY у Vercel.'}</p>
    </div>
  );
  const nf = (n?: number) => (n ?? 0).toLocaleString('uk-UA');
  return (
    <div className="adm-traffic">
      <span className="sysx-kick">Трафік сайту · GA4 · {t.period || '30 днів'}</span>
      <div className="adm-tiles">
        <Tile n={t.sessions ?? 0} l="Сесій" />
        <Tile n={t.users ?? 0} l="Користувачів" />
        <Tile n={t.pageviews ?? 0} l="Переглядів" />
        <div className="adm-tile"><b className="adm-tile-n">{t.bounceRate ?? 0}%</b><span className="adm-tile-l">Показник відмов</span></div>
      </div>
      <div className="adm-traffic-cols">
        <div className="adm-traffic-col">
          <span className="adm-col-h mono">Джерела</span>
          {(t.sources || []).length === 0 ? <p className="mono adm-empty">—</p> : (t.sources || []).map((s) => (
            <div key={s.name} className="adm-bar-row"><span className="adm-bar-l">{s.name}</span><span className="adm-bar-v mono">{nf(s.sessions)}</span></div>
          ))}
        </div>
        <div className="adm-traffic-col">
          <span className="adm-col-h mono">Топ сторінок</span>
          {(t.pages || []).length === 0 ? <p className="mono adm-empty">—</p> : (t.pages || []).map((p) => (
            <div key={p.path} className="adm-bar-row"><span className="adm-bar-l mono">{p.path}</span><span className="adm-bar-v mono">{nf(p.views)}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserDetail({ row, onClose, openFile, onStatus, busy }: { row: AdminRow; onClose: () => void; openFile: (p: string) => void; onStatus: (userId: string, tier: string, status: TierStatus) => void; busy: string }) {
  const rec = row.record || {};
  const company = rec.company;
  const money = rec.stage1Money;
  const tiers = Object.entries(row.funnel?.tierStatus || {});
  const files = Object.entries(row.funnel?.tierFiles || {});
  const code = row.funnel?.accessCode;
  return (
    <div className="adm-drawer-wrap" onClick={onClose}>
      <aside className="adm-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="adm-drawer-head">
          <a className="adm-email adm-mail" href={`mailto:${row.email}`}>{row.email}</a>
          <button className="adm-x" onClick={onClose}>✕</button>
        </div>
        <div className="adm-drawer-body">
          {code && (
            <Block title="Код доступу">
              <button className="adm-code adm-code-lg" onClick={() => navigator.clipboard?.writeText(code)} title="Скопіювати">🔑 {code}</button>
              <span className="mono adm-empty">клієнт вводить його у «Глибокому аудиті»</span>
            </Block>
          )}
          <Block title="Компанія">{company?.name ? (
            <ul className="adm-kv">
              <li><i>Назва</i><span>{company.name}</span></li>
              {company.site && <li><i>Сайт</i><span>{company.site}</span></li>}
              {company.niche && <li><i>Ніша</i><span>{company.niche}</span></li>}
              {company.revenue && <li><i>Оборот</i><span>{company.revenue}</span></li>}
              {company.contactName && <li><i>Контакт</i><span>{company.contactName} {company.contactPhone || ''}</span></li>}
            </ul>
          ) : <p className="mono adm-empty">профіль не заповнено</p>}</Block>

          <Block title="Експрес-витік">{money ? <p className="adm-money">{eur(money[0])} – {eur(money[1])} <i>/ рік</i></p> : <p className="mono adm-empty">{row.hasExpress ? 'є' : 'не рахували'}</p>}</Block>

          <Block title="Глибокий аудит">{row.hasDeep ? <p className="mono">у роботі</p> : <p className="mono adm-empty">не почато</p>}</Block>

          <Block title="Доступи T1–T4">{tiers.length ? (
            <div className="adm-drawer-tiers">
              {tiers.map(([tid, s]) => {
                const b = `${row.userId}:${tid}`;
                return (
                  <div key={tid} className="adm-dtier">
                    <div className="adm-dtier-l"><b className="mc-tid">{tid}</b><span className={`cab-badge mono tst-${ST[s].cls}`}>{ST[s].txt}</span></div>
                    <div className="mc-tier-act">
                      <button className="mc-btn ok" disabled={busy === b} onClick={() => onStatus(row.userId, tid, 'granted')}>Надати</button>
                      <button className="mc-btn wait" disabled={busy === b} onClick={() => onStatus(row.userId, tid, 'data')}>Дані</button>
                      <button className="mc-btn bad" disabled={busy === b} onClick={() => onStatus(row.userId, tid, 'rejected')}>Відхилити</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="mono adm-empty">немає запитів</p>}</Block>

          {files.length > 0 && (
            <Block title="Файли">
              <ul className="adm-files">{files.flatMap(([tid, arr]) => arr.map((f, i) => (
                <li key={tid + i}><button className="mono adm-file" onClick={() => openFile(f.path)}>📎 {tid}: {f.name}</button></li>
              )))}</ul>
            </Block>
          )}
        </div>
      </aside>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="adm-block"><span className="sysx-kick">{title}</span>{children}</div>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="sysx adm"><div className="adm-in"><Link to="/" className="mc-back mono">← weexp.agency</Link>{children}</div></div>;
}
