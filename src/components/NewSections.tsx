import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle, Chip, Stat } from './ui';
import { GrowthChart } from './Cases';
import { say, sayIdle } from './speech';
import { track } from './analytics';

const PROOF_SAYS: Record<string, string> = {
  x18: 'Як досягли ×18: сім пластів у синхроні — платформа+SEO, маркетплейси, ребрендинг, retention, B2B і ERP. Жоден окремо цього не дав би.',
  cr: 'Конверсія 0,8% → 4,2%: SEO-first вітрина, mobile-first чекаут і десятки CRO-ітерацій за Gold Standards.',
  organic: 'Органіка 5% → 45%: 18 місяців технічного SEO та контенту — тому CAC впав до ≈€7.',
  roi: 'ROI 3.8×: бюджет ішов траншами під DoD — гроші вкладались лише в те, що довело ефект.',
};

/* ================= Доказ (chokolad-паттерн: результат — першим) ================= */

export function Proof() {
  return (
    <Section className="grid-bg">
      <div className="glow-lime w-[420px] h-[420px] -top-24 -right-32" />
      <FadeIn>
        <Eyebrow>Доказ · Кейс «Преміум-текстиль» · UA→EU · Факт за CRM / ERP / GA4</Eyebrow>
        <SectionTitle as="h1">Спочатку — що це дає. На реальному бізнесі.</SectionTitle>
        <p className="font-mono text-xs text-[#5A6472] mt-3">
          Наведи на цифру — асистент розповість, як ми цього досягли ↓
        </p>
      </FadeIn>
      <div className="grid lg:grid-cols-2 gap-6 mt-10 items-stretch">
        <FadeIn delay={0.1}>
          <GrowthChart />
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 gap-3 h-full content-stretch">
            <div onMouseEnter={() => say(PROOF_SAYS.x18)} onMouseLeave={sayIdle}>
              <Stat value="×18" label="Оборот" color="var(--lime)" />
            </div>
            <div onMouseEnter={() => say(PROOF_SAYS.cr)} onMouseLeave={sayIdle}>
              <Stat value="4,2%" label="Конверсія · з 0,8%" color="var(--cyan)" />
            </div>
            <div onMouseEnter={() => say(PROOF_SAYS.organic)} onMouseLeave={sayIdle}>
              <Stat value="45%" label="Органіка · CAC ≈ €7" color="var(--purple)" />
            </div>
            <div onMouseEnter={() => say(PROOF_SAYS.roi)} onMouseLeave={sayIdle}>
              <Stat value="3.8×" label="ROI за рік 1" color="var(--yellow)" />
            </div>
          </div>
        </FadeIn>
      </div>
      <FadeIn delay={0.3}>
        <div className="flex flex-wrap items-baseline justify-between gap-4 mt-8">
          <p className="text-[#5A6472] text-sm max-w-3xl leading-relaxed">
            Конверсія 4,2% при галузевій нормі 0,7–1,5% — це{' '}
            <strong className="text-[#12161C]">топ-1% сегмента</strong>. Не гасло — вимірюваний факт.
            Далі — як це побудовано.
          </p>
          <Link
            to="/cases/premium-textile"
            className="font-mono text-sm text-[#4D7C0F] uppercase tracking-wider hover:text-[#3F6212] transition-colors"
          >
            Розібрати кейс →
          </Link>
        </div>
      </FadeIn>
    </Section>
  );
}

/* ================= Статус-кво + Ціна бездіяльності ================= */

export function StatusQuo() {
  return (
    <Section className="grid-bg">
      <FadeIn>
        <Eyebrow>Як компанії ростуть сьогодні</Eyebrow>
        <SectionTitle>Більше бюджету → більше продажів.</SectionTitle>
        <div className="flex flex-wrap gap-x-16 gap-y-6 mt-8">
          <div className="border-l border-black/10 pl-5">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#5A6472] mb-1.5">
              Звична логіка
            </p>
            <p className="font-bold text-xl text-[#5A6472]">Купуй увагу</p>
          </div>
          <div className="border-l-2 border-[#EA580C] pl-5">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#EA580C] mb-1.5">
              Результат
            </p>
            <p className="font-bold text-xl">Наступний квартал — знову з нуля</p>
          </div>
        </div>
        <p className="font-serif-it text-lg text-[#3F4854] mt-8">
          Це працює. Рівно доти, доки ви платите. І це головна пастка.
        </p>
      </FadeIn>
    </Section>
  );
}

