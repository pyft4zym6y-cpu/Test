import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { band, clamp, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import './system.css';

/**
 * WEEXP — THE SYSTEM IN MOTION (прев'ю нового напряму, маршрут /system).
 * Опенінг-фільм головної: VOID → FORM → CONNECT → ACTIVATION → CTA. Один об'єкт
 * (Commerce System із 7 систем) формується зі «стельбюрної інфраструктури» на
 * світлому cinematic-полотні. Scroll = камера. Живий (темний) сайт не чіпаємо.
 */
const SYSTEMS = [
  'Strategy & Management', 'Commercial Performance', 'Demand & Customer',
  'Experience & Conversion', 'Operations & Fulfillment', 'Data & Technology',
  'Organization & Operating Model',
];

export function SystemInMotion() {
  const sec = useRef<HTMLElement>(null);
  const nodes = useRef<(SVGGElement | null)[]>([]);
  const links = useRef<(SVGLineElement | null)[]>([]);
  const pulses = useRef<(SVGCircleElement | null)[]>([]);
  const core = useRef<SVGGElement>(null);
  const sVoid = useRef<HTMLDivElement>(null);
  const sForm = useRef<HTMLDivElement>(null);
  const sForm2 = useRef<HTMLDivElement>(null);
  const sCta = useRef<HTMLDivElement>(null);
  const N = SYSTEMS.length;

  // Позиції 7 систем на еліпсі навколо ядра (viewBox 1000×640).
  const pts = useMemo(() => {
    const cx = 500, cy = 320, rx = 360, ry = 220;
    return SYSTEMS.map((_, i) => {
      const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
      return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, a };
    });
  }, [N]);
  const C = { x: 500, y: 320 };

  useScrollScene(sec, (p, reduce) => {
    // Акти опенінгу.
    set(sVoid.current, reduce ? 1 : seg(p, -1, 0, 0.06, 0.12), `translateY(${((1 - band(p, 0, 0.06)) * -3).toFixed(1)}vh)`);
    set(sForm.current, reduce ? 1 : seg(p, 0.12, 0.17, 0.24, 0.30));
    set(sForm2.current, reduce ? 1 : seg(p, 0.30, 0.35, 0.44, 0.50));
    set(sCta.current, reduce ? 1 : seg(p, 0.84, 0.90, 1.1, 1.2));

    // Ядро проявляється у FORM.
    set(core.current as unknown as HTMLElement, reduce ? 1 : band(p, 0.10, 0.20));

    // Вузли з'являються по черзі (FORM) — «система збирається».
    for (let i = 0; i < N; i++) {
      const g = nodes.current[i]; if (!g) continue;
      const start = 0.14 + (i / N) * 0.16;              // послідовне «завантаження»
      const o = reduce ? 1 : band(p, start, start + 0.06);
      g.style.opacity = String(o);
      g.style.transform = `scale(${(0.6 + o * 0.4).toFixed(3)})`;
    }
    // Лінки малюються (CONNECT) — pathLength=1, offset 1→0.
    for (let i = 0; i < N; i++) {
      const ln = links.current[i]; if (!ln) continue;
      const d = reduce ? 1 : band(p, 0.34 + (i / N) * 0.10, 0.52 + (i / N) * 0.10);
      ln.style.strokeDashoffset = String(1 - d);
      ln.style.opacity = String(0.25 + d * 0.55);
    }
    // Потоки пульсують уздовж лінків (ACTIVATION).
    const flow = reduce ? 0.5 : band(p, 0.56, 0.82);
    for (let i = 0; i < N; i++) {
      const pu = pulses.current[i]; if (!pu) continue;
      const t = (flow + i / N) % 1;                     // рух від системи до ядра
      pu.setAttribute('cx', String(pts[i].x + (C.x - pts[i].x) * t));
      pu.setAttribute('cy', String(pts[i].y + (C.y - pts[i].y) * t));
      pu.style.opacity = String(flow > 0.02 && flow < 0.99 ? 0.9 : 0);
    }
  });

  return (
    <section ref={sec} className="sysx sysx-film" aria-label="WEEXP — The System in Motion">
      <div className="sysx-stage">
        <span className="sysx-field" aria-hidden="true" />

        {/* Commerce System — світлий «музейний» об'єкт */}
        <svg className="sysx-object" viewBox="0 0 1000 640" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
          {pts.map((pt, i) => (
            <line key={`l${i}`} ref={(el) => { links.current[i] = el; }} className="sysx-link"
              x1={C.x} y1={C.y} x2={pt.x} y2={pt.y} pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
          ))}
          {pts.map((pt, i) => (
            <circle key={`p${i}`} ref={(el) => { pulses.current[i] = el; }} className="sysx-pulse" r={4} cx={pt.x} cy={pt.y} style={{ opacity: 0 }} />
          ))}
          <g ref={core} className="sysx-core" style={{ opacity: 0 }}>
            <circle cx={C.x} cy={C.y} r={30} className="sysx-core-ring" />
            <circle cx={C.x} cy={C.y} r={5} className="sysx-core-dot" />
            <text x={C.x} y={C.y + 54} className="sysx-core-label">COMMERCE SYSTEM</text>
          </g>
          {pts.map((pt, i) => (
            <g key={`n${i}`} ref={(el) => { nodes.current[i] = el; }} className="sysx-node" style={{ opacity: 0, transformOrigin: `${pt.x}px ${pt.y}px` }}>
              <circle cx={pt.x} cy={pt.y} r={11} className="sysx-node-ring" />
              <circle cx={pt.x} cy={pt.y} r={3} className="sysx-node-dot" />
              <text x={pt.x} y={pt.y + (pt.y < 300 ? -22 : 30)} className="sysx-node-label"
                textAnchor={pt.x > 620 ? 'end' : pt.x < 380 ? 'start' : 'middle'}>
                <tspan className="sysx-node-num">{String(i + 1).padStart(2, '0')}</tspan> {SYSTEMS[i].split(' & ')[0]}
              </text>
            </g>
          ))}
        </svg>

        {/* VOID */}
        <div ref={sVoid} className="sysx-scene sysx-void">
          <div className="sysx-kick">WEEXP — The System in Motion</div>
          <h1 className="sysx-display sysx-h1">Система<br />замість <span className="sysx-em">героїзму</span></h1>
          <p className="sysx-lead">E-commerce — це система. Більшість бізнесів так не працюють. Подивіться, як вона влаштована.</p>
          <span className="sysx-scrollhint mono">↓ scroll to enter</span>
        </div>

        {/* FORM 1 */}
        <div ref={sForm} className="sysx-scene sysx-form" style={{ opacity: 0 }}>
          <h2 className="sysx-display sysx-h2">E-commerce<br />is a <span className="sysx-em">system</span>.</h2>
        </div>
        {/* FORM 2 */}
        <div ref={sForm2} className="sysx-scene sysx-form2" style={{ opacity: 0 }}>
          <h2 className="sysx-display sysx-h2">Most businesses<br />don’t run like one.</h2>
        </div>

        {/* CTA */}
        <div ref={sCta} className="sysx-scene sysx-ctaScene" style={{ opacity: 0 }}>
          <div className="sysx-kick">Independence Score</div>
          <h2 className="sysx-display sysx-h2">How independent<br />is your <span className="sysx-em">e-commerce</span>?</h2>
          <div className="sysx-cta-row">
            <Link to="/diagnose" className="sysx-cta is-primary">Find your bottleneck →</Link>
            <Link to="/diagnose" className="sysx-cta">Calculate your loss</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
