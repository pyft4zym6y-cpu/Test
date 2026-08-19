import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  authenticate, currentUser, signOut, loadDiag, saveDiag, CONFIGURED, isCloudUser,
  type DiagUser, type DiagRecord, type CompanyProfile,
} from '@/lib/supa';
import { getExpressAudit, buildJourney, type ExpressAudit } from './cabinetData';
import { eur } from './lossModel';
import { sendLead } from '@/lib/leads';
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
const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Огляд', items: [{ id: 'overview', label: 'Огляд і шлях' }, { id: 'audits', label: 'Мої аудити' }] },
  { group: 'Дані', items: [{ id: 'company', label: 'Дані компанії' }, { id: 'access', label: 'Доступи · T1–T4' }] },
  { group: 'Розбір', items: [{ id: 'deep', label: 'Глибокий аудит' }, { id: 'findings', label: 'Знахідки та план', soon: true }, { id: 'docs', label: 'Документи', soon: true }] },
  { group: 'Робота разом', items: [{ id: 'collab', label: 'Співпраця' }, { id: 'settings', label: 'Налаштування' }] },
];

const EMPTY_COMPANY: CompanyProfile = { name: '', site: '', niche: '', revenue: '', channels: [], contactName: '', contactPhone: '', notes: '' };
const CHANNELS = ['Instagram', 'Сайт / магазин', 'Розетка / marketplace', 'Google Ads', 'Meta Ads', 'Email / CRM', 'Офлайн'];
const DEPTHS = [
  { id: 'T1', title: 'T1 · Зовнішній обхід', cap: 'до 35%', desc: 'Тільки публічні дані: сайт, ціни, канали. Без ваших доступів.' },
  { id: 'T2', title: 'T2 · + Аналітика', cap: 'до 55%', desc: 'GA4/GSC read-only: реальний трафік, конверсії, джерела.' },
  { id: 'T3', title: 'T3 · + Бізнес-дані', cap: 'до 78%', desc: 'Вивантаження CRM/ERP: когорти, повторні, юніт-економіка.' },
  { id: 'T4', title: 'T4 · Живі доступи', cap: 'до 92%', desc: 'Рекламні кабінети, CMS: максимальна достовірність і план.' },
];

