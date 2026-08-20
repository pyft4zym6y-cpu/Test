import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { band, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import './system.css';

import { PartnerMarquee } from '@/system/PartnerMarquee';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));
const SystemExplorer = lazy(() => import('@/system/SystemExplorer').then((m) => ({ default: m.SystemExplorer })));
// Розбір 8 систем (колишня окрема /systems) тепер — глибший скрол-етап головної.
const SystemsFilm = lazy(() => import('@/system/SystemsFilm').then((m) => ({ default: m.SystemsFilm })));
// Сканована повна карта Commerce OS: 8 систем + вкладені домени (акордеон).
// Меседжинг за роллю ЛПР (§8): одна система — різні виграші.
const AudienceByRole = lazy(() => import('@/system/AudienceByRole').then((m) => ({ default: m.AudienceByRole })));
// Механіка довіри (§6): метод, прозорий процес, платформи, реальні сигнали.
const Credibility = lazy(() => import('@/system/Credibility').then((m) => ({ default: m.Credibility })));

/**
 * WEEXP — THE SYSTEM IN MOTION (home-film, /system). Повна драматургія головної на
 * одному WebGL-об'єкті (Commerce System), керована скролом (scroll = камера):
 *   SYMPTOM → камера входить → 7 систем збираються (лейбли) → коренева причина
 *   (слабка ланка червоним) → CONNECT (частини як одне) → ACTIVATION (гроші течуть)
 *   → INDEPENDENCE (CTA). Світле cinematic-полотно. Живий (темний) сайт не чіпаємо.
 */
// Канонічні 8 систем — ті самі, що в діагностиці/радарі (lossModel.SYS), щоб сайт
// був узгоджений: головна, калькулятор і звіти говорять про одні й ті ж системи.
const SYSTEMS = ['Стратегія', 'Комерція', 'Попит і клієнт', 'Досвід', 'Операції', 'Дані', 'Організація', 'Експансія'];
const BOTTLENECK = 2; // «Попит і клієнт» — слабка ланка у сцені кореневої причини

