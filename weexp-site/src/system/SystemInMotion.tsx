import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { band, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import { useT, useLp, useLang } from '@/i18n';
import './system.css';

import { PartnerMarquee } from '@/system/PartnerMarquee';
import { HEADLINE_PROOF } from '@/data/cases';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));
const SystemExplorer = lazy(() => import('@/system/SystemExplorer').then((m) => ({ default: m.SystemExplorer })));
// Сканована повна карта Commerce OS: 8 систем + вкладені домени (акордеон).
// Меседжинг за роллю ЛПР (§8): одна система — різні виграші.
const AudienceByRole = lazy(() => import('@/system/AudienceByRole').then((m) => ({ default: m.AudienceByRole })));
// Механіка довіри (§6): метод, прозорий процес, платформи, реальні сигнали.
const Credibility = lazy(() => import('@/system/Credibility').then((m) => ({ default: m.Credibility })));
const HomeFaq = lazy(() => import('@/system/HomeFaq').then((m) => ({ default: m.HomeFaq })));

/**
 * WEEXP — THE SYSTEM IN MOTION (home-film, /system). Повна драматургія головної на
 * одному WebGL-об'єкті (Commerce System), керована скролом (scroll = камера):
 *   SYMPTOM → камера входить → 8 систем збираються (лейбли) → коренева причина
 *   (слабка ланка червоним) → CONNECT (частини як одне) → ACTIVATION (гроші течуть)
 *   → INDEPENDENCE (CTA). Світле cinematic-полотно. Живий (темний) сайт не чіпаємо.
 */
// Канонічні 8 систем — ті самі, що в діагностиці/радарі (lossModel.SYS), щоб сайт
// був узгоджений: головна, калькулятор і звіти говорять про одні й ті ж системи.
const SYSTEMS_UK = ['Стратегія', 'Комерція', 'Попит і клієнт', 'Досвід', 'Операції', 'Дані', 'Організація', 'Експансія'];
const SYSTEMS_EN = ['Strategy', 'Commerce', 'Demand & Customer', 'Experience', 'Operations', 'Data', 'Organization', 'Expansion'];
const BOTTLENECK = 2; // «Попит і клієнт» — слабка ланка у сцені кореневої причини

