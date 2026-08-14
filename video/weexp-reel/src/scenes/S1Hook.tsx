import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grade, Grain, Vignette, Kicker, WordReveal, Entrance, useSceneExit } from "../components/layers";

export const S1Hook: React.FC = () => {
  const exit = useSceneExit();
  return (
    <AbsoluteFill>
      <BgMesh tone="coral" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 140px" }}>
        <div style={{ ...exit, display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
          <Kicker delay={4}>WEEXP · Operating Partner</Kicker>
          <WordReveal text="Система замість героїзму" delay={10} size={150} per={4}
            highlight={["героїзму"]} highlightColor={theme.colors.coral} style={{ maxWidth: 1400 }} />
          <Entrance delay={30} from={30}>
            <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 34, color: theme.colors.textDim, letterSpacing: "0.01em" }}>
              Ваш бізнес тримається на вас — а не на системі?
            </div>
          </Entrance>
        </div>
      </AbsoluteFill>
      <Grade /><Grain /><Vignette />
    </AbsoluteFill>
  );
};
