import { Link, useLocation } from 'react-router-dom';
import { usePageSeo } from '@/lib/seo';
import './system.css';

/**
 * Світла 404 у системі .sysx (замість старої тёмної) — єдина айдентика на всіх
 * маршрутах. noindex, щоб soft-404 не потрапляв в індекс. Живе під SystemShell,
 * тож отримує шапку/підвал автоматично.
 */
export function SystemNotFound() {
  const { pathname } = useLocation();
  usePageSeo('Сторінку не знайдено · WEEXP', 'Такої сторінки немає.', pathname, true);
  return (
    <section className="sysx sysx-404" aria-label="Сторінку не знайдено">
      <div className="sysx-404-in">
        <div className="sysx-kick mono">404 · сторінки немає</div>
        <h1 className="sysx-display sysx-404-h">Такої сторінки немає —<br />але <span className="sysx-em">система</span> на місці.</h1>
        <p className="sysx-lead">Можливо, посилання застаріло. Повернімося на головну або подивимось докази в цифрах.</p>
        <div className="sysx-cta-row">
          <Link to="/" className="sysx-cta is-primary">На головну →</Link>
          <Link to="/proof" className="sysx-cta">Дивитись докази →</Link>
          <Link to="/diagnose" className="sysx-cta">Діагностика →</Link>
        </div>
      </div>
    </section>
  );
}
