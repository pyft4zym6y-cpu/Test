import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle, CountUp } from './ui';

const STEPS = [
  { period: 'Тиждень 1', name: 'Baseline & доступи', text: 'Фіксуємо факт: аналітика, CRM, кабінети. Межа факт/допущення.', color: '#65A30D' },
  { period: 'Тижд. 2–3', name: 'Discovery + Audit', text: 'Health Score, зрілість, розрив→₴, роутинг у плейбуки.', color: '#0F9488' },
  { period: 'Тижд. 4–6', name: 'Roadmap', text: '3 хвилі, бюджет-вилки, сценарії, карта залежностей.', color: '#B45309' },
  { period: 'Міс. 2–3', name: 'Wave 1 · швидкі перемоги', text: 'Найшвидші розриви закриваються першими й фінансують наступні хвилі.', color: '#EA580C' },
  { period: 'Міс. 3–9', name: 'Wave 2 · бар’єр', text: 'Найдовший актив: SEO, EC-інфраструктура, бренд.', color: '#6D28D9' },
  { period: 'Міс. 1–12', name: 'Governance', text: 'RACI, KPI, транші під DoD, дисципліна капіталу.', color: '#65A30D' },
];

const PODS = [
  { name: 'Web / Dev', text: 'Frontend · Backend · DevOps · QA', color: '#0F9488' },
  { name: 'SEO / Content', text: 'Технічний SEO · семантика · контент', color: '#65A30D' },
  { name: 'CRM / Retention', text: 'Klaviyo · Zoho · сегментація', color: '#6D28D9' },
  { name: 'Marketplace', text: 'Amazon · Allegro · листинги', color: '#B45309' },
  { name: 'Design / UX', text: 'CJM · макети · бренд', color: '#DB2777' },
  { name: 'Analytics / BI', text: 'GA4 · дашборди · атрибуція', color: '#EA580C' },
  { name: 'Legal / Fin', text: 'VAT ЄС · юніт-економіка', color: '#0284C7' },
  { name: 'PM', text: 'спринти · DoD · синхрон', color: '#65A30D' },
];

export default function Process() {
  return (
    <>
      {/* ---- Процес ---- */}
      <Section id="process" className="grid-bg">
        <FadeIn>
          <Eyebrow>Процес · Discovery → Audit → Roadmap → Implementation → Governance</Eyebrow>
          <SectionTitle as="h1">Як виглядає робота по тижнях</SectionTitle>
        </FadeIn>

        <div className="mt-12 relative">
          {/* timeline bar */}
          <div
            className="hidden lg:block absolute top-[7px] left-0 right-0 h-[3px] rounded-full"
            style={{
              background:
                'linear-gradient(90deg, #65A30D, #0F9488, #B45309, #EA580C, #6D28D9, #65A30D)',
            }}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-x-5 gap-y-10">
            {STEPS.map((s, i) => (
              <FadeIn key={s.name} delay={i * 0.08}>
                <div>
                  <span
                    className="block w-4 h-4 rounded-full mb-4 node-pulse"
                    style={{ background: s.color, animationDelay: `${i * 0.3}s` }}
                  />
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] mb-1.5" style={{ color: s.color }}>
                    {s.period}
                  </p>
                  <p className="font-extrabold text-base leading-snug">{s.name}</p>
                  <p className="text-[#5A6472] text-xs mt-2 leading-relaxed">{s.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        <FadeIn delay={0.3}>
          <div className="card p-6 md:p-7 mt-12">
            <p className="text-[#3F4854] text-sm leading-relaxed">
              Кожен етап має підрядника, DoD (вимірюваний критерій закриття) і бюджет траншами.
              Наступний етап не стартує, поки не виконана передумова — це захищає ваш бюджет.
            </p>
          </div>
        </FadeIn>
      </Section>

      {/* ---- Команда ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>Команда · Хто робить роботу</Eyebrow>
          <SectionTitle>
            Не одна людина. <span className="lime-text">Керована мережа pod-ів.</span>
          </SectionTitle>
        </FadeIn>

        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-8 mt-10 items-start">
          <FadeIn delay={0.1}>
            <div className="card accent-top p-7" style={{ '--accent': 'var(--lime)' } as React.CSSProperties}>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#4D7C0F] mb-3">
                Ядро
              </p>
              <p className="font-extrabold text-2xl">Павло Сидоренко</p>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#4D7C0F] mt-1.5">
                Founder &amp; Chief Architect · власник weexp
              </p>
              <p className="text-[#3F4854] text-sm mt-3 leading-relaxed">
                Стратегічні ініціативи та архітектура кожного мандата — особисто. Ставить цілі
                pod-ам, веде переговори рівня власників і відповідає за P&amp;L результату. Система
                працює як оркестр, тому що за пультом — той, хто її спроєктував.
              </p>
              <hr className="border-[#E4E7EA] my-5" />
              <div className="flex gap-10">
                <div>
                  <p className="font-mono font-bold text-3xl text-[#0F9488]">
                    ~<CountUp to={40} />
                  </p>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#5A6472] mt-1">
                    Фахівців у флагмані
                  </p>
                </div>
                <div>
                  <p className="font-mono font-bold text-3xl text-[#B45309]">
                    <CountUp to={6} />
                  </p>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#5A6472] mt-1">
                    Підрядних команд
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {PODS.map((p, i) => (
              <FadeIn key={p.name} delay={0.1 + i * 0.05}>
                <div className="card card-hover accent-top px-4 py-4 h-full" style={{ '--accent': p.color } as React.CSSProperties}>
                  <p className="font-bold text-sm">{p.name}</p>
                  <p className="text-[#5A6472] text-[0.68rem] mt-1.5 leading-relaxed">{p.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
        <FadeIn delay={0.3}>
          <p className="text-[#5A6472] text-xs mt-6 leading-relaxed max-w-3xl">
            Кожен pod і кожна роль мають власний OKR і тижневий цикл звітності. Головна
            управлінська задача — не кількість людей, а синхронізація за таймлайном, бюджетом і
            залежностями.
          </p>
        </FadeIn>
      </Section>
    </>
  );
}
