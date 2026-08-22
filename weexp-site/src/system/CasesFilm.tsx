import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CASES, localizeCase } from '@/data/cases';
import { SHORT } from '@/data/xray';
import { band, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import { useT, useLp, useLang } from '@/i18n';
import { ShareButton } from '@/system/ShareButton';
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
  const t = useT();
  const lp = useLp();
  const lang = useLang();
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
    <section ref={sec} className="sysx sysx-film sysx-proof" aria-label={t('WEEXP — докази: трансформації в цифрах', 'WEEXP — proof: transformations in numbers')}>
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
          <div className="sysx-kick">{t('WEEXP — The Evidence · 17 трансформацій', 'WEEXP — The Evidence · 17 transformations')}</div>
          <h1 className="sysx-display sysx-h1">{t('Систему видно', 'You see the system')}<br />{t('в ', 'in the ')}<span className="sysx-em">{t('цифрах', 'numbers')}</span></h1>
          <p className="sysx-lead">{t('Не обіцянки — дельти до→після з CRM, ERP і GA4. Кожен кейс анонімний, але число реальне. Гортайте — сім флагманських кейсів.', 'Not promises — before→after deltas from CRM, ERP and GA4. Every case is anonymized, but the number is real. Scroll — seven flagship cases.')}</p>
          <span className="sysx-scrollhint mono">{t('↓ до→після', '↓ before→after')}</span>
        </div>

        {/* КЕЙС-АКТИ */}
        {REEL.map((c, i) => {
          const lc = localizeCase(c, lang);
          return (
          <div key={c.slug} ref={(el) => { acts.current[i] = el; }} className="cf-act" style={{ opacity: 0 }}>
            <div className="cf-hero">
              <span className="cf-cat mono">{lc.cat}</span>
              <span className="cf-num sysx-display">{c.hero}</span>
              <span className="cf-heroLabel">{lc.heroLabel}</span>
              <span className="cf-window mono">{lc.window}</span>
              <p className="cf-money">{lc.money}</p>
              <div className="cf-chips">{lc.systems.map((k) => <span key={k} className="cf-chip mono">{SHORT[k]}</span>)}</div>
            </div>
            <div className="cf-deltas">
              <span className="cf-deltas-h mono">{t('До → після', 'Before → After')}</span>
              {lc.metrics.slice(0, 5).map((m, k) => (
                <div key={m.label} className="cf-row" style={{ '--k': k } as React.CSSProperties}>
                  <span className="cf-row-l">{m.label}</span>
                  <span className="cf-row-v"><i className="cf-before">{m.before}</i><em className="cf-arrow mono">→</em><b className="cf-after">{m.after}</b>{m.note && <span className="cf-note mono">{m.note}</span>}</span>
                </div>
              ))}
              <p className="cf-learn"><b className="mono">{t('Урок:', 'Lesson:')}</b> {lc.learning}</p>
              <div className="cf-verified mono"><span aria-hidden="true">✓</span> {lc.verified || t('Кожна дельта звірена з CRM / ERP / GA4 клієнта', 'Every delta verified against the client\'s CRM / ERP / GA4')}</div>
              {lc.testimonial && (
                <blockquote className="cf-quote">
                  <p>«{lc.testimonial.quote}»</p>
                  <cite className="mono">{lc.testimonial.name ? `${lc.testimonial.name}, ` : ''}{lc.testimonial.role}</cite>
                </blockquote>
              )}
            </div>
          </div>
          );
        })}

        {/* OUTRO CTA */}
        <div ref={outro} className="sysx-scene sysx-ctaScene">
          <div className="sysx-kick">{t('Ваша трансформація', 'Your transformation')}</div>
          <h2 className="sysx-display sysx-h2">{t('Наступне число', 'The next number')}<br />{t('у стрічці — ', 'in the reel is ')}<span className="sysx-em">{t('ваше', 'yours')}</span>.</h2>
          <p className="sysx-lead">{t('Почніть із діагнозу: за 2 хвилини побачите, яка система дасть найбільшу дельту саме вам.', 'Start with the diagnosis: in 2 minutes you\'ll see which system delivers the biggest delta for you.')}</p>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Знайти свою дельту →', 'Find your delta →')}</Link>
            <Link to={lp('/contact')} className="sysx-cta">{t('Написати нам', 'Contact us')} →</Link>
            <ShareButton title={t('WEEXP — докази в цифрах', 'WEEXP — proof in numbers')} />
          </div>
        </div>
      </div>
    </section>
  );
}
