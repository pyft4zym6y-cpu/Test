import { LEVELS, TOTALS, TRACKS } from '../data/program';
import { ComicButton, H2, PageHead, Pop, Section } from '../components/comic';

export default function ProgramPage() {
  return (
    <>
      <PageHead
        eyebrow="Програма школи"
        title={
          <>
            Від новачка до <span className="redmark">E-Commerce Director</span>
          </>
        }
        lead="Покрокова структура: кожен наступний рівень спирається на попередній. Новачок починає з будови сайту та шляху покупця — і послідовно опановує UX, аналітику, SEO, маркетинг, CRM, фінанси, операції та стратегію."
      />

      <Section className="!pt-8">
        <div className="grid grid-cols-3 gap-6 mb-16">
          {[
            { value: TOTALS.levels, label: 'рівнів компетентності' },
            { value: TOTALS.modules, label: 'навчальних модулів' },
            { value: TOTALS.questions, label: 'екзаменаційних питань' },
          ].map((s, i) => (
            <Pop key={s.label} delay={i * 0.08}>
              <div className="comic-border bg-white hard-shadow-sm p-6 text-center">
                <div className="font-oswald font-bold text-[clamp(36px,5vw,72px)] leading-none text-brand">
                  {s.value}
                </div>
                <div className="text-[11px] md:text-[12px] font-extrabold uppercase tracking-wider mt-2 text-ink/60">
                  {s.label}
                </div>
              </div>
            </Pop>
          ))}
        </div>

        {TRACKS.map((track) => (
          <div key={track.id} className="mb-16 last:mb-0">
            <Pop>
              <div className="flex items-baseline gap-4 mb-2">
                <H2 className="!mb-0">{track.label}</H2>
                <span className="inline-block comic-border bg-sun px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em] whitespace-nowrap">
                  {track.range}
                </span>
              </div>
            </Pop>
            <div className="flex flex-col mt-6">
              {LEVELS.filter((l) => l.track === track.id).map((l, i) => (
                <Pop key={l.n} delay={i * 0.05}>
                  <div className="group grid md:grid-cols-[64px_1fr_auto] gap-4 md:gap-8 items-start border-b-[3px] border-ink py-6 px-2 hover:bg-white transition-colors">
                    <div className="font-oswald font-bold text-3xl text-ink/30 group-hover:text-brand transition-colors">
                      {String(l.n).padStart(2, '0')}
                    </div>
                    <div>
                      <h4 className="font-oswald font-bold uppercase tracking-wide text-[17px] mb-1">
                        {l.title}
                      </h4>
                      <p className="text-ink/65 text-[14px] leading-relaxed max-w-2xl">
                        {l.summary}
                      </p>
                    </div>
                    <div className="text-right text-[12px] font-extrabold uppercase tracking-wider whitespace-nowrap">
                      <div className="text-brand mb-1">{l.status}</div>
                      <div className="text-ink/50">
                        {l.modules} модулів · {l.questions} питань
                      </div>
                    </div>
                  </div>
                </Pop>
              ))}
            </div>
          </div>
        ))}

        <Pop className="mt-14">
          <div className="comic-border bg-brand halftone-red text-white hard-shadow p-8 md:p-12 text-center">
            <H2 className="text-white !mb-3">Пройшов усі 16 рівнів?</H2>
            <p className="font-semibold text-[15px] text-white/85 max-w-xl mx-auto mb-7">
              Ти готовий до ролі E-Commerce Director, незалежного експерта й архітектора e-commerce систем — із захищеним капстоуном у портфоліо.
            </p>
            <ComicButton to="/courses" variant="ink">
              Обрати свій курс
            </ComicButton>
          </div>
        </Pop>
      </Section>
    </>
  );
}
