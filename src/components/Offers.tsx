import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle } from './ui';

/*
 * Три формати співпраці. Логіка розподілу — за тим, ХТО несе фінальну
 * відповідальність за результат:
 *   01 Аудит        — разовий проєкт, далі клієнт діє сам;
 *   02 Консалтинг   — ми архітектор і контроль, руки та результат — команда клієнта;
 *   03 Управління   — проєкт ведемо ми, фінальна відповідальність наша.
 */
const MODELS = [
  {
    n: '01',
    name: 'Аудит',
    tagline: 'Diagnostic · разовий проєкт',
    period: '4–6 тижнів',
    price: '$2–6K',
    priceNote: 'фіксована сума — узгоджується до старту й не змінюється',
    color: '#0F9488',
    forWhom: 'У вас сильна внутрішня команда. Потрібні не руки, а карта: де саме втрачаються гроші та що робити першим.',
    includes: [
      'Discovery-портал: опитувальники, передача доступів, бриф ЛПР',
      'Health Score і зрілість по 18 доменах',
      'Розрив у грошах: 8 важелів, baseline, прогноз на 12 міс',
      'Повний пакет документів аудиту — 19 артефактів',
      'Роадмапа хвилями: пріоритети, бюджет, строки, команда',
    ],
    handover: 'Передача документів + 4 години консультацій із розбором: проходимо висновки, відповідаємо на питання команди.',
    responsibility: 'Впровадження та результат — ваша команда. Ми доступні для апгрейду у формат 02/03.',
  },
  {
    n: '02',
    name: 'Консалтинг і супровід',
    tagline: 'Advisory · зовнішній експерт',
    period: 'помісячно · від 1 міс',
    price: '$45/год',
    priceNote: 'мінімум 30 год/міс — рахунок не буває менше $1,350/міс; понад мінімум — за фактом годин',
    color: '#65A30D',
    featured: true,
    forWhom: 'У вас є виконавці та проджект-менеджер. Потрібен архітектор: що робити, в якому порядку і чи якісно зроблено.',
    includes: [
      'Щотижневі спринт-сесії: пріоритети, розбори, рішення',
      'Роадмапа та беклог трансформації під нашим контролем',
      'Ревʼю виконаного проти DoD і еталонів Commerce OS',
      'Доступ до плейбуків, стандартів і чеклістів',
      'Прозорий звіт по годинах щомісяця',
    ],
    handover: 'Обовʼязкова умова: на вашому боці є виділений проджект або відповідальний, який керує виконанням. Без нього рекомендації зависають у повітрі — тоді чесніше одразу формат 03.',
    responsibility: 'Якість рішень і контроль — ми. Виконання руками та результат — ваша команда.',
  },
  {
    n: '03',
    name: 'Управління проєктом',
    tagline: 'Managed · трансформація під ключ',
    period: '6–12 місяців',
    price: 'від $3,000/міс',
    priceNote: 'залежить від масштабу проєкту; фіксується після аудиту',
    color: '#6D28D9',
    forWhom: 'Нема кому вести це зсередини. Потрібен результат, а не поради — і один відповідальний за нього.',
    includes: [
      'Керуємо всім проєктом: план, люди, бюджет, ризики',
      'Команда: ваші люди + наша мережа підрядників з OKR і DoD',
      'KPI та RACI на кожну хвилю, транші під результат',
      'Швидкі перемоги першої хвилі фінансують наступні',
      'Щомісячна звітність власнику: цифри проти плану',
    ],
    handover: 'Старт — тільки після аудиту (формат 01): без діагностики керувати проєктом означає вести його навмання.',
    responsibility: 'Фінальна відповідальність за результат — на нас.',
  },
];

const COMPARE = [
  { k: 'Відповідальний за результат', v: ['Ваша команда', 'Ваша команда · ми — за якість рішень', 'Ми'] },
  { k: 'Хто виконує руками', v: ['Ваша команда', 'Ваша команда під нашим контролем', 'Ваші люди + наші підрядники'] },
  { k: 'Що потрібно від вас', v: ['Дані й доступи', 'Проджект + виконавці', 'Рішення та бюджет'] },
  { k: 'Модель оплати', v: ['Фіксована за проєкт', '$45/год · мін. 30 год/міс', 'від $3,000/міс'] },
  { k: 'Мінімальний вхід', v: ['$2–6K', '$1,350/міс', '$3,000/міс'] },
];

const FAQ = [
  { q: 'Скільки це коштує?', a: 'Аудит — фіксовано $2–6K. Консалтинг — $45/год з мінімумом 30 год/міс. Управління — від $3,000/міс залежно від масштабу.' },
  { q: 'Коли буде результат?', a: 'Перший вимірюваний — за 30–60 днів. Швидкі перемоги в першій хвилі.' },
  { q: 'У нас своя CMS / специфіка', a: 'Платформо-незалежний підхід. Міграція — лише за реальної потреби.' },
  { q: 'Хто виконує роботу?', a: 'Залежить від формату: в аудиті й консалтингу — ваша команда, в управлінні — ваші люди + керована мережа підрядників з OKR і DoD.' },
  { q: 'Це не задорого для нас?', a: 'Починаємо з аудиту; інвестиція завжди зіставляється з упущеним оборотом із калькулятора.' },
  { q: 'Які гарантії?', a: 'DoD на кожному етапі, транші під результат, дисципліна капіталу.' },
];

