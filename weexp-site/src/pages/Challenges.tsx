import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { SystemExplorer } from '@/components/SystemExplorer';
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
      <SystemExplorer />
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
