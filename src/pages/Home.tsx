import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import FadeIn from '../components/FadeIn';

const SERVICES = [
  'Branding & Strategy',
  'UX/UI · Customer Journey',
  'Web Development · Shopify/React',
  'SEO · AEO · GEO',
  'CRM · Retention · Email',
  'Marketplaces · AI · Аналітика',
];

export default function Home() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* Fallback layer: hi-tech grid + glow (visible if video is unavailable) */}
      <div className="absolute inset-0 pointer-events-none select-none grid-bg">
        <div className="glow-lime w-[560px] h-[560px] -top-40 -right-40" />
        <div className="glow-cyan w-[420px] h-[420px] bottom-0 -left-32" />
      </div>

      {/* Reference background video (girl) — plays where network allows */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover lg:scale-[1.2]"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260725_114042_d2ed2a89-f2fa-449b-9609-da456344257b.mp4"
      />
      {/* Thin legibility gradient at the bottom only */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Content above video */}
      <div className="relative z-10 flex h-full flex-col px-5 sm:px-6 md:px-10 lg:px-14 pt-20">
        {/* Meta grid */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <div>
            <h2 className="text-lg md:text-xl tracking-wide leading-tight uppercase">
              <span className="font-normal">weexp</span>
              <br />
              <span className="font-pixel text-base md:text-xl text-[#A3E635]">Commerce OS</span>
            </h2>
            <div className="text-[10px] text-white/50 mt-3">*</div>
            <p className="font-pixel mt-1 text-[0.55rem] text-white/60 leading-loose">
              weexp — команда, що
              <br />
              будує e-commerce
              <br />
              як актив: система,
              <br />
              дані та P&amp;L
            </p>
          </div>

          <div className="text-right lg:text-left">
            <h2 className="text-lg md:text-xl tracking-wide leading-tight uppercase">
              <span className="font-normal">Growth &amp;</span>
              <br />
              <span className="font-pixel text-base md:text-xl">Engineering</span>
            </h2>
          </div>

          <div>
            <p className="font-pixel text-[0.6rem] tracking-widest text-white/50 uppercase mb-3">
              Що ми робимо
            </p>
            <p className="text-sm text-white/90 leading-relaxed max-w-[240px]">
              Створюємо топ-1% e-commerce досвіду для брендів і цифрових продуктів
            </p>
          </div>

          <div className="text-right lg:text-left">
            <p className="font-pixel text-[0.6rem] tracking-widest text-white/50 uppercase mb-3">
              Послуги
            </p>
            <ul className="text-xs sm:text-sm text-white/90 leading-relaxed space-y-0.5">
              {SERVICES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex-1" />

        {/* Bottom block */}
        <div className="pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-end">
            <FadeIn delay={0.05} y={20}>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] xl:text-[3.9rem] tracking-wide uppercase font-normal"
                style={{ lineHeight: 0.95 }}
              >
                Зростання —
                <br />
                це{' '}
                <span className="font-pixel text-[0.82em] text-[#A3E635] inline-block leading-none align-baseline">
                  система
                </span>
                ,
                <br />
                а не рекламний
                <br />
                <span className="font-pixel text-[0.82em] inline-block leading-none align-baseline">
                  бюджет
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.18} y={16}>
              <div className="flex flex-col gap-4 sm:gap-6 justify-end">
                <Link
                  to="/contact"
                  className="self-start flex items-center gap-3 border border-white/30 px-6 py-3 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Play size={14} fill="white" />
                  <span className="text-sm tracking-wider uppercase">Diagnostic Sprint</span>
                </Link>

                <div className="flex flex-wrap items-stretch gap-2 sm:gap-3 text-sm text-white/80 self-start lg:self-end">
                  <div className="chip-dark px-3 sm:px-4 py-2 flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base tracking-tight text-[#A3E635]">×18</span>
                    <span className="text-white/50 text-xs">оборот у кейсі</span>
                  </div>
                  <div className="chip-dark px-3 sm:px-4 py-2 flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base tracking-tight text-[#3DDAD0]">€900K</span>
                    <span className="text-white/50 text-xs">за 18 міс</span>
                  </div>
                  <div className="chip-dark px-3 sm:px-4 py-2 flex items-center gap-2">
                    <span className="font-bold text-[10px] sm:text-xs tracking-tight">Forbes TOP-250</span>
                    <span className="text-white/50 text-xs">кейс</span>
                  </div>
                  <div className="chip-dark px-3 sm:px-4 py-2 flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base tracking-tight text-[#F5B84B]">14</span>
                    <span className="text-white/50 text-xs">країн</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 pt-4 border-t border-white/10">
            <p className="text-xs text-white/60">
              Відкриті до нових проєктів: Diagnostic Sprint, Program of Record, Fractional.{' '}
              <Link to="/contact" className="text-[#A3E635] hover:text-[#bdff4d] transition-colors">
                Забронювати сесію
              </Link>
            </p>
            <p className="text-xs text-white/60 sm:text-right">
              56 плейбуків • 52 метрики • 3 кейси • 1 програма росту
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
