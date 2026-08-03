import { motion } from 'framer-motion';
import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle, Bar, Stat } from './ui';

const CASE1_POINT_A = [
  { k: 'Оборот', v: '~€48K/рік · майже все офлайн' },
  { k: 'Конверсія сайту', v: '0,8% · застарілий, без SEO' },
  { k: 'Маркетплейси', v: '0% присутності' },
  { k: 'Email / retention', v: '0 · немає CRM' },
  { k: 'Аналітика', v: '0 · рішення наосліп' },
  { k: 'E-com відділ', v: 'відсутній · жодної ролі' },
];

const CASE1_LAYERS = [
  { n: '01', name: 'Ребрендинг', text: 'Позиціонування, Brand Book, тригери довіри (OEKO-TEX®)', color: '#DB2777' },
  { n: '02', name: 'E-com UA + EU', text: '2 вітрини, SEO-first, mobile-first, hreflang 4 мови', color: '#65A30D' },
  { n: '03', name: 'Маркетплейси', text: 'Amazon DE (Brand Registry) + Allegro + Rozetka, middleware', color: '#B45309' },
  { n: '04', name: 'CRM + Retention', text: 'Zoho + Klaviyo, 8+ автоматизацій, RFM-сегментація', color: '#6D28D9' },
  { n: '05', name: 'B2B / HoReCa', text: 'Окремий контур, воронка, 78% повторних, комерц-політика', color: '#0F9488' },
  { n: '06', name: 'LinkedIn', text: 'B2B-аутрич + контент + employer branding', color: '#0284C7' },
  { n: '07', name: 'ERP Odoo · Автоматизація', text: 'Єдина система: склад, замовлення, фінанси, синхронізація каналів — операційний хребет усіх пластів. +40% ефективність', color: '#EA580C' },
];

const CASE1_RESULTS = [
  { name: 'Оборот/рік', from: '€48K', to: '€900K', pct: 100 },
  { name: 'Конверсія', from: '0,8%', to: '4,2%', pct: 84 },
  { name: 'ROAS', from: '2,1×', to: '4,8×', pct: 74 },
  { name: 'Repeat B2C', from: '12%', to: '28%', pct: 56 },
  { name: 'Органіка', from: '5%', to: '45%', pct: 90 },
  { name: 'Email частка', from: '0', to: '18%', pct: 46 },
];

const CASE1_FACTORS = [
  { name: 'Платформа + SEO', pct: 28, color: '#65A30D' },
  { name: 'Маркетплейси', pct: 28, color: '#0F9488' },
  { name: 'Ребрендинг', pct: 13, color: '#6D28D9' },
  { name: 'Retention', pct: 13, color: '#B45309' },
  { name: 'B2B + LinkedIn', pct: 13, color: '#EA580C' },
  { name: 'Продукт', pct: 5, color: '#16A34A' },
];

const CASE1_MISTAKES = [
  { title: 'Amazon Brand Registry пізно', fix: 'Верифікація — за 3 міс до старту, не паралельно.' },
  { title: 'Ручна синхронізація залишків', fix: 'Overselling → перехід на єдине джерело правди (Base.com).' },
  { title: 'Недооцінка returns ЄС', fix: 'Заклали фактичну вартість повернень у ціноутворення.' },
];

export function GrowthChart() {
  // €48K → €900K, 18 months, s-curve
  const path = 'M 10 150 C 90 145, 130 120, 190 80 S 300 20, 380 12';
  const area = `${path} L 380 160 L 10 160 Z`;
  return (
    <div className="card p-6">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#5A6472] mb-4">
        Оборот · 18 місяців (annualized run-rate)
      </p>
      <svg viewBox="0 0 400 170" className="w-full">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(101,163,13,0.28)" />
            <stop offset="100%" stopColor="rgba(101,163,13,0)" />
          </linearGradient>
        </defs>
        {[40, 80, 120].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(10,14,18,0.08)" strokeWidth="1" />
        ))}
        <motion.path
          d={area}
          fill="url(#chart-fill)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.9 }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke="#65A30D"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
        />
        <motion.circle
          cx="380"
          cy="12"
          r="5"
          fill="#65A30D"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.7, type: 'spring', stiffness: 300 }}
          style={{ transformOrigin: '380px 12px' }}
        />
        <text x="12" y="145" className="font-mono" fill="#5A6472" fontSize="11">
          €48K
        </text>
        <text x="330" y="34" className="font-mono" fill="#65A30D" fontSize="12" fontWeight="bold">
          €900K
        </text>
      </svg>
    </div>
  );
}

