import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  currentUser, signOut, loadDiag, saveDiag, CONFIGURED, isCloudUser, isManager,
  signInWithGoogle, onAuth, signTierFile, uploadTierFile,
  ensureAudit, findAuditIdByCode, loadAuditAnswers, loadAuditExtra, getProjects, notifyAdmin,
  type DiagUser, type DiagRecord, type CompanyProfile, type TierStatus, type TierEvent, type AuditAnswer, type ExtraQ, type AccessState,
  type MarketplaceAccess, type ClientFile,
} from '@/lib/supa';
import { ACCESS_CATALOG, AUDIT_EMAIL, DATA_EMAIL, ACCESS_METHOD_LABEL, CONN_STATUS_LABEL, MARKETPLACE_PRESETS, MARKETPLACE_SCOPES, REPORT_TYPES, EXPORT_TYPES, REQUIRED_FILES, type AccessMethod } from '@/data/accessCatalog';
import { AuditForm } from './AuditForm';
import { ProjectView } from './ProjectView';
import { loadTemplate, CLIENT_ROLES, type AuditTemplate, type Question } from './auditTemplate';
import { getExpressAudit, clearExpressAudit, syncExpressToAccount, type ExpressAudit } from './cabinetData';
import { eur, sysLabel, actionText, type SysKey } from './lossModel';
import { sendLead } from '@/lib/leads';
import { isValidCode } from '@/lib/access';
import { toast } from '@/lib/toast';
import { useCabTheme, ThemeToggle } from '@/lib/cabTheme';
import { useT, useLp } from '@/i18n';
import './system.css';
import './cabinet.css';

/**
 * /cabinet — персональний кабінет клієнта як ХАБ однієї воронки. Зліва — розділи,
 * праворуч — вміст. Реюз реальної авторизації (Supabase з локальним фолбеком) і
 * зберігання (DiagRecord). Гроші/витік беруться з калькулятора (lossModel), а
 * глибокий аудит — вбудований Stage3. Це не окремі інструменти, а кроки системи.
 */
type SectionId = 'overview' | 'company' | 'audits' | 'deep' | 'project' | 'findings' | 'access' | 'docs' | 'collab' | 'settings';
type NavItem = { id: SectionId; label: string; soon?: boolean };

const EMPTY_COMPANY: CompanyProfile = { name: '', site: '', niche: '', revenue: '', channels: [], contactName: '', contactPhone: '', notes: '' };

/** Скелетон завантаження кабінету — брендові плейсхолдери замість голого тексту. */
function CabSkeleton({ t }: { t: (uk: string, en: string) => string }) {
  return (
    <div className="cab-skel" aria-busy="true" aria-label={t('Завантаження кабінету…', 'Loading cabinet…')}>
      <aside className="cab-skel-side">
        <span className="cab-skel-brand sk-shimmer" />
        {Array.from({ length: 6 }).map((_, i) => <span key={i} className="cab-skel-nav sk-shimmer" />)}
      </aside>
      <main className="cab-skel-main">
        <span className="cab-skel-h sk-shimmer" />
        <div className="cab-skel-tiles">{Array.from({ length: 4 }).map((_, i) => <span key={i} className="cab-skel-tile sk-shimmer" />)}</div>
        <span className="cab-skel-block sk-shimmer" />
        <span className="cab-skel-block sk-shimmer" style={{ width: '72%' }} />
      </main>
    </div>
  );
}

