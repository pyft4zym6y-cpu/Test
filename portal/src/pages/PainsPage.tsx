import { Link, useNavigate } from 'react-router-dom';
import { PAINS, PAINS_QID, PAINS_CUSTOM_QID } from '../data/pains';
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
      <Link to="/goals" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
        ← Назад: цели
      </Link>
      <p className="eyebrow" style={{ marginTop: 14 }}>
        Шаг 3 · Что болит
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

      <div className="card" style={{ marginTop: 14 }}>
        <p className="qtext">Что ещё болит — своими словами</p>
        <p className="sub" style={{ fontSize: 12.5, marginBottom: 8 }}>
          Если вашей боли нет в списке — опишите её здесь, мы учтём её в диагностике и отчёте.
        </p>
        <textarea
          value={rows[PAINS_CUSTOM_QID]?.answer ?? ''}
          onChange={(e) => save(PAINS_CUSTOM_QID, { answer: e.target.value })}
          placeholder="Например: поставщик поднял цены на 30% и маржа схлопнулась; ключевой маркетолог ушёл…"
        />
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 22, alignItems: 'center' }}>
        <button
          className="btn"
          disabled={!selected.length && !(rows[PAINS_CUSTOM_QID]?.answer ?? '').trim()}
          onClick={() => nav('/')}
        >
          Собрать мой трек →
        </button>
        <span className="sub" style={{ fontSize: 12.5 }}>
          Изменить выбор можно в любой момент.
        </span>
      </div>
    </div>
  );
}
