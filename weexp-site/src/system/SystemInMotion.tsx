import { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { band, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import './system.css';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));

/**
 * WEEXP — THE SYSTEM IN MOTION (прев'ю нового напряму, /system). Опенінг-фільм
 * головної: VOID → FORM → CONNECT → ACTIVATION → CTA. Один WebGL-об'єкт
 * (Commerce System) збирається зі стельбюрної інфраструктури на світлому
 * cinematic-полотні. Scroll = камера. Живий (темний) сайт не чіпаємо.
 */
export function SystemInMotion() {
  const sec = useRef<HTMLElement>(null);
  const progress = useRef(0); // спільний прогрес для WebGL-об'єкта
  const sVoid = useRef<HTMLDivElement>(null);
  const sForm = useRef<HTMLDivElement>(null);
  const sForm2 = useRef<HTMLDivElement>(null);
  const sCta = useRef<HTMLDivElement>(null);

  useScrollScene(sec, (p, reduce) => {
    progress.current = p; // WebGL-об'єкт читає це щокадру
    set(sVoid.current, reduce ? 1 : seg(p, -1, 0, 0.06, 0.12), `translateY(${((1 - band(p, 0, 0.06)) * -3).toFixed(1)}vh)`);
    set(sForm.current, reduce ? 1 : seg(p, 0.12, 0.17, 0.24, 0.30));
    set(sForm2.current, reduce ? 1 : seg(p, 0.30, 0.35, 0.44, 0.50));
    set(sCta.current, reduce ? 1 : seg(p, 0.84, 0.90, 1.1, 1.2));
  });

  return (
    <section ref={sec} className="sysx sysx-film" aria-label="WEEXP — The System in Motion">
      <div className="sysx-stage">
        <span className="sysx-field" aria-hidden="true" />
        <Suspense fallback={null}><CommerceSystem3D progress={progress} /></Suspense>

        {/* VOID */}
        <div ref={sVoid} className="sysx-scene sysx-void">
          <div className="sysx-kick">WEEXP — The System in Motion</div>
          <h1 className="sysx-display sysx-h1">Система<br />замість <span className="sysx-em">героїзму</span></h1>
          <p className="sysx-lead">E-commerce — це система. Більшість бізнесів так не працюють. Подивіться, як вона влаштована.</p>
          <span className="sysx-scrollhint mono">↓ scroll to enter</span>
        </div>

        {/* FORM 1 / 2 */}
        <div ref={sForm} className="sysx-scene sysx-form" style={{ opacity: 0 }}>
          <h2 className="sysx-display sysx-h2">E-commerce<br />is a <span className="sysx-em">system</span>.</h2>
        </div>
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
