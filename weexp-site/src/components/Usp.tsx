import type { CSSProperties } from 'react';
import { Eyebrow, FadeIn } from '@/lib/primitives';
import './usp.css';

/** USP · піраміда вигод: функція → вигода → трансформація + докази (RTB). */
const TIERS = [
  { k: 'Трансформація', v: 'Бізнес, що працює і росте без вас', goal: true },
  { k: 'Вигода', v: 'Система: відділ, процеси, повторюване зростання', goal: false },
  { k: 'Функція', v: 'Діагностика в грошах · плейбуки · еталони', goal: false },
];
const RTB = ['56 плейбуків', '52 еталони', 'ROI 3.8×', '14 країн', 'аудит знаходить ≥19 млн ₴'];

export function Usp() {
  return (
    <section className="usp" data-say="Ми не продаємо інструменти. Ми продаємо незалежність бізнесу від засновника.">
      <div className="wrap">
        <FadeIn><Eyebrow>USP · що ми насправді продаємо</Eyebrow></FadeIn>
        <FadeIn delay={0.05}><h2 className="usp-h">Ми не продаємо інструменти. Ми продаємо <span className="mk">незалежність</span>.</h2></FadeIn>
        <div className="usp-pyr">
          {TIERS.map((t, i) => (
            <FadeIn key={t.k} delay={0.1 + i * 0.1}>
              <div className={`usp-tier${t.goal ? ' is-goal' : ''}`} style={{ '--w': `${100 - i * 16}%` } as CSSProperties}>
                <span className="usp-k mono">{t.k}</span>
                <span className="usp-v">{t.v}</span>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.4}>
          <div className="usp-rtb">
            <span className="usp-rtb-lab mono">Докази</span>
            {RTB.map((r) => <span key={r} className="usp-chip mono">{r}</span>)}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
