const LINKS = [
  { href: '#ecosystem', label: 'Екосистема' },
  { href: '#program', label: 'Програма' },
  { href: '#courses', label: 'Курси' },
  { href: '#enroll', label: 'Запис' },
];

export default function Nav() {
  return (
    <header className="absolute top-0 left-0 w-full z-50">
      <nav className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-5">
        <a href="#top" className="flex items-center gap-3 text-white">
          <svg width="28" height="28" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M60 120C26.8629 120 0 93.1371 0 60V0C22.5654 0 42.2213 12.4569 52.4662 30.8691C38.4788 34.2089 28.0787 46.7902 28.0787 61.8006V63.1443C28.0787 79.9648 41.7146 93.6006 58.5353 93.6006H59.8789L59.8785 61.8006C59.8785 79.3633 74.1159 93.6006 91.6787 93.6006L91.6787 61.8006C91.6787 44.2783 77.5071 30.0661 60 30.0008L60 0H62.5352C94.2722 0 120 25.7279 120 57.4648V60C120 93.1371 93.1371 120 60 120Z"
              fill="white"
            />
          </svg>
          <span className="font-italiana text-lg tracking-[0.15em] uppercase">
            Commerce Architecture
          </span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-white/80 hover:text-white text-[13px] uppercase tracking-wider transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
