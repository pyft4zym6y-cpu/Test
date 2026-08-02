import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle, Bar } from './ui';

const CHAIN = [
  { label: 'Інвестиція', value: '$80K', sub: 'CAPEX в активи', color: '#3DDAD0' },
  { label: 'Маржа', value: '€288K/рік', sub: '32% CM', color: '#A3E635' },
  { label: 'Payback', value: '< 4 міс', sub: 'на рівні маржі', color: '#F5B84B' },
  { label: 'ROI рік 1', value: '3.8×', sub: '€288K / €75K', color: '#FF6A3D' },
  { label: 'Далі', value: 'актив', sub: 'генерує сам', color: '#8B7CF6' },
];

const CAPEX = [
  { name: 'Веб-розробка', value: '$20K', pct: 100 },
  { name: 'Команда / опер.', value: '$18K', pct: 90 },
  { name: 'B2B / інше', value: '$9K', pct: 45 },
  { name: 'Rich-контент', value: '$8K', pct: 40 },
  { name: 'EC-інфраструктура', value: '$8K', pct: 40 },
  { name: 'Ребрендинг / UX', value: '$6K', pct: 30 },
  { name: 'SaaS-стек', value: '$6K', pct: 30 },
  { name: 'SEO', value: '$5K', pct: 25 },
];

const RISKS = [
  { ifPart: 'Немає бюджету на все', then: 'Старт із Diagnostic Sprint. Швидкі перемоги за 30–60 днів фінансують наступні хвилі.', color: '#A3E635' },
  { ifPart: 'Немає команди', then: 'Будую e-com відділ під ключ + підрядники: ролі, OKR, регламенти — як у флагман-кейсі.', color: '#3DDAD0' },
  { ifPart: 'Немає ERP', then: 'Дуальна архітектура, поетапне впровадження Odoo (PB-18) — без зупинки продажів.', color: '#8B7CF6' },
  { ifPart: 'Немає Shopify / власна CMS', then: 'Платформо-незалежний підхід: аудит платформи (PB-14), міграція лише за реальної потреби.', color: '#F5B84B' },
  { ifPart: 'Виробництво не готове', then: 'Маркетплейси як швидкий вхід у ринок, паралельно готуємо DTC і бренд.', color: '#FF6A3D' },
  { ifPart: 'Немає аналітики', then: 'Перебудова трекінгу (PB-10) — перший крок. Baseline фіксується у тиждень 1.', color: '#A3E635' },
];

const PRINCIPLES = [
  { name: 'Гроші, а не проценти', text: 'Кожен розрив і ціль перекладаються в ₴.', color: '#A3E635' },
  { name: 'Факт / допущення', text: 'Межа проводиться явно й рано. Документ невразливий для розбору.', color: '#3DDAD0' },
  { name: 'DoD у всього', text: 'Кожен етап закривається вимірюваним критерієм.', color: '#F5B84B' },
  { name: 'Дисципліна капіталу', text: '6 тижнів тесту, поріг ROAS. Не досяг — канал закривається.', color: '#FF6A3D' },
  { name: 'Вартість бездіяльності', text: 'Ціна зволікання рахується чесно, через математику.', color: '#8B7CF6' },
  { name: 'Архітектура необхідності', text: 'Черговість продиктована залежностями, не нав’язана.', color: '#A3E635' },
];

