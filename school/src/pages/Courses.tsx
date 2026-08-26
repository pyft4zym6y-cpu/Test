import { useState } from 'react';
import { COURSES, type CourseKind } from '../data/courses';
import CourseCard from '../components/CourseCard';
import { PageHead, Pop, Section } from '../components/comic';
import { coursesItemListLd, JsonLd } from '../seo';

type Filter = 'all' | CourseKind | 'expert';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Усі' },
  { id: 'general', label: 'Загальні треки' },
  { id: 'targeted', label: 'Точкові курси' },
  { id: 'expert', label: 'Експертні ★' },
];

export default function Courses() {
  const [filter, setFilter] = useState<Filter>('all');
  const list = COURSES.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'expert') return c.expert === true;
    if (filter === 'targeted') return c.kind === 'targeted' && !c.expert;
    return c.kind === filter;
  });

  return (
    <>
      <JsonLd data={coursesItemListLd()} />
      <PageHead
        eyebrow="Каталог курсів"
        title={
          <>
            Загальні треки й <span className="redmark">точкові</span> курси
          </>
        }
        lead="Загальний трек веде рівнями поспіль і дає новий статус. Точковий курс закриває одну конкретну прогалину — SEO, CRM, фінанси чи маркетплейси."
      />

      <Section className="!pt-8">
        <Pop>
          <div className="flex flex-wrap gap-3 mb-10">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`comic-border px-5 py-2.5 text-[13px] font-extrabold uppercase tracking-wider cursor-pointer transition-transform hover:-translate-y-0.5 ${
                  filter === f.id ? 'bg-ink text-white hard-shadow-red' : 'bg-white hard-shadow-sm'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Pop>
        <div className="grid md:grid-cols-2 gap-7">
          {list.map((c, i) => (
            <Pop key={c.id} delay={(i % 4) * 0.06}>
              <CourseCard course={c} index={i} />
            </Pop>
          ))}
        </div>
      </Section>
    </>
  );
}
