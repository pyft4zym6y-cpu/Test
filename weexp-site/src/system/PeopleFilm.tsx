import { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TEAM } from '@/data/team';
import { SHORT } from '@/data/xray';
import { band, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import './system.css';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));

/**
 * WEEXP — THE PEOPLE (people-film, /people). Людський акт арки: систему будують
 * власники, а не герої. Той самий зібраний об'єкт як спокійне тло; поверх —
 * спотлайт засновника й ростер, де кожна з семи систем має власника. Це і є
 * доказ підходу: не універсали, а відповідальні за конкретний контур.
 */
const FOUNDER = TEAM[0];
const ROSTER = TEAM.slice(1);

export function PeopleFilm() {
  const sec = useRef<HTMLElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const founder = useRef<HTMLDivElement>(null);
  const roster = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);

  useScrollScene(sec, (p, reduce) => {
    set(intro.current, reduce ? 1 : seg(p, -1, 0, 0.09, 0.15), `translateY(${((1 - band(p, 0, 0.09)) * -3).toFixed(1)}vh)`);
    set(founder.current, reduce ? 1 : seg(p, 0.17, 0.24, 0.40, 0.47), `translateY(${((1 - seg(p, 0.17, 0.26, 0.40, 0.47)) * 2).toFixed(1)}vh)`);
    set(roster.current, reduce ? 1 : seg(p, 0.49, 0.56, 0.80, 0.87));
    set(outro.current, reduce ? 1 : seg(p, 0.88, 0.94, 1.1, 1.2));
  });

  return (
    <section ref={sec} className="sysx sysx-film sysx-people" aria-label="WEEXP — люди: у кожної системи є власник">
      <div className="sysx-stage">
        <span className="sysx-field" aria-hidden="true" />
        <div className="pf-bg"><Suspense fallback={null}><CommerceSystem3D fixedProgress={0.56} /></Suspense></div>

        {/* INTRO — теза */}
        <div ref={intro} className="sysx-scene sysx-void">
          <div className="sysx-kick">WEEXP — The People · {TEAM.length} ролей</div>
          <h1 className="sysx-display sysx-h1">Систему будують<br /><span className="sysx-em">власники</span>, не герої</h1>
          <p className="sysx-lead">У кожної з семи систем онлайн-продажів є відповідальний за результат. Не універсали — власники конкретного контуру.</p>
          <span className="sysx-scrollhint mono">↓ познайомитись</span>
        </div>

        {/* FOUNDER — спотлайт */}
        <div ref={founder} className="pf-founder" style={{ opacity: 0 }}>
          <div className="pf-founder-l">
            <span className="pf-eyebrow mono">Засновник</span>
            <h2 className="sysx-display pf-role">{FOUNDER.role}</h2>
            <div className="pf-owns">{FOUNDER.owns.map((k) => <span key={k} className="pf-chip mono">{SHORT[k]}</span>)}</div>
            <p className="pf-focus">{FOUNDER.focus}</p>
            <p className="pf-exp mono">{FOUNDER.exp}</p>
          </div>
          <ul className="pf-exlist">
            {FOUNDER.expertise.map((e) => <li key={e}><i aria-hidden="true" />{e}</li>)}
          </ul>
        </div>

        {/* ROSTER — власник у кожної системи */}
        <div ref={roster} className="pf-roster" style={{ opacity: 0 }}>
          <h2 className="sysx-display pf-roster-h">У кожної системи —<br /><span className="sysx-em">свій власник</span>.</h2>
          <div className="pf-grid">
            {ROSTER.map((r) => (
              <div key={r.role} className="pf-card">
                <div className="pf-card-owns">{r.owns.map((k) => <span key={k} className="pf-chip mono">{SHORT[k]}</span>)}</div>
                <b className="pf-card-role">{r.role}</b>
                <span className="pf-card-focus">{r.focus}</span>
              </div>
            ))}
          </div>
        </div>

        {/* OUTRO — CTA */}
        <div ref={outro} className="sysx-scene sysx-ctaScene">
          <div className="sysx-kick">Ваша команда систем</div>
          <h2 className="sysx-display sysx-h2">У кожної вашої системи<br />має бути <span className="sysx-em">власник</span>.</h2>
          <p className="sysx-lead">Діагностика показує, які контури зараз без власника — і хто має за них відповідати.</p>
          <div className="sysx-cta-row">
            <Link to="/diagnose" className="sysx-cta is-primary">Знайти безхазяйні системи →</Link>
            <Link to="/proof" className="sysx-cta">Докази</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
