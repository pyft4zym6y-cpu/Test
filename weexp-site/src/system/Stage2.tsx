import { lazy, Suspense, useMemo, useState } from 'react';
import { eur, SYS, type LossInput, type LossResult } from './lossModel';
import { QUESTIONS, scoreStage2, type Stage2Answers } from './stage2Model';
import './system.css';

const Stage3 = lazy(() => import('@/system/Stage3').then((m) => ({ default: m.Stage3 })));

/**
 * Калькулятор · Етап 2 — повноекранний глибший діагноз. Клієнт обирає варіанти
 * (мінімум ручного вводу — лише посилання на сайт), на виході — анімований звіт
 * на весь екран із радаром, барами й gauge, який можна завантажити в PDF (print)
 * із контактами й QR. Далі — місток на Етап 3 (через реєстрацію в кабінеті).
 */
const short = (k: string) => SYS.find((s) => s.key === k)!.label.split(/\s|\//)[0];
const HW = (s: number) => (s >= 65 ? 'ok' : s >= 40 ? 'warn' : 'bad');
const MAIL = 'hello@weexp.agency';

// Радар 7 систем → SVG-точки.
function radarPoints(scores: number[], R: number, cx: number, cy: number) {
  const n = scores.length;
  return scores.map((v, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const r = (v / 100) * R;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
}
function ring(R: number, cx: number, cy: number, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * R, cy + Math.sin(a) * R];
  });
}

