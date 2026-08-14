import { Link, useNavigate } from 'react-router-dom';
import { PAINS, TACTICAL_PAINS, PAINS_QID, PAINS_CUSTOM_QID, type Pain } from '../data/pains';
import { useAnswers } from '../lib/useAnswers';

export default function PainsPage() {
  const { rows, loaded, save } = useAnswers();
  const nav = useNavigate();
  const selected = (rows[PAINS_QID]?.answer ?? '').split(' | ').filter(Boolean);

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    save(PAINS_QID, { answer: next.join(' | ') });
  };

  const PainCard = ({ p, fire }: { p: Pain; fire?: boolean }) => {
    const on = selected.includes(p.id);
    return (
      <button
        type="button"
        onClick={() => toggle(p.id)}
        className="card"
        style={{
          textAlign: 'left',
          cursor: 'pointer',
          borderColor: on ? (fire ? 'var(--red)' : 'var(--lime)') : fire ? 'rgba(220,38,38,0.25)' : undefined,
          background: on ? (fire ? '#FEF1F1' : '#F4FBE8') : '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <h2 style={{ fontSize: 15.5 }}>{fire ? '🔥 ' : ''}{p.title}</h2>
          <span className="mono" style={{ color: on ? (fire ? 'var(--red)' : 'var(--lime-dark)') : 'var(--line)', fontWeight: 700 }}>
            {on ? '✓' : '+'}
          </span>
        </div>
        <p className="sub" style={{ margin: 0, fontSize: 13 }}>{p.desc}</p>
      </button>
    );
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
        Два уровня: <b>что горит прямо сейчас</b> (решается днями — этим займёмся первым) и{' '}
        <b>что болит системно</b> (решается программой). Выберите всё, что откликается.
      </p>

      {!loaded ? (
        <p className="sub" style={{ marginTop: 20 }}>Загрузка…</p>
      ) : (
        <>
          <p className="eyebrow" style={{ margin: '24px 0 10px', color: 'var(--red)' }}>
            Тактика · горит прямо сейчас
          </p>
          <p className="sub" style={{ fontSize: 12.5, marginBottom: 10, maxWidth: 620 }}>
            Пожары: если отметите — в отчёте появится план первой помощи на 24–48 часов, и трек
            диагностики начнётся с этих зон.
          </p>
          <div className="grid cols2">
            {TACTICAL_PAINS.map((p) => <PainCard key={p.id} p={p} fire />)}
          </div>

          <p className="eyebrow" style={{ margin: '26px 0 10px' }}>
            Стратегия · болит системно
          </p>
          <p className="sub" style={{ fontSize: 12.5, marginBottom: 10, maxWidth: 620 }}>
            Хронические проблемы, которые не решаются за неделю, — из них собирается программа
            (обычно 2–4 пункта).
          </p>
          <div className="grid cols2">
            {PAINS.map((p) => <PainCard key={p.id} p={p} />)}
          </div>
        </>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <p className="qtext">Что ещё болит — своими словами</p>
        <p className="sub" style={{ fontSize: 12.5, marginBottom: 8 }}>
          Если вашей боли нет в списках — опишите её здесь; пометьте, горит она сейчас или тянется давно.
        </p>
        <textarea
          value={rows[PAINS_CUSTOM_QID]?.answer ?? ''}
          onChange={(e) => save(PAINS_CUSTOM_QID, { answer: e.target.value })}
          placeholder="Например: поставщик поднял цены на 30% и маржа схлопнулась (горит); нет системного маркетинга (давно)…"
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
