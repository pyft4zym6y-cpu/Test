import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { to: '/approach', label: 'Підхід' },
  { to: '/system', label: 'Система' },
  { to: '/product', label: 'Продукт' },
  { to: '/expertise', label: 'Експертиза' },
  { to: '/cases', label: 'Кейси' },
  { to: '/process', label: 'Процес' },
  { to: '/services', label: 'Умови' },
  { to: '/about', label: 'Про мене' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 256 256" fill="none" aria-hidden="true">
        <path
          d="M 160 88 L 194 34 L 216 0 L 256 0 L 256 40 L 221.5 93.5 L 200 128 L 256 128 L 256 256 L 96 256 L 96 168 L 64.246 220 L 40 256 L 0 256 L 0 216 L 34 162 L 56 128 L 0 128 L 0 0 L 160 0 Z"
          fill="white"
        />
      </svg>
      <span className="font-pixel text-[0.6rem] leading-none pt-0.5">
        WEEXP<span className="text-[#A3E635]">·OS</span>
      </span>
    </Link>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
          scrolled ? 'bg-black/85 backdrop-blur-md border-b border-white/10' : ''
        }`}
      >
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-6 md:px-10 py-5">
          <Logo />
          <ul className="hidden lg:flex items-center gap-4 xl:gap-6">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    `text-xs xl:text-sm tracking-wide uppercase transition-opacity hover:opacity-70 ${
                      isActive ? 'text-[#A3E635]' : 'text-white'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className="hidden lg:inline-block border border-white/30 bg-white/5 backdrop-blur-sm px-5 py-2 text-xs tracking-wider uppercase hover:bg-white/10 transition-colors"
            >
              Сесія 30 хв
            </Link>
            <button
              type="button"
              aria-label="Відкрити меню"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden p-2 hover:opacity-70 transition-opacity"
            >
              <Menu size={24} />
            </button>
          </div>
        </nav>
      </header>

      {/* Fullscreen mobile menu — staggered links */}
      <div
        className={`menu-overlay fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <Logo />
          <button
            type="button"
            aria-label="Закрити меню"
            onClick={() => setMenuOpen(false)}
            className="p-2 hover:opacity-70 transition-opacity"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="flex flex-col items-center justify-center flex-1 gap-6">
          {LINKS.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `menu-link text-2xl tracking-widest uppercase ${
                  isActive ? 'text-[#A3E635]' : 'text-white'
                } ${menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`
              }
              style={{ transitionDelay: menuOpen ? `${100 + i * 60}ms` : '0ms' }}
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/contact"
            onClick={() => setMenuOpen(false)}
            className={`menu-link mt-4 border border-[#A3E635] text-[#A3E635] px-8 py-3 text-sm tracking-widest uppercase ${
              menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: menuOpen ? `${100 + LINKS.length * 60}ms` : '0ms' }}
          >
            Сесія 30 хв
          </Link>
        </nav>
      </div>
    </>
  );
}
