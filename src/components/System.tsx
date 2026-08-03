import FadeIn from './FadeIn';
import { say, sayIdle } from './speech';
import { Eyebrow, Section, SectionTitle } from './ui';


const MODULE_SAYS: Record<string, string> = {
  M01: 'M01 Discovery: структурована анкета CDF v2.0 — знімаємо факт бізнесу за тиждень, без здогадок.',
  M02: 'M02 Data & Access Registry: всі доступи й джерела даних в одному реєстрі — без «у кого пароль?».',
  M03: 'M03 Metrics: наскрізний трекінг подій — база для чесних цифр у кожному наступному модулі.',
  M04: 'M04 Gold Standards: 52 еталонні метрики у 3 зонах — лінійка, до якої прикладаємо ваш факт.',
  M05: 'M05 Audit Calculator: кожен розрив перекладаємо у гривні недоотриманого обороту.',
  M06: 'M06 Playbook Library: 56 готових процедур закриття розривів — з кроками, формулами й DoD.',
  M07: 'M07 Roadmap: хвилі робіт у порядку залежностей, а не побажань.',
  M08: 'M08 PM & Delivery: спринти, беклог, підрядники — рушій, що перетворює план на факт.',
  M09: 'M09 Governance: RACI та KPI по ролях — кожен у команді знає свою цифру.',
  M10: 'M10 BI Dashboard: P&L у реальному часі — рішення ухвалюються на даних, не на відчуттях.',
  M11: 'M11 AI Layer: автоматизація і персоналізація наскрізь усіх модулів системи.',
  M12: 'M12 Knowledge Base: плейбуки, промпти, DoD — знання лишаються в компанії, а не в головах.',
};

const MODULE_GROUPS: {
  label: string;
  color: string;
  modules: { id: string; name: string }[];
}[] = [
  {
    label: 'Вхід · Дані',
    color: '#65A30D',
    modules: [
      { id: 'M01', name: 'Discovery (CDF v2.0)' },
      { id: 'M02', name: 'Data & Access Registry' },
      { id: 'M03', name: 'Metrics · трекінг' },
    ],
  },
  {
    label: 'Рушій · Діагностика → Scope',
    color: '#0F9488',
    modules: [
      { id: 'M04', name: 'Gold Standards · 52 метрики' },
      { id: 'M05', name: 'Audit Calculator · розрив→₴' },
      { id: 'M06', name: 'Playbook Library · 56' },
      { id: 'M07', name: 'Roadmap · хвилі' },
    ],
  },
  {
    label: 'Вихід · Виконання та керування',
    color: '#B45309',
    modules: [
      { id: 'M08', name: 'PM & Delivery' },
      { id: 'M09', name: 'Governance · RACI / KPI' },
      { id: 'M10', name: 'BI Dashboard · P&L' },
    ],
  },
  {
    label: 'Наскрізно',
    color: '#6D28D9',
    modules: [
      { id: 'M11', name: 'AI Layer — Use-cases, Readiness, автоматизація' },
      { id: 'M12', name: 'Knowledge Base — плейбуки, промпти, DoD' },
    ],
  },
];

const CHAIN = [
  { name: 'Бренд', sub: 'позиціонування', color: '#DB2777' },
  { name: 'SEO + Платформа', sub: 'фундамент', color: '#65A30D' },
  { name: 'Аналітика', sub: 'єдиний профіль', color: '#0F9488' },
  { name: 'CRM + Retention', sub: 'LTV', color: '#0F9488' },
  { name: 'Маркетплейси', sub: 'канали', color: '#B45309' },
  { name: 'ERP / Операції', sub: 'масштаб', color: '#6D28D9' },
  { name: 'Юніт-економіка', sub: 'маржа', color: '#9333EA' },
  { name: 'BI', sub: 'дашборд', color: '#0284C7' },
  { name: 'P&L / Вартість', sub: 'результат', color: '#65A30D' },
];

const FLYWHEEL_NODES = [
  { name: 'Дані', color: '#65A30D' },
  { name: 'Інфраструктура', color: '#0F9488' },
  { name: 'Конверсія', color: '#B45309' },
  { name: 'Retention · LTV', color: '#6D28D9' },
  { name: 'Реінвестиція', color: '#EA580C' },
  { name: 'Вартість', color: '#65A30D' },
];

