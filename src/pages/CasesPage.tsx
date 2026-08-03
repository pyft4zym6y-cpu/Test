import { Link } from 'react-router-dom';
import FadeIn from '../components/FadeIn';
import { Eyebrow, Section, SectionTitle } from '../components/ui';
import { Industries } from '../components/Market';
import { PageCta } from '../components/NewSections';

export const CASE_COVERS = [
  {
    slug: 'premium-textile',
    num: '×18',
    title: 'Premium Textile',
    cat: 'UA→EU · Флагман · 18 міс',
    text: 'Оборот €48K → €900K: сім пластів у синхроні, топ-1% конверсії сегмента.',
    color: '#A3E635',
  },
  {
    slug: 'ray-ua',
    num: '≥19 млн ₴',
    title: 'RAY.UA',
    cat: 'Program of Record · 2026',
    text: 'Реальний аудит у грошах і програма росту на 12 місяців із траншами під DoD.',
    color: '#F471B5',
  },
  {
    slug: 'ugears',
    num: '+65%',
    title: 'Ugears',
    cat: 'Forbes TOP-250 · Head of e-Commerce',
    text: 'Міжнародний DTC + Amazon: 6 нових ринків, повторні 14,7% → 60%.',
    color: '#3DDAD0',
  },
  {
    slug: 'imperia',
    num: '17K SKU',
    title: 'Imperia / ISEI',
    cat: 'FMCG · Head of Marketing',
    text: 'E-com трансформація національного дистриб’ютора: +40% продажів.',
    color: '#F5B84B',
  },
];

export default function CasesPage() {
  return (
    <div className="pt-16">
      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>Кейси · Не один результат — система</Eyebrow>
          <SectionTitle>
            Кожен кейс —{' '}
            <span className="font-pixel text-[0.8em] text-[#A3E635] inline-block align-baseline leading-none">
              окрема історія
            </span>
          </SectionTitle>
          <p className="text-[#8C96A5] mt-4 max-w-3xl">
            Три завершені кейси і одна діюча програма росту. Цифра на обкладинці — вимірюваний
            факт, усередині — повний розбір: точка А, рішення, помилки, ROI.
          </p>
        </FadeIn>
        <div className="grid sm:grid-cols-2 gap-5 mt-12">
          {CASE_COVERS.map((c, i) => (
            <FadeIn key={c.slug} delay={i * 0.08}>
              <Link
                to={`/cases/${c.slug}`}
                className="card card-hover accent-top p-7 h-full flex flex-col group"
                style={{ '--accent': c.color } as React.CSSProperties}
              >
                <p className="font-mono font-bold text-4xl md:text-5xl" style={{ color: c.color }}>
                  {c.num}
                </p>
                <p className="font-extrabold text-2xl mt-4">{c.title}</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#66707E] mt-1.5">
                  {c.cat}
                </p>
                <p className="text-[#8C96A5] text-sm mt-3 leading-relaxed flex-1">{c.text}</p>
                <p className="font-mono text-xs uppercase tracking-wider mt-6 text-white/60 group-hover:text-[#A3E635] transition-colors">
                  Читати кейс →
                </p>
              </Link>
            </FadeIn>
          ))}
        </div>
      </Section>
      <Industries />
      <PageCta label="Ваш кейс може бути наступним" />
    </div>
  );
}
