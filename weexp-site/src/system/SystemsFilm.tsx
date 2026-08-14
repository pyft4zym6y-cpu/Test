import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SYSTEMS } from '@/data/xray';
import { band, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import './system.css';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));

/**
 * WEEXP — THE SEVEN SYSTEMS (challenges-film, /systems). Продовження головної:
 * якщо /system вводить ідею «e-commerce — це система із семи частин», то тут
 * камера по черзі зупиняється на кожній із семи систем. Той самий WebGL-об'єкт
 * (Commerce System): активна система світиться червоним (тут витікає виторг),
 * поруч з'являється плашка-експонат — біль, симптом, що будує WEEXP. Скрол =
 * камера, що обходить систему вузол за вузлом. Світле cinematic-полотно.
 *
 * Драматургія: INTRO «де ви втрачаєте гроші» → 7 актів (по системі) →
 * ACTIVATION (коли зв'язано — гроші течуть) → CTA (знайти свій bottleneck).
 */
const N = SYSTEMS.length;                // 7
const A0 = 0.08;                         // старт band-у систем
const A1 = 0.90;                         // кінець band-у систем
const W = (A1 - A0) / N;                 // ширина одного акту ≈ 0.117

export function SystemsFilm() {
  const sec = useRef<HTMLElement>(null);
  const progress = useRef(0);                                   // прогрес для WebGL-об'єкта
  const alerts = useRef<number[]>([]);                          // активна система → червоний вузол
  const labels = useRef(SYSTEMS.map(() => ({ x: 50, y: 50, vis: 0 }))); // спроєктовані позиції вузлів
  const activeIdx = useRef(-1);                                 // яка система в фокусі (для маркера)
  const gate = useRef(0);                                       // 0..1 — чи ми всередині band-у систем
  const marker = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useScrollScene(sec, (p, reduce) => {
    // — WebGL-хореографія: enter/assemble → examine (links firm up) → activation —
    progress.current = reduce ? 0.55
      : p < A0 ? 0.12 + band(p, 0, A0) * 0.36            // 0.12 → 0.48  збірка
      : p < A1 ? 0.48 + band(p, A0, A1) * 0.07           // 0.48 → 0.55  зв'язки міцніють, без імпульсів
      : 0.55 + band(p, A1, 1) * 0.30;                    // 0.55 → 0.85  імпульси (гроші течуть)

    set(intro.current, reduce ? 1 : seg(p, -1, 0, 0.055, 0.11), `translateY(${((1 - band(p, 0, 0.055)) * -3).toFixed(1)}vh)`);
    set(outro.current, reduce ? 1 : seg(p, A1, 0.945, 1.1, 1.2));

    // — 7 актів: кожна плашка тане в центр свого вікна —
    const inBand = !reduce && p > A0 - 0.02 && p < A1 + 0.02;
    const idx = inBand ? Math.min(N - 1, Math.max(0, Math.floor((p - A0) / W))) : -1;
    for (let i = 0; i < N; i++) {
      const a = A0 + i * W;
      set(panels.current[i], reduce ? 1 : seg(p, a, a + 0.022, a + W - 0.022, a + W),
        `translateY(${((1 - seg(p, a, a + 0.03, a + W - 0.03, a + W)) * 2).toFixed(1)}vh)`);
    }

    // активна система → червоний вузол; маркер живе лише всередині band-у
    alerts.current = idx >= 0 ? [idx] : [];
    activeIdx.current = idx;
    gate.current = reduce ? 0 : band(p, A0 - 0.01, A0 + 0.02) * (1 - band(p, A1 - 0.02, A1 + 0.01));
    if (idx >= 0 && idx !== active) setActive(idx);
  });

  // rAF: вішаємо маркер на спроєктовану позицію активного вузла (коли він до нас лицем).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = marker.current, i = activeIdx.current;
      if (el) {
        const L = i >= 0 ? labels.current[i] : null;
        if (L) {
          el.style.left = L.x.toFixed(2) + '%';
          el.style.top = L.y.toFixed(2) + '%';
          el.style.opacity = String(Math.max(0, Math.min(1, L.vis * gate.current)));
        } else el.style.opacity = '0';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section ref={sec} className="sysx sysx-film sysx-seven" aria-label="WEEXP — сім систем, у яких бізнес втрачає гроші">
      <div className="sysx-stage">
        <span className="sysx-field" aria-hidden="true" />
        <Suspense fallback={null}><CommerceSystem3D progress={progress} alerts={alerts} labels={labels} /></Suspense>

        {/* Маркер активної системи, прив'язаний до 3D-вузла */}
        <div ref={marker} className="sysf-marker" aria-hidden="true">
          <span className="sysf-marker-dot" />
          <span className="sysf-marker-num mono">{SYSTEMS[active].num}</span>
        </div>

        {/* Рейка 01..07 — де камера серед семи систем */}
        <div className="sysf-rail" aria-hidden="true">
          {SYSTEMS.map((s, i) => (
            <span key={s.key} className={'sysf-tick' + (i === active ? ' is-on' : '')}><b>{s.num}</b></span>
          ))}
        </div>

        {/* INTRO */}
        <div ref={intro} className="sysx-scene sysx-void">
          <div className="sysx-kick">WEEXP — The Seven Systems</div>
          <h1 className="sysx-display sysx-h1">Де ваш бізнес<br />втрачає <span className="sysx-em sysx-em-alert">гроші</span>?</h1>
          <p className="sysx-lead">Не сайт і не канал — уся система онлайн-продажів. Сім частин: від стратегії до організації. Пройдемо крізь кожну.</p>
          <span className="sysx-scrollhint mono">↓ крізь 7 систем</span>
        </div>

        {/* 7 актів — плашки-експонати біля об'єкта */}
        {SYSTEMS.map((s, i) => (
          <div key={s.key} ref={(el) => { panels.current[i] = el; }} className="sysf-panel" style={{ opacity: 0 }}>
            <span className="sysf-ghost mono" aria-hidden="true">{s.num}</span>
            <div className="sysf-panel-in">
              <span className="sysf-en mono">{s.en} · Система {s.num}/07</span>
              <h2 className="sysx-display sysf-title">{s.title}</h2>
              <p className="sysf-feel">«{s.feel}»</p>
              <div className="sysf-pains">
                {s.pains.slice(0, 3).map((pn) => (
                  <span key={pn} className="sysf-pain"><i aria-hidden="true" />{pn}</span>
                ))}
              </div>
              <p className="sysf-sell"><b className="mono">Будуємо:</b> {s.sell}</p>
            </div>
          </div>
        ))}

        {/* ACTIVATION → CTA */}
        <div ref={outro} className="sysx-scene sysx-ctaScene">
          <div className="sysx-kick">Знайдіть свою слабку ланку</div>
          <h2 className="sysx-display sysx-h2">Не вгадуйте систему —<br />знайдіть <span className="sysx-em">bottleneck</span>.</h2>
          <p className="sysx-lead">Business X-Ray за 2 хвилини покаже, яка з семи систем зараз стримує ваш зріст найсильніше.</p>
          <div className="sysx-cta-row">
            <Link to="/diagnose" className="sysx-cta is-primary">Пройти Business X-Ray →</Link>
            <Link to="/loss" className="sysx-cta">Порахувати втрати</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
