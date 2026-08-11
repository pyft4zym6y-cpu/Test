import { CONTACTS } from '../data/program';
import { Eyebrow, FadeIn, Section, Title } from './Section';

const PILLARS = [
  {
    name: 'weexp · агенція',
    text: 'Консалтинг і трансформація e-commerce бізнесів. Тут народжується практика, на якій побудована програма школи.',
    href: CONTACTS.agency,
    cta: 'weexp.agency',
  },
  {
    name: 'Commerce OS™',
    text: 'Операційна система цифрової компанії: аудит, Health Score, дорожня карта трансформації. Дисципліна, що стоїть за методологією.',
    href: CONTACTS.agency,
    cta: 'Дізнатися більше',
  },
  {
    name: 'Школа Commerce Architecture',
    text: 'Освітнє крило екосистеми: та сама методологія, якою агенція аудитує магазини, — тепер як шлях навчання від новачка до директора.',
    href: '#program',
    cta: 'Програма школи',
  },
];

export default function Ecosystem() {
  return (
    <Section id="ecosystem" className="bg-[#0a0a0a]">
      <FadeIn>
        <Eyebrow>Єдина екосистема</Eyebrow>
        <Title>
          Школа — продовження
          <br />
          weexp · Commerce OS
        </Title>
        <p className="text-white/70 max-w-2xl leading-relaxed mb-14">
          Commerce Architecture — це дисципліна проєктування цифрової компанії як активу. Агенція
          weexp застосовує її в консалтингу, а школа передає її спеціалістам. Одна методологія, один
          засновник, один стандарт якості.
        </p>
      </FadeIn>

      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {PILLARS.map((p, i) => (
          <FadeIn key={p.name} delay={i * 0.12}>
            <div className="border border-white/15 p-8 h-full flex flex-col hover:border-[#FF0000] transition-colors duration-300">
              <h3 className="font-italiana text-2xl mb-4">{p.name}</h3>
              <p className="text-white/60 text-[15px] leading-relaxed flex-1">{p.text}</p>
              <a
                href={p.href}
                target={p.href.startsWith('http') ? '_blank' : undefined}
                rel={p.href.startsWith('http') ? 'noreferrer' : undefined}
                className="mt-6 text-[#FF0000] text-[13px] uppercase tracking-wider hover:underline"
              >
                {p.cta} →
              </a>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn>
        <div className="border border-white/15 p-8 md:p-12 grid md:grid-cols-[auto_1fr] gap-8 items-center">
          <div className="font-marck text-[#FF0000] text-[72px] leading-none">П.С.</div>
          <div>
            <p className="text-[12px] uppercase tracking-[0.3em] text-white/50 mb-3">
              Засновник школи
            </p>
            <h3 className="font-italiana text-3xl mb-3">Павло Сідоренко</h3>
            <p className="text-white/70 leading-relaxed max-w-2xl">
              E-commerce консультант, засновник агенції weexp і автор методології Commerce OS™.
              Програма школи зібрана з реальної практики аудитів і трансформацій інтернет-магазинів —
              кожен рівень спирається на питання, які щодня ставить бізнесу консультант.
            </p>
            <div className="flex flex-wrap gap-6 mt-5">
              <a
                href={CONTACTS.agencyAbout}
                target="_blank"
                rel="noreferrer"
                className="text-[#FF0000] text-[13px] uppercase tracking-wider hover:underline"
              >
                Про засновника на weexp.agency →
              </a>
              <a
                href={CONTACTS.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-white/60 text-[13px] uppercase tracking-wider hover:text-white"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </FadeIn>
    </Section>
  );
}
