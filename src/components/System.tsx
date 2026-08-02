import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle } from './ui';

const MODULE_GROUPS: {
  label: string;
  color: string;
  modules: { id: string; name: string }[];
}[] = [
  {
    label: 'Вхід · Дані',
    color: '#A3E635',
    modules: [
      { id: 'M01', name: 'Discovery (CDF v2.0)' },
      { id: 'M02', name: 'Data & Access Registry' },
      { id: 'M03', name: 'Metrics · трекінг' },
    ],
  },
  {
    label: 'Рушій · Діагностика → Scope',
    color: '#3DDAD0',
    modules: [
      { id: 'M04', name: 'Gold Standards · 52 метрики' },
      { id: 'M05', name: 'Audit Calculator · розрив→₴' },
      { id: 'M06', name: 'Playbook Library · 56' },
      { id: 'M07', name: 'Roadmap · хвилі' },
    ],
  },
  {
    label: 'Вихід · Виконання та керування',
    color: '#F5B84B',
    modules: [
      { id: 'M08', name: 'PM & Delivery' },
      { id: 'M09', name: 'Governance · RACI / KPI' },
      { id: 'M10', name: 'BI Dashboard · P&L' },
    ],
  },
  {
    label: 'Наскрізно',
    color: '#8B7CF6',
    modules: [
      { id: 'M11', name: 'AI Layer — Use-cases, Readiness, автоматизація' },
      { id: 'M12', name: 'Knowledge Base — плейбуки, промпти, DoD' },
    ],
  },
];

const CHAIN = [
  { name: 'Бренд', sub: 'позиціонування', color: '#F471B5' },
  { name: 'SEO + Платформа', sub: 'фундамент', color: '#A3E635' },
  { name: 'Аналітика', sub: 'єдиний профіль', color: '#3DDAD0' },
  { name: 'CRM + Retention', sub: 'LTV', color: '#5EEAD4' },
  { name: 'Маркетплейси', sub: 'канали', color: '#F5B84B' },
  { name: 'ERP / Операції', sub: 'масштаб', color: '#8B7CF6' },
  { name: 'Юніт-економіка', sub: 'маржа', color: '#C084FC' },
  { name: 'BI', sub: 'дашборд', color: '#38BDF8' },
  { name: 'P&L / Вартість', sub: 'результат', color: '#A3E635' },
];

const FLYWHEEL_NODES = [
  { name: 'Дані', color: '#A3E635' },
  { name: 'Інфраструктура', color: '#3DDAD0' },
  { name: 'Конверсія', color: '#F5B84B' },
  { name: 'Retention · LTV', color: '#8B7CF6' },
  { name: 'Реінвестиція', color: '#FF6A3D' },
  { name: 'Вартість', color: '#A3E635' },
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
          stroke="rgba(140,150,165,0.35)"
          strokeWidth="1.5"
          strokeDasharray="3 8"
          className="spin-slow"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
        <circle cx={CX} cy={CY} r={62} fill="#14181F" stroke="#232933" />
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="font-mono font-bold text-sm leading-tight">
          <span className="text-[#A3E635]">Commerce</span>
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
            <span className="font-bold text-xs sm:text-sm whitespace-nowrap bg-[#0B0D10]/70 px-1.5 rounded">
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
          <p className="text-[#8C96A5] mt-4 max-w-3xl">
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
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#FF5F56] mb-2.5">
                GO / NO-GO
              </p>
              <p className="text-[#B7C0CC] text-sm leading-relaxed">
                Без аналітики не працює retention. Без ERP не масштабуються канали. Якщо передумова
                не виконана — етап не стартує.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="card accent-left p-6 h-full" style={{ '--accent': 'var(--lime)' } as React.CSSProperties}>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#A3E635] mb-2.5">
                Чому це сильно
              </p>
              <p className="text-[#B7C0CC] text-sm leading-relaxed">
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
            <p className="text-[#8C96A5] mt-5 leading-relaxed max-w-lg">
              Дані живлять інфраструктуру → вища конверсія → більше retention і LTV → вивільнена
              маржа реінвестується в активи → зростає вартість компанії. Маховик, який після
              запуску крутиться сам.
            </p>
            <div className="flex gap-12 mt-8">
              <div>
                <p className="font-mono font-bold text-3xl text-[#A3E635]">↓ CAC</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#8C96A5] mt-1.5">
                  З кожним обертом
                </p>
              </div>
              <div>
                <p className="font-mono font-bold text-3xl text-[#3DDAD0]">↑ LTV</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#8C96A5] mt-1.5">
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
