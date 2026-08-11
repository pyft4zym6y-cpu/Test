import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { COURSES, courseById, fmtPrice, levelsLabel } from '../data/courses';
import { SCHOOL } from '../data/school';
import { PageHead, Pop, Section } from '../components/comic';

const inputCls =
  'w-full comic-border bg-white px-5 py-4 text-[15px] placeholder-ink/35 focus:outline-none focus:bg-paper transition-colors';

type Status = 'idle' | 'sending' | 'sent' | 'mailto' | 'error';

export default function Enroll() {
  const [params] = useSearchParams();
  const preset = params.get('course');
  const [courseId, setCourseId] = useState(preset && courseById(preset) ? preset : 'full');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const course = courseById(courseId) ?? COURSES[0];
  const courseLabel = `${course.name} (${levelsLabel(course)}, ${fmtPrice(course.price)}, ${course.duration})`;

  const openMailto = () => {
    const subject = `Запис на курс «${course.name}» — школа Commerce Architecture`;
    const body = [
      `Ім'я: ${name}`,
      `Контакт: ${contact}`,
      `Курс: ${courseLabel}`,
      message ? `Коментар: ${message}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    window.location.href = `mailto:${SCHOOL.contacts.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const r = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact,
          course: courseLabel,
          comment: message,
          company_website: honeypot,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok) {
        setStatus('sent');
        return;
      }
    } catch {
      // сервера немає (демо/локально) — падаємо в mailto
    }
    openMailto();
    setStatus('mailto');
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
                Обраний курс
              </div>
              <div className="font-oswald font-bold uppercase text-[20px] leading-tight mb-2">
                {course.name}
              </div>
              <div className="flex items-baseline gap-3 mb-1.5">
                <span className="font-oswald font-bold text-[30px] leading-none">
                  {fmtPrice(course.price)}
                </span>
                {course.oldPrice && (
                  <span className="text-[15px] font-bold line-through text-ink/40">
                    {fmtPrice(course.oldPrice)}
                  </span>
                )}
              </div>
              <div className="text-[12px] font-extrabold uppercase tracking-wider text-ink/55 mb-1">
                {levelsLabel(course)} · {course.duration}
              </div>
              <div className="inline-block comic-border bg-sun px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider mt-2">
                Оплата частинами
              </div>

              <div className="mt-7 pt-6 border-t-[3px] border-ink">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand mb-3">
                  Прямі контакти
                </div>
                <div className="flex flex-col gap-2.5 text-[14.5px] font-semibold">
                  <a href={`mailto:${SCHOOL.contacts.email}`} className="hover:text-brand">
                    {SCHOOL.contacts.email}
                  </a>
                  <a href={SCHOOL.contacts.phoneHref} className="hover:text-brand">
                    {SCHOOL.contacts.phone}
                  </a>
                </div>
                <p className="text-[13.5px] leading-relaxed text-ink/70 mt-4">
                  Заявки розбирає особисто засновник школи. Відповідь — протягом одного робочого
                  дня.
                </p>
                <div className="font-marck text-brand text-[48px] leading-none mt-3">П.С.</div>
              </div>
            </div>
          </Pop>

          <Pop delay={0.12}>
            {status === 'sent' ? (
              <div className="comic-border bg-sun hard-shadow p-10 text-center">
                <div className="font-oswald font-bold uppercase text-[34px] leading-tight mb-3">
                  Бум! Заявку отримано 🎯
                </div>
                <p className="font-semibold text-[15px] leading-relaxed max-w-md mx-auto">
                  Ми звʼяжемося протягом одного робочого дня — обговоримо твій рівень і старт
                  курсу «{course.name}».
                </p>
              </div>
            ) : (
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
                          {c.name} · {levelsLabel(c)} · {fmtPrice(c.price)}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Точкові курси">
                      {COURSES.filter((c) => c.kind === 'targeted').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {levelsLabel(c)} · {fmtPrice(c.price)}
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
                {/* honeypot проти ботів — приховане поле */}
                <input
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  name="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="comic-border bg-brand text-white font-extrabold uppercase tracking-[0.15em] text-[14px] px-7 py-4 hard-shadow-sm hover:-translate-y-1 transition-transform cursor-pointer disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {status === 'sending' ? 'Надсилаю…' : 'Надіслати заявку'}
                </button>
                {status === 'mailto' && (
                  <p className="text-[13.5px] leading-relaxed font-semibold comic-border bg-sun px-4 py-3">
                    Відкрився твій поштовий клієнт із готовою заявкою — просто натисни
                    «Надіслати». Якщо цього не сталося — напиши на {SCHOOL.contacts.email}.
                  </p>
                )}
              </form>
            )}
          </Pop>
        </div>
      </Section>
    </>
  );
}