export function Stage2({ stage1, stage1Result, onClose }: { stage1: LossInput; stage1Result?: LossResult; onClose: () => void }) {
  const [phase, setPhase] = useState<'url' | 'quiz' | 'report'>('url');
  const [site, setSite] = useState('');
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Stage2Answers>({});
  const [stage3, setStage3] = useState(false);
  const res = useMemo(() => (phase === 'report' ? scoreStage2(ans, stage1) : null), [phase, ans, stage1]);

  // Єдина цифра для Етапів 1 і 2: суму беремо з Етапу 1 (computeLoss), а Етап 2
  // лише показує, ДЕ саме вона зосереджена (зрілість/bottleneck). Не рахуємо
  // конкурентну суму — щоб не було розходження між кроками.
  const money = useMemo(() => {
    if (stage1Result && stage1Result.annualRevenue > 0 && stage1Result.total > 0) {
      const [lo, hi] = stage1Result.range;
      const ann = stage1Result.annualRevenue;
      return { lo, hi, pctLo: Math.max(1, Math.round((lo / ann) * 100)), pctHi: Math.max(1, Math.round((hi / ann) * 100)) };
    }
    return null;
  }, [stage1Result]);

  const q = QUESTIONS[step];
  const progress = Math.round((step / QUESTIONS.length) * 100);
  const pick = (i: number) => {
    if (q.kind === 'single') {
      setAns((a) => ({ ...a, [q.id]: i }));
      if (step + 1 < QUESTIONS.length) setTimeout(() => setStep(step + 1), 140);
      else setTimeout(() => setPhase('report'), 160);
    } else {
      setAns((a) => {
        const cur = (a[q.id] as number[]) || [];
        return { ...a, [q.id]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] };
      });
    }
  };
  const next = () => (step + 1 < QUESTIONS.length ? setStep(step + 1) : setPhase('report'));
  const selected = (i: number) => {
    const a = ans[q.id];
    return q.kind === 'single' ? a === i : Array.isArray(a) && a.includes(i);
  };

  return (
    <div className="s2" role="dialog" aria-label="Калькулятор — Етап 2">
      <button className="s2-x mono" onClick={onClose} aria-label="Закрити">✕ Закрити</button>

      {phase !== 'report' && (
        <div className="s2-quiz">
          <div className="s2-quiz-head">
            <div className="sysx-kick">Етап 2 · Глибша діагностика · Commerce OS</div>
            <div className="s2-bar"><i style={{ width: `${phase === 'url' ? 0 : progress}%` }} /></div>
          </div>

          {phase === 'url' && (
            <div className="s2-card s2-url">
              <h2 className="sysx-display s2-q">Почнімо з вашого сайту</h2>
              <p className="s2-lead">Далі — 18 коротких питань. Майже все — вибір варіанта, вписувати руками нічого не треба.</p>
              <label className="s2-inp"><span className="mono">Посилання на сайт</span>
                <input type="url" inputMode="url" placeholder="https://" value={site} onChange={(e) => setSite(e.target.value)} />
              </label>
              <button className="sysx-cta is-primary" onClick={() => setPhase('quiz')}>Почати 18 питань →</button>
            </div>
          )}

          {phase === 'quiz' && (
            <div className="s2-card">
              <div className="s2-step mono">Питання {step + 1} / {QUESTIONS.length} · {short(q.system)}</div>
              <h2 className="sysx-display s2-q">{q.text}</h2>
              <div className="s2-opts">
                {q.options.map((o, i) => (
                  <button key={o.label} className={`s2-opt${selected(i) ? ' on' : ''}`} onClick={() => pick(i)}>
                    <span className="s2-opt-mark" aria-hidden="true" />{o.label}
                  </button>
                ))}
              </div>
              <div className="s2-quiz-actions">
                {step > 0 && <button className="s2-back mono" onClick={() => setStep(step - 1)}>← Назад</button>}
                {q.kind === 'multi' && <button className="sysx-cta is-primary" onClick={next}>Далі →</button>}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'report' && res && (
        <div className="s2-report">
          <header className="s2-rep-head">
            <div className="sysx-kick">Ваш зріз системи · Етап 2{site ? ` · ${site.replace(/^https?:\/\//, '')}` : ''}</div>
            <h1 className="sysx-display s2-rep-h">Зрілість системи — <span className="sysx-em">{res.overall}</span><i>/100</i></h1>
            <p className="s2-rep-line"><b>{res.level.title}.</b> {res.level.line}</p>
          </header>

          <div className="s2-grid">
            {/* Радар 7 систем */}
            <div className="s2-panel s2-radar-wrap">
              <span className="sysx-kick">7 систем — профіль зрілості</span>
              <svg viewBox="0 0 260 260" className="s2-radar" role="img" aria-label="Радар зрілості семи систем">
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} className="s2-radar-grid" points={ring(100 * f, 130, 130, 7).map((p) => p.join(',')).join(' ')} />
                ))}
                {ring(100, 130, 130, 7).map((p, i) => <line key={i} className="s2-radar-axis" x1={130} y1={130} x2={p[0]} y2={p[1]} />)}
                <polygon className="s2-radar-area" points={radarPoints(res.systems.map((s) => s.score), 100, 130, 130).map((p) => p.join(',')).join(' ')} />
                {radarPoints(res.systems.map((s) => s.score), 100, 130, 130).map((p, i) => <circle key={i} className="s2-radar-dot" cx={p[0]} cy={p[1]} r={3} />)}
                {ring(118, 130, 130, 7).map((p, i) => (
                  <text key={i} className="s2-radar-lab" x={p[0]} y={p[1]} textAnchor={p[0] < 125 ? 'end' : p[0] > 135 ? 'start' : 'middle'}>{short(res.systems[i].key)}</text>
                ))}
              </svg>
            </div>

            {/* Бари 7 систем */}
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

            {/* Можливість — та сама цифра, що й в Етапі 1 (одне число на обидва кроки) */}
            <div className="s2-panel s2-money">
              <span className="sysx-kick">Оцінена можливість</span>
              {money
                ? <><b className="sysx-display s2-money-big">{eur(money.lo)}–{eur(money.hi)}</b><span className="mono">на рік · {money.pctLo}–{money.pctHi}% до обороту</span></>
                : stage1.monthlyRevenue > 0
                  ? <><b className="sysx-display s2-money-big">{eur(res.annualUpside[0])}–{eur(res.annualUpside[1])}</b><span className="mono">на рік · {res.opportunityPct[0]}–{res.opportunityPct[1]}% до обороту</span></>
                  : <><b className="sysx-display s2-money-big">{res.opportunityPct[0]}–{res.opportunityPct[1]}%</b><span className="mono">до обороту (вкажіть виторг в Етапі 1 для суми)</span></>}
              {money && <span className="s2-money-note mono">Та сама цифра з Етапу 1. Етап 2 показує не «скільки», а <b>де саме</b> вона зосереджена — за зрілістю систем.</span>}
              <div className="s2-bench">
                <span className="mono">Ви {res.overall}</span>
                <div className="s2-bench-track"><i className="s2-bench-you" style={{ left: `${res.overall}%` }} /><i className="s2-bench-mark" style={{ left: '45%' }} /><i className="s2-bench-mark strong" style={{ left: '75%' }} /></div>
                <span className="mono">типово 45 · сильні 75</span>
              </div>
            </div>

            {/* Bottleneck + пріоритети */}
            <div className="s2-panel s2-bottleneck">
              <span className="sysx-kick">Головний bottleneck</span>
              <b className="sysx-display">{res.bottleneck.label}<i> · {res.bottleneck.score}/100</i></b>
              <span className="sysx-kick" style={{ marginTop: '10px' }}>Три перші дії</span>
              <ol className="s2-actions">{res.priorities.map((p) => <li key={p.key}>{p.text}</li>)}</ol>
            </div>
          </div>

          {/* Футер звіту: PDF + QR + контакти + Етап 3 */}
          <div className="s2-rep-foot">
            <div className="s2-foot-l">
              <img src="/qr.svg" alt="QR — weexp.agency" className="s2-qr" width={72} height={72} />
              <div className="s2-foot-c">
                <b>WEEXP — Система замість героїзму</b>
                <span className="mono">weexp.agency · {MAIL}</span>
                <span className="s2-note mono">Оцінка за відповідями. Не фінансовий аудит.</span>
              </div>
            </div>
            <div className="s2-foot-cta">
              <button className="sysx-cta" onClick={() => window.print()}>Завантажити PDF ↓</button>
              <button className="sysx-cta is-primary" onClick={() => setStage3(true)}>Етап 3 — глибша діагностика в кабінеті →</button>
            </div>
          </div>
          <span className="s2-stage3-note mono">Етап 3 відкривається через реєстрацію: дані зберігаються, можна продовжити будь-коли — і ми доводимо аналіз до рівня Tier-2.</span>
        </div>
      )}

      {stage3 && (
        <Suspense fallback={null}>
          <Stage3 prior={{ site, stage1, stage2: ans, stage2Result: res ?? undefined }} onClose={() => setStage3(false)} />
        </Suspense>
      )}
    </div>
  );
}
