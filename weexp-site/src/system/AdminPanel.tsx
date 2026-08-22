import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  currentUser, isManager, listAllDiagnostics, listLeads, setTierStatusFor, clearTierStatusFor, setLeadStatus, deleteLead, deleteDiagnostics, signTierFile, CONFIGURED,
  findAuditIdByCode, loadAuditAnswers, loadAuditExtra, saveAuditExtra,
  saveProjectsFor, emptyProject, getProjects, loadPmDirectory, savePmDirectory, aiDraftProject,
  MANAGER_EMAILS, type DiagUser, type AdminRow, type LeadRow, type TierStatus, type LeadStatus, type AuditAnswer, type ExtraQ,
  type Project, type ProjTask, type ProjMember, type ProjPayment, type ProjMonth, type ProjTariffItem,
  type PmDirectory, type PmSpecialist, type PmRoleRate,
} from '@/lib/supa';
import { eur, sysLabel, actionText, type SysKey } from './lossModel';
import { toast } from '@/lib/toast';
import { useCabTheme, ThemeToggle } from '@/lib/cabTheme';
import { AuditBuilder } from './AuditBuilder';
import { loadTemplate, uid, Q_TYPES, type AuditTemplate, type Question } from './auditTemplate';
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
type Tab = 'overview' | 'users' | 'audits' | 'template' | 'access' | 'leads' | 'pm' | 'settings';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Дашборд' },
  { id: 'users', label: 'Користувачі' },
  { id: 'audits', label: 'Аудити' },
  { id: 'template', label: 'Конструктор аудиту' },
  { id: 'leads', label: 'Первинна комунікація' },
  { id: 'pm', label: 'Проект-офіс' },
  { id: 'settings', label: 'Налаштування' },
];
// Джерела заявок, що є запитами доступу (не первинна комунікація).
const ACCESS_SOURCES = ['cabinet-access', 'cabinet-deep'];
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
// Клієнту показуємо єдину послугу «Глибокий аудит» (ключ DEEP). Старі T1–T4 — легасі.
const tierLabel = (tid: string) => (tid === 'DEEP' ? 'Глибокий аудит' : tid);

