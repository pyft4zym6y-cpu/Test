import FadeIn from './FadeIn';
import AnimatedText from './AnimatedText';
import { Eyebrow, Section, SectionTitle } from './ui';

const PAINS = [
  'CAC росте щомісяця',
  'SEO не приносить трафік',
  'CRM не конвертує в продажі',
  'команда сперечається без даних',
  'аналітики немає — рішення наосліп',
  'власник керує вручну, у ручному тоні',
];

export default function Idea() {
  return (
    <>
      {/* ---- Велика ідея ---- */}
      <Section className="grid-bg">
        <div className="glow-cyan w-[420px] h-[420px] -top-20 right-0" />
        <FadeIn>
          <Eyebrow>Велика ідея</Eyebrow>
          <p className="font-bold text-xl sm:text-2xl text-[#8C96A5] mb-2">Ринок питає:</p>
          <SectionTitle className="text-[#B7C0CC]">«Як збільшити продажі?»</SectionTitle>
          <p className="font-bold text-xl sm:text-2xl text-[#8C96A5] mt-10 mb-2">
            Я ставлю інше питання:
          </p>
          <SectionTitle>
            <span className="lime-text">«Як збільшити вартість компанії?»</span>
          </SectionTitle>
          <p className="font-serif-it text-lg text-[#B7C0CC] mt-8">
            Це дві абсолютно різні розмови. І майбутнє — за другою.
          </p>
        </FadeIn>
      </Section>

      {/* ---- Маніфест ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>Маніфест</Eyebrow>
          <SectionTitle>
            Увагу <span className="text-[#FF6A3D]">не можна купити назавжди</span>.
            <br />
            Справжнє зростання починається там, де з&rsquo;являється{' '}
            <span className="text-[#A3E635]">система</span>.
          </SectionTitle>
        </FadeIn>
        <AnimatedText
          text="Більшість вірить, що зростання народжується з нових рекламних кампаній. Але увага завжди належить платформам і алгоритмам. Commerce OS — це спосіб мислити про компанію як про актив: маркетинг, аналітика, продукт і команда працюють не заради окремих показників, а заради зростання вартості бізнесу."
          className="font-serif-it text-lg md:text-xl leading-relaxed text-[#E9EDF2] max-w-3xl mt-8"
        />
        <FadeIn delay={0.15}>
          <div className="flex flex-wrap gap-x-16 gap-y-6 mt-10">
            <div className="border-l border-[#232933] pl-5">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#8C96A5] mb-1.5">
                Ринок говорить
              </p>
              <p className="font-bold text-xl text-[#8C96A5]">Як більше продати</p>
            </div>
            <div className="border-l-2 border-[#A3E635] pl-5">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#A3E635] mb-1.5">
                Я говорю
              </p>
              <p className="font-bold text-xl">Як дорожчати</p>
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ---- Це про ваш бізнес? ---- */}
      <Section>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <FadeIn>
            <Eyebrow>Це про ваш бізнес?</Eyebrow>
            <SectionTitle>
              Компанія росте.
              <br />
              Потім — <span className="text-[#FF6A3D]">перестає</span>.
              <br />
              <span className="steel-text">Чому?</span>
            </SectionTitle>
            <p className="font-serif-it text-lg text-[#B7C0CC] mt-6 max-w-md leading-relaxed">
              Продукт нормальний. Люди намагаються. Але зростання зупинилось, а кожен наступний
              долар приносить менше.
            </p>
          </FadeIn>
          <div className="flex flex-col gap-4">
            <FadeIn delay={0.1}>
              <div className="card accent-left p-6" style={{ '--accent': 'var(--red)' } as React.CSSProperties}>
                <ul className="flex flex-col gap-3">
                  {PAINS.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-[#C7CFDA]">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: 'var(--red)', boxShadow: '0 0 8px rgba(255,95,86,0.7)' }}
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="text-center font-mono text-[#8C96A5]">↓</div>
              <div className="card accent-left p-6 mt-4" style={{ '--accent': 'var(--lime)' } as React.CSSProperties}>
                <p className="font-bold text-xl">
                  Commerce OS вирішує <span className="text-[#A3E635]">саме це</span>.
                </p>
                <p className="text-[#8C96A5] mt-2 text-sm leading-relaxed">
                  Система перетворює хаос симптомів на діагноз у грошах і план, що продає сам себе.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </Section>
    </>
  );
}
