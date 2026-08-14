import React from "react";
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grade, Grain, Vignette, Kicker, useSceneExit } from "../components/layers";

const ROWS = [
  { k: "BUILD", d: "Будує e-commerce як функцію бізнесу" },
  { k: "THINK", d: "Діагноз у грошах, а не у відчуттях" },
  { k: "CHALLENGE", d: "Правда дорожча за комфорт" },
  { k: "FUTURE", d: "Стандарт незалежності як категорія" },
];

export const F3Layers: React.FC = () => {
  const exit = useSceneExit();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <BgMesh tone="verd" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 200px" }}>
        <div style={{ ...exit, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 34, width: "100%", maxWidth: 1400 }}>
          <Kicker delay={2}>Як він думає</Kicker>
          {ROWS.map((r, i) => {
            const p = spring({ frame: frame - 14 - i * 8, fps, config: theme.spring.snappy });
            return (
              <div key={r.k} style={{ opacity: p, transform: `translateX(${interpolate(p, [0, 1], [-50, 0])}px)`,
                display: "flex", alignItems: "baseline", gap: 40, borderTop: "1px solid rgba(199,210,214,0.16)", paddingTop: 26, width: "100%" }}>
                <span style={{ fontFamily: theme.fonts.body, fontWeight: 700, fontSize: 26, letterSpacing: "0.18em", color: theme.colors.coral, minWidth: 260 }}>{r.k}</span>
                <span style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 52, letterSpacing: "-0.02em", color: theme.colors.text, lineHeight: 1.02 }}>{r.d}</span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Grade /><Grain /><Vignette />
    </AbsoluteFill>
  );
};
