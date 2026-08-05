import { Link } from 'react-router-dom';
import { Linkedin, Mail, Phone, ArrowUp } from 'lucide-react';

const NAV_LINKS = [
  { to: '/os', label: 'Commerce OS' },
  { to: '/cases', label: 'Кейси' },
  { to: '/services', label: 'Співпраця' },
  { to: '/calculator', label: 'Калькулятор розриву' },
  { to: '/estimate', label: 'Оцінка проєкту' },
  { to: '/about', label: 'Про нас' },
];

const CASE_LINKS = [
  { to: '/cases/premium-textile', label: 'Преміум-текстиль · ×18' },
  { to: '/cases/fashion-apparel', label: 'Fashion-виробник · ≥19 млн ₴' },
  { to: '/cases/consumer-dtc', label: 'Consumer DTC · +65%' },
  { to: '/cases/fmcg-distribution', label: 'FMCG-дистриб’ютор · 17K SKU' },
  { to: '/cases', label: 'Всі кейси →' },
];

const FORMAT_LINKS = [
  { to: '/services', label: 'Аудит · $2,900 фікс' },
  { to: '/services', label: 'Консалтинг і супровід · $50/год' },
  { to: '/services', label: 'Управління проєктом · від $3K/міс' },
];

export default function Footer() {
  return (
    <footer data-bot-say="Дійшов до кінця? Тоді час діяти: кнопка «Забронювати сесію» — просто тут, у підвалі 😉" className="border-t border-black/10 grid-bg">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10">
        {/* Top: brand + link columns (mobile — 2 акуратні колонки) */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr] py-10 md:py-14">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 256 256" fill="none" aria-hidden="true">
                <path
                  d="M 160 88 L 194 34 L 216 0 L 256 0 L 256 40 L 221.5 93.5 L 200 128 L 256 128 L 256 256 L 96 256 L 96 168 L 64.246 220 L 40 256 L 0 256 L 0 216 L 34 162 L 56 128 L 0 128 L 0 0 L 160 0 Z"
                  fill="#12161C"
                />
              </svg>
              <span className="font-pixel text-xs leading-none pt-0.5">
                WEEXP<span className="text-[#4D7C0F]">·OS</span>
              </span>
            </Link>
            <p className="text-[#5A6472] text-sm mt-5 max-w-xs leading-relaxed">
              Команда, що будує e-commerce як актив: Commerce OS™ — операційна система росту, за
              якою вартість компанії зростає швидше за рекламні бюджети.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://linkedin.com/in/pvsidorenko"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="p-2.5 border border-black/15 text-black/70 hover:text-[#4D7C0F] hover:border-[#65A30D]/50 transition-colors"
              >
                <Linkedin size={16} />
              </a>
              <a
                href="mailto:pashasidorenko18@gmail.com"
                aria-label="Email"
                className="p-2.5 border border-black/15 text-black/70 hover:text-[#4D7C0F] hover:border-[#65A30D]/50 transition-colors"
              >
                <Mail size={16} />
              </a>
              <a
                href="tel:+380999188260"
                aria-label="Телефон"
                className="p-2.5 border border-black/15 text-black/70 hover:text-[#4D7C0F] hover:border-[#65A30D]/50 transition-colors"
              >
                <Phone size={16} />
              </a>
            </div>
          </div>

          {/* Navigation + Formats */}
          <nav aria-label="Сторінки">
            <p className="font-pixel text-[0.55rem] uppercase text-black/65 mb-3.5">Навігація</p>
            <ul className="flex flex-col gap-2">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-[0.82rem] text-[#3F4854] hover:text-[#4D7C0F] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="font-pixel text-[0.55rem] uppercase text-black/65 mt-6 mb-3.5">Формати</p>
            <ul className="flex flex-col gap-2">
              {FORMAT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-[0.82rem] text-[#3F4854] hover:text-[#4D7C0F] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Cases */}
          <nav aria-label="Кейси">
            <p className="font-pixel text-[0.55rem] uppercase text-black/65 mb-3.5">Кейси</p>
            <ul className="flex flex-col gap-2">
              {CASE_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-[0.82rem] text-[#3F4854] hover:text-[#4D7C0F] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contacts + CTA */}
          <div className="col-span-2 lg:col-span-1 border-t border-black/[0.07] pt-8 lg:border-0 lg:pt-0">
            <p className="font-pixel text-[0.55rem] uppercase text-black/65 mb-4">Контакти</p>
            <ul className="flex flex-col gap-2.5 font-mono text-[0.78rem] text-[#2F3742]">
              <li>
                <a href="mailto:pashasidorenko18@gmail.com" className="hover:text-[#4D7C0F] transition-colors">
                  pashasidorenko18@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+380999188260" className="hover:text-[#4D7C0F] transition-colors">
                  +38 099 918 82 60
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/in/pvsidorenko"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#4D7C0F] transition-colors"
                >
                  linkedin.com/in/pvsidorenko
                </a>
              </li>
              <li className="text-[#5A6472]">Україна · онлайн · проєкти в ЄС і US</li>
            </ul>
            <Link
              to="/contact"
              className="inline-block mt-6 border border-[#65A30D] text-[#4D7C0F] px-6 py-3 text-xs tracking-widest uppercase hover:bg-[#65A30D] hover:text-[#12161C] transition-colors"
            >
              Забронювати сесію →
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-black/10 py-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
          <p className="text-xs text-black/60">
            © 2026 weexp · Commerce OS™. Всі права захищені.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-black/60">
            <Link to="/privacy" className="hover:text-[#12161C] transition-colors">
              Політика конфіденційності
            </Link>
            <Link to="/offer" className="hover:text-[#12161C] transition-colors">
              Публічна оферта
            </Link>
            <span className="font-mono text-black/60">56 плейбуків · 52 метрики · 18 доменів</span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Вгору"
              className="p-2 border border-black/15 text-black/60 hover:text-[#4D7C0F] hover:border-[#65A30D]/50 transition-colors"
            >
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
