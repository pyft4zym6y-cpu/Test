import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SYSTEMS, SHORT, type SystemKey } from '@/data/xray';
import './anatomy.css'; // скляні плити / світло / флажки шарів (.anat-*) живуть тут
import './home-journey.css';

const Scene3D = lazy(() => import('@/components/Scene3D').then((m) => ({ default: m.Scene3D })));

// 8 шарів «відділу»: бренд + 7 систем. Явні складові — глибина інфраструктури.
const PARTS: Record<SystemKey, string[]> = {
  strategy: ['Стратегія', 'Цілі', 'Модель росту', 'Управлінський цикл'],
  commercial: ['Управління продажами', 'Конверсія · чек', 'Асортимент', 'Юніт-економіка'],
  customer: ['Канали продажів', 'Залучення · CAC', 'Retention · CRM', 'Сервіс'],
  experience: ['Навігація', 'Картка · контент', 'Checkout', 'CRO · A/B'],
  operations: ['Склад · WMS', 'Фулфілмент', 'Логістика', 'Постачання'],
  data: ['Наскрізна аналітика', 'Дашборди', 'Attribution', 'Інтеграції'],
  org: ['Ролі · команда', 'SOP', 'Roadmap', 'Governance'],
};
type Layer = { num: string; title: string; short: string; feel: string; parts: string[] };
const LAYERS: Layer[] = [
  { num: '00', title: 'Бренд і сенс', short: 'Бренд', feel: 'Навіщо ми існуємо для клієнта.', parts: ['Місія', 'Візія', 'Цінності', 'Позиціонування'] },
  ...SYSTEMS.map((s) => ({ num: s.num, title: s.title, short: SHORT[s.key], feel: s.feel, parts: PARTS[s.key] })),
];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const band = (p: number, s: number, e: number) => clamp((p - s) / (e - s), 0, 1);
// Сегмент акту: тане всередину a→b, тримається b→c, тане назовні c→d.
// Сусідні акти стикуються (out одного = in наступного), тож у кадрі домінує один.
const seg = (p: number, a: number, b: number, c: number, d: number) =>
  p < a || p > d ? 0 : p < b ? (p - a) / (b - a) : p > c ? (d - p) / (d - c) : 1;

/**
 * Головна як безперервний скрол-джорней: один закріплений екран, крізь який
 * рухаєшся сценами (не блоки стопкою). Хаос → система збирається → відділ
 * розкладається по шарах → шлях до незалежності → CTA. Усе кероване скролом.
 */
