import { ScoreProvider } from '@/lib/score';
import { useLenis } from '@/lib/useLenis';
import { Hero } from '@/components/Hero';
import { Transform } from '@/components/Transform';
import { Alternatives } from '@/components/Alternatives';
import { Close } from '@/components/Close';
import { ScoreHUD } from '@/components/ScoreHUD';

export default function App() {
  useLenis();
  return (
    <ScoreProvider>
      <Hero />
      <Transform />
      <Alternatives />
      <Close />
      <ScoreHUD />
    </ScoreProvider>
  );
}
