import { useEffect, useState } from 'react';

const LINKS = [
  { href: '#about', label: 'Про мене' },
  { href: '#system', label: 'Система' },
  { href: '#cases', label: 'Кейси' },
  { href: '#process', label: 'Процес' },
  { href: '#offers', label: 'Умови' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled ? 'bg-[#0B0D10]/85 backdrop-blur-md border-b border-[#232933]' : ''
      }`}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-8 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="eyebrow-dot" />
          <span className="font-mono font-bold text-sm tracking-[0.14em] text-[#A3E635]">
            COMMERCE&nbsp;OS
          </span>
        </a>
        <ul className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[#8C96A5] hover:text-[#E9EDF2] transition-colors duration-200"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#contact"
          className="rounded-full bg-[#A3E635] px-5 py-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#0B0D10] transition-transform duration-200 hover:scale-[1.04]"
        >
          Сесія 30 хв
        </a>
      </nav>
    </header>
  );
}
