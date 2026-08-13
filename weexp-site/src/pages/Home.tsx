import { HomeJourney } from '@/components/HomeJourney';
import { Proof } from '@/components/Proof';
import { TechStack } from '@/components/TechStack';

/**
 * Головна — безперервний скрол-джорней (не стопка блоків): хаос → система
 * збирається → відділ розкладається по шарах → шлях до незалежності → CTA,
 * усе в одному закріпленому кадрі. Нижче — тільки доказ і стек як опора.
 */
export function Home() {
  return (
    <>
      <HomeJourney />
      <Proof />
      <TechStack />
    </>
  );
}
