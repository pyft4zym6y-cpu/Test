import { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { band, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import { PartnerMarquee } from '@/system/PartnerMarquee';
import './system.css';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));

/**
 * WEEXP — INTERNATIONAL EXPANSION (/expansion). Окремо підсвічуємо системний
 * вивід брендів на ринки ЄС і США: не «ще один канал», а окремий бізнес-контур
 * на всіх вітринах ринку — власний сайт, Amazon, Allegro, eBay, локальні
 * майданчики. Той самий зібраний об'єкт як тло. Драматургія:
 * INTRO → ВІТРИНИ РИНКУ → ЩО БУДУЄМО (+ готовність) → CTA з числом кейсу.
 */
const CHANNELS: { name: string; d: string }[] = [
  { name: 'Власний сайт', d: 'Локалізована вітрина: мова, валюта, оплата, доставка й повернення під ринок.' },
  { name: 'Amazon (EU + US)', d: 'Лістинги й контент, FBA-логістика, Buy Box, PPC-реклама на двох континентах.' },
  { name: 'Allegro', d: 'Провідний маркетплейс Польщі — вхід у ЄС через регіон CEE.' },
  { name: 'eBay', d: 'Крос-бордер продажі на ринки ЄС і США.' },
  { name: 'Kaufland · Bol · Cdiscount', d: 'Локальні лідери DE / NL / FR — там, де вже є попит.' },
  { name: 'Etsy', d: 'Ніша дизайн / hand-made — прямий вихід на US-попит.' },
  { name: 'TikTok Shop', d: 'Соціальна комерція ЄС/США — попит, який росте найшвидше.' },
  { name: 'Google Shopping · Meta', d: 'Платний і органічний трафік під новий ринок, з першого дня.' },
];
const BUILD: { t: string; d: string }[] = [
  { t: 'Локалізація й логістика', d: 'Мова, валюта, оплата, доставка й повернення під кожен ринок ЄС/США.' },
  { t: 'Юридичний контур', d: 'Юрособа, податки (VAT / sales tax), EPR, комплаєнс і договори.' },
  { t: 'Маркетплейси й попит', d: 'Amazon, Allegro, локальні майданчики, органіка й бренд у новій країні.' },
  { t: 'Бренд і попит на ринку', d: 'Локальний маркетинг, органіка й контент — вас знаходять і впізнають.' },
  { t: 'Юніт-економіка ринку', d: 'Окремий P&L: маржа виживає після мит, логістики й реклами.' },
];
// «Під ключ» — систематичний шлях від готовності до масштабування (рівень, який очікують від світового партнера).
const PROCESS: { n: string; t: string }[] = [
  { n: '01', t: 'Аудит готовності й економіки' },
  { n: '02', t: 'Вибір ринку та вітрин' },
  { n: '03', t: 'Локалізація + юридика' },
  { n: '04', t: 'Запуск на всіх вітринах' },
  { n: '05', t: 'Масштабування й бренд' },
];
const READY = [
  'є traction на домашньому ринку',
  'продукт готовий під експорт',
  'операції витримують другий контур',
  'є ресурс на 6–12 місяців побудови',
];

