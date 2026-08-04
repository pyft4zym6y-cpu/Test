import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAnswers } from '../lib/useAnswers';
import { useApp } from '../App';
import { useReportMeta } from '../lib/consultant';
import { buildReport, zone } from '../lib/report';
import {
  PAINS, PAINS_QID, PAINS_CUSTOM_QID, GOALS, GOALS_QID, GOALS_CUSTOM_QID,
  PASSPORT_QID, effectiveNiche, type Passport,
} from '../data/pains';
import { ACCESSES } from '../lib/model';
import { bandFor } from '../data/method';

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
  const { member } = useApp();
  const { meta } = useReportMeta(member.client_id ?? 'demo');
  const isFinal = meta?.status === 'final';
  const hidden = meta?.hidden ?? [];
  const money = meta?.money?.show ? meta.money : null;
  const l0 = meta?.l0 ?? [];

  const painIds = (rows[PAINS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  const goalIds = (rows[GOALS_QID]?.answer ?? '').split(' | ').filter(Boolean);
  let passport: Passport = {};
  try {
    passport = JSON.parse(rows[PASSPORT_QID]?.answer ?? '{}');
  } catch {
    passport = {};
  }
  const customPains = (rows[PAINS_CUSTOM_QID]?.answer ?? '').trim();
  const customGoals = (rows[GOALS_CUSTOM_QID]?.answer ?? '').trim();
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
  const visibleProblems = report.problems.filter((p) => !hidden.includes(p.q.id));
  const topProblems = visibleProblems.slice(0, 12);

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
        <p className="eyebrow">
          weexp · Commerce OS™ · {isFinal ? 'Финальная диагностика' : 'Diagnostic Snapshot'}
        </p>
        <h1 style={{ fontSize: 30 }}>
          {passport.name
            ? `${passport.name}: ${isFinal ? 'финальная картина' : 'предварительная картина'}`
            : isFinal ? 'Диагностика: финальная картина' : 'Диагностика: предварительная картина'}
        </h1>
        {isFinal && (
          <p className="mono" style={{ fontSize: 12, color: 'var(--lime-dark)', fontWeight: 700, margin: '2px 0 8px' }}>
            ✓ ПРОВЕРЕНО КОНСУЛЬТАНТОМ WEEXP — финальная версия
          </p>
        )}
        {passport.offer && (
          <p className="sub" style={{ maxWidth: 640, marginBottom: 4 }}>
            <b>{effectiveNiche(passport)}</b> · {passport.offer}
            {passport.geo ? ` · ${passport.geo}` : ''}
            {passport.revenue ? ` · ${passport.revenue}` : ''}
            {passport.channels?.length
              ? ` · каналы: ${passport.channels.join(', ')}${passport.channelsOther ? `, ${passport.channelsOther}` : ''}`
              : ''}
          </p>
        )}
        {(goalIds.length > 0 || customGoals) && (
          <p className="sub" style={{ maxWidth: 640, marginBottom: 4 }}>
            <b>Цели 12 мес:</b>{' '}
            {goalIds.map((g) => GOALS.find((x) => x.id === g)?.title).filter(Boolean).join(' · ')}
            {customGoals ? `${goalIds.length ? ' · ' : ''}«${customGoals}»` : ''}
          </p>
        )}
        <p className="sub" style={{ maxWidth: 640 }}>
          {isFinal ? (
            <>
              Отчёт по вашим ответам ({report.answeredL1} из {report.totalL1}, {pct}%),
              проверенный и дополненный консультантом weexp: риски отмодерированы, деньги
              посчитаны по данным.
            </>
          ) : (
            <>
              Автоматический срез по вашим ответам ({report.answeredL1} из {report.totalL1}, {pct}%).
              Это <b>предварительный диагноз</b>: зоны и риски — по опроснику, деньги и финальные
              выводы появляются после проверки данных (GA4, CRM, P&L) командой weexp.
            </>
          )}
        </p>
      </div>

      {/* Резюме консультанта */}
      {isFinal && (meta?.summary ?? '').trim() && (
        <div className="card" style={{ marginTop: 18, borderLeft: '3px solid var(--lime)' }}>
          <p className="eyebrow">Резюме консультанта</p>
          <p style={{ fontSize: 14.5, margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{meta!.summary}</p>
        </div>
      )}

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
              <p className="eyebrow">Health Score · формула Commerce OS</p>
              <h2 style={{ fontSize: 20 }}>
                {report.score !== null ? bandFor(report.score).label : 'Недостаточно данных'}
              </h2>
              <p className="sub" style={{ fontSize: 13 }}>
                {report.score !== null ? bandFor(report.score).action : ''} · Формула: 0,6 ×
                зрелость доменов ({report.scoreA ?? '—'}) + 0,4 × фундамент без критических
                разрывов ({report.scoreB ?? '—'}).
              </p>
              {(painIds.length > 0 || customPains) && (
                <div className="chips" style={{ marginTop: 10 }}>
                  {painIds.map((id) => (
                    <span key={id} className="chip" style={{ fontSize: 11.5 }}>
                      {PAINS.find((p) => p.id === id)?.title}
                    </span>
                  ))}
                  {customPains && (
                    <span className="chip" style={{ fontSize: 11.5, borderColor: 'var(--lime)' }}>
                      + «{customPains.slice(0, 60)}{customPains.length > 60 ? '…' : ''}»
                    </span>
                  )}
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

          {/* Критические разрывы */}
          {report.gaps.length > 0 && (
            <>
              <p className="eyebrow" style={{ margin: '28px 0 12px' }}>
                Критические разрывы · снижают Health Score
              </p>
              <div className="grid cols2">
                {report.gaps.map((g) => (
                  <div key={g.id} className="card" style={{ borderLeft: '3px solid #dc2626', padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span className="qid" style={{ color: '#dc2626' }}>{g.id}</span>
                      <span className="mono" style={{ fontSize: 11.5, color: '#dc2626', fontWeight: 700 }}>−{g.penalty}</span>
                    </div>
                    <p style={{ fontWeight: 700, margin: '4px 0 2px', fontSize: 14 }}>{g.label}</p>
                    <p className="sub" style={{ fontSize: 11.5, margin: 0 }}>{g.evidence}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Методика */}
          <div className="card" style={{ marginTop: 26, background: 'var(--panel)' }}>
            <p className="eyebrow">Методика · граница факта и допущения</p>
            <p className="sub" style={{ fontSize: 13, margin: '6px 0 0' }}>
              Всё в этом отчёте — <b>ответы вашей команды</b> (уверенность среднего уровня), приложенные к
              эталонам практики weexp. Разрыв фиксируется только по прямому ответу; «не знаем / не
              считаем» по методике считается разрывом. Деньги, точные позиции и финальные выводы
              появляются после проверки данных (GA4, CRM, выгрузки) — тогда оценки заменяются
              фактами, а структура отчёта не меняется.
            </p>
          </div>

          {/* Реестр рисков */}
          {topProblems.length > 0 && (
            <>
              <p className="eyebrow" style={{ margin: '28px 0 12px' }}>
                Главные выявленные риски · {visibleProblems.length}
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
              {visibleProblems.length > topProblems.length && (
                <p className="sub" style={{ fontSize: 12.5 }}>
                  Ещё {visibleProblems.length - topProblems.length} рисков — в полной версии после
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

          {/* Скорость: вы против конкурентов (L0, замер консультанта) */}
          {l0.length > 0 && (
            <>
              <p className="eyebrow" style={{ margin: '28px 0 12px' }}>
                Скорость сайта · вы против конкурентов
              </p>
              <div className="card">
                <table className="admin" style={{ margin: 0 }}>
                  <thead>
                    <tr><th>Сайт</th><th>Кто</th><th>PageSpeed</th><th>LCP, c</th><th>CLS</th></tr>
                  </thead>
                  <tbody>
                    {l0.map((r) => (
                      <tr key={r.url}>
                        <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.url.replace(/^https?:\/\//, '')}
                        </td>
                        <td>{r.kind === 'client' ? 'вы' : 'конкурент'}</td>
                        <td className="mono" style={{ fontWeight: 700, color: (r.score ?? 0) >= 70 ? '#65a30d' : (r.score ?? 0) >= 40 ? '#b45309' : '#dc2626' }}>
                          {r.score ?? '—'}
                        </td>
                        <td className="mono">{r.lcp ?? '—'}</td>
                        <td className="mono">{r.cls != null ? r.cls.toFixed(2) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="sub" style={{ fontSize: 11.5, marginTop: 8 }}>
                  Google PageSpeed Insights, mobile. Замер выполнен командой weexp. Скорость ниже
                  70 напрямую снижает конверсию мобильного трафика.
                </p>
              </div>
            </>
          )}

          {/* Скрининг против голд-стандарта */}
          {(meta?.screen ?? []).filter((s) => s.score != null).length > 0 && (
            <>
              <p className="eyebrow" style={{ margin: '28px 0 12px' }}>
                Витрина · вы против конкурентов против эталона
              </p>
              <div className="card">
                {(meta!.screen ?? []).filter((s) => s.score != null).map((s) => (
                  <div key={s.url} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, minWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.kind === 'client' ? '★ ' : ''}{s.url.replace(/^https?:\/\/(www\.)?/, '')}
                    </span>
                    <div className="progress" style={{ flex: 1 }}>
                      <div style={{ width: `${s.score}%`, background: (s.score ?? 0) >= 75 ? '#65a30d' : (s.score ?? 0) >= 50 ? '#b45309' : '#dc2626' }} />
                    </div>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 700, minWidth: 44, textAlign: 'right' }}>{s.score}%</span>
                  </div>
                ))}
                {(() => {
                  const client = (meta!.screen ?? []).find((s) => s.kind === 'client' && s.checks.length);
                  if (!client) return null;
                  const fails = client.checks.filter((c) => !c.pass).slice(0, 8);
                  if (!fails.length) return null;
                  return (
                    <>
                      <p className="qtext" style={{ fontSize: 13, marginTop: 10 }}>Что чинить в первую очередь у вас:</p>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13 }}>
                        {fails.map((c) => (
                          <li key={c.id}>{c.label}{c.detail ? ` (${c.detail})` : ''}</li>
                        ))}
                      </ul>
                    </>
                  );
                })()}
                <p className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
                  30 автоматических проверок SEO/UX/техники против эталона Commerce OS (эталон = 100%).
                  Замер выполнен командой weexp.
                </p>
              </div>
            </>
          )}

          {/* Деньги */}
          {money ? (
            <div className="card" style={{ marginTop: 26, borderColor: 'rgba(101,163,13,0.5)' }}>
              <p className="eyebrow">Деньги · посчитано по вашим данным</p>
              <h2>
                Консервативно вы недополучаете{' '}
                <span className="mono" style={{ color: '#DB2777' }}>
                  ≈{(money.consMin / 1e6).toFixed(1)} млн ₴/год
                </span>
              </h2>
              <p className="sub" style={{ maxWidth: 640 }}>
                Полный потенциал — до {(money.consMax / 1e6).toFixed(1)} млн ₴/год. Каждый месяц
                без изменений ≈ {Math.round(money.monthly / 1000)} тыс ₴.
                {!money.waterfall?.length && (
                  <> Рычаги: конверсия {money.cr}% → {money.crTarget}%, повторные покупки {money.repeat}% → {money.repeatTarget}%.</>
                )}{' '}
                Baseline зафиксирован по вашим данным
                {money.dateTaken ? ` на ${money.dateTaken}` : ''}
                {money.period ? ` (среднее за ${money.period})` : ''}, модель цепная — показана
                консервативная нижняя граница.
                {money.comment ? ` ${money.comment}` : ''}
              </p>
              {Boolean(money.waterfall?.length) && (
                <div style={{ marginTop: 12, maxWidth: 560 }}>
                  {(() => {
                    const wf = money.waterfall!;
                    const max = Math.max(...wf.map((w) => w.value));
                    return wf.map((w) => (
                      <div key={w.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                        <span style={{ fontSize: 12.5, minWidth: 150 }}>{w.label}</span>
                        <div className="progress" style={{ flex: 1 }}>
                          <div style={{ width: `${Math.max(4, (w.value / max) * 100)}%`, background: '#65a30d' }} />
                        </div>
                        <span className="mono" style={{ fontSize: 11.5, minWidth: 80, textAlign: 'right' }}>
                          +{Math.round(w.value / 1000)} тыс
                        </span>
                      </div>
                    ));
                  })()}
                  <p className="sub" style={{ fontSize: 11, margin: '4px 0 0' }}>
                    Вклад каждого рычага в годовой потенциал (цепная атрибуция — вклады сходятся к итогу).
                  </p>
                </div>
              )}
            </div>
          ) : (
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
          )}

          <p className="sub no-print" style={{ fontSize: 11.5, marginTop: 22 }}>
            {isFinal
              ? `Версия: финальная, проверена консультантом · ${new Date().toLocaleDateString('ru-RU')} · weexp · Commerce OS™`
              : `Версия: автоматическая · ${new Date().toLocaleDateString('ru-RU')} · Финальную версию готовит консультант после проверки данных. weexp · Commerce OS™`}
          </p>
        </>
      )}
    </div>
  );
}
