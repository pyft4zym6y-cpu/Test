import { useEffect, useRef } from 'react';

/**
 * 5 варіантів дизайну AI-асистента weexp. Усі — оригінальна векторна графіка:
 * монохром + лаймовий акцент, зіниці стежать за курсором, кліпають повіки.
 */
export default function AvatarBot({
  variant,
  size = 120,
  className = '',
}: {
  variant: 1 | 2 | 3 | 4 | 5;
  size?: number;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let x = 0, y = 0, gx = 0, gy = 0;
    const onMove = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      gx = Math.max(-1, Math.min(1, (e.clientX - cx) / 300)) * 3.5;
      gy = Math.max(-1, Math.min(1, (e.clientY - cy) / 300)) * 3;
    };
    const tick = () => {
      x += (gx - x) * 0.12;
      y += (gy - y) * 0.12;
      pupilsRef.current?.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const ink = '#12161C';
  const lime = '#FF3B30';
  const limeDark = '#B3111C';
  const panel = '#F1F3F0';

  return (
    <div ref={rootRef} className={className} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} aria-label="AI-асистент weexp">
        {variant === 1 && (
          /* ---- V1 · «Піксель» — 8-bit голова ---- */
          <g>
            <rect x="52" y="8" width="6" height="6" fill={limeDark} className="node-pulse" />
            <rect x="55" y="14" width="2" height="8" fill={ink} />
            <rect x="22" y="22" width="76" height="64" fill={ink} />
            <rect x="28" y="28" width="64" height="52" fill={panel} />
            <rect x="16" y="42" width="6" height="20" fill={ink} />
            <rect x="98" y="42" width="6" height="20" fill={ink} />
            <g className="girl-lids">
              <g ref={pupilsRef}>
                <rect x="40" y="44" width="10" height="10" fill={limeDark} />
                <rect x="70" y="44" width="10" height="10" fill={limeDark} />
              </g>
            </g>
            <rect x="44" y="66" width="32" height="4" fill={ink} />
            <rect x="44" y="70" width="4" height="4" fill={ink} />
            <rect x="72" y="70" width="4" height="4" fill={ink} />
            <rect x="34" y="92" width="52" height="14" fill={panel} stroke={ink} strokeWidth="2" />
            <rect x="40" y="97" width="8" height="4" fill={limeDark} />
            <rect x="52" y="97" width="8" height="4" fill={ink} opacity="0.4" />
            <rect x="64" y="97" width="8" height="4" fill={ink} opacity="0.4" />
          </g>
        )}

        {variant === 2 && (
          /* ---- V2 · «Орб» — дружнє ядро-сфера ---- */
          <g>
            <circle cx="60" cy="62" r="40" fill={panel} stroke={ink} strokeWidth="2.5" />
            <circle cx="60" cy="62" r="40" fill="none" stroke={limeDark} strokeWidth="2" strokeDasharray="6 10" className="spin-slow" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
            <ellipse cx="46" cy="50" rx="12" ry="8" fill="#FFFFFF" opacity="0.8" />
            <g className="girl-lids">
              <g>
                <ellipse cx="47" cy="60" rx="8" ry="9" fill="#FFFFFF" stroke={ink} strokeWidth="1.5" />
                <ellipse cx="73" cy="60" rx="8" ry="9" fill="#FFFFFF" stroke={ink} strokeWidth="1.5" />
              </g>
              <g ref={pupilsRef}>
                <circle cx="47" cy="61" r="3.6" fill={ink} />
                <circle cx="73" cy="61" r="3.6" fill={ink} />
                <circle cx="48.4" cy="59.6" r="1.2" fill={lime} />
                <circle cx="74.4" cy="59.6" r="1.2" fill={lime} />
              </g>
            </g>
            <path d="M 50 78 Q 60 86 70 78" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="60" cy="14" r="4" fill={lime} stroke={limeDark} className="node-pulse" />
            <line x1="60" y1="18" x2="60" y2="22" stroke={ink} strokeWidth="2" />
            <circle cx="24" cy="86" r="3" fill={limeDark} opacity="0.6" />
            <circle cx="98" cy="40" r="2.5" fill={limeDark} opacity="0.5" />
          </g>
        )}

        {variant === 3 && (
          /* ---- V3 · «Візор» — дроїд із суцільним екраном-візором ---- */
          <g>
            <rect x="24" y="24" width="72" height="66" rx="22" fill={ink} />
            <rect x="14" y="46" width="8" height="24" rx="4" fill={ink} />
            <rect x="98" y="46" width="8" height="24" rx="4" fill={ink} />
            <rect x="16.5" y="50" width="3" height="16" rx="1.5" fill={limeDark} />
            <rect x="100.5" y="50" width="3" height="16" rx="1.5" fill={limeDark} />
            <rect x="32" y="40" width="56" height="26" rx="13" fill="#05070A" />
            <g className="girl-lids">
              <g ref={pupilsRef}>
                <rect x="42" y="48" width="12" height="10" rx="5" fill={lime} />
                <rect x="66" y="48" width="12" height="10" rx="5" fill={lime} />
              </g>
            </g>
            <path d="M 48 78 Q 60 84 72 78" fill="none" stroke={lime} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="60" y1="24" x2="60" y2="14" stroke={ink} strokeWidth="2.5" />
            <circle cx="60" cy="10" r="4" fill={lime} stroke={limeDark} className="node-pulse" />
            <rect x="40" y="98" width="40" height="8" rx="4" fill={panel} stroke={ink} strokeWidth="1.5" />
          </g>
        )}

        {variant === 4 && (
          /* ---- V4 · «Чіп» — мікросхема з матричними очима ---- */
          <g>
            {[30, 44, 58, 72, 86].map((x) => (
              <g key={x}>
                <rect x={x - 1.5} y="10" width="3" height="10" fill={ink} />
                <rect x={x - 1.5} y="100" width="3" height="10" fill={ink} />
              </g>
            ))}
            {[36, 52, 68, 84].map((y) => (
              <g key={y}>
                <rect x="10" y={y - 1.5} width="10" height="3" fill={ink} />
                <rect x="100" y={y - 1.5} width="10" height="3" fill={ink} />
              </g>
            ))}
            <rect x="20" y="20" width="80" height="80" rx="10" fill={ink} />
            <rect x="26" y="26" width="68" height="68" rx="6" fill={panel} />
            <rect x="30" y="30" width="14" height="4" rx="2" fill={limeDark} />
            <g className="girl-lids">
              <g ref={pupilsRef}>
                {[0, 1].map((eye) =>
                  [0, 1].map((r) =>
                    [0, 1].map((c) => (
                      <rect
                        key={`${eye}${r}${c}`}
                        x={40 + eye * 26 + c * 7}
                        y={48 + r * 7}
                        width="5"
                        height="5"
                        fill={r === 0 && c === 0 ? limeDark : ink}
                      />
                    )),
                  ),
                )}
              </g>
            </g>
            <path d="M 42 78 L 50 78 L 54 74 L 60 82 L 66 74 L 70 78 L 78 78" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="88" cy="88" r="3" fill={lime} stroke={limeDark} className="node-pulse" />
          </g>
        )}

        {variant === 5 && (
          /* ---- V5 · «Лінія» — мінімалістичний однолінійний портрет ---- */
          <g fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round">
            <path d="M 36 88 Q 24 74 26 54 Q 28 28 60 26 Q 92 28 94 54 Q 96 74 84 88" />
            <path d="M 40 92 Q 60 102 80 92" />
            <g className="girl-lids">
              <g ref={pupilsRef} fill={ink} stroke="none">
                <circle cx="46" cy="56" r="4" />
                <circle cx="74" cy="56" r="4" />
                <circle cx="47.5" cy="54.5" r="1.3" fill={lime} />
                <circle cx="75.5" cy="54.5" r="1.3" fill={lime} />
              </g>
            </g>
            <path d="M 38 46 Q 46 42 54 46" />
            <path d="M 66 46 Q 74 42 82 46" />
            <path d="M 52 76 Q 60 81 68 76" />
            <path d="M 60 26 L 60 14" />
            <circle cx="60" cy="10" r="4" fill={lime} stroke={limeDark} className="node-pulse" />
            <circle cx="92" cy="80" r="2.5" fill={limeDark} stroke="none" />
          </g>
        )}
      </svg>
    </div>
  );
}
