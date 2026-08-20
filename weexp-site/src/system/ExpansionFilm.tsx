import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import { band, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import { PartnerMarquee } from '@/system/PartnerMarquee';
import './system.css';

/**
 * WEEXP — EXPANSION ENGINE (/expansion). Не один кейс, а системний вивід
 * e-commerce на міжнародні ринки. Скрол-сценарій із 8 актів над інтерактивною
 * картою Європи: Україна «розкривається» на ринки в порядку ТЗ §8
 * (UA → PL → DE → CZ → RO → FR → IT → ES → ЄС). Кожен акт — крок Engine:
 * старт → вибір ринку → перший ринок → інфраструктура → запуск → оптимізація
 * → масштаб → наступні країни. Зберігаємо дизайн-систему сайту.
 */

// Вузли-ринки в порядку експансії (перший — Україна-джерело). Координати —
// схематична Європа у viewBox 0..100 × 0..66.
const NODES = [
  { id: 'ua', code: 'UA', name: 'Україна', x: 82, y: 38 },
  { id: 'pl', code: 'PL', name: 'Польща', x: 64, y: 27 },
  { id: 'de', code: 'DE', name: 'Німеччина', x: 49, y: 27 },
  { id: 'cz', code: 'CZ', name: 'Чехія', x: 57, y: 34 },
  { id: 'ro', code: 'RO', name: 'Румунія', x: 72, y: 46 },
  { id: 'fr', code: 'FR', name: 'Франція', x: 37, y: 40 },
  { id: 'it', code: 'IT', name: 'Італія', x: 53, y: 50 },
  { id: 'es', code: 'ES', name: 'Іспанія', x: 26, y: 54 },
];
const UA = NODES[0];
const EDGES = NODES.slice(1); // промені Україна → ринок (у порядку §8)

type Act = { n: string; tag: string; title: string; lead: string; upto: number; points?: string[]; layers?: string[] };

// Скрол-банди актів (частка прогресу секції).
const A_START = 0.10, A_END = 0.92, ACTS_LEN = 8, A_W = (A_END - A_START) / ACTS_LEN;

export function ExpansionFilm() {
  const t = useT();
  const lp = useLp();
  const ACTS: Act[] = [
    { n: '01', tag: t('Старт', 'Start'), title: t('Україна', 'Ukraine'), upto: 0,
      lead: t('Вихідний стан: traction вдома, готовий продукт, операції, що витримають другий контур.', 'Starting point: traction at home, a ready product, operations that can carry a second front.'),
      points: [t('Оборот і маржа на домашньому ринку', 'Turnover and margin on the home market'), t('Готовність продукту до експорту', 'Product readiness for export'), t('Запас операцій і ресурсу на 6–12 міс', 'Operational and resource runway for 6–12 months')] },
    { n: '02', tag: t('Вибір ринку', 'Market selection'), title: t('Куди йти', 'Where to go'), upto: 0,
      lead: t('Оцінюємо привабливість ринку за даними, а не «подобається».', 'We assess market attractiveness by data, not by “gut feel”.'),
      points: [t('Попит і розмір категорії', 'Demand and category size'), t('Конкуренція й насиченість', 'Competition and saturation'), t('CAC і юніт-економіка ринку', 'CAC and market unit economics'), t('Логістика й penetration marketplaces', 'Logistics and marketplace penetration'), t('Legal і payment-середовище', 'Legal and payment environment')] },
    { n: '03', tag: t('Перший ринок', 'First market'), title: t('Україна → Польща', 'Ukraine → Poland'), upto: 1,
      lead: t('Перший ринок ЄС — часто Польща: Allegro, близькість, хаб CEE. Далі — DE, CZ.', 'The first EU market is often Poland: Allegro, proximity, the CEE hub. Then DE, CZ.'),
      points: [t('Точка входу в ЄС через регіон CEE', 'Entry point into the EU via the CEE region'), t('Allegro як швидкий канал попиту', 'Allegro as a fast demand channel'), t('База для сусідніх ринків', 'A base for neighbouring markets')] },
    { n: '04', tag: t('Інфраструктура', 'Infrastructure'), title: t('Будуємо контур', 'We build the setup'), upto: 1,
      lead: t('Міжнародний бізнес — це інфраструктура, а не «залити товар на маркетплейс».', 'International business is infrastructure, not “dumping product onto a marketplace”.'),
      layers: [t('Юрособа', 'Legal entity'), t('Податки · VAT/OSS', 'Taxes · VAT/OSS'), t('Склад', 'Warehouse'), 'Logistics', 'Fulfillment', 'Payments', 'Marketplaces', 'Website', t('Локалізація', 'Localization'), 'Customer support', 'Marketing', 'CRM', 'Analytics'] },
    { n: '05', tag: t('Запуск', 'Launch'), title: t('Запуск продажів', 'Sales launch'), upto: 1,
      lead: t('Вмикаємо канали й отримуємо перші результати ринку.', 'We switch on the channels and get the market’s first results.'),
      points: [t('Лістинги, контент, ціни', 'Listings, content, pricing'), t('Перший платний і органічний трафік', 'First paid and organic traffic'), t('Перші замовлення й зворотний звʼязок', 'First orders and feedback')] },
    { n: '06', tag: t('Оптимізація', 'Optimization'), title: t('Доводимо до економіки', 'We drive it to profitability'), upto: 1,
      lead: t('Робимо ринок прибутковим, а не просто «присутнім».', 'We make the market profitable, not merely “present”.'),
      points: [t('Конверсія й реклама', 'Conversion and advertising'), t('Асортимент і ціни', 'Assortment and pricing'), t('Логістика й повернення', 'Logistics and returns'), 'CRM · retention', t('Юніт-економіка ринку', 'Market unit economics')] },
    { n: '07', tag: t('Масштаб', 'Scale'), title: t('Один ринок → система', 'One market → a system'), upto: 3,
      lead: t('Відпрацьований плейбук переносимо на наступні ринки — спільна інфраструктура.', 'We carry the proven playbook to the next markets — shared infrastructure.'),
      points: [t('Повторюваний запуск', 'A repeatable launch'), t('Єдина інфраструктура на кілька ринків', 'One infrastructure across several markets'), t('Керований міжнародний P&L', 'A managed international P&L')] },
    { n: '08', tag: t('Наступні країни', 'Next countries'), title: t('Європа як система', 'Europe as a system'), upto: 7,
      lead: t('Україна → Польща → Німеччина → Чехія → Румунія → Франція → Італія → Іспанія → ЄС.', 'Ukraine → Poland → Germany → Czechia → Romania → France → Italy → Spain → EU.'),
      points: [t('Мультиринковий контур', 'A multi-market setup'), t('Єдині дані й бренд', 'Unified data and brand'), t('Міжнародна e-commerce система', 'An international e-commerce system')] },
  ];

  const sec = useRef<HTMLElement>(null);
  const actEls = useRef<(HTMLDivElement | null)[]>([]);
  const edgeEls = useRef<(SVGLineElement | null)[]>([]);
  const nodeEls = useRef<(SVGGElement | null)[]>([]);
  const outro = useRef<HTMLDivElement>(null);
  const railEls = useRef<(HTMLButtonElement | null)[]>([]);

  // Скрол → карта + акти. reach = скільки ринків уже «розкрито» (0..7).
  useScrollScene(sec, (p, reduce) => {
    // видимість актів
    let activeIdx = 0;
    for (let i = 0; i < ACTS.length; i++) {
      const a = A_START + i * A_W;
      const o = reduce ? 1 : seg(p, a - 0.005, a + 0.02, a + A_W - 0.02, a + A_W - 0.002);
      const el = actEls.current[i]; if (el) el.style.opacity = String(o);
      if (!reduce && p >= a && p < a + A_W) activeIdx = i;
    }
    set(outro.current, reduce ? 1 : seg(p, 0.93, 0.965, 1.1, 1.2));

    // «розкриття» ринків: до якого номера дійшли (за act.upto активного акту)
    const reach = reduce ? EDGES.length : ACTS[activeIdx].upto;
    for (let i = 0; i < EDGES.length; i++) {
      const on = i < reach || reduce;
      const line = edgeEls.current[i];
      if (line) { line.style.opacity = on ? '1' : '0.08'; line.classList.toggle('is-on', on); }
      const node = nodeEls.current[i + 1];
      if (node) node.classList.toggle('is-lit', on);
    }
    // Україна завжди активна; активний акт підсвічує рейку
    nodeEls.current[0]?.classList.add('is-lit');
    railEls.current.forEach((r, i) => r?.classList.toggle('is-on', i === activeIdx));
  });

  const jump = (i: number) => {
    const el = sec.current; if (!el) return;
    const top = el.offsetTop + (A_START + i * A_W + A_W * 0.4) * (el.offsetHeight - innerHeight);
    scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <section ref={sec} className="sysx sysx-film sysx-expansion" aria-label="WEEXP — Expansion Engine">
      <div className="sysx-stage">
        <span className="sysx-field" aria-hidden="true" />

        {/* КАРТА ЄВРОПИ — постійний візуальний якір */}
        <div className="xpe-map" aria-hidden="true">
          <svg viewBox="0 0 100 66" className="xpe-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="xpeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(126,157,255,.22)" /><stop offset="100%" stopColor="rgba(126,157,255,0)" />
              </radialGradient>
            </defs>
            <ellipse cx={50} cy={34} rx={46} ry={30} fill="url(#xpeGlow)" />
            {/* промені Україна → ринок */}
            {EDGES.map((e, i) => (
              <line key={e.id} ref={(el) => { edgeEls.current[i] = el; }} className="xpe-edge"
                x1={UA.x} y1={UA.y} x2={e.x} y2={e.y} />
            ))}
            {/* вузли */}
            {NODES.map((nd, i) => (
              <g key={nd.id} ref={(el) => { nodeEls.current[i] = el; }} className={'xpe-node' + (i === 0 ? ' is-src' : '')}>
                <circle className="xpe-node-hit" cx={nd.x} cy={nd.y} r={4.4} />
                <circle className="xpe-node-dot" cx={nd.x} cy={nd.y} r={i === 0 ? 2.4 : 1.9} />
                <text className="xpe-node-t" x={nd.x} y={nd.y - 3.4} textAnchor="middle">{nd.code}</text>
              </g>
            ))}
          </svg>
          <span className="xpe-map-cap mono">{t('Україна → ЄС · один контур', 'Ukraine → EU · one setup')}</span>
        </div>

        {/* Рейка актів (навігація) */}
        <div className="xpe-rail" role="tablist" aria-label={t('Кроки Expansion Engine', 'Expansion Engine steps')}>
          {ACTS.map((a, i) => (
            <button key={a.n} ref={(el) => { railEls.current[i] = el; }} className="xpe-tick" onClick={() => jump(i)} title={a.title}>
              <b className="mono">{a.n}</b><span>{a.tag}</span>
            </button>
          ))}
        </div>

        {/* Інтро-заголовок Engine (перший акт) */}
        <div className="xpe-title">
          <div className="sysx-kick">{t('WEEXP · Expansion Engine · ЄС + США', 'WEEXP · Expansion Engine · EU + US')}</div>
          <h1 className="sysx-display xpe-h1">{t('Не вихід на ринок —', 'Not a market entry —')}<br /><span className="sysx-em">{t('двигун експансії', 'an expansion engine')}</span></h1>
        </div>

        {/* АКТИ */}
        {ACTS.map((a, i) => (
          <div key={a.n} ref={(el) => { actEls.current[i] = el; }} className="xpe-act" style={{ opacity: 0 }}>
            <div className="xpe-act-in">
              <span className="xpe-act-tag mono"><i>{a.n}</i> {a.tag}</span>
              <h2 className="sysx-display xpe-act-h">{a.title}</h2>
              <p className="xpe-act-lead">{a.lead}</p>
              {a.points && <ul className="xpe-act-points">{a.points.map((x) => <li key={x}>{x}</li>)}</ul>}
              {a.layers && (
                <div className="xpe-layers">
                  {a.layers.map((l, k) => <span key={l} className="xpe-layer mono" style={{ '--k': k } as React.CSSProperties}>{l}</span>)}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* OUTRO CTA */}
        <div ref={outro} className="sysx-scene sysx-ctaScene">
          <div className="sysx-kick">Expansion Engine</div>
          <h2 className="sysx-display sysx-h2">{t('Наступний ринок', 'The next market')}<br />{t('запускаємо як ', 'we launch as a ')}<span className="sysx-em">{t('систему', 'system')}</span>.</h2>
          <p className="sysx-lead">{t('Почнімо з оцінки готовності: чи витримує ваша економіка вихід у ЄС/США — і з якого ринку та вітрини стартувати.', 'Let’s start with a readiness check: whether your economics can carry a launch into the EU/US — and which market and storefront to start from.')}</p>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Оцінити готовність до експансії →', 'Assess expansion readiness →')}</Link>
            <Link to={lp('/proof')} className="sysx-cta">{t('Кейси експансії', 'Expansion cases')}</Link>
          </div>
        </div>

        <PartnerMarquee />
      </div>
    </section>
  );
}
