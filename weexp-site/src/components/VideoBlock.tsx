import { useEffect, useRef } from 'react';
import './video-block.css';

/**
 * Промо-відео для категорій. За замовчуванням — брендовий motion-graphics рил
 * (згенерований, /promo/reel.webm), який автогра́є в межах екрана (muted/loop).
 * Постер — реальний кадр рилу; на браузерах без webm лишається постер (graceful).
 * Можна передати власний `src`/`poster` під конкретну категорію.
 */
export function VideoBlock({ title, sub, src = '/promo/reel.mp4', poster = '/promo/reel-poster.jpg' }:
  { title: string; sub?: string; src?: string; poster?: string }) {
  const vref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = vref.current; if (!v) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div className="vb" data-say={`${title} — дивіться промо.`}>
      <video ref={vref} className="vb-video" src={src} poster={poster}
        muted loop playsInline preload="metadata" aria-label={title} />
      <span className="vb-scrim" aria-hidden="true" />
      <span className="vb-tag mono">Промо · WEEXP</span>
      <span className="vb-meta">
        <span className="vb-title">{title}</span>
        {sub && <span className="vb-sub mono">{sub}</span>}
      </span>
    </div>
  );
}
