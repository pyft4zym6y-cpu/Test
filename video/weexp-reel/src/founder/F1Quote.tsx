import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grade, Grain, Vignette, Kicker, WordReveal, Entrance, useSceneExit } from "../components/layers";

export const F1Quote: React.FC = () => {
  const exit = useSceneExit();
  return (
    <AbsoluteFill>
      <BgMesh tone="coral" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 150px" }}>
        <div style={{ ...exit, display: "flex", flexDirection: "column", alignItems: "center", gap: 46 }}>
          <Kicker delay={4}>Founder &amp; Architect of WEEXP</Kicker>
          <WordReveal text="Я будую бізнеси, які можуть працювати без героя" delay={10} size={92} per={3}
            highlight={["героя"]} highlightColor={theme.colors.coral} style={{ maxWidth: 1500 }} />
          <Entrance delay={40} from={26}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 44, color: theme.colors.text, letterSpacing: "-0.02em" }}>
                Павло Сидоренко
              </div>
              <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 24, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.colors.textDim }}>
                Founder &amp; Architect of Commerce
              </div>
            </div>
          </Entrance>
        </div>
      </AbsoluteFill>
      <Grade /><Grain /><Vignette />
    </AbsoluteFill>
  );
};
