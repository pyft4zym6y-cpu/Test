import { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TEAM, localizeRole } from '@/data/team';
import { shortOf } from '@/data/xray';
import { useT, useLp, useLang } from '@/i18n';
import { useLiteVisuals } from '@/lib/liteVisuals';
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
const buildStandard = (t: (uk: string, en: string) => string): { n: string; t: string; d: string }[] => [
  { n: '01', t: t('Хвилями під Definition of Done', 'In waves under a Definition of Done'), d: t('Не «як вийде»: кожна хвиля має критерій готовності й вимірюваний результат.', 'Not “however it turns out”: every wave has a readiness criterion and a measurable result.') },
  { n: '02', t: t('RACI і несуперечливі KPI', 'RACI and non-conflicting KPIs'), d: t('У кожного контуру — власник. Цілі відділів не конфліктують між собою.', 'Every circuit has an owner. Team goals do not conflict with one another.') },
  { n: '03', t: t('SOP і база знань', 'SOPs and a knowledge base'), d: t('Процеси зафіксовані — система переживає людей і не тримається на пам’яті.', 'Processes are documented — the system outlives people and does not rest on memory.') },
  { n: '04', t: t('Hypothesis-driven + post-mortem', 'Hypothesis-driven + post-mortem'), d: t('Рішення за даними; після великих змін — розбір, що спрацювало й чому.', 'Decisions by data; after major changes — a review of what worked and why.') },
  { n: '05', t: t('Передача клієнту', 'Handover to the client'), d: t('Мета — Independence Score: щоб система працювала й зростала без нас.', 'The goal is the Independence Score: so the system runs and grows without us.') },
];

export function PeopleFilm() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const lite = useLiteVisuals();
  const fnd = localizeRole(FOUNDER, lang);
  const STANDARD = buildStandard(t);
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
    <section ref={sec} className="sysx sysx-film sysx-people" aria-label={t('WEEXP — люди: у кожної системи є власник', 'WEEXP — people: every system has an owner')}>
      <div className="sysx-stage">
        <span className="sysx-field" aria-hidden="true" />
        <div className={'pf-bg' + (lite ? ' is-lite' : '')} aria-hidden="true">{!lite && <Suspense fallback={null}><CommerceSystem3D fixedProgress={0.56} /></Suspense>}</div>

        {/* INTRO — теза */}
        <div ref={intro} className="sysx-scene sysx-void">
          <div className="sysx-kick">WEEXP — The People · {TEAM.length} {t('ролей', 'roles')}</div>
          <h1 className="sysx-display sysx-h1">{t('Систему будують', 'Systems are built by')}<br /><span className="sysx-em">{t('власники', 'owners')}</span>{t(', не герої', ', not heroes')}</h1>
          <p className="sysx-lead">{t('У кожної системи онлайн-продажів є відповідальний за результат. Не універсали — власники конкретного контуру.', 'Every online-sales system has someone accountable for the result. Not generalists — owners of a specific circuit.')}</p>
          <span className="sysx-scrollhint mono">{t('↓ познайомитись', '↓ meet the team')}</span>
        </div>

        {/* FOUNDER — спотлайт */}
        <div ref={founder} className="pf-founder" style={{ opacity: 0 }}>
          {FOUNDER.photo && (
            <div className="pf-portrait">
              <img src={FOUNDER.photo} alt={`${FOUNDER.name ?? t('Засновник', 'Founder')} — ${t('засновник WEEXP', 'founder of WEEXP')}`} width="900" height="1125" loading="lazy" />
            </div>
          )}
          <div className="pf-founder-l">
            <span className="pf-eyebrow mono">{t('Засновник', 'Founder')}</span>
            {FOUNDER.name && <h2 className="sysx-display pf-name">{FOUNDER.name}</h2>}
            <p className="pf-role-sub mono">{fnd.role}</p>
            <div className="pf-owns">{FOUNDER.owns.map((k) => <span key={k} className="pf-chip mono">{shortOf(k, lang)}</span>)}</div>
            <p className="pf-focus">{fnd.focus}</p>
            <p className="pf-exp mono">{fnd.exp}</p>
            <ul className="pf-exlist">
              {fnd.expertise.map((e) => <li key={e}><i aria-hidden="true" />{e}</li>)}
            </ul>
          </div>
        </div>

        {/* ROSTER — власник у кожної системи */}
        <div ref={roster} className="pf-roster" style={{ opacity: 0 }}>
          <h2 className="sysx-display pf-roster-h">{t('У кожної системи —', 'Every system has')}<br /><span className="sysx-em">{t('свій власник', 'its own owner')}</span>.</h2>
          <div className="pf-grid">
            {ROSTER.map((r) => {
              const m = localizeRole(r, lang);
              return (
                <div key={r.role} className="pf-card">
                  <div className="pf-card-owns">{m.owns.map((k) => <span key={k} className="pf-chip mono">{shortOf(k, lang)}</span>)}</div>
                  <b className="pf-card-role">{m.role}</b>
                  <span className="pf-card-zone mono">{t('Закриває:', 'Covers:')} {m.zone}</span>
                  <span className="pf-card-focus">{m.focus}</span>
                  <ul className="pf-card-fn">{m.expertise.slice(0, 3).map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* STANDARD — 3-й рівень: як команда працює як система */}
        <div ref={standard} className="pf-standard" style={{ opacity: 0 }}>
          <div className="pf-standard-head">
            <span className="sysx-kick">{t('Стандарт · 3-й рівень', 'Standard · level 3')}</span>
            <h2 className="sysx-display pf-standard-h">{t('Команда працює', 'The team works')}<br />{t('як', 'as a')} <span className="sysx-em">{t('система', 'system')}</span>.</h2>
            <p className="pf-standard-lead">{t('Власники — це рівень «хто». Ось рівень «як»: правила, за якими вісім систем тримаються разом і працюють без героя.', 'Owners are the “who” level. Here is the “how”: the rules by which eight systems hold together and run without a hero.')}</p>
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
          <div className="sysx-kick">{t('Ваша команда систем', 'Your team of systems')}</div>
          <h2 className="sysx-display sysx-h2">{t('У кожної вашої системи', 'Every one of your systems')}<br />{t('має бути', 'should have an')} <span className="sysx-em">{t('власник', 'owner')}</span>.</h2>
          <p className="sysx-lead">{t('Діагностика показує, які контури зараз без власника — і хто має за них відповідати.', 'The diagnostic shows which circuits currently have no owner — and who should be accountable for them.')}</p>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Знайти безхазяйні системи →', 'Find the ownerless systems →')}</Link>
            <Link to={lp('/proof')} className="sysx-cta">{t('Докази', 'Proof')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