export function Cabinet() {
  const t = useT();
  const lp = useLp();
  const nav = useNavigate();
  const theme = useCabTheme();
  // Структура кабінету (без дублювання): Дані компанії → Огляд та шлях (поточний
  // стан + наступний крок) → Мої аудити (результати й історія) → План → Документи
  // (надати/отримати, вкл. доступи) → Мій проєкт → Співпраця → Налаштування.
  // Розділ «Глибокий аудит» прибрано з меню — його стан живе в «Огляд та шлях»,
  // а сам екран відкривається кнопками (go('deep')).
  const NAV: { group: string; items: NavItem[] }[] = [
    { group: t('Компанія', 'Company'), items: [{ id: 'company', label: t('Дані компанії', 'Company data') }] },
    { group: t('Огляд', 'Overview'), items: [{ id: 'overview', label: t('Огляд та шлях', 'Overview & path') }, { id: 'audits', label: t('Мої аудити', 'My audits') }] },
    { group: t('Робота', 'Work'), items: [{ id: 'findings', label: t('План', 'Plan'), soon: true }, { id: 'docs', label: t('Документи', 'Documents') }, { id: 'project', label: t('Мій проєкт', 'My project') }] },
    { group: t('Разом', 'Together'), items: [{ id: 'collab', label: t('Співпраця', 'Work with us') }, { id: 'settings', label: t('Налаштування', 'Settings') }] },
  ];
  const [user, setUser] = useState<DiagUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [rec, setRec] = useState<DiagRecord | null>(null);
  const [express, setExpress] = useState<ExpressAudit | null>(null);
  const [section, setSection] = useState<SectionId>('overview');

  // Вхід — лише Google (email/пароль тимчасово прибрано; інші провайдери додамо згодом).
  const [busy, setBusy] = useState(false);
  const [authErr, setAuthErr] = useState('');

  useEffect(() => { setExpress(getExpressAudit()); }, []);
  // Повернення з Google OAuth (конектор GA4): /cabinet?section=docs&ga=connected|error
  const gaHandled = useRef(false);
  useEffect(() => {
    if (gaHandled.current || !user || typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    const ga = p.get('ga');
    if (!ga) return;
    gaHandled.current = true;
    if (p.get('section') === 'docs') setSection('docs');
    void (async () => {
      const cur = await loadDiag(user);
      const next = { ...(cur.accessLog || {}), 'AC-01': { ...(cur.accessLog || {})['AC-01'], method: 'oauth' as const, connStatus: (ga === 'connected' ? 'on' : 'error') as 'on' | 'error', ...(ga === 'connected' ? { status: 'granted' as const } : {}), at: new Date().toISOString() } };
      await saveDiag(user, { accessLog: next });
      setRec(await loadDiag(user));
      if (ga === 'connected') toast(t('✓ Google Analytics підключено — доступ read-only', '✓ Google Analytics connected — read-only access'));
      else toast(t('Не вдалося підключити Google Analytics: ', 'Could not connect Google Analytics: ') + (p.get('reason') || ''), 'err');
      window.history.replaceState(null, '', window.location.pathname);
    })();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  // Прив'язати локальний експрес-аудит до акаунту й перечитати запис.
  const hydrate = (u: DiagUser) => { syncExpressToAccount(u).finally(() => loadDiag(u).then(setRec)); };
  useEffect(() => {
    currentUser().then((u) => {
      setUser(u); setChecking(false);
      if (u) hydrate(u);
    });
  }, []);
  // Google OAuth повертає користувача редіректом → сесія зʼявляється після монтування.
  useEffect(() => onAuth((u) => { if (u) { setUser(u); hydrate(u); } }), []);


  const doGoogle = async () => {
    setAuthErr(''); setBusy(true);
    const r = await signInWithGoogle();
    setBusy(false);
    if (r.error) setAuthErr(r.error === 'not_configured' ? t('Google-вхід зʼявиться після налаштування.', 'Google sign-in will appear once configured.') : r.error);
    // успіх → редірект на Google, повернення обробить onAuth
  };
  const doSignOut = async () => { await signOut(); setUser(null); setRec(null); setSection('overview'); };
  const refreshRec = () => { if (user) loadDiag(user).then(setRec); };
  // Видалення експрес-аудиту має бути повним: локальний знімок + похідні поля у
  // записі (stage1Money/stage1 — саме вони тримали крок «Експрес-витік» активним
  // після видалення). Так «Наскрізний шлях» відображає актуальний стан, не історію.
  const deleteExpress = async () => {
    clearExpressAudit();
    setExpress(null);
    if (user && (rec?.stage1Money || rec?.stage1 !== undefined)) {
      await saveDiag(user, { stage1Money: undefined, stage1: undefined });
      loadDiag(user).then(setRec);
    }
  };

  /* ── Ворота входу ── */
  if (checking) return <div className={'sysx cab' + theme.cls}><CabSkeleton t={t} /></div>;
  if (!user) {
    return (
      <div className={'sysx cab cab-gate' + theme.cls}>
        <div className="cab-gate-card">
          <div className="cab-gate-left">
            <Link to={lp('/')} className="cab-gate-back mono">← {t('на сайт', 'to site')}</Link>
            <span className="cab-gate-badge">{t('Особистий кабінет WEEXP', 'WEEXP client cabinet')}</span>
            <h1 className="sysx-display cab-gate-h">{t('Вхід у ваш', 'Sign in to your')}<br /><span className="hl">{t('кабінет', 'cabinet')}</span></h1>
            <p className="sysx-lead">{t('Один вхід — усі дані в одному місці. Повторний вхід тим самим email відкриває збережений розбір.', 'One sign-in — all your data in one place. Signing back in with the same email opens your saved analysis.')}</p>
            {express && (
              <div className="cab-gate-saved">
                <span className="cab-gate-saved-ic" aria-hidden="true">✓</span>
                <div>
                  <b>{t('Ваш експрес-аудит збережено', 'Your express audit is saved')}: {eur(express.total)}<i>{t('/рік', '/yr')}</i></b>
                  <span className="mono">{t('Увійдіть через Google — і він закріпиться за акаунтом. Проходити аудит заново не треба.', 'Sign in with Google — and it will be linked to your account. No need to redo the audit.')}</span>
                </div>
              </div>
            )}
            <ul className="cab-gate-gets">
              <li>{t('Експрес-витік із калькулятора — збережений', 'Express leak from the calculator — saved')}</li>
              <li>{t('Профіль компанії та безпечні доступи', 'Company profile and secure access')}</li>
              <li>{t('Глибокий аудит за кодом і план під DoD', 'Deep audit by code and a plan under DoD')}</li>
            </ul>
          </div>
          <div className="cab-gate-right">
            <div className="cab-form">
              <span className="sysx-kick">{t('Вхід у кабінет', 'Sign in to cabinet')}</span>
              <p className="cab-form-lead">{t('Швидкий і безпечний вхід через Google. Ваш експрес-аудит підтягнеться до акаунту автоматично.', 'Quick and secure sign-in with Google. Your express audit is linked to the account automatically.')}</p>
              {CONFIGURED ? (
                <button className="cab-google cab-google-lg" onClick={doGoogle} disabled={busy}>
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>
                  {busy ? t('Відкриваємо Google…', 'Opening Google…') : t('Продовжити з Google', 'Continue with Google')}
                </button>
              ) : (
                <p className="cab-auth-err mono">{t('Вхід тимчасово недоступний — Supabase не налаштовано.', 'Sign-in is temporarily unavailable — Supabase is not configured.')}</p>
              )}
              {authErr && <p className="cab-auth-err mono">{authErr}</p>}
              <p className="sysx-note mono">{t('Незабаром додамо інші способи входу. Захищений вхід, дані синхронізуються між пристроями.', 'More sign-in options coming soon. Secure sign-in, data syncs across your devices.')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={'sysx cab' + theme.cls}>
      {/* Сайдбар */}
      <aside className="cab-side">
        <Link to={lp('/')} className="cab-brand"><b>WEEXP</b><span className="mono">{t('кабінет', 'cabinet')}</span></Link>
        <nav className="cab-nav">
          {NAV.map((g) => (
            <div key={g.group} className="cab-nav-g">
              <span className="cab-nav-gl mono">{g.group}</span>
              {g.items.map((it) => (
                <button key={it.id} className={`cab-nav-i${section === it.id ? ' on' : ''}`} onClick={() => setSection(it.id)}>
                  {it.label}{it.soon && <i className="cab-soon mono">{t('скоро', 'soon')}</i>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="cab-side-foot">
          {isManager(user) && (
            <Link to={lp('/admin')} className="cab-admin-link mono" title={t('Перейти в адмін-панель WEEXP', 'Open the WEEXP admin panel')}>
              {t('⚙ Адмін-панель', '⚙ Admin panel')} →
            </Link>
          )}
          <span className="cab-user mono" title={user.email}>{user.email}</span>
          <span className="cab-user-mode mono">{isCloudUser(user) ? t('☁ хмара', '☁ cloud') : t('● локально', '● local')}</span>
          <div className="cab-side-foot-row">
            <button className="cab-signout mono" onClick={doSignOut}>{t('Вийти', 'Sign out')}</button>
            <ThemeToggle dark={theme.dark} onToggle={theme.toggle} />
          </div>
        </div>
      </aside>

      {/* Контент */}
      <main className="cab-main">
        {section === 'overview' && <Overview express={express} rec={rec} go={setSection} />}
        {section === 'audits' && <Audits express={express} rec={rec} user={user} go={setSection} onDelete={deleteExpress} />}
        {section === 'company' && <CompanyForm user={user} rec={rec} onSaved={refreshRec} />}
        {section === 'access' && <AccessGrant user={user} rec={rec} />}
        {section === 'deep' && <DeepAudit user={user} rec={rec} express={express} onDone={refreshRec} onClose={() => setSection('overview')} go={setSection} />}
        {section === 'project' && <ProjectView projects={getProjects(rec)} en={t('', 'en') === 'en'} />}
        {section === 'findings' && <Soon title={t('Знахідки та дорожня карта', 'Findings & roadmap')} lead={t('Тут зʼявляться підтверджені знахідки глибокого аудиту й план під Definition of Done: що робити, у якому порядку і який ефект. Розділ вмикається після завершення Tier-2 розбору.', 'Confirmed findings from the deep audit and a plan under a Definition of Done will appear here: what to do, in what order and what the effect is. The section unlocks after the Tier-2 analysis is complete.')} />}
        {section === 'docs' && (
          <div className="cab-sec">
            <SecHead kick={t('Документи', 'Documents')} title={t('Документи та доступи', 'Documents & access')} lead={t('Все, що ви надаєте нам для роботи, і все, що отримуєте від нас: доступи до систем, файли, звіти аудиту.', 'Everything you provide for the work and everything you receive from us: system access, files, audit reports.')} />
            <div className="cab-shared">
              <span className="sysx-kick">{t('Ваші документи від WEEXP', 'Your documents from WEEXP')}</span>
              {(rec?.sharedDocs || []).length === 0 ? (
                <p className="cab-sub">{rec?.deepModeration?.status === 'accepted'
                  ? t('Готуємо фінальний пакет аудиту — документи зʼявляться тут, щойно менеджер поділиться ними.', 'We are preparing the final audit pack — documents will appear here as soon as the manager shares them.')
                  : t('Тут зʼявляться фінальні документи аудиту, коли менеджер поділиться ними.', 'The final audit documents will appear here once the manager shares them.')}</p>
              ) : (
                <ul className="cab-shared-list">
                  {(rec?.sharedDocs || []).map((d) => (
                    <li key={d.id} className="cab-shared-i">
                      <button className="cab-shared-dl" onClick={async () => { if (!d.path) return; const url = await signTierFile(d.path); if (url) window.open(url, '_blank'); else toast(t('Не вдалося відкрити файл', 'Could not open the file'), 'err'); }}>
                        📄 <b>{d.title}</b>
                      </button>
                      <span className="mono cab-shared-at">{new Date(d.at).toLocaleDateString(t('uk-UA', 'en-GB'))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <AccessGrant user={user} rec={rec} embedded />
            <MarketplaceBlock user={user} rec={rec} onSaved={refreshRec} />
            <FilesBlock user={user} rec={rec} onSaved={refreshRec} />
          </div>
        )}
        {section === 'collab' && <Collab user={user} rec={rec} express={express} onDone={refreshRec} />}
        {section === 'settings' && <Settings user={user} onSignOut={doSignOut} />}
      </main>
    </div>
  );
}

/* ── дрібні блоки ── */
function SecHead({ kick, title, lead }: { kick: string; title: string; lead?: string }) {
  return (
    <header className="cab-sec-head">
      <span className="sysx-kick">{kick}</span>
      <h1 className="sysx-display cab-h1">{title}</h1>
      {lead && <p className="sysx-lead">{lead}</p>}
    </header>
  );
}

/** Клієнтський розділ «Доступи для аудиту»: інструкції як надати + відмітка «надано». */
function AccessGrant({ user, rec, embedded }: { user: DiagUser; rec: DiagRecord | null; embedded?: boolean }) {
  const t = useT();
  const [map, setMap] = useState<Record<string, AccessState>>(rec?.accessLog || {});
  const [openHow, setOpenHow] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const latest = useRef(map); latest.current = map;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { setMap(rec?.accessLog || {}); }, [rec]);
  const persist = (next: Record<string, AccessState>) => {
    setMap(next); latest.current = next; setSaveState('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => { await saveDiag(user, { accessLog: latest.current }); setSaveState('saved'); setTimeout(() => setSaveState('idle'), 1500); }, 700);
  };
  const set = (id: string, patch: Partial<AccessState>) => persist({ ...map, [id]: { ...map[id], ...patch, at: new Date().toISOString() } });
  // GA4 — справжній OAuth-конектор: статус із сервера + старт авторизації Google.
  const [gaInfo, setGaInfo] = useState<{ connected?: boolean; email?: string; properties?: { id: string; name: string; account: string }[]; sites?: { url: string; level: string }[]; error?: string } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/ga4?action=status&u=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        setGaInfo(j);
        const cur = latest.current['AC-01']?.connStatus;
        if (j.connected && cur !== 'on') set('AC-01', { connStatus: 'on', method: 'oauth', status: 'granted' });
        if (!j.connected && !j.error && cur === 'on') set('AC-01', { connStatus: 'off' });
        // Те саме підключення покриває і Search Console (webmasters.readonly)
        if (j.connected && (j.sites || []).length && latest.current['AC-03']?.connStatus !== 'on') set('AC-03', { connStatus: 'on', method: 'oauth', status: 'granted' });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const startGa = async () => {
    try {
      const r = await fetch(`/api/ga4?action=status&u=${encodeURIComponent(user.id)}`);
      const j = await r.json();
      if (j.error === 'not_configured') { toast(t('Конектор ще не налаштовано на сервері — поки що скористайтесь «Надати доступ вручну»', 'The connector is not configured on the server yet — use "Grant manually" for now'), 'err'); return; }
    } catch { /* мережевий збій — все одно пробуємо */ }
    set('AC-01', { method: 'oauth', connStatus: 'progress' });
    window.location.href = `/api/ga4?action=oauth_start&u=${encodeURIComponent(user.id)}`;
  };
  const dropGa = async () => {
    if (!confirm(t('Відключити Google Analytics? Ми втратимо read-only доступ до даних.', 'Disconnect Google Analytics? We lose read-only access to the data.'))) return;
    try { await fetch(`/api/ga4?action=disconnect&u=${encodeURIComponent(user.id)}`); } catch { /* noop */ }
    setGaInfo({ connected: false });
    set('AC-01', { connStatus: 'off', status: undefined });
  };
  const cats = [...new Set(ACCESS_CATALOG.map((a) => a.category))];
  const granted = ACCESS_CATALOG.filter((a) => ['granted', 'verified'].includes(map[a.id]?.status || '')).length;

  return (
    <div className={embedded ? 'cab-acc-embedded' : 'cab-sec'}>
      {!embedded && <SecHead kick={t('Доступи', 'Access')} title={t('Доступи для аудиту', 'Access for the audit')} lead={t('Щоб ми провели повний аудит, надайте доступ до систем одним зі способів. Ми лише переглядаємо дані — нічого не змінюємо й не публікуємо.', 'To run the full audit, grant access to your systems in one of the ways below. We only view the data — we never change or publish anything.')} />}
      <div className="cab-acc-banner">
        {t('Найшвидше — додайте', 'Fastest — add')} <b>{AUDIT_EMAIL}</b> {t('як Viewer / Analyst (для вивантажень даних —', 'as Viewer / Analyst (for data exports —')} <b>{DATA_EMAIL}</b>{t('). Або підключіть конектор (OAuth), або вивантажте файл. Способи доповнюють один одного — оберіть зручний для кожної системи.', '). Or connect via OAuth, or upload a file. The methods complement each other — pick whichever is convenient per system.')}
      </div>
      <div className="cab-acc-sum">
        <b>{t('Надано', 'Granted')}: {granted}/{ACCESS_CATALOG.length}</b>
        {saveState !== 'idle' && <span className="mono cab-acc-save">{saveState === 'saving' ? t('збереження…', 'saving…') : t('✓ збережено', '✓ saved')}</span>}
      </div>
      {cats.map((cat) => (
        <div key={cat} className="cab-acc-cat">
          <span className="cab-acc-cat-h mono">{cat}</span>
          {ACCESS_CATALOG.filter((a) => a.category === cat).map((a) => {
            const s = map[a.id] || {};
            const done = ['granted', 'verified'].includes(s.status || '');
            const conn = s.connStatus || 'off';
            const hasConn = a.methods.includes('oauth');
            const howKey = openHow?.startsWith(a.id) ? openHow.slice(a.id.length + 1) : null;
            const toggleHow = (kind: 'view' | 'conn') => setOpenHow(openHow === `${a.id}:${kind}` ? null : `${a.id}:${kind}`);
            return (
              <div key={a.id} className={'cab-acc-card' + (done ? ' is-done' : '')}>
                <div className="cab-acc-top">
                  <div className="cab-acc-name"><b>{a.system}</b><span className="cab-acc-why">{a.why}</span></div>
                  <button className={'cab-acc-toggle' + (done ? ' on' : '')} onClick={() => set(a.id, { status: done ? undefined : 'granted' })}>
                    {done ? t('✓ Надано', '✓ Granted') : t('Позначити «надано»', 'Mark as granted')}
                  </button>
                </div>
                <div className="cab-acc-methods">
                  {hasConn && (
                    <>
                      <button className={'cab-acc-conn st-' + conn} onClick={() => { if (a.id === 'AC-01') { if (conn === 'on') toggleHow('conn'); else void startGa(); } else if (conn === 'off') { set(a.id, { method: 'oauth', connStatus: 'progress' }); setOpenHow(`${a.id}:conn`); } else { toggleHow('conn'); } }}>
                        {conn === 'off' ? t('Підключити конектор', 'Connect') + ' →' : CONN_STATUS_LABEL[conn]}
                      </button>
                      {conn !== 'off' && (
                        <select className="cab-acc-connsel mono" value={conn} onChange={(e) => set(a.id, { connStatus: e.target.value as AccessState['connStatus'] })} aria-label={t('Статус конектора', 'Connector status')}>
                          {(['off', 'progress', 'on', 'error'] as const).map((k) => <option key={k} value={k}>{CONN_STATUS_LABEL[k]}</option>)}
                        </select>
                      )}
                    </>
                  )}
                  <button className={'cab-acc-m' + (s.method === 'view' ? ' on' : '')} onClick={() => { set(a.id, { method: 'view' }); setOpenHow(`${a.id}:view`); }}>{t('Надати доступ вручну', 'Grant manually')}</button>
                  {a.methods.includes('upload') && <button className={'cab-acc-m' + (s.method === 'upload' ? ' on' : '')} onClick={() => set(a.id, { method: 'upload' })}>{ACCESS_METHOD_LABEL.upload}</button>}
                </div>
                <div className="cab-acc-hows">
                  {a.viewHow && <button className="cab-acc-how mono" onClick={() => toggleHow('view')}>{howKey === 'view' ? '▾' : '▸'} {t('Як надати доступ', 'How to grant access')}</button>}
                  {hasConn && a.connectorHow && <button className="cab-acc-how mono" onClick={() => toggleHow('conn')}>{howKey === 'conn' ? '▾' : '▸'} {t('Як підключити конектор', 'How to connect')}</button>}
                </div>
                {howKey === 'view' && a.viewHow && <p className="cab-acc-how-t">{a.viewHow}</p>}
                {howKey === 'conn' && a.connectorHow && <p className="cab-acc-how-t">{a.connectorHow}</p>}
                {a.id === 'AC-01' && gaInfo?.connected && (
                  <p className="cab-acc-how-t cab-ga-ok">
                    ✓ {t('Підключено акаунт', 'Connected account')}: <b>{gaInfo.email || '—'}</b>
                    {(gaInfo.properties || []).length > 0 && <> · {t('властивості', 'properties')}: {(gaInfo.properties || []).slice(0, 3).map((pp) => pp.name).join(', ')}{(gaInfo.properties || []).length > 3 ? '…' : ''}</>}
                    {(gaInfo.sites || []).length > 0 && <> · Search Console: {(gaInfo.sites || []).length} {t('сайт(и)', 'site(s)')}</>}
                    {' · '}<button className="cab-ga-drop" onClick={dropGa}>{t('відключити', 'disconnect')}</button>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Динамічний блок «Маркетплейси»: + Додати маркетплейс → площадка · що потрібно · статус. */
function MarketplaceBlock({ user, rec, onSaved }: { user: DiagUser; rec: DiagRecord | null; onSaved: () => void }) {
  const t = useT();
  const [rows, setRows] = useState<MarketplaceAccess[]>(rec?.marketplaces || []);
  useEffect(() => { setRows(rec?.marketplaces || []); }, [rec]);
  const persist = async (next: MarketplaceAccess[]) => { setRows(next); await saveDiag(user, { marketplaces: next }); onSaved(); };
  const add = () => void persist([...rows, { id: `mp-${Date.now()}`, name: '', status: 'none', at: new Date().toISOString() }]);
  const upd = (id: string, patch: Partial<MarketplaceAccess>) => void persist(rows.map((r) => (r.id === id ? { ...r, ...patch, at: new Date().toISOString() } : r)));
  const del = (id: string) => void persist(rows.filter((r) => r.id !== id));
  const ST: Record<NonNullable<MarketplaceAccess['status']>, string> = { none: t('Не додано', 'Not added'), wait: t('Очікується', 'Pending'), granted: t('Доступ надано', 'Access granted') };
  return (
    <div className="cab-acc-cat">
      <span className="cab-acc-cat-h mono">Marketplace</span>
      {rows.length === 0 && <p className="cab-sub">{t('Додайте маркетплейси, на яких продаєте — для кожного вкажемо, що саме потрібно.', 'Add the marketplaces you sell on — for each we specify exactly what is needed.')}</p>}
      {rows.map((r) => (
        <div key={r.id} className={'cab-acc-card cab-mp-row' + (r.status === 'granted' ? ' is-done' : '')}>
          <select value={MARKETPLACE_PRESETS.includes(r.name) ? r.name : (r.name ? '__custom' : '')} onChange={(e) => upd(r.id, { name: e.target.value === '__custom' ? (r.name && !MARKETPLACE_PRESETS.includes(r.name) ? r.name : ' ') : e.target.value })}>
            <option value="">{t('— маркетплейс —', '— marketplace —')}</option>
            {MARKETPLACE_PRESETS.map((m) => <option key={m} value={m}>{m}</option>)}
            <option value="__custom">{t('Інший…', 'Other…')}</option>
          </select>
          {(!MARKETPLACE_PRESETS.includes(r.name) && r.name !== '') && (
            <input value={r.name.trim()} onChange={(e) => upd(r.id, { name: e.target.value || ' ' })} placeholder={t('Назва майданчика', 'Marketplace name')} />
          )}
          <select value={r.scope || ''} onChange={(e) => upd(r.id, { scope: e.target.value })}>
            <option value="">{t('— що потрібно —', '— what is needed —')}</option>
            {MARKETPLACE_SCOPES.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
          </select>
          <select className={'cab-mp-st st-' + (r.status || 'none')} value={r.status || 'none'} onChange={(e) => upd(r.id, { status: e.target.value as MarketplaceAccess['status'] })}>
            {(Object.keys(ST) as (keyof typeof ST)[]).map((k) => <option key={k} value={k}>{ST[k]}</option>)}
          </select>
          <button type="button" className="cab-del" onClick={() => del(r.id)} aria-label={t('Прибрати', 'Remove')}>✕</button>
        </div>
      ))}
      <button type="button" className="sysx-cta" onClick={add}>+ {t('Додати маркетплейс', 'Add marketplace')}</button>
    </div>
  );
}

/** Динамічні файли: управлінська звітність і вивантаження. Тип · назва · період · файл · статус. */
function FilesBlock({ user, rec, onSaved }: { user: DiagUser; rec: DiagRecord | null; onSaved: () => void }) {
  const t = useT();
  const [rows, setRows] = useState<ClientFile[]>(rec?.clientFiles || []);
  const [busy, setBusy] = useState<string | null>(null);
  const seeded = useRef(false);
  useEffect(() => { setRows(rec?.clientFiles || []); }, [rec]);
  const persist = async (next: ClientFile[]) => { setRows(next); await saveDiag(user, { clientFiles: next }); onSaved(); };
  // Вичерпний чекліст: обовʼязкові файли зʼявляються самі зі статусом «Очікується».
  useEffect(() => {
    if (seeded.current || !rec) return;
    const have = new Set((rec.clientFiles || []).map((r) => r.reqId).filter(Boolean));
    const missing = REQUIRED_FILES.filter((rf) => !have.has(rf.reqId));
    if (missing.length === 0) { seeded.current = true; return; }
    seeded.current = true;
    void persist([
      ...(rec.clientFiles || []),
      ...missing.map((rf) => ({ id: `cf-${rf.reqId}`, reqId: rf.reqId, group: rf.group, type: rf.type, title: rf.title, period: rf.period, why: rf.why, status: 'wait' as const, at: new Date().toISOString() })),
    ]);
  }, [rec]); // eslint-disable-line react-hooks/exhaustive-deps
  const add = (group: ClientFile['group']) => void persist([...rows, { id: `cf-${Date.now()}`, group, status: 'wait', at: new Date().toISOString() }]);
  const upd = (id: string, patch: Partial<ClientFile>) => void persist(rows.map((r) => (r.id === id ? { ...r, ...patch, at: new Date().toISOString() } : r)));
  const del = (id: string) => void persist(rows.filter((r) => r.id !== id));
  const pick = (row: ClientFile) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      setBusy(row.id);
      const r = await uploadTierFile(user, 'client-files', f);
      setBusy(null);
      if (r.ok && r.path) { upd(row.id, { path: r.path, status: 'uploaded', title: row.title || f.name }); toast(t('✓ Файл завантажено', '✓ File uploaded')); }
      else toast(r.error || t('Не вдалося завантажити файл', 'Upload failed'), 'err');
    };
    inp.click();
  };
  const groupRows = (group: ClientFile['group'], types: string[], title: string, lead: string) => {
    const g = rows.filter((r) => r.group === group);
    const done = g.filter((r) => r.status === 'uploaded').length;
    return (
    <div className="cab-acc-cat">
      <span className="cab-acc-cat-h mono">{title} · {done}/{g.length}</span>
      <p className="cab-sub">{lead}</p>
      {rows.filter((r) => r.group === group).map((r) => (
        <div key={r.id} className={'cab-acc-card cab-file-row' + (r.status === 'uploaded' ? ' is-done' : '') + (r.reqId ? ' is-req' : '')}>
          <select value={r.type || ''} onChange={(e) => upd(r.id, { type: e.target.value })}>
            <option value="">{t('— тип —', '— type —')}</option>
            {types.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <input value={r.title || ''} onChange={(e) => upd(r.id, { title: e.target.value })} placeholder={t('Назва документа', 'Document name')} />
          <input value={r.period || ''} onChange={(e) => upd(r.id, { period: e.target.value })} placeholder={t('Період: 01.01–31.12.2025', 'Period')} />
          <button type="button" className={'cab-file-up' + (r.status === 'uploaded' ? ' on' : '')} onClick={() => pick(r)} disabled={busy === r.id}>
            {busy === r.id ? t('Завантаження…', 'Uploading…') : r.status === 'uploaded' ? t('✓ Завантажено · замінити', '✓ Uploaded · replace') : t('⬆ Завантажити файл', '⬆ Upload file')}
          </button>
          <span className={'cab-file-st mono st-' + (r.status || 'wait')}>{r.status === 'uploaded' ? t('Завантажено', 'Uploaded') : t('Очікується', 'Pending')}</span>
          {r.reqId
            ? <span className="cab-file-req mono" title={r.why || ''}>{t('обовʼязковий', 'required')}</span>
            : <button type="button" className="cab-del" onClick={() => del(r.id)} aria-label={t('Прибрати', 'Remove')}>✕</button>}
          {r.why && <span className="cab-file-why mono">{r.why}</span>}
        </div>
      ))}
      <button type="button" className="sysx-cta" onClick={() => add(group)}>+ {t('Додати файл', 'Add file')}</button>
    </div>
    );
  };
  return (
    <>
      {groupRows('report', REPORT_TYPES, t('Управлінська звітність', 'Management reporting'), t('P&L, Cash Flow, звіти по продажах/маржі/категоріях/каналах — усе, чим ви реально керуєте.', 'P&L, Cash Flow, sales/margin/category/channel reports — whatever you actually manage by.'))}
      {groupRows('export', EXPORT_TYPES, t('Вивантаження / файли', 'Exports / files'), t('Замовлення за 24 міс, залишки, собівартість — сирі дані для розрахунків.', 'Orders for 24 months, stock, costs — the raw data for calculations.'))}
    </>
  );
}

/** Стан глибокого аудиту з даних клієнта — одна точка правди для Огляду та Моїх аудитів. */
type DeepState = 'none' | 'requested' | 'data' | 'rejected' | 'granted' | 'started' | 'done';
function deepStateOf(rec: DiagRecord | null): DeepState {
  const vals = Object.values(rec?.funnel?.tierStatus || {}) as TierStatus[];
  const started = Boolean(rec?.stage3 && Object.keys(rec.stage3).length > 0);
  if (getProjects(rec).length && (started || vals.includes('granted'))) return 'done';
  if (started) return 'started';
  if (vals.includes('granted')) return 'granted';
  if (vals.includes('data')) return 'data';
  if (vals.includes('rejected')) return 'rejected';
  if (vals.includes('requested')) return 'requested';
  return 'none';
}
function useDeepUi(state: DeepState) {
  const t = useT();
  const M: Record<DeepState, { badge: string; cls: string; cta: string; note: string }> = {
    none: { badge: t('не запрошено', 'not requested'), cls: 'none', cta: t('Почати глибокий аудит →', 'Start the deep audit →'), note: t('Розбір 8 систем магазину, конкурентне поле, юніт-економіка, план під DoD.', 'Analysis of 8 store systems, competitive field, unit economics, plan under DoD.') },
    requested: { badge: t('запит надіслано', 'requested'), cls: 'wait', cta: t('Статус запиту →', 'Request status →'), note: t('Ми отримали ваш запит — менеджер підтвердить доступ найближчим часом.', 'We received your request — a manager will confirm access shortly.') },
    data: { badge: t('потрібні ваші дані', 'your data needed'), cls: 'wait', cta: t('Надати дані →', 'Provide data →'), note: t('Для старту аудиту нам потрібні додаткові дані від вас.', 'We need additional data from you to start the audit.') },
    rejected: { badge: t('відхилено', 'declined'), cls: 'bad', cta: t('Деталі →', 'Details →'), note: t('Запит відхилено — відкрийте деталі, щоб побачити причину.', 'The request was declined — open details to see the reason.') },
    granted: { badge: t('доступ надано', 'access granted'), cls: 'ok', cta: t('Перейти до аудиту →', 'Go to the audit →'), note: t('Доступ відкрито — можна починати глибокий розбір.', 'Access is open — you can start the deep analysis.') },
    started: { badge: t('в роботі', 'in progress'), cls: 'wait', cta: t('Продовжити аудит →', 'Continue the audit →'), note: t('Аудит розпочато — продовжуйте з того місця, де зупинились.', 'The audit is under way — continue where you left off.') },
    done: { badge: t('завершено', 'completed'), cls: 'ok', cta: t('Переглянути аудит →', 'View the audit →'), note: t('Аудит завершено — результати й план уже у роботі.', 'The audit is complete — results and the plan are in motion.') },
  };
  return M[state];
}

function Overview({ express, rec, go }: { express: ExpressAudit | null; rec: DiagRecord | null; go: (s: SectionId) => void }) {
  const t = useT();
  const lp = useLp();
  const deep = deepStateOf(rec);
  const ui = useDeepUi(deep);
  return (
    <section className="cab-sec">
      <SecHead kick={t('Огляд', 'Overview')} title={t('Огляд та шлях', 'Overview & path')} lead={t('Два напрями вашої роботи з WEEXP: експрес-аудит у грошах і глибокий розбір систем. Тут завжди видно наступний крок.', 'The two tracks of your work with WEEXP: the express audit in money and the deep systems analysis. Your next step is always visible here.')} />
      <div className="cab-cards">
        <div className="cab-card cab-card-hero">
          <span className="sysx-kick">{t('Ваш експрес-аудит', 'Your express audit')}</span>
          {express
            ? <><b className="sysx-display cab-big">{eur(express.total)}<i>{t('/ рік', '/ year')}</i></b>
                <span className="mono cab-sub">{t('діапазон', 'range')} {eur(express.range[0])}–{eur(express.range[1])} · Health {express.overallHealth}/100 · {new Date(express.at).toLocaleDateString(t('uk-UA', 'en-GB'))}</span>
                <div className="cab-audit-actions">
                  <button className="sysx-cta is-primary" onClick={() => go('audits')}>{t('Переглянути результат →', 'View result →')}</button>
                  <Link className="sysx-cta" to={lp('/diagnose')}>{t('Перерахувати', 'Recalculate')}</Link>
                </div></>
            : <><b className="sysx-display cab-big cab-big-empty">— €</b>
                <span className="mono cab-sub">{t('експрес-аудит ще не пройдено — ~2 хвилини', 'the express audit has not been taken yet — ~2 minutes')}</span>
                <Link className="sysx-cta is-primary" to={lp('/diagnose')}>{t('Пройти експрес-аудит →', 'Take the express audit →')}</Link></>}
        </div>
        <div className="cab-card">
          <div className="cab-deep-head">
            <span className="sysx-kick">{t('Глибокий аудит', 'Deep audit')}</span>
            <span className={`cab-badge mono tst-${ui.cls}`}>{ui.badge}</span>
          </div>
          <p className="cab-next-d">{ui.note}</p>
          {deep === 'data' && Object.entries(rec?.funnel?.tierReason || {}).map(([k, r]) => r && <p key={k} className="cab-accban-r">{r}</p>)}
          {deep === 'granted' && rec?.funnel?.accessCode && <p className="cab-accban-code mono">{t('код доступу', 'access code')}: {rec.funnel.accessCode}</p>}
          <button className="sysx-cta is-primary" onClick={() => go('deep')}>{ui.cta}</button>
        </div>
      </div>
    </section>
  );
}

/** Друкований підсумок експрес-аудиту: РЕЗУЛЬТАТ (розрахунок → аналіз → дії), не анкета. */
function exportExpressPdf(express: ExpressAudit, email?: string) {
  const w = window.open('', '_blank');
  if (!w) { toast('Дозвольте спливаючі вікна, щоб завантажити PDF', 'err'); return; }
  const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inp = (express.input || {}) as unknown as Record<string, number | string | string[] | undefined>;
  const num = (v: unknown) => (typeof v === 'number' && v > 0 ? v : undefined);
  const symptoms = Array.isArray(inp.symptoms) ? (inp.symptoms as string[]) : [];
  const healthRows = (express.health || []).map((h) => {
    const c = h.score < 45 ? '#F5301C' : h.score < 65 ? '#C58A00' : '#1F6E4E';
    return `<tr><td class="k">${esc(sysLabel(h.key as SysKey, 'uk'))}</td><td style="width:52%"><div style="background:#EEE7D6;height:8px;border-radius:4px"><div style="width:${Math.max(3, Math.min(100, h.score))}%;height:8px;border-radius:4px;background:${c}"></div></div></td><td style="width:56px;text-align:right;font-weight:700;color:${c}">${h.score}</td></tr>`;
  }).join('');
  const leakRows = (express.leaks || []).filter((l) => l.amount > 0).sort((x, y) => y.amount - x.amount)
    .map((l) => `<tr><td class="k">${esc(sysLabel(l.key as SysKey, 'uk'))}</td><td style="text-align:right;font-weight:700">${esc(eur(l.amount))}<span style="color:#6B675E;font-weight:400"> / рік</span></td></tr>`).join('');
  const actions = (express.actions || []).map((k, i) => `<li><b>${i + 1}.</b> ${esc(actionText(k as SysKey, 'uk'))}</li>`).join('');
  const sympChips = symptoms.map((k) => `<span class="chip">${esc(sysLabel(k as SysKey, 'uk'))}</span>`).join('');
  const kv = (rows: [string, unknown][]) => rows.filter(([, v]) => v != null && v !== '').map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const srcRows: [string, unknown][] = [
    ['Оборот / міс', num(inp.monthlyRevenue) ? eur(inp.monthlyRevenue as number) : ''],
    ['Середній чек', num(inp.aov) ? eur(inp.aov as number) : ''],
    ['Конверсія', num(inp.conversion) != null && (inp.conversion as number) > 0 ? `${inp.conversion}%` : ''],
    ['Повторні покупки', num(inp.repeatRate) ? `${inp.repeatRate}%` : ''],
    ['Повернення', num(inp.returnsRate) ? `${inp.returnsRate}%` : ''],
    ['Валова маржа', num(inp.grossMargin) ? `${inp.grossMargin}%` : ''],
    ['CAC', num(inp.cac) ? eur(inp.cac as number) : ''],
  ];
  const html = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Експрес-аудит — результат — WEEXP</title><style>
@page{margin:14mm}body{font-family:"IBM Plex Sans","Segoe UI",system-ui,Arial,sans-serif;color:#141210;margin:0;font-size:12.5px;line-height:1.5}
.bar{height:8px;background:#F5301C}.wrap{padding:24px 30px;max-width:780px}
.top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #141210;padding-bottom:12px;margin-bottom:16px}
.logo{font-weight:800;font-size:22px}.logo span{color:#F5301C}.meta{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#6B675E;text-align:right}
.money{font-size:32px;font-weight:800;margin:8px 0 0}.money i{font-size:13px;color:#6B675E;font-weight:500;font-style:normal}
.sub{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#6B675E;margin:2px 0 14px}
h2{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6B675E;margin:20px 0 8px;border-bottom:1px solid #E3D9C0;padding-bottom:4px}
table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #F0EADB;padding:5px 8px;vertical-align:middle}td.k{width:230px;color:#3d3a35;font-weight:600}
ol{margin:6px 0 0;padding-left:0;list-style:none}ol li{padding:6px 0;border-bottom:1px solid #F0EADB}
.chip{display:inline-block;border:1px solid #E3D9C0;border-radius:100px;padding:3px 10px;margin:0 6px 6px 0;font-size:11.5px}
.verdict{background:#FBF4E4;border-left:3px solid #F5301C;padding:10px 14px;margin-top:10px}
.foot{margin-top:22px;padding-top:10px;border-top:1px solid #E3D9C0;color:#9a9488;font-size:10.5px}
@media print{.noprint{display:none}}
</style></head><body><div class="bar"></div><div class="wrap">
<div class="top"><div><div class="logo">WEEXP<span>.</span></div><div style="font-family:monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6B675E">Експрес-аудит · результат</div></div>
<div class="meta">${email ? esc(email) + '<br>' : ''}пройдено ${esc(new Date(express.at).toLocaleString('uk-UA'))}</div></div>
<button class="noprint" onclick="window.print()" style="margin:8px 0;background:#F5301C;color:#fff;border:0;border-radius:6px;padding:9px 16px;font:inherit;font-weight:600;cursor:pointer">🖨 Друк / зберегти в PDF</button>
<div class="money">${esc(eur(express.total))} <i>/ рік · оцінений витік виторгу</i></div>
<div class="sub">діапазон ${esc(eur(express.range[0]))}–${esc(eur(express.range[1]))} · Business Health ${express.overallHealth}/100</div>
<div class="verdict"><b>Головний висновок:</b> ключова проблема — <b>${esc(sysLabel(express.primary as SysKey, 'uk'))}</b>${express.secondary ? `, друга — <b>${esc(sysLabel(express.secondary as SysKey, 'uk'))}</b>` : ''}. Потенціал зростання = повернення оціненого витоку: почніть із трьох дій нижче.</div>
${healthRows ? `<h2>Здоровʼя 8 систем · оцінка</h2><table>${healthRows}</table>` : ''}
${leakRows ? `<h2>Куди тече виторг · розрахунок</h2><table>${leakRows}</table>` : ''}
${sympChips ? `<h2>Позначені симптоми</h2><div>${sympChips}</div>` : ''}
${actions ? `<h2>Три перші дії · рекомендації</h2><ol>${actions}</ol>` : ''}
<h2>Вихідні показники, надані вами</h2><table>${kv(srcRows)}</table>
<div class="foot">WEEXP — Commerce OS · weexp.agency · Оцінка за наданими даними та бенчмарками ніші; не фінансовий аудит. Точна карта «де саме і чому» — глибокий аудит WEEXP.</div>
</div></body></html>`;
  w.document.open(); w.document.write(html); w.document.close();
}

/** Збережений результат експрес-аудиту — прямо в кабінеті, без повторного проходження. */
function ExpressResultView({ express }: { express: ExpressAudit }) {
  const t = useT();
  const lang = t('uk', 'en') as 'uk' | 'en';
  const symptoms = (Array.isArray((express.input as unknown as { symptoms?: string[] })?.symptoms)
    ? ((express.input as unknown as { symptoms?: string[] }).symptoms as string[]) : []);
  const leaks = (express.leaks || []).filter((l) => l.amount > 0).sort((a, b) => b.amount - a.amount);
  return (
    <div className="cab-exres">
      <div className="cab-exres-verdict">
        <b>{t('Головний висновок:', 'Main takeaway:')}</b> {t('ключова проблема — ', 'the key problem is ')}
        <b>{sysLabel(express.primary as SysKey, lang)}</b>
        {express.secondary ? <>{t(', друга — ', ', second — ')}<b>{sysLabel(express.secondary as SysKey, lang)}</b></> : null}.
      </div>
      {(express.health || []).length > 0 && (
        <div className="cab-exres-block">
          <span className="cab-exres-h mono">{t('Здоровʼя 8 систем', 'Health of 8 systems')}</span>
          {(express.health || []).map((h) => (
            <div key={h.key} className="cab-exres-row">
              <span className="cab-exres-l">{sysLabel(h.key as SysKey, lang)}</span>
              <span className="cab-exres-bar"><i style={{ width: `${Math.max(3, Math.min(100, h.score))}%` }} data-lvl={h.score < 45 ? 'bad' : h.score < 65 ? 'mid' : 'ok'} /></span>
              <b className="cab-exres-v mono">{h.score}</b>
            </div>
          ))}
        </div>
      )}
      {leaks.length > 0 && (
        <div className="cab-exres-block">
          <span className="cab-exres-h mono">{t('Куди тече виторг', 'Where revenue leaks')}</span>
          {leaks.map((l) => (
            <div key={l.key} className="cab-exres-row is-2">
              <span className="cab-exres-l">{sysLabel(l.key as SysKey, lang)}</span>
              <b className="cab-exres-v mono">{eur(l.amount)}<i>{t('/рік', '/yr')}</i></b>
            </div>
          ))}
        </div>
      )}
      {symptoms.length > 0 && (
        <div className="cab-exres-block">
          <span className="cab-exres-h mono">{t('Позначені симптоми', 'Marked symptoms')}</span>
          <div className="cab-ch-row">{symptoms.map((k) => <span key={k} className="cab-chip on">{sysLabel(k as SysKey, lang)}</span>)}</div>
        </div>
      )}
      {(express.actions || []).length > 0 && (
        <div className="cab-exres-block">
          <span className="cab-exres-h mono">{t('Три перші дії', 'First three actions')}</span>
          <ol className="cab-exres-acts">{(express.actions || []).map((k) => <li key={k}>{actionText(k as SysKey, lang)}</li>)}</ol>
        </div>
      )}
      <p className="cab-sub mono">{t('Оцінка за наданими даними; не фінансовий аудит. Точна карта — глибокий аудит.', 'An estimate from your data; not a financial audit. The precise map is the deep audit.')}</p>
    </div>
  );
}

function Audits({ express, rec, user, go, onDelete }: { express: ExpressAudit | null; rec: DiagRecord | null; user: DiagUser; go: (s: SectionId) => void; onDelete: () => void }) {
  const t = useT();
  const lp = useLp();
  const [showRes, setShowRes] = useState(true);
  const deep = deepStateOf(rec);
  const ui = useDeepUi(deep);
  const del = () => { if (typeof window !== 'undefined' && !window.confirm(t('Видалити збережений експрес-аудит?', 'Delete the saved express audit?'))) return; onDelete(); };
  return (
    <section className="cab-sec">
      <SecHead kick={t('Мої аудити', 'My audits')} title={t('Результати та історія', 'Results & history')} lead={t('Архів ваших аудитів і їх результатів. Що робити далі — підказує «Огляд та шлях».', 'The archive of your audits and their results. Your next step lives in “Overview & path”.')} />
      <div className="cab-audits">
        <div className="cab-audit">
          <div className="cab-audit-top"><b>{t('Експрес-аудит', 'Express audit')}</b><span className={`cab-badge mono${express ? ' tst-ok' : ''}`}>{express ? t('пройдено', 'completed') : t('не пройдено', 'not taken')}</span></div>
          {express
            ? <><span className="sysx-display cab-audit-v">{eur(express.total)}<i>{t('/ рік', '/ year')}</i></span>
                <span className="mono cab-sub">{t('пройдено', 'taken')} {new Date(express.at).toLocaleDateString(t('uk-UA', 'en-GB'))} · Health {express.overallHealth}/100 · {t('діапазон', 'range')} {eur(express.range[0])}–{eur(express.range[1])}</span>
                <div className="cab-audit-actions">
                  <button className="sysx-cta is-primary" onClick={() => setShowRes((v) => !v)}>{showRes ? t('Згорнути результат', 'Collapse result') : t('Переглянути результат →', 'View result →')}</button>
                  <button className="sysx-cta" onClick={() => exportExpressPdf(express, user.email)}>{t('Завантажити PDF', 'Download PDF')}</button>
                  <Link className="sysx-cta" to={lp('/diagnose')}>{t('Перерахувати', 'Recalculate')}</Link>
                  <button className="cab-del" onClick={del} aria-label={t('Видалити аудит', 'Delete audit')} title={t('Видалити', 'Delete')}>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6M10 11v6M14 11v6"/></svg>
                    {t('Видалити', 'Delete')}
                  </button>
                </div>
                {showRes && <ExpressResultView express={express} />}</>
            : <><p className="cab-sub">{t('Швидка оцінка втрат за 7 показниками — ~2 хвилини.', 'A quick loss estimate across 7 metrics — ~2 minutes.')}</p><Link className="sysx-cta is-primary" to={lp('/diagnose')}>{t('Пройти експрес-аудит →', 'Take the express audit →')}</Link></>}
        </div>
        <div className="cab-audit">
          <div className="cab-audit-top"><b>{t('Глибокий аудит', 'Deep audit')}</b><span className={`cab-badge mono tst-${ui.cls}`}>{ui.badge}</span></div>
          <p className="cab-sub">{ui.note}</p>
          <div className="cab-audit-actions">
            <button className="sysx-cta is-primary" onClick={() => go('deep')}>{ui.cta}</button>
            {deep === 'done' && <button className="sysx-cta" onClick={() => go('docs')}>{t('Підсумковий звіт →', 'Final report →')}</button>}
          </div>
        </div>
      </div>
    </section>
  );
}

function CompanyForm({ user, rec, onSaved }: { user: DiagUser; rec: DiagRecord | null; onSaved: () => void }) {
  const t = useT();
  const CHANNELS = [t('Власний інтернет-магазин', 'Own online store'), t('Marketplace (Amazon / Allegro / Rozetka…)', 'Marketplaces (Amazon / Allegro / Rozetka…)'), t('Офлайн-магазини', 'Offline stores'), t('Соцмережі / Social Commerce', 'Social commerce'), t('Мобільний застосунок', 'Mobile app'), t('B2B / оптові продажі', 'B2B / wholesale'), t('Дилери / дистрибʼютори', 'Dealers / distributors'), t('Власні sales-команди', 'In-house sales teams'), t('Партнерський канал', 'Partner channel'), 'Email / CRM'];
  const ACQ = ['SEO', 'Google Ads', 'Meta Ads', 'TikTok Ads', 'Email Marketing', 'Social Media / SMM', 'Influencer Marketing', 'Affiliate', 'Marketplace traffic', 'Organic / Direct', 'Referral', t('PR / контент', 'PR / content'), t('Офлайн', 'Offline'), t('Інше', 'Other')];
  const INDUSTRIES = [t('Мода й одяг', 'Fashion & apparel'), t('Косметика й бʼюті', 'Beauty & cosmetics'), t('Електроніка', 'Electronics'), t('Дім і меблі', 'Home & furniture'), t('Дитячі товари', 'Kids'), t('Спорт і активність', 'Sports'), t('Здоровʼя й аптека', 'Health & pharmacy'), t('Продукти й напої', 'Food & beverages'), t('Авто й запчастини', 'Automotive'), t('Прикраси й аксесуари', 'Jewelry & accessories'), t('Хобі та подарунки', 'Hobby & gifts'), t('Цифрові товари / послуги', 'Digital goods / services'), t('B2B / послуги', 'B2B / services'), t('Інше', 'Other')];
  const BIZ_TYPES = ['B2C', 'B2B', 'D2C', 'B2B2C', 'Marketplace', 'Omnichannel', 'Retail', 'E-commerce', 'SaaS', 'Service Business', 'Hybrid'];
  const SIZE_RANGES = [t('до €10k / міс', 'up to €10k / mo'), '€10–50k / міс', '€50–200k / міс', '€200k–1M / міс', '€1M+ / міс'];
  const TEAM_SIZES = ['1–3', '4–10', '11–30', '31–100', '100+'];
  const PLATFORMS = ['Shopify', 'WooCommerce', 'Хорошоп', 'Prom / OLX', 'OpenCart', 'Magento', 'Wix / Tilda', 'Laravel / custom Laravel', t('Custom / самописна платформа', 'Custom-built platform'), t('Інше', 'Other')];

  const [c, setC] = useState<CompanyProfile>({ ...EMPTY_COMPANY, ...(rec?.company || {}) });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);
  const [autosaved, setAutosaved] = useState(false);
  useEffect(() => { setC({ ...EMPTY_COMPANY, ...(rec?.company || {}) }); dirty.current = false; }, [rec]);
  const set = (k: keyof CompanyProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { dirty.current = true; setC((s) => ({ ...s, [k]: e.target.value })); };
  const toggle = (k: 'channels' | 'acqChannels', v: string) => { dirty.current = true; setC((s) => { const a = s[k] || []; return { ...s, [k]: a.includes(v) ? a.filter((x) => x !== v) : [...a, v] }; }); };
  type TeamMate = NonNullable<CompanyProfile['team']>[number];
  const setMate = (i: number, k: keyof TeamMate, v: string) => { dirty.current = true; setC((s) => { const team = [...(s.team || [])]; team[i] = { ...team[i], [k]: v }; return { ...s, team }; }); };
  const addMate = () => { dirty.current = true; setC((s) => ({ ...s, team: [...(s.team || []), {}] })); };
  const delMate = (i: number) => { dirty.current = true; setC((s) => ({ ...s, team: (s.team || []).filter((_, x) => x !== i) })); };
  // Автозбереження: через 1.4с бездіяльності після реальної правки — тихо зберігаємо, нічого не втрачаючи.
  useEffect(() => {
    if (!dirty.current || !c.industry) return;
    const id = setTimeout(async () => { await saveDiag(user, { company: c }); dirty.current = false; onSaved(); setAutosaved(true); setTimeout(() => setAutosaved(false), 1600); }, 1400);
    return () => clearTimeout(id);
  }, [c]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => { setSaving(true); await saveDiag(user, { company: c }); dirty.current = false; setSaving(false); setSaved(true); onSaved(); toast(t('✓ Профіль компанії збережено', '✓ Company profile saved')); setTimeout(() => setSaved(false), 1800); };
  const filled = [c.name, c.industry, c.bizType, c.markets, c.categories, c.sizeRange, c.teamSize, c.platform, c.crmErp].filter(Boolean).length;

  return (
    <section className="cab-sec">
      <SecHead kick={t('Дані компанії', 'Company data')} title={t('Бізнес-профіль', 'Business profile')} lead={t('Що детальніший профіль — то точніший аналіз вашої тематики й глибокий аудит. Заповнюється один раз, дані переносяться далі автоматично.', 'The more detailed the profile, the more precise the analysis of your niche and the deep audit. Fill it once — the data carries forward automatically.')} />

      <div className="cab-formgrp">
        <span className="cab-formgrp-h">{t('Про бізнес', 'About the business')}</span>
        <div className="cab-grid2">
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Назва компанії', 'Company name')}</span><input value={c.name || ''} onChange={set('name')} placeholder={t('Ваш бренд', 'Your brand')} /></label>
          <label className="sysx-inp req"><span className="sysx-inp-l">{t('Сфера бізнесу', 'Industry')} *</span>
            <select value={c.industry || ''} onChange={set('industry')}><option value="">{t('— оберіть —', '— select —')}</option>{INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}</select></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Тип бізнесу', 'Business type')}</span>
            <select value={c.bizType || ''} onChange={set('bizType')}><option value="">{t('— оберіть —', '— select —')}</option>{BIZ_TYPES.map((i) => <option key={i} value={i}>{i}</option>)}</select></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Напрям / чим займаєтесь', 'What you do')}</span><input value={c.model || ''} onChange={set('model')} placeholder={t('коротко про продукт', 'briefly about the product')} /></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Ключові категорії товарів / послуг', 'Key product / service categories')}</span><input value={c.categories || ''} onChange={set('categories')} placeholder={t('напр. взуття, аксесуари', 'e.g. footwear, accessories')} /></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Ніша (деталізація)', 'Niche (detail)')}</span><input value={c.niche || ''} onChange={set('niche')} placeholder={t('вужче про нішу', 'more specific niche')} /></label>
        </div>
      </div>

      <div className="cab-formgrp">
        <span className="cab-formgrp-h">{t('Ринки та масштаб', 'Markets & scale')}</span>
        <div className="cab-grid2">
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Основні ринки / географії', 'Main markets / geographies')}</span><input value={c.markets || ''} onChange={set('markets')} placeholder={t('напр. Україна, ЄС', 'e.g. Ukraine, EU')} /></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Країна / країни роботи', 'Country / countries')}</span><input value={c.countries || ''} onChange={set('countries')} placeholder={t('де продаєте', 'where you sell')} /></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Діапазон обороту', 'Revenue range')}</span>
            <select value={c.sizeRange || ''} onChange={set('sizeRange')}><option value="">{t('— оберіть —', '— select —')}</option>{SIZE_RANGES.map((i) => <option key={i} value={i}>{i}</option>)}</select></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Онлайн-виторг · € / міс', 'Online revenue · € / mo')}</span><input value={c.revenue || ''} onChange={set('revenue')} placeholder={t('напр. 25000', 'e.g. 25000')} /></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Розмір команди', 'Team size')}</span>
            <select value={c.teamSize || ''} onChange={set('teamSize')}><option value="">{t('— оберіть —', '— select —')}</option>{TEAM_SIZES.map((i) => <option key={i} value={i}>{i}</option>)}</select></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Точок продажу / магазинів', 'Points of sale / stores')}</span><input value={c.outlets || ''} onChange={set('outlets')} placeholder={t('якщо є офлайн', 'if any offline')} /></label>
        </div>
      </div>

      <div className="cab-formgrp">
        <span className="cab-formgrp-h">{t('Канали', 'Channels')}</span>
        <div className="cab-ch">
          <span className="sysx-inp-l">{t('Канали продажів', 'Sales channels')}</span>
          <div className="cab-ch-row">{CHANNELS.map((ch) => <button key={ch} type="button" className={`cab-chip${(c.channels || []).includes(ch) ? ' on' : ''}`} onClick={() => toggle('channels', ch)}>{ch}</button>)}</div>
        </div>
        <div className="cab-ch">
          <span className="sysx-inp-l">{t('Канали залучення клієнтів', 'Customer acquisition channels')}</span>
          <div className="cab-ch-row">{ACQ.map((ch) => <button key={ch} type="button" className={`cab-chip${(c.acqChannels || []).includes(ch) ? ' on' : ''}`} onClick={() => toggle('acqChannels', ch)}>{ch}</button>)}</div>
        </div>
      </div>

      <div className="cab-formgrp">
        <span className="cab-formgrp-h">{t('Команда', 'Team')}</span>
        <p className="cab-sub">{t('Хто відповідає за напрями — щоб аудит одразу говорив із правильними людьми.', 'Who owns which area — so the audit talks to the right people from day one.')}</p>
        {(c.team || []).map((m, i) => (
          <div key={i} className="cab-team-row">
            <label className="sysx-inp"><span className="sysx-inp-l">{t('Імʼя', 'Name')}</span><input value={m.name || ''} onChange={(e) => setMate(i, 'name', e.target.value)} placeholder={t('Імʼя', 'Name')} /></label>
            <label className="sysx-inp"><span className="sysx-inp-l">{t('Посада', 'Role')}</span><input value={m.role || ''} onChange={(e) => setMate(i, 'role', e.target.value)} placeholder={t('напр. маркетолог', 'e.g. marketer')} /></label>
            <label className="sysx-inp"><span className="sysx-inp-l">{t('Телефон', 'Phone')}</span><input value={m.phone || ''} onChange={(e) => setMate(i, 'phone', e.target.value)} placeholder="+380…" /></label>
            <label className="sysx-inp"><span className="sysx-inp-l">Email</span><input value={m.email || ''} onChange={(e) => setMate(i, 'email', e.target.value)} placeholder="name@company.com" /></label>
            <button type="button" className="cab-del cab-team-del" onClick={() => delMate(i)} aria-label={t('Прибрати учасника', 'Remove member')}>✕</button>
          </div>
        ))}
        <button type="button" className="sysx-cta cab-team-add" onClick={addMate}>+ {t('Додати учасника', 'Add member')}</button>
      </div>

      <div className="cab-formgrp">
        <span className="cab-formgrp-h">{t('Технології та контакти', 'Tech & contacts')}</span>
        <div className="cab-grid2">
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Сайт', 'Site')}</span><input value={c.site || ''} onChange={set('site')} placeholder="shop.com" /></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Додаткові домени', 'Additional domains')}</span><input value={c.domains || ''} onChange={set('domains')} placeholder={t('через кому', 'comma-separated')} /></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('E-commerce платформа', 'E-commerce platform')}</span>
            <select value={c.platform || ''} onChange={set('platform')}><option value="">{t('— оберіть —', '— select —')}</option>{PLATFORMS.map((i) => <option key={i} value={i}>{i}</option>)}</select></label>
          <label className="sysx-inp"><span className="sysx-inp-l">CRM / ERP</span><input value={c.crmErp || ''} onChange={set('crmErp')} placeholder={t('напр. KeyCRM, 1С, HubSpot', 'e.g. KeyCRM, HubSpot')} /></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Контактна особа', 'Contact person')}</span><input value={c.contactName || ''} onChange={set('contactName')} placeholder={t('Імʼя', 'Name')} /></label>
          <label className="sysx-inp"><span className="sysx-inp-l">{t('Телефон', 'Phone')}</span><input value={c.contactPhone || ''} onChange={set('contactPhone')} placeholder="+380…" /></label>
        </div>
      </div>

      <label className="sysx-inp"><span className="sysx-inp-l">{t('Додаткові коментарі про бізнес', 'Additional notes about the business')}</span><textarea rows={3} value={c.notes || ''} onChange={set('notes')} placeholder={t('Що важливо знати, що болить найбільше…', 'What is important to know, what hurts most…')} /></label>

      <div className="cab-actions">
        <button className="sysx-cta is-primary" onClick={save} disabled={saving || !c.industry}>{saving ? t('Зберігаємо…', 'Saving…') : t('Зберегти профіль', 'Save profile')}</button>
        {!c.industry && <span className="cab-req-hint mono">{t('Вкажіть «Сферу бізнесу» — це головне поле для аналізу.', 'Set “Industry” — the key field for analysis.')}</span>}
        {saved && <span className="cab-saved mono">{t('✓ збережено', '✓ saved')}</span>}
        {autosaved && !saved && <span className="cab-saved mono">{t('✓ автозбережено', '✓ autosaved')}</span>}
        <span className="cab-fill mono">{t('Заповнено ключових полів', 'Key fields filled')}: {filled}/9</span>
      </div>
    </section>
  );
}
/** Таймлайн статусу рівня (C): 4 стадії з датами + SLA/причина. */
function TierTimeline({ status, history, rejectedReason }: { status: TierStatus | 'none'; history?: TierEvent[]; rejectedReason?: string }) {
  const t = useT();
  const STAGES = [
    { key: 'req', label: t('Запит', 'Request') },
    { key: 'check', label: t('Перевірка доступів', 'Access review') },
    { key: 'audit', label: t('Аудит', 'Audit') },
    { key: 'done', label: t('Готово', 'Done') },
  ];
  // мапа статус → активна стадія
  const activeIdx = status === 'none' ? -1 : status === 'requested' || status === 'data' ? 1 : status === 'granted' ? 3 : 1;
  const fmt = (iso?: string) => { if (!iso) return ''; try { const d = new Date(iso); return d.toLocaleDateString(t('uk-UA', 'en-GB'), { day: '2-digit', month: 'short' }); } catch { return ''; } };
  const firstAt = history && history[0]?.at;
  const lastAt = history && history[history.length - 1]?.at;
  if (status === 'none') {
    return <p className="cab-tl-idle mono">{t('Рівень ще не запитано. Надайте доступи нижче та надішліть запит.', 'Level not requested yet. Grant access below and send the request.')}</p>;
  }
  return (
    <div className="cab-tl">
      <ol className="cab-tl-steps">
        {STAGES.map((s, i) => (
          <li key={s.key} className={`cab-tl-step${i <= activeIdx ? ' on' : ''}${i === activeIdx ? ' cur' : ''}${status === 'rejected' && i === 1 ? ' bad' : ''}`}>
            <span className="cab-tl-dot" />
            <span className="cab-tl-l">{s.label}</span>
            {i === 0 && firstAt && <span className="cab-tl-at mono">{fmt(firstAt)}</span>}
            {i === activeIdx && lastAt && <span className="cab-tl-at mono">{fmt(lastAt)}</span>}
          </li>
        ))}
      </ol>
      {status === 'requested' && <span className="cab-tl-sla mono">{t('SLA: підтверджуємо доступи протягом 1 робочого дня.', 'SLA: we confirm access within 1 business day.')}</span>}
      {status === 'data' && <span className="cab-tl-sla mono">{t('Менеджер попросив додаткові дані — доповніть чек-лист і надішліть знову.', 'The manager requested more data — complete the checklist and resend.')}</span>}
      {status === 'granted' && <span className="cab-tl-sla ok mono">{t('Доступ підтверджено — рівень у роботі.', 'Access confirmed — the level is in progress.')}</span>}
      {status === 'rejected' && <span className="cab-tl-sla bad mono">{t('Відхилено.', 'Rejected.')}{rejectedReason ? ` ${rejectedReason}` : ''}</span>}
    </div>
  );
}


/* ── Глибокий аудит: ЄДИНА клієнтська послуга. Клієнт запитує доступ; менеджер
   надає (статус DEEP=granted + код). Після надання відкривається робочий розділ
   (опитувальник → доступи → документи/файли) — Stage3. Tier-и лишаються
   внутрішньою методологією агентства і клієнту НЕ показуються. ── */
const DEEP = 'DEEP';
function deepKey(email: string) { return `weexp:deep-unlocked:${(email || '').toLowerCase()}`; }

function DeepAudit({ user, rec, express, onDone, onClose, go }: { user: DiagUser; rec: DiagRecord | null; express: ExpressAudit | null; onDone: () => void; onClose: () => void; go: (s: SectionId) => void }) {
  const t = useT();
  const status = (rec?.funnel?.tierStatus?.[DEEP] || 'none') as TierStatus | 'none';
  const accessCode = rec?.funnel?.accessCode;
  const [localUnlocked, setLocalUnlocked] = useState<boolean>(() => { try { return localStorage.getItem(deepKey(user.email)) === '1'; } catch { return false; } });
  const granted = status === 'granted' || localUnlocked;
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [showCode, setShowCode] = useState(false);
  // Спільний аудит компанії (Фаза B)
  const [joinCode, setJoinCode] = useState('');
  const [auditId, setAuditId] = useState<string | null>(null);
  const [tpl, setTpl] = useState<AuditTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, AuditAnswer>>({});
  const [extra, setExtra] = useState<ExtraQ[]>([]);
  const [loadingWork, setLoadingWork] = useState(false);
  const [role, setRole] = useState<string>(rec?.funnel?.auditRole || '');

  useEffect(() => {
    if (!granted) return;
    let alive = true; setLoadingWork(true);
    (async () => {
      const template = await loadTemplate();
      const c = (accessCode || joinCode || '').trim().toUpperCase();
      let id: string | null = null;
      if (status === 'granted') {
        const company = rec?.company?.name || (user.email.split('@')[1] || user.email);
        id = await ensureAudit(company, c, template.version);
      } else if (c) {
        id = await findAuditIdByCode(c);
      }
      const ans = id ? await loadAuditAnswers(id) : {};
      const ex = c ? await loadAuditExtra(c) : [];
      if (!alive) return;
      setTpl(template); setAuditId(id); setAnswers(ans); setExtra(ex); setLoadingWork(false);
    })();
    return () => { alive = false; };
  }, [granted, status, accessCode, joinCode]);

  const pickRole = async (r: string) => {
    setRole(r);
    await saveDiag(user, { funnel: { ...(rec?.funnel || {}), auditRole: r } });
    onDone();
  };

  const request = async () => {
    if (status === 'requested' || status === 'granted') return;
    setBusy(true);
    const nextStatus = { ...(rec?.funnel?.tierStatus || {}), [DEEP]: 'requested' as TierStatus };
    const history = { ...(rec?.funnel?.tierHistory || {}) };
    history[DEEP] = [...(history[DEEP] || []), { st: 'requested' as TierStatus, at: new Date().toISOString(), by: 'client' as const }];
    await sendLead({ source: 'cabinet-deep', email: user.email, role: 'cabinet', task: 'Запит на глибокий аудит', comment: rec?.company?.name ? `Компанія: ${rec.company.name} · ${rec.company.site || ''}` : undefined });
    await saveDiag(user, { funnel: { ...(rec?.funnel || {}), deepRequested: true, deepAt: new Date().toISOString(), tierStatus: nextStatus, tierHistory: history } });
    setBusy(false); onDone();
  };
  const matchesPersonal = (v: string) => !!accessCode && v.trim().toUpperCase() === accessCode.trim().toUpperCase();
  const doUnlock = (c: string) => { setJoinCode(c); setErr(''); try { localStorage.setItem(deepKey(user.email), '1'); } catch { /* ignore */ } setLocalUnlocked(true); };
  const unlock = async () => {
    const c = code.trim().toUpperCase();
    if (isValidCode(code) || matchesPersonal(code)) { doUnlock(c); return; }
    // Код компанії від колеги — приєднуємось до спільного аудиту.
    const id = await findAuditIdByCode(c);
    if (id) { doUnlock(c); return; }
    setErr(t('Код недійсний. Попросіть його в менеджера або запросіть доступ вище.', 'Invalid code. Ask your manager for it or request access above.'));
  };

  // Доступ надано → спільний робочий розділ аудиту компанії
  if (granted) {
    return (
      <section className="cab-sec cab-deep-wrap">
        <SecHead kick={t('Глибокий аудит', 'Deep audit')} title={t('Заповнення аудиту', 'Filling in the audit')} lead={t('Спільний аудит компанії: над ним можуть працювати кілька ваших спеціалістів за одним кодом. Кожна відповідь підписується автором і зберігається автоматично.', 'A shared company audit: several of your specialists can work on it with one code. Every answer is signed by its author and saved automatically.')} />
        {loadingWork || !tpl ? <div className="cab-boot mono">{t('Відкриваємо аудит…', 'Opening the audit…')}</div>
          : !auditId ? <p className="cab-auth-err mono">{t('Не вдалося відкрити аудит. Перевірте код або зверніться до менеджера.', 'Could not open the audit. Check the code or contact your manager.')}</p>
          : !role ? (
            <div className="cab-card cab-deep-gate">
              <span className="sysx-kick">{t('Ваша роль у проекті', 'Your role in the project')}</span>
              <p className="cab-next-d">{t('Оберіть роль — від неї залежить, які блоки ви заповнюєте.', 'Pick your role — it defines which blocks you fill in.')}</p>
              <div className="cab-roles">{CLIENT_ROLES.map((r) => <button key={r} className="sysx-cta" onClick={() => pickRole(r)}>{r}</button>)}</div>
            </div>
          )
          : (
            <>
              {/* Модерація: банер стану + кнопка «Надіслати на модерацію» */}
              {rec?.deepModeration?.status === 'accepted' ? (
                <div className="cab-mod-banner is-ok">
                  <b>{t('✓ Відповіді прийнято', '✓ Answers accepted')}</b>
                  <p>{t('Очікуйте підсумки аудиту — фінальні документи зʼявляться у розділі «Документи». Ми повідомимо, щойно все буде готово.', 'Await the audit results — the final documents will appear in the “Documents” section. We will let you know as soon as everything is ready.')}</p>
                  <button className="sysx-cta" onClick={() => go('docs')}>{t('До розділу «Документи» →', 'To “Documents” →')}</button>
                </div>
              ) : rec?.deepModeration?.status === 'clarify' ? (
                <div className="cab-mod-banner is-warn">
                  <b>{t('Уточнюючі питання від менеджера', 'Clarifying questions from your manager')}</b>
                  <p>{rec.deepModeration.note || t('Ми переглянули відповіді — потрібно кілька уточнень. Питання додано у вкладку «Питання» (блок «Уточнення від менеджера»). Після відповіді надішліть анкету повторно.', 'We reviewed your answers — a few clarifications are needed. The questions were added to the “Questions” tab. Re-submit once answered.')}</p>
                </div>
              ) : rec?.deepModeration?.status === 'submitted' ? (
                <div className="cab-mod-banner">
                  <b>{t('Дякуємо! Ваші відповіді на модерації', 'Thank you! Your answers are under review')}</b>
                  <p>{t('Ми перевіряємо повноту даних і повідомимо подальші кроки. Відповіді можна доповнювати — вони зберігаються автоматично.', 'We are checking data completeness and will let you know the next steps. You can still add answers — they save automatically.')}</p>
                </div>
              ) : null}
              <AuditForm user={user} auditId={auditId} template={tpl} initial={answers} role={role} isOwner={status === 'granted'} extra={extra as unknown as Question[]} />
              {rec?.deepModeration?.status !== 'accepted' && (
                <div className="cab-mod-submit">
                  <button className="sysx-cta is-primary" disabled={busy} onClick={async () => {
                    setBusy(true);
                    const prevMod = rec?.deepModeration?.status;
                    await saveDiag(user, { deepModeration: { status: 'submitted', at: new Date().toISOString() } });
                    // Сигнал власнику. Без нього надсилання йшло «в порожнечу»: про
                    // готову анкету менеджер дізнавався, лише зайшовши в адмінку.
                    // Лист не блокує клієнта — відповіді вже збережені вище.
                    void notifyAdmin(
                      `Глибокий аудит: ${rec?.company?.name || user.email} — ${prevMod === 'clarify' ? 'відповіді на уточнення' : prevMod === 'submitted' ? 'оновлені відповіді' : 'анкету надіслано на модерацію'}`,
                      [
                        `Клієнт: ${rec?.company?.name || '—'}`,
                        `Email: ${user.email}`,
                        rec?.company?.site ? `Сайт: ${rec.company.site}` : '',
                        `Відповідей в анкеті: ${Object.keys(answers || {}).length}`,
                        `Подія: ${prevMod === 'clarify' ? 'клієнт відповів на уточнення' : prevMod === 'submitted' ? 'клієнт оновив надіслані відповіді' : 'перше надсилання на модерацію'}`,
                        '',
                        `Адмінка: ${typeof window !== 'undefined' ? window.location.origin : 'https://weexp.agency'}/admin`,
                      ].filter(Boolean).join('\n'),
                    );
                    setBusy(false); onDone();
                    toast(t('✓ Надіслано на модерацію. Ми повідомимо подальші кроки.', '✓ Submitted for review. We will let you know the next steps.'));
                  }}>
                    {rec?.deepModeration?.status === 'clarify' ? t('Надіслати відповіді на уточнення →', 'Send the clarified answers →') : rec?.deepModeration?.status === 'submitted' ? t('Оновити надіслані відповіді →', 'Update the submitted answers →') : t('Надіслати на модерацію →', 'Submit for review →')}
                  </button>
                  <span className="sysx-note mono">{t('Після надсилання менеджер перевірить повноту даних.', 'After submission the manager checks data completeness.')}</span>
                </div>
              )}
            </>
          )}
      </section>
    );
  }

  // До надання доступу — запит + статус
  return (
    <section className="cab-sec">
      <SecHead kick={t('Глибокий аудит', 'Deep audit')} title={t('Повний розбір вашого магазину', 'A full analysis of your store')} lead={t('Глибокий аудит — окрема послуга: опитувальник, безпечні доступи (GA4/CRM/ERP/реклама), документи й файли. Він дає карту «де саме й чому» та план повернення виторгу під Definition of Done. Запросіть доступ — менеджер підтвердить, і тут відкриється робочий розділ.', 'The deep audit is a separate service: a questionnaire, secure access (GA4/CRM/ERP/ads), documents and files. It gives a map of “exactly where and why” and a revenue-recovery plan under a Definition of Done. Request access — the manager confirms it and the working section opens here.')} />

      {express ? (
        <div className="cab-card cab-deep-info">
          <span className="sysx-kick">{t('У вас уже є безкоштовний експрес-аудит', 'You already have a free express audit')}</span>
          <div className="cab-deep-info-row">
            <div><b className="sysx-display cab-big">{eur(express.total)}<i>{t('/ рік', '/ year')}</i></b>
              <span className="mono cab-sub">{t('діапазон', 'range')} {eur(express.range[0])}–{eur(express.range[1])} · Health {express.overallHealth}/100</span></div>
            <button className="sysx-cta" onClick={() => go('audits')}>{t('Дивитись у «Мої аудити» →', 'View in “My audits” →')}</button>
          </div>
          <p className="cab-next-d">{t('Глибокий аудит стартує не з нуля — він підтвердить це число вашими даними й покаже, де саме витікає виторг.', 'The deep audit does not start from scratch — it will confirm this number with your data and show exactly where revenue leaks.')}</p>
        </div>
      ) : (
        <div className="cab-card cab-deep-info">
          <span className="sysx-kick">{t('Спершу — безкоштовний експрес-аудит', 'First — the free express audit')}</span>
          <p className="cab-next-d">{t('Ще не рахували витік? Пройдіть безкоштовний калькулятор — він дасть число за 3 кроки, а глибокий аудит потім стартує вже з ваших даних.', 'Haven’t measured the leak yet? Take the free calculator — it gives a number in 3 steps, and the deep audit then starts from your data.')}</p>
          <div className="cab-actions"><button className="sysx-cta" onClick={() => go('audits')}>{t('До «Мої аудити» →', 'To “My audits” →')}</button></div>
        </div>
      )}

      {status === 'none' && (
        <div className="cab-card cab-deep-gate">
          <span className="sysx-kick">{t('Крок 1 — запит доступу', 'Step 1 — request access')}</span>
          <p className="cab-next-d">{t('Далі за кроками: отримання доступу → опитувальник → доступи → документи й файли → аудит → результат.', 'Then step by step: get access → questionnaire → access → documents and files → audit → result.')}</p>
          <div className="cab-actions"><button className="sysx-cta is-primary" onClick={request} disabled={busy}>{busy ? t('Надсилаємо…', 'Sending…') : t('Запросити глибокий аудит →', 'Request the deep audit →')}</button></div>
        </div>
      )}
      {(status === 'requested' || status === 'data') && (
        <div className="cab-card cab-deep-gate">
          <span className="sysx-kick">{status === 'data' ? t('Потрібні ваші дані', 'Your data is needed') : t('Запит на розгляді', 'Request under review')}</span>
          <TierTimeline status={status} history={rec?.funnel?.tierHistory?.[DEEP]} rejectedReason={rec?.funnel?.tierReason?.[DEEP]} />
          <p className="cab-next-d">{status === 'data' ? (rec?.funnel?.tierReason?.[DEEP] || t('Менеджер попросив додаткові дані — перевірте пошту.', 'The manager requested more data — check your email.')) : t('Менеджер підтвердить доступ — зазвичай протягом 1 робочого дня. Після цього тут відкриється робочий розділ глибокого аудиту.', 'The manager will confirm access — usually within 1 business day. After that the deep-audit working section opens here.')}</p>
        </div>
      )}
      {status === 'rejected' && (
        <div className="cab-card cab-deep-gate">
          <span className="sysx-kick">{t('Запит відхилено', 'Request declined')}</span>
          {rec?.funnel?.tierReason?.[DEEP] && <p className="cab-next-d">{rec.funnel.tierReason[DEEP]}</p>}
          <div className="cab-actions"><button className="sysx-cta" onClick={request} disabled={busy}>{t('Запросити повторно →', 'Request again →')}</button></div>
        </div>
      )}

      <div className="cab-deep-hascode">
        <button className="cab-linkbtn mono" onClick={() => setShowCode((v) => !v)}>{showCode ? '−' : '+'} {t('Маю код від менеджера', 'I have a code from the manager')}</button>
        {showCode && (
          <div className="cab-deep-gate-row">
            <label className="sysx-inp"><span className="sysx-inp-l">Access Code</span>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WEEXP-XXXX" autoComplete="off" onKeyDown={(e) => e.key === 'Enter' && code.trim() && unlock()} /></label>
            <button className="sysx-cta is-primary" onClick={unlock} disabled={!code.trim()}>{t('Активувати →', 'Activate →')}</button>
          </div>
        )}
        {err && <p className="cab-auth-err mono">{err}</p>}
      </div>
    </section>
  );
}

function Collab({ user, rec, express, onDone }: { user: DiagUser; rec: DiagRecord | null; express: ExpressAudit | null; onDone: () => void }) {
  const t = useT();
  const [phone, setPhone] = useState(rec?.company?.contactPhone || '');
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(Boolean(rec?.funnel?.leadAt));
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    const calc = express ? `Експрес-витік ${eur(express.total)}/рік (діапазон ${eur(express.range[0])}–${eur(express.range[1])}), Health ${express.overallHealth}/100` : undefined;
    await sendLead({ source: 'cabinet-collab', email: user.email, phone: phone || undefined, name: rec?.company?.contactName || undefined, store: rec?.company?.site || undefined, task: 'Заявка на співпрацю з кабінету', comment: comment || undefined, calc });
    await saveDiag(user, { funnel: { ...(rec?.funnel || {}), leadAt: new Date().toISOString(), leadContact: phone || user.email } });
    setBusy(false); setSent(true); onDone();
  };
  return (
    <section className="cab-sec">
      <SecHead kick={t('Робота разом', 'Work with us')} title={t('Співпраця та зростання', 'Working together & growth')} lead={t('Готові перетворити знахідки на результат? Залиште заявку — ми підготуємо розбір під вашу ситуацію й покажемо, з чого почати, щоб повернути витік найшвидше.', 'Ready to turn findings into results? Leave a request — we\'ll prepare an analysis for your situation and show you where to start to recover the leak fastest.')} />
      {sent
        ? <div className="cab-card"><span className="sysx-kick">{t('Дякуємо', 'Thank you')}</span><b className="cab-next-t">{t('Заявку прийнято', 'Request received')}</b><p className="cab-next-d">{t(`Ми звʼяжемося з вами на ${user.email}`, `We'll get in touch with you at ${user.email}`)}{rec?.funnel?.leadContact && rec.funnel.leadContact !== user.email ? ` / ${rec.funnel.leadContact}` : ''}. {t('Тим часом можна пройти глибокий аудит — це прискорить розбір.', 'In the meantime you can take the deep audit — it speeds up the analysis.')}</p></div>
        : <div className="cab-collab">
            <label className="sysx-inp"><span className="sysx-inp-l">Email</span><input value={user.email} readOnly /></label>
            <label className="sysx-inp"><span className="sysx-inp-l">{t('Телефон · необовʼязково', 'Phone · optional')}</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380…" /></label>
            <label className="sysx-inp"><span className="sysx-inp-l">{t('Коментар', 'Comment')}</span><textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('Що хочете вирішити насамперед?', 'What do you want to solve first?')} /></label>
            <div className="cab-actions"><button className="sysx-cta is-primary" onClick={send} disabled={busy}>{busy ? t('Надсилаємо…', 'Sending…') : t('Залишити заявку →', 'Leave a request →')}</button></div>
          </div>}
    </section>
  );
}

function Settings({ user, onSignOut }: { user: DiagUser; onSignOut: () => void }) {
  const t = useT();
  return (
    <section className="cab-sec">
      <SecHead kick={t('Налаштування', 'Settings')} title={t('Акаунт', 'Account')} />
      <div className="cab-card">
        <span className="sysx-kick">{t('Email входу', 'Sign-in email')}</span><b className="cab-next-t">{user.email}</b>
        <span className="mono cab-sub">{isCloudUser(user) ? t('Хмарний акаунт — дані синхронізуються між пристроями.', 'Cloud account — data syncs across your devices.') : t('Локальний режим — дані в цьому браузері. Додайте ключі Supabase для синхронізації.', 'Local mode — data in this browser. Add Supabase keys to sync.')}</span>
        <div className="cab-actions"><button className="sysx-cta" onClick={onSignOut}>{t('Вийти з акаунта', 'Sign out of account')}</button></div>
      </div>
    </section>
  );
}

function Soon({ title, lead }: { title: string; lead: string }) {
  const t = useT();
  return (
    <section className="cab-sec">
      <SecHead kick={t('Скоро', 'Soon')} title={title} lead={lead} />
      <div className="cab-soon-box"><span className="mono">{t('Розділ у розробці — вмикається на наступному кроці воронки.', 'Section in development — unlocks at the next funnel step.')}</span></div>
    </section>
  );
}
