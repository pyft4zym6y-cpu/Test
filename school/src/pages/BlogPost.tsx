import { Link, Navigate, useParams } from 'react-router-dom';
import { POSTS, postBySlug } from '../data/blog';
import { courseById } from '../data/courses';
import CourseCard from '../components/CourseCard';
import { Eyebrow, H2, Hand, Pop, Section } from '../components/comic';
import { JsonLd, SITE } from '../seo';
import { SCHOOL } from '../data/school';

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function articleLd(slug: string) {
  const post = postBySlug(slug)!;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: 'uk',
    url: `${SITE}/blog/${post.slug}`,
    author: {
      '@type': 'Person',
      name: SCHOOL.founder.name,
      jobTitle: SCHOOL.founder.role,
      sameAs: [SCHOOL.founder.linkedin],
    },
    publisher: { '@id': SITE + '/#organization' },
  };
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = slug ? postBySlug(slug) : undefined;
  if (!post) return <Navigate to="/blog" replace />;

  const course = courseById(post.courseId);
  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <JsonLd data={articleLd(post.slug)} />
      <Section className="halftone !pb-10 pt-28 md:pt-36">
        <Pop>
          <Link
            to="/blog"
            className="inline-block mb-6 text-[13px] font-extrabold uppercase tracking-wider hover:text-brand"
          >
            ← Усі статті
          </Link>
          <div className="flex flex-wrap gap-2 mb-5">
            {post.tags.map((t) => (
              <span
                key={t}
                className="inline-block comic-border bg-sun px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em]"
              >
                {t}
              </span>
            ))}
          </div>
          <h1
            className="font-oswald font-bold uppercase leading-[1.02] text-[clamp(32px,5vw,60px)] tracking-tight mb-5 max-w-4xl"
            style={{ textWrap: 'balance' }}
          >
            {post.title}
          </h1>
          <p className="text-[13px] font-extrabold uppercase tracking-wider text-ink/50">
            {fmtDate(post.date)} · {post.readTime} читання · {SCHOOL.founder.name}
          </p>
        </Pop>
      </Section>

      <Section className="!pt-10">
        <div className="max-w-3xl">
          <Pop>
            <p className="text-[18px] leading-relaxed font-semibold border-l-[6px] border-brand pl-6 mb-10">
              {post.intro}
            </p>
          </Pop>
          {post.sections.map((s, i) => (
            <Pop key={i} delay={0.05}>
              <div className="mb-9">
                {s.h && (
                  <h2 className="font-oswald font-bold uppercase text-[24px] leading-tight mb-4">
                    {s.h}
                  </h2>
                )}
                {s.p?.map((par) => (
                  <p key={par.slice(0, 40)} className="text-[15.5px] leading-relaxed text-ink/80 mb-4">
                    {par}
                  </p>
                ))}
                {s.list && (
                  <ul className="flex flex-col gap-3 mt-2">
                    {s.list.map((item) => (
                      <li
                        key={item.slice(0, 40)}
                        className="text-[15px] leading-relaxed text-ink/80 pl-6 relative"
                      >
                        <span className="absolute left-0 top-0 text-brand font-extrabold">■</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Pop>
          ))}
        </div>

        {course && (
          <Pop className="mt-14">
            <Eyebrow>Опанувати тему системно</Eyebrow>
            <H2 className="!mb-2">
              Профільний <span className="redmark">курс</span>
            </H2>
            <Hand className="text-brand block mb-8">стаття — це трейлер. Курс — повний фільм.</Hand>
            <div className="grid md:grid-cols-2 gap-7">
              <CourseCard course={course} />
            </div>
          </Pop>
        )}

        {related.length > 0 && (
          <Pop className="mt-16">
            <H2 className="!mb-6">Ще з блогу</H2>
            <div className="grid md:grid-cols-2 gap-7">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group comic-border bg-white hard-shadow-sm p-6 hover:-translate-y-1 transition-transform"
                >
                  <h3 className="font-oswald font-bold uppercase text-[18px] leading-tight mb-2">
                    {p.title}
                  </h3>
                  <span className="font-oswald font-bold uppercase text-[13px] text-brand group-hover:translate-x-1 inline-block transition-transform">
                    Читати →
                  </span>
                </Link>
              ))}
            </div>
          </Pop>
        )}
      </Section>
    </>
  );
}
