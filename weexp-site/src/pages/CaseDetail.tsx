import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { caseBySlug, CASES } from '@/data/cases';
import './case-detail.css';

/**
 * /cases/:slug — діагноз → система → результат.
 * Wow-механіка: перемикач «до / після» морфить усі метрики одночасно
 * (крос-фейд значень + шкала-бенчмарк), демонструючи розрив, який закриває система.
 */
export function CaseDetail() {
  const { slug } = useParams();
  const study = slug ? caseBySlug(slug) : undefined;
  const [after, setAfter] = useState(false);

  // авто-перемикання «до→після» при вході, далі — керує користувач
  useEffect(() => {
    setAfter(false);
    const t = setTimeout(() => setAfter(true), 700);
    return () => clearTimeout(t);
  }, [slug]);

  if (!study) return <Navigate to="/cases" replace />;

  const idx = CASES.findIndex((c) => c.slug === study.slug);
  const next = CASES[(idx + 1) % CASES.length];

  return (
    <article className="case-detail">
      <header className="page-head">
        <div className="wrap">
          <Link to="/cases" className="cd-back mono">← Усі кейси</Link>
          <span className="page-kick">{study.cat}</span>
          <h1 className="page-h1">{study.name}</h1>
          <p className="page-lead">{study.lead}</p>
          <div className="cd-hero">
            <span className="cd-hero-num">{study.hero}</span>
            <span className="cd-hero-lab mono">{study.heroLabel} · {study.window}</span>
          </div>
        </div>
      </header>

      {/* Морф до/після */}
      <section className="wrap cd-morph" data-say={`${study.name}: розрив між «до» і «після» — це і є гроші системи.`}>
        <div className="cd-morph-head">
          <h2 className="cd-h2">Розрив у цифрах</h2>
          <div className="cd-toggle mono" role="tablist" aria-label="До / Після">
            <button role="tab" aria-selected={!after} className={!after ? 'is-on' : ''} onClick={() => setAfter(false)}>До</button>
            <button role="tab" aria-selected={after} className={after ? 'is-on' : ''} onClick={() => setAfter(true)}>Після</button>
          </div>
        </div>
        <div className={`cd-metrics${after ? ' is-after' : ''}`}>
          {study.metrics.map((m) => (
            <div key={m.label} className="cd-metric">
              <span className="cd-metric-lab mono">{m.label}</span>
              <span className="cd-metric-val">
                <span className="cd-before">{m.before}</span>
                <span className="cd-after">{m.after}</span>
              </span>
              {m.note && <span className="cd-metric-note mono">{m.note}</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="wrap cd-cols">
        <div className="cd-col">
          <h3 className="cd-col-h mono">Діагноз у грошах</h3>
          <ul className="cd-list">{study.diagnosis.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </div>
        <div className="cd-col cd-col--sys">
          <h3 className="cd-col-h mono">Що побудували</h3>
          <ul className="cd-list">{study.system.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      </section>

      <section className="wrap cd-result" data-say={study.result}>
        <span className="page-kick">Результат</span>
        <p className="cd-result-text">{study.result}</p>
        <div className="cd-nav">
          <Link to="/contact" className="btn-primary mono">Хочу так само →</Link>
          <Link to={`/cases/${next.slug}`} className="btn-ghost mono">Наступний кейс: {next.name} →</Link>
        </div>
      </section>
    </article>
  );
}
