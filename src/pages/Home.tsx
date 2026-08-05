import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import HeroBot from '../components/HeroBot';
import { say, sayIdle } from '../components/speech';
import { track } from '../components/analytics';
import { Eyebrow, Chip } from '../components/ui';

const STATS = [
  { value: '×18', label: 'оборот у кейсі', color: '#65A30D' },
  { value: '€900K', label: 'за 18 місяців', color: '#0F9488' },
  { value: 'TOP-250', label: 'Forbes UA · кейс', color: '#12161C' },
  { value: '14', label: 'країн', color: '#B45309' },
];

const BRANDS = [
  'Henkel', 'SC Johnson', 'Kimberly-Clark', 'Schwarzkopf',
  'J&J', 'NYX', 'Missha', 'Watsons', 'Rozetka', 'Kasta', 'Lamoda', 'MAKEUP', 'Amazon', 'Epicentr',
];

const PAINS = [
  {
    n: '01',
    t: 'Реклама дорожчає, прибуток — ні',
    d: 'CAC росте щоквартала, а кожен новий клієнт купує один раз. Без системи це біг у колесі: вимкнули бюджет — продажі впали.',
    v: '0,64%',
    vl: 'типова конверсія «до» у наших аудитах',
  },
  {
    n: '02',
    t: 'База клієнтів лежить мертвим вантажем',
    d: 'Повторні покупки 12–15% замість 35–45%. Найдешевші гроші бізнесу ніхто не збирає — email дає 0–5% виручки.',
    v: '14,7%',
    vl: 'повторних до впровадження · кейс DTC',
  },
  {
    n: '03',
    t: 'Рішення наосліп, без цифр',
    d: 'Немає наскрізної аналітики та юніт-економіки — неможливо сказати, який канал заробляє, а який спалює маржу.',
    v: '≈1,6 млн ₴',
    vl: 'втрачає на місяць бізнес без системи · аудит 2026',
  },
];

const PRODUCTS = [
  {
    n: '01',
    name: 'Аудит',
    price: '$2–6K · фікс',
    term: '4–6 тижнів',
    result: 'Розрив у грошах, 19 документів, роадмапа + 4 години консультацій. Далі дієте самі.',
    say: 'Вхід у систему: аудит, що повертає розрив у гривнях →',
  },
  {
    n: '02',
    name: 'Консалтинг і супровід',
    price: '$45/год',
    term: 'від 30 год/міс',
    result: 'Зовнішній експерт веде вашу команду: спринти, пріоритети, ревʼю проти DoD.',
    say: 'Ваша команда виконує — ми відповідаємо за якість рішень →',
  },
  {
    n: '03',
    name: 'Управління проєктом',
    price: 'від $3K/міс',
    term: '6–12 міс',
    result: 'Трансформація під ключ: план, люди, бюджет. Фінальна відповідальність — на нас.',
    say: 'Потрібен результат, а не поради? Це сюди →',
  },
];

const CASE_ROW = [
  { to: '/cases/premium-textile', num: '×18', name: 'Преміум-текстиль', metric: '€48K → €900K · 18 міс', color: '#65A30D' },
  { to: '/cases/consumer-dtc', num: '+65%', name: 'Consumer DTC · Forbes TOP-250', metric: '6 нових ринків · 9 міс', color: '#0F9488' },
  { to: '/cases/fashion-apparel', num: '≥19 млн ₴', name: 'Fashion-виробник', metric: 'знайдений розрив на рік', color: '#DB2777' },
  { to: '/cases/fmcg-distribution', num: '17K SKU', name: 'FMCG-дистрибуція', metric: '+40% продажів · CRM', color: '#B45309' },
];

