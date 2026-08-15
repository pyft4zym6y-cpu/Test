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

// 3-й рівень: стандарт, за яким команда працює як система, а не як набір людей.
// Це і є перехід від «хто володіє» до «як будуємо, щоб працювало без героя».
const STANDARD: { n: string; t: string; d: string }[] = [
  { n: '01', t: 'Хвилями під Definition of Done', d: 'Не «як вийде»: кожна хвиля має критерій готовності й вимірюваний результат.' },
  { n: '02', t: 'RACI і несуперечливі KPI', d: 'У кожного контуру — власник. Цілі відділів не конфліктують між собою.' },
  { n: '03', t: 'SOP і база знань', d: 'Процеси зафіксовані — система переживає людей і не тримається на пам’яті.' },
  { n: '04', t: 'Hypothesis-driven + post-mortem', d: 'Рішення за даними; після великих змін — розбір, що спрацювало й чому.' },
  { n: '05', t: 'Передача клієнту', d: 'Мета — Independence Score: щоб система працювала й зростала без нас.' },
];

export function PeopleFilm() {
  const sec = useRef<HTMLElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const founder = useRef<HTMLDivElement>(null);
  const roster = useRef<HTMLDivElement>(null);
  const standard = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);

  useScrollScene(sec, (p, reduce) => {
    set(intro.current, reduce ? 1 : seg(p, -1, 0, 0.08, 0.13), `translateY(${((1 - band(p, 0, 0.08)) * -3).toFixed(1)}vh)`);
    set(founder.current, reduce ? 1 : seg(p, 0.15, 0.21, 0.33, 0.39), `translateY(${((1 - seg(p, 0.15, 0.23, 0.33, 0.39)) * 2).toFixed(1)}vh)`);
    set(roster.current, reduce ? 1 : seg(p, 0.41, 0.47, 0.58, 0.63));
    set(standard.current, reduce ? 1 : seg(p, 0.65, 0.71, 0.82, 0.87));
    set(outro.current, reduce ? 1 : seg(p, 0.89, 0.94, 1.1, 1.2));
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
          <p className="sysx-lead">У кожної системи онлайн-продажів є відповідальний за результат. Не універсали — власники конкретного контуру.</p>
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

        {/* STANDARD — 3-й рівень: як команда працює як система */}
        <div ref={standard} className="pf-standard" style={{ opacity: 0 }}>
          <div className="pf-standard-head">
            <span className="sysx-kick">Стандарт · 3-й рівень</span>
            <h2 className="sysx-display pf-standard-h">Команда працює<br />як <span className="sysx-em">система</span>.</h2>
            <p className="pf-standard-lead">Власники — це рівень «хто». Ось рівень «як»: правила, за якими вісім систем тримаються разом і працюють без героя.</p>
          </div>
          <ol className="pf-std-grid">
            {STANDARD.map((s) => (
              <li key={s.n} className="pf-std">
                <span className="pf-std-n mono">{s.n}</span>
                <b className="pf-std-t">{s.t}</b>
                <span className="pf-std-d">{s.d}</span>
              </li>
            ))}
          </ol>
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
