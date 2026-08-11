import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { track } from '../components/analytics';
import {
  ScrollProgress,
  LineReveal,
  Rise,
  CountUp,
  Magnetic,
  useParallax,
} from '../components/immersive';
import ShaderBackground from '../components/ShaderBackground';
import Cursor from '../components/Cursor';
import Preloader from '../components/Preloader';
import heroPhoto from '../assets/pavlo-hero.jpg';
import portraitPhoto from '../assets/pavlo-portrait.jpg';

/* числовые статы с частями для count-up */
const STATS = [
  { to: 18, prefix: '×', suffix: '', l: 'оборот у кейсі', acid: true },
  { to: 900, prefix: '€', suffix: 'K', l: 'за 18 місяців', acid: false },
  { to: 250, prefix: 'TOP-', suffix: '', l: 'Forbes UA · кейс', acid: false },
  { to: 14, prefix: '', suffix: '', l: 'країн', acid: false },
];

const BRANDS = [
  'Henkel', 'SC Johnson', 'Kimberly-Clark', 'Schwarzkopf',
  'J&J', 'NYX', 'Missha', 'Watsons', 'Rozetka', 'Kasta', 'Lamoda', 'MAKEUP', 'Amazon', 'Epicentr',
];

const PAINS = [
  { n: '01', t: 'Реклама дорожчає, прибуток — ні', d: 'CAC росте щокварталу, а кожен новий клієнт купує один раз. Без системи це біг у колесі: вимкнули бюджет — продажі впали.', v: '0,64%', vl: 'типова конверсія «до» у наших аудитах' },
  { n: '02', t: 'База клієнтів лежить мертвим вантажем', d: 'Повторні покупки 12–15% замість 35–45%. Найдешевші гроші бізнесу ніхто не збирає — email дає 0–5% виручки.', v: '14,7%', vl: 'повторних до впровадження · кейс DTC' },
  { n: '03', t: 'Рішення наосліп, без цифр', d: 'Немає наскрізної аналітики та юніт-економіки — неможливо сказати, який канал заробляє, а який спалює маржу.', v: '≈1,6 млн ₴', vl: 'втрачає на місяць бізнес без системи' },
];

const PRODUCTS = [
  { n: '01', name: 'Аудит', price: 'Фіксована ціна', term: '4–6 тижнів', result: 'Розрив у грошах, повний пакет документів, роадмапа + 4 години консультацій. Далі дієте самі.' },
  { n: '02', name: 'Консалтинг і супровід', price: 'Погодинно', term: 'помісячно', result: 'Зовнішній експерт веде вашу команду: спринти, пріоритети, ревʼю проти DoD.' },
  { n: '03', name: 'Управління проєктом', price: 'Під ключ', term: '6–12 міс', result: 'Трансформація під ключ: план, люди, бюджет. Фінальна відповідальність — на нас.' },
];

const CASE_ROW = [
  { to: '/cases/premium-textile', num: '×18', name: 'Преміум-текстиль', metric: '€48K → €900K · 18 міс' },
  { to: '/cases/consumer-dtc', num: '+65%', name: 'Consumer DTC · Forbes TOP-250', metric: '6 нових ринків · 9 міс' },
  { to: '/cases/fashion-apparel', num: '≥19 млн ₴', name: 'Fashion-виробник', metric: 'знайдений розрив на рік' },
  { to: '/cases/fmcg-distribution', num: '17K SKU', name: 'FMCG-дистрибуція', metric: '+40% продажів · CRM' },
];

const OS_GRID = [
  { to: 12, l: 'модулів системи · M01–M12' },
  { to: 56, l: 'виконуваних плейбуків' },
  { to: 52, l: 'еталонні метрики Gold Standards' },
  { to: 19, l: 'документів аудиту клієнту' },
];

const H = 'font-grotesk font-bold uppercase tracking-tight leading-[1.02]';

