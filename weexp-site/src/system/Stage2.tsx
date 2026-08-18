import { lazy, Suspense, useMemo, useState } from 'react';
import { eur, project, SYS, type LossInput, type LossResult, type SysKey } from './lossModel';
import { QUESTIONS, scoreStage2, type Stage2Answers } from './stage2Model';
import { RadarChart, SystemBars } from './charts';
import { StepOverlay } from './StepOverlay';
import { FunnelSteps } from './FunnelSteps';
import './system.css';

const Stage3 = lazy(() => import('@/system/Stage3').then((m) => ({ default: m.Stage3 })));

const short = (k: SysKey) => SYS.find((s) => s.key === k)!.label.split(/\s|\//)[0];

/**
 * Калькулятор · Етап 2 — повноекранний глибший діагноз. Клієнт обирає варіанти
 * (мінімум ручного вводу — лише посилання на сайт), на виході — анімований звіт
 * на весь екран із радаром, барами й gauge, який можна завантажити в PDF (print)
 * із контактами й QR. Далі — місток на Етап 3 (через реєстрацію в кабінеті).
 */
const MAIL = 'hello@weexp.agency';

export function Stage2({ stage1, stage1Result, onClose }: { stage1: LossInput; stage1Result?: LossResult; onClose: () => void }) {
  const [phase, setPhase] = useState<'url' | 'quiz' | 'report'>('url');
  const [site, setSite] = useState('');
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Stage2Answers>({});
  const [stage3, setStage3] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const res = useMemo(() => (phase === 'report' ? scoreStage2(ans, stage1) : null), [phase, ans, stage1]);
  // Проєкція «Зараз → Куди можемо прийти» — рахуємо з даних Етапу 1 (реальні метрики).
  const proj = useMemo(() => (stage1Result ? project(stage1, stage1Result) : null), [stage1, stage1Result]);

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
    <StepOverlay>
    <div className="sysx s2" role="dialog" aria-label="Калькулятор — Етап 2">
      <FunnelSteps active={4} />
      <button className="s2-x s2-x-flow mono" onClick={onClose} aria-label="Назад до розрахунку">← Назад</button>

      {phase !== 'report' && (
        <div className="s2-quiz">
          <div className="s2-quiz-head">
            <div className="sysx-kick">Крок 4 · Повна карта систем · Commerce OS</div>
            <div className="s2-bar"><i style={{ width: `${phase === 'url' ? 0 : progress}%` }} /></div>
          </div>

          {phase === 'url' && (
            <div className="s2-card s2-url">
              <h2 className="sysx-display s2-q">Почнімо з вашого сайту</h2>
              <p className="s2-lead">Далі — {QUESTIONS.length} коротких питань. Майже все — вибір варіанта, вписувати руками нічого не треба.</p>
              <label className="s2-inp"><span className="mono">Посилання на сайт</span>
                <input type="url" inputMode="url" placeholder="https://" value={site} onChange={(e) => setSite(e.target.value)} />
              </label>
              <button className="sysx-cta is-primary" onClick={() => setPhase('quiz')}>Почати {QUESTIONS.length} питань →</button>
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
            <div className="sysx-kick">Крок 4 · Карта систем{site ? ` · ${site.replace(/^https?:\/\//, '')}` : ''}</div>
            <h1 className="sysx-display s2-rep-h">Зрілість системи — <span className="sysx-em">{res.overall}</span><i>/100</i></h1>
            <p className="s2-rep-line"><b>{res.level.title}.</b> {res.level.line}</p>
          </header>

          <div className="s2-grid">
            {/* Радар 7 систем — інтерактивний, синхронізований із барами */}
            <div className="s2-panel s2-radar-wrap">
              <span className="sysx-kick">8 систем — профіль зрілості</span>
              <RadarChart systems={res.systems} hover={hover} onHover={setHover} />
              <span className="s2-hint mono">Наведіть на систему — підсвітиться скрізь</span>
            </div>

            {/* Бари 7 систем */}
            <div className="s2-panel">
              <span className="sysx-kick">Оцінка по системах</span>
              <SystemBars systems={res.systems} hover={hover} onHover={setHover} />
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

          {/* «Зараз → Куди можемо прийти» — не лише витік, а конкретне майбутнє.
              Психологія: клієнт бачить своє «Б» у цифрах — день/місяць/рік, час, юніт. */}
          {proj && (proj.income.length > 0 || proj.unit.length > 0) && (
            <div className="s2-project">
              <div className="s2-proj-head">
                <span className="sysx-kick">Зараз → Куди можемо прийти</span>
                <p className="s2-proj-sub">Консервативна ціль за <b>{proj.horizon}</b>: ваші поточні метрики, підтягнуті до робочих бенчмарків. Приріст доходу обмежено вже порахованою можливістю — жодних «в космос».</p>
              </div>

              {proj.income.length > 0 && (
                <div className="s2-proj-income">
                  {proj.income.map((d) => (
                    <div key={d.label} className={`s2-proj-inc${d.hero ? ' is-hero' : ''}`}>
                      <span className="s2-proj-inc-l mono">{d.label}</span>
                      <div className="s2-proj-inc-v">
                        <span className="s2-proj-now">{d.before}</span>
                        <em aria-hidden="true">→</em>
                        <b className="sysx-display s2-proj-aft">{d.after}</b>
                      </div>
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
                      <span className="s2-proj-row-v">
                        <i className="s2-proj-b">{d.before}</i>
                        <em aria-hidden="true">→</em>
                        <b>{d.after}</b>
                      </span>
                      <span className={`s2-proj-badge ${d.dir}`}>{d.dir === 'down' ? '−' : '+'}{d.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
              <span className="s2-proj-note mono">Оцінка за вашими даними та бенчмарками ніші. Точні цілі підтверджуємо на повному аудиті (Етап 3 / команда).</span>
            </div>
          )}

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
              <button className="sysx-cta is-primary" onClick={() => setStage3(true)}>Далі: кабінет Tier-2 →</button>
            </div>
          </div>
          <span className="s2-stage3-note mono">Це проміжна карта. У кабінеті (наступний крок) зберемо повний звіт — його можна завантажити (PDF / Excel) і він доповнюється на кожному кроці діагностики.</span>
        </div>
      )}

      {stage3 && (
        <Suspense fallback={null}>
          <Stage3 prior={{ site, stage1, stage1Money: money ? [money.lo, money.hi] : undefined, stage2: ans, stage2Result: res ?? undefined }} onClose={() => setStage3(false)} />
        </Suspense>
      )}
    </div>
    </StepOverlay>
  );
}
