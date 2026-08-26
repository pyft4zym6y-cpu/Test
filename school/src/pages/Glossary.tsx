import { Link } from 'react-router-dom';
import { GLOSSARY, GLOSSARY_COUNT } from '../data/glossary';
import { courseById } from '../data/courses';
import { Hand, PageHead, Pop, Section } from '../components/comic';
import { JsonLd, SITE } from '../seo';

function glossaryLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': SITE + '/glossary#set',
    name: 'Глосарій e-commerce термінів',
    description: `${GLOSSARY_COUNT} термінів електронної комерції з поясненнями простою мовою.`,
    url: SITE + '/glossary',
    inLanguage: 'uk',
    hasDefinedTerm: GLOSSARY.flatMap((g) =>
      g.terms.map((t) => ({
        '@type': 'DefinedTerm',
        name: t.term,
        description: t.def,
        inDefinedTermSet: SITE + '/glossary#set',
      })),
    ),
  };
}

export default function Glossary() {
  return (
    <>
      <JsonLd data={glossaryLd()} />
      <PageHead
        eyebrow="Глосарій"
        title={
          <>
            E-commerce <span className="redmark">словник</span>
          </>
        }
        lead={`${GLOSSARY_COUNT} термінів, якими говорить e-commerce: від воронки і юніт-економіки до GEO і AI Commerce. Кожне пояснення — простою мовою, без академічної води.`}
      />

      <Section className="!pt-8">
        <Pop>
          <div className="flex flex-wrap gap-3 mb-14">
            {GLOSSARY.map((g) => (
              <a
                key={g.anchor}
                href={`#${g.anchor}`}
                className="inline-block comic-border bg-white hard-shadow-sm px-4 py-2 text-[12px] font-extrabold uppercase tracking-wider hover:bg-sun transition-colors"
              >
                {g.title}
              </a>
            ))}
          </div>
        </Pop>

        {GLOSSARY.map((group) => (
          <div key={group.anchor} id={group.anchor} className="mb-16 scroll-mt-28">
            <Pop>
              <h2 className="font-oswald font-bold uppercase text-[28px] leading-tight mb-6">
                <span className="yellowmark">{group.title}</span>
              </h2>
            </Pop>
            <div className="grid md:grid-cols-2 gap-6">
              {group.terms.map((t, i) => {
                const course = t.courseId ? courseById(t.courseId) : undefined;
                return (
                  <Pop key={t.term} delay={(i % 2) * 0.05}>
                    <div className="comic-border bg-white hard-shadow-sm p-6 h-full flex flex-col">
                      <h3 className="font-oswald font-bold uppercase text-[18px] leading-tight mb-2">
                        {t.term}
                      </h3>
                      <p className="text-[14.5px] leading-relaxed text-ink/80 flex-1">{t.def}</p>
                      {course && (
                        <Link
                          to={`/courses/${course.id}`}
                          className="mt-4 font-oswald font-bold uppercase text-[12px] tracking-wider text-brand hover:translate-x-1 inline-block transition-transform"
                        >
                          Опанувати системно: {course.name} →
                        </Link>
                      )}
                    </div>
                  </Pop>
                );
              })}
            </div>
          </div>
        ))}

        <Pop>
          <div className="comic-border bg-ink text-white hard-shadow-red p-8 md:p-10 text-center">
            <h2 className="font-oswald font-bold uppercase text-[26px] mb-3">
              Терміни — це лише мапа
            </h2>
            <Hand className="text-sun block mb-6">територію вивчають на практиці.</Hand>
            <Link
              to="/courses"
              className="inline-block comic-border bg-brand text-white font-oswald font-bold uppercase tracking-wider px-8 py-3.5 hard-shadow-sm hover:-translate-y-0.5 transition-transform"
            >
              Обрати курс
            </Link>
          </div>
        </Pop>
      </Section>
    </>
  );
}
