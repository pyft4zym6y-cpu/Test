import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle, Stat, Chip } from './ui';
import portraitImg from '../assets/pavlo-portrait.jpg';

const BRAND_CHIPS = ['Amazon', 'Henkel', 'J&J', 'Watsons', 'Rozetka', 'Kimberly-Clark'];

const ARCHETYPES = [
  'Автор Commerce OS',
  'Засновник школи Commerce Architecture',
  'Спікер бізнес-клубу RISE',
  'Ex-Head of e-Commerce · бренд Forbes TOP-250 UA',
  'Ex-Head of Marketing · нац. FMCG-дистриб’ютор',
  '15+ ринків · US · EU · MENA',
];

export default function About() {
  return (
    <>
      {/* ---- Про мене ---- */}
      <Section id="about">
        <div className="glow-lime w-[380px] h-[380px] top-0 -right-32" />
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-start">
          <FadeIn>
            <Eyebrow>weexp · Хто будує</Eyebrow>
            <SectionTitle as="h1">
              Не підрядник на задачі.
              <br />
              <span className="lime-text">Архітектори цифрових систем.</span>
            </SectionTitle>
            <p className="text-[#3F4854] mt-6 max-w-xl leading-relaxed">
              Ядро weexp — 8+ років у міжнародному e-commerce: масштабуємо цифрові продажі й будуємо стратегії для
              брендів у США, ЄС і MENA. Стик стратегії, технологій і клієнтського досвіду — з
              відповідальністю за P&amp;L.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-6">
              {BRAND_CHIPS.map((b) => (
                <Chip key={b}>{b}</Chip>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.15} x={40} y={0}>
            <div className="card accent-top p-7" style={{ '--accent': 'var(--yellow)' } as React.CSSProperties}>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#B45309] mb-3">
                Що ми приносимо
              </p>
              <p className="font-extrabold text-2xl mb-3">Commerce OS</p>
              <p className="text-[#3F4854] text-sm leading-relaxed">
                Авторська операційна система: діагностика, 56 плейбуків, 52 еталонні метрики та
                калькулятор упущеного обороту. Продуктивізована експертиза — а не години
                консультанта.
              </p>
              <hr className="border-[#E4E7EA] my-5" />
              <p className="text-[#5A6472] text-xs leading-relaxed">
                Засновник — спікер бізнес-клубу <strong className="text-[#2F3742]">RISE</strong>. Галузі:
                Electronics, Fashion, Beauty, Home&amp;Decor, FMCG, Fintech, AI.
              </p>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-12 pt-10 border-t border-[#E4E7EA]">
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
            <Eyebrow>Засновник · Особистий бренд</Eyebrow>
            <SectionTitle>
              Павло Сидоренко —
              <br />
              <span className="lime-text">архітектор, що перетворив досвід на систему</span>
            </SectionTitle>
            <p className="text-[#3F4854] mt-5 leading-relaxed max-w-xl">
              8+ років будував e-commerce для брендів рівня Forbes TOP-250 і національних
              дистриб'юторів — від першого продажу до десятків мільйонів обороту. Цей досвід
              зібрано у Commerce OS: 56 плейбуків, 52 метрики і продукт замість годин консультанта.
              Заснував школу Commerce Architecture, виступає в бізнес-спільнотах і особисто веде
              кожен мандат weexp.
            </p>
            <p className="font-serif-it text-lg text-[#3F4854] mt-4 leading-relaxed">
              «Я не продаю методологію. Я визначаю, як ринок думатиме про цифрове зростання в
              найближчі роки».
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
                src={portraitImg}
                alt="Павло Сидоренко — портрет"
                className="w-full max-w-sm mx-auto rounded-2xl border border-[#E4E7EA]"
                loading="lazy"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[21rem] card px-5 py-3 bg-[#FFFFFF]/85 backdrop-blur-sm">
                <p className="font-bold">Павло Сидоренко</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#65A30D]">
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
              Ми не допомагаємо компаніям рости. Ми проєктуємо компанії, вартість яких зростає{' '}
              <span className="lime-text">швидше за їхні рекламні бюджети</span>.
            </p>
            <p className="text-[#5A6472] mt-5 leading-relaxed max-w-3xl">
              SEO, CRM, Amazon, Shopify — це інструменти, а не професія. Ми будуємо{' '}
              <strong className="text-[#141820]">інтелект компанії</strong> — System Intelligence:
              систему, що перетворює цифровий хаос на капіталізацію бізнесу.
            </p>
          </div>
        </FadeIn>
      </Section>
    </>
  );
}
