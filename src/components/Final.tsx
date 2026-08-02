import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle } from './ui';
import heroImg from '../assets/pavlo-hero.jpg';

const TRAJECTORIES = [
  {
    label: 'Через 90 днів',
    color: '#3DDAD0',
    text: 'Baseline і аудит у грошах · дорожня карта з хвилями · перші швидкі перемоги · перший ↑ ключових метрик.',
  },
  {
    label: 'Через рік',
    color: '#A3E635',
    text: 'Власні активи: SEO, retention, маркетплейси, бренд · диверсифікований трафік · ↑ маржа й вартість компанії.',
  },
  {
    label: 'Ціна бездіяльності',
    color: '#FF6A3D',
    text: 'Кожен місяць зволікання — це недоотриманий оборот із калькулятора та фора конкурентам, яку доведеться наздоганяти.',
  },
];

export default function Final() {
  return (
    <>
      {/* ---- Дві траєкторії ---- */}
      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>Що зміниться · 90 днів → рік → ціна бездіяльності</Eyebrow>
          <SectionTitle>Дві траєкторії. Ви обираєте.</SectionTitle>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {TRAJECTORIES.map((t, i) => (
            <FadeIn key={t.label} delay={i * 0.1}>
              <div className="card card-hover accent-top p-7 h-full" style={{ '--accent': t.color } as React.CSSProperties}>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] mb-3" style={{ color: t.color }}>
                  {t.label}
                </p>
                <p className="text-[#B7C0CC] text-sm leading-relaxed">{t.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.3}>
          <p className="text-center font-mono uppercase tracking-[0.14em] mt-12 text-sm sm:text-base">
            <span className="text-[#3DDAD0]">Діагностика</span>
            <span className="text-[#66707E]"> → </span>
            <span className="text-[#A3E635]">Активи</span>
            <span className="text-[#66707E]"> → </span>
            <span className="font-bold text-[#E9EDF2]">Вартість компанії</span>
          </p>
        </FadeIn>
      </Section>

      {/* ---- CTA ---- */}
      <section id="contact" className="relative overflow-hidden">
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
                'linear-gradient(90deg, #0B0D10 0%, rgba(11,13,16,0.94) 25%, rgba(11,13,16,0.5) 60%, rgba(11,13,16,0.2) 100%)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0B0D10] to-transparent" />
        </div>
        <div className="glow-lime w-[460px] h-[460px] -bottom-40 -left-40" />

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-28 md:py-36">
          <FadeIn>
            <Eyebrow>Наступний крок</Eyebrow>
            <h2
              className="font-extrabold leading-[1.02] tracking-tight"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 4.6rem)', textWrap: 'balance' }}
            >
              Забронюйте 30-хв
              <br />
              <span className="lime-text">стратегічну сесію</span>
            </h2>
            <p className="text-[#B7C0CC] mt-6 max-w-xl leading-relaxed">
              Почнімо з Diagnostic Sprint: Health Score, аудит і розрахунок упущеного обороту у
              грошах. Далі — дорожня карта й перший вимірюваний результат за 30–60 днів.
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="flex flex-wrap gap-4 mt-10">
              <a
                href="mailto:pashasidorenko18@gmail.com?subject=Стратегічна сесія — Commerce OS"
                className="rounded-full bg-[#A3E635] px-9 py-4 font-mono text-sm font-bold uppercase tracking-[0.12em] text-[#0B0D10] transition-transform duration-200 hover:scale-[1.04]"
                style={{ boxShadow: '0 0 36px rgba(163,230,53,0.35)' }}
              >
                Написати →
              </a>
              <a
                href="https://linkedin.com/in/pvsidorenko"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#3B4450] px-9 py-4 font-mono text-sm uppercase tracking-[0.12em] text-[#C7CFDA] hover:border-[#A3E635] hover:text-[#E9EDF2] transition-colors duration-200"
              >
                LinkedIn
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.28}>
            <div className="grid sm:grid-cols-2 gap-4 mt-14 max-w-2xl">
              <div className="card p-6 bg-[#14181F]/80 backdrop-blur-sm">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#A3E635] mb-2">
                  Контакт
                </p>
                <p className="font-extrabold text-xl">Павло Сидоренко</p>
                <p className="text-[#8C96A5] text-xs mt-1.5">
                  Експерт з розвитку e-commerce · Digital-стратег
                </p>
              </div>
              <div className="card p-6 bg-[#14181F]/80 backdrop-blur-sm">
                <ul className="font-mono text-[0.72rem] sm:text-[0.78rem] text-[#C7CFDA] flex flex-col gap-2">
                  <li>
                    <a href="https://linkedin.com/in/pvsidorenko" target="_blank" rel="noopener noreferrer" className="hover:text-[#A3E635] transition-colors">
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

      {/* ---- Footer ---- */}
      <footer className="border-t border-[#232933]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-8 flex flex-wrap justify-between gap-3">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-[#66707E]">
            <span className="text-[#A3E635]">Commerce OS</span> · Operating system for e-commerce
            growth
          </p>
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-[#66707E]">
            © 2026 Павло Сидоренко
          </p>
        </div>
      </footer>
    </>
  );
}
