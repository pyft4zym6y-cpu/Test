import { useMemo, useState } from 'react';
import { saveAuditAnswer, uploadTierFile, type AuditAnswer, type DiagUser } from '@/lib/supa';
import type { AuditTemplate, Question } from './auditTemplate';

/**
 * Спільна форма глибокого аудиту компанії. Кілька спеціалістів по одному коду
 * пишуть в ОДИН аудит (audit_answers). Кожна відповідь підписана автором (email)
 * і часом. Last-write-wins. Ролі обмежують блоки. Умовна логіка ховає питання.
 */
const relTime = (iso?: string) => {
  if (!iso) return '';
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'щойно'; if (s < 3600) return `${Math.floor(s / 60)} хв`; if (s < 86400) return `${Math.floor(s / 3600)} год`;
  try { return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' }); } catch { return ''; }
};

export function AuditForm({ user, auditId, template, initial, role, isOwner }: {
  user: DiagUser; auditId: string; template: AuditTemplate; initial: Record<string, AuditAnswer>; role?: string; isOwner: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, AuditAnswer>>(initial);
  const [saving, setSaving] = useState<string>('');

  const valOf = (k: string) => answers[k]?.value;
  const visible = (q: Question) => !q.condQKey || String(valOf(q.condQKey) ?? '') === String(q.condValue ?? '');

  const commit = async (qkey: string, value: unknown) => {
    setAnswers((a) => ({ ...a, [qkey]: { value, by: user.email, at: new Date().toISOString() } }));
    setSaving(qkey);
    await saveAuditAnswer(auditId, qkey, value, user.email);
    setSaving('');
  };
  const onFile = async (qkey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    setSaving(qkey);
    const r = await uploadTierFile(user, 'AUDIT', f);
    await commit(qkey, { name: f.name, path: r.path || '', size: f.size });
    setSaving('');
  };

  const progress = useMemo(() => {
    let total = 0, done = 0;
    template.blocks.forEach((b) => b.questions.forEach((q) => { if (visible(q)) { total++; if (answers[q.key]?.value != null && answers[q.key]?.value !== '') done++; } }));
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [answers, template]);

  return (
    <div className="af">
      <div className="af-prog">
        <div className="af-prog-bar"><span style={{ width: `${progress.pct}%` }} /></div>
        <span className="mono">{progress.done}/{progress.total} · {progress.pct}%</span>
      </div>

      {template.blocks.map((b) => {
        const locked = !!b.role && !isOwner && role !== b.role;
        const vqs = b.questions.filter(visible);
        return (
          <div key={b.key} className={`af-block${locked ? ' locked' : ''}`}>
            <div className="af-block-head">
              <b className="af-block-t">{b.title}</b>
              {b.role && <span className="af-role mono">{locked ? `заповнює: ${b.role}` : b.role}</span>}
            </div>
            {vqs.length === 0 ? <p className="af-empty mono">—</p> : vqs.map((q) => {
              const a = answers[q.key];
              return (
                <div key={q.key} className="af-q">
                  <label className="af-lbl">{q.label}{q.required && <i className="af-req">*</i>}</label>
                  {q.hint && <span className="af-hint mono">{q.hint}</span>}
                  <Field q={q} value={a?.value} disabled={locked || saving === q.key} onCommit={(v) => commit(q.key, v)} onFile={(e) => onFile(q.key, e)} />
                  {a?.by && <span className="af-by mono">← {a.by} · {relTime(a.at)}</span>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Field({ q, value, disabled, onCommit, onFile }: {
  q: Question; value: unknown; disabled: boolean; onCommit: (v: unknown) => void; onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [local, setLocal] = useState<string>(typeof value === 'string' || typeof value === 'number' ? String(value) : '');
  const arr = Array.isArray(value) ? (value as string[]) : [];

  if (q.type === 'longtext')
    return <textarea className="af-inp" rows={3} defaultValue={local} disabled={disabled} onBlur={(e) => onCommit(e.target.value)} placeholder="Відповідь…" />;
  if (q.type === 'text' || q.type === 'access')
    return <input className="af-inp" type={q.type === 'access' ? 'email' : 'text'} defaultValue={local} disabled={disabled} onBlur={(e) => onCommit(e.target.value)} placeholder={q.type === 'access' ? 'email доступу' : 'Відповідь…'} />;
  if (q.type === 'number')
    return <input className="af-inp" type="number" defaultValue={local} disabled={disabled} onBlur={(e) => onCommit(e.target.value ? Number(e.target.value) : '')} placeholder="0" />;
  if (q.type === 'date')
    return <input className="af-inp" type="date" defaultValue={local} disabled={disabled} onChange={(e) => onCommit(e.target.value)} />;
  if (q.type === 'scale')
    return <div className="af-scale">{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
      <button key={n} className={`af-scale-b${Number(value) === n ? ' on' : ''}`} disabled={disabled} onClick={() => onCommit(n)}>{n}</button>
    ))}</div>;
  if (q.type === 'single')
    return <div className="af-opts">{(q.options || []).map((o) => (
      <button key={o} className={`af-opt${value === o ? ' on' : ''}`} disabled={disabled} onClick={() => onCommit(o)}>{o}</button>
    ))}</div>;
  if (q.type === 'multi')
    return <div className="af-opts">{(q.options || []).map((o) => {
      const on = arr.includes(o);
      return <button key={o} className={`af-opt${on ? ' on' : ''}`} disabled={disabled} onClick={() => onCommit(on ? arr.filter((x) => x !== o) : [...arr, o])}>{on ? '✓ ' : ''}{o}</button>;
    })}</div>;
  if (q.type === 'file') {
    const f = value as { name?: string } | undefined;
    return <label className={`af-file${disabled ? ' dis' : ''}`}>
      <input type="file" hidden disabled={disabled} onChange={onFile} />
      <span>{f?.name ? `📎 ${f.name}` : '＋ Завантажити файл'}</span>
    </label>;
  }
  return null;
}
