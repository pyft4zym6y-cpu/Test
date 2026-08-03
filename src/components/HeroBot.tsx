import { useEffect, useState } from 'react';
import AvatarBot from './AvatarBot';
import { BOT_VARIANT } from './botConfig';
import { IDLE_PHRASE } from './speech';

/** Великий асистент для hero: аватар + термінальна репліка з друкарською машинкою. */
export default function HeroBot() {
  const [phrase, setPhrase] = useState(IDLE_PHRASE);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    const onSay = (e: Event) => {
      const text = (e as CustomEvent).detail?.text;
      if (typeof text === 'string') setPhrase(text);
    };
    const onIdle = () => setPhrase(IDLE_PHRASE);
    window.addEventListener('weexp-say', onSay);
    window.addEventListener('weexp-idle', onIdle);
    return () => {
      window.removeEventListener('weexp-say', onSay);
      window.removeEventListener('weexp-idle', onIdle);
    };
  }, []);

  useEffect(() => {
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(phrase.slice(0, i));
      if (i >= phrase.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [phrase]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="card p-4 w-full bg-white/95"
        style={{ borderColor: 'rgba(101,163,13,0.45)' }}
        role="status"
        aria-live="polite"
      >
        <p className="font-pixel text-[0.5rem] text-[#4D7C0F] mb-2">WEEXP·OS · ONLINE</p>
        <p className="font-mono text-[0.72rem] leading-relaxed text-[#12161C] min-h-[3.6em]">
          {typed}
          <span className="cursor-blink text-[#4D7C0F]">▊</span>
        </p>
      </div>
      <div className="girl-float">
        <AvatarBot variant={BOT_VARIANT} size={260} />
      </div>
      <div className="flex gap-2 font-mono text-[0.62rem] text-[#5A6472]">
        <span className="chip-dark px-3 py-1.5">CR 4,2%</span>
        <span className="chip-dark px-3 py-1.5">LTV:CAC ≥3</span>
        <span className="chip-dark px-3 py-1.5">ROI 3.8×</span>
      </div>
    </div>
  );
}
