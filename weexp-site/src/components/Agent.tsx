import { useEffect, useRef, useState } from 'react';
import { IDLE } from '@/lib/bus';
import { useNearFooter } from '@/lib/useNearFooter';
import './agent.css';

/**
 * Агент-нарратор (переосмысленный бот старого сайта). Механика сохранена:
 *  - следит за курсором (зрачок-маркер тянется к указателю, rAF-lerp);
 *  - типографический «голос» с эффектом печати;
 *  - авто-комментарий по скроллу: IntersectionObserver ловит секции с data-say;
 *  - шина weexp-say / weexp-idle; тумблер mute.
 * Оформление — брендовый технический маркер (coral-квадрат), без мультяшности.
 */
export function Agent() {
  const [muted, setMuted] = useState(false);
  const [shown, setShown] = useState('');
  const nearFooter = useNearFooter();
  const targetRef = useRef(IDLE);
  const pupilRef = useRef<HTMLSpanElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const mutedRef = useRef(false);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // typewriter towards targetRef
  useEffect(() => {
    let raf = 0, i = 0, cur = '', tgt = targetRef.current, t0 = performance.now();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = (t: number) => {
      if (targetRef.current !== tgt) { tgt = targetRef.current; cur = ''; i = 0; t0 = t; }
      if (reduce) { setShown(tgt); raf = requestAnimationFrame(tick); return; }
      if (i <= tgt.length && t - t0 > 16) { cur = tgt.slice(0, i); i++; t0 = t; setShown(cur); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // bus + idle
  useEffect(() => {
    const onSay = (e: Event) => { if (!mutedRef.current) targetRef.current = String((e as CustomEvent).detail || ''); };
    const onIdle = () => { targetRef.current = IDLE; };
    window.addEventListener('weexp-say', onSay);
    window.addEventListener('weexp-idle', onIdle);
    return () => { window.removeEventListener('weexp-say', onSay); window.removeEventListener('weexp-idle', onIdle); };
  }, []);

  // cursor tracking (pupil leans toward pointer)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let mx = innerWidth / 2, my = innerHeight / 2, px = 0, py = 0, raf = 0;
    const onMove = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
    const loop = () => {
      const m = markerRef.current, pu = pupilRef.current;
      if (m && pu) {
        const r = m.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
        const tx = (dx / d) * Math.min(4, d / 60), ty = (dy / d) * Math.min(4, d / 60);
        px += (tx - px) * 0.12; py += (ty - py) * 0.12;
        pu.style.transform = `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', onMove); };
  }, []);

  // scroll auto-commentary: narrate the section most in view
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-say]'));
    if (!nodes.length) return;
    const io = new IntersectionObserver((entries) => {
      let best: IntersectionObserverEntry | null = null;
      for (const e of entries) if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
      if (best && !mutedRef.current) {
        const t = (best.target as HTMLElement).dataset.say;
        if (t) targetRef.current = t;
      }
    }, { threshold: [0.35, 0.6] });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <aside className={`agent${muted ? ' is-muted' : ''}${nearFooter ? ' is-away' : ''}`} aria-live="polite" aria-hidden={nearFooter}>
      <div className="agent-marker" ref={markerRef} aria-hidden="true">
        <span className="agent-pupil" ref={pupilRef} />
      </div>
      <div className="agent-body">
        <span className="agent-name mono">WEEXP·OS</span>
        <p className="agent-line mono">{shown}<span className="agent-caret" /></p>
      </div>
      <button className="agent-mute mono" type="button" onClick={() => setMuted((m) => !m)}
        aria-pressed={muted} title={muted ? 'Увімкнути голос' : 'Вимкнути голос'}>
        {muted ? 'off' : 'on'}
      </button>
    </aside>
  );
}
