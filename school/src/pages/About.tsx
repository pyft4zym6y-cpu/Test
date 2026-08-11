import { SCHOOL } from '../data/school';
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

export default function About() {
  return (
    <>
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