export function ExpansionFilm() {
  const sec = useRef<HTMLElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const channels = useRef<HTMLDivElement>(null);
  const build = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);

  useScrollScene(sec, (p, reduce) => {
    set(intro.current, reduce ? 1 : seg(p, -1, 0, 0.08, 0.14), `translateY(${((1 - band(p, 0, 0.08)) * -3).toFixed(1)}vh)`);
    set(channels.current, reduce ? 1 : seg(p, 0.16, 0.23, 0.38, 0.44), `translateY(${((1 - seg(p, 0.16, 0.24, 0.38, 0.44)) * 2).toFixed(1)}vh)`);
    set(build.current, reduce ? 1 : seg(p, 0.46, 0.53, 0.72, 0.78));
    set(outro.current, reduce ? 1 : seg(p, 0.80, 0.87, 1.1, 1.2));
  });

  return (
    <>
    <section ref={sec} className="sysx sysx-film sysx-expansion" aria-label="WEEXP — міжнародна експансія">
      <div className="sysx-stage">
        <span className="sysx-field" aria-hidden="true" />
        <div className="pf-bg"><Suspense fallback={null}><CommerceSystem3D fixedProgress={0.6} /></Suspense></div>

        {/* INTRO */}
        <div ref={intro} className="sysx-scene sysx-void">
          <div className="sysx-kick">Scale · Міжнародна експансія · ЄС + США</div>
          <h1 className="sysx-display sysx-h1">Вихід у ЄС і США<br />як <span className="sysx-em">система</span>, не спроба</h1>
          <p className="sysx-lead">Європа і Штати — сотні мільйонів покупців і вищий середній чек, ніж удома. Ми будуємо ваш міжнародний контур <b>під ключ</b>: власний сайт, Amazon, Allegro, eBay і локальні майданчики — одразу на всіх вітринах ринку.</p>
          <div className="sysx-proof">
            <span><b>4+</b> ринки за один контур</span>
            <i aria-hidden="true" />
            <span><b>8</b> вітрин продажу</span>
            <i aria-hidden="true" />
            <span>кейс <b>0% → 32%</b></span>
          </div>
          <span className="sysx-scrollhint mono">↓ як виводимо</span>
        </div>

        {/* ВІТРИНИ РИНКУ */}
        <div ref={channels} className="xp-panel" style={{ opacity: 0 }}>
          <div className="xp-head">
            <span className="sysx-kick">Присутність на ринку</span>
            <h2 className="sysx-display xp-h">Продаємо на всіх<br /><span className="sysx-em">вітринах</span> ринку.</h2>
            <p className="xp-lead">Один контур — багато точок продажу. Пріоритетні ринки: <b>PL · DE · CZ · США</b>.</p>
          </div>
          <div className="xp-grid">
            {CHANNELS.map((c) => (
              <div key={c.name} className="xp-card">
                <b className="xp-card-t">{c.name}</b>
                <span className="xp-card-d">{c.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ЩО БУДУЄМО + ГОТОВНІСТЬ */}
        <div ref={build} className="xp-panel xp-build" style={{ opacity: 0 }}>
          <div className="xp-build-l">
            <span className="sysx-kick">Що будуємо під ринок · під ключ</span>
            <div className="xp-process">
              {PROCESS.map((s) => (
                <span key={s.n} className="xp-step"><i className="mono">{s.n}</i>{s.t}</span>
              ))}
            </div>
            <div className="xp-build-list">
              {BUILD.map((b) => (
                <div key={b.t} className="xp-build-item">
                  <b>{b.t}</b><span>{b.d}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="xp-ready">
            <span className="sysx-kick">Ви готові до експансії, якщо</span>
            <ul className="xp-ready-list">
              {READY.map((r) => <li key={r}>{r}</li>)}
            </ul>
            <span className="xp-ready-note mono">Кейс: виробник меблів — Європа 0% → 32% обороту.</span>
          </div>
        </div>

        {/* OUTRO — CTA з числом кейсу */}
        <div ref={outro} className="sysx-scene sysx-ctaScene">
          <div className="sysx-kick">Кейс виходу в ЄС</div>
          <h2 className="sysx-display sysx-h2"><span className="sysx-em">0% → 32%</span><br />обороту з ринків ЄС.</h2>
          <p className="sysx-lead">Порахуємо, чи витримує ваша економіка вихід у ЄС і США — і з якої вітрини почати.</p>
          <div className="sysx-cta-row">
            <Link to="/diagnose" className="sysx-cta is-primary">Оцінити готовність до експансії →</Link>
            <Link to="/proof" className="sysx-cta">Кейси експансії</Link>
          </div>
        </div>

        <PartnerMarquee />
      </div>
    </section>
    </>
  );
}
