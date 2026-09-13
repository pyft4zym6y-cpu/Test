import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
import './system.css';

import { PartnerMarquee } from '@/system/PartnerMarquee';
import { HEADLINE_PROOF } from '@/data/cases';

const Symptoms = lazy(() => import('@/system/Symptoms').then((m) => ({ default: m.Symptoms })));
/*
 * Вісім блоків головної після героя лежать в одному модулі й вантажаться одним
 * чанком: вони йдуть підряд, і сім окремих lazy-імпортів дали б сім запитів на
 * одну прокрутку.
 */
const hb = () => import('@/system/HomeBlocks');
const HomeProofLine = lazy(() => hb().then((m) => ({ default: m.HomeProofLine })));
const HomeCases = lazy(() => hb().then((m) => ({ default: m.HomeCases })));
const HomeServices = lazy(() => hb().then((m) => ({ default: m.HomeServices })));
const ClosingCta = lazy(() => hb().then((m) => ({ default: m.ClosingCta })));
const HomeFaq = lazy(() => import('@/system/HomeFaq').then((m) => ({ default: m.HomeFaq })));

/**
 * Головна сторінка.
 *
 * СКРОЛ-ФІЛЬМУ БІЛЬШЕ НЕМАЄ. Був: липка сцена на 240vh, крізь яку «рухалась
 * камера», два текстові екрани один поверх одного на absolute, WebGL-обʼєкт
 * на 474 КБ під ними і вісім лейблів, які rAF щокадру вішав на спроєктовані
 * вузли. Прокрутка керувала не сторінкою, а прозорістю — тобто людина крутила
 * колесо й не рухалась. Два екрани коштували двох висот вікна порожнього ходу
 * до першого рядка контенту, а посилання доводилось повертати до життя
 * окремим правилом, бо сцена гасила pointer-events заради обʼєкта позаду.
 *
 * Тепер головна — звичайний документ: секція за секцією, скрол рухає сторінку.
 * Метафора «одна слабка ланка коштує грошей» пішла не в архів: те саме
 * конкретно каже блок симптомів нижче — реплікою власника, а не гаслом.
 */
export function SystemInMotion() {
  const t = useT();
  const lp = useLp();

  return (
    <>
    {/* ПЕРШИЙ ЕКРАН — про потребу клієнта, а не про нас.
        Було: «Перебудовуємо онлайн-продажі» — підмет «ми», присудок про нашу
        роботу. Людина, яка щойно зайшла, шукає не виконавця, а свій результат:
        більше продажів із трафіку, за який вона вже платить. Що саме ми
        робимо, щоб його дати, — рядком нижче. */}
    <section className="sysx sysx-hero" aria-label={t('WEEXP — більше продажів з того самого трафіку', 'WEEXP — more sales from the same traffic')}>
      <div className="sysx-hero-in">
        <div className="sysx-kick">{t('E-commerce і D2C-бренди', 'E-commerce & D2C brands')}</div>
        <h1 className="sysx-display sysx-h1">{t('Більше продажів', 'More sales')}{' '}<br className="br-wide" /><span className="sysx-em">{t('з того самого трафіку', 'from the same traffic')}</span></h1>
        <p className="sysx-sub">{t('Без збільшення рекламного бюджету', 'Without raising the ad budget')}</p>
        <p className="sysx-lead">{t('Показуємо в гривнях, скільки магазин втрачає щомісяця — за вашими CRM, ERP і GA4. Далі перебудовуємо те, що дає найбільшу дельту.', 'We show in numbers how much your store loses every month — from your CRM, ERP and GA4. Then we rebuild what delivers the biggest delta.')}</p>
        <div className="sysx-cta-row sysx-hero-cta">
          <Link to={lp('/diagnose')} className="sysx-cta is-primary">{t('Порахувати витік', 'Calculate the leak')} →</Link>
        </div>
        <span className="sysx-reassure mono">{t('Безкоштовно · без реєстрації та картки', 'Free · no sign-up, no card')}</span>
        {/* Три числа з реальних кейсів — перший екран не мав жодного доказу. */}
        <ul className="sysx-proofstrip mono">
          {HEADLINE_PROOF.map((h) => (
            <li key={h.metric}>
              <b>{h.value}</b> <span>{t(h.uk, h.en)}</span>
            </li>
          ))}
        </ul>
        <Link to={lp('/proof') + '#method'} className="sysx-proofhow mono">
          {t('Як ми рахуємо ці цифри', 'How we calculate these numbers')} →
        </Link>
      </div>
      {/* Технологічний стек — рядок під героєм (частина блоку) */}
      <PartnerMarquee />
    </section>
    {/*
      * ПОРЯДОК БЛОКІВ І Є ЗМІСТОМ.
      *
      * Доказ → що купують і за скільки → з чим приходять → заперечення → дія.
      *
      * БУЛО ТРИНАДЦЯТЬ БЛОКІВ І 12.2 ЕКРАНА. Пʼять із них розповідали про НАС
      * і наш процес — перелік девʼяти експертиз, «як ми це робимо», «життя
      * після передачі», «команда: 19 ролей», блок статей, — разом 4.7 екрана
      * й близько 500 слів із 1204. Людина, яка прийшла порахувати свій витік,
      * проходила повз них до останнього екрана, де на неї чекала не дія, а
      * пʼять посилань у блог.
      *
      * Нічого з цього не викинуто в нікуди: процес живе на сторінці формату,
      * де його читає той, хто вже обирає; команда — на /people; «що буде,
      * коли ви підете» стало питанням у FAQ, бо це заперечення, а не розділ;
      * експертизи — блоком на /services. Кожна річ лишилась там, де на неї є
      * питання, і пішла звідти, де вона лише додає екранів.
      */}
    <Suspense fallback={null}>
      <HomeProofLine />
      <HomeCases />
      <HomeServices />
    </Suspense>
    {/* Вхід з боку клієнта: репліка власника, а не назва системи. */}
    <Suspense fallback={null}><Symptoms compact /></Suspense>
    {/* FAQ — закриває заперечення + FAQPage-розмітка */}
    <Suspense fallback={null}><HomeFaq /></Suspense>
    <Suspense fallback={null}><ClosingCta /></Suspense>
    </>
  );
}
