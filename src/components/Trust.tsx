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
  'Epicentr',
];

const FACTS = [
  {
    label: 'Ринки · 14 країн',
    text: 'США · DE · FR · ES · IT · UK · PL · CZ · RO · LV · MT · GR · CA · UA',
    accent: '#65A30D',
  },
  {
    label: 'Канали збуту',
    text: 'DTC-сайт · Amazon · eBay · Etsy · Allegro · Rozetka · Kasta',
    accent: '#0F9488',
  },
  {
    label: 'Моделі бізнесу',
    text: 'B2C / DTC · B2B · HoReCa · Wholesale · Cross-border',
    accent: '#6D28D9',
  },
  {
    label: 'Платформи · CMS',
    text: 'Shopify · Magento · WooCommerce · OpenCart · Odoo',
    accent: '#B45309',
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
            <br />з якими ми вже працювали
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

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
        {FACTS.map((f, i) => (
          <FadeIn key={f.label} delay={i * 0.1}>
            <div className="card card-hover p-6 h-full">
              <p
                className="font-mono text-[0.66rem] uppercase tracking-[0.2em] mb-3"
                style={{ color: f.accent }}
              >
                {f.label}
              </p>
              <p className="text-[#3F4854] text-sm leading-relaxed">{f.text}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}
