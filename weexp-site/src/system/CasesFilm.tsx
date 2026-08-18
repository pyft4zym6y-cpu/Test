import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CASES } from '@/data/cases';
import { SHORT } from '@/data/xray';
import { band, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import './system.css';

/**
 * WEEXP — THE EVIDENCE (proof-film, /proof). Третя частина арки: /system вводить
 * ідею системи, /systems показує сім місць витоку, а тут — доказ, що система
 * збирається в гроші. Кінематографічна стрічка трансформацій: одне число-герой
 * на екран, поруч дельти до→після (з CRM/ERP/GA4) і рядок грошей. Світле полотно,
 * без 3D — героєм є саме число. Курований набір флагманських кейсів.
 */
const REEL = ['premium-textile', 'consumer-dtc', 'cosmetics-holding', 'fashion-apparel', 'electronics-marketplace', 'supplements-health', 'pharmacy-omnichannel']
  .map((s) => CASES.find((c) => c.slug === s)!).filter(Boolean);
const N = REEL.length;
const A0 = 0.09, A1 = 0.90, W = (A1 - A0) / N;

export function CasesFilm() {
  const sec = useRef<HTMLElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);
  const acts = useRef<(HTMLDivElement | null)[]>([]);
  const ghost = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  useScrollScene(sec, (p, reduce) => {
    set(intro.current, reduce ? 1 : seg(p, -1, 0, 0.06, 0.115), `translateY(${((1 - band(p, 0, 0.06)) * -3).toFixed(1)}vh)`);
    set(outro.current, reduce ? 1 : seg(p, A1, 0.945, 1.1, 1.2));

    const inBand = !reduce && p > A0 - 0.02 && p < A1 + 0.02;
    const idx = inBand ? Math.min(N - 1, Math.max(0, Math.floor((p - A0) / W))) : -1;
    for (let i = 0; i < N; i++) {
      const a = A0 + i * W;
      const o = reduce ? 1 : seg(p, a, a + 0.024, a + W - 0.024, a + W);
      const el = acts.current[i]; if (!el) continue;
      el.style.opacity = String(o);
      el.style.transform = `translateY(${((1 - seg(p, a, a + 0.032, a + W - 0.032, a + W)) * 2.4).toFixed(1)}vh)`;
      // «оживання» дельт: у центрі акту (hold) — .is-live запускає стаджер рядків
      const hold = !reduce && p > a + 0.03 && p < a + W - 0.03;
      el.classList.toggle('is-live', hold);
    }
    if (ghost.current && idx >= 0) ghost.current.textContent = REEL[idx].hero;
    if (idx >= 0 && idx !== active) setActive(idx);
  });

  return (
    <section ref={sec} className="sysx sysx-film sysx-proof" aria-label="WEEXP — докази: трансформації в цифрах">
      <div className="sysx-stage">
        <span className="sysx-field" aria-hidden="true" />
        <span ref={ghost} className="cf-ghost sysx-display" aria-hidden="true">{REEL[0].hero}</span>

        {/* рейка кейсів */}
        <div className="sysf-rail" aria-hidden="true">
          {REEL.map((c, i) => (
            <span key={c.slug} className={'sysf-tick' + (i === active ? ' is-on cf-on' : '')}><b>{String(i + 1).padStart(2, '0')}</b></span>
          ))}
        </div>

        {/* INTRO */}
        <div ref={intro} className="sysx-scene sysx-void">
          <div className="sysx-kick">WEEXP — The Evidence · 17 трансформацій</div>
          <h1 className="sysx-display sysx-h1">Систему видно<br />в <span className="sysx-em">цифрах</span></h1>
          <p className="sysx-lead">Не обіцянки — дельти до→після з CRM, ERP і GA4. Кожен кейс анонімний, але число реальне. Гортайте — сім трансформацій.</p>
          <span className="sysx-scrollhint mono">↓ до→після</span>
        </div>

        {/* КЕЙС-АКТИ */}
        {REEL.map((c, i) => (
          <div key={c.slug} ref={(el) => { acts.current[i] = el; }} className="cf-act" style={{ opacity: 0 }}>
            <div className="cf-hero">
              <span className="cf-cat mono">{c.cat}</span>
              <span className="cf-num sysx-display">{c.hero}</span>
              <span className="cf-heroLabel">{c.heroLabel}</span>
              <span className="cf-window mono">{c.window}</span>
              <p className="cf-money">{c.money}</p>
              <div className="cf-chips">{c.systems.map((k) => <span key={k} className="cf-chip mono">{SHORT[k]}</span>)}</div>
            </div>
            <div className="cf-deltas">
              <span className="cf-deltas-h mono">До → після</span>
              {c.metrics.slice(0, 5).map((m, k) => (
                <div key={m.label} className="cf-row" style={{ '--k': k } as React.CSSProperties}>
                  <span className="cf-row-l">{m.label}</span>
                  <span className="cf-row-v"><i className="cf-before">{m.before}</i><em className="cf-arrow mono">→</em><b className="cf-after">{m.after}</b>{m.note && <span className="cf-note mono">{m.note}</span>}</span>
                </div>
              ))}
              <p className="cf-learn"><b className="mono">Урок:</b> {c.learning}</p>
              <div className="cf-verified mono"><span aria-hidden="true">✓</span> {c.verified || 'Кожна дельта звірена з CRM / ERP / GA4 клієнта'}</div>
              {c.testimonial && (
                <blockquote className="cf-quote">
                  <p>«{c.testimonial.quote}»</p>
                  <cite className="mono">{c.testimonial.name ? `${c.testimonial.name}, ` : ''}{c.testimonial.role}</cite>
                </blockquote>
              )}
            </div>
          </div>
        ))}

        {/* OUTRO CTA */}
        <div ref={outro} className="sysx-scene sysx-ctaScene">
          <div className="sysx-kick">Ваша трансформація</div>
          <h2 className="sysx-display sysx-h2">Наступне число<br />у стрічці — <span className="sysx-em">ваше</span>.</h2>
          <p className="sysx-lead">Почніть із діагнозу: за 2 хвилини побачите, яка система дасть найбільшу дельту саме вам.</p>
          <div className="sysx-cta-row">
            <Link to="/diagnose" className="sysx-cta is-primary">Знайти свою дельту →</Link>
            <Link to="/systems" className="sysx-cta">8 систем</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
