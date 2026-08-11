/**
 * Интро-ревил: тёмная штора со счётчиком 00→100 и логотипом, затем
 * уезжает вверх, открывая героя. Задаёт «премиальный иммерсивный» тон
 * с первой секунды. Мгновенно исчезает при prefers-reduced-motion.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Preloader() {
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDone(true);
      return;
    }
    let raf = 0;
    let start = 0;
    const DUR = 1400;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / DUR, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(step);
      else setTimeout(() => setDone(true), 260);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] bg-[#0A0B0D] flex items-end justify-between px-6 md:px-12 pb-10"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.span
            className="font-grotesk font-bold uppercase tracking-tight text-[#F3F5F7]"
            style={{ fontSize: 'clamp(2.5rem, 9vw, 7rem)', lineHeight: 1 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            weexp<span className="acid">.</span>
          </motion.span>
          <span
            className="font-grotesk font-bold text-[#3A3F47] tabular-nums"
            style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)', lineHeight: 1 }}
          >
            {String(count).padStart(3, '0')}
          </span>
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-[var(--acid)]"
            initial={{ width: '0%' }}
            animate={{ width: `${count}%` }}
            transition={{ ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
