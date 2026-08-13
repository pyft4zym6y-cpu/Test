import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { TEAM } from '@/data/team';
import { systemByKey } from '@/data/xray';
import './team-page.css';

/** /about/team — команда як доказ підходу: у кожної системи є власник. */
export function TeamPage() {
  return (
    <>
      <PageHead
        kicker="Розділ · Команда"
        title={<>У кожної системи<br />є власник</>}
        lead={<>Ми не «універсали на всі руки». Команда структурована за 7 системами бізнесу —
          за кожен контур відповідає <b>конкретна експертиза</b>.</>}
      />
      <section className="wrap team-grid">
        {TEAM.map((m) => (
          <article key={m.role} className="team-card">
            <div className="team-card-head">
              <h3 className="team-role">{m.role}</h3>
              <div className="team-owns mono">
                {m.owns.map((k) => (
                  <Link key={k} to={`/challenges/${systemByKey(k).slug}`} className="team-own">{systemByKey(k).num}·{systemByKey(k).title}</Link>
                ))}
              </div>
            </div>
            <p className="team-focus">{m.focus}</p>
            <ul className="team-exp">{m.expertise.map((e) => <li key={e}>{e}</li>)}</ul>
            <span className="team-fact mono">{m.exp}</span>
          </article>
        ))}
      </section>
      <section className="home-cta wrap">
        <div className="home-cta-in">
          <p className="home-cta-lead">Хочете побачити, за яку саме систему візьмемось у вас?</p>
          <div className="home-cta-row">
            <Link to="/diagnose" className="btn-primary mono">Знайти bottleneck →</Link>
            <Link to="/about/founder" className="btn-ghost mono">Про засновника →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
