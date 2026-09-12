import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { band, seg, setLayer as set, useScrollScene } from '@/lib/scene';
import { useT, useLp, useLang } from '@/i18n';
import './system.css';

import { PartnerMarquee } from '@/system/PartnerMarquee';
import { HEADLINE_PROOF } from '@/data/cases';

const CommerceSystem3D = lazy(() => import('@/system/CommerceSystem3D').then((m) => ({ default: m.CommerceSystem3D })));
const Symptoms = lazy(() => import('@/system/Symptoms').then((m) => ({ default: m.Symptoms })));
const SystemExplorer = lazy(() => import('@/system/SystemExplorer').then((m) => ({ default: m.SystemExplorer })));
/*
 * Вісім блоків головної після героя лежать в одному модулі й вантажаться одним
 * чанком: вони йдуть підряд, і сім окремих lazy-імпортів дали б сім запитів на
 * одну прокрутку.
 *
 * Architecture, AudienceByRole і Credibility з головної пішли — не видалені, а
 * перенесені на /people: це матеріал про НАС (чотири рівні пропозиції, виграші
 * за роллю ЛПР, механіка довіри), і на головній він стояв між доказом і
 * послугою, відсуваючи їх униз.
 */
const hb = () => import('@/system/HomeBlocks');
const HomeProofLine = lazy(() => hb().then((m) => ({ default: m.HomeProofLine })));
const HomeCases = lazy(() => hb().then((m) => ({ default: m.HomeCases })));
const HomeServices = lazy(() => hb().then((m) => ({ default: m.HomeServices })));
const HomeExpertise = lazy(() => hb().then((m) => ({ default: m.HomeExpertise })));
const HowWeWork = lazy(() => hb().then((m) => ({ default: m.HowWeWork })));
const AfterHandover = lazy(() => hb().then((m) => ({ default: m.AfterHandover })));
const TeamStrip = lazy(() => hb().then((m) => ({ default: m.TeamStrip })));
const ClosingCta = lazy(() => hb().then((m) => ({ default: m.ClosingCta })));
const HomeFaq = lazy(() => import('@/system/HomeFaq').then((m) => ({ default: m.HomeFaq })));

