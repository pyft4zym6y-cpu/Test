import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { CASES, CHALLENGES, STAGES, type Challenge, type Stage } from '@/data/cases';
import { say, sayIdle } from '@/lib/bus';
import './cases-page.css';

/** /cases — портфель як BUSINESS TRANSFORMATION. Фільтри за проблемою і стадією. */
export function CasesPage() {
  const [ch, setCh] = useState<Challenge | null>(null);
  const [st, setSt] = useState<Stage | null>(null);

  const list = useMemo(() => CASES.filter((c) =>
    (!ch || c.challenges.includes(ch)) && (!st || c.stage === st)), [ch, st]);

  return (
    <>
      <PageHead
        kicker="Розділ · Cases"
        title={<>Не портфоліо.<br />Трансформація бізнесу</>}
        lead={<>Кожен кейс — це не «клієнт → логотип», а шлях <b>Before → Diagnosis → Money → Build →
          After → Independence → Learning</b>. Зведено з CRM, ERP і GA4.</>}
      />

      <section className="wrap case-filters">
        <div className="cf-group">
          <span className="cf-lab mono">Проблема</span>
          <div className="cf-chips mono">
            <button className={!ch ? 'is-on' : ''} onClick={() => setCh(null)}>Усі</button>
            {CHALLENGES.map((c) => (
              <button key={c} className={ch === c ? 'is-on' : ''} onClick={() => setCh(ch === c ? null : c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="cf-group">
          <span className="cf-lab mono">Стадія</span>
          <div className="cf-chips mono">
            <button className={!st ? 'is-on' : ''} onClick={() => setSt(null)}>Усі</button>
            {STAGES.map((s) => (
              <button key={s} className={st === s ? 'is-on' : ''} onClick={() => setSt(st === s ? null : s)}>{s}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap caselist">
        {list.length === 0 && <p className="caselist-empty mono">За цим фільтром кейсів поки немає.</p>}
        {list.map((c) => (
          <Link key={c.slug} to={`/cases/${c.slug}`} className="caselist-row"
            onMouseEnter={() => say(`${c.name}: ${c.hero} — ${c.heroLabel}.`)} onMouseLeave={() => sayIdle()}>
            <span className="caselist-cat mono">{c.cat}</span>
            <span className="caselist-hero">{c.hero}</span>
            <span className="caselist-body">
              <span className="caselist-name">{c.name}</span>
              <span className="caselist-lead">{c.lead}</span>
            </span>
            <span className="caselist-go mono">Дивитись →</span>
          </Link>
        ))}
      </section>
    </>
  );
}
