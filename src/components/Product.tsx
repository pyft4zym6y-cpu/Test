import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle, Terminal, Stat, CountUp } from './ui';

const DOMAINS = [
  { name: 'SEO / Органіка', ids: 'PB-04 · 05 · 06 · 07', color: '#A3E635' },
  { name: 'CRO / UX', ids: 'PB-15 · 02 · 40', color: '#3DDAD0' },
  { name: 'CRM / Retention', ids: 'PB-08 · 09 · 45', color: '#8B7CF6' },
  { name: 'Фінанси', ids: 'PB-12 · 36 · 53', color: '#F5B84B' },
  { name: 'Маркетплейси', ids: 'PB-21 · 22 · 23', color: '#FF6A3D' },
  { name: 'Міжн. експансія', ids: 'PB-24 · 25 · 26 · 27', color: '#A3E635' },
  { name: 'Платформа / IT', ids: 'PB-14 · 16 · 17 · 18', color: '#3DDAD0' },
  { name: 'AI', ids: 'PB-32 · 33 · 54 · 55 · 56', color: '#8B7CF6' },
  { name: 'Бренд', ids: 'PB-37 · 46 · 50 · 51', color: '#F471B5' },
  { name: 'Операції', ids: 'PB-19 · 20 · 34', color: '#F5B84B' },
  { name: 'Продукт', ids: 'PB-28 · 29 · 42', color: '#A3E635' },
  { name: 'Стратегія · Продажі', ids: 'PB-01 · 41 · 43 · 44', color: '#FF6A3D' },
];

const AUDIT_ROWS = [
  { metric: 'Оплата заявок', fact: '63,4%', zone: '#FF5F56', norm: '70–80%', gold: '75%+', gap: '≈4,0 млн ₴', pb: 'PB-02·15' },
  { metric: 'Викуп до виручки', fact: '82%', zone: '#F5B84B', norm: '85–88%', gold: '88%+', gap: '≈2,5 млн ₴', pb: 'PB-19' },
  { metric: 'Повторні покупки', fact: '15–20%', zone: '#FF5F56', norm: '25–30%', gold: '26–30%', gap: '≈4,5 млн ₴', pb: 'PB-08' },
  { metric: 'SEO · органіка', fact: 'поз. 14', zone: '#FF5F56', norm: 'топ-10', gold: 'топ-5', gap: '≈3,0 млн ₴', pb: 'PB-04·05' },
  { metric: 'Дод. канали', fact: 'платні', zone: '#FF5F56', norm: '2–3', gold: '3+', gap: '≈2,0 млн ₴', pb: 'PB-21·22' },
];

const SYSTEM_NUMBERS = [
  { to: 56, label: 'Плейбуків', color: 'var(--lime)' },
  { to: 52, label: 'Еталонні метрики', color: 'var(--cyan)' },
  { to: 18, label: 'Доменів', color: 'var(--purple)' },
  { to: 9, label: 'Розділів у кожному плейбуку', color: 'var(--yellow)' },
  { to: 20, label: 'Секцій у шаблоні КП', color: 'var(--orange)' },
  { to: 20, label: 'Точок доступу (AC-01…20)', color: 'var(--cyan)' },
  { to: 10, label: 'Доменів метрик', color: 'var(--pink)' },
  { to: 5, label: 'Інструментів системи', color: 'var(--lime)' },
  { to: 3, label: 'Зони діагностики', color: 'var(--cyan)' },
];