export default function Economics() {
  return (
    <>
      {/* ---- Економіка ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>Економіка проєкту · CAPEX → Payback → ROI → Cash Flow</Eyebrow>
          <SectionTitle>Інвестиція в активи, а не витрата</SectionTitle>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div className="flex flex-wrap items-center gap-y-4 gap-x-2 mt-10">
            {CHAIN.map((c, i) => (
              <div key={c.label} className="flex items-center gap-2">
                <div className="card accent-top px-5 py-3.5 text-center" style={{ '--accent': c.color } as React.CSSProperties}>
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[#8C96A5]">
                    {c.label}
                  </p>
                  <p className="font-mono font-bold text-xl mt-1" style={{ color: c.color }}>
                    {c.value}
                  </p>
                  <p className="font-mono text-[0.55rem] text-[#66707E] mt-0.5">{c.sub}</p>
                </div>
                {i < CHAIN.length - 1 && <span className="text-[#66707E] font-mono">→</span>}
              </div>
            ))}
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-6 mt-10 items-start">
          <FadeIn delay={0.2}>
            <div className="card p-7">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#A3E635] mb-6">
                Структура CAPEX · Флагман ~$80K
              </p>
              <div className="flex flex-col gap-4">
                {CAPEX.map((c, i) => (
                  <div key={c.name}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm text-[#C7CFDA]">{c.name}</span>
                      <span className="font-mono text-sm text-[#A3E635]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {c.value}
                      </span>
                    </div>
                    <Bar percent={c.pct} delay={i * 0.06} height={7} />
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <div className="flex flex-col gap-6">
            <FadeIn delay={0.25}>
              <div className="card accent-left p-7" style={{ '--accent': 'var(--orange)' } as React.CSSProperties}>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#FF6A3D] mb-3">
                  Cash-flow дисципліна
                </p>
                <p className="text-[#B7C0CC] text-sm leading-relaxed">
                  Головний ризик швидкого масштабу — не падіння продажів, а касовий розрив. Тому:{' '}
                  <strong className="text-[#E9EDF2]">13-тижневий cash-flow прогноз</strong> + буфер
                  ліквідності. Це перший документ при оцінці будь-якого нового каналу чи контракту.
                </p>
                <hr className="border-[#232933] my-4" />
                <p className="text-[#66707E] text-xs leading-relaxed">
                  Не входить у CAPEX: медіабюджет, товар, ФОП команди — рахуються окремо й прозоро.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.35}>
              <div className="card p-7">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#F5B84B] mb-4">
                  Масштаб: інвестиція vs створена вартість
                </p>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span className="text-[#8C96A5]">Інвестиція</span>
                      <span className="text-[#3DDAD0]">$80K</span>
                    </div>
                    <Bar percent={22} gradient="linear-gradient(90deg,#3DDAD0,#38BDF8)" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span className="text-[#8C96A5]">Створена вартість</span>
                      <span className="text-[#A3E635]">€288K+/рік · актив</span>
                    </div>
                    <Bar percent={100} delay={0.15} />
                  </div>
                </div>
                <p className="text-[#66707E] text-xs mt-5 leading-relaxed">
                  <span className="text-[#F5B84B] font-mono uppercase text-[0.62rem] tracking-[0.14em]">Початок · </span>
                  Аудит від $2K виявляє мільйони упущеного обороту (приклад: ≈16,6 млн ₴) —
                  інвестиція окуповується ще до старту робіт. Цифри флагман-кейсу; для вашого
                  бізнесу рахуються при фіксації baseline.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </Section>

      {/* ---- Ризики IF/THEN ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>Ризики · «Що якщо…» — і чому це не зупинка</Eyebrow>
          <SectionTitle>Жоден стартовий стан не є перешкодою</SectionTitle>
        </FadeIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {RISKS.map((r, i) => (
            <FadeIn key={r.ifPart} delay={i * 0.07}>
              <div className="card card-hover accent-left p-6 h-full" style={{ '--accent': r.color } as React.CSSProperties}>
                <p className="font-bold">
                  <span className="font-mono text-[0.68rem] mr-2" style={{ color: r.color }}>
                    IF
                  </span>
                  {r.ifPart}
                </p>
                <p className="text-[#8C96A5] text-sm mt-2.5 leading-relaxed">
                  <span className="font-mono text-[0.62rem] text-[#66707E] mr-2">→ THEN</span>
                  {r.then}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ---- Принципи ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>Принципи · ДНК подачі</Eyebrow>
          <SectionTitle>Чесність як зброя</SectionTitle>
          <p className="text-[#8C96A5] mt-4 max-w-3xl">
            Маніпулятивна пропозиція розвалюється на першій перевірці у фінансиста й коштує
            репутації дорожче однієї угоди.
          </p>
        </FadeIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {PRINCIPLES.map((p, i) => (
            <FadeIn key={p.name} delay={i * 0.06}>
              <div className="card card-hover accent-left p-6 h-full" style={{ '--accent': p.color } as React.CSSProperties}>
                <p className="font-extrabold">{p.name}</p>
                <p className="text-[#8C96A5] text-sm mt-2 leading-relaxed">{p.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>
    </>
  );
}
