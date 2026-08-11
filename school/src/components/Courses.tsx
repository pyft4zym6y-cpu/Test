import { COURSES } from '../data/program';
import { Eyebrow, FadeIn, Section, Title } from './Section';

export default function Courses({ onEnroll }: { onEnroll: (courseId: string) => void }) {
  return (
    <Section id="courses" className="bg-[#0a0a0a] border-t border-white/10">
      <FadeIn>
        <Eyebrow>Формати навчання</Eyebrow>
        <Title>Оберіть свій курс</Title>
        <p className="text-white/70 max-w-2xl leading-relaxed mb-14">
          Програма розбита на три блоки — можна пройти окремий блок відповідно до свого рівня або
          повний шлях до позиції E-Commerce Director.
        </p>
      </FadeIn>

      <div className="grid md:grid-cols-2 gap-6">
        {COURSES.map((c, i) => (
          <FadeIn key={c.id} delay={i * 0.1} className="h-full">
            <div
              className={`h-full flex flex-col p-8 border transition-colors duration-300 ${
                c.featured
                  ? 'bg-[#FF0000] border-[#FF0000]'
                  : 'border-white/15 hover:border-[#FF0000]'
              }`}
            >
              <div
                className={`text-[12px] uppercase tracking-[0.25em] mb-3 ${
                  c.featured ? 'text-white/80' : 'text-[#FF0000]'
                }`}
              >
                {c.levels}
              </div>
              <h3 className="font-italiana text-3xl mb-4">{c.name}</h3>
              <p className={`text-[14px] mb-5 ${c.featured ? 'text-white/85' : 'text-white/60'}`}>
                {c.audience}
              </p>
              <ul className="flex flex-col gap-2 mb-6 flex-1">
                {c.points.map((p) => (
                  <li
                    key={p}
                    className={`text-[14px] leading-relaxed pl-5 relative ${
                      c.featured ? 'text-white/90' : 'text-white/70'
                    }`}
                  >
                    <span
                      className={`absolute left-0 ${c.featured ? 'text-white' : 'text-[#FF0000]'}`}
                    >
                      —
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <div
                className={`text-[13px] uppercase tracking-wider mb-6 ${
                  c.featured ? 'text-white' : 'text-white/50'
                }`}
              >
                {c.result}
              </div>
              <button
                type="button"
                onClick={() => onEnroll(c.id)}
                className={`w-full py-4 text-[13px] uppercase tracking-[0.2em] transition-colors duration-300 cursor-pointer ${
                  c.featured
                    ? 'bg-white text-[#FF0000] hover:bg-black hover:text-white'
                    : 'bg-transparent border border-white/30 hover:bg-[#FF0000] hover:border-[#FF0000]'
                }`}
              >
                Записатися
              </button>
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}