export default function Offers() {
  return (
    <>
      {/* ---- Три формати ---- */}
      <Section id="offers">
        <FadeIn>
          <Eyebrow>Формати співпраці · Хто відповідає за результат</Eyebrow>
          <SectionTitle as="h1">Три формати — за рівнем нашої відповідальності</SectionTitle>
          <p className="text-[#5A6472] text-sm md:text-base mt-4 max-w-3xl leading-relaxed">
            Різниця між форматами — не в «пакетах послуг», а в тому, хто несе фінальну
            відповідальність за результат: ваша команда з нашою картою, ваша команда під нашим
            контролем — чи ми повністю.
          </p>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-5 mt-10 items-stretch">
          {MODELS.map((m, i) => (
            <FadeIn key={m.n} delay={i * 0.1}>
              <div
                className={`card card-hover accent-top p-7 h-full flex flex-col ${m.featured ? 'lg:scale-[1.03]' : ''}`}
                style={
                  {
                    '--accent': m.color,
                    ...(m.featured ? { borderColor: 'rgba(101,163,13,0.4)' } : {}),
                  } as React.CSSProperties
                }
              >
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em]" style={{ color: m.color }}>
                  {m.n} · {m.tagline}
                </p>
                <p className="font-extrabold text-2xl mt-1.5">{m.name}</p>
                <div className="flex items-baseline gap-3 mt-3">
                  <span className="font-mono font-bold text-xl" style={{ color: m.color }}>{m.price}</span>
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#5A6472]">{m.period}</span>
                </div>
                <p className="text-[#5A6472] text-xs mt-1.5 leading-snug">{m.priceNote}</p>

                <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-[#5A6472] mt-5 mb-1.5">Кому підходить</p>
                <p className="text-sm text-[#2F3742] leading-snug">{m.forWhom}</p>

                <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-[#5A6472] mt-4 mb-1.5">Що входить</p>
                <ul className="flex flex-col gap-1.5">
                  {m.includes.map((it) => (
                    <li key={it} className="text-sm text-[#2F3742] leading-snug flex gap-2">
                      <span className="shrink-0" style={{ color: m.color }}>—</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>

                <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-[#5A6472] mt-4 mb-1.5">Формат роботи</p>
                <p className="text-sm text-[#2F3742] leading-snug">{m.handover}</p>

                <div className="mt-auto pt-4">
                  <p className="text-xs leading-snug border-t border-[#ECEEF0] pt-3 font-semibold" style={{ color: m.color }}>
                    {m.responsibility}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* ---- Порівняльна таблиця ---- */}
        <FadeIn delay={0.2}>
          <div className="card p-0 mt-8 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-[#ECEEF0]">
                  <th className="text-left p-4 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-[#5A6472] font-normal" />
                  {MODELS.map((m) => (
                    <th key={m.n} className="text-left p-4 font-extrabold" style={{ color: m.color }}>
                      {m.n} · {m.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.k} className="border-b border-[#F2F4F6] last:border-0">
                    <td className="p-4 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#5A6472] align-top">{row.k}</td>
                    {row.v.map((cell, ci) => (
                      <td key={ci} className="p-4 text-[#2F3742] leading-snug align-top">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="card p-5 mt-6 flex flex-wrap gap-x-6 gap-y-2 items-baseline">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#B45309]">
              Завжди
            </span>
            <span className="text-[#3F4854] text-sm">
              Будь-яка співпраця починається з аудиту — без діагностики ми не консультуємо і не
              беремо управління. Інвестиція зіставляється з упущеним оборотом із калькулятора,
              кожен етап — з DoD і траншами під результат.
            </span>
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
                  <p className="text-[#5A6472] text-sm mt-2 leading-relaxed">{f.a}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.2} x={40} y={0}>
            <div
              className="card accent-top p-8 h-full"
              style={{ '--accent': 'var(--purple)', background: 'linear-gradient(160deg, #181524, #FFFFFF)' } as React.CSSProperties}
            >
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#B45309] mb-4">
                Обмежена доступність
              </p>
              <p className="font-extrabold text-2xl">Глибина замість потоку</p>
              <p className="text-[#5A6472] text-sm mt-3 leading-relaxed">
                Беру обмежену кількість активних мандатів одночасно — щоб кожен клієнт отримав
                увагу рівня P&amp;L-власника, а не «ще один проєкт у черзі».
              </p>
              <hr className="border-[#E4E7EA] my-5" />
              <div className="flex items-center gap-4">
                <p className="font-mono font-bold text-4xl text-[#4D7C0F]">1 : 1</p>
                <p className="text-[#5A6472] text-xs leading-snug">
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
