import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import './intelligence.css';

const STREAMS = [
  { k: 'Insights', d: 'Короткі аналітичні матеріали про механіку e-commerce.', note: 'публікуємо' },
  { k: 'Reports', d: 'Глибокі дослідження ринку й бенчмарки сегментів.', note: 'у роботі' },
  { k: 'Benchmark', d: 'Дані: де стоїть ваш e-commerce відносно норми.', note: 'у роботі' },
  { k: 'WEEXP POV', d: 'Позиція компанії: у що ми віримо і чому.', note: 'публікуємо' },
  { k: 'Founder POV', d: 'Позиція Павла: як він думає про майбутнє e-commerce.', note: 'публікуємо' },
];

const POV = [
  '01 · Ми ставимо діагноз у грошах.',
  '02 · Ми будуємо, а не радимо.',
  '03 · Ми вимірюємо зміну стану.',
  '04 · Ми будуємо так, щоб піти.',
];

/** /intelligence — те, що відрізняє WEEXP від агентства: власний інтелектуальний капітал. */
export function Intelligence() {
  return (
    <>
      <PageHead
        kicker="Розділ · Intelligence"
        title={<>WEEXP<br />Intelligence</>}
        lead={<>Кожен клієнт робить систему WEEXP розумнішою. Тут ми повертаємо це ринку —
          <b> дані, позиція, бенчмарки</b>. Це не блог, це knowledge flywheel.</>}
      />
      <section className="wrap intel-streams">
        {STREAMS.map((s) => (
          <div key={s.k} className="intel-stream">
            <span className="intel-stream-k">{s.k}</span>
            <span className="intel-stream-d">{s.d}</span>
            <span className="intel-stream-note mono">{s.note}</span>
          </div>
        ))}
      </section>
      <section className="wrap intel-pov">
        <span className="page-kick">WEEXP Point of View</span>
        <div className="intel-pov-grid">
          {POV.map((p) => <div key={p} className="intel-pov-item">{p}</div>)}
        </div>
        <div className="home-cta-row">
          <Link to="/diagnose" className="btn-primary mono">Перевірити свій бізнес →</Link>
          <Link to="/cases" className="btn-ghost mono">Докази в кейсах →</Link>
        </div>
      </section>
    </>
  );
}
