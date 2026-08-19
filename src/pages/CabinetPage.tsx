import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Building2, FileSearch, Microscope, ListChecks, Map, KeyRound,
  FileText, Settings, LogOut, ArrowRight, CheckCircle2,
} from 'lucide-react';
import {
  getSession, login, logout, getCompany, saveCompany, getAudits,
  getJourney, getFunnel, markDeepRequested,
  type Company, type Session, type AuditRecord,
} from '../lib/account';
import { sendLead } from '../components/leads';

/*
 * КАБІНЕТ КЛІЄНТА — з чистого листа. Ліва панель розділів + робоча область.
 * MVP-сесія (localStorage, під magic-link згодом). «Мої аудити» підтягують дані
 * з калькулятора аудиту. Глибокий аудит/знахідки/дорожня карта — точки входу
 * під окремий інструмент глибокої аналітики.
 */

type SectionId = 'overview' | 'company' | 'audits' | 'deep' | 'findings' | 'roadmap' | 'access' | 'docs' | 'settings';
const NAV: { id: SectionId; label: string; icon: typeof LayoutDashboard; soon?: boolean }[] = [
  { id: 'overview', label: 'Огляд', icon: LayoutDashboard },
  { id: 'company', label: 'Дані компанії', icon: Building2 },
  { id: 'audits', label: 'Мої аудити', icon: FileSearch },
  { id: 'deep', label: 'Глибокий аудит', icon: Microscope },
  { id: 'findings', label: 'Знахідки та беклог', icon: ListChecks, soon: true },
  { id: 'roadmap', label: 'Дорожня карта', icon: Map, soon: true },
  { id: 'access', label: 'Доступи', icon: KeyRound, soon: true },
  { id: 'docs', label: 'Документи', icon: FileText, soon: true },
  { id: 'settings', label: 'Профіль', icon: Settings },
];

