import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QUESTIONS, scoreXray, opportunityLabel, LEVELS, type Answers } from '@/data/xray';
import { HealthRadar } from '@/components/HealthRadar';
import { CountUp } from '@/lib/primitives';
import { say } from '@/lib/bus';
import './xray.css';

const OPTS = ['Ні', 'Радше ні', 'Радше так', 'Так'];

/**
 * Business X-Ray — інтерактивний самодіагноз. 16 тверджень → Business Health (радар
 * по 5 системах) + Independence Score (0–100, рівень зрілості) + топ-3 розриви + € можливість.
 * Перетворює сайт із «місця, де нас вивчають» на інструмент, яким бізнес діагностує себе.
 */
export function BusinessXray() {
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const result = useMemo(() => (phase === 'result' ? scoreXray(answers) : null), [phase, answers]);
  const q = QUESTIONS[step];
  const progress = Math.round((step / QUESTIONS.length) * 100);

  const answer = (v: number) => {
    const next = { ...answers, [q.id]: v };
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) setStep(step + 1);
    else { setPhase('result'); say('Ось ваш зріз. Далі — повний діагноз у грошах.'); }
  };

  if (phase === 'intro') {
    return (
      <div className="xray xray--intro">
        <div className="xray-badge mono">Безкоштовний інструмент</div>
        <h2 className="xray-title">Порахуйте, наскільки ваш<br />e-commerce незалежний</h2>
        <p className="xray-lead">16 тверджень · 2 хвилини. Отримаєте Business Health по 18 доменах,
          свій Independence Score і три головні розриви — без реєстрації.</p>
        <button className="btn-primary mono" onClick={() => { setPhase('quiz'); setStep(0); }}>
          Почати X-Ray →
        </button>
        <div className="xray-levels mono">
          {LEVELS.map((l) => <span key={l.code}><b>{l.code}</b> {l.title}</span>)}
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    return (
      <div className="xray xray--quiz">
        <div className="xray-bar"><span style={{ width: `${progress}%` }} /></div>
        <div className="xray-step mono">Питання {step + 1} / {QUESTIONS.length}</div>
        <p className="xray-q">{q.text}</p>
        <div className="xray-opts">
          {OPTS.map((o, i) => (
            <button key={i} className={`xray-opt${answers[q.id] === i ? ' is-on' : ''}`} onClick={() => answer(i)}>
              <span className="xray-opt-n mono">{i}</span>{o}
            </button>
          ))}
        </div>
        {step > 0 && <button className="xray-back mono" onClick={() => setStep(step - 1)}>← Назад</button>}
      </div>
    );
  }

  const r = result!;
  return (
    <div className="xray xray--result">
      <div className="xray-result-grid">
        <div className="xray-score">
          <span className="xray-score-lab mono">Independence Score</span>
          <div className="xray-score-num"><CountUp to={r.independence} />{' '}<small>/100</small></div>
          <div className="xray-level mono"><b>{r.level.title}</b> · {r.level.line}</div>
          <div className="xray-ladder">
            {LEVELS.map((l) => (
              <div key={l.code} className={`xray-rung${r.independence >= l.min && r.independence < l.max ? ' is-here' : ''}`}>
                <span className="mono">{l.code}</span>{l.title}
              </div>
            ))}
          </div>
        </div>
        <div className="xray-radar">
          <span className="xray-score-lab mono">Business Health · {r.health}/100</span>
          <HealthRadar systems={r.systemScores} />
        </div>
      </div>

      <div className="xray-gaps">
        <span className="xray-score-lab mono">Три головні розриви</span>
        <div className="xray-gaps-row">
          {r.gaps.map((g) => (
            <div key={g.key} className="xray-gap">
              <span className="xray-gap-score mono">{g.score}<small>/100</small></span>
              <span className="xray-gap-name">{g.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="xray-next">
        <p className="xray-next-lead">Оцінена можливість: <b>{opportunityLabel(r.independence)}</b>.
          Наступний крок — повний діагноз у грошах.</p>
        <div className="home-cta-row">
          <Link to="/diagnose" className="btn-primary mono">Повний WEEXP Diagnosis →</Link>
          <button className="btn-ghost mono" onClick={() => { setPhase('intro'); setAnswers({}); setStep(0); }}>Пройти ще раз</button>
        </div>
      </div>
    </div>
  );
}
