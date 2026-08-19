import { Link, Navigate, useParams } from 'react-router-dom';
import { courseById, courseLevels, courseStats, fmtPrice, levelsLabel } from '../data/courses';
import CourseCard from '../components/CourseCard';
import { Guarantee, Included, TrustStrip } from '../components/Trust';
import {
  ComicButton,
  Eyebrow,
  H1,
  H2,
  Hand,
  Pop,
  Section,
} from '../components/comic';

export default function CourseDetail() {
  const { id } = useParams();
  const course = id ? courseById(id) : undefined;
  if (!course) return <Navigate to="/courses" replace />;

  const levels = courseLevels(course);
  const stats = courseStats(course);

  return (
    <>
      <Section className="halftone !pb-12 pt-28 md:pt-36">
        <Pop>
          <Link
            to="/courses"
            className="inline-block mb-6 text-[13px] font-extrabold uppercase tracking-wider hover:text-brand"
          >
            ← Усі курси
          </Link>
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="inline-block comic-border bg-sun px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em]">
              {course.kind === 'general' ? 'Загальний курс' : 'Точковий курс'}
            </span>
            <span className="inline-block comic-border bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em]">
              {levelsLabel(course)}
            </span>
          </div>
          <H1 className="mb-4">{course.name}</H1>
          <Hand className="text-brand block mb-6">{course.hook}</Hand>
          <div className="inline-flex flex-wrap items-center gap-x-6 gap-y-2 comic-border bg-white hard-shadow-sm px-6 py-4 mb-8 -rotate-[0.5deg]">
            <span className="font-oswald font-bold text-[32px] leading-none">
              {fmtPrice(course.price)}
            </span>
            {course.oldPrice && (
              <span className="text-[16px] font-bold line-through text-ink/40">
                {fmtPrice(course.oldPrice)}
              </span>
            )}
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-ink/60">
              {course.duration} навчання
            </span>
            <span className="inline-block comic-border bg-sun px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider">
              Оплата частинами
            </span>
          </div>
          <div className="flex flex-wrap gap-4">
            <ComicButton to={`/enroll?course=${course.id}`}>Записатися на курс</ComicButton>
            <ComicButton to="/program" variant="white">
              Повна програма школи
            </ComicButton>
          </div>
        </Pop>
      </Section>

      <Section className="!pt-10">
        <div className="grid md:grid-cols-3 gap-7 mb-14">
          <Pop>
            <div className="comic-border bg-white hard-shadow-sm p-6 h-full">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand mb-2">
                Для кого
              </div>
              <p className="text-[14.5px] leading-relaxed font-semibold">{course.audience}</p>
            </div>
          </Pop>
          <Pop delay={0.08}>
            <div className="comic-border bg-white hard-shadow-sm p-6 h-full">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand mb-2">
                Обсяг
              </div>
              <p className="text-[14.5px] leading-relaxed font-semibold">
                {stats.levels} {stats.levels === 1 ? 'рівень' : 'рівні(в)'} · {stats.modules}{' '}
                модулів · {stats.questions} екзаменаційних питань. Після кожного рівня — чек-лист
                компетенцій.
              </p>
            </div>
          </Pop>
          <Pop delay={0.16}>
            <div className="comic-border bg-ink text-white hard-shadow-red p-6 h-full">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sun mb-2">
                Результат
              </div>
              <p className="text-[14.5px] leading-relaxed font-semibold">{course.result}</p>
            </div>
          </Pop>
        </div>

        <Pop>
          <Eyebrow>Що всередині</Eyebrow>
          <H2>
            Рівні <span className="redmark">курсу</span>
          </H2>
        </Pop>
        <div className="flex flex-col mt-6">
          {levels.map((l, i) => (
            <Pop key={l.n} delay={(i % 6) * 0.05}>
              <div className="group grid md:grid-cols-[64px_1fr_auto] gap-4 md:gap-8 items-start border-b-[3px] border-ink py-6 px-2 hover:bg-white transition-colors">
                <div className="font-oswald font-bold text-3xl text-ink/30 group-hover:text-brand transition-colors">
                  {String(l.n).padStart(2, '0')}
                </div>
                <div>
                  <h4 className="font-oswald font-bold uppercase tracking-wide text-[17px] mb-1">
                    {l.title}
                  </h4>
                  <p className="text-ink/65 text-[14px] leading-relaxed max-w-2xl">{l.summary}</p>
                </div>
                <div className="text-right text-[12px] font-extrabold uppercase tracking-wider whitespace-nowrap">
                  <div className="text-brand mb-1">{l.status}</div>
                  <div className="text-ink/50">
                    {l.modules} модулів · {l.questions} питань
                  </div>
                </div>
              </div>
            </Pop>
          ))}
        </div>

        <Pop className="mt-14">
          <Eyebrow>Практика і матеріали</Eyebrow>
          <H2>
            Зробиш <span className="yellowmark">руками</span>, а не «прослухаєш»
          </H2>
        </Pop>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {course.practice.map((p, i) => (
            <Pop key={p} delay={(i % 2) * 0.08}>
              <div className="comic-border bg-white hard-shadow-sm p-6 h-full flex gap-4 items-start">
                <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 comic-border bg-brand text-white font-oswald font-bold text-[16px]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-[14.5px] leading-relaxed font-semibold">{p}</p>
              </div>
            </Pop>
          ))}
        </div>
      </Section>

      <TrustStrip />
      <Included />
      <Guarantee />

      {course.next && courseById(course.next) && (
        <Section className="!py-0">
          <Pop>
            <Eyebrow>Куди далі</Eyebrow>
            <H2 className="!mb-2">
              Наступний крок <span className="redmark">шляху</span>
            </H2>
            <Hand className="text-brand block mb-8">курс — не тупик, а сходинка.</Hand>
          </Pop>
          <div className="grid md:grid-cols-2 gap-7">
            <Pop delay={0.08}>
              <CourseCard course={courseById(course.next)!} />
            </Pop>
          </div>
        </Section>
      )}

      <Section>
        <Pop>
          <div className="comic-border bg-sun hard-shadow p-8 md:p-10 text-center">
            <H2 className="!mb-3">Звучить як твій курс?</H2>
            <p className="font-semibold text-[15px] mb-6">
              Залиш заявку — підтвердимо рівень і забронюємо місце.
            </p>
            <ComicButton to={`/enroll?course=${course.id}`}>Записатися</ComicButton>
          </div>
        </Pop>
      </Section>
    </>
  );
}