export function HomeJourney() {
  const sec = useRef<HTMLElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const slabs = useRef<(HTMLDivElement | null)[]>([]);
  const actA = useRef<HTMLDivElement>(null);
  const actB = useRef<HTMLDivElement>(null);
  const actC = useRef<HTMLDivElement>(null);
  const actD = useRef<HTMLDivElement>(null);
  const actE = useRef<HTMLDivElement>(null);
  const [layer, setLayer] = useState(0);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    const N = LAYERS.length; const mid = (N - 1) / 2;
    let raf = 0, ticking = false, lastLayer = -1;
    const set = (el: HTMLElement | null, o: number, tf?: string) => { if (!el) return; el.style.opacity = String(o); if (tf !== undefined) el.style.transform = tf; };

    const frame = () => {
      ticking = false;
      const el = sec.current; if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - innerHeight;
      const p = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;

      // Акт A — герой: повний угорі, піднімається й тане.
      const aOut = band(p, 0.08, 0.16);
      set(actA.current, seg(p, -1, 0, 0.08, 0.16), `translateY(${(-aOut * 9).toFixed(1)}vh) scale(${(1 - aOut * 0.05).toFixed(3)})`);
      // Акт B — теза «система з шарів».
      const bIn = band(p, 0.16, 0.22);
      set(actB.current, seg(p, 0.16, 0.22, 0.26, 0.30), `translateY(${((1 - bIn) * 5).toFixed(1)}vh)`);

      // Акт C — розбирання відділу. Один довгий акт: збірка → вибух → крокування → збірка.
      const cVis = reduce ? 1 : seg(p, 0.30, 0.35, 0.76, 0.80);
      set(actC.current, cVis);
      const cp = band(p, 0.30, 0.80);             // внутрішній прогрес акту C
      // Вибух: швидко розлітається (cp 0.05→0.16), тримається, збирається назад (cp 0.9→1).
      const E = reduce ? 1 : clamp(band(p, 0.31, 0.365), 0, 1) - band(p, 0.90, 1.0);
      const thin = 7, thick = 62, gap = thin + (thick - thin) * clamp(E, 0, 1);
      // Крокування шарами лише поки відділ розкладений (розліт майже повний).
      const stepP = band(p, 0.40, 0.74);
      const exploded = E > 0.55;
      const act = Math.min(N - 1, Math.max(0, Math.floor(stepP * N + 0.0001)));
      for (let i = 0; i < N; i++) {
        const s = slabs.current[i]; if (!s) continue;
        const z = (i - mid) * gap;
        const isAct = i === act && exploded;
        s.style.transform = `translateZ(${(z + (isAct ? 26 : 0)).toFixed(1)}px)`;
        s.style.opacity = String(exploded ? (isAct ? 1 : 0.28) : 1);
        s.classList.toggle('is-active', isAct);
      }
      if (stackRef.current) {
        const rot = reduce ? 0 : (cp - 0.5) * 16;
        stackRef.current.style.transform = `rotateX(58deg) rotateZ(${(45 + rot).toFixed(2)}deg)`;
      }
      if (act !== lastLayer) { lastLayer = act; setLayer(act); }

      // Акт D — шлях до незалежності.
      const dIn = band(p, 0.80, 0.86);
      set(actD.current, reduce ? 1 : seg(p, 0.80, 0.86, 0.90, 0.94), `translateY(${((1 - dIn) * 5).toFixed(1)}vh)`);
      // Акт E — CTA (тримається до кінця).
      set(actE.current, reduce ? 1 : seg(p, 0.94, 0.98, 1.1, 1.2));
      set(document.querySelector('.jrny-scroll'), p < 0.06 ? 1 : 0);
    };
    const onScroll = () => { if (!ticking) { ticking = true; raf = requestAnimationFrame(frame); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    frame();
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); };
  }, []);

  const L = LAYERS[layer];

  return (
    <section ref={sec} className="jrny" aria-label="WEEXP — система замість героїзму">
      <Suspense fallback={null}><Scene3D /></Suspense>
      <div className="jrny-stage">

        {/* Акт A — герой */}
        <div ref={actA} className="jrny-act jrny-hero">
          <div className="eyebrow jrny-kick">WEEXP · операційний партнер e-commerce</div>
          <h1 className="jrny-h1">Система<br />замість <span className="mk">героїзму</span></h1>
          <p className="jrny-lead">Ми не консультуємо збоку. Ставимо діагноз у грошах, будуємо e-commerce-відділ і систему — і залишаємо все це працювати без вас.</p>
        </div>

        {/* Акт B — теза */}
        <div ref={actB} className="jrny-act jrny-statement" style={{ opacity: 0 }}>
          <h2 className="jrny-h2">Ваш відділ e-commerce —<br />не набір підрядників,<br />а <span className="mk">система з шарів</span>.</h2>
          <p className="jrny-sub mono">Гортайте — вона розкладеться на складові</p>
        </div>

        {/* Акт C — розбирання відділу */}
        <div ref={actC} className="jrny-act jrny-dept" style={{ opacity: 0 }}>
          <div className="jrny-scene">
            <span className="anat-glow" aria-hidden="true" />
            <div ref={stackRef} className="anat-stack">
              {LAYERS.map((l, i) => (
                <div key={l.num} ref={(el) => { slabs.current[i] = el; }} className="anat-slab">
                  <span className="anat-slab-edge" aria-hidden="true" />
                  <span className="anat-slab-sheen" aria-hidden="true" />
                  <span className="anat-slab-num mono">{l.num}</span>
                  <span className="anat-slab-tag"><b>{l.num}</b> {l.short}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="jrny-panel">
            <span className="jrny-panel-kick mono">Шар {L.num} / {String(LAYERS.length - 1).padStart(2, '0')}</span>
            <h3 className="jrny-panel-h" key={L.num}>{L.title}</h3>
            <p className="jrny-panel-feel">«{L.feel}»</p>
            <div className="jrny-panel-parts">{L.parts.map((d) => <span key={d} className="mono">{d}</span>)}</div>
          </div>
        </div>

        {/* Акт D — шлях до незалежності */}
        <div ref={actD} className="jrny-act jrny-path" style={{ opacity: 0 }}>
          <span className="jrny-kick2 mono">Метод WEEXP</span>
          <div className="jrny-path-row">
            {['Diagnose', 'Build', 'Scale', 'Independence'].map((s, i) => (
              <span key={s} className="jrny-path-step">{s}{i < 3 && <i>→</i>}</span>
            ))}
          </div>
          <h2 className="jrny-h2">Бізнес працює<br />і зростає <span className="mk">без героя</span>.</h2>
        </div>

        {/* Акт E — CTA */}
        <div ref={actE} className="jrny-act jrny-cta" style={{ opacity: 0 }}>
          <h2 className="jrny-h2">Почніть із діагнозу<br />у грошах.</h2>
          <div className="jrny-cta-row">
            <Link to="/diagnose" className="btn-primary mono">Діагностувати бізнес →</Link>
            <Link to="/what-we-build" className="btn-ghost mono">Що ми будуємо →</Link>
          </div>
        </div>

        <span className="jrny-scroll mono" aria-hidden="true">↓ гортайте</span>
      </div>
    </section>
  );
}