function InactionChart() {
  const withSystem = 'M 12 132 C 90 128, 160 112, 230 82 S 330 24, 372 14';
  const withoutSystem = 'M 12 132 C 110 133, 220 138, 372 146';
  return (
    <div className="card p-6">
      <p className="font-pixel text-[0.55rem] text-[#4D7C0F] mb-5">ЩО СТАЄТЬСЯ ЗА 3 РОКИ</p>
      <svg viewBox="0 0 400 170" className="w-full">
        {[45, 90, 135].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(10,14,18,0.07)" />
        ))}
        <motion.path
          d={withSystem}
          fill="none"
          stroke="#65A30D"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
        />
        <motion.path
          d={withoutSystem}
          fill="none"
          stroke="#DC2626"
          strokeWidth="2"
          strokeDasharray="5 6"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        />
        <text x="308" y="12" fill="#65A30D" fontSize="11" className="font-mono">
          із системою
        </text>
        <text x="310" y="160" fill="#DC2626" fontSize="11" className="font-mono">
          без системи
        </text>
        <text x="12" y="160" fill="#5A6472" fontSize="10" className="font-mono">
          сьогодні
        </text>
        <text x="345" y="160" fill="#5A6472" fontSize="10" className="font-mono">
          3 роки
        </text>
      </svg>
    </div>
  );
}

export function PriceOfInaction() {
  return (
    <Section>
      <FadeIn>
        <Eyebrow>Ціна бездіяльності</Eyebrow>
        <SectionTitle>Відсутність системи коштує грошей — щодня</SectionTitle>
      </FadeIn>
      <div className="grid lg:grid-cols-2 gap-6 mt-10 items-stretch">
        <FadeIn delay={0.1}>
          <div className="card p-7 h-full flex flex-col justify-center">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#EA580C] mb-4">
              Недоотримано · аудит fashion-бренду
            </p>
            <p className="font-mono font-bold text-5xl md:text-6xl text-[#DB2777]">≥ 19 млн ₴</p>
            <p className="text-[#5A6472] text-sm mt-4 leading-relaxed">
              незайнятого обороту на рік (без Європи). ≈1,6 млн ₴ втрачається щомісяця зволікання.
              Реальний аудит fashion-виробника (Україна), 2026.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <InactionChart />
        </FadeIn>
      </div>
      <FadeIn delay={0.3}>
        <p className="text-[#5A6472] text-sm mt-8 max-w-4xl leading-relaxed">
          Розрив не стоїть на місці — він накопичується. Конкурент, який побудував систему, щороку
          відривається все далі.{' '}
          <strong className="text-[#12161C]">Наздогнати стає дорожче, ніж побудувати.</strong>
        </p>
      </FadeIn>
    </Section>
  );
}

/* ================= Глосарій: три слова ================= */

const GLOSSARY = [
  {
    name: 'Commerce OS',
    role: 'Що купуєш',
    text: 'Операційна система росту компанії. Продукт, який будує weexp.',
    color: '#65A30D',
  },
  {
    name: 'Commerce Architecture',
    role: 'Як побудовано',
    text: 'Дисципліна проєктування, за якою збирається Commerce OS.',
    color: '#0F9488',
  },
  {
    name: 'System Intelligence',
    role: 'Результат',
    text: 'Здатність компанії ухвалювати рішення на даних — те, що з’являється на виході.',
    color: '#B45309',
  },
];

