import FadeIn from './FadeIn';
import Magnet from './Magnet';
import { Stat } from './ui';
import heroImg from '../assets/pavlo-hero.jpg';

export default function Hero() {
  return (
    <section id="top" className="relative min-h-screen flex items-center overflow-hidden grid-bg">
      {/* photo layer */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[62%] pointer-events-none select-none">
        <img
          src={heroImg}
          alt=""
          className="h-full w-full object-cover object-right opacity-40 md:opacity-90"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, #0B0D10 0%, rgba(11,13,16,0.92) 22%, rgba(11,13,16,0.45) 55%, rgba(11,13,16,0.15) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0B0D10] to-transparent" />
      </div>

      <div className="glow-lime w-[480px] h-[480px] -top-40 -left-40" />

      <div className="relative z-10 max-w-6xl mx-auto w-full px-5 sm:px-8 md:px-12 pt-28 pb-16">
        <FadeIn delay={0} y={-16}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="eyebrow-dot" />
            <span className="font-mono text-[0.68rem] sm:text-xs uppercase tracking-[0.22em] text-[#A3E635] font-bold">
              Commerce OS
            </span>
            <span className="font-mono text-[0.68rem] sm:text-xs uppercase tracking-[0.22em] text-[#8C96A5]">
              · Operating system for e-commerce growth
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.12} y={24}>
          <p className="font-mono text-[0.68rem] sm:text-xs uppercase tracking-[0.24em] text-[#3DDAD0] mt-12 mb-4">
            Засновник школи · Commerce Architecture
          </p>
          <h1
            className="font-extrabold uppercase leading-[0.95] tracking-tight"
            style={{ fontSize: 'clamp(3rem, 9vw, 7.5rem)' }}
          >
            Павло
            <br />
            <span className="steel-text">Сидоренко</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.28} y={20}>
          <p className="mt-6 font-bold text-lg sm:text-xl md:text-2xl text-[#E9EDF2] max-w-xl">
            System Intelligence · Архітектор зростання вартості компаній
          </p>
          <p className="font-serif-it mt-4 text-base sm:text-lg text-[#B7C0CC] max-w-lg leading-relaxed">
            «Я проєктую компанії, вартість яких зростає швидше за їхні рекламні бюджети»
          </p>
        </FadeIn>

        <FadeIn delay={0.42} y={20}>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#contact"
              className="rounded-full bg-[#A3E635] px-8 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.12em] text-[#0B0D10] transition-transform duration-200 hover:scale-[1.04]"
              style={{ boxShadow: '0 0 32px rgba(163,230,53,0.35)' }}
            >
              Забронювати сесію →
            </a>
            <a
              href="#system"
              className="rounded-full border border-[#3B4450] px-8 py-3.5 font-mono text-sm uppercase tracking-[0.12em] text-[#C7CFDA] hover:border-[#A3E635] hover:text-[#E9EDF2] transition-colors duration-200"
            >
              Як працює система
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.55} y={26}>
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            <Magnet padding={60} strength={8}>
              <Stat value="×18" label="Оборот у кейсі" color="var(--lime)" />
            </Magnet>
            <Magnet padding={60} strength={8}>
              <Stat countTo={8} suffix="+" label="Років · US·EU·MENA" color="var(--cyan)" />
            </Magnet>
            <Magnet padding={60} strength={8}>
              <Stat countTo={56} label="Плейбуків" color="var(--purple)" />
            </Magnet>
            <Magnet padding={60} strength={8}>
              <Stat countTo={3} label="Кейси" color="var(--yellow)" />
            </Magnet>
          </div>
        </FadeIn>

        <FadeIn delay={0.68} y={12}>
          <p className="mt-12 font-mono text-[0.66rem] sm:text-xs tracking-[0.14em] text-[#8C96A5] uppercase">
            linkedin.com/in/pvsidorenko · pashasidorenko18@gmail.com · +38 099 918 82 60
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
