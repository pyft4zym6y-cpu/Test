import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { say, sayIdle } from './RobotGirl';

const LINKS = [
  { to: '/approach', label: 'Підхід', say: 'Чому реклама більше не рятує? Тут — відповідь у цифрах →' },
  { to: '/system', label: 'Система', say: '12 модулів, один рушій. Зазирни під капот →' },
  { to: '/product', label: 'Продукт', say: '56 плейбуків і аудит, що рахує гроші. Показати?' },
  { to: '/expertise', label: 'Експертиза', say: 'Від SEO до AI — 17 напрямів. Знайди свій →' },
  { to: '/cases', label: 'Кейси', say: '×18 обороту — не обіцянка, а факт. Перевір →' },
  { to: '/process', label: 'Процес', say: 'Перший результат за 30–60 днів. Ось як це працює →' },
  { to: '/services', label: 'Умови', say: 'Старт від $2K. Три двері — обери свою →' },
  { to: '/about', label: 'Про нас', say: 'Знайомся: weexp. Будуємо активи, а не витрати →' },
];

const CASE_LINKS = [
  { to: '/cases/premium-textile', num: '×18', label: 'Premium Textile', say: '€48K → €900K за 18 місяців. Хочеш так само?' },
  { to: '/cases/ray-ua', num: '≥19 млн ₴', label: 'RAY.UA', say: '≥19 млн ₴ знайдених грошей. Дивись аудит →' },
  { to: '/cases/ugears', num: '+65%', label: 'Ugears', say: 'Forbes TOP-250 і +65% продажів за 9 міс →' },
  { to: '/cases/imperia', num: '17K SKU', label: 'Imperia / ISEI', say: '17 000 SKU під контролем однієї системи →' },
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

  const linkCls = (isActive: boolean) =>
    `text-xs xl:text-sm tracking-wide uppercase transition-opacity hover:opacity-70 ${
      isActive ? 'text-[#A3E635]' : 'text-white'
    }`;

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
            {LINKS.map((l) =>
              l.to === '/cases' ? (
                /* ---- Кейси: dropdown ---- */
                <li key={l.to} className="relative group">
                  <NavLink
                    to={l.to}
                    onMouseEnter={() => say(l.say)}
                    onMouseLeave={sayIdle}
                    className={({ isActive }) => `${linkCls(isActive)} inline-flex items-center gap-1`}
                  >
                    {l.label}
                    <ChevronDown size={12} className="transition-transform duration-200 group-hover:rotate-180" />
                  </NavLink>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
                    <div className="bg-black/95 backdrop-blur-md border border-white/10 min-w-[260px] py-2">
                      {CASE_LINKS.map((c) => (
                        <Link
                          key={c.to}
                          to={c.to}
                          onMouseEnter={() => say(c.say)}
                          onMouseLeave={sayIdle}
                          className="flex items-baseline justify-between gap-4 px-5 py-2.5 text-xs uppercase tracking-wide text-white/75 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <span>{c.label}</span>
                          <span className="font-mono text-[0.62rem] text-[#A3E635]">{c.num}</span>
                        </Link>
                      ))}
                      <Link
                        to="/cases"
                        className="block px-5 py-2.5 mt-1 border-t border-white/10 text-xs uppercase tracking-wide text-[#A3E635] hover:bg-white/5 transition-colors"
                      >
                        Всі кейси →
                      </Link>
                    </div>
                  </div>
                </li>
              ) : (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    onMouseEnter={() => say(l.say)}
                    onMouseLeave={sayIdle}
                    className={({ isActive }) => linkCls(isActive)}
                  >
                    {l.label}
                  </NavLink>
                </li>
              ),
            )}
          </ul>
          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              onMouseEnter={() => say('30 хвилин — і ти знаєш свій розрив у грошах. Тисни!')}
              onMouseLeave={sayIdle}
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
        className={`menu-overlay fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col overflow-y-auto ${
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
        <nav className="flex flex-col items-center justify-center flex-1 gap-5 py-8">
          {LINKS.map((l, i) => (
            <div key={l.to} className="flex flex-col items-center">
              <NavLink
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
              {l.to === '/cases' && (
                <div
                  className={`menu-link mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 ${
                    menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: menuOpen ? `${130 + i * 60}ms` : '0ms' }}
                >
                  {CASE_LINKS.map((c) => (
                    <Link
                      key={c.to}
                      to={c.to}
                      onClick={() => setMenuOpen(false)}
                      className="text-xs uppercase tracking-wider text-white/60 hover:text-[#A3E635] transition-colors"
                    >
                      {c.label} <span className="font-mono text-[#A3E635]/70">{c.num}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link
            to="/contact"
            onClick={() => setMenuOpen(false)}
            className={`menu-link mt-3 border border-[#A3E635] text-[#A3E635] px-8 py-3 text-sm tracking-widest uppercase ${
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
