import { motion } from 'framer-motion';
import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle, Bar, Chip, Stat } from './ui';

const CASE1_POINT_A = [
  { k: 'Оборот', v: '~€48K/рік · майже все офлайн' },
  { k: 'Конверсія сайту', v: '0,8% · застарілий, без SEO' },
  { k: 'Маркетплейси', v: '0% присутності' },
  { k: 'Email / retention', v: '0 · немає CRM' },
  { k: 'Аналітика', v: '0 · рішення наосліп' },
  { k: 'E-com відділ', v: 'відсутній · жодної ролі' },
];

const CASE1_LAYERS = [
  { n: '01', name: 'Ребрендинг', text: 'Позиціонування, Brand Book, тригери довіри (OEKO-TEX®)', color: '#F471B5' },
  { n: '02', name: 'E-com UA + EU', text: '2 вітрини, SEO-first, mobile-first, hreflang 4 мови', color: '#A3E635' },
  { n: '03', name: 'Маркетплейси', text: 'Amazon DE (Brand Registry) + Allegro + Rozetka, middleware', color: '#F5B84B' },
  { n: '04', name: 'CRM + Retention', text: 'Zoho + Klaviyo, 8+ автоматизацій, RFM-сегментація', color: '#8B7CF6' },
  { n: '05', name: 'B2B / HoReCa', text: 'Окремий контур, воронка, 78% повторних, комерц-політика', color: '#3DDAD0' },
  { n: '06', name: 'LinkedIn', text: 'B2B-аутрич + контент + employer branding', color: '#38BDF8' },
  { n: '07', name: 'ERP Odoo · Автоматизація', text: 'Єдина система: склад, замовлення, фінанси, синхронізація каналів — операційний хребет усіх пластів. +40% ефективність', color: '#FF6A3D' },
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
  { name: 'Платформа + SEO', pct: 28, color: '#A3E635' },
  { name: 'Маркетплейси', pct: 28, color: '#3DDAD0' },
  { name: 'Ребрендинг', pct: 13, color: '#8B7CF6' },
  { name: 'Retention', pct: 13, color: '#F5B84B' },
  { name: 'B2B + LinkedIn', pct: 13, color: '#FF6A3D' },
  { name: 'Продукт', pct: 5, color: '#4ADE80' },
];

const CASE1_MISTAKES = [
  { title: 'Amazon Brand Registry пізно', fix: 'Верифікація — за 3 міс до старту, не паралельно.' },
  { title: 'Ручна синхронізація залишків', fix: 'Overselling → перехід на єдине джерело правди (Base.com).' },
  { title: 'Недооцінка returns ЄС', fix: 'Заклали фактичну вартість повернень у ціноутворення.' },
];

function GrowthChart() {
  // €48K → €900K, 18 months, s-curve
  const path = 'M 10 150 C 90 145, 130 120, 190 80 S 300 20, 380 12';
  const area = `${path} L 380 160 L 10 160 Z`;
  return (
    <div className="card p-6">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#8C96A5] mb-4">
        Оборот · 18 місяців (annualized run-rate)
      </p>
      <svg viewBox="0 0 400 170" className="w-full">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(163,230,53,0.28)" />
            <stop offset="100%" stopColor="rgba(163,230,53,0)" />
          </linearGradient>
        </defs>
        {[40, 80, 120].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(140,150,165,0.12)" strokeWidth="1" />
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
          stroke="#A3E635"
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
          fill="#A3E635"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.7, type: 'spring', stiffness: 300 }}
          style={{ transformOrigin: '380px 12px' }}
        />
        <text x="12" y="145" className="font-mono" fill="#66707E" fontSize="11">
          €48K
        </text>
        <text x="330" y="34" className="font-mono" fill="#A3E635" fontSize="12" fontWeight="bold">
          €900K
        </text>
      </svg>
    </div>
  );
}

