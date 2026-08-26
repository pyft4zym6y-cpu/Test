import { SCHOOL } from '../data/school';
import { TOTALS } from '../data/program';
import { JsonLd, personLd } from '../seo';
import CareerTrack from '../components/CareerTrack';
import {
  Bubble,
  ComicButton,
  Eyebrow,
  H2,
  Hand,
  PageHead,
  Pop,
  Section,
} from '../components/comic';

const METHOD = [
  {
    step: 'Рівень',
    text: '16 рівнів компетентності — від будови магазину до AI Commerce і капстоуна. Кожен спирається на попередній.',
  },
  {
    step: 'Модуль',
    text: `${TOTALS.modules} модулів — конкретні теми всередині рівня: від картки товару до P&L і юніт-економіки.`,
  },
  {
    step: 'Питання',
    text: `${TOTALS.questions} екзаменаційних питань — тих самих, які бізнес ставить консультанту. Вмієш відповісти — володієш темою.`,
  },
  {
    step: 'Чек-лист',
    text: 'Після кожного рівня — чек-лист компетенцій: чесна перевірка, що ти реально вмієш, а не «прослухав».',
  },
];

const FOR_WHOM = [
  'Новачкам, які хочуть професію з чіткою траєкторією зростання',
  'Маркетологам і спеціалістам, що впираються у стелю своєї ролі',
  'Керівникам, яким бракує системної картини всього e-commerce',
  'Власникам, що втомилися бути єдиним «мозком» свого магазину',
];

export default function About() {
  return (
    <>
      <JsonLd data={personLd()} />
      <PageHead
        eyebrow="Про школу"
        title={
          <>
            Ми вчимо <span className="redmark">архітекторів</span>, а не операторів кнопок
          </>
        }
        lead={SCHOOL.positioning}
      />

      <Section className="!pt-10">
        <div className="grid md:grid-cols-2 gap-7">
          <Pop>
            <div className="comic-border bg-brand text-white halftone-red hard-shadow p-8 h-full -rotate-[0.5deg]">
              <div className="inline-block comic-border bg-white text-ink px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em] mb-5">
                Місія
              </div>
              <p className="font-oswald font-semibold text-[24px] leading-snug uppercase">
                {SCHOOL.mission}
              </p>
            </div>
          </Pop>
          <Pop delay={0.1}>
            <div className="comic-border bg-ink text-white hard-shadow-red p-8 h-full rotate-[0.5deg]">
              <div className="inline-block comic-border bg-sun text-ink px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em] mb-5">
                Візія
              </div>
              <p className="font-oswald font-semibold text-[24px] leading-snug uppercase">
                {SCHOOL.vision}
              </p>
            </div>
          </Pop>
        </div>
      </Section>

      <Section className="halftone">
        <Pop>
          <Eyebrow>Цінності</Eyebrow>
          <H2>
            На чому <span className="yellowmark">стоїмо</span>
          </H2>
        </Pop>
        <div className="grid md:grid-cols-2 gap-7 mt-8">
          {SCHOOL.values.map((v, i) => (
            <Pop key={v.title} delay={i * 0.08}>
              <div className="comic-border bg-white hard-shadow-sm p-7 h-full flex gap-5">
                <div className="font-oswald font-bold text-[44px] leading-none text-brand shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="font-oswald font-bold uppercase text-xl mb-2">{v.title}</h3>
                  <p className="text-[14.5px] leading-relaxed text-ink/70">{v.text}</p>
                </div>
              </div>
            </Pop>
          ))}
        </div>
      </Section>

      <Section>
        <Pop>
          <Eyebrow>Як ми вчимо</Eyebrow>
          <H2>
            Рівень → модуль → питання → <span className="redmark">чек-лист</span>
          </H2>
          <p className="text-[15.5px] leading-relaxed font-semibold max-w-2xl mb-10">
            Жодних «уроків на 2 години води». Програма влаштована як екзамен на компетентність:
            знаєш відповіді — рухаєшся далі, не знаєш — саме тут твоя прогалина.
          </p>
        </Pop>
        <div className="grid md:grid-cols-4 gap-6">
          {METHOD.map((m, i) => (
            <Pop key={m.step} delay={i * 0.08}>
              <div className="relative comic-border bg-white hard-shadow-sm p-6 h-full">
                <div className="inline-block comic-border bg-brand text-white px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em] mb-4 -rotate-1">
                  Крок {i + 1}
                </div>
                <h3 className="font-oswald font-bold uppercase text-xl mb-2">{m.step}</h3>
                <p className="text-[13.5px] leading-relaxed text-ink/70">{m.text}</p>
                {i < METHOD.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-[26px] font-oswald font-bold text-2xl text-brand z-10">
                    →
                  </div>
                )}
              </div>
            </Pop>
          ))}
        </div>
      </Section>

      <Section className="bg-ink text-white">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Pop>
            <Eyebrow>Кому підходить</Eyebrow>
            <H2 className="text-white">
              Це про <span className="redmark">тебе</span>, якщо…
            </H2>
            <ul className="flex flex-col gap-4 mt-6">
              {FOR_WHOM.map((t) => (
                <li key={t} className="flex gap-4 items-start">
                  <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 comic-border bg-sun text-ink font-oswald font-bold text-[15px] mt-0.5">
                    ✓
                  </span>
                  <span className="text-[15.5px] font-semibold leading-relaxed text-white/90">
                    {t}
                  </span>
                </li>
              ))}
            </ul>
          </Pop>
          <Pop delay={0.12}>
            <div className="comic-border bg-white text-ink hard-shadow-red p-8 rotate-[0.6deg]">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand mb-4">
                Чесне попередження
              </div>
              <p className="font-oswald font-semibold uppercase text-[22px] leading-snug mb-4">
                Це не «пасивний перегляд лекцій під серіальчик»
              </p>
              <p className="text-[14.5px] leading-relaxed text-ink/70">
                Доведеться відповідати на питання, проходити чек-листи і думати як архітектор. Зате
                на виході — компетенції, які неможливо «прослухати», а можна тільки опанувати.
              </p>
            </div>
          </Pop>
        </div>
      </Section>

      <CareerTrack />

      <Section>
        <div className="grid lg:grid-cols-[auto_1fr] gap-10 items-start">
          <Pop>
            <div className="comic-border bg-brand halftone-red hard-shadow p-10 text-center -rotate-1">
              <div className="font-marck text-white text-[110px] leading-none">
                {SCHOOL.founder.initials}
              </div>
            </div>
          </Pop>
          <Pop delay={0.1}>
            <Eyebrow>{SCHOOL.founder.role}</Eyebrow>
            <H2 className="!mb-3">{SCHOOL.founder.name}</H2>
            <Hand className="text-brand block mb-5">програма з практики, а не з презентацій</Hand>
            <p className="text-[16px] leading-relaxed max-w-2xl mb-6">{SCHOOL.founder.bio}</p>
            <Bubble className="inline-block mb-8">
              <span className="font-semibold text-[15px]">
                «Кожен модуль програми — це питання, яке мені реально ставив бізнес.»
              </span>
            </Bubble>
            <div className="flex flex-wrap gap-4">
              <ComicButton to="/enroll">Записатися</ComicButton>
              <a
                href={SCHOOL.founder.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-block comic-border bg-white font-extrabold uppercase tracking-wider text-[14px] px-7 py-4 hard-shadow-sm hover:-translate-y-1 transition-transform"
              >
                LinkedIn
              </a>
            </div>
          </Pop>
        </div>
      </Section>
    </>
  );
}
