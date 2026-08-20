import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  authenticate, currentUser, signOut, loadDiag, saveDiag, CONFIGURED, isCloudUser,
  type DiagUser, type DiagRecord, type CompanyProfile,
} from '@/lib/supa';
import { getExpressAudit, clearExpressAudit, buildJourney, type ExpressAudit } from './cabinetData';
import { eur } from './lossModel';
import { sendLead } from '@/lib/leads';
import { isValidCode } from '@/lib/access';
import { useT, useLp } from '@/i18n';
import './system.css';
import './cabinet.css';

// Глибокий аудит (Tier-2) — окремий зрілий інструмент; кабінет його ВБУДОВУЄ як
// розділ, а не дублює. Ліниво, щоб важкий чанк не тягнувся на вхід у кабінет.
const Stage3 = lazy(() => import('@/system/Stage3').then((m) => ({ default: m.Stage3 })));

/**
 * /cabinet — персональний кабінет клієнта як ХАБ однієї воронки. Зліва — розділи,
 * праворуч — вміст. Реюз реальної авторизації (Supabase з локальним фолбеком) і
 * зберігання (DiagRecord). Гроші/витік беруться з калькулятора (lossModel), а
 * глибокий аудит — вбудований Stage3. Це не окремі інструменти, а кроки системи.
 */
type SectionId = 'overview' | 'company' | 'audits' | 'deep' | 'findings' | 'access' | 'docs' | 'collab' | 'settings';
type NavItem = { id: SectionId; label: string; soon?: boolean };

const EMPTY_COMPANY: CompanyProfile = { name: '', site: '', niche: '', revenue: '', channels: [], contactName: '', contactPhone: '', notes: '' };

