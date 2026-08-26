import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  currentUser,
  isManager,
  setActor,
  listAllDiagnostics,
  loadDiagnosticFor,
  watchClientData,
  LIST_PAGE,
  checkDb,
  type DbCheck,
  listLeads,
  setTierStatusFor,
  clearTierStatusFor,
  setLeadStatus,
  setLeadDeal,
  deleteLead,
  deleteDiagnostics,
  signTierFile,
  CONFIGURED,
  saveProjectsFor,
  savePatchFor,
  emptyProject,
  getProjects,
  MANAGER_EMAILS,
  TEAM_ROLES,
  ROLE_LABEL,
  roleOf,
  can,
  type DiagUser,
  type AdminRow,
  type LeadRow,
  type LeadDeal,
  type TierStatus,
  type LeadStatus
} from '@/lib/supa';
import { eur } from './systems';
import { askConfirm, DialogHost, PanelBoundary } from './admin/dialog';
import { matchRow, rowMatches } from './admin/search';
import { auditStatusOf, blockers, lastMoveAt, money, nextStep, phaseOf, slaOf, staleDays, OURS, PHASES, STAGE_OF } from './admin/auditRequests';
import { toast } from '@/lib/toast';
import { useCabTheme, ThemeToggle } from '@/lib/cabTheme';
import { uid } from './auditTemplate';

import './system.css';
import './cabinet.css';
import { ACCESS_SOURCES, TABS, U_TABS, CAP_SUMMARY, EmptyState, FUNNEL, LEAD_STAGES, ST, Shell, Tile, TrafficBlock, Trend, coopLabel, funnelStage, rel, srcName, stageOf, tierLabel, type FunnelStage, type SiteTraffic, type Tab, type UTab } from './admin/shared';

/* Важкі екрани вантажимо на вимогу: адмінка відкривається на «Дашборді», а
   картка клієнта, заявка, конструктор шаблону, проєктний офіс і команда потрібні
   лише коли туди зайшли. Так перший вхід не тягне весь пакет адмінки. */
const UserDetail = lazy(() => import('./admin/UserDetail').then((m) => ({ default: m.UserDetail })));
const LeadDetail = lazy(() => import('./admin/LeadDetail').then((m) => ({ default: m.LeadDetail })));
const TeamManager = lazy(() => import('./admin/TeamManager').then((m) => ({ default: m.TeamManager })));
const PmOffice = lazy(() => import('./admin/PmOffice').then((m) => ({ default: m.PmOffice })));
const AuditRequests = lazy(() => import('./admin/AuditRequests').then((m) => ({ default: m.AuditRequests })));
const WorkerTab = lazy(() => import('./admin/WorkerTab').then((m) => ({ default: m.WorkerTab })));
const EventLog = lazy(() => import('./admin/EventLog').then((m) => ({ default: m.EventLog })));
// Дашборд окремо: його обчислення (воронка, тренд, гроші по фазах) крутились
// на кожному рендері адмінки, навіть коли відкритий зовсім інший розділ.
const Dashboard = lazy(() => import('./admin/Dashboard').then((m) => ({ default: m.Dashboard })));
const AuditBuilder = lazy(() => import('./AuditBuilder').then((m) => ({ default: m.AuditBuilder })));

