import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { BusinessXray } from '@/components/BusinessXray';
import './diagnose.css';

const GET = [
  { k: 'Business Health', v: 'Оцінка 7 систем і 15 доменів бізнесу' },
  { k: 'Головний bottleneck', v: 'Вузьке місце, що тримає прибуток' },
  { k: 'Причинна карта', v: 'Де саме втрачаються гроші й чому' },
  { k: 'Розрив у грошах', v: 'Скільки коштує бездіяльність — щороку' },
  { k: 'Пріоритети', v: 'Що робити першим за впливом × зусиллям' },
  { k: 'Roadmap', v: 'План побудови системи хвилями під DoD' },
];

const HOW = [
  { n: '01', t: 'X-Ray', d: 'Ви проходите безкоштовний самодіагноз — 2 хвилини.' },
  { n: '02', t: 'Diagnosis', d: 'Ми занурюємось у CRM/ERP/GA4 і рахуємо розрив у грошах.' },
  { n: '03', t: 'Roadmap', d: 'Отримуєте Discovery Report і план під Definition of Done.' },
];

/** /diagnose — головна дія бренду: самодіагноз X-Ray + що дає повний Diagnosis. */
export function Diagnose() {
  return (
    <>
      <PageHead
        kicker="Дія · Діагностувати бізнес"
        title={<>Побачте, що<br />насправді відбувається</>}
        lead={<>Спочатку <b>діагноз</b>, потім будова. Пройдіть безкоштовний X-Ray — і побачите
          свій Independence Score та три найбільші розриви ще до розмови з нами.</>}
      />
      <section className="wrap"><BusinessXray /></section>

      <section className="wrap dg-get">
        <span className="page-kick">Що ви отримуєте у повному Diagnosis</span>
        <div className="dg-get-grid">
          {GET.map((g) => (
            <div key={g.k} className="dg-get-item">
              <span className="dg-get-k">{g.k}</span>
              <span className="dg-get-v">{g.v}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap dg-how">
        <span className="page-kick">Як це працює</span>
        <div className="dg-how-row">
          {HOW.map((h) => (
            <div key={h.n} className="dg-how-step">
              <span className="dg-how-n mono">{h.n}</span>
              <span className="dg-how-t">{h.t}</span>
              <span className="dg-how-d">{h.d}</span>
            </div>
          ))}
        </div>
        <div className="home-cta-row">
          <Link to="/contact" className="btn-primary mono">Подати заявку на Diagnosis →</Link>
          <Link to="/diagnose/full" className="btn-ghost mono">Повна діагностика (28 питань) →</Link>
          <Link to="/how-it-works/benchmark" className="btn-ghost mono">Бенчмарк проти ринку →</Link>
        </div>
      </section>
    </>
  );
}
