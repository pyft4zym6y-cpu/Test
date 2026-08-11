/**
 * Кастомный курсор в стиле award-сайтов: точка + отстающее кольцо на
 * mix-blend-mode: difference. Кольцо расширяется над интерактивными
 * элементами ([data-cursor], a, button). Отключается на тач-устройствах и
 * при prefers-reduced-motion.
 */
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 26, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 260, damping: 26, mass: 0.5 });

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;
    setEnabled(true);

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = e.target as HTMLElement;
      setActive(!!el.closest('a, button, [data-cursor]'));
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="hidden md:block" style={{ mixBlendMode: 'difference' }}>
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[70]"
        style={{
          x,
          y,
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
          background: '#fff',
        }}
      />
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[70] border border-white"
        style={{ x: ringX, y: ringY }}
        animate={{ width: active ? 56 : 30, height: active ? 56 : 30, marginLeft: active ? -28 : -15, marginTop: active ? -28 : -15, opacity: active ? 0.9 : 0.5 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      />
    </div>
  );
}
