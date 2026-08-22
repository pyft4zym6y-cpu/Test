import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  currentUser, signOut, loadDiag, saveDiag, CONFIGURED, isCloudUser,
  registerWithEmail, signInWithEmail, resendConfirmation, signInWithGoogle, onAuth,
  ensureAudit, findAuditIdByCode, loadAuditAnswers, loadAuditExtra, getProjects,
  type DiagUser, type DiagRecord, type CompanyProfile, type TierStatus, type TierEvent, type AuditAnswer, type ExtraQ,
} from '@/lib/supa';
import { AuditForm } from './AuditForm';
import { ProjectView } from './ProjectView';
import { loadTemplate, CLIENT_ROLES, type AuditTemplate, type Question } from './auditTemplate';
import { getExpressAudit, clearExpressAudit, buildJourney, syncExpressToAccount, type ExpressAudit } from './cabinetData';
import { eur } from './lossModel';
import { sendLead } from '@/lib/leads';
import { isValidCode } from '@/lib/access';
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

// Cloudflare Turnstile (капча). Вмикається лише за наявності ключа (env), інакше — no-op.
const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || '';
declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void } }
}
function Turnstile({ siteKey, resetKey, onToken }: { siteKey: string; resetKey: number; onToken: (t: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string>('');
  useEffect(() => {
    const SID = 'cf-turnstile-js';
    const mount = () => {
      if (!window.turnstile || !box.current || widget.current) return;
      widget.current = window.turnstile.render(box.current, {
        sitekey: siteKey, theme: 'light',
        callback: (t: string) => onToken(t),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    };
    if (!document.getElementById(SID)) {
      const s = document.createElement('script');
      s.id = SID; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.defer = true;
      s.onload = mount; document.head.appendChild(s);
    } else { mount(); }
  }, [siteKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (resetKey && window.turnstile && widget.current) { window.turnstile.reset(widget.current); onToken(''); } }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div ref={box} className="cab-captcha" />;
}

export function Cabinet() {
  const t = useT();
  const lp = useLp();
  const nav = useNavigate();
  const NAV: { group: string; items: NavItem[] }[] = [
    { group: t('Огляд', 'Overview'), items: [{ id: 'overview', label: t('Огляд та шлях', 'Overview & path') }, { id: 'audits', label: t('Мої аудити', 'My audits') }] },
    { group: t('Дані', 'Data'), items: [{ id: 'company', label: t('Дані компанії', 'Company data') }] },
    { group: t('Розбір', 'Analysis'), items: [{ id: 'deep', label: t('Глибокий аудит', 'Deep audit') }, { id: 'findings', label: t('Знахідки та план', 'Findings & plan'), soon: true }, { id: 'docs', label: t('Документи', 'Documents'), soon: true }] },
    { group: t('Ведення', 'Delivery'), items: [{ id: 'project', label: t('Мій проект', 'My project') }] },
    { group: t('Робота разом', 'Work with us'), items: [{ id: 'collab', label: t('Співпраця', 'Work with us') }, { id: 'settings', label: t('Налаштування', 'Settings') }] },
  ];
  const [user, setUser] = useState<DiagUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [rec, setRec] = useState<DiagRecord | null>(null);
  const [express, setExpress] = useState<ExpressAudit | null>(null);
  const [section, setSection] = useState<SectionId>('overview');

  // логін / реєстрація
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [confirmSent, setConfirmSent] = useState('');   // email, на який надіслано лист підтвердження
  const [resendMsg, setResendMsg] = useState('');
  const [captcha, setCaptcha] = useState('');           // токен Turnstile (якщо капча увімкнена)
  const [captchaReset, setCaptchaReset] = useState(0);  // лічильник для скидання віджета після спроби
  const captchaOn = Boolean(TURNSTILE_SITE_KEY);
  const bumpCaptcha = () => { setCaptcha(''); setCaptchaReset((n) => n + 1); };

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
  useEffect(() => onAuth((u) => { if (u) { setUser(u); hydrate(u); setConfirmSent(''); } }), []);

  const journey = useMemo(() => buildJourney({ loggedIn: Boolean(user), rec, express }), [user, rec, express]);

  const enter = (u: DiagUser) => { setUser(u); hydrate(u); };
  const doLogin = async () => {
    setBusy(true); setAuthErr(''); setResendMsg('');
    const r = await signInWithEmail(email.trim(), pass, captcha || undefined);
    setBusy(false); bumpCaptcha();
    if (r.user) enter(r.user);
    else if (r.confirm) { setConfirmSent(r.confirm); }
    else setAuthErr(r.error || t('Не вдалося увійти. Перевірте email і пароль.', 'Could not sign in. Check your email and password.'));
  };
  const doRegister = async () => {
    setBusy(true); setAuthErr(''); setResendMsg('');
    const r = await registerWithEmail(email.trim(), pass, captcha || undefined);
    setBusy(false); bumpCaptcha();
    if (r.confirm) setConfirmSent(r.confirm);          // увімкнено підтвердження email → лист надіслано
    else if (r.user) enter(r.user);                     // сесія одразу (демо або без Confirm email)
    else if (r.error && /sending confirmation|confirmation email|error sending|smtp/i.test(r.error))
      setAuthErr(t('Не вдалося надіслати лист підтвердження. Скористайтесь швидким входом через Google — ваш експрес-аудит підтягнеться автоматично.', 'Could not send the confirmation email. Use quick Google sign-in — your express audit will be linked automatically.'));
    else setAuthErr(r.error || t('Не вдалося зареєструватися. Спробуйте ще раз.', 'Could not sign up. Please try again.'));
  };
  const doAuth = () => (mode === 'register' ? doRegister() : doLogin());
  const doResend = async () => {
    setResendMsg(''); setBusy(true);
    const r = await resendConfirmation(confirmSent);
    setBusy(false);
    setResendMsg(r.ok ? t('Лист надіслано ще раз. Перевірте пошту.', 'Email sent again. Check your inbox.') : (r.error || t('Не вдалося надіслати. Спробуйте пізніше.', 'Could not send. Try again later.')));
  };
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
            {express && (
              <div className="cab-gate-saved">
                <span className="cab-gate-saved-ic" aria-hidden="true">✓</span>
                <div>
                  <b>{t('Ваш експрес-аудит збережено', 'Your express audit is saved')}: {eur(express.total)}<i>{t('/рік', '/yr')}</i></b>
                  <span className="mono">{t('Зареєструйтесь — і він закріпиться за акаунтом. Проходити аудит заново не треба.', 'Sign up — and it will be linked to your account. No need to redo the audit.')}</span>
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
            {confirmSent ? (
              /* ── Стан «підтвердіть email» ── */
              <div className="cab-form cab-confirm">
                <span className="cab-confirm-ic" aria-hidden="true">✉</span>
                <span className="sysx-kick">{t('Підтвердіть email', 'Confirm your email')}</span>
                <p className="cab-confirm-p">{t('Ми надіслали лист на', 'We sent a message to')} <b>{confirmSent}</b>. {t('Відкрийте посилання в листі — і кабінет відкриється автоматично.', 'Open the link in it — and your cabinet will open automatically.')}</p>
                <p className="sysx-note mono">{t('Не бачите листа? Перевірте «Спам» і «Промоакції».', 'Don\'t see it? Check Spam and Promotions.')}</p>
                {resendMsg && <p className="cab-auth-note mono">{resendMsg}</p>}
                <button className="sysx-cta" onClick={doResend} disabled={busy}>{busy ? t('Надсилаємо…', 'Sending…') : t('Надіслати лист повторно', 'Resend email')}</button>
                <button className="cab-linkbtn mono" onClick={() => { setConfirmSent(''); setResendMsg(''); setMode('login'); }}>← {t('Інший email', 'Use another email')}</button>
              </div>
            ) : (
              <div className="cab-form">
                <div className="cab-auth-tabs" role="tablist">
                  <button role="tab" className={`cab-auth-tab${mode === 'login' ? ' on' : ''}`} onClick={() => { setMode('login'); setAuthErr(''); }}>{t('Вхід', 'Sign in')}</button>
                  <button role="tab" className={`cab-auth-tab${mode === 'register' ? ' on' : ''}`} onClick={() => { setMode('register'); setAuthErr(''); }}>{t('Реєстрація', 'Sign up')}</button>
                </div>
                {CONFIGURED && (
                  <>
                    <button className="cab-google" onClick={doGoogle} disabled={busy}>
                      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>
                      {t('Продовжити з Google', 'Continue with Google')}
                    </button>
                    <div className="cab-or mono"><span>{t('або через email', 'or with email')}</span></div>
                  </>
                )}
                <label className="sysx-inp"><span className="sysx-inp-l">Email</span>
                  <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@shop.com" /></label>
                <label className="sysx-inp"><span className="sysx-inp-l">{t('Пароль · мін. 6 символів', 'Password · min. 6 characters')}</span>
                  <input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" onKeyDown={(e) => e.key === 'Enter' && email && pass.length >= 6 && doAuth()} /></label>
                {authErr && <p className="cab-auth-err mono">{authErr}</p>}
                {captchaOn && <Turnstile siteKey={TURNSTILE_SITE_KEY} resetKey={captchaReset} onToken={setCaptcha} />}
                <button className="sysx-cta is-primary" onClick={doAuth} disabled={busy || !email || pass.length < 6 || (captchaOn && !captcha)}>
                  {busy ? (mode === 'register' ? t('Реєструємо…', 'Signing up…') : t('Заходимо…', 'Signing in…')) : (mode === 'register' ? t('Створити кабінет →', 'Create cabinet →') : t('Увійти →', 'Sign in →'))}
                </button>
                <p className="sysx-note mono">{CONFIGURED ? t('Захищений вхід. Дані синхронізуються між пристроями.', 'Secure sign-in. Data syncs across your devices.') : t('Демо-режим: дані зберігаються локально в цьому браузері.', 'Demo mode: data is stored locally in this browser.')}</p>
              </div>
            )}
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
        {section === 'overview' && <Overview journey={journey} express={express} rec={rec} cur={cur?.label} go={setSection} />}
        {section === 'audits' && <Audits express={express} rec={rec} go={setSection} onDelete={deleteExpress} />}
        {section === 'company' && <CompanyForm user={user} rec={rec} onSaved={refreshRec} />}
        {section === 'deep' && <DeepAudit user={user} rec={rec} express={express} onDone={refreshRec} onClose={() => setSection('overview')} go={setSection} />}
        {section === 'project' && <ProjectView projects={getProjects(rec)} en={t('', 'en') === 'en'} />}
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

function Overview({ journey, express, rec, cur, go }: { journey: ReturnType<typeof buildJourney>; express: ExpressAudit | null; rec: DiagRecord | null; cur?: string; go: (s: SectionId) => void }) {
  const t = useT();
  const lp = useLp();
  const tierStatus = rec?.funnel?.tierStatus || {};
  const tierEntries = Object.entries(tierStatus) as [string, TierStatus][];
  const TSTAT: Record<TierStatus, { txt: string; cls: string }> = {
    requested: { txt: t('Очікує підтвердження', 'Awaiting confirmation'), cls: 'wait' },
    data: { txt: t('Потрібні ваші дані', 'Your data needed'), cls: 'wait' },
    granted: { txt: t('Доступ надано', 'Access granted'), cls: 'ok' },
    rejected: { txt: t('Відхилено', 'Declined'), cls: 'bad' },
  };
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

      {tierEntries.length > 0 && (
        <div className="cab-accban">
          <div className="cab-accban-head">
            <span className="sysx-kick">{t('Ваш запит на глибокий аудит', 'Your deep-audit request')}</span>
            <button className="cab-accban-go mono" onClick={() => go('deep')}>{t('Відкрити розділ', 'Open section')} →</button>
          </div>
          <ul className="cab-accban-list">
            {tierEntries.map(([tid, s]) => (
              <li key={tid} className="cab-accban-i">
                <b className="cab-accban-t">{tid === 'DEEP' ? t('Глибокий аудит', 'Deep audit') : tid}</b>
                <span className={`cab-badge mono tst-${TSTAT[s].cls}`}>{TSTAT[s].txt}</span>
                {s === 'data' && rec?.funnel?.tierReason?.[tid] && <span className="cab-accban-r">{rec.funnel.tierReason[tid]}</span>}
                {s === 'rejected' && rec?.funnel?.tierReason?.[tid] && <span className="cab-accban-r">{rec.funnel.tierReason[tid]}</span>}
                {s === 'granted' && rec?.funnel?.accessCode && <span className="cab-accban-code mono">{t('код', 'code')}: {rec.funnel.accessCode}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

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
  const del = () => { if (typeof window !== 'undefined' && !window.confirm(t('Видалити збережений експрес-аудит?', 'Delete the saved express audit?'))) return; onDelete(); };
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
                  <Link className="sysx-cta is-primary" to={lp('/diagnose')}>{t('Переглянути результат →', 'View result →')}</Link>
                  <button className="sysx-cta" onClick={() => go('deep')}>{t('До глибокого аудиту →', 'To deep audit →')}</button>
                  <Link className="sysx-cta" to={lp('/diagnose')}>{t('Перерахувати', 'Recalculate')}</Link>
                  <button className="cab-del" onClick={del} aria-label={t('Видалити аудит', 'Delete audit')} title={t('Видалити', 'Delete')}>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6M10 11v6M14 11v6"/></svg>
                    {t('Видалити', 'Delete')}
                  </button>
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
  useEffect(() => { setC({ ...EMPTY_COMPANY, ...(rec?.company || {}) }); }, [rec]);
  const set = (k: keyof CompanyProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setC((s) => ({ ...s, [k]: e.target.value }));
  const toggle = (k: 'channels' | 'acqChannels', v: string) => setC((s) => { const a = s[k] || []; return { ...s, [k]: a.includes(v) ? a.filter((x) => x !== v) : [...a, v] }; });
  const save = async () => { setSaving(true); await saveDiag(user, { company: c }); setSaving(false); setSaved(true); onSaved(); setTimeout(() => setSaved(false), 1800); };
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
          : <AuditForm user={user} auditId={auditId} template={tpl} initial={answers} role={role} isOwner={status === 'granted'} extra={extra as unknown as Question[]} />}
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
