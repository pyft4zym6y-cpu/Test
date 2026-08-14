import { motion } from 'motion/react';
import { COURSES } from '../data/courses';
import { TOTALS } from '../data/program';
import { SCHOOL } from '../data/school';
import CourseCard from '../components/CourseCard';
import CareerTrack from '../components/CareerTrack';
import { Guarantee, Results, TrustStrip } from '../components/Trust';
import {
  Bubble,
  Burst,
  ComicButton,
  Eyebrow,
  H1,
  H2,
  Hand,
  Marquee,
  Pop,
  Section,
} from '../components/comic';

function Hero() {
  return (
    <Section className="halftone !py-0">
      <div className="grid lg:grid-cols-[1.25fr_1fr] gap-10 items-center min-h-[78vh] py-16">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Eyebrow>{SCHOOL.tagline}</Eyebrow>
            <H1 className="mb-4">
              Досить <span className="redmark">гасити пожежі</span> у своєму магазині
            </H1>
            <Hand className="text-brand block mb-6">…геніально ж, правда?</Hand>
            <p className="max-w-xl text-[17px] leading-relaxed font-semibold mb-9">
              Ми вчимо будувати e-commerce як систему: від будови кошика до крісла директора.
              12 рівнів, зібраних із сотень реальних аудитів — а не з чужих презентацій.
            </p>
            <div className="flex flex-wrap gap-4">
              <ComicButton to="/courses">Обрати курс</ComicButton>
              <ComicButton to="/program" variant="white">
                Дивитися програму
              </ComicButton>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotate: 2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative hidden lg:block"
        >
          <div className="comic-border bg-brand halftone-red hard-shadow p-10 rotate-[1.5deg]">
            <div className="font-marck text-white text-[90px] leading-none mb-4">П.С.</div>
            <p className="text-white font-semibold text-[15px] leading-relaxed">
              «Бізнес має служити твоєму життю, а не поглинати його. Опануй архітектуру — і система
              працюватиме на тебе.»
            </p>
            <p className="text-white/70 text-[12px] uppercase tracking-[0.2em] font-extrabold mt-4">
              {SCHOOL.founder.name} · засновник
            </p>
          </div>
          <Burst className="absolute -top-10 -right-6" rotate={10}>
            без води!
          </Burst>
          <Burst
            className="absolute -bottom-8 -left-8"
            color="#fff"
            rotate={-12}
            size={110}
          >
            12 рівнів
          </Burst>
        </motion.div>
      </div>
    </Section>
  );
}

function WhoYouBecome() {
  const ROLES = [
    {
      title: 'Спеціаліст',
      text: 'Розумієш, як влаштований магазин, і закриваєш свій напрям без «а хто це має робити?»',
      grade: 'Junior → Middle',
    },
    {
      title: 'Керівник',
      text: 'Керуєш командою, бюджетом і підрядниками. Читаєш цифри швидше, ніж вони встигають збрехати.',
      grade: 'Senior → Director',
    },
    {
      title: 'Незалежний експерт',
      text: 'Продаєш експертизу, ведеш кілька проєктів і будуєш особистий бренд консультанта.',
      grade: 'Fractional Director',
    },
  ];
  return (
    <Section>
      <Pop>
        <Eyebrow>Ким ти станеш</Eyebrow>
        <H2>
          Три ролі. <span className="redmark">Один шлях.</span>
        </H2>
      </Pop>
      <div className="grid md:grid-cols-3 gap-7 mt-10">
        {ROLES.map((r, i) => (
          <Pop key={r.title} delay={i * 0.1}>
            <div className="comic-border bg-white hard-shadow-sm p-7 h-full flex flex-col">
              <div className="font-oswald font-bold text-[64px] leading-none text-brand mb-3">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="font-oswald font-bold uppercase text-2xl mb-3">{r.title}</h3>
              <p className="text-[14.5px] leading-relaxed text-ink/70 flex-1">{r.text}</p>
              <div className="mt-5 inline-block self-start comic-border bg-sun px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider">
                {r.grade}
              </div>
            </div>
          </Pop>
        ))}
      </div>
    </Section>
  );
}

