import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QUESTIONS, QUESTIONS_FULL, scoreXray, opportunityLabel, diagnosisSummary, DIAG_SUMMARY_KEY, LEVELS, systemByKey, SHORT, type Answers, type Question } from '@/data/xray';
import { HealthRadar } from '@/components/HealthRadar';
import { CountUp } from '@/lib/primitives';
import { say } from '@/lib/bus';
import { track } from '@/lib/analytics';
import './xray.css';

const OPTS = ['Ні', 'Радше ні', 'Радше так', 'Так'];
// Ціновий якір для самокваліфікації за бюджетом. Заміни на актуальне число.
const DIAGNOSIS_PRICE_FROM = 'від $2 900';

/**
 * Business X-Ray — інтерактивний самодіагноз системи онлайн-продажів.
 * Питання → Business Health (радар по 7 системах) + Independence Score + головний bottleneck.
 * `questions` — набір (швидкий 14 або повний 28); `storageKey` вмикає збереження результату.
 */
export function BusinessXray({ questions = QUESTIONS, storageKey, full = false }:
  { questions?: Question[]; storageKey?: string; full?: boolean } = {}) {
  const saved = (() => {
    if (!storageKey) return null;
    try { const raw = localStorage.getItem(storageKey); return raw ? JSON.parse(raw) as Answers : null; } catch { return null; }
  })();

  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>(saved ? 'result' : 'intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(saved ?? {});

  const result = useMemo(() => (phase === 'result' ? scoreXray(answers, questions) : null), [phase, answers, questions]);
  // Зберігаємо читабельний підсумок + фіксуємо завершення діагностики в аналітику.
  useEffect(() => {
    if (phase === 'result' && result) {
      try { localStorage.setItem(DIAG_SUMMARY_KEY, diagnosisSummary(result, full)); } catch { /* ignore */ }
      track('xray_complete', { mode: full ? 'full' : 'quick', independence: result.independence, level: result.level.title });
    }
  }, [phase, result, full]);
  const q = questions[step];
  const progress = Math.round((step / questions.length) * 100);

  const answer = (v: number) => {
    const next = { ...answers, [q.id]: v };
    setAnswers(next);
    if (step + 1 < questions.length) setStep(step + 1);
    else {
      setPhase('result'); say('Ось ваш зріз. Далі — повний діагноз у грошах.');
      if (storageKey) { try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ } }
    }
  };
  const reset = () => {
    setPhase('intro'); setAnswers({}); setStep(0);
    if (storageKey) { try { localStorage.removeItem(storageKey); } catch { /* ignore */ } }
  };

  if (phase === 'intro') {
    return (
      <div className="xray xray--intro">
        <div className="xray-badge mono">{full ? 'Повна діагностика · результат зберігається' : 'Безкоштовний інструмент'}</div>
        <h2 className="xray-title">{full ? <>Повна діагностика<br />системи онлайн-продажів</> : <>Знайдіть головний<br />bottleneck вашого бізнесу</>}</h2>
        <p className="xray-lead">{questions.length} тверджень · {full ? '5 хвилин' : '2 хвилини'}. Отримаєте Business Health по 7 системах,
          Independence Score і вузьке місце, що тримає прибуток{full ? '. Результат зберігається у браузері.' : ' — без реєстрації.'}</p>
        <button className="btn-primary mono" onClick={() => { setPhase('quiz'); setStep(0); track('xray_start', { mode: full ? 'full' : 'quick' }); }}>
          {full ? 'Почати повну діагностику →' : 'Почати X-Ray →'}
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
        <div className="xray-step mono">Питання {step + 1} / {questions.length} · Система {systemByKey(q.system).num} — {systemByKey(q.system).title}</div>
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
          <HealthRadar systems={r.systemScores.map((s) => ({ ...s, title: SHORT[s.key] }))} />
        </div>
      </div>

      <div className="xray-bottleneck">
        <span className="xray-score-lab mono">Головний bottleneck</span>
        <Link to={`/challenges/${systemByKey(r.bottleneck.key).slug}`} className="xray-bottleneck-card">
          <span className="xray-bottleneck-num mono">Система {systemByKey(r.bottleneck.key).num}</span>
          <span className="xray-bottleneck-title">{r.bottleneck.title}</span>
          <span className="xray-bottleneck-score mono">{r.bottleneck.score}<small>/100</small></span>
          <span className="xray-bottleneck-line">{systemByKey(r.bottleneck.key).feel}</span>
          <span className="xray-bottleneck-go mono">Що тут ламається →</span>
        </Link>
      </div>

      <div className="xray-gaps">
        <span className="xray-score-lab mono">Три найслабші системи</span>
        <div className="xray-gaps-row">
          {r.gaps.map((g) => (
            <Link key={g.key} to={`/challenges/${systemByKey(g.key).slug}`} className="xray-gap">
              <span className="xray-gap-score mono">{g.score}<small>/100</small></span>
              <span className="xray-gap-name">{g.title}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="xray-next">
        <p className="xray-next-lead">Оцінена можливість: <b>{opportunityLabel(r.independence)}</b>.
          {full ? ' Це самодіагноз — точний розрив у грошах рахуємо в повному Diagnosis по CRM/ERP/GA4.' : ' Наступний крок — глибша діагностика або розмова.'}</p>
        <p className="xray-price mono">Business X-Ray — безкоштовно · Повний Diagnosis — <b>{DIAGNOSIS_PRICE_FROM}</b></p>
        <div className="home-cta-row">
          {full ? (
            <Link to="/contact" className="btn-primary mono">Подати заявку на Diagnosis →</Link>
          ) : (
            <Link to="/diagnose/full" className="btn-primary mono">Повна діагностика ({QUESTIONS_FULL.length} питань) →</Link>
          )}
          <Link to="/cases" className="btn-ghost mono">Порівняти з ринком →</Link>
          <button className="btn-ghost mono" onClick={reset}>Пройти ще раз</button>
        </div>
      </div>
    </div>
  );
}
