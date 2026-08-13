import { ChallengesJourney } from '@/components/ChallengesJourney';

/**
 * /challenges — не «послуги», а 7 систем бізнесу, показані як просторовий
 * джорней: горизонтальний dolly крізь системи (той самий motion-система, що
 * й на головній). Вхід через бізнес-біль, вихід — у діагностику.
 */
export function Challenges() {
  return <ChallengesJourney />;
}