export function Case01Detail() {
  return (
    <>
      {/* ================= CASE 01 ================= */}
      <Section id="cases" className="grid-bg">
        <div className="glow-lime w-[420px] h-[420px] top-10 -right-40" />
        <FadeIn>
          <Eyebrow>
            Кейс 01 · Преміум-текстиль · UA→EU · <span className="text-[#4D7C0F]">Флагман</span>
          </Eyebrow>
          <SectionTitle as="h1">
            Якісний продукт,
            <br />
            замкнений в аналоговій моделі
          </SectionTitle>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-6 mt-10 items-start">
          <FadeIn delay={0.1}>
            <div className="card p-6">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#DC2626] mb-4">
                Точка А
              </p>
              <div className="flex flex-col">
                {CASE1_POINT_A.map((r, i) => (
                  <div
                    key={r.k}
                    className={`flex justify-between gap-4 py-2.5 ${i > 0 ? 'border-t border-[#ECEEF0]' : ''}`}
                  >
                    <span className="font-bold text-sm">{r.k}</span>
                    <span className="font-mono text-[0.68rem] text-[#DC2626] text-right">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="card accent-left p-6" style={{ '--accent': 'var(--orange)' } as React.CSSProperties}>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#EA580C] mb-3">
                Виклик
              </p>
              <p className="text-[#3F4854] text-sm leading-relaxed">
                Не «покращити онлайн-продажі», а{' '}
                <strong className="text-[#141820]">
                  оцифрувати й інтернаціоналізувати бізнес з нуля
                </strong>{' '}
                — побудувати інфраструктуру, якої не існувало як класу.
              </p>
            </div>
            <p className="font-serif-it text-lg text-[#3F4854] leading-relaxed mt-6 px-1">
              «Проблема структурна: не в продукті й не в маркетингу, а у відсутності
              інфраструктури, яка дає якісному продукту знайти покупця».
            </p>
          </FadeIn>
        </div>

        {/* Solution: 6 layers */}
        <FadeIn delay={0.15}>
          <h3 className="font-extrabold text-2xl md:text-3xl mt-16 mb-8">
            Сім пластів — <span className="lime-text">у синхроні, не по черзі</span>
          </h3>
        </FadeIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CASE1_LAYERS.map((l, i) => (
            <FadeIn key={l.n} delay={i * 0.06}>
              <div className="card card-hover accent-left p-5 h-full" style={{ '--accent': l.color } as React.CSSProperties}>
                <p className="font-bold">
                  <span className="font-mono text-[0.68rem] mr-2" style={{ color: l.color }}>
                    {l.n}
                  </span>
                  {l.name}
                </p>
                <p className="text-[#5A6472] text-xs mt-2 leading-relaxed">{l.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            <Stat countTo={18} label="Місяців · ~40 фахівців" color="var(--lime)" />
            <Stat value="~$80K" label="CAPEX в активи" color="var(--yellow)" />
            <Stat value="3.8×" label="ROI рік 1" color="var(--purple)" />
            <Stat value="2 тижні" label="На подолання касової кризи" color="var(--orange)" />
          </div>
        </FadeIn>

        {/* Results */}
        <FadeIn delay={0.1}>
          <h3 className="font-extrabold text-2xl md:text-3xl mt-16 mb-8">
            Точка А → Точка Б · <span className="text-[#5A6472]">факт (CRM · ERP · GA4)</span>
          </h3>
        </FadeIn>
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <FadeIn delay={0.15}>
            <GrowthChart />
            <div className="card p-5 mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
              <div>
                <p className="font-mono font-bold text-3xl lime-text">Топ-1%</p>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#5A6472] mt-1">
                  CR сегмента (норма 0,7–1,5%)
                </p>
              </div>
              <p className="text-[#5A6472] text-xs leading-relaxed flex-1 min-w-[200px]">
                Бенчмарки: Klaviyo, Shopify Plus, Triple Whale (2024–2025). B2B / HoReCa: Repeat
                Rate 78%, середній чек ×5.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.25}>
            <div className="card p-6">
              <div className="flex flex-col gap-4">
                {CASE1_RESULTS.map((r, i) => (
                  <div key={r.name}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="font-bold text-sm">{r.name}</span>
                      <span className="font-mono text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <span className="text-[#5A6472]">{r.from}</span>
                        <span className="text-[#5A6472]"> → </span>
                        <span className="text-[#4D7C0F] font-bold">{r.to}</span>
                      </span>
                    </div>
                    <Bar percent={r.pct} delay={i * 0.08} height={7} />
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Attribution + mistakes + ROI */}
        <div className="grid lg:grid-cols-3 gap-6 mt-10 items-start">
          <FadeIn delay={0.1}>
            <div className="card p-6 h-full">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#4D7C0F] mb-5">
                Вклад факторів (експертна оцінка)
              </p>
              <div className="flex flex-col gap-3.5">
                {CASE1_FACTORS.map((f, i) => (
                  <div key={f.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#2F3742]">{f.name}</span>
                      <span className="font-mono" style={{ color: f.color }}>
                        ~{f.pct}%
                      </span>
                    </div>
                    <Bar
                      percent={(f.pct / 28) * 100}
                      gradient={`linear-gradient(90deg, ${f.color}, ${f.color}88)`}
                      height={6}
                      delay={i * 0.06}
                    />
                  </div>
                ))}
              </div>
              <p className="text-[#5A6472] text-[0.64rem] mt-4 leading-relaxed">
                Оцінка на основі когорт і атрибуції; сума — потенціал, важелі перетинаються.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="card p-6 h-full">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#EA580C] mb-5">
                Помилки та уроки
              </p>
              <div className="flex flex-col gap-4">
                {CASE1_MISTAKES.map((m) => (
                  <div key={m.title}>
                    <p className="font-bold text-sm text-[#EA580C]">✗ {m.title}</p>
                    <p className="text-[#5A6472] text-xs mt-1 leading-relaxed">→ {m.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <div className="flex flex-col gap-5">
            <FadeIn delay={0.3}>
              <div className="card p-6 text-center">
                <p className="font-mono font-bold text-5xl lime-text">3.8×</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#5A6472] mt-2">
                  ROI за рік 1 · €288K / €75K
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.4}>
              <div className="card accent-left p-6" style={{ '--accent': 'var(--orange)' } as React.CSSProperties}>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#EA580C] mb-2.5">
                  Касова криза · лист-2024
                </p>
                <p className="text-[#3F4854] text-xs leading-relaxed">
                  Подолана за 2 тижні. Впроваджено 13-тижневий cash-flow + буфер. Зрілість — це
                  швидкість системного виправлення.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
        <FadeIn delay={0.2}>
          <p className="font-serif-it text-[#5A6472] mt-8">
            Кейс — не історія одного геніального рішення, а системна побудова шести пластів, кожен
            із яких підсилював решту.
          </p>
        </FadeIn>
      </Section>
    </>
  );
}

