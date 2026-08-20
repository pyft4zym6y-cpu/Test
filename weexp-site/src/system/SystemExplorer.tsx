import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { SYSTEMS, localizeSystem, shortOf } from '@/data/xray';
import { useT, useLang } from '@/i18n';
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
  const t = useT();
  const lang = useLang();
  const [focused, setFocused] = useState<number | null>(null);
  const focusedRef = useRef<number | null>(null);
  const hoverRef = useRef<number | null>(null);
  const subLabels = useRef(Array.from({ length: MAX_SUB }, () => ({ x: 50, y: 50, vis: 0 })));
  const labelEls = useRef<(HTMLDivElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  focusedRef.current = focused;

  // Коли обрано систему — підводимо панель деталей у поле зору (важливо на мобілі,
  // де панель зʼявляється в потоці одразу під чіпами). block:'nearest' не смикає, якщо вже видно.
  useEffect(() => {
    if (focused !== null) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [focused]);

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
  const sl = sys ? localizeSystem(sys, lang) : null;

  return (
    <section className="sysx sysx-explorer" aria-label={t('Досліди систему', 'Explore the system')}>
      <span className="sysx-field" aria-hidden="true" />
      <div className="sxp-stage">
        <Suspense fallback={null}>
          <ExplorerCanvas focusedRef={focusedRef} hoverRef={hoverRef} subLabels={subLabels} onPick={(i) => setFocused(i)} />
        </Suspense>

        {/* Лейбли підпроцесів (позиціонуються rAF-ом) */}
        <div className="sxp-labels" aria-hidden={focused === null}>
          {Array.from({ length: MAX_SUB }, (_, k) => (
            <div key={k} ref={(el) => { labelEls.current[k] = el; }} className="sxp-label">
              <span className="sxp-label-dot" /><span className="sxp-label-t">{sl?.domains[k] ?? ''}</span>
            </div>
          ))}
        </div>

        {/* Заголовок / підказка — лишається видимим і коли обрано систему (майстер-деталь):
            зліва заголовок + активні кнопки, справа деталі обраної системи. */}
        <div className={'sxp-intro' + (focused !== null ? ' is-focused' : '')}>
          <span className="sysx-kick">{t('Досліди систему · інтерактив', 'Explore the system · interactive')}</span>
          <h2 className="sysx-display sxp-h">{t('Клікни будь-яку', 'Click any')}<br />{t('із ', 'of the ')}<span className="sysx-em">{t('восьми систем', 'eight systems')}</span>.</h2>
          <p className="sxp-lead">{t('Категорія наблизиться, а від неї розійдуться процеси всередині. Ось як влаштована система, якою ми керуємо.', 'The category moves closer, and the processes inside fan out from it. This is how the system we run is built.')}</p>
          <span className="sxp-hint mono">{t('↑ наведіть і клікніть вузол', '↑ hover and click a node')}</span>
          {/* Доступна з клавіатури альтернатива клікам по canvas (WCAG 2.1.1) */}
          <div className="sxp-picker" role="group" aria-label={t('Оберіть одну із восьми систем', 'Pick one of the eight systems')}>
            {SYSTEMS.map((s, i) => (
              <button key={s.key} type="button" className={`sxp-pick mono${focused === i ? ' is-on' : ''}`} onClick={() => setFocused(i)}>
                <b>{s.num}</b> {shortOf(s.key, lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Панель сфокусованої системи */}
        {sl && (
          <div className="sxp-panel" ref={panelRef}>
            <button className="sxp-close mono" onClick={() => setFocused(null)} aria-label={t('Назад до огляду', 'Back to overview')}>{t('← усі системи', '← all systems')}</button>
            <span className="sxp-panel-en mono">{sl.en} · {sl.num}/08</span>
            <h3 className="sysx-display sxp-panel-h">{sl.title}</h3>
            <p className="sxp-panel-feel">«{sl.feel}»</p>
            <div className="sxp-flow">
              {sl.flow.map((f, k) => (
                <span key={f} className="sxp-flow-node">{f}{k < sl.flow.length - 1 && <i className="sxp-flow-link" />}</span>
              ))}
            </div>
            <p className="sxp-panel-sell"><b className="mono">{t('Будуємо:', 'We build:')}</b> {sl.sell}</p>
          </div>
        )}
      </div>
    </section>
  );
}
