import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SYSTEMS } from '@/data/xray';
import { band, clamp, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import './challenges-journey.css';

/**
 * /challenges як просторовий джорней (той самий рушій, інший «об'єкт»).
 * Замість стопки блоків — горизонтальний dolly: вертикальний скрол веде
 * «камеру» вбік крізь 7 систем, викладених стрічкою. Активна система в
 * центрі й на передньому плані, сусідні — глибше (менші, тьмяніші). Коли
 * система приходить у центр, її ланцюг цінності «оживає» зліва направо.
 */
export function ChallengesJourney() {
  const sec = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const intro = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const last = useRef(-1);
  const N = SYSTEMS.length;

  useScrollScene(sec, (p, reduce) => {
    // Інтро «Де ви втрачаєте гроші?» → dolly крізь системи → аутро CTA.
    set(intro.current, reduce ? 1 : seg(p, -1, 0, 0.06, 0.12), `translateY(${((1 - band(p, 0, 0.06)) * -4).toFixed(1)}vh)`);
    set(outro.current, reduce ? 1 : seg(p, 0.9, 0.95, 1.1, 1.2));

    const pos = band(p, 0.12, 0.9) * (N - 1);   // неперервна позиція «камери» 0..N-1
    const idx = Math.min(N - 1, Math.max(0, Math.round(pos)));

    // Стрічка й рейка живуть лише під час dolly — під інтро/аутро тануть,
    // щоб не просвічувати крізь оверлеї.
    const trackVis = reduce ? 1 : band(p, 0.06, 0.12) * (1 - band(p, 0.9, 0.96));
    const t = track.current;
    if (t && panels.current[0] && panels.current[1]) {
      const stride = panels.current[1]!.offsetLeft - panels.current[0]!.offsetLeft;
      const p0 = panels.current[0]!;
      const x = innerWidth / 2 - (p0.offsetWidth / 2) - stride * pos;
      t.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      t.style.opacity = String(trackVis);
    }
    set(rail.current, trackVis);
    for (let i = 0; i < N; i++) {
      const el = panels.current[i]; if (!el) continue;
      const d = Math.min(1, Math.abs(i - pos));       // 0 у центрі → 1 і далі скраю
      el.style.opacity = String(1 - d * 0.62);
      el.style.transform = `scale(${(1 - d * 0.12).toFixed(3)}) translateY(${(d * 2).toFixed(1)}vh)`;
      const near = clamp(1 - Math.abs(i - pos) * 1.4, 0, 1); // «оживання» ланцюга біля центру
      el.style.setProperty('--near', near.toFixed(3));
      el.classList.toggle('is-center', i === idx && d < 0.5);
    }
    if (rail.current) rail.current.style.setProperty('--pos', String(pos));
    if (idx !== last.current) { last.current = idx; setActive(idx); }
  });

  return (
    <section ref={sec} className="cjq" aria-label="7 систем, у яких бізнес втрачає гроші">
      <div className="cjq-stage">
        {/* глибина: тьмяне світло за активною системою */}
        <span className="cjq-glow" aria-hidden="true" />

        {/* Інтро */}
        <div ref={intro} className="cjq-intro">
          <div className="eyebrow cjq-kick">Розділ · Виклики бізнесу</div>
          <h1 className="cjq-h1">Де ваш бізнес<br /><span className="mk">втрачає гроші</span>?</h1>
          <p className="cjq-lead">Не сайт і не канал — уся система онлайн-продажів. Сім систем від стратегії до організації. Гортайте — пройдемо крізь кожну.</p>
          <span className="cjq-scroll mono" aria-hidden="true">↓ крізь 7 систем</span>
        </div>

        {/* Стрічка систем — горизонтальний dolly */}
        <div ref={track} className="cjq-track">
          {SYSTEMS.map((s, i) => (
            <div key={s.key} ref={(el) => { panels.current[i] = el; }} className="cjq-panel">
              <span className="cjq-panel-ghost mono" aria-hidden="true">{s.num}</span>
              <div className="cjq-panel-in">
                <span className="cjq-panel-en mono">{s.en}</span>
                <h2 className="cjq-panel-title">{s.title}</h2>
                <p className="cjq-panel-feel">«{s.feel}»</p>
                <div className="cjq-flow" aria-hidden="true">
                  {s.flow.map((f, k) => (
                    <span key={f} className="cjq-node" style={{ '--k': k } as React.CSSProperties}>
                      {f}{k < s.flow.length - 1 && <i className="cjq-node-link" />}
                    </span>
                  ))}
                </div>
                <p className="cjq-panel-sell"><b className="mono">Будуємо:</b> {s.sell}</p>
                <div className="cjq-domains">{s.domains.map((d) => <span key={d} className="mono">{d}</span>)}</div>
                <Link to={`/challenges/${s.slug}`} className="cjq-link mono">Розібрати систему →</Link>
              </div>
            </div>
          ))}
        </div>

        {/* Камера-рейка: позиція серед 7 систем */}
        <div ref={rail} className="cjq-rail" aria-hidden="true">
          {SYSTEMS.map((s, i) => (
            <span key={s.key} className={`cjq-tick${i === active ? ' is-on' : ''}`}><b>{s.num}</b></span>
          ))}
        </div>

        {/* Аутро CTA */}
        <div ref={outro} className="cjq-outro">
          <h2 className="cjq-h1">Не вгадуйте систему —<br /><span className="mk">знайдіть bottleneck</span>.</h2>
          <div className="cjq-cta-row">
            <Link to="/diagnose" className="btn-primary mono">Знайти bottleneck за 2 хв →</Link>
            <Link to="/diagnose" className="btn-ghost mono">Business X-Ray →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
