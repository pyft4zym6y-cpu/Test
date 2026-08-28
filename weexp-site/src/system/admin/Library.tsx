import { useEffect, useMemo, useState } from 'react';
import { KB_BASE, KB_KINDS, kbMatches, kindLabel, type KbItem, type KbKind } from '@/data/kbLibrary';
import { loadKbTeam, saveKbItem, deleteKbItem, mergeKb, newKbId } from '@/lib/kb';
import { SYSTEMS } from '@/data/xray';
import type { SysKey } from '@/system/systems';
import { toast } from '@/lib/toast';
import { askConfirm } from './dialog';
import { Block, EmptyState, rel } from './shared';
import '../system.css';
import '../cabinet.css';

/**
 * Бібліотека агенції — наші методики, а не дані клієнта.
 *
 * Питання «звідки беруться матеріали і хто їх формує» виникало саме тому, що
 * такого розділу не існувало: «База знань» у картці клієнта збирається сама з
 * його даних і нічого не формує. Тут навпаки — пише команда.
 *
 * Два шари видно на екрані окремо: базовий (у коді, змінюється рев'ю) і
 * командний (таблиця `kb_library`). Якщо таблиці ще немає, це сказано текстом,
 * а базовий шар усе одно працює — інакше порожній екран читався б як «у нас
 * немає методик».
 */
