import type { ReactNode } from 'react';
import { motion } from 'motion/react';

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
    <section id={id} className={`w-full px-6 py-24 md:py-32 ${className}`}>
      <div className="max-w-[1100px] mx-auto">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[#FF0000] text-[12px] uppercase tracking-[0.3em] mb-4">{children}</p>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-italiana text-4xl md:text-6xl leading-tight mb-6">{children}</h2>
  );
}

export function FadeIn({
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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