export function AdminPanel() {
  const theme = useCabTheme();
  /* Стан навігації — в адресі. Вкладка й відкритий клієнт більше не «десь у
     памʼяті компонента»: посилання на картку можна переслати, F5 повертає туди
     ж, «Назад» працює як очікується. */
  const nav = useNavigate();
  const params = useParams<{ tab?: string; clientId?: string; utab?: string }>();
  const [user, setUser] = useState<DiagUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const urlTab = (TABS.some((t) => t.id === params.tab) || TABS.some((t) => (t.sub || []).some((x) => x.id === params.tab))
    ? (params.tab as Tab) : 'overview');
  const tab = urlTab;
  // replace: прохід по розділах не має класти в історію по запису — інакше
  // після пʼяти вкладок «Назад» треба тиснути пʼять разів, щоб вийти.
  const setTab = (t: Tab) => nav(`/admin/${t}`, { replace: true });
  const [q, setQ] = useState('');
  const openUser = params.clientId || null;
  // tab через ref: обробники, підписані один раз (Esc), інакше бачили б застарілу вкладку.
  const tabRef = useRef<Tab>(tab); tabRef.current = tab;
  const setOpenUser = (uid: string | null) => nav(uid ? `/admin/${tabRef.current}/c/${uid}` : `/admin/${tabRef.current}`);
  // Вкладка картки — теж в адресі. Раніше маршрут :utab існував, але ніде не
  // читався: посилання на конкретну вкладку відкривало «Огляд».
  const utab = (U_TABS.some((t) => t.id === params.utab) ? params.utab : 'over') as UTab;
  const setUtab = (t: UTab) => { if (openUser) nav(`/admin/${tabRef.current}/c/${openUser}/${t}`, { replace: true }); };
  // Повний запис відкритої картки: у списку лежить лише полегшений зріз.
  const [detailRow, setDetailRow] = useState<AdminRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // Свіжий список без того, щоб робити його залежністю ефектів (див. нижче).
  const rowsRef = useRef<AdminRow[]>([]);
  const [db, setDb] = useState<DbCheck[] | null>(null);   // стан міграцій
  const [more, setMore] = useState(false);   // чи може бути наступна сторінка
  const [loadingMore, setLoadingMore] = useState(false);
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [traffic, setTraffic] = useState<SiteTraffic | null | undefined>(undefined);
  const [sortKey, setSortKey] = useState<'email' | 'company' | 'tiers' | 'updated'>('updated');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  // Період дашборда переживає перезавантаження — інакше кожен вхід починався
  // з чужого «30 днів», навіть якщо ти працюєш у розрізі кварталу.
  const [period, setPeriod] = useState<7 | 30 | 90 | 0>(() => {
    try { const v = Number(localStorage.getItem('weexp:adm-period')); return ([7, 30, 90, 0] as number[]).includes(v) ? (v as 7 | 30 | 90 | 0) : 30; } catch { return 30; }
  });
  useEffect(() => { try { localStorage.setItem('weexp:adm-period', String(period)); } catch { /* ignore */ } }, [period]);
  const [ask, setAsk] = useState<{ userId: string; tier: string; status: TierStatus } | null>(null);
  const [askReason, setAskReason] = useState('');
  const [selLeads, setSelLeads] = useState<Set<string>>(new Set()); // мультивибір заявок (має бути ДО ранніх return — правило хуків)
  const [userSeg, setUserSeg] = useState<'clients' | 'admins' | 'all'>('clients'); // підрозділ «Користувачі»
  const [auditSeg, setAuditSeg] = useState<'all' | 'express' | 'express_reg' | 'deep_req' | 'deep_work' | 'deep_done' | 'builder'>('all'); // підрозділи «Аудити»
  const [projSeg, setProjSeg] = useState<'list' | 'office'>('list');
  const [projNewFor, setProjNewFor] = useState(''); // підрозділи «Проекти»

  const load = () => {
    listAllDiagnostics().then((rs) => { rowsRef.current = rs; setRows(rs); setMore(rs.length >= LIST_PAGE); });
    listLeads().then(setLeads);
    fetch('/api/ga4-site').then((r) => r.json()).then((j: SiteTraffic) => setTraffic(j)).catch(() => setTraffic(null));
  };
  const loadMore = async () => {
    setLoadingMore(true);
    const page = Math.floor((rows || []).length / LIST_PAGE);
    const next = await listAllDiagnostics(page);
    setLoadingMore(false);
    setMore(next.length >= LIST_PAGE);
    setRows((rs) => {
      const seen = new Set((rs || []).map((r) => r.userId));
      const merged = [...(rs || []), ...next.filter((r) => !seen.has(r.userId))];
      rowsRef.current = merged;
      return merged;
    });
  };
  /**
   * Відкриття картки — момент, коли потрібен повний запис (документ аудиту,
   * зрізи бази знань, етапи). У списку його немає навмисно.
   *
   * Залежність ТІЛЬКИ від openUser. Раніше сюди входив і `rows`: будь-яке
   * оновлення списку (а `load()` викликається після кожної дії) підміняло
   * повний запис обрізаним зрізом зі списку, панелі картки перемонтовувались і
   * бралися з застарілих пропсів — правки менеджера могли відкотитись.
   */
  useEffect(() => {
    if (!openUser) { setDetailRow(null); return; }
    let alive = true;
    setDetailLoading(true);
    loadDiagnosticFor(openUser).then((full) => {
      if (!alive) return;
      setDetailLoading(false);
      if (full) setDetailRow(full);
      else setDetailRow(rowsRef.current.find((r) => r.userId === openUser) || null);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openUser]);
  /** Перечитати відкриту картку — після дій, що змінюють саме її. */
  const reloadDetail = async () => {
    if (!openUser) return;
    const full = await loadDiagnosticFor(openUser);
    if (full) setDetailRow(full);
  };
  // Хто працює — знає шар даних: усі записи підписуються цим email (журнал дій).
  useEffect(() => { currentUser().then((u) => { setActor(u?.email); setUser(u); setChecking(false); if (u && isManager(u)) { load(); void checkDb().then(setDb); } }); }, []);
  /**
   * Живе оновлення. Досі про будь-яку подію дізнавались, лише відкривши розділ
   * або натиснувши «↻ оновити»: клієнт міг надіслати анкету годину тому, а на
   * дошці — тиша. Подія слугує лише сигналом; дані перечитуємо звичайним
   * шляхом, щоб не зʼявився другий спосіб побудови стану.
   */
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!user || !isManager(user)) return;
    const off = watchClientData(() => {
      setLive(true);
      listAllDiagnostics().then((rs) => { rowsRef.current = rs; setRows(rs); });
      listLeads().then(setLeads);
      void reloadDetail();
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Esc закриває відкриті шухляди/модалку.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Картка відкривалась push'ем — закриваємо її поверненням назад, а не
      // новим записом в історії.
      setAsk(null); setOpenLead(null);
      if (window.location.pathname.includes('/c/')) nav(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Скільки на кожній вкладці чекає саме нас. Обовʼязково у useMemo: тут
  // auditStatusOf() біжить по всьому списку, а в тілі рендера це рахувалось
  // наново на кожне натискання клавіші в пошуку.
  const pending = useMemo<Partial<Record<Tab, number>>>(() => ({
    leads: (leads || []).filter((l) => !ACCESS_SOURCES.includes(l.source || '') && stageOf(l) === 'new').length,
    auditreq: (rows || []).filter((r) => { const st = auditStatusOf(r); return st !== null && OURS.includes(st); }).length,
  }), [rows, leads]);

  if (checking) return <div className="adm"><div className="adm-boot mono">Завантаження…</div></div>;
  if (!CONFIGURED) return <Shell><p className="mc-msg">Supabase не налаштовано — адмінка недоступна.</p></Shell>;
  if (!user) return <Shell><p className="mc-msg">Увійдіть акаунтом адміністратора. <Link to="/cabinet" className="mc-link">Вхід →</Link></p></Shell>;
  if (!isManager(user)) return <Shell><p className="mc-msg">Акаунт <b>{user.email}</b> не має прав адміністратора. Додайте його в <code>TEAM_ROLES</code> і застосуйте RLS-політику.</p></Shell>;

  // Роль і дозволи поточного адміна — гейтимо вкладки й дії.
  const role = roleOf(user);
  const allowedTabs = TABS.filter((tb) => can(user, tb.cap));
  const allowedIds = allowedTabs.flatMap((tb) => [tb.id, ...(tb.sub || []).filter((sb) => can(user, sb.cap)).map((sb) => sb.id)]);
  const curTab = allowedIds.includes(tab) ? tab : (allowedTabs[0]?.id ?? 'overview');
  // Адреса не має брехати про те, що показано: якщо роль не пускає в розділ,
  // виправляємо URL, а не просто малюємо інше.
  if (curTab !== tab) nav(`/admin/${curTab}`, { replace: true });

  // Видача доступу НЕ створює проект. Раніше створювала — і клієнт тієї ж миті
  // вилітав з фази «Аудит» у фазу «Впровадження» (статус виводиться з даних, а
  // наявність проекту важить більше за все інше). Через це колонки «Доступ
  // надано / Клієнт заповнює / На модерації / В роботі» ніколи не мали карток.
  // Проект тепер заводиться явно, коли аудит закрито — див. startProject().
  const applyStatus = async (userId: string, tier: string, status: TierStatus, reason?: string) => {
    setBusy(`${userId}:${tier}`);
    const res = await setTierStatusFor(userId, tier, status, reason);
    setBusy('');
    if (!res.ok) { toast('Не вдалося: ' + (res.error || ''), 'err'); return; }
    toast('✓ Статус оновлено'); load(); void reloadDetail();
  };
  // Етап 1 закрито явно: раніше «Завершено» ставилось від факту, що клієнту
  // передали хоч один документ — проміжний файл закривав увесь аудит.
  /**
   * Зріз бази знань на переході фази. Ручну кнопку ніхто не згадає натиснути,
   * а саме на межі етапів і треба зафіксувати, що ми знали.
   */
  const snapshotKb = async (userId: string, note: string) => {
    const full = await loadDiagnosticFor(userId);
    const rec = full?.record; if (!rec) return;
    const v = {
      id: 'kb_' + Date.now().toString(36), at: new Date().toISOString(), by: user?.email, note,
      counts: {
        access: Object.keys(rec.accessLog || {}).length,
        files: (rec.clientFiles || []).length,
        runs: (rec.auditJobs || []).length,
        scores: Object.keys(rec.assessment || {}).length,
        notes: (rec.notes || []).length,
        docs: (rec.sharedDocs || []).length,
      },
      company: Object.fromEntries(Object.entries(rec.company || {}).filter(([, x]) => typeof x === 'string')) as Record<string, string>,
      content: {
        accesses: Object.entries(rec.accessLog || {}).map(([id, a]) => ({ id, status: a.status })),
        files: (rec.clientFiles || []).map((f) => f.title || f.type || 'файл'),
        notes: (rec.notes || []).map((n) => n.text),
        scoring: Object.fromEntries(Object.entries(rec.assessment || {}).map(([k, x]) => [k, { state: x.state, gap: x.gap }])),
      },
    };
    await savePatchFor(userId, { kbVersions: [...(rec.kbVersions || []), v].slice(-24) });
  };

  const closeAudit = async (userId: string) => {
    if (!(await askConfirm({ title: 'Закрити етап «Аудит»?', text: 'Клієнт побачить етап завершеним, далі — план впровадження.', confirmLabel: 'Закрити етап' }))) return;
    setBusy('close:' + userId);
    const res = await savePatchFor(userId, { auditClosedAt: new Date().toISOString(), auditClosedBy: user?.email });
    setBusy('');
    if (!res.ok) { toast('Не вдалося: ' + (res.error || ''), 'err'); return; }
    await snapshotKb(userId, 'етап «Аудит» закрито');
    toast('✓ Етап «Аудит» закрито'); load(); void reloadDetail();
  };
  // Впровадження закрито → клієнт переходить на супровід (фаза 3), а не зникає
  // з дошки, як було до появи третьої фази.
  const closeDelivery = async (userId: string) => {
    const row = (rows || []).find((r) => r.userId === userId);
    if (!row) return;
    const open = getProjects(row.record).filter((p) => !p.closedAt);
    if (!open.length) return;
    if (!(await askConfirm({ title: `Закрити впровадження (${open.length} проєкт.)?`, text: 'Клієнт перейде у фазу супроводу.', confirmLabel: 'Закрити' }))) return;
    setBusy('closedel:' + userId);
    const stamp = new Date().toISOString();
    const next = getProjects(row.record).map((p) => (p.closedAt ? p : { ...p, closedAt: stamp, closedBy: user?.email }));
    const res = await saveProjectsFor(userId, next);
    setBusy('');
    if (!res.ok) { toast('Не вдалося: ' + (res.error || ''), 'err'); return; }
    toast('✓ Впровадження закрито — клієнт на супроводі'); load(); void reloadDetail();
  };
  // Проект впровадження — наступний крок ПІСЛЯ закритого аудиту, не побічний
  // ефект видачі доступу.
  const startProject = async (userId: string) => {
    const row = (rows || []).find((r) => r.userId === userId);
    if (!row) return;
    setBusy('proj:' + userId);
    const existing = getProjects(row.record);
    const p = { ...emptyProject(), title: `Впровадження · ${row.company || row.email}`, startMonth: new Date().toISOString().slice(0, 7) };
    const res = await saveProjectsFor(userId, [...existing, p]);
    setBusy('');
    if (!res.ok) { toast('Не вдалося створити проект: ' + (res.error || ''), 'err'); return; }
    await snapshotKb(userId, 'створено проект впровадження');
    toast('✓ Проект «' + p.title + '» створено'); load(); setOpenUser(userId);
  };
  // «Надати» — одразу; «Потрібні дані» / «Відхилити» — через модалку з причиною.
  const setStatus = (userId: string, tier: string, status: TierStatus) => {
    if (status === 'granted') applyStatus(userId, tier, status);
    else { setAsk({ userId, tier, status }); setAskReason(''); }
  };
  const clearTier = async (userId: string, tier: string) => {
    if (!(await askConfirm({ title: `Скинути ${tier} до «не запрошено»?`, text: 'Історія статусів лишиться в журналі.', confirmLabel: 'Скинути', tone: 'bad' }))) return;
    setBusy(`${userId}:${tier}`);
    const res = await clearTierStatusFor(userId, tier);
    setBusy('');
    if (!res.ok) { toast('Не вдалося: ' + (res.error || ''), 'err'); return; }
    toast('✓ Статус оновлено'); load(); void reloadDetail();
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
    if (!(await askConfirm({ title: 'Видалити цю заявку?', text: 'Назавжди. Дію не можна скасувати.', confirmLabel: 'Видалити', tone: 'bad' }))) return;
    setBusy('del:' + id);
    const res = await deleteLead(id);
    setBusy('');
    if (!res.ok) { toast('Не вдалося видалити: ' + (res.error || ''), 'err'); return; }
    toast('✓ Заявку видалено'); setLeads((ls) => (ls || []).filter((l) => l.id !== id));
    setOpenLead(null);
  };
  // Чек-лист угоди в картці заявки → leads.deal (jsonb).
  // Запис угоди робить сама картка (автозбереження); тут лише тримаємо
  // список у актуальному стані, щоб дошка не показувала старе.
  const saveDeal = (id: string, deal: LeadDeal) => {
    setLeads((ls) => (ls || []).map((l) => (l.id === id ? { ...l, deal } : l)));
  };

  // «Завершена» → перевести заявку в проект: створюємо проект у кабінеті клієнта
  // з даними угоди, звʼязуємо заявку з проектом (deal.projectId), заявку не видаляємо.
  const leadToProject = async (lead: LeadRow) => {
    if (!lead.id) return;
    const client = lead.email ? (rows || []).find((r) => (r.email || '').toLowerCase() === lead.email!.toLowerCase()) : undefined;
    if (!client) { toast('Немає кабінету з email заявки — попросіть клієнта зареєструватись або створіть проект вручну в «Аудит і проєкти».', 'err'); return; }
    if (lead.deal?.projectId) { toast('Проект уже створено з цієї заявки — відкриваю картку клієнта'); setOpenLead(null); setOpenUser(client.userId); return; }
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
    setOpenLead(null); setOpenUser(client.userId);
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
    if (!(await askConfirm({ title: `Видалити ${ids.length} заявок?`, text: 'Назавжди. Дію не можна скасувати.', confirmLabel: 'Видалити', tone: 'bad' }))) return;
    setBusy('bulk');
    const res = await Promise.all(ids.map((id) => deleteLead(id)));
    setBusy(''); clearSel();
    const ok = res.filter((r) => r.ok).length;
    toast(ok === ids.length ? `✓ Видалено ${ok}` : `Видалено ${ok}/${ids.length}`, ok === ids.length ? 'ok' : 'err');
    setLeads((ls) => (ls || []).filter((l) => !ids.includes(l.id || '')));
  };
  const removeUser = async (userId: string, email: string) => {
    if (!(await askConfirm({ title: `Видалити клієнта ${email}?`, text: 'Профіль, аудити, воронка, проекти і ЙОГО ФАЙЛИ у сховищі. Обліковий запис входу лишиться в Supabase Auth. Дію не можна скасувати.', confirmLabel: 'Видалити назавжди', tone: 'bad' }))) return;
    setBusy('del:' + userId);
    const res = await deleteDiagnostics(userId);
    setBusy('');
    if (!res.ok) { toast('Не вдалося видалити: ' + (res.error || ''), 'err'); return; }
    toast(res.filesLeft ? `✓ Клієнта видалено · ${res.filesLeft} файл(ів) лишились у сховищі — приберіть вручну` : '✓ Клієнта видалено разом з його файлами', res.filesLeft ? 'err' : 'ok');
    setRows((rs) => (rs || []).filter((x) => x.userId !== userId));
    setOpenUser(null);
  };

  // Пошук іде по всій картці (нотатки, файли, оцінки, прогони, доступи), а не
  // лише по email і назві компанії — саме такі питання і ставить власник.
  const filtered = (rows || []).filter((r) => rowMatches(r, q));
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
  // Розділ «Аудит і проєкти» досі не мав вивантаження, хоча «Заявки» мали.
  const exportAuditCsv = () => {
    const head = ['email', 'company', 'stage', 'phase', 'who', 'lastMove', 'staleDays', 'blockers'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [head.join(',')];
    for (const r of rows || []) {
      const st = auditStatusOf(r);
      if (!st) continue;
      lines.push([
        r.email, r.company || '', STAGE_OF[st]?.l ?? st, `Фаза ${phaseOf(st)}`,
        nextStep(r).who, lastMoveAt(r), staleDays(r), blockers(r).join('; '),
      ].map(esc).join(','));
    }
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'weexp-audit.csv'; a.click(); URL.revokeObjectURL(a.href);
    toast('✓ CSV завантажено');
  };
  const exportLeadsCsv = (list: LeadRow[]) => {
    const head = ['at', 'source', 'status', 'name', 'email', 'phone', 'task', 'comment'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [head.join(',')].concat(list.map((l) => [l.at || '', l.source || '', l.status || '', l.name || '', l.email || '', l.phone || '', l.task || '', l.comment || ''].map(esc).join(',')));
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'weexp-leads.csv'; a.click(); URL.revokeObjectURL(a.href);
    toast('✓ CSV завантажено');
  };
  const detail = openUser ? detailRow : null;
  // Список сторінковий: показуємо, що це не всі, і даємо добрати наступну сторінку.
  // Це елемент, а не компонент усередині рендера: інакше React бачив новий тип
  // на кожен рендер і перемонтовував кнопку.
  const moreBtn = more ? (
    <div className="adm-more">
      <button className="mc-btn ghost" disabled={loadingMore} onClick={loadMore}>
        {loadingMore ? 'Вантажимо…' : `Показати ще (завантажено ${(rows || []).length})`}
      </button>
    </div>
  ) : null;

  return (
    <div className={'sysx adm' + theme.cls}>
      <aside className="adm-side">
        <Link to="/" className="adm-brand"><b>WEEXP</b><span className="mono">admin</span></Link>
        <nav className="adm-nav" role="tablist" aria-label="Розділи адмінки">
          {allowedTabs.map((tb) => (
            <div key={tb.id}>
              <button role="tab" aria-selected={curTab === tb.id} className={`adm-nav-i${curTab === tb.id ? ' on' : ''}`} onClick={() => setTab(tb.id)}>
                {tb.label}
                {!!pending[tb.id] && <span className="adm-nav-badge mono" title="чекає нашого ходу">{pending[tb.id]}</span>}
              </button>
              {/* Другий рівень: показуємо, коли активна сама секція або її підпункт. */}
              {(tb.sub || []).filter((sb) => can(user, sb.cap)).map((sb) => (
                (curTab === tb.id || curTab === sb.id) && (
                  <button key={sb.id} role="tab" aria-selected={curTab === sb.id} className={`adm-nav-i adm-nav-sub${curTab === sb.id ? ' on' : ''}`} onClick={() => setTab(sb.id)}>{sb.label}</button>
                )
              ))}
            </div>
          ))}
        </nav>
        <div className="adm-foot mono">
          <span title={user.email}>{user.email}</span>
          <div className="cab-side-foot-row">
            <button onClick={load} className="adm-refresh" title={live ? 'Дані оновлюються самі; кнопка — про всяк випадок' : 'Оновити дані'}>
              {live ? '● наживо' : '↻ оновити'}
            </button>
            <ThemeToggle dark={theme.dark} onToggle={theme.toggle} />
          </div>
        </div>
      </aside>

      <main className="adm-main">
        {/* ── Повна сторінка клієнта (замість бокового drawer) ── */}
        {openUser && detailLoading && !detail && <div className="adm-boot mono">Завантажуємо картку…</div>}
        {detail && <Suspense fallback={null}><UserDetail row={detail} leads={leads} canDelete={can(user, 'delete_data')} canAccess={can(user, 'manage_access')} selfEmail={user.email} utab={utab} onUtab={setUtab} onChanged={reloadDetail} onClose={() => setOpenUser(null)} openFile={openFile} onStatus={setStatus} onDelete={removeUser} busy={busy} /></Suspense>}
        {/* ── Дашборд ── */}
        {!detail && curTab === 'overview' && (
          <Suspense fallback={<p className="mc-msg mono">Завантаження…</p>}>
            <Dashboard rows={rows} leads={leads} traffic={traffic} period={period} onPeriod={setPeriod} />
          </Suspense>
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
                <input className="mc-search" placeholder="Пошук: email, компанія, нотатки, файли, доступи…" value={q} onChange={(e) => setQ(e.target.value)} />
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
                    {/* Знайшлось не за email — покажемо, де саме збіг. */}
                    {q && !r.email.toLowerCase().includes(q.toLowerCase()) && (
                      <span className="adm-hits mono">
                        {matchRow(r, q).map((h, i) => <i key={i}>{h.where}: {h.text.slice(0, 70)}</i>)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {moreBtn}
          </section>
          );
        })()}

        {/* ── Експрес-аудити: те, що клієнт зробив ДО заявки на глибокий ── */}
        {!detail && curTab === 'express' && (() => {
          const base = (rows || []).filter((r) => r.hasExpress && (!q || r.email.toLowerCase().includes(q.toLowerCase()) || (r.company || '').toLowerCase().includes(q.toLowerCase())));
          // Експрес проходять і без реєстрації — такі приходять заявкою.
          const anonExpress = (leads || []).filter((l) => (l.diag || l.calc) && !ACCESS_SOURCES.includes(l.source || ''));
          return (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Експрес-аудити</h1>
              <input className="mc-search" placeholder="Пошук: email, компанія, нотатки, файли, доступи…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <p className="adm-hint mono">Перший дотик: калькулятор витрат. Далі життя клієнта ведеться у «Аудит і проєкти».</p>
            {rows === null ? <p className="mc-msg mono">Завантаження…</p> : base.length === 0 && !anonExpress.length ? <EmptyState icon="📊" text="Експрес-аудитів ще немає." /> : (
              <div className="adm-table adm-tr-funnel">
                <div className="adm-tr adm-th adm-tr-funnel"><span>Email / компанія</span><span>Стадія</span><span>Витік/рік</span><span>Доступ</span><span></span></div>
                {base.map((r) => {
                  const money = r.record?.stage1Money;
                  const st = FUNNEL.find((x) => x.k === funnelStage(r))!;
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
            {anonExpress.length > 0 && (
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
            {moreBtn}
          </section>
          );
        })()}

        {/* ── Проекти: робочий простір сформованих проектів ── */}
        {/* «Команда і ставки» — довідник проєктного офісу, другий рівень розділу */}
        {!detail && curTab === 'pm' && (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Команда і ставки</h1></div>
            <Suspense fallback={<p className="mc-msg mono">Завантаження…</p>}><PmOffice /></Suspense>
          </section>
        )}

        {!detail && curTab === 'auditreq' && (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Аудит і проєкти</h1>
              <div className="adm-head-r">
                <input className="mc-search" placeholder="Пошук: email, компанія, нотатки, файли, доступи…" value={q} onChange={(e) => setQ(e.target.value)} />
                <button className="sysx-cta" disabled={!(rows || []).length} onClick={exportAuditCsv}>↓ CSV</button>
              </div>
            </div>
            <p className="adm-hint mono">Один життєвий цикл: заявка на аудит → аудит → проєкт впровадження. Стадію ніхто не проставляє руками — вона змінюється сама від дій клієнта й менеджера.</p>
            {/* Проєкт можна завести й без аудиту — напр. для чинного клієнта. */}
            <div className="adm-proj-new">
              <span className="mono adm-hint">Завести проєкт вручну, не чекаючи аудиту:</span>
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
                else toast('Не вдалося створити проект: ' + (res.error || ''), 'err');
              }}>{busy === 'proj-new' ? 'Створюємо…' : '+ Новий проєкт'}</button>
            </div>
            {/* onOpen лише відкриває картку ПОВЕРХ поточного розділу: закрив —
                і ти знову на дошці, з якої прийшов. Раніше кожне відкриття
                перекидало у «Користувачі», і повертатись було нікуди. */}
            <Suspense fallback={<p className="mc-msg mono">Завантаження…</p>}>
              <AuditRequests rows={rows} q={q} busy={busy} onStatus={setStatus} canAccess={can(user, 'manage_access')}
                onCloseAudit={closeAudit} onStartProject={startProject} onCloseDelivery={closeDelivery} onOpen={setOpenUser} />
            </Suspense>
          </section>
        )}

        {/* ── Воркер: особистий інструмент адміністратора ── */}
        {!detail && curTab === 'worker' && (
          <Suspense fallback={<p className="mc-msg mono">Завантаження…</p>}><WorkerTab rows={rows} /></Suspense>
        )}

        {/* ── Конструктор аудиту: другий рівень під «Аудити» ── */}
        {!detail && curTab === 'builder' && (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Конструктор аудиту</h1></div>
            <Suspense fallback={<p className="mc-msg mono">Завантаження…</p>}><AuditBuilder /></Suspense>
          </section>
        )}

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

            <div className="pj-card">
              <h2 className="pj-h2">Стан бази</h2>
              <p className="pj-sub mono">Які міграції застосовані. Без них частина адмінки працює «наполовину» й мовчить про це.</p>
              {db === null ? <p className="mc-msg mono">Перевіряємо…</p> : (
                <div className="adm-db">
                  {db.map((d) => (
                    <div key={d.key} className="adm-db-row mono">
                      <span className={`cab-badge tst-${d.ok ? 'ok' : 'bad'}`}>{d.ok ? '✓ є' : '— немає'}</span>
                      <span>{d.label}</span>
                      <code>{d.file}</code>
                    </div>
                  ))}
                  {db.some((d) => !d.ok) && <p className="adm-hint mono">Виконайте відсутні файли в Supabase → SQL Editor, у порядку списку.</p>}
                </div>
              )}
            </div>

            <div className="pj-card">
              <h2 className="pj-h2">Журнал дій</h2>
              <p className="pj-sub mono">Хто що зробив у системі. Записується автоматично, не редагується.</p>
              <Suspense fallback={<p className="mc-msg mono">Завантаження…</p>}><EventLog /></Suspense>
            </div>
          </section>
        )}
      </main>

      <DialogHost />

      {/* Панель деталей заявки */}
      {openLead && leads && <Suspense fallback={null}><LeadDetail lead={leads.find((l) => l.id === openLead)} allRows={rows || []} onClose={() => setOpenLead(null)} onStatus={moveLead} onDeal={saveDeal} onConvert={leadToProject} onDelete={removeLead} busy={busy} onOpenClient={(uid) => { setOpenLead(null); setOpenUser(uid); }} /></Suspense>}

      {/* Модалка причини (замість browser prompt) */}
      {ask && (
        <div className="adm-modal-wrap" onClick={() => setAsk(null)}>
          <div className="adm-modal" role="dialog" aria-modal="true" aria-label="Рішення за запитом доступу" onClick={(e) => e.stopPropagation()}>
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