function MissionTeaser() {
  return (
    <Section className="bg-ink text-white">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <Pop>
          <Eyebrow>Навіщо ми це робимо</Eyebrow>
          <H2 className="text-white">
            Місія: прибрати <span className="redmark">хаос</span> з e-commerce
          </H2>
          <p className="text-white/75 text-[16px] leading-relaxed max-w-xl mb-8">
            {SCHOOL.mission} Ми віримо у світ, де магазином керує архітектор — і бізнес росте за
            планом, а не на удачу.
          </p>
          <ComicButton to="/about" variant="red">
            Місія, візія, цінності
          </ComicButton>
        </Pop>
        <div className="grid grid-cols-2 gap-5">
          {SCHOOL.values.map((v, i) => (
            <Pop key={v.title} delay={i * 0.08}>
              <div
                className={`comic-border bg-white text-ink p-5 h-full ${
                  i % 2 === 0 ? '-rotate-1' : 'rotate-1'
                }`}
              >
                <div className="font-oswald font-bold uppercase text-lg mb-1.5 text-brand">
                  {v.title}
                </div>
                <p className="text-[13px] leading-relaxed text-ink/75">{v.text}</p>
              </div>
            </Pop>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Numbers() {
  const STATS = [
    { value: TOTALS.levels, label: 'рівнів компетентності' },
    { value: TOTALS.modules, label: 'навчальних модулів' },
    { value: TOTALS.questions, label: 'екзаменаційних питань' },
  ];
  return (
    <Section className="halftone !py-16">
      <div className="grid grid-cols-3 gap-6">
        {STATS.map((s, i) => (
          <Pop key={s.label} delay={i * 0.08}>
            <div className="text-center">
              <div className="font-oswald font-bold text-[clamp(44px,7vw,96px)] leading-none">
                <span className={i === 2 ? 'redmark' : ''}>{s.value}</span>
              </div>
              <div className="text-[12px] md:text-[13px] font-extrabold uppercase tracking-wider mt-3 text-ink/60">
                {s.label}
              </div>
            </div>
          </Pop>
        ))}
      </div>
    </Section>
  );
}

function CoursesTeaser() {
  const featured = COURSES.filter((c) => c.kind === 'general');
  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <Pop>
          <Eyebrow>Курси</Eyebrow>
          <H2 className="!mb-0">
            Загальні треки й <span className="yellowmark">точкові</span> курси
          </H2>
        </Pop>
        <Pop delay={0.1}>
          <ComicButton to="/courses" variant="ink">
            Усі курси ({COURSES.length})
          </ComicButton>
        </Pop>
      </div>
      <div className="grid md:grid-cols-2 gap-7">
        {featured.map((c, i) => (
          <Pop key={c.id} delay={i * 0.08}>
            <CourseCard course={c} index={i} />
          </Pop>
        ))}
      </div>
    </Section>
  );
}

function Manifesto() {
  return (
    <section className="relative w-full bg-brand halftone-red flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col items-center w-full pt-24 pb-10">
        <div className="flex flex-col items-center w-full px-8 text-center z-20 relative max-w-[900px] mx-auto">
          <Pop>
            <svg width="64" height="64" viewBox="0 0 120 120" fill="none" className="mx-auto mb-10">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M60 120C26.8629 120 0 93.1371 0 60V0C22.5654 0 42.2213 12.4569 52.4662 30.8691C38.4788 34.2089 28.0787 46.7902 28.0787 61.8006V63.1443C28.0787 79.9648 41.7146 93.6006 58.5353 93.6006H59.8789L59.8785 61.8006C59.8785 79.3633 74.1159 93.6006 91.6787 93.6006L91.6787 61.8006C91.6787 44.2783 77.5071 30.0661 60 30.0008L60 0H62.5352C94.2722 0 120 25.7279 120 57.4648V60C120 93.1371 93.1371 120 60 120Z"
                fill="white"
              />
            </svg>
          </Pop>
          <Pop delay={0.1}>
            <p className="text-white text-[15px] max-w-[420px] leading-[1.6] mb-9 uppercase tracking-wider font-extrabold mx-auto">
              Ми створили цю школу з єдиною метою — прибрати хаос з e-commerce і виховати нове
              покоління архітекторів цифрового бізнесу
            </p>
          </Pop>
          <Pop delay={0.2}>
            <div className="font-marck text-white text-[110px] leading-none mb-8">П.С.</div>
          </Pop>
          <Pop delay={0.3}>
            <div className="text-white leading-[1.6] mb-16 w-full flex flex-col items-center font-semibold">
              <p className="mb-5 text-[15px] w-[420px] max-w-full text-center">
                Я втомився від навчання, що вимагає більше зусиль, ніж дає результату. Тому програма
                школи зібрана з реальної практики — аудитів і трансформацій живих
                інтернет-магазинів.
              </p>
              <p className="text-[15px] w-[420px] max-w-full text-center">
                Бізнес має служити твоєму життю, а не поглинати його. Опануй архітектуру
                e-commerce — і система працюватиме на тебе, поки ти фокусуєшся на візії.
              </p>
            </div>
          </Pop>
        </div>
      </div>
      <div className="relative w-full shrink-0">
        <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-brand to-transparent z-10 pointer-events-none" />
        <video autoPlay loop muted playsInline className="w-full h-auto block object-contain">
          <source
            src="https://res.cloudinary.com/daklr2whx/video/upload/v1778602552/track-video_2_s9lp53.mp4"
            type="video/mp4"
          />
        </video>
      </div>
    </section>
  );
}

function CtaStrip() {
  return (
    <Section className="!py-20">
      <Pop>
        <div className="comic-border bg-sun hard-shadow p-10 md:p-14 text-center relative overflow-visible">
          <Bubble className="inline-block mb-6 -rotate-1">
            <span className="font-extrabold text-[15px]">Не знаєш, з якого рівня почати?</span>
          </Bubble>
          <H2>
            Напиши нам — <span className="redmark">підберемо</span> курс
          </H2>
          <p className="max-w-xl mx-auto text-[15px] font-semibold mb-8">
            Коротка заявка, чесна відповідь: з якого рівня стартувати і який курс закриє твою
            прогалину найшвидше.
          </p>
          <ComicButton to="/enroll">Записатися на навчання</ComicButton>
        </div>
      </Pop>
    </Section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee
        items={[
          'Стратегія → Система → Результат',
          'Від новачка до E-Commerce Director',
          '12 рівнів · 114 модулів · 1325 питань',
        ]}
      />
      <WhoYouBecome />
      <Results />
      <MissionTeaser />
      <Numbers />
      <CoursesTeaser />
      <TrustStrip />
      <CareerTrack />
      <Guarantee />
      <Manifesto />
      <CtaStrip />
    </>
  );
}
