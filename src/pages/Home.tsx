import { useRef, useState } from 'react';
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

/* ─── HERO: кіношний. Величезний червоний круг за фігурою засновника,
   серіф-заголовок, віньєтка й mouse-параллакс шарів (мотив із референсу). ─── */
function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const photoScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.22]);
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, 1.35]);
  const orbY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-16%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  // mouse-параллакс шарів: круг, фото і контент рухаються з різною глибиною
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const cx = useSpring(useTransform(mx, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 20 });
  const orbX = useSpring(useTransform(mx, [-0.5, 0.5], [-34, 34]), { stiffness: 70, damping: 22 });
  const orbMy = useSpring(useTransform(my, [-0.5, 0.5], [-22, 22]), { stiffness: 70, damping: 22 });
  const photoX = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 90, damping: 22 });
  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const PHOTO_MASK = 'linear-gradient(90deg, transparent 0%, transparent 48%, rgba(0,0,0,0.55) 62%, #000 76%)';

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative min-h-[100vh] flex items-end overflow-hidden cine-vignette"
      style={{ background: 'radial-gradient(130% 120% at 66% 8%, #14090b 0%, #0A0608 48%, #050405 100%)' }}
    >
      {/* ── ВЕЛИКИЙ ЧЕРВОНИЙ КРУГ за фігурою ── */}
      <motion.div
        style={{ scale: orbScale, y: orbY, x: orbX, translateY: orbMy }}
        className="absolute right-[-8%] md:right-[4%] top-1/2 -translate-y-1/2 will-change-transform"
        aria-hidden
      >
        <div className="red-orb" style={{ width: 'min(78vh, 62vw)', height: 'min(78vh, 62vw)' }} />
        <div className="red-ring" style={{ inset: '-6%', width: 'auto', height: 'auto' }} />
      </motion.div>

      {/* ── ФОТО ЗАСНОВНИКА поверх круга, кіношний контраст ── */}
      <motion.div style={{ x: photoX }} className="absolute inset-0 will-change-transform">
        <motion.img
          src={heroPhoto}
          alt="Засновник weexp"
          style={{ scale: photoScale, y: photoY, WebkitMaskImage: PHOTO_MASK, maskImage: PHOTO_MASK }}
          className="absolute inset-0 w-full h-full object-cover object-[70%_center] duotone-red will-change-transform"
        />
      </motion.div>

      {/* легкий скрим під текст зліва */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(5,4,5,0.98) 0%, rgba(5,4,5,0.9) 30%, rgba(5,4,5,0.4) 55%, rgba(5,4,5,0.05) 80%, transparent 100%)' }} />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity, x: cx }}
        className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 pb-16 md:pb-24 pt-40"
      >
        <motion.p
          className="act-mark flex items-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block w-8 h-px bg-[var(--acid)]" />ACT I · МАНІФЕСТ
        </motion.p>

        {/* серіф-заголовок з gliтч-акцентом */}
        <h1 className="mt-6" style={{ fontSize: 'clamp(2.7rem, 6.4vw, 6rem)', lineHeight: 0.98 }}>
          <LineReveal
            as="span"
            className="font-cinema block text-[#F3F5F7]"
            lines={[
              <>Трафік — це</>,
              <span className="acid italic" data-text="орендована увага." >орендована увага.</span>,
            ]}
          />
          <LineReveal
            as="span"
            className={`${H} block mt-3`}
            style={{ fontSize: 'clamp(1.5rem, 3.4vw, 3.1rem)' }}
            lines={[<>Ми будуємо систему, яка</>, <>накопичує вартість.</>]}
          />
        </h1>

        <motion.p
          className="text-[#C2C6CC] mt-8 max-w-xl leading-relaxed text-base md:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          Конверсія 0,8% → 4,2%. Оборот ×18 за 18 місяців. ROI 3.8×. Не гасла — виміряні кейси.
          Перебудовуємо весь шлях покупки, щоб компанія росла швидше за рекламний бюджет.
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

/* ─── Кінострічка: горизонтальний pinned-скролл кейсів як кадри плівки
   з перфорацією по краях (мотив «кіноленти»). ─── */
