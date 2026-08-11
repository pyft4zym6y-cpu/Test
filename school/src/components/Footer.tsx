import { Link } from 'react-router-dom';
import { SCHOOL } from '../data/school';

const COLS = [
  {
    title: 'Навчання',
    links: [
      { to: '/courses', label: 'Курси' },
      { to: '/program', label: 'Програма' },
      { to: '/enroll', label: 'Запис' },
    ],
  },
  {
    title: 'Школа',
    links: [
      { to: '/about', label: 'Про школу' },
      { to: '/faq', label: 'FAQ' },
      { to: '/contacts', label: 'Контакти' },
    ],
  },
  {
    title: 'Документи',
    links: [
      { to: '/privacy', label: 'Політика конфіденційності' },
      { to: '/terms', label: 'Публічна оферта' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-white border-t-[3px] border-ink">
      <div className="max-w-[1150px] mx-auto px-6 py-14 grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div>
          <div className="font-oswald font-bold uppercase text-2xl leading-none mb-3">
            Commerce
            <br />
            <span className="text-brand">Architecture</span>
          </div>
          <p className="text-white/70 text-[14px] leading-relaxed max-w-xs mb-4">
            {SCHOOL.tagline}. Від новачка до E-Commerce Director — системно, практично, без води.
          </p>
          <div className="font-marck text-[40px] leading-none text-brand">П.С.</div>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <div className="font-oswald font-semibold uppercase tracking-wider text-[13px] text-white/50 mb-4">
              {col.title}
            </div>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-[14px] font-semibold hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/15">
        <div className="max-w-[1150px] mx-auto px-6 py-5 flex flex-col md:flex-row justify-between gap-3 text-[13px] text-white/60">
          <span>
            © {new Date().getFullYear()} {SCHOOL.name} · Засновник — {SCHOOL.founder.name}
          </span>
          <span className="flex gap-5">
            <a href={`mailto:${SCHOOL.contacts.email}`} className="hover:text-white">
              {SCHOOL.contacts.email}
            </a>
            <a
              href={SCHOOL.contacts.linkedin}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              LinkedIn
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
