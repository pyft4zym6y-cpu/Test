import { useParams, Link, Navigate } from 'react-router-dom';
import { systemBySlug, SYSTEMS } from '@/data/xray';
import { VideoBlock } from '@/components/VideoBlock';
import './challenges.css';

/** /challenges/:slug — сторінка системи: біль → великий сенс → ланцюг → симптоми → що будуємо. */
export function SystemPage() {
  const { slug } = useParams();
  const s = slug ? systemBySlug(slug) : undefined;
  if (!s) return <Navigate to="/challenges" replace />;

  const idx = SYSTEMS.findIndex((x) => x.key === s.key);
  const next = SYSTEMS[(idx + 1) % SYSTEMS.length];

  return (
    <article className="sys">
      <header className="page-head">
        <div className="wrap">
          <Link to="/challenges" className="cd-back mono">← Усі системи</Link>
          <span className="page-kick">Система {s.num} · {s.en}</span>
          <h1 className="page-h1">{s.title}</h1>
          <p className="sys-feel">«{s.feel}»</p>
        </div>
      </header>

      <section className="wrap sys-idea" data-say={s.bigIdea}>
        <span className="page-kick">{s.when}</span>
        <p className="sys-idea-text">{s.bigIdea}</p>
        <div className="sys-flow">
          {s.flow.map((f, i) => (
            <span key={f} className="sys-flow-step mono">{f}{i < s.flow.length - 1 && <i>→</i>}</span>
          ))}
        </div>
      </section>

      <section className="wrap sys-video">
        <VideoBlock title={`${s.title} — як ми це будуємо`} sub={`Система ${s.num} · ${s.en}`} />
      </section>

      <section className="wrap sys-cols">
        <div className="sys-col">
          <h3 className="sys-h mono">Симптоми, які ви бачите</h3>
          <ul className="sys-pains">{s.pains.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
        <div className="sys-col sys-col--sell">
          <h3 className="sys-h mono">Що будує WEEXP</h3>
          <p className="sys-sell">{s.sell}</p>
          <div className="sys-domains">
            <span className="sys-domains-lab mono">Діагностичні домени</span>
            {s.domains.map((d) => <span key={d} className="sys-domain">{d}</span>)}
          </div>
        </div>
      </section>

      <section className="wrap sys-next">
        <p className="sys-next-lead">Не впевнені, що саме ця система — ваш bottleneck? Перевірте за 2 хвилини.</p>
        <div className="home-cta-row">
          <Link to="/diagnose" className="btn-primary mono">Знайти bottleneck →</Link>
          <Link to={`/challenges/${next.slug}`} className="btn-ghost mono">Система {next.num}: {next.title} →</Link>
        </div>
      </section>
    </article>
  );
}
