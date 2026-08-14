// Пʼятишаровий стек + переюзовні компоненти. Бренд WEEXP: без неон-глоу, гострі кути.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/** Фон: техно-сітка + дихаючі радіальні плями (ніколи не плоский фон). */
export const BgMesh: React.FC<{ tone?: "coral" | "verd" }> = ({ tone = "verd" }) => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 55) * 60, d2 = Math.cos(frame / 70) * 44;
  const hero = tone === "coral" ? theme.colors.coral : theme.colors.verdMid;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <AbsoluteFill style={{
        backgroundImage:
          `linear-gradient(rgba(199,210,214,0.05) 1px, transparent 1px),
           linear-gradient(90deg, rgba(199,210,214,0.05) 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
        maskImage: "radial-gradient(ellipse at center, black 42%, transparent 80%)",
      }} />
      <div style={{ position: "absolute", width: 1500, height: 1500, borderRadius: "50%",
        top: -520, left: -320 + d1, filter: "blur(80px)",
        background: `radial-gradient(circle, ${hero}26, transparent 62%)` }} />
      <div style={{ position: "absolute", width: 1200, height: 1200, borderRadius: "50%",
        bottom: -520, right: -300 - d2, filter: "blur(100px)",
        background: `radial-gradient(circle, ${theme.colors.verdDeep}22, transparent 66%)` }} />
    </AbsoluteFill>
  );
};

export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: theme.colors.verdMid, mixBlendMode: "soft-light", opacity: 0.08 }} />
    <AbsoluteFill style={{ background:
      "linear-gradient(180deg, rgba(0,0,0,0.30), transparent 24%, transparent 72%, rgba(0,0,0,0.44))" }} />
  </AbsoluteFill>
);

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "220px",
    backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`,
    opacity: 0.05, mixBlendMode: "overlay" }} />;
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none",
    background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.34) 100%)" }} />
);

/** Преміум-вхід: opacity + translateY + scale (ніколи одиночний fade). */
export const Entrance: React.FC<{ delay?: number; children: React.ReactNode; from?: number; style?: React.CSSProperties }> =
  ({ delay = 0, children, from = 44, style }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
    return (
      <div style={{ opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [from, 0])}px) scale(${interpolate(p, [0, 1], [0.93, 1])})`,
        ...style }}>{children}</div>
    );
  };

/** Пословний вхід заголовка; highlight красяться коралловим. */
export const WordReveal: React.FC<{
  text: string; delay?: number; per?: number; size: number; color?: string;
  highlight?: string[]; highlightColor?: string; style?: React.CSSProperties; justify?: string;
}> = ({ text, delay = 0, per = 3, size, color = theme.colors.text, highlight = [], highlightColor = theme.colors.coral, style, justify = "center" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: justify, gap: `0 ${Math.round(size * 0.28)}px`,
      fontFamily: theme.fonts.display, fontWeight: 800, fontSize: size, lineHeight: 1.0,
      letterSpacing: "-0.03em", textAlign: "center", ...style }}>
      {text.split(" ").map((word, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: theme.spring.snappy });
        const hot = highlight.includes(word.replace(/[.,!?]/g, ""));
        return (
          <span key={i} style={{ display: "inline-block", opacity: p,
            transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px)`,
            color: hot ? highlightColor : color }}>{word}</span>
        );
      })}
    </div>
  );
};

/** Мʼякий вихід сцени (швидший за вхід). */
export function useSceneExit(hold = 12) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const y = interpolate(frame, [durationInFrames - hold, durationInFrames - 2], [0, -44],
    { easing: theme.ease.in, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = interpolate(frame, [durationInFrames - hold, durationInFrames - 2], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { transform: `translateY(${y}px)`, opacity: o };
}

/** Моно-ярлик (еybrow) у стилі бренду. */
export const Kicker: React.FC<{ children: React.ReactNode; delay?: number; color?: string }> = ({ children, delay = 0, color = theme.colors.textDim }) => (
  <Entrance delay={delay} from={22}>
    <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 24, letterSpacing: "0.34em",
      textTransform: "uppercase", color, display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
      <span style={{ width: 12, height: 12, background: theme.colors.coral, display: "inline-block" }} />
      {children}
    </div>
  </Entrance>
);

/** Лічильник з ease-out (кома як десятковий роздільник — uk). */
export const Counter: React.FC<{ to: number; delay?: number; prefix?: string; suffix?: string; size: number; color?: string }> =
  ({ to, delay = 0, prefix = "", suffix = "", size, color = theme.colors.coral }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth, durationInFrames: Math.round(fps * 1.1) });
    const v = Math.round(interpolate(p, [0, 1], [0, to]));
    return (
      <span style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: size, letterSpacing: "-0.05em",
        color, fontVariantNumeric: "tabular-nums", lineHeight: 0.85 }}>{prefix}{v.toLocaleString("uk-UA")}{suffix}</span>
    );
  };
