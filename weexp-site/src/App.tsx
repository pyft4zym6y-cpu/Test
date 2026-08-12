import { ScoreProvider } from '@/lib/score';
import { useLenis } from '@/lib/useLenis';
import { Hero } from '@/components/Hero';
import { Transform } from '@/components/Transform';
import { Proof } from '@/components/Proof';
import { Engine } from '@/components/Engine';
import { Flywheel } from '@/components/Flywheel';
import { Cases } from '@/components/Cases';
import { DemoOS } from '@/components/DemoOS';
import { Calculator } from '@/components/Calculator';
import { Manifest } from '@/components/Manifest';
import { Alternatives } from '@/components/Alternatives';
import { Close } from '@/components/Close';
import { ScoreHUD } from '@/components/ScoreHUD';
import { Agent } from '@/components/Agent';
import '@/lib/primitives.css';

export default function App() {
  useLenis();
  return (
    <ScoreProvider>
      <Hero />
      <Transform />
      <Proof />
      <Engine />
      <Flywheel />
      <Cases />
      <DemoOS />
      <Calculator />
      <Manifest />
      <Alternatives />
      <Close />
      <ScoreHUD />
      <Agent />
    </ScoreProvider>
  );
}
