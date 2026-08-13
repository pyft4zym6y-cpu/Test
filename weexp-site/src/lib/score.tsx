import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Independence Score — сквозная механика сайта. Единый источник правды: глобальный
 * прогресс скролла 0..1 → Score 0..100. Пишет CSS-переменную --p (мир ink→emerald,
 * без ре-рендеров) и отдаёт целочисленный Score через контекст (ре-рендер ≤100 раз).
 */
type ScoreState = { progress: number; score: number };
const Ctx = createContext<ScoreState>({ progress: 0, score: 0 });
export const useScore = () => useContext(Ctx);

export function ScoreProvider({ children }: { children: ReactNode }) {
  const [score, setScore] = useState(0);
  const last = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.setProperty('--p', p.toFixed(4));
      const s = Math.round(p * 100);
      if (s !== last.current) { last.current = s; setScore(s); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <Ctx.Provider value={{ progress: score / 100, score }}>{children}</Ctx.Provider>;
}
