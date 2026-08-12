import { useScore } from '@/lib/score';
import './score-hud.css';

/** Сквозной индикатор автономности бизнеса — виден на каждом экране, растёт со скроллом. */
export function ScoreHUD() {
  const { score } = useScore();
  const state = score < 33 ? 'хаос' : score < 75 ? 'збирається' : 'система';
  return (
    <aside className="hud" aria-label={`Independence Score ${score} зі 100`}>
      <div className="hud-track"><span className="hud-fill" /></div>
      <div className="hud-body">
        <span className="hud-lab mono">Independence<br />Score</span>
        <span className="hud-val">{score}<small>/100</small></span>
        <span className="hud-state mono">стан: <b>{state}</b></span>
      </div>
    </aside>
  );
}
