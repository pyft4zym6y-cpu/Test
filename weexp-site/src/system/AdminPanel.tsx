import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  currentUser, isManager, listAllDiagnostics, listLeads, setTierStatusFor, clearTierStatusFor, setLeadStatus, setLeadDeal, deleteLead, deleteDiagnostics, signTierFile, CONFIGURED,
  findAuditIdByCode, loadAuditAnswers, loadAuditExtra, saveAuditExtra,
  saveProjectsFor, saveAssessmentFor, savePatchFor, runWorkerAudit, uploadAdminFile, deleteAdminFile, maturityToAssessment, sendFindingReviews, loadLearningSnapshot, emptyProject, getProjects, loadPmDirectory, savePmDirectory, aiDraftProject, aiScoreAudit, aiSufficiency, type SufficiencyVerdict, type SharedDoc,
  type ModuleScore, type DiagRecord, type AccessState, type ProjectNote, type AuditJobRef, type AdminFile, type WorkerMaturity, type ReviewableFinding, type FindingReview, type LearningSnapshot, type AuditDoc, type AuditDocSection, type AuditDocVersion, type PackState,
  MANAGER_EMAILS, TEAM_ROLES, ROLE_LABEL, roleOf, can, teamApi, MATURITY_DOMAIN_MODULE, type Role, type TeamMember, type DiagUser, type AdminRow, type LeadRow, type LeadDeal, type TierStatus, type LeadStatus, type AuditAnswer, type ExtraQ,
  type Project, type ProjTask, type ProjMember, type ProjPayment, type ProjMonth, type ProjTariffItem,
  type PmDirectory, type PmSpecialist, type PmRoleRate,
} from '@/lib/supa';
import { eur, sysLabel, actionText, type SysKey } from './lossModel';
import { toast } from '@/lib/toast';
import { useCabTheme, ThemeToggle } from '@/lib/cabTheme';
import { loadTemplate, uid, Q_TYPES, type AuditTemplate, type Question, type Block } from './auditTemplate';
import { ACCESS_CATALOG, ACCESS_METHOD_LABEL } from '@/data/accessCatalog';
import { PACK_ARTIFACTS, PACK_REPORTS, chaptersOf, TOTAL_CHAPTERS } from '@/data/auditPack';
import './system.css';
import './cabinet.css';
import { ACCESS_SOURCES, TABS, CAP_SUMMARY, EmptyState, FUNNEL, LEAD_STAGES, ST, Shell, Tile, TrafficBlock, Trend, coopLabel, funnelStage, rel, srcName, stageOf, tierLabel, type FunnelStage, type SiteTraffic, type Tab } from './admin/shared';


/* Важкі екрани вантажимо на вимогу: адмінка відкривається на «Дашборді», а
   картка клієнта, заявка, конструктор шаблону, проєктний офіс і команда потрібні
   лише коли туди зайшли. Так перший вхід не тягне весь пакет адмінки. */
