import { Eyebrow, FadeIn } from '@/lib/primitives';
import { say, sayIdle } from '@/lib/bus';
import './flywheel.css';

/** Маховик Commerce OS + граф плейбуків (переосмысленные Flywheel/PlaybookNet старого сайта). */
const LOOP = ['Дані', 'Діагностика', 'Плейбуки', 'Виконання', 'Замір', 'Стандарт'];
const NET = [
  { id: 'PB-08', name: 'Retention', a: -90 }, { id: 'PB-03', name: 'CRO', a: -18 },
  { id: 'PB-21', name: 'SEO', a: 54 }, { id: 'PB-45', name: 'Pricing', a: 126 }, { id: 'PB-56', name: 'Analytics', a: 198 },
];
const pt = (cx: number, cy: number, r: number, deg: number): [number, number] => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];

export function Flywheel() {
  const C = 170, R = 122;
  return (
    <section className="fw" data-say="Рушій крутиться: дані → діагностика → плейбуки → виконання → замір → стандарт. CAC вниз, LTV вгору.">
      <div className="wrap">
        <FadeIn><Eyebrow>Система · один рушій</Eyebrow></FadeIn>
        <FadeIn delay={0.05}><h2 className="fw-h">Дванадцять модулів. <span className="mk">Один рушій.</span></h2></FadeIn>
        <div className="fw-grid">
          <FadeIn delay={0.1} className="fw-col">
            <svg viewBox="0 0 340 340" className="fw-svg" role="img" aria-label="Маховик Commerce OS">
              <g className="fw-spin" style={{ transformOrigin: '170px 170px' }}>
                <circle cx={C} cy={C} r={R} fill="none" stroke="var(--verd-500)" strokeWidth="1" strokeDasharray="3 7" opacity="0.5" />
                {LOOP.map((_, i) => { const [x, y] = pt(C, C, R, -90 + i * 60); return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="var(--hair)" strokeWidth="1" />; })}
              </g>
              {LOOP.map((l, i) => {
                const [x, y] = pt(C, C, R, -90 + i * 60);
                return (
                  <g key={l}>
                    <rect x={x - 4} y={y - 4} width="8" height="8" fill="var(--mark)" className="fw-node" style={{ animationDelay: `${i * 0.3}s` }} />
                    <text x={x} y={y + (y < C ? -12 : 20)} textAnchor="middle" className="fw-nlab">{l}</text>
                  </g>
                );
              })}
              <text x={C} y={C - 6} textAnchor="middle" className="fw-center">Commerce OS</text>
              <text x={C} y={C + 12} textAnchor="middle" className="fw-center2">Engine</text>
            </svg>
            <div className="fw-cac"><span className="mono">↓ CAC</span><span className="mono">↑ LTV</span></div>
          </FadeIn>

          <FadeIn delay={0.16} className="fw-col">
            <p className="fw-lead">Жоден плейбук не працює наодинці — потягни один, і зв’язані рухаються. Тому ми продаємо систему, а не окрему послугу.</p>
            <svg viewBox="0 0 340 300" className="fw-svg" role="img" aria-label="Граф зв’язків плейбуків"
              onMouseLeave={() => sayIdle()}>
              {NET.map((n) => { const [x, y] = pt(170, 150, 108, n.a); return <line key={n.id} x1="170" y1="150" x2={x} y2={y} stroke="var(--hair)" strokeWidth="1" strokeDasharray="2 6" />; })}
              {NET.map((n) => {
                const [x, y] = pt(170, 150, 108, n.a);
                return (
                  <g key={n.id} className="pn-node" onMouseEnter={() => say(`${n.id} · ${n.name} — вузол системи. Зміниш його — зміняться сусідні.`)}>
                    <rect x={x - 5} y={y - 5} width="10" height="10" fill="none" stroke="var(--verd-500)" strokeWidth="1.5" />
                    <text x={x} y={y - 12} textAnchor="middle" className="pn-lab">{n.id}</text>
                    <text x={x} y={y + 20} textAnchor="middle" className="pn-sub">{n.name}</text>
                  </g>
                );
              })}
              <rect x="156" y="136" width="28" height="28" fill="var(--mark)" />
              <text x="170" y="154" textAnchor="middle" className="pn-hub">PB-12</text>
            </svg>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