export function Glossary() {
  return (
    <Section>
      <FadeIn>
        <Eyebrow>Одна система · Три слова</Eyebrow>
        <SectionTitle>Щоб не було плутанини</SectionTitle>
      </FadeIn>
      <div className="grid md:grid-cols-3 gap-5 mt-10">
        {GLOSSARY.map((g, i) => (
          <FadeIn key={g.name} delay={i * 0.1}>
            <div className="card card-hover accent-top p-7 h-full" style={{ '--accent': g.color } as React.CSSProperties}>
              <p className="font-extrabold text-xl" style={{ color: g.color }}>
                {g.name}
              </p>
              <p className="font-pixel text-[0.5rem] text-black/65 uppercase mt-2 mb-3">{g.role}</p>
              <p className="text-[#5A6472] text-sm leading-relaxed">{g.text}</p>
            </div>
          </FadeIn>
        ))}
      </div>
      <FadeIn delay={0.3}>
        <p className="text-center text-[#5A6472] text-sm mt-8">
          Одна сутність — <strong className="text-[#12161C]">Commerce OS</strong>. Решта — це «як» і
          «навіщо».
        </p>
      </FadeIn>
    </Section>
  );
}

/* ================= Як працює: 4 кроки + рушій виконання ================= */

const STEPS4 = [
  { n: '01', name: 'Діагностика', text: 'Health Score, рівень зрілості, роутинг у плейбуки.', color: '#65A30D' },
  { n: '02', name: 'Гроші розриву', text: 'Кожен розрив → недоотриманий оборот у ₴.', color: '#0F9488' },
  { n: '03', name: 'Дорожня карта', text: 'Три хвилі: корінь → бар’єр → швидкі перемоги.', color: '#B45309' },
  { n: '04', name: 'Виконання · DoD', text: 'Підрядник, строк, бюджет і вимірюваний критерій.', color: '#EA580C' },
];

const ENGINE = [
  { name: 'Команда під ключ', text: 'PM + підрядники: dev · SEO · CRM · ads · design', color: '#65A30D' },
  { name: 'Спринти', text: '2-тижневі цикли · беклог · пріоритезація', color: '#0F9488' },
  { name: 'Deliverables', text: 'D-01…D-NN: XLSX-моделі, регламенти, дашборди', color: '#B45309' },
  { name: 'Контроль якості', text: 'DoD-гейт на кожному кроці · без «майже готово»', color: '#EA580C' },
];

