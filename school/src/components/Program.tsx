import { LEVELS, TOTALS, type TrackId } from '../data/program';
import { Eyebrow, FadeIn, Section, Title } from './Section';

const TRACKS: { id: TrackId; label: string; range: string }[] = [
  { id: 'base', label: 'Базовий блок', range: 'Рівні 1–4' },
  { id: 'middle', label: 'Середній блок', range: 'Рівні 5–8' },
  { id: 'advanced', label: 'Просунутий блок', range: 'Рівні 9–12' },
];

const STATS = [
  { value: TOTALS.levels, label: 'рівнів компетентності' },
  { value: TOTALS.modules, label: 'навчальних модулів' },
  { value: TOTALS.questions, label: 'екзаменаційних питань' },
];

export default function Program() {
  return (
    <Section id="program" className="bg-[#0a0a0a] border-t border-white/10">
      <FadeIn>
        <Eyebrow>Програма навчання</Eyebrow>
        <Title>
          Від новачка
          <br />
          до E-Commerce Director
        </Title>
        <p className="text-white/70 max-w-2xl leading-relaxed">
          Покрокова структура: кожен наступний рівень спирається на попередній. Новачок починає з
          будови сайту та шляху покупця — і послідовно опановує UX, аналітику, SEO, маркетинг, CRM,
          фінанси, операції та стратегію. Після кожного рівня — чек-лист компетенцій.
        </p>
      </FadeIn>

      <div className="grid grid-cols-3 gap-6 my-16">
        {STATS.map((s, i) => (
          <FadeIn key={s.label} delay={i * 0.1}>
            <div className="border-t-2 border-[#FF0000] pt-5">
              <div className="font-italiana text-5xl md:text-7xl">{s.value}</div>
              <div className="text-white/50 text-[12px] uppercase tracking-wider mt-2">
                {s.label}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {TRACKS.map((track) => (
        <div key={track.id} className="mb-14 last:mb-0">
          <FadeIn>
            <div className="flex items-baseline gap-4 mb-6">
              <h3 className="font-italiana text-2xl">{track.label}</h3>
              <span className="text-[#FF0000] text-[12px] uppercase tracking-[0.25em]">
                {track.range}
              </span>
            </div>
          </FadeIn>
          <div className="flex flex-col">
            {LEVELS.filter((l) => l.track === track.id).map((l, i) => (
              <FadeIn key={l.n} delay={i * 0.06}>
                <div className="group grid md:grid-cols-[64px_1fr_auto] gap-4 md:gap-8 items-start border-b border-white/10 py-6 hover:bg-white/[0.03] transition-colors px-2">
                  <div className="font-italiana text-3xl text-white/40 group-hover:text-[#FF0000] transition-colors">
                    {String(l.n).padStart(2, '0')}
                  </div>
                  <div>
                    <h4 className="uppercase tracking-wide text-[15px] mb-1">{l.title}</h4>
                    <p className="text-white/55 text-[14px] leading-relaxed max-w-2xl">
                      {l.summary}
                    </p>
                  </div>
                  <div className="text-right text-[12px] text-white/45 uppercase tracking-wider whitespace-nowrap">
                    <div className="text-[#FF0000] mb-1">{l.status}</div>
                    <div>
                      {l.modules} модулів · {l.questions} питань
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}