function Flywheel() {
  const R = 150;
  const CX = 190;
  const CY = 190;

  return (
    <div className="relative w-[380px] h-[380px] max-w-full mx-auto">
      <svg viewBox="0 0 380 380" className="w-full h-full">
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="rgba(10,14,18,0.25)"
          strokeWidth="1.5"
          strokeDasharray="3 8"
          className="spin-slow"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
        <circle cx={CX} cy={CY} r={62} fill="#FFFFFF" stroke="#E4E7EA" />
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="font-mono font-bold text-sm leading-tight">
          <span className="text-[#65A30D]">Commerce</span>
          <br />
          OS Engine
        </p>
      </div>
      {FLYWHEEL_NODES.map((n, i) => {
        const angle = (i / FLYWHEEL_NODES.length) * Math.PI * 2 - Math.PI / 2;
        const x = CX + R * Math.cos(angle);
        const y = CY + R * Math.sin(angle);
        return (
          <div
            key={n.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
            style={{ left: `${(x / 380) * 100}%`, top: `${(y / 380) * 100}%` }}
          >
            <span
              className="w-3.5 h-3.5 rounded-full node-pulse"
              style={{ background: n.color, animationDelay: `${i * 0.4}s` }}
            />
            <span className="font-bold text-xs sm:text-sm whitespace-nowrap bg-[#FFFFFF]/70 px-1.5 rounded">
              {n.name}
            </span>
            <span className="font-mono text-[0.58rem] text-[#66707E]">
              0{i + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function System() {
  return (
    <>
      {/* ---- 12 модулів ---- */}
      <Section id="system" className="grid-bg">
        <div className="glow-purple w-[420px] h-[420px] bottom-0 -left-40" />
        <FadeIn>
          <Eyebrow>Commerce OS · Перший продукт школи Commerce Architecture</Eyebrow>
          <SectionTitle>Дванадцять модулів. Один рушій.</SectionTitle>
          <p className="text-[#5A6472] mt-4 max-w-3xl">
            Дані входять, проходять через діагностичний рушій, виходять планом і керуванням. AI та
            база знань працюють наскрізь.
          </p>
        </FadeIn>
        <div className="flex flex-col gap-8 mt-12">
          {MODULE_GROUPS.map((g, gi) => (
            <FadeIn key={g.label} delay={gi * 0.1}>
              <p
                className="font-mono text-[0.66rem] uppercase tracking-[0.2em] mb-3"
                style={{ color: g.color }}
              >
                {g.label}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {g.modules.map((m) => (
                  <div
                    key={m.id}
                    onMouseEnter={() => say(MODULE_SAYS[m.id] ?? m.name)}
                    onMouseLeave={sayIdle}
                    className="card card-hover accent-left px-5 py-4"
                    style={{ '--accent': g.color } as React.CSSProperties}
                  >
                    <p className="font-mono text-[0.62rem] tracking-[0.14em] mb-1.5" style={{ color: g.color }}>
                      {m.id}
                    </p>
                    <p className="font-bold text-sm leading-snug">{m.name}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ---- Карта залежностей ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>Карта залежностей · Архітектура необхідності</Eyebrow>
          <SectionTitle>
            Порядок не «як зручно» —
            <br />а продиктований залежностями
          </SectionTitle>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="flex flex-wrap items-center gap-y-4 gap-x-2 mt-10">
            {CHAIN.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2">
                <div
                  className="card accent-top px-4 py-3 text-center"
                  style={{ '--accent': c.color } as React.CSSProperties}
                >
                  <p className="font-bold text-sm whitespace-nowrap">{c.name}</p>
                  <p className="font-mono text-[0.58rem] text-[#66707E] mt-0.5">{c.sub}</p>
                </div>
                {i < CHAIN.length - 1 && <span className="text-[#66707E] font-mono">→</span>}
              </div>
            ))}
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-2 gap-5 mt-10">
          <FadeIn delay={0.2}>
            <div className="card accent-left p-6 h-full" style={{ '--accent': 'var(--red)' } as React.CSSProperties}>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#DC2626] mb-2.5">
                GO / NO-GO
              </p>
              <p className="text-[#3F4854] text-sm leading-relaxed">
                Без аналітики не працює retention. Без ERP не масштабуються канали. Якщо передумова
                не виконана — етап не стартує.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="card accent-left p-6 h-full" style={{ '--accent': 'var(--lime)' } as React.CSSProperties}>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#65A30D] mb-2.5">
                Чому це сильно
              </p>
              <p className="text-[#3F4854] text-sm leading-relaxed">
                Черговість продиктована необхідністю — з нею неможливо сперечатися. Це ж захищає
                бюджет від рішень «за відчуттям».
              </p>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* ---- Flywheel ---- */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <FadeIn>
            <Flywheel />
          </FadeIn>
          <FadeIn delay={0.15} x={40} y={0}>
            <Eyebrow>Growth Flywheel · Рушій, що розганяє себе</Eyebrow>
            <SectionTitle>Кожен оберт здешевлює наступний</SectionTitle>
            <p className="text-[#5A6472] mt-5 leading-relaxed max-w-lg">
              Дані живлять інфраструктуру → вища конверсія → більше retention і LTV → вивільнена
              маржа реінвестується в активи → зростає вартість компанії. Маховик, який після
              запуску крутиться сам.
            </p>
            <div className="flex gap-12 mt-8">
              <div>
                <p className="font-mono font-bold text-3xl text-[#65A30D]">↓ CAC</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#5A6472] mt-1.5">
                  З кожним обертом
                </p>
              </div>
              <div>
                <p className="font-mono font-bold text-3xl text-[#0F9488]">↑ LTV</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#5A6472] mt-1.5">
                  Компаунд-ефект
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>
    </>
  );
}
