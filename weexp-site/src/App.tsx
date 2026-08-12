import { ScoreProvider } from '@/lib/score';
import { useLenis } from '@/lib/useLenis';
import { Hero } from '@/components/Hero';
import { Transform } from '@/components/Transform';
import { Proof } from '@/components/Proof';
import { Engine } from '@/components/Engine';
import { Cases } from '@/components/Cases';
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
      <Cases />
      <Alternatives />
      <Close />
      <ScoreHUD />
      <Agent />
    </ScoreProvider>
  );
}
