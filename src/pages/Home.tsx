import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import HeroBot from '../components/HeroBot';
import { say, sayIdle } from '../components/speech';
import { track } from '../components/analytics';
import { Rocket, ArrowUp, Star, Spark, Scribble, Megaphone } from '../components/Doodles';

const STATS = [
  { value: '×18', label: 'оборот у кейсі', color: '#4D7C0F' },
  { value: '€900K', label: 'за 18 місяців', color: '#0F9488' },
  { value: 'TOP-250', label: 'Forbes UA · кейс', color: '#111111' },
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
    d: 'CAC росте щокварталу, а кожен новий клієнт купує один раз. Без системи це біг у колесі: вимкнули бюджет — продажі впали.',
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
    price: 'Фіксована ціна',
    term: '4–6 тижнів',
    result: 'Розрив у грошах, повний пакет документів, роадмапа + 4 години консультацій. Далі дієте самі.',
    say: 'Вхід у систему: аудит, що повертає розрив у гривнях →',
  },
  {
    n: '02',
    name: 'Консалтинг і супровід',
    price: 'Погодинно',
    term: 'помісячно',
    result: 'Зовнішній експерт веде вашу команду: спринти, пріоритети, ревʼю проти DoD.',
    say: 'Ваша команда виконує — ми відповідаємо за якість рішень →',
  },
  {
    n: '03',
    name: 'Управління проєктом',
    price: 'Під ключ',
    term: '6–12 міс',
    result: 'Трансформація під ключ: план, люди, бюджет. Фінальна відповідальність — на нас.',
    say: 'Потрібен результат, а не поради? Це сюди →',
  },
];

const CASE_ROW = [
  { to: '/cases/premium-textile', num: '×18', name: 'Преміум-текстиль', metric: '€48K → €900K · 18 міс', color: '#A3E635' },
  { to: '/cases/consumer-dtc', num: '+65%', name: 'Consumer DTC · Forbes TOP-250', metric: '6 нових ринків · 9 міс', color: '#5EEAD4' },
  { to: '/cases/fashion-apparel', num: '≥19 млн ₴', name: 'Fashion-виробник', metric: 'знайдений розрив на рік', color: '#F9A8D4' },
  { to: '/cases/fmcg-distribution', num: '17K SKU', name: 'FMCG-дистрибуція', metric: '+40% продажів · CRM', color: '#FFD100' },
];

/* Заголовок-стиль референсу: жирний, uppercase, з маркерними підсвітками */
const H2 = 'font-extrabold uppercase tracking-tight leading-[1.02]';

