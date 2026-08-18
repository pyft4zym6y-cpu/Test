import './system.css';

/**
 * SYSTEM ORBIT — «жива» констеляція восьми систем навколо ядра-бізнесу.
 * Кожен вузол = система: розмір і сяйво = зрілість, колір = здоров'я. Промені
 * від ядра «течуть» енергією (що сильніша система — то яскравіший потік), слабка
 * ланка пульсує червоним, зовнішня дуга = скільки даних заповнено. Усе на SVG +
 * CSS (без WebGL) — тому ефектно, зрозуміло й не «скаче» на мобільному. Росте й
 * розгоряється з кожною відповіддю (плавні transition при зміні балів).
 */
export type OrbitSystem = { key: string; label: string; score: number };

const CX = 60, CY = 60, RING = 38, LABR = 51;
const health = (s: number) => (s <= 0 ? 'none' : s >= 65 ? 'ok' : s >= 40 ? 'warn' : 'bad');
const short = (l: string) => l.split(/\s|\//)[0];
const pt = (i: number, r: number) => {
  const a = (i / 8) * Math.PI * 2 - Math.PI / 2; // старт зверху, за годинниковою
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
};

export function SystemOrbit({
  systems,
  completeness = 0,
  activeKey,
  compact = false,
}: {
  systems: OrbitSystem[];
  completeness?: number;
  activeKey?: string;
  compact?: boolean;
}) {
  const list = systems.slice(0, 8);
  // вузьке місце — найнижчий бал (серед заповнених)
  const scored = list.filter((s) => s.score > 0);
  const minScore = scored.length ? Math.min(...scored.map((s) => s.score)) : -1;
  const C = 2 * Math.PI * 54; // довжина кола прогресу (r=54)

  return (
    <div className={'orb' + (compact ? ' is-compact' : '')} role="img" aria-label="Констеляція восьми систем бізнесу">
      <svg viewBox="-24 -4 168 128" className="orb-svg">
        <defs>
          <radialGradient id="orbGlowOk" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(52,179,113,.55)" /><stop offset="100%" stopColor="rgba(52,179,113,0)" /></radialGradient>
          <radialGradient id="orbGlowWarn" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(224,169,46,.5)" /><stop offset="100%" stopColor="rgba(224,169,46,0)" /></radialGradient>
          <radialGradient id="orbGlowBad" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(214,54,43,.55)" /><stop offset="100%" stopColor="rgba(214,54,43,0)" /></radialGradient>
          <radialGradient id="orbCore" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(126,157,255,.35)" /><stop offset="100%" stopColor="rgba(126,157,255,0)" /></radialGradient>
        </defs>

        {/* прогрес заповнення — зовнішня дуга */}
        <circle className="orb-prog-tr" cx={CX} cy={CY} r={54} />
        <circle className="orb-prog" cx={CX} cy={CY} r={54} strokeDasharray={C} strokeDashoffset={C * (1 - Math.max(0, Math.min(100, completeness)) / 100)} transform={`rotate(-90 ${CX} ${CY})`} />

        {/* декоративне кільце, що повільно обертається */}
        <g className="orb-spin" style={{ transformOrigin: `${CX}px ${CY}px` }}>
          <circle className="orb-ring" cx={CX} cy={CY} r={RING} />
        </g>

        {/* промені-звʼязки ядро → система (течуть енергією) */}
        {list.map((s, i) => {
          const p = pt(i, RING);
          const on = s.score > 0;
          return (
            <line key={'l' + s.key} className={`orb-link h-${health(s.score)}${on ? ' is-on' : ''}`}
              x1={CX} y1={CY} x2={p.x} y2={p.y} style={{ ['--flow' as string]: `${(6 - (i % 3)) * 0.9 + 3}s` }} />
          );
        })}

        {/* ядро — бізнес як єдине ціле */}
        <circle className="orb-core-glow" cx={CX} cy={CY} r={16} fill="url(#orbCore)" />
        <circle className="orb-core" cx={CX} cy={CY} r={8.5} />
        <circle className="orb-core-dot" cx={CX} cy={CY} r={2.4} />

        {/* вузли систем */}
        {list.map((s, i) => {
          const p = pt(i, RING);
          const h = health(s.score);
          const r = 2.4 + (Math.max(0, s.score) / 100) * 3.8;
          const isAlert = s.score > 0 && s.score === minScore;
          const isActive = activeKey === s.key;
          return (
            <g key={s.key} className={`orb-node h-${h}${isAlert ? ' is-alert' : ''}${isActive ? ' is-active' : ''}`}>
              <circle className="orb-halo" cx={p.x} cy={p.y} r={r * 2.4} fill={`url(#orbGlow${h === 'ok' ? 'Ok' : h === 'warn' ? 'Warn' : 'Bad'})`} />
              {isActive && <circle className="orb-active-ring" cx={p.x} cy={p.y} r={r + 3} />}
              {isAlert && <circle className="orb-alert-ring" cx={p.x} cy={p.y} r={r + 2} />}
              <circle className="orb-dot" cx={p.x} cy={p.y} r={r} />
            </g>
          );
        })}

        {/* підписи систем */}
        {list.map((s, i) => {
          const p = pt(i, LABR);
          const anchor = p.x < CX - 4 ? 'end' : p.x > CX + 4 ? 'start' : 'middle';
          const dy = p.y < CY - 6 ? -1 : p.y > CY + 6 ? 4 : 2;
          return (
            <text key={'t' + s.key} className={`orb-lbl${activeKey === s.key ? ' is-active' : ''}`} x={p.x} y={p.y + dy} textAnchor={anchor}>
              {short(s.label)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
