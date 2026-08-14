import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

/* ---------- анімація появи ---------- */

export function Pop({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, rotate: -0.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1.2, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- типографіка ---------- */

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-block comic-border bg-white px-3 py-1 text-[12px] font-extrabold uppercase tracking-[0.2em] hard-shadow-sm mb-6 -rotate-1">
      {children}
    </div>
  );
}

export function H1({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={`font-oswald font-bold uppercase leading-[0.98] text-[clamp(42px,7.5vw,96px)] tracking-tight ${className}`}
      style={{ textWrap: 'balance' } as CSSProperties}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`font-oswald font-bold uppercase leading-[1.02] text-[clamp(30px,4.5vw,56px)] tracking-tight mb-6 ${className}`}
      style={{ textWrap: 'balance' } as CSSProperties}
    >
      {children}
    </h2>
  );
}

export function Hand({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-caveat font-bold text-[1.6em] leading-none ${className}`}>
      {children}
    </span>
  );
}

/* ---------- кнопки ---------- */

const btnBase =
  'inline-block comic-border font-extrabold uppercase tracking-wider text-[14px] px-7 py-4 transition-transform duration-150 hover:-translate-y-1 hover:rotate-[-1deg] active:translate-y-0';

export function ComicButton({
  to,
  children,
  variant = 'red',
  className = '',
}: {
  to: string;
  children: ReactNode;
  variant?: 'red' | 'ink' | 'white';
  className?: string;
}) {
  const skin =
    variant === 'red'
      ? 'bg-brand text-white hard-shadow-sm'
      : variant === 'ink'
        ? 'bg-ink text-white hard-shadow-red'
        : 'bg-white text-ink hard-shadow-sm';
  return (
    <Link to={to} className={`${btnBase} ${skin} ${className}`}>
      {children}
    </Link>
  );
}

/* ---------- елементи коміксу ---------- */

export function Bubble({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bubble px-6 py-4 ${className}`}>{children}</div>;
}

// зірковий "вибух" зі шаром тексту
export function Burst({
  children,
  className = '',
  color = 'var(--color-sun)',
  rotate = -8,
  size = 128,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  rotate?: number;
  size?: number;
}) {
  const points = 14;
  const outer = 50;
  const inner = 38;
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
  }
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <polygon points={pts.join(' ')} fill={color} stroke="#111" strokeWidth="2.5" />
      </svg>
      <span className="relative font-oswald font-bold uppercase text-center leading-none text-[0.8rem] px-4">
        {children}
      </span>
    </div>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden bg-ink text-white border-y-[3px] border-ink py-3 select-none">
      <div className="marquee-track">
        {row.map((t, i) => (
          <span
            key={i}
            className="font-oswald font-semibold uppercase tracking-[0.15em] text-[15px] whitespace-nowrap px-6 flex items-center gap-6"
          >
            {t} <span className="text-brand text-xl leading-none">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- каркас сторінки ---------- */

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
    <section id={id} className={`w-full px-6 py-20 md:py-28 ${className}`}>
      <div className="max-w-[1150px] mx-auto">{children}</div>
    </section>
  );
}

export function PageHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <Section className="halftone !pb-10 md:!pb-14 pt-28 md:pt-36">
      <Pop>
        <Eyebrow>{eyebrow}</Eyebrow>
        <H1 className="mb-6">{title}</H1>
        {lead && <p className="max-w-2xl text-[17px] leading-relaxed font-semibold">{lead}</p>}
      </Pop>
    </Section>
  );
}