export function SystemInMotion() {
  // Рішення в ПЕРШОМУ рендері: lazy() тягне чанк тоді, коли елемент уперше
  // відрендерився, тож перевірка в useEffect економила б лише малювання.
  const [reduceMotion] = useState(() => {
    try { return typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion:reduce)').matches; }
    catch { return false; }
  });
  const t = useT();
  const lp = useLp();
  const lang = useLang();
  const SYSTEMS = lang === 'en' ? SYSTEMS_EN : SYSTEMS_UK;
  const sec = useRef<HTMLElement>(null);
  const progress = useRef(0);                        // спільний прогрес для WebGL-об'єкта
  const alerts = useRef<number[]>([]);               // системи, що світяться червоним
  const labels = useRef(Array.from({ length: 8 }, () => ({ x: 50, y: 50, vis: 0 }))); // спроєктовані позиції вузлів
  const labelEls = useRef<(HTMLDivElement | null)[]>([]);
  const sObj = useRef<HTMLDivElement>(null);          // обгортка 3D-об'єкта — гейтимо прозорість скролом
  const sVoid = useRef<HTMLDivElement>(null);
  const sForm = useRef<HTMLDivElement>(null);
  const sRoot = useRef<HTMLDivElement>(null);
  const sConnect = useRef<HTMLDivElement>(null);
  const sActivate = useRef<HTMLDivElement>(null);
  const sCta = useRef<HTMLDivElement>(null);

  useScrollScene(sec, (p, reduce) => {
    progress.current = p;
    alerts.current = !reduce && p >= 0.30 && p <= 0.52 ? [BOTTLENECK] : [];
    // 3D-об'єкт — ТІЛЬКИ підложка: схований на першому екрані (постер-герой чистий,
    // і на мобайлі), далі проявляється як тонка «блакитрук»-текстура з низькою
    // непрозорістю, щоб НЕ конкурувати з текстом і вписуватись у бруталіст-стиль.
    if (sObj.current) sObj.current.style.opacity = (reduce ? 0 : band(p, 0.13, 0.2) * 0.3).toFixed(3);
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
        <div ref={sObj} className="sysx-obj-wrap" aria-hidden="true" style={{ opacity: 0 }}>
          {/* При prefers-reduced-motion сцена й так отримує opacity 0 (див.
              useScrollScene нижче) — тобто її не видно. Але lazy-чанк three.js
              на 474 КБ усе одно вантажився: платимо трафіком і парсингом за
              полотно, яке користувач попросив не показувати. Рішення «скрол-
              фільми лишаються 3D» це не порушує: воно про тих, хто фільм бачить. */}
          {!reduceMotion && <Suspense fallback={null}><CommerceSystem3D progress={progress} alerts={alerts} labels={labels} /></Suspense>}
        </div>

        {/* 8 систем-лейблів (позиціонуються rAF-ом) */}
        <div className="sysx-labels" aria-hidden="true">
          {SYSTEMS.map((s, i) => (
            <div key={s} ref={(el) => { labelEls.current[i] = el; }} className={'sysx-label' + (i === BOTTLENECK ? ' is-alert' : '')}>
              <span className="sysx-label-dot" /><span className="sysx-label-t">{s}</span>
            </div>
          ))}
        </div>

        {/* SYMPTOM / VOID */}
        <div ref={sVoid} className="sysx-scene sysx-void">
          <div className="sysx-kick">{t('Commerce OS для e-commerce і D2C-брендів $0.5–10M', 'Commerce OS for e-commerce & D2C brands $0.5–10M')}</div>
          <h1 className="sysx-display sysx-h1">{t('Система', 'A system')}<br />{t('замість ', 'instead of ')}<span className="sysx-em">{t('героїзму', 'heroics')}</span></h1>
          <p className="sysx-lead">{t('Продажі тримаються на людях і ручному режимі, а не на системі. Збираємо вісім систем в одну керовану — щоб виторг зростав, а бізнес не залежав від вас.', 'Sales rest on people and manual effort, not on a system. We assemble eight systems into one managed system — so revenue grows and the business no longer depends on you.')}</p>
          <div className="sysx-cta-row sysx-void-cta">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
            <Link to={lp('/contact')} className="sysx-cta">{t('Залишити заявку', 'Leave a request')} →</Link>
          </div>
          {/* Три числа з реальних кейсів — перший екран не мав жодного доказу. */}
          <ul className="sysx-proofstrip mono">
            {HEADLINE_PROOF.map((h) => (
              <li key={h.metric}>
                <b>{h.value}</b> <span>{t(h.uk, h.en)}</span>
              </li>
            ))}
          </ul>
          <Link to={lp('/proof') + '#method'} className="sysx-proofhow mono">
            {t('Як ми рахуємо і перевіряємо ці цифри', 'How we calculate and verify these numbers')} →
          </Link>
          <span className="sysx-reassure mono">{t('Безкоштовно · ~2 хв · без реєстрації та картки', 'Free · ~2 min · no sign-up, no card')}</span>
          <span className="sysx-scrollhint mono">{t('↓ або погортайте, як це працює', '↓ or scroll to see how it works')}</span>
        </div>

        {/* FORM — 8 систем збираються */}
        <div ref={sForm} className="sysx-scene sysx-form" style={{ opacity: 0 }}>
          <h2 className="sysx-display sysx-h2">{t('E-commerce — це ', 'E-commerce is a ')}<span className="sysx-em">{t('система', 'system')}</span><br />{t('із восьми частин.', 'of eight parts.')}</h2>
          <p className="sysx-lead">{t('Стратегія, комерція, попит і клієнт, досвід, операції, дані, організація й експансія — вони працюють лише разом.', 'Strategy, commerce, demand & customer, experience, operations, data, organization and expansion — they only work together.')}</p>
        </div>

        {/* ROOT CAUSE — слабка ланка */}
        <div ref={sRoot} className="sysx-scene sysx-root" style={{ opacity: 0 }}>
          <h2 className="sysx-display sysx-h2">{t('Одна слабка ланка', 'One weak link')}<br /><span className="sysx-em sysx-em-alert">{t('коштує грошей', 'costs money')}</span>.</h2>
          <p className="sysx-lead">{t('Система сильна настільки, наскільки сильна її найслабша частина. Саме там витікає виторг.', 'A system is only as strong as its weakest part. That is exactly where revenue leaks.')}</p>
        </div>

        {/* CONNECT */}
        <div ref={sConnect} className="sysx-scene sysx-connect" style={{ opacity: 0 }}>
          <h2 className="sysx-display sysx-h2">{t('Частини мають', 'The parts must')}<br />{t('працювати як ', 'work as ')}<span className="sysx-em">{t('одне', 'one')}</span>.</h2>
          <p className="sysx-lead">{t("Не вісім інструментів окремо — одна зв'язана система, де кожна дія підсилює наступну.", 'Not eight separate tools — one connected system where each action reinforces the next.')}</p>
        </div>

        {/* ACTIVATION */}
        <div ref={sActivate} className="sysx-scene sysx-activate" style={{ opacity: 0 }}>
          <h2 className="sysx-display sysx-h2">{t('Коли система працює —', 'When the system works —')}<br />{t('гроші течуть ', 'money flows ')}<span className="sysx-em">{t('самі', 'on its own')}</span>.</h2>
          <p className="sysx-lead">{t('Менша вартість клієнта, органіка, повторні продажі. Вітрина стає активом, а не статтею витрат.', 'Lower customer cost, organic traffic, repeat sales. The storefront becomes an asset, not a cost line.')}</p>
        </div>

        {/* CTA — INDEPENDENCE */}
        <div ref={sCta} className="sysx-scene sysx-ctaScene" style={{ opacity: 0 }}>
          <div className="sysx-kick">Independence Score</div>
          <h2 className="sysx-display sysx-h2">{t('Наскільки незалежний', 'How independent')}<br />{t('ваш ', 'is your ')}<span className="sysx-em">e-commerce</span>?</h2>
          <p className="sysx-lead">{t('Ми вирішуємо одну дорогу проблему: продажі, що тримаються на ручному режимі й людях, а не на системі. Збираємо вісім систем в одну керовану — щоб виторг зростав, а бізнес не залежав від вас.', 'We solve one expensive problem: sales that rest on manual effort and people rather than a system. We assemble eight systems into one managed system — so revenue grows and the business no longer depends on you.')}</p>
          <div className="sysx-proofbar">
            <span><b>17</b> {t('трансформацій', 'transformations')}</span>
            <i aria-hidden="true" />
            <span><b>8</b> {t('систем під дахом', 'systems under one roof')}</span>
            <i aria-hidden="true" />
            <span>{t('D2C-бренди ', 'D2C brands ')}<b>$0.5–10M</b></span>
          </div>
          <div className="sysx-cta-row">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
            <Link to={lp('/proof')} className="sysx-cta">{t('Наші перемоги', 'Our wins')} →</Link>
            <Link to={lp('/contact')} className="sysx-cta">{t('Залишити заявку', 'Leave a request')} →</Link>
          </div>
        </div>

        {/* Технологічний стек — напівпрозорий рядок по низу сцени (частина блоку) */}
        <PartnerMarquee />
      </div>
    </section>
    {/* Логічне продовження того ж полотна — інтерактивний розбір систем (8 систем).
        SystemsFilm прибрано з головної: дублював цей самий розбір 8 систем нижче
        (заголовок «Де ваш бізнес втрачає гроші»). Лишаємо один — інтерактивний вище. */}
    <div id="systems"><Suspense fallback={null}><SystemExplorer /></Suspense></div>
    {/* Меседжинг за роллю ЛПР: одна система — різні виграші */}
    <Suspense fallback={null}><AudienceByRole /></Suspense>
    {/* Механіка довіри: метод, прозорий процес, платформи */}
    <Suspense fallback={null}><Credibility /></Suspense>
    {/* FAQ — закриває заперечення + FAQPage-розмітка */}
    <Suspense fallback={null}><HomeFaq /></Suspense>
    </>
  );
}
