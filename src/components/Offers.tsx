import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle } from './ui';

const DOORS = [
  {
    period: '4–6 тижнів',
    name: 'Diagnostic Sprint',
    color: '#3DDAD0',
    rows: [
      { k: 'Scope', v: 'Health Score, аудит, розрив→₴, roadmap' },
      { k: 'Deliverable', v: 'D-01 Discovery Report + Roadmap (PDF)' },
      { k: 'Інвестиція', v: 'фіксована · від $2K' },
      { k: 'Next', v: '30-хв дзвінок' },
    ],
  },
  {
    period: '6–12 місяців',
    name: 'Program of Record',
    color: '#A3E635',
    featured: true,
    rows: [
      { k: 'Scope', v: 'Повна трансформація, пласти в синхроні' },
      { k: 'Deliverable', v: 'Система активів + KPI + BI-дашборд' },
      { k: 'Інвестиція', v: 'проєкт / ретейнер · обговорюється' },
      { k: 'Next', v: 'після Discovery' },
    ],
  },
  {
    period: '1–3 дні/тиждень',
    name: 'Fractional Lead',
    color: '#8B7CF6',
    rows: [
      { k: 'Scope', v: 'Стратегічне лідерство + відповідальність за P&L' },
      { k: 'Deliverable', v: 'Керування, синхрон, звітність' },
      { k: 'Інвестиція', v: 'ретейнер · $6–20K/міс (орієнтир)' },
      { k: 'Next', v: 'пілот 1 місяць' },
    ],
  },
];

const OFFER_CELLS = [
  { label: 'Що входить', text: 'Діагностика · аудит у грошах · roadmap · виконання пластів · керування (RACI/KPI) · BI-дашборд', color: '#A3E635' },
  { label: 'Етапи', text: '5: Discovery → Audit → Roadmap → Implementation → Governance', color: '#3DDAD0' },
  { label: 'Строки', text: 'Discovery 4–6 тижнів · програма 6–12 міс · перший результат 30–60 днів', color: '#F5B84B' },
  { label: 'Бюджет', text: 'Discovery від $2K · Fractional $6–20K/міс · програма — проєкт/ретейнер (обговорюється)', color: '#FF6A3D' },
  { label: 'Формат', text: 'Diagnostic Sprint · Program of Record · Fractional Lead — під вашу ситуацію', color: '#8B7CF6' },
  { label: 'Наступний крок', text: '30-хв стратегічна сесія → Discovery Sprint', color: '#A3E635' },
];

const FAQ = [
  { q: 'Скільки це коштує?', a: 'Старт від Diagnostic Sprint. Інвестиція завжди зіставляється з упущеним оборотом.' },
  { q: 'Коли буде результат?', a: 'Перший вимірюваний — за 30–60 днів. Швидкі перемоги в першій хвилі.' },
  { q: 'У нас своя CMS / специфіка', a: 'Платформо-незалежний підхід. Міграція — лише за реальної потреби.' },
  { q: 'Хто виконує роботу?', a: 'Ядро weexp + керована мережа підрядників з OKR і DoD.' },
  { q: 'Це не задорого для нас?', a: 'Починаємо з малого; швидкі перемоги фінансують наступні хвилі.' },
  { q: 'Які гарантії?', a: 'DoD на кожному етапі, транші під результат, дисципліна капіталу.' },
];

