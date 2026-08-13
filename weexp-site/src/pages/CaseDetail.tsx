import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { caseBySlug, CASES } from '@/data/cases';
import { systemByKey } from '@/data/xray';
import './case-detail.css';

/**
 * /cases/:slug — фірмова дуга: BEFORE → DIAGNOSIS → MONEY → BUILD → AFTER → INDEPENDENCE → LEARNING.
 * Wow: перемикач «до/після» морфить усі метрики разом; LEARNING фіксує внесок кейсу в капітал WEEXP.
 */
export function CaseDetail() {
  const { slug } = useParams();
  const study = slug ? caseBySlug(slug) : undefined;
  const [after, setAfter] = useState(false);

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
          <div className="cd-tags mono">
            {study.systems.map((k) => (
              <Link key={k} to={`/challenges/${systemByKey(k).slug}`} className="cd-tag-sys">{systemByKey(k).title}</Link>
            ))}
            <span className="cd-tag-stage">{study.stage}</span>
          </div>
        </div>
      </header>

      <section className="wrap cd-arc">
        <div className="cd-arc-block">
          <span className="cd-arc-k mono">Before</span>
          <p className="cd-arc-text">{study.before}</p>
        </div>
        <div className="cd-arc-block">
          <span className="cd-arc-k mono">Diagnosis</span>
          <ul className="cd-list">{study.diagnosis.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </div>
      </section>

      <section className="wrap cd-money" data-say={study.money}>
        <span className="cd-arc-k mono">Money · скільки це коштувало бізнесу</span>
        <p className="cd-money-text">{study.money}</p>
      </section>

      {/* Морф до/після */}
      <section className="wrap cd-morph" data-say={`${study.name}: розрив між «до» і «після» — це і є гроші системи.`}>
        <div className="cd-morph-head">
          <h2 className="cd-h2">After · розрив у цифрах</h2>
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
        <div className="cd-col cd-col--sys">
          <h3 className="cd-col-h mono">Build · що побудували</h3>
          <ul className="cd-list">{study.system.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
        <div className="cd-col cd-col--ind">
          <h3 className="cd-col-h mono">Independence · що клієнт може без нас</h3>
          <p className="cd-col-p">{study.independence}</p>
          <p className="cd-after-line">{study.after}</p>
        </div>
      </section>

      <section className="wrap cd-learning" data-say={`Learning: ${study.learning}`}>
        <span className="cd-arc-k mono">Learning · чого кейс навчив систему WEEXP</span>
        <p className="cd-learning-text">{study.learning}</p>
        <span className="cd-learning-note mono">Кожен клієнт робить систему WEEXP розумнішою — knowledge flywheel.</span>
      </section>

      <section className="wrap cd-result">
        <div className="cd-nav">
          <Link to="/diagnose" className="btn-primary mono">Хочу так само →</Link>
          <Link to={`/cases/${next.slug}`} className="btn-ghost mono">Наступний кейс: {next.name} →</Link>
        </div>
      </section>
    </article>
  );
}
