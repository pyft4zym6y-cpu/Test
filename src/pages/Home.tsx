import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import HeroBot from '../components/HeroBot';
import { say, sayIdle } from '../components/speech';
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

const DOORS = [
  {
    to: '/approach',
    title: 'Підхід',
    text: 'Чому «більше бюджету» більше не працює — і що замість цього.',
    say: 'Почни звідси: філософія системи за 3 хвилини →',
  },
  {
    to: '/system',
    title: 'Система',
    text: '12 модулів Commerce OS: від діагностики до BI-дашборда.',
    say: '12 модулів, один рушій. Зазирни під капот →',
  },
  {
    to: '/cases',
    title: 'Кейси',
    text: '×18 обороту, ≥19 млн ₴ знайдених грошей, Forbes TOP-250.',
    say: '×18 — не обіцянка, а факт із CRM. Перевір →',
  },
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
                <Eyebrow>weexp · Commerce OS · операційна система росту</Eyebrow>
                <h1
                  className="font-extrabold uppercase tracking-tight"
                  style={{ fontSize: 'clamp(2.2rem, 5.2vw, 4.2rem)', lineHeight: 1.02 }}
                >
                  Зростання — це{' '}
                  <span className="font-pixel text-[0.78em] text-[#65A30D] inline-block align-baseline leading-none">
                    система
                  </span>
                  ,<br />а не рекламний{' '}
                  <span className="font-pixel text-[0.78em] inline-block align-baseline leading-none">
                    бюджет
                  </span>
                </h1>
                <p className="text-[#5A6472] mt-6 max-w-xl leading-relaxed text-base md:text-lg">
                  weexp будує e-commerce як актив: бренд, платформа, дані та P&amp;L працюють в
                  одній системі — і вартість компанії зростає швидше за її рекламні бюджети.
                </p>
              </FadeIn>

              <FadeIn delay={0.12}>
                <div className="flex flex-wrap gap-4 mt-8">
                  <Link
                    to="/contact"
                    onMouseEnter={() => say('Diagnostic Sprint від $2K — і твій розрив у грошах на столі. Почнемо?')}
                    onMouseLeave={sayIdle}
                    className="flex items-center gap-3 bg-[#A3E635] px-7 py-3.5 text-sm font-bold tracking-wider uppercase text-black hover:brightness-95 transition-[filter]"
                  >
                    <Play size={14} fill="currentColor" />
                    Diagnostic Sprint
                  </Link>
                  <Link
                    to="/cases"
                    onMouseEnter={() => say('Спершу докази? Справедливо. Кейси тут →')}
                    onMouseLeave={sayIdle}
                    className="flex items-center gap-2 border border-black/30 px-7 py-3.5 text-sm tracking-wider uppercase hover:bg-black/5 transition-colors"
                  >
                    Дивитись кейси
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
              className="font-mono text-[0.62rem] px-2.5 py-1 border border-black/15 text-black/60 hover:text-[#65A30D] hover:border-[#65A30D]/50 transition-colors"
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

      {/* ================= THREE DOORS ================= */}
      <section data-bot-say="Три двері на вибір: Підхід — чому, Система — як, Кейси — докази. Обирай!" className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-16 md:py-20">
        <FadeIn>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <h2 className="font-extrabold uppercase tracking-tight" style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.6rem)' }}>
              З чого почати
            </h2>
            <p className="text-xs text-black/60 font-mono">
              56 плейбуків • 52 метрики • 3 кейси • 1 програма росту
            </p>
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-5">
          {DOORS.map((d, i) => (
            <FadeIn key={d.to} delay={i * 0.08}>
              <Link
                to={d.to}
                onMouseEnter={() => say(d.say)}
                onMouseLeave={sayIdle}
                className="card card-hover p-7 h-full flex flex-col group"
              >
                <p className="font-pixel text-[0.6rem] text-[#65A30D]">0{i + 1}</p>
                <p className="font-extrabold text-2xl mt-3">{d.title}</p>
                <p className="text-[#5A6472] text-sm mt-2.5 leading-relaxed flex-1">{d.text}</p>
                <p className="font-mono text-xs uppercase tracking-wider mt-6 text-black/65 group-hover:text-[#65A30D] transition-colors">
                  Перейти →
                </p>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}
