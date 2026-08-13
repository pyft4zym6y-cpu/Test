import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { Engine } from '@/components/Engine';
import { Flywheel } from '@/components/Flywheel';

const STATES = [
  { id: 'diagnose', tag: 'SEE', h: 'Diagnose', line: 'Побачити, що насправді відбувається.',
    items: ['Business Health по 18 доменах', 'Benchmark проти норми сегмента', 'Причинна карта втрат', 'Розрив у грошах і пріоритети'] },
  { id: 'build', tag: 'BUILD', h: 'Build', line: 'Перетворити діагноз на систему.',
    items: ['Commerce Function: департамент, команда, P&L, governance', 'Commerce Infrastructure: платформа, CRM, аналітика, ERP, маркетплейси', 'Growth System: залучення, конверсія, утримання, ціни, асортимент'] },
  { id: 'scale', tag: 'SCALE', h: 'Scale', line: 'Змусити систему рости.',
    items: ['Вихід у ЄС і нові ринки', 'Маркетплейси й omnichannel', 'AI та автоматизація', 'Нові бізнес-моделі'] },
  { id: 'independence', tag: 'INDEPENDENCE', h: 'Independence', line: 'Залишити систему працювати без вас.',
    items: ['Independence Score як KPI передачі', 'Handoff операційного керування', 'Рекалібрування без щоденної участі власника'] },
];

/** /what-we-build — не «послуги», а чотири стани: Diagnose → Build → Scale → Independence. */
export function WhatWeBuild() {
  return (
    <>
      <PageHead
        kicker="Розділ · What we build"
        title={<>Ми не радимо бізнеси.<br />Ми їх будуємо.</>}
        lead={<>Ви обираєте не «SEO / PPC / CRM», а <b>яку частину бізнесу</b> ми маємо побудувати —
          і до якого стану довести.</>}
      />
      <section className="wrap wb-states">
        {STATES.map((s) => (
          <article key={s.id} id={s.id} className="wb-state">
            <div className="wb-state-head">
              <span className="wb-state-tag mono">{s.tag}</span>
              <h2 className="wb-state-h">{s.h}</h2>
              <p className="wb-state-line">{s.line}</p>
            </div>
            <ul className="wb-state-list">
              {s.items.map((it) => <li key={it}>{it}</li>)}
            </ul>
          </article>
        ))}
      </section>
      <section id="system"><Engine /></section>
      <Flywheel />
      <section className="home-cta wrap">
        <div className="home-cta-in">
          <p className="home-cta-lead">Почніть із того, що видно в грошах — з діагнозу.</p>
          <div className="home-cta-row">
            <Link to="/diagnose" className="btn-primary mono">Діагностувати бізнес →</Link>
            <Link to="/how-it-works" className="btn-ghost mono">Як ми будуємо →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
