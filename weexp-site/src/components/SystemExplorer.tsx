import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SYSTEMS } from '@/data/xray';
import './system-explorer.css';

/**
 * Інтерактивна розборка 7 систем: зліва — індекс, справа — скляна панель, що
 * морфить під активну систему (ланцюг, «що ламається», ідея). Наведення/клік
 * перемикають; на мобільному індекс — горизонтальний скрол, панель нижче.
 */
export function SystemExplorer() {
  const [active, setActive] = useState(0);
  const s = SYSTEMS[active];
  return (
    <section className="wrap sx">
      <div className="sx-grid">
        <div className="sx-rail" role="tablist" aria-label="7 систем бізнесу">
          {SYSTEMS.map((sys, i) => (
            <button
              key={sys.key}
              role="tab"
              aria-selected={i === active}
              className={`sx-item${i === active ? ' is-on' : ''}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
            >
              <span className="sx-item-num mono">{sys.num}</span>
              <span className="sx-item-title">{sys.title}</span>
              <span className="sx-item-go mono" aria-hidden="true">→</span>
            </button>
          ))}
        </div>

        <div className="sx-panel">
          <div className="sx-panel-in" key={active}>
            <span className="sx-en mono">Система {s.num} · {s.en}</span>
            <h3 className="sx-h">{s.title}</h3>
            <p className="sx-feel">«{s.feel}»</p>
            <p className="sx-idea">{s.bigIdea}</p>
            <div className="sx-flow">
              {s.flow.map((f, i) => (
                <span key={f} className="sx-flow-step mono">{f}{i < s.flow.length - 1 && <i>→</i>}</span>
              ))}
            </div>
            <div className="sx-pains">
              <span className="sx-pains-lab mono">Що ламається</span>
              <ul>{s.pains.slice(0, 4).map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
            <Link to={`/challenges/${s.slug}`} className="sx-link mono">Розібрати систему {s.num} →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
