import { useRef, useState } from 'react';
import './video-block.css';

/**
 * Промо-відео для категорій. Готовий слот під реальне відео (`src`); поки його немає —
 * брендовий анімований постер із кнопкою play. Коли зʼявиться промо — просто передати src.
 */
export function VideoBlock({ title, sub, src, poster }:
  { title: string; sub?: string; src?: string; poster?: string }) {
  const [playing, setPlaying] = useState(false);
  const vref = useRef<HTMLVideoElement>(null);

  const play = () => {
    if (!src) return;
    setPlaying(true);
    requestAnimationFrame(() => vref.current?.play().catch(() => {}));
  };

  return (
    <div className={`vb${playing ? ' is-playing' : ''}`} data-say={`${title} — дивіться промо.`}>
      {src && (
        <video ref={vref} className="vb-video" src={src} poster={poster} playsInline muted loop
          controls={playing} preload="none" />
      )}
      {!playing && (
        <button className="vb-poster" type="button" onClick={play} aria-label={src ? `Відтворити: ${title}` : title}>
          <span className="vb-grid" aria-hidden="true" />
          <span className="vb-scan" aria-hidden="true" />
          <span className="vb-tag mono">Промо · WEEXP</span>
          <span className="vb-play" aria-hidden="true"><i /></span>
          <span className="vb-meta">
            <span className="vb-title">{title}</span>
            {sub && <span className="vb-sub mono">{sub}</span>}
          </span>
          {!src && <span className="vb-soon mono">відео незабаром</span>}
        </button>
      )}
    </div>
  );
}