export function Library({ canEdit, selfEmail }: { canEdit: boolean; selfEmail: string }) {
  const [team, setTeam] = useState<KbItem[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<KbKind | ''>('');
  const [sys, setSys] = useState<SysKey | ''>('');
  const [open, setOpen] = useState<string>('');
  const [edit, setEdit] = useState<KbItem | null>(null);
  const [busy, setBusy] = useState('');

  const load = () => {
    setLoading(true);
    void loadKbTeam().then((r) => { setTeam(r.team); setErr(r.error || ''); setLoading(false); });
  };
  useEffect(load, []);

  const all = useMemo(() => mergeKb(team), [team]);
  const list = useMemo(() => all
    .filter((i) => kbMatches(i, q))
    .filter((i) => !kind || i.kind === kind)
    .filter((i) => !sys || (i.sys || []).includes(sys))
    .sort((a, b) => (a.source === b.source ? a.title.localeCompare(b.title) : a.source === 'team' ? -1 : 1)),
  [all, q, kind, sys]);

  const save = async (item: KbItem) => {
    if (!item.title.trim()) { toast('Без назви матеріал не знайдеться пошуком', 'err'); return; }
    setBusy('save');
    const r = await saveKbItem(item, selfEmail);
    setBusy('');
    if (!r.ok) { toast(r.error || 'Не збережено', 'err'); return; }
    toast('✓ Збережено в бібліотеці');
    setEdit(null); load();
  };
  const del = async (item: KbItem) => {
    if (!(await askConfirm({ title: `Видалити «${item.title}»?`, text: 'Матеріал зникне у всієї команди.', confirmLabel: 'Видалити', tone: 'bad' }))) return;
    setBusy('del:' + item.id);
    const r = await deleteKbItem(item.id);
    setBusy('');
    if (!r.ok) { toast(r.error || 'Не видалено', 'err'); return; }
    toast('Матеріал видалено'); load();
  };

  return (
    <>
      <Block title="Бібліотека агенції">
        <p className="mono adm-hint">
          Наші методики, шаблони, чек-листи та інструкції — однакові для всіх клієнтів. Це не «База знань»
          у картці клієнта: та збирається сама з його даних і описує тільки його. Тут пише команда.
        </p>
        <div className="adm-lib-bar">
          <input className="ab-inp" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук по назві, опису й тексту…" aria-label="Пошук у бібліотеці" />
          <select className="ab-sel sm" value={kind} onChange={(e) => setKind(e.target.value as KbKind | '')} aria-label="Тип матеріалу">
            <option value="">усі типи</option>
            {KB_KINDS.map((k) => <option key={k.k} value={k.k}>{k.l}</option>)}
          </select>
          <select className="ab-sel sm" value={sys} onChange={(e) => setSys(e.target.value as SysKey | '')} aria-label="Система">
            <option value="">усі системи</option>
            {SYSTEMS.map((s) => <option key={s.key} value={s.key}>{s.num} · {s.title}</option>)}
          </select>
          {canEdit && <button className="mc-btn ok" onClick={() => setEdit({ id: newKbId(), title: '', kind: 'method', sys: [], summary: '', source: 'team' })}>+ Матеріал</button>}
        </div>
        {err && (
          <p className="msg-err mono adm-lib-err">
            {err}
            {/* Порожньо й «не налаштовано» на екрані виглядають однаково —
                тому причину пишемо текстом, а базовий шар лишається робочим. */}
          </p>
        )}
        <p className="mono adm-hint">
          Базових матеріалів: {KB_BASE.length} (у коді, змінюються рев'ю) · доданих командою: {loading ? '…' : team.length}
        </p>
      </Block>

      {edit && <KbEditor item={edit} busy={busy === 'save'} onChange={setEdit} onCancel={() => setEdit(null)} onSave={save} />}

      <Block title={`Матеріали · ${list.length}`}>
        {loading ? <p className="mc-msg mono">Завантаження…</p>
          : list.length === 0 ? <EmptyState icon="📚" text={q || kind || sys ? 'Під цей фільтр нічого немає.' : 'Бібліотека порожня.'} />
          : (
            <ul className="adm-lib">
              {list.map((i) => (
                <li key={i.id} className="adm-lib-i">
                  <button className="adm-lib-h" onClick={() => setOpen(open === i.id ? '' : i.id)} aria-expanded={open === i.id}>
                    <b>{i.title}</b>
                    <span className={`cab-badge mono tst-${i.source === 'team' ? 'ok' : 'none'}`}>{i.source === 'team' ? 'команда' : 'базовий'}</span>
                    <span className="mono adm-lib-kind">{kindLabel(i.kind)}</span>
                    {i.forClient && <span className="cab-badge mono tst-wait">можна клієнту</span>}
                    <span className="mono">{open === i.id ? '−' : '+'}</span>
                  </button>
                  <p className="adm-lib-sum">{i.summary}</p>
                  {open === i.id && (
                    <div className="adm-lib-body">
                      {(i.sys || []).length > 0 && (
                        <div className="adm-sym-tags">
                          {i.sys.map((s) => <span key={s} className="adm-sym">{SYSTEMS.find((x) => x.key === s)?.title || s}</span>)}
                        </div>
                      )}
                      {i.body && <pre className="adm-lib-text">{i.body}</pre>}
                      {i.url && <p><a className="adm-mail" href={i.url} target="_blank" rel="noopener">{i.url}</a></p>}
                      <p className="mono adm-hint">
                        {i.source === 'base'
                          ? 'Базовий матеріал: живе в src/data/kbLibrary.ts і змінюється через рев’ю коду.'
                          : `${i.by || 'команда'}${i.updatedAt ? ` · оновлено ${rel(i.updatedAt)}` : ''}`}
                      </p>
                      {canEdit && i.source === 'team' && (
                        <div className="cab-actions">
                          <button className="mc-btn" onClick={() => setEdit({ ...i })}>Редагувати</button>
                          <button className="mc-btn bad" disabled={busy === 'del:' + i.id} onClick={() => del(i)}>Видалити</button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
      </Block>
    </>
  );
}

function KbEditor({ item, busy, onChange, onCancel, onSave }: {
  item: KbItem; busy: boolean; onChange: (i: KbItem) => void; onCancel: () => void; onSave: (i: KbItem) => void;
}) {
  const upd = (p: Partial<KbItem>) => onChange({ ...item, ...p });
  const toggleSys = (k: SysKey) => upd({ sys: item.sys.includes(k) ? item.sys.filter((x) => x !== k) : [...item.sys, k] });
  return (
    <Block title={item.title ? `Редагування · ${item.title}` : 'Новий матеріал'}>
      <div className="adm-lib-ed">
        <label className="sysx-inp"><span className="sysx-inp-l">Назва</span>
          <input value={item.title} onChange={(e) => upd({ title: e.target.value })} placeholder="Напр.: Аудит кошика й оформлення" /></label>
        <label className="sysx-inp"><span className="sysx-inp-l">Тип</span>
          <select className="ab-sel" value={item.kind} onChange={(e) => upd({ kind: e.target.value as KbKind })}>
            {KB_KINDS.map((k) => <option key={k.k} value={k.k}>{k.l} — {k.note}</option>)}
          </select></label>
        <label className="sysx-inp"><span className="sysx-inp-l">Опис · одне-два речення, видно у списку</span>
          <textarea rows={2} value={item.summary} onChange={(e) => upd({ summary: e.target.value })} placeholder="Що це і коли брати" /></label>
        <fieldset className="cab-meet-set">
          <legend className="sysx-inp-l">До яких систем належить</legend>
          <div className="cab-meet-opts">
            {SYSTEMS.map((s) => (
              <button key={s.key} type="button" className={`sysx-cta cab-meet-o${item.sys.includes(s.key as SysKey) ? ' is-on' : ''}`}
                aria-pressed={item.sys.includes(s.key as SysKey)} onClick={() => toggleSys(s.key as SysKey)}>{s.title}</button>
            ))}
          </div>
        </fieldset>
        <label className="sysx-inp"><span className="sysx-inp-l">Текст</span>
          <textarea rows={8} value={item.body || ''} onChange={(e) => upd({ body: e.target.value })} placeholder={'Кроки, критерії, межі застосування.\nПункти починайте з «— ».'} /></label>
        <label className="sysx-inp"><span className="sysx-inp-l">Або посилання, якщо матеріал живе зовні</span>
          <input value={item.url || ''} onChange={(e) => upd({ url: e.target.value })} placeholder="https://…" /></label>
        <label className="adm-lib-chk">
          <input type="checkbox" checked={Boolean(item.forClient)} onChange={(e) => upd({ forClient: e.target.checked })} />
          <span>Можна віддавати клієнту <i className="mono">(за замовчуванням ні — це внутрішня кухня)</i></span>
        </label>
        <div className="cab-actions">
          <button className="mc-btn ok" disabled={busy} onClick={() => onSave(item)}>{busy ? 'Зберігаємо…' : 'Зберегти'}</button>
          <button className="mc-btn" onClick={onCancel}>Скасувати</button>
        </div>
      </div>
    </Block>
  );
}
