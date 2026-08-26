import { Link } from 'react-router-dom';
import { SCHOOL } from '../data/school';
import { WeexpLogo } from './CareerTrack';

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
      { to: '/blog', label: 'Блог' },
      { to: '/glossary', label: 'Глосарій' },
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
      <div className="max-w-[1150px] mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-x-6 gap-y-10 md:gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="font-oswald font-bold uppercase text-2xl leading-none mb-3">
            Commerce
            <br />
            <span className="text-brand">Architecture</span>
          </div>
          <p className="text-white/70 text-[14px] leading-relaxed max-w-xs mb-4">
            {SCHOOL.tagline}. Від новачка до E-Commerce Director — системно, практично, без води.
          </p>
          <div className="font-marck text-[40px] leading-none text-brand mb-6">П.С.</div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/40 mb-2.5">
            Кар'єрний партнер
          </div>
          <a
            href={SCHOOL.career.partnerUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 text-white hover:text-brand transition-colors"
          >
            <WeexpLogo size={22} />
            <span className="font-oswald font-semibold uppercase tracking-wide text-[15px]">
              {SCHOOL.career.partner}
            </span>
          </a>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/40 mt-6 mb-2.5">
            Ми в соцмережах
          </div>
          <a
            href={SCHOOL.social.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="Сторінка школи в LinkedIn"
            className="inline-flex items-center justify-center w-10 h-10 comic-border bg-white text-ink hover:bg-brand hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
            </svg>
          </a>
        </div>
        {COLS.map((col) => (
          <div key={col.title} className={col.title === 'Документи' ? 'col-span-2 md:col-span-1' : ''}>
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
