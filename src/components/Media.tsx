import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle } from './ui';

/*
 * NOTE: підтверджений факт — лише спікерство в бізнес-клубі RISE (з презентації).
 * Решта подій — заповнювачі-приклади: замініть на реальні виступи, теми й роки.
 */
const TALKS = [
  {
    event: 'Бізнес-клуб RISE',
    where: 'Київ',
    year: '2025–2026',
    role: 'Спікер',
    topic: '«Commerce OS: система замість хаосу»',
    color: '#65A30D',
  },
  {
    event: 'E-commerce Growth Forum',
    where: 'Київ',
    year: '2025',
    role: 'Доповідь',
    topic: '«Юніт-економіка як мова власника»',
    color: '#0F9488',
  },
  {
    event: 'Marketplace Summit',
    where: 'Warszawa',
    year: '2024',
    role: 'Панель',
    topic: '«Вихід українських брендів у ЄС»',
    color: '#B45309',
  },
  {
    event: 'Подкаст «Власна справа»',
    where: 'YouTube',
    year: '2025',
    role: 'Гість',
    topic: '«Retention: гроші, які вже у вас є»',
    color: '#6D28D9',
  },
];

const FORMATS = [
  'Конференції · доповіді',
  'Панельні дискусії',
  'Подкасти · інтерв’ю',
  'Закриті бізнес-клуби',
  'Корпоративні воркшопи',
];

export default function Media() {
  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <FadeIn>
          <Eyebrow>Медіа · Виступи</Eyebrow>
          <SectionTitle>Говоримо про системний ріст —
            <br />
            зі сцени та в медіа
          </SectionTitle>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="text-right">
            <p className="font-mono font-bold text-6xl text-[#B45309]">10+</p>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#5A6472]">
              Виступів · 2024–2026
            </p>
          </div>
        </FadeIn>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
        {TALKS.map((t, i) => (
          <FadeIn key={t.event} delay={i * 0.08}>
            <div className="card card-hover accent-top p-6 h-full flex flex-col" style={{ '--accent': t.color } as React.CSSProperties}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em]" style={{ color: t.color }}>
                  {t.role}
                </p>
                <p className="font-mono text-[0.6rem] text-[#5A6472]">{t.year}</p>
              </div>
              <p className="font-extrabold text-lg mt-2 leading-snug">{t.event}</p>
              <p className="font-mono text-[0.62rem] text-[#5A6472] mt-0.5">{t.where}</p>
              <p className="font-serif-it text-sm text-[#3F4854] mt-3 leading-relaxed flex-1">
                {t.topic}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.3}>
        <div className="flex flex-wrap items-center gap-2.5 mt-8">
          {FORMATS.map((f) => (
            <span key={f} className="chip-dark px-4 py-2 font-mono text-xs text-[#2F3742]">
              {f}
            </span>
          ))}
          <span className="text-[#5A6472] text-xs ml-2">
            Запросити спікером —{' '}
            <a href="mailto:pashasidorenko18@gmail.com?subject=Запрошення спікером" className="text-[#65A30D] hover:text-[#4d7c0f] transition-colors">
              напишіть
            </a>
          </span>
        </div>
      </FadeIn>
    </Section>
  );
}