export function SystemInMotion() {
  const sec = useRef<HTMLElement>(null);
  const progress = useRef(0);                        // спільний прогрес для WebGL-об'єкта
  const alerts = useRef<number[]>([]);               // системи, що світяться червоним
  const labels = useRef(SYSTEMS.map(() => ({ x: 50, y: 50, vis: 0 }))); // спроєктовані позиції вузлів
  const labelEls = useRef<(HTMLDivElement | null)[]>([]);
  const sVoid = useRef<HTMLDivElement>(null);
  const sForm = useRef<HTMLDivElement>(null);
  const sRoot = useRef<HTMLDivElement>(null);
  const sConnect = useRef<HTMLDivElement>(null);
  const sActivate = useRef<HTMLDivElement>(null);
  const sCta = useRef<HTMLDivElement>(null);

  useScrollScene(sec, (p, reduce) => {
    progress.current = p;
    alerts.current = !reduce && p >= 0.30 && p <= 0.52 ? [BOTTLENECK] : [];
    set(sVoid.current, reduce ? 1 : seg(p, -1, 0, 0.07, 0.13), `translateY(${((1 - band(p, 0, 0.07)) * -3).toFixed(1)}vh)`);
    set(sForm.current, reduce ? 1 : seg(p, 0.13, 0.18, 0.26, 0.32));
    set(sRoot.current, reduce ? 1 : seg(p, 0.34, 0.39, 0.46, 0.52));
    set(sConnect.current, reduce ? 1 : seg(p, 0.54, 0.59, 0.64, 0.70));
    set(sActivate.current, reduce ? 1 : seg(p, 0.72, 0.77, 0.83, 0.88));
    set(sCta.current, reduce ? 1 : seg(p, 0.90, 0.95, 1.1, 1.2));
  });

  // rAF: вішаємо 7 лейблів систем на спроєктовані позиції вузлів. Видимі під час
  // збірки й зв'язку (FORM..CONNECT), гаснуть в ACTIVATION, щоб не заважати імпульсам.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const gate = band(progress.current, 0.16, 0.22) * (1 - band(progress.current, 0.68, 0.76));
      const L = labels.current;
      for (let i = 0; i < L.length; i++) {
        const el = labelEls.current[i]; if (!el) continue;
        el.style.left = L[i].x.toFixed(2) + '%';
        el.style.top = L[i].y.toFixed(2) + '%';
        el.style.opacity = String(Math.max(0, Math.min(1, L[i].vis * gate)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
    <section ref={sec} className="sysx sysx-film sysx-scroll-mobile" aria-label="WEEXP — The System in Motion">
      <div className="sysx-stage">
        <span className="sysx-field" aria-hidden="true" />
        <Suspense fallback={null}><CommerceSystem3D progress={progress} alerts={alerts} labels={labels} /></Suspense>

        {/* 7 систем-лейблів (позиціонуються rAF-ом) */}
        <div className="sysx-labels" aria-hidden="true">
          {SYSTEMS.map((s, i) => (
            <div key={s} ref={(el) => { labelEls.current[i] = el; }} className={'sysx-label' + (i === BOTTLENECK ? ' is-alert' : '')}>
              <span className="sysx-label-dot" /><span className="sysx-label-t">{s}</span>
            </div>
          ))}
        </div>

        {/* SYMPTOM / VOID */}
        <div ref={sVoid} className="sysx-scene sysx-void">
          <div className="sysx-kick">Commerce OS для e-commerce і D2C-брендів $0.5–10M</div>
          <h1 className="sysx-display sysx-h1">Система<br />замість <span className="sysx-em">героїзму</span></h1>
          <p className="sysx-lead">Продажі тримаються на людях і ручному режимі, а не на системі. Збираємо вісім систем в одну керовану — щоб виторг ріс, а бізнес не залежав від вас.</p>
          <div className="sysx-cta-row sysx-void-cta">
            <Link to="/diagnose" className="sysx-cta is-primary">Порахувати мій витік →</Link>
            <Link to="/pricing" className="sysx-cta">Формати і ціни</Link>
          </div>
          <span className="sysx-scrollhint mono">↓ або погортайте, як це працює</span>
        </div>

        {/* FORM — 7 систем збираються */}
        <div ref={sForm} className="sysx-scene sysx-form" style={{ opacity: 0 }}>
          <h2 className="sysx-display sysx-h2">E-commerce — це <span className="sysx-em">система</span><br />із восьми частин.</h2>
          <p className="sysx-lead">Стратегія, комерція, попит і клієнт, досвід, операції, дані, організація й експансія — вони працюють лише разом.</p>
        </div>

        {/* ROOT CAUSE — слабка ланка */}
        <div ref={sRoot} className="sysx-scene sysx-root" style={{ opacity: 0 }}>
          <h2 className="sysx-display sysx-h2">Одна слабка ланка<br /><span className="sysx-em sysx-em-alert">коштує грошей</span>.</h2>
          <p className="sysx-lead">Система сильна настільки, наскільки сильна її найслабша частина. Саме там витікає виторг.</p>
        </div>

        {/* CONNECT */}
        <div ref={sConnect} className="sysx-scene sysx-connect" style={{ opacity: 0 }}>
          <h2 className="sysx-display sysx-h2">Частини мають<br />працювати як <span className="sysx-em">одне</span>.</h2>
          <p className="sysx-lead">Не вісім інструментів окремо — одна зв'язана система, де кожна дія підсилює наступну.</p>
        </div>

        {/* ACTIVATION */}
        <div ref={sActivate} className="sysx-scene sysx-activate" style={{ opacity: 0 }}>
          <h2 className="sysx-display sysx-h2">Коли система працює —<br />гроші течуть <span className="sysx-em">самі</span>.</h2>
          <p className="sysx-lead">Менша вартість клієнта, органіка, повторні продажі. Вітрина стає активом, а не статтею витрат.</p>
        </div>

        {/* CTA — INDEPENDENCE (+ позиціонування, докази й прямий контакт при першому знайомстві) */}
        <div ref={sCta} className="sysx-scene sysx-ctaScene" style={{ opacity: 0 }}>
          <div className="sysx-kick">Independence Score</div>
          <h2 className="sysx-display sysx-h2">Наскільки незалежний<br />ваш <span className="sysx-em">e-commerce</span>?</h2>
          <p className="sysx-lead">Ми вирішуємо одну дорогу проблему: продажі, що тримаються на ручному режимі й людях, а не на системі. Збираємо вісім систем в одну керовану — щоб виторг ріс, а бізнес не залежав від вас.</p>
          <div className="sysx-proofbar">
            <span><b>17</b> трансформацій</span>
            <i aria-hidden="true" />
            <span><b>8</b> систем під дахом</span>
            <i aria-hidden="true" />
            <span>D2C-бренди <b>$0.5–10M</b></span>
          </div>
          <div className="sysx-cta-row">
            <Link to="/diagnose" className="sysx-cta is-primary">Знайти вузьке місце →</Link>
            <Link to="/proof" className="sysx-cta">Дивитись докази</Link>
            <Link to="/contact" className="sysx-cta">Написати нам</Link>
          </div>
        </div>

        {/* Технологічний стек — напівпрозорий рядок по низу сцени (частина блоку) */}
        <PartnerMarquee />
      </div>
    </section>
    {/* Логічне продовження того ж полотна — інтерактивний розбір систем */}
    <Suspense fallback={null}><SystemExplorer /></Suspense>
    {/* Глибший скрол-етап: покадровий розбір 8 систем (об'єднано з колишньою /systems) */}
    <div id="systems"><Suspense fallback={null}><SystemsFilm /></Suspense></div>
    {/* CommerceMap прибрано — дублював заголовок «Де ваш бізнес втрачає гроші» одразу після SystemsFilm. */}
    {/* Меседжинг за роллю ЛПР: одна система — різні виграші */}
    <Suspense fallback={null}><AudienceByRole /></Suspense>
    {/* Механіка довіри: метод, прозорий процес, платформи */}
    <Suspense fallback={null}><Credibility /></Suspense>
    </>
  );
}
