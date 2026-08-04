import { Link } from 'react-router-dom';
import { useAnswers } from '../lib/useAnswers';
import {
  DECISION_QID, SELF_ITEMS, INFLUENCE, BUDGET_RANGES, TRANCHES, ROLES, selfScore,
  type Decision, type Lpr, type TeamRow,
} from '../data/decision';

const emptyLpr = (): Lpr => ({ name: '', role: 'CEO / Собственник', influence: 'Принимает решение', kpi: '', matters: '' });
const emptyTeam = (): TeamRow => ({ role: '', name: '', hours: '', area: '' });

export default function DecisionPage() {
  const { rows, loaded, save, savedAt } = useAnswers();

  let d: Decision = {};
  try { d = JSON.parse(rows[DECISION_QID]?.answer ?? '{}'); } catch { /* noop */ }
  const set = (patch: Partial<Decision>) => save(DECISION_QID, { answer: JSON.stringify({ ...d, ...patch }) });

  const lprs = d.lprs?.length ? d.lprs : [emptyLpr()];
  const team = d.team?.length ? d.team : [emptyTeam()];
  const problems = [0, 1, 2].map((i) => d.problems?.[i] ?? '');
  const score = selfScore(d.self);

  if (!loaded)
    return <div className="container" style={{ paddingTop: 50 }}><p className="sub">Загрузка…</p></div>;

  return (
    <div className="container" style={{ padding: '30px 20px 80px' }}>
      <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← На главную</Link>
      <h1 style={{ marginTop: 10 }}>Решение и команда</h1>
      <p className="sub" style={{ maxWidth: 640 }}>
        Этот шаг помогает нам собрать план под ваши реальные рамки: кто решает, какой бюджет
        обсуждаем, кто в команде будет делать. Заполняет собственник или CEO.{' '}
        {savedAt && <span className="saved">Сохранено ✓</span>}
      </p>

      {/* Бриф */}
      <div className="card" style={{ marginTop: 18 }}>
        <h2>Своими словами</h2>
        <p className="qtext" style={{ marginTop: 10 }}>Почему вы обратились и что должно измениться?</p>
        <textarea
          placeholder="Не формулируйте «правильно» — пишите как есть…"
          value={d.reason ?? ''}
          onChange={(e) => set({ reason: e.target.value })}
        />
        <p className="qtext" style={{ marginTop: 14 }}>Три главные проблемы бизнеса — по вашей версии</p>
        {problems.map((p, i) => (
          <input
            key={i}
            type="text"
            placeholder={`Проблема ${i + 1}`}
            value={p}
            style={{ marginTop: 6 }}
            onChange={(e) => {
              const next = [...problems];
              next[i] = e.target.value;
              set({ problems: next });
            }}
          />
        ))}
      </div>

      {/* Самооценка */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Самооценка · как вы видите бизнес</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          0 — совсем не про нас, 5 — точно про нас. Потом мы сравним это с картиной по данным —
          расхождение всегда самое интересное место.
        </p>
        {SELF_ITEMS.map((item) => (
          <div key={item.key} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
            <p className="qtext" style={{ fontSize: 13.5, marginBottom: 6 }}>{item.label}</p>
            <div className="chips">
              {[0, 1, 2, 3, 4, 5].map((v) => (
                <span
                  key={v}
                  className={`chip ${d.self?.[item.key] === v ? 'on' : ''}`}
                  onClick={() => set({ self: { ...d.self, [item.key]: v } })}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        ))}
        {score !== null && (
          <p className="mono" style={{ fontSize: 12.5, marginTop: 10 }}>
            Ваша самооценка: <b>{score}/100</b> — сравним с Health Score по данным в отчёте.
          </p>
        )}
      </div>

      {/* ЛПР */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Кто участвует в решении</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          Все, кто влияет на запуск проекта: что для каждого «успех» и что для него важно лично.
        </p>
        {lprs.map((l, i) => (
          <div key={i} className="qcard" style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input type="text" placeholder="Имя" value={l.name} style={{ maxWidth: 160 }}
                onChange={(e) => set({ lprs: lprs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
              <select value={l.role} style={{ maxWidth: 190 }}
                onChange={(e) => set({ lprs: lprs.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) })}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
              <select value={l.influence} style={{ maxWidth: 190 }}
                onChange={(e) => set({ lprs: lprs.map((x, j) => (j === i ? { ...x, influence: e.target.value } : x)) })}>
                {INFLUENCE.map((r) => <option key={r}>{r}</option>)}
              </select>
              {lprs.length > 1 && (
                <button className="chip" onClick={() => set({ lprs: lprs.filter((_, j) => j !== i) })}>✕</button>
              )}
            </div>
            <input type="text" placeholder="Личный KPI / за что отвечает (маржа, рост, снять ручной труд…)"
              value={l.kpi} style={{ marginTop: 6 }}
              onChange={(e) => set({ lprs: lprs.map((x, j) => (j === i ? { ...x, kpi: e.target.value } : x)) })} />
            <input type="text" placeholder="Что для него важно в этом проекте / чего опасается"
              value={l.matters} style={{ marginTop: 6 }}
              onChange={(e) => set({ lprs: lprs.map((x, j) => (j === i ? { ...x, matters: e.target.value } : x)) })} />
          </div>
        ))}
        <button className="chip" style={{ marginTop: 10 }} onClick={() => set({ lprs: [...lprs, emptyLpr()] })}>
          + Добавить участника
        </button>
      </div>

      {/* Рамки */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Рамки решения</h2>
        <div className="grid cols2" style={{ marginTop: 10 }}>
          <div>
            <p className="qtext" style={{ fontSize: 13 }}>Вилка бюджета на программу (первый год)</p>
            <div className="chips">
              {BUDGET_RANGES.map((r) => (
                <span key={r} className={`chip ${d.budget?.range === r ? 'on' : ''}`}
                  onClick={() => set({ budget: { ...d.budget, range: r } })}>{r}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="qtext" style={{ fontSize: 13 }}>Формат оплаты</p>
            <div className="chips">
              {TRANCHES.map((r) => (
                <span key={r} className={`chip ${d.budget?.tranches === r ? 'on' : ''}`}
                  onClick={() => set({ budget: { ...d.budget, tranches: r } })}>{r}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="grid cols2" style={{ marginTop: 12 }}>
          <div>
            <p className="qtext" style={{ fontSize: 13 }}>Когда планируете принять решение?</p>
            <input type="text" placeholder="Например: до конца месяца / после отчёта"
              value={d.budget?.deadline ?? ''}
              onChange={(e) => set({ budget: { ...d.budget, deadline: e.target.value } })} />
          </div>
          <div>
            <p className="qtext" style={{ fontSize: 13 }}>Сезонность денег (когда кэша мало/много)</p>
            <input type="text" placeholder="Например: пик Q4, провал январь–февраль"
              value={d.budget?.cash ?? ''}
              onChange={(e) => set({ budget: { ...d.budget, cash: e.target.value } })} />
          </div>
        </div>
      </div>

      {/* Команда */}
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Паспорт команды</h2>
        <p className="sub" style={{ fontSize: 12.5 }}>
          Кто со стороны компании будет работать с программой и сколько времени реально есть.
        </p>
        {team.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <input type="text" placeholder="Роль (маркетолог…)" value={t.role} style={{ maxWidth: 170 }}
              onChange={(e) => set({ team: team.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) })} />
            <input type="text" placeholder="Имя" value={t.name} style={{ maxWidth: 130 }}
              onChange={(e) => set({ team: team.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
            <input type="text" placeholder="Часов/нед на проект" value={t.hours} style={{ maxWidth: 150 }}
              onChange={(e) => set({ team: team.map((x, j) => (j === i ? { ...x, hours: e.target.value } : x)) })} />
            <input type="text" placeholder="Зона ответственности" value={t.area} style={{ flex: 1, minWidth: 160 }}
              onChange={(e) => set({ team: team.map((x, j) => (j === i ? { ...x, area: e.target.value } : x)) })} />
            {team.length > 1 && (
              <button className="chip" onClick={() => set({ team: team.filter((_, j) => j !== i) })}>✕</button>
            )}
          </div>
        ))}
        <button className="chip" style={{ marginTop: 10 }} onClick={() => set({ team: [...team, emptyTeam()] })}>
          + Добавить человека
        </button>
        <p className="qtext" style={{ fontSize: 13, marginTop: 14 }}>Что сейчас на аутсорсе / у подрядчиков?</p>
        <input type="text" placeholder="Например: реклама — агентство, сайт — фрилансер"
          value={d.outsource ?? ''} onChange={(e) => set({ outsource: e.target.value })} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26 }}>
        <Link to="/" className="btn btn-ghost">← На главную</Link>
        <Link to="/report" className="btn">К отчёту →</Link>
      </div>
    </div>
  );
}
