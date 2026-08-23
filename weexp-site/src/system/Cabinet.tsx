import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  currentUser, signOut, loadDiag, saveDiag, CONFIGURED, isCloudUser,
  signInWithGoogle, onAuth, signTierFile,
  ensureAudit, findAuditIdByCode, loadAuditAnswers, loadAuditExtra, getProjects,
  type DiagUser, type DiagRecord, type CompanyProfile, type TierStatus, type TierEvent, type AuditAnswer, type ExtraQ, type AccessState,
} from '@/lib/supa';
import { ACCESS_CATALOG, AUDIT_EMAIL, DATA_EMAIL, ACCESS_METHOD_LABEL, type AccessMethod } from '@/data/accessCatalog';
import { AuditForm } from './AuditForm';
import { ProjectView } from './ProjectView';
import { loadTemplate, CLIENT_ROLES, type AuditTemplate, type Question } from './auditTemplate';
import { getExpressAudit, clearExpressAudit, syncExpressToAccount, type ExpressAudit } from './cabinetData';
import { eur, sysLabel, type SysKey } from './lossModel';
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
            return (
              <div key={a.id} className={'cab-acc-card' + (done ? ' is-done' : '')}>
                <div className="cab-acc-top">
                  <div className="cab-acc-name"><b>{a.system}</b><span className="cab-acc-why">{a.why}</span></div>
                  <button className={'cab-acc-toggle' + (done ? ' on' : '')} onClick={() => set(a.id, { status: done ? undefined : 'granted' })}>
                    {done ? t('✓ Надано', '✓ Granted') : t('Позначити «надано»', 'Mark as granted')}
                  </button>
                </div>
                <div className="cab-acc-methods">
                  {a.methods.map((m: AccessMethod) => (
                    <button key={m} className={'cab-acc-m' + (s.method === m ? ' on' : '')} onClick={() => set(a.id, { method: m })}>{ACCESS_METHOD_LABEL[m]}</button>
                  ))}
                  {a.viewHow && <button className="cab-acc-how mono" onClick={() => setOpenHow(openHow === a.id ? null : a.id)}>{openHow === a.id ? t('▾ як надати', '▾ how to grant') : t('▸ як надати', '▸ how to grant')}</button>}
                </div>
                {openHow === a.id && a.viewHow && <p className="cab-acc-how-t">{a.viewHow}</p>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
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
    none: { badge: t('не запрошено', 'not requested'), cls: 'none', cta: t('Запросити доступ →', 'Request access →'), note: t('Розбір 8 систем магазину, конкурентне поле, юніт-економіка, план під DoD.', 'Analysis of 8 store systems, competitive field, unit economics, plan under DoD.') },
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

/** Друкований підсумок експрес-аудиту (→ PDF через діалог друку браузера). */
function exportExpressPdf(express: ExpressAudit, email?: string) {
  const w = window.open('', '_blank');
  if (!w) { toast('Дозвольте спливаючі вікна, щоб завантажити PDF', 'err'); return; }
  const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inp = (express.input || {}) as unknown as Record<string, number | undefined>;
  const kv = (rows: [string, unknown][]) => rows.filter(([, v]) => v != null && v !== '').map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const rows: [string, unknown][] = [
    ['Дата проходження', new Date(express.at).toLocaleString('uk-UA')],
    ['Business Health', `${express.overallHealth}/100`],
    ['Оцінений витік / рік', eur(express.total)],
    ['Діапазон', `${eur(express.range[0])}–${eur(express.range[1])}`],
    ['Ключова проблема', sysLabel(express.primary as SysKey, 'uk')],
    ['Друга проблема', express.secondary ? sysLabel(express.secondary as SysKey, 'uk') : ''],
    ['Оборот / міс', inp.monthlyRevenue ? eur(inp.monthlyRevenue) : ''],
    ['Середній чек', inp.aov ? eur(inp.aov) : ''],
    ['Конверсія', inp.conversion != null ? `${inp.conversion}%` : ''],
    ['Повторні покупки', inp.repeatRate != null ? `${inp.repeatRate}%` : ''],
  ];
  const html = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Експрес-аудит — WEEXP</title><style>
@page{margin:16mm}body{font-family:"IBM Plex Sans","Segoe UI",system-ui,Arial,sans-serif;color:#141210;margin:0;font-size:13px;line-height:1.55}
.bar{height:8px;background:#F5301C}.wrap{padding:26px 30px;max-width:760px}
.top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #141210;padding-bottom:12px;margin-bottom:18px}
.logo{font-weight:800;font-size:22px}.logo span{color:#F5301C}.meta{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#6B675E;text-align:right}
.money{font-size:30px;font-weight:800;margin:10px 0 2px}.money i{font-size:13px;color:#6B675E;font-weight:500;font-style:normal}
table{border-collapse:collapse;width:100%;margin-top:12px}td{border-bottom:1px solid #EEE7D6;padding:6px 8px}td.k{width:220px;color:#6B675E;font-weight:600}
.foot{margin-top:26px;padding-top:12px;border-top:1px solid #E3D9C0;color:#9a9488;font-size:10.5px}
@media print{.noprint{display:none}}
</style></head><body><div class="bar"></div><div class="wrap">
<div class="top"><div><div class="logo">WEEXP<span>.</span></div><div style="font-family:monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6B675E">Експрес-аудит · результат</div></div>
<div class="meta">${email ? esc(email) + '<br>' : ''}сформовано ${esc(new Date().toLocaleString('uk-UA'))}</div></div>
<button class="noprint" onclick="window.print()" style="margin:10px 0;background:#F5301C;color:#fff;border:0;border-radius:6px;padding:9px 16px;font:inherit;font-weight:600;cursor:pointer">🖨 Друк / зберегти в PDF</button>
<div class="money">${esc(eur(express.total))} <i>/ рік · оцінений витік</i></div>
<table>${kv(rows)}</table>
<div class="foot">WEEXP — Commerce OS · weexp.agency · Експрес-оцінка за 7 показниками; глибокий аудит уточнює цифри й дає план дій.</div>
</div></body></html>`;
  w.document.open(); w.document.write(html); w.document.close();
}

function Audits({ express, rec, user, go, onDelete }: { express: ExpressAudit | null; rec: DiagRecord | null; user: DiagUser; go: (s: SectionId) => void; onDelete: () => void }) {
  const t = useT();
  const lp = useLp();
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
                  <Link className="sysx-cta is-primary" to={lp('/diagnose')}>{t('Переглянути результат →', 'View result →')}</Link>
                  <button className="sysx-cta" onClick={() => exportExpressPdf(express, user.email)}>{t('Завантажити PDF', 'Download PDF')}</button>
                  <Link className="sysx-cta" to={lp('/diagnose')}>{t('Перерахувати', 'Recalculate')}</Link>
                  <button className="cab-del" onClick={del} aria-label={t('Видалити аудит', 'Delete audit')} title={t('Видалити', 'Delete')}>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6M10 11v6M14 11v6"/></svg>
                    {t('Видалити', 'Delete')}
                  </button>
                </div></>
            : <><p className="cab-sub">{t('Швидка оцінка втрат за 7 показниками — ~2 хвилини.', 'A quick loss estimate across 7 metrics — ~2 minutes.')}</p><Link className="sysx-cta is-primary" to={lp('/diagnose')}>{t('Пройти експрес-аудит →', 'Take the express audit →')}</Link></>}
        </div>
        <div className="cab-audit">
          <div className="cab-audit-top"><b>{t('Глибокий аудит', 'Deep audit')}</b><span className={`cab-badge mono tst-${ui.cls}`}>{ui.badge}</span></div>
          <p className="cab-sub">{ui.note}</p>
          <div className="cab-audit-actions">
            <button className="sysx-cta is-primary" onClick={() => go('deep')}>{deep === 'none' ? t('Запросити доступ →', 'Request access →') : ui.cta}</button>
            {deep === 'done' && <button className="sysx-cta" onClick={() => go('docs')}>{t('Підсумковий звіт →', 'Final report →')}</button>}
          </div>
        </div>
      </div>
    </section>
  );
}

function CompanyForm({ user, rec, onSaved }: { user: DiagUser; rec: DiagRecord | null; onSaved: () => void }) {
  const t = useT();
  const CHANNELS = ['Instagram', 'TikTok', t('Сайт / магазин', 'Site / store'), t('Marketplace (Rozetka, Prom…)', 'Marketplace'), t('Офлайн / ретейл', 'Offline / retail'), 'Email / CRM', t('Опт / B2B', 'Wholesale / B2B')];
  const ACQ = ['SEO', 'Google Ads', 'Meta Ads', 'TikTok Ads', t('Інфлюенсери', 'Influencers'), 'Email / CRM', t('Реферали', 'Referrals'), 'Marketplace', t('Офлайн', 'Offline'), t('PR / контент', 'PR / content')];
  const INDUSTRIES = [t('Мода й одяг', 'Fashion & apparel'), t('Косметика й бʼюті', 'Beauty & cosmetics'), t('Електроніка', 'Electronics'), t('Дім і меблі', 'Home & furniture'), t('Дитячі товари', 'Kids'), t('Спорт і активність', 'Sports'), t('Здоровʼя й аптека', 'Health & pharmacy'), t('Продукти й напої', 'Food & beverages'), t('Авто й запчастини', 'Automotive'), t('Прикраси й аксесуари', 'Jewelry & accessories'), t('Хобі та подарунки', 'Hobby & gifts'), t('Цифрові товари / послуги', 'Digital goods / services'), t('B2B / послуги', 'B2B / services'), t('Інше', 'Other')];
  const BIZ_TYPES = ['B2C', 'B2B', 'D2C', 'Marketplace', 'Hybrid'];
  const SIZE_RANGES = [t('до €10k / міс', 'up to €10k / mo'), '€10–50k / міс', '€50–200k / міс', '€200k–1M / міс', '€1M+ / міс'];
  const TEAM_SIZES = ['1–3', '4–10', '11–30', '31–100', '100+'];
  const PLATFORMS = ['Shopify', 'WooCommerce', 'Хорошоп', 'Prom / OLX', 'OpenCart', 'Magento', 'Wix / Tilda', t('Кастомна', 'Custom'), t('Інше', 'Other')];

  const [c, setC] = useState<CompanyProfile>({ ...EMPTY_COMPANY, ...(rec?.company || {}) });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);
  const [autosaved, setAutosaved] = useState(false);
  useEffect(() => { setC({ ...EMPTY_COMPANY, ...(rec?.company || {}) }); dirty.current = false; }, [rec]);
  const set = (k: keyof CompanyProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { dirty.current = true; setC((s) => ({ ...s, [k]: e.target.value })); };
  const toggle = (k: 'channels' | 'acqChannels', v: string) => { dirty.current = true; setC((s) => { const a = s[k] || []; return { ...s, [k]: a.includes(v) ? a.filter((x) => x !== v) : [...a, v] }; }); };
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
                    await saveDiag(user, { deepModeration: { status: 'submitted', at: new Date().toISOString() } });
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
