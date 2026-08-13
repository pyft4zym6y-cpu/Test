import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './curtain.css';

/**
 * Перехід між сторінками: на кожній зміні маршруту панель швидко «зачиняється»
 * знизу вгору й одразу піднімається, відкриваючи нову сторінку. Кіно-відчуття
 * замість різкої підміни. Вимкнено за reduced-motion.
 */
export function PageCurtain() {
  const { pathname } = useLocation();
  const [reduce, setReduce] = useState(true);
  useEffect(() => { setReduce(matchMedia('(prefers-reduced-motion:reduce)').matches); }, []);
  if (reduce) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={pathname}
        className="curtain"
        aria-hidden="true"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        style={{ transformOrigin: 'top' }}
      >
        <span className="curtain-mark mono">WEEXP</span>
      </motion.div>
    </AnimatePresence>
  );
}
