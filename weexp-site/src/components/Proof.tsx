import { useEffect, useRef, useState } from 'react';
import { Eyebrow, FadeIn, Stat } from '@/lib/primitives';
import './proof.css';

/** «Спочатку — що це дає»: доказ у грошах + s-крива €48K→€900K. Малюється по появі,
 *  але гарантовано видима (IntersectionObserver + таймаут-фолбек — надійно на мобільному). */
function GrowthChart() {
  const d = 'M 20 250 C 150 245, 250 235, 360 200 S 560 70, 760 34';
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = svgRef.current;
    const draw = () => setOn(true);
    if (!el) { draw(); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { draw(); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    const t = setTimeout(draw, 1400); // фолбек: якщо IO не спрацював — все одно показуємо
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);

  const len = pathRef.current?.getTotalLength?.() ?? 1000;
  return (
    <svg ref={svgRef} className="growth" viewBox="0 0 800 280" role="img" aria-label="Крива зростання обороту €48K → €900K за 18 місяців">
      {[70, 130, 190, 250].map((y) => <line key={y} x1="20" x2="780" y1={y} y2={y} stroke="var(--hair)" strokeWidth="1" />)}
      <path ref={pathRef} d={d} fill="none" stroke="var(--mark)" strokeWidth="2.5" strokeLinecap="round"
        style={{ strokeDasharray: len, strokeDashoffset: on ? 0 : len, transition: 'stroke-dashoffset 1.7s cubic-bezier(.4,0,.2,1)' }} />
      <circle cx="760" cy="34" r="5" fill="var(--mark)" style={{ opacity: on ? 1 : 0, transition: 'opacity .4s ease 1.5s' }} />
      <text x="20" y="270" className="gc-lab">€48K · старт</text>
      <text x="700" y="22" className="gc-lab gc-lab-end">€900K · 18 міс</text>
    </svg>
  );
}

const PROOF_STATS = [
  { count: 18, prefix: '×', label: 'оборот у кейсі «преміум-текстиль»' },
  { count: 4.2, dp: 1, suffix: '%', label: 'конверсія сайту (було 0,8%)' },
  { count: 3.8, dp: 1, suffix: '×', label: 'ROI року програми' },
  { count: 14, label: 'країн, де працює метод' },
];

export function Proof() {
  return (
    <section className="proof" data-say="Кейс «преміум-текстиль»: оборот ×18, €48K → €900K за 18 місяців. Спочатку — цифра.">
      <div className="wrap">
        <FadeIn><Eyebrow>Доказ · кейс з CRM, ERP і GA4</Eyebrow></FadeIn>
        <FadeIn delay={0.05}><h2 className="proof-h">Спочатку — <span className="mk">що це дає</span>.</h2></FadeIn>
        <div className="proof-grid">
          <FadeIn delay={0.1} className="proof-chart"><GrowthChart /></FadeIn>
          <div className="proof-stats">
            {PROOF_STATS.map((s, i) => (
              <FadeIn key={i} delay={0.15 + i * 0.08}>
                <Stat count={s.count} dp={s.dp} prefix={s.prefix} suffix={s.suffix} label={s.label} />
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