export default function Offers() {
  return (
    <>
      {/* ---- Три двері ---- */}
      <Section id="offers">
        <FadeIn>
          <Eyebrow>Як працюємо · Scope · Deliverable · Інвестиція · Next</Eyebrow>
          <SectionTitle>Три двері — прозорі умови</SectionTitle>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-5 mt-10 items-stretch">
          {DOORS.map((d, i) => (
            <FadeIn key={d.name} delay={i * 0.1}>
              <div
                className={`card card-hover accent-top p-7 h-full ${d.featured ? 'lg:scale-[1.03]' : ''}`}
                style={
                  {
                    '--accent': d.color,
                    ...(d.featured ? { borderColor: 'rgba(163,230,53,0.4)' } : {}),
                  } as React.CSSProperties
                }
              >
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em]" style={{ color: d.color }}>
                  {d.period}
                </p>
                <p className="font-extrabold text-2xl mt-1.5 mb-5">{d.name}</p>
                <div className="flex flex-col">
                  {d.rows.map((r, ri) => (
                    <div key={r.k} className={`py-3 ${ri > 0 ? 'border-t border-[#1C2129]' : ''}`}>
                      <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-[#66707E] mb-1">
                        {r.k}
                      </p>
                      <p className="text-sm text-[#C7CFDA] leading-snug">{r.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.3}>
          <div className="card p-5 mt-6 flex flex-wrap gap-x-6 gap-y-2 items-baseline">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#F5B84B]">
              Завжди
            </span>
            <span className="text-[#B7C0CC] text-sm">
              Інвестиція зіставляється з упущеним оборотом із калькулятора. Кожен етап — з DoD і
              траншами під результат. Перший вимірюваний результат — за 30–60 днів.
            </span>
          </div>
        </FadeIn>
      </Section>

      {/* ---- Комерційна пропозиція ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>Комерційна пропозиція · Прозоро</Eyebrow>
          <SectionTitle>Що ви отримуєте і як почати</SectionTitle>
        </FadeIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {OFFER_CELLS.map((c, i) => (
            <FadeIn key={c.label} delay={i * 0.06}>
              <div className="card card-hover accent-left p-6 h-full" style={{ '--accent': c.color } as React.CSSProperties}>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] mb-2.5" style={{ color: c.color }}>
                  {c.label}
                </p>
                <p className="text-[#B7C0CC] text-sm leading-relaxed">{c.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.3}>
          <div
            className="card p-7 mt-6 flex flex-col md:flex-row gap-5 md:items-center"
            style={{ borderColor: 'rgba(163,230,53,0.35)' }}
          >
            <p className="font-extrabold text-2xl lime-text shrink-0">Почнімо з аудиту</p>
            <p className="text-[#8C96A5] text-sm leading-relaxed">
              Інвестиція завжди зіставляється з упущеним оборотом. Кожен етап — з DoD і траншами
              під результат. Ви бачите цифри до того, як вкладаєте бюджет у виконання.
            </p>
          </div>
        </FadeIn>
      </Section>

      {/* ---- FAQ ---- */}
      <Section>
        <FadeIn>
          <Eyebrow>FAQ · Знімаємо заперечення</Eyebrow>
        </FadeIn>
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
          <div className="grid sm:grid-cols-2 gap-4">
            {FAQ.map((f, i) => (
              <FadeIn key={f.q} delay={i * 0.06}>
                <div className="card card-hover p-6 h-full">
                  <p className="font-bold">{f.q}</p>
                  <p className="text-[#8C96A5] text-sm mt-2 leading-relaxed">{f.a}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.2} x={40} y={0}>
            <div
              className="card accent-top p-8 h-full"
              style={{ '--accent': 'var(--purple)', background: 'linear-gradient(160deg, #181524, #14181F)' } as React.CSSProperties}
            >
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#F5B84B] mb-4">
                Обмежена доступність
              </p>
              <p className="font-extrabold text-2xl">Глибина замість потоку</p>
              <p className="text-[#8C96A5] text-sm mt-3 leading-relaxed">
                Беру обмежену кількість активних мандатів одночасно — щоб кожен клієнт отримав
                увагу рівня P&amp;L-власника, а не «ще один проєкт у черзі».
              </p>
              <hr className="border-[#2A2438] my-5" />
              <div className="flex items-center gap-4">
                <p className="font-mono font-bold text-4xl text-[#A3E635]">1 : 1</p>
                <p className="text-[#66707E] text-xs leading-snug">
                  один власник —
                  <br />
                  один фокус на результат
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>
    </>
  );
}
