import { useEffect, useRef, useState } from 'react';
import { INDUSTRIES } from '@/data/benchmark';
import './intel-charts.css';

const METRICS = [
  { key: 'cr', label: 'Конверсія', unit: '%' },
  { key: 'repeat', label: 'Повторні', unit: '%' },
  { key: 'organic', label: 'Органіка', unit: '%' },
  { key: 'ltvcac', label: 'LTV:CAC', unit: '×' },
];

function useOnScreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return [ref, on] as const;
}

/** Інтерактивний бенчмарк: обери метрику — побачиш норму й Gold Standard по індустріях. */
export function BenchmarkChart() {
  const [metric, setMetric] = useState('cr');
  const [ref, on] = useOnScreen<HTMLDivElement>();
  const m = METRICS.find((x) => x.key === metric)!;
  const rows = INDUSTRIES.map((ind) => ({ ...ind.metrics.find((x) => x.key === metric)!, label: ind.label }));
  const max = Math.max(...rows.map((r) => r.gold)) * 1.15;

  return (
    <div className="ic" ref={ref}>
      <div className="ic-head">
        <h3 className="ic-title">E-commerce Benchmark за індустріями</h3>
        <div className="ic-toggle mono">
          {METRICS.map((x) => (
            <button key={x.key} className={metric === x.key ? 'is-on' : ''} onClick={() => setMetric(x.key)}>{x.label}</button>
          ))}
        </div>
      </div>
      <div className="ic-rows">
        {rows.map((r) => (
          <div key={r.label} className="ic-row">
            <span className="ic-row-lab mono">{r.label}</span>
            <div className="ic-track">
              <span className="ic-fill" style={{ width: on ? `${(r.typical / max) * 100}%` : 0 }} />
              <span className="ic-gap" style={{ left: on ? `${(r.typical / max) * 100}%` : 0, width: on ? `${((r.norm - r.typical) / max) * 100}%` : 0 }} />
              <span className="ic-tick ic-tick-norm" style={{ left: `${(r.norm / max) * 100}%` }} />
              <span className="ic-tick ic-tick-gold" style={{ left: `${(r.gold / max) * 100}%` }} />
            </div>
            <span className="ic-row-val mono">{r.norm}{m.unit}</span>
          </div>
        ))}
      </div>
      <div className="ic-legend mono">
        <span><i className="ic-i-gap" /> типова → норма</span>
        <span><i className="ic-i-norm" /> норма сегмента</span>
        <span><i className="ic-i-gold" /> Gold Standard</span>
      </div>
    </div>
  );
}

const FUNNEL = [
  { s: 'Сесії', v: 100, norm: 100 },
  { s: 'Картка товару', v: 42, norm: 45 },
  { s: 'Кошик', v: 8.1, norm: 9 },
  { s: 'Checkout', v: 4.6, norm: 6.3 },
  { s: 'Купівля', v: 3.4, norm: 4.2 },
];

/** Воронка: де ринок втрачає гроші (типове vs норма). */
export function FunnelChart() {
  const [ref, on] = useOnScreen<HTMLDivElement>();
  return (
    <div className="ic" ref={ref}>
      <h3 className="ic-title">Де воронка втрачає гроші</h3>
      <div className="ic-funnel">
        {FUNNEL.map((f) => {
          const gap = f.norm - f.v;
          return (
            <div key={f.s} className="ic-fn-row">
              <span className="ic-fn-lab mono">{f.s}</span>
              <div className="ic-fn-bar">
                <span className="ic-fn-fill" style={{ width: on ? `${f.v}%` : 0 }}>
                  <span className="ic-fn-val mono">{f.v}%</span>
                </span>
                <span className="ic-fn-norm" style={{ left: `${f.norm}%` }} title={`норма ${f.norm}%`} />
              </div>
              <span className={`ic-fn-gap mono${gap > 0.6 ? ' is-red' : ''}`}>{gap > 0 ? `−${gap.toFixed(1)}` : '✓'}</span>
            </div>
          );
        })}
      </div>
      <p className="ic-note mono">Найбільша втрата — Checkout: 4,6% при нормі 6,3%. Одна цифра — сім можливих причин.</p>
    </div>
  );
}
