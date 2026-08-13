import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grade, Grain, Vignette, Kicker, WordReveal, Entrance } from "../components/layers";

export const F4Close: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 14) * 0.012;
  return (
    <AbsoluteFill>
      <BgMesh tone="coral" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 150px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          <Kicker delay={2}>Два голоси одного бренду</Kicker>
          <WordReveal text="WEEXP доводить — Павло пояснює" delay={8} size={92} per={4}
            highlight={["пояснює"]} highlightColor={theme.colors.coral} style={{ maxWidth: 1500 }} />
          <Entrance delay={40} from={26}>
            <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 28, color: theme.colors.textDim, textAlign: "center", maxWidth: 900 }}>
              Автор системи, але не єдине джерело її цінності.
            </div>
          </Entrance>
          <Entrance delay={54} from={22}>
            <div style={{ transform: `scale(${pulse})`, fontFamily: theme.fonts.body, fontWeight: 700, fontSize: 28,
              letterSpacing: "0.06em", textTransform: "uppercase", color: theme.colors.bg, background: theme.colors.coral, padding: "20px 40px" }}>
              weexp.agency · Діагностувати бізнес →
            </div>
          </Entrance>
        </div>
      </AbsoluteFill>
      <Grade /><Grain /><Vignette />
    </AbsoluteFill>
  );
};
