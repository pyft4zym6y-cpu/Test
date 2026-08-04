import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAnswers } from '../lib/useAnswers';
import { buildReport, zone } from '../lib/report';
import { PAINS, PAINS_QID } from '../data/pains';
import { ACCESSES } from '../lib/model';

function ScoreRing({ score }: { score: number }) {
  const r = 64;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? '#65a30d' : score >= 45 ? '#b45309' : '#dc2626';
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label={`Health Score ${score} из 100`}>
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(10,14,18,0.08)" strokeWidth="12" />
      <circle
        cx="80"
        cy="80"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        transform="rotate(-90 80 80)"
      />
      <text x="80" y="76" textAnchor="middle" fontSize="34" fontWeight="800" fill="#12161c" fontFamily="JetBrains Mono, monospace">
        {score}
      </text>
      <text x="80" y="98" textAnchor="middle" fontSize="11" fill="#5a6472" fontFamily="JetBrains Mono, monospace">
        / 100
      </text>
    </svg>
  );
}

export default function ReportPage() {
  const { rows, loaded } = useAnswers();

  const painIds = (rows[PAINS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  const report = useMemo(() => buildReport(rows, painIds), [rows, painIds]);

  if (!loaded)
    return (
      <div className="container" style={{ paddingTop: 50 }}>
        <p className="sub">Собираем отчёт…</p>
      </div>
    );

  const enough = report.answeredL1 >= 30;
  const pct = Math.round((report.answeredL1 / report.totalL1) * 100);
  const scored = report.domains.filter((d) => d.health !== null).sort((a, b) => (a.health! - b.health!));
  const topProblems = report.problems.slice(0, 12);

  return (
    <div className="container report" style={{ padding: '30px 20px 80px' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
          ← На главную
        </Link>
        <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 11 }} onClick={() => window.print()}>
          Скачать PDF ↓
        </button>
      </div>

      {/* Обложка */}
      <div style={{ marginTop: 18 }}>
        <p className="eyebrow">weexp · Commerce OS™ · Diagnostic Snapshot</p>
        <h1 style={{ fontSize: 30 }}>Диагностика: предварительная картина</h1>
        <p className="sub" style={{ maxWidth: 640 }}>
          Автоматический срез по вашим ответам ({report.answeredL1} из {report.totalL1}, {pct}%).
          Это <b>предварительный диагноз</b>: зоны и риски — по опроснику, деньги и финальные
          выводы появляются после проверки данных (GA4, CRM, P&L) командой weexp.
        </p>
      </div>

      {!enough ? (
        <div className="card" style={{ marginTop: 22, borderColor: 'var(--amber)' }}>
          <h2>Пока мало данных</h2>
          <p className="sub">
            Ответьте минимум на 30 базовых вопросов (сейчас {report.answeredL1}) — и здесь
            соберётся ваша карта здоровья бизнеса с рисками и рекомендациями.
          </p>
          <Link to="/" className="btn" style={{ marginTop: 12 }}>
            К опросникам →
          </Link>
        </div>
      ) : (
        <>
          {/* Health Score */}
          <div className="card" style={{ marginTop: 22, display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap' }}>
            {report.score !== null && <ScoreRing score={report.score} />}
            <div style={{ flex: 1, minWidth: 240 }}>
              <p className="eyebrow">Health Score · по опроснику</p>
              <h2 style={{ fontSize: 20 }}>
                {report.score !== null && report.score >= 70
                  ? 'Система в целом работает — растим её потолок'
                  : report.score !== null && report.score >= 45
                    ? 'Бизнес работает, но система недостроена'
                    : 'Рост держится на ручном управлении — есть что вернуть'}
              </h2>
              <p className="sub" style={{ fontSize: 13 }}>
                Балл — доля «здоровых» ответов по {scored.length} блокам с поправкой на вес
                вопросов. Не оценка бизнеса — карта, где спрятан резерв роста.
              </p>
              {painIds.length > 0 && (
                <div className="chips" style={{ marginTop: 10 }}>
                  {painIds.map((id) => (
                    <span key={id} className="chip" style={{ fontSize: 11.5 }}>
                      {PAINS.find((p) => p.id === id)?.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Зоны по блокам */}
          <p className="eyebrow" style={{ margin: '28px 0 12px' }}>
            Карта здоровья по блокам
          </p>
          <div className="card">
            {scored.map((d) => {
              const z = zone(d.health);
              return (
                <div key={d.sheet} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{d.key}</span>
                    <span className="mono" style={{ fontSize: 11.5, color: z.color }}>
                      {Math.round((d.health as number) * 100)}% · {z.label}
                    </span>
                  </div>
                  <div className="progress">
                    <div style={{ width: `${(d.health as number) * 100}%`, background: z.color }} />
                  </div>
                </div>
              );
            })}
            <p className="sub" style={{ fontSize: 11.5, marginTop: 8 }}>
              Блоки, где отвечено меньше 3 скорируемых вопросов, не показаны — заполните их
              анкеты, чтобы карта стала полной.
            </p>
          </div>

          {/* Реестр рисков */}
          {topProblems.length > 0 && (
            <>
              <p className="eyebrow" style={{ margin: '28px 0 12px' }}>
                Главные выявленные риски · {report.problems.length}
              </p>
              {topProblems.map((p) => (
                <div key={p.q.id} className="qcard" style={{ borderLeft: `3px solid ${p.severity >= 2 ? '#dc2626' : '#b45309'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span className="qid">{p.q.id} · {p.q.domain}</span>
                    <span className="tag">{p.answer}</span>
                  </div>
                  <p className="qtext" style={{ fontSize: 14 }}>{(p.q as any).risk}</p>
                  <p className="qwhy" style={{ margin: 0 }}>← {p.q.text}</p>
                </div>
              ))}
              {report.problems.length > topProblems.length && (
                <p className="sub" style={{ fontSize: 12.5 }}>
                  Ещё {report.problems.length - topProblems.length} рисков — в полной версии после
                  разбора с командой weexp.
                </p>
              )}
            </>
          )}

          {/* Рекомендации */}
          {report.rules.length > 0 && (
            <>
              <p className="eyebrow" style={{ margin: '28px 0 12px' }}>
                Что с этим делать · рекомендованные работы
              </p>
              <div className="grid cols2">
                {report.rules.slice(0, 6).map((r) => (
                  <div key={r.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span className="qid">{r.id} · {r.area}</span>
                      <span className="tag" style={{ color: r.priority?.startsWith('P0') ? '#dc2626' : undefined }}>
                        {r.priority}
                      </span>
                    </div>
                    <p style={{ fontWeight: 700, margin: '6px 0 4px' }}>{r.deliverable}</p>
                    <p className="sub" style={{ fontSize: 12.5, margin: 0 }}>
                      Триггер: «{r.trigger}» → домены: {r.domains}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Деньги + next steps */}
          <div className="card" style={{ marginTop: 26, borderColor: 'rgba(101,163,13,0.4)' }}>
            <p className="eyebrow">Следующий шаг · деньги</p>
            <h2>Сколько это стоит в обороте — считаем по данным, не по опроснику</h2>
            <p className="sub" style={{ maxWidth: 640 }}>
              Опросник показывает «где болит». Перевод в гривни требует двух доступов:{' '}
              <b>GA4 (AC-01)</b> и <b>выгрузка заказов (AC-13)</b> — после них команда weexp
              считает недополученный оборот по цепной модели и собирает план с бюджетом и DoD.
              Доступов выдано: {ACCESSES.length ? '' : ''}
              <Link to="/access">передать доступы →</Link>
            </p>
          </div>

          <p className="sub no-print" style={{ fontSize: 11.5, marginTop: 22 }}>
            Версия: автоматическая · {new Date().toLocaleDateString('ru-RU')} · Финальную версию
            готовит консультант после проверки данных. weexp · Commerce OS™
          </p>
        </>
      )}
    </div>
  );
}
