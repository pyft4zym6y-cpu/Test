import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle, Bar, Terminal, Chip } from './ui';
import { say, sayIdle } from './speech';
import { track } from './analytics';

/*
 * Демо «OS зсередини»: інтерактивний BI-дашборд на демо-даних (збірний кейс)
 * + один плейбук у розгорнутому вигляді. Всі цифри позначені як демо.
 */

const TABS = ['Воронка', 'Юніт-економіка', 'Когорти'] as const;

const TAB_SAYS: Record<string, string> = {
  Воронка: 'Воронка проти еталона: одразу видно, де саме тече. Тут — крок кошик → чекаут.',
  'Юніт-економіка': 'LTV:CAC ≥3 — правило масштабування. Канал, що не проходить поріг, закривається.',
  Когорти: 'Когорти показують, чи повертаються клієнти. Зелений стовпчик M1 — робота retention-контуру.',
};

const FUNNEL = [
  { stage: 'Сесії', pct: 100, vs: '—' },
  { stage: 'Перегляд картки', pct: 42, vs: 'еталон 45%' },
  { stage: 'Додали в кошик', pct: 8.1, vs: 'еталон 9%' },
  { stage: 'Дійшли до чекаута', pct: 4.6, vs: 'еталон 6,3% 🔴' },
  { stage: 'Купили', pct: 3.4, vs: 'еталон 4,2%' },
];

const UNIT = [
  { k: 'CAC · вартість клієнта', v: '€9', bar: 64, note: 'ціль ≤ €12' },
  { k: 'LTV · 12 міс', v: '€31', bar: 78, note: 'ціль €40' },
  { k: 'LTV : CAC', v: '3.4×', bar: 85, note: 'поріг масштабування ≥3' },
  { k: 'Маржинальність замовлення', v: '58%', bar: 72, note: 'після логістики й повернень' },
];

/* Retention когорт: місяць придбання × місяці після (частка активних, %) */
const COHORTS: number[][] = [
  [100, 24, 15, 11, 9, 7],
  [100, 26, 17, 12, 10, 8],
  [100, 29, 19, 14, 11, -1],
  [100, 33, 22, 16, -1, -1],
  [100, 38, 26, -1, -1, -1],
  [100, 44, -1, -1, -1, -1],
];

function cohortColor(v: number) {
  if (v < 0) return 'transparent';
  if (v >= 100) return 'rgba(18,22,28,0.9)';
  const t = Math.min(v / 45, 1);
  return `rgba(101, 163, 13, ${0.12 + t * 0.75})`;
}

const PB_WEEKS = [
  { w: 'Т1', t: 'Аудит бази: RFM-сегменти, точки відтоку, картування циклу покупки' },
  { w: 'Т2', t: 'Каркас контуру: welcome / after-purchase / winback ланцюжки' },
  { w: 'Т3–4', t: 'Запуск ланцюжків + програма другої покупки (тригер 21–45 днів)' },
  { w: 'Т5', t: 'A/B оферів і каденції, сегментні прайси, NPS-петля' },
  { w: 'Т6', t: 'Дашборд retention у BI, передача плейбука команді, DoD-приймання' },
];

