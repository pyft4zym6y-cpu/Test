import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SYS } from './lossModel';
import { BLOCKS, SECTIONS, scoreStage3, type Block, type Stage3Answers } from './stage3Model';
import { levelFor } from './stage2Model';
import { CONFIGURED, authenticate, currentUser, loadDiag, saveDiag, signOut, type DiagUser, type DiagRecord } from '@/lib/supa';
import './system.css';

/**
 * Калькулятор · Етап 3 (Tier-2) у кабінеті. Через реєстрацію: дані всіх етапів
 * зберігаються (Supabase або локально), заповнення можна призупинити й продовжити
 * будь-коли. ~35 блоків по секціях, переважно вибір; руками — лише посилання й
 * числа. На виході — інтерактивний Tier-2 звіт (зрілість, конкурентне поле,
 * маркетинг/фінанси, позиціонування) з експортом у PDF.
 */
const short = (k: string) => SYS.find((s) => s.key === k)!.label.split(/\s|\//)[0];
const HW = (s: number) => (s >= 65 ? 'ok' : s >= 40 ? 'warn' : 'bad');
const MAIL = 'hello@weexp.agency';
const host = (u: string) => u.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

const radar = (scores: number[], R: number, c: number) => scores.map((v, i) => {
  const a = -Math.PI / 2 + (i / scores.length) * Math.PI * 2; const r = (v / 100) * R;
  return [c + Math.cos(a) * r, c + Math.sin(a) * r];
});
const ring = (R: number, c: number, n: number) => Array.from({ length: n }, (_, i) => {
  const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [c + Math.cos(a) * R, c + Math.sin(a) * R];
});

export function Stage3({ prior, onClose }: { prior?: DiagRecord; onClose: () => void }) {
  const [user, setUser] = useState<DiagUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState(''); const [pass, setPass] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [ans, setAns] = useState<Stage3Answers>({});
  const [sec, setSec] = useState(0);           // індекс секції; SECTIONS.length = звіт
  const saveT = useRef<number | undefined>(undefined);

  useEffect(() => { currentUser().then((u) => { setUser(u); setChecking(false); }); }, []);

  // Після входу — вантажимо збережене + прикріплюємо дані попередніх етапів.
  useEffect(() => {
    if (!user) return;
    loadDiag(user).then((rec) => {
      if (rec.stage3) setAns(rec.stage3 as Stage3Answers);
      if (prior) saveDiag(user, { ...prior }); // stage1/2 зберігаються теж
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Автозбереження прогресу (debounce).
  useEffect(() => {
    if (!user) return;
    clearTimeout(saveT.current);
    saveT.current = window.setTimeout(() => { saveDiag(user, { stage3: ans }); }, 700);
    return () => clearTimeout(saveT.current);
  }, [ans, user]);

  const doAuth = async () => {
    setErr(''); setBusy(true);
    const r = await authenticate(email.trim(), pass);
    setBusy(false);
    if (r.error) setErr(r.error); else if (r.user) setUser(r.user);
  };
  const logout = async () => { await signOut(); setUser(null); setSec(0); };

  const set = (id: string, v: number | number[] | string) => setAns((a) => ({ ...a, [id]: v }));
  const toggle = (id: string, i: number) => setAns((a) => {
    const cur = (a[id] as number[]) || []; return { ...a, [id]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] };
  });

  const res = useMemo(() => (sec >= SECTIONS.length ? scoreStage3(ans) : null), [sec, ans]);
  const blocksIn = (s: string) => BLOCKS.filter((b) => b.section === s);
  const answeredCount = BLOCKS.filter((b) => { const a = ans[b.id]; return a != null && a !== '' && (!Array.isArray(a) || a.length); }).length;

  /* ── Auth gate ── */
  if (checking) return <div className="s2 s3"><div className="s3-auth"><span className="mono">…</span></div></div>;
  if (!user) {
    return (
      <div className="s2 s3" role="dialog" aria-label="Етап 3 — кабінет">
        <button className="s2-x mono" onClick={onClose}>✕ Закрити</button>
        <div className="s3-auth">
          <div className="sysx-kick">Етап 3 · Tier-2 · Кабінет</div>
          <h2 className="sysx-display s3-auth-h">Реєстрація відкриває<br />глибшу діагностику</h2>
          <p className="s3-auth-lead">Дані всіх етапів зберігаються — заповнення можна призупинити й продовжити будь-коли, з будь-якого пристрою.</p>
          <div className="s3-auth-form">
            <label className="s2-inp"><span className="mono">Email</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></label>
            <label className="s2-inp"><span className="mono">Пароль</span><input type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="мінімум 6 символів" /></label>
            {err && <span className="s3-err mono">{err}</span>}
            <button className="sysx-cta is-primary" onClick={doAuth} disabled={busy || !email || pass.length < 6}>{busy ? 'Заходимо…' : 'Зареєструватися / Увійти →'}</button>
            {!CONFIGURED && <span className="s2-note mono">Демо-режим: дані зберігаються локально в цьому браузері.</span>}
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
          </header>

          <div className="s2-grid">
            <div className="s2-panel s2-radar-wrap">
              <span className="sysx-kick">Профіль зрілості (Tier-2)</span>
              <svg viewBox="0 0 260 260" className="s2-radar" role="img" aria-label="Радар зрілості">
                {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} className="s2-radar-grid" points={ring(100 * f, 130, 7).map((p) => p.join(',')).join(' ')} />)}
                {ring(100, 130, 7).map((p, i) => <line key={i} className="s2-radar-axis" x1={130} y1={130} x2={p[0]} y2={p[1]} />)}
                <polygon className="s2-radar-area" points={radar(res.systems.map((s) => s.score), 100, 130).map((p) => p.join(',')).join(' ')} />
                {ring(118, 130, 7).map((p, i) => <text key={i} className="s2-radar-lab" x={p[0]} y={p[1]} textAnchor={p[0] < 125 ? 'end' : p[0] > 135 ? 'start' : 'middle'}>{short(res.systems[i].key)}</text>)}
              </svg>
            </div>
            <div className="s2-panel">
              <span className="sysx-kick">Оцінка по системах</span>
              <div className="s2-bars">
                {res.systems.map((h, i) => (
                  <div key={h.key} className="s2-hbar" style={{ '--i': i } as React.CSSProperties}>
                    <span className="s2-hbar-l">{short(h.key)}</span>
                    <span className={`s2-hbar-t ${HW(h.score)}`}><i style={{ width: `${h.score}%` }} /></span>
                    <span className="s2-hbar-v mono">{h.score}</span>
                  </div>
                ))}
              </div>
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
            <p><b>{res.bottleneck.label}</b> — найслабша ланка ({res.bottleneck.score}/100). Це точка, з якої почнеться Tier-2-побудова: разом із вашими маркетинговими й фінансовими даними та конкурентним полем ми зведемо це в план під Definition of Done.</p>
          </div>

          <div className="s2-rep-foot">
            <div className="s2-foot-l">
              <img src="/qr.svg" alt="QR — weexp.agency" className="s2-qr" width={72} height={72} />
              <div className="s2-foot-c"><b>WEEXP — Система замість героїзму</b><span className="mono">weexp.agency · {MAIL}</span><span className="s2-note mono">Дані збережено у вашому кабінеті ({user.email}).</span></div>
            </div>
            <div className="s2-foot-cta">
              <button className="sysx-cta" onClick={() => window.print()}>Завантажити PDF ↓</button>
              <Link to="/contact" className="sysx-cta is-primary">Записатися на розбір Tier-2 →</Link>
              <button className="sysx-cta" onClick={logout}>Вийти</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Questionnaire (по секціях) ── */
  const section = SECTIONS[sec];
  const blocks = blocksIn(section);
  const secPct = Math.round((sec / SECTIONS.length) * 100);
  return (
    <div className="s2 s3" role="dialog" aria-label="Етап 3 — питання">
      <button className="s2-x mono" onClick={onClose}>✕ Призупинити</button>
      <div className="s3-quiz">
        <div className="s3-quiz-head">
          <div className="sysx-kick">Етап 3 · Tier-2 · {user.email}</div>
          <div className="s2-bar"><i style={{ width: `${secPct}%` }} /></div>
          <div className="s3-secnav mono">{SECTIONS.map((s, i) => <span key={s} className={i === sec ? 'on' : i < sec ? 'done' : ''}>{s}</span>)}</div>
        </div>

        <div className="s2-card s3-card">
          <h2 className="sysx-display s3-sec-h">{section}</h2>
          <span className="s3-sec-sub mono">Секція {sec + 1} / {SECTIONS.length} · відповіли {answeredCount}/{BLOCKS.length} · прогрес зберігається</span>
          <div className="s3-blocks">
            {blocks.map((b) => <BlockField key={b.id} b={b} value={ans[b.id]} onSet={(v) => set(b.id, v)} onToggle={(i) => toggle(b.id, i)} />)}
          </div>
          <div className="s3-quiz-actions">
            {sec > 0 && <button className="s2-back mono" onClick={() => setSec(sec - 1)}>← Назад</button>}
            <button className="s2-back mono" onClick={onClose}>Призупинити (дані збережено)</button>
            <button className="sysx-cta is-primary" onClick={() => setSec(sec + 1)}>{sec + 1 < SECTIONS.length ? 'Далі →' : 'Показати Tier-2 звіт →'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockField({ b, value, onSet, onToggle }: { b: Block; value: Stage3Answers[string]; onSet: (v: number | string) => void; onToggle: (i: number) => void }) {
  return (
    <div className="s3-block">
      <span className="s3-block-l">{b.label}{b.hint && <i className="mono"> · {b.hint}</i>}</span>
      {b.kind === 'url' && <input className="s3-in" type="url" inputMode="url" placeholder={b.placeholder} value={(value as string) || ''} onChange={(e) => onSet(e.target.value)} />}
      {b.kind === 'number' && <span className="s3-num"><input className="s3-in" type="number" inputMode="decimal" value={(value as string) ?? ''} onChange={(e) => onSet(e.target.value)} placeholder="0" /><i className="mono">{b.unit}</i></span>}
      {b.kind === 'single' && (
        <div className="s3-choices">
          {b.options!.map((o, i) => <button key={o.label} className={`s3-choice${value === i ? ' on' : ''}`} onClick={() => onSet(i)}>{o.label}</button>)}
        </div>
      )}
      {b.kind === 'multi' && (
        <div className="s3-choices">
          {b.options!.map((o, i) => <button key={o.label} className={`s3-choice${Array.isArray(value) && value.includes(i) ? ' on' : ''}`} onClick={() => onToggle(i)}>{o.label}</button>)}
        </div>
      )}
    </div>
  );
}
