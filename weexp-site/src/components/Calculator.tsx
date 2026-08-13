import { useMemo, useState } from 'react';
import { Eyebrow, FadeIn, CountUp } from '@/lib/primitives';
import { say, sayIdle } from '@/lib/bus';
import './calculator.css';

/** Флагманский калькулятор разрыва (переосмысленный 8-шаговый виджет старого сайта). */
type Niche = { id: string; name: string; crNorm: number; crGold: number; repeatTarget: number; aov: number };
const NICHES: Niche[] = [
  { id: 'fashion', name: 'Fashion / одяг', crNorm: 1.6, crGold: 3.5, repeatTarget: 35, aov: 1800 },
  { id: 'beauty', name: 'Beauty / косметика', crNorm: 2.0, crGold: 4.0, repeatTarget: 45, aov: 900 },
  { id: 'home', name: 'Home & Decor / текстиль', crNorm: 1.4, crGold: 3.0, repeatTarget: 25, aov: 2500 },
  { id: 'electro', name: 'Electronics', crNorm: 1.1, crGold: 2.5, repeatTarget: 20, aov: 6000 },
  { id: 'fmcg', name: 'FMCG / продукти', crNorm: 2.4, crGold: 5.0, repeatTarget: 50, aov: 1200 },
  { id: 'other', name: 'Універсальний', crNorm: 1.5, crGold: 3.0, repeatTarget: 30, aov: 1500 },
];
const STEPS = ['Ніша', 'Трафік', 'Конверсія', 'Чек', 'Повторні', 'Маржа', 'Розрив'];
const SAYS = ['Оберіть нішу — підтягну еталони.', 'Скільки візитів на місяць?', 'Яка конверсія зараз?', 'Середній чек?', 'Частка повторних?', 'Маржа — щоб порахувати втрату прибутку.', 'Ось скільки ви лишаєте на столі.'];

const fmt = (n: number) => Math.round(n).toLocaleString('uk-UA');
const tone = (v: number, norm: number, gold: number) => (v >= gold ? 'ok' : v >= norm ? 'warn' : 'bad');

