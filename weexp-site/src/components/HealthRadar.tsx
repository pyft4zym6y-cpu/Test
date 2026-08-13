import { useEffect, useRef, useState } from 'react';

type Sys = { key: string; title: string; score: number };

/** Радар Business Health по 5 системах. Детермінований SVG, анімація розгортання при появі. */
export function HealthRadar({ systems }: { systems: Sys[] }) {
  const [on, setOn] = useState(false);
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el); return () => io.disconnect();
  }, []);

  const N = systems.length;
  const C = 150, R = 108;
  const angle = (i: number) => (i / N) * Math.PI * 2 - Math.PI / 2;
  const pt = (i: number, rad: number) => [C + rad * Math.cos(angle(i)), C + rad * Math.sin(angle(i))];

  const rings = [0.25, 0.5, 0.75, 1];
  const gridPath = (f: number) => systems.map((_, i) => { const [x, y] = pt(i, R * f); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ') + ' Z';
  const dataPath = systems.map((s, i) => { const [x, y] = pt(i, R * (on ? s.score / 100 : 0)); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ') + ' Z';

  return (
    <svg ref={ref} viewBox="-34 -22 368 344" className="radar" role="img" aria-label="Business Health радар">
      {rings.map((f) => <path key={f} d={gridPath(f)} className="radar-ring" />)}
      {systems.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={C} y1={C} x2={x} y2={y} className="radar-axis" />; })}
      <path d={dataPath} className="radar-area" style={{ transition: 'd .9s cubic-bezier(.16,1,.3,1)' }} />
      {systems.map((s, i) => {
        const [lx, ly] = pt(i, R + 20);
        const anchor = Math.abs(Math.cos(angle(i))) < 0.3 ? 'middle' : Math.cos(angle(i)) > 0 ? 'start' : 'end';
        return (
          <g key={s.key}>
            {on && (() => { const [dx, dy] = pt(i, R * s.score / 100); return <circle cx={dx} cy={dy} r={3.2} className="radar-dot" />; })()}
            <text x={lx} y={ly} textAnchor={anchor} className="radar-label">{s.title}</text>
            <text x={lx} y={ly + 13} textAnchor={anchor} className="radar-val">{s.score}</text>
          </g>
        );
      })}
    </svg>
  );
}
