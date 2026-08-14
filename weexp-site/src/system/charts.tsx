import { type SysKey } from './lossModel';

/**
 * Спільні преміальні графіки для звітів Етапу 2 і Етапу 3. Радар і бари
 * синхронізовані через hover (наведення на систему підсвічує її в обох) —
 * інтерактивність із «вау». Розмітка з великим полем, щоб підписи не обрізались.
 */
export type SysScore = { key: SysKey; label: string; score: number };
const short = (label: string) => label.split(/\s|\//)[0];
export const HW = (s: number) => (s >= 65 ? 'ok' : s >= 40 ? 'warn' : 'bad');

// Широке поле (400×300), центр (200,150), радіус 100, підписи на 124 — з запасом
// по горизонталі, щоб «Організація»/«Комерційна» не виходили за межі.
const CX = 200, CY = 150, R = 100, LR = 125;
const polar = (i: number, n: number, r: number): [number, number] => {
  const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
};

export function RadarChart({ systems, hover, onHover }: { systems: SysScore[]; hover: number | null; onHover: (i: number | null) => void }) {
  const n = systems.length;
  const pts = systems.map((s, i) => polar(i, n, (Math.max(3, Math.min(100, s.score)) / 100) * R));
  const area = pts.map((p) => p.join(',')).join(' ');
  return (
    <svg viewBox="0 0 400 300" className="rdr" role="img" aria-label="Профіль зрілості систем">
      <defs>
        <radialGradient id="rdrFill" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="rgba(126,157,255,.40)" />
          <stop offset="100%" stopColor="rgba(126,157,255,.06)" />
        </radialGradient>
        <filter id="rdrGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} className="rdr-ring" points={Array.from({ length: n }, (_, i) => polar(i, n, R * f).join(',')).join(' ')} />
      ))}
      {systems.map((_, i) => { const [x, y] = polar(i, n, R); return <line key={i} className="rdr-axis" x1={CX} y1={CY} x2={x} y2={y} />; })}

      <polygon className="rdr-area" points={area} fill="url(#rdrFill)" filter="url(#rdrGlow)" />

      {pts.map((p, i) => (
        <g key={i} className={`rdr-node${hover === i ? ' on' : ''}`} onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)}>
          <circle className="rdr-hit" cx={p[0]} cy={p[1]} r={16} />
          <circle className="rdr-dot" cx={p[0]} cy={p[1]} r={hover === i ? 6 : 3.4} />
          {hover === i && (
            <g className="rdr-bub" transform={`translate(${p[0]}, ${p[1]})`}>
              <rect x={-17} y={-32} width={34} height={21} rx={6} />
              <text x={0} y={-17.5} textAnchor="middle">{systems[i].score}</text>
            </g>
          )}
        </g>
      ))}

      {systems.map((s, i) => {
        const [x, y] = polar(i, n, LR);
        const anchor = x < CX - 6 ? 'end' : x > CX + 6 ? 'start' : 'middle';
        return (
          <text key={i} className={`rdr-lab${hover === i ? ' on' : ''}`} x={x} y={y} textAnchor={anchor} dominantBaseline="middle"
            onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)}>{short(s.label)}</text>
        );
      })}
    </svg>
  );
}

export function SystemBars({ systems, hover, onHover }: { systems: SysScore[]; hover: number | null; onHover: (i: number | null) => void }) {
  return (
    <div className="barz">
      {systems.map((h, i) => (
        <div key={h.key} className={`barz-row${hover === i ? ' on' : ''}`} style={{ '--i': i } as React.CSSProperties}
          onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)}>
          <span className="barz-l">{short(h.label)}</span>
          <span className={`barz-t ${HW(h.score)}`}><i style={{ width: `${Math.max(3, Math.min(100, h.score))}%` }} /></span>
          <span className="barz-v mono">{h.score}</span>
        </div>
      ))}
    </div>
  );
}