export default function Cases() {
  return (
    <>
      {/* ================= CASE 01 ================= */}
      <Section id="cases" className="grid-bg">
        <div className="glow-lime w-[420px] h-[420px] top-10 -right-40" />
        <FadeIn>
          <Eyebrow>
            Кейс 01 · Premium Textile · UA→EU · <span className="text-[#A3E635]">Флагман</span>
          </Eyebrow>
          <SectionTitle>
            Якісний продукт,
            <br />
            замкнений в аналоговій моделі
          </SectionTitle>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-6 mt-10 items-start">
          <FadeIn delay={0.1}>
            <div className="card p-6">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#FF5F56] mb-4">
                Точка А
              </p>
              <div className="flex flex-col">
                {CASE1_POINT_A.map((r, i) => (
                  <div
                    key={r.k}
                    className={`flex justify-between gap-4 py-2.5 ${i > 0 ? 'border-t border-[#1C2129]' : ''}`}
                  >
                    <span className="font-bold text-sm">{r.k}</span>
                    <span className="font-mono text-[0.68rem] text-[#FF5F56] text-right">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="card accent-left p-6" style={{ '--accent': 'var(--orange)' } as React.CSSProperties}>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#FF6A3D] mb-3">
                Виклик
              </p>
              <p className="text-[#B7C0CC] text-sm leading-relaxed">
                Не «покращити онлайн-продажі», а{' '}
                <strong className="text-[#E9EDF2]">
                  оцифрувати й інтернаціоналізувати бізнес з нуля
                </strong>{' '}
                — побудувати інфраструктуру, якої не існувало як класу.
              </p>
            </div>
            <p className="font-serif-it text-lg text-[#B7C0CC] leading-relaxed mt-6 px-1">
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
                <p className="text-[#8C96A5] text-xs mt-2 leading-relaxed">{l.text}</p>
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
            Точка А → Точка Б · <span className="text-[#8C96A5]">факт (CRM · ERP · GA4)</span>
          </h3>
        </FadeIn>
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <FadeIn delay={0.15}>
            <GrowthChart />
            <div className="card p-5 mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
              <div>
                <p className="font-mono font-bold text-3xl lime-text">Топ-1%</p>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#8C96A5] mt-1">
                  CR сегмента (норма 0,7–1,5%)
                </p>
              </div>
              <p className="text-[#66707E] text-xs leading-relaxed flex-1 min-w-[200px]">
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
                        <span className="text-[#66707E]">{r.from}</span>
                        <span className="text-[#8C96A5]"> → </span>
                        <span className="text-[#A3E635] font-bold">{r.to}</span>
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
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#A3E635] mb-5">
                Вклад факторів (експертна оцінка)
              </p>
              <div className="flex flex-col gap-3.5">
                {CASE1_FACTORS.map((f, i) => (
                  <div key={f.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#C7CFDA]">{f.name}</span>
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
              <p className="text-[#66707E] text-[0.64rem] mt-4 leading-relaxed">
                Оцінка на основі когорт і атрибуції; сума — потенціал, важелі перетинаються.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="card p-6 h-full">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#FF6A3D] mb-5">
                Помилки та уроки
              </p>
              <div className="flex flex-col gap-4">
                {CASE1_MISTAKES.map((m) => (
                  <div key={m.title}>
                    <p className="font-bold text-sm text-[#FF6A3D]">✗ {m.title}</p>
                    <p className="text-[#8C96A5] text-xs mt-1 leading-relaxed">→ {m.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <div className="flex flex-col gap-5">
            <FadeIn delay={0.3}>
              <div className="card p-6 text-center">
                <p className="font-mono font-bold text-5xl lime-text">3.8×</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#8C96A5] mt-2">
                  ROI за рік 1 · €288K / €75K
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.4}>
              <div className="card accent-left p-6" style={{ '--accent': 'var(--orange)' } as React.CSSProperties}>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#FF6A3D] mb-2.5">
                  Касова криза · лист-2024
                </p>
                <p className="text-[#B7C0CC] text-xs leading-relaxed">
                  Подолана за 2 тижні. Впроваджено 13-тижневий cash-flow + буфер. Зрілість — це
                  швидкість системного виправлення.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
        <FadeIn delay={0.2}>
          <p className="font-serif-it text-[#8C96A5] mt-8">
            Кейс — не історія одного геніального рішення, а системна побудова шести пластів, кожен
            із яких підсилював решту.
          </p>
        </FadeIn>
      </Section>

      {/* ================= CASES 02–03 ================= */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          {/* Case 02 */}
          <FadeIn>
            <div className="card card-hover p-8 h-full flex flex-col">
              <Eyebrow>Кейс 02 · Ugears · Head of e-Commerce</Eyebrow>
              <h3 className="font-extrabold text-2xl leading-snug">
                Міжнародний DTC + Amazon для бренду{' '}
                <span className="lime-text">Forbes TOP-250 UA</span>
              </h3>
              <p className="text-[#8C96A5] text-sm mt-4 leading-relaxed">
                Керував e-commerce напрямом (8 фахівців) у мультиканальній і мультигеографічній
                моделі: власний магазин + маркетплейси, ринки США · DE · FR · ES · IT · UK. Лют
                2023 — кві 2025.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {['DTC + Marketplace', 'Amazon EU', 'ERP', 'P&L', 'Retention'].map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <Stat value="+65%" label="До продажів · 9 міс (глоб. магазин)" color="var(--lime)" />
                <Stat value="+40%" label="Ефективність · впровадження ERP" color="var(--cyan)" />
                <Stat value="60%" label="Повторні замовлення (retention)" color="var(--purple)" />
                <Stat countTo={6} label="Нових ринків ЄС + США" color="var(--yellow)" />
              </div>
              <p className="text-[#66707E] text-xs mt-6 leading-relaxed">
                <span className="font-mono uppercase text-[0.6rem] tracking-[0.14em] text-[#F5B84B]">
                  Що зроблено ·{' '}
                </span>
                Запуск міжнародних продажів на Amazon · глобальний інтернет-магазин · ERP і
                наскрізна звітність (CRM+BI) · retention-стратегія · масштабування SKU й управління
                P&amp;L.
              </p>
              <p className="font-mono text-[0.64rem] text-[#66707E] mt-3">
                старт-аудит: конверсія 0,64% · повторні 14,7% → 60% · CAC $40–50
              </p>
            </div>
          </FadeIn>

          {/* Case 03 */}
          <FadeIn delay={0.12}>
            <div className="card card-hover p-8 h-full flex flex-col">
              <Eyebrow>Кейс 03 · Imperia Holding / ISEI · Head of Marketing</Eyebrow>
              <h3 className="font-extrabold text-2xl leading-snug">
                E-com трансформація національного{' '}
                <span className="lime-text">FMCG-дистриб&rsquo;ютора</span>
              </h3>
              <p className="text-[#8C96A5] text-sm mt-4 leading-relaxed">
                Запуск web-інфраструктури, управління маркетплейсами (17K SKU), дропшипінг, вихід
                на міжнародні ринки, просування ключових і запуск нових брендів. Бренд ISEI: UA ·
                PL · NL · CY.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <Stat value="17 000" label="SKU на маркетплейсах" color="var(--pink)" />
                <Stat value="+40%" label="Зростання продажів" color="var(--lime)" />
                <Stat value="+25%" label="Опер. ефективність · CRM" color="var(--purple)" />
                <Stat value="12–17" label="Фахівців у керуванні" color="var(--cyan)" />
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <div>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#F5B84B] mb-1.5">
                    Виробники
                  </p>
                  <p className="text-[#8C96A5] text-xs">
                    Henkel · SC Johnson · Kimberly-Clark · Schwarzkopf · J&amp;J · Missha · NYX
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#3DDAD0] mb-1.5">
                    Клієнти
                  </p>
                  <p className="text-[#8C96A5] text-xs">
                    Watsons · MAKEUP · Rozetka · Pampik · Kasta · Lamoda
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>
    </>
  );
}
