import { useEffect, useMemo, useRef, useState } from 'react';
import { STAGE4_SECTIONS, STAGE4_BLOCKS, localizeS4Block, localizeS4Section } from './stage4Model';
import type { Block, Stage3Answers, RefItem, FileMeta } from './stage3Model';
import { saveDiag, loadDiag, type DiagUser } from '@/lib/supa';
import { sendLead } from '@/lib/leads';
import { isValidCode } from '@/lib/access';
import { useT, useLang } from '@/i18n';

/**
 * КРОК 4 — поглиблене анкетування (після Access Code). Продовжуємо збирати дані:
 * відкриті відповіді, вибір, файли за шаблонами. Зберігаємо у diag.stage4. На виході —
 * екран завершення: запланувати зустріч · Крок 5 (за кодом) · PDF поглибленого аудиту.
 * Разом Кроки 1–4 закривають ~85% повної анкети клієнта.
 */
const sectionOf = (i: number) => STAGE4_BLOCKS[i]?.section ?? '';
const filledVal = (b: Block, v: unknown) =>
  b.kind === 'urllist' ? Array.isArray(v) && (v as string[]).some((u) => u && u.trim())
  : b.kind === 'file' ? Boolean(v && typeof v === 'object' && 'name' in (v as object))
  : Array.isArray(v) ? v.length > 0 : v != null && v !== '';