function CasesScroll() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-72%']);
  const holes = Array.from({ length: 40 });

  return (
    <section ref={ref} className="relative h-[320vh] hair-top" style={{ background: '#050405' }}>
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 md:px-12 mb-8 md:mb-12">
          <p className="act-mark mb-4">ACT IV · КІНОСТРІЧКА ДОКАЗІВ</p>
          <h2 className="font-cinema text-[#F3F5F7]" style={{ fontSize: 'clamp(2rem, 4.6vw, 3.6rem)', lineHeight: 0.95 }}>
            Цифри, які <span className="acid italic">рухаються</span>
          </h2>
        </div>

        {/* смуга плівки */}
        <div className="relative border-y border-[rgba(255,255,255,0.12)] bg-[#0A0708] py-8 md:py-10">
          {/* перфорація зверху/знизу */}
          <div className="sprocket t">{holes.map((_, i) => <span key={i} />)}</div>
          <div className="sprocket b">{holes.map((_, i) => <span key={i} />)}</div>

          <motion.div style={{ x }} className="flex gap-3 md:gap-4 pl-5 sm:pl-8 md:pl-[max(3rem,calc((100vw-80rem)/2+3rem))] will-change-transform">
            {CASE_ROW.map((c, i) => (
              <Link
                key={c.to}
                to={c.to}
                onClick={() => track('cta_click', { location: 'home_case_scroll' })}
                data-cursor
                className="relative group shrink-0 w-[80vw] sm:w-[56vw] md:w-[38vw] lg:w-[30vw] min-h-[46vh] md:min-h-[42vh] flex flex-col justify-between p-7 md:p-9 border-x border-[rgba(255,255,255,0.1)] bg-gradient-to-b from-[#100a0b] to-[#080607] hover:from-[#1a0c0e] transition-colors overflow-hidden"
              >
                <div className="red-orb absolute -right-16 -bottom-16 opacity-0 group-hover:opacity-25 transition-opacity duration-500" style={{ width: 200, height: 200 }} />
                <div className="relative flex items-center justify-between">
                  <span className="kicker-ed text-[0.58rem]">КАДР {String(i + 1).padStart(2, '0')}</span>
                  <ArrowUpRight size={20} className="text-[#3A3F47] group-hover:text-[var(--acid)] transition-colors" />
                </div>
                <div className="relative">
                  <p className="font-cinema acid" style={{ fontSize: 'clamp(2.8rem, 6vw, 4.6rem)', lineHeight: 0.9 }}>{c.num}</p>
                  <p className="font-grotesk font-semibold uppercase tracking-tight text-lg md:text-2xl text-[#F3F5F7] mt-4">{c.name}</p>
                  <p className="kicker-ed mt-3 text-[0.6rem] tracking-[0.04em]" style={{ textTransform: 'none' }}>{c.metric}</p>
                </div>
              </Link>
            ))}
            <Link
              to="/cases"
              onClick={() => track('cta_click', { location: 'home_case_scroll_all' })}
              data-cursor
              className="shrink-0 w-[60vw] sm:w-[40vw] md:w-[26vw] lg:w-[20vw] flex items-center justify-center border-x border border-dashed border-[rgba(225,29,42,0.4)] hover:border-[var(--acid)] transition-colors"
            >
              <span className="btn-ed">Усі кейси <ArrowRight size={16} /></span>
            </Link>
          </motion.div>
        </div>
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

/* ─── Hover-reveal editorial-список продуктів: рядок реагує, кіно-кадр
   у червоному duotone летить за курсором (сигнатурний award-ефект). ─── */
const REVEAL_IMG = [portraitPhoto, heroPhoto, portraitPhoto];
function RevealProducts() {
  const mediaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const onMove = (e: React.MouseEvent) => {
    const m = mediaRef.current;
    if (!m) return;
    m.style.left = `${e.clientX}px`;
    m.style.top = `${e.clientY}px`;
  };
  const enter = (i: number) => {
    setActive(i);
    if (imgRef.current) imgRef.current.src = REVEAL_IMG[i];
    mediaRef.current?.classList.add('on');
  };
  const leave = () => {
    setActive(null);
    mediaRef.current?.classList.remove('on');
  };

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-20 md:py-28" onMouseMove={onMove}>
      <Rise>
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10 md:mb-14">
          <div>
            <p className="act-mark mb-4">ACT III · ПРОДУКТИ</p>
            <h2 className="font-cinema text-[#F3F5F7]" style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', lineHeight: 0.95 }}>
              Три способи <span className="acid italic">купити ріст</span>
            </h2>
          </div>
          <Link to="/services" className="btn-ed">Повні умови <ArrowUpRight size={15} /></Link>
        </div>
      </Rise>

      {/* плаваючий кіно-кадр */}
      <div ref={mediaRef} className="reveal-media duotone-red-wrap hidden md:block">
        <img ref={imgRef} src={REVEAL_IMG[0]} alt="" className="duotone-red" />
      </div>

      <div className="hair-red border-t">
        {PRODUCTS.map((p, i) => (
          <Link
            key={p.n}
            to="/services"
            onClick={() => track('cta_click', { location: `home_product_${p.n}` })}
            onMouseEnter={() => enter(i)}
            onMouseLeave={leave}
            data-cursor
            className={`reveal-row group flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-6 py-7 md:py-11 hair-b ${active !== null && active !== i ? 'opacity-40' : 'opacity-100'} transition-opacity duration-300`}
          >
            <span className="flex items-baseline gap-4 md:gap-7 min-w-0">
              <span className="rr-index stat-ed text-2xl md:text-3xl text-[#3A3F47] transition-colors shrink-0">{p.n}</span>
              <span className="rr-title font-cinema text-3xl md:text-5xl lg:text-6xl text-inherit leading-none">{p.name}</span>
            </span>
            <span className="flex items-center gap-5 md:gap-8 shrink-0">
              <span className="stat-ed text-base md:text-xl acid text-right">{p.price}</span>
              <span className="kicker-ed text-[0.62rem] whitespace-nowrap inline-flex items-center gap-2">
                {p.term}
                <ArrowUpRight size={16} className="text-[#3A3F47] group-hover:text-[var(--acid)] transition-colors" />
              </span>
            </span>
          </Link>
        ))}
      </div>
      <Rise>
        <p className="text-[#8A9099] text-sm mt-8 max-w-2xl leading-relaxed">
          Кожен формат — фіксований результат і Definition of Done. Наведіть на рядок, щоб побачити кадр;
          повні умови й ціни — на сторінці «Послуги».
        </p>
      </Rise>
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

      <RevealProducts />

      <CasesScroll />

      {/* ================= CALCULATOR CTA ================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-20 md:py-28">
        <Rise>
          <Link to="/calculator" onClick={() => track('cta_click', { location: 'home_calculator_teaser' })} className="relative block overflow-hidden border border-[rgba(225,29,42,0.35)] p-10 md:p-16 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-[rgba(225,29,42,0.7)] transition-colors" style={{ background: 'radial-gradient(120% 140% at 90% 20%, rgba(122,10,18,0.5) 0%, rgba(10,6,8,0.4) 55%, transparent 100%)' }}>
            <div className="red-orb absolute -right-24 -top-24 opacity-30 pointer-events-none" style={{ width: 320, height: 320 }} />
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