const UserDetail = lazy(() => import('./admin/UserDetail').then((m) => ({ default: m.UserDetail })));
const LeadDetail = lazy(() => import('./admin/LeadDetail').then((m) => ({ default: m.LeadDetail })));
const TeamManager = lazy(() => import('./admin/TeamManager').then((m) => ({ default: m.TeamManager })));
const PmOffice = lazy(() => import('./admin/PmOffice').then((m) => ({ default: m.PmOffice })));
const AuditBuilder = lazy(() => import('./AuditBuilder').then((m) => ({ default: m.AuditBuilder })));

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
  const [auditSeg, setAuditSeg] = useState<'all' | 'express' | 'express_reg' | 'deep_req' | 'deep_work' | 'deep_done' | 'builder'>('all'); // підрозділи «Аудити»
  const [projSeg, setProjSeg] = useState<'list' | 'office'>('list');
  const [projNewFor, setProjNewFor] = useState(''); // підрозділи «Проекти»

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
    (leads || []).forEach((l) => { if (l.at) ev.push({ at: l.at, kind: 'lead', label: l.email || l.phone || 'заявка', sub: srcName(l.source) }); });
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
      const key = srcName(l.source);
      srcMap.set(key, (srcMap.get(key) || 0) + 1);
    });
    const leadSources = [...srcMap.entries()].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n).slice(0, 8);
    return { funnel, statusDist, recent: inPeriod.slice(0, 14), trend, leadSources };
  }, [rows, leads, metrics, period]);

  if (checking) return <div className="adm"><div className="adm-boot mono">Завантаження…</div></div>;
  if (!CONFIGURED) return <Shell><p className="mc-msg">Supabase не налаштовано — адмінка недоступна.</p></Shell>;
  if (!user) return <Shell><p className="mc-msg">Увійдіть акаунтом адміністратора. <Link to="/cabinet" className="mc-link">Вхід →</Link></p></Shell>;
  if (!isManager(user)) return <Shell><p className="mc-msg">Акаунт <b>{user.email}</b> не має прав адміністратора. Додайте його в <code>TEAM_ROLES</code> і застосуйте RLS-політику.</p></Shell>;

  // Роль і дозволи поточного адміна — гейтимо вкладки й дії.
  const role = roleOf(user);
  const allowedTabs = TABS.filter((tb) => can(user, tb.cap));
  const curTab = allowedTabs.some((tb) => tb.id === tab) ? tab : (allowedTabs[0]?.id ?? 'overview');

  const applyStatus = async (userId: string, tier: string, status: TierStatus, reason?: string) => {
    setBusy(`${userId}:${tier}`);
    const res = await setTierStatusFor(userId, tier, status, reason);
    // «Глибокий аудит = проект»: доступ надано → аудит стартував → одразу
    // заводимо проект клієнту (якщо його ще немає), щоб робота велась у «Проектах».
    if (res.ok && status === 'granted') {
      const row = (rows || []).find((r) => r.userId === userId);
      if (row && getProjects(row.record).length === 0) {
        const p = { ...emptyProject(), title: `Глибокий аудит · ${row.company || row.email}`, startMonth: new Date().toISOString().slice(0, 7) };
        const pr = await saveProjectsFor(userId, [p]);
        if (pr.ok) toast('✓ Створено проект «' + p.title + '»');
      }
    }
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
  // Чек-лист угоди в картці заявки → leads.deal (jsonb).
  const saveDeal = async (id: string, deal: LeadDeal) => {
    setBusy('deal:' + id);
    const res = await setLeadDeal(id, deal);
    setBusy('');
    if (!res.ok) { toast('Не збережено: ' + (res.error || ''), 'err'); return; }
    toast('✓ Чек-лист угоди збережено');
    setLeads((ls) => (ls || []).map((l) => (l.id === id ? { ...l, deal } : l)));
  };
  // «Завершена» → перевести заявку в проект: створюємо проект у кабінеті клієнта
  // з даними угоди, звʼязуємо заявку з проектом (deal.projectId), заявку не видаляємо.
  const leadToProject = async (lead: LeadRow) => {
    if (!lead.id) return;
    const client = lead.email ? (rows || []).find((r) => (r.email || '').toLowerCase() === lead.email!.toLowerCase()) : undefined;
    if (!client) { toast('Немає кабінету з email заявки — попросіть клієнта зареєструватись або створіть проект вручну у «Проектах».', 'err'); return; }
    if (lead.deal?.projectId) { toast('Проект уже створено з цієї заявки — відкриваю картку клієнта'); setOpenLead(null); setTab('projects'); setOpenUser(client.userId); return; }
    setBusy('conv:' + lead.id);
    const existing = getProjects(client.record);
    const title = `${coopLabel(lead.deal?.coopType) || 'Проект'} · ${client.company || lead.name || lead.email}`;
    const p = { ...emptyProject(), title, startMonth: new Date().toISOString().slice(0, 7) };
    const res = await saveProjectsFor(client.userId, [...existing, p]);
    if (!res.ok) { setBusy(''); toast('Не вдалося створити проект: ' + (res.error || ''), 'err'); return; }
    const deal: LeadDeal = { ...(lead.deal || {}), projectId: p.id, projectUserId: client.userId };
    const dr = await setLeadDeal(lead.id, deal);
    setBusy('');
    if (!dr.ok) toast('Проект створено, але звʼязку в заявці не збережено: ' + (dr.error || ''), 'err');
    else toast('✓ Проект «' + title + '» створено і звʼязано з заявкою');
    setLeads((ls) => (ls || []).map((l) => (l.id === lead.id ? { ...l, deal } : l)));
    load();
    setOpenLead(null); setTab('projects'); setOpenUser(client.userId);
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
          {allowedTabs.map((tb) => (
            <button key={tb.id} className={`adm-nav-i${curTab === tb.id ? ' on' : ''}`} onClick={() => { setTab(tb.id); setOpenUser(null); }}>{tb.label}</button>
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
        {/* ── Повна сторінка клієнта (замість бокового drawer) ── */}
        {detail && <Suspense fallback={null}><UserDetail row={detail} leads={leads} canDelete={can(user, 'delete_data')} selfEmail={user.email} onClose={() => setOpenUser(null)} openFile={openFile} onStatus={setStatus} onDelete={removeUser} busy={busy} /></Suspense>}
        {/* ── Дашборд ── */}
        {!detail && curTab === 'overview' && (
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
        {!detail && curTab === 'users' && (() => {
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
        {!detail && curTab === 'audits' && (() => {
          const base = (rows || []).filter((r) => !q || r.email.toLowerCase().includes(q.toLowerCase()) || (r.company || '').toLowerCase().includes(q.toLowerCase()));
          const withStage = base.map((r) => ({ r, stage: funnelStage(r) }));
          // Підрозділи: Всі (будь-яка аудит-активність) · Експрес (всі, вкл. незареєстрованих
          // з заявок) · Експрес зареєстрованих · Запити на глибокий · В роботі · Завершено (→ проект).
          const anonExpress = (leads || []).filter((l) => (l.diag || l.calc) && !ACCESS_SOURCES.includes(l.source || ''));
          const segRows: Record<string, { r: AdminRow; stage: FunnelStage }[]> = {
            all: withStage.filter((x) => x.stage !== 'registered'),
            express: withStage.filter((x) => x.r.hasExpress),
            express_reg: withStage.filter((x) => x.r.hasExpress),
            deep_req: withStage.filter((x) => x.stage === 'requested' || x.stage === 'awaiting_data'),
            deep_work: withStage.filter((x) => x.stage === 'in_work'),
            deep_done: withStage.filter((x) => x.stage === 'project'),
          };
          const SEGS: { k: typeof auditSeg; l: string; n?: number }[] = [
            { k: 'all', l: 'Всі аудити', n: segRows.all.length },
            { k: 'express', l: 'Експрес-аудити', n: segRows.express.length + anonExpress.length },
            { k: 'express_reg', l: 'Експрес зареєстрованих', n: segRows.express_reg.length },
            { k: 'deep_req', l: 'Запити на глибокий', n: segRows.deep_req.length },
            { k: 'deep_work', l: 'Глибокий — в роботі', n: segRows.deep_work.length },
            { k: 'deep_done', l: 'Глибокий — завершено', n: segRows.deep_done.length },
          ];
          const shown = auditSeg === 'builder' ? [] : (segRows[auditSeg] || segRows.all);
          return (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Аудити</h1>
              {auditSeg !== 'builder' && <input className="mc-search" placeholder="Пошук: email / компанія" value={q} onChange={(e) => setQ(e.target.value)} />}
            </div>
            <div className="adm-seg mono" role="tablist">
              {SEGS.map((s) => (
                <button key={s.k} role="tab" className={auditSeg === s.k ? 'on' : ''} onClick={() => setAuditSeg(s.k)}>{s.l} <b>{s.n}</b></button>
              ))}
              {can(user, 'edit_template') && (
                <button role="tab" className={auditSeg === 'builder' ? 'on' : ''} onClick={() => setAuditSeg('builder')}>⚙ Конструктор</button>
              )}
            </div>
            {auditSeg === 'builder' ? <Suspense fallback={null}><AuditBuilder /></Suspense> : (<>
            {rows === null ? <p className="mc-msg mono">Завантаження…</p> : shown.length === 0 && !(auditSeg === 'express' && anonExpress.length) ? <EmptyState icon="📊" text="У цьому підрозділі поки порожньо." /> : (
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
            {auditSeg === 'express' && anonExpress.length > 0 && (
              <div className="adm-anon-express">
                <span className="adm-acc-cat-h mono">Експрес без реєстрації (із заявок) · {anonExpress.length}</span>
                {anonExpress.map((l) => (
                  <div key={l.id} className="adm-tr adm-tr-anon">
                    <span className="adm-c-email"><b>{l.name || l.email || l.phone || 'анонім'}</b>{l.email && l.name && <i className="mono adm-c-co"> · {l.email}</i>}</span>
                    <span className="mono adm-anon-diag">{(l.diag || l.calc || '').slice(0, 80)}</span>
                    <span className="adm-act-at mono">{rel(l.at)}</span>
                    <button className="adm-open" onClick={() => { setTab('leads'); setOpenLead(l.id || null); }}>Заявка →</button>
                  </div>
                ))}
              </div>
            )}
            </>)}
          </section>
          );
        })()}

        {/* ── Проекти: робочий простір сформованих проектів ── */}
        {!detail && curTab === 'projects' && (() => {
          const withProj = (rows || [])
            .map((r) => ({ r, projects: getProjects(r.record) }))
            .filter((x) => x.projects.length)
            .filter((x) => !q || x.r.email.toLowerCase().includes(q.toLowerCase()) || (x.r.company || '').toLowerCase().includes(q.toLowerCase()));
          return (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Проекти</h1>
              {projSeg === 'list' && <input className="mc-search" placeholder="Пошук: email / компанія" value={q} onChange={(e) => setQ(e.target.value)} />}
            </div>
            <div className="adm-seg mono" role="tablist">
              <button role="tab" className={projSeg === 'list' ? 'on' : ''} onClick={() => setProjSeg('list')}>Проекти клієнтів <b>{withProj.length}</b></button>
              <button role="tab" className={projSeg === 'office' ? 'on' : ''} onClick={() => setProjSeg('office')}>Команда і ставки</button>
            </div>
            {projSeg === 'list' && (
              <div className="adm-proj-new">
                <span className="mono adm-hint">Завести проект вручну — для будь-якого клієнта, не чекаючи аудиту:</span>
                <select className="ab-sel" value={projNewFor} onChange={(e) => setProjNewFor(e.target.value)}>
                  <option value="">— оберіть клієнта —</option>
                  {(rows || []).map((r) => <option key={r.userId} value={r.userId}>{r.email}{r.company ? ` · ${r.company}` : ''}</option>)}
                </select>
                <button className="sysx-cta is-primary" disabled={!projNewFor || busy === 'proj-new'} onClick={async () => {
                  const row = (rows || []).find((x) => x.userId === projNewFor);
                  if (!row) return;
                  setBusy('proj-new');
                  const existing = getProjects(row.record);
                  const np = emptyProject();
                  np.title = `Проект ${existing.length + 1} · ${row.company || row.email}`;
                  const res = await saveProjectsFor(row.userId, [...existing, np]);
                  setBusy('');
                  if (res.ok) { setProjNewFor(''); setOpenUser(row.userId); }
                  else alert('Не вдалося створити проект: ' + (res.error || ''));
                }}>{busy === 'proj-new' ? 'Створюємо…' : '+ Новий проєкт'}</button>
                <span className="mono adm-hint">далі в картці клієнта: назва і строки → команда з довідника «Команда і ставки» → задачі по хвилях → бюджет-матриця → публікація клієнту</span>
              </div>
            )}
            {projSeg === 'office' ? <Suspense fallback={null}><PmOffice /></Suspense> : (
              rows === null ? <p className="mc-msg mono">Завантаження…</p> : withProj.length === 0 ? <EmptyState icon="📁" text="Сформованих проектів поки немає. Заведіть перший кнопкою «+ Новий проєкт» вище — або з картки клієнта." /> : (
                <div className="adm-table adm-tr-proj">
                  <div className="adm-tr adm-tr-proj adm-th"><span>Клієнт</span><span>Проект</span><span>Задач</span><span>Оновлено</span><span></span></div>
                  {withProj.map(({ r, projects }) => (
                    <div key={r.userId} className="adm-tr adm-tr-proj">
                      <span className="adm-c-email"><b>{r.email}</b>{r.company && <i className="mono adm-c-co"> · {r.company}</i>}</span>
                      <span>{projects.map((p) => p.title || 'Без назви').join(' · ')}{projects.length > 1 && <i className="mono adm-c-co"> ({projects.length})</i>}</span>
                      <span className="mono">{projects.reduce((n, p) => n + (p.tasks?.length || 0), 0)}</span>
                      <span className="mono adm-c-date">{r.updatedAt ? rel(r.updatedAt) : '—'}</span>
                      <button className="adm-open" onClick={() => setOpenUser(r.userId)}>Відкрити →</button>
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
          );
        })()}

        {/* ── Глибокий аудит: воронка запитів і стадії ── */}
        {!detail && curTab === 'deep' && (() => {
          type DStage = 'requested' | 'data' | 'granted' | 'work' | 'done' | 'rejected';
          const stageOf = (rec: DiagRecord | null | undefined): DStage | null => {
            const st = Object.values(rec?.funnel?.tierStatus || {});
            const mod = rec?.deepModeration?.status;
            if (mod === 'accepted' || (rec?.sharedDocs || []).length) return 'done';
            if (mod === 'submitted' || mod === 'clarify') return 'work';
            if (st.includes('granted')) return 'granted';
            if (st.includes('data')) return 'data';
            if (st.includes('rejected')) return 'rejected';
            if (st.includes('requested')) return 'requested';
            return null;
          };
          const STAGES: { k: DStage; label: string; note: string }[] = [
            { k: 'requested', label: 'Запит надіслано', note: 'клієнт натиснув «Почати глибокий аудит» — чекає рішення менеджера' },
            { k: 'data', label: 'Потрібні дані', note: 'менеджер запросив додаткові дані/доступи' },
            { k: 'granted', label: 'Доступ надано', note: 'код видано — клієнт заповнює опитувальник і доступи' },
            { k: 'work', label: 'Анкета в роботі', note: 'опитувальник надіслано / на уточненні — аудит виконується' },
            { k: 'done', label: 'Завершено', note: 'аудит прийнято, фінальні документи передані' },
          ];
          const withStage = (rows || [])
            .map((r) => ({ r, stage: stageOf(r.record) }))
            .filter((x): x is { r: typeof x.r; stage: DStage } => !!x.stage)
            .filter((x) => !q || x.r.email.toLowerCase().includes(q.toLowerCase()) || (x.r.company || '').toLowerCase().includes(q.toLowerCase()));
          const cnt = (k: DStage) => withStage.filter((x) => x.stage === k).length;
          const rejected = cnt('rejected');
          const reached = (i: number) => STAGES.slice(i).reduce((n, st2) => n + cnt(st2.k), 0);
          const base = reached(0) || 1;
          return (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Глибокий аудит</h1>
              <input className="mc-search" placeholder="Пошук: email / компанія" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <p className="adm-hint mono">Всі запити на глибокий аудит і їхня воронка: запит → дані → доступ → анкета → завершено. Видача кодів і модерація — у картці клієнта (кнопка «Відкрити»).</p>
            {rows === null ? <p className="mc-msg mono">Завантаження…</p> : withStage.length === 0 ? <EmptyState icon="🔬" text="Запитів на глибокий аудит поки немає. Вони зʼявляться, щойно клієнт натисне «Почати глибокий аудит» у кабінеті." /> : (<>
              <div className="adm-dfun">
                {STAGES.map((st2, i) => {
                  const n = reached(i);
                  const pct = Math.round((n / base) * 100);
                  return (
                    <div key={st2.k} className="adm-dfun-row" title={st2.note}>
                      <span className="adm-dfun-l">{st2.label}</span>
                      <span className="adm-dfun-bar"><i style={{ width: `${Math.max(4, pct)}%` }} /></span>
                      <b className="adm-dfun-n mono">{n}</b>
                      <span className="adm-dfun-pct mono">{pct}%</span>
                      <span className="adm-dfun-here mono">{cnt(st2.k) ? `зараз тут: ${cnt(st2.k)}` : ''}</span>
                    </div>
                  );
                })}
                {rejected > 0 && <p className="adm-dfun-rej mono">✕ відхилено: {rejected}</p>}
              </div>
              {STAGES.map((st2) => {
                const list = withStage.filter((x) => x.stage === st2.k);
                if (!list.length) return null;
                return (
                  <div key={st2.k} className="adm-dfun-grp">
                    <span className="cab-acc-cat-h mono" style={{ display: 'block', margin: '18px 0 8px' }}>{st2.label} · {list.length}</span>
                    {list.map(({ r }) => (
                      <div key={r.userId} className="adm-tr adm-tr-deep">
                        <span className="adm-c-email"><b>{r.email}</b>{r.company && <i className="mono adm-c-co"> · {r.company}</i>}</span>
                        <span className="mono">{r.record?.funnel?.accessCode ? `🔑 ${r.record.funnel.accessCode}` : '—'}</span>
                        <span className="mono adm-c-date">{r.updatedAt ? rel(r.updatedAt) : '—'}</span>
                        <button className="adm-open" onClick={() => setOpenUser(r.userId)}>Відкрити →</button>
                      </div>
                    ))}
                  </div>
                );
              })}
              {rejected > 0 && (
                <div className="adm-dfun-grp">
                  <span className="cab-acc-cat-h mono" style={{ display: 'block', margin: '18px 0 8px' }}>Відхилені · {rejected}</span>
                  {withStage.filter((x) => x.stage === 'rejected').map(({ r }) => (
                    <div key={r.userId} className="adm-tr adm-tr-deep">
                      <span className="adm-c-email"><b>{r.email}</b>{r.company && <i className="mono adm-c-co"> · {r.company}</i>}</span>
                      <span className="mono">{Object.values(r.record?.funnel?.tierReason || {}).filter(Boolean).join(' · ') || '—'}</span>
                      <span className="mono adm-c-date">{r.updatedAt ? rel(r.updatedAt) : '—'}</span>
                      <button className="adm-open" onClick={() => setOpenUser(r.userId)}>Відкрити →</button>
                    </div>
                  ))}
                </div>
              )}
            </>)}
          </section>
          );
        })()}

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
        {!detail && curTab === 'leads' && (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Заявки</h1>
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
                                    <span className="mono adm-lead-sub">{l.task || l.comment || srcName(l.source)}</span>
                                    <span className="mono adm-lead-at">{rel(l.at)}{l.source ? ` · ${srcName(l.source)}` : ''}</span>
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

        {/* ── Налаштування ── */}
        {!detail && curTab === 'settings' && (
          <section className="adm-sec">
            <h1 className="sysx-display adm-h1">Налаштування</h1>

            <div className="pj-card">
              <h2 className="pj-h2">Команда та ролі</h2>
              <p className="pj-sub mono">Рольова модель доступу. Ваша роль: <b>{role ? ROLE_LABEL[role] : '—'}</b>.</p>
              <div className="adm-team-tbl">
                <div className="adm-team-row adm-team-th"><span>Email</span><span>Роль</span><span>Доступ</span></div>
                {Object.entries(TEAM_ROLES).map(([email, r]) => (
                  <div key={email} className="adm-team-row">
                    <span className="mono">{email}{email === (user.email || '').toLowerCase() ? ' (ви)' : ''}</span>
                    <span><span className={`cab-badge mono tst-${r === 'super' ? 'ok' : r === 'admin' ? 'ok' : r === 'manager' ? 'wait' : 'none'}`}>{ROLE_LABEL[r]}</span></span>
                    <span className="mono adm-team-caps">{CAP_SUMMARY[r]}</span>
                  </div>
                ))}
              </div>
              <div className="adm-roles-legend">
                <p className="mono"><b>Super Admin</b> — повний доступ до всієї системи.</p>
                <p className="mono"><b>Admin</b> — користувачі, аудити, заявки, проекти, конструктор (без керування командою).</p>
                <p className="mono"><b>Manager</b> — робота з клієнтами, заявками й аудитами; без системних налаштувань.</p>
                <p className="mono"><b>Auditor / Specialist</b> — лише аудити й робочі дані.</p>
              </div>
              <p className="adm-hint mono">Бутстрап-super-адміни задані в коді (<code>TEAM_ROLES</code>) — щоб не втратити доступ. Інші ролі керуються нижче й зберігаються в акаунті. Нового адміна також додайте в RLS-політики Supabase (SELECT/UPDATE на <code>diagnostics</code>), щоб він бачив дані клієнтів.</p>
            </div>

            {can(user, 'manage_team') && <Suspense fallback={null}><TeamManager selfEmail={user.email} /></Suspense>}
          </section>
        )}
      </main>

      {/* Панель деталей заявки */}
      {openLead && leads && <Suspense fallback={null}><LeadDetail lead={leads.find((l) => l.id === openLead)} allRows={rows || []} onClose={() => setOpenLead(null)} onStatus={moveLead} onDeal={saveDeal} onConvert={leadToProject} onDelete={removeLead} busy={busy} onOpenClient={(uid) => { setOpenLead(null); setTab('users'); setOpenUser(uid); }} /></Suspense>}

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

