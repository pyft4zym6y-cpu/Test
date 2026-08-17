import { useRef } from 'react';
import { Link } from 'react-router-dom';
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
const ACTS: Act[] = [
  { n: '01', tag: 'Старт', title: 'Україна', upto: 0,
    lead: 'Вихідний стан: traction вдома, готовий продукт, операції, що витримають другий контур.',
    points: ['Оборот і маржа на домашньому ринку', 'Готовність продукту до експорту', 'Запас операцій і ресурсу на 6–12 міс'] },
  { n: '02', tag: 'Вибір ринку', title: 'Куди йти', upto: 0,
    lead: 'Оцінюємо привабливість ринку за даними, а не «подобається».',
    points: ['Попит і розмір категорії', 'Конкуренція й насиченість', 'CAC і юніт-економіка ринку', 'Логістика й penetration marketplaces', 'Legal і payment-середовище'] },
  { n: '03', tag: 'Перший ринок', title: 'Україна → Польща', upto: 1,
    lead: 'Перший ринок ЄС — часто Польща: Allegro, близькість, хаб CEE. Далі — DE, CZ.',
    points: ['Точка входу в ЄС через регіон CEE', 'Allegro як швидкий канал попиту', 'База для сусідніх ринків'] },
  { n: '04', tag: 'Інфраструктура', title: 'Будуємо контур', upto: 1,
    lead: 'Міжнародний бізнес — це інфраструктура, а не «залити товар на маркетплейс».',
    layers: ['Юрособа', 'Податки · VAT/OSS', 'Склад', 'Logistics', 'Fulfillment', 'Payments', 'Marketplaces', 'Website', 'Локалізація', 'Customer support', 'Marketing', 'CRM', 'Analytics'] },
  { n: '05', tag: 'Запуск', title: 'Запуск продажів', upto: 1,
    lead: 'Вмикаємо канали й отримуємо перші результати ринку.',
    points: ['Лістинги, контент, ціни', 'Перший платний і органічний трафік', 'Перші замовлення й зворотний звʼязок'] },
  { n: '06', tag: 'Оптимізація', title: 'Доводимо до економіки', upto: 1,
    lead: 'Робимо ринок прибутковим, а не просто «присутнім».',
    points: ['Конверсія й реклама', 'Асортимент і ціни', 'Логістика й повернення', 'CRM · retention', 'Юніт-економіка ринку'] },
  { n: '07', tag: 'Масштаб', title: 'Один ринок → система', upto: 3,
    lead: 'Відпрацьований плейбук переносимо на наступні ринки — спільна інфраструктура.',
    points: ['Повторюваний запуск', 'Єдина інфраструктура на кілька ринків', 'Керований міжнародний P&L'] },
  { n: '08', tag: 'Наступні країни', title: 'Європа як система', upto: 7,
    lead: 'Україна → Польща → Німеччина → Чехія → Румунія → Франція → Італія → Іспанія → ЄС.',
    points: ['Мультиринковий контур', 'Єдині дані й бренд', 'Міжнародна e-commerce система'] },
];

// Скрол-банди актів (частка прогресу секції).
const A_START = 0.10, A_END = 0.92, A_W = (A_END - A_START) / ACTS.length;

export function ExpansionFilm() {
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
          <span className="xpe-map-cap mono">Україна → ЄС · один контур</span>
        </div>

        {/* Рейка актів (навігація) */}
        <div className="xpe-rail" role="tablist" aria-label="Кроки Expansion Engine">
          {ACTS.map((a, i) => (
            <button key={a.n} ref={(el) => { railEls.current[i] = el; }} className="xpe-tick" onClick={() => jump(i)} title={a.title}>
              <b className="mono">{a.n}</b><span>{a.tag}</span>
            </button>
          ))}
        </div>

        {/* Інтро-заголовок Engine (перший акт) */}
        <div className="xpe-title">
          <div className="sysx-kick">WEEXP · Expansion Engine · ЄС + США</div>
          <h1 className="sysx-display xpe-h1">Не вихід на ринок —<br /><span className="sysx-em">двигун експансії</span></h1>
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
          <h2 className="sysx-display sysx-h2">Наступний ринок<br />запускаємо як <span className="sysx-em">систему</span>.</h2>
          <p className="sysx-lead">Почнімо з оцінки готовності: чи витримує ваша економіка вихід у ЄС/США — і з якого ринку та вітрини стартувати.</p>
          <div className="sysx-cta-row">
            <Link to="/diagnose" className="sysx-cta is-primary">Оцінити готовність до експансії →</Link>
            <Link to="/proof" className="sysx-cta">Кейси експансії</Link>
          </div>
        </div>

        <PartnerMarquee />
      </div>
    </section>
  );
}
