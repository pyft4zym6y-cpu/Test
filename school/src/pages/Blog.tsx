import { Link } from 'react-router-dom';
import { POSTS } from '../data/blog';
import { PageHead, Pop, Section } from '../components/comic';

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function Blog() {
  return (
    <>
      <PageHead
        eyebrow="Блог"
        title={
          <>
            Розбори без <span className="redmark">води</span>
          </>
        }
        lead="Практичні статті з методології школи: аналітика, фінанси, SEO, CRM і карʼєра в e-commerce. Кожна — з конкретикою, яку можна застосувати сьогодні."
      />
      <Section className="!pt-8">
        <div className="grid md:grid-cols-2 gap-7">
          {[...POSTS].sort((a, b) => b.date.localeCompare(a.date)).map((post, i) => (
            <Pop key={post.slug} delay={(i % 2) * 0.08}>
              <Link
                to={`/blog/${post.slug}`}
                className={`group flex flex-col h-full comic-border bg-white hard-shadow-sm p-7 transition-transform duration-150 hover:-translate-y-1.5 ${
                  i % 2 === 0 ? '-rotate-[0.4deg]' : 'rotate-[0.4deg]'
                }`}
              >
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-block comic-border bg-sun px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="font-oswald font-bold uppercase text-[22px] leading-[1.1] mb-3">
                  {post.title}
                </h2>
                <p className="text-[14px] leading-relaxed text-ink/70 flex-1">{post.description}</p>
                <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t-[3px] border-ink">
                  <span className="text-[12px] font-extrabold uppercase tracking-wider text-ink/50">
                    {fmtDate(post.date)} · {post.readTime}
                  </span>
                  <span className="font-oswald font-bold uppercase text-[14px] text-brand group-hover:translate-x-1 transition-transform">
                    Читати →
                  </span>
                </div>
              </Link>
            </Pop>
          ))}
        </div>
      </Section>
    </>
  );
}
