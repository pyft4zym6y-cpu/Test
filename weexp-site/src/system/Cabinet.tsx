import { useNavigate } from 'react-router-dom';
import { Stage3 } from './Stage3';

/**
 * /cabinet — прямий вхід у персональний кабінет клієнта (Stage 3 як окрема
 * сторінка, не лише як фінал воронки). Повторний вхід тим самим email показує
 * збережений розбір: дані калькулятора, профіль зрілості, дорожню карту.
 */
export function Cabinet() {
  const nav = useNavigate();
  // Обгортка .sysx дає світлі дизайн-токени (кабінет — окремий маршрут поза
  // калькулятором, інакше .s2 не успадкує --warm-white і фон буде темним).
  return <div className="sysx"><Stage3 standalone onClose={() => nav('/')} /></div>;
}
