import FadeIn from '../components/FadeIn';
import AvatarBot from '../components/AvatarBot';
import { BOT_VARIANT } from '../components/botConfig';
import { Eyebrow, Section, SectionTitle } from '../components/ui';

const VARIANTS: { v: 1 | 2 | 3 | 4 | 5; name: string; desc: string }[] = [
  { v: 1, name: 'Піксель', desc: '8-bit голова у стилі логотипа й pixel-шрифту сайту.' },
  { v: 2, name: 'Орб', desc: 'Дружнє ядро-сфера з орбітою — асистент-«ядро системи».' },
  { v: 3, name: 'Візор', desc: 'Дроїд із суцільним екраном-візором — стриманий хайтек.' },
  { v: 4, name: 'Чіп', desc: 'Мікросхема з матричними очима — «мозок» Commerce OS.' },
  { v: 5, name: 'Лінія', desc: 'Однолінійний мінімалізм — найлегший і найелегантніший.' },
];

export default function BotVariantsPage() {
  return (
    <div className="pt-16">
      <Section className="grid-bg">
        <FadeIn>
          <Eyebrow>Дизайн-варіанти AI-асистента</Eyebrow>
          <SectionTitle as="h1">Обери свого асистента</SectionTitle>
          <p className="text-[#5A6472] mt-4 max-w-2xl">
            П&rsquo;ять оригінальних варіантів. Усі стежать очима за курсором, кліпають і говорять
            через бульбашку. Активний зараз — <strong>V{BOT_VARIANT}</strong>; змінюється однією
            константою.
          </p>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-12">
          {VARIANTS.map((x, i) => (
            <FadeIn key={x.v} delay={i * 0.07}>
              <div
                className={`card card-hover p-6 h-full flex flex-col items-center text-center ${
                  x.v === BOT_VARIANT ? 'ring-2 ring-[#65A30D]' : ''
                }`}
              >
                <AvatarBot variant={x.v} size={120} />
                <p className="font-pixel text-[0.6rem] text-[#4D7C0F] mt-5">V{x.v}</p>
                <p className="font-extrabold text-lg mt-1.5">{x.name}</p>
                <p className="text-[#5A6472] text-xs mt-2 leading-relaxed">{x.desc}</p>
                {x.v === BOT_VARIANT && (
                  <p className="font-mono text-[0.6rem] uppercase tracking-wider text-[#4D7C0F] mt-3">
                    ● активний
                  </p>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>
    </div>
  );
}
