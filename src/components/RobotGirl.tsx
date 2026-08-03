import { useEffect, useRef, useState } from 'react';

export const IDLE_PHRASE = 'Привіт! Я — ОС цієї компанії. Наведи на меню — підкажу, куди тобі →';

/** Dispatch helpers: any element can make the robot "speak". */
export function say(text: string) {
  window.dispatchEvent(new CustomEvent('weexp-say', { detail: { text } }));
}
export function sayIdle() {
  window.dispatchEvent(new CustomEvent('weexp-idle'));
}

export default function RobotGirl() {
  const rootRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const [phrase, setPhrase] = useState(IDLE_PHRASE);
  const [typed, setTyped] = useState('');
  const speaking = typed.length < phrase.length;

  /* ---- Speech events ---- */
  useEffect(() => {
    const onSay = (e: Event) => {
      const text = (e as CustomEvent).detail?.text;
      if (typeof text === 'string') setPhrase(text);
    };
    const onIdle = () => setPhrase(IDLE_PHRASE);
    window.addEventListener('weexp-say', onSay);
    window.addEventListener('weexp-idle', onIdle);
    return () => {
      window.removeEventListener('weexp-say', onSay);
      window.removeEventListener('weexp-idle', onIdle);
    };
  }, []);

  /* ---- Typewriter ---- */
  useEffect(() => {
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(phrase.slice(0, i));
      if (i >= phrase.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [phrase]);

  /* ---- Cursor tracking: head turns, eyes follow ---- */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let tx = 0, ty = 0, rot = 0; // current
    let gx = 0, gy = 0, grot = 0; // goal

    const onMove = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.35; // head area
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width * 0.9)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height * 0.9)));
      grot = dx * 10;
      gx = dx * 12;
      gy = dy * 8;
    };

    const tick = () => {
      tx += (gx - tx) * 0.1;
      ty += (gy - ty) * 0.1;
      rot += (grot - rot) * 0.1;
      if (headRef.current) {
        headRef.current.setAttribute(
          'transform',
          `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${rot.toFixed(2)} 200 380)`,
        );
      }
      if (eyesRef.current) {
        eyesRef.current.setAttribute(
          'transform',
          `translate(${(tx * 0.6).toFixed(2)} ${(ty * 0.7).toFixed(2)})`,
        );
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative select-none pointer-events-none">
      {/* Speech bubble */}
      <div className="absolute -top-6 right-[68%] w-[240px] sm:w-[270px] pointer-events-none">
        <div className="card p-4 bg-black/85 backdrop-blur-sm" style={{ borderColor: 'rgba(163,230,53,0.35)' }}>
          <p className="font-pixel text-[0.5rem] text-[#A3E635] mb-2">WEEXP·OS · ONLINE</p>
          <p className="font-mono text-[0.72rem] leading-relaxed text-[#E9EDF2] min-h-[3.6em]">
            {typed}
            <span className="cursor-blink text-[#A3E635]">▊</span>
          </p>
        </div>
        {/* bubble tail */}
        <div
          className="absolute top-8 -right-2 w-3 h-3 rotate-45 bg-black/85"
          style={{ borderTop: '1px solid rgba(163,230,53,0.35)', borderRight: '1px solid rgba(163,230,53,0.35)' }}
        />
      </div>

      <svg viewBox="0 0 400 560" className="w-full h-full robot-float" aria-label="WEEXP·OS — андроїд-асистент">
        <defs>
          <filter id="rg-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="rg-panel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14181F" />
            <stop offset="100%" stopColor="#0B0D10" />
          </linearGradient>
        </defs>

        {/* ---- Torso / shoulders ---- */}
        <g>
          <path
            d="M 70 560 L 70 505 Q 70 445 135 438 L 265 438 Q 330 445 330 505 L 330 560 Z"
            fill="url(#rg-panel)"
            stroke="rgba(255,255,255,0.12)"
          />
          {/* collar seam */}
          <path d="M 120 470 Q 200 500 280 470" fill="none" stroke="rgba(163,230,53,0.55)" strokeWidth="2" filter="url(#rg-glow)" />
          {/* chest core */}
          <circle cx="200" cy="512" r="10" fill="#0B0D10" stroke="rgba(61,218,208,0.6)" strokeWidth="2" />
          <circle cx="200" cy="512" r="3.5" fill="#3DDAD0" filter="url(#rg-glow)" className="node-pulse" />
          {/* shoulder pads */}
          <rect x="52" y="470" width="46" height="64" rx="20" fill="url(#rg-panel)" stroke="rgba(255,255,255,0.12)" />
          <rect x="302" y="470" width="46" height="64" rx="20" fill="url(#rg-panel)" stroke="rgba(255,255,255,0.12)" />
          <line x1="75" y1="486" x2="75" y2="518" stroke="rgba(163,230,53,0.5)" strokeWidth="2" />
          <line x1="325" y1="486" x2="325" y2="518" stroke="rgba(163,230,53,0.5)" strokeWidth="2" />
        </g>

        {/* ---- Neck ---- */}
        <g>
          <rect x="182" y="368" width="36" height="80" rx="14" fill="url(#rg-panel)" stroke="rgba(255,255,255,0.12)" />
          <line x1="185" y1="404" x2="215" y2="404" stroke="rgba(255,255,255,0.18)" />
          <line x1="185" y1="420" x2="215" y2="420" stroke="rgba(255,255,255,0.18)" />
        </g>

        {/* ---- Head (turns toward cursor) ---- */}
        <g ref={headRef}>
          {/* hair — back helmet */}
          <path
            d="M 100 250 Q 100 108 200 108 Q 300 108 300 250 L 300 330 Q 300 372 262 372 L 138 372 Q 100 372 100 330 Z"
            fill="#0B0D10"
            stroke="rgba(255,255,255,0.1)"
          />
          {/* side hair panels */}
          <rect x="88" y="196" width="34" height="180" rx="17" fill="url(#rg-panel)" stroke="rgba(255,255,255,0.12)" />
          <rect x="278" y="196" width="34" height="180" rx="17" fill="url(#rg-panel)" stroke="rgba(255,255,255,0.12)" />
          <line x1="105" y1="216" x2="105" y2="356" stroke="rgba(61,218,208,0.45)" strokeWidth="2" />
          <line x1="295" y1="216" x2="295" y2="356" stroke="rgba(61,218,208,0.45)" strokeWidth="2" />

          {/* antenna */}
          <line x1="200" y1="112" x2="200" y2="76" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
          <circle cx="200" cy="68" r="6" fill="#A3E635" filter="url(#rg-glow)" className="node-pulse" />

          {/* face plate */}
          <path
            d="M 126 230 Q 126 140 200 140 Q 274 140 274 230 L 274 296 Q 274 352 200 352 Q 126 352 126 296 Z"
            fill="url(#rg-panel)"
            stroke="rgba(255,255,255,0.14)"
          />
          {/* forehead visor line */}
          <path d="M 142 190 L 258 190" stroke="rgba(255,255,255,0.14)" />
          <rect x="188" y="184" width="24" height="4" rx="2" fill="rgba(163,230,53,0.7)" filter="url(#rg-glow)" />

          {/* ear pods */}
          <circle cx="112" cy="272" r="17" fill="#0B0D10" stroke="rgba(255,255,255,0.16)" />
          <circle cx="112" cy="272" r="5" fill="none" stroke="rgba(163,230,53,0.7)" strokeWidth="2" />
          <circle cx="288" cy="272" r="17" fill="#0B0D10" stroke="rgba(255,255,255,0.16)" />
          <circle cx="288" cy="272" r="5" fill="none" stroke="rgba(163,230,53,0.7)" strokeWidth="2" />

          {/* eyes (follow cursor + blink) */}
          <g className="rg-lids">
            <g ref={eyesRef}>
              <rect x="148" y="238" width="38" height="20" rx="10" fill="#05070A" stroke="rgba(163,230,53,0.35)" />
              <rect x="214" y="238" width="38" height="20" rx="10" fill="#05070A" stroke="rgba(163,230,53,0.35)" />
              <circle cx="167" cy="248" r="6" fill="#A3E635" filter="url(#rg-glow)" />
              <circle cx="233" cy="248" r="6" fill="#A3E635" filter="url(#rg-glow)" />
              <circle cx="169" cy="246" r="2" fill="#E9FFC2" />
              <circle cx="235" cy="246" r="2" fill="#E9FFC2" />
            </g>
          </g>
          {/* brows */}
          <line x1="148" y1="226" x2="184" y2="222" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" />
          <line x1="216" y1="222" x2="252" y2="226" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" />
          {/* cheek lights */}
          <circle cx="140" cy="292" r="3" fill="rgba(61,218,208,0.7)" filter="url(#rg-glow)" />
          <circle cx="260" cy="292" r="3" fill="rgba(61,218,208,0.7)" filter="url(#rg-glow)" />

          {/* mouth: equalizer bars while speaking, calm line otherwise */}
          {speaking ? (
            <g fill="#A3E635" filter="url(#rg-glow)">
              <rect className="rg-bar rg-bar-1" x="186" y="312" width="5" height="10" rx="2.5" />
              <rect className="rg-bar rg-bar-2" x="197" y="309" width="5" height="16" rx="2.5" />
              <rect className="rg-bar rg-bar-3" x="208" y="312" width="5" height="10" rx="2.5" />
            </g>
          ) : (
            <rect x="186" y="315" width="28" height="4" rx="2" fill="rgba(163,230,53,0.8)" filter="url(#rg-glow)" />
          )}
          {/* chin seam */}
          <path d="M 178 336 Q 200 344 222 336" fill="none" stroke="rgba(255,255,255,0.14)" />
        </g>
      </svg>
    </div>
  );
}
