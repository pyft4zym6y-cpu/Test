import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SYSTEMS } from '@/data/xray';
import './system.css';

/**
 * COMMERCE OS — «Де ваш бізнес втрачає гроші». 8 систем як верхній рівень,
 * домени вкладено (акордеон). Логіка кожного рядка за ТЗ §3:
 * система → зона → проблема → де витікають гроші → причини → що перевірити.
 * Сканована повна карта, що доповнює кінематографічний розбір (SystemsFilm)
 * і нативно веде в діагностику.
 */
export function CommerceMap() {
  const [open, setOpen] = useState<number>(0);   // класичний акордеон: один відкритий

  return (
    <section className="cmap sysx" aria-label="Commerce OS — де бізнес втрачає гроші">
      <div className="cmap-in">
        <div className="cmap-head">
          <span className="sysx-kick">Commerce OS · повна карта</span>
          <h2 className="sysx-display cmap-h">Де ваш бізнес<br /><span className="sysx-em">втрачає гроші</span></h2>
          <p className="cmap-lead">Вісім систем — верхній рівень. Розгорніть будь-яку: <b>зона → проблема → де витікають гроші → причини → що перевірити</b>. Це і є те, що діагностика проходить за вас.</p>
        </div>

        <div className="cmap-list">
          {SYSTEMS.map((s, i) => {
            const isOpen = open === i;
            return (
              <div key={s.key} className={'cmap-row' + (isOpen ? ' is-open' : '')}>
                <button className="cmap-row-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span className="cmap-num mono">{s.num}</span>
                  <span className="cmap-row-t">
                    <b>{s.title}</b>
                    <i className="mono">{s.en}</i>
                  </span>
                  <span className="cmap-when mono">{s.when}</span>
                  <span className="cmap-caret" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <div className="cmap-body">
                    <div className="cmap-col">
                      <span className="cmap-lab mono">Проблема</span>
                      <p className="cmap-feel">«{s.feel}»</p>
                      <span className="cmap-lab mono">Причини / симптоми</span>
                      <ul className="cmap-pains">{s.pains.slice(0, 5).map((p) => <li key={p}>{p}</li>)}</ul>
                    </div>
                    <div className="cmap-col">
                      <span className="cmap-lab mono">Що перевіряємо (домени)</span>
                      <div className="cmap-domains">{s.domains.map((d) => <span key={d} className="cmap-domain">{d}</span>)}</div>
                      <span className="cmap-lab mono">Будуємо</span>
                      <p className="cmap-sell">{s.sell}</p>
                      <Link to={`/systems/${s.slug}`} className="cmap-more mono">Детальніше про систему →</Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="cmap-cta">
          <span className="cmap-cta-note mono">Не впевнені, де саме витікає у вас? Діагностика знайде вузьке місце за 5 хвилин.</span>
          <Link to="/diagnose" className="sysx-cta is-primary">Знайти своє вузьке місце →</Link>
        </div>
      </div>
    </section>
  );
}