const fmtUAH = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString('uk-UA', { maximumFractionDigits: 1 })} млн ₴` : `${Math.round(n / 1000).toLocaleString('uk-UA')} тис ₴`;

const card = 'bg-white border border-black/10';
const H = ({ children }: { children: React.ReactNode }) => <h2 className="text-2xl font-bold text-[#12161C]">{children}</h2>;
const Sub = ({ children }: { children: React.ReactNode }) => <p className="text-[#5A6472] mt-1">{children}</p>;

function Soon({ title, points, cta }: { title: string; points: string[]; cta?: React.ReactNode }) {
  return (
    <div className={`${card} px-7 py-7`}>
      <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#B45309] bg-[#B45309]/10 px-2.5 py-1">скоро</div>
      <h3 className="text-xl font-bold text-[#12161C] mt-3">{title}</h3>
      <ul className="mt-3 space-y-1.5 text-sm text-[#3a4048]">
        {points.map((p) => <li key={p}>• {p}</li>)}
      </ul>
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}

export default function CabinetPage() {
  const [session, setSession] = useState<Session | null>(getSession());
  const [active, setActive] = useState<SectionId>((location.hash.replace('#', '') as SectionId) || 'overview');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginName, setLoginName] = useState('');

  const audits = useMemo(() => getAudits(), [session, active]);
  const lastAudit = audits[0] || null;

  const go = (id: SectionId) => { setActive(id); history.replaceState(null, '', `#${id}`); window.scrollTo({ top: 0 }); };

  /* ── ВХІД ── */
  if (!session) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center px-5 py-16">
        <div className={`${card} w-full max-w-md px-8 py-9`}>
          <div className="font-mono text-[11px] tracking-widest text-[#65A30D] uppercase">weexp · кабінет клієнта</div>
          <h1 className="text-2xl font-bold text-[#12161C] mt-3">Вхід у кабінет</h1>
          <p className="text-sm text-[#5A6472] mt-2">Введіть робочий email — тут зберігаються ваші аудити, дані компанії й дорожня карта.</p>
          <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); if (!loginEmail.includes('@')) return; setSession(login(loginEmail, loginName)); }}>
            <input className="w-full bg-white border border-black/10 px-4 py-3 text-[#12161C] font-mono focus:outline-none focus:border-[#65A30D]" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <input className="w-full bg-white border border-black/10 px-4 py-3 text-[#12161C] font-mono focus:outline-none focus:border-[#65A30D]" placeholder="Ім’я (необов’язково)" value={loginName} onChange={(e) => setLoginName(e.target.value)} />
            <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#12161C] text-white font-semibold hover:bg-black transition-colors">Увійти <ArrowRight size={18} /></button>
          </form>
          <p className="text-xs text-[#8b93a0] mt-4">MVP-версія: сесія зберігається у цьому браузері. Захищений вхід (magic-link) — на наступному кроці.</p>
          <Link to="/calculator" className="text-sm text-[#65A30D] font-semibold mt-5 inline-flex items-center gap-1">Ще не робили аудит? Почати з калькулятора <ArrowRight size={15} /></Link>
        </div>
      </div>
    );
  }

  /* ── КАБІНЕТ ── */
  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <div className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-[230px_1fr] gap-5 items-start">
        {/* сайдбар */}
        <aside className={`${card} p-3 md:sticky md:top-6`}>
          <div className="px-3 py-2">
            <div className="font-mono text-[11px] tracking-widest text-[#65A30D] uppercase">кабінет</div>
            <div className="text-sm font-semibold text-[#12161C] truncate mt-0.5">{session.name || session.email}</div>
          </div>
          <nav className="mt-2 space-y-0.5">
            {NAV.map((n) => {
              const Icon = n.icon; const on = active === n.id;
              return (
                <button key={n.id} onClick={() => go(n.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left"
                  style={on ? { background: 'rgba(101,163,13,0.1)', color: '#3f6212', fontWeight: 600 } : { color: '#5A6472' }}>
                  <Icon size={16} /> <span className="flex-1">{n.label}</span>
                  {n.soon && <span className="text-[9px] font-mono uppercase text-[#B45309]">soon</span>}
                </button>
              );
            })}
          </nav>
          <button onClick={() => { logout(); setSession(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#8b93a0] hover:text-[#DC2626] mt-2 border-t border-black/5 pt-3">
            <LogOut size={16} /> Вийти
          </button>
        </aside>

        {/* контент */}
        <main className="min-w-0 space-y-5">
          {active === 'overview' && (
            <>
              <div><H>Огляд</H><Sub>Коротка зведена картина по вашому магазину.</Sub></div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className={`${card} px-5 py-5`}>
                  <div className="text-[12px] text-[#5A6472]">Недоотримано / рік</div>
                  <div className="text-2xl font-bold font-mono text-[#DC2626] mt-1">{lastAudit?.potentialCons ? fmtUAH(lastAudit.potentialCons) : '—'}</div>
                  <div className="text-[11px] text-[#8b93a0] mt-1">{lastAudit ? `оцінка · достовірність ${lastAudit.confidence}%` : 'ще немає аудиту'}</div>
                </div>
                <div className={`${card} px-5 py-5`}>
                  <div className="text-[12px] text-[#5A6472]">Аудитів пройдено</div>
                  <div className="text-2xl font-bold font-mono text-[#12161C] mt-1">{audits.length}</div>
                  <div className="text-[11px] text-[#8b93a0] mt-1">експрес + глибокі</div>
                </div>
                <div className={`${card} px-5 py-5`}>
                  <div className="text-[12px] text-[#5A6472]">Наступний крок</div>
                  <div className="text-sm font-semibold text-[#12161C] mt-1">{lastAudit ? 'Глибокий аудит на даних' : 'Пройти експрес-аудит'}</div>
                  <button onClick={() => go(lastAudit ? 'deep' : 'audits')} className="text-[13px] text-[#65A30D] font-semibold mt-2 inline-flex items-center gap-1">Перейти <ArrowRight size={14} /></button>
                </div>
              </div>
              <Journey onGo={go} />
              {!lastAudit && (
                <div className={`${card} px-7 py-7`}>
                  <h3 className="text-lg font-bold text-[#12161C]">Почніть з експрес-аудиту</h3>
                  <p className="text-sm text-[#5A6472] mt-1">За 2 хвилини порахуємо ваш недоотриманий оборот і зберемо профіль каналів.</p>
                  <Link to="/calculator" className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-[#65A30D] text-white font-semibold hover:bg-[#4d7c0f] transition-colors">Пройти калькулятор <ArrowRight size={18} /></Link>
                </div>
              )}
            </>
          )}

          {active === 'company' && <CompanyForm />}

          {active === 'audits' && (
            <>
              <div><H>Мої аудити</H><Sub>Історія експрес- і глибоких аудитів. Дані підтягуються автоматично.</Sub></div>
              {audits.length === 0 ? (
                <div className={`${card} px-7 py-7`}>
                  <p className="text-sm text-[#5A6472]">Ви ще не проходили аудит. Почніть з базового — займе 2 хвилини.</p>
                  <Link to="/calculator" className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-[#12161C] text-white font-semibold hover:bg-black transition-colors">Пройти базовий аудит <ArrowRight size={18} /></Link>
                </div>
              ) : (
                <div className="space-y-3">{audits.map((a) => <AuditRow key={a.id} a={a} />)}</div>
              )}
            </>
          )}

          {active === 'deep' && <DeepAudit session={session} />}
          {active === 'findings' && (<><div><H>Знахідки та беклог</H><Sub>Єдиний список знахідок з пріоритетами P0–P2 та грошима.</Sub></div>
            <Soon title="Реєстр знахідок Impact × Effort" points={['Кожна знахідка: доказ → пріоритет → рекомендація → власник → статус → перевірка.', 'Наскрізний беклог з усіх блоків аудиту в один план.', 'Життєвий цикл: open → in-progress → verified → closed.']} /></>)}
          {active === 'roadmap' && (<><div><H>Дорожня карта</H><Sub>План зростання під ваші цифри: що і в якому порядку.</Sub></div>
            <Soon title="Оптимізована дорожня карта" points={['Порядок робіт за Impact × Confidence × Effort × залежностями.', 'Задачі з власником і термінами.', 'Прогрес і порівняння аудит №2 vs №1.']} /></>)}
          {active === 'access' && (<><div><H>Доступи</H><Sub>Передача доступів для глибокого аудиту — безпечно, без паролів.</Sub></div>
            <Soon title="Передача доступів і документів (T1–T4)" points={['GA4, Search Console, рекламні кабінети, CRM — інвайтом на email або одноразовим посиланням.', 'До кожного — інструкція «як видати» й шаблони вивантажень.', 'Паролі ми ніколи не просимо через форми.']} /></>)}
          {active === 'docs' && (<><div><H>Документи</H><Sub>Ваші звіти, вивантаження та шаблони.</Sub></div>
            <Soon title="Звіти та вивантаження" points={['PDF-аудити (оглядові й повні), Excel-таблиці, дорожня карта.', 'Історія версій документів.', 'Швидке завантаження й повторне надсилання.']} /></>)}

          {active === 'settings' && (
            <>
              <div><H>Профіль</H><Sub>Обліковий запис і сесія.</Sub></div>
              <div className={`${card} px-7 py-6`}>
                <div className="text-sm"><span className="text-[#8b93a0]">Email:</span> <span className="font-mono text-[#12161C]">{session.email}</span></div>
                {session.name && <div className="text-sm mt-1"><span className="text-[#8b93a0]">Ім’я:</span> <span className="text-[#12161C]">{session.name}</span></div>}
                <div className="text-xs text-[#8b93a0] mt-3">MVP-сесія в цьому браузері. Захищений вхід (magic-link) і синхронізація між пристроями — на наступному кроці.</div>
                <button onClick={() => { logout(); setSession(null); }} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 border border-black/15 text-[#5A6472] hover:border-[#DC2626] hover:text-[#DC2626] transition-colors"><LogOut size={16} /> Вийти</button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Journey({ onGo }: { onGo: (id: any) => void }) {
  const steps = getJourney();
  const map: Record<string, string> = { express: 'audits', lead: 'audits', account: 'overview', profile: 'company', deep: 'deep', findings: 'findings', collab: 'docs' };
  return (
    <div className={`${card} px-6 py-5`}>
      <div className="text-[13px] font-semibold text-[#12161C] mb-3">Ваш шлях</div>
      <div className="flex flex-wrap gap-x-2 gap-y-3">
        {steps.map((st, i) => (
          <button key={st.id} onClick={() => onGo(map[st.id] || 'overview')} className="flex items-center gap-2 text-left">
            <span className="w-6 h-6 flex items-center justify-center text-[11px] font-mono shrink-0"
              style={st.done ? { background: '#65A30D', color: '#fff' } : st.current ? { border: '2px solid #65A30D', color: '#3f6212', fontWeight: 700 } : { border: '1px solid rgba(10,14,18,0.15)', color: '#8b93a0' }}>
              {st.done ? '✓' : i + 1}
            </span>
            <span className="text-[13px]" style={{ color: st.current ? '#12161C' : st.done ? '#4D7C0F' : '#8b93a0', fontWeight: st.current ? 700 : 400 }}>{st.label}</span>
            {i < steps.length - 1 && <span className="text-[#d0d4cc] mx-1">›</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

const DEEP_TIERS = [
  { code: 'T1', name: 'Експрес — зовнішній обхід', desc: 'Тільки сайт, без доступів', conf: 'до 35%' },
  { code: 'T2', name: 'Базовий — + аналітика', desc: 'GA4, Search Console, короткий бриф', conf: 'до 55%' },
  { code: 'T3', name: 'Глибокий — + бізнес-дані', desc: 'Вивантаження заказів/товарів, кабінети, CRM', conf: 'до 78%' },
  { code: 'T4', name: 'Повний — живі доступи', desc: 'ERP/фінанси/логи, інтервʼю, дослідження', conf: 'до 92%' },
];

function DeepAudit({ session }: { session: Session }) {
  const funnel = getFunnel();
  const [depth, setDepth] = useState<string>(funnel.deepDepth || 'T3');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(Boolean(funnel.deepRequested));
  const company = getCompany();

  async function request() {
    setBusy(true);
    const t = DEEP_TIERS.find((x) => x.code === depth)!;
    const ok = await sendLead({
      source: 'deep-audit-request', name: session.name, email: session.email,
      store: company.site || company.name, turnover: company.revenue ? `${company.revenue} тис ₴/міс` : undefined,
      comment: `Запит на глибокий аудит · глибина ${t.code} (${t.name}). Ніша: ${company.niche || '—'}. Канали: ${company.channels.join(', ') || '—'}.`,
    });
    setBusy(false);
    if (ok) { markDeepRequested(depth); setSent(true); }
  }

  return (
    <>
      <div><H>Глибокий аудит</H><Sub>Одна змінна — глибина. Чим більше даних, тим вища достовірність висновків. 19 блоків аналізу → знахідки, гроші, дорожня карта.</Sub></div>
      <div className="grid sm:grid-cols-2 gap-3">
        {DEEP_TIERS.map((t) => {
          const on = depth === t.code;
          return (
            <button key={t.code} onClick={() => setDepth(t.code)} className={`${card} text-left px-5 py-4 transition-colors`}
              style={on ? { borderColor: '#65A30D', boxShadow: '0 0 0 2px rgba(101,163,13,0.25)' } : {}}>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#12161C]">{t.code}</span>
                <span className="text-[11px] font-mono px-2 py-0.5" style={{ background: 'rgba(101,163,13,0.12)', color: '#3f6212' }}>достовірність {t.conf}</span>
              </div>
              <div className="text-sm font-semibold text-[#12161C] mt-1.5">{t.name}</div>
              <div className="text-[12px] text-[#8b93a0] mt-0.5">{t.desc}</div>
            </button>
          );
        })}
      </div>
      <div className={`${card} px-7 py-6`}>
        {sent ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-[#4D7C0F] shrink-0 mt-0.5" size={22} />
            <div>
              <div className="font-bold text-lg text-[#12161C]">Запит на глибокий аудит прийнято</div>
              <div className="text-sm text-[#5A6472] mt-1">Глибина {depth}. Ми звʼяжемося щодо доступів і даних. Далі — розділ «Доступи».</div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-[#5A6472]">Обрана глибина <b className="text-[#12161C] font-mono">{depth}</b>. Для {depth === 'T1' ? 'старту достатньо сайту' : 'цієї глибини знадобляться доступи/дані — інструкції в розділі «Доступи»'}.</div>
            <button disabled={busy} onClick={request} className="mt-4 inline-flex items-center gap-2 px-6 py-3.5 bg-[#12161C] text-white font-semibold hover:bg-black transition-colors disabled:opacity-60">
              {busy ? 'Надсилаю…' : 'Замовити глибокий аудит'} <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>
    </>
  );
}

function AuditRow({ a }: { a: AuditRecord }) {
  return (
    <div className={`${card} px-6 py-5 flex items-center justify-between gap-4 flex-wrap`}>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5" style={{ background: a.kind === 'deep' ? 'rgba(101,163,13,0.12)' : 'rgba(18,22,28,0.06)', color: a.kind === 'deep' ? '#3f6212' : '#5A6472' }}>{a.kind === 'deep' ? 'Глибокий' : 'Експрес'}</span>
          <span className="text-sm font-semibold text-[#12161C]">Аудит · {a.niche}</span>
        </div>
        <div className="text-[12px] text-[#8b93a0] mt-1">{new Date(a.at).toLocaleString('uk-UA')}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-lg font-bold text-[#DC2626]">{a.potentialCons != null ? fmtUAH(a.potentialCons) : '—'}</div>
        <div className="text-[11px] text-[#8b93a0]">достовірність {a.confidence ?? '—'}%</div>
      </div>
    </div>
  );
}

function CompanyForm() {
  const [c, setC] = useState<Company>(getCompany());
  const [saved, setSaved] = useState(false);
  const upd = (patch: Partial<Company>) => { setC((p) => ({ ...p, ...patch })); setSaved(false); };
  const CH = ['Сайт (власний)', 'Rozetka', 'Prom', 'Instagram', 'Google Ads', 'Meta Ads', 'Email/CRM', 'Офлайн'];
  const inp = 'w-full bg-white border border-black/10 px-4 py-3 text-[#12161C] font-mono focus:outline-none focus:border-[#65A30D]';
  return (
    <>
      <div><H>Дані компанії</H><Sub>Профіль магазину — основа для персоналізованого аудиту.</Sub></div>
      <div className={`${card} px-7 py-7 space-y-4`}>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block"><div className="text-[13px] font-semibold mb-1.5">Назва компанії</div><input className={inp} value={c.name} onChange={(e) => upd({ name: e.target.value })} /></label>
          <label className="block"><div className="text-[13px] font-semibold mb-1.5">Сайт</div><input className={inp} placeholder="https://" value={c.site} onChange={(e) => upd({ site: e.target.value })} /></label>
          <label className="block"><div className="text-[13px] font-semibold mb-1.5">Ніша</div><input className={inp} placeholder="напр. Fashion" value={c.niche} onChange={(e) => upd({ niche: e.target.value })} /></label>
          <label className="block"><div className="text-[13px] font-semibold mb-1.5">Оборот / міс, тис ₴</div><input className={inp} value={c.revenue} onChange={(e) => upd({ revenue: e.target.value })} /></label>
        </div>
        <div>
          <div className="text-[13px] font-semibold mb-2">Канали продажів</div>
          <div className="flex flex-wrap gap-2">
            {CH.map((o) => { const on = c.channels.includes(o); return (
              <button key={o} type="button" onClick={() => upd({ channels: on ? c.channels.filter((x) => x !== o) : [...c.channels, o] })}
                className="px-3.5 py-2 text-sm border transition-colors" style={on ? { borderColor: '#65A30D', background: 'rgba(101,163,13,0.1)', color: '#3f6212', fontWeight: 600 } : { borderColor: 'rgba(10,14,18,0.14)', color: '#5A6472' }}>{o}</button>
            ); })}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block"><div className="text-[13px] font-semibold mb-1.5">Контактна особа</div><input className={inp} value={c.contactName} onChange={(e) => upd({ contactName: e.target.value })} /></label>
          <label className="block"><div className="text-[13px] font-semibold mb-1.5">Телефон</div><input className={inp} value={c.contactPhone} onChange={(e) => upd({ contactPhone: e.target.value })} /></label>
        </div>
        <label className="block"><div className="text-[13px] font-semibold mb-1.5">Нотатки</div><textarea className={`${inp} font-sans`} rows={3} value={c.notes} onChange={(e) => upd({ notes: e.target.value })} /></label>
        <div className="flex items-center gap-3">
          <button onClick={() => { saveCompany(c); setSaved(true); }} className="inline-flex items-center gap-2 px-6 py-3 bg-[#12161C] text-white font-semibold hover:bg-black transition-colors">Зберегти</button>
          {saved && <span className="inline-flex items-center gap-1.5 text-sm text-[#4D7C0F]"><CheckCircle2 size={16} /> Збережено</span>}
        </div>
      </div>
      <p className="text-xs text-[#8b93a0]">Дані зберігаються локально (MVP). Синхронізація й безпечне сховище — на наступному кроці.</p>
    </>
  );
}
