import { useEffect, useRef, useState } from 'react';
import AvatarBot from './AvatarBot';
import { BOT_VARIANT } from './botConfig';
import { say } from './speech';

const HOME_IDLE = 'Я поруч! Скроль далі — підкажу, що де на сторінці 👇';

/**
 * «Бігаючий» асистент головної: після скролу повз hero докається в кут,
 * біжить за користувачем із 3D-нахилами (крен за швидкістю скролу,
 * розворот за курсором) і сам коментує секції, що з'являються на екрані.
 */
export default function ScrollBot() {
  const [docked, setDocked] = useState(false);
  const [phrase, setPhrase] = useState(HOME_IDLE);
  const [typed, setTyped] = useState('');
  const rigRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);

  /* ---- Speech events (спільна шина з наведеннями) ---- */
  useEffect(() => {
    const onSay = (e: Event) => {
      const text = (e as CustomEvent).detail?.text;
      if (typeof text === 'string') setPhrase(text);
    };
    const onIdle = () => setPhrase(HOME_IDLE);
    window.addEventListener('weexp-say', onSay);
    window.addEventListener('weexp-idle', onIdle);
    return () => {
      window.removeEventListener('weexp-say', onSay);
      window.removeEventListener('weexp-idle', onIdle);
    };
  }, []);

  /* ---- Typewriter ---- */
  useEffect(() => {
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(phrase.slice(0, i));
      if (i >= phrase.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [phrase]);

  /* ---- Автокоментарі секцій головної ---- */
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-bot-say]');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const t = (e.target as HTMLElement).dataset.botSay;
            if (t && window.scrollY > 380) say(t);
          }
        }
      },
      { threshold: 0.45 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* ---- Док + «біг» із 3D-фізикою ---- */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let lastY = window.scrollY;
    let vel = 0; // згладжена швидкість скролу
    let kick = 0; // миттєвий приріст
    let phase = 0;
    let mouseTilt = 0;
    let mouseGoal = 0;

    const onScroll = () => {
      const y = window.scrollY;
      kick += y - lastY;
      lastY = y;
      setDocked(y > 420);
    };
    const onMove = (e: MouseEvent) => {
      mouseGoal = ((e.clientX / window.innerWidth) * 2 - 1) * 16;
    };

    const tick = () => {
      vel += (kick - vel) * 0.12;
      kick *= 0.82;
      mouseTilt += (mouseGoal - mouseTilt) * 0.08;

      const speed = Math.min(Math.abs(vel), 40);
      phase += 0.09 + speed * 0.012;

      // біг: підстрибування частішає зі швидкістю; у спокої — плавний float
      const bob = Math.sin(phase) * (3 + speed * 0.22);
      const pitch = Math.max(-22, Math.min(22, vel * 0.55)); // нахил «вперед» у 3D
      const lean = Math.max(-10, Math.min(10, vel * 0.25)); // крен корпусу

      if (rigRef.current && !reduced) {
        rigRef.current.style.transform = `translateY(${bob.toFixed(1)}px) rotateX(${pitch.toFixed(1)}deg) rotateY(${mouseTilt.toFixed(1)}deg) rotateZ(${lean.toFixed(1)}deg)`;
      }
      if (linesRef.current) {
        linesRef.current.style.opacity = String(Math.min(1, speed / 10));
      }
      raf = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });
    if (!reduced) raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className={`hidden md:flex fixed bottom-6 right-6 z-40 items-end gap-3 pointer-events-none transition-all duration-500 ${
        docked ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div
        className="card p-3.5 max-w-[280px] bg-white/95 backdrop-blur-sm"
        style={{ borderColor: 'rgba(101,163,13,0.45)', boxShadow: '0 10px 30px rgba(10,14,18,0.12)' }}
      >
        <p className="font-pixel text-[0.45rem] text-[#65A30D] mb-1.5">WEEXP·OS</p>
        <p className="font-mono text-[0.66rem] leading-relaxed text-[#12161C] min-h-[2.4em]">
          {typed}
          <span className="cursor-blink text-[#65A30D]">▊</span>
        </p>
      </div>

      <div className="relative shrink-0" style={{ perspective: '520px' }}>
        {/* спід-лайни, коли «біжить» */}
        <div ref={linesRef} className="absolute right-full top-1/2 -translate-y-1/2 mr-1.5 flex flex-col gap-1.5 opacity-0">
          <span className="block h-[2px] w-6 bg-[#65A30D]/70 rounded-full" />
          <span className="block h-[2px] w-4 bg-[#65A30D]/50 rounded-full ml-2" />
          <span className="block h-[2px] w-5 bg-[#65A30D]/60 rounded-full" />
        </div>
        <div ref={rigRef} style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
          <AvatarBot variant={BOT_VARIANT} size={72} />
        </div>
        {/* тінь, що «дихає» під ботом */}
        <div className="mx-auto mt-0.5 h-1.5 w-10 rounded-full bg-black/15 blur-[2px]" />
      </div>
    </div>
  );
}
