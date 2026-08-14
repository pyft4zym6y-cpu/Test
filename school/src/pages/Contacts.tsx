import { SCHOOL } from '../data/school';
import { Bubble, ComicButton, PageHead, Pop, Section } from '../components/comic';

const CARDS = [
  {
    label: 'Email',
    value: SCHOOL.contacts.email,
    href: `mailto:${SCHOOL.contacts.email}`,
    note: 'Найшвидший спосіб. Відповідаємо протягом робочого дня.',
  },
  {
    label: 'Телефон',
    value: SCHOOL.contacts.phone,
    href: SCHOOL.contacts.phoneHref,
    note: 'Дзвінок або месенджери на цьому номері.',
  },
  {
    label: 'LinkedIn',
    value: 'in/pvsidorenko',
    href: SCHOOL.contacts.linkedin,
    note: 'Профіль засновника — пиши напряму.',
  },
];

export default function Contacts() {
  return (
    <>
      <PageHead
        eyebrow="Контакти"
        title={
          <>
            Поговоримо <span className="redmark">напряму</span>
          </>
        }
        lead="Жодних кол-центрів: на звʼязку — засновник школи."
      />
      <Section className="!pt-8">
        <div className="grid md:grid-cols-3 gap-7 mb-14">
          {CARDS.map((c, i) => (
            <Pop key={c.label} delay={i * 0.08}>
              <a
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
                className="block comic-border bg-white hard-shadow-sm p-7 h-full hover:-translate-y-1 transition-transform"
              >
                <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand mb-3">
                  {c.label}
                </div>
                <div className="font-oswald font-bold text-[19px] uppercase break-all mb-3">
                  {c.value}
                </div>
                <p className="text-[13.5px] leading-relaxed text-ink/65">{c.note}</p>
              </a>
            </Pop>
          ))}
        </div>
        <Pop>
          <Bubble className="inline-block mb-8 -rotate-1">
            <span className="font-semibold text-[15px]">
              Хочеш одразу до справи? Залиш заявку — обговоримо твій рівень і курс.
            </span>
          </Bubble>
          <div>
            <ComicButton to="/enroll">Записатися на навчання</ComicButton>
          </div>
        </Pop>
      </Section>
    </>
  );
}
