import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { StepOverlay } from './StepOverlay';
import './system.css';

/**
 * Крок 5 — динамічне AI-інтерв'ю поглибленої діагностики. Спілкується з
 * /api/interview (Claude на бекенді): ставить по одному підібраному питанню,
 * поглиблюється у відповіді клієнта, а наприкінці віддає структурований діагноз
 * (проблеми · докази · корені · дорожня карта · що підключити). Якщо бекенд не
 * налаштований (немає ANTHROPIC_API_KEY) — м'яко пропонуємо зустріч.
 */

export type InterviewContext = {
  site?: string;
  overall?: number;
  bottleneck?: { label: string; score: number };
  goals?: string[];
  pains?: { label: string; detail?: string }[];
  systems?: { label: string; score: number }[];
  marketing?: { label: string; value: string }[];
  finance?: { label: string; value: string }[];
  completeness?: number;
};

type QNode = { text: string; why?: string; hint?: string; kind: 'text' | 'choice'; options?: string[] };
type Diagnosis = {
  summary: string;
  problems: { title: string; evidence: string; confidence: string; impact: string; priority: string }[];
  rootCauses: string[];
  roadmap: { title: string; detail: string; horizon: string }[];
  connect: { what: string; why: string }[];
};

export function Stage5({ context, onClose, onSaveHistory }: { context: InterviewContext; onClose: () => void; onSaveHistory?: (h: { q: string; a: string }[]) => void }) {
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const [q, setQ] = useState<QNode | null>(null);
  const [coverage, setCoverage] = useState(12);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(true);
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [err, setErr] = useState<'' | 'config' | 'net'>('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Один крок діалогу: шлемо контекст + історію, отримуємо питання або діагноз.
  const step = async (hist: { q: string; a: string }[], action: 'ask' | 'finish') => {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/interview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, history: hist, action }),
      });
      const j = await r.json();
      if (j.error === 'not_configured') { setErr('config'); setBusy(false); return; }
      if (j.error) { setErr('net'); setBusy(false); return; }
      if (j.mode === 'diagnosis') { setDiag(j.diagnosis); setCoverage(100); onSaveHistory?.(hist); }
      else { setQ(j.question); setCoverage(j.coverage ?? coverage); }
    } catch { setErr('net'); }
    setBusy(false);
  };

  useEffect(() => { step([], 'ask'); /* перше питання */ }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (q && !busy) inputRef.current?.focus(); }, [q, busy]);

  const submit = (val: string) => {
    if (!q) return;
    const next = [...history, { q: q.text, a: val }];
    setHistory(next); setAnswer(''); setQ(null);
    step(next, 'ask');
  };
  const finish = () => { setQ(null); step(history, 'finish'); };

  return (
    <StepOverlay>
      <div className="sysx s2 s3 s5" role="dialog" aria-label="Крок 5 — AI-інтерв'ю">
        <button className="s2-x mono" onClick={onClose}>✕ Закрити</button>
        <div className="s2-report s5-in">
          <header className="s2-rep-head">
            <div className="sysx-kick">Крок 5 · Поглиблена AI-діагностика</div>
            <h1 className="sysx-display s2-rep-h">Інтерв'ю під <span className="sysx-em">ваш випадок</span></h1>
            <p className="s2-rep-line">Кілька підібраних питань — і зведемо докази, корені й напрям руху. Відповідайте вільно, як є.</p>
            {!diag && (
              <div className="s5-cov mono"><span>Глибина діагностики</span><div className="s3-depth-track"><i style={{ width: `${coverage}%` }} /></div><b>{coverage}%</b></div>
            )}
          </header>

          {/* Помилки / незалаштований бекенд */}
          {err === 'config' && (
            <div className="s2-panel s5-fallback">
              <span className="sysx-kick">Майже готово</span>
              <p className="s3-reco-p">Онлайн AI-інтерв'ю ще вмикається на цьому акаунті. Тим часом — призначмо коротку зустріч: пройдемо ці питання разом і одразу складемо план.</p>
              <Link to="/contact" className="sysx-cta is-primary">Обрати час зустрічі →</Link>
            </div>
          )}
          {err === 'net' && (
            <div className="s2-panel s5-fallback">
              <p className="s3-reco-p">Звʼязок перервався. Спробуймо ще раз.</p>
              <button className="sysx-cta is-primary" onClick={() => step(history, q ? 'ask' : 'finish')}>Повторити</button>
            </div>
          )}

          {/* Хід інтерв'ю (уже дані відповіді) */}
          {history.length > 0 && !diag && (
            <div className="s5-log">
              {history.map((h, i) => (
                <div key={i} className="s5-turn">
                  <span className="s5-q mono">{h.q}</span>
                  <span className="s5-a">{h.a || <i className="s5-skip">пропущено</i>}</span>
                </div>
              ))}
            </div>
          )}

          {/* Поточне питання */}
          {!diag && !err && (
            <div className="s2-panel s5-ask">
              {busy && !q ? (
                <div className="s5-think mono">Обмірковуємо наступне питання…</div>
              ) : q ? (
                <>
                  <b className="sysx-display s5-q-h">{q.text}</b>
                  {q.why && <span className="s5-why mono">навіщо: {q.why}</span>}
                  {q.kind === 'choice' && q.options?.length ? (
                    <div className="s5-opts">
                      {q.options.map((o) => (
                        <button key={o} className="s2-opt" disabled={busy} onClick={() => submit(o)}>{o}</button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <textarea ref={inputRef} className="s5-ta" rows={3} value={answer} placeholder={q.hint || 'Ваша відповідь…'}
                        disabled={busy} onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(answer.trim()); }} />
                      {q.hint && <span className="s5-hint mono">{q.hint}</span>}
                    </>
                  )}
                  <div className="s5-actions">
                    {q.kind !== 'choice' && <button className="sysx-cta is-primary" disabled={busy || !answer.trim()} onClick={() => submit(answer.trim())}>Відповісти →</button>}
                    <button className="sysx-cta" disabled={busy} onClick={() => submit('')}>Пропустити</button>
                    {history.length >= 2 && <button className="sysx-cta" disabled={busy} onClick={finish}>Завершити й показати діагноз</button>}
                  </div>
                  <span className="s5-tip mono">Enter — новий рядок · Ctrl/⌘+Enter — відповісти</span>
                </>
              ) : null}
            </div>
          )}

          {/* Діагноз */}
          {diag && (
            <>
              <div className="s2-panel s3-verdict">
                <span className="sysx-kick">Поглиблений діагноз</span>
                <p className="s3-epiphany">{diag.summary}</p>
                {diag.rootCauses.length > 0 && (
                  <div className="s5-roots"><span className="s3-sub">Кореневі причини</span><ul>{diag.rootCauses.map((r) => <li key={r}>{r}</li>)}</ul></div>
                )}
              </div>

              {diag.problems.length > 0 && (
                <div className="s2-panel s3-step4">
                  <span className="sysx-kick">Ключові проблеми — докази й пріоритет</span>
                  <div className="s3-kp">
                    <div className="s3-kp-head mono"><span>Проблема</span><span>Докази</span><span>Впевненість</span><span>Пріоритет</span></div>
                    {diag.problems.map((p) => (
                      <div key={p.title} className="s3-kp-row">
                        <b>{p.title}{p.impact && <span className="s5-impact">{p.impact}</span>}</b>
                        <span className="s3-kp-ev">{p.evidence}</span>
                        <span className="s3-kp-conf">{p.confidence}</span>
                        <span className="s3-kp-pri mono">{p.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diag.roadmap.length > 0 && (
                <div className="s2-panel s3-roadmap">
                  <span className="sysx-kick">Дорожня карта</span>
                  <div className="s3-road">
                    {diag.roadmap.map((r, i) => (
                      <div key={r.title} className="s3-road-step">
                        <i className="s3-road-n mono">{String(i + 1).padStart(2, '0')}</i>
                        <div className="s3-road-c"><b>{r.title}{r.horizon && <span className="s3-road-pri mono">{r.horizon}</span>}</b><span>{r.detail}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diag.connect.length > 0 && (
                <div className="s2-panel s5-connect">
                  <span className="sysx-kick">Що підключити для повної картини</span>
                  <p className="s3-reco-p">Наступний рівень точності — коли діагностика бачить ваші реальні дані, а не лише слова.</p>
                  <div className="s5-connect-grid">
                    {diag.connect.map((c) => (
                      <div key={c.what} className="s5-connect-i"><b>{c.what}</b><span>{c.why}</span></div>
                    ))}
                  </div>
                </div>
              )}

              <div className="s2-panel s3-send">
                <div className="s3-send-l">
                  <b className="sysx-display">Складемо повний план?</b>
                  <p className="s3-reco-p">На зустрічі перетворимо цей діагноз на покроковий план під Definition of Done — з термінами й окупністю.</p>
                </div>
                <div className="s3-send-r">
                  <Link to="/contact" className="sysx-cta is-primary">Обрати час зустрічі →</Link>
                  <button className="sysx-cta" onClick={onClose}>Повернутись до звіту</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </StepOverlay>
  );
}