export default function Home() {
  const [marqueePaused, setMarqueePaused] = useState(false);
  return (
    <div className="pt-16">
      {/* ================= HERO ================= */}
      <section className="relative grid-bg overflow-hidden">
        <div className="glow-lime w-[480px] h-[480px] -top-32 -right-24" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-14 md:py-20">
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-8 items-center">
            {/* Left: message */}
            <div>
              <FadeIn>
                <Eyebrow>weexp · Commerce OS™ · операційна система росту</Eyebrow>
                <h1
                  className="font-extrabold uppercase tracking-tight"
                  style={{ fontSize: 'clamp(2.1rem, 4.9vw, 3.9rem)', lineHeight: 1.03 }}
                >
                  Збільшуємо{' '}
                  <span className="font-pixel text-[0.78em] text-[#4D7C0F] inline-block align-baseline leading-none">
                    виручку
                  </span>{' '}
                  <span className="whitespace-nowrap">e-commerce</span>
                  <br />
                  через CRO, retention і{' '}
                  <span className="font-pixel text-[0.78em] inline-block align-baseline leading-none">
                    систему
                  </span>
                </h1>
                <p className="text-[#5A6472] mt-6 max-w-xl leading-relaxed text-base md:text-lg">
                  Конверсія 0,8% → 4,2%. Оборот ×18 за 18 місяців. ROI 3.8×. Не гасла — виміряні
                  кейси. Ми перебудовуємо весь шлях покупки, щоб компанія росла швидше за її
                  рекламний бюджет.
                </p>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#4D7C0F] mt-4">
                  Для власників і CEO e-commerce з обігом від ₴1 млн/міс · UA · EU · US
                </p>
              </FadeIn>

              <FadeIn delay={0.12}>
                <div className="flex flex-wrap gap-4 mt-8">
                  <Link
                    to="/contact"
                    onMouseEnter={() => say('Diagnostic Sprint від $2K — і твій розрив у грошах на столі. Почнемо?')}
                    onMouseLeave={sayIdle}
                    onClick={() => track('cta_click', { location: 'home_hero' })}
                    className="flex items-center gap-3 bg-[#A3E635] px-7 py-3.5 text-sm font-bold tracking-wider uppercase text-black hover:brightness-95 transition-[filter]"
                  >
                    <Play size={14} fill="currentColor" />
                    Отримати аудит у грошах
                  </Link>
                  <Link
                    to="/calculator"
                    onMouseEnter={() => say('30 секунд — і розрив у гривнях на екрані. Без контактів →')}
                    onMouseLeave={sayIdle}
                    onClick={() => track('cta_click', { location: 'home_hero_calc' })}
                    className="flex items-center gap-2 border border-black/30 px-7 py-3.5 text-sm tracking-wider uppercase hover:bg-black/5 transition-colors"
                  >
                    Порахувати розрив · 30 сек
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </FadeIn>

              <FadeIn delay={0.22}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 max-w-xl">
                  {STATS.map((s) => (
                    <div key={s.label} className="card px-4 py-3">
                      <p className="font-mono font-bold text-xl" style={{ color: s.color }}>
                        {s.value}
                      </p>
                      <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#5A6472] mt-1">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>

            {/* Right: digital assistant girl */}
            <FadeIn delay={0.15} x={30} y={0}>
              <div className="max-w-[440px] mx-auto lg:mx-0 lg:ml-auto w-full">
                <HeroBot />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ================= BRANDS ================= */}
      <section data-bot-say="Це бренди й ринки, з якими ми вже працювали — від Henkel і J&J до Amazon та Rozetka." className="border-y border-black/10 py-8 bg-[#F6F7F8]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10">
          <div className="flex items-center justify-between mb-5">
            <p className="font-pixel text-[0.55rem] uppercase text-black/65">
              Бренди й ринки, з якими ми вже працювали
            </p>
            <button
              type="button"
              onClick={() => setMarqueePaused((v) => !v)}
              aria-label={marqueePaused ? 'Відновити стрічку' : 'Зупинити стрічку'}
              className="font-mono text-[0.62rem] px-2.5 py-1 border border-black/15 text-black/60 hover:text-[#4D7C0F] hover:border-[#65A30D]/50 transition-colors"
            >
              {marqueePaused ? '▶' : '❚❚'}
            </button>
          </div>
        </div>
        <div className={`marquee-mask overflow-hidden${marqueePaused ? ' marquee-paused' : ''}`}>
          <div className="marquee-track">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <Chip key={`${b}-${i}`}>{b}</Chip>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PROBLEM ================= */}
      <section
        data-bot-say="Впізнаєш хоч одну з трьох проблем? Тоді далі — про те, як їх закриває система."
        className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-16 md:py-20"
      >
        <FadeIn>
          <Eyebrow>Проблема · Чому e-commerce застрягає</Eyebrow>
          <h2
            className="font-extrabold uppercase tracking-tight"
            style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.6rem)' }}
          >
            Три причини, чому оборот стоїть на місці
          </h2>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-4 mt-9">
          {PAINS.map((p, i) => (
            <FadeIn key={p.n} delay={i * 0.08}>
              <div className="card card-hover accent-top p-6 h-full flex flex-col" style={{ '--accent': '#DC2626' } as React.CSSProperties}>
                <p className="font-pixel text-[0.5rem] text-[#DC2626]">{p.n}</p>
                <p className="font-extrabold text-lg mt-2.5">{p.t}</p>
                <p className="text-[#5A6472] text-[0.82rem] mt-2 leading-relaxed flex-1">{p.d}</p>
                <div className="mt-4 pt-4 border-t border-black/[0.07]">
                  <p className="font-mono font-bold text-2xl text-[#DC2626]">{p.v}</p>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#5A6472] mt-1">
                    {p.vl}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ================= COMMERCE OS ================= */}
      <section
        data-bot-say="Commerce OS™ — наш власний фреймворк: 12 модулів, 56 плейбуків, 52 еталони. Не «послуги» — система."
        className="border-y border-black/10 bg-[#F6F7F8]"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-16 md:py-20">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
            <FadeIn>
              <Eyebrow>Рішення · Власна методологія</Eyebrow>
              <h2
                className="font-extrabold uppercase tracking-tight"
                style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.8rem)' }}
              >
                Commerce <span className="font-pixel text-[0.8em] text-[#4D7C0F]">OS™</span> —
                операційна система росту
              </h2>
              <p className="text-[#5A6472] mt-5 leading-relaxed max-w-xl">
                Не набір послуг, а виконуваний фреймворк: кожна проблема бізнесу має свій модуль,
                кожен модуль — плейбуки з кроками та критеріями приймання, кожна метрика —
                еталон, до якого її прикладають. Тому результат відтворюваний, а не залежить від
                натхнення підрядника.
              </p>
              <div className="flex flex-wrap gap-4 mt-7">
                <Link
                  to="/os#system"
                  onClick={() => track('cta_click', { location: 'home_os_system' })}
                  className="bg-[#12161C] text-white px-6 py-3 font-mono text-xs uppercase tracking-wider hover:opacity-85 transition-opacity"
                >
                  Розібрати систему →
                </Link>
                <Link
                  to="/os#product"
                  className="border border-black/30 px-6 py-3 font-mono text-xs uppercase tracking-wider hover:bg-black/5 transition-colors"
                >
                  Подивитись демо зсередини
                </Link>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: '12', l: 'модулів системи · M01–M12' },
                  { v: '56', l: 'виконуваних плейбуків' },
                  { v: '52', l: 'еталонні метрики Gold Standards' },
                  { v: '16', l: 'документів аудиту клієнту' },
                ].map((s) => (
                  <div key={s.l} className="card px-5 py-5">
                    <p className="font-mono font-bold text-4xl text-[#4D7C0F]">{s.v}</p>
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#5A6472] mt-2 leading-relaxed">
                      {s.l}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ================= WHY OWNERS CHOOSE US ================= */}
      <section
        data-bot-say="Головне питання власника: «Скільки ви мені заробите?» Ось математика рішення — на реальних цифрах кейсів."
        className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-16 md:py-20"
      >
        <FadeIn>
          <h2
            className="font-extrabold uppercase tracking-tight"
            style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.6rem)' }}
          >
            Питання власника: <span className="text-[#4D7C0F]">«Скільки ви мені заробите?»</span>
          </h2>
        </FadeIn>

        {/* Математика рішення */}
        <FadeIn delay={0.1}>
          <div className="card p-6 md:p-8 mt-8" style={{ borderColor: 'rgba(101,163,13,0.35)' }}>
            <p className="font-pixel text-[0.5rem] text-[#4D7C0F] mb-5">
              МАТЕМАТИКА РІШЕННЯ · РЕАЛЬНІ ЦИФРИ КЕЙСІВ
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
              {[
                { k: 'Вхід', v: '$2–6K', d: 'Diagnostic Sprint: аудит, що рахує гроші' },
                { k: 'Аудит знаходить', v: '≥19 млн ₴/рік', d: 'розрив у кейсі fashion-виробника' },
                { k: 'Програма', v: 'транші під DoD', d: 'платите за прийнятий результат' },
                { k: 'ROI року', v: '3.8×', d: 'флагманський кейс · Преміум-текстиль' },
              ].map((s, i) => (
                <div key={s.k} className="relative">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#5A6472]">
                    {i + 1} · {s.k}
                  </p>
                  <p className="font-mono font-bold text-2xl md:text-[1.7rem] text-[#12161C] mt-1.5">
                    {s.v}
                  </p>
                  <p className="text-[#5A6472] text-xs mt-1.5 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {[
            {
              t: 'Рахуємо в грошах',
              d: 'Кожен висновок аудиту переведено в гривні проти 52 еталонів Gold Standards. Жодних «покращимо впізнаваність».',
            },
            {
              t: 'Ціни відкриті',
              d: 'Вилки прямо на сайті: $2–6K · $40–80K · $6–20K/міс. Без «зателефонуйте, щоб дізнатись вартість».',
            },
            {
              t: 'Бюджет під захистом',
              d: 'Етапи з Definition of Done і траншами: наступний платіж — після прийнятого результату.',
            },
            {
              t: 'Старт без ризику',
              d: '11 із 16 документів аудиту готові ще до передачі доступів — ви бачите цінність до того, як відкриваєте дані.',
            },
          ].map((c, i) => (
            <FadeIn key={c.t} delay={0.12 + i * 0.06}>
              <div className="card card-hover p-6 h-full">
                <p className="font-pixel text-[0.5rem] text-[#4D7C0F]">0{i + 1}</p>
                <p className="font-extrabold text-lg mt-2.5">{c.t}</p>
                <p className="text-[#5A6472] text-[0.82rem] mt-2 leading-relaxed">{c.d}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ================= PRODUCTS ================= */}
      <section
        data-bot-say="Купують не «агентство», а продукт: три формати з цінами, строками й результатом. Обирай двері за розміром задачі."
        className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-16 md:py-20"
      >
        <FadeIn>
          <Eyebrow>Продукти · Ціни відкриті</Eyebrow>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-9">
            <h2 className="font-extrabold uppercase tracking-tight" style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.6rem)' }}>
              Три способи купити ріст
            </h2>
            <Link to="/services" className="font-mono text-xs uppercase tracking-wider text-black/60 hover:text-[#4D7C0F] transition-colors">
              Повні умови →
            </Link>
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-5">
          {PRODUCTS.map((p, i) => (
            <FadeIn key={p.n} delay={i * 0.08}>
              <Link
                to="/services"
                onMouseEnter={() => say(p.say)}
                onMouseLeave={sayIdle}
                onClick={() => track('cta_click', { location: `home_product_${p.n}` })}
                className="card card-hover accent-top p-7 h-full flex flex-col group"
                style={{ '--accent': 'var(--lime)' } as React.CSSProperties}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-pixel text-[0.55rem] text-[#4D7C0F]">{p.n}</p>
                  <p className="font-mono text-[0.62rem] uppercase tracking-wider text-[#5A6472]">{p.term}</p>
                </div>
                <p className="font-extrabold text-xl mt-3">{p.name}</p>
                <p className="font-mono font-bold text-3xl text-[#12161C] mt-2">{p.price}</p>
                <p className="text-[#5A6472] text-[0.82rem] mt-3 leading-relaxed flex-1">{p.result}</p>
                <p className="font-mono text-xs uppercase tracking-wider mt-6 text-black/65 group-hover:text-[#4D7C0F] transition-colors">
                  Детальніше →
                </p>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ================= CASES ROW ================= */}
      <section
        data-bot-say="Чотири мандати — чотири виміряні результати. Клікай будь-який: усередині повний розбір «було → стало»."
        className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 pb-16 md:pb-20"
      >
        <FadeIn>
          <Eyebrow>Докази · Кейси з CRM, ERP і GA4</Eyebrow>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CASE_ROW.map((c, i) => (
            <FadeIn key={c.to} delay={i * 0.07}>
              <Link
                to={c.to}
                onClick={() => track('cta_click', { location: 'home_case_row' })}
                className="card card-hover accent-top p-6 h-full flex flex-col group"
                style={{ '--accent': c.color } as React.CSSProperties}
              >
                <p className="font-mono font-bold text-3xl" style={{ color: c.color }}>
                  {c.num}
                </p>
                <p className="font-bold text-sm mt-2.5 leading-snug flex-1">{c.name}</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#5A6472] mt-2">
                  {c.metric}
                </p>
                <p className="font-mono text-xs uppercase tracking-wider mt-4 text-black/60 group-hover:text-[#4D7C0F] transition-colors">
                  Розбір →
                </p>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ================= CALCULATOR TEASER ================= */}
      <section
        data-bot-say="Чотири питання — і твій недоотриманий оборот на екрані. Спробуй, це безкоштовно й без контактів."
        className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 pb-20 md:pb-24"
      >
        <FadeIn>
          <Link
            to="/calculator"
            onMouseEnter={() => say('Порахуємо, скільки грошей лишається на столі? 4 питання, 30 секунд →')}
            onMouseLeave={sayIdle}
            onClick={() => track('cta_click', { location: 'home_calculator_teaser' })}
            className="card card-hover accent-top p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
            style={{ '--accent': '#DB2777' } as React.CSSProperties}
          >
            <div>
              <p className="font-pixel text-[0.55rem] text-[#DB2777] mb-3">
                КАЛЬКУЛЯТОР · БЕЗКОШТОВНО · БЕЗ КОНТАКТІВ
              </p>
              <p className="font-extrabold text-2xl md:text-3xl">
                Скільки обороту ви недоотримуєте щороку?
              </p>
              <p className="text-[#5A6472] text-sm mt-2.5 max-w-xl leading-relaxed">
                4 питання проти еталонів вашої ніші — і розрив у гривнях на екрані. Та сама
                модель, якою ми рахуємо аудити.
              </p>
            </div>
            <span className="shrink-0 self-start md:self-auto font-mono text-sm uppercase tracking-wider border border-black/30 px-7 py-3.5 group-hover:bg-[#12161C] group-hover:text-white group-hover:border-[#12161C] transition-colors">
              Порахувати →
            </span>
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
