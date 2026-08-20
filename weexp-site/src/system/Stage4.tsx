import { useEffect, useMemo, useRef, useState } from 'react';
import { STAGE4_SECTIONS, STAGE4_BLOCKS } from './stage4Model';
import type { Block, Stage3Answers, RefItem, FileMeta } from './stage3Model';
import { saveDiag, loadDiag, type DiagUser } from '@/lib/supa';
import { sendLead } from '@/lib/leads';

/**
 * КРОК 4 — поглиблене анкетування (після Access Code). Продовжуємо збирати дані:
 * відкриті відповіді, вибір, файли за шаблонами. Зберігаємо у diag.stage4. На виході —
 * екран завершення: запланувати зустріч · Крок 5 (за кодом) · PDF поглибленого аудиту.
 * Разом Кроки 1–4 закривають ~85% повної анкети клієнта.
 */
const isValidCode = (v: string) => /^WEEXP-[A-Z0-9]{3,}$/.test(v.trim().toUpperCase());
const sectionOf = (i: number) => STAGE4_BLOCKS[i]?.section ?? '';
const filledVal = (b: Block, v: unknown) =>
  b.kind === 'urllist' ? Array.isArray(v) && (v as string[]).some((u) => u && u.trim())
  : b.kind === 'file' ? Boolean(v && typeof v === 'object' && 'name' in (v as object))
  : Array.isArray(v) ? v.length > 0 : v != null && v !== '';