export function Calculator() {
  const [step, setStep] = useState(0);
  const [niche, setNiche] = useState<Niche>(NICHES[0]);
  const [traffic, setTraffic] = useState(20000);
  const [cr, setCr] = useState(1.2);
  const [aov, setAov] = useState(1800);
  const [repeat, setRepeat] = useState(15);
  const [margin, setMargin] = useState(35);

  const go = (n: number) => { const s = Math.max(0, Math.min(STEPS.length - 1, n)); setStep(s); say(SAYS[s]); };

  const r = useMemo(() => {
    const buyers = traffic * cr / 100;
    const crGapM = traffic * Math.max(0, niche.crGold - cr) / 100 * aov;
    const repGapM = buyers * Math.max(0, niche.repeatTarget - repeat) / 100 * aov;
    const gapM = crGapM + repGapM;
    const gapY = gapM * 12, cons = gapY * 0.55, marginLoss = gapY * margin / 100;
    const tot = crGapM + repGapM || 1;
    return { gapM, gapY, cons, marginLoss, crShare: crGapM / tot * 100, repShare: repGapM / tot * 100 };
  }, [niche, traffic, cr, aov, repeat, margin]);

  const Slider = ({ label, val, set, min, max, stp, unit }: { label: string; val: number; set: (n: number) => void; min: number; max: number; stp: number; unit: string }) => (
    <div className="cl-field">
      <div className="cl-field-head"><span className="mono">{label}</span><span className="cl-field-val">{fmt(val)}{unit}</span></div>
      <input type="range" className="cl-slider" min={min} max={max} step={stp} value={val} onChange={(e) => set(parseFloat(e.target.value))} aria-label={label} />
    </div>
  );

  return (
    <section className="calc" data-say="Калькулятор розриву: порахуємо, скільки грошей магазин лишає на столі щороку.">
      <div className="wrap">
        <FadeIn><Eyebrow>Калькулятор · безкоштовно · без контактів</Eyebrow></FadeIn>
        <FadeIn delay={0.05}><h2 className="calc-h">Скільки ви <span className="mk">лишаєте на столі</span> щороку?</h2></FadeIn>

        <FadeIn delay={0.1}>
          <div className="cl-panel">
            <div className="cl-pills">
              {STEPS.map((s, i) => (
                <button key={i} className={`cl-pill mono${i === step ? ' is-cur' : ''}${i < step ? ' is-done' : ''}`}
                  onClick={() => go(i)} type="button">{String(i + 1).padStart(2, '0')} {s}</button>
              ))}
            </div>

            <div className="cl-body">
              {step === 0 && (
                <div className="cl-niches">
                  {NICHES.map((n) => (
                    <button key={n.id} type="button" className={`cl-niche${niche.id === n.id ? ' is-on' : ''}`}
                      onClick={() => { setNiche(n); setAov(n.aov); }}>
                      <span className="cl-niche-name">{n.name}</span>
                      <span className="cl-niche-bm mono">еталон CR {n.crGold}% · повторні {n.repeatTarget}%</span>
                    </button>
                  ))}
                </div>
              )}
              {step === 1 && <Slider label="Трафік, візитів/міс" val={traffic} set={setTraffic} min={1000} max={200000} stp={1000} unit="" />}
              {step === 2 && <Slider label="Конверсія зараз, %" val={cr} set={setCr} min={0.3} max={6} stp={0.1} unit="%" />}
              {step === 3 && <Slider label="Середній чек, ₴" val={aov} set={setAov} min={300} max={10000} stp={100} unit=" ₴" />}
              {step === 4 && <Slider label="Повторні покупки, %" val={repeat} set={setRepeat} min={0} max={70} stp={1} unit="%" />}
              {step === 5 && <Slider label="Маржа, %" val={margin} set={setMargin} min={10} max={80} stp={1} unit="%" />}
              {step === 6 && (
                <div className="cl-result">
                  <div className="cl-result-main">
                    <div className="cl-result-lab mono">Недоотримано, консервативно</div>
                    <div className="cl-result-big"><CountUp to={r.cons / 1e6} dp={1} suffix=" млн ₴/рік" /></div>
                    <div className="cl-result-sub mono">≈ {fmt(r.gapM)} ₴/міс · втрата прибутку ≈ {fmt(r.marginLoss)} ₴/рік · нижня межа (×0,55)</div>
                  </div>
                  <div className="cl-attr">
                    <div className="cl-bar"><div className="cl-bar-head mono"><span>Конверсія</span><span>{Math.round(r.crShare)}%</span></div><div className="cl-bar-track"><span style={{ width: `${r.crShare}%` }} /></div></div>
                    <div className="cl-bar"><div className="cl-bar-head mono"><span>Повторні</span><span>{Math.round(r.repShare)}%</span></div><div className="cl-bar-track"><span style={{ width: `${r.repShare}%` }} /></div></div>
                  </div>
                  <div className="cl-health">
                    {[
                      { k: 'Конверсія', v: cr, u: '%', t: tone(cr, niche.crNorm, niche.crGold) },
                      { k: 'Повторні', v: repeat, u: '%', t: tone(repeat, niche.repeatTarget * 0.6, niche.repeatTarget) },
                      { k: 'Чек', v: aov, u: ' ₴', t: tone(aov, niche.aov * 0.7, niche.aov) },
                    ].map((h) => (
                      <div key={h.k} className={`cl-hz t-${h.t}`}><span className="mono">{h.k}</span><b>{fmt(h.v)}{h.u}</b></div>
                    ))}
                  </div>
                  <p className="cl-note mono">Органіка й email у суму не входять — щоб не задвоювати. Реальна вилка уточнюється в діагностиці.</p>
                </div>
              )}
            </div>

            <div className="cl-nav">
              <button className="cl-btn mono" type="button" onClick={() => go(step - 1)} disabled={step === 0}>← назад</button>
              {step < STEPS.length - 1
                ? <button className="cl-btn cl-btn-p mono" type="button" onClick={() => go(step + 1)}>далі →</button>
                : <button className="cl-btn cl-btn-p mono" type="button" onClick={() => { go(0); sayIdle(); }}>спочатку</button>}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
