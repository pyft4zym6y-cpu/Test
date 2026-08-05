import { Link } from 'react-router-dom';
import { DOMAINS, QUESTIONS, ACCESSES } from '../lib/model';
import { useAnswers, answerMap } from '../lib/useAnswers';
import {
  PAINS_QID, PAINS_CUSTOM_QID, GOALS_QID, GOALS_CUSTOM_QID,
  PASSPORT_QID, LINKS_QID, trackFor, effectiveNiche, painById, goalById,
  tacticalPainsOf, type Passport, type Links,
} from '../data/pains';
import { DECISION_QID, type Decision } from '../data/decision';
import { useApp } from '../App';
import { useEffect, useState } from 'react';
import { supabase, DEMO } from '../lib/supabase';

function StepRow({ to, n, title, desc, state, right }: {
  to: string; n: string; title: string; desc: string;
  state: 'done' | 'next' | 'todo'; right?: string;
}) {
  return (
    <Link to={to} className="rowlink" style={{
      borderColor: state === 'next' ? 'var(--lime)' : undefined,
      background: state === 'next' ? '#F4FBE8' : '#fff',
    }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', minWidth: 0 }}>
        <span className="mono" style={{
          fontWeight: 700, fontSize: 13, flexShrink: 0,
          color: state === 'done' ? 'var(--lime-dark)' : state === 'next' ? 'var(--ink)' : 'var(--muted)',
        }}>
          {state === 'done' ? '✓' : n}
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ marginBottom: 2, fontSize: 15.5 }}>{title}</h2>
          <p className="sub" style={{ margin: 0, fontSize: 12.5 }}>{desc}</p>
        </div>
      </div>
      <span className="mono" style={{ fontSize: 12.5, whiteSpace: 'nowrap', fontWeight: 700 }}>
        {right ?? '→'}
      </span>
    </Link>
  );
}

