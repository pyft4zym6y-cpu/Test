import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { COURSES, courseById, levelsLabel } from '../data/courses';
import { SCHOOL } from '../data/school';
import { PageHead, Pop, Section } from '../components/comic';

const inputCls =
  'w-full comic-border bg-white px-5 py-4 text-[15px] placeholder-ink/35 focus:outline-none focus:bg-paper transition-colors';

export default function Enroll() {
  const [params] = useSearchParams();
  const preset = params.get('course');
  const [courseId, setCourseId] = useState(preset && courseById(preset) ? preset : 'full');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const course = courseById(courseId) ?? COURSES[0];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const subject = `Запис на курс «${course.name}» — школа Commerce Architecture`;
    const body = [
      `Ім'я: ${name}`,
      `Контакт: ${contact}`,
      `Курс: ${course.name} (${levelsLabel(course)})`,
      message ? `Коментар: ${message}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    window.location.href = `mailto:${SCHOOL.contacts.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <>
      <PageHead
        eyebrow="Запис на навчання"
        title={
          <>
            Почни свій шлях <span className="redmark">сьогодні</span>
          </>
        }
        lead="Залиш заявку — ми звʼяжемося, допоможемо визначити твій поточний рівень і підібрати курс. Без автоворонок і настирливих дзвінків."
      />

      <Section className="!pt-8">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
          <Pop>
            <div className="comic-border bg-white hard-shadow-sm p-8">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand mb-4">
                Прямі контакти
              </div>
              <div className="flex flex-col gap-3 text-[15px] font-semibold">
                <a href={`mailto:${SCHOOL.contacts.email}`} className="hover:text-brand">
                  {SCHOOL.contacts.email}
                </a>
                <a href={SCHOOL.contacts.phoneHref} className="hover:text-brand">
                  {SCHOOL.contacts.phone}
                </a>
                <a
                  href={SCHOOL.contacts.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand"
                >
                  LinkedIn засновника
                </a>
              </div>
              <div className="mt-8 pt-6 border-t-[3px] border-ink">
                <p className="text-[14px] leading-relaxed text-ink/70">
                  Заявки розбирає особисто засновник школи. Відповідь — протягом одного робочого
                  дня.
                </p>
                <div className="font-marck text-brand text-[52px] leading-none mt-4">П.С.</div>
              </div>
            </div>
          </Pop>

          <Pop delay={0.12}>
            <form onSubmit={submit} className="flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-[12px] font-extrabold uppercase tracking-wider">Курс</span>
                <select
                  value={course.id}
                  onChange={(e) => setCourseId(e.target.value)}
                  className={`${inputCls} appearance-none cursor-pointer`}
                >
                  <optgroup label="Загальні треки">
                    {COURSES.filter((c) => c.kind === 'general').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {levelsLabel(c)}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Точкові курси">
                    {COURSES.filter((c) => c.kind === 'targeted').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {levelsLabel(c)}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[12px] font-extrabold uppercase tracking-wider">Імʼя</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Як до тебе звертатися"
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[12px] font-extrabold uppercase tracking-wider">
                  Email або телефон
                </span>
                <input
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Куди відповісти"
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[12px] font-extrabold uppercase tracking-wider">
                  Коментар (необовʼязково)
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Твій досвід в e-commerce, цілі навчання"
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </label>
              <button
                type="submit"
                className="comic-border bg-brand text-white font-extrabold uppercase tracking-[0.15em] text-[14px] px-7 py-4 hard-shadow-sm hover:-translate-y-1 transition-transform cursor-pointer"
              >
                Надіслати заявку
              </button>
              {sent && (
                <p className="text-[13.5px] leading-relaxed font-semibold comic-border bg-sun px-4 py-3">
                  Відкрився твій поштовий клієнт із готовою заявкою — просто натисни «Надіслати».
                  Якщо цього не сталося — напиши на {SCHOOL.contacts.email}.
                </p>
              )}
            </form>
          </Pop>
        </div>
      </Section>
    </>
  );
}
