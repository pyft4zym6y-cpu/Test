import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grade, Grain, Vignette, Kicker, Counter, Entrance, useSceneExit } from "../components/layers";

const Lab: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <Entrance delay={delay} from={16}>
    <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 22, letterSpacing: "0.06em",
      textTransform: "uppercase", color: theme.colors.textDim, textAlign: "center", maxWidth: 320 }}>{children}</div>
  </Entrance>
);

export const F2Track: React.FC = () => {
  const exit = useSceneExit();
  return (
    <AbsoluteFill>
      <BgMesh tone="verd" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 120px" }}>
        <div style={{ ...exit, display: "flex", flexDirection: "column", alignItems: "center", gap: 60 }}>
          <Kicker delay={2}>Track record</Kicker>
          <div style={{ display: "flex", gap: 80, alignItems: "flex-start" }}>
            <Col n={<Counter to={8} suffix="+" delay={12} size={150} />} lab="років у міжнародному e-commerce" d={28} />
            <Col n={<Counter to={14} delay={20} size={150} />} lab="країн: US · EU · MENA" d={36} />
            <Col n={<Static>TOP-250</Static>} lab="бренди Forbes UA у портфелі" d={30} delay={26} />
            <Col n={<Counter to={18} prefix="×" delay={30} size={150} />} lab="оборот у флагманському кейсі" d={44} />
          </div>
        </div>
      </AbsoluteFill>
      <Grade /><Grain /><Vignette />
    </AbsoluteFill>
  );
};

const Static: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Entrance delay={26} from={38}>
    <span style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 110, letterSpacing: "-0.04em", color: theme.colors.coral, lineHeight: 0.85 }}>{children}</span>
  </Entrance>
);

const Col: React.FC<{ n: React.ReactNode; lab: string; d?: number; delay?: number }> = ({ n, lab, d = 30 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>{n}<Lab delay={d}>{lab}</Lab></div>
);
