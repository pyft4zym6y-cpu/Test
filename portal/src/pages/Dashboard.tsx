import { Link } from 'react-router-dom';
import { DOMAINS, QUESTIONS, ACCESSES } from '../lib/model';
import { useAnswers, answerMap } from '../lib/useAnswers';
import { useApp } from '../App';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { member } = useApp();
  const { rows, loaded } = useAnswers();
  const answers = answerMap(rows);
  const [accessDone, setAccessDone] = useState(0);

  useEffect(() => {
    supabase
      .from('access_status')
      .select('access_id,status')
      .eq('client_id', member.client_id!)
      .then(({ data }) => setAccessDone((data ?? []).filter((r) => r.status === 'Выдан').length));
  }, [member.client_id]);

  const totalL1 = QUESTIONS.filter((q) => q.level === 'L1').length;
  const answeredL1 = QUESTIONS.filter((q) => q.level === 'L1' && answers[q.id]).length;
  const pct = totalL1 ? Math.round((answeredL1 / totalL1) * 100) : 0;

  return (
    <div className="container" style={{ padding: '36px 20px 80px' }}>
      <p className="eyebrow">Discovery · Диагностика перед аудитом</p>
      <h1>Добро пожаловать{member.name ? `, ${member.name}` : ''}</h1>
      <p className="sub" style={{ maxWidth: 620 }}>
        Здесь два шага: <b>опросники</b> по блокам бизнеса и <b>передача доступов</b>. Отвечайте в
        любом порядке — всё сохраняется автоматически, можно возвращаться с любого устройства.
        Чем конкретнее ответы и цифры, тем точнее аудит посчитает деньги.
      </p>

      <div className="card" style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <h2>Общий прогресс</h2>
          <span className="mono" style={{ fontWeight: 700 }}>
            {answeredL1}/{totalL1} · {pct}%
          </span>
        </div>
        <div className="progress" style={{ marginTop: 10 }}>
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Link to="/access" className="rowlink" style={{ marginTop: 22 }}>
        <div>
          <h2 style={{ marginBottom: 2 }}>Передача доступов</h2>
          <p className="sub" style={{ margin: 0 }}>
            {ACCESSES.length} позиций: аналитика, рекламные кабинеты, выгрузки. Без паролей — только
            приглашения и файлы.
          </p>
        </div>
        <span className="mono" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
          {accessDone}/{ACCESSES.length} →
        </span>
      </Link>

      <p className="eyebrow" style={{ margin: '30px 0 12px' }}>
        Опросники по блокам · {DOMAINS.length}
      </p>
      {!loaded ? (
        <p className="sub">Загрузка…</p>
      ) : (
        DOMAINS.map((d) => {
          const qs = QUESTIONS.filter((q) => q.domain === d.key && q.level === 'L1');
          const done = qs.filter((q) => answers[q.id]).length;
          return (
            <Link key={d.sheet} to={`/d/${d.sheet}`} className="rowlink">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: 15.5 }}>{d.key}</h2>
                  {d.roles.slice(0, 2).map((r) => (
                    <span key={r} className="tag">
                      {r}
                    </span>
                  ))}
                </div>
                <div className="progress" style={{ marginTop: 9, maxWidth: 300 }}>
                  <div style={{ width: `${qs.length ? (done / qs.length) * 100 : 0}%` }} />
                </div>
              </div>
              <span className="mono" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                {done}/{qs.length} →
              </span>
            </Link>
          );
        })
      )}
    </div>
  );
}
