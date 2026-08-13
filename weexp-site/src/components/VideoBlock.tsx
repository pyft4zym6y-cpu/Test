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

  // Заголовок винесено ПІД відео (у самому ролику вже є текст — оверлей зливався).
  return (
    <figure className="vb-fig">
      <div className="vb" data-parallax="0.05" data-say={`${title} — дивіться промо.`}>
        <video ref={vref} className="vb-video" src={src} poster={poster}
          muted loop playsInline preload="metadata" aria-label={title} />
        <span className="vb-tag mono">Промо · WEEXP</span>
      </div>
      <figcaption className="vb-cap">
        <span className="vb-cap-t">{title}</span>
        {sub && <span className="vb-cap-s mono">{sub}</span>}
      </figcaption>
    </figure>
  );
}
