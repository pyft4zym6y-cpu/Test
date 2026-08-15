import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { eur } from './lossModel';
import { BLOCKS, SECTIONS, LIKE_WHAT, scoreStage3, type Stage3Answers, type RefItem } from './stage3Model';
import { levelFor } from './stage2Model';
import { RadarChart, SystemBars } from './charts';
import { CONFIGURED, authenticate, currentUser, isCloudUser, loadDiag, saveDiag, signOut, type DiagUser, type DiagRecord } from '@/lib/supa';
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

export function Stage3({ prior, onClose }: { prior?: DiagRecord; onClose: () => void }) {
  const [user, setUser] = useState<DiagUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState(''); const [pass, setPass] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [ans, setAns] = useState<Stage3Answers>({});
  const [idx, setIdx] = useState(0);           // індекс блоку; BLOCKS.length = звіт
  const [saved, setSaved] = useState(false);   // пульс «збережено» після автозбереження
  const [hover, setHover] = useState<number | null>(null);
  const [money, setMoney] = useState<[number, number] | undefined>(prior?.stage1Money);  // €-якір з Етапу 1
  const saveT = useRef<number | undefined>(undefined);

  useEffect(() => { currentUser().then((u) => { setUser(u); setChecking(false); }); }, []);

  // Після входу — вантажимо збережене + прикріплюємо дані попередніх етапів.
  useEffect(() => {
    if (!user) return;
    loadDiag(user).then((rec) => {
      if (rec.stage3) setAns(rec.stage3 as Stage3Answers);
      if (rec.stage1Money && !money) setMoney(rec.stage1Money);
      if (prior) saveDiag(user, { ...prior }); // stage1/2 зберігаються теж
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Автозбереження прогресу (debounce) + пульс «збережено».
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
  const cloud = isCloudUser(user);

  const set = (id: string, v: Stage3Answers[string]) => setAns((a) => ({ ...a, [id]: v }));
  const toggle = (id: string, i: number) => setAns((a) => {
    const cur = (a[id] as number[]) || []; return { ...a, [id]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] };
  });

  const res = useMemo(() => (idx >= BLOCKS.length ? scoreStage3(ans, money) : null), [idx, ans, money]);
  const answeredCount = BLOCKS.filter((b) => { const a = ans[b.id]; return a != null && a !== '' && (!Array.isArray(a) || a.length); }).length;
  const moneyStr = money && money[0] > 0 ? `${eur(money[0])}–${eur(money[1])}` : '';
  // Ціль (точка Б) з першого блоку — щоб вести весь розбір саме до неї.
  const goalBlock = BLOCKS.find((b) => b.id === 'goal_b');
  const goalLabels = Array.isArray(ans['goal_b']) && goalBlock?.options
    ? (ans['goal_b'] as number[]).map((i) => goalBlock.options![i]?.label).filter(Boolean) as string[] : [];

  /* ── Auth gate ── */
  if (checking) return <div className="s2 s3"><div className="s3-auth"><span className="mono">…</span></div></div>;
  if (!user) {
    return (
      <div className="s2 s3" role="dialog" aria-label="Етап 3 — кабінет">
        <button className="s2-x mono" onClick={onClose}>✕ Закрити</button>
        <div className="s3-auth">
          <div className="sysx-kick">Ви пройшли 2 з 3 етапів — лишився кабінет</div>
          <h2 className="sysx-display s3-auth-h">Ваш персональний<br />Tier-2 розбір</h2>
          <p className="s3-auth-lead">{moneyStr ? <>Ми вже оцінили вашу можливість у <b>{moneyStr}/рік</b>. Кабінет доводить аналіз до Tier-2 і показує, де саме вона зосереджена — на ваших даних.</> : 'Кабінет доводить аналіз до рівня Tier-2 — на ваших даних, а не загальних порадах.'}</p>
          <ul className="s3-auth-gets">
            <li>Профіль зрілості 7 систем і головний вузол вашого бізнесу</li>
            <li>Карта конкурентного поля й орієнтирів</li>
            <li>Персональні наступні кроки під Definition of Done</li>
          </ul>
          <div className="s3-auth-form">
            <label className="s2-inp"><span className="mono">Email</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></label>
            <label className="s2-inp"><span className="mono">Пароль</span><input type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="мінімум 6 символів" /></label>
            {err && <span className="s3-err mono">{err}</span>}
            <button className="sysx-cta is-primary" onClick={doAuth} disabled={busy || !email || pass.length < 6}>{busy ? 'Створюємо кабінет…' : 'Створити кабінет і продовжити →'}</button>
            <span className="s2-note mono">Прогрес зберігається — можна призупинити й продовжити будь-коли, з будь-якого пристрою.{!CONFIGURED ? ' Демо-режим: дані у цьому браузері.' : ''}</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Report ── */
  if (res) {
    const lvl = levelFor(res.overall);
    return (
      <div className="s2 s3" role="dialog" aria-label="Tier-2 звіт">
        <button className="s2-x mono" onClick={onClose}>✕ Закрити</button>
        <div className="s2-report">
          <header className="s2-rep-head">
            <div className="sysx-kick">Tier-2 звіт · {user.email} · заповнено {res.completeness}% даних</div>
            <h1 className="sysx-display s2-rep-h">Зрілість Tier-2 — <span className="sysx-em">{res.overall}</span><i>/100</i></h1>
            <p className="s2-rep-line"><b>{lvl.title}.</b> {lvl.line}</p>
            {moneyStr && <p className="s3-rep-money mono">Ваша можливість з Етапу 1: <b>{moneyStr}/рік</b> — тепер видно, де саме вона зосереджена.</p>}
          </header>

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

          {/* Нативні наступні кроки — щоб клієнт сам побачив, що це його рішення */}
          <div className="s3-recos">
            {res.recos.map((r) => (
              <div key={r.key} className={`s2-panel s3-reco${r.strong ? ' strong' : ''}`}>
                {r.strong && <span className="s3-reco-tag mono">Схоже, це про вас</span>}
                <span className="sysx-kick">{r.key === 'audit' ? 'Наступний крок' : 'Коли готові рости далі'}</span>
                <b className="sysx-display s3-reco-h">{r.title}</b>
                <p className="s3-reco-p">{r.reason}</p>
                <ul className="s3-reco-bul">{r.bullets.map((x) => <li key={x}>{x}</li>)}</ul>
                <Link to={r.to} className={`sysx-cta${r.strong ? ' is-primary' : ''}`}>{r.cta}</Link>
                <span className="s3-reco-rr mono">{r.riskReversal}</span>
              </div>
            ))}
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
              <button className="sysx-cta" onClick={() => window.print()}>Завантажити PDF ↓</button>
              <button className="sysx-cta" onClick={logout}>Вийти</button>
            </div>
          </div>
        </div>
      </div>
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
    <div className="s2 s3" role="dialog" aria-label="Етап 3 — питання">
      <button className="s2-x mono" onClick={onClose}>✕ Призупинити</button>
      <div className="s2-quiz s3-flow">
        <div className="s2-quiz-head">
          <div className="s3-flow-top">
            <span className="sysx-kick">Етап 3 · Tier-2 · {secOf}</span>
            <span className="s3-flow-right-top">
              {moneyStr && <span className="s3-money-pill mono">Можливість: {moneyStr}/рік · уточнюємо…</span>}
              <span className={`s3-save mono${saved ? ' on' : ''}`}>{cloud ? '☁ збережено' : '✓ збережено'}</span>
            </span>
          </div>
          <div className="s2-bar"><i style={{ width: `${progress}%` }} /></div>
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
              <input type="url" inputMode="url" placeholder={b.placeholder || 'https://'} value={(val as string) || ''} onChange={(e) => set(b.id, e.target.value)} autoFocus />
            </label>
          )}
          {b.kind === 'number' && (
            <label className="s2-inp s3-one-inp"><span className="mono">{b.unit || 'Значення'}</span>
              <input type="number" inputMode="decimal" placeholder="0" value={(val as string) ?? ''} onChange={(e) => set(b.id, e.target.value)} autoFocus />
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
  );
}
