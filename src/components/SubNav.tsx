import { useEffect, useState } from 'react';

export type SubNavItem = { id: string; label: string };

/*
 * Липка під-навігація великої сторінки: кріпиться одразу ПІД фіксованою
 * шапкою (висоту міряємо, бо на мобайлі вона інша — інакше пункти
 * ховаються за вёрстку шапки). Скрол — програмний (scrollIntoView),
 * без href="#…", щоб не конфліктувати з HashRouter в артефакт-збірці.
 */
export default function SubNav({ items }: { items: SubNavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');
  const [top, setTop] = useState(64);

  useEffect(() => {
    const measure = () =>
      setTop(document.querySelector('header')?.getBoundingClientRect().height ?? 64);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

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
    <div
      className="sticky z-40 bg-white/95 backdrop-blur-md border-b border-black/[0.07]"
      style={{ top }}
    >
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
