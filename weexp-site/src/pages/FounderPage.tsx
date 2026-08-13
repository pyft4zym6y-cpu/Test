import { Link } from 'react-router-dom';
import { CountUp } from '@/lib/primitives';
import { VideoBlock } from '@/components/VideoBlock';
import './founder-page.css';

const TRACK = [
  { n: 8, suf: '+', l: 'років у міжнародному e-commerce' },
  { n: 14, suf: '', l: 'країн: US · EU · MENA' },
  { n: 250, pre: 'TOP-', l: 'бренди Forbes UA у портфелі' },
  { n: 18, pre: '×', l: 'оборот у флагманському кейсі' },
];

const PATH = [
  { y: 'Практик', d: 'Будував e-commerce зсередини — для брендів Forbes TOP-250, з виходом на 14 країн.' },
  { y: 'Архітектор', d: 'Побачив, що результат тримається на людях, а не на системі. Почав описувати систему.' },
  { y: 'WEEXP', d: 'Перетворив досвід на метод: діагноз у грошах → побудова → незалежність. І команду, що його виконує.' },
];

const PRINCIPLES = [
  'Діагноз — завжди у грошах, а не у відчуттях.',
  'Ми будуємо так, щоб піти: залежність від нас — це провал.',
  'Правда дорожча за комфорт. Іноді відповідь — «вам це не потрібно».',
  'Активність ≠ результат. Вимірюємо зміну стану, а не зайнятість.',
];

const LAYERS = [
  { k: 'BUILD', t: 'Що побудував', d: 'E-commerce для брендів Forbes TOP-250 UA, вихід на 14 країн, кейси з обігом до €900K і ×18 за 18 місяців. 8+ років у міжнародному e-commerce (US, EU, MENA).' },
  { k: 'THINK', t: 'Як думає', d: 'Бізнес має працювати як система, а не триматися на герої. Діагноз — у грошах. Найдорожча помилка — плутати активність із результатом.' },
  { k: 'CHALLENGE', t: 'З чим не згоден', d: '«Більше бюджету → більше продажів» — міф. Купувати увагу без системи означає щоразу купувати клієнта наново. Правда дорожча за комфорт.' },
  { k: 'FUTURE', t: 'Яким бачить e-commerce', d: 'Незалежні бізнеси, що вимірюють зрілість через Independence Score, а не лише оборот. Стандарт незалежності — майбутня категорія ринку.' },
];

/** /about/founder — Павло як автор смислу, але не єдине джерело цінності. BUILD/THINK/CHALLENGE/FUTURE. */
export function FounderPage() {
  return (
    <article className="fp">
      <header className="page-head">
        <div className="wrap">
          <span className="page-kick">Founder & Architect of WEEXP</span>
          <h1 className="fp-quote">Я будую бізнеси, які можуть<br />працювати без героя.</h1>
          <p className="page-lead"><b>Павло Сидоренко</b> — архітектор, що перетворив досвід у міжнародному
            e-commerce на систему. WEEXP доводить — Павло пояснює.</p>
        </div>
      </header>

      <section className="wrap home-video">
        <VideoBlock title="Павло Сидоренко — засновник WEEXP" sub="Промо · автор системи, а не єдине джерело цінності"
          src="/promo/founder.mp4" poster="/promo/founder-poster.jpg" />
      </section>

      <section className="wrap fp-track">
        {TRACK.map((t) => (
          <div key={t.l} className="fp-track-item">
            <span className="fp-track-num">{t.pre}<CountUp to={t.n} />{t.suf}</span>
            <span className="fp-track-l">{t.l}</span>
          </div>
        ))}
      </section>

      <section className="wrap fp-bio">
        <p className="fp-bio-text">Понад 8 років у міжнародному e-commerce навчили головного: <b>виручка не дорівнює
          прибутку, а зростання не дорівнює системі</b>. Найсильніші бренди спотикались не об трафік, а об операції,
          дані й організацію. Так зʼявився метод WEEXP — і команда, яка бере відповідальність за систему цілком.</p>
        <div className="fp-path">
          {PATH.map((p, i) => (
            <div key={p.y} className="fp-path-step">
              <span className="fp-path-n mono">0{i + 1}</span>
              <span className="fp-path-y">{p.y}</span>
              <span className="fp-path-d">{p.d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap fp-principles">
        <span className="page-kick">Принципи</span>
        <div className="fp-principles-list">
          {PRINCIPLES.map((p) => <div key={p} className="fp-principle">{p}</div>)}
        </div>
      </section>

      <section className="wrap fp-layers">
        {LAYERS.map((l) => (
          <div key={l.k} className="fp-layer">
            <span className="fp-layer-k mono">{l.k}</span>
            <div className="fp-layer-body">
              <span className="fp-layer-t">{l.t}</span>
              <p className="fp-layer-d">{l.d}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="wrap fp-contact">
        <p className="fp-contact-lead">Павло — автор системи, а не сама система. Цінність WEEXP — у команді й методі.</p>
        <div className="home-cta-row">
          <a href="https://www.linkedin.com/in/pvsidorenko" target="_blank" rel="noopener noreferrer" className="btn-ghost mono">LinkedIn →</a>
          <Link to="/about/team" className="btn-ghost mono">Команда →</Link>
          <Link to="/diagnose" className="btn-primary mono">Діагностувати бізнес →</Link>
        </div>
      </section>
    </article>
  );
}
