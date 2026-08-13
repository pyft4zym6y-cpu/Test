import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SYSTEMS, SHORT, type SystemKey } from '@/data/xray';
import './anatomy.css';

/**
 * «Анатомія відділу e-commerce» — герой-скроллітелінг. Стек «відділу» зібраний
 * у моноліт, потім при скролі розкладається по шарах (як вибуховий вид у
 * мануалі). Активний шар підсвічується, збоку — з чого він складається.
 * Верхній шар — Бренд/сенс; далі 7 систем із явними складовими (канали
 * продажів, управління продажами, наскрізна аналітика тощо).
 */
type Layer = { num: string; title: string; short: string; slug: string | null; feel: string; idea: string; parts: string[] };

// Явні складові кожного шару — «глибина інфраструктури», яку видно одразу.
const PARTS: Record<SystemKey, string[]> = {
  strategy: ['Стратегія', 'Цілі й декомпозиція', 'Модель росту', 'Управлінський цикл'],
  commercial: ['Управління продажами', 'Конверсія · чек · повторні', 'Асортимент і SKU', 'Юніт-економіка'],
  customer: ['Канали продажів', 'Залучення і CAC', 'Retention і CRM', 'Клієнтський сервіс'],
  experience: ['Навігація і каталог', 'Картка і контент', 'Checkout і mobile', 'CRO і A/B'],
  operations: ['Склад і WMS', 'Фулфілмент', 'Логістика', 'Постачання й закупівлі'],
  data: ['Наскрізна аналітика', 'Дашборди й звіти', 'Attribution', 'Дані та інтеграції'],
  org: ['Ролі й команда', 'SOP і процеси', 'Roadmap', 'Governance'],
};

const BRAND: Layer = {
  num: '00', title: 'Бренд і сенс', short: 'Бренд', slug: null,
  feel: 'Навіщо ми існуємо для клієнта — ще до першого продажу.',
  idea: 'Місія, візія, цінності й позиціонування. Фундамент, на якому тримається вся система.',
  parts: ['Місія', 'Візія', 'Цінності', 'Позиціонування', 'Бренд-платформа', 'Tone of voice'],
};

const LAYERS: Layer[] = [
  BRAND,
  ...SYSTEMS.map((s) => ({ num: s.num, title: s.title, short: SHORT[s.key], slug: s.slug, feel: s.feel, idea: s.bigIdea, parts: PARTS[s.key] })),
];

export function DepartmentAnatomy() {
  const sec = useRef<HTMLElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const slabs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [exploded, setExploded] = useState(false);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    const N = LAYERS.length;
    const mid = (N - 1) / 2;
    let raf = 0, ticking = false, lastActive = -1;

    const frame = () => {
      ticking = false;
      const el = sec.current; if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(1, total));
      const p = total > 0 ? scrolled / total : 0;

      const E = reduce ? 1 : Math.min(1, p / 0.18);
      const thin = 7, thick = 58;
      const gap = thin + (thick - thin) * E;
      // Активний шар крокує в межах 0.18..0.98 — з запасом, щоб не «проскакував».
      const act = Math.min(N - 1, Math.max(0, Math.floor(((p - 0.18) / 0.8) * N + 0.0001)));

      for (let i = 0; i < N; i++) {
        const s = slabs.current[i]; if (!s) continue;
        const z = (i - mid) * gap;
        const isAct = i === act && E > 0.6;
        const lift = isAct ? 24 : 0;
        const dim = E > 0.6 ? (isAct ? 1 : 0.32) : 1;
        s.style.transform = `translateZ(${(z + lift).toFixed(1)}px)`;
        s.style.opacity = String(dim);
        s.classList.toggle('is-active', isAct);
      }
      if (stack.current) {
        const rot = reduce ? 0 : (p - 0.5) * 9;
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

  const s = LAYERS[active];

  return (
    <section ref={sec} className="anat" aria-label="Анатомія відділу e-commerce">
      <div className="anat-stage">
        <div className="anat-scene">
          <span className="anat-glow" aria-hidden="true" />
          <div ref={stack} className="anat-stack">
            {LAYERS.map((l, i) => (
              <div key={l.num} ref={(el) => { slabs.current[i] = el; }} className="anat-slab">
                <span className="anat-slab-edge" aria-hidden="true" />
                <span className="anat-slab-sheen" aria-hidden="true" />
                <span className="anat-slab-num mono">{l.num}</span>
                <span className="anat-slab-face" />
                <span className="anat-slab-tag"><b>{l.num}</b> {l.short}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="anat-panel">
          <span className="anat-kick mono">{exploded ? `Шар ${s.num} / ${String(LAYERS.length - 1).padStart(2, '0')}` : 'Гортайте вниз'}</span>
          <div className="anat-panel-body" key={exploded ? s.num : 'intro'}>
            <h2 className="anat-h">{exploded ? s.title : <>Ваш відділ<br />e-commerce</>}</h2>
            <p className="anat-feel">{exploded ? `«${s.feel}»` : 'Не набір підрядників, а система з шарів. Гортайте — і вона розкладеться на складові.'}</p>
            {exploded && (
              <>
                <p className="anat-idea">{s.idea}</p>
                <div className="anat-domains">
                  {s.parts.map((d) => <span key={d} className="anat-domain mono">{d}</span>)}
                </div>
                {s.slug
                  ? <Link to={`/challenges/${s.slug}`} className="anat-link mono">Що тут ламається →</Link>
                  : <Link to="/about" className="anat-link mono">Про бренд WEEXP →</Link>}
              </>
            )}
          </div>
          <div className="anat-rail" aria-hidden="true">
            {LAYERS.map((l, i) => <span key={l.num} className={`anat-tick${i === active && exploded ? ' is-on' : ''}`} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