export function Cabinet() {
  const nav = useNavigate();
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
    else setAuthErr(r.error || 'Не вдалося увійти. Спробуйте ще раз.');
  };
  const doSignOut = async () => { await signOut(); setUser(null); setRec(null); setSection('overview'); };
  const refreshRec = () => { if (user) loadDiag(user).then(setRec); };

  /* ── Ворота входу ── */
  if (checking) return <div className="sysx cab"><div className="cab-boot mono">Завантаження кабінету…</div></div>;
  if (!user) {
    return (
      <div className="sysx cab cab-gate">
        <div className="cab-gate-card">
          <Link to="/" className="cab-gate-back mono">← на сайт</Link>
          <div className="sysx-kick">Особистий кабінет WEEXP</div>
          <h1 className="sysx-display cab-gate-h">Ваш кабінет<br />діагностики</h1>
          <p className="sysx-lead">Один вхід — усі ваші дані в одному місці: експрес-витік із калькулятора, профіль компанії, глибокий аудит і план. Повторний вхід відкриває збережений розбір.</p>
          <div className="cab-form">
            <label className="sysx-inp"><span className="sysx-inp-l">Email</span>
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@shop.com" /></label>
            <label className="sysx-inp"><span className="sysx-inp-l">Пароль · мін. 6 символів</span>
              <input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" onKeyDown={(e) => e.key === 'Enter' && email && pass.length >= 6 && doAuth()} /></label>
            {authErr && <p className="cab-auth-err mono">{authErr}</p>}
            <button className="sysx-cta is-primary" onClick={doAuth} disabled={busy || !email || pass.length < 6}>{busy ? 'Заходимо…' : 'Увійти / створити кабінет →'}</button>
            <p className="sysx-note mono">{CONFIGURED ? 'Захищений вхід. Дані синхронізуються між пристроями.' : 'Демо-режим: дані зберігаються локально в цьому браузері.'}</p>
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
        <Link to="/" className="cab-brand"><b>WEEXP</b><span className="mono">кабінет</span></Link>
        <nav className="cab-nav">
          {NAV.map((g) => (
            <div key={g.group} className="cab-nav-g">
              <span className="cab-nav-gl mono">{g.group}</span>
              {g.items.map((it) => (
                <button key={it.id} className={`cab-nav-i${section === it.id ? ' on' : ''}`} onClick={() => setSection(it.id)}>
                  {it.label}{it.soon && <i className="cab-soon mono">скоро</i>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="cab-side-foot">
          <span className="cab-user mono" title={user.email}>{user.email}</span>
          <span className="cab-user-mode mono">{isCloudUser(user) ? '☁ хмара' : '● локально'}</span>
          <button className="cab-signout mono" onClick={doSignOut}>Вийти</button>
        </div>
      </aside>

      {/* Контент */}
      <main className="cab-main">
        {section === 'overview' && <Overview journey={journey} express={express} cur={cur?.label} go={setSection} />}
        {section === 'audits' && <Audits express={express} rec={rec} go={setSection} />}
        {section === 'company' && <CompanyForm user={user} rec={rec} onSaved={refreshRec} />}
        {section === 'access' && <Access user={user} rec={rec} onDone={refreshRec} />}
        {section === 'deep' && (
          <section className="cab-sec cab-deep-wrap">
            <SecHead kick="Глибокий аудит · Tier-2" title="Розбір систем магазину" lead="Реєстрація вже пройдена — заповнюйте блоки по секціях. На виході інтерактивний Tier-2 звіт: зрілість, конкурентне поле, маркетинг/фінанси, позиціонування. Прогрес зберігається автоматично." />
            <Suspense fallback={<div className="cab-boot mono">Відкриваємо розбір…</div>}>
              {/* embedded — рендеримо inline в кабінеті (без повноекранного оверлея),
                  щоб клієнт лишався в кабінеті, а не «перекидався» на окрему сторінку. */}
              <Stage3 embedded onClose={() => setSection('overview')} />
            </Suspense>
          </section>
        )}
        {section === 'findings' && <Soon title="Знахідки та дорожня карта" lead="Тут зʼявляться підтверджені знахідки глибокого аудиту й план під Definition of Done: що робити, у якому порядку і який ефект. Розділ вмикається після завершення Tier-2 розбору." />}
        {section === 'docs' && <Soon title="Документи" lead="PDF-звіти, робочі аркуші й матеріали розбору складатимуться сюди — щоб усе було в одному місці й доступне команді." />}
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
  return (
    <section className="cab-sec">
      <SecHead kick="Огляд" title="Ваш шлях у WEEXP" lead={cur ? `Ви зараз на кроці «${cur}». Кабінет веде вас від першого числа до плану — крок за кроком.` : 'Усі кроки пройдено — час до співпраці та зростання.'} />
      <div className="cab-cards">
        <div className="cab-card cab-card-hero">
          <span className="sysx-kick">Ваш експрес-витік</span>
          {express
            ? <><b className="sysx-display cab-big">{eur(express.total)}<i>/ рік</i></b>
                <span className="mono cab-sub">діапазон {eur(express.range[0])}–{eur(express.range[1])} · Health {express.overallHealth}/100</span>
                <button className="sysx-cta" onClick={() => go('audits')}>Розбір числа →</button></>
            : <><b className="sysx-display cab-big cab-big-empty">— €</b>
                <span className="mono cab-sub">калькулятор ще не рахував ваш витік</span>
                <Link className="sysx-cta is-primary" to="/diagnose">Порахувати витік →</Link></>}
        </div>
        <div className="cab-card">
          <span className="sysx-kick">Наступна дія</span>
          <b className="cab-next-t">{cur || 'Співпраця'}</b>
          <p className="cab-next-d">{cur === 'Профіль компанії' ? 'Заповніть дані магазину — вони уточнюють оцінку та готують глибокий аудит.' : cur === 'Глибокий аудит' ? 'Пройдіть Tier-2 розбір систем — від числа до карти «де саме й чому».' : 'Продовжуйте по шляху нижче — кожен крок годує наступний.'}</p>
          <button className="sysx-cta is-primary" onClick={() => go(cur === 'Профіль компанії' ? 'company' : cur === 'Глибокий аудит' ? 'deep' : 'audits')}>Перейти →</button>
        </div>
      </div>

      <div className="cab-journey">
        <span className="sysx-kick">Наскрізний шлях</span>
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

function Audits({ express, rec, go }: { express: ExpressAudit | null; rec: DiagRecord | null; go: (s: SectionId) => void }) {
  const deepDone = Boolean(rec?.stage3 && Object.keys(rec.stage3).length > 0);
  return (
    <section className="cab-sec">
      <SecHead kick="Мої аудити" title="Ваші розбори" lead="Тут зібрані ваші аудити — від швидкого експрес-витоку до глибокого Tier-2 розбору. Кожен наступний рівень уточнює попередній, а не рахує наново." />
      <div className="cab-audits">
        <div className="cab-audit">
          <div className="cab-audit-top"><b>Експрес-витік</b><span className="cab-badge mono">{express ? 'готово' : 'не запускали'}</span></div>
          {express
            ? <><span className="sysx-display cab-audit-v">{eur(express.total)}<i>/ рік</i></span>
                <span className="mono cab-sub">від {new Date(express.at).toLocaleDateString('uk-UA')} · Health {express.overallHealth}/100 · діапазон {eur(express.range[0])}–{eur(express.range[1])}</span>
                <Link className="sysx-cta" to="/diagnose">Перерахувати →</Link></>
            : <><p className="cab-sub">Швидка оцінка втрат за 7 показниками — ~2 хвилини.</p><Link className="sysx-cta is-primary" to="/diagnose">Порахувати витік →</Link></>}
        </div>
        <div className="cab-audit">
          <div className="cab-audit-top"><b>Глибокий аудит · Tier-2</b><span className="cab-badge mono">{deepDone ? 'у роботі' : 'не почато'}</span></div>
          <p className="cab-sub">Розбір 8 систем магазину, конкурентне поле, юніт-економіка, план під DoD.</p>
          <button className="sysx-cta is-primary" onClick={() => go('deep')}>{deepDone ? 'Продовжити розбір →' : 'Почати глибокий аудит →'}</button>
        </div>
      </div>
    </section>
  );
}

function CompanyForm({ user, rec, onSaved }: { user: DiagUser; rec: DiagRecord | null; onSaved: () => void }) {
  const [c, setC] = useState<CompanyProfile>({ ...EMPTY_COMPANY, ...(rec?.company || {}) });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setC({ ...EMPTY_COMPANY, ...(rec?.company || {}) }); }, [rec]);
  const set = (k: keyof CompanyProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setC((s) => ({ ...s, [k]: e.target.value }));
  const toggleCh = (ch: string) => setC((s) => ({ ...s, channels: (s.channels || []).includes(ch) ? (s.channels || []).filter((x) => x !== ch) : [...(s.channels || []), ch] }));
  const save = async () => { setSaving(true); await saveDiag(user, { company: c }); setSaving(false); setSaved(true); onSaved(); setTimeout(() => setSaved(false), 1800); };
  return (
    <section className="cab-sec">
      <SecHead kick="Дані компанії" title="Профіль магазину" lead="Базові дані про бізнес. Вони уточнюють оцінку витоку й готують ґрунт для глибокого аудиту — щоб не питати те саме двічі." />
      <div className="cab-grid2">
        <label className="sysx-inp"><span className="sysx-inp-l">Назва компанії</span><input value={c.name || ''} onChange={set('name')} placeholder="Ваш бренд" /></label>
        <label className="sysx-inp"><span className="sysx-inp-l">Сайт</span><input value={c.site || ''} onChange={set('site')} placeholder="shop.com" /></label>
        <label className="sysx-inp"><span className="sysx-inp-l">Ніша</span><input value={c.niche || ''} onChange={set('niche')} placeholder="одяг · косметика · електроніка…" /></label>
        <label className="sysx-inp"><span className="sysx-inp-l">Онлайн-виторг · € / міс</span><input value={c.revenue || ''} onChange={set('revenue')} placeholder="напр. 25000" /></label>
        <label className="sysx-inp"><span className="sysx-inp-l">Контактна особа</span><input value={c.contactName || ''} onChange={set('contactName')} placeholder="Імʼя" /></label>
        <label className="sysx-inp"><span className="sysx-inp-l">Телефон</span><input value={c.contactPhone || ''} onChange={set('contactPhone')} placeholder="+380…" /></label>
      </div>
      <div className="cab-ch">
        <span className="sysx-inp-l">Канали продажів</span>
        <div className="cab-ch-row">{CHANNELS.map((ch) => <button key={ch} className={`cab-chip${(c.channels || []).includes(ch) ? ' on' : ''}`} onClick={() => toggleCh(ch)}>{ch}</button>)}</div>
      </div>
      <label className="sysx-inp"><span className="sysx-inp-l">Нотатки · що болить найбільше</span><textarea rows={3} value={c.notes || ''} onChange={set('notes')} placeholder="Коротко про головну задачу…" /></label>
      <div className="cab-actions">
        <button className="sysx-cta is-primary" onClick={save} disabled={saving}>{saving ? 'Зберігаємо…' : 'Зберегти профіль'}</button>
        {saved && <span className="cab-saved mono">✓ збережено</span>}
      </div>
    </section>
  );
}

function Access({ user, rec, onDone }: { user: DiagUser; rec: DiagRecord | null; onDone: () => void }) {
  const [depth, setDepth] = useState(rec?.funnel?.deepDepth || 'T2');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const request = async () => {
    setBusy(true);
    await sendLead({ source: 'cabinet-access', email: user.email, role: 'cabinet', task: `Запит доступів для глибокого аудиту, глибина ${depth}`, comment: rec?.company?.name ? `Компанія: ${rec.company.name} · ${rec.company.site || ''}` : undefined });
    await saveDiag(user, { funnel: { ...(rec?.funnel || {}), deepRequested: true, deepAt: new Date().toISOString(), deepDepth: depth } });
    setBusy(false); setSent(true); onDone();
  };
  return (
    <section className="cab-sec">
      <SecHead kick="Доступи · T1–T4" title="Глибина розбору = достовірність" lead="Одна змінна визначає точність аудиту — обсяг доступів. Більше даних НЕ роздуває суму втрат, а підвищує впевненість висновку. Оберіть рівень — ми надішлемо інструкції з безпечного надання доступів (read-only, за потреби — з обмеженим строком)." />
      <div className="cab-depths">
        {DEPTHS.map((d) => (
          <button key={d.id} className={`cab-depth${depth === d.id ? ' on' : ''}`} onClick={() => setDepth(d.id)}>
            <div className="cab-depth-top"><b>{d.title}</b><span className="cab-badge mono">{d.cap}</span></div>
            <span className="cab-sub">{d.desc}</span>
          </button>
        ))}
      </div>
      <div className="cab-actions">
        {sent
          ? <span className="cab-saved mono">✓ Запит на доступи ({depth}) надіслано. Ми напишемо інструкції на {user.email}.</span>
          : <button className="sysx-cta is-primary" onClick={request} disabled={busy}>{busy ? 'Надсилаємо…' : `Запросити інструкції для ${depth} →`}</button>}
      </div>
    </section>
  );
}

function Collab({ user, rec, express, onDone }: { user: DiagUser; rec: DiagRecord | null; express: ExpressAudit | null; onDone: () => void }) {
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
      <SecHead kick="Робота разом" title="Співпраця та зростання" lead="Готові перетворити знахідки на результат? Залиште заявку — ми підготуємо розбір під вашу ситуацію й покажемо, з чого почати, щоб повернути витік найшвидше." />
      {sent
        ? <div className="cab-card"><span className="sysx-kick">Дякуємо</span><b className="cab-next-t">Заявку прийнято</b><p className="cab-next-d">Ми звʼяжемося з вами на {user.email}{rec?.funnel?.leadContact && rec.funnel.leadContact !== user.email ? ` / ${rec.funnel.leadContact}` : ''}. Тим часом можна пройти глибокий аудит — це прискорить розбір.</p></div>
        : <div className="cab-collab">
            <label className="sysx-inp"><span className="sysx-inp-l">Email</span><input value={user.email} readOnly /></label>
            <label className="sysx-inp"><span className="sysx-inp-l">Телефон · необовʼязково</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380…" /></label>
            <label className="sysx-inp"><span className="sysx-inp-l">Коментар</span><textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Що хочете вирішити насамперед?" /></label>
            <div className="cab-actions"><button className="sysx-cta is-primary" onClick={send} disabled={busy}>{busy ? 'Надсилаємо…' : 'Залишити заявку →'}</button></div>
          </div>}
    </section>
  );
}

function Settings({ user, onSignOut }: { user: DiagUser; onSignOut: () => void }) {
  return (
    <section className="cab-sec">
      <SecHead kick="Налаштування" title="Акаунт" />
      <div className="cab-card">
        <span className="sysx-kick">Email входу</span><b className="cab-next-t">{user.email}</b>
        <span className="mono cab-sub">{isCloudUser(user) ? 'Хмарний акаунт — дані синхронізуються між пристроями.' : 'Локальний режим — дані в цьому браузері. Додайте ключі Supabase для синхронізації.'}</span>
        <div className="cab-actions"><button className="sysx-cta" onClick={onSignOut}>Вийти з акаунта</button></div>
      </div>
    </section>
  );
}

function Soon({ title, lead }: { title: string; lead: string }) {
  return (
    <section className="cab-sec">
      <SecHead kick="Скоро" title={title} lead={lead} />
      <div className="cab-soon-box"><span className="mono">Розділ у розробці — вмикається на наступному кроці воронки.</span></div>
    </section>
  );
}
