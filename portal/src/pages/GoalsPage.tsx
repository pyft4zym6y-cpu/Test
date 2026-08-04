import { Link, useNavigate } from 'react-router-dom';
import { GOALS, GOALS_QID, GOALS_CUSTOM_QID } from '../data/pains';
import { BRIEF_TRIED_QID, BRIEF_TEAM_QID, BRIEF_AMBITION_QID } from '../data/method';
import { useAnswers } from '../lib/useAnswers';

export default function GoalsPage() {
  const { rows, loaded, save } = useAnswers();
  const nav = useNavigate();
  const selected = (rows[GOALS_QID]?.answer ?? '').split(' | ').filter(Boolean);

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    save(GOALS_QID, { answer: next.join(' | ') });
  };

  if (!loaded) return <div className="container" style={{ paddingTop: 50 }}><p className="sub">Загрузка…</p></div>;

  return (
    <div className="container" style={{ padding: '30px 20px 80px', maxWidth: 720 }}>
      <Link to="/company" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← Назад: компания</Link>
      <p className="eyebrow" style={{ marginTop: 14 }}>Шаг 2 · Цели</p>
      <h1>Чего хотите достичь за 12 месяцев?</h1>
      <p className="sub">Верхнеуровнево — «хотим в Европу», «рост продаж». Выберите до 3–4 главных.</p>

      <div className="grid cols2" style={{ marginTop: 20 }}>
        {GOALS.map((g) => {
          const on = selected.includes(g.id);
          return (
            <button key={g.id} type="button" onClick={() => toggle(g.id)} className="card"
              style={{ textAlign: 'left', cursor: 'pointer', borderColor: on ? 'var(--lime)' : undefined, background: on ? '#F4FBE8' : '#fff', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{g.title}</span>
                <span className="mono" style={{ color: on ? 'var(--lime-dark)' : 'var(--line)', fontWeight: 700 }}>{on ? '✓' : '+'}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <p className="qtext">Своими словами (по желанию)</p>
        <textarea
          value={rows[GOALS_CUSTOM_QID]?.answer ?? ''}
          onChange={(e) => save(GOALS_CUSTOM_QID, { answer: e.target.value })}
          placeholder="Например: через 2 года продать 50% фонду; выйти на $1M ARR на Amazon…"
        />
      </div>

      <div className="card" style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p className="eyebrow" style={{ margin: 0 }}>Три вопроса собственнику</p>
        <div>
          <p className="qtext">Что уже пробовали менять — и что не сработало?</p>
          <textarea value={rows[BRIEF_TRIED_QID]?.answer ?? ''}
            onChange={(e) => save(BRIEF_TRIED_QID, { answer: e.target.value })}
            placeholder="Агентства, подрядчики, свои эксперименты — и почему не взлетело…" />
        </div>
        <div>
          <p className="qtext">Готова ли команда к изменениям? Кто будет драйвить внутри?</p>
          <textarea value={rows[BRIEF_TEAM_QID]?.answer ?? ''}
            onChange={(e) => save(BRIEF_TEAM_QID, { answer: e.target.value })}
            placeholder="Кто со стороны компании отвечает за проект, сколько времени готов выделять…" />
        </div>
        <div>
          <p className="qtext">Амбиция: какой вы видите компанию через 3 года?</p>
          <textarea value={rows[BRIEF_AMBITION_QID]?.answer ?? ''}
            onChange={(e) => save(BRIEF_AMBITION_QID, { answer: e.target.value })}
            placeholder="Размер, рынки, роль в жизни владельца…" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
        <button className="btn" disabled={!selected.length && !(rows[GOALS_CUSTOM_QID]?.answer ?? '').trim()} onClick={() => nav('/pains')}>
          Далее: что болит →
        </button>
      </div>
    </div>
  );
}
