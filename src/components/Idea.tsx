import FadeIn from './FadeIn';
import AnimatedText from './AnimatedText';
import { Eyebrow, Section, SectionTitle } from './ui';

const PAINS = [
  'CAC росте щомісяця — маржа тане',
  'вимкнули рекламу — продажі впали до нуля',
  'знижка — єдиний спосіб продати',
  'бренд не шукають на імʼя: гуглять «купити …» — і йдуть до будь-кого',
  'повторні покупки 12–15% — база лежить мертвим вантажем',
  'на маркетплейсах заробляють усі, крім вас',
  'сезонний пік знову провалили: товару не було, реклама лилась',
  'CRM не конвертує в продажі',
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
          <Eyebrow>Зсув</Eyebrow>
          <p className="font-bold text-xl sm:text-2xl text-[#5A6472] mb-2">
            Правильне питання — не
          </p>
          <SectionTitle className="text-[#3F4854]">«Як продати більше?»</SectionTitle>
          <p className="font-bold text-xl sm:text-2xl text-[#5A6472] mt-10 mb-2">А</p>
          <SectionTitle>
            <span className="lime-text">«Як зробити компанію дорожчою?»</span>
          </SectionTitle>
        </FadeIn>
        <AnimatedText
          text="Продажі — це квартал. Вартість компанії — це десятиліття. Commerce OS — спосіб мислити про компанію як про актив: маркетинг, аналітика, продукт і команда працюють не заради окремих показників, а заради зростання вартості бізнесу."
          className="font-serif-it text-lg md:text-xl leading-relaxed text-[#141820] max-w-3xl mt-8"
        />
      </Section>

      {/* ---- Це про ваш бізнес? ---- */}
      <Section>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <FadeIn>
            <Eyebrow>Це про ваш бізнес?</Eyebrow>
            <SectionTitle>
              Компанія росте.
              <br />
              Потім — <span className="text-[#EA580C]">перестає</span>.
              <br />
              <span className="steel-text">Чому?</span>
            </SectionTitle>
            <p className="font-serif-it text-lg text-[#3F4854] mt-6 max-w-md leading-relaxed">
              Продукт нормальний. Люди намагаються. Але зростання зупинилось, а кожен наступний
              долар приносить менше.
            </p>
          </FadeIn>
          <div className="flex flex-col gap-4">
            <FadeIn delay={0.1}>
              <div className="card accent-left p-6" style={{ '--accent': 'var(--red)' } as React.CSSProperties}>
                <ul className="flex flex-col gap-3">
                  {PAINS.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-[#2F3742]">
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
              <div className="text-center font-mono text-[#5A6472]">↓</div>
              <div className="card accent-left p-6 mt-4" style={{ '--accent': 'var(--lime)' } as React.CSSProperties}>
                <p className="font-bold text-xl">
                  Commerce OS вирішує <span className="text-[#4D7C0F]">саме це</span>.
                </p>
                <p className="text-[#5A6472] mt-2 text-sm leading-relaxed">
                  Система перетворює хаос симптомів на діагноз у грошах і план, що продає сам себе.
                </p>
                <p className="text-[#2F3742] mt-3 text-sm leading-relaxed border-t border-black/[0.06] pt-3">
                  А максимум амбіції — бренд, що стає{' '}
                  <strong className="text-[#4D7C0F]">загальною назвою категорії</strong>: як Xerox
                  для копій чи Google для пошуку. Щоб питали не «де купити …», а «де ваш магазин».
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </Section>
    </>
  );
}
