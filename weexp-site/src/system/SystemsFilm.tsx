import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SYSTEMS, localizeSystem, type SystemKey } from '@/data/xray';
import { useT, useLp, useLang } from '@/i18n';
import { band, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import './system.css';

// Конкретні дисципліни, які WEEXP закриває в кожній системі — щоб «веб-розробка,
// ERP-автоматизація, UX/UI, CRO — це все до нас» читалось прямо, а не малось на увазі.
const SERVICES: Record<SystemKey, string[]> = {
  strategy: ['Стратегія росту', 'Юніт-економіка', 'Управлінський цикл'],
  commercial: ['Асортимент і промо', 'Ціноутворення', 'Merchandising'],
  customer: ['SEO', 'Performance-трафік', 'Retention / CRM', 'Attribution'],
  experience: ['UX/UI-дизайн', 'CRO та A/B', 'Веб-розробка', 'Mobile'],
  operations: ['ERP-автоматизація', 'Fulfillment / SLA', 'Інтеграції'],
  data: ['Аналітика / BI', 'Наскрізна аналітика', 'Master data', 'Інтеграції'],
  org: ['Операційна модель', 'RACI та KPI', 'SOP і база знань'],
  expansion: ['Вихід у ЄС/США', 'Маркетплейси', 'Локалізація й логістика'],
};

// EN-паралель до SERVICES (той самий порядок) — для рендеру в англомовному режимі.
const SERVICES_EN: Record<SystemKey, string[]> = {
  strategy: ['Growth strategy', 'Unit economics', 'Management cycle'],
  commercial: ['Assortment & promo', 'Pricing', 'Merchandising'],
  customer: ['SEO', 'Performance traffic', 'Retention / CRM', 'Attribution'],
  experience: ['UX/UI design', 'CRO & A/B', 'Web development', 'Mobile'],
  operations: ['ERP automation', 'Fulfillment / SLA', 'Integrations'],
  data: ['Analytics / BI', 'End-to-end analytics', 'Master data', 'Integrations'],
  org: ['Operating model', 'RACI & KPI', 'SOPs & knowledge base'],
  expansion: ['EU/US market entry', 'Marketplaces', 'Localization & logistics'],
};

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));

/**
 * WEEXP — THE SEVEN SYSTEMS (challenges-film, /systems). Продовження головної:
 * якщо /system вводить ідею «e-commerce — це система із семи частин», то тут
 * камера по черзі зупиняється на кожній із семи систем. Той самий WebGL-об'єкт
 * (Commerce System): активна система світиться червоним (тут витікає виторг),
 * поруч з'являється плашка-експонат — біль, симптом, що будує WEEXP. Скрол =
 * камера, що обходить систему вузол за вузлом. Світле cinematic-полотно.
 *
 * Драматургія: INTRO «де ви втрачаєте гроші» → 7 актів (по системі) →
 * ACTIVATION (коли зв'язано — гроші течуть) → CTA (знайти свій bottleneck).
 */
const N = SYSTEMS.length;                // 7
const A0 = 0.08;                         // старт band-у систем
const A1 = 0.90;                         // кінець band-у систем
const W = (A1 - A0) / N;                 // ширина одного акту ≈ 0.117

