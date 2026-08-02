import FadeIn from './FadeIn';
import { Eyebrow, Section, SectionTitle, Chip, Stat } from './ui';

const BRANDS = [
  'Ugears',
  'Imperia Holding',
  'ISEI',
  'Henkel',
  'SC Johnson',
  'Kimberly-Clark',
  'Schwarzkopf',
  'Johnson & Johnson',
  'NYX',
  'Missha',
  'Watsons',
  'Rozetka',
  'Kasta',
  'Lamoda',
  'MAKEUP',
  'Amazon',
];

const FACTS = [
  {
    label: 'Ринки',
    text: 'США · Німеччина · Франція · Іспанія · Італія · Велика Британія · Польща · Чехія · Румунія · Латвія · Мальта · Греція · Канада · Україна',
    accent: '#A3E635',
  },
  {
    label: 'Канали',
    text: 'Власний DTC · Amazon · eBay · Etsy · Allegro · Shopify · Magento · маркетплейси ЄС · B2B / HoReCa',
    accent: '#3DDAD0',
  },
  {
    label: 'Галузі',
    text: 'Consumer Electronics · Fashion · Beauty · Home & Decor · FMCG · Fintech · AI',
    accent: '#8B7CF6',
  },
];

export default function Trust() {
  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <FadeIn>
          <Eyebrow>Довіра · Бренди, ринки, партнери</Eyebrow>
          <SectionTitle>
            Бренди й ринки,
            <br />з якими я вже працював
          </SectionTitle>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="flex gap-3">
            <Stat countTo={14} label="Країн" color="var(--yellow)" />
            <Stat value="TOP-250" label="Forbes UA" color="var(--cyan)" />
          </div>
        </FadeIn>
      </div>

      {/* Marquee of brand chips — two counter-directed rows */}
      <FadeIn delay={0.2}>
        <div className="marquee-mask overflow-hidden mt-12 flex flex-col gap-3">
          <div className="marquee-track">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <Chip key={`a-${b}-${i}`}>{b}</Chip>
            ))}
          </div>
          <div className="marquee-track" style={{ animationDirection: 'reverse', animationDuration: '52s' }}>
            {[...BRANDS.slice().reverse(), ...BRANDS.slice().reverse()].map((b, i) => (
              <Chip key={`b-${b}-${i}`}>{b}</Chip>
            ))}
          </div>
        </div>
      </FadeIn>

      <div className="grid md:grid-cols-3 gap-5 mt-10">
        {FACTS.map((f, i) => (
          <FadeIn key={f.label} delay={i * 0.1}>
            <div className="card card-hover p-6 h-full">
              <p
                className="font-mono text-[0.66rem] uppercase tracking-[0.2em] mb-3"
                style={{ color: f.accent }}
              >
                {f.label}
              </p>
              <p className="text-[#B7C0CC] text-sm leading-relaxed">{f.text}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}