export function Cabinet() {
  const t = useT();
  const lp = useLp();
  const nav = useNavigate();
  const NAV: { group: string; items: NavItem[] }[] = [
    { group: t('Огляд', 'Overview'), items: [{ id: 'overview', label: t('Огляд та шлях', 'Overview & path') }, { id: 'audits', label: t('Мої аудити', 'My audits') }] },
    { group: t('Дані', 'Data'), items: [{ id: 'company', label: t('Дані компанії', 'Company data') }, { id: 'access', label: t('Доступи · T1–T4', 'Access · T1–T4') }] },
    { group: t('Розбір', 'Analysis'), items: [{ id: 'deep', label: t('Глибокий аудит', 'Deep audit') }, { id: 'findings', label: t('Знахідки та план', 'Findings & plan'), soon: true }, { id: 'docs', label: t('Документи', 'Documents'), soon: true }] },
    { group: t('Робота разом', 'Work with us'), items: [{ id: 'collab', label: t('Співпраця', 'Work with us') }, { id: 'settings', label: t('Налаштування', 'Settings') }] },
  ];
  const [user, setUser] = useState<DiagUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [rec, setRec] = useState<DiagRecord | null>(null);
  const [express, setExpress] = useState<ExpressAudit | null>(null);
  const [section, setSection] = useState<SectionId>('overview');

  // логін
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [authErr, setAuthErr] = useState('');

  useEffect(() => { setExpress(getExpressAudit()); }, []);
  useEffect(() => {
    currentUser().then((u) => {
      setUser(u); setChecking(false);
      if (u) loadDiag(u).then(setRec);
    });
  }, []);

  const journey = useMemo(() => buildJourney({ loggedIn: Boolean(user), rec, express }), [user, rec, express]);

  const doAuth = async () => {
    setBusy(true); setAuthErr('');
    const r = await authenticate(email.trim(), pass);
    setBusy(false);
    if (r.user) { setUser(r.user); loadDiag(r.user).then(setRec); if (r.notice) setAuthErr(r.notice); }
    else setAuthErr(r.error || t('Не вдалося увійти. Спробуйте ще раз.', 'Could not sign in. Please try again.'));
  };
  const doSignOut = async () => { await signOut(); setUser(null); setRec(null); setSection('overview'); };
  const refreshRec = () => { if (user) loadDiag(user).then(setRec); };

  /* ── Ворота входу ── */
  if (checking) return <div className="sysx cab"><div className="cab-boot mono">{t('Завантаження кабінету…', 'Loading cabinet…')}</div></div>;
  if (!user) {
    return (
      <div className="sysx cab cab-gate">
        <div className="cab-gate-card">
          <div className="cab-gate-left">
            <Link to={lp('/')} className="cab-gate-back mono">← {t('на сайт', 'to site')}</Link>
            <span className="cab-gate-badge">{t('Особистий кабінет WEEXP', 'WEEXP client cabinet')}</span>
            <h1 className="sysx-display cab-gate-h">{t('Вхід у ваш', 'Sign in to your')}<br /><span className="hl">{t('кабінет', 'cabinet')}</span></h1>
            <p className="sysx-lead">{t('Один вхід — усі дані в одному місці. Повторний вхід тим самим email відкриває збережений розбір.', 'One sign-in — all your data in one place. Signing back in with the same email opens your saved analysis.')}</p>
            <ul className="cab-gate-gets">
              <li>{t('Експрес-витік із калькулятора — збережений', 'Express leak from the calculator — saved')}</li>
              <li>{t('Профіль компанії та безпечні доступи', 'Company profile and secure access')}</li>
              <li>{t('Глибокий аудит за кодом і план під DoD', 'Deep audit by code and a plan under DoD')}</li>
            </ul>
          </div>
          <div className="cab-gate-right">
            <div className="cab-form">
              <span className="sysx-kick">{t('Вхід / реєстрація', 'Sign in / sign up')}</span>
              <label className="sysx-inp"><span className="sysx-inp-l">Email</span>
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@shop.com" /></label>
              <label className="sysx-inp"><span className="sysx-inp-l">{t('Пароль · мін. 6 символів', 'Password · min. 6 characters')}</span>
                <input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" onKeyDown={(e) => e.key === 'Enter' && email && pass.length >= 6 && doAuth()} /></label>
              {authErr && <p className="cab-auth-err mono">{authErr}</p>}
              <button className="sysx-cta is-primary" onClick={doAuth} disabled={busy || !email || pass.length < 6}>{busy ? t('Заходимо…', 'Signing in…') : t('Увійти / створити кабінет →', 'Sign in / create cabinet →')}</button>
              <p className="sysx-note mono">{CONFIGURED ? t('Захищений вхід. Дані синхронізуються між пристроями.', 'Secure sign-in. Data syncs across your devices.') : t('Демо-режим: дані зберігаються локально в цьому браузері.', 'Demo mode: data is stored locally in this browser.')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cur = journey.find((j) => j.current);

  return (
    <div className="sysx cab">
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
          <button className="cab-signout mono" onClick={doSignOut}>{t('Вийти', 'Sign out')}</button>
        </div>
      </aside>

      {/* Контент */}
      <main className="cab-main">
        {section === 'overview' && <Overview journey={journey} express={express} cur={cur?.label} go={setSection} />}
        {section === 'audits' && <Audits express={express} rec={rec} go={setSection} onDelete={() => setExpress(getExpressAudit())} />}
        {section === 'company' && <CompanyForm user={user} rec={rec} onSaved={refreshRec} />}
        {section === 'access' && <Access user={user} rec={rec} onDone={refreshRec} />}
        {section === 'deep' && <DeepAudit user={user} express={express} onClose={() => setSection('overview')} go={setSection} />}
        {section === 'findings' && <Soon title={t('Знахідки та дорожня карта', 'Findings & roadmap')} lead={t('Тут зʼявляться підтверджені знахідки глибокого аудиту й план під Definition of Done: що робити, у якому порядку і який ефект. Розділ вмикається після завершення Tier-2 розбору.', 'Confirmed findings from the deep audit and a plan under a Definition of Done will appear here: what to do, in what order and what the effect is. The section unlocks after the Tier-2 analysis is complete.')} />}
        {section === 'docs' && <Soon title={t('Документи', 'Documents')} lead={t('PDF-звіти, робочі аркуші й матеріали розбору складатимуться сюди — щоб усе було в одному місці й доступне команді.', 'PDF reports, worksheets and analysis materials will gather here — so everything is in one place and available to the team.')} />}
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

function Overview({ journey, express, cur, go }: { journey: ReturnType<typeof buildJourney>; express: ExpressAudit | null; cur?: string; go: (s: SectionId) => void }) {
  const t = useT();
  const lp = useLp();
  return (
    <section className="cab-sec">
      <SecHead kick={t('Огляд', 'Overview')} title={t('Ваш шлях у WEEXP', 'Your path in WEEXP')} lead={cur ? t(`Ви зараз на кроці «${cur}». Кабінет веде вас від першого числа до плану — крок за кроком.`, `You are on the “${cur}” step. The cabinet guides you from the first number to the plan — step by step.`) : t('Усі кроки пройдено — час до співпраці та зростання.', 'All steps complete — time to work together and grow.')} />
      <div className="cab-cards">
        <div className="cab-card cab-card-hero">
          <span className="sysx-kick">{t('Ваш експрес-витік', 'Your express leak')}</span>
          {express
            ? <><b className="sysx-display cab-big">{eur(express.total)}<i>{t('/ рік', '/ year')}</i></b>
                <span className="mono cab-sub">{t('діапазон', 'range')} {eur(express.range[0])}–{eur(express.range[1])} · Health {express.overallHealth}/100</span>
                <button className="sysx-cta" onClick={() => go('audits')}>{t('Розбір числа →', 'Break down the number →')}</button></>
            : <><b className="sysx-display cab-big cab-big-empty">— €</b>
                <span className="mono cab-sub">{t('калькулятор ще не рахував ваш витік', 'the calculator has not measured your leak yet')}</span>
                <Link className="sysx-cta is-primary" to={lp('/diagnose')}>{t('Порахувати витік →', 'Measure the leak →')}</Link></>}
        </div>
        <div className="cab-card">
          <span className="sysx-kick">{t('Наступна дія', 'Next action')}</span>
          <b className="cab-next-t">{cur || t('Співпраця', 'Work with us')}</b>
          <p className="cab-next-d">{cur === 'Профіль компанії' ? t('Заповніть дані магазину — вони уточнюють оцінку та готують глибокий аудит.', 'Fill in your store data — it refines the estimate and prepares the deep audit.') : cur === 'Глибокий аудит' ? t('Пройдіть Tier-2 розбір систем — від числа до карти «де саме й чому».', 'Go through the Tier-2 systems analysis — from a number to a map of “exactly where and why”.') : t('Продовжуйте по шляху нижче — кожен крок годує наступний.', 'Continue along the path below — each step feeds the next.')}</p>
          <button className="sysx-cta is-primary" onClick={() => go(cur === 'Профіль компанії' ? 'company' : cur === 'Глибокий аудит' ? 'deep' : 'audits')}>{t('Перейти →', 'Go →')}</button>
        </div>
      </div>

      <div className="cab-journey">
        <span className="sysx-kick">{t('Наскрізний шлях', 'End-to-end path')}</span>
        <ol className="cab-steps">
          {journey.map((s, i) => (
            <li key={s.id} className={`cab-step${s.done ? ' done' : ''}${s.current ? ' current' : ''}`}>
              <span className="cab-step-dot">{s.done ? '✓' : i + 1}</span>
              <span className="cab-step-b"><b>{s.label}</b><i className="mono">{s.hint}</i></span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Audits({ express, rec, go, onDelete }: { express: ExpressAudit | null; rec: DiagRecord | null; go: (s: SectionId) => void; onDelete: () => void }) {
  const t = useT();
  const lp = useLp();
  const deepDone = Boolean(rec?.stage3 && Object.keys(rec.stage3).length > 0);
  const del = () => { if (typeof window !== 'undefined' && !window.confirm(t('Видалити збережений експрес-аудит?', 'Delete the saved express audit?'))) return; clearExpressAudit(); onDelete(); };
  return (
    <section className="cab-sec">
      <SecHead kick={t('Мої аудити', 'My audits')} title={t('Ваші розбори', 'Your analyses')} lead={t('Тут зібрані ваші аудити — від швидкого експрес-витоку до глибокого Tier-2 розбору. Кожен наступний рівень уточнює попередній, а не рахує наново.', 'Your audits gathered here — from the quick express leak to the deep Tier-2 analysis. Each next level refines the previous one rather than starting over.')} />
      <div className="cab-audits">
        <div className="cab-audit">
          <div className="cab-audit-top"><b>{t('Експрес-витік', 'Express leak')}</b><span className="cab-badge mono">{express ? t('готово', 'ready') : t('не запускали', 'not run')}</span></div>
          {express
            ? <><span className="sysx-display cab-audit-v">{eur(express.total)}<i>{t('/ рік', '/ year')}</i></span>
                <span className="mono cab-sub">{t('від', 'from')} {new Date(express.at).toLocaleDateString(t('uk-UA', 'en-GB'))} · Health {express.overallHealth}/100 · {t('діапазон', 'range')} {eur(express.range[0])}–{eur(express.range[1])}</span>
                <div className="cab-audit-actions">
                  <Link className="sysx-cta" to={lp('/diagnose')}>{t('Перерахувати →', 'Recalculate →')}</Link>
                  <button className="cab-del mono" onClick={del} aria-label={t('Видалити аудит', 'Delete audit')} title={t('Видалити', 'Delete')}>🗑 {t('Видалити', 'Delete')}</button>
                </div></>
            : <><p className="cab-sub">{t('Швидка оцінка втрат за 7 показниками — ~2 хвилини.', 'A quick loss estimate across 7 metrics — ~2 minutes.')}</p><Link className="sysx-cta is-primary" to={lp('/diagnose')}>{t('Порахувати витік →', 'Measure the leak →')}</Link></>}
        </div>
        <div className="cab-audit">
          <div className="cab-audit-top"><b>{t('Глибокий аудит · Tier-2', 'Deep audit · Tier-2')}</b><span className="cab-badge mono">{deepDone ? t('у роботі', 'in progress') : t('не почато', 'not started')}</span></div>
          <p className="cab-sub">{t('Розбір 8 систем магазину, конкурентне поле, юніт-економіка, план під DoD.', 'Analysis of 8 store systems, competitive field, unit economics, plan under DoD.')}</p>
          <button className="sysx-cta is-primary" onClick={() => go('deep')}>{deepDone ? t('Продовжити розбір →', 'Continue analysis →') : t('Почати глибокий аудит →', 'Start deep audit →')}</button>
        </div>
      </div>
    </section>
  );
}

function CompanyForm({ user, rec, onSaved }: { user: DiagUser; rec: DiagRecord | null; onSaved: () => void }) {
  const t = useT();
  const CHANNELS = ['Instagram', t('Сайт / магазин', 'Site / store'), t('Розетка / marketplace', 'Marketplace'), 'Google Ads', 'Meta Ads', 'Email / CRM', t('Офлайн', 'Offline')];
  const [c, setC] = useState<CompanyProfile>({ ...EMPTY_COMPANY, ...(rec?.company || {}) });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setC({ ...EMPTY_COMPANY, ...(rec?.company || {}) }); }, [rec]);
  const set = (k: keyof CompanyProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setC((s) => ({ ...s, [k]: e.target.value }));
  const toggleCh = (ch: string) => setC((s) => ({ ...s, channels: (s.channels || []).includes(ch) ? (s.channels || []).filter((x) => x !== ch) : [...(s.channels || []), ch] }));
  const save = async () => { setSaving(true); await saveDiag(user, { company: c }); setSaving(false); setSaved(true); onSaved(); setTimeout(() => setSaved(false), 1800); };
  return (
    <section className="cab-sec">
      <SecHead kick={t('Дані компанії', 'Company data')} title={t('Профіль магазину', 'Store profile')} lead={t('Базові дані про бізнес. Вони уточнюють оцінку витоку й готують ґрунт для глибокого аудиту — щоб не питати те саме двічі.', 'Basic data about the business. It refines the leak estimate and prepares the ground for the deep audit — so we don\'t ask the same thing twice.')} />
      <div className="cab-grid2">
        <label className="sysx-inp"><span className="sysx-inp-l">{t('Назва компанії', 'Company name')}</span><input value={c.name || ''} onChange={set('name')} placeholder={t('Ваш бренд', 'Your brand')} /></label>
        <label className="sysx-inp"><span className="sysx-inp-l">{t('Сайт', 'Site')}</span><input value={c.site || ''} onChange={set('site')} placeholder="shop.com" /></label>
        <label className="sysx-inp"><span className="sysx-inp-l">{t('Ніша', 'Niche')}</span><input value={c.niche || ''} onChange={set('niche')} placeholder={t('одяг · косметика · електроніка…', 'apparel · cosmetics · electronics…')} /></label>
        <label className="sysx-inp"><span className="sysx-inp-l">{t('Онлайн-виторг · € / міс', 'Online revenue · € / mo')}</span><input value={c.revenue || ''} onChange={set('revenue')} placeholder={t('напр. 25000', 'e.g. 25000')} /></label>
        <label className="sysx-inp"><span className="sysx-inp-l">{t('Контактна особа', 'Contact person')}</span><input value={c.contactName || ''} onChange={set('contactName')} placeholder={t('Імʼя', 'Name')} /></label>
        <label className="sysx-inp"><span className="sysx-inp-l">{t('Телефон', 'Phone')}</span><input value={c.contactPhone || ''} onChange={set('contactPhone')} placeholder="+380…" /></label>
      </div>
      <div className="cab-ch">
        <span className="sysx-inp-l">{t('Канали продажів', 'Sales channels')}</span>
        <div className="cab-ch-row">{CHANNELS.map((ch) => <button key={ch} className={`cab-chip${(c.channels || []).includes(ch) ? ' on' : ''}`} onClick={() => toggleCh(ch)}>{ch}</button>)}</div>
      </div>
      <label className="sysx-inp"><span className="sysx-inp-l">{t('Нотатки · що болить найбільше', 'Notes · what hurts most')}</span><textarea rows={3} value={c.notes || ''} onChange={set('notes')} placeholder={t('Коротко про головну задачу…', 'Briefly about the main task…')} /></label>
      <div className="cab-actions">
        <button className="sysx-cta is-primary" onClick={save} disabled={saving}>{saving ? t('Зберігаємо…', 'Saving…') : t('Зберегти профіль', 'Save profile')}</button>
        {saved && <span className="cab-saved mono">{t('✓ збережено', '✓ saved')}</span>}
      </div>
    </section>
  );
}

function Access({ user, rec, onDone }: { user: DiagUser; rec: DiagRecord | null; onDone: () => void }) {
  const t = useT();
  const DEPTHS = [
    { id: 'T1', title: t('T1 · Зовнішній обхід', 'T1 · External sweep'), cap: t('до 35%', 'up to 35%'), desc: t('Тільки публічні дані: сайт, ціни, канали. Без ваших доступів.', 'Public data only: site, prices, channels. Without your access.') },
    { id: 'T2', title: t('T2 · + Аналітика', 'T2 · + Analytics'), cap: t('до 55%', 'up to 55%'), desc: t('GA4/GSC read-only: реальний трафік, конверсії, джерела.', 'GA4/GSC read-only: real traffic, conversions, sources.') },
    { id: 'T3', title: t('T3 · + Бізнес-дані', 'T3 · + Business data'), cap: t('до 78%', 'up to 78%'), desc: t('Вивантаження CRM/ERP: когорти, повторні, юніт-економіка.', 'CRM/ERP exports: cohorts, repeats, unit economics.') },
    { id: 'T4', title: t('T4 · Живі доступи', 'T4 · Live access'), cap: t('до 92%', 'up to 92%'), desc: t('Рекламні кабінети, CMS: максимальна достовірність і план.', 'Ad accounts, CMS: maximum confidence and a plan.') },
  ];
  const [depth, setDepth] = useState(rec?.funnel?.deepDepth || 'T2');
  // Кожен рівень має ВЛАСНИЙ статус доступу (незалежно один від одного).
  const [requested, setRequested] = useState<string[]>(rec?.funnel?.deepTiers || []);
  const [busy, setBusy] = useState('');
  const isReq = (id: string) => requested.includes(id);
  const request = async (id: string) => {
    if (isReq(id)) return;
    setBusy(id);
    const next = [...requested, id];
    await sendLead({ source: 'cabinet-access', email: user.email, role: 'cabinet', task: `Запит доступів для глибокого аудиту, рівень ${id}`, comment: rec?.company?.name ? `Компанія: ${rec.company.name} · ${rec.company.site || ''}` : undefined });
    await saveDiag(user, { funnel: { ...(rec?.funnel || {}), deepRequested: true, deepAt: new Date().toISOString(), deepDepth: id, deepTiers: next } });
    setRequested(next); setBusy(''); onDone();
  };
  const cur = DEPTHS.find((d) => d.id === depth)!;
  return (
    <section className="cab-sec">
      <SecHead kick={t('Доступи до рівнів T1–T4', 'Access to levels T1–T4')} title={t('Запросіть доступ до глибших рівнів', 'Request access to deeper levels')} lead={t('Тут ви запитуєте доступ до додаткових рівнів аудиту й надаєте дані для їх підготовки. Кожен наступний рівень додає джерело даних і підвищує достовірність висновку (не роздуває суму втрат). Оберіть рівень і запитайте доступ — ми надішлемо інструкції з безпечного надання (read-only, за потреби — з обмеженим строком). Статус кожного рівня — окремий.', 'Here you request access to additional audit levels and provide the data to prepare them. Each next level adds a data source and raises the confidence of the conclusion (it does not inflate the loss figure). Pick a level and request access — we\'ll send instructions for granting it safely (read-only, time-limited if needed). Each level has its own status.')} />
      <div className="cab-depths">
        {DEPTHS.map((d) => (
          <button key={d.id} className={`cab-depth${depth === d.id ? ' on' : ''}${isReq(d.id) ? ' is-req' : ''}`} onClick={() => setDepth(d.id)}>
            <div className="cab-depth-top"><b>{d.title}</b>{isReq(d.id) ? <span className="cab-badge cab-badge-ok mono">{t('✓ запитано', '✓ requested')}</span> : <span className="cab-badge mono">{d.cap}</span>}</div>
            <span className="cab-sub">{d.desc}</span>
          </button>
        ))}
      </div>
      <div className="cab-actions">
        {isReq(depth)
          ? <span className="cab-saved mono">{t(`✓ Доступ до ${depth} запитано — інструкції надішлемо на ${user.email}. Оберіть інший рівень, щоб запросити його.`, `✓ Access to ${depth} requested — we'll send instructions to ${user.email}. Pick another level to request it.`)}</span>
          : <button className="sysx-cta is-primary" onClick={() => request(depth)} disabled={busy === depth}>{busy === depth ? t('Надсилаємо…', 'Sending…') : t(`Запросити доступ до ${depth} →`, `Request access to ${depth} →`)}</button>}
        {requested.length > 0 && !isReq(depth) && <span className="cab-sub mono">{t('Уже запитано:', 'Already requested:')} {requested.join(', ')}</span>}
      </div>
    </section>
  );
}

/* ── Глибокий аудит: ОКРЕМА гілка, доступна лише за кодом (від входу).
   Без коду — інфо-вікно (що це + дані безкоштовного експрес-аудиту, якщо є) і поле коду.
   За кодом — повний Stage3-розбір (свої кроки: питання → доступи → файли). ── */
function deepKey(email: string) { return `weexp:deep-unlocked:${(email || '').toLowerCase()}`; }

function DeepAudit({ user, express, onClose, go }: { user: DiagUser; express: ExpressAudit | null; onClose: () => void; go: (s: SectionId) => void }) {
  const t = useT();
  const [unlocked, setUnlocked] = useState<boolean>(() => { try { return localStorage.getItem(deepKey(user.email)) === '1'; } catch { return false; } });
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const unlock = () => {
    if (!isValidCode(code)) { setErr(t('Код недійсний. Попросіть його в менеджера або замовте аудит.', 'Invalid code. Ask your manager for it or order the audit.')); return; }
    setErr(''); try { localStorage.setItem(deepKey(user.email), '1'); } catch { /* ignore */ }
    setUnlocked(true);
  };

  if (unlocked) {
    return (
      <section className="cab-sec cab-deep-wrap">
        <SecHead kick={t('Глибокий аудит · Tier-2', 'Deep audit · Tier-2')} title={t('Розбір систем магазину', 'Analysis of your store systems')} lead={t('Доступ відкрито. Заповнюйте блоки по секціях: питання → доступи → файли. На виході — інтерактивний Tier-2 звіт: зрілість, конкурентне поле, маркетинг/фінанси, позиціонування. Прогрес зберігається автоматично.', 'Access unlocked. Fill in the blocks section by section: questions → access → files. The output is an interactive Tier-2 report: maturity, competitive field, marketing/finance, positioning. Progress is saved automatically.')} />
        <Suspense fallback={<div className="cab-boot mono">{t('Відкриваємо розбір…', 'Opening analysis…')}</div>}>
          <Stage3 embedded onClose={onClose} />
        </Suspense>
      </section>
    );
  }

  return (
    <section className="cab-sec">
      <SecHead kick={t('Глибокий аудит · за кодом', 'Deep audit · code-gated')} title={t('Окрема гілка глибокого розбору', 'A separate deep-analysis branch')} lead={t('Глибокий аудит — це окремий, платний рівень: свої питання, безпечні доступи (GA4/CRM/ERP/реклама) і файли. Він дає карту «де саме й чому» та план повернення виторгу під Definition of Done. Розділ відкривається за кодом від менеджера.', 'The deep audit is a separate, paid level: its own questions, secure access (GA4/CRM/ERP/ads) and files. It gives a map of “exactly where and why” and a revenue-recovery plan under a Definition of Done. The section unlocks with a code from your manager.')} />

      {/* Інфо-вікно про безкоштовний експрес-аудит (якщо клієнт уже його пройшов) */}
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

      {/* Ворота коду */}
      <div className="cab-card cab-deep-gate">
        <span className="sysx-kick">{t('Активувати глибокий аудит', 'Activate the deep audit')}</span>
        <p className="cab-next-d">{t('Введіть код від менеджера, щоб відкрити гілку глибокого аудиту з питаннями, доступами й файлами.', 'Enter the code from your manager to open the deep-audit branch with questions, access and files.')}</p>
        <div className="cab-deep-gate-row">
          <label className="sysx-inp"><span className="sysx-inp-l">Access Code</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WEEXP-XXXX" autoComplete="off"
              onKeyDown={(e) => e.key === 'Enter' && code.trim() && unlock()} /></label>
          <button className="sysx-cta is-primary" onClick={unlock} disabled={!code.trim()}>{t('Активувати →', 'Activate →')}</button>
        </div>
        {err && <p className="cab-auth-err mono">{err}</p>}
        <p className="sysx-note mono">{t('Немає коду? Замовте аудит на «Формати і ціни» або в розділі «Співпраця».', 'No code? Order the audit on “Formats & pricing” or in the “Work with us” section.')}</p>
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