export default function Product() {
  return (
    <>
      {/* ---- Playbook Library ---- */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <FadeIn>
            <Eyebrow>Playbook Library · Бібліотека існує</Eyebrow>
            <SectionTitle>56 плейбуків. Реальні, не гасло.</SectionTitle>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="text-right">
              <p className="font-mono font-bold text-6xl text-[#3DDAD0]">
                <CountUp to={56} />
              </p>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#8C96A5]">
                Executable · 18 доменів
              </p>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="card p-6 md:p-8 mt-10">
            <p className="font-mono text-xs text-[#A3E635] mb-4">Playbook Library/</p>
            <div className="grid sm:grid-cols-2 gap-x-10">
              {DOMAINS.map((d, i) => (
                <div
                  key={d.name}
                  className={`flex items-center justify-between gap-4 py-3 ${
                    i < DOMAINS.length - (DOMAINS.length % 2 === 0 ? 2 : 1) ? 'border-b border-[#1C2129]' : ''
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[#66707E]">├─</span>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="font-bold text-sm truncate">{d.name}</span>
                  </span>
                  <span className="font-mono text-[0.62rem] text-[#8C96A5] whitespace-nowrap">{d.ids}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[#66707E] text-xs mt-4 leading-relaxed">
            Кожен плейбук = 9 розділів: навіщо · тригери · вхід · кроки · формули · deliverable ·
            критерії приймання · помилки · зв&rsquo;язки.
          </p>
        </FadeIn>

        {/* 56 tiles grid */}
        <FadeIn delay={0.25}>
          <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-8 gap-2 mt-10">
            {Array.from({ length: 56 }, (_, i) => {
              const colors = ['#A3E635', '#3DDAD0', '#8B7CF6', '#F5B84B', '#FF6A3D', '#F471B5'];
              const c = colors[i % colors.length];
              return (
                <div
                  key={i}
                  className="card card-hover flex flex-col items-center justify-center py-3"
                >
                  <span className="font-mono text-[0.55rem]" style={{ color: c }}>
                    PB
                  </span>
                  <span className="font-mono font-bold text-sm">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </Section>

      {/* ---- Екрани продукту ---- */}
      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>Покажи, не розкажи · Екрани продукту</Eyebrow>
          <SectionTitle>Один плейбук — один закінчений результат</SectionTitle>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-6 mt-10 items-start">
          {/* Screen 1: playbook */}
          <FadeIn delay={0.1}>
            <Terminal title="commerce-os · playbook · PB-12">
              <p className="font-mono text-[0.62rem] text-[#A3E635] tracking-[0.1em]">
                PB-12 · ДОМЕН «ФІНАНСИ» · СТРОК 3 ТИЖНІ
              </p>
              <p className="font-extrabold text-lg mt-1.5 mb-4">
                Unit Economics &amp; Contribution Margin
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <ol className="font-mono text-[0.68rem] text-[#8C96A5] flex flex-col gap-1.5">
                  {[
                    'Навіщо потрібен',
                    'Тригери підключення',
                    'Вхідні дані та доступи',
                    'Пошаговий процес (7 кроків)',
                    'Формули: CM1 · CM2 · CM3 · LTV:CAC',
                    'Deliverable: D-04 модель (XLSX)',
                    'Критерії приймання (DoD)',
                    'Типові помилки',
                    'Зв’язки: PB-13 · 28 · 08 · 36 · 53',
                  ].map((s, i) => (
                    <li key={s}>
                      {i + 1} · {s}
                    </li>
                  ))}
                </ol>
                <div>
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#F5B84B] mb-2">
                    Формули
                  </p>
                  <pre className="font-mono text-[0.66rem] text-[#C7CFDA] leading-relaxed whitespace-pre-wrap">
{`CM1 = Виручка − COGS
CM2 = CM1 − еквайринг/лог
CM3 = CM2 − реклама
CAC payback = CAC / міс. маржа
LTV:CAC ≥ 3 → ріст`}
                  </pre>
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#A3E635] mt-4 mb-1.5">
                    DoD ✓
                  </p>
                  <p className="text-[0.7rem] text-[#8C96A5] leading-relaxed">
                    ≥90% замовлень із собівартістю · збиткові SKU виявлені · LTV:CAC за когортами ·
                    чутливість до 3 важелів
                  </p>
                </div>
              </div>
            </Terminal>
          </FadeIn>

          {/* Screen 2: audit calculator */}
          <FadeIn delay={0.2}>
            <Terminal title="commerce-os · audit · RAY.UA · 2026">
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[0.66rem]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <thead>
                    <tr className="text-[#66707E] uppercase tracking-[0.1em] text-left">
                      <th className="pb-2.5 pr-3 font-medium">Метрика</th>
                      <th className="pb-2.5 pr-3 font-medium">Факт</th>
                      <th className="pb-2.5 pr-3 font-medium">Норма</th>
                      <th className="pb-2.5 pr-3 font-medium">Золотий</th>
                      <th className="pb-2.5 pr-3 font-medium text-right">Розрив→₴</th>
                      <th className="pb-2.5 font-medium">Плейбук</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AUDIT_ROWS.map((r) => (
                      <tr key={r.metric} className="border-t border-[#1C2129]">
                        <td className="py-2.5 pr-3 text-[#E9EDF2] font-sans font-semibold">{r.metric}</td>
                        <td className="py-2.5 pr-3">
                          <span className="inline-flex items-center gap-1.5" style={{ color: r.zone }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.zone }} />
                            {r.fact}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-[#8C96A5]">{r.norm}</td>
                        <td className="py-2.5 pr-3 text-[#A3E635]">{r.gold}</td>
                        <td className="py-2.5 pr-3 text-right text-[#F5B84B]">{r.gap}</td>
                        <td className="py-2.5 text-[#3DDAD0]">{r.pb}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-[#232933]">
                      <td className="pt-3 font-sans font-extrabold text-[#E9EDF2]">РАЗОМ УПУЩЕНО / РІК</td>
                      <td colSpan={4} className="pt-3 text-right font-bold text-[#A3E635]">
                        ≥ 19 млн ₴
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[0.64rem] text-[#66707E] mt-4">
                Факт клієнта прикладається до еталона. Кожен розрив → недоотриманий оборот →
                конкретний плейбук. Реальний аудит бренду RAY.UA, 2026.
              </p>
            </Terminal>
          </FadeIn>
        </div>

        {/* Screen 3: gold standards */}
        <FadeIn delay={0.3}>
          <Terminal title="commerce-os · gold-standards + kpi-blueprint" className="mt-6">
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#A3E635] mb-3">
                  Gold Standards · 3 зони
                </p>
                <ul className="flex flex-col gap-2 text-[0.78rem] text-[#B7C0CC]">
                  <li>
                    <span className="text-[#FF5F56] font-bold">● Червона</span> — прямі втрати, у
                    гроші першою
                  </li>
                  <li>
                    <span className="text-[#F5B84B] font-bold">● Норма</span> — точка росту
                  </li>
                  <li>
                    <span className="text-[#A3E635] font-bold">● Золотий</span> — рівень кращих у
                    категорії
                  </li>
                </ul>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#3DDAD0] mt-5 mb-2">
                  Тип значення
                </p>
                <p className="text-[0.7rem] text-[#8C96A5] leading-relaxed">
                  стандарт (Google CWV) · бенчмарк (галузь) · орієнтир (калібрується при baseline)
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#F5B84B] mb-3">
                  KPI Blueprint · По ролях
                </p>
                <pre className="font-mono text-[0.66rem] text-[#C7CFDA] leading-relaxed whitespace-pre-wrap">
{`Власник ........ Вартість компанії
E-com lead ..... CM3 · LTV:CAC ≥ 3
Performance .... CAC / ROAS поріг
CRM ............ Частка виручки email 30%+
SEO ............ Топ-5 по ядру · орг. 50%+
Ops ............ Точність замовлень >99%`}
                </pre>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#FF6A3D] mt-4 mb-1.5">
                  Дисципліна капіталу
                </p>
                <p className="text-[0.7rem] text-[#8C96A5] leading-relaxed">
                  LTV:CAC ≥ 3 · 6 тижнів тесту каналу · транші під DoD · країна за країною
                </p>
              </div>
            </div>
          </Terminal>
        </FadeIn>
      </Section>

      {/* ---- Цифри системи ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>Масштаб продукту · У цифрах</Eyebrow>
          <SectionTitle>Система, яку можна перерахувати</SectionTitle>
        </FadeIn>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-10">
          {SYSTEM_NUMBERS.map((n, i) => (
            <FadeIn key={n.label} delay={i * 0.05}>
              <Stat countTo={n.to} label={n.label} color={n.color} />
            </FadeIn>
          ))}
        </div>
      </Section>
    </>
  );
}
