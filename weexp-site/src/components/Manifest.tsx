import { useEffect, useRef } from 'react';
import SplitType from 'split-type';
import { gsap } from '@/lib/gsap';
import './manifest.css';

/**
 * Маніфест — контент брендбука + scroll-scrubbed word-reveal (split-type + GSAP
 * ScrollTrigger). Переиздание механики AnimatedText старого сайта на новом стеке.
 */
export function Manifest() {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const split = new SplitType(el, { types: 'words' });
    // подсветить ключевую фразу; она остаётся полностью зажжённой (акцент + AA-контраст)
    const words = split.words ?? [];
    words.forEach((w) => { if (/Independence|Score/i.test(w.textContent || '')) w.classList.add('mk'); });
    const reveal = words.filter((w) => !w.classList.contains('mk'));
    const ctx = gsap.context(() => {
      // floor 0.4 (не 0.14): даже «непроявленный» крупный текст проходит AA-контраст (axe)
      gsap.from(reveal, {
        opacity: 0.4, stagger: 0.04,
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 58%', scrub: 0.6 },
      });
    }, el);
    return () => { ctx.revert(); split.revert(); };
  }, []);

  return (
    <section className="mf" data-say="Ми не продаємо CRM і маркетплейси. Ми піднімаємо Independence Score.">
      <div className="wrap">
        <div className="eyebrow"><span className="eb-mark" />Маніфест</div>
        <p className="mf-text" ref={ref}>
          Ми не продаємо CRM і маркетплейси. Ми піднімаємо Independence Score — і залишаємо систему,
          що працює без засновника. Діагноз у грошах, побудова, передача. Ми будуємо, щоб піти.
        </p>
      </div>
    </section>
  );
}
