import { useEffect, useState } from 'react';

export type SubNavItem = { id: string; label: string };

/*
 * Липка під-навігація великої сторінки. Скрол — програмний (scrollIntoView),
 * без href="#…", щоб не конфліктувати з HashRouter в артефакт-збірці.
 */
export default function SubNav({ items }: { items: SubNavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');

  useEffect(() => {
    const onScroll = () => {
      let current = items[0]?.id ?? '';
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= 140) current = it.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);

  return (
    <div className="sticky top-[64px] z-40 bg-white/92 backdrop-blur-md border-b border-black/[0.07]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 flex gap-1 overflow-x-auto no-scrollbar">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => document.getElementById(it.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className={`shrink-0 px-3.5 py-3 font-mono text-[0.62rem] uppercase tracking-[0.16em] border-b-2 transition-colors ${
              active === it.id
                ? 'border-[#65A30D] text-[#4D7C0F]'
                : 'border-transparent text-[#5A6472] hover:text-[#12161C]'
            }`}
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}
