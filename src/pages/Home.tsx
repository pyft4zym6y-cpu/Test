import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import { track } from '../components/analytics';
import heroPhoto from '../assets/pavlo-hero.jpg';
import portraitPhoto from '../assets/pavlo-portrait.jpg';

const STATS = [
  { v: '×18', l: 'оборот у кейсі' },
  { v: '€900K', l: 'за 18 місяців' },
  { v: 'TOP-250', l: 'Forbes UA · кейс' },
  { v: '14', l: 'країн' },
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

const H = 'font-grotesk font-bold uppercase tracking-tight leading-[1.02]';

export default function Home() {
  return (
    <div className="ed-dark ed-grain" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
      {/* ================= HERO ================= */}
      <section className="relative min-h-[92vh] flex items-end overflow-hidden">
        <img src={heroPhoto} alt="Засновник weexp" className="absolute inset-0 w-full h-full object-cover object-right" />
        <div className="absolute inset-0 photo-scrim" />
        <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 pb-16 md:pb-24 pt-40">
          <FadeIn>
            <p className="kicker-ed"><span className="dot" />weexp · Commerce OS™ · маніфест</p>
            <h1 className={`${H} mt-7`} style={{ fontSize: 'clamp(2.6rem, 6vw, 5.4rem)' }}>
              Трафік — це<br />
              <span className="acid">орендована увага.</span><br />
              Ми будуємо систему,<br />
              яка накопичує вартість.
            </h1>
            <p className="text-[#B7BCC4] mt-8 max-w-xl leading-relaxed text-base md:text-lg">
              Конверсія 0,8% → 4,2%. Оборот ×18 за 18 місяців. ROI 3.8×. Не гасла — виміряні кейси.
              Перебудовуємо весь шлях покупки, щоб компанія росла швидше за рекламний бюджет.
            </p>
            <p className="kicker-ed mt-6 tracking-[0.18em] text-[0.66rem]">
              Для власників і CEO e-commerce з обігом від ₴1 млн/міс · UA · EU · US
            </p>
            <div className="flex flex-wrap gap-4 mt-9">
              <Link to="/contact" onClick={() => track('cta_click', { location: 'home_hero' })} className="btn-ed solid">
                Отримати аудит у грошах <ArrowRight size={16} />
              </Link>
              <Link to="/calculator" onClick={() => track('cta_click', { location: 'home_hero_calc' })} className="btn-ed">
                Порахувати розрив · 30 сек
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ================= STAT STRIP ================= */}
      <section className="hair-b ed-panel">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 grid grid-cols-2 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.l} className={`py-8 md:py-10 ${i ? 'hair-l' : ''} px-5 first:pl-0`}>
              <p className={`stat-ed text-4xl md:text-5xl ${i === 0 ? 'acid' : 'text-[#F3F5F7]'}`}>{s.v}</p>
              <p className="kicker-ed mt-3 text-[0.62rem] tracking-[0.16em]">{s.l}</p>
            </div>
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
        <FadeIn>
          <p className="kicker-ed mb-4">Проблема · 02</p>
          <h2 className={H} style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
            Три причини, чому <span className="acid">оборот стоїть</span> на місці
          </h2>
        </FadeIn>
        <div className="mt-12 md:mt-16">
          {PAINS.map((p, i) => (
            <FadeIn key={p.n} delay={i * 0.08}>
              <div className={`grid md:grid-cols-[auto_1fr_auto] gap-6 md:gap-12 items-start py-8 md:py-10 hair-top ${i === PAINS.length - 1 ? 'hair-b' : ''}`}>
                <p className="stat-ed text-3xl md:text-4xl text-[#3A3F47]">{p.n}</p>
                <div>
                  <p className="font-grotesk font-semibold text-xl md:text-2xl text-[#F3F5F7]">{p.t}</p>
                  <p className="text-[#9AA1AB] text-sm md:text-[0.95rem] mt-2.5 leading-relaxed max-w-2xl">{p.d}</p>
                </div>
                <div className="md:text-right md:min-w-[180px]">
                  <p className="stat-ed text-3xl md:text-4xl acid">{p.v}</p>
                  <p className="kicker-ed mt-2 text-[0.58rem] tracking-[0.12em] normal-case md:text-right" style={{ letterSpacing: '0.02em', textTransform: 'none' }}>{p.vl}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ================= COMMERCE OS ================= */}
      <section className="ed-panel hair-b hair-top">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-20 md:py-28">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
            <FadeIn>
              <p className="kicker-ed mb-4">Рішення · власна методологія</p>
              <h2 className={H} style={{ fontSize: 'clamp(2rem, 4.2vw, 3.4rem)' }}>
                Commerce <span className="acid">OS™</span> — операційна система росту
              </h2>
              <p className="text-[#9AA1AB] mt-6 leading-relaxed max-w-xl">
                Не набір послуг, а виконуваний фреймворк: кожна проблема бізнесу має свій модуль,
                кожен модуль — плейбуки з кроками та критеріями приймання, кожна метрика — еталон.
                Результат відтворюваний, а не залежить від натхнення підрядника.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link to="/os#system" onClick={() => track('cta_click', { location: 'home_os_system' })} className="btn-ed solid">Розібрати систему <ArrowRight size={16} /></Link>
                <Link to="/os#product" className="btn-ed">Демо зсередини</Link>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="grid grid-cols-2 gap-px bg-[rgba(255,255,255,0.10)] border border-[rgba(255,255,255,0.10)]">
                {[
                  { v: '12', l: 'модулів системи · M01–M12' },
                  { v: '56', l: 'виконуваних плейбуків' },
                  { v: '52', l: 'еталонні метрики Gold Standards' },
                  { v: '19', l: 'документів аудиту клієнту' },
                ].map((s) => (
                  <div key={s.l} className="ed-dark px-6 py-8">
                    <p className="stat-ed text-5xl acid">{s.v}</p>
                    <p className="kicker-ed mt-3 text-[0.6rem] tracking-[0.12em] leading-relaxed">{s.l}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ================= PORTRAIT / OWNER QUESTION ================= */}
      <section className="grid lg:grid-cols-2 items-stretch hair-b">
        <div className="relative min-h-[420px] lg:min-h-[560px] overflow-hidden order-2 lg:order-1">
          <img src={portraitPhoto} alt="Засновник weexp" className="absolute inset-0 w-full h-full object-cover duotone" />
          <div className="absolute inset-0 photo-scrim-b lg:hidden" />
        </div>
        <div className="order-1 lg:order-2 flex items-center px-5 sm:px-8 md:px-12 py-16 md:py-24 lg:hair-l">
          <FadeIn>
            <p className="kicker-ed mb-4">Питання власника · 04</p>
            <h2 className={H} style={{ fontSize: 'clamp(1.9rem, 3.6vw, 3rem)' }}>
              «Скільки ви <span className="acid">мені заробите?»</span>
            </h2>
            <div className="mt-9 space-y-6 max-w-lg">
              {[
                { t: 'Рахуємо в грошах', d: 'Кожен висновок аудиту переведено в гривні проти 52 еталонів Gold Standards. Жодних «покращимо впізнаваність».' },
                { t: 'Ціни відкриті', d: 'Три формати співпраці, усі ціни на сторінці «Співпраця», без «зателефонуйте менеджеру».' },
                { t: 'Бюджет під захистом', d: 'Етапи з Definition of Done і траншами: наступний платіж — після прийнятого результату.' },
              ].map((c, i) => (
                <div key={c.t} className="flex gap-5 hair-top pt-6">
                  <span className="stat-ed text-lg text-[#3A3F47]">0{i + 1}</span>
                  <div>
                    <p className="font-grotesk font-semibold text-lg text-[#F3F5F7]">{c.t}</p>
                    <p className="text-[#9AA1AB] text-sm mt-1.5 leading-relaxed">{c.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ================= PRODUCTS ================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-20 md:py-28">
        <FadeIn>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <p className="kicker-ed mb-4">Продукти · ціни відкриті</p>
              <h2 className={H} style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>Три способи <span className="acid">купити ріст</span></h2>
            </div>
            <Link to="/services" className="btn-ed">Повні умови <ArrowUpRight size={15} /></Link>
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-px bg-[rgba(255,255,255,0.10)] border border-[rgba(255,255,255,0.10)]">
          {PRODUCTS.map((p, i) => (
            <FadeIn key={p.n} delay={i * 0.08}>
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
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ================= CASES ================= */}
      <section className="ed-panel hair-top hair-b">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-20 md:py-28">
          <FadeIn><p className="kicker-ed mb-10">Докази · кейси з CRM, ERP і GA4</p></FadeIn>
          <div>
            {CASE_ROW.map((c, i) => (
              <FadeIn key={c.to} delay={i * 0.06}>
                <Link to={c.to} onClick={() => track('cta_click', { location: 'home_case_row' })} className="grid md:grid-cols-[220px_1fr_auto] gap-4 md:gap-10 items-center py-7 hair-top group hover:bg-[#0A0B0D] transition-colors px-2 -mx-2">
                  <p className="stat-ed text-4xl md:text-5xl acid">{c.num}</p>
                  <div>
                    <p className="font-grotesk font-semibold text-lg md:text-xl text-[#F3F5F7]">{c.name}</p>
                    <p className="kicker-ed mt-1.5 text-[0.6rem] tracking-[0.1em]" style={{ textTransform: 'none', letterSpacing: '0.02em' }}>{c.metric}</p>
                  </div>
                  <ArrowUpRight size={22} className="text-[#3A3F47] group-hover:text-[#C7F94B] transition-colors hidden md:block" />
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CALCULATOR CTA ================= */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-20 md:py-28">
        <FadeIn>
          <Link to="/calculator" onClick={() => track('cta_click', { location: 'home_calculator_teaser' })} className="block border border-[rgba(255,255,255,0.12)] p-10 md:p-16 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-[rgba(199,249,75,0.5)] transition-colors">
            <div>
              <p className="kicker-ed mb-5">Калькулятор · безкоштовно · без контактів</p>
              <p className={`${H}`} style={{ fontSize: 'clamp(1.9rem, 3.8vw, 3rem)' }}>
                Скільки обороту ви <span className="acid">недоотримуєте</span> щороку?
              </p>
              <p className="text-[#9AA1AB] mt-4 max-w-xl leading-relaxed">
                4 питання проти еталонів вашої ніші — і розрив у гривнях на екрані. Та сама модель,
                якою ми рахуємо аудити.
              </p>
            </div>
            <span className="btn-ed solid shrink-0 self-start md:self-auto">Порахувати <ArrowRight size={16} /></span>
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