export function Stage4({ user, onGoStep5 }: { user: DiagUser | null; onGoStep5?: (depth: string) => void }) {
  const t = useT();
  const lang = useLang();
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
  const bl = localizeS4Block(b, lang);
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
        <span className="sysx-kick">{t('Крок 4 · Поглиблений аудит', 'Step 4 · Deep audit')}</span>
        <span className="s4-progress mono">{answered}/{total} · {progress}%</span>
      </div>
      <div className="s2-bar"><i style={{ width: `${progress}%` }} /></div>
      <div className="s3-sections s4-sections" role="tablist">
        {sections.map((s, si) => (
          <button key={s.name} role="tab" aria-selected={s.name === sectionOf(idx)}
            className={'s3-sec-chip' + (s.name === sectionOf(idx) ? ' is-on' : '') + (s.total > 0 && s.answered === s.total ? ' is-done' : '')}
            onClick={() => go(s.start)}>
            <b className="mono">{String(si + 1).padStart(2, '0')}</b> {localizeS4Section(s.name, lang)} <i className="mono">{s.answered}/{s.total}</i>
          </button>
        ))}
      </div>

      <div className="s2-card s3-one s4-card" key={b.id}>
        <div className="s2-step mono">{t('Блок', 'Block')} {idx + 1} / {total} · {t('секція', 'section')} {secIndex + 1}/{STAGE4_SECTIONS.length}{b.optional ? t(' · необовʼязково', ' · optional') : ''}</div>
        <h3 className="sysx-display s2-q">{bl.label}</h3>

        {b.kind === 'text' && (
          <label className="s2-inp s3-one-inp"><span className="mono">{t('Ваша відповідь', 'Your answer')}</span>
            <input type="text" maxLength={b.maxLen || 200} placeholder={bl.placeholder || t('Коротко, одним реченням…', 'Briefly, in one sentence…')} value={(val as string) || ''} onChange={(e) => set(b.id, e.target.value)} /></label>
        )}
        {b.kind === 'longtext' && (
          <label className="s2-inp s3-one-inp s3-longtext"><span className="mono">{t('Розгорніть', 'Expand')}</span>
            <textarea rows={b.rows || 5} maxLength={b.maxLen || 900} placeholder={bl.placeholder || t('До кількох речень…', 'A few sentences…')} value={(val as string) || ''} onChange={(e) => set(b.id, e.target.value)} /></label>
        )}
        {b.kind === 'file' && (
          <div className="s3-file">
            {bl.template && <a className="s3-file-tpl mono" href={bl.template.href} download>{t('↓ Шаблон', '↓ Template')}: {bl.template.label}</a>}
            <label className="s3-file-drop">
              <input type="file" accept={b.accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) set(b.id, { name: f.name, size: f.size, type: f.type, at: new Date().toISOString() } as FileMeta); }} />
              <span className="s3-file-cta mono">{val && typeof val === 'object' && 'name' in (val as object) ? `✓ ${(val as { name: string }).name}` : (bl.placeholder || t('Обрати файл (Word · Excel · PDF)…', 'Choose a file (Word · Excel · PDF)…'))}</span>
            </label>
          </div>
        )}
        {b.kind === 'single' && (
          <div className="s2-opts">
            {bl.options!.map((o, i) => (
              <button key={o.label} className={`s2-opt${val === i ? ' on' : ''}`} onClick={() => pickSingle(i)}>
                <span className="s2-opt-mark" aria-hidden="true" />{o.label}</button>
            ))}
          </div>
        )}
        {b.kind === 'multi' && (
          <div className="s2-opts">
            {bl.options!.map((o, i) => (
              <button key={o.label} className={`s2-opt${Array.isArray(val) && (val as number[]).includes(i) ? ' on' : ''}`} onClick={() => toggle(b.id, i)}>
                <span className="s2-opt-mark" aria-hidden="true" />{o.label}</button>
            ))}
          </div>
        )}
        {b.kind === 'urllist' && (
          <div className="s3-list-in">
            {urls.map((u, i) => (
              <div key={i} className="s3-row">
                <input type="url" inputMode="url" placeholder={bl.placeholder || 'https://'} value={u} onChange={(e) => setUrls(urls.map((x, j) => (j === i ? e.target.value : x)))} />
                {urls.length > 1 && <button className="s3-del" aria-label={t('Прибрати', 'Remove')} onClick={() => setUrls(urls.filter((_, j) => j !== i))}>✕</button>}
              </div>
            ))}
            <button className="s3-add" onClick={() => setUrls([...urls, ''])}>{bl.addLabel || t('+ Додати ще', '+ Add another')}</button>
          </div>
        )}

        <div className="s2-quiz-actions s3-flow-actions">
          <span className="s3-flow-left">{idx > 0 && <button className="s2-back mono" onClick={() => go(idx - 1)}>{t('← Назад', '← Back')}</button>}</span>
          <span className="s3-flow-right">
            {b.kind === 'single' && !last && <button className="s2-back mono" onClick={() => go(idx + 1)}>{t('Пропустити →', 'Skip →')}</button>}
            {(b.kind !== 'single' || last) && (
              <button className="sysx-cta is-primary" onClick={() => (last ? setDone(true) : go(idx + 1))}>{last ? t('Завершити Крок 4 →', 'Finish Step 4 →') : t('Далі →', 'Next →')}</button>
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
  const t = useT();
  const lang = useLang();
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
    if (!isValidCode(code)) { setCodeErr(t('Код недійсний. Попросіть його в менеджера.', 'Invalid code. Ask your manager for it.')); return; }
    setCodeErr(''); onGoStep5?.('T4');
  };
  // Формуємо самодостатню друковану сторінку у новій вкладці й друкуємо ЇЇ.
  // Надійніше за print головного вікна (особливо на iOS, де visibility-трюк давав
  // порожній PDF): нова вкладка містить лише звіт, browser коректно зберігає у PDF.
  const answerText = (b: Block): string => {
    const v = ans[b.id];
    if (b.kind === 'single' && typeof v === 'number') return b.options?.[v]?.label ?? '—';
    if (b.kind === 'multi' && Array.isArray(v)) return (v as number[]).map((i) => b.options?.[i]?.label).filter(Boolean).join(', ') || '—';
    if (b.kind === 'file' && v && typeof v === 'object' && 'name' in (v as object)) return `${t('файл', 'file')}: ${(v as { name: string }).name}`;
    if (b.kind === 'urllist' && Array.isArray(v)) return (v as string[]).filter(Boolean).join(', ') || '—';
    if (typeof v === 'string') return v || '—';
    return '—';
  };
  const downloadPdf = () => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const body = STAGE4_SECTIONS.map((sec) => {
      const rows = STAGE4_BLOCKS.filter((b) => b.section === sec)
        .map((b) => { const lb = localizeS4Block(b, lang); return `<p><b>${esc(lb.label)}</b><br>${esc(answerText(lb))}</p>`; }).join('');
      return `<section><h2>${esc(localizeS4Section(sec, lang))}</h2>${rows}</section>`;
    }).join('');
    const title = t('WEEXP — поглиблений аудит', 'WEEXP — deep audit');
    const h1 = t('WEEXP — поглиблений аудит (робочий зріз)', 'WEEXP — deep audit (working snapshot)');
    const sub = `${t('Клієнт', 'Client')}: ${esc(user?.email || '—')} · ${t('заповнено', 'completed')} ${answered}/${total} ${t('блоків Кроку 4', 'Step 4 blocks')} · ${t('файлів', 'files')}: ${files}`;
    const doc = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#15171A;max-width:760px;margin:0 auto;padding:28px 22px;-webkit-print-color-adjust:exact}h1{font-size:20px;margin:0 0 4px}.sub{color:#61686F;font-size:12px;margin:0 0 18px}h2{font-size:14px;margin:18px 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px}section{break-inside:avoid}p{font-size:12px;margin:0 0 7px;line-height:1.45}b{color:#15171A}@page{margin:14mm}</style></head><body><h1>${esc(h1)}</h1><p class="sub">${sub}</p>${body}<scr` + `ipt>window.onload=function(){setTimeout(function(){window.print()},400)}</scr` + `ipt></body></html>`;
    const w = window.open('', '_blank');
    if (!w) { alert(t('Дозвольте спливаючі вікна, щоб зберегти PDF.', 'Allow pop-ups to save the PDF.')); return; }
    w.document.open(); w.document.write(doc); w.document.close();
  };

  return (
    <div className="s2-panel s3-step4 s4-done">
      <span className="sysx-kick">{t('Крок 4 · завершено', 'Step 4 · completed')}</span>
      <h3 className="sysx-display s3-step4-h">{t('Дані зібрано. Що далі?', 'Data collected. What’s next?')}</h3>
      <p className="s3-step4-intro">{t('Ви заповнили ', 'You completed ')}<b>{answered} {t('із', 'of')} {total}</b>{t(' блоків поглибленого аудиту', ' deep-audit blocks')}{files ? <>{t(', завантажили ', ', uploaded ')}<b>{files}</b>{t(' файл(и)', ' file(s)')}</> : null}{t('. Разом із Кроками 1–3 це закриває основу для повного аудиту — ми зводимо все у докази, пріоритети й дорожню карту.', '. Together with Steps 1–3 this covers the foundation for the full audit — we consolidate everything into evidence, priorities and a roadmap.')}</p>

      <div className="s4-actions">
        <div className="s4-act">
          <b>{t('Запланувати зустріч', 'Schedule a meeting')}</b>
          <span>{t('Розберемо результати наживо й покажемо план повернення виторгу.', 'We’ll review the results live and show a plan to recover revenue.')}</span>
          {sent ? <span className="cab-saved mono">{t('✓ Запит надіслано на', '✓ Request sent to')} {user?.email}</span>
            : <button className="sysx-cta is-primary" onClick={schedule} disabled={busy}>{busy ? t('Надсилаємо…', 'Sending…') : t('Запланувати зустріч →', 'Schedule a meeting →')}</button>}
        </div>

        <div className="s4-act">
          <b>{t('Крок 5 — AI-інтерв\'ю', 'Step 5 — AI interview')}</b>
          <span>{t('Персональні питання під ваш випадок. Відкривається за кодом від менеджера.', 'Questions tailored to your case. Unlocked with a code from your manager.')}</span>
          {codeOn ? (
            <div className="s4-code">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WEEXP-XXXX" />
              <button className="sysx-cta" onClick={unlockStep5} disabled={!code.trim()}>{t('Активувати →', 'Activate →')}</button>
              {codeErr && <span className="s3-err mono">{codeErr}</span>}
            </div>
          ) : <button className="sysx-cta" onClick={() => setCodeOn(true)}>{t('Ввести код Кроку 5 →', 'Enter Step 5 code →')}</button>}
        </div>

        <div className="s4-act">
          <b>{t('PDF поглибленого аудиту', 'Deep audit PDF')}</b>
          <span>{t('Робочий зріз за підсумком усіх 4 кроків — зручно поділитися з командою.', 'A working snapshot across all 4 steps — easy to share with your team.')}</span>
          <button className="sysx-cta" onClick={downloadPdf}>{t('↓ Завантажити PDF', '↓ Download PDF')}</button>
        </div>
      </div>

      <button className="s2-back mono s4-back" onClick={onBack}>{t('← Повернутись до питань Кроку 4', '← Back to Step 4 questions')}</button>

      {/* Друкована версія (window.print → зберегти як PDF) */}
      <div id="s4-report" aria-hidden="true">
        <h1>{t('WEEXP — поглиблений аудит (робочий зріз)', 'WEEXP — deep audit (working snapshot)')}</h1>
        <p>{t('Клієнт', 'Client')}: {user?.email || '—'} · {t('заповнено', 'completed')} {answered}/{total} {t('блоків Кроку 4', 'Step 4 blocks')} · {t('файлів', 'files')}: {files}</p>
        {STAGE4_SECTIONS.map((sec) => (
          <section key={sec}>
            <h2>{localizeS4Section(sec, lang)}</h2>
            {STAGE4_BLOCKS.filter((b) => b.section === sec).map((b) => {
              const lb = localizeS4Block(b, lang);
              const v = ans[b.id];
              let text = '—';
              if (b.kind === 'single' && typeof v === 'number') text = lb.options?.[v]?.label ?? '—';
              else if (b.kind === 'multi' && Array.isArray(v)) text = (v as number[]).map((i) => lb.options?.[i]?.label).filter(Boolean).join(', ') || '—';
              else if (b.kind === 'file' && v && typeof v === 'object' && 'name' in (v as object)) text = `${t('файл', 'file')}: ${(v as { name: string }).name}`;
              else if (b.kind === 'urllist' && Array.isArray(v)) text = (v as string[]).filter(Boolean).join(', ') || '—';
              else if (typeof v === 'string') text = v || '—';
              return (<p key={b.id}><b>{lb.label}</b><br />{text}</p>);
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
