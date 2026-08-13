import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { CASES, STAGES, type Stage } from '@/data/cases';
import { SYSTEMS, systemByKey, type SystemKey } from '@/data/xray';
import { say, sayIdle } from '@/lib/bus';
import './cases-page.css';

/** /cases — портфель як трансформація. Фільтри за системою бізнесу і стадією. */
export function CasesPage() {
  const [sys, setSys] = useState<SystemKey | null>(null);
  const [st, setSt] = useState<Stage | null>(null);

  const list = useMemo(() => CASES.filter((c) =>
    (!sys || c.systems.includes(sys)) && (!st || c.stage === st)), [sys, st]);

  return (
    <>
      <PageHead
        kicker="Розділ · Кейси"
        title={<>Не портфоліо.<br />Трансформація бізнесу</>}
        lead={<>{CASES.length} історій за 7 системами бізнесу. Кожна — шлях <b>Before → Diagnosis → Money →
          Build → After → Independence → Learning</b>, зведений з CRM, ERP і GA4.</>}
      />

      <section className="wrap case-filters">
        <div className="cf-group">
          <span className="cf-lab mono">Система</span>
          <div className="cf-chips mono">
            <button className={!sys ? 'is-on' : ''} onClick={() => setSys(null)}>Усі</button>
            {SYSTEMS.map((s) => (
              <button key={s.key} className={sys === s.key ? 'is-on' : ''} onClick={() => setSys(sys === s.key ? null : s.key)}>
                {s.num}·{s.title}
              </button>
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
              <span className="caselist-sys mono">{c.systems.map((k) => systemByKey(k).title).join(' · ')}</span>
            </span>
            <span className="caselist-go mono">Дивитись →</span>
          </Link>
        ))}
      </section>
    </>
  );
}
