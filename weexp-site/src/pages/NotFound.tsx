import { Link } from 'react-router-dom';
import './not-found.css';

/** 404 — сторінки немає, але система на місці. */
export function NotFound() {
  return (
    <section className="nf">
      <div className="wrap">
        <div className="nf-code">404</div>
        <p className="nf-lead">Такої сторінки немає — але система на місці.</p>
        <div className="nf-row">
          <Link to="/" className="btn-primary mono">На головну →</Link>
          <Link to="/cases" className="btn-ghost mono">Дивитись кейси →</Link>
        </div>
      </div>
    </section>
  );
}
