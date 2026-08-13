import React from "react";
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grade, Grain, Vignette, Kicker, WordReveal, Entrance } from "../components/layers";

const MARKETS = ["UA", "PL", "DE", "FR", "ES", "IT", "UK", "US", "AE"];

export const S4Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 1 + Math.sin(frame / 14) * 0.012;
  return (
    <AbsoluteFill>
      <BgMesh tone="coral" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 140px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          <Kicker delay={2}>Global · US · EU · MENA</Kicker>
          <WordReveal text="Built to cross borders" delay={8} size={128} per={4}
            highlight={["cross", "borders"]} highlightColor={theme.colors.coral} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 1200 }}>
            {MARKETS.map((m, i) => {
              const p = spring({ frame: frame - 34 - i * 3, fps, config: theme.spring.snappy });
              return <span key={m} style={{ opacity: p, transform: `translateY(${interpolate(p, [0, 1], [20, 0])}px)`,
                fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 24, letterSpacing: "0.14em", color: theme.colors.text,
                border: "1px solid rgba(199,210,214,0.22)", padding: "10px 14px" }}>{m}</span>;
            })}
          </div>
          <Entrance delay={54} from={30}>
            <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 88, letterSpacing: "-0.03em", color: theme.colors.text }}>
              weexp<span style={{ color: theme.colors.coral }}>.agency</span>
            </div>
          </Entrance>
          <Entrance delay={66} from={22}>
            <div style={{ transform: `scale(${pulse})`, fontFamily: theme.fonts.body, fontWeight: 700, fontSize: 28,
              letterSpacing: "0.06em", textTransform: "uppercase", color: theme.colors.bg, background: theme.colors.coral, padding: "20px 40px" }}>
              Знайти bottleneck →
            </div>
          </Entrance>
        </div>
      </AbsoluteFill>
      <Grade /><Grain /><Vignette />
    </AbsoluteFill>
  );
};
