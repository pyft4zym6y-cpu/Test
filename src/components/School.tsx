import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle } from './ui';

const VALUES = [
  {
    title: 'Системність',
    text: 'Хаос не масштабується. За кожним сильним бізнесом — архітектура рішень, даних і процесів. Система стає конкурентною перевагою.',
    accent: 'var(--lime)',
  },
  {
    title: 'Капіталізація',
    text: 'Успіх — не ліди й не оборот. Справжній результат — зростання вартості компанії як активу.',
    accent: 'var(--cyan)',
  },
  {
    title: 'Інтелект',
    text: 'Дані самі нічого не змінюють. Цінність з’являється, коли інформація стає рішенням, а рішення — стійкою перевагою.',
    accent: 'var(--purple)',
  },
  {
    title: 'Спадщина',
    text: 'Компанія має ставати сильнішою незалежно від того, чи власник в операційці. Інфраструктура працює й тоді, коли ручне управління йде на другий план.',
    accent: 'var(--yellow)',
  },
];

const BELIEFS = [
  { bold: 'Реклама — не стратегія.', rest: 'Вона лише прискорює вже наявну систему.' },
  {
    bold: 'CRM не збільшує прибуток.',
    rest: 'Його збільшують рішення, що стають можливими завдяки даним.',
  },
  {
    bold: 'Поки власник дивиться у звіти —',
    rest: 'найкращі компанії вже ухвалюють рішення.',
  },
];

export function SchoolIdentity() {
  return (
    <>
      {/* ---- Нова категорія ---- */}
      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>Більша картина</Eyebrow>
          <SectionTitle>
            За Commerce OS стоїть дисципліна —
            <br />
            <span className="lime-text">Commerce Architecture</span>
          </SectionTitle>
          <p className="text-[#8C96A5] mt-4 max-w-3xl leading-relaxed">
            Це спосіб проєктувати компанію як актив: маркетинг, аналітика, продукт і команда
            працюють не заради окремих показників, а заради вартості бізнесу. Так само, як SAP став
            операційною системою підприємств.
          </p>
        </FadeIn>
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-5 items-stretch mt-10">
          <FadeIn delay={0.1}>
            <div className="card p-7 h-full opacity-80">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#8C96A5] mb-3">
                Стара категорія
              </p>
              <p className="font-bold text-xl text-[#8C96A5] leading-snug">
                E-commerce Consulting
                <br />
                Digital Transformation
              </p>
              <p className="text-[#6B7482] text-sm mt-3">
                Пряме порівняння з десятками агенцій і консультантів.
              </p>
            </div>
          </FadeIn>
          <div className="hidden md:flex items-center text-[#A3E635] text-2xl font-mono">→</div>
          <FadeIn delay={0.2}>
            <div
              className="card accent-top p-7 h-full"
              style={{ '--accent': 'var(--lime)', borderColor: 'rgba(163,230,53,0.35)' } as React.CSSProperties}
            >
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#A3E635] mb-3">
                Моя категорія
              </p>
              <p className="font-extrabold text-2xl lime-text">Commerce Architecture</p>
              <p className="text-[#B7C0CC] text-sm mt-3 leading-relaxed">
                Проєктування цифрового підприємства як активу.
                <br />
                Commerce Infrastructure · Commerce Operating System.
              </p>
            </div>
          </FadeIn>
        </div>
        <FadeIn delay={0.3}>
          <div className="card p-5 mt-5 flex flex-wrap gap-x-6 gap-y-2 items-baseline">
            <span className="font-pixel text-[0.5rem] uppercase text-[#A3E635]">
              Без гучних слів
            </span>
            <span className="text-[#B7C0CC] text-sm">
              Я не «створюю ринок». Я бачу, що ринок <strong className="text-white">вже рухається сюди</strong>{' '}
              — від купівлі уваги до побудови активів. І будую інструмент для цього руху.
            </span>
          </div>
        </FadeIn>
      </Section>

      {/* ---- Візія · Місія ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>Візія · Місія</Eyebrow>
        </FadeIn>
        <div className="grid md:grid-cols-2 gap-5">
          <FadeIn delay={0.1}>
            <div className="card accent-top p-8 h-full" style={{ '--accent': 'var(--cyan)' } as React.CSSProperties}>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#3DDAD0] mb-4">
                Візія
              </p>
              <p className="font-extrabold text-xl md:text-2xl leading-snug">
                Commerce OS має стати операційною системою цифрових компаній —{' '}
                <span className="text-[#A3E635]">як SAP став ОС підприємств</span>.
              </p>
              <p className="text-[#8C96A5] text-sm mt-4 leading-relaxed">
                Нова школа управління e-commerce: компанії ростуть не через нескінченне збільшення
                реклами, а через цифрову інфраструктуру як стратегічний актив.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="card accent-top p-8 h-full" style={{ '--accent': 'var(--lime)' } as React.CSSProperties}>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#A3E635] mb-4">
                Місія
              </p>
              <p className="font-extrabold text-xl md:text-2xl leading-snug">
                Щоб підприємці перестали купувати маркетинг — і почали будувати цифрові активи.
              </p>
              <p className="font-serif-it text-[#B7C0CC] mt-4">
                Замінити хаотичне зростання системним управлінням вартістю бізнесу.
              </p>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* ---- Цінності ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>Цінності</Eyebrow>
          <SectionTitle>Чотири принципи школи</SectionTitle>
        </FadeIn>
        <div className="grid md:grid-cols-2 gap-5 mt-10">
          {VALUES.map((v, i) => (
            <FadeIn key={v.title} delay={i * 0.08}>
              <div className="card card-hover accent-left p-7 h-full" style={{ '--accent': v.accent } as React.CSSProperties}>
                <h3 className="font-extrabold text-xl mb-2.5">{v.title}</h3>
                <p className="text-[#8C96A5] text-sm leading-relaxed">{v.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>
    </>
  );
}

export function Beliefs() {
  return (
    <>
      {/* ---- Переконання ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>Переконання</Eyebrow>
        </FadeIn>
        <div className="flex flex-col">
          {BELIEFS.map((b, i) => (
            <FadeIn key={b.bold} delay={i * 0.1}>
              <p
                className={`font-extrabold leading-snug py-7 ${i > 0 ? 'border-t border-[#232933]' : ''}`}
                style={{ fontSize: 'clamp(1.25rem, 2.6vw, 1.9rem)' }}
              >
                {b.bold} <span className="text-[#66707E]">{b.rest}</span>
              </p>
            </FadeIn>
          ))}
        </div>
      </Section>
    </>
  );
}