export default function Dashboard() {
  const { member } = useApp();
  const { rows, loaded } = useAnswers();
  const answers = answerMap(rows);
  const [accessDone, setAccessDone] = useState(0);

  useEffect(() => {
    if (DEMO) {
      try {
        const m = JSON.parse(localStorage.getItem('weexp-demo-access') ?? '{}');
        setAccessDone(Object.values(m).filter((r: any) => r.status === 'Выдан').length);
      } catch { /* noop */ }
      return;
    }
    supabase
      .from('access_status')
      .select('access_id,status')
      .eq('client_id', member.client_id!)
      .then(({ data }) => setAccessDone((data ?? []).filter((r) => r.status === 'Выдан').length));
  }, [member.client_id]);

  let passport: Passport = {};
  let links: Links = { direct: [], indirect: [], refs: [] };
  let decision: Decision = {};
  try { passport = JSON.parse(rows[PASSPORT_QID]?.answer ?? '{}'); } catch { /* noop */ }
  try { links = { direct: [], indirect: [], refs: [], ...JSON.parse(rows[LINKS_QID]?.answer ?? '{}') }; } catch { /* noop */ }
  try { decision = JSON.parse(rows[DECISION_QID]?.answer ?? '{}'); } catch { /* noop */ }

  const companyDone = Boolean(passport.name && passport.offer && passport.niche);
  const goalIds = (rows[GOALS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  const goalsDone = goalIds.length > 0 || Boolean((rows[GOALS_CUSTOM_QID]?.answer ?? '').trim());
  const painIds = (rows[PAINS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  const painsDone = painIds.length > 0 || Boolean((rows[PAINS_CUSTOM_QID]?.answer ?? '').trim());
  const linksCount = links.direct.length + links.indirect.length + links.refs.length;

  const totalL1 = QUESTIONS.filter((q) => q.level === 'L1').length;
  const answeredL1 = QUESTIONS.filter((q) => q.level === 'L1' && answers[q.id]).length;
  const pct = totalL1 ? Math.round((answeredL1 / totalL1) * 100) : 0;
  const surveyStarted = answeredL1 > 3;

  const decisionDone = Boolean(decision.reason || (decision.lprs ?? []).some((l) => l.name));
  const doneFlags = [companyDone, goalsDone, painsDone, surveyStarted, linksCount > 0, accessDone > 0, decisionDone];
  const nextIdx = doneFlags.findIndex((d) => !d);
  const state = (i: number): 'done' | 'next' | 'todo' =>
    doneFlags[i] ? 'done' : i === nextIdx ? 'next' : 'todo';

  const track = trackFor(painIds, goalIds);
  const orderedDomains = painsDone || goalsDone
    ? [...DOMAINS].sort((a, b) => {
        const ia = track.indexOf(a.sheet);
        const ib = track.indexOf(b.sheet);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
    : DOMAINS;

  return (
    <div className="container" style={{ padding: '36px 20px 80px' }}>
      <p className="eyebrow">Discovery · Диагностика перед аудитом</p>
      <h1>
        {passport.name ? `${passport.name}: диагностика` : `Добро пожаловать${member.name ? `, ${member.name}` : ''}`}
      </h1>
      <p className="sub" style={{ maxWidth: 640 }}>
        Семь шагов — от вводных до передачи данных. Всё сохраняется автоматически, идти можно в
        любом порядке, но лучший результат даёт путь сверху вниз. Отчёт собирается по мере ответов.
      </p>

      {!loaded ? (
        <p className="sub" style={{ marginTop: 20 }}>Загрузка…</p>
      ) : (
        <>
          <div style={{ marginTop: 22 }}>
            <StepRow to="/company" n="01" title="Компания" state={state(0)}
              desc={companyDone ? `${passport.name} · ${effectiveNiche(passport) ?? ''} · ${passport.channels?.length ?? 0} каналов` : 'Кто вы, что и где продаёте, какие каналы'} />
            <StepRow to="/goals" n="02" title="Цели: тактика 90 дней + стратегия 12 месяцев" state={state(1)}
              desc={goalsDone ? goalIds.map((g) => goalById(g)?.title).filter(Boolean).join(' · ') || 'Свои цели описаны' : 'Что нужно быстро — и куда строим систему'} />
            <StepRow to="/pains" n="03" title="Что болит: горит сейчас + системно" state={state(2)}
              desc={painsDone ? painIds.map((p) => painById(p)?.title).filter(Boolean).slice(0, 3).join(' · ') + (painIds.length > 3 ? '…' : '') : 'Пожары на 24–48 часов и хронические боли'} />
            <StepRow to={orderedDomains[0] ? `/d/${orderedDomains[0].sheet}` : '/'} n="04" title="Опросник" state={state(3)}
              desc="Ваш персональный трек анкет — по целям и болям" right={`${answeredL1}/${totalL1} · ${pct}%`} />
            <StepRow to="/links" n="05" title="Конкуренты и референсы" state={state(4)}
              desc="Ссылки: прямые, дополнительные, референсы «хотим как…»" right={linksCount ? `${linksCount} ссылок →` : '→'} />
            <StepRow to="/access" n="06" title="Файлы и доступы" state={state(5)}
              desc="Выгрузки, P&L, GA4 — без паролей, только приглашения" right={`${accessDone}/${ACCESSES.length} →`} />
            <StepRow to="/decision" n="07" title="Решение и команда" state={state(6)}
              desc={decisionDone ? 'Бриф, участники решения и рамки заполнены' : 'Кто решает, бюджетные рамки, ваша команда — заполняет CEO'} />
          </div>

          {tacticalPainsOf(painIds).length > 0 && (
            <div className="note" style={{ marginTop: 20, borderColor: 'rgba(220,38,38,0.4)', background: '#FEF1F1' }}>
              🔥 <b>Горит: {tacticalPainsOf(painIds).map((p) => p.title).join(' · ')}.</b>{' '}
              Трек диагностики перестроен под пожар, план первой помощи — уже в отчёте, а
              консультант увидит эти боли первым приоритетом. Начните с первых двух анкет ниже.
            </div>
          )}

          <Link to="/report" className="rowlink" style={{ marginTop: 20, borderColor: 'rgba(101,163,13,0.5)' }}>
            <div>
              <h2 style={{ marginBottom: 2 }}>Диагностика · предварительный отчёт</h2>
              <p className="sub" style={{ margin: 0 }}>
                Health Score, карта здоровья, риски и рекомендации — обновляется по мере ответов.
              </p>
            </div>
            <span className="mono" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Открыть →</span>
          </Link>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 14 }}>
        <Link to="/deliverables" className="mono no-print" style={{ fontSize: 12, color: 'var(--lime-dark)' }}>
          Что вы получите по итогам аудита: 19 документов →
        </Link>
        <Link to="/privacy" className="mono no-print" style={{ fontSize: 12, color: 'var(--muted)' }}>
          Как мы обращаемся с данными →
        </Link>
      </div>

      <p className="eyebrow" style={{ margin: '30px 0 12px' }}>
            {painsDone || goalsDone ? 'Шаг 04 · Ваш трек анкет' : `Шаг 04 · Анкеты (${DOMAINS.length})`}
          </p>
          {orderedDomains.map((d) => {
            const qs = QUESTIONS.filter((q) => q.domain === d.key && q.level === 'L1');
            const done = qs.filter((q) => answers[q.id]).length;
            return (
              <Link key={d.sheet} to={`/d/${d.sheet}`} className="rowlink">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: 15.5 }}>{d.key}</h2>
                    {d.roles.slice(0, 2).map((r) => (
                      <span key={r} className="tag">{r}</span>
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
          })}
        </>
      )}
    </div>
  );
}
