import { useEffect, useState } from 'react';
import AvatarBot from './AvatarBot';
import { BOT_VARIANT } from './botConfig';

/**
 * Міні-асистент у куті сторінки: аватар + бульбашка,
 * що реагує на say()/sayIdle() з будь-якого елемента сторінки.
 */
export default function MiniBot({ idleText }: { idleText: string }) {
  const [phrase, setPhrase] = useState(idleText);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    const onSay = (e: Event) => {
      const text = (e as CustomEvent).detail?.text;
      if (typeof text === 'string') setPhrase(text);
    };
    const onIdle = () => setPhrase(idleText);
    window.addEventListener('weexp-say', onSay);
    window.addEventListener('weexp-idle', onIdle);
    return () => {
      window.removeEventListener('weexp-say', onSay);
      window.removeEventListener('weexp-idle', onIdle);
    };
  }, [idleText]);

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

  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-40 items-end gap-3 pointer-events-none">
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
      <div className="shrink-0 girl-float">
        <AvatarBot variant={BOT_VARIANT} size={64} />
      </div>
    </div>
  );
}
