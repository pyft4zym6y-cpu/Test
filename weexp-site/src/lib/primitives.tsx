import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Переосмысленный кит старого сайта (FadeIn/CountUp/Bar/Eyebrow/Stat) в новом бренде. */
const EASE = [0.22, 1, 0.36, 1] as const;

export function FadeIn({ children, delay = 0, y = 26, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow"><span className="eb-mark" />{children}</div>;
}

/** Число 0→to при попадании в зону (rAF, ease-out, uk-UA, tabular). */
export function CountUp({ to, dp = 0, prefix = '', suffix = '' }: { to: number; dp?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return; }
    let raf = 0; const t0 = performance.now(), dur = 1200;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3);
      setV(to * e); if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref} className="tnum">{prefix}{v.toLocaleString('uk-UA', { minimumFractionDigits: dp, maximumFractionDigits: dp })}{suffix}</span>;
}

export function Stat({ value, label, count, dp, prefix, suffix }: { value?: string; label: string; count?: number; dp?: number; prefix?: string; suffix?: string }) {
  return (
    <div className="stat">
      <div className="stat-v">{count != null ? <CountUp to={count} dp={dp} prefix={prefix} suffix={suffix} /> : value}</div>
      <div className="stat-l mono">{label}</div>
    </div>
  );
}

/** Полоса 0→percent% при въезде в зону. */
export function Bar({ percent, label, value, delay = 0 }: { percent: number; label: string; value?: string; delay?: number }) {
  return (
    <div className="bar-row">
      <div className="bar-head"><span className="mono">{label}</span>{value && <span className="mono bar-val">{value}</span>}</div>
      <div className="bar-track">
        <motion.span className="bar-fill"
          initial={{ width: 0 }} whileInView={{ width: `${Math.min(100, percent)}%` }}
          viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.9, delay, ease: EASE }} />
      </div>
    </div>
  );
}
