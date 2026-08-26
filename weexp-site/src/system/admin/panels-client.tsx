import { useEffect, useRef, useState } from 'react';

import {
  findAuditIdByCode,
  loadAuditAnswers,
  saveAssessmentFor,
  savePatchFor,
  mergeMapFor,
  authHeaders,
  uploadAdminFile,
  deleteAdminFile,
  aiScoreAudit,
  type SharedDoc,
  type ModuleScore,
  type DiagRecord,
  type ProjectNote,
  type AdminFile,
  type PackState
} from '@/lib/supa';

import { toast } from '@/lib/toast';

import { loadTemplate, uid } from '../auditTemplate';
import type { Block as TplBlock } from '../auditTemplate';   // тип блоку шаблону ≠ UI-компонент Block

import { PACK_ARTIFACTS, PACK_REPORTS, chaptersOf, TOTAL_CHAPTERS } from '@/data/auditPack';
import '../system.css';
import '../cabinet.css';
import { Block, SaveBadge, captureDoc, rel } from './shared';
import { buildSearchDigest, digestSummary, CTR_CURVE_NOTE, type GscRow, type SearchDigest } from './searchGaps';
import { useAutosave } from './useAutosave';
import { askConfirm } from './dialog';
import { genAccessMap, genDoD, genGantt, genHandover, genPlan90 } from './docs';

