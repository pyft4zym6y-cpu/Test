import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SYSTEMS, SHORT } from '@/data/xray';
import './anatomy.css';

/**
 * «Анатомія відділу e-commerce» — герой-скроллітелінг. Стек «відділу» зібраний
 * у моноліт, потім при скролі розкладається по шарах (як вибуховий вид у
 * мануалі), шар за шаром. Активний шар підсвічується, збоку — з чого він
 * складається. Показуємо, а не змушуємо читати. 7 шарів = 7 систем.
 */
export function DepartmentAnatomy() {
  const sec = useRef<HTMLElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const slabs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [exploded, setExploded] = useState(false);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    const N = SYSTEMS.length;
    const mid = (N - 1) / 2;
    let raf = 0, ticking = false, lastActive = -1;

    const frame = () => {
      ticking = false;
      const el = sec.current; if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(1, total));
      const p = total > 0 ? scrolled / total : 0;

      // Розкладання: вибухаємо в перші 16% скролу, далі крокуємо по шарах.
      const E = reduce ? 1 : Math.min(1, p / 0.16);
      const thin = 7, thick = 62;
      const gap = thin + (thick - thin) * E;
      const act = Math.min(N - 1, Math.max(0, Math.floor(((p - 0.16) / 0.84) * N + 0.0001)));

      for (let i = 0; i < N; i++) {
        const s = slabs.current[i]; if (!s) continue;
        const z = (i - mid) * gap;
        const isAct = i === act && E > 0.6;
        const lift = isAct ? 26 : 0;
        const dim = E > 0.6 ? (isAct ? 1 : 0.34) : 1;
        s.style.transform = `translateZ(${(z + lift).toFixed(1)}px)`;
        s.style.opacity = String(dim);
        s.classList.toggle('is-active', isAct);
      }
      if (stack.current) {
        const rot = reduce ? 0 : (p - 0.5) * 10;
        stack.current.style.transform = `rotateX(58deg) rotateZ(${(45 + rot).toFixed(2)}deg)`;
      }
      if (act !== lastActive) { lastActive = act; setActive(act); }
      setExploded(E > 0.6);
    };
    const onScroll = () => { if (!ticking) { ticking = true; raf = requestAnimationFrame(frame); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    frame();
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); };
  }, []);

  const s = SYSTEMS[active];

  return (
    <section ref={sec} className="anat" aria-label="Анатомія відділу e-commerce">
      <div className="anat-stage">
        <div className="anat-scene">
          <span className="anat-glow" aria-hidden="true" />
          <div ref={stack} className="anat-stack">
            {SYSTEMS.map((sys, i) => (
              <div key={sys.key} ref={(el) => { slabs.current[i] = el; }} className="anat-slab">
                <span className="anat-slab-edge" aria-hidden="true" />
                <span className="anat-slab-sheen" aria-hidden="true" />
                <span className="anat-slab-num mono">{sys.num}</span>
                <span className="anat-slab-face" />
                <span className="anat-slab-tag"><b>{sys.num}</b> {SHORT[sys.key]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="anat-panel">
          <span className="anat-kick mono">{exploded ? `Шар ${s.num} / ${SYSTEMS.length}` : 'Гортайте вниз'}</span>
          <h2 className="anat-h">{exploded ? s.title : <>Ваш відділ<br />e-commerce</>}</h2>
          <p className="anat-feel">{exploded ? `«${s.feel}»` : 'Не набір підрядників, а система з шарів. Гортайте — і вона розкладеться на складові.'}</p>
          {exploded && (
            <>
              <p className="anat-idea">{s.bigIdea}</p>
              <div className="anat-domains">
                {s.domains.map((d) => <span key={d} className="anat-domain mono">{d}</span>)}
              </div>
              <Link to={`/challenges/${s.slug}`} className="anat-link mono">Що тут ламається →</Link>
            </>
          )}
          <div className="anat-rail" aria-hidden="true">
            {SYSTEMS.map((sys, i) => <span key={sys.key} className={`anat-tick${i === active && exploded ? ' is-on' : ''}`} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
