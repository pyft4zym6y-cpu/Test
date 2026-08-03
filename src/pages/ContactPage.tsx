import FadeIn from '../components/FadeIn';
import { Eyebrow } from '../components/ui';
import LeadForm from '../components/LeadForm';
import heroImg from '../assets/pavlo-hero.jpg';

export default function ContactPage() {
  return (
    <div className="pt-16">
      <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center">
        <div className="absolute inset-y-0 right-0 w-full md:w-[58%] pointer-events-none select-none">
          <img
            src={heroImg}
            alt=""
            className="h-full w-full object-cover object-right opacity-30 md:opacity-80"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, #000 0%, rgba(0,0,0,0.94) 25%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 100%)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent" />
        </div>
        <div className="glow-lime w-[460px] h-[460px] -bottom-40 -left-40" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-6 md:px-10 py-20">
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 items-start">
            <div>
              <FadeIn>
                <Eyebrow>Наступний крок</Eyebrow>
                <h1
                  className="font-extrabold leading-[1.02] tracking-tight uppercase"
                  style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', textWrap: 'balance' }}
                >
                  Тепер очевидно:
                  <br />
                  зростання — це{' '}
                  <span className="font-pixel text-[0.8em] text-[#A3E635] inline-block align-baseline leading-none">
                    система
                  </span>
                </h1>
                <p className="text-[#B7C0CC] mt-6 max-w-xl leading-relaxed">
                  Почнімо з Diagnostic Sprint: Health Score, аудит і розрахунок упущеного обороту в
                  грошах. Перший вимірюваний результат — за 30–60 днів.
                </p>
              </FadeIn>

              <FadeIn delay={0.15}>
                <div className="flex flex-wrap gap-4 mt-10">
                  <a
                    href="https://linkedin.com/in/pvsidorenko"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-white/30 bg-white/5 backdrop-blur-sm px-9 py-4 font-mono text-sm uppercase tracking-[0.12em] text-white hover:bg-white/10 transition-colors"
                  >
                    LinkedIn
                  </a>
                  <a
                    href="tel:+380999188260"
                    className="border border-white/30 bg-white/5 backdrop-blur-sm px-9 py-4 font-mono text-sm uppercase tracking-[0.12em] text-white hover:bg-white/10 transition-colors"
                  >
                    +38 099 918 82 60
                  </a>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.2} x={30} y={0}>
              <LeadForm />
            </FadeIn>
          </div>

          <FadeIn delay={0.28}>
            <div className="grid sm:grid-cols-2 gap-4 mt-14 max-w-2xl">
              <div className="card p-6 bg-black/70 backdrop-blur-sm">
                <p className="font-pixel text-[0.5rem] uppercase text-[#A3E635] mb-2.5">Контакт</p>
                <p className="font-extrabold text-xl">Павло Сидоренко</p>
                <p className="text-[#8C96A5] text-xs mt-1.5">Архітектор Commerce OS</p>
              </div>
              <div className="card p-6 bg-black/70 backdrop-blur-sm">
                <ul className="font-mono text-[0.72rem] sm:text-[0.78rem] text-[#C7CFDA] flex flex-col gap-2">
                  <li>
                    <a
                      href="https://linkedin.com/in/pvsidorenko"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#A3E635] transition-colors"
                    >
                      linkedin.com/in/pvsidorenko
                    </a>
                  </li>
                  <li>
                    <a href="mailto:pashasidorenko18@gmail.com" className="hover:text-[#A3E635] transition-colors">
                      pashasidorenko18@gmail.com
                    </a>
                  </li>
                  <li>
                    <a href="tel:+380999188260" className="hover:text-[#A3E635] transition-colors">
                      +38 099 918 82 60
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
