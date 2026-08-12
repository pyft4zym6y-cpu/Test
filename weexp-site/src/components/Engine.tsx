import { Eyebrow, FadeIn, CountUp } from '@/lib/primitives';
import './engine.css';

/** Commerce OS — ядро (12/56/52/18) + бегущая строка брендов. Content spine старого сайта. */
const NUMBERS = [
  { to: 12, label: 'модулів', sub: 'M01–M12' },
  { to: 56, label: 'плейбуків', sub: 'по 9 секцій кожен' },
  { to: 52, label: 'еталони', sub: 'Gold Standards' },
  { to: 18, label: 'доменів', sub: 'наскрізна система' },
];
const BRANDS = ['Henkel', 'SC Johnson', 'Kimberly-Clark', 'Schwarzkopf', 'J&J', 'NYX', 'Missha', 'Watsons', 'Rozetka', 'Kasta', 'Lamoda', 'MAKEUP', 'Amazon', 'Epicentr'];

export function Engine() {
  return (
    <section className="engine">
      <div className="wrap">
        <FadeIn><Eyebrow>Рішення · власна методологія</Eyebrow></FadeIn>
        <FadeIn delay={0.05}><h2 className="engine-h">Commerce&nbsp;OS™ — операційна система росту</h2></FadeIn>
        <FadeIn delay={0.1}><p className="engine-lead">Не набір послуг, а один рушій: діагностика в грошах, плейбуки виконання і еталони, за якими зростання стає повторюваним.</p></FadeIn>
        <div className="engine-nums">
          {NUMBERS.map((n, i) => (
            <FadeIn key={i} delay={0.12 + i * 0.08}>
              <div className="en-num">
                <div className="en-v"><CountUp to={n.to} /></div>
                <div className="en-l">{n.label}</div>
                <div className="en-s mono">{n.sub}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
      <FadeIn delay={0.1}>
        <div className="marquee" aria-label="Бренди й ринки, з якими ми працювали">
          <div className="marquee-track">
            {[...BRANDS, ...BRANDS].map((b, i) => <span className="mq-chip mono" key={i}>{b}</span>)}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
