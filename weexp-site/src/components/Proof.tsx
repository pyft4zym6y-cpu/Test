import { motion } from 'framer-motion';
import { Eyebrow, FadeIn, Stat } from '@/lib/primitives';
import './proof.css';

/** «Спочатку — що це дає»: доказ у грошах + s-крива €48K→€900K, рисуется по скроллу. */
function GrowthChart() {
  // s-curve: from low-left to high-right (€48K -> €900K, ×18)
  const d = 'M 20 250 C 150 245, 250 235, 360 200 S 560 70, 760 34';
  return (
    <svg className="growth" viewBox="0 0 800 280" role="img" aria-label="Крива зростання обороту €48K → €900K за 18 місяців">
      {[70, 130, 190, 250].map((y) => <line key={y} x1="20" x2="780" y1={y} y2={y} stroke="var(--hair)" strokeWidth="1" />)}
      <motion.path d={d} fill="none" stroke="var(--mark)" strokeWidth="2.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: '-60px' }} transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }} />
      <motion.circle cx="760" cy="34" r="5" fill="var(--mark)"
        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.7, duration: 0.4 }} />
      <text x="20" y="270" className="gc-lab">€48K · старт</text>
      <text x="700" y="22" className="gc-lab gc-lab-end">€900K · 18 міс</text>
    </svg>
  );
}

const PROOF_STATS = [
  { count: 18, prefix: '×', label: 'оборот у кейсі «преміум-текстиль»' },
  { count: 4.2, dp: 1, suffix: '%', label: 'конверсія сайту (було 0,8%)' },
  { count: 3.8, dp: 1, suffix: '×', label: 'ROI року програми' },
  { count: 14, label: 'країн, де працює метод' },
];

export function Proof() {
  return (
    <section className="proof">
      <div className="wrap">
        <FadeIn><Eyebrow>Доказ · кейс з CRM, ERP і GA4</Eyebrow></FadeIn>
        <FadeIn delay={0.05}><h2 className="proof-h">Спочатку — <span className="mk">що це дає</span>.</h2></FadeIn>
        <div className="proof-grid">
          <FadeIn delay={0.1} className="proof-chart"><GrowthChart /></FadeIn>
          <div className="proof-stats">
            {PROOF_STATS.map((s, i) => (
              <FadeIn key={i} delay={0.15 + i * 0.08}>
                <Stat count={s.count} dp={s.dp} prefix={s.prefix} suffix={s.suffix} label={s.label} />
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
