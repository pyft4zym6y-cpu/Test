import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { INDUSTRIES, REVENUE_BANDS, GEOS, MODELS, industryByKey, bandByKey } from '@/data/benchmark';
import './benchmark.css';

/** /how-it-works/benchmark — де стоїть ваш e-commerce: Benchmark → Gap → Opportunity. */
export function Benchmark() {
  const [ind, setInd] = useState(INDUSTRIES[0].key);
  const [band, setBand] = useState(REVENUE_BANDS[1].key);
  const [geo, setGeo] = useState(GEOS[0].key);
  const [model, setModel] = useState(MODELS[0].key);

  const industry = industryByKey(ind);
  const opp = bandByKey(band).opp;

  return (
    <>
      <PageHead
        kicker="Інструмент · WEEXP Benchmark"
        title={<>Де стоїть<br />ваш e-commerce</>}
        lead={<>Оберіть профіль — і побачите норму сегмента, свій імовірний розрив і <b>оцінену
          можливість</b>. Це орієнтир; точний розрахунок — у X-Ray.</>}
      />

      <section className="wrap bm-controls">
        <Selector label="Індустрія" value={ind} set={setInd} opts={INDUSTRIES.map((i) => ({ key: i.key, label: i.label }))} />
        <Selector label="Оборот" value={band} set={setBand} opts={REVENUE_BANDS.map((b) => ({ key: b.key, label: b.label }))} />
        <Selector label="Гео" value={geo} set={setGeo} opts={GEOS} />
        <Selector label="Модель" value={model} set={setModel} opts={MODELS} />
      </section>

      <section className="wrap bm-result">
        <div className="bm-metrics">
          {industry.metrics.map((m) => {
            const max = m.gold * 1.18;
            const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
            return (
              <div key={m.key} className="bm-metric">
                <div className="bm-metric-top">
                  <span className="bm-metric-lab">{m.label}</span>
                  <span className="bm-metric-nums mono">
                    <span className="bm-typical">ви ≈ {m.typical}{m.unit}</span>
                    <span className="bm-norm">норма {m.norm}{m.unit}</span>
                  </span>
                </div>
                <div className="bm-track">
                  <span className="bm-fill" style={{ width: pct(m.typical) }} />
                  <span className="bm-gap" style={{ left: pct(m.typical), width: `calc(${pct(m.norm)} - ${pct(m.typical)})` }} />
                  <span className="bm-tick bm-tick-norm" style={{ left: pct(m.norm) }} title="Норма" />
                  <span className="bm-tick bm-tick-gold" style={{ left: pct(m.gold) }} title="Gold Standard" />
                </div>
              </div>
            );
          })}
        </div>
        <aside className="bm-opp">
          <span className="bm-opp-k mono">Оцінена можливість</span>
          <div className="bm-opp-num">{opp}</div>
          <span className="bm-opp-lab mono">до обороту при виході на норму сегмента</span>
          <div className="bm-legend mono">
            <span><i className="bm-i-gap" /> розрив до норми</span>
            <span><i className="bm-i-norm" /> норма сегмента</span>
            <span><i className="bm-i-gold" /> Gold Standard</span>
          </div>
          <Link to="/diagnose" className="btn-primary mono">Точний розрахунок — X-Ray →</Link>
        </aside>
      </section>
    </>
  );
}

function Selector({ label, value, set, opts }: {
  label: string; value: string; set: (v: string) => void; opts: { key: string; label: string }[];
}) {
  return (
    <div className="bm-sel">
      <span className="bm-sel-lab mono">{label}</span>
      <div className="bm-sel-chips mono">
        {opts.map((o) => (
          <button key={o.key} className={value === o.key ? 'is-on' : ''} onClick={() => set(o.key)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}
