import { useEffect, useRef, useState } from 'react';
import { IDLE_PHRASE } from './speech';

/**
 * Original flat-illustration "digital girl" for the white theme:
 * left half — human, right half dissolves into data pixels.
 * Eyes follow the cursor, the whole figure gently tilts, and a
 * terminal-style bubble types out lines dispatched via speech.ts.
 */
export default function HeroGirl() {
  const rootRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const [phrase, setPhrase] = useState(IDLE_PHRASE);
  const [typed, setTyped] = useState('');

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

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let tx = 0, ty = 0, rot = 0;
    let gx = 0, gy = 0, grot = 0;

    const onMove = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.4;
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width * 1.1)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height * 1.1)));
      grot = dx * 4;
      gx = dx * 10;
      gy = dy * 6;
    };

    const tick = () => {
      tx += (gx - tx) * 0.08;
      ty += (gy - ty) * 0.08;
      rot += (grot - rot) * 0.08;
      groupRef.current?.setAttribute(
        'transform',
        `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${rot.toFixed(2)} 240 300)`,
      );
      eyesRef.current?.setAttribute(
        'transform',
        `translate(${(tx * 0.45).toFixed(2)} ${(ty * 0.6).toFixed(2)})`,
      );
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
    <div ref={rootRef} className="relative select-none">
      {/* Speech bubble — in normal flow above the artwork, so nothing overlaps */}
      <div className="card p-4 mb-5 bg-white/95" style={{ borderColor: 'rgba(101,163,13,0.45)' }}>
        <p className="font-pixel text-[0.5rem] text-[#65A30D] mb-2">WEEXP·OS · ONLINE</p>
        <p className="font-mono text-[0.72rem] leading-relaxed text-[#12161C] min-h-[3.6em]">
          {typed}
          <span className="cursor-blink text-[#65A30D]">▊</span>
        </p>
      </div>

      <svg viewBox="0 0 480 560" className="w-full girl-float pointer-events-none" aria-label="WEEXP·OS — цифрова асистентка">
        <defs>
          <clipPath id="hg-face">
            <path d="M 168 208 Q 168 128 240 128 Q 312 128 312 208 L 312 268 Q 312 336 240 336 Q 168 336 168 268 Z" />
          </clipPath>
        </defs>

        {/* soft backdrop */}
        <circle cx="240" cy="300" r="205" fill="#F4F6F2" />
        <circle cx="240" cy="300" r="205" fill="none" stroke="rgba(10,14,18,0.08)" />

        <g ref={groupRef}>
          {/* hair back mass */}
          <path
            d="M 150 250 Q 142 120 240 112 Q 338 120 330 250 L 336 420 Q 300 452 240 452 Q 180 452 144 420 Z"
            fill="#1C222B"
          />
          {/* neck + shoulders */}
          <path d="M 214 330 L 214 392 Q 240 404 266 392 L 266 330 Z" fill="#EAD9CC" />
          <path d="M 214 356 Q 240 368 266 356 L 266 368 Q 240 380 214 368 Z" fill="#DCC6B4" opacity="0.7" />
          <path
            d="M 120 560 Q 122 470 190 452 Q 240 476 290 452 Q 358 470 360 560 Z"
            fill="#F1F3F0"
            stroke="rgba(10,14,18,0.12)"
          />
          {/* collar seam */}
          <path d="M 176 490 Q 240 520 304 490" fill="none" stroke="#65A30D" strokeWidth="3" />

          {/* face */}
          <path
            d="M 168 208 Q 168 128 240 128 Q 312 128 312 208 L 312 268 Q 312 336 240 336 Q 168 336 168 268 Z"
            fill="#F3E3D5"
          />
          {/* face shading on the right (digital side) */}
          <g clipPath="url(#hg-face)">
            <rect x="240" y="120" width="80" height="224" fill="#EAD5C2" opacity="0.55" />
            {/* pixel dissolve on the right half of the face */}
            <g fill="#12161C">
              <rect className="px-flicker" x="286" y="176" width="9" height="9" />
              <rect x="298" y="188" width="7" height="7" opacity="0.75" />
              <rect className="px-flicker-2" x="290" y="204" width="11" height="11" />
              <rect x="302" y="220" width="7" height="7" opacity="0.55" />
              <rect className="px-flicker" x="292" y="240" width="8" height="8" opacity="0.85" />
              <rect x="284" y="258" width="6" height="6" opacity="0.6" />
              <rect className="px-flicker-2" x="296" y="274" width="10" height="10" />
              <rect x="286" y="296" width="7" height="7" opacity="0.7" />
            </g>
            <g fill="#EA580C">
              <rect className="px-flicker-2" x="276" y="188" width="6" height="6" />
              <rect x="280" y="230" width="5" height="5" opacity="0.8" />
              <rect className="px-flicker" x="274" y="286" width="6" height="6" />
            </g>
            <g fill="#0F9488">
              <rect x="304" y="200" width="5" height="5" />
              <rect className="px-flicker" x="306" y="252" width="6" height="6" />
            </g>
            {/* scan lines */}
            <line x1="252" y1="150" x2="316" y2="150" stroke="rgba(10,14,18,0.25)" strokeDasharray="3 5" />
            <line x1="258" y1="316" x2="316" y2="316" stroke="rgba(10,14,18,0.2)" strokeDasharray="3 5" />
          </g>

          {/* hair front strands */}
          <path d="M 168 232 Q 160 150 214 132 Q 178 168 180 240 Q 172 252 168 232 Z" fill="#1C222B" />
          <path d="M 312 232 Q 320 150 266 132 Q 302 168 300 240 Q 308 252 312 232 Z" fill="#1C222B" />
          <path d="M 196 132 Q 240 108 284 132 Q 240 122 196 132 Z" fill="#1C222B" />

          {/* brows */}
          <path d="M 188 216 Q 204 208 220 214" fill="none" stroke="#2A313B" strokeWidth="4" strokeLinecap="round" />
          <path d="M 260 214 Q 276 208 292 216" fill="none" stroke="#2A313B" strokeWidth="4" strokeLinecap="round" />

          {/* eyes: sclera + tracking iris, blinking lids */}
          <g className="girl-lids">
            <g>
              <ellipse cx="205" cy="238" rx="17" ry="11" fill="#FFFFFF" stroke="rgba(10,14,18,0.35)" />
              <ellipse cx="275" cy="238" rx="17" ry="11" fill="#FFFFFF" stroke="rgba(10,14,18,0.35)" />
            </g>
            <g ref={eyesRef}>
              <circle cx="205" cy="238" r="6.5" fill="#20262E" />
              <circle cx="275" cy="238" r="6.5" fill="#20262E" />
              <circle cx="207" cy="236" r="2" fill="#FFFFFF" />
              <circle cx="277" cy="236" r="2" fill="#FFFFFF" />
              <circle cx="203" cy="240" r="1.4" fill="#65A30D" />
              <circle cx="273" cy="240" r="1.4" fill="#65A30D" />
            </g>
          </g>
          {/* lashes */}
          <path d="M 188 232 Q 205 222 222 232" fill="none" stroke="#12161C" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 258 232 Q 275 222 292 232" fill="none" stroke="#12161C" strokeWidth="2.5" strokeLinecap="round" />

          {/* nose + lips */}
          <path d="M 240 244 L 236 272 Q 240 276 246 272" fill="none" stroke="#D9BFA9" strokeWidth="3" strokeLinecap="round" />
          <path d="M 224 298 Q 240 308 256 298 Q 240 316 224 298 Z" fill="#C2655E" />
          <path d="M 226 297 Q 240 291 254 297" fill="none" stroke="#A54F49" strokeWidth="2" strokeLinecap="round" />

          {/* blush */}
          <ellipse cx="188" cy="272" rx="9" ry="5" fill="#E8B29B" opacity="0.5" />

          {/* earring — lime node */}
          <line x1="168" y1="262" x2="164" y2="282" stroke="rgba(10,14,18,0.4)" />
          <circle cx="164" cy="288" r="5" fill="#A3E635" stroke="#65A30D" className="node-pulse" />

          {/* data callouts near the digital side */}
          <g className="font-mono" fill="#66707E" fontSize="10">
            <text x="332" y="180">CR 4,2%</text>
            <text x="338" y="248">LTV:CAC ≥3</text>
            <text x="334" y="312">ROI 3.8×</text>
          </g>
          <line x1="316" y1="176" x2="328" y2="176" stroke="rgba(10,14,18,0.3)" />
          <line x1="318" y1="244" x2="334" y2="244" stroke="rgba(10,14,18,0.3)" />
          <line x1="316" y1="308" x2="330" y2="308" stroke="rgba(10,14,18,0.3)" />

          {/* scan frame corners */}
          <path d="M 140 148 L 140 128 L 160 128" fill="none" stroke="#65A30D" strokeWidth="2.5" />
          <path d="M 340 452 L 340 472 L 320 472" fill="none" stroke="#65A30D" strokeWidth="2.5" />
        </g>
      </svg>
    </div>
  );
}
