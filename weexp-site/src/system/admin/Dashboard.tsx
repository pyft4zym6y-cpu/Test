import { useMemo } from 'react';
import { type AdminRow, type LeadRow, type TierStatus } from '@/lib/supa';
import { eur } from '../systems';
import { ACCESS_SOURCES, EmptyState, ST, Tile, TrafficBlock, Trend, rel, srcName, type SiteTraffic } from './shared';
import { auditStatusOf, money, phaseOf, slaOf, PHASES } from './auditRequests';
import { DigestPanel } from './DigestPanel';

/**
 * Дашборд адмінки. Винесено з AdminPanel окремим лінивим модулем з двох причин:
 * файл розрісся до тисячі рядків, а його обчислення (воронка, розподіл статусів,
 * стрічка подій, тренд, гроші по фазах) крутились на КОЖНОМУ рендері адмінки —
 * навіть коли відкритий зовсім інший розділ.
 */
export function Dashboard({ rows, leads, traffic, period, onPeriod, onOpenClient }: {
  rows: AdminRow[] | null;
  leads: LeadRow[] | null;
  traffic: SiteTraffic | null | undefined;
  period: 7 | 30 | 90 | 0;
  onPeriod: (p: 7 | 30 | 90 | 0) => void;
  onOpenClient?: (userId: string) => void;
}) {
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
  
  /**
   * Гроші й цикл. Плитки вище відповідають на «скільки чого штук»; власнику
   * потрібне інше: де стоять гроші, скільки триває аудит, яка частка заявок
   * доходить до проєкту і що вже прострочено.
   */
  const biz = useMemo(() => {
    const r = rows || [];
    const withSt = r.map((x) => ({ x, st: auditStatusOf(x) })).filter((v) => v.st !== null) as { x: AdminRow; st: NonNullable<ReturnType<typeof auditStatusOf>> }[];
    const byPhase = PHASES.map((ph) => {
      const inPh = withSt.filter((v) => phaseOf(v.st) === ph.n);
      const sum = inPh.reduce((acc, v) => {
        const m = money(v.x);
        return { budget: acc.budget + m.budget, paid: acc.paid + m.paid, pending: acc.pending + m.pending, cost: acc.cost + m.cost };
      }, { budget: 0, paid: 0, pending: 0, cost: 0 });
      return { ...ph, n: inPh.length, ...sum };
    });
    // Тривалість аудиту: від видачі доступу до явного закриття етапу.
    const spans: number[] = [];
    for (const x of r) {
      const rec = x.record || {};
      const grantedAt = Object.values(rec.funnel?.tierHistory || {}).flat().filter((h) => h?.st === 'granted').map((h) => h.at).sort()[0];
      if (grantedAt && rec.auditClosedAt) {
        const d = (new Date(rec.auditClosedAt).getTime() - new Date(grantedAt).getTime()) / 86400000;
        if (d >= 0 && d < 400) spans.push(d);
      }
    }
    const avgAudit = spans.length ? Math.round(spans.reduce((a, b) => a + b, 0) / spans.length) : null;
    const reachedProject = withSt.filter((v) => phaseOf(v.st) >= 2).length;
    const conv = withSt.length ? Math.round((reachedProject / withSt.length) * 100) : 0;
    const breaches = r.filter((x) => slaOf(x).state === 'breach').length;
    const totals = byPhase.reduce((a, p) => ({ budget: a.budget + p.budget, paid: a.paid + p.paid, pending: a.pending + p.pending, cost: a.cost + p.cost }), { budget: 0, paid: 0, pending: 0, cost: 0 });
    return { byPhase, avgAudit, conv, reachedProject, cases: withSt.length, breaches, totals };
  }, [rows]);


  const setPeriod = onPeriod;
  return (
    <>
          <section className="adm-sec">
            <div className="adm-sec-head">
              <h1 className="sysx-display adm-h1">Дашборд</h1>
              <div className="adm-period">
                {([7, 30, 90, 0] as const).map((p) => (
                  <button key={p} className={`adm-period-b${period === p ? ' on' : ''}`} onClick={() => setPeriod(p)}>{p === 0 ? 'усі' : `${p}д`}</button>
                ))}
              </div>
            </div>
            <DigestPanel rows={rows} onOpen={onOpenClient} />
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
              <div className="adm-panel">
                <span className="adm-col-h mono">
                  Гроші й цикл · бюджет {eur(biz.totals.budget)} · оплачено {eur(biz.totals.paid)} · очікує {eur(biz.totals.pending)}
                  {biz.totals.cost > 0 && <> · собівартість {eur(biz.totals.cost)} · маржа <b className={biz.totals.paid - biz.totals.cost >= 0 ? '' : 'bad'}>{eur(biz.totals.paid - biz.totals.cost)}</b></>}
                </span>
                <div className="adm-money">
                  {biz.byPhase.map((p) => (
                    <div key={p.n} className="adm-money-cell">
                      <b className="mono">{p.l}</b>
                      <span className="mono adm-money-n">{p.n} клієнт.</span>
                      <span className="mono">бюджет {eur(p.budget)}</span>
                      <span className="mono adm-money-sub">оплачено {eur(p.paid)} · очікує {eur(p.pending)}</span>
                      {p.cost > 0 && <span className="mono adm-money-sub">витрати {eur(p.cost)} · маржа {eur(p.paid - p.cost)}</span>}
                    </div>
                  ))}
                </div>
                <div className="adm-money-kpi mono">
                  <span>Середній аудит: <b>{biz.avgAudit != null ? `${biz.avgAudit} дн.` : '— (жоден ще не закритий явно)'}</b></span>
                  <span>Доходять до проєкту: <b>{biz.conv}%</b> ({biz.reachedProject} з {biz.cases})</span>
                  <span className={biz.breaches ? 'bad' : ''}>Прострочено стадій: <b>{biz.breaches}</b></span>
                </div>
              </div>
            )}

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
                    {analytics.statusDist.every((d) => d.n === 0) && <p className="mono adm-empty">Запитів на аудит ще немає. Розподіл зʼявиться після першої заявки з сайту або кабінету.</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="adm-panel">
              <span className="adm-col-h mono">Джерела заявок · {period === 0 ? 'усі' : `${period} днів`}</span>
              {analytics.leadSources.length === 0 ? <p className="mono adm-empty">За цей період заявок не було — спробуйте ширший період угорі.</p> : (
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
                {analytics.recent.length === 0 ? <p className="mono adm-empty">За цей період подій не було. Стрічка збирає дії клієнтів і команди — розширте період, щоб побачити попередні.</p> : (
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
    </>
  );
}
