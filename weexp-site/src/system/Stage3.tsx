import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { eur, project, computeLoss, type LossInput } from './lossModel';
import { BLOCKS, SECTIONS, LIKE_WHAT, scoreStage3, type Stage3Answers, type RefItem } from './stage3Model';
import { levelFor } from './stage2Model';
import { RadarChart, SystemBars, HW } from './charts';
import { StepOverlay } from './StepOverlay';
import { FunnelSteps } from './FunnelSteps';

// «Жива» констеляція 8 систем (SVG, без WebGL) — ефектно, зрозуміло, без jank.
import { SystemOrbit } from '@/system/SystemOrbit';
const Stage5 = lazy(() => import('@/system/Stage5').then((m) => ({ default: m.Stage5 })));
import { CONFIGURED, authenticate, currentUser, isCloudUser, loadDiag, saveDiag, signOut, type DiagUser, type DiagRecord } from '@/lib/supa';
import { sendReport } from '@/lib/report';
import { openReportPage, downloadWorksheetXls, type DocData } from '@/lib/docs';
import './system.css';

/**
 * Калькулятор · Етап 3 (Tier-2) у кабінеті. Через реєстрацію: дані всіх етапів
 * зберігаються (Supabase або локально), заповнення можна призупинити й продовжити
 * будь-коли. ~35 блоків по секціях, переважно вибір; руками — лише посилання й
 * числа. На виході — інтерактивний Tier-2 звіт (зрілість, конкурентне поле,
 * маркетинг/фінанси, позиціонування) з експортом у PDF.
 */
const MAIL = 'hello@weexp.agency';
const host = (u: string) => u.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

// Крок 4 відкривається Access Code від менеджера (або оплатою). Реальні коди —
// через env VITE_ACCESS_CODES (через кому); поки не налаштовано, приймаємо
// демо-формат WEEXP-XXXX, щоб потік був робочим.
const ACCESS_CODES = ((import.meta.env.VITE_ACCESS_CODES as string | undefined) || '')
  .split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
const isValidCode = (c: string) => {
  const u = c.trim().toUpperCase();
  if (!u) return false;
  return ACCESS_CODES.length ? ACCESS_CODES.includes(u) : /^WEEXP-[A-Z0-9]{3,}$/.test(u);
};
// Впевненість висновку за повнотою даних (Evidence → Confidence).
const confLabel = (completeness: number) => (completeness >= 70 ? 'висока' : completeness >= 45 ? 'середня' : 'попередня');

