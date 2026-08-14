import { SCHOOL } from '../data/school';
import { Burst, ComicButton, Eyebrow, H2, Hand, Pop, Section } from './comic';

export function WeexpLogo({
  size = 22,
  fill = 'currentColor',
}: {
  size?: number;
  fill?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M 160 88 L 194 34 L 216 0 L 256 0 L 256 40 L 221.5 93.5 L 200 128 L 256 128 L 256 256 L 96 256 L 96 168 L 64.246 220 L 40 256 L 0 256 L 0 216 L 34 162 L 56 128 L 0 128 L 0 0 L 160 0 Z"
        fill={fill}
      />
    </svg>
  );
}

export default function CareerTrack() {
  const career = SCHOOL.career;
  return (
    <Section className="bg-brand halftone-red text-white">
      <div className="relative">
        <Burst className="absolute -top-14 right-0 hidden md:inline-flex" rotate={8} size={130}>
          офер!
        </Burst>
        <Pop>
          <Eyebrow>Кар'єрний трек</Eyebrow>
          <H2 className="text-white">
            Найкращі учасники отримують <span className="yellowmark text-ink">офер</span>
          </H2>
          <Hand className="block mb-6">…так, за тобою спостерігають. У хорошому сенсі.</Hand>
          <p className="text-white/90 text-[16px] leading-relaxed max-w-2xl font-semibold mb-12">
            {career.lead}
          </p>
        </Pop>
        <div className="grid md:grid-cols-3 gap-7 mb-12">
          {career.points.map((p, i) => (
            <Pop key={p.title} delay={i * 0.09}>
              <div
                className={`comic-border bg-white text-ink hard-shadow p-7 h-full ${
                  i % 2 === 0 ? '-rotate-[0.6deg]' : 'rotate-[0.6deg]'
                }`}
              >
                <div className="font-oswald font-bold text-[40px] leading-none text-brand mb-3">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="font-oswald font-bold uppercase text-lg mb-2">{p.title}</h3>
                <p className="text-[14px] leading-relaxed text-ink/70">{p.text}</p>
              </div>
            </Pop>
          ))}
        </div>
        <Pop>
          <div className="flex flex-wrap items-center gap-6">
            <ComicButton to="/enroll" variant="ink">
              Хочу в команду
            </ComicButton>
            <a
              href={career.partnerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 comic-border bg-white text-ink px-5 py-3.5 font-extrabold uppercase tracking-wider text-[13px] hard-shadow-sm hover:-translate-y-1 transition-transform"
            >
              <WeexpLogo size={18} fill="#111" />
              {career.partner} →
            </a>
          </div>
        </Pop>
      </div>
    </Section>
  );
}
