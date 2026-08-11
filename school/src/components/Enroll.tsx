import { useState, type FormEvent } from 'react';
import { CONTACTS, COURSES } from '../data/program';
import { Eyebrow, FadeIn, Section, Title } from './Section';

const inputCls =
  'w-full bg-transparent border border-white/25 px-5 py-4 text-[15px] text-white placeholder-white/40 focus:border-[#FF0000] focus:outline-none transition-colors';

export default function Enroll({
  courseId,
  onCourseChange,
}: {
  courseId: string;
  onCourseChange: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const course = COURSES.find((c) => c.id === courseId) ?? COURSES[0];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const subject = `Запис на курс «${course.name}» — школа Commerce Architecture`;
    const body = [
      `Ім'я: ${name}`,
      `Контакт: ${contact}`,
      `Курс: ${course.name} (${course.levels})`,
      message ? `Коментар: ${message}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    window.location.href = `mailto:${CONTACTS.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <Section id="enroll" className="bg-[#0a0a0a] border-t border-white/10">
      <div className="grid md:grid-cols-2 gap-14">
        <FadeIn>
          <Eyebrow>Запис на навчання</Eyebrow>
          <Title>
            Почніть свій шлях
            <br />
            уже сьогодні
          </Title>
          <p className="text-white/70 leading-relaxed mb-8 max-w-md">
            Залиште заявку — засновник школи особисто зв'яжеться з вами, допоможе визначити ваш
            поточний рівень і підібрати блок програми.
          </p>
          <div className="flex flex-col gap-3 text-[14px]">
            <a href={`mailto:${CONTACTS.email}`} className="text-white/70 hover:text-white">
              {CONTACTS.email}
            </a>
            <a href={CONTACTS.phoneHref} className="text-white/70 hover:text-white">
              {CONTACTS.phone}
            </a>
            <a
              href={CONTACTS.linkedin}
              target="_blank"
              rel="noreferrer"
              className="text-white/70 hover:text-white"
            >
              linkedin.com/in/pvsidorenko
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-[12px] uppercase tracking-wider text-white/50">Курс</span>
              <select
                value={course.id}
                onChange={(e) => onCourseChange(e.target.value)}
                className={`${inputCls} appearance-none cursor-pointer bg-[#0a0a0a]`}
              >
                {COURSES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0a0a0a]">
                    {c.name} · {c.levels}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[12px] uppercase tracking-wider text-white/50">Ім'я</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Як до вас звертатися"
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[12px] uppercase tracking-wider text-white/50">
                Email або телефон
              </span>
              <input
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Куди вам відповісти"
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[12px] uppercase tracking-wider text-white/50">
                Коментар (необов'язково)
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ваш досвід в e-commerce, цілі навчання"
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </label>
            <button
              type="submit"
              className="mt-2 bg-[#FF0000] text-white py-4 text-[13px] uppercase tracking-[0.2em] hover:bg-white hover:text-[#FF0000] transition-colors duration-300 cursor-pointer"
            >
              Надіслати заявку
            </button>
            {sent && (
              <p className="text-white/60 text-[13px] leading-relaxed">
                Відкрився ваш поштовий клієнт із готовою заявкою — просто натисніть «Надіслати».
                Якщо цього не сталося, напишіть нам на {CONTACTS.email}.
              </p>
            )}
          </form>
        </FadeIn>
      </div>
    </Section>
  );
}
