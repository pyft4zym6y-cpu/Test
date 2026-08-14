import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/about', label: 'Про школу' },
  { to: '/courses', label: 'Курси' },
  { to: '/program', label: 'Програма' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contacts', label: 'Контакти' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="inline-flex items-center justify-center w-9 h-9 bg-brand comic-border">
        <svg width="20" height="20" viewBox="0 0 120 120" fill="none" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M60 120C26.8629 120 0 93.1371 0 60V0C22.5654 0 42.2213 12.4569 52.4662 30.8691C38.4788 34.2089 28.0787 46.7902 28.0787 61.8006V63.1443C28.0787 79.9648 41.7146 93.6006 58.5353 93.6006H59.8789L59.8785 61.8006C59.8785 79.3633 74.1159 93.6006 91.6787 93.6006L91.6787 61.8006C91.6787 44.2783 77.5071 30.0661 60 30.0008L60 0H62.5352C94.2722 0 120 25.7279 120 57.4648V60C120 93.1371 93.1371 120 60 120Z"
            fill="white"
          />
        </svg>
      </span>
      <span className="font-oswald font-bold uppercase tracking-wide text-[17px] leading-none">
        Commerce
        <br />
        Architecture
      </span>
    </Link>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-paper border-b-[3px] border-ink">
      <nav className="max-w-[1150px] mx-auto flex items-center justify-between px-6 py-3.5">
        <Logo />
        <div className="hidden lg:flex items-center gap-7">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-[13.5px] font-extrabold uppercase tracking-wider hover:text-brand transition-colors ${
                  isActive ? 'text-brand underline decoration-[3px] underline-offset-4' : ''
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/enroll"
            className="comic-border bg-brand text-white font-extrabold uppercase tracking-wider text-[13.5px] px-5 py-2.5 hard-shadow-sm hover:-translate-y-0.5 transition-transform"
          >
            Записатися
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Меню"
          aria-expanded={open}
          className="lg:hidden comic-border bg-white px-3 py-2 font-extrabold uppercase text-[13px]"
        >
          {open ? '✕' : 'Меню'}
        </button>
      </nav>
      {open && (
        <div className="lg:hidden border-t-[3px] border-ink bg-paper px-6 py-4 flex flex-col gap-4">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="font-extrabold uppercase tracking-wider text-[15px]"
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/enroll"
            onClick={() => setOpen(false)}
            className="comic-border bg-brand text-white text-center font-extrabold uppercase tracking-wider px-5 py-3 hard-shadow-sm"
          >
            Записатися
          </Link>
        </div>
      )}
    </header>
  );
}
