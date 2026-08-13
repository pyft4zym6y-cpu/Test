import { useScore } from '@/lib/score';
import { useNearFooter } from '@/lib/useNearFooter';
import './score-hud.css';

/** Сквозной индикатор автономности бизнеса — виден на каждом экране, растёт со скроллом. */
export function ScoreHUD() {
  const { score } = useScore();
  const nearFooter = useNearFooter();
  const state = score < 33 ? 'хаос' : score < 75 ? 'збирається' : 'система';
  return (
    <aside className={`hud${nearFooter ? ' is-away' : ''}`} aria-label={`Independence Score ${score} зі 100`} aria-hidden={nearFooter}>
      <div className="hud-track"><span className="hud-fill" /></div>
      <div className="hud-body">
        <span className="hud-lab mono">Independence<br />Score</span>
        <span className="hud-val">{score}<small>/100</small></span>
        <span className="hud-state mono">стан: <b>{state}</b></span>
      </div>
    </aside>
  );
}
