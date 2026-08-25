import { authHeaders } from '@/lib/supa';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT, useLp } from '@/i18n';
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
  const t = useT();
  const lp = useLp();
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
        // Ендпоінт витрачає токени Anthropic і тепер вимагає вхід — кладемо сесію.
        method: 'POST', headers: await authHeaders(),
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
      <div className="sysx s2 s3 s5" role="dialog" aria-label={t("Крок 5 — AI-інтерв'ю", 'Step 5 — AI interview')}>
        <button className="s2-x mono" onClick={onClose}>{t('✕ Закрити', '✕ Close')}</button>
        <div className="s2-report s5-in">
          <header className="s2-rep-head">
            <div className="sysx-kick">{t('Крок 5 · Поглиблена AI-діагностика', 'Step 5 · In-depth AI diagnostics')}</div>
            <h1 className="sysx-display s2-rep-h">{t('Інтерв\'ю під', 'Interview for')} <span className="sysx-em">{t('ваш випадок', 'your case')}</span></h1>
            <p className="s2-rep-line">{t('Кілька підібраних питань — і зведемо докази, корені й напрям руху. Відповідайте вільно, як є.', 'A few tailored questions — and we bring together the evidence, root causes and direction. Answer freely, as it is.')}</p>
            {!diag && (
              <div className="s5-cov mono"><span>{t('Глибина діагностики', 'Diagnostic depth')}</span><div className="s3-depth-track"><i style={{ width: `${coverage}%` }} /></div><b>{coverage}%</b></div>
            )}
          </header>

          {/* Помилки / незалаштований бекенд */}
          {err === 'config' && (
            <div className="s2-panel s5-fallback">
              <span className="sysx-kick">{t('Майже готово', 'Almost ready')}</span>
              <p className="s3-reco-p">{t("Онлайн AI-інтерв'ю ще вмикається на цьому акаунті. Тим часом — призначмо коротку зустріч: пройдемо ці питання разом і одразу складемо план.", 'The online AI interview is still being enabled on this account. In the meantime, let\'s set up a short call: we\'ll go through these questions together and draw up a plan right away.')}</p>
              <Link to={lp('/contact')} className="sysx-cta is-primary">{t('Обрати час зустрічі →', 'Pick a time to meet →')}</Link>
            </div>
          )}
          {err === 'net' && (
            <div className="s2-panel s5-fallback">
              <p className="s3-reco-p">{t('Звʼязок перервався. Спробуймо ще раз.', 'The connection dropped. Let\'s try again.')}</p>
              <button className="sysx-cta is-primary" onClick={() => step(history, q ? 'ask' : 'finish')}>{t('Повторити', 'Retry')}</button>
            </div>
          )}

          {/* Хід інтерв'ю (уже дані відповіді) */}
          {history.length > 0 && !diag && (
            <div className="s5-log">
              {history.map((h, i) => (
                <div key={i} className="s5-turn">
                  <span className="s5-q mono">{h.q}</span>
                  <span className="s5-a">{h.a || <i className="s5-skip">{t('пропущено', 'skipped')}</i>}</span>
                </div>
              ))}
            </div>
          )}

          {/* Поточне питання */}
          {!diag && !err && (
            <div className="s2-panel s5-ask">
              {busy && !q ? (
                <div className="s5-think mono">{t('Обмірковуємо наступне питання…', 'Thinking through the next question…')}</div>
              ) : q ? (
                <>
                  <b className="sysx-display s5-q-h">{q.text}</b>
                  {q.why && <span className="s5-why mono">{t('навіщо:', 'why:')} {q.why}</span>}
                  {q.kind === 'choice' && q.options?.length ? (
                    <div className="s5-opts">
                      {q.options.map((o) => (
                        <button key={o} className="s2-opt" disabled={busy} onClick={() => submit(o)}>{o}</button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <textarea ref={inputRef} className="s5-ta" rows={3} value={answer} placeholder={q.hint || t('Ваша відповідь…', 'Your answer…')}
                        disabled={busy} onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(answer.trim()); }} />
                      {q.hint && <span className="s5-hint mono">{q.hint}</span>}
                    </>
                  )}
                  <div className="s5-actions">
                    {q.kind !== 'choice' && <button className="sysx-cta is-primary" disabled={busy || !answer.trim()} onClick={() => submit(answer.trim())}>{t('Відповісти →', 'Answer →')}</button>}
                    <button className="sysx-cta" disabled={busy} onClick={() => submit('')}>{t('Пропустити', 'Skip')}</button>
                    {history.length >= 2 && <button className="sysx-cta" disabled={busy} onClick={finish}>{t('Завершити й показати діагноз', 'Finish and show diagnosis')}</button>}
                  </div>
                  <span className="s5-tip mono">{t('Enter — новий рядок · Ctrl/⌘+Enter — відповісти', 'Enter — new line · Ctrl/⌘+Enter — answer')}</span>
                </>
              ) : null}
            </div>
          )}

          {/* Діагноз */}
          {diag && (
            <>
              <div className="s2-panel s3-verdict">
                <span className="sysx-kick">{t('Поглиблений діагноз', 'In-depth diagnosis')}</span>
                <p className="s3-epiphany">{diag.summary}</p>
                {diag.rootCauses.length > 0 && (
                  <div className="s5-roots"><span className="s3-sub">{t('Кореневі причини', 'Root causes')}</span><ul>{diag.rootCauses.map((r) => <li key={r}>{r}</li>)}</ul></div>
                )}
              </div>

              {diag.problems.length > 0 && (
                <div className="s2-panel s3-step4">
                  <span className="sysx-kick">{t('Ключові проблеми — докази й пріоритет', 'Key problems — evidence and priority')}</span>
                  <div className="s3-kp">
                    <div className="s3-kp-head mono"><span>{t('Проблема', 'Problem')}</span><span>{t('Докази', 'Evidence')}</span><span>{t('Впевненість', 'Confidence')}</span><span>{t('Пріоритет', 'Priority')}</span></div>
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
                  <span className="sysx-kick">{t('Дорожня карта', 'Roadmap')}</span>
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
                  <span className="sysx-kick">{t('Що підключити для повної картини', 'What to connect for the full picture')}</span>
                  <p className="s3-reco-p">{t('Наступний рівень точності — коли діагностика бачить ваші реальні дані, а не лише слова.', 'The next level of accuracy — when diagnostics see your real data, not just words.')}</p>
                  <div className="s5-connect-grid">
                    {diag.connect.map((c) => (
                      <div key={c.what} className="s5-connect-i"><b>{c.what}</b><span>{c.why}</span></div>
                    ))}
                  </div>
                </div>
              )}

              <div className="s2-panel s3-send">
                <div className="s3-send-l">
                  <b className="sysx-display">{t('Складемо повний план?', 'Shall we build the full plan?')}</b>
                  <p className="s3-reco-p">{t('На зустрічі перетворимо цей діагноз на покроковий план під Definition of Done — з термінами й окупністю.', 'In the meeting we\'ll turn this diagnosis into a step-by-step plan under a Definition of Done — with timelines and payback.')}</p>
                </div>
                <div className="s3-send-r">
                  <Link to={lp('/contact')} className="sysx-cta is-primary">{t('Обрати час зустрічі →', 'Pick a time to meet →')}</Link>
                  <button className="sysx-cta" onClick={onClose}>{t('Повернутись до звіту', 'Back to report')}</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </StepOverlay>
  );
}
