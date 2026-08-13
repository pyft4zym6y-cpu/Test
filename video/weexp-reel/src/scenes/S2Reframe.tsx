import React from "react";
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grade, Grain, Vignette, Kicker, WordReveal, useSceneExit } from "../components/layers";

const SYS = ["Стратегія", "Комерція", "Клієнт", "Досвід", "Операції", "Дані", "Організація"];

export const S2Reframe: React.FC = () => {
  const exit = useSceneExit();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <BgMesh tone="verd" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 140px" }}>
        <div style={{ ...exit, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          <Kicker delay={2}>Діагноз, а не симптом</Kicker>
          <WordReveal text="Проблема не в сайті —" delay={8} size={104} per={3} color={theme.colors.text} />
          <WordReveal text="проблема в системі" delay={20} size={104} per={3}
            highlight={["системі"]} highlightColor={theme.colors.coral} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", maxWidth: 1500, marginTop: 20 }}>
            {SYS.map((s, i) => {
              const p = spring({ frame: frame - 46 - i * 5, fps, config: theme.spring.snappy });
              return (
                <div key={s} style={{ opacity: p, transform: `translateY(${interpolate(p, [0, 1], [26, 0])}px)`,
                  fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 26, letterSpacing: "0.04em",
                  color: theme.colors.text, border: `1px solid rgba(199,210,214,0.2)`, padding: "14px 20px" }}>
                  <span style={{ color: theme.colors.verd, marginRight: 10 }}>0{i + 1}</span>{s}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      <Grade /><Grain /><Vignette />
    </AbsoluteFill>
  );
};
