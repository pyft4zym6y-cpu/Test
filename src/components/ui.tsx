import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { motion, useInView } from 'framer-motion';

/* ---------- Eyebrow: green dot + mono uppercase label ---------- */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="eyebrow-dot" />
      <span className="font-mono text-[0.7rem] sm:text-xs uppercase tracking-[0.22em] text-[#8C96A5]">
        {children}
      </span>
    </div>
  );
}

/* ---------- Section title ---------- */
export function SectionTitle({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-extrabold leading-[1.05] tracking-tight ${className}`}
      style={{ fontSize: 'clamp(1.9rem, 4.6vw, 3.4rem)', textWrap: 'balance' }}
    >
      {children}
    </h2>
  );
}

/* ---------- CountUp: animated number on scroll into view ---------- */
export function CountUp({
  to,
  prefix = '',
  suffix = '',
  duration = 1.4,
  className = '',
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}
      {value.toLocaleString('uk-UA')}
      {suffix}
    </span>
  );
}

/* ---------- Stat card (deck style: big colored number + mono caption) ---------- */
export function Stat({
  value,
  label,
  color = 'var(--lime)',
  countTo,
  prefix,
  suffix,
}: {
  value?: string;
  label: string;
  color?: string;
  countTo?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="card card-hover px-5 py-4">
      <div className="font-mono font-bold text-3xl md:text-4xl leading-none" style={{ color }}>
        {countTo !== undefined ? (
          <CountUp to={countTo} prefix={prefix} suffix={suffix} />
        ) : (
          value
        )}
      </div>
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[#8C96A5] mt-2 leading-relaxed">
        {label}
      </div>
    </div>
  );
}

/* ---------- Animated horizontal bar ---------- */
export function Bar({
  percent,
  gradient = 'linear-gradient(90deg, #A3E635, #3DDAD0)',
  height = 8,
  delay = 0,
}: {
  percent: number;
  gradient?: string;
  height?: number;
  delay?: number;
}) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height, background: 'rgba(140,150,165,0.12)' }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: gradient }}
        initial={{ width: 0 }}
        whileInView={{ width: `${percent}%` }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 1.1, delay, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </div>
  );
}

/* ---------- Chip ---------- */
export function Chip({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      className="card inline-flex items-center px-4 py-2 font-mono text-xs sm:text-sm text-[#C7CFDA] whitespace-nowrap"
      style={style}
    >
      {children}
    </span>
  );
}

/* ---------- Terminal window (deck's product screens) ---------- */
export function Terminal({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#232933] bg-[#171B22]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#F5B84B]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" />
        <span className="font-mono text-[0.68rem] text-[#8C96A5] ml-2 truncate">
          {title}
          <span className="cursor-blink text-[#A3E635]">▊</span>
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ---------- Section wrapper ---------- */
export function Section({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative px-5 sm:px-8 md:px-12 py-20 md:py-28 ${className}`}>
      <div className="relative max-w-6xl mx-auto">{children}</div>
    </section>
  );
}
