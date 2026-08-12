import { useEffect, useRef } from 'react';
import './transform.css';

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const INK = hex('#0F1A21'), VERD = hex('#1F5648'), CORAL = hex('#D6362B'), NODE = hex('#6FAA9A');
const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type P = { cx: number; cy: number; tx: number; ty: number; _x: number; _y: number; ph: number; sp: number };

export function Transform() {
  const actRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cv = cvRef.current!, ctx = cv.getContext('2d')!;
    const act = actRef.current!, stage = stageRef.current!;
    let W = 0, H = 0, cols = 0, rows = 0, particles: P[] = [], progress = reduce ? 1 : 0, tPhase = 0, raf = 0;

    function layout() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const aspect = W / H;
      cols = Math.max(6, Math.round(9 * Math.min(1.4, aspect)));
      rows = Math.max(5, Math.round((cols / aspect) * 0.78));
      const bw = Math.min(W * 0.78, 1180), bh = Math.min(H * 0.6, 600);
      const bx = (W - bw) / 2, by = (H - bh) / 2 + H * 0.03;
      particles = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const tx = bx + (c / (cols - 1)) * bw, ty = by + (r / (rows - 1)) * bh;
        particles.push({ cx: Math.random() * W, cy: Math.random() * H, tx, ty, _x: tx, _y: ty, ph: Math.random() * Math.PI * 2, sp: 0.4 + Math.random() * 0.8 });
      }
    }
    const at = (c: number, r: number) => particles[r * cols + c];

    function draw() {
      const e = easeInOut(progress);
      stage.style.background = mix(INK, VERD, e);
      ctx.clearRect(0, 0, W, H); tPhase += 0.016;
      if (e > 0.42) {
        const a = Math.min(1, (e - 0.42) / 0.5);
        ctx.lineWidth = 1; ctx.strokeStyle = `rgba(159,195,183,${0.32 * a})`; ctx.beginPath();
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const p = at(c, r);
          if (c < cols - 1) { const q = at(c + 1, r); ctx.moveTo(p._x, p._y); ctx.lineTo(q._x, q._y); }
          if (r < rows - 1) { const q = at(c, r + 1); ctx.moveTo(p._x, p._y); ctx.lineTo(q._x, q._y); }
        }
        ctx.stroke();
      }
      for (const p of particles) {
        let x = p.cx + (p.tx - p.cx) * e, y = p.cy + (p.ty - p.cy) * e;
        if (e < 0.98) { const d = (1 - e) * 22; x += Math.cos(tPhase * p.sp + p.ph) * d; y += Math.sin(tPhase * p.sp + p.ph) * d; }
        p._x = x; p._y = y;
        ctx.fillStyle = mix(CORAL, NODE, e); ctx.globalAlpha = 0.35 + e * 0.55;
        ctx.beginPath(); ctx.arc(x, y, 1.6 + e * 1.4, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (beforeRef.current) { beforeRef.current.style.opacity = String(Math.max(0, 1 - progress / 0.5)); }
      if (afterRef.current) { afterRef.current.style.opacity = String(Math.max(0, (progress - 0.5) / 0.5)); }
    }

    function onScroll() {
      if (reduce) return;
      const r = act.getBoundingClientRect();
      const total = act.offsetHeight - stage.offsetHeight;
      progress = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    }
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    const onResize = () => layout();

    layout(); onScroll();
    addEventListener('resize', onResize); addEventListener('scroll', onScroll, { passive: true });
    if (reduce) draw(); else loop();
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', onResize); removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <section className="tf" ref={actRef}>
      <div className="tf-stage" ref={stageRef}>
        <canvas className="tf-canvas" ref={cvRef} />
        <div className="wrap tf-copy">
          <div className="tf-state" ref={beforeRef}>
            <div className="eyebrow">01 · До</div>
            <h2>Бізнес тримається на героїзмі</h2>
            <p>Втрати сховані в операційці. Прибери людину — і все зупиниться.</p>
          </div>
          <div className="tf-state after" ref={afterRef}>
            <div className="eyebrow">01 · Після</div>
            <h2>Система працює без вас</h2>
            <p>Відділ, процеси, документи. Кожен вузол на місці — бізнес їде сам.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
