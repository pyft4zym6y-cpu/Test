import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { VideoBlock } from '@/components/VideoBlock';
import './wwb.css';

const DIAGNOSE = {
  flow: ['Fact', 'Benchmark', 'Gap', '€ Impact', 'Action'],
  items: [
    'Business Health по 7 системах і 15 доменах',
    'Benchmark проти норми сегмента',
    'Причинна карта втрат і головний bottleneck',
    'Розрив у грошах і пріоритети impact × effort',
    'Roadmap побудови під Definition of Done',
  ],
};

const BUILD = [
  { t: 'Commerce Function', d: 'Департамент, а не набір підрядників.',
    items: ['e-commerce-відділ і ролі', 'команда й наймання', 'P&L і governance', 'управлінський цикл'] },
  { t: 'Commerce Infrastructure', d: 'Цифрова основа, на якій можна керувати.',
    items: ['платформа й каталог', 'CRM і аналітика', 'ERP і склад (WMS)', 'маркетплейси й операції'] },
  { t: 'Growth System', d: 'Механіка, що робить зростання керованим.',
    items: ['залучення й CAC', 'конверсія й CRO', 'retention і LTV', 'ціни й асортимент'] },
];

const SCALE = [
  { t: 'EU Expansion', d: 'Окремий бізнес-контур під ринки ЄС.', to: '/what-we-build/eu-expansion' },
  { t: 'Маркетплейси', d: 'Amazon і локальні майданчики як керований канал.' },
  { t: 'Omnichannel', d: 'Онлайн і офлайн в одному контурі даних.' },
  { t: 'AI та автоматизація', d: 'Прибирання ручної роботи з операцій і сервісу.' },
  { t: 'Нові бізнес-моделі', d: 'Підписки, D2C, нові категорії й ринки.' },
];

const INDEPENDENCE = [
  { t: 'Independence Score', d: 'KPI передачі: наскільки бізнес працює без героя.', to: '/diagnose' },
  { t: 'Handoff', d: 'Передача операційного керування вашій команді під SOP.' },
  { t: 'Recalibration', d: 'Повертаємось, коли зʼявляється новий розрив або рівень.' },
];

/** /what-we-build — не «послуги», а 4 стани: Diagnose → Build → Scale → Independence (розгорнуто). */
export function WhatWeBuild() {
  return (
    <>
      <PageHead
        kicker="Розділ · Що будуємо"
        title={<>Ми не радимо бізнеси.<br />Ми їх будуємо.</>}
        lead={<>Ви обираєте не «SEO / PPC / CRM», а <b>яку частину бізнесу</b> побудувати —
          і до якого стану довести: побачити → побудувати → масштабувати → зробити незалежним.</>}
      />

      <section className="wrap home-video">
        <VideoBlock title="Diagnose → Build → Scale → Independence" sub="Промо · що саме будує WEEXP" />
      </section>

      {/* DIAGNOSE */}
      <section id="diagnose" className="wwb-sec">
        <div className="wrap wwb-sec-in">
          <div className="wwb-sec-head">
            <span className="wwb-tag mono">SEE</span>
            <h2 className="wwb-h">Diagnose</h2>
            <p className="wwb-line">Побачити, що насправді відбувається — у грошах.</p>
          </div>
          <div className="wwb-flow">
            {DIAGNOSE.flow.map((f, i) => <span key={f} className="wwb-flow-step mono">{f}{i < DIAGNOSE.flow.length - 1 && <i>→</i>}</span>)}
          </div>
          <ul className="wwb-list">{DIAGNOSE.items.map((x) => <li key={x}>{x}</li>)}</ul>
          <Link to="/diagnose" className="wwb-cta mono">Знайти bottleneck →</Link>
        </div>
      </section>

      {/* BUILD */}
      <section id="build" className="wwb-sec wwb-sec--alt">
        <div className="wrap wwb-sec-in">
          <div className="wwb-sec-head">
            <span className="wwb-tag mono">BUILD</span>
            <h2 className="wwb-h">Build</h2>
            <p className="wwb-line">Перетворити діагноз на систему — трьома опорами.</p>
          </div>
          <div className="wwb-pillars">
            {BUILD.map((p) => (
              <article key={p.t} className="wwb-pillar" data-tilt="6">
                <h3 className="wwb-pillar-t">{p.t}</h3>
                <p className="wwb-pillar-d">{p.d}</p>
                <ul className="wwb-pillar-list">{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SCALE */}
      <section id="scale" className="wwb-sec">
        <div className="wrap wwb-sec-in">
          <div className="wwb-sec-head">
            <span className="wwb-tag mono">SCALE</span>
            <h2 className="wwb-h">Scale</h2>
            <p className="wwb-line">Змусити систему рости на власній основі.</p>
          </div>
          <div className="wwb-cards">
            {SCALE.map((s) => {
              const inner = (
                <>
                  <span className="wwb-card-t">{s.t}</span>
                  <span className="wwb-card-d">{s.d}</span>
                  {s.to && <span className="wwb-card-go mono">Детальніше →</span>}
                </>
              );
              return s.to
                ? <Link key={s.t} to={s.to} className="wwb-card wwb-card--link" data-tilt="7">{inner}</Link>
                : <div key={s.t} className="wwb-card" data-tilt="7">{inner}</div>;
            })}
          </div>
        </div>
      </section>

      {/* INDEPENDENCE */}
      <section id="independence" className="wwb-sec wwb-sec--alt">
        <div className="wrap wwb-sec-in">
          <div className="wwb-sec-head">
            <span className="wwb-tag mono">INDEPENDENCE</span>
            <h2 className="wwb-h">Independence</h2>
            <p className="wwb-line">Залишити систему працювати без вас — і піти.</p>
          </div>
          <div className="wwb-cards">
            {INDEPENDENCE.map((s) => {
              const inner = (
                <>
                  <span className="wwb-card-t">{s.t}</span>
                  <span className="wwb-card-d">{s.d}</span>
                  {s.to && <span className="wwb-card-go mono">Детальніше →</span>}
                </>
              );
              return s.to
                ? <Link key={s.t} to={s.to} className="wwb-card wwb-card--link" data-tilt="7">{inner}</Link>
                : <div key={s.t} className="wwb-card" data-tilt="7">{inner}</div>;
            })}
          </div>
        </div>
      </section>

      <section className="home-cta wrap">
        <div className="home-cta-in">
          <p className="home-cta-lead">Почніть із того, що видно в грошах — з діагнозу.</p>
          <div className="home-cta-row">
            <Link to="/diagnose" className="btn-primary mono">Діагностувати бізнес →</Link>
            <Link to="/cases" className="btn-ghost mono">Дивитись кейси →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
