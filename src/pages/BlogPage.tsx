import { Link } from 'react-router-dom';
import FadeIn from '../components/FadeIn';
import Breadcrumbs from '../components/Breadcrumbs';
import { Eyebrow, Section, SectionTitle } from '../components/ui';
import { PageCta } from '../components/NewSections';
import { POSTS } from '../data/blog';

const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

export default function BlogPage() {
  return (
    <div className="pt-16">
      <Breadcrumbs items={[{ label: 'Блог' }]} />
      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>Блог · Практика, не теорія</Eyebrow>
          <SectionTitle as="h1">
            Як росте e-commerce:{' '}
            <span className="font-pixel text-[0.8em] text-[#4D7C0F] inline-block align-baseline leading-none">
              цифри й механіки
            </span>
          </SectionTitle>
          <p className="text-[#5A6472] mt-4 max-w-3xl">
            Конверсія, retention, юніт-економіка, SEO і AI — те саме, що ми робимо в аудитах і
            проєктах, у відкритому форматі. Кожна стаття — з нормами, формулами і кроками.
          </p>
        </FadeIn>
        <div className="grid sm:grid-cols-2 gap-5 mt-12">
          {POSTS.map((p, i) => (
            <FadeIn key={p.slug} delay={Math.min(i, 5) * 0.06}>
              <Link
                to={`/blog/${p.slug}`}
                className="card card-hover accent-top p-7 h-full flex flex-col group"
                style={{ '--accent': p.color } as React.CSSProperties}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em]" style={{ color: p.color }}>
                    {p.cat}
                  </span>
                  <span className="font-mono text-[0.62rem] text-[#5A6472]">{p.minutes} хв</span>
                </div>
                <p className="font-extrabold text-xl mt-3 leading-snug">{p.title}</p>
                <p className="text-[#5A6472] text-sm mt-3 leading-relaxed flex-1">{p.desc}</p>
                <div className="flex items-center justify-between mt-5">
                  <span className="font-mono text-[0.62rem] text-[#5A6472]">{fmtDate(p.date)}</span>
                  <span className="font-mono text-xs uppercase tracking-wider text-black/60 group-hover:text-[#4D7C0F] transition-colors">
                    Читати →
                  </span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </Section>
      <PageCta />
    </div>
  );
}
