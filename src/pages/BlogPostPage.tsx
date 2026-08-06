import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import FadeIn from '../components/FadeIn';
import Breadcrumbs from '../components/Breadcrumbs';
import { Eyebrow, Section, SectionTitle, Chip } from '../components/ui';
import { PageCta } from '../components/NewSections';
import { POSTS, postBySlug } from '../data/blog';

const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = slug ? postBySlug(slug) : undefined;

  // Article JSON-LD + метадані статті
  useEffect(() => {
    if (!post) return;
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.desc,
      datePublished: post.date,
      inLanguage: 'uk',
      author: { '@type': 'Organization', name: 'weexp' },
      publisher: { '@type': 'Organization', name: 'weexp', url: 'https://weexp.agency' },
      mainEntityOfPage: `https://weexp.agency/blog/${post.slug}`,
    };
    let el = document.getElementById('article-ld') as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.id = 'article-ld';
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(ld);
    document.title = `${post.title} — блог weexp`;
    return () => {
      document.getElementById('article-ld')?.remove();
    };
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="pt-16">
      <Breadcrumbs items={[{ to: '/blog', label: 'Блог' }, { label: post.cat }]} />

      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>
            {post.cat} · {fmtDate(post.date)} · {post.minutes} хв читання
          </Eyebrow>
          <SectionTitle as="h1">{post.title}</SectionTitle>
          <p className="text-[#5A6472] mt-5 max-w-2xl leading-relaxed text-base">{post.desc}</p>
        </FadeIn>
      </Section>

      <Section>
        <article className="max-w-2xl">
          {post.sections.map((s, si) => (
            <FadeIn key={s.h} delay={Math.min(si, 3) * 0.05}>
              <section className={si > 0 ? 'mt-10' : ''}>
                <h2 className="font-extrabold text-xl leading-snug">{s.h}</h2>
                {s.p.filter(Boolean).map((par) => (
                  <p key={par.slice(0, 40)} className="text-[#2F3742] text-[0.95rem] leading-relaxed mt-3.5">
                    {par}
                  </p>
                ))}
                {s.list && (
                  <ul className="flex flex-col gap-2.5 mt-4">
                    {s.list.map((li) => (
                      <li key={li.slice(0, 40)} className="text-[0.95rem] text-[#2F3742] leading-relaxed flex gap-2.5">
                        <span className="shrink-0 mt-0.5" style={{ color: post.color }}>—</span>
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </FadeIn>
          ))}

          <FadeIn delay={0.1}>
            <div className="card accent-left p-6 mt-12" style={{ '--accent': 'var(--lime)' } as React.CSSProperties}>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#4D7C0F] mb-3">
                Головне зі статті
              </p>
              <ul className="flex flex-col gap-2.5">
                {post.takeaways.map((t) => (
                  <li key={t.slice(0, 40)} className="text-sm text-[#2F3742] leading-relaxed flex gap-2.5">
                    <span className="text-[#4D7C0F] shrink-0">✓</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </article>
      </Section>

      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>Читати далі</Eyebrow>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {related.map((p) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className="card card-hover accent-top p-6 h-full flex flex-col group"
                style={{ '--accent': p.color } as React.CSSProperties}
              >
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em]" style={{ color: p.color }}>
                  {p.cat}
                </span>
                <p className="font-bold text-[0.95rem] mt-2 leading-snug flex-1">{p.title}</p>
                <span className="font-mono text-[0.66rem] uppercase tracking-wider mt-4 text-black/60 group-hover:text-[#4D7C0F] transition-colors">
                  Читати →
                </span>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5 mt-8">
            <Chip>e-commerce</Chip>
            <Chip>{post.cat}</Chip>
            <Chip>Commerce OS</Chip>
          </div>
        </FadeIn>
      </Section>

      <PageCta />
    </div>
  );
}