export default function Home() {
  const [marqueePaused, setMarqueePaused] = useState(false);
  return (
    <div className="pt-16 paper-warm" style={{ color: '#111' }}>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-14 md:py-20">
          <div className="grid lg:grid-cols-[1.12fr_1fr] gap-12 lg:gap-10 items-center">
            {/* Left: message */}
            <div className="relative">
              <FadeIn>
                <div className="flex flex-wrap items-center gap-2.5 mb-6">
                  <span className="tag-chip lime">weexp</span>
                  <span className="tag-chip">Commerce OS™</span>
                  <span className="tag-chip">#системаросту</span>
                </div>
                <h1 className={H2} style={{ fontSize: 'clamp(2.3rem, 5.2vw, 4.2rem)' }}>
                  Збільшуємо <span className="limemark">виручку</span>{' '}
                  <span className="whitespace-nowrap">e-commerce</span>
                  <br />
                  через CRO, retention і <span className="marker-underline">систему</span>
                  <Spark className="inline-block ml-2 -mt-6" style={{ verticalAlign: 'top' }} />
                </h1>

                {/* спіч-бабл із суб-меседжем */}
                <div className="bubble hard-shadow-sm mt-8 p-5 max-w-xl bg-white">
                  <p className="text-[#1a1a1a] leading-relaxed text-base md:text-[1.05rem] font-medium">
                    Конверсія <b>0,8% → 4,2%</b>. Оборот <b>×18</b> за 18 місяців. ROI <b>3.8×</b>.
                    Не гасла — виміряні кейси. Перебудовуємо весь шлях покупки, щоб компанія росла
                    швидше за рекламний бюджет.
                  </p>
                </div>
                <p className="font-comic text-[0.82rem] uppercase tracking-[0.08em] text-[#4D7C0F] font-semibold mt-5">
                  Для власників і CEO e-commerce з обігом від ₴1 млн/міс · UA · EU · US
                </p>
              </FadeIn>

              <FadeIn delay={0.12}>
                <div className="flex flex-wrap gap-4 mt-8">
                  <Link
                    to="/contact"
                    onMouseEnter={() => say('Аудит з фіксованою ціною — і твій розрив у грошах на столі. Почнемо?')}
                    onMouseLeave={sayIdle}
                    onClick={() => track('cta_click', { location: 'home_hero' })}
                    className="pill-cta lime text-sm"
                  >
                    <Play size={15} fill="currentColor" />
                    Отримати аудит у грошах
                  </Link>
                  <Link
                    to="/calculator"
                    onMouseEnter={() => say('30 секунд — і розрив у гривнях на екрані. Без контактів →')}
                    onMouseLeave={sayIdle}
                    onClick={() => track('cta_click', { location: 'home_hero_calc' })}
                    className="pill-cta paper text-sm"
                  >
                    Порахувати розрив · 30 сек
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </FadeIn>

              <FadeIn delay={0.22}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-10 max-w-xl">
                  {STATS.map((s, i) => (
                    <div key={s.label} className="comic-card comic-card-hover rounded-xl px-4 py-3"
                      style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 0.8}deg)` }}>
                      <p className="font-comic font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
                      <p className="font-comic text-[0.62rem] uppercase tracking-[0.1em] text-[#5A6472] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>

            {/* Right: digital assistant — вирізаний «стикер» + дудли */}
            <FadeIn delay={0.15} x={30} y={0}>
              <div className="relative max-w-[440px] mx-auto lg:mx-0 lg:ml-auto w-full">
                <Rocket className="absolute -top-6 -left-4 rotate-12" color="#4D7C0F" style={{ width: 44, height: 44 }} />
                <span className="doodle-label absolute -top-2 right-6 text-2xl">рост ↗</span>
                <ArrowUp className="absolute bottom-8 -left-8 -rotate-6" />
                <Star className="absolute -bottom-3 right-10" style={{ width: 26, height: 26 }} />
                <div className="sticker lime p-3">
                  <HeroBot />
                </div>
                <span className="pill-cta absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap"
                  style={{ transform: 'translateX(-50%) rotate(-2deg)' }}>
                  Твій магазин · перезбираємо
                </span>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ================= BRANDS ================= */}
      <section data-bot-say="Бренди й ринки з карʼєрного досвіду засновника — від Henkel і J&J до Amazon та Rozetka." className="comic-border-4 border-x-0 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10">
          <div className="flex items-center justify-between mb-5">
            <p className="font-comic text-xs uppercase tracking-[0.06em] text-[#111] font-semibold">
              Бренди й ринки з досвіду засновника <span className="text-[#5A6472] normal-case tracking-normal font-normal">(як найманого керівника)</span>
            </p>
            <button
              type="button"
              onClick={() => setMarqueePaused((v) => !v)}
              aria-label={marqueePaused ? 'Відновити стрічку' : 'Зупинити стрічку'}
              className="font-comic text-xs px-3 py-1 comic-border rounded-full bg-white hover:bg-[#A3E635] transition-colors"
            >
              {marqueePaused ? '▶' : '❚❚'}
            </button>
          </div>
        </div>
        <div className={`marquee-mask overflow-hidden${marqueePaused ? ' marquee-paused' : ''}`}>
          <div className="marquee-track">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <span key={`${b}-${i}`} className="tag-chip whitespace-nowrap">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PROBLEM ================= */}
      <section
        data-bot-say="Впізнаєш хоч одну з трьох проблем? Тоді далі — про те, як їх закриває система."
        className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-16 md:py-20 relative"
      >
        <Megaphone className="absolute right-8 top-10 rotate-6 hidden md:block" color="#FF2A17" />
        <FadeIn>
          <p className="font-comic uppercase tracking-[0.06em] text-[#FF2A17] font-semibold text-sm mb-2">Проблема · чому e-commerce застрягає</p>
          <h2 className={H2} style={{ fontSize: 'clamp(1.8rem, 3.6vw, 2.8rem)' }}>
            Три причини, чому <span className="redmark">оборот стоїть</span> на місці
          </h2>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {PAINS.map((p, i) => (
            <FadeIn key={p.n} delay={i * 0.08}>
              <div className="comic-card comic-card-hover rounded-2xl p-6 h-full flex flex-col"
                style={{ transform: `rotate(${(i - 1) * 0.6}deg)` }}>
                <span className="font-comic font-bold text-lg text-[#FF2A17]">{p.n}</span>
                <p className="font-extrabold text-lg mt-2 leading-snug">{p.t}</p>
                <p className="text-[#3a3a3a] text-[0.86rem] mt-2.5 leading-relaxed flex-1">{p.d}</p>
                <div className="mt-4 pt-4 border-t-2 border-dashed border-black/15">
                  <p className="font-comic font-bold text-3xl text-[#FF2A17]">{p.v}</p>
                  <p className="font-comic text-[0.62rem] uppercase tracking-[0.1em] text-[#5A6472] mt-1">{p.vl}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ================= COMMERCE OS ================= */}
      <section
        data-bot-say="Commerce OS™ — наш власний фреймворк: 12 модулів, 56 плейбуків, 52 еталони. Не «послуги» — система."
        className="paper-ink halftone-dark"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-16 md:py-20">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
            <FadeIn>
              <p className="font-comic uppercase tracking-[0.06em] text-[#A3E635] font-semibold text-sm mb-2">Рішення · власна методологія</p>
              <h2 className={`${H2} text-[#FFFDF8]`} style={{ fontSize: 'clamp(1.9rem, 3.8vw, 3rem)' }}>
                Commerce <span className="limemark" style={{ color: '#111' }}>OS™</span> —
                <br className="hidden md:block" /> операційна система росту
              </h2>
              <p className="text-[#D6D9DE] mt-5 leading-relaxed max-w-xl">
                Не набір послуг, а виконуваний фреймворк: кожна проблема бізнесу має свій модуль,
                кожен модуль — плейбуки з кроками та критеріями приймання, кожна метрика — еталон.
                Тому результат відтворюваний, а не залежить від натхнення підрядника.
              </p>
              <div className="flex flex-wrap gap-4 mt-7">
                <Link to="/os#system" onClick={() => track('cta_click', { location: 'home_os_system' })} className="pill-cta lime text-sm">
                  Розібрати систему →
                </Link>
                <Link to="/os#product" className="pill-cta paper text-sm">Демо зсередини</Link>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { v: '12', l: 'модулів системи · M01–M12' },
                  { v: '56', l: 'виконуваних плейбуків' },
                  { v: '52', l: 'еталонні метрики Gold Standards' },
                  { v: '19', l: 'документів аудиту клієнту' },
                ].map((s, i) => (
                  <div key={s.l} className="rounded-xl px-5 py-5 bg-[#1b1b1b] comic-border" style={{ borderColor: '#A3E635', transform: `rotate(${(i % 2 ? 1 : -1) * 0.7}deg)` }}>
                    <p className="font-comic font-bold text-4xl text-[#A3E635]">{s.v}</p>
                    <p className="font-comic text-[0.64rem] uppercase tracking-[0.1em] text-[#B9BEC5] mt-2 leading-relaxed">{s.l}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ================= WHY / MATH ================= */}
      <section
        data-bot-say="Головне питання власника: «Скільки ви мені заробите?» Ось математика рішення — на реальних цифрах кейсів."
        className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-16 md:py-20"
      >
        <FadeIn>
          <h2 className={H2} style={{ fontSize: 'clamp(1.8rem, 3.6vw, 2.8rem)' }}>
            Питання власника: <span className="marker-underline">«Скільки ви мені заробите?»</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="comic-card rounded-2xl p-6 md:p-8 mt-8">
            <p className="font-comic uppercase tracking-[0.06em] text-[#4D7C0F] font-semibold text-sm mb-5">
              Математика рішення · реальні цифри кейсів
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
              {[
                { k: 'Вхід', v: 'Аудит', d: 'фіксована ціна, відома до старту — рахує гроші' },
                { k: 'Аудит знаходить', v: '≥19 млн ₴/рік', d: 'розрив у кейсі fashion-виробника' },
                { k: 'Програма', v: 'транші під DoD', d: 'платите за прийнятий результат' },
                { k: 'ROI року', v: '3.8×', d: 'кейс «Преміум-текстиль»' },
              ].map((s, i) => (
                <div key={s.k}>
                  <p className="font-comic text-[0.66rem] uppercase tracking-[0.1em] text-[#5A6472]">{i + 1} · {s.k}</p>
                  <p className="font-comic font-bold text-2xl md:text-[1.8rem] text-[#111] mt-1">{s.v}</p>
                  <p className="text-[#5A6472] text-xs mt-1.5 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {[
            { t: 'Рахуємо в грошах', d: 'Кожен висновок аудиту переведено в гривні проти 52 еталонів Gold Standards. Жодних «покращимо впізнаваність».' },
            { t: 'Ціни відкриті', d: 'Три формати співпраці, усі ціни відкрито на сторінці «Співпраця», без «зателефонуйте менеджеру».' },
            { t: 'Бюджет під захистом', d: 'Етапи з Definition of Done і траншами: наступний платіж — після прийнятого результату.' },
            { t: 'Старт без ризику', d: 'Частина документів аудиту готова ще до передачі доступів — ви бачите цінність до того, як відкриваєте дані.' },
          ].map((c, i) => (
            <FadeIn key={c.t} delay={0.12 + i * 0.06}>
              <div className="comic-card comic-card-hover rounded-2xl p-6 h-full">
                <span className="font-comic font-bold text-lg text-[#4D7C0F]">0{i + 1}</span>
                <p className="font-extrabold text-lg mt-2 leading-snug">{c.t}</p>
                <p className="text-[#3a3a3a] text-[0.86rem] mt-2 leading-relaxed">{c.d}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ================= PRODUCTS ================= */}
      <section
        data-bot-say="Купують не «агентство», а продукт: три формати з цінами, строками й результатом. Обирай двері за розміром задачі."
        className="bg-white comic-border-4 border-x-0"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-16 md:py-20">
          <FadeIn>
            <div className="flex flex-wrap items-end justify-between gap-6 mb-9">
              <div>
                <p className="font-comic uppercase tracking-[0.06em] text-[#4D7C0F] font-semibold text-sm mb-2">Продукти · ціни відкриті</p>
                <h2 className={H2} style={{ fontSize: 'clamp(1.8rem, 3.6vw, 2.8rem)' }}>
                  Три способи <span className="limemark">купити ріст</span>
                </h2>
              </div>
              <Link to="/services" className="font-comic text-xs uppercase tracking-wider text-black/60 hover:text-[#4D7C0F] transition-colors">Повні умови →</Link>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {PRODUCTS.map((p, i) => (
              <FadeIn key={p.n} delay={i * 0.08}>
                <Link
                  to="/services"
                  onMouseEnter={() => say(p.say)}
                  onMouseLeave={sayIdle}
                  onClick={() => track('cta_click', { location: `home_product_${p.n}` })}
                  className="comic-card comic-card-hover rounded-2xl p-7 h-full flex flex-col group block"
                  style={{ transform: `rotate(${(i - 1) * 0.7}deg)` }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-comic font-bold text-lg text-[#4D7C0F]">{p.n}</span>
                    <span className="font-comic text-[0.66rem] uppercase tracking-wider text-[#5A6472]">{p.term}</span>
                  </div>
                  <p className="font-extrabold text-xl mt-3">{p.name}</p>
                  <p className="font-comic font-bold text-3xl text-[#111] mt-2">{p.price}</p>
                  <p className="text-[#3a3a3a] text-[0.86rem] mt-3 leading-relaxed flex-1">{p.result}</p>
                  <span className="font-comic text-xs uppercase tracking-wider mt-6 text-black/65 group-hover:text-[#4D7C0F] transition-colors">Детальніше →</span>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CASES ROW ================= */}
      <section
        data-bot-say="Чотири мандати — чотири виміряні результати. Клікай будь-який: усередині повний розбір «було → стало»."
        className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-16 md:py-20"
      >
        <FadeIn>
          <p className="font-comic uppercase tracking-[0.06em] text-[#4D7C0F] font-semibold text-sm mb-6">Докази · кейси з CRM, ERP і GA4</p>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CASE_ROW.map((c, i) => (
            <FadeIn key={c.to} delay={i * 0.07}>
              <Link
                to={c.to}
                onClick={() => track('cta_click', { location: 'home_case_row' })}
                className="comic-card comic-card-hover rounded-2xl p-6 h-full flex flex-col group block"
                style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 0.7}deg)` }}
              >
                <span className="inline-block font-comic font-bold text-3xl px-2 rounded-md" style={{ background: c.color }}>{c.num}</span>
                <p className="font-bold text-sm mt-3 leading-snug flex-1">{c.name}</p>
                <p className="font-comic text-[0.64rem] uppercase tracking-[0.1em] text-[#5A6472] mt-2">{c.metric}</p>
                <span className="font-comic text-xs uppercase tracking-wider mt-4 text-black/60 group-hover:text-[#4D7C0F] transition-colors">Розбір →</span>
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
            className="relative block rounded-3xl p-8 md:p-11 flex flex-col md:flex-row md:items-center justify-between gap-6 group bg-[#A3E635] comic-border-4 hard-shadow overflow-hidden"
          >
            <Scribble className="absolute right-40 top-6 hidden md:block" color="#111" />
            <Star className="absolute right-10 bottom-6" style={{ width: 30, height: 30 }} />
            <div className="relative">
              <p className="font-comic uppercase tracking-[0.06em] text-[#111] font-semibold text-sm mb-3">
                Калькулятор · безкоштовно · без контактів
              </p>
              <p className="font-extrabold text-2xl md:text-4xl leading-[1.05]">
                Скільки обороту ви <span className="marker-underline-sun">недоотримуєте</span> щороку?
              </p>
              <p className="text-[#1a1a1a] text-sm md:text-base mt-3 max-w-xl leading-relaxed font-medium">
                4 питання проти еталонів вашої ніші — і розрив у гривнях на екрані. Та сама модель,
                якою ми рахуємо аудити.
              </p>
            </div>
            <span className="pill-cta shrink-0 self-start md:self-auto text-sm">Порахувати →</span>
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
