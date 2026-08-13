import React from "react";
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grade, Grain, Vignette, Kicker, Counter, Entrance, WordReveal, useSceneExit } from "../components/layers";

const NODES = Array.from({ length: 13 }, (_, i) => ({ x: 120 + i * 138, y: i % 2 ? 70 : 30 }));

export const S3Solution: React.FC = () => {
  const exit = useSceneExit();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <BgMesh tone="verd" />
      {/* connective strip — draws in */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 150 }}>
        <svg width={1760} height={110} viewBox="0 0 1760 110">
          {NODES.slice(0, -1).map((n, i) => {
            const p = spring({ frame: frame - 40 - i * 3, fps, config: theme.spring.smooth });
            const m = NODES[i + 1];
            return <line key={i} x1={n.x} y1={n.y} x2={interpolate(p, [0, 1], [n.x, m.x])} y2={interpolate(p, [0, 1], [n.y, m.y])}
              stroke={theme.colors.verdMid} strokeWidth={1.5} opacity={0.5} />;
          })}
          {NODES.map((n, i) => {
            const p = spring({ frame: frame - 38 - i * 3, fps, config: theme.spring.snappy });
            return <circle key={i} cx={n.x} cy={n.y} r={interpolate(p, [0, 1], [0, 3.4])} fill={theme.colors.coral} opacity={p} />;
          })}
        </svg>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 120px" }}>
        <div style={{ ...exit, display: "flex", flexDirection: "column", alignItems: "center", gap: 56 }}>
          <Kicker delay={2}>Докази · CRM · ERP · GA4</Kicker>
          <div style={{ display: "flex", gap: 96, alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}><Counter to={18} prefix="×" delay={14} size={168} /></div>
              <Lab delay={30}>оборот · флагман</Lab>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}><Counter to={65} prefix="+" suffix="%" delay={22} size={168} /></div>
              <Lab delay={38}>продажів · 9 міс</Lab>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <Entrance delay={30} from={40}>
                <span style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 168, letterSpacing: "-0.05em", color: theme.colors.coral, lineHeight: 0.85 }}>17K</span>
              </Entrance>
              <Lab delay={46}>SKU під контролем</Lab>
            </div>
          </div>
          <WordReveal text="Діагностуємо систему, а не симптом" delay={64} size={64}
            highlight={["систему"]} highlightColor={theme.colors.verd} style={{ marginTop: 10 }} />
        </div>
      </AbsoluteFill>
      <Grade /><Grain /><Vignette />
    </AbsoluteFill>
  );
};

const Lab: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <Entrance delay={delay} from={18}>
    <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 24, letterSpacing: "0.08em",
      textTransform: "uppercase", color: theme.colors.textDim }}>{children}</div>
  </Entrance>
);
