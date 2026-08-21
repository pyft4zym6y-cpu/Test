import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  currentUser, isManager, listAllDiagnostics, listLeads, setTierStatusFor, signTierFile, CONFIGURED,
  MANAGER_EMAILS, type DiagUser, type AdminRow, type LeadRow, type TierStatus,
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

export function AdminPanel() {
  const [user, setUser] = useState<DiagUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [q, setQ] = useState('');
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [traffic, setTraffic] = useState<SiteTraffic | null | undefined>(undefined);

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

  if (checking) return <div className="adm"><div className="adm-boot mono">Завантаження…</div></div>;
  if (!CONFIGURED) return <Shell><p className="mc-msg">Supabase не налаштовано — адмінка недоступна.</p></Shell>;
  if (!user) return <Shell><p className="mc-msg">Увійдіть акаунтом адміністратора. <Link to="/cabinet" className="mc-link">Вхід →</Link></p></Shell>;
  if (!isManager(user)) return <Shell><p className="mc-msg">Акаунт <b>{user.email}</b> не має прав адміністратора. Додайте його в <code>MANAGER_EMAILS</code> і застосуйте RLS-політику.</p></Shell>;

  const setStatus = async (userId: string, tier: string, status: TierStatus) => {
    let reason: string | undefined;
    if ((status === 'rejected' || status === 'data') && typeof window !== 'undefined')
      reason = window.prompt(status === 'rejected' ? 'Причина відмови (побачить клієнт):' : 'Які дані потрібні (побачить клієнт):') || undefined;
    setBusy(`${userId}:${tier}`);
    const res = await setTierStatusFor(userId, tier, status, reason);
    setBusy('');
    if (!res.ok) { alert('Не вдалося: ' + (res.error || '')); return; }
    load();
  };
  const openFile = async (path: string) => { const url = await signTierFile(path); if (url) window.open(url, '_blank'); };

  const filtered = (rows || []).filter((r) => !q || r.email.toLowerCase().includes(q.toLowerCase()) || (r.company || '').toLowerCase().includes(q.toLowerCase()));
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
            <h1 className="sysx-display adm-h1">Дашборд</h1>
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
            <TrafficBlock t={traffic} />
          </section>
        )}

        {/* ── Користувачі ── */}
        {tab === 'users' && (
          <section className="adm-sec">
            <div className="adm-sec-head"><h1 className="sysx-display adm-h1">Користувачі</h1>
              <input className="mc-search" placeholder="Пошук: email / компанія" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            {rows === null ? <p className="mc-msg mono">Завантаження…</p> : (
              <div className="adm-table">
                <div className="adm-tr adm-th"><span>Email</span><span>Компанія</span><span>Аудити</span><span>Оновлено</span><span></span></div>
                {filtered.map((r) => (
                  <div key={r.userId} className="adm-tr">
                    <span className="adm-c-email">{r.email}</span>
                    <span className="mono">{r.company || '—'}</span>
                    <span className="mono">{r.hasExpress ? 'E' : '·'} {r.hasDeep ? 'D' : '·'}</span>
                    <span className="mono adm-c-date">{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('uk-UA') : '—'}</span>
                    <button className="adm-open" onClick={() => setOpenUser(r.userId)}>Відкрити →</button>
                  </div>
                ))}
                {filtered.length === 0 && <p className="mc-msg mono">Нічого не знайдено.</p>}
              </div>
            )}
          </section>
        )}

        {/* ── Аудити ── */}
        {tab === 'audits' && (
          <section className="adm-sec">
            <h1 className="sysx-display adm-h1">Аудити</h1>
            {rows === null ? <p className="mc-msg mono">Завантаження…</p> : (
              <div className="adm-table">
                <div className="adm-tr adm-th adm-tr-4"><span>Email</span><span>Експрес-витік</span><span>Глибокий</span><span>Рівні</span></div>
                {(rows || []).map((r) => {
                  const money = r.record?.stage1Money;
                  const tiers = Object.entries(r.funnel?.tierStatus || {});
                  return (
                    <div key={r.userId} className="adm-tr adm-tr-4">
                      <span className="adm-c-email">{r.email}</span>
                      <span className="mono">{money ? `${eur(money[0])}–${eur(money[1])}` : r.hasExpress ? 'є' : '—'}</span>
                      <span className="mono">{r.hasDeep ? 'у роботі' : '—'}</span>
                      <span className="adm-c-tiers">{tiers.length === 0 ? <i className="mono">—</i> : tiers.map(([tid, s]) => <span key={tid} className={`cab-badge mono tst-${ST[s].cls}`}>{tid}</span>)}</span>
                    </div>
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
                    <div className="mc-card-top"><div><b className="mc-email">{r.email}</b>{r.company && <span className="mc-company mono"> · {r.company}</span>}</div></div>
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

        {/* ── Заявки ── */}
        {tab === 'leads' && (
          <section className="adm-sec">
            <h1 className="sysx-display adm-h1">Заявки</h1>
            {leads === null ? <p className="mc-msg mono">Завантаження…</p>
              : leads.length === 0 ? <p className="mc-msg mono">Заявок немає. Щоб вони збиралися сюди, потрібна таблиця <code>leads</code> у Supabase і запис із форм (див. INFRA.md). Зараз ліди йдуть лише поштою.</p>
              : (
              <div className="adm-table">
                <div className="adm-tr adm-th adm-tr-4"><span>Дата</span><span>Контакт</span><span>Джерело</span><span>Задача</span></div>
                {leads.map((l) => (
                  <div key={l.id} className="adm-tr adm-tr-4">
                    <span className="mono adm-c-date">{l.at ? new Date(l.at).toLocaleString('uk-UA') : '—'}</span>
                    <span className="mono">{l.email || l.phone || l.name || '—'}</span>
                    <span className="mono">{l.source || '—'}</span>
                    <span>{l.task || l.comment || '—'}</span>
                  </div>
                ))}
              </div>
            )}
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
      {detail && <UserDetail row={detail} onClose={() => setOpenUser(null)} openFile={openFile} />}
    </div>
  );
}

function Tile({ n, l, accent }: { n: number; l: string; accent?: boolean }) {
  return <div className={`adm-tile${accent ? ' accent' : ''}`}><b className="adm-tile-n">{n}</b><span className="adm-tile-l">{l}</span></div>;
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

function UserDetail({ row, onClose, openFile }: { row: AdminRow; onClose: () => void; openFile: (p: string) => void }) {
  const rec = row.record || {};
  const company = rec.company;
  const money = rec.stage1Money;
  const tiers = Object.entries(row.funnel?.tierStatus || {});
  const files = Object.entries(row.funnel?.tierFiles || {});
  return (
    <div className="adm-drawer-wrap" onClick={onClose}>
      <aside className="adm-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="adm-drawer-head"><b className="adm-email">{row.email}</b><button className="adm-x" onClick={onClose}>✕</button></div>
        <div className="adm-drawer-body">
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
            <div className="adm-tiers-row">{tiers.map(([tid, s]) => <span key={tid} className={`cab-badge mono tst-${ST[s].cls}`}>{tid} · {ST[s].txt}</span>)}</div>
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