export function PackChecklist({ userId, email, rec }: { userId: string; email: string; rec: DiagRecord }) {
  const [saving, setSaving] = useState('');
  const [map, setMap] = useState<Record<string, PackState>>(rec.packChecklist || {});
  const [modMap, setModMap] = useState<Record<string, string>>({});
  useEffect(() => { let on = true; loadTemplate().then((tp) => { if (on && tp) setModMap(Object.fromEntries(tp.blocks.map((b) => [b.key, b.title]))); }).catch(() => {}); return () => { on = false; }; }, []);
  const modTitle = (k: string) => modMap[k] || k;
  const cycle = (id: string) => {
    const cur = map[id]?.st;
    const next: PackState['st'] = cur === undefined ? 'ready' : cur === 'ready' ? 'delivered' : undefined;
    const nm = { ...map, [id]: { st: next, at: new Date().toISOString() } };
    if (next === undefined) delete nm[id];
    const prev = map;
    setMap(nm);
    void savePatchFor(userId, { packChecklist: nm }).then((r) => {
      // Відкат: без нього галочка «передано» лишалась на екрані навіть тоді,
      // коли запис не пройшов, і пакет вважався зданим помилково.
      if (!r.ok) { setMap(prev); toast('Не збережено: ' + (r.error || ''), 'err'); }
    });
  };
  const GEN: Record<string, (() => void) | undefined> = {
    a02: () => genAccessMap(rec, email),
    a15: () => genGantt(rec, email),
    a16: () => genPlan90(rec, email, modTitle),
    a17: () => genDoD(rec, email, modTitle),
    a19: () => genHandover(rec, email, map),
  };
  /**
   * Згенерувати документ і одразу покласти у файли клієнта. Досі генератори
   * вміли лише відкрити вікно на друк: щоб документ дійшов до клієнта, його
   * друкували в PDF і вантажили назад руками.
   */
  const generateToFiles = async (id: string, title: string) => {
    const gen = GEN[id]; if (!gen) return;
    setSaving(id);
    const out = await captureDoc(gen);
    if (!out) { setSaving(''); toast('Документ не сформувався', 'err'); return; }
    const file = new File([out.html], `${title.replace(/[^\wа-яїєґі\s.-]+/gi, '').trim().slice(0, 60) || id}.html`, { type: 'text/html' });
    const up = await uploadAdminFile(userId, file);
    if (!up.ok || !up.path) { setSaving(''); toast('Не завантажено: ' + (up.error || ''), 'err'); return; }
    const added: AdminFile = { path: up.path, name: file.name, kind: 'deliverable', at: new Date().toISOString(), by: email };
    const r = await savePatchFor(userId, { adminFiles: [added, ...(rec.adminFiles || [])] });
    setSaving('');
    if (!r.ok) { toast('Файл завантажено, але картку не оновлено: ' + (r.error || ''), 'err'); return; }
    toast('✓ У файлах клієнта — віддати можна у вкладці «Документи»');
  };

  const done = PACK_ARTIFACTS.filter((a) => map[a.id]?.st).length;
  const delivered = PACK_ARTIFACTS.filter((a) => map[a.id]?.st === 'delivered').length;
  let n = 0;
  return (
    <div className="adm-pack">
      <div className="adm-pack-sum mono"><span>Готово/передано: <b>{done}/{TOTAL_CHAPTERS}</b> · передано: <b>{delivered}</b> · 5 звітів</span>
        <span className="adm-acc-hint">Клік по статусу: — → готово → передано. «Рушій» — файл з pack.zip воркера.</span></div>
      {PACK_REPORTS.map((rp, ri) => (
        <div key={rp.id} className="adm-pack-ph">
          <span className="adm-acc-cat-h mono">Звіт {ri + 1} · {rp.uk}</span>
          {chaptersOf(rp.id).map((a) => {
            n += 1;
            const st = map[a.id]?.st;
            return (
              <div key={a.id} className="adm-pack-row">
                <span className="adm-pack-num mono">{String(n).padStart(2, '0')}</span>
                <span className="adm-pack-t"><b>{a.uk}</b>{a.source === 'worker' && <i className="adm-pack-src mono"> · рушій</i>}{a.source === 'portal' && <i className="adm-pack-src mono"> · кабінет</i>}</span>
                {GEN[a.id] && <>
                  <button className="mc-btn ghost" onClick={GEN[a.id]} title="Відкрити на друк / зберегти в PDF">📄 Друк</button>
                  <button className="mc-btn ok" disabled={saving === a.id} onClick={() => generateToFiles(a.id, a.uk)} title="Згенерувати й покласти у файли клієнта">
                    {saving === a.id ? '…' : '→ У файли'}
                  </button>
                </>}
                <button className={`adm-pack-st mono st-${st || 'none'}`} onClick={() => cycle(a.id)}>
                  {st === 'delivered' ? '↗ передано' : st === 'ready' ? '✓ готово' : '— в роботі'}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Власні файли аудитора у картці клієнта (свої дані, дельіверабли).
 *  «Поділитися» — ЄДИНИЙ шлях, яким документ потрапляє клієнту в кабінет
 *  (розділ «Документи»): нічого не публікується автоматично. */

export function AdminFiles({ userId, initial, sharedInitial, author, openFile, onSaved }: { userId: string; initial: AdminFile[]; sharedInitial: SharedDoc[]; author: string; openFile: (p: string) => void; onSaved?: () => void }) {
  const [list, setList] = useState<AdminFile[]>(initial || []);
  const [shared, setShared] = useState<SharedDoc[]>(sharedInitial || []);
  const [kind, setKind] = useState<AdminFile['kind']>('data');
  const [busy, setBusy] = useState('');
  const persist = async (next: AdminFile[]) => {
    const prev = list;
    setList(next);
    const r = await savePatchFor(userId, { adminFiles: next });
    if (!r.ok) { setList(prev); toast('Список файлів не збережено: ' + (r.error || ''), 'err'); } else onSaved?.();
  };
  const isShared = (p: string) => shared.some((d) => d.path === p);
  const toggleShare = (f: AdminFile) => {
    const next = isShared(f.path)
      ? shared.filter((d) => d.path !== f.path)
      : [...shared, { id: f.path, title: f.name, path: f.path, at: new Date().toISOString(), by: author }];
    const prev = shared; const wasShared = isShared(f.path);
    setShared(next);
    void savePatchFor(userId, { sharedDocs: next }).then((r) => {
      if (!r.ok) { setShared(prev); toast('Не збережено: ' + (r.error || ''), 'err'); return; }
      toast(wasShared ? 'Прибрано з кабінету клієнта' : '✓ Поділилися: клієнт бачить документ у розділі «Документи»');
    });
  };
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); e.target.value = '';
    if (!files.length) return;
    setBusy('up');
    const added: AdminFile[] = [];
    for (const f of files) {
      const r = await uploadAdminFile(userId, f);
      if (r.ok && r.path) added.push({ path: r.path, name: f.name, kind, at: new Date().toISOString(), by: author });
      else toast('Не вдалося: ' + f.name + ' · ' + (r.error || ''), 'err');
    }
    setBusy('');
    if (added.length) { persist([...added, ...list]); toast(`✓ Додано файлів: ${added.length}`); }
  };
  const del = async (f: AdminFile) => {
    if (!(await askConfirm({ title: `Видалити «${f.name}»?`, text: 'Файл зникне зі сховища назавжди.', confirmLabel: 'Видалити', tone: 'bad' }))) return;
    setBusy(f.path);
    const r = await deleteAdminFile(f.path);
    setBusy('');
    if (!r.ok) { toast('Файл не видалено зі сховища: ' + (r.error || ''), 'err'); return; }
    await persist(list.filter((x) => x.path !== f.path));
  };
  return (
    <div className="adm-afiles">
      <div className="adm-afiles-add">
        <select className="ab-sel sm" value={kind} onChange={(e) => setKind(e.target.value as AdminFile['kind'])}>
          <option value="data">Дані клієнта</option><option value="deliverable">Документ (дельіверабл)</option><option value="other">Інше</option>
        </select>
        <label className={'mc-btn ok' + (busy === 'up' ? ' is-off' : '')}>{busy === 'up' ? 'Завантаження…' : '+ Завантажити файл'}
          <input type="file" multiple style={{ display: 'none' }} disabled={busy === 'up'} onChange={onPick} />
        </label>
      </div>
      {list.length === 0 ? <p className="mono adm-empty">своїх файлів ще немає</p> : (
        <ul className="adm-files">{list.map((f) => (
          <li key={f.path} className="adm-afile">
            <button className="mono adm-file" onClick={() => openFile(f.path)}>📎 {f.name}</button>
            <span className="mono adm-afile-m">{f.kind === 'deliverable' ? 'документ' : f.kind === 'data' ? 'дані' : 'інше'} · {rel(f.at)}</span>
            <button className={'mc-btn ' + (isShared(f.path) ? 'fr-on-ok' : 'ghost')} onClick={() => toggleShare(f)} title="Показати/приховати документ у кабінеті клієнта">
              {isShared(f.path) ? '✓ У клієнта' : '↗ Поділитися'}
            </button>
            <button className="adm-note-x mono" disabled={busy === f.path} onClick={() => del(f)} title="Видалити">✕</button>
          </li>
        ))}</ul>
      )}
    </div>
  );
}

/** Внутрішні нотатки й коментарі аудитора до проєкту (командна робота). */

export function NotesPanel({ userId, initial, author }: { userId: string; initial: ProjectNote[]; author: string }) {
  const [list, setList] = useState<ProjectNote[]>(initial || []);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const persist = async (next: ProjectNote[]) => { setBusy(true); await savePatchFor(userId, { notes: next }); setBusy(false); };
  const add = () => { if (!text.trim()) return; const next = [{ id: uid('n'), at: new Date().toISOString(), author, text: text.trim() }, ...list]; setList(next); setText(''); void persist(next); };
  const del = (id: string) => { const next = list.filter((n) => n.id !== id); setList(next); void persist(next); };
  return (
    <div className="adm-notes">
      <div className="adm-notes-add">
        <textarea className="ab-inp" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Внутрішня нотатка / коментар (бачить лише команда)…" />
        <button className="mc-btn ok" disabled={busy || !text.trim()} onClick={add}>Додати</button>
      </div>
      {list.length === 0 ? <p className="mono adm-empty">нотаток ще немає</p> : (
        <ul className="adm-notes-list">{list.map((n) => (
          <li key={n.id} className="adm-note">
            <div className="adm-note-h mono"><b>{n.author || 'команда'}</b> · {rel(n.at)}{n.module ? ` · ${n.module}` : ''}</div>
            <p className="adm-note-t">{n.text}</p>
            <button className="adm-note-x mono" onClick={() => del(n.id)} title="Видалити">✕</button>
          </li>
        ))}</ul>
      )}
    </div>
  );
}

/** Адмінський шар: C-level оцінка кожного модуля аудиту клієнта. Автозбереження. */

export function ModuleScoring({ userId, initial, code, rec, onSaved }: { userId: string; initial: Record<string, ModuleScore>; code?: string; rec: DiagRecord; onSaved?: () => void }) {
  const [mods, setMods] = useState<TplBlock[] | null>(null);
  const [map, setMap] = useState<Record<string, ModuleScore>>(initial || {});
  const [open, setOpen] = useState<string | null>(null);
  const [ai, setAi] = useState(false);
  // Те саме, що з каталогом доступів: зливаємо по модулях, а не кладемо
  // всю оцінку цілком поверх чужої роботи.
  const touched = useRef<Set<string>>(new Set());
  const auto = useAutosave<Record<string, ModuleScore>>((v) => {
    const changed = Object.fromEntries([...touched.current].map((k) => [k, v[k]]).filter(([, x]) => x));
    return mergeMapFor(userId, 'assessment', changed as Record<string, ModuleScore>).then((r) => { if (r.ok) onSaved?.(); return r; });
  }, 1200);
  useEffect(() => { loadTemplate().then((t) => setMods(t.blocks)); }, []);
  /** Єдина точка зміни оцінок — щоб автозбереження не залежало від ефекту на [map]. */
  const apply = (next: Record<string, ModuleScore>, keys?: string[]) => { (keys || Object.keys(next)).forEach((k) => touched.current.add(k)); setMap(next); auto.touch(next); };

  const aiDraft = async () => {
    if (!mods) return;
    setAi(true);
    try {
      const id = code ? await findAuditIdByCode(code) : null;
      const answers = id ? await loadAuditAnswers(id) : {};
      const r = await aiScoreAudit({ modules: mods.map((b) => ({ key: b.key, title: b.title })), answers, company: rec.company, express: rec.express });
      if (r.error || !r.scores) { toast('AI: ' + (r.error || 'порожньо'), 'err'); setAi(false); return; }
      // Заповнюємо ЛИШЕ порожні поля — правки аудитора не перетираємо.
      const next = { ...map };
      for (const [k, sc] of Object.entries(r.scores!)) {
        const cur = next[k] || {};
        next[k] = {
          score: cur.score ?? sc.score, state: cur.state || sc.state, gap: cur.gap || sc.gap,
          rec: cur.rec || sc.rec, impact: cur.impact || sc.impact, priority: cur.priority || sc.priority,
          evidence: cur.evidence, owner: cur.owner, expected: cur.expected,
        };
      }
      apply(next);
      toast('✓ AI-чернетку оцінки складено — перевірте й доопрацюйте');
    } catch (e) { toast('AI-помилка: ' + String(e), 'err'); }
    setAi(false);
  };

  if (!mods) return <p className="mono adm-empty">Завантаження модулів…</p>;
  const set = (k: string, patch: Partial<ModuleScore>) => apply({ ...map, [k]: { ...map[k], ...patch } }, [k]);
  const scored = mods.filter((b) => (map[b.key]?.score ?? null) !== null && map[b.key]?.score !== undefined);
  const avg = scored.length ? Math.round(scored.reduce((n, b) => n + (map[b.key]!.score || 0), 0) / scored.length) : null;
  const p1 = mods.filter((b) => map[b.key]?.priority === 'P1').length;


  return (
    <div className="adm-score">
      <div className="adm-score-sum mono">
        <span>Загальна зрілість: <b>{avg != null ? `${avg}/100` : '—'}</b></span>
        <span>Оцінено: <b>{scored.length}/{mods.length}</b></span>
        <span>P1: <b>{p1}</b></span>
        <SaveBadge state={auto.state} error={auto.error} savedAt={auto.savedAt} onRetry={auto.flush} />
        <button className="mc-btn ai" disabled={ai} onClick={aiDraft} title="AI-чернетка оцінки з даних клієнта (заповнює лише порожні поля)" style={{ marginLeft: 'auto' }}>{ai ? '🪄 Думаю…' : '🪄 AI-чернетка'}</button>
      </div>
      {mods.map((b) => {
        const s = map[b.key] || {};
        const isOpen = open === b.key;
        return (
          <div key={b.key} className="adm-score-mod">
            <button className="adm-score-head" onClick={() => setOpen(isOpen ? null : b.key)}>
              {b.cat && <span className="ab-cat mono">{b.cat}</span>}
              <b>{b.title}</b>
              <span className="adm-score-badges mono">
                {s.score != null && <span className={`cab-badge tst-${s.score >= 65 ? 'ok' : s.score >= 40 ? 'wait' : 'bad'}`}>{s.score}</span>}
                {s.priority && <span className={`cab-badge tst-${s.priority === 'P1' ? 'bad' : s.priority === 'P2' ? 'wait' : 'none'}`}>{s.priority}</span>}
              </span>
              <i aria-hidden="true">{isOpen ? '−' : '+'}</i>
            </button>
            {isOpen && (
              <div className="adm-score-body">
                <div className="adm-score-row3">
                  <label className="pj-ed-f sm"><i>Score 0–100</i><input className="ab-inp" type="number" min={0} max={100} value={s.score ?? ''} onChange={(e) => set(b.key, { score: e.target.value === '' ? undefined : Math.max(0, Math.min(100, Number(e.target.value))) })} /></label>
                  <label className="pj-ed-f sm"><i>Impact</i><select className="ab-sel" value={s.impact || ''} onChange={(e) => set(b.key, { impact: (e.target.value || undefined) as ModuleScore['impact'] })}><option value="">—</option><option value="low">Низький</option><option value="med">Середній</option><option value="high">Високий</option></select></label>
                  <label className="pj-ed-f sm"><i>Priority</i><select className="ab-sel" value={s.priority || ''} onChange={(e) => set(b.key, { priority: (e.target.value || undefined) as ModuleScore['priority'] })}><option value="">—</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option></select></label>
                  <label className="pj-ed-f sm"><i>Owner</i><input className="ab-inp" value={s.owner || ''} onChange={(e) => set(b.key, { owner: e.target.value })} placeholder="хто" /></label>
                </div>
                <label className="pj-ed-f"><i>Current state</i><textarea className="ab-inp" rows={2} value={s.state || ''} onChange={(e) => set(b.key, { state: e.target.value })} /></label>
                <label className="pj-ed-f"><i>Evidence (джерело даних)</i><input className="ab-inp" value={s.evidence || ''} onChange={(e) => set(b.key, { evidence: e.target.value })} placeholder="напр.: GA4 + вивантаження CRM" /></label>
                <label className="pj-ed-f"><i>Gap (розрив)</i><textarea className="ab-inp" rows={2} value={s.gap || ''} onChange={(e) => set(b.key, { gap: e.target.value })} /></label>
                <label className="pj-ed-f"><i>Рекомендація</i><textarea className="ab-inp" rows={2} value={s.rec || ''} onChange={(e) => set(b.key, { rec: e.target.value })} /></label>
                <label className="pj-ed-f"><i>Очікуваний ефект</i><input className="ab-inp" value={s.expected || ''} onChange={(e) => set(b.key, { expected: e.target.value })} placeholder="напр.: +retention / +LTV" /></label>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function GaPreview({ userId, siteUrl }: { userId: string; siteUrl?: string }) {
  type GaStatus = { connected?: boolean; email?: string; properties?: { id: string; name: string; account: string }[]; sites?: { url: string; level: string }[]; at?: string; error?: string };
  type GaPull = { period?: string; sessions?: number; users?: number; transactions?: number; revenue?: number; cr?: number; aov?: number;
    channels?: { name: string; sessions: number; revenue: number }[]; devices?: { name: string; sessions: number; cr: number }[]; error?: string };
  type GscPull = { period?: string; clicks?: number; impressions?: number; ctr?: number; position?: number;
    queries?: { q: string; clicks: number; impressions: number; position: number }[];
    range?: { start: string; end: string }; prevRange?: { start: string; end: string };
    rows?: GscRow[]; prevRows?: GscRow[]; truncated?: boolean; error?: string };
  type PsiPull = { score?: number; strategy?: string; lab?: { lcpMs: number; cls: number; tbtMs: number; fcpMs: number; siMs: number };
    field?: { lcp?: { v: number; cat: string } | null; inp?: { v: number; cat: string } | null; cls?: { v: number; cat: string } | null }; fieldOverall?: string | null; error?: string };
  const [st, setSt] = useState<GaStatus | null>(null);
  const [prop, setProp] = useState('');
  const [data, setData] = useState<GaPull | null>(null);
  const [site, setSite] = useState('');
  const [gsc, setGsc] = useState<GscPull | null>(null);
  const [digest, setDigest] = useState<SearchDigest | null>(null);
  const [saved, setSaved] = useState('');
  const [psiUrl, setPsiUrl] = useState(siteUrl ? (siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`) : '');
  const [psi, setPsi] = useState<PsiPull | null>(null);
  const [busy, setBusy] = useState<'status' | 'pull' | 'gsc' | 'psi' | 'save' | ''>('');
  const check = async () => {
    setBusy('status'); setData(null);
    try {
      const j: GaStatus = await (await fetch(`/api/ga4?action=status&u=${encodeURIComponent(userId)}`, { headers: await authHeaders() })).json();
      setSt(j);
      if (j.connected && (j.properties || []).length && !prop) setProp(String((j.properties || [])[0].id));
      if (j.connected && (j.sites || []).length && !site) setSite((j.sites || [])[0].url);
    } catch { setSt({ connected: false, error: 'network' }); }
    setBusy('');
  };
  const pull = async () => {
    if (!prop) return;
    setBusy('pull');
    try { setData(await (await fetch(`/api/ga4?action=pull&u=${encodeURIComponent(userId)}&property=${prop}`, { headers: await authHeaders() })).json()); }
    catch { setData({ error: 'network' }); }
    setBusy('');
  };
  const pullGsc = async () => {
    if (!site) return;
    setBusy('gsc'); setSaved('');
    try {
      const j: GscPull = await (await fetch(`/api/ga4?action=pull_gsc&u=${encodeURIComponent(userId)}&site=${encodeURIComponent(site)}`, { headers: await authHeaders() })).json();
      setGsc(j);
      // Зріз рахуємо тут і зберігаємо ОКРЕМО від сирих рядків: у базу знань
      // їде розбір (десятки позицій), а не п'ять тисяч пар — інакше запис
      // клієнта роздувається на кожному оновленні.
      setDigest(!j.error && j.rows?.length
        ? buildSearchDigest({
            site, rows: j.rows, prevRows: j.prevRows, truncated: j.truncated,
            period: j.range || { start: '', end: '' }, prevPeriod: j.prevRange,
          })
        : null);
    } catch { setGsc({ error: 'network' }); setDigest(null); }
    setBusy('');
  };
  /** Зріз у базу знань клієнта — звідти його забирає пакет знань для рушія. */
  const saveDigest = async () => {
    if (!digest) return;
    setBusy('save');
    const r = await savePatchFor(userId, { searchData: digest });
    setSaved(r.ok ? 'Збережено в базу знань' : `Не збережено: ${r.error || 'помилка'}`);
    if (r.ok) toast('Дані Search Console у базі знань — рушій побачить їх у наступному прогоні');
    setBusy('');
  };
  const pullPsi = async (strategy: 'mobile' | 'desktop') => {
    if (!psiUrl) return;
    setBusy('psi');
    try { setPsi(await (await fetch(`/api/ga4?action=psi&url=${encodeURIComponent(psiUrl)}&strategy=${strategy}`, { headers: await authHeaders() })).json()); }
    catch { setPsi({ error: 'network' }); }
    setBusy('');
  };
  const eurF = (n?: number) => `€${Math.round(n || 0).toLocaleString('uk-UA')}`;
  const sec = (ms?: number) => `${Math.round((ms || 0) / 100) / 10}s`;
  const catC = (c?: string) => (c === 'FAST' ? '#1F6E4E' : c === 'AVERAGE' ? '#C58A00' : c ? 'var(--red)' : 'var(--graphite)');
  return (
    <div className="adm-ga">
      <div className="adm-ga-bar">
        <button className="mc-btn sm" onClick={check} disabled={busy === 'status'}>{busy === 'status' ? 'Перевіряємо…' : '🔍 Перевірити підключення'}</button>
        {st && (st.connected
          ? <span className="mono adm-ga-ok">✓ підключено · {st.email || '—'}{st.at ? ` · ${new Date(st.at).toLocaleDateString('uk-UA')}` : ''}</span>
          : <span className="mono adm-ga-no">{st.error === 'not_configured' ? '⚙ конектор не налаштовано на сервері (env)' : '— не підключено (клієнт ще не пройшов OAuth у кабінеті)'}</span>)}
      </div>
      {st?.connected && (
        <div className="adm-ga-bar">
          <select className="ab-sel" value={prop} onChange={(e) => setProp(e.target.value)}>
            {(st.properties || []).length === 0 && <option value="">властивостей не знайдено</option>}
            {(st.properties || []).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.account} · {p.id}</option>)}
          </select>
          <button className="sysx-cta is-primary" onClick={pull} disabled={!prop || busy === 'pull'}>{busy === 'pull' ? 'Тягнемо дані…' : 'Превʼю даних (30 дн) →'}</button>
        </div>
      )}
      {st?.connected && (st.sites || []).length > 0 && (
        <div className="adm-ga-bar">
          <select className="ab-sel" value={site} onChange={(e) => setSite(e.target.value)}>
            {(st.sites || []).map((s2) => <option key={s2.url} value={s2.url}>GSC · {s2.url} ({s2.level})</option>)}
          </select>
          <button className="sysx-cta" onClick={pullGsc} disabled={!site || busy === 'gsc'}>{busy === 'gsc' ? 'Тягнемо…' : 'Превʼю Search Console (28 дн) →'}</button>
        </div>
      )}
      {gsc && (gsc.error
        ? <p className="mono adm-ga-no">GSC: {gsc.error}</p>
        : (
          <div className="adm-ga-data">
            <div className="adm-ga-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div><b>{(gsc.clicks || 0).toLocaleString('uk-UA')}</b><span>кліків</span></div>
              <div><b>{(gsc.impressions || 0).toLocaleString('uk-UA')}</b><span>показів</span></div>
              <div><b>{gsc.ctr ?? 0}%</b><span>CTR</span></div>
              <div><b>{gsc.position ?? 0}</b><span>сер. позиція</span></div>
            </div>
            {(gsc.queries || []).length > 0 && (
              <div className="adm-ga-tbl">
                <span className="mono adm-ga-h">Топ-10 запитів · кліки / покази / позиція</span>
                {(gsc.queries || []).map((q2) => (
                  <div key={q2.q} className="adm-ga-row adm-ga-row4"><span>{q2.q}</span><b className="mono">{q2.clicks}</b><i className="mono">{q2.impressions.toLocaleString('uk-UA')}</i><i className="mono">{q2.position}</i></div>
                ))}
              </div>
            )}
            {digest && (
              <div className="adm-ga-gaps">
                <div className="adm-ga-bar">
                  <span className="mono adm-ga-h">Розбір: {digestSummary(digest)}</span>
                  <button className="sysx-cta is-primary" onClick={saveDigest} disabled={busy === 'save'}>
                    {busy === 'save' ? 'Зберігаємо…' : '↓ У базу знань (рушій побачить)'}
                  </button>
                  {saved && <span className="mono adm-ga-ok">{saved}</span>}
                </div>
                {digest.counts.truncated && (
                  <p className="mono adm-ga-no">Вибірка обрізана на 5000 парах «сторінка × запит» — зріз читати як «по верхніх запитах», не «по сайту».</p>
                )}
                {digest.striking.length > 0 && (
                  <div className="adm-ga-tbl">
                    <span className="mono adm-ga-h">Позиції 4–20 · запит / позиція / покази / оцінка приросту кліків</span>
                    {digest.striking.slice(0, 10).map((x) => (
                      <div key={`${x.query}|${x.page}`} className="adm-ga-row adm-ga-row4">
                        <span title={x.page}>{x.query}</span>
                        <b className="mono">{x.position}</b>
                        <i className="mono">{x.impressions.toLocaleString('uk-UA')}</i>
                        <i className="mono">+{x.upliftEst}</i>
                      </div>
                    ))}
                    <span className="mono adm-ga-h">Приріст — {CTR_CURVE_NOTE}. У звіт іде як оцінка, не як замір.</span>
                  </div>
                )}
                {digest.cannibal.length > 0 && (
                  <div className="adm-ga-tbl">
                    <span className="mono adm-ga-h">Канібалізація · запит / скільки сторінок бʼються</span>
                    {digest.cannibal.slice(0, 8).map((c) => (
                      <div key={c.query} className="adm-ga-row adm-ga-row4">
                        <span title={c.pages.map((p2) => p2.page).join('\n')}>{c.query}</span>
                        <b className="mono">{c.pages.length}</b>
                        <i className="mono">{c.impressions.toLocaleString('uk-UA')}</i>
                        <i className="mono">поз. {c.pages[0].position}</i>
                      </div>
                    ))}
                  </div>
                )}
                {digest.ctrGap.length > 0 && (
                  <div className="adm-ga-tbl">
                    <span className="mono adm-ga-h">Бачать, не клікають · запит / позиція / CTR факт vs очікуваний</span>
                    {digest.ctrGap.slice(0, 8).map((g) => (
                      <div key={`${g.query}|${g.page}`} className="adm-ga-row adm-ga-row4">
                        <span title={g.page}>{g.query}</span>
                        <b className="mono">{g.position}</b>
                        <i className="mono">{g.ctr}%</i>
                        <i className="mono">~{g.expectedCtr}%</i>
                      </div>
                    ))}
                  </div>
                )}
                {digest.decay.length > 0 && (
                  <div className="adm-ga-tbl">
                    <span className="mono adm-ga-h">Згасають · сторінка / було → стало кліків / падіння</span>
                    {digest.decay.slice(0, 8).map((d2) => (
                      <div key={d2.page} className="adm-ga-row adm-ga-row4">
                        <span title={d2.page}>{d2.page.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
                        <b className="mono">{d2.clicksPrev}</b>
                        <i className="mono">→ {d2.clicksNow}</i>
                        <i className="mono">−{d2.dropPct}%</i>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      {data && (data.error
        ? <p className="mono adm-ga-no">Помилка: {data.error}</p>
        : (
          <div className="adm-ga-data">
            <div className="adm-ga-kpis">
              <div><b>{(data.sessions || 0).toLocaleString('uk-UA')}</b><span>сесій</span></div>
              <div><b>{(data.users || 0).toLocaleString('uk-UA')}</b><span>користувачів</span></div>
              <div><b>{(data.transactions || 0).toLocaleString('uk-UA')}</b><span>замовлень</span></div>
              <div><b>{eurF(data.revenue)}</b><span>виручка</span></div>
              <div><b>{data.cr ?? 0}%</b><span>CR</span></div>
              <div><b>{eurF(data.aov)}</b><span>чек</span></div>
            </div>
            {(data.channels || []).length > 0 && (
              <div className="adm-ga-tbl">
                <span className="mono adm-ga-h">Канали · сесії / виручка</span>
                {(data.channels || []).map((c) => (
                  <div key={c.name} className="adm-ga-row"><span>{c.name}</span><b className="mono">{c.sessions.toLocaleString('uk-UA')}</b><i className="mono">{eurF(c.revenue)}</i></div>
                ))}
              </div>
            )}
            {(data.devices || []).length > 0 && (
              <div className="adm-ga-tbl">
                <span className="mono adm-ga-h">Пристрої · сесії / CR</span>
                {(data.devices || []).map((d) => (
                  <div key={d.name} className="adm-ga-row"><span>{d.name}</span><b className="mono">{d.sessions.toLocaleString('uk-UA')}</b><i className="mono">{d.cr}%</i></div>
                ))}
              </div>
            )}
            <p className="mono adm-ga-note">Період: {data.period} · read-only, живі дані з GA4 клієнта — для звірки анкети й baseline аудиту.</p>
          </div>
        ))}
      <div className="adm-ga-bar" style={{ borderTop: '1px dashed var(--silver)', paddingTop: 10 }}>
        <input className="mc-search" style={{ minWidth: 240 }} value={psiUrl} onChange={(e) => setPsiUrl(e.target.value)} placeholder="https://сайт-клієнта.com" />
        <button className="mc-btn sm" onClick={() => void pullPsi('mobile')} disabled={!psiUrl || busy === 'psi'}>{busy === 'psi' ? 'Вимірюємо…' : '⚡ PageSpeed · mobile'}</button>
        <button className="mc-btn sm" onClick={() => void pullPsi('desktop')} disabled={!psiUrl || busy === 'psi'}>desktop</button>
        <span className="mono adm-ga-no">PSI — без OAuth, працює одразу по URL</span>
      </div>
      {psi && (psi.error
        ? <p className="mono adm-ga-no">PSI: {psi.error}</p>
        : (
          <div className="adm-ga-data">
            <div className="adm-ga-kpis" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              <div><b style={{ color: (psi.score || 0) >= 90 ? '#1F6E4E' : (psi.score || 0) >= 50 ? '#C58A00' : 'var(--red)' }}>{psi.score}</b><span>Performance · {psi.strategy}</span></div>
              <div><b style={{ color: catC(psi.field?.lcp?.cat) }}>{psi.field?.lcp ? sec(psi.field.lcp.v) : sec(psi.lab?.lcpMs)}</b><span>LCP {psi.field?.lcp ? '(поле)' : '(лаб)'}</span></div>
              <div><b style={{ color: catC(psi.field?.inp?.cat) }}>{psi.field?.inp ? `${psi.field.inp.v}ms` : '—'}</b><span>INP (поле)</span></div>
              <div><b style={{ color: catC(psi.field?.cls?.cat) }}>{psi.field?.cls ? Math.round(psi.field.cls.v) / 100 : psi.lab?.cls}</b><span>CLS</span></div>
              <div><b>{sec(psi.lab?.fcpMs)}</b><span>FCP (лаб)</span></div>
              <div><b>{psi.lab?.tbtMs}ms</b><span>TBT (лаб)</span></div>
            </div>
            <p className="mono adm-ga-note">Польові дані (CrUX, 28 дн) — реальні користувачі; лабораторні — симуляція. {psi.fieldOverall ? `Загальна польова оцінка: ${psi.fieldOverall}.` : 'Польових даних мало (низький трафік) — дивимось лабораторні.'}</p>
          </div>
        ))}
      {!st && <p className="mono adm-empty">Натисніть «Перевірити підключення», щоб побачити стан конектора і превʼю даних.</p>}
    </div>
  );
}
