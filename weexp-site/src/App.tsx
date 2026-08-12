import { ScoreProvider } from '@/lib/score';
import { useLenis } from '@/lib/useLenis';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { Transform } from '@/components/Transform';
import { Proof } from '@/components/Proof';
import { Engine } from '@/components/Engine';
import { Flywheel } from '@/components/Flywheel';
import { Cases } from '@/components/Cases';
import { DemoOS } from '@/components/DemoOS';
import { Calculator } from '@/components/Calculator';
import { Manifest } from '@/components/Manifest';
import { Usp } from '@/components/Usp';
import { States } from '@/components/States';
import { Alternatives } from '@/components/Alternatives';
import { Founder } from '@/components/Founder';
import { Contact } from '@/components/Contact';
import { ScoreHUD } from '@/components/ScoreHUD';
import { Agent } from '@/components/Agent';
import '@/lib/primitives.css';

export default function App() {
  useLenis();
  return (
    <ScoreProvider>
      <Nav />
      <span id="top" />
      <Hero />
      <Transform />
      <Proof />
      <div id="system"><Engine /></div>
      <Usp />
      <Flywheel />
      <div id="cases"><Cases /></div>
      <DemoOS />
      <div id="calc"><Calculator /></div>
      <Manifest />
      <States />
      <Alternatives />
      <Founder />
      <Contact />
      <ScoreHUD />
      <Agent />
    </ScoreProvider>
  );
}