export function Stage4({ user, onGoStep5 }: { user: DiagUser | null; onGoStep5?: (depth: string) => void }) {
  const [ans, setAns] = useState<Stage3Answers>({});
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const saveT = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    loadDiag(user).then((r) => {
      const s4 = (r as { stage4?: Stage3Answers }).stage4;
      if (s4 && typeof s4 === 'object') setAns(s4);
    });
  }, [user]);

  const persist = (next: Stage3Answers) => {
    if (!user) return;
    window.clearTimeout(saveT.current);
    saveT.current = window.setTimeout(() => { saveDiag(user, { stage4: next } as never); }, 500);
  };
  const set = (id: string, v: Stage3Answers[string]) => { setAns((p) => { const n = { ...p, [id]: v }; persist(n); return n; }); };
  const toggle = (id: string, i: number) => setAns((p) => {
    const cur = Array.isArray(p[id]) ? (p[id] as number[]) : [];
    const n = { ...p, [id]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] };
    persist(n); return n;
  });

  const total = STAGE4_BLOCKS.length;
  const answered = useMemo(() => STAGE4_BLOCKS.filter((b) => filledVal(b, ans[b.id])).length, [ans]);
  const progress = Math.round((answered / total) * 100);
  const sections = useMemo(() => STAGE4_SECTIONS.map((name) => {
    const items = STAGE4_BLOCKS.map((b, i) => ({ b, i })).filter((x) => x.b.section === name);
    return { name, start: items[0]?.i ?? 0, total: items.length, answered: items.filter((x) => filledVal(x.b, ans[x.b.id])).length };
  }), [ans]);

  if (done) return <Stage4Done user={user} answered={answered} total={total} ans={ans} onGoStep5={onGoStep5} onBack={() => setDone(false)} />;

  const b = STAGE4_BLOCKS[idx];
  const val = ans[b.id];
  const urls: string[] = b.kind === 'urllist' ? (Array.isArray(val) ? (val as string[]) : ['']) : [];
  const setUrls = (next: string[]) => set(b.id, (next.length ? next : ['']) as string[]);
  const go = (n: number) => setIdx(Math.max(0, Math.min(total - 1, n)));
  const secIndex = STAGE4_SECTIONS.indexOf(sectionOf(idx) as typeof STAGE4_SECTIONS[number]);
  const last = idx + 1 >= total;
  const pickSingle = (i: number) => { set(b.id, i); window.setTimeout(() => (last ? setDone(true) : go(idx + 1)), 150); };

  return (
    <div className="s2-panel s3-step4 s4-flow">
      <div className="s4-head">
        <span className="sysx-kick">Крок 4 · Поглиблений аудит</span>
        <span className="s4-progress mono">{answered}/{total} · {progress}%</span>
      </div>
      <div className="s2-bar"><i style={{ width: `${progress}%` }} /></div>
      <div className="s3-sections s4-sections" role="tablist">
        {sections.map((s, si) => (
          <button key={s.name} role="tab" aria-selected={s.name === sectionOf(idx)}
            className={'s3-sec-chip' + (s.name === sectionOf(idx) ? ' is-on' : '') + (s.total > 0 && s.answered === s.total ? ' is-done' : '')}
            onClick={() => go(s.start)}>
            <b className="mono">{String(si + 1).padStart(2, '0')}</b> {s.name} <i className="mono">{s.answered}/{s.total}</i>
          </button>
        ))}
      </div>

      <div className="s2-card s3-one s4-card" key={b.id}>
        <div className="s2-step mono">Блок {idx + 1} / {total} · секція {secIndex + 1}/{STAGE4_SECTIONS.length}{b.optional ? ' · необовʼязково' : ''}</div>
        <h3 className="sysx-display s2-q">{b.label}</h3>

        {b.kind === 'text' && (
          <label className="s2-inp s3-one-inp"><span className="mono">Ваша відповідь</span>
            <input type="text" maxLength={b.maxLen || 200} placeholder={b.placeholder || 'Коротко, одним реченням…'} value={(val as string) || ''} onChange={(e) => set(b.id, e.target.value)} /></label>
        )}
        {b.kind === 'longtext' && (
          <label className="s2-inp s3-one-inp s3-longtext"><span className="mono">Розгорніть</span>
            <textarea rows={b.rows || 5} maxLength={b.maxLen || 900} placeholder={b.placeholder || 'До кількох речень…'} value={(val as string) || ''} onChange={(e) => set(b.id, e.target.value)} /></label>
        )}
        {b.kind === 'file' && (
          <div className="s3-file">
            {b.template && <a className="s3-file-tpl mono" href={b.template.href} download>↓ Шаблон: {b.template.label}</a>}
            <label className="s3-file-drop">
              <input type="file" accept={b.accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) set(b.id, { name: f.name, size: f.size, type: f.type, at: new Date().toISOString() } as FileMeta); }} />
              <span className="s3-file-cta mono">{val && typeof val === 'object' && 'name' in (val as object) ? `✓ ${(val as { name: string }).name}` : (b.placeholder || 'Обрати файл (Word · Excel · PDF)…')}</span>
            </label>
          </div>
        )}
        {b.kind === 'single' && (
          <div className="s2-opts">
            {b.options!.map((o, i) => (
              <button key={o.label} className={`s2-opt${val === i ? ' on' : ''}`} onClick={() => pickSingle(i)}>
                <span className="s2-opt-mark" aria-hidden="true" />{o.label}</button>
            ))}
          </div>
        )}
        {b.kind === 'multi' && (
          <div className="s2-opts">
            {b.options!.map((o, i) => (
              <button key={o.label} className={`s2-opt${Array.isArray(val) && (val as number[]).includes(i) ? ' on' : ''}`} onClick={() => toggle(b.id, i)}>
                <span className="s2-opt-mark" aria-hidden="true" />{o.label}</button>
            ))}
          </div>
        )}
        {b.kind === 'urllist' && (
          <div className="s3-list-in">
            {urls.map((u, i) => (
              <div key={i} className="s3-row">
                <input type="url" inputMode="url" placeholder={b.placeholder || 'https://'} value={u} onChange={(e) => setUrls(urls.map((x, j) => (j === i ? e.target.value : x)))} />
                {urls.length > 1 && <button className="s3-del" aria-label="Прибрати" onClick={() => setUrls(urls.filter((_, j) => j !== i))}>✕</button>}
              </div>
            ))}
            <button className="s3-add" onClick={() => setUrls([...urls, ''])}>{b.addLabel || '+ Додати ще'}</button>
          </div>
        )}

        <div className="s2-quiz-actions s3-flow-actions">
          <span className="s3-flow-left">{idx > 0 && <button className="s2-back mono" onClick={() => go(idx - 1)}>← Назад</button>}</span>
          <span className="s3-flow-right">
            {b.kind === 'single' && !last && <button className="s2-back mono" onClick={() => go(idx + 1)}>Пропустити →</button>}
            {(b.kind !== 'single' || last) && (
              <button className="sysx-cta is-primary" onClick={() => (last ? setDone(true) : go(idx + 1))}>{last ? 'Завершити Крок 4 →' : 'Далі →'}</button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Екран завершення Кроку 4 ── */
function Stage4Done({ user, answered, total, ans, onGoStep5, onBack }:
  { user: DiagUser | null; answered: number; total: number; ans: Stage3Answers; onGoStep5?: (d: string) => void; onBack: () => void }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(''); const [codeErr, setCodeErr] = useState(''); const [codeOn, setCodeOn] = useState(false);
  const files = STAGE4_BLOCKS.filter((b) => b.kind === 'file' && ans[b.id] && typeof ans[b.id] === 'object').length;

  const schedule = async () => {
    setBusy(true);
    await sendLead({ source: 'stage4-complete', email: user?.email, role: 'cabinet',
      task: 'Крок 4 пройдено — запит на зустріч по поглибленому аудиту',
      comment: `Заповнено ${answered}/${total} блоків Кроку 4, файлів: ${files}.` });
    setBusy(false); setSent(true);
  };
  const unlockStep5 = () => {
    if (!isValidCode(code)) { setCodeErr('Код недійсний. Попросіть його в менеджера.'); return; }
    setCodeErr(''); onGoStep5?.('T4');
  };
  const downloadPdf = () => {
    document.body.classList.add('printing-s4');
    const after = () => { document.body.classList.remove('printing-s4'); window.removeEventListener('afterprint', after); };
    window.addEventListener('afterprint', after);
    window.print();
    window.setTimeout(after, 1500);
  };

  return (
    <div className="s2-panel s3-step4 s4-done">
      <span className="sysx-kick">Крок 4 · завершено</span>
      <h3 className="sysx-display s3-step4-h">Дані зібрано. Що далі?</h3>
      <p className="s3-step4-intro">Ви заповнили <b>{answered} із {total}</b> блоків поглибленого аудиту{files ? <>, завантажили <b>{files}</b> файл(и)</> : null}. Разом із Кроками 1–3 це закриває основу для повного аудиту — ми зводимо все у докази, пріоритети й дорожню карту.</p>

      <div className="s4-actions">
        <div className="s4-act">
          <b>Запланувати зустріч</b>
          <span>Розберемо результати наживо й покажемо план повернення виторгу.</span>
          {sent ? <span className="cab-saved mono">✓ Запит надіслано на {user?.email}</span>
            : <button className="sysx-cta is-primary" onClick={schedule} disabled={busy}>{busy ? 'Надсилаємо…' : 'Запланувати зустріч →'}</button>}
        </div>

        <div className="s4-act">
          <b>Крок 5 — AI-інтерв'ю</b>
          <span>Персональні питання під ваш випадок. Відкривається за кодом від менеджера.</span>
          {codeOn ? (
            <div className="s4-code">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WEEXP-XXXX" />
              <button className="sysx-cta" onClick={unlockStep5} disabled={!code.trim()}>Активувати →</button>
              {codeErr && <span className="s3-err mono">{codeErr}</span>}
            </div>
          ) : <button className="sysx-cta" onClick={() => setCodeOn(true)}>Ввести код Кроку 5 →</button>}
        </div>

        <div className="s4-act">
          <b>PDF поглибленого аудиту</b>
          <span>Робочий зріз за підсумком усіх 4 кроків — зручно поділитися з командою.</span>
          <button className="sysx-cta" onClick={downloadPdf}>↓ Завантажити PDF</button>
        </div>
      </div>

      <button className="s2-back mono s4-back" onClick={onBack}>← Повернутись до питань Кроку 4</button>

      {/* Друкована версія (window.print → зберегти як PDF) */}
      <div id="s4-report" aria-hidden="true">
        <h1>WEEXP — поглиблений аудит (робочий зріз)</h1>
        <p>Клієнт: {user?.email || '—'} · заповнено {answered}/{total} блоків Кроку 4 · файлів: {files}</p>
        {STAGE4_SECTIONS.map((sec) => (
          <section key={sec}>
            <h2>{sec}</h2>
            {STAGE4_BLOCKS.filter((b) => b.section === sec).map((b) => {
              const v = ans[b.id];
              let text = '—';
              if (b.kind === 'single' && typeof v === 'number') text = b.options?.[v]?.label ?? '—';
              else if (b.kind === 'multi' && Array.isArray(v)) text = (v as number[]).map((i) => b.options?.[i]?.label).filter(Boolean).join(', ') || '—';
              else if (b.kind === 'file' && v && typeof v === 'object' && 'name' in (v as object)) text = `файл: ${(v as { name: string }).name}`;
              else if (b.kind === 'urllist' && Array.isArray(v)) text = (v as string[]).filter(Boolean).join(', ') || '—';
              else if (typeof v === 'string') text = v || '—';
              return (<p key={b.id}><b>{b.label}</b><br />{text}</p>);
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
