import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { CASES } from '@/data/cases';
import { say, sayIdle } from '@/lib/bus';
import './cases-page.css';

/** /cases — портфель: три завершені кейси і діюча програма. Кожна картка → деталь. */
export function CasesPage() {
  return (
    <>
      <PageHead
        kicker="Розділ · Кейси"
        title={<>Результат — <br />не подія, а система</>}
        lead={<>Три завершені кейси і одна діюча програма росту. Кожна цифра зведена з <b>CRM, ERP і GA4</b>.</>}
      />
      <section className="wrap caselist">
        {CASES.map((c) => (
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