export function SystemsFilm() {
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const sec = useRef<HTMLElement>(null);
  const progress = useRef(0);                                   // прогрес для WebGL-об'єкта
  const alerts = useRef<number[]>([]);                          // активна система → червоний вузол
  const labels = useRef(SYSTEMS.map(() => ({ x: 50, y: 50, vis: 0 }))); // спроєктовані позиції вузлів
  const activeIdx = useRef(-1);                                 // яка система в фокусі (для маркера)
  const gate = useRef(0);                                       // 0..1 — чи ми всередині band-у систем
  const marker = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useScrollScene(sec, (p, reduce) => {
    // — WebGL-хореографія: enter/assemble → examine (links firm up) → activation —
    progress.current = reduce ? 0.55
      : p < A0 ? 0.12 + band(p, 0, A0) * 0.36            // 0.12 → 0.48  збірка
      : p < A1 ? 0.48 + band(p, A0, A1) * 0.07           // 0.48 → 0.55  зв'язки міцніють, без імпульсів
      : 0.55 + band(p, A1, 1) * 0.30;                    // 0.55 → 0.85  імпульси (гроші течуть)

    set(intro.current, reduce ? 1 : seg(p, -1, 0, 0.055, 0.11), `translateY(${((1 - band(p, 0, 0.055)) * -3).toFixed(1)}vh)`);
    set(outro.current, reduce ? 1 : seg(p, A1, 0.945, 1.1, 1.2));

    // — 7 актів: кожна плашка тане в центр свого вікна —
    const inBand = !reduce && p > A0 - 0.02 && p < A1 + 0.02;
    const idx = inBand ? Math.min(N - 1, Math.max(0, Math.floor((p - A0) / W))) : -1;
    for (let i = 0; i < N; i++) {
      const a = A0 + i * W;
      set(panels.current[i], reduce ? 1 : seg(p, a, a + 0.022, a + W - 0.022, a + W),
        `translateY(${((1 - seg(p, a, a + 0.03, a + W - 0.03, a + W)) * 2).toFixed(1)}vh)`);
    }

    // активна система → червоний вузол; маркер живе лише всередині band-у
    alerts.current = idx >= 0 ? [idx] : [];
    activeIdx.current = idx;
    gate.current = reduce ? 0 : band(p, A0 - 0.01, A0 + 0.02) * (1 - band(p, A1 - 0.02, A1 + 0.01));
    if (idx >= 0 && idx !== active) setActive(idx);
  });

  // rAF: вішаємо маркер на спроєктовану позицію активного вузла (коли він до нас лицем).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = marker.current, i = activeIdx.current;
      if (el) {
        const L = i >= 0 ? labels.current[i] : null;
        if (L) {
          el.style.left = L.x.toFixed(2) + '%';
          el.style.top = L.y.toFixed(2) + '%';
          el.style.opacity = String(Math.max(0, Math.min(1, L.vis * gate.current)));
        } else el.style.opacity = '0';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section ref={sec} className="sysx sysx-film sysx-seven" aria-label={t('WEEXP — вісім систем, у яких бізнес втрачає гроші', 'WEEXP — eight systems where business leaks money')}>
      <div className="sysx-stage">
        <span className="sysx-field" aria-hidden="true" />
        <Suspense fallback={null}><CommerceSystem3D progress={progress} alerts={alerts} labels={labels} /></Suspense>

        {/* Маркер активної системи, прив'язаний до 3D-вузла */}
        <div ref={marker} className="sysf-marker" aria-hidden="true">
          <span className="sysf-marker-dot" />
          <span className="sysf-marker-num mono">{SYSTEMS[active].num}</span>
        </div>

        {/* Рейка 01..07 — де камера серед семи систем */}
        <div className="sysf-rail" aria-hidden="true">
          {SYSTEMS.map((s, i) => (
            <span key={s.key} className={'sysf-tick' + (i === active ? ' is-on' : '')}><b>{s.num}</b></span>
          ))}
        </div>

        {/* INTRO */}
        <div ref={intro} className="sysx-scene sysx-void">
          <div className="sysx-kick">WEEXP — The Eight Systems</div>
          <h2 className="sysx-display sysx-h1">{t('Де ваш бізнес', 'Where is your business')}<br />{t('втрачає ', 'leaking ')}<span className="sysx-em sysx-em-alert">{t('гроші', 'money')}</span>?</h2>
          <p className="sysx-lead">{t('Не сайт і не канал — уся система онлайн-продажів. Веб-розробка, ERP-автоматизація, UX/UI та CRO, аналітика та експансія — усі вісім систем ми закриваємо самі, під одним дахом. Пройдемо крізь кожну.', 'Not a site or a channel — the whole online-sales system. Web development, ERP automation, UX/UI and CRO, analytics and expansion — we cover all eight systems ourselves, under one roof. Let\'s walk through each.')}</p>
          <span className="sysx-scrollhint mono">{t('↓ крізь 8 систем', '↓ through the 8 systems')}</span>
        </div>

        {/* 7 актів — плашки-експонати біля об'єкта */}
        {SYSTEMS.map((s, i) => {
          const sl = localizeSystem(s, lang);
          return (
          <div key={s.key} ref={(el) => { panels.current[i] = el; }} className="sysf-panel" style={{ opacity: 0 }}>
            <span className="sysf-ghost mono" aria-hidden="true">{sl.num}</span>
            <div className="sysf-panel-in">
              <span className="sysf-en mono">{sl.en} · {t('Система', 'System')} {sl.num}/08</span>
              <h2 className="sysx-display sysf-title">{sl.title}</h2>
              <p className="sysf-feel">«{sl.feel}»</p>
              <div className="sysf-pains">
                {sl.pains.slice(0, 3).map((pn) => (
                  <span key={pn} className="sysf-pain"><i aria-hidden="true" />{pn}</span>
                ))}
              </div>
              <p className="sysf-sell"><b className="mono">{t('Будуємо:', 'We build:')}</b> {sl.sell}</p>
              <div className="sysf-services">
                <span className="sysf-services-lab mono">{t('Робимо самі →', 'We do it in-house →')}</span>
                {SERVICES[s.key].map((sv, j) => <span key={sv} className="sysf-service mono">{t(sv, SERVICES_EN[s.key][j])}</span>)}
              </div>
            </div>
          </div>
          );
        })}

        {/* ACTIVATION → CTA */}
        <div ref={outro} className="sysx-scene sysx-ctaScene">
          <div className="sysx-kick">{t('Знайдіть свою слабку ланку', 'Find your weakest link')}</div>
          <h2 className="sysx-display sysx-h2">{t('Не вгадуйте систему —', "Don't guess the system —")}<br />{t('знайдіть ', 'find the ')}<span className="sysx-em">bottleneck</span>.</h2>
          <p className="sysx-lead">{t('Діагностика за кілька хвилин покаже, яка з восьми систем зараз стримує ваш зріст найсильніше — і скільки це коштує.', 'A few-minute diagnostic shows which of the eight systems is holding your growth back the most right now — and what it costs you.')}</p>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Пройти діагностику →', 'Run the diagnostic →')}</Link>
            <Link to={lp('/proof')} className="sysx-cta">{t('Кейси', 'Case studies')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