/* ─── HERO: живой WebGL-фон + маскированное фото + kinetic-манифест ─── */
function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const photoScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.28]);
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  // mouse-параллакс: контент и фото едут в противоход курсору
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const cx = useSpring(useTransform(mx, [-0.5, 0.5], [14, -14]), { stiffness: 120, damping: 20 });
  const cy = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 20 });
  const px = useSpring(useTransform(mx, [-0.5, 0.5], [-22, 22]), { stiffness: 90, damping: 22 });
  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const PHOTO_MASK = 'linear-gradient(90deg, transparent 0%, transparent 28%, rgba(0,0,0,0.5) 48%, #000 66%)';

  return (
    <section ref={ref} onMouseMove={onMove} className="relative min-h-[100vh] flex items-end overflow-hidden ed-dark">
      {/* живой шейдер-фон */}
      <div className="absolute inset-0">
        <ShaderBackground />
      </div>
      {/* фото основателя — маскировано слева, живёт поверх шейдера справа */}
      <motion.div style={{ x: px }} className="absolute inset-0 will-change-transform">
        <motion.img
          src={heroPhoto}
          alt="Засновник weexp"
          style={{ scale: photoScale, y: photoY, WebkitMaskImage: PHOTO_MASK, maskImage: PHOTO_MASK }}
          className="absolute inset-0 w-full h-full object-cover object-right will-change-transform"
        />
      </motion.div>
      <div className="absolute inset-0 photo-scrim pointer-events-none" />
      <motion.div
        style={{ y: contentY, opacity: contentOpacity, x: cx, translateY: cy }}
        className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 pb-16 md:pb-24 pt-40"
      >
        <motion.p
          className="kicker-ed"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="dot" />weexp · Commerce OS™ · маніфест
        </motion.p>
        <LineReveal
          as="h1"
          className={`${H} mt-7`}
          style={{ fontSize: 'clamp(2.6rem, 6vw, 5.4rem)' }}
          lines={[
            <>Трафік — це</>,
            <span className="acid">орендована увага.</span>,
            <>Ми будуємо систему,</>,
            <>яка накопичує вартість.</>,
          ]}
        />
        <motion.p
          className="text-[#B7BCC4] mt-8 max-w-xl leading-relaxed text-base md:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          Конверсія 0,8% → 4,2%. Оборот ×18 за 18 місяців. ROI 3.8×. Не гасла — виміряні кейси.
          Перебудовуємо весь шлях покупки, щоб компанія росла швидше за рекламний бюджет.
        </motion.p>
        <motion.p
          className="kicker-ed mt-6 tracking-[0.18em] text-[0.66rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          Для власників і CEO e-commerce з обігом від ₴1 млн/міс · UA · EU · US
        </motion.p>
        <motion.div
          className="flex flex-wrap gap-4 mt-9"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <Magnetic>
            <Link to="/contact" onClick={() => track('cta_click', { location: 'home_hero' })} className="btn-ed solid">
              Отримати аудит у грошах <ArrowRight size={16} />
            </Link>
          </Magnetic>
          <Magnetic>
            <Link to="/calculator" onClick={() => track('cta_click', { location: 'home_hero_calc' })} className="btn-ed">
              Порахувати розрив · 30 сек
            </Link>
          </Magnetic>
        </motion.div>
      </motion.div>

      {/* индикатор скролла */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 1 }}
        style={{ opacity: contentOpacity }}
      >
        <span className="kicker-ed text-[0.55rem] tracking-[0.3em]">SCROLL</span>
        <motion.div
          className="w-[1px] h-8 bg-gradient-to-b from-[var(--acid)] to-transparent"
          animate={{ scaleY: [0.3, 1, 0.3], originY: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}

/* ─── Горизонтальный pinned-скролл кейсов ─── */
function CasesScroll() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-72%']);

  return (
    <section ref={ref} className="relative h-[320vh] ed-panel hair-top">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 md:px-12 mb-10 md:mb-14">
          <p className="kicker-ed mb-4">Докази · 06 · кейси з CRM, ERP і GA4</p>
          <h2 className={H} style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}>
            Цифри, які <span className="acid">рухаються</span>
          </h2>
        </div>
        <motion.div style={{ x }} className="flex gap-5 md:gap-8 pl-5 sm:pl-8 md:pl-[max(3rem,calc((100vw-80rem)/2+3rem))] will-change-transform">
          {CASE_ROW.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              onClick={() => track('cta_click', { location: 'home_case_scroll' })}
              className="card-ed group shrink-0 w-[78vw] sm:w-[58vw] md:w-[40vw] lg:w-[32vw] p-8 md:p-10 flex flex-col justify-between min-h-[52vh] md:min-h-[46vh]"
            >
              <div className="flex items-start justify-between">
                <span className="kicker-ed text-[0.6rem]">Кейс</span>
                <ArrowUpRight size={22} className="text-[#3A3F47] group-hover:text-[var(--acid)] transition-colors" />
              </div>
              <div>
                <p className="stat-ed text-5xl md:text-7xl acid">{c.num}</p>
                <p className="font-grotesk font-semibold text-xl md:text-2xl text-[#F3F5F7] mt-5">{c.name}</p>
                <p className="kicker-ed mt-3 text-[0.62rem] tracking-[0.06em]" style={{ textTransform: 'none' }}>{c.metric}</p>
              </div>
            </Link>
          ))}
          <Link
            to="/cases"
            onClick={() => track('cta_click', { location: 'home_case_scroll_all' })}
            className="shrink-0 w-[60vw] sm:w-[40vw] md:w-[28vw] lg:w-[22vw] flex items-center justify-center border border-dashed border-[rgba(255,255,255,0.18)] hover:border-[var(--acid)] transition-colors group"
          >
            <span className="btn-ed">Усі кейси <ArrowRight size={16} /></span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Портрет с параллаксом ─── */
