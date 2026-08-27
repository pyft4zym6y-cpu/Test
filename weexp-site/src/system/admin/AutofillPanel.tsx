import { useEffect, useMemo, useState } from 'react';
import { findAuditIdByCode, loadAuditAnswers, savePatchFor, type AuditAnswer, type DiagRecord } from '@/lib/supa';
import { toast } from '@/lib/toast';
import { applySuggestions, suggestProfile, type Suggestion } from './fillFromAnswers';

/**
 * Перенести профіль з анкети в картку.
 *
 * Свідомо НЕ автоматично. Автозаповнення, яке пише саме, рано чи пізно тихо
 * зіпсує картку, і ніхто не згадає, звідки взялось дивне значення. Тут
 * менеджер бачить, що буде поставлено і з якого питання воно взялось, знімає
 * зайве й підтверджує. Заповнені поля в список не потрапляють узагалі —
 * уточнення, зроблене в розмові, не має зникати від того, що клієнт дозаповнив
 * анкету.
 */
export function AutofillPanel({ userId, code, rec, onSaved }: {
  userId: string; code?: string; rec: DiagRecord; onSaved?: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, AuditAnswer> | null>(null);
  const [skip, setSkip] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const id = code ? await findAuditIdByCode(code) : null;
        const a = id ? await loadAuditAnswers(id) : {};
        if (alive) setAnswers(a);
      } catch { if (alive) setAnswers({}); }
    })();
    return () => { alive = false; };
  }, [code]);

  const all = useMemo(() => (answers ? suggestProfile(rec, answers) : []), [rec, answers]);
  const picked = all.filter((s) => !skip.has(s.field as string));

  if (answers === null) return null;
  if (!all.length) return null;

  const toggle = (s: Suggestion) => {
    const next = new Set(skip);
    const k = s.field as string;
    if (next.has(k)) next.delete(k); else next.add(k);
    setSkip(next);
  };

  const apply = async () => {
    if (!picked.length) return;
    setBusy(true);
    const company = applySuggestions(rec.company || {}, picked);
    const r = await savePatchFor(userId, { company });
    setBusy(false);
    if (r.ok) { toast(`✓ Перенесено полів: ${picked.length}`); onSaved?.(); }
    else toast('Не збережено: ' + (r.error || 'помилка'), 'err');
  };

  return (
    <div className="adm-fill">
      <div className="adm-fill-head">
        <b>З анкети можна заповнити {all.length} {all.length === 1 ? 'поле' : 'полів'}</b>
        <span className="mono adm-empty">заповнені поля не чіпаємо — те, що ви уточнили в розмові, лишається</span>
      </div>
      <ul className="adm-fill-list">
        {all.map((s) => {
          const off = skip.has(s.field as string);
          return (
            <li key={s.field as string} className={off ? 'is-off' : ''}>
              <label>
                <input type="checkbox" checked={!off} onChange={() => toggle(s)} />
                <i className="mono">{s.label}</i>
                <span>{Array.isArray(s.value) ? s.value.join(', ') : s.value}</span>
                <em className="mono" title="Питання анкети, з якого взято">{s.from}</em>
              </label>
            </li>
          );
        })}
      </ul>
      <button className="mc-btn ok" disabled={busy || !picked.length} onClick={apply}>
        {busy ? 'Переносимо…' : `↓ Перенести в картку (${picked.length})`}
      </button>
    </div>
  );
}
