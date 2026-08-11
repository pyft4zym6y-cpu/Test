/**
 * Иммерсивный набор motion-примитивов weexp.
 * Всё построено на framer-motion: scroll-driven параллакс, кинетическая
 * типографика (маска-ревил построчно), магнитные кнопки, счётчики с count-up,
 * прогресс-бар прокрутки. Уважает prefers-reduced-motion.
 */
import {
  useRef,
  useState,
  useEffect,
  type ReactNode,
  type ElementType,
  type CSSProperties,
} from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────
   ПРОГРЕСС-БАР ПРОКРУТКИ — тонкая acid-линия сверху
   ───────────────────────────────────────────────────────── */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60]"
    >
      <div className="w-full h-full bg-[var(--acid)]" />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   КИНЕТИЧЕСКИЙ ЗАГОЛОВОК — построчный ревил из-под маски
   Разбивает children (строки как массив) и поднимает каждую
   строку из-за clip-маски при въезде в вьюпорт.
   ───────────────────────────────────────────────────────── */
export function LineReveal({
  lines,
  className,
  style,
  stagger = 0.09,
  as = 'h2',
}: {
  lines: ReactNode[];
  className?: string;
  style?: CSSProperties;
  stagger?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-12% 0px' });
  const reduce = useReducedMotion();
  const Tag = motion.create(as);

  return (
    <Tag ref={ref} className={className} style={style}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden" style={{ paddingBottom: '0.06em' }}>
          <motion.span
            className="block"
            initial={reduce ? { y: 0 } : { y: '110%' }}
            animate={inView ? { y: 0 } : {}}
            transition={{ duration: 0.9, ease: EASE, delay: i * stagger }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────
   ГЕНЕРИЧНЫЙ РЕВИЛ — плавный подъём блока при въезде
   ───────────────────────────────────────────────────────── */
export function Rise({
  children,
  delay = 0,
  y = 40,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: ElementType;
}) {
  const reduce = useReducedMotion();
  const Tag = motion.create(as);
  return (
    <Tag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.85, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────
   СЧЁТЧИК COUNT-UP — анимирует число при въезде
   Поддерживает префикс/суффикс и дробную часть.
   ───────────────────────────────────────────────────────── */
export function CountUp({
  to,
  from = 0,
  duration = 1.8,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(reduce ? to : from);

  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setVal(to);
      return;
    }
    let raf = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to, from, duration]);

  const formatted = val.toLocaleString('uk-UA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   МАГНИТНАЯ ОБЁРТКА — притягивает элемент к курсору
   ───────────────────────────────────────────────────────── */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const reduce = useReducedMotion();

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    setPos({ x, y });
  };
  const reset = () => setPos({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={reset}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, mass: 0.4 }}
      style={{ display: 'inline-block' }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   ПАРАЛЛАКС — сдвигает контент относительно прокрутки
   Возвращает MotionValue для style={{ y }}.
   ───────────────────────────────────────────────────────── */
export function useParallax(
  target: React.RefObject<HTMLElement>,
  distance = 120,
): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target, offset: ['start end', 'end start'] });
  return useTransform(scrollYProgress, [0, 1], [distance, -distance]);
}

/* хук: логировать событие при первом появлении секции (analytics scroll-depth) */
export function useSectionView(ref: React.RefObject<HTMLElement>, onSeen: () => void) {
  const inView = useInView(ref, { once: true, margin: '-30% 0px' });
  useMotionValueEvent(useScroll().scrollY, 'change', () => {});
  useEffect(() => {
    if (inView) onSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);
}