export function Stage3({ prior, onClose, standalone }: { prior?: DiagRecord; onClose: () => void; standalone?: boolean }) {
  const [user, setUser] = useState<DiagUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState(''); const [pass, setPass] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [ans, setAns] = useState<Stage3Answers>({});
  const [idx, setIdx] = useState(0);           // індекс блоку; BLOCKS.length = звіт
  const [saved, setSaved] = useState(false);   // пульс «збережено» після автозбереження
  const [hover, setHover] = useState<number | null>(null);
  const [money, setMoney] = useState<[number, number] | undefined>(prior?.stage1Money);  // €-якір з Етапу 1
  const [stage1Inp, setStage1Inp] = useState<LossInput | undefined>(prior?.stage1 as LossInput | undefined);  // для проєкції «куди прийдемо»
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<false | 'sent' | 'saved'>(false);
  // Крок 4 — ворота Access Code
  const [step4On, setStep4On] = useState(false);     // розгорнуто поле коду
  const [step4Code, setStep4Code] = useState('');
  const [step4Err, setStep4Err] = useState('');
  const [step4Unlocked, setStep4Unlocked] = useState(false);
  const [step5On, setStep5On] = useState(false);     // відкрито AI-інтерв'ю Кроку 5
  const quizRef = useRef<HTMLDivElement>(null);      // скрол-контейнер питань (для reset при зміні блоку)
  const saveT = useRef<number | undefined>(undefined);

  useEffect(() => { currentUser().then((u) => { setUser(u); setChecking(false); }); }, []);

  // Після входу — вантажимо збережене + прикріплюємо дані попередніх етапів.
  useEffect(() => {
    if (!user) return;
    loadDiag(user).then((rec) => {
      if (rec.stage3) setAns(rec.stage3 as Stage3Answers);
      if (rec.stage1Money && !money) setMoney(rec.stage1Money);
      if ((rec as { stage1?: LossInput }).stage1 && !stage1Inp) setStage1Inp((rec as { stage1?: LossInput }).stage1);
      if (prior) saveDiag(user, { ...prior }); // stage1/2 зберігаються теж
      // Повернення в кабінет із завершеним розбором → одразу показуємо звіт.
      if ((rec.stage3 as Record<string, unknown> | undefined)?.__submitted) setIdx(BLOCKS.length);
      if ((rec.stage3 as Record<string, unknown> | undefined)?.__step4) setStep4Unlocked(true);
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Автозбереження прогресу (debounce) + пульс «збережено».
  // При зміні блоку — прокрутити крок на початок (щоб екран не «зависав» посередині)
  useEffect(() => { quizRef.current?.scrollTo({ top: 0 }); }, [idx]);

  useEffect(() => {
    if (!user) return;
    clearTimeout(saveT.current);
    saveT.current = window.setTimeout(() => {
      saveDiag(user, { stage3: ans }).then(() => { setSaved(true); window.setTimeout(() => setSaved(false), 1600); });
    }, 700);
    return () => clearTimeout(saveT.current);
  }, [ans, user]);

  const doAuth = async () => {
    setErr(''); setBusy(true);
    const r = await authenticate(email.trim(), pass);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    if (r.notice) setErr(r.notice);
    if (r.user) setUser(r.user);
  };
  const logout = async () => { await signOut(); setUser(null); setIdx(0); };
  // Прокрутка всередині кабінету (оверлей .s2 — свій скрол-контейнер)
  const scrollCab = (sel?: string) => {
    if (sel) { document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    document.querySelector('.s2.s3')?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // Шапка робочого акаунта — щоб клієнт розумів, що він у своєму кабінеті (а не на сторінці сайту)
  const accountBar = (full: boolean) => (
    <div className="cab-bar">
      <div className="cab-id">
        <span className="cab-badge mono">● Кабінет</span>
        <span className="cab-email mono">{user?.email}</span>
      </div>
      <div className="cab-actions">
        {full && <>
          <button className="cab-nav mono" onClick={() => scrollCab()}>Огляд</button>
          <button className="cab-nav mono" onClick={() => scrollCab('.s3-docs')}>Документи</button>
          <button className="cab-nav mono" onClick={() => { setIdx(0); scrollCab(); }}>Дані</button>
        </>}
        <button className="cab-out mono" onClick={logout}>Вийти</button>
        <button className="cab-site mono" onClick={onClose}>На сайт →</button>
      </div>
    </div>
  );
  const unlockStep4 = () => {
    if (!isValidCode(step4Code)) { setStep4Err('Код недійсний. Попросіть його в менеджера або оберіть оплату.'); return; }
    setStep4Err(''); setStep4Unlocked(true);
    if (user) saveDiag(user, { stage3: { ...ans, __step4: true } as Record<string, unknown> });
  };
  const cloud = isCloudUser(user);

  const set = (id: string, v: Stage3Answers[string]) => setAns((a) => ({ ...a, [id]: v }));
  const toggle = (id: string, i: number) => setAns((a) => {
    const cur = (a[id] as number[]) || []; return { ...a, [id]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] };
  });

  const res = useMemo(() => (idx >= BLOCKS.length ? scoreStage3(ans, money) : null), [idx, ans, money]);
  // Живий зріз — щоб 3D-район компанії «зростав», поки клієнт заповнює дані.
  const live = useMemo(() => scoreStage3(ans, money), [ans, money]);
  // Секції кабінету — щоб клієнт стрибав у будь-яку й редагував, а не проходив лінійно.
  const sections = useMemo(() => (SECTIONS as readonly string[]).map((name) => {
    const idxs = BLOCKS.map((b, i) => (b.section === name ? i : -1)).filter((i) => i >= 0);
    const answered = idxs.filter((i) => { const a = ans[BLOCKS[i].id]; return a != null && a !== '' && (!Array.isArray(a) || a.length > 0); }).length;
    return { name, start: idxs[0] ?? 0, total: idxs.length, answered };
  }), [ans]);
  const answeredCount = BLOCKS.filter((b) => { const a = ans[b.id]; return a != null && a !== '' && (!Array.isArray(a) || a.length); }).length;
  const moneyStr = money && money[0] > 0 ? `${eur(money[0])}–${eur(money[1])}` : '';
  // Ціль (точка Б) з першого блоку — щоб вести весь розбір саме до неї.
  const goalBlock = BLOCKS.find((b) => b.id === 'goal_b');
  const goalLabels = Array.isArray(ans['goal_b']) && goalBlock?.options
    ? (ans['goal_b'] as number[]).map((i) => goalBlock.options![i]?.label).filter(Boolean) as string[] : [];

  /* ── Auth gate ── */
  if (checking) return <StepOverlay><div className="sysx s2 s3"><div className="s3-auth"><span className="mono">…</span></div></div></StepOverlay>;
  if (!user) {
    return (
      <StepOverlay>
      <div className="sysx s2 s3" role="dialog" aria-label="Етап 3 — кабінет">
        {standalone
          ? <button className="s2-x mono" onClick={onClose}>✕ Закрити</button>
          : <div className="s2-flowhead"><button className="s2-flowback mono" onClick={onClose}>← Назад до карти</button><FunnelSteps active={5} /></div>}
        <div className="s3-auth">
          <div className="sysx-kick">{standalone ? 'Особистий кабінет клієнта' : 'Крок 5 з 5 — ваш робочий кабінет'}</div>
          <h2 className="sysx-display s3-auth-h">{standalone ? <>Вхід у ваш<br />кабінет WEEXP</> : <>Ваш персональний<br />Tier-2 розбір</>}</h2>
          <p className="s3-auth-lead">{standalone
            ? 'Увійдіть тим самим email — і побачите свій збережений розбір: дані з калькулятора, профіль зрілості й дорожню карту. Немає кабінету — створимо за 10 секунд.'
            : (moneyStr ? <>Ми вже оцінили вашу можливість у <b>{moneyStr}/рік</b>. Кабінет доводить аналіз до Tier-2 і показує, де саме вона зосереджена — на ваших даних.</> : 'Кабінет доводить аналіз до рівня Tier-2 — на ваших даних, а не загальних порадах.')}</p>
          <ul className="s3-auth-gets">
            <li>Профіль зрілості 8 систем і головний вузол вашого бізнесу</li>
            <li>Ваші дані з калькулятора — збережені й доступні будь‑коли</li>
            <li>Персональні наступні кроки під Definition of Done</li>
          </ul>
          <div className="s3-auth-form">
            <label className="s2-inp"><span className="mono">Email</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></label>
            <label className="s2-inp"><span className="mono">Пароль</span><input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="мінімум 6 символів" /></label>
            {err && <span className="s3-err mono">{err}</span>}
            <button className="sysx-cta is-primary" onClick={doAuth} disabled={busy || !email || pass.length < 6}>{busy ? 'Заходимо…' : (standalone ? 'Увійти / створити кабінет →' : 'Створити кабінет і продовжити →')}</button>
            <span className="s2-note mono">Той самий email — той самий кабінет із будь‑якого пристрою.{!CONFIGURED ? ' Демо-режим: дані у цьому браузері.' : ''}</span>
          </div>
        </div>
      </div>
      </StepOverlay>
    );
  }

  /* ── Report ── */
  if (res) {
    const lvl = levelFor(res.overall);
    const audit = res.recos[0];
    const proj = stage1Inp ? project(stage1Inp, computeLoss(stage1Inp)) : null;
    // Дані для завантажуваних документів (Word-звіт / Excel-аркуш) — ТЗ §19
    const docData: DocData = {
      email: user.email, site: typeof prior?.site === 'string' ? prior.site : undefined,
      createdAt: new Date().toISOString(), overall: res.overall, levelTitle: lvl.title, levelLine: lvl.line,
      completeness: res.completeness, moneyStr, bottleneck: res.bottleneck, epiphany: res.epiphany, goals: res.goals,
      systems: res.systems.map((s) => ({ label: s.label, score: s.score })), pains: res.pains, roadmap: res.roadmap,
      competitors: res.competitors, marketing: res.marketing, finance: res.finance,
      projection: proj ? { income: proj.income, unit: proj.unit, ops: proj.ops, upliftPct: proj.upliftPct, horizon: proj.horizon } : undefined,
    };
    // Контекст для Кроку 5 (AI-інтерв'ю) — той самий зріз, що й у документах
    const s5Ctx = {
      site: docData.site, overall: res.overall, bottleneck: res.bottleneck, goals: res.goals,
      pains: res.pains, systems: res.systems.map((s) => ({ label: s.label, score: s.score })),
      marketing: res.marketing, finance: res.finance, completeness: res.completeness,
    };
    const saveStep5 = (h: { q: string; a: string }[]) => saveDiag(user, { stage3: { ...ans, __step5: h } as Record<string, unknown> });
    const doSend = async () => {
      setSending(true);
      const r = await sendReport({
        email: user.email, site: typeof prior?.site === 'string' ? prior.site : '',
        stage1Money: money, overall: res.overall,
        bottleneck: { label: res.bottleneck.label, score: res.bottleneck.score }, epiphany: res.epiphany,
        goals: res.goals, pains: res.pains, roadmap: res.roadmap, competitors: res.competitors, likes: res.likes,
        marketing: res.marketing, finance: res.finance, completeness: res.completeness,
        createdAt: new Date().toISOString(),
      });
      saveDiag(user, { stage3: { ...ans, __submitted: true } as Record<string, unknown> });
      setSending(false); setSent(r.mode);
    };
    return (
      <StepOverlay>
      <div className="sysx s2 s3" role="dialog" aria-label="Tier-2 звіт">
        {standalone && user
          ? accountBar(true)
          : <div className="s2-flowhead"><button className="s2-flowback mono" onClick={onClose}>← Назад до карти</button><FunnelSteps active={5} /></div>}
        <div className="s2-report">
          <header className="s2-rep-head">
            <div className="sysx-kick">Tier-2 звіт · {user.email} · заповнено {res.completeness}% даних</div>
            <h1 className="sysx-display s2-rep-h">Зрілість Tier-2 — <span className="sysx-em">{res.overall}</span><i>/100</i></h1>
            <p className="s2-rep-line"><b>{lvl.title}.</b> {lvl.line}</p>
            {moneyStr && <p className="s3-rep-money mono">Ваша можливість з Етапу 1: <b>{moneyStr}/рік</b> — тепер видно, де саме вона зосереджена.</p>}
          </header>

          {/* Вісім систем як «скайлайн»: висота стовпчика = зрілість, колір = здоров'я.
              Зрозуміло з першого погляду — де просідає й що тягне бізнес. */}
          <div className="s2-panel cw-hero">
            <div className="cw-hero-copy">
              <span className="sysx-kick">Ваша компанія як система</span>
              <p className="cw-hero-sub">Вісім стовпчиків — вісім систем онлайн-продажів. Висота = зрілість, колір = здоров'я. Найнижчий червоний — ваше вузьке місце, звідки витікають гроші.</p>
              <div className="cw-legend">
                <span><i className="cw-dot ok" />зріла (65+)</span>
                <span><i className="cw-dot warn" />середня (40–64)</span>
                <span><i className="cw-dot bad" />слабка (&lt;40)</span>
              </div>
            </div>
            <div className="cw-stage">
              <SystemOrbit systems={res.systems} completeness={res.completeness} />
            </div>
          </div>

          <div className="s2-grid">
            <div className="s2-panel s2-radar-wrap">
              <span className="sysx-kick">Профіль зрілості (Tier-2)</span>
              <RadarChart systems={res.systems} hover={hover} onHover={setHover} />
              <span className="s2-hint mono">Наведіть на систему — підсвітиться скрізь</span>
            </div>
            <div className="s2-panel">
              <span className="sysx-kick">Оцінка по системах</span>
              <SystemBars systems={res.systems} hover={hover} onHover={setHover} />
            </div>

            <div className="s2-panel">
              <span className="sysx-kick">Конкурентне поле</span>
              <div className="s3-cols">
                <div><b className="s3-sub">Прямі</b>{res.competitors.direct.length ? <ul className="s3-list">{res.competitors.direct.map((u) => <li key={u}>{host(u)}</li>)}</ul> : <span className="s3-empty">—</span>}</div>
                <div><b className="s3-sub">Непрямі</b>{res.competitors.indirect.length ? <ul className="s3-list">{res.competitors.indirect.map((u) => <li key={u}>{host(u)}</li>)}</ul> : <span className="s3-empty">—</span>}</div>
              </div>
              {res.likes.length > 0 && <div className="s3-likes"><b className="s3-sub">Орієнтири</b>{res.likes.map((l) => <div key={l.url} className="s3-like"><span className="mono">{host(l.url)}</span><span className="s3-like-w">{l.what.join(' · ') || '—'}</span></div>)}</div>}
            </div>

            <div className="s2-panel">
              <span className="sysx-kick">Маркетинг і фінанси (ваші дані)</span>
              <div className="s3-metrics">
                {[...res.marketing, ...res.finance].map((m) => (
                  <div key={m.label} className="s3-metric"><span>{m.label}</span><b className="mono">{m.value}</b></div>
                ))}
              </div>
            </div>
          </div>

          <div className="s2-panel s3-verdict">
            <span className="sysx-kick">Головний висновок</span>
            <p className="s3-epiphany">{res.epiphany}</p>
            <p className="s3-verdict-sub">«{res.bottleneck.label}» — {res.bottleneck.score}/100. Саме з цієї ланки почнеться Tier-2-побудова: разом із вашими даними ми зведемо це в план під Definition of Done{res.goals.length ? ` — під вашу ціль` : ''}.</p>
            {res.goals.length > 0 && (
              <div className="s3-goals"><span className="s3-sub">Ваша ціль</span><div className="s3-goal-chips">{res.goals.map((g) => <span key={g} className="s3-goal-chip">{g}</span>)}</div></div>
            )}
          </div>

          {/* «Зараз → Куди можемо прийти» — уточнена ціль (Tier-2), не рахуємо наново */}
          {proj && (proj.income.length > 0 || proj.unit.length > 0) && (
            <div className="s2-project">
              <div className="s2-proj-head">
                <span className="sysx-kick">Зараз → Куди можемо прийти · уточнена ціль (Tier-2)</span>
                <p className="s2-proj-sub">Та сама модель, що й на Кроках 1–2, але звужена вашими даними кабінету. Приріст доходу обмежено вже порахованою можливістю.</p>
              </div>
              {proj.income.length > 0 && (
                <div className="s2-proj-income">
                  {proj.income.map((d) => (
                    <div key={d.label} className={`s2-proj-inc${d.hero ? ' is-hero' : ''}`}>
                      <span className="s2-proj-inc-l mono">{d.label}</span>
                      <div className="s2-proj-inc-v"><span className="s2-proj-now">{d.before}</span><em aria-hidden="true">→</em><b className="sysx-display s2-proj-aft">{d.after}</b></div>
                      <span className="s2-proj-badge up">+{d.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
              {(proj.unit.length > 0 || proj.ops.length > 0) && (
                <div className="s2-proj-rows">
                  {[...proj.unit, ...proj.ops].map((d) => (
                    <div key={d.label} className="s2-proj-row">
                      <span className="s2-proj-row-l">{d.label}</span>
                      <span className="s2-proj-row-v"><i className="s2-proj-b">{d.before}</i><em aria-hidden="true">→</em><b>{d.after}</b></span>
                      <span className={`s2-proj-badge ${d.dir}`}>{d.dir === 'down' ? '−' : '+'}{d.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ключові болі — реально з відповідей */}
          {res.pains.length > 0 && (
            <div className="s2-panel s3-pains">
              <span className="sysx-kick">Ключові болі — що ми побачили у ваших відповідях</span>
              <div className="s3-pain-grid">
                {res.pains.map((p) => (
                  <div key={p.label} className="s3-pain"><b>{p.label}</b>{p.detail && <span>{p.detail}</span>}</div>
                ))}
              </div>
            </div>
          )}

          {/* Дорожня карта — розмиті вектори «як прийти до результату» */}
          {res.roadmap.length > 0 && (
            <div className="s2-panel s3-roadmap">
              <span className="sysx-kick">Вектори дорожньої карти{res.goals.length ? ' — до вашої цілі' : ''}</span>
              <div className="s3-road">
                {res.roadmap.map((r, i) => (
                  <div key={r.title} className="s3-road-step">
                    <i className="s3-road-n mono">{String(i + 1).padStart(2, '0')}</i>
                    <div className="s3-road-c"><b>{r.title}</b><span>{r.detail}</span></div>
                  </div>
                ))}
              </div>
              <span className="s3-road-note mono">Точні кроки, терміни й окупність — складемо разом на розборі.</span>
            </div>
          )}

          {/* Наступні кроки — показуємо ЛИШЕ поки Крок 4 не активовано (щоб не було
              купи конкурентних CTA одразу). Після активації — лінійно веде розбір нижче. */}
          {!step4Unlocked && (
          <div className="s3-recos">
            <div className="s2-panel s3-reco strong">
              <span className="s3-reco-tag mono">Рекомендовано</span>
              <span className="sysx-kick">Наступний крок</span>
              <b className="sysx-display s3-reco-h">{audit.title}</b>
              <p className="s3-reco-p">{audit.reason}</p>
              <ul className="s3-reco-bul">{audit.bullets.map((x) => <li key={x}>{x}</li>)}</ul>
              <div className="s3-reco-actions">
                <Link to={audit.to} className="sysx-cta is-primary">{audit.cta}</Link>
                {sent
                  ? <span className="s3-sent mono">✓ {sent === 'sent' ? 'Зріз надіслано команді' : 'Зріз збережено — команда його отримає'}</span>
                  : <button className="sysx-cta" onClick={doSend} disabled={sending}>{sending ? 'Надсилаємо…' : 'Надіслати зріз команді'}</button>}
              </div>
              <span className="s3-reco-rr mono">{audit.riskReversal} · зустріч почнемо з вашого контексту, не з нуля</span>
            </div>
            <div className="s2-panel s3-reco">
              <span className="sysx-kick">Крок 4 · Поглиблена діагностика</span>
              <b className="sysx-display s3-reco-h">Продовжуємо дослідження</b>
              <p className="s3-reco-p">Ми майже готові скласти ваш план. Крок 4 звіряє попередні відповіді, знаходить <b>ключові болі, докази й причини</b> та формує <b>первинну дорожню карту</b>. Глибина зростає, але діагностика ще не завершена.</p>
              {(() => { const cov = Math.min(72, 30 + Math.round(res.completeness * 0.35)); return (
                <div className="s3-depth"><span className="mono">Diagnostic Coverage зараз ~{cov}%</span>
                  <div className="s3-depth-track"><i style={{ width: `${cov}%` }} /><i className="s3-depth-goal" /></div>
                  <span className="mono">Крок 4 → 75%+ · Крок 5 закриває решту</span>
                </div>
              ); })()}
              {!step4Unlocked && !step4On && (
                <button className="sysx-cta is-primary" onClick={() => setStep4On(true)}>Продовжити діагностику (Крок 4) →</button>
              )}
              {!step4Unlocked && step4On && (
                <div className="s3-gate">
                  <label className="s2-inp"><span className="mono">Access Code</span>
                    <input value={step4Code} onChange={(e) => setStep4Code(e.target.value)} placeholder="WEEXP-XXXX" autoFocus />
                  </label>
                  {step4Err && <span className="s3-err mono">{step4Err}</span>}
                  <button className="sysx-cta is-primary" onClick={unlockStep4} disabled={!step4Code.trim()}>Активувати Крок 4 →</button>
                  <span className="s3-gate-note mono">Код видає WEEXP після короткого дзвінка — так у глибоку роботу беремо лише готові проєкти. Немає коду? Натисніть «{audit.cta.replace(' →', '')}» вище — призначимо дзвінок.</span>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Крок 4 · результат — Key Problems + Evidence + Diagnosis + Roadmap (за кодом) */}
          {step4Unlocked && (
            <div className="s2-panel s3-step4">
              <span className="sysx-kick">Крок 4 · Поглиблений розбір</span>
              <h3 className="sysx-display s3-step4-h">Ключові проблеми, докази й напрям руху</h3>
              <p className="s3-step4-intro">Ми <b>не питаємо заново</b> — зводимо ваші відповіді з Кроків 1–3 у докази, впевненість і пріоритети. Нові питання під ваш конкретний випадок з'являться на <b>Кроці 5 (AI-інтерв'ю)</b>.</p>

              {res.pains.length > 0 && (
                <div className="s3-kp">
                  <div className="s3-kp-head mono"><span>Проблема</span><span>Докази</span><span>Впевненість</span><span>Пріоритет</span></div>
                  {res.pains.slice(0, 6).map((p, i) => (
                    <div key={p.label} className="s3-kp-row">
                      <b>{p.label}</b>
                      <span className="s3-kp-ev">{p.detail || 'за вашими відповідями'}</span>
                      <span className="s3-kp-conf">{confLabel(res.completeness)}</span>
                      <span className="s3-kp-pri mono">P{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="s3-step4-diag">
                <span className="sysx-kick">Попередній діагноз</span>
                <p className="s3-epiphany">{res.epiphany}</p>
                <p className="s3-verdict-sub">Вузьке місце — «{res.bottleneck.label}» ({res.bottleneck.score}/100). Це не вирок «потрібен новий сайт» чи «винен відділ»: спершу перевіряємо дані (UX, аналітику, конверсію, процеси), і лише тоді — рішення. Логіка: <b>Проблема → Докази → Впевненість → Вплив → Пріоритет</b>.</p>
              </div>

              {res.roadmap.length > 0 && (
                <div className="s3-step4-road">
                  <span className="sysx-kick">Первинна дорожня карта</span>
                  <div className="s3-road">
                    {res.roadmap.map((r, i) => (
                      <div key={r.title} className="s3-road-step">
                        <i className="s3-road-n mono">{String(i + 1).padStart(2, '0')}</i>
                        <div className="s3-road-c"><b>{r.title} <span className="s3-road-pri mono">P{i + 1} · {i === 0 ? 'висока віддача' : i === 1 ? 'середня складність' : 'фонова'}</span></b><span>{r.detail}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="s3-step4-cta">
                <button className="sysx-cta is-primary" onClick={() => setStep5On(true)}>Крок 5 — глибока AI-діагностика →</button>
                <Link to="/contact" className="sysx-cta">Запланувати зустріч</Link>
                <span className="s3-step4-note mono">Крок 5 динамічно ставить питання під ваш випадок і зводить докази, корені й дорожню карту. Відповіді зберігаються у вашому кабінеті.</span>
              </div>
            </div>
          )}

          {/* Забрати з собою — один блок, надійні завантаження (ТЗ §19) */}
          <div className="s2-panel s3-docs">
            <div className="s3-docs-l">
              <span className="sysx-kick">Забрати з собою</span>
              <b className="sysx-display s3-docs-h">Документи діагностики</b>
              <p className="s3-reco-p">Фірмовий звіт — вашими даними. PDF відкриється окремою вкладкою (звідти «Поділитися → Зберегти в файли» або друк у PDF). Excel-таблиця — для розрахунків.</p>
            </div>
            <div className="s3-docs-r">
              <button className="sysx-cta is-primary" onClick={() => openReportPage(docData)}>Завантажити звіт (PDF) ↓</button>
              <button className="sysx-cta" onClick={() => downloadWorksheetXls(docData)}>Excel-таблиця ↓</button>
            </div>
          </div>

          {/* Тиха довіра + розбірливість (без тиску) */}
          <div className="s3-trust mono">
            <span>Ваш зріз особисто перегляне хтось із команди — не бот.</span>
            <span>Беремо обмежену кількість проєктів на місяць: розбір допоможе зрозуміти, чи підходимо одне одному.</span>
          </div>

          <div className="s2-rep-foot">
            <div className="s2-foot-l">
              <img src="/qr.svg" alt="QR — weexp.agency" className="s2-qr" width={72} height={72} />
              <div className="s2-foot-c"><b>WEEXP — Система замість героїзму</b><span className="mono">weexp.agency · {MAIL}</span><span className="s2-note mono">{cloud ? `Дані збережено у вашому кабінеті (${user.email}).` : `Збережено локально в цьому браузері (${user.email}). Хмарний кабінет підключиться після налаштування.`}</span></div>
            </div>
            <div className="s2-foot-cta">
              <button className="sysx-cta" onClick={() => setIdx(0)}>Редагувати дані</button>
              <button className="sysx-cta" onClick={logout}>Вийти</button>
            </div>
          </div>
        </div>
        {step5On && <Suspense fallback={null}><Stage5 context={s5Ctx} onClose={() => setStep5On(false)} onSaveHistory={saveStep5} /></Suspense>}
      </div>
      </StepOverlay>
    );
  }

  /* ── Questionnaire (один блок на екран — кінематографічно) ── */
  const b = BLOCKS[idx];
  const secOf = b.section;
  const secIndex = (SECTIONS as readonly string[]).indexOf(secOf);
  const progress = Math.round((idx / BLOCKS.length) * 100);
  const val = ans[b.id];
  const urls: string[] = b.kind === 'urllist' ? (Array.isArray(val) ? (val as string[]) : ['']) : [];
  const refs: RefItem[] = b.kind === 'refs' ? (Array.isArray(val) && val.length ? (val as RefItem[]) : [{ url: '', what: [] }]) : [];
  const filled =
    b.kind === 'urllist' ? urls.some((u) => u && u.trim())
    : b.kind === 'refs' ? refs.some((r) => r.url && r.url.trim())
    : val != null && val !== '' && (!Array.isArray(val) || val.length > 0);
  const go = (n: number) => setIdx(Math.max(0, Math.min(BLOCKS.length, n)));
  const pickSingle = (i: number) => { set(b.id, i); window.setTimeout(() => go(idx + 1), 170); };
  const lastBlock = idx + 1 >= BLOCKS.length;
  const firstOfSection = idx > 0 && BLOCKS[idx].section !== BLOCKS[idx - 1].section;
  const prevSection = firstOfSection ? BLOCKS[idx - 1].section : '';

  // Динамічні списки: конкуренти (urllist) і сайти-орієнтири (refs).
  const setUrls = (next: string[]) => set(b.id, next.length ? next : ['']);
  const setRefs = (next: RefItem[]) => set(b.id, (next.length ? next : [{ url: '', what: [] }]) as unknown as string[]);

  return (
    <StepOverlay>
    <div ref={quizRef} className="sysx s2 s3" role="dialog" aria-label="Етап 3 — питання">
      {standalone && user
        ? accountBar(false)
        : <div className="s2-flowhead"><button className="s2-flowback mono" onClick={onClose}>← Назад до карти</button><FunnelSteps active={5} /></div>}
      <div className="s2-quiz s3-flow">
        <div className="s2-quiz-head">
          <div className="s3-flow-top">
            <span className="sysx-kick">Етап 3 · Tier-2 · {secOf}</span>
            <span className="s3-flow-right-top">
              {moneyStr && <span className="s3-money-pill mono">Можливість: {moneyStr}/рік · уточнюємо…</span>}
              <span className={`s3-save mono${saved ? ' on' : ''}`}>{cloud ? 'збережено в кабінеті' : 'збережено'}</span>
            </span>
          </div>
          <div className="s2-bar"><i style={{ width: `${progress}%` }} /></div>
          {/* Навігатор секцій — стрибай у будь-яку секцію й редагуй; праворуч — звіт. */}
          <div className="s3-sections" role="tablist" aria-label="Секції кабінету — перейти й редагувати">
            {sections.map((s, si) => (
              <button key={s.name} role="tab" aria-selected={s.name === secOf}
                className={'s3-sec-chip' + (s.name === secOf ? ' is-on' : '') + (s.total > 0 && s.answered === s.total ? ' is-done' : '')}
                onClick={() => go(s.start)}>
                <b className="mono">{String(si + 1).padStart(2, '0')}</b> {s.name} <i className="mono">{s.answered}/{s.total}</i>
              </button>
            ))}
            <button className="s3-sec-chip s3-sec-report" role="tab" onClick={() => go(BLOCKS.length)} aria-label="Показати звіт">Звіт →</button>
          </div>
        </div>

        {/* Живий профіль 8 систем — зрозуміло росте з кожною відповіддю (без важкого 3D). */}
        <div className="cw-quiz">
          <div className="cw-quiz-cap mono">
            <span>Ваш профіль збирається — вісім систем</span>
            <b>{answeredCount} відповідей</b>
          </div>
          <SystemOrbit systems={live.systems} completeness={live.completeness} activeKey={live.systems.find((s) => s.label.split(/\s|\//)[0] === secOf.split(/\s|\//)[0])?.key} compact />
        </div>

        {firstOfSection && (
          <div className="s3-milestone mono" key={`m-${idx}`}>✓ Секцію «{prevSection}» пройдено · профіль на {progress}%</div>
        )}

        <div className="s2-card s3-one" key={b.id}>
          <div className="s2-step mono">Блок {idx + 1} / {BLOCKS.length} · секція {secIndex + 1}/{SECTIONS.length} · відповіли {answeredCount}</div>
          <h2 className="sysx-display s2-q">{b.label}</h2>
          {b.hint && <p className="s2-lead">{b.hint}</p>}
          {goalLabels.length > 0 && idx > 0 && <p className="s3-goal-thread mono">Крок до вашої цілі: {goalLabels.slice(0, 2).join(' · ')}</p>}

          {b.kind === 'url' && (
            <label className="s2-inp s3-one-inp"><span className="mono">Посилання</span>
              <input type="url" inputMode="url" placeholder={b.placeholder || 'https://'} value={(val as string) || ''} onChange={(e) => set(b.id, e.target.value)} />
            </label>
          )}
          {b.kind === 'number' && (
            <label className="s2-inp s3-one-inp"><span className="mono">{b.unit || 'Значення'}</span>
              <input type="number" inputMode="decimal" placeholder="0" value={(val as string) ?? ''} onChange={(e) => set(b.id, e.target.value)} />
            </label>
          )}
          {b.kind === 'single' && (
            <div className="s2-opts">
              {b.options!.map((o, i) => (
                <button key={o.label} className={`s2-opt${val === i ? ' on' : ''}`} onClick={() => pickSingle(i)}>
                  <span className="s2-opt-mark" aria-hidden="true" />{o.label}
                </button>
              ))}
            </div>
          )}
          {b.kind === 'multi' && (
            <div className="s2-opts">
              {b.options!.map((o, i) => (
                <button key={o.label} className={`s2-opt${Array.isArray(val) && (val as number[]).includes(i) ? ' on' : ''}`} onClick={() => toggle(b.id, i)}>
                  <span className="s2-opt-mark" aria-hidden="true" />{o.label}
                </button>
              ))}
            </div>
          )}

          {b.kind === 'urllist' && (
            <div className="s3-list-in">
              {urls.map((u, i) => (
                <div key={i} className="s3-row">
                  <input type="url" inputMode="url" placeholder={b.placeholder || 'https://'} value={u}
                    autoFocus={i === urls.length - 1}
                    onChange={(e) => setUrls(urls.map((x, j) => (j === i ? e.target.value : x)))} />
                  {urls.length > 1 && <button className="s3-del" aria-label="Прибрати" onClick={() => setUrls(urls.filter((_, j) => j !== i))}>✕</button>}
                </div>
              ))}
              <button className="s3-add" onClick={() => setUrls([...urls, ''])}>{b.addLabel || '+ Додати ще'}</button>
            </div>
          )}

          {b.kind === 'refs' && (
            <div className="s3-refs">
              {refs.map((r, i) => (
                <div key={i} className="s3-ref">
                  <div className="s3-row">
                    <input type="url" inputMode="url" placeholder="https://" value={r.url}
                      autoFocus={i === refs.length - 1}
                      onChange={(e) => setRefs(refs.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                    {refs.length > 1 && <button className="s3-del" aria-label="Прибрати" onClick={() => setRefs(refs.filter((_, j) => j !== i))}>✕</button>}
                  </div>
                  <div className="s3-ref-what">
                    <span className="s3-ref-lab mono">Що саме подобається?</span>
                    <div className="s2-opts s3-chips">
                      {LIKE_WHAT.map((o, k) => {
                        const on = (r.what || []).includes(k);
                        return (
                          <button key={o.label} className={`s2-opt s2-opt-chip${on ? ' on' : ''}`}
                            onClick={() => setRefs(refs.map((x, j) => j === i
                              ? { ...x, what: on ? (x.what || []).filter((w) => w !== k) : [...(x.what || []), k] }
                              : x))}>
                            <span className="s2-opt-mark" aria-hidden="true" />{o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <button className="s3-add" onClick={() => setRefs([...refs, { url: '', what: [] }])}>{b.addLabel || '+ Ще сайт'}</button>
            </div>
          )}

          <div className="s2-quiz-actions s3-flow-actions">
            <span className="s3-flow-left">
              {idx > 0 && <button className="s2-back mono" onClick={() => go(idx - 1)}>← Назад</button>}
              <button className="s2-back mono" onClick={onClose}>Призупинити</button>
            </span>
            <span className="s3-flow-right">
              {b.kind === 'single' && !lastBlock && <button className="s2-back mono" onClick={() => go(idx + 1)}>Пропустити →</button>}
              {(b.kind !== 'single' || lastBlock) && (
                <button className="sysx-cta is-primary" onClick={() => go(idx + 1)}>
                  {lastBlock ? 'Показати Tier-2 звіт →' : filled ? 'Далі →' : 'Пропустити →'}
                </button>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
    </StepOverlay>
  );
}