export function HowItWorks() {
  return (
    <>
      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>Як працює Commerce OS</Eyebrow>
          <SectionTitle>Біль → гроші → план → виконання</SectionTitle>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {STEPS4.map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.08}>
              <div className="card card-hover accent-top p-6 h-full" style={{ '--accent': s.color } as React.CSSProperties}>
                <p className="font-mono font-bold text-3xl" style={{ color: s.color }}>
                  {s.n}
                </p>
                <p className="font-extrabold text-lg mt-2">{s.name}</p>
                <p className="text-[#5A6472] text-sm mt-2 leading-relaxed">{s.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.3}>
          <div className="card p-5 mt-6 flex flex-wrap gap-x-6 gap-y-2 items-baseline">
            <span className="font-pixel text-[0.5rem] uppercase text-[#4D7C0F]">
              DoD на кожному етапі
            </span>
            <span className="text-[#3F4854] text-sm">
              Кожен етап закривається вимірюваним критерієм (Definition of Done). Наступний не
              стартує, поки не виконана передумова — це захищає ваш бюджет.
            </span>
          </div>
        </FadeIn>
      </Section>

      <Section>
        <FadeIn>
          <Eyebrow>Що всередині блоку «Виконання»</Eyebrow>
          <SectionTitle>Виконання — це рушій, а не обіцянка</SectionTitle>
        </FadeIn>
        <div className="grid lg:grid-cols-[1fr_1.8fr] gap-6 mt-10 items-start">
          <FadeIn delay={0.1}>
            <div className="flex flex-col gap-4">
              <div className="card p-5 text-center">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#0F9488] mb-2">
                  Вхід
                </p>
                <p className="text-sm text-[#2F3742]">Roadmap · доступи та дані · бюджет траншами</p>
              </div>
              <div className="text-center font-mono text-[#5A6472]">↓</div>
              <div className="card p-5 text-center">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#B45309] mb-2">
                  Вихід
                </p>
                <p className="text-sm text-[#2F3742]">↑ метрики · власні активи · P&amp;L / вартість</p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="card p-6">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#6D28D9] mb-5">
                Рушій виконання · 4 складові
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {ENGINE.map((e) => (
                  <div key={e.name} className="card accent-top p-5" style={{ '--accent': e.color } as React.CSSProperties}>
                    <p className="font-bold">{e.name}</p>
                    <p className="text-[#5A6472] text-xs mt-1.5 leading-relaxed">{e.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
        <FadeIn delay={0.3}>
          <div className="card p-5 mt-6 flex flex-wrap gap-x-6 gap-y-2 items-baseline">
            <span className="font-pixel text-[0.5rem] uppercase text-[#B45309]">
              Governance-рейка
            </span>
            <span className="text-[#3F4854] text-sm">
              RACI · KPI по ролях · транші під результат · щотижневий BI-огляд. Прозорість замість
              «повірте на слово».
            </span>
          </div>
        </FadeIn>
      </Section>
    </>
  );
}

/* ================= Gold Standards: три рівні ================= */

const STRATEGIC = [
  { name: 'Бренд', desc: 'сформований · Brand Book · тригери довіри', color: '#DB2777' },
  { name: 'Позиціонування', desc: 'чітке, відстроєне від конкурентів', color: '#6D28D9' },
  { name: 'Міжнародна присутність', desc: 'ціль: 5+ ринків · EU / UK / US · 25%+ виручки з-за кордону · бренд, який впізнають за межами України', color: '#0F9488', tag: 'є / нема' },
  { name: 'ERP-система', desc: 'єдиний облік, склад, фінанси', color: '#B45309', tag: 'є / нема' },
  { name: 'Наскрізна аналітика', desc: 'GA4 + BI · P&L у реальному часі', color: '#65A30D' },
];

const SITE_METRICS = [
  { name: 'CR сайту', red: '< 1,5%', norm: '2,0–3,5%', gold: '4,0%+' },
  { name: 'Повторні покупки', red: '< 15%', norm: '25–30%', gold: '35%+' },
  { name: 'LTV : CAC', red: '< 2', norm: '3–4', gold: '5+' },
  { name: 'Частка органіки', red: '< 15%', norm: '30–45%', gold: '50%+' },
  { name: 'Core Web Vitals (LCP)', red: '> 4,0 с', norm: '2,5–4,0 с', gold: '< 2,5 с' },
];

const STACK = ['CRM / CDP', 'BI-дашборд', 'Retention-платформа', 'PIM', 'Middleware'];

export function GoldStandards() {
  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <FadeIn>
          <Eyebrow>Gold Standards · Лінійка, а не думка</Eyebrow>
          <SectionTitle as="h1">Еталон прикладається на трьох рівнях</SectionTitle>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="text-right">
            <p className="font-mono font-bold text-6xl text-[#0F9488]">52</p>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#5A6472]">
              Метрики · 10 доменів
            </p>
          </div>
        </FadeIn>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-10 items-start">
        <FadeIn delay={0.1}>
          <div className="card p-6 h-full">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#6D28D9] mb-5">
              1 · Стратегічний рівень
            </p>
            <ul className="flex flex-col gap-3.5">
              {STRATEGIC.map((s) => (
                <li key={s.name} className="flex items-start justify-between gap-4">
                  <span className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: s.color }} />
                    <span className="text-sm">
                      <strong>{s.name}</strong>{' '}
                      <span className="text-[#5A6472]">— {s.desc}</span>
                    </span>
                  </span>
                  {s.tag && (
                    <span className="font-mono text-[0.58rem] text-[#5A6472] border border-black/10 rounded px-2 py-0.5 whitespace-nowrap">
                      {s.tag}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#0F9488] mt-6 mb-3">
              3 · Інструменти · Стек
            </p>
            <div className="flex flex-wrap gap-2">
              {STACK.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="card p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#B45309]">
                2 · Метрики сайту
              </p>
              <span className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" />
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-[0.7rem]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <thead>
                  <tr className="text-[#5A6472] uppercase tracking-[0.1em] text-left">
                    <th className="pb-2.5 pr-3 font-medium">Метрика</th>
                    <th className="pb-2.5 pr-3 font-medium text-[#DC2626]">●</th>
                    <th className="pb-2.5 pr-3 font-medium text-[#B45309]">●</th>
                    <th className="pb-2.5 font-medium text-[#4D7C0F]">●</th>
                  </tr>
                </thead>
                <tbody>
                  {SITE_METRICS.map((m) => (
                    <tr key={m.name} className="border-t border-black/[0.06]">
                      <td className="py-2.5 pr-3 font-sans font-semibold text-[#12161C]">{m.name}</td>
                      <td className="py-2.5 pr-3 text-[#DC2626]">{m.red}</td>
                      <td className="py-2.5 pr-3 text-[#B45309]">{m.norm}</td>
                      <td className="py-2.5 text-[#4D7C0F]">{m.gold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[#5A6472] text-[0.68rem] mt-4 leading-relaxed">
              Спершу — стратегія (є/нема), далі — цифри сайту, далі — інструменти. Кожен розрив
              перекладається в гроші.
            </p>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

/* ================= Мережа плейбуків (PB-12 hub) ================= */

const PB_LINKS = [
  { id: 'PB-08', text: 'дає чисті дані трекінгу', color: '#6D28D9' },
  { id: 'PB-13', text: 'живить ціноутворення й маржу', color: '#0F9488' },
  { id: 'PB-28', text: 'додає LTV з retention', color: '#DB2777' },
  { id: 'PB-36', text: 'постачає CAC із performance', color: '#EA580C' },
  { id: 'PB-53', text: 'зводить усе у P&L', color: '#B45309' },
];

export function PlaybookNet() {
  const nodes = [
    { id: 'PB-08', name: 'Аналітика · трекінг', x: 50, y: 8, color: '#6D28D9' },
    { id: 'PB-53', name: 'P&L · фінмодель', x: 12, y: 38, color: '#B45309' },
    { id: 'PB-13', name: 'Ціноутворення · маржа', x: 88, y: 38, color: '#0F9488' },
    { id: 'PB-36', name: 'Performance · CAC', x: 22, y: 86, color: '#EA580C' },
    { id: 'PB-28', name: 'Retention · LTV', x: 74, y: 86, color: '#DB2777' },
  ];
  return (
    <Section className="grid-bg">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <FadeIn>
          <Eyebrow>Як влаштована бібліотека плейбуків</Eyebrow>
          <SectionTitle>Жоден плейбук не працює наодинці</SectionTitle>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="text-right">
            <p className="font-mono font-bold text-6xl text-[#0F9488]">56</p>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#5A6472]">
              Executable · 18 доменів
            </p>
          </div>
        </FadeIn>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 mt-10 items-center">
        <FadeIn delay={0.1}>
          <div className="relative h-[340px]">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {nodes.map((n) => (
                <line
                  key={n.id}
                  x1="50"
                  y1="47"
                  x2={n.x}
                  y2={n.y}
                  stroke="rgba(139,124,246,0.4)"
                  strokeWidth="0.4"
                  strokeDasharray="1.5 1.5"
                />
              ))}
            </svg>
            {nodes.map((n, i) => (
              <div
                key={n.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 card px-3 py-2 text-center"
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
              >
                <p className="font-mono text-[0.55rem]" style={{ color: n.color }}>
                  {n.id}
                </p>
                <p className="font-bold text-[0.7rem] whitespace-nowrap">{n.name}</p>
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full node-pulse"
                  style={{ background: n.color, animationDelay: `${i * 0.4}s` }}
                />
              </div>
            ))}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 card px-5 py-3.5 text-center"
              style={{ left: '50%', top: '47%', borderColor: 'rgba(101,163,13,0.6)', boxShadow: '0 0 28px rgba(101,163,13,0.25)' }}
            >
              <p className="font-mono text-[0.55rem] text-[#4D7C0F]">PB-12 · ФІНАНСИ</p>
              <p className="font-extrabold text-sm">Unit Economics</p>
              <p className="font-mono text-[0.5rem] text-[#5A6472] mt-0.5">CM1·CM2·CM3 · LTV:CAC</p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="font-pixel text-[0.55rem] uppercase text-[#4D7C0F] mb-3">
            Один плейбук зблизька
          </p>
          <p className="text-sm text-[#3F4854] leading-relaxed max-w-md">
            <strong className="text-[#12161C]">PB-12 «Unit Economics»</strong> рахує маржу на рівні
            замовлення, каналу та SKU. Але щоб він дав результат, потрібні дані з інших плейбуків.
          </p>
          <p className="font-pixel text-[0.55rem] uppercase text-[#6D28D9] mt-6 mb-3">
            Потягни за один — рухаються зв&rsquo;язані
          </p>
          <ul className="flex flex-col gap-2">
            {PB_LINKS.map((l) => (
              <li key={l.id} className="text-sm text-[#5A6472]">
                <span className="font-mono mr-2" style={{ color: l.color }}>
                  → {l.id}
                </span>
                {l.text}
              </li>
            ))}
          </ul>
          <p className="text-[#5A6472] text-xs mt-6 leading-relaxed max-w-md">
            Тому це <strong className="text-[#2F3742]">система</strong>, а не набір послуг: витягти
            цінність з одного плейбука можна лише разом зі зв&rsquo;язаними — дані течуть між ними.
          </p>
        </FadeIn>
      </div>
    </Section>
  );
}

/* ================= Дві траєкторії (розвилка) ================= */

const TRACK_OS = [
  { period: '90 днів', text: 'baseline у грошах · дорожня карта · перші швидкі перемоги' },
  { period: 'рік', text: 'власні активи: SEO, retention, МП, бренд · ↑ маржа' },
  { period: '3 роки', text: 'система, що масштабується · зростання вартості компанії' },
];

const TRACK_NO = [
  { period: '90 днів', text: 'усе тримається на платному трафіку' },
  { period: 'рік', text: 'CAC росте · розрив із конкурентом ширшає' },
  { period: '3 роки', text: 'наздоганяти дорожче, ніж було побудувати з нуля' },
];

export function Fork() {
  return (
    <Section className="grid-bg">
      <FadeIn>
        <Eyebrow>Що зміниться · Розвилка</Eyebrow>
        <SectionTitle>Дві траєкторії. Рішення — сьогодні.</SectionTitle>
      </FadeIn>
      <div className="grid md:grid-cols-2 gap-5 mt-10 items-stretch">
        <FadeIn delay={0.1}>
          <div className="card accent-top p-7 h-full" style={{ '--accent': 'var(--lime)', borderColor: 'rgba(101,163,13,0.35)' } as React.CSSProperties}>
            <p className="font-extrabold text-2xl text-[#4D7C0F] mb-5">З Commerce OS</p>
            <div className="flex flex-col">
              {TRACK_OS.map((t, i) => (
                <div key={t.period} className={`flex gap-5 py-3.5 ${i > 0 ? 'border-t border-black/[0.06]' : ''}`}>
                  <span className="font-mono text-[0.66rem] text-[#5A6472] w-16 shrink-0 pt-0.5">{t.period}</span>
                  <span className="text-sm text-[#2F3742]">{t.text}</span>
                </div>
              ))}
            </div>
            <p className="font-mono text-xs text-[#4D7C0F] mt-4">↗ крива йде вгору — ви будуєте актив</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="card accent-top p-7 h-full" style={{ '--accent': 'var(--orange)' } as React.CSSProperties}>
            <p className="font-extrabold text-2xl text-[#EA580C] mb-5">Без системи</p>
            <div className="flex flex-col">
              {TRACK_NO.map((t, i) => (
                <div key={t.period} className={`flex gap-5 py-3.5 ${i > 0 ? 'border-t border-black/[0.06]' : ''}`}>
                  <span className="font-mono text-[0.66rem] text-[#5A6472] w-16 shrink-0 pt-0.5">{t.period}</span>
                  <span className="text-sm text-[#2F3742]">{t.text}</span>
                </div>
              ))}
            </div>
            <p className="font-mono text-xs text-[#DC2626] mt-4">↘ крива стагнує — ви орендуєте увагу</p>
          </div>
        </FadeIn>
      </div>
      <FadeIn delay={0.3}>
        <p className="text-center text-[#5A6472] text-sm mt-8">
          Розрив між кривими накопичується щомісяця. Що раніше стартує ліва траєкторія — то дешевша
          вся дистанція.
        </p>
      </FadeIn>
    </Section>
  );
}

/* ================= Кейс fashion-бренд ================= */

const RAY_ROWS = [
  { name: 'Оборот e-com', a: '23,2 млн ₴', b: '×2,0–2,5' },
  { name: 'Конверсія', a: '3,9%', b: '4,3–4,5%+' },
  { name: 'Оплата заявок', a: '63,4%', b: '≥ 75%' },
  { name: 'Викуп до виручки', a: '82%', b: '≥ 88%' },
  { name: 'Повторні покупки', a: '15–20%', b: '26–30%' },
  { name: 'SEO · позиція', a: '14', b: 'топ-5' },
  { name: 'Канали трафіку', a: '1 платний', b: '4+' },
  { name: 'Європа', a: '0%', b: '12–18%' },
];

export function RayCase() {
  return (
    <Section>
      <FadeIn>
        <Eyebrow>
          Кейс · <span className="text-[#4D7C0F]">Fashion-виробник</span> · Управління проєктом 2026
        </Eyebrow>
        <SectionTitle as="h1">
          Одяговий бренд ·<br />
          програма росту 12 міс
        </SectionTitle>
      </FadeIn>
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 mt-10 items-start">
        <FadeIn delay={0.1}>
          <p className="text-[#3F4854] text-sm leading-relaxed max-w-md">
            Український виробник повсякденного одягу. Кожен розрив переведено у гроші, побудовано
            програму на 12 місяців: незалежні канали, повторні продажі, власні дані, юрособа в
            Польщі, продажі в ЄС.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-5">
            <Chip>база 20K клієнтів</Chip>
            <Chip>18% замовлень не доходять</Chip>
          </div>
          <div className="card p-6 mt-6">
            <div className="flex flex-wrap gap-x-10 gap-y-5">
              <div>
                <p className="font-mono font-bold text-2xl text-[#DB2777]">≥ 19 млн ₴</p>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#5A6472] mt-1">
                  Недоотримано / рік
                </p>
              </div>
              <div>
                <p className="font-mono font-bold text-2xl text-[#B45309]">$56–79K</p>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#5A6472] mt-1">
                  Бюджет · 12 міс · транші
                </p>
              </div>
              <div>
                <p className="font-mono font-bold text-2xl text-[#4D7C0F]">4–8 міс</p>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#5A6472] mt-1">
                  Окупність (за сценаріями CM)
                </p>
              </div>
            </div>
            <p className="text-[#5A6472] text-[0.66rem] mt-5">
              Програма росту · цілі на 12 міс, не постфактум-результат.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="card p-6 overflow-x-auto">
            <table className="w-full font-mono text-[0.7rem]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr className="text-[#5A6472] uppercase tracking-[0.1em] text-left">
                  <th className="pb-3 pr-3 font-medium">Показник</th>
                  <th className="pb-3 pr-3 font-medium">Точка А</th>
                  <th className="pb-3 font-medium text-right">12 міс</th>
                </tr>
              </thead>
              <tbody>
                {RAY_ROWS.map((r) => (
                  <tr key={r.name} className="border-t border-black/[0.06]">
                    <td className="py-2.5 pr-3 font-sans font-semibold text-[#12161C]">{r.name}</td>
                    <td className="py-2.5 pr-3 text-[#DC2626]">{r.a}</td>
                    <td className="py-2.5 text-right text-[#4D7C0F]">→ {r.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

/* ================= CTA-стрічка для кінця сторінок ================= */

export function PageCta({ label = 'Почнімо з аудиту' }: { label?: string }) {
  return (
    <Section>
      <FadeIn>
        <div
          className="card p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ borderColor: 'rgba(101,163,13,0.35)' }}
        >
          <div>
            <p className="font-extrabold text-2xl md:text-3xl">{label}</p>
            <p className="text-[#5A6472] text-sm mt-2 max-w-xl">
              30-хв стратегічна сесія → аудит. Ви бачите цифри до того, як вкладаєте
              бюджет у виконання.
            </p>
          </div>
          <Link
            to="/contact"
            onClick={() => track('cta_click', { location: 'page_cta' })}
            className="self-start md:self-auto shrink-0 flex items-center gap-3 border border-[#65A30D] text-[#4D7C0F] px-7 py-3.5 text-sm tracking-wider uppercase hover:bg-[#65A30D] hover:text-[#12161C] transition-colors"
          >
            Отримати аудит у грошах →
          </Link>
        </div>
      </FadeIn>
    </Section>
  );
}
