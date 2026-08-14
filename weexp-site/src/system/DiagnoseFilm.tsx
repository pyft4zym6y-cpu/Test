import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QUESTIONS, SYSTEMS, scoreXray, opportunityLabel, levelFor, systemByKey, SHORT,
  type Answers,
} from '@/data/xray';
import './system.css';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));

/**
 * Business X-Ray у світлому cinematic-напрямі (/diagnose). Головна дія бренду,
 * приведена до мови превʼю: той самий зібраний об'єкт як тло; відповідаючи на
 * 14 тверджень, власник наприкінці бачить свій Independence Score, здоров'я семи
 * систем і головний bottleneck — вузол якого спалахує червоним на об'єкті.
 * Використовує ту саму модель scoreXray, що й уся діагностика.
 */
const OPTS = ['Ні', 'Радше ні', 'Радше так', 'Так'];
const HW = (s: number) => (s >= 65 ? 'ok' : s >= 40 ? 'warn' : 'bad');
const nodeOf = (key: string) => Math.max(0, SYSTEMS.findIndex((s) => s.key === key));

export function DiagnoseFilm() {
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const alerts = useRef<number[]>([]);

  const result = useMemo(() => (phase === 'result' ? scoreXray(answers, QUESTIONS) : null), [phase, answers]);
  const q = QUESTIONS[step];
  const progress = Math.round((step / QUESTIONS.length) * 100);

  const answer = (v: number) => {
    const next = { ...answers, [q.id]: v };
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) setStep(step + 1);
    else {
      const r = scoreXray(next, QUESTIONS);
      alerts.current = [nodeOf(r.bottleneck.key)];
      setPhase('result');
    }
  };
  const restart = () => { alerts.current = []; setAnswers({}); setStep(0); setPhase('intro'); };

  return (
    <section className="sysx sysx-calc">
      <div className="sysx-field" aria-hidden="true" />
      <div className="sysx-calc-bg"><Suspense fallback={null}><CommerceSystem3D fixedProgress={0.6} alerts={alerts} /></Suspense></div>

      <div className="sysx-calc-panel">
        {phase !== 'result' && (
          <header className="sysx-calc-head">
            <div className="sysx-kick">Business X-Ray · безкоштовно · 2 хвилини</div>
            <h1 className="sysx-display sysx-calc-h1">Знайдіть головний<br /><span className="sysx-em">bottleneck</span></h1>
            <div className="sysx-steps mono">
              <span className={phase === 'intro' ? 'on' : ''}>Старт</span><i>→</i>
              <span className={phase === 'quiz' ? 'on' : ''}>14 тверджень</span><i>→</i>
              <span>Ваш зріз</span>
            </div>
          </header>
        )}

        {phase === 'intro' && (
          <div className="sysx-card">
            <p className="sysx-lead">Оцініть 7 систем онлайн-продажів. Наприкінці отримаєте Independence Score,
              Business Health по кожній системі й вузьке місце, що тримає прибуток — без реєстрації.</p>
            <div className="dg-levels mono">
              {['Хаос', 'Залежність', 'Функції', 'Система', 'Незалежність'].map((t, i) => (
                <span key={t}><b>{i * 20}–{i * 20 + 20}</b> {t}</span>
              ))}
            </div>
            <div className="sysx-calc-actions">
              <button className="sysx-cta is-primary" onClick={() => { setPhase('quiz'); setStep(0); }}>Почати X-Ray →</button>
              <span className="sysx-note mono">Самодіагноз. Точний розрив у грошах рахуємо в повному Diagnosis по CRM/ERP/GA4.</span>
            </div>
          </div>
        )}

        {phase === 'quiz' && (
          <div className="sysx-card">
            <div className="dg-bar"><i style={{ width: `${progress}%` }} /></div>
            <div className="dg-step mono">Твердження {step + 1} / {QUESTIONS.length} · Система {systemByKey(q.system).num} — {systemByKey(q.system).title}</div>
            <p className="dg-q sysx-display">{q.text}</p>
            <div className="dg-opts">
              {OPTS.map((o, i) => (
                <button key={o} className={`dg-opt${answers[q.id] === i ? ' on' : ''}`} onClick={() => answer(i)}>
                  <span className="dg-opt-n mono">{i}</span>{o}
                </button>
              ))}
            </div>
            {step > 0 && <button className="dg-back mono" onClick={() => setStep(step - 1)}>← Назад</button>}
          </div>
        )}

        {phase === 'result' && result && (
          <div className="sysx-result">
            <div className="sysx-kick">Ваш зріз системи</div>
            <div className="dg-scores">
              <div className="dg-score">
                <span className="sysx-total-big sysx-display">{result.independence}<span>/100</span></span>
                <span className="sysx-total-cap mono">Independence Score · {result.level.title}</span>
              </div>
              <div className="dg-score">
                <span className="dg-health-num sysx-display">{result.health}<i>/100</i></span>
                <span className="sysx-total-cap mono">Business Health</span>
              </div>
            </div>
            <p className="dg-level-line">{levelFor(result.independence).line}</p>

            <div className="sysx-health">
              <div className="sysx-health-head"><span className="sysx-kick">7 систем</span><span className="mono sysx-note">оцінка / 100</span></div>
              <div className="sysx-health-grid">
                {result.systemScores.map((h) => (
                  <div key={h.key} className="sysx-hbar">
                    <span className="sysx-hbar-l mono">{SHORT[h.key]}</span>
                    <span className={`sysx-hbar-t ${HW(h.score)}`}><i style={{ width: `${h.score}%` }} /></span>
                    <span className="sysx-hbar-v mono">{h.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sysx-bottleneck">
              <span className="sysx-kick">Головний bottleneck</span>
              <b className="sysx-display">Система {systemByKey(result.bottleneck.key).num} — {result.bottleneck.title}</b>
              <span className="mono">{result.bottleneck.score}/100 · «{systemByKey(result.bottleneck.key).feel}»</span>
            </div>

            <div className="dg-gaps">
              <span className="sysx-kick">Три найслабші</span>
              <div className="dg-gaps-row">
                {result.gaps.map((g) => (
                  <div key={g.key} className="dg-gap">
                    <b className="sysx-display">{g.score}<i>/100</i></b>
                    <span>{SHORT[g.key]}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="dg-opp">Оцінена можливість: <b>{opportunityLabel(result.independence)}</b>. Наступний крок — точний розрив у грошах у повному Diagnosis.</p>

            <div className="sysx-calc-actions">
              <Link to="/contact" className="sysx-cta is-primary">Подати заявку на Diagnosis →</Link>
              <Link to="/loss" className="sysx-cta">Порахувати втрати</Link>
              <button className="sysx-cta" onClick={restart}>Пройти ще раз</button>
            </div>
            <span className="sysx-note mono">Business X-Ray — безкоштовно. Оцінка на основі відповідей, не фінансовий аудит.</span>
          </div>
        )}
      </div>
    </section>
  );
}
