import { Link, useNavigate } from 'react-router-dom';
import { PAINS, PAINS_QID } from '../data/pains';
import { useAnswers } from '../lib/useAnswers';

export default function PainsPage() {
  const { rows, loaded, save } = useAnswers();
  const nav = useNavigate();
  const selected = (rows[PAINS_QID]?.answer ?? '').split(' | ').filter(Boolean);

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    save(PAINS_QID, { answer: next.join(' | ') });
  };

  return (
    <div className="container" style={{ padding: '30px 20px 80px' }}>
      <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
        ← На главную
      </Link>
      <p className="eyebrow" style={{ marginTop: 14 }}>
        Шаг 1 · Что болит
      </p>
      <h1>Почему вы обратились?</h1>
      <p className="sub" style={{ maxWidth: 620 }}>
        Выберите всё, что откликается (обычно 2–4 пункта). По ним мы соберём ваш персональный
        трек диагностики — сначала важное, без лишних анкет.
      </p>

      {!loaded ? (
        <p className="sub" style={{ marginTop: 20 }}>
          Загрузка…
        </p>
      ) : (
        <div className="grid cols2" style={{ marginTop: 22 }}>
          {PAINS.map((p) => {
            const on = selected.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className="card"
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderColor: on ? 'var(--lime)' : undefined,
                  background: on ? '#F4FBE8' : '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <h2 style={{ fontSize: 15.5 }}>{p.title}</h2>
                  <span className="mono" style={{ color: on ? 'var(--lime-dark)' : 'var(--line)', fontWeight: 700 }}>
                    {on ? '✓' : '+'}
                  </span>
                </div>
                <p className="sub" style={{ margin: 0, fontSize: 13 }}>
                  {p.desc}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, marginTop: 26, alignItems: 'center' }}>
        <button className="btn" disabled={!selected.length} onClick={() => nav('/')}>
          Собрать мой трек ({selected.length}) →
        </button>
        <span className="sub" style={{ fontSize: 12.5 }}>
          Изменить выбор можно в любой момент.
        </span>
      </div>
    </div>
  );
}
