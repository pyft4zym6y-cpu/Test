import { Link } from 'react-router-dom';
import { courseStats, fmtPrice, levelsLabel, type Course } from '../data/courses';
import { Hand } from './comic';

export default function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const stats = courseStats(course);
  const tilt = index % 2 === 0 ? '-rotate-[0.6deg]' : 'rotate-[0.6deg]';

  return (
    <Link
      to={`/courses/${course.id}`}
      className={`group flex flex-col comic-border p-7 transition-transform duration-150 hover:-translate-y-1.5 ${tilt} ${
        course.featured ? 'bg-brand text-white hard-shadow' : 'bg-white hard-shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <span
          className={`inline-block comic-border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em] ${
            course.featured
              ? 'bg-white text-ink'
              : course.expert
                ? 'bg-ink text-white'
                : course.kind === 'general'
                  ? 'bg-sun'
                  : 'bg-paper'
          }`}
        >
          {course.expert
            ? 'Експертний курс ★'
            : course.kind === 'general'
              ? 'Загальний курс'
              : 'Точковий курс'}
        </span>
        <span
          className={`text-[12px] font-extrabold uppercase tracking-wider whitespace-nowrap ${
            course.featured ? 'text-white/80' : 'text-brand'
          }`}
        >
          {levelsLabel(course)}
        </span>
      </div>

      <h3 className="font-oswald font-bold uppercase text-[26px] leading-[1.05] mb-2">
        {course.name}
      </h3>
      <Hand className={`mb-4 ${course.featured ? 'text-white' : 'text-brand'}`}>
        {course.hook}
      </Hand>

      <p
        className={`text-[14px] leading-relaxed mb-5 flex-1 ${
          course.featured ? 'text-white/85' : 'text-ink/70'
        }`}
      >
        {course.audience}. {course.result}.
      </p>

      <div
        className={`flex items-end justify-between gap-3 border-t-[3px] pt-4 ${
          course.featured ? 'border-white/40' : 'border-ink'
        }`}
      >
        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-oswald font-bold text-[28px] leading-none">
              {fmtPrice(course.price)}
            </span>
            {course.oldPrice && (
              <span
                className={`text-[14px] font-bold line-through ${
                  course.featured ? 'text-white/60' : 'text-ink/40'
                }`}
              >
                {fmtPrice(course.oldPrice)}
              </span>
            )}
          </div>
          <div
            className={`text-[12px] font-extrabold uppercase tracking-wider mt-1.5 ${
              course.featured ? 'text-white/80' : 'text-ink/50'
            }`}
          >
            {course.duration} · {stats.modules} модулів
          </div>
        </div>
        <span
          className={`font-oswald font-bold uppercase text-[14px] group-hover:translate-x-1 transition-transform whitespace-nowrap ${
            course.featured ? 'text-white' : 'text-brand'
          }`}
        >
          Детальніше →
        </span>
      </div>
    </Link>
  );
}
