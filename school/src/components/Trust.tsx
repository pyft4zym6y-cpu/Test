import { GUARANTEE, INCLUDED, RESULTS, SCHOOL, TOOLSTACK } from '../data/school';
import { WeexpLogo } from './CareerTrack';
import { Eyebrow, H2, Hand, Pop, Section } from './comic';

/* Значок сертифіката: зубчаста розетка зі стрічками */
export function CertBadge({ size = 96 }: { size?: number }) {
  const points = 24;
  const outer = 46;
  const inner = 40;
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${50 + r * Math.cos(a)},${48 + r * Math.sin(a)}`);
  }
  return (
    <svg viewBox="0 0 100 118" width={size} height={size * 1.18} aria-hidden="true">
      {/* стрічки */}
      <polygon points="34,78 46,84 40,114 32,102 22,108" fill="#FF0000" stroke="#111" strokeWidth="2.5" />
      <polygon points="66,78 54,84 60,114 68,102 78,108" fill="#FF0000" stroke="#111" strokeWidth="2.5" />
      {/* розетка */}
      <polygon points={pts.join(' ')} fill="#FFD100" stroke="#111" strokeWidth="2.5" />
      <circle cx="50" cy="48" r="30" fill="#fff" stroke="#111" strokeWidth="2.5" />
      <text x="50" y="43" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="9.5" fill="#111">
        CERTIFIED
      </text>
      <text x="50" y="54" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="7.5" fill="#FF0000">
        E-COMMERCE
      </text>
      <text x="50" y="64" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="7.5" fill="#111">
        DIRECTOR
      </text>
    </svg>
  );
}

/* Полоса довіри: сертифікат, чек-листи, партнер, гарантія, розстрочка */
export function TrustStrip() {
  const items = [
    {
      icon: <CertBadge size={40} />,
      title: 'Сертифікат школи',
      note: 'з переліком компетенцій',
    },
    {
      icon: <span className="font-oswald font-bold text-[26px] text-brand leading-none">✓</span>,
      title: 'Чек-листи компетенцій',
      note: 'після кожного рівня',
    },
    {
      icon: <WeexpLogo size={26} fill="#111" />,
      title: 'Карʼєрний партнер',
      note: 'weexp.agency',
    },
    {
      icon: <span className="font-oswald font-bold text-[22px] leading-none">14</span>,
      title: 'Гарантія 14 днів',
      note: 'повне повернення',
    },
    {
      icon: <span className="font-oswald font-bold text-[22px] text-brand leading-none">½</span>,
      title: 'Оплата частинами',
      note: '2–3 платежі',
    },
  ];
  return (
    <div className="border-y-[3px] border-ink bg-white">
      <div className="max-w-[1150px] mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-5">
        {items.map((it) => (
          <div key={it.title} className="flex items-center gap-3">
            <div className="shrink-0 w-11 h-11 flex items-center justify-center comic-border bg-paper">
              {it.icon}
            </div>
            <div>
              <div className="text-[12.5px] font-extrabold uppercase tracking-wide leading-tight">
                {it.title}
              </div>
              <div className="text-[11.5px] text-ink/55 font-semibold">{it.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Що входить у курс */
export function Included() {
  return (
    <Section className="halftone">
      <Pop>
        <Eyebrow>Що входить</Eyebrow>
        <H2>
          Не «доступ до відео», а <span className="redmark">система</span>
        </H2>
      </Pop>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {INCLUDED.map((it, i) => (
          <Pop key={it.title} delay={(i % 4) * 0.07}>
            <div className="comic-border bg-white hard-shadow-sm p-6 h-full">
              <div className="font-oswald font-bold text-[32px] leading-none text-brand mb-3">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="font-oswald font-bold uppercase text-[16px] leading-tight mb-2">
                {it.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-ink/70">{it.text}</p>
            </div>
          </Pop>
        ))}
      </div>
      <Pop className="mt-10">
        <div className="flex flex-wrap gap-2.5">
          {TOOLSTACK.map((t) => (
            <span
              key={t}
              className="comic-border bg-paper px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wider"
            >
              {t}
            </span>
          ))}
          <span className="px-3 py-1.5 text-[12px] font-semibold text-ink/55">
            — інструменти та фреймворки всередині програми
          </span>
        </div>
      </Pop>
    </Section>
  );
}

/* Результати методології на живих бізнесах */
export function Results() {
  return (
    <Section className="bg-ink text-white">
      <Pop>
        <Eyebrow>Перевірено практикою</Eyebrow>
        <H2 className="text-white">
          Методологія, що вже <span className="redmark">заробила</span> клієнтам
        </H2>
        <p className="text-white/75 text-[15.5px] leading-relaxed max-w-2xl mb-12 font-semibold">
          {RESULTS.lead}
        </p>
      </Pop>
      <div className="grid md:grid-cols-4 gap-6">
        {RESULTS.items.map((r, i) => (
          <Pop key={r.value} delay={i * 0.08}>
            <div
              className={`comic-border bg-white text-ink hard-shadow-red p-6 h-full ${
                i % 2 === 0 ? '-rotate-[0.6deg]' : 'rotate-[0.6deg]'
              }`}
            >
              <div className="font-oswald font-bold text-[44px] leading-none text-brand mb-2">
                {r.value}
              </div>
              <p className="text-[13px] leading-relaxed text-ink/75 font-semibold">{r.label}</p>
            </div>
          </Pop>
        ))}
      </div>
      <Pop className="mt-8">
        <Hand className="text-white/80">
          …тепер ця методологія — твоя навчальна програма.
        </Hand>
      </Pop>
    </Section>
  );
}

/* Гарантія повернення */
export function Guarantee() {
  return (
    <Section className="!py-16">
      <Pop>
        <div className="comic-border bg-white hard-shadow p-8 md:p-10 grid md:grid-cols-[auto_1fr] gap-8 items-center">
          <div className="justify-self-center">
            <CertBadge size={110} />
          </div>
          <div>
            <div className="inline-block comic-border bg-brand text-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em] mb-4 -rotate-1">
              Без ризику
            </div>
            <h3 className="font-oswald font-bold uppercase text-[28px] leading-tight mb-3">
              {GUARANTEE.title}
            </h3>
            <p className="text-[15px] leading-relaxed text-ink/75 font-semibold max-w-2xl">
              {GUARANTEE.text}
            </p>
            <p className="text-[13px] text-ink/50 font-semibold mt-3">
              Питання щодо повернення — напряму засновнику: {SCHOOL.contacts.email}
            </p>
          </div>
        </div>
      </Pop>
    </Section>
  );
}
