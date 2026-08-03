import { Link, Navigate, useParams } from 'react-router-dom';
import FadeIn from '../components/FadeIn';
import { Eyebrow, Section, SectionTitle, Stat, Chip } from '../components/ui';
import { Case01Detail } from '../components/Cases';
import { RayCase, PageCta } from '../components/NewSections';
import { CASE_COVERS } from './CasesPage';

function UgearsDetail() {
  return (
    <Section className="grid-bg">
      <FadeIn>
        <Eyebrow>Кейс · Consumer DTC · Споживчі товари</Eyebrow>
        <SectionTitle as="h1">
          Міжнародний DTC + Amazon
          <br />
          для бренду <span className="lime-text">з Forbes TOP-250 UA</span>
        </SectionTitle>
        <p className="text-[#5A6472] mt-5 max-w-2xl leading-relaxed">
          Засновник weexp керував e-commerce напрямом (8 фахівців) міжнародного виробника споживчих товарів — мультиканальна й мультигеографічна модель:
          власний магазин + маркетплейси, ринки США · DE · FR · ES · IT · UK. Лютий 2023 — квітень
          2025.
        </p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="card accent-left p-6 mt-10 max-w-2xl" style={{ '--accent': 'var(--red)' } as React.CSSProperties}>
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#DC2626] mb-2.5">
            Точка А · старт-аудит
          </p>
          <p className="font-mono text-sm text-[#2F3742]">
            конверсія 0,64% · повторні 14,7% · CAC $40–50
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          <Stat value="+65%" label="До продажів · 9 міс (глоб. магазин)" color="var(--lime)" />
          <Stat value="+40%" label="Ефективність · впровадження ERP" color="var(--cyan)" />
          <Stat value="60%" label="Повторні замовлення · з 14,7%" color="var(--purple)" />
          <Stat countTo={6} label="Нових ринків ЄС + США" color="var(--yellow)" />
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="card p-7 mt-8">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#B45309] mb-4">
            Що зроблено
          </p>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm text-[#2F3742]">
            <li>· Запуск міжнародних продажів на Amazon (EU + US)</li>
            <li>· Глобальний інтернет-магазин · SEO-first</li>
            <li>· ERP і наскрізна звітність (CRM + BI)</li>
            <li>· Retention-стратегія: 14,7% → 60% повторних</li>
            <li>· Масштабування SKU й управління P&amp;L</li>
            <li>· Синхронізація каналів без overselling</li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-2.5 mt-6">
          {['DTC + Marketplace', 'Amazon EU', 'ERP', 'P&L', 'Retention'].map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      </FadeIn>
    </Section>
  );
}

function ImperiaDetail() {
  return (
    <Section className="grid-bg">
      <FadeIn>
        <Eyebrow>Кейс · FMCG-дистрибуція · Beauty</Eyebrow>
        <SectionTitle>
          E-com трансформація
          <br />
          національного <span className="lime-text">FMCG-дистриб&rsquo;ютора</span>
        </SectionTitle>
        <p className="text-[#5A6472] mt-5 max-w-2xl leading-relaxed">
          Запуск web-інфраструктури, управління маркетплейсами (17K SKU), дропшипінг, вихід на
          міжнародні ринки, просування ключових і запуск нових брендів. Власний beauty-бренд: UA · PL · NL · CY.
        </p>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
          <Stat value="17 000" label="SKU на маркетплейсах" color="var(--pink)" />
          <Stat value="+40%" label="Зростання продажів" color="var(--lime)" />
          <Stat value="+25%" label="Опер. ефективність · CRM" color="var(--purple)" />
          <Stat value="12–17" label="Фахівців у керуванні" color="var(--cyan)" />
        </div>
      </FadeIn>

      <FadeIn delay={0.25}>
        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <div className="card p-6">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#B45309] mb-2.5">
              Виробники
            </p>
            <p className="text-[#5A6472] text-sm leading-relaxed">
              Henkel · SC Johnson · Kimberly-Clark · Schwarzkopf · J&amp;J · Missha · NYX
            </p>
          </div>
          <div className="card p-6">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#0F9488] mb-2.5">
              Клієнти
            </p>
            <p className="text-[#5A6472] text-sm leading-relaxed">
              Watsons · MAKEUP · Rozetka · Pampik · Kasta · Lamoda
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.35}>
        <div className="card p-7 mt-5">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#65A30D] mb-4">
            Що зроблено
          </p>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm text-[#2F3742]">
            <li>· Web-інфраструктура дистриб&rsquo;ютора з нуля</li>
            <li>· Управління 17K SKU на маркетплейсах</li>
            <li>· Дропшипінг-модель для роздрібних партнерів</li>
            <li>· CRM: +25% операційної ефективності</li>
            <li>· Запуск і просування власного beauty-бренду</li>
            <li>· Вихід на ринки PL · NL · CY</li>
          </ul>
        </div>
      </FadeIn>
    </Section>
  );
}

const DETAILS: Record<string, () => JSX.Element> = {
  'premium-textile': Case01Detail,
  'fashion-apparel': RayCase,
  'consumer-dtc': UgearsDetail,
  'fmcg-distribution': ImperiaDetail,
};

export default function CaseDetailPage() {
  const { slug } = useParams();
  if (!slug || !DETAILS[slug]) return <Navigate to="/cases" replace />;

  const Detail = DETAILS[slug];
  const idx = CASE_COVERS.findIndex((c) => c.slug === slug);
  const next = CASE_COVERS[(idx + 1) % CASE_COVERS.length];

  return (
    <div className="pt-16">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12 pt-8 -mb-12">
        <Link
          to="/cases"
          className="font-mono text-xs uppercase tracking-wider text-[#5A6472] hover:text-[#65A30D] transition-colors"
        >
          ← Всі кейси
        </Link>
      </div>

      <Detail />

      <Section>
        <FadeIn>
          <Link
            to={`/cases/${next.slug}`}
            className="card card-hover accent-top p-7 flex flex-wrap items-center justify-between gap-5 group"
            style={{ '--accent': next.color } as React.CSSProperties}
          >
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#5A6472] mb-1.5">
                Наступний кейс
              </p>
              <p className="font-extrabold text-2xl">
                {next.title}{' '}
                <span className="font-mono text-lg ml-2" style={{ color: next.color }}>
                  {next.num}
                </span>
              </p>
            </div>
            <span className="font-mono text-sm uppercase tracking-wider text-black/60 group-hover:text-[#65A30D] transition-colors">
              Читати →
            </span>
          </Link>
        </FadeIn>
      </Section>

      <PageCta label="Ваш кейс може бути наступним" />
    </div>
  );
}
