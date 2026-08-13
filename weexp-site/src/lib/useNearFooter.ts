import { useEffect, useState } from 'react';

/** true, когда футер в зоне видимости — чтобы спрятать фикс-оверлеи (Score HUD / Agent). */
export function useNearFooter() {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = document.getElementById('site-footer');
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '0px 0px -20% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return near;
}
