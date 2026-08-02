import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle, Stat, Chip } from './ui';

const BRAND_CHIPS = ['Amazon', 'Henkel', 'J&J', 'Watsons', 'Rozetka', 'Kimberly-Clark'];

const ARCHETYPES = [
  'Архітектор — проєктую',
  'Мудрець — пояснюю складне просто',
  'Візіонер — бачу на 5 років',
];

export default function About() {
  return (
    <>
      {/* ---- Про мене ---- */}
      <Section id="about">
        <div className="glow-lime w-[380px] h-[380px] top-0 -right-32" />
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-start">
          <FadeIn>
            <Eyebrow>Про мене · Павло Сидоренко</Eyebrow>
            <SectionTitle>
              Не агенція. Не фрилансер.
              <br />
              <span className="lime-text">Архітектор цифрової системи.</span>
            </SectionTitle>
            <p className="text-[#B7C0CC] mt-6 max-w-xl leading-relaxed">
              8+ років у міжнародному e-commerce: масштабую цифрові продажі й будую стратегії для
              брендів у США, ЄС і MENA. Стик стратегії, технологій і клієнтського досвіду — з
              відповідальністю за P&amp;L.
            </p>
            <ul className="mt-6 flex flex-col gap-2.5">
              <li className="flex items-baseline gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] shrink-0 translate-y-[-2px]" />
                <p>
                  <strong>Head of e-Commerce · Ugears</strong>{' '}
                  <span className="text-[#8C96A5]">(Forbes TOP-250 UA · Смарт Екоммерс, LV)</span>
                </p>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3DDAD0] shrink-0 translate-y-[-2px]" />
                <p>
                  <strong>Head of Marketing · Imperia Holding</strong>{' '}
                  <span className="text-[#8C96A5]">(нац. FMCG-дистрибуція)</span>
                </p>
              </li>
            </ul>
            <div className="flex flex-wrap gap-2.5 mt-6">
              {BRAND_CHIPS.map((b) => (
                <Chip key={b}>{b}</Chip>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.15} x={40} y={0}>
            <div className="card accent-top p-7" style={{ '--accent': 'var(--yellow)' } as React.CSSProperties}>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#F5B84B] mb-3">
                Що я приношу
              </p>
              <p className="font-extrabold text-2xl mb-3">Commerce OS</p>
              <p className="text-[#B7C0CC] text-sm leading-relaxed">
                Авторська операційна система: діагностика, 56 плейбуків, 52 еталонні метрики та
                калькулятор упущеного обороту. Продуктивізована експертиза — а не години
                консультанта.
              </p>
              <hr className="border-[#232933] my-5" />
              <p className="text-[#8C96A5] text-xs leading-relaxed">
                Спікер бізнес-клубу <strong className="text-[#C7CFDA]">RISE</strong>. Галузі:
                Electronics, Fashion, Beauty, Home&amp;Decor, FMCG, Fintech, AI.
              </p>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-12 pt-10 border-t border-[#232933]">
            <Stat countTo={8} suffix="+" label="Років у міжнародному e-commerce" color="var(--lime)" />
            <Stat countTo={15} suffix="+" label="Ринків · США · ЄС · MENA" color="var(--cyan)" />
            <Stat value="ROAS 10+" label="У платних каналах" color="var(--purple)" />
            <Stat value="17K" label="SKU під керуванням" color="var(--yellow)" />
          </div>
        </FadeIn>
      </Section>

      {/* ---- Хто я + позиціонування ---- */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <Eyebrow>Хто я</Eyebrow>
            <SectionTitle>
              Засновник школи
              <br />
              <span className="lime-text">Commerce Architecture</span>
            </SectionTitle>
            <p className="font-bold text-lg mt-5">Commerce OS — перший продукт цієї школи.</p>
            <p className="font-serif-it text-lg text-[#B7C0CC] mt-4 leading-relaxed">
              Я не продаю методологію. Я визначаю, як ринок думатиме про цифрове зростання в
              найближчі роки.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-6">
              {ARCHETYPES.map((a) => (
                <Chip key={a}>{a}</Chip>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.15} x={40} y={0}>
            <div className="relative">
              <img
                src="/pavlo-portrait.png"
                alt="Павло Сидоренко — портрет"
                className="w-full max-w-sm mx-auto rounded-2xl border border-[#232933]"
                loading="lazy"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[21rem] card px-5 py-3 bg-[#0B0D10]/85 backdrop-blur-sm">
                <p className="font-bold">Павло Сидоренко</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#A3E635]">
                  E-commerce &amp; Digital Architect
                </p>
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="mt-16 max-w-4xl">
            <Eyebrow>Позиціонування · System Intelligence</Eyebrow>
            <p className="font-extrabold leading-snug" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)' }}>
              Я не допомагаю компаніям рости. Я проєктую компанії, вартість яких зростає{' '}
              <span className="lime-text">швидше за їхні рекламні бюджети</span>.
            </p>
            <p className="text-[#8C96A5] mt-5 leading-relaxed max-w-3xl">
              SEO, CRM, Amazon, Shopify — це інструменти, а не професія. Я створюю{' '}
              <strong className="text-[#E9EDF2]">інтелект компанії</strong> — System Intelligence:
              систему, що перетворює цифровий хаос на капіталізацію бізнесу.
            </p>
          </div>
        </FadeIn>
      </Section>
    </>
  );
}