// ── Єдина клієнтська воронка (Аудити): стадія виводиться з даних клієнта ──
type FunnelStage = 'registered' | 'express' | 'requested' | 'awaiting_data' | 'in_work' | 'project';
const FUNNEL: { k: FunnelStage; l: string; cls: string }[] = [
  { k: 'registered', l: 'Зареєстрований', cls: 'none' },
  { k: 'express', l: 'Експрес пройдено', cls: 'ok' },
  { k: 'requested', l: 'Запит на глибокий', cls: 'wait' },
  { k: 'awaiting_data', l: 'Очікуються дані', cls: 'wait' },
  { k: 'in_work', l: 'Аудит у роботі', cls: 'ok' },
  { k: 'project', l: 'Проект', cls: 'ok' },
];
const funnelStage = (r: AdminRow): FunnelStage => {
  const ts = Object.values(r.funnel?.tierStatus || {});
  if (getProjects(r.record).length) return 'project';
  if (r.hasDeep || ts.includes('granted')) return 'in_work';
  if (ts.includes('data')) return 'awaiting_data';
  if (ts.includes('requested')) return 'requested';
  if (r.hasExpress) return 'express';
  return 'registered';
};

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
  const theme = useCabTheme();
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
  const [selLeads, setSelLeads] = useState<Set<string>>(new Set()); // мультивибір заявок (має бути ДО ранніх return — правило хуків)
  const [userSeg, setUserSeg] = useState<'clients' | 'admins' | 'all'>('clients'); // підрозділ «Користувачі»
  const [auditFilter, setAuditFilter] = useState<FunnelStage | 'all'>('all'); // фільтр воронки «Аудити»

  const load = () => {
    listAllDiagnostics().then(setRows);
    listLeads().then(setLeads);
    fetch('/api/ga4-site').then((r) => r.json()).then((j: SiteTraffic) => setTraffic(j)).catch(() => setTraffic(null));
  };
  useEffect(() => { currentUser().then((u) => { setUser(u); setChecking(false); if (u && isManager(u)) load(); }); }, []);
  // Esc закриває відкриті шухляди/модалку.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAsk(null); setOpenUser(null); setOpenLead(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
    type Ev = { at: string; kind: 'user' | 'tier' | 'lead' | 'express'; label: string; sub?: string };
    const ev: Ev[] = [];
    r.forEach((x) => {
      if (x.updatedAt) ev.push({ at: x.updatedAt, kind: 'user', label: x.email, sub: x.company || 'оновлення профілю' });
      if (x.record?.express) ev.push({ at: x.record.express.at, kind: 'express', label: x.email, sub: `експрес-аудит: ${eur(x.record.express.total)}/рік` });
      Object.entries(x.funnel?.tierHistory || {}).forEach(([tid, list]) => (list || []).forEach((e) => {
        ev.push({ at: e.at, kind: 'tier', label: x.email, sub: `${tid} → ${ST[e.st]?.txt ?? e.st}${e.by === 'manager' ? ' · менеджер' : ''}` });
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
    // Джерела заявок (по l.source) за період — без службових access-джерел.
    const srcMap = new Map<string, number>();
    (leads || []).forEach((l) => {
      if (ACCESS_SOURCES.includes(l.source || '')) return;
      if (since && l.at && new Date(l.at).getTime() < since) return;
      const key = (l.source || 'без мітки').trim() || 'без мітки';
      srcMap.set(key, (srcMap.get(key) || 0) + 1);
    });
    const leadSources = [...srcMap.entries()].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n).slice(0, 8);
    return { funnel, statusDist, recent: inPeriod.slice(0, 14), trend, leadSources };
  }, [rows, leads, metrics, period]);

  if (checking) return <div className="adm"><div className="adm-boot mono">Завантаження…</div></div>;
  if (!CONFIGURED) return <Shell><p className="mc-msg">Supabase не налаштовано — адмінка недоступна.</p></Shell>;
  if (!user) return <Shell><p className="mc-msg">Увійдіть акаунтом адміністратора. <Link to="/cabinet" className="mc-link">Вхід →</Link></p></Shell>;
  if (!isManager(user)) return <Shell><p className="mc-msg">Акаунт <b>{user.email}</b> не має прав адміністратора. Додайте його в <code>MANAGER_EMAILS</code> і застосуйте RLS-політику.</p></Shell>;

  const applyStatus = async (userId: string, tier: string, status: TierStatus, reason?: string) => {
    setBusy(`${userId}:${tier}`);
    const res = await setTierStatusFor(userId, tier, status, reason);
    setBusy('');
    if (!res.ok) { toast('Не вдалося: ' + (res.error || ''), 'err'); return; }
    toast('✓ Статус оновлено'); load();
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
    if (!res.ok) { toast('Не вдалося: ' + (res.error || ''), 'err'); return; }
    toast('✓ Статус оновлено'); load();
  };
  const openFile = async (path: string) => { const url = await signTierFile(path); if (url) window.open(url, '_blank'); };
  const moveLead = async (id: string, status: LeadStatus) => {
    setBusy('lead:' + id);
    const res = await setLeadStatus(id, status);
    setBusy('');
    if (!res.ok) { toast('Не вдалося: ' + (res.error || ''), 'err'); return; }
    toast('✓ Стадію змінено'); listLeads().then(setLeads);
  };
  const removeLead = async (id: string) => {
    if (!window.confirm('Видалити цю заявку назавжди? Дію не можна скасувати.')) return;
    setBusy('del:' + id);
    const res = await deleteLead(id);
    setBusy('');
    if (!res.ok) { toast('Не вдалося видалити: ' + (res.error || ''), 'err'); return; }
    toast('✓ Заявку видалено'); setLeads((ls) => (ls || []).filter((l) => l.id !== id));
    setOpenLead(null);
  };
  // Масові дії над заявками (мультивибір).
  const toggleSel = (id: string) => setSelLeads((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const clearSel = () => setSelLeads(new Set());
  const bulkStatus = async (status: LeadStatus) => {
    const ids = [...selLeads]; setBusy('bulk');
    const res = await Promise.all(ids.map((id) => setLeadStatus(id, status)));
    setBusy(''); clearSel();
    const ok = res.filter((r) => r.ok).length;
    toast(ok === ids.length ? `✓ Стадію змінено для ${ok}` : `Оновлено ${ok}/${ids.length} (перевірте RLS)`, ok === ids.length ? 'ok' : 'err');
    listLeads().then(setLeads);
  };
  const bulkDelete = async () => {
    const ids = [...selLeads];
    if (!window.confirm(`Видалити ${ids.length} заявок назавжди? Дію не можна скасувати.`)) return;
    setBusy('bulk');
    const res = await Promise.all(ids.map((id) => deleteLead(id)));
    setBusy(''); clearSel();
    const ok = res.filter((r) => r.ok).length;
    toast(ok === ids.length ? `✓ Видалено ${ok}` : `Видалено ${ok}/${ids.length}`, ok === ids.length ? 'ok' : 'err');
    setLeads((ls) => (ls || []).filter((l) => !ids.includes(l.id || '')));
  };
  const removeUser = async (userId: string, email: string) => {
    if (!window.confirm(`Видалити клієнта ${email} та всі його дані (профіль, експрес/глибокий аудит, воронку, проекти)? Обліковий запис входу лишиться в Supabase Auth, але з панелі зникне. Дію не можна скасувати.`)) return;
    setBusy('del:' + userId);
    const res = await deleteDiagnostics(userId);
    setBusy('');
    if (!res.ok) { toast('Не вдалося видалити: ' + (res.error || ''), 'err'); return; }
    toast('✓ Клієнта видалено'); setRows((rs) => (rs || []).filter((x) => x.userId !== userId));
    setOpenUser(null);
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
  const exportLeadsCsv = (list: LeadRow[]) => {
    const head = ['at', 'source', 'status', 'name', 'email', 'phone', 'task', 'comment'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [head.join(',')].concat(list.map((l) => [l.at || '', l.source || '', l.status || '', l.name || '', l.email || '', l.phone || '', l.task || '', l.comment || ''].map(esc).join(',')));
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'weexp-leads.csv'; a.click(); URL.revokeObjectURL(a.href);
    toast('✓ CSV завантажено');
  };
  const detail = openUser ? (rows || []).find((r) => r.userId === openUser) : null;

  return (
    <div className={'sysx adm' + theme.cls}>
      <aside className="adm-side">
        <Link to="/" className="adm-brand"><b>WEEXP</b><span className="mono">admin</span></Link>
        <nav className="adm-nav">
          {TABS.map((tb) => (
            <button key={tb.id} className={`adm-nav-i${tab === tb.id ? ' on' : ''}`} onClick={() => { setTab(tb.id); setOpenUser(null); }}>{tb.label}</button>
          ))}
        </nav>
        <div className="adm-foot mono">
          <span title={user.email}>{user.email}</span>
          <div className="cab-side-foot-row">
            <button onClick={load} className="adm-refresh">↻ оновити</button>
            <ThemeToggle dark={theme.dark} onToggle={theme.toggle} />
          </div>
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
                        <span className={`cab-badge mono tst-${ST[d.s]?.cls ?? 'muted'}`}>{ST[d.s]?.txt ?? d.s}</span>
                        <span className="adm-dist-n mono">{d.n}</span>
                      </div>
                    ))}
                    {analytics.statusDist.every((d) => d.n === 0) && <p className="mono adm-empty">запитів ще немає</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="adm-panel">
              <span className="adm-col-h mono">Джерела заявок · {period === 0 ? 'усі' : `${period} днів`}</span>
              {analytics.leadSources.length === 0 ? <p className="mono adm-empty">заявок за період немає</p> : (
                <div className="adm-dist">
                  {analytics.leadSources.map((d) => {
                    const max = analytics.leadSources[0].n || 1;
                    return (
                      <div key={d.k} className="adm-fn-row">
                        <span className="adm-fn-l" title={d.k}>{d.k}</span>
                        <div className="adm-fn-bar"><span className="adm-fn-fill" style={{ width: `${Math.max(Math.round((d.n / max) * 100), 3)}%` }} /></div>
                        <span className="adm-fn-n mono">{d.n}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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
        {tab === 'users' && (() => {
          const isAdm = (email: string) => MANAGER_EMAILS.map((e) => e.toLowerCase()).includes((email || '').toLowerCase());
          const nAdmins = sorted.filter((r) => isAdm(r.email)).length;
          const nClients = sorted.length - nAdmins;
          const segRows = sorted.filter((r) => userSeg === 'all' ? true : userSeg === 'admins' ? isAdm(r.email) : !isAdm(r.email));
          const emptyText = q ? 'Нічого не знайдено за запитом.' : userSeg === 'admins' ? 'Адміністраторів немає.' : 'Зареєстрованих користувачів поки немає.';
          return (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Користувачі</h1>
              <div className="adm-head-r">
                <input className="mc-search" placeholder="Пошук: email / компанія" value={q} onChange={(e) => setQ(e.target.value)} />
                <button className="sysx-cta" onClick={exportUsersCsv} disabled={sorted.length === 0}>↓ CSV</button>
              </div>
            </div>
            <div className="adm-seg mono" role="tablist">
              <button role="tab" className={userSeg === 'clients' ? 'on' : ''} onClick={() => setUserSeg('clients')}>Зареєстровані <b>{nClients}</b></button>
              <button role="tab" className={userSeg === 'admins' ? 'on' : ''} onClick={() => setUserSeg('admins')}>Адміністратори <b>{nAdmins}</b></button>
              <button role="tab" className={userSeg === 'all' ? 'on' : ''} onClick={() => setUserSeg('all')}>Всі <b>{sorted.length}</b></button>
            </div>
            {rows === null ? <p className="mc-msg mono">Завантаження…</p> : segRows.length === 0 ? <EmptyState icon="👥" text={emptyText} /> : (
              <div className="adm-table adm-tr-users">
                <div className="adm-tr adm-th adm-tr-users">
                  <button className="adm-sort" onClick={() => toggleSort('email')}>Email{sortMark('email')}</button>
                  <button className="adm-sort" onClick={() => toggleSort('company')}>Компанія{sortMark('company')}</button>
                  <span>Аудити</span>
                  <button className="adm-sort" onClick={() => toggleSort('tiers')}>T1–T4{sortMark('tiers')}</button>
                  <button className="adm-sort" onClick={() => toggleSort('updated')}>Активність{sortMark('updated')}</button>
                  <span></span>
                </div>
                {segRows.map((r) => (
                  <div key={r.userId} className="adm-tr adm-tr-users">
                    <a className="adm-c-email adm-mail" href={`mailto:${r.email}`} title="Написати">{isAdm(r.email) && <span className="adm-role-tag mono" title="Адміністратор">ADM</span>}{r.email}</a>
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
          );
        })()}

        {/* ── Аудити: єдина клієнтська воронка ── */}
        {tab === 'audits' && (() => {
          const base = (rows || []).filter((r) => !q || r.email.toLowerCase().includes(q.toLowerCase()) || (r.company || '').toLowerCase().includes(q.toLowerCase()));
          const withStage = base.map((r) => ({ r, stage: funnelStage(r) }));
          const counts = FUNNEL.reduce((m, s) => { m[s.k] = withStage.filter((x) => x.stage === s.k).length; return m; }, {} as Record<FunnelStage, number>);
          const shown = auditFilter === 'all' ? withStage : withStage.filter((x) => x.stage === auditFilter);
          return (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Аудити</h1>
              <input className="mc-search" placeholder="Пошук: email / компанія" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <p className="adm-hint mono">Єдина воронка: Лід → Користувач → Експрес → Запит на глибокий → Доступ → Аудит → Проект. Клацніть клієнта — доступи, дані й проект керуються в його картці.</p>
            <div className="adm-seg mono" role="tablist">
              <button role="tab" className={auditFilter === 'all' ? 'on' : ''} onClick={() => setAuditFilter('all')}>Всі <b>{withStage.length}</b></button>
              {FUNNEL.map((s) => (
                <button key={s.k} role="tab" className={auditFilter === s.k ? 'on' : ''} onClick={() => setAuditFilter(s.k)}>{s.l} <b>{counts[s.k]}</b></button>
              ))}
            </div>
            {rows === null ? <p className="mc-msg mono">Завантаження…</p> : shown.length === 0 ? <EmptyState icon="📊" text={auditFilter === 'all' ? 'Аудитів поки немає.' : 'На цій стадії немає клієнтів.'} /> : (
              <div className="adm-table adm-tr-funnel">
                <div className="adm-tr adm-th adm-tr-funnel"><span>Email / компанія</span><span>Стадія</span><span>Витік/рік</span><span>Доступ</span><span></span></div>
                {shown.map(({ r, stage }) => {
                  const money = r.record?.stage1Money;
                  const st = FUNNEL.find((x) => x.k === stage)!;
                  return (
                    <div key={r.userId} className="adm-tr adm-tr-funnel">
                      <span className="adm-c-email"><b>{r.email}</b>{r.company && <i className="mono adm-c-co"> · {r.company}</i>}</span>
                      <span><span className={`cab-badge mono tst-${st.cls}`}>{st.l}</span></span>
                      <span className="mono">{money ? `${eur(money[0])}–${eur(money[1])}` : r.record?.express ? eur(r.record.express.total) : '—'}</span>
                      <span className="mono">{r.funnel?.accessCode ? '🔑 видано' : '—'}</span>
                      <button className="adm-open" onClick={() => setOpenUser(r.userId)}>Картка →</button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          );
        })()}

        {/* ── Конструктор шаблону аудиту ── */}
        {tab === 'template' && <AuditBuilder />}

        {/* ── Запити доступів (глибокий аудит) ── */}
        {tab === 'access' && (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Запити доступів</h1>
              <input className="mc-search" placeholder="Пошук: email / компанія" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <p className="adm-hint mono">Запити на глибокий аудит від клієнтів. Надаєте доступ — клієнту генерується код і відкривається робочий розділ. (T1–T4 = внутрішня методологія.)</p>
            {rows === null ? <p className="mc-msg mono">Завантаження…</p> : (
              <div className="mc-list">
                {filtered.filter((r) => Object.keys(r.funnel?.tierStatus || {}).length > 0).map((r) => (
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
                      <p className="adm-code-hint mono">Код доступу зʼявиться тут після «Надати».</p>
                    )}
                    <div className="mc-tiers">
                      {Object.keys(r.funnel?.tierStatus || {}).map((tid) => {
                        const cur = (r.funnel?.tierStatus?.[tid] || 'none') as TierStatus | 'none';
                        const files = r.funnel?.tierFiles?.[tid] || [];
                        const b = `${r.userId}:${tid}`;
                        return (
                          <div key={tid} className="mc-tier">
                            <div className="mc-tier-l"><b className="mc-tid">{tierLabel(tid)}</b><span className={`cab-badge mono tst-${ST[cur]?.cls ?? 'muted'}`}>{ST[cur]?.txt ?? cur}</span>
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
                {filtered.filter((r) => Object.keys(r.funnel?.tierStatus || {}).length > 0).length === 0 && <EmptyState icon="🔐" text="Запитів доступу поки немає." />}
              </div>
            )}
          </section>
        )}

        {/* ── Заявки · міні-CRM ── */}
        {tab === 'leads' && (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Первинна комунікація</h1>
              {(leads || []).some((l) => !ACCESS_SOURCES.includes(l.source || '')) && (
                <button className="sysx-cta" onClick={() => exportLeadsCsv((leads || []).filter((l) => !ACCESS_SOURCES.includes(l.source || '')))}>↓ CSV</button>
              )}
            </div>
            <p className="adm-hint mono">Заявки від нових/потенційних клієнтів. Запити доступів існуючих клієнтів — у вкладці «Запити доступів».</p>
            {(() => { const comm = (leads || []).filter((l) => !ACCESS_SOURCES.includes(l.source || '')); return (
              leads === null ? <p className="mc-msg mono">Завантаження…</p>
              : comm.length === 0 ? <EmptyState icon="✉" text="Первинних заявок ще немає. Вони зʼявляться тут автоматично з форм сайту (і дублюються на пошту)." />
              : (() => {
                const count = (k: LeadStatus) => comm.filter((l) => stageOf(l) === k).length;
                const won = count('won'), total = comm.length, lost = count('lost');
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

                    {/* Масові дії */}
                    {selLeads.size > 0 && (
                      <div className="adm-bulk">
                        <span className="mono">Обрано {selLeads.size}</span>
                        <span className="adm-bulk-lbl mono">→ стадія:</span>
                        {LEAD_STAGES.map((s) => <button key={s.k} className={`mc-btn sm tst-${s.cls}`} disabled={busy === 'bulk'} onClick={() => bulkStatus(s.k)}>{s.l}</button>)}
                        <button className="mc-btn sm bad" disabled={busy === 'bulk'} onClick={bulkDelete}>Видалити</button>
                        <button className="mc-btn sm ghost" onClick={clearSel}>Скинути</button>
                      </div>
                    )}

                    {/* Пайплайн-дошка */}
                    <div className="adm-board">
                      {LEAD_STAGES.map((s) => {
                        const col = comm.filter((l) => stageOf(l) === s.k);
                        return (
                          <div key={s.k} className="adm-col">
                            <div className="adm-col-head"><span className={`cab-badge mono tst-${s.cls}`}>{s.l}</span><span className="adm-col-n mono">{col.length}</span></div>
                            <div className="adm-col-body">
                              {col.map((l) => (
                                <div key={l.id} className={`adm-lead-card${selLeads.has(l.id || '') ? ' sel' : ''}`}>
                                  <input type="checkbox" className="adm-lead-chk" checked={selLeads.has(l.id || '')} onChange={() => toggleSel(l.id || '')} title="Обрати" onClick={(e) => e.stopPropagation()} />
                                  <button className="adm-lead-open" onClick={() => setOpenLead(l.id || '')}>
                                    <b>{l.name || l.email || l.phone || 'Заявка'}</b>
                                    <span className="mono adm-lead-sub">{l.task || l.comment || l.source || '—'}</span>
                                    <span className="mono adm-lead-at">{rel(l.at)}{l.source ? ` · ${l.source}` : ''}</span>
                                  </button>
                                </div>
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
              })()
            ); })()}
          </section>
        )}

        {/* ── Проект-офіс: довідник команди та ставок ── */}
        {tab === 'pm' && <PmOffice />}

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
      {detail && <UserDetail row={detail} leads={leads} onClose={() => setOpenUser(null)} openFile={openFile} onStatus={setStatus} onDelete={removeUser} busy={busy} />}
      {/* Панель деталей заявки */}
      {openLead && leads && <LeadDetail lead={leads.find((l) => l.id === openLead)} allRows={rows || []} onClose={() => setOpenLead(null)} onStatus={moveLead} onDelete={removeLead} busy={busy} onOpenClient={(uid) => { setOpenLead(null); setTab('users'); setOpenUser(uid); }} />}

      {/* Модалка причини (замість browser prompt) */}
      {ask && (
        <div className="adm-modal-wrap" onClick={() => setAsk(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <b className="adm-modal-h">{ask.status === 'rejected' ? `Відхилити: ${tierLabel(ask.tier)}` : `${tierLabel(ask.tier)}: запит даних`}</b>
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

function LeadDetail({ lead, allRows, onClose, onStatus, onOpenClient, onDelete, busy }: { lead?: LeadRow; allRows: AdminRow[]; onClose: () => void; onStatus: (id: string, s: LeadStatus) => void; onOpenClient: (userId: string) => void; onDelete: (id: string) => void; busy: string }) {
  if (!lead) return null;
  const cur = lead.status || 'new';
  // Звʼязок «заявка → клієнт»: шукаємо зареєстрований акаунт за email заявки.
  const client = lead.email ? allRows.find((r) => (r.email || '').toLowerCase() === lead.email!.toLowerCase()) : undefined;
  const ex = client?.record?.express;
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
          <button className="adm-x" onClick={onClose} aria-label="Закрити" title="Закрити">✕</button>
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

          {client ? (
            <Block title="Профіль клієнта">
              {ex ? (
                <div className="adm-lead-client">
                  <div className="adm-lead-ex">
                    <b className="adm-money">{eur(ex.total)}<i> / рік</i></b>
                    <span className="mono adm-express-sub">{sysLabel(ex.primary as SysKey, 'uk')} · Health {ex.overallHealth}/100 · {new Date(ex.at).toLocaleDateString('uk-UA')}</span>
                  </div>
                  {ex.symptoms && ex.symptoms.length > 0 && <div className="adm-sym-tags">{ex.symptoms.slice(0, 6).map((s) => <span key={s} className="adm-sym">{sysLabel(s as SysKey, 'uk')}</span>)}</div>}
                  <button className="mc-btn ok" onClick={() => onOpenClient(client.userId)}>Відкрити повну картку клієнта →</button>
                </div>
              ) : (
                <div className="adm-lead-client">
                  <p className="mono adm-empty">Клієнт зареєстрований, але експрес-аудит ще не привʼязаний.</p>
                  <button className="mc-btn" onClick={() => onOpenClient(client.userId)}>Відкрити картку клієнта →</button>
                </div>
              )}
            </Block>
          ) : (
            <Block title="Профіль клієнта"><p className="mono adm-empty">Немає зареєстрованого акаунту з цим email (клієнт не заводив кабінет).</p></Block>
          )}

          {lead.diag && <Block title="Результат діагностики (X-Ray)"><pre className="adm-pre">{lead.diag}</pre></Block>}
          {lead.calc && <Block title="Розрахунок калькулятора"><pre className="adm-pre">{lead.calc}</pre></Block>}

          <div className="adm-danger">
            <button className="mc-btn bad" disabled={busy === 'del:' + lead.id} onClick={() => lead.id && onDelete(lead.id)}>
              {busy === 'del:' + lead.id ? 'Видаляємо…' : 'Видалити заявку'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Tile({ n, l, accent }: { n: number; l: string; accent?: boolean }) {
  return <div className={`adm-tile${accent ? ' accent' : ''}`}><b className="adm-tile-n">{n}</b><span className="adm-tile-l">{l}</span></div>;
}

const fmtVal = (v: unknown): string => {
  if (v == null || v === '') return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') { const o = v as { name?: string }; return o.name ? `📎 ${o.name}` : JSON.stringify(v); }
  return String(v);
};
const relT = (iso?: string) => {
  if (!iso) return ''; const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'щойно'; if (s < 3600) return `${Math.floor(s / 60)} хв`; if (s < 86400) return `${Math.floor(s / 3600)} год`;
  try { return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' }); } catch { return ''; }
};

/** Realtime-подача заповнення спільного аудиту (адмінка): що заповнено + автор. */
function AuditFill({ code }: { code: string }) {
  const [tpl, setTpl] = useState<AuditTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, AuditAnswer>>({});
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    (async () => {
      const t = await loadTemplate();
      const id = await findAuditIdByCode(code);
      const a = id ? await loadAuditAnswers(id) : {};
      setTpl(t); setAnswers(a); setLoading(false);
    })();
  };
  useEffect(load, [code]);
  const stat = useMemo(() => {
    let total = 0, done = 0; const authors = new Set<string>();
    (tpl?.blocks || []).forEach((b) => b.questions.forEach((q) => { total++; const a = answers[q.key]; if (a && a.value != null && a.value !== '') { done++; if (a.by) authors.add(a.by); } }));
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0, authors: [...authors] };
  }, [tpl, answers]);

  return (
    <div className="adm-fill">
      <div className="adm-fill-head">
        <span className="mono adm-fill-p">{stat.done}/{stat.total} · {stat.pct}%</span>
        {stat.authors.length > 0 && <span className="mono adm-fill-au">автори: {stat.authors.join(', ')}</span>}
        <button className="mc-btn ghost adm-fill-rf" onClick={load}>↻</button>
      </div>
      {loading ? <p className="mono adm-empty">Завантаження…</p> : !tpl ? <p className="mono adm-empty">—</p> : (
        <div className="adm-fill-blocks">
          {tpl.blocks.map((b) => (
            <div key={b.key} className="adm-fill-block">
              <b className="adm-fill-bt">{b.title}</b>
              {b.questions.map((q: Question) => {
                const a = answers[q.key];
                const filled = a && a.value != null && a.value !== '';
                return (
                  <div key={q.key} className={`adm-fill-q${filled ? ' on' : ''}`}>
                    <span className="adm-fill-ql">{q.label}</span>
                    {filled ? <span className="adm-fill-qv">{fmtVal(a!.value)}<i className="mono"> — {a!.by} · {relT(a!.at)}</i></span> : <span className="mono adm-fill-qe">—</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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

/** Брендоване PDF-досьє клієнта — самодостатня друкована сторінка (нова вкладка → друк/зберегти в PDF). */
function openClientDossier(row: AdminRow) {
  const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rec = row.record || {};
  const c = rec.company || {};
  const ex = rec.express;
  const tiers = Object.entries(row.funnel?.tierStatus || {});
  const code = row.funnel?.accessCode;
  const now = new Date().toLocaleString('uk-UA');
  const kv = (rows: [string, unknown][]) => rows.filter(([, v]) => v != null && v !== '').map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const companyRows: [string, unknown][] = [
    ['Назва', c.name], ['Сфера', c.industry], ['Тип', c.bizType], ['Напрям', c.model],
    ['Категорії', c.categories], ['Ніша', c.niche], ['Ринки', c.markets], ['Країни', c.countries],
    ['Оборот (діапазон)', c.sizeRange], ['Виторг €/міс', c.revenue], ['Команда', c.teamSize],
    ['Точки продажу', c.outlets], ['Канали продажів', (c.channels || []).join(', ')],
    ['Канали залучення', (c.acqChannels || []).join(', ')], ['Сайт', c.site], ['Платформа', c.platform],
    ['CRM / ERP', c.crmErp], ['Контакт', c.contactName ? `${c.contactName} ${c.contactPhone || ''}` : ''], ['Коментар', c.notes],
  ];
  const inp = ex?.input || {};
  const exRows: [string, unknown][] = ex ? [
    ['Пройдено', new Date(ex.at).toLocaleString('uk-UA')],
    ['Витік / рік', eur(ex.total)], ['Діапазон', `${eur(ex.range[0])}–${eur(ex.range[1])}`],
    ['Business Health', `${ex.overallHealth}/100`],
    ['Ключова проблема', sysLabel(ex.primary as SysKey, 'uk')],
    ['Друга проблема', ex.secondary ? sysLabel(ex.secondary as SysKey, 'uk') : ''],
    ['Оборот / міс', inp.monthlyRevenue ? eur(inp.monthlyRevenue) : ''],
    ['Середній чек', inp.aov ? eur(inp.aov) : ''],
    ['Конверсія', inp.conversion != null ? `${inp.conversion}%` : ''],
    ['Повторні покупки', inp.repeatRate != null ? `${inp.repeatRate}%` : ''],
    ['Валова маржа', inp.grossMargin != null ? `${inp.grossMargin}%` : ''],
    ['CAC', inp.cac ? eur(inp.cac) : ''], ['Джерело', ex.source],
  ] : [];
  const tierRows = tiers.map(([tid, st]) => `<tr><td class="k">${esc(tid)}</td><td>${esc(ST[st as TierStatus]?.txt || st)}</td></tr>`).join('');
  const html = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Досьє — ${esc(row.email)}</title><style>
@page{margin:16mm}*{box-sizing:border-box}body{font-family:"IBM Plex Sans","Segoe UI",system-ui,Arial,sans-serif;color:#141210;margin:0;font-size:13px;line-height:1.5}
.bar{height:8px;background:#F5301C}.wrap{padding:26px 30px}
.top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #141210;padding-bottom:12px;margin-bottom:18px}
.logo{font-weight:800;font-size:22px}.logo span{color:#F5301C}.meta{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#6B675E;text-align:right}
h1{font-size:18px;margin:2px 0 2px}.sub{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6B675E}
h2{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#F5301C;margin:22px 0 8px;border-bottom:1px solid #E3D9C0;padding-bottom:4px}
table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #EEE7D6;padding:6px 8px;vertical-align:top}td.k{width:210px;color:#6B675E;font-weight:600}
.money{font-size:26px;font-weight:800;margin:4px 0}.money i{font-size:13px;color:#6B675E;font-weight:500;font-style:normal}
.empty{color:#9a9488;font-style:italic}.code{font-family:"IBM Plex Mono",monospace;font-weight:700;background:#FFF6C2;padding:3px 8px;border:1px solid #E3D9C0}
.foot{margin-top:26px;padding-top:12px;border-top:1px solid #E3D9C0;color:#9a9488;font-size:10.5px}
@media print{.noprint{display:none}}
</style></head><body><div class="bar"></div><div class="wrap">
<div class="top"><div><div class="logo">WEEXP<span>.</span></div><div class="sub">Досьє клієнта · конфіденційно</div></div>
<div class="meta">${esc(row.email)}<br>сформовано ${esc(now)}${code ? `<br>код: <span class="code">${esc(code)}</span>` : ''}</div></div>
<button class="noprint" onclick="window.print()" style="margin-bottom:14px;background:#F5301C;color:#fff;border:0;border-radius:6px;padding:9px 16px;font:inherit;font-weight:600;cursor:pointer">🖨 Друк / зберегти в PDF</button>
<h2>Профіль компанії</h2>${companyRows.some(([, v]) => v) ? `<table>${kv(companyRows)}</table>` : '<p class="empty">Профіль не заповнено.</p>'}
<h2>Експрес-аудит</h2>${ex ? `<p class="money">${esc(eur(ex.total))} <i>/ рік · витік</i></p><table>${kv(exRows)}</table>` : '<p class="empty">Експрес-аудит не проходив.</p>'}
<h2>Статуси доступів T1–T4</h2>${tierRows ? `<table>${tierRows}</table>` : '<p class="empty">Запитів не було.</p>'}
<div class="foot">WEEXP — Commerce OS · weexp.agency · hello@weexp.agency · Документ містить конфіденційні дані клієнта. Не для розповсюдження.</div>
</div></body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
  else toast('Дозвольте спливаючі вікна, щоб відкрити досьє', 'err');
}

function UserDetail({ row, leads, onClose, openFile, onStatus, onDelete, busy }: { row: AdminRow; leads: LeadRow[] | null; onClose: () => void; openFile: (p: string) => void; onStatus: (userId: string, tier: string, status: TierStatus) => void; onDelete: (userId: string, email: string) => void; busy: string }) {
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
          <div className="adm-drawer-head-id">
            <a className="adm-email adm-mail" href={`mailto:${row.email}`}>{row.email}</a>
            {(() => { const st = FUNNEL.find((x) => x.k === funnelStage(row))!; return <span className={`cab-badge mono tst-${st.cls} adm-drawer-stage`}>{st.l}</span>; })()}
          </div>
          <div className="adm-drawer-head-act">
            <button className="mc-btn" onClick={() => openClientDossier(row)} title="Сформувати PDF-досьє клієнта">📄 Досьє PDF</button>
            <button className="adm-x" onClick={onClose} aria-label="Закрити" title="Закрити">✕</button>
          </div>
        </div>
        <div className="adm-drawer-body">
          {code && (
            <Block title="Код доступу">
              <button className="adm-code adm-code-lg" onClick={() => navigator.clipboard?.writeText(code)} title="Скопіювати">🔑 {code}</button>
              <span className="mono adm-empty">клієнт вводить його у «Глибокому аудиті»</span>
            </Block>
          )}
          <Block title="Компанія">{(company?.name || company?.industry) ? (
            <ul className="adm-kv">
              {company.name && <li><i>Назва</i><span>{company.name}</span></li>}
              {company.industry && <li><i>Сфера</i><span>{company.industry}</span></li>}
              {company.bizType && <li><i>Тип</i><span>{company.bizType}</span></li>}
              {company.model && <li><i>Напрям</i><span>{company.model}</span></li>}
              {company.categories && <li><i>Категорії</i><span>{company.categories}</span></li>}
              {company.niche && <li><i>Ніша</i><span>{company.niche}</span></li>}
              {company.markets && <li><i>Ринки</i><span>{company.markets}</span></li>}
              {company.countries && <li><i>Країни</i><span>{company.countries}</span></li>}
              {company.sizeRange && <li><i>Оборот (діапазон)</i><span>{company.sizeRange}</span></li>}
              {company.revenue && <li><i>Виторг €/міс</i><span>{company.revenue}</span></li>}
              {company.teamSize && <li><i>Команда</i><span>{company.teamSize}</span></li>}
              {company.outlets && <li><i>Точки продажу</i><span>{company.outlets}</span></li>}
              {(company.channels?.length ?? 0) > 0 && <li><i>Канали продажів</i><span>{company.channels!.join(', ')}</span></li>}
              {(company.acqChannels?.length ?? 0) > 0 && <li><i>Канали залучення</i><span>{company.acqChannels!.join(', ')}</span></li>}
              {company.site && <li><i>Сайт</i><span>{company.site}</span></li>}
              {company.domains && <li><i>Домени</i><span>{company.domains}</span></li>}
              {company.platform && <li><i>Платформа</i><span>{company.platform}</span></li>}
              {company.crmErp && <li><i>CRM / ERP</i><span>{company.crmErp}</span></li>}
              {company.contactName && <li><i>Контакт</i><span>{company.contactName} {company.contactPhone || ''}</span></li>}
              {company.notes && <li><i>Коментар</i><span>{company.notes}</span></li>}
            </ul>
          ) : <p className="mono adm-empty">профіль не заповнено</p>}</Block>

          <Block title="Експрес-аудит">{(() => {
            const ex = rec.express;
            if (ex) {
              const inp = ex.input || {};
              const rows: { l: string; v: string }[] = [
                { l: 'Оборот / міс', v: inp.monthlyRevenue ? eur(inp.monthlyRevenue) : '—' },
                { l: 'Середній чек', v: inp.aov ? eur(inp.aov) : '—' },
                { l: 'Конверсія', v: inp.conversion != null ? `${inp.conversion}%` : '—' },
                { l: 'Повторні покупки', v: inp.repeatRate != null ? `${inp.repeatRate}%` : '—' },
                { l: 'Повернення+скасув.', v: inp.returnsRate != null ? `${inp.returnsRate}%` : '—' },
                { l: 'Валова маржа', v: inp.grossMargin != null ? `${inp.grossMargin}%` : '—' },
                { l: 'CAC', v: inp.cac ? eur(inp.cac) : '—' },
              ];
              return (
                <div className="adm-express">
                  <p className="adm-money">{eur(ex.total)} <i>/ рік</i> <span className="mono adm-express-sub">діапазон {eur(ex.range[0])}–{eur(ex.range[1])} · Health {ex.overallHealth}/100</span></p>
                  <ul className="adm-kv">
                    <li><i>Пройдено</i><span className="mono">{new Date(ex.at).toLocaleString('uk-UA')}</span></li>
                    <li><i>Ключова проблема</i><span>{sysLabel(ex.primary as SysKey, 'uk')}</span></li>
                    {ex.secondary && <li><i>Друга проблема</i><span>{sysLabel(ex.secondary as SysKey, 'uk')}</span></li>}
                    <li><i>Клієнт</i><span className="mono">{row.email}</span></li>
                    {ex.source && <li><i>Джерело</i><span className="mono">{ex.source}</span></li>}
                  </ul>

                  {ex.input && (
                    <div className="adm-express-sec">
                      <span className="mono adm-empty">Вхідні дані клієнта:</span>
                      <div className="adm-inp-grid">{rows.map((r) => <div key={r.l} className="adm-inp-cell"><i>{r.l}</i><b>{r.v}</b></div>)}</div>
                    </div>
                  )}

                  {ex.symptoms && ex.symptoms.length > 0 && (
                    <div className="adm-express-sec">
                      <span className="mono adm-empty">Обрані симптоми:</span>
                      <div className="adm-sym-tags">{ex.symptoms.map((s) => <span key={s} className="adm-sym">{sysLabel(s as SysKey, 'uk')}</span>)}</div>
                    </div>
                  )}

                  {ex.health && ex.health.length > 0 && (
                    <div className="adm-express-sec">
                      <span className="mono adm-empty">Здоровʼя систем:</span>
                      <div className="adm-hp">{ex.health.map((h) => (
                        <div key={h.key} className="adm-hp-row"><span className="adm-hp-l">{sysLabel(h.key as SysKey, 'uk')}</span><span className="adm-hp-bar"><i style={{ width: `${h.score}%`, background: h.score >= 65 ? 'var(--ok)' : h.score >= 40 ? 'var(--warn)' : 'var(--red)' }} /></span><b className="mono">{h.score}</b></div>
                      ))}</div>
                    </div>
                  )}

                  {ex.leaks && ex.leaks.length > 0 && (
                    <div className="adm-express-sec">
                      <span className="mono adm-empty">Джерела витоку:</span>
                      <ul className="adm-leaks">{ex.leaks.slice(0, 5).map((l) => <li key={l.key}><span>{sysLabel(l.key as SysKey, 'uk')}</span><b className="mono">{eur(l.amount)}/рік</b></li>)}</ul>
                    </div>
                  )}

                  {ex.actions && ex.actions.length > 0 && (
                    <div className="adm-express-sec">
                      <span className="mono adm-empty">Рекомендації:</span>
                      <ol className="adm-recs">{ex.actions.slice(0, 5).map((a) => <li key={a}>{actionText(a as SysKey, 'uk')}</li>)}</ol>
                    </div>
                  )}
                </div>
              );
            }
            if (money) return <p className="adm-money">{eur(money[0])} – {eur(money[1])} <i>/ рік</i></p>;
            return <p className="mono adm-empty">{row.hasExpress ? 'є' : 'не рахували'}</p>;
          })()}</Block>

          <Block title="Глибокий аудит">{row.hasDeep ? <p className="mono">у роботі</p> : <p className="mono adm-empty">не почато</p>}</Block>

          <Block title="Запити доступів">{tiers.length ? (
            <div className="adm-drawer-tiers">
              {tiers.map(([tid, s]) => {
                const b = `${row.userId}:${tid}`;
                return (
                  <div key={tid} className="adm-dtier">
                    <div className="adm-dtier-l"><b className="mc-tid">{tierLabel(tid)}</b><span className={`cab-badge mono tst-${ST[s]?.cls ?? 'muted'}`}>{ST[s]?.txt ?? s}</span></div>
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

          {code && (
            <Block title="Заповнення аудиту"><AuditFill code={code} /></Block>
          )}
          {code && (
            <Block title="Уточнення (Крок 2)"><ExtraEditor code={code} /></Block>
          )}

          <Block title="Мій проект (ведення)"><ProjectsManager userId={row.userId} initial={getProjects(rec)} code={code} company={company?.name} /></Block>

          {files.length > 0 && (
            <Block title="Файли">
              <ul className="adm-files">{files.flatMap(([tid, arr]) => arr.map((f, i) => (
                <li key={tid + i}><button className="mono adm-file" onClick={() => openFile(f.path)}>📎 {tid}: {f.name}</button></li>
              )))}</ul>
            </Block>
          )}

          <Block title="Заявки клієнта">{(() => {
            const mine = (leads || []).filter((l) => !ACCESS_SOURCES.includes(l.source || '') && (l.email || '').toLowerCase() === row.email.toLowerCase());
            if (!mine.length) return <p className="mono adm-empty">заявок від цього email немає</p>;
            return <ul className="adm-kv">{mine.map((l) => (
              <li key={l.id}><i>{rel(l.at)}{l.source ? ` · ${l.source}` : ''}</i><span>{l.task || l.comment || '—'}{l.status ? ` · ${LEAD_STAGES.find((s) => s.k === (l.status as LeadStatus))?.l || l.status}` : ''}</span></li>
            ))}</ul>;
          })()}</Block>

          <Block title="Історія активності">{(() => {
            const ev: { at: string; t: string }[] = [];
            if (row.record?.express?.at) ev.push({ at: row.record.express.at, t: `Пройдено експрес-аудит · ${eur(row.record.express.total)}/рік` });
            Object.entries(row.funnel?.tierHistory || {}).forEach(([tid, list]) => (list || []).forEach((e) => ev.push({ at: e.at, t: `${tierLabel(tid)} → ${ST[e.st]?.txt ?? e.st}${e.by === 'manager' ? ' · менеджер' : ''}` })));
            if (row.funnel?.leadAt) ev.push({ at: row.funnel.leadAt, t: 'Заявка на співпрацю з кабінету' });
            if (row.updatedAt) ev.push({ at: row.updatedAt, t: 'Оновлення профілю' });
            ev.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
            if (!ev.length) return <p className="mono adm-empty">подій ще немає</p>;
            return <ul className="adm-activity">{ev.slice(0, 20).map((e, i) => (
              <li key={i}><span className="adm-act-dot" /><span className="adm-act-t">{e.t}</span><span className="mono adm-act-at">{rel(e.at)}</span></li>
            ))}</ul>;
          })()}</Block>

          <div className="adm-danger">
            <span className="mono adm-empty">Небезпечна зона — прибирання тестових даних:</span>
            <button className="mc-btn bad" disabled={busy === 'del:' + row.userId} onClick={() => onDelete(row.userId, row.email)}>
              {busy === 'del:' + row.userId ? 'Видаляємо…' : 'Видалити клієнта та всі його дані'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

/** Редактор персональних уточнень (Крок 2) для клієнта — менеджер додає ad-hoc питання. */
function ExtraEditor({ code }: { code: string }) {
  const [list, setList] = useState<ExtraQ[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { loadAuditExtra(code).then(setList); }, [code]);
  if (list === null) return <p className="mono adm-empty">Завантаження…</p>;
  const add = () => setList([...list, { key: uid('x'), label: '', type: 'text' }]);
  const set = (i: number, k: keyof ExtraQ, v: unknown) => setList(list.map((q, j) => (j === i ? { ...q, [k]: v } : q)));
  const del = (i: number) => setList(list.filter((_, j) => j !== i));
  const save = async () => {
    setBusy(true); setMsg('');
    const r = await saveAuditExtra(code, list.filter((q) => q.label.trim()));
    setBusy(false);
    setMsg(r.ok ? '✓ Збережено — клієнт побачить у розділі «Крок 2».' : (r.error || 'Помилка'));
  };
  return (
    <div className="adm-extra">
      {list.length === 0 ? <p className="mono adm-empty">Немає уточнень. Додайте персональні питання/доступи для цього клієнта.</p> : list.map((q, i) => (
        <div key={q.key} className="adm-extra-q">
          <input className="ab-inp" value={q.label} onChange={(e) => set(i, 'label', e.target.value)} placeholder="Питання / що уточнити" />
          <select className="ab-sel" value={q.type} onChange={(e) => set(i, 'type', e.target.value)}>{Q_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}</select>
          <button className="mc-btn ghost" onClick={() => del(i)}>✕</button>
        </div>
      ))}
      <div className="adm-extra-act">
        <button className="mc-btn" onClick={add}>+ Питання</button>
        <button className="mc-btn ok" onClick={save} disabled={busy}>{busy ? 'Зберігаємо…' : 'Зберегти й надіслати'}</button>
      </div>
      {msg && <span className="mono adm-fill-au">{msg}</span>}
    </div>
  );
}

const PM_MONTHS = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
function gMonthLabel(startMonth: string | undefined, i: number): string {
  const m = /^(\d{4})-(\d{1,2})$/.exec(startMonth || '');
  if (!m) return `М${i + 1}`;
  const base = Number(m[1]) * 12 + (Number(m[2]) - 1) + i;
  return `${PM_MONTHS[base % 12]} ${String(Math.floor(base / 12)).slice(2)}`;
}

/** Проект-офіс: глобальний довідник команди та ставок (переиспользується в проектах). */
function PmOffice() {
  const [dir, setDir] = useState<PmDirectory | null>(null);
  const [msg, setMsg] = useState('');
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState('');
  const latest = useRef<PmDirectory | null>(dir); latest.current = dir;
  const dirtyRef = useRef(false);
  const loaded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { loadPmDirectory().then(setDir); }, []);
  const persist = (d: PmDirectory) => savePmDirectory({
    specialists: (d.specialists || []).filter((s) => s.name.trim() || s.role.trim()),
    roleRates: (d.roleRates || []).filter((s) => s.role.trim()),
    knowledge: d.knowledge || '', presets: d.presets || [],
  });
  const doSave = async () => {
    const d = latest.current; if (!d) return;
    setState('saving'); setMsg('');
    const r = await persist(d);
    if (r.ok) { dirtyRef.current = false; setState('saved'); setSavedAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })); }
    else { setState('error'); setMsg(r.error || 'Помилка збереження'); }
  };
  // Автозбереження довідника: дебаунс 1.2с; перший стан після завантаження не зберігаємо.
  useEffect(() => {
    if (!dir) return;
    if (!loaded.current) { loaded.current = true; return; }
    dirtyRef.current = true; setState('dirty');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void doSave(); }, 1200);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir]);
  useEffect(() => () => { if (dirtyRef.current && latest.current) void persist(latest.current); }, []);
  if (!dir) return <section className="adm-sec"><h1 className="sysx-display adm-h1">Проект-офіс</h1><p className="mono adm-empty">Завантаження…</p></section>;

  const specs = dir.specialists || [], roles = dir.roleRates || [];
  const num = (v: string) => (v === '' ? 0 : Number(v));
  const setSpec = (i: number, k: keyof PmSpecialist, v: unknown) => setDir({ ...dir, specialists: specs.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });
  const setRole = (i: number, k: keyof PmRoleRate, v: unknown) => setDir({ ...dir, roleRates: roles.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });
  const presets = dir.presets || [];
  const stateLabel = state === 'saving' ? '💾 Збереження…'
    : state === 'dirty' ? '● Є незбережені зміни'
    : state === 'saved' ? `✓ Збережено ${savedAt}`
    : state === 'error' ? `✕ ${msg}` : '';

  return (
    <section className="adm-sec">
      <h1 className="sysx-display adm-h1">Проект-офіс</h1>
      <p className="adm-hint mono">Довідник команди та ставок. Використовується при складанні тарифікації та бюджету проектів. Ставки — €/год, без ПДВ.</p>

      <div className="pm-grid">
        <div className="pj-card">
          <h2 className="pj-h2">Команда (спеціалісти)</h2>
          {specs.map((s, i) => (
            <div key={s.id} className="pj-ed-task">
              <input className="ab-inp gg" value={s.name} onChange={(e) => setSpec(i, 'name', e.target.value)} placeholder="Імʼя" />
              <input className="ab-inp xs" value={s.role} onChange={(e) => setSpec(i, 'role', e.target.value)} placeholder="Роль" />
              <label className="pj-ed-mini">€/год<input className="ab-inp xs" type="number" min={0} value={s.rate} onChange={(e) => setSpec(i, 'rate', num(e.target.value))} /></label>
              <button className="mc-btn ghost" onClick={() => setDir({ ...dir, specialists: specs.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          <button className="mc-btn" onClick={() => setDir({ ...dir, specialists: [...specs, { id: uid('sp'), name: '', role: '', rate: 0 }] })}>+ Спеціаліст</button>
        </div>

        <div className="pj-card">
          <h2 className="pj-h2">Ставки за ролями</h2>
          <p className="pj-sub mono">Дефолтна ставка ролі, якщо спеціаліст не вказаний.</p>
          {roles.map((s, i) => (
            <div key={s.id} className="pj-ed-task">
              <input className="ab-inp gg" value={s.role} onChange={(e) => setRole(i, 'role', e.target.value)} placeholder="Роль (напр. Senior dev)" />
              <label className="pj-ed-mini">€/год<input className="ab-inp xs" type="number" min={0} value={s.rate} onChange={(e) => setRole(i, 'rate', num(e.target.value))} /></label>
              <button className="mc-btn ghost" onClick={() => setDir({ ...dir, roleRates: roles.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          <button className="mc-btn" onClick={() => setDir({ ...dir, roleRates: [...roles, { id: uid('rr'), role: '', rate: 0 }] })}>+ Ставка ролі</button>
        </div>
      </div>

      <div className="pj-card" style={{ marginTop: 16 }}>
        <h2 className="pj-h2">База знань для AI</h2>
        <p className="pj-sub mono">Методика й правила агенції: як складати план, типові етапи, підходи до команди й тарифікації. Клод спирається на це, коли генерує чернетку проекту з аудиту.</p>
        <textarea className="ab-inp" rows={7} value={dir.knowledge || ''} onChange={(e) => setDir({ ...dir, knowledge: e.target.value })}
          placeholder={'напр.:\n— Старт завжди з дискавері (2–3 тижні).\n— Роль Tech Lead підключаємо з 2-го місяця.\n— Мінімальна тарифікація маркетолога — 40 год/міс.\n— Аванс 40% на старті, решта — помісячно.'} />
      </div>

      <div className="pj-card">
        <h2 className="pj-h2">Пресети проектів ({presets.length})</h2>
        <p className="pj-sub mono">Шаблони плану (Гант + команда + тарифікація). Зберігаються з картки клієнта кнопкою «Зберегти як пресет», застосовуються там само.</p>
        {presets.length === 0 ? <p className="mono adm-empty">Пресетів ще немає.</p> : (
          <ul className="adm-files">{presets.map((pr) => (
            <li key={pr.id} className="pm-preset">
              <span><b>{pr.title || 'без назви'}</b> <i className="mono">· {(pr.tasks || []).length} задач · {(pr.team || []).length} ролей</i></span>
              <button className="mc-btn ghost" onClick={() => setDir({ ...dir, presets: presets.filter((x) => x.id !== pr.id) })}>✕</button>
            </li>
          ))}</ul>
        )}
      </div>

      <div className="pj-ed-foot" style={{ marginTop: 16 }}>
        {stateLabel && <span className={`mono pj-save-state pj-save-${state}`}>{stateLabel}</span>}
        <button className="mc-btn ok" onClick={() => { if (timer.current) clearTimeout(timer.current); void doSave(); }} disabled={state === 'saving'}>{state === 'saving' ? 'Зберігаємо…' : 'Зберегти зараз'}</button>
      </div>
    </section>
  );
}

/** Менеджер керує кількома проектами клієнта: селектор + додати/видалити + збереження. */
type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
function ProjectsManager({ userId, initial, code, company }: { userId: string; initial: Project[]; code?: string; company?: string }) {
  const [list, setList] = useState<Project[]>(initial.length ? initial : []);
  const [active, setActive] = useState(0);
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState('');
  const [msg, setMsg] = useState('');
  const idx = Math.min(active, Math.max(0, list.length - 1));
  const cur = list[idx];

  // Автозбереження: рефи тримають найсвіжіший стан для дебаунса й флешу при демонтажі.
  const latest = useRef(list); latest.current = list;
  const dirty = useRef(false);
  const first = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doSave = async () => {
    setState('saving'); setMsg('');
    const r = await saveProjectsFor(userId, latest.current);
    if (r.ok) { dirty.current = false; setState('saved'); setSavedAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })); }
    else { setState('error'); setMsg(r.error || 'Помилка збереження'); }
  };

  // При кожній зміні list — позначаємо «незбережено» і плануємо автозбереження (дебаунс 1.2с).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    dirty.current = true; setState('dirty');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void doSave(); }, 1200);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);
  // Флеш при демонтажі (перехід між клієнтами/розділами) — щоб зміни не губилися.
  useEffect(() => () => { if (dirty.current) void saveProjectsFor(userId, latest.current); }, [userId]);

  const patchCur = (p: Project) => setList((l) => l.map((x, i) => (i === idx ? p : x)));
  const addProject = () => { const np = emptyProject(); np.title = `Проект ${list.length + 1}`; setList([...list, np]); setActive(list.length); };
  const delProject = () => { if (!cur) return; if (!confirm('Видалити цей проект?')) return; const nl = list.filter((_, i) => i !== idx); setList(nl); setActive(0); };

  const pubN = list.filter((x) => x.published).length;
  const stateLabel = state === 'saving' ? '💾 Збереження…'
    : state === 'dirty' ? '● Є незбережені зміни'
    : state === 'saved' ? `✓ Збережено ${savedAt} · ${list.length} проект(и), ${pubN} видно клієнту`
    : state === 'error' ? `✕ ${msg}` : '';

  return (
    <div className="pj-mgr">
      <div className="pj-mgr-bar">
        {list.map((x, i) => (
          <button key={x.id || i} className={`pj-switch-b${i === idx ? ' on' : ''}`} onClick={() => setActive(i)}>
            {x.published ? '● ' : '○ '}{x.title || `Проект ${i + 1}`}
          </button>
        ))}
        <button className="mc-btn sm" onClick={addProject}>+ Проект</button>
      </div>
      {!cur ? <p className="mono adm-empty">Проектів ще немає. Додайте перший.</p> : (
        <>
          <ProjectEditor key={cur.id} value={cur} onChange={patchCur} code={code} company={company} />
          <div className="pj-ed-foot">
            <button className="mc-btn bad" onClick={delProject}>Видалити проект</button>
            <div className="pj-mgr-save">
              {stateLabel && <span className={`mono pj-save-state pj-save-${state}`}>{stateLabel}</span>}
              <button className="mc-btn ok" onClick={() => { if (timer.current) clearTimeout(timer.current); void doSave(); }} disabled={state === 'saving'}>{state === 'saving' ? 'Зберігаємо…' : 'Зберегти зараз'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Редактор одного проекту (керований): Гант, команда, фінкалендар, тарифікація, бюджет. */
function ProjectEditor({ value, onChange, code, company }: { value: Project; onChange: (p: Project) => void; code?: string; company?: string }) {
  const p = value;
  const [dir, setDir] = useState<PmDirectory>({});
  const [ai, setAi] = useState('');   // статус AI-чернетки
  useEffect(() => { loadPmDirectory().then(setDir); }, []);
  const upd = (patch: Partial<Project>) => onChange({ ...p, ...patch });
  const num = (v: string) => (v === '' ? 0 : Number(v));
  const rid = (pfx: string) => `${pfx}_${Math.random().toString(36).slice(2, 8)}`;

  // 🪄 Згенерувати чернетку плану з відповідей аудиту клієнта.
  const genDraft = async () => {
    if (!code) { setAi('Немає коду аудиту — клієнт ще не відкрив розділ.'); return; }
    setAi('Читаю аудит…');
    const id = await findAuditIdByCode(code);
    if (!id) { setAi('Аудит не знайдено.'); return; }
    const answers = await loadAuditAnswers(id);
    if (!answers || !Object.keys(answers).length) { setAi('Клієнт ще не заповнив відповіді аудиту.'); return; }
    setAi('Клод складає чернетку…');
    const r = await aiDraftProject({
      answers, company, knowledge: dir.knowledge, roleRates: dir.roleRates, specialists: dir.specialists,
      startMonth: p.startMonth, span: p.span,
    });
    if (!r.ok || !r.draft) { setAi(r.error || 'Не вдалося згенерувати.'); return; }
    const d = r.draft;
    upd({
      title: p.title || d.title || '',
      tasks: (d.tasks || []).map((t) => ({ id: rid('t'), name: t.name || '', track: t.track, startM: Math.max(0, Number(t.startM) || 0), lenM: Math.max(1, Number(t.lenM) || 1), progress: 0, owner: t.owner })),
      team: (d.team || []).map((m) => ({ id: rid('m'), role: m.role || '', name: m.name || '' })),
      tariff: (d.tariff || []).map((mo) => ({ id: rid('mo'), month: mo.month || p.startMonth || '', items: (mo.items || []).map((it) => ({ id: rid('i'), label: it.label || '', hours: Number(it.hours) || 0, rate: Number(it.rate) || 0 })) })),
    });
    setAi(`✓ Чернетку складено${d.rationale ? ': ' + d.rationale : ''}. Перевірте й відредагуйте перед публікацією.`);
  };
  // Пресети проектів (шаблони) з довідника.
  const presets = dir.presets || [];
  const applyPreset = (pr: Project) => {
    upd({
      title: pr.title || p.title, span: pr.span || p.span,
      tasks: (pr.tasks || []).map((t) => ({ ...t, id: rid('t') })),
      team: (pr.team || []).map((m) => ({ ...m, id: rid('m') })),
      tariff: (pr.tariff || []).map((mo) => ({ ...mo, id: rid('mo'), items: (mo.items || []).map((it) => ({ ...it, id: rid('i') })) })),
    });
    setAi(`✓ Застосовано пресет «${pr.title || 'без назви'}».`);
  };
  const saveAsPreset = async () => {
    const name = prompt('Назва пресету:', p.title || 'Пресет');
    if (!name) return;
    const preset: Project = { ...p, id: rid('pr'), title: name, published: false, payments: [], budget: {} };
    const nd = { ...dir, presets: [...presets, preset] };
    setDir(nd); await savePmDirectory(nd);
    setAi(`✓ Збережено як пресет «${name}» (у Проект-офісі).`);
  };

  const tasks = p.tasks || [], team = p.team || [], pays = p.payments || [], tariff = p.tariff || [];
  const specialists = dir.specialists || [];
  const span = Math.max(1, Math.min(24, p.span || 6));
  const cols = Array.from({ length: span }, (_, i) => i);
  const budget = p.budget || {};
  const setBudget = (taskId: string, m: number, v: number) => { const b = { ...budget }; const k = `${taskId}:${m}`; if (v) b[k] = v; else delete b[k]; upd({ budget: b }); };
  const budgetGrand = Object.values(budget).reduce((s, v) => s + (v || 0), 0);
  const setTask = (i: number, k: keyof ProjTask, v: unknown) => upd({ tasks: tasks.map((t, j) => (j === i ? { ...t, [k]: v } : t)) });
  const setMember = (i: number, k: keyof ProjMember, v: unknown) => upd({ team: team.map((t, j) => (j === i ? { ...t, [k]: v } : t)) });
  const setPay = (i: number, k: keyof ProjPayment, v: unknown) => upd({ payments: pays.map((t, j) => (j === i ? { ...t, [k]: v } : t)) });
  const setMonth = (i: number, k: keyof ProjMonth, v: unknown) => upd({ tariff: tariff.map((t, j) => (j === i ? { ...t, [k]: v } : t)) });
  const setItem = (mi: number, ii: number, k: keyof ProjTariffItem, v: unknown) =>
    upd({ tariff: tariff.map((m, j) => (j === mi ? { ...m, items: (m.items || []).map((it, q) => (q === ii ? { ...it, [k]: v } : it)) } : m)) });
  const patchItem = (mi: number, ii: number, patch: Partial<ProjTariffItem>) =>
    upd({ tariff: tariff.map((m, j) => (j === mi ? { ...m, items: (m.items || []).map((it, q) => (q === ii ? { ...it, ...patch } : it)) } : m)) });

  return (
    <div className="pj-ed">
      <div className="pj-ai">
        <button className="mc-btn ai" onClick={genDraft}>🪄 AI-чернетка з аудиту</button>
        {presets.length > 0 && (
          <select className="ab-sel" value="" onChange={(e) => { const pr = presets.find((x) => x.id === e.target.value); if (pr) applyPreset(pr); }}>
            <option value="">Застосувати пресет…</option>
            {presets.map((pr) => <option key={pr.id} value={pr.id}>{pr.title || 'без назви'}</option>)}
          </select>
        )}
        <button className="mc-btn" onClick={saveAsPreset}>Зберегти як пресет</button>
        {ai && <span className="mono pj-ai-msg">{ai}</span>}
      </div>

      <div className="pj-ed-row2">
        <label className="pj-ed-f"><i>Назва проекту</i><input className="ab-inp" value={p.title || ''} onChange={(e) => upd({ title: e.target.value })} placeholder="напр. Ecom-система Q3" /></label>
        <label className="pj-ed-f sm"><i>Старт (міс.)</i><input className="ab-inp" type="month" value={p.startMonth || ''} onChange={(e) => upd({ startMonth: e.target.value })} /></label>
        <label className="pj-ed-f sm"><i>Місяців у Ганті</i><input className="ab-inp" type="number" min={1} max={24} value={p.span || 6} onChange={(e) => upd({ span: Math.max(1, Math.min(24, num(e.target.value))) })} /></label>
      </div>

      {/* Гант */}
      <div className="pj-ed-sec"><b className="pj-ed-h">Дорожня карта (Гант)</b>
        {tasks.map((tk, i) => (
          <div key={tk.id} className="pj-ed-task">
            <input className="ab-inp gg" value={tk.name} onChange={(e) => setTask(i, 'name', e.target.value)} placeholder="Задача / етап" />
            <input className="ab-inp xs" value={tk.owner || ''} onChange={(e) => setTask(i, 'owner', e.target.value)} placeholder="хто" />
            <label className="pj-ed-mini">старт<input className="ab-inp xxs" type="number" min={0} value={tk.startM} onChange={(e) => setTask(i, 'startM', num(e.target.value))} /></label>
            <label className="pj-ed-mini">трив.<input className="ab-inp xxs" type="number" min={1} value={tk.lenM} onChange={(e) => setTask(i, 'lenM', Math.max(1, num(e.target.value)))} /></label>
            <label className="pj-ed-mini">%<input className="ab-inp xxs" type="number" min={0} max={100} value={tk.progress ?? 0} onChange={(e) => setTask(i, 'progress', Math.max(0, Math.min(100, num(e.target.value))))} /></label>
            <button className="mc-btn ghost" onClick={() => upd({ tasks: tasks.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <button className="mc-btn" onClick={() => upd({ tasks: [...tasks, { id: uid('t'), name: '', startM: 0, lenM: 1, progress: 0 }] })}>+ Задача</button>
      </div>

      {/* Команда */}
      <div className="pj-ed-sec"><b className="pj-ed-h">Команда</b>
        {team.map((m, i) => (
          <div key={m.id} className="pj-ed-task">
            <input className="ab-inp xs" value={m.role} onChange={(e) => setMember(i, 'role', e.target.value)} placeholder="Роль" />
            <input className="ab-inp gg" value={m.name} onChange={(e) => setMember(i, 'name', e.target.value)} placeholder="Імʼя" />
            <button className="mc-btn ghost" onClick={() => upd({ team: team.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <div className="pj-ed-add">
          {specialists.length > 0 && (
            <select className="ab-sel" value="" onChange={(e) => { const s = specialists.find((x) => x.id === e.target.value); if (s) upd({ team: [...team, { id: uid('m'), role: s.role, name: s.name }] }); }}>
              <option value="">+ з довідника…</option>
              {specialists.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
            </select>
          )}
          <button className="mc-btn" onClick={() => upd({ team: [...team, { id: uid('m'), role: '', name: '' }] })}>+ Учасник</button>
        </div>
      </div>

      {/* Фінкалендар */}
      <div className="pj-ed-sec"><b className="pj-ed-h">Фінансовий календар (€, без ПДВ)</b>
        {pays.map((x, i) => (
          <div key={x.id} className="pj-ed-task">
            <input className="ab-inp gg" value={x.label} onChange={(e) => setPay(i, 'label', e.target.value)} placeholder="Платіж (напр. Аванс)" />
            <input className="ab-inp xs" type="month" value={x.month} onChange={(e) => setPay(i, 'month', e.target.value)} />
            <label className="pj-ed-mini">€<input className="ab-inp xs" type="number" min={0} value={x.amount} onChange={(e) => setPay(i, 'amount', num(e.target.value))} /></label>
            <select className="ab-sel" value={x.status} onChange={(e) => setPay(i, 'status', e.target.value as ProjPayment['status'])}><option value="pending">Очікує</option><option value="paid">Сплачено</option></select>
            <button className="mc-btn ghost" onClick={() => upd({ payments: pays.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <button className="mc-btn" onClick={() => upd({ payments: [...pays, { id: uid('p'), label: '', month: p.startMonth || '', amount: 0, status: 'pending' }] })}>+ Платіж</button>
      </div>

      {/* Тарифікація */}
      <div className="pj-ed-sec"><b className="pj-ed-h">Помісячна тарифікація</b>
        {tariff.map((mo, mi) => {
          const items = mo.items || [];
          return (
            <div key={mo.id} className="pj-ed-tm">
              <div className="pj-ed-tm-head">
                <input className="ab-inp xs" type="month" value={mo.month} onChange={(e) => setMonth(mi, 'month', e.target.value)} />
                <button className="mc-btn ghost" onClick={() => upd({ tariff: tariff.filter((_, j) => j !== mi) })}>✕ місяць</button>
              </div>
              {items.map((it, ii) => (
                <div key={it.id} className="pj-ed-task">
                  <input className="ab-inp gg" value={it.label} onChange={(e) => setItem(mi, ii, 'label', e.target.value)} placeholder="Робота / роль" />
                  {specialists.length > 0 && (
                    <select className="ab-sel xs" value="" title="Підставити зі довідника" onChange={(e) => { const s = specialists.find((x) => x.id === e.target.value); if (s) patchItem(mi, ii, { label: `${s.name} · ${s.role}`, rate: s.rate }); }}>
                      <option value="">довідник</option>
                      {specialists.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                  <label className="pj-ed-mini">год<input className="ab-inp xxs" type="number" min={0} value={it.hours} onChange={(e) => setItem(mi, ii, 'hours', num(e.target.value))} /></label>
                  <label className="pj-ed-mini">€/год<input className="ab-inp xs" type="number" min={0} value={it.rate} onChange={(e) => setItem(mi, ii, 'rate', num(e.target.value))} /></label>
                  <span className="mono pj-ed-sum">€{((it.hours || 0) * (it.rate || 0)).toLocaleString('uk-UA')}</span>
                  <button className="mc-btn ghost" onClick={() => setMonth(mi, 'items', items.filter((_, j) => j !== ii))}>✕</button>
                </div>
              ))}
              <button className="mc-btn sm" onClick={() => setMonth(mi, 'items', [...items, { id: uid('i'), label: '', hours: 0, rate: 0 }])}>+ Рядок</button>
            </div>
          );
        })}
        <button className="mc-btn" onClick={() => upd({ tariff: [...tariff, { id: uid('mo'), month: p.startMonth || '', items: [] }] })}>+ Місяць</button>
      </div>

      {/* Бюджет-матриця задачі × місяці (внутрішнє, проект-офіс) */}
      <div className="pj-ed-sec"><b className="pj-ed-h">Бюджет: задачі × місяці (€, внутрішнє)</b>
        {tasks.length === 0 ? <p className="mono adm-empty">Додайте задачі в дорожній карті — рядки бюджету зʼявляться автоматично.</p> : (
          <div className="pj-bud-wrap">
            <table className="pj-bud">
              <thead><tr><th className="l">Задача</th>{cols.map((m) => <th key={m}>{gMonthLabel(p.startMonth, m)}</th>)}<th>Σ</th></tr></thead>
              <tbody>
                {tasks.map((tk) => {
                  const rowSum = cols.reduce((s, m) => s + (budget[`${tk.id}:${m}`] || 0), 0);
                  return (
                    <tr key={tk.id}>
                      <td className="l">{tk.name || '—'}</td>
                      {cols.map((m) => (
                        <td key={m}><input className="pj-bud-inp" type="number" min={0} value={budget[`${tk.id}:${m}`] || ''} onChange={(e) => setBudget(tk.id, m, num(e.target.value))} /></td>
                      ))}
                      <td className="mono r">€{rowSum.toLocaleString('uk-UA')}</td>
                    </tr>
                  );
                })}
                <tr className="pj-bud-tot">
                  <td className="l">Разом</td>
                  {cols.map((m) => { const cs = tasks.reduce((s, tk) => s + (budget[`${tk.id}:${m}`] || 0), 0); return <td key={m} className="mono">€{cs.toLocaleString('uk-UA')}</td>; })}
                  <td className="mono r">€{budgetGrand.toLocaleString('uk-UA')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pj-ed-pubrow">
        <label className="pj-ed-pub"><input type="checkbox" checked={!!p.published} onChange={(e) => upd({ published: e.target.checked })} /> Опубліковано (видно клієнту)</label>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="adm-block"><span className="sysx-kick">{title}</span>{children}</div>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="sysx adm"><div className="adm-in"><Link to="/" className="mc-back mono">← weexp.agency</Link>{children}</div></div>;
}
