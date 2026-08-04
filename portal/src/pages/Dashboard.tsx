import { Link } from 'react-router-dom';
import { DOMAINS, QUESTIONS, ACCESSES } from '../lib/model';
import { useAnswers, answerMap } from '../lib/useAnswers';
import { PAINS, PAINS_QID, trackFor } from '../data/pains';
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

  const selectedPains = (rows[PAINS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  const track = trackFor(selectedPains);
  const orderedDomains = selectedPains.length
    ? [...DOMAINS].sort((a, b) => {
        const ia = track.indexOf(a.sheet);
        const ib = track.indexOf(b.sheet);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
    : DOMAINS;

  return (
    <div className="container" style={{ padding: '36px 20px 80px' }}>
      <p className="eyebrow">Discovery · Диагностика перед аудитом</p>
      <h1>Добро пожаловать{member.name ? `, ${member.name}` : ''}</h1>
      <p className="sub" style={{ maxWidth: 620 }}>
        Здесь два шага: <b>опросники</b> по блокам бизнеса и <b>передача доступов</b>. Отвечайте в
        любом порядке — всё сохраняется автоматически, можно возвращаться с любого устройства.
        Чем конкретнее ответы и цифры, тем точнее аудит посчитает деньги.
      </p>

      {loaded && !selectedPains.length && (
        <Link to="/pains" className="rowlink" style={{ marginTop: 22, borderColor: 'var(--lime)', background: '#F4FBE8' }}>
          <div>
            <h2 style={{ marginBottom: 2 }}>Шаг 1 · Почему вы обратились?</h2>
            <p className="sub" style={{ margin: 0 }}>
              Выберите свои боли — соберём персональный трек диагностики вместо всех {DOMAINS.length} анкет.
            </p>
          </div>
          <span className="mono" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
            Начать →
          </span>
        </Link>
      )}
      {loaded && selectedPains.length > 0 && (
        <div className="card" style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
            <h2>Ваши боли · {selectedPains.length}</h2>
            <Link to="/pains" className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
              Изменить
            </Link>
          </div>
          <div className="chips" style={{ marginTop: 8 }}>
            {selectedPains.map((id) => (
              <span key={id} className="chip on">
                {PAINS.find((p) => p.id === id)?.title ?? id}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 12 }}>
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

      <Link to="/report" className="rowlink" style={{ marginTop: 22, borderColor: 'rgba(101,163,13,0.4)' }}>
        <div>
          <h2 style={{ marginBottom: 2 }}>Диагностика · предварительный отчёт</h2>
          <p className="sub" style={{ margin: 0 }}>
            Health Score, карта здоровья по блокам, риски и рекомендации — собирается из ваших
            ответов автоматически.
          </p>
        </div>
        <span className="mono" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
          Открыть →
        </span>
      </Link>

      <Link to="/access" className="rowlink" style={{ marginTop: 10 }}>
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
        {selectedPains.length ? 'Ваш трек · сначала важное' : `Опросники по блокам · ${DOMAINS.length}`}
      </p>
      {!loaded ? (
        <p className="sub">Загрузка…</p>
      ) : (
        orderedDomains.map((d) => {
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
