import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { say, sayIdle } from './speech';
import { track } from './analytics';

const LINKS = [
  { to: '/os', label: 'Commerce OS', say: 'Чому зараз, як влаштована система і що ви купуєте — все тут →' },
  { to: '/cases', label: 'Кейси', say: '×18 обороту — не обіцянка, а факт. Перевір →' },
  { to: '/services', label: 'Співпраця', say: 'Аудит · консалтинг $45/год · управління від $3K/міс →' },
  { to: '/calculator', label: 'Калькулятор', say: '8 питань — і твій розрив у грошах на екрані. Спробуй →' },
  { to: '/about', label: 'Про нас', say: 'Знайомся: weexp. Будуємо активи, а не витрати →' },
];

// Клієнтський портал діагностики (Discovery) — окремий продукт на піддомені
const BRIEF_URL = 'https://discovery.weexp.agency';

const CASE_LINKS = [
  { to: '/cases/premium-textile', num: '×18', label: 'Преміум-текстиль', say: '€48K → €900K за 18 місяців. Хочеш так само?' },
  { to: '/cases/fashion-apparel', num: '≥19 млн ₴', label: 'Fashion-виробник', say: '≥19 млн ₴ знайдених грошей. Дивись аудит →' },
  { to: '/cases/consumer-dtc', num: '+65%', label: 'Consumer DTC', say: 'Бренд із Forbes TOP-250 і +65% продажів за 9 міс →' },
  { to: '/cases/fmcg-distribution', num: '17K SKU', label: 'FMCG-дистриб’ютор', say: '17 000 SKU під контролем однієї системи →' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 256 256" fill="none" aria-hidden="true">
        <path
          d="M 160 88 L 194 34 L 216 0 L 256 0 L 256 40 L 221.5 93.5 L 200 128 L 256 128 L 256 256 L 96 256 L 96 168 L 64.246 220 L 40 256 L 0 256 L 0 216 L 34 162 L 56 128 L 0 128 L 0 0 L 160 0 Z"
          fill="#12161C"
        />
      </svg>
      <span className="font-pixel text-[0.6rem] leading-none pt-0.5">
        WEEXP<span className="text-[#4D7C0F]">·OS</span>
      </span>
    </Link>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [casesOpen, setCasesOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setCasesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const linkCls = (isActive: boolean) =>
    `text-xs 2xl:text-sm tracking-wide uppercase transition-opacity hover:opacity-70 ${
      isActive ? 'text-[#4D7C0F]' : 'text-[#12161C]'
    }`;

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-md border-b border-black/10' : ''
        }`}
      >
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-6 md:px-10 py-5">
          <Logo />
          <ul className="hidden xl:flex items-center gap-5 2xl:gap-6">
            {LINKS.map((l) =>
              l.to === '/cases' ? (
                /* ---- Кейси: dropdown ---- */
                <li key={l.to} className="relative group">
                  <NavLink
                    to={l.to}
                    onMouseEnter={() => say(l.say)}
                    onMouseLeave={sayIdle}
                    onClick={(e) => {
                      if (window.matchMedia('(pointer: coarse)').matches && !casesOpen) {
                        e.preventDefault();
                        setCasesOpen(true);
                      }
                    }}
                    className={({ isActive }) => `${linkCls(isActive)} inline-flex items-center gap-1`}
                  >
                    {l.label}
                    <ChevronDown size={12} className={`transition-transform duration-200 group-hover:rotate-180 ${casesOpen ? 'rotate-180' : ''}`} />
                  </NavLink>
                  <div className={`absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity duration-200${casesOpen ? ' opacity-100 pointer-events-auto' : ''}`}>
                    <div className="bg-white/95 backdrop-blur-md border border-black/10 min-w-[260px] py-2">
                      {CASE_LINKS.map((c) => (
                        <Link
                          key={c.to}
                          to={c.to}
                          onMouseEnter={() => say(c.say)}
                          onMouseLeave={sayIdle}
                          className="flex items-baseline justify-between gap-4 px-5 py-2.5 text-xs uppercase tracking-wide text-black/70 hover:text-[#12161C] hover:bg-black/5 transition-colors"
                        >
                          <span>{c.label}</span>
                          <span className="font-mono text-[0.62rem] text-[#4D7C0F]">{c.num}</span>
                        </Link>
                      ))}
                      <Link
                        to="/cases"
                        className="block px-5 py-2.5 mt-1 border-t border-black/10 text-xs uppercase tracking-wide text-[#4D7C0F] hover:bg-black/5 transition-colors"
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
              onClick={() => track('cta_click', { location: 'nav' })}
              className="hidden xl:inline-block border border-black/30 bg-black/5 backdrop-blur-sm px-5 py-2 text-xs tracking-wider uppercase hover:bg-black/5 transition-colors"
            >
              Забронювати сесію
            </Link>
            <a
              href={BRIEF_URL}
              target="_blank"
              rel="noopener"
              onMouseEnter={() => say('Уже спілкуємось? Заповнюй бриф у порталі — вхід за запрошенням →')}
              onMouseLeave={sayIdle}
              onClick={() => track('cta_click', { location: 'nav_brief' })}
              className="hidden xl:inline-block bg-[#A3E635] px-5 py-2 text-xs font-bold tracking-wider uppercase text-black hover:opacity-85 transition-opacity"
            >
              Заповнити бриф
            </a>
            <Link
              to="/contact"
              onClick={() => track('cta_click', { location: 'nav_mobile' })}
              className="xl:hidden bg-[#A3E635] px-3.5 py-2 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-black"
            >
              Аудит →
            </Link>
            <button
              type="button"
              aria-label="Відкрити меню"
              onClick={() => setMenuOpen(true)}
              className="xl:hidden p-2 border border-black/15 hover:border-black/40 transition-colors"
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </header>

      {/* Fullscreen mobile menu — staggered links */}
      <div
        aria-hidden={!menuOpen}
        className={`menu-overlay fixed inset-0 z-[60] bg-white/95 backdrop-blur-md flex flex-col overflow-y-auto ${
          menuOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-6 h-[68px] border-b border-black/[0.07] shrink-0">
          <Logo />
          <button
            type="button"
            aria-label="Закрити меню"
            onClick={() => setMenuOpen(false)}
            className="p-2 -mr-2 border border-black/15 hover:border-black/40 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 flex flex-col px-6 pt-5 pb-8 overflow-y-auto">
          <div className="flex flex-col">
            {LINKS.map((l, i) => (
              <div key={l.to}>
                <NavLink
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `menu-link flex items-baseline gap-4 py-[0.68rem] border-b border-black/[0.06] ${
                      isActive ? 'text-[#4D7C0F]' : 'text-[#12161C]'
                    } ${menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`
                  }
                  style={{ transitionDelay: menuOpen ? `${70 + i * 45}ms` : '0ms' }}
                >
                  <span className="font-pixel text-[0.5rem] text-[#4D7C0F]/80 w-7 shrink-0">
                    0{i + 1}
                  </span>
                  <span className="font-extrabold text-[1.35rem] leading-tight tracking-tight uppercase">
                    {l.label}
                  </span>
                </NavLink>
                {l.to === '/cases' && (
                  <div
                    className={`menu-link flex flex-col border-b border-black/[0.06] py-2 ${
                      menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: menuOpen ? `${90 + i * 45}ms` : '0ms' }}
                  >
                    {CASE_LINKS.map((c) => (
                      <Link
                        key={c.to}
                        to={c.to}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-baseline justify-between gap-3 pl-11 pr-1 py-[0.42rem] text-[0.78rem] uppercase tracking-wide text-black/60 hover:text-[#4D7C0F] transition-colors"
                      >
                        <span className="truncate">{c.label}</span>
                        <span className="font-mono text-[0.66rem] text-[#4D7C0F] shrink-0">{c.num}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            className={`menu-link mt-auto pt-8 flex flex-col gap-5 ${
              menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: menuOpen ? `${90 + LINKS.length * 45}ms` : '0ms' }}
          >
            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className="block bg-[#A3E635] text-black text-center font-mono text-sm font-bold uppercase tracking-[0.12em] px-8 py-4"
            >
              Забронювати сесію →
            </Link>
            <a
              href={BRIEF_URL}
              target="_blank"
              rel="noopener"
              onClick={() => {
                setMenuOpen(false);
                track('cta_click', { location: 'menu_brief' });
              }}
              className="block border border-black/30 text-center font-mono text-sm font-bold uppercase tracking-[0.12em] px-8 py-4"
            >
              Заповнити бриф →
            </a>
            <div className="flex items-center justify-between font-mono text-[0.68rem] text-[#5A6472]">
              <a href="tel:+380999188260" className="hover:text-[#12161C] transition-colors">
                +38 099 918 82 60
              </a>
              <a
                href="mailto:pashasidorenko18@gmail.com"
                className="hover:text-[#12161C] transition-colors"
              >
                Написати нам
              </a>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
