import FadeIn from '../components/FadeIn';
import { Eyebrow } from '../components/ui';
import LeadForm from '../components/LeadForm';

export default function ContactPage() {
  return (
    <div className="pt-16">
      <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center grid-bg">
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
                  <span className="font-pixel text-[0.8em] text-[#65A30D] inline-block align-baseline leading-none">
                    система
                  </span>
                </h1>
                <p className="text-[#3F4854] mt-6 max-w-xl leading-relaxed">
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
                    className="border border-black/30 bg-black/5 backdrop-blur-sm px-9 py-4 font-mono text-sm uppercase tracking-[0.12em] text-[#12161C] hover:bg-black/5 transition-colors"
                  >
                    LinkedIn
                  </a>
                  <a
                    href="tel:+380999188260"
                    className="border border-black/30 bg-black/5 backdrop-blur-sm px-9 py-4 font-mono text-sm uppercase tracking-[0.12em] text-[#12161C] hover:bg-black/5 transition-colors"
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
              <div className="card p-6 bg-white/85 backdrop-blur-sm">
                <p className="font-pixel text-[0.5rem] uppercase text-[#65A30D] mb-2.5">Контакт</p>
                <p className="font-extrabold text-xl">Павло Сидоренко</p>
                <p className="text-[#5A6472] text-xs mt-1.5">Архітектор Commerce OS</p>
              </div>
              <div className="card p-6 bg-white/85 backdrop-blur-sm">
                <ul className="font-mono text-[0.72rem] sm:text-[0.78rem] text-[#2F3742] flex flex-col gap-2">
                  <li>
                    <a
                      href="https://linkedin.com/in/pvsidorenko"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#65A30D] transition-colors"
                    >
                      linkedin.com/in/pvsidorenko
                    </a>
                  </li>
                  <li>
                    <a href="mailto:pashasidorenko18@gmail.com" className="hover:text-[#65A30D] transition-colors">
                      pashasidorenko18@gmail.com
                    </a>
                  </li>
                  <li>
                    <a href="tel:+380999188260" className="hover:text-[#65A30D] transition-colors">
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