/**
 * Головна сторінка.
 *
 * ФІЛЬМ СКОРОЧЕНО З ШЕСТИ СЦЕН ДО ДВОХ. Було: герой → «e-commerce — це система
 * з восьми частин» → «одна слабка ланка коштує грошей» → «частини мають
 * працювати як одне» → «зростання перестає бути ручним» → фінальний екран із
 * трьома кнопками. Пʼять екранів метафори й 680vh прокрутки до першого доказу,
 * до першої ціни і до першої згадки про те, що саме людина може купити.
 *
 * Лишились дві сцени: герой і «одна слабка ланка коштує грошей» — єдина з
 * чотирьох середніх, яка щось СТВЕРДЖУЄ, а не переказує метафору. Решта пішла
 * не в архів, а вниз по сторінці, де ті самі речі сказані конкретно: вісім
 * частин показує розбір систем, звʼязність — блок сценаріїв, «ручне зростання»
 * — кейси з числами.
 *
 * 3D-обʼєкт лишився: він тримає перший екран і те, що людина запамʼятовує з
 * бренду. Хід прокрутки — 240vh замість 680vh.
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
  const sRoot = useRef<HTMLDivElement>(null);   // друга й остання сцена

  useScrollScene(sec, (p, reduce) => {
    progress.current = p;
    // Слабка ланка світиться червоним рівно поки видно сцену про неї.
    alerts.current = !reduce && p >= 0.50 && p <= 0.92 ? [BOTTLENECK] : [];
    // 3D-об'єкт — ТІЛЬКИ підложка: схований на першому екрані (постер-герой чистий,
    // і на мобайлі), далі проявляється як тонка текстура з низькою непрозорістю,
    // щоб НЕ конкурувати з текстом і вписуватись у бруталіст-стиль.
    if (sObj.current) sObj.current.style.opacity = (reduce ? 0 : band(p, 0.30, 0.42) * 0.3).toFixed(3);
    set(sVoid.current, reduce ? 1 : seg(p, -1, 0, 0.30, 0.42), `translateY(${((1 - band(p, 0, 0.22)) * -3).toFixed(1)}vh)`);
    set(sRoot.current, reduce ? 1 : seg(p, 0.44, 0.55, 0.94, 1.12));
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

        {/* ГЕРОЙ. Категорія → що саме робимо → чим це вимірюється → одна дія.
            Доти тут стояли ДВІ кнопки поруч, «порахувати витік» і «залишити
            заявку», — тобто людині пропонували обрати спосіб звернення ще до
            того, як вона зрозуміла послугу. Кнопка лишилась одна; «залишити
            заявку» нікуди не зникла — вона постійно стоїть у шапці. */}
        <div ref={sVoid} className="sysx-scene sysx-void">
          <div className="sysx-kick">{t('Операційний партнер для e-commerce і D2C-брендів', 'An operating partner for e-commerce & D2C brands')}</div>
          <h1 className="sysx-display sysx-h1">{t('Перебудовуємо', 'We rebuild')}<br /><span className="sysx-em">{t('онлайн-продажі', 'online sales')}</span></h1>
          <p className="sysx-sub">{t('Аудит · конверсія · повторні продажі · керовані процеси', 'Audit · conversion · repeat sales · managed processes')}</p>
          <p className="sysx-lead">{t('Знаходимо, де саме витікають гроші, рахуємо це в гривнях за вашими CRM/ERP/GA4 — і перебудовуємо: від каталогу до аналітики.', 'We find exactly where the money leaks, put a number on it from your CRM/ERP/GA4 — and rebuild: from the catalog to the analytics.')}</p>
          <div className="sysx-cta-row sysx-void-cta">
            <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
          </div>
          <span className="sysx-reassure mono">{t('Безкоштовно · ~2 хв · без реєстрації та картки', 'Free · ~2 min · no sign-up, no card')}</span>
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
          <span className="sysx-scrollhint mono">{t('↓ або погортайте, як це працює', '↓ or scroll to see how it works')}</span>
        </div>

        {/* ROOT CAUSE — єдина сцена, що лишилась від середини фільму:
            вона щось стверджує, а не переказує метафору. */}
        <div ref={sRoot} className="sysx-scene sysx-root" style={{ opacity: 0 }}>
          <h2 className="sysx-display sysx-h2">{t('Одна слабка ланка', 'One weak link')}<br /><span className="sysx-em sysx-em-alert">{t('коштує грошей', 'costs money')}</span>.</h2>
          <p className="sysx-lead">{t('Система сильна настільки, наскільки сильна її найслабша частина. Саме там витікає виторг — і саме це ми шукаємо першим.', 'A system is only as strong as its weakest part. That is exactly where revenue leaks — and that is what we look for first.')}</p>
        </div>

        {/* Технологічний стек — напівпрозорий рядок по низу сцени (частина блоку) */}
        <PartnerMarquee />
      </div>
    </section>
    {/*
      * ПОРЯДОК БЛОКІВ І Є ЗМІСТОМ ПЕРЕБУДОВИ.
      *
      * Доказ → послуга → чим лагодимо → з чим приходять → де це живе → як
      * працюємо → що буде після → хто це робить → заперечення → одна дія.
      *
      * Було навпаки: методологія (вісім систем, чотири рівні пропозиції,
      * меседжинг за роллю, механіка довіри), а кейсів і цін на головній не
      * було взагалі — до них вів один рядок дрібним шрифтом.
      */}
    <Suspense fallback={null}>
      <HomeProofLine />
      <HomeCases />
      <HomeServices />
      <HomeExpertise />
    </Suspense>
    {/* Вхід з боку клієнта: репліка власника, а не назва системи. Стоїть перед
        розбором восьми систем — інакше першим, що людина читає про причину, знову
        стає наша таксономія. */}
    <Suspense fallback={null}><Symptoms compact /></Suspense>
    {/* Зона робіт: вісім систем онлайн-продажів, інтерактивний розбір. */}
    <div id="systems"><Suspense fallback={null}><SystemExplorer /></Suspense></div>
    <Suspense fallback={null}>
      <HowWeWork />
      <AfterHandover />
      <TeamStrip />
    </Suspense>
    {/* FAQ — закриває заперечення + FAQPage-розмітка */}
    <Suspense fallback={null}><HomeFaq /></Suspense>
    <Suspense fallback={null}><ClosingCta /></Suspense>
    </>
  );
}
