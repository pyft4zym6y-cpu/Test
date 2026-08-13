import React from "react";
import { AbsoluteFill, Composition, continueRender, delayRender } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { theme } from "./theme";
import { S1Hook } from "./scenes/S1Hook";
import { S2Reframe } from "./scenes/S2Reframe";
import { S3Solution } from "./scenes/S3Solution";
import { S4Cta } from "./scenes/S4Cta";
import { F1Quote } from "./founder/F1Quote";
import { F2Track } from "./founder/F2Track";
import { F3Layers } from "./founder/F3Layers";
import { F4Close } from "./founder/F4Close";

// 30fps. Нахлест переходів по 12к.
const S1 = 100, S2 = 118, S3 = 176, S4 = 150, T = 12;
export const TOTAL = S1 + S2 + S3 + S4 - T * 3; // 508 ≈ 16.9s

const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    let alive = true;
    const done = () => { if (alive) continueRender(handle); };
    // @ts-expect-error document.fonts у Chromium
    if (document.fonts?.ready) document.fonts.ready.then(done); else done();
    return () => { alive = false; };
  }, [handle]);
  return <>{children}</>;
};

const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: theme.colors.bg }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={S1}><S1Hook /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
      <TransitionSeries.Sequence durationInFrames={S2}><S2Reframe /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
      <TransitionSeries.Sequence durationInFrames={S3}><S3Solution /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
      <TransitionSeries.Sequence durationInFrames={S4}><S4Cta /></TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);

// Founder reel
const F1 = 110, F2 = 130, F3 = 156, F4 = 128;
export const F_TOTAL = F1 + F2 + F3 + F4 - T * 3; // 488

const FounderReel: React.FC = () => (
  <AbsoluteFill style={{ background: theme.colors.bg }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={F1}><F1Quote /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
      <TransitionSeries.Sequence durationInFrames={F2}><F2Track /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
      <TransitionSeries.Sequence durationInFrames={F3}><F3Layers /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
      <TransitionSeries.Sequence durationInFrames={F4}><F4Close /></TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="WeexpReel" component={() => <FontGate><Reel /></FontGate>}
      durationInFrames={TOTAL} fps={30} width={1920} height={1080} />
    <Composition id="FounderReel" component={() => <FontGate><FounderReel /></FontGate>}
      durationInFrames={F_TOTAL} fps={30} width={1920} height={1080} />
  </>
);
