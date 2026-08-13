import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { SYSTEMS } from '@/data/xray';
import { VideoBlock } from '@/components/VideoBlock';
import './challenges.css';

/** /challenges — не «послуги», а 7 систем бізнесу. Вхід через бізнес-біль. */
export function Challenges() {
  return (
    <>
      <PageHead
        kicker="Розділ · Виклики бізнесу"
        title={<>Де ваш бізнес<br />втрачає гроші?</>}
        lead={<>Ми діагностуємо не сайт і не канал, а всю <b>систему онлайн-продажів</b> —
          7 систем від стратегії до організації. Один симптом — сім можливих причин.</>}
      />
      <section className="wrap home-video">
        <VideoBlock title="7 систем, у яких бізнес втрачає гроші" sub="Огляд · як WEEXP діагностує систему цілком" />
      </section>
      <section className="wrap ch-list">
        {SYSTEMS.map((s) => (
          <Link key={s.key} to={`/challenges/${s.slug}`} className="ch-row">
            <span className="ch-num mono">{s.num}</span>
            <span className="ch-body">
              <span className="ch-title">{s.title}</span>
              <span className="ch-en mono">{s.en}</span>
              <span className="ch-feel">«{s.feel}»</span>
            </span>
            <span className="ch-idea">{s.bigIdea}</span>
            <span className="ch-go mono">→</span>
          </Link>
        ))}
      </section>
      <section className="home-cta wrap">
        <div className="home-cta-in">
          <p className="home-cta-lead">Не вгадуйте систему — знайдіть головний bottleneck за 2 хвилини.</p>
          <div className="home-cta-row">
            <Link to="/diagnose" className="btn-primary mono">Знайти bottleneck →</Link>
            <Link to="/diagnose" className="btn-ghost mono">Business X-Ray →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