export default function DemoOS() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Воронка');
  const [pbOpen, setPbOpen] = useState(false);

  return (
    <Section className="grid-bg" data-bot-say="Це не слайди — так виглядає робочий контур OS: дашборд, у якому живе клієнт, і плейбук, за яким працює команда.">
      <FadeIn>
        <Eyebrow>Демо · OS зсередини</Eyebrow>
        <SectionTitle>Як це виглядає в роботі</SectionTitle>
        <p className="text-[#5A6472] mt-5 max-w-2xl leading-relaxed">
          Не обіцянки, а робочі артефакти: BI-дашборд, у якому власник бачить бізнес щотижня, і
          плейбук — інструкція, за якою команда доставляє результат. Цифри нижче — демо-дані
          збірного кейсу.
        </p>
      </FadeIn>

      {/* BI-дашборд */}
      <FadeIn delay={0.15}>
        <Terminal title="weexp·os / bi-dashboard — демо-дані" className="mt-10">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex gap-2 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTab(t);
                    say(TAB_SAYS[t]);
                    track('demo_tab', { tab: t });
                  }}
                  onMouseLeave={sayIdle}
                  className={`font-mono text-xs px-4 py-2 border transition-colors ${
                    tab === t
                      ? 'bg-[#12161C] text-white border-[#12161C]'
                      : 'border-black/15 text-[#5A6472] hover:border-black/40'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className="font-pixel text-[0.42rem] px-2.5 py-1.5 border border-[#B45309]/50 text-[#B45309]">
              ДЕМО-ДАНІ
            </span>
          </div>

          {tab === 'Воронка' && (
            <div className="flex flex-col gap-4">
              {FUNNEL.map((f) => (
                <div key={f.stage}>
                  <div className="flex justify-between font-mono text-[0.68rem] uppercase tracking-wider text-[#5A6472] mb-1.5">
                    <span>{f.stage}</span>
                    <span>
                      {f.pct}% <span className="text-black/40 normal-case">· {f.vs}</span>
                    </span>
                  </div>
                  <Bar percent={f.pct} height={10} />
                </div>
              ))}
              <p className="font-mono text-[0.66rem] text-[#B45309] mt-1">
                → Найбільша втрата: кошик → чекаут. У реальному аудиті цей крок переводиться в
                гривні та плейбук.
              </p>
            </div>
          )}

          {tab === 'Юніт-економіка' && (
            <div className="grid sm:grid-cols-2 gap-5">
              {UNIT.map((u) => (
                <div key={u.k} className="card p-5">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#5A6472]">
                    {u.k}
                  </p>
                  <p className="font-mono font-bold text-3xl text-[#12161C] mt-1.5 mb-3">{u.v}</p>
                  <Bar percent={u.bar} height={6} />
                  <p className="font-mono text-[0.62rem] text-[#5A6472] mt-2">{u.note}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'Когорти' && (
            <div>
              <div className="overflow-x-auto">
                <div className="min-w-[420px]">
                  <div className="grid grid-cols-7 gap-1.5 font-mono text-[0.6rem] text-[#5A6472] mb-1.5">
                    <span>Когорта</span>
                    {['M0', 'M1', 'M2', 'M3', 'M4', 'M5'].map((m) => (
                      <span key={m} className="text-center">{m}</span>
                    ))}
                  </div>
                  {COHORTS.map((row, i) => (
                    <div key={i} className="grid grid-cols-7 gap-1.5 mb-1.5">
                      <span className="font-mono text-[0.62rem] text-[#5A6472] self-center">
                        {`0${i + 1}`}.2026
                      </span>
                      {row.map((v, j) => (
                        <div
                          key={j}
                          className="h-8 flex items-center justify-center font-mono text-[0.62rem]"
                          style={{
                            background: cohortColor(v),
                            color: v >= 100 ? '#fff' : v > 30 ? '#12161C' : '#5A6472',
                          }}
                        >
                          {v >= 0 ? `${v}%` : ''}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <p className="font-mono text-[0.66rem] text-[#4D7C0F] mt-3">
                → M1-retention росте 24% → 44%: контур повторних покупок запущено у 3-й когорті.
              </p>
            </div>
          )}
        </Terminal>
      </FadeIn>

      {/* Плейбук зсередини */}
      <FadeIn delay={0.25}>
        <div className="card accent-left p-7 mt-8" style={{ '--accent': 'var(--purple)' } as React.CSSProperties}>
          <button
            type="button"
            onClick={() => {
              setPbOpen(!pbOpen);
              if (!pbOpen) track('demo_playbook_open', {});
            }}
            className="w-full flex items-center justify-between gap-4 text-left"
            aria-expanded={pbOpen}
          >
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#7C3AED] mb-1.5">
                Плейбук зсередини · один із 56
              </p>
              <p className="font-extrabold text-xl md:text-2xl">
                PB-08 · Retention Engine: контур повторних покупок
              </p>
            </div>
            <ChevronDown
              size={22}
              className={`shrink-0 text-black/50 transition-transform ${pbOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {pbOpen && (
            <div className="mt-7 grid lg:grid-cols-2 gap-8">
              <div>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#5A6472] mb-3">
                  Коли вмикається
                </p>
                <p className="text-sm text-[#2F3742] leading-relaxed mb-6">
                  Повторні замовлення &lt; 25% · email/CRM дає &lt; 15% виручки · база клієнтів є,
                  але їй ніхто не пише. Строк: 6 тижнів.
                </p>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#5A6472] mb-3">
                  Кроки по тижнях
                </p>
                <div className="flex flex-col gap-3">
                  {PB_WEEKS.map((s) => (
                    <div key={s.w} className="flex gap-4 items-baseline">
                      <span className="font-pixel text-[0.5rem] text-[#7C3AED] shrink-0 w-10">{s.w}</span>
                      <span className="text-sm text-[#2F3742] leading-relaxed">{s.t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#5A6472] mb-3">
                  Definition of Done
                </p>
                <ul className="text-sm text-[#2F3742] leading-relaxed flex flex-col gap-2 mb-6">
                  <li>· Повторні замовлення +8–15 п.п. до базової лінії</li>
                  <li>· ≥3 автоланцюжки живуть без ручного запуску</li>
                  <li>· Retention-дашборд оновлюється щотижня сам</li>
                  <li>· Команда клієнта веде контур без нас</li>
                </ul>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#5A6472] mb-3">
                  Deliverables
                </p>
                <div className="flex flex-wrap gap-2">
                  {['RFM-сегментація', 'Карта ланцюжків', 'Каденція й офери', 'BI-дашборд retention', 'Регламент передачі'].map(
                    (d) => (
                      <Chip key={d}>{d}</Chip>
                    ),
                  )}
                </div>
                <p className="text-[#5A6472] text-[0.7rem] leading-relaxed mt-6">
                  Так виглядає кожен із 56 плейбуків: тригери → кроки → DoD → артефакти. Повна
                  бібліотека розкривається в програмі.
                </p>
              </div>
            </div>
          )}
        </div>
      </FadeIn>
    </Section>
  );
}
