import { lazy, Suspense, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { computeLoss, eur, SYS, type LossInput, type LossResult, type SysKey } from './lossModel';
import './system.css';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));

/** Loss Calculator — окремий конверсійний продукт у світлому напрямі. Заповнюючи
 *  профіль і симптоми, користувач спостерігає, як його бізнес складається в
 *  Commerce System; на результаті вузол-bottleneck пульсує червоним. Не аудит. */
const FIELDS: { k: keyof Omit<LossInput, 'symptoms'>; label: string; unit: string; hint?: string }[] = [
  { k: 'monthlyRevenue', label: 'Online revenue', unit: '€ / month' },
  { k: 'aov', label: 'Average order value', unit: '€' },
  { k: 'conversion', label: 'Conversion rate', unit: '%' },
  { k: 'repeatRate', label: 'Repeat-purchase rate', unit: '%' },
  { k: 'returnsRate', label: 'Returns + cancellations', unit: '%' },
  { k: 'grossMargin', label: 'Gross margin', unit: '%' },
  { k: 'cac', label: 'Customer acquisition cost', unit: '€', hint: 'optional' },
];
const PAIN: Record<SysKey, string> = {
  strategy: 'We don’t know where to grow', commercial: 'Revenue is there, profit isn’t',
  customer: 'Customers are expensive / don’t return', experience: 'People visit but don’t buy',
  operations: 'Too much manual work', data: 'Different numbers in different systems',
  org: 'Everything depends on the owner',
};
const HW = (s: number) => (s >= 65 ? 'ok' : s >= 40 ? 'warn' : 'bad');

export function LossCalculator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inp, setInp] = useState<LossInput>({ monthlyRevenue: 0, aov: 0, conversion: 0, repeatRate: 0, returnsRate: 0, grossMargin: 0, cac: 0, symptoms: [] });
  const [res, setRes] = useState<LossResult | null>(null);
  const alerts = useRef<number[]>([]);

  const setNum = (k: keyof Omit<LossInput, 'symptoms'>) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInp((s) => ({ ...s, [k]: parseFloat(e.target.value) || 0 }));
  const toggle = (k: SysKey) => setInp((s) => ({ ...s, symptoms: s.symptoms.includes(k) ? s.symptoms.filter((x) => x !== k) : [...s.symptoms, k] }));
  const compute = () => { const r = computeLoss(inp); setRes(r); alerts.current = r.bottleneckNodes; setStep(3); };
  const restart = () => { alerts.current = []; setRes(null); setStep(1); };
  const primaryLabel = (k: SysKey) => SYS.find((s) => s.key === k)!.label;

  return (
    <section className="sysx sysx-calc">
      <div className="sysx-field" aria-hidden="true" />
      <div className="sysx-calc-bg"><Suspense fallback={null}><CommerceSystem3D fixedProgress={0.72} alerts={alerts} /></Suspense></div>

      <div className="sysx-calc-panel">
        {step !== 3 && (
          <header className="sysx-calc-head">
            <div className="sysx-kick">Loss Calculator · 5-minute diagnostic</div>
            <h1 className="sysx-display sysx-calc-h1">Find the money<br />you’re <span className="sysx-em">losing</span></h1>
            <div className="sysx-steps mono"><span className={step === 1 ? 'on' : ''}>01 Profile</span><i>→</i><span className={step === 2 ? 'on' : ''}>02 Symptoms</span><i>→</i><span>03 Your leak</span></div>
          </header>
        )}

        {step === 1 && (
          <div className="sysx-card">
            <div className="sysx-grid">
              {FIELDS.map((f) => (
                <label key={f.k} className="sysx-inp">
                  <span className="sysx-inp-l">{f.label}{f.hint && <i> · {f.hint}</i>}</span>
                  <span className="sysx-inp-row">
                    <input type="number" inputMode="decimal" min={0} value={inp[f.k] || ''} onChange={setNum(f.k)} placeholder="0" />
                    <span className="sysx-inp-u mono">{f.unit}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="sysx-calc-actions">
              <button className="sysx-cta is-primary" onClick={() => setStep(2)} disabled={!inp.monthlyRevenue}>Next → symptoms</button>
              <span className="sysx-note mono">Estimate based on the information provided. Not a financial audit.</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="sysx-card">
            <p className="sysx-lead">Where does it feel wrong? Pick everything that resonates — each one reshapes your system.</p>
            <div className="sysx-sym">
              {SYS.map((s) => (
                <button key={s.key} className={`sysx-sym-b${inp.symptoms.includes(s.key) ? ' on' : ''}`} onClick={() => toggle(s.key)}>
                  <b>{s.label}</b><span>“{PAIN[s.key]}”</span>
                </button>
              ))}
            </div>
            <div className="sysx-calc-actions">
              <button className="sysx-cta" onClick={() => setStep(1)}>← Back</button>
              <button className="sysx-cta is-primary" onClick={compute}>See your leak →</button>
            </div>
          </div>
        )}

        {step === 3 && res && (
          <div className="sysx-result">
            <div className="sysx-kick">Your e-commerce leak</div>
            <div className="sysx-total">
              <span className="sysx-total-big sysx-display">{eur(res.total)}<span>/ year</span></span>
              <span className="sysx-total-cap mono">estimated opportunity · range {eur(res.range[0])}–{eur(res.range[1])}</span>
            </div>

            <div className="sysx-leaks">
              {res.leaks.slice(0, 5).map((l, i) => {
                const max = res.leaks[0].amount || 1;
                return (
                  <div key={l.label + i} className="sysx-leak">
                    <span className="sysx-leak-l">{l.label}</span>
                    <span className="sysx-leak-bar"><i style={{ width: `${Math.round((l.amount / max) * 100)}%` }} /></span>
                    <span className="sysx-leak-v mono">{eur(l.amount)}</span>
                  </div>
                );
              })}
            </div>

            <div className="sysx-bottleneck">
              <span className="sysx-kick">Primary bottleneck</span>
              <b className="sysx-display">{primaryLabel(res.primary)}</b>
              <span className="mono">secondary — {primaryLabel(res.secondary)}</span>
            </div>

            <div className="sysx-health">
              <div className="sysx-health-head"><span className="sysx-kick">Business Health</span><b className="sysx-display">{res.overallHealth}<i>/100</i></b></div>
              <div className="sysx-health-grid">
                {res.health.map((h) => (
                  <div key={h.key} className="sysx-hbar">
                    <span className="sysx-hbar-l mono">{h.label.split(' & ')[0].split(' ')[0]}</span>
                    <span className={`sysx-hbar-t ${HW(h.score)}`}><i style={{ width: `${h.score}%` }} /></span>
                    <span className="sysx-hbar-v mono">{h.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sysx-actions">
              <span className="sysx-kick">Top 3 actions</span>
              <ol>{res.actions.map((a) => <li key={a.key}>{a.text}</li>)}</ol>
            </div>

            <div className="sysx-calc-actions">
              <Link to="/diagnose" className="sysx-cta is-primary">Get the full diagnosis →</Link>
              <button className="sysx-cta" onClick={restart}>Recalculate</button>
            </div>
            <span className="sysx-note mono">Estimate based on the information provided. Not a financial audit. Full diagnosis confirms the numbers with your data.</span>
          </div>
        )}
      </div>
    </section>
  );
}