function PortraitSplit() {
  const ref = useRef<HTMLElement>(null);
  const y = useParallax(ref as React.RefObject<HTMLElement>, 60);
  return (
    <section className="grid lg:grid-cols-2 items-stretch hair-b overflow-hidden">
      <div ref={ref as React.RefObject<HTMLDivElement>} className="relative min-h-[420px] lg:min-h-[600px] overflow-hidden order-2 lg:order-1">
        <motion.img
          src={portraitPhoto}
          alt="Засновник weexp"
          style={{ y }}
          className="absolute -inset-y-[10%] inset-x-0 w-full h-[120%] object-cover duotone will-change-transform"
        />
        <div className="absolute inset-0 photo-scrim-b lg:hidden" />
      </div>
      <div className="order-1 lg:order-2 flex items-center px-5 sm:px-8 md:px-12 py-16 md:py-24 lg:hair-l">
        <div>
          <Rise><p className="kicker-ed mb-4">Питання власника · 04</p></Rise>
          <LineReveal
            className={H}
            style={{ fontSize: 'clamp(1.9rem, 3.6vw, 3rem)' }}
            lines={[<>«Скільки ви</>, <span className="acid">мені заробите?»</span>]}
          />
          <div className="mt-9 space-y-6 max-w-lg">
            {[
              { t: 'Рахуємо в грошах', d: 'Кожен висновок аудиту переведено в гривні проти 52 еталонів Gold Standards. Жодних «покращимо впізнаваність».' },
              { t: 'Ціни відкриті', d: 'Три формати співпраці, усі ціни на сторінці «Співпраця», без «зателефонуйте менеджеру».' },
              { t: 'Бюджет під захистом', d: 'Етапи з Definition of Done і траншами: наступний платіж — після прийнятого результату.' },
            ].map((c, i) => (
              <Rise key={c.t} delay={i * 0.08}>
                <div className="flex gap-5 hair-top pt-6">
                  <span className="stat-ed text-lg text-[#3A3F47]">0{i + 1}</span>
                  <div>
                    <p className="font-grotesk font-semibold text-lg text-[#F3F5F7]">{c.t}</p>
                    <p className="text-[#9AA1AB] text-sm mt-1.5 leading-relaxed">{c.d}</p>
                  </div>
                </div>
              </Rise>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="ed-dark ed-grain" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
      <Preloader />
      <Cursor />
      <ScrollProgress />

      <Hero />

      {/* ================= STAT STRIP (count-up) ================= */}
      <section className="hair-b ed-panel">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 grid grid-cols-2 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Rise key={s.l} delay={i * 0.08} className={`py-8 md:py-10 ${i ? 'hair-l' : ''} px-5 first:pl-0`}>
              <p className={`stat-ed text-4xl md:text-5xl ${s.acid ? 'acid' : 'text-[#F3F5F7]'}`}>
                <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <p className="kicker-ed mt-3 text-[0.62rem] tracking-[0.16em]">{s.l}</p>
            </Rise>
          ))}
        </div>
      </section>

      {/* ================= BRANDS ================= */}
      <section className="hair-b">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-9">
          <p className="kicker-ed mb-5 text-[0.62rem]">Бренди й ринки з досвіду засновника · як найманого керівника</p>
          <div className="marquee-mask overflow-hidden">
            <div className="marquee-track">
              {[...BRANDS, ...BRANDS].map((b, i) => (
                <span key={`${b}-${i}`} className="font-grotesk uppercase tracking-[0.14em] text-sm text-[#8A9099] whitespace-nowrap px-4">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= PROBLEM ================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-20 md:py-28">
        <Rise><p className="kicker-ed mb-4">Проблема · 02</p></Rise>
        <LineReveal
          className={H}
          style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}
          lines={[<>Три причини, чому</>, <><span className="acid">оборот стоїть</span> на місці</>]}
        />
        <div className="mt-12 md:mt-16">
          {PAINS.map((p, i) => (
            <Rise key={p.n} delay={i * 0.06}>
              <div className={`grid md:grid-cols-[auto_1fr_auto] gap-6 md:gap-12 items-start py-8 md:py-10 hair-top ${i === PAINS.length - 1 ? 'hair-b' : ''}`}>
                <p className="stat-ed text-3xl md:text-4xl text-[#3A3F47]">{p.n}</p>
                <div>
                  <p className="font-grotesk font-semibold text-xl md:text-2xl text-[#F3F5F7]">{p.t}</p>
                  <p className="text-[#9AA1AB] text-sm md:text-[0.95rem] mt-2.5 leading-relaxed max-w-2xl">{p.d}</p>
                </div>
                <div className="md:text-right md:min-w-[180px]">
                  <p className="stat-ed text-3xl md:text-4xl acid">{p.v}</p>
                  <p className="kicker-ed mt-2 text-[0.58rem] tracking-[0.12em]" style={{ letterSpacing: '0.02em', textTransform: 'none' }}>{p.vl}</p>
                </div>
              </div>
            </Rise>
          ))}
        </div>
      </section>

      {/* ================= COMMERCE OS ================= */}
      <section className="ed-panel hair-b hair-top">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-20 md:py-28">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
            <div>
              <Rise><p className="kicker-ed mb-4">Рішення · власна методологія</p></Rise>
              <LineReveal
                className={H}
                style={{ fontSize: 'clamp(2rem, 4.2vw, 3.4rem)' }}
                lines={[<>Commerce <span className="acid">OS™</span></>, <>операційна система росту</>]}
              />
              <Rise delay={0.1}>
                <p className="text-[#9AA1AB] mt-6 leading-relaxed max-w-xl">
                  Не набір послуг, а виконуваний фреймворк: кожна проблема бізнесу має свій модуль,
                  кожен модуль — плейбуки з кроками та критеріями приймання, кожна метрика — еталон.
                  Результат відтворюваний, а не залежить від натхнення підрядника.
                </p>
              </Rise>
              <Rise delay={0.16}>
                <div className="flex flex-wrap gap-4 mt-8">
                  <Magnetic><Link to="/os#system" onClick={() => track('cta_click', { location: 'home_os_system' })} className="btn-ed solid">Розібрати систему <ArrowRight size={16} /></Link></Magnetic>
                  <Magnetic><Link to="/os#product" className="btn-ed">Демо зсередини</Link></Magnetic>
                </div>
              </Rise>
            </div>
            <Rise delay={0.15}>
              <div className="grid grid-cols-2 gap-px bg-[rgba(255,255,255,0.10)] border border-[rgba(255,255,255,0.10)]">
                {OS_GRID.map((s) => (
                  <div key={s.l} className="ed-dark px-6 py-8">
                    <p className="stat-ed text-5xl acid"><CountUp to={s.to} /></p>
                    <p className="kicker-ed mt-3 text-[0.6rem] tracking-[0.12em] leading-relaxed">{s.l}</p>
                  </div>
                ))}
              </div>
            </Rise>
          </div>
        </div>
      </section>

      <PortraitSplit />

      {/* ================= PRODUCTS ================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-20 md:py-28">
        <Rise>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <p className="kicker-ed mb-4">Продукти · ціни відкриті</p>
              <h2 className={H} style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>Три способи <span className="acid">купити ріст</span></h2>
            </div>
            <Link to="/services" className="btn-ed">Повні умови <ArrowUpRight size={15} /></Link>
          </div>
        </Rise>
        <div className="grid md:grid-cols-3 gap-px bg-[rgba(255,255,255,0.10)] border border-[rgba(255,255,255,0.10)]">
          {PRODUCTS.map((p, i) => (
            <Rise key={p.n} delay={i * 0.08}>
              <Link to="/services" onClick={() => track('cta_click', { location: `home_product_${p.n}` })} className="ed-dark block p-8 h-full flex flex-col group hover:bg-[#101216] transition-colors">
                <div className="flex items-baseline justify-between">
                  <span className="stat-ed text-2xl text-[#3A3F47]">{p.n}</span>
                  <span className="kicker-ed text-[0.6rem]">{p.term}</span>
                </div>
                <p className="font-grotesk font-semibold text-2xl mt-6 text-[#F3F5F7]">{p.name}</p>
                <p className="stat-ed text-xl acid mt-2">{p.price}</p>
                <p className="text-[#9AA1AB] text-sm mt-4 leading-relaxed flex-1">{p.result}</p>
                <span className="kicker-ed text-[0.62rem] mt-8 group-hover:text-[#C7F94B] transition-colors inline-flex items-center gap-1.5">Детальніше <ArrowUpRight size={13} /></span>
              </Link>
            </Rise>
          ))}
        </div>
      </section>

      <CasesScroll />

      {/* ================= CALCULATOR CTA ================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-20 md:py-28">
        <Rise>
          <Link to="/calculator" onClick={() => track('cta_click', { location: 'home_calculator_teaser' })} className="relative block overflow-hidden border border-[rgba(255,255,255,0.12)] p-10 md:p-16 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-[rgba(199,249,75,0.5)] transition-colors">
            <div className="absolute inset-0 opacity-40 pointer-events-none"><ShaderBackground /></div>
            <div className="relative">
              <p className="kicker-ed mb-5">Калькулятор · безкоштовно · без контактів</p>
              <p className={`${H}`} style={{ fontSize: 'clamp(1.9rem, 3.8vw, 3rem)' }}>
                Скільки обороту ви <span className="acid">недоотримуєте</span> щороку?
              </p>
              <p className="text-[#9AA1AB] mt-4 max-w-xl leading-relaxed">
                4 питання проти еталонів вашої ніші — і розрив у гривнях на екрані. Та сама модель,
                якою ми рахуємо аудити.
              </p>
            </div>
            <Magnetic className="relative shrink-0 self-start md:self-auto">
              <span className="btn-ed solid">Порахувати <ArrowRight size={16} /></span>
            </Magnetic>
          </Link>
        </Rise>
      </section>
    </div>
  );
}
