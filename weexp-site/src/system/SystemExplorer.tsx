import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SYSTEMS, SHORT } from '@/data/xray';
import './system.css';

const ExplorerCanvas = lazy(() => import('@/system/ExplorerCanvas').then((m) => ({ default: m.ExplorerCanvas })));

/**
 * Інтерактивний блок головної: «Досліди систему». Клік по будь-якій із семи
 * категорій 1-го рівня наближає її, довкола віялом розходяться підкатегорії-
 * процеси (з лейблами), відкривається панель із деталями. Це і є та взаємодія,
 * якої очікуєш від живого об'єкта. Не скрол — пряма маніпуляція.
 */
const MAX_SUB = 5;

export function SystemExplorer() {
  const [focused, setFocused] = useState<number | null>(null);
  const focusedRef = useRef<number | null>(null);
  const hoverRef = useRef<number | null>(null);
  const subLabels = useRef(Array.from({ length: MAX_SUB }, () => ({ x: 50, y: 50, vis: 0 })));
  const labelEls = useRef<(HTMLDivElement | null)[]>([]);
  focusedRef.current = focused;

  // rAF: вішаємо лейбли підпроцесів на спроєктовані позиції.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const L = subLabels.current;
      for (let k = 0; k < MAX_SUB; k++) {
        const el = labelEls.current[k]; if (!el) continue;
        el.style.left = L[k].x.toFixed(2) + '%';
        el.style.top = L[k].y.toFixed(2) + '%';
        el.style.opacity = String(Math.max(0, Math.min(1, L[k].vis)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const sys = focused !== null ? SYSTEMS[focused] : null;

  return (
    <section className="sysx sysx-explorer" aria-label="Досліди систему">
      <span className="sysx-field" aria-hidden="true" />
      <div className="sxp-stage">
        <Suspense fallback={null}>
          <ExplorerCanvas focusedRef={focusedRef} hoverRef={hoverRef} subLabels={subLabels} onPick={(i) => setFocused(i)} />
        </Suspense>

        {/* Лейбли підпроцесів (позиціонуються rAF-ом) */}
        <div className="sxp-labels" aria-hidden={focused === null}>
          {Array.from({ length: MAX_SUB }, (_, k) => (
            <div key={k} ref={(el) => { labelEls.current[k] = el; }} className="sxp-label">
              <span className="sxp-label-dot" /><span className="sxp-label-t">{sys?.domains[k] ?? ''}</span>
            </div>
          ))}
        </div>

        {/* Заголовок / підказка */}
        <div className={'sxp-intro' + (focused !== null ? ' is-hidden' : '')}>
          <span className="sysx-kick">Досліди систему · інтерактив</span>
          <h2 className="sysx-display sxp-h">Клікни будь-яку<br />із <span className="sysx-em">семи систем</span>.</h2>
          <p className="sxp-lead">Категорія наблизиться, а від неї розійдуться процеси всередині. Ось як влаштована система, якою ми керуємо.</p>
          <span className="sxp-hint mono">↑ наведіть і клікніть вузол</span>
          {/* Доступна з клавіатури альтернатива клікам по canvas (WCAG 2.1.1) */}
          <div className="sxp-picker" role="group" aria-label="Оберіть одну із семи систем">
            {SYSTEMS.map((s, i) => (
              <button key={s.key} type="button" className="sxp-pick mono" onClick={() => setFocused(i)}>
                <b>{s.num}</b> {SHORT[s.key]}
              </button>
            ))}
          </div>
        </div>

        {/* Панель сфокусованої системи */}
        {sys && (
          <div className="sxp-panel">
            <button className="sxp-close mono" onClick={() => setFocused(null)} aria-label="Назад до огляду">← усі системи</button>
            <span className="sxp-panel-en mono">{sys.en} · {sys.num}/07</span>
            <h3 className="sysx-display sxp-panel-h">{sys.title}</h3>
            <p className="sxp-panel-feel">«{sys.feel}»</p>
            <div className="sxp-flow">
              {sys.flow.map((f, k) => (
                <span key={f} className="sxp-flow-node">{f}{k < sys.flow.length - 1 && <i className="sxp-flow-link" />}</span>
              ))}
            </div>
            <p className="sxp-panel-sell"><b className="mono">Будуємо:</b> {sys.sell}</p>
            <Link to="/systems" className="sysx-cta is-primary sxp-cta">Розібрати у «7 системах» →</Link>
          </div>
        )}
      </div>
    </section>
  );
}
