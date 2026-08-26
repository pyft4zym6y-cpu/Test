import { useEffect, useMemo, useState } from 'react';
import { findAuditIdByCode, loadAuditAnswers, savePatchFor, type AdminRow, type AuditAnswer, type KbVersion } from '@/lib/supa';
import { toast } from '@/lib/toast';
import { loadTemplate, type AuditTemplate } from '../auditTemplate';
import { ACCESS_CATALOG } from '@/data/accessCatalog';
import { Block, rel } from './shared';

/**
 * Єдина база знань про клієнта — головна причина, чому аудит є ЕТАПОМ проєкту, а
 * не окремою послугою: усе, що клієнт віддав на вході, має накопичуватись в
 * одному місці й жити далі, через впровадження і супровід. Тут не «результати
 * аудиту», а ВСЕ відоме про клієнта: хто дав, коли, звідки.
 *
 * Нічого не вводиться руками — сторінка збирає те, що вже лежить у записі.
 */
type Src = 'клієнт' | 'менеджер' | 'рушій';
type Item = { at?: string; title: string; detail?: string; src: Src };
type Group = { key: string; title: string; note: string; items: Item[]; expected?: number };

const SRC_CLS: Record<Src, string> = { 'клієнт': 'ok', 'менеджер': 'wait', 'рушій': 'none' };

export function KnowledgeBase({ row, code, author }: { row: AdminRow; code?: string; author?: string }) {
  const rec = row.record || {};
  const [tpl, setTpl] = useState<AuditTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, AuditAnswer>>({});
  const [open, setOpen] = useState<string>('');
  const [versions, setVersions] = useState<KbVersion[]>(rec.kbVersions || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const t = await loadTemplate();
      const id = code ? await findAuditIdByCode(code) : null;
      const a = id ? await loadAuditAnswers(id) : {};
      if (alive) { setTpl(t); setAnswers(a); }
    })();
    return () => { alive = false; };
  }, [code]);

  const groups: Group[] = useMemo(() => {
    const c = rec.company;
    const profile: Item[] = c ? Object.entries({
      'Назва': c.name, 'Сфера': c.industry, 'Модель': c.model, 'Ніша': c.niche,
      'Ринки': c.markets, 'Оборот': c.sizeRange || c.revenue, 'Команда': c.teamSize,
      'Сайт': c.site, 'Платформа': c.platform, 'CRM / ERP': c.crmErp,
    }).filter(([, v]) => v).map(([k, v]) => ({ title: k, detail: String(v), src: 'клієнт' as Src })) : [];

    // Відповіді анкети — згруповані блоками, з авторами.
    const byBlock: Item[] = (tpl?.blocks || []).map((b) => {
      const qs = b.questions;
      const done = qs.filter((q) => { const a = answers[q.key]; return a && a.value != null && a.value !== ''; });
      const authors = [...new Set(done.map((q) => answers[q.key]?.by).filter(Boolean))] as string[];
      const last = done.map((q) => answers[q.key]?.at).filter(Boolean).sort().pop();
      return { title: b.title, detail: `${done.length}/${qs.length}${authors.length ? ` · ${authors.join(', ')}` : ''}`, at: last, src: 'клієнт' as Src };
    }).filter((x) => !x.detail?.startsWith('0/'));

    const acc: Item[] = Object.entries(rec.accessLog || {}).map(([id, a]) => {
      const cat = ACCESS_CATALOG.find((x) => x.id === id);
      return { title: cat ? `${cat.category} · ${cat.system}` : id, detail: `${a.status || '—'}${a.method ? ` · ${a.method}` : ''}${a.note ? ` · ${a.note}` : ''}`, at: a.at, src: 'клієнт' as Src };
    });

    const mkt: Item[] = (rec.marketplaces || []).map((m) => ({ title: m.name, detail: `${m.status || '—'}${m.scope ? ` · ${m.scope}` : ''}`, at: m.at, src: 'клієнт' }));
    const files: Item[] = (rec.clientFiles || []).map((f) => ({ title: f.title || f.type || 'файл', detail: `${f.group === 'report' ? 'звітність' : 'вивантаження'}${f.why ? ` · ${f.why}` : ''}`, at: (f as { at?: string }).at, src: 'клієнт' }));
    const runs: Item[] = (rec.auditJobs || []).map((j) => ({ title: `прогін ${j.site || ''}`.trim(), detail: `T${j.tier ?? '?'} · ${j.status || '—'}${j.health != null ? ` · health ${j.health}` : ''}${j.summary ? ` · ${j.summary}` : ''}`, at: j.at, src: 'рушій' }));
    const scores: Item[] = Object.entries(rec.assessment || {}).map(([k, v]) => ({ title: k, detail: [v.state, v.gap].filter(Boolean).join(' → ') || '—', src: 'менеджер' }));
    const adminF: Item[] = (rec.adminFiles || []).map((f) => ({ title: f.name, detail: f.kind || 'файл', at: f.at, src: 'менеджер' }));
    const docs: Item[] = (rec.sharedDocs || []).map((d) => ({ title: d.title, detail: d.by ? `передав ${d.by}` : 'передано клієнту', at: d.at, src: 'менеджер' }));
    const notes: Item[] = (rec.notes || []).map((n) => ({ title: n.module || 'нотатка', detail: n.text, at: n.at, src: 'менеджер' }));

    return [
      { key: 'profile', title: 'Профіль компанії', note: 'що клієнт розповів про себе', items: profile },
      { key: 'answers', title: 'Анкета', note: 'відповіді по блоках, із авторами', items: byBlock },
      { key: 'access', title: 'Доступи', note: 'системи, до яких нас пустили', items: acc, expected: ACCESS_CATALOG.length },
      { key: 'mkt', title: 'Маркетплейси', note: 'кабінети майданчиків', items: mkt },
      { key: 'files', title: 'Файли клієнта', note: 'звітність і вивантаження', items: files },
      { key: 'runs', title: 'Прогони рушія', note: 'що зібрав воркер', items: runs },
      { key: 'scores', title: 'Оцінка модулів', note: 'наш C-level розбір', items: scores },
      { key: 'adminf', title: 'Наші файли', note: 'внутрішні дані й дельіверабли', items: adminF },
      { key: 'docs', title: 'Передані документи', note: 'що клієнт уже отримав', items: docs },
      { key: 'notes', title: 'Нотатки', note: 'внутрішні коментарі команди', items: notes },
    ];
  }, [rec, tpl, answers]);

  const counts = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.key, g.items.length])) as Record<string, number>,
    [groups],
  );
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  /* Зріз фіксує менеджер свідомо: автозапис на кожну зміну засмітив би історію,
     а сенс версії — «ось що ми знали, коли ухвалювали те рішення». */
  const snapshot = async () => {
    setSaving(true);
    const v: KbVersion = {
      id: 'kb_' + Date.now().toString(36),
      at: new Date().toISOString(),
      by: author,
      counts,
      company: Object.fromEntries(
        (groups.find((g) => g.key === 'profile')?.items || []).map((i) => [i.title, i.detail || '']),
      ),
      // Зміст, а не тільки лічильники: через півроку має бути видно, ЩО саме
      // клієнт відповів на ту дату, а не скільки в нас було файлів.
      content: {
        answers: Object.fromEntries(Object.entries(answers).map(([k, a]) => [k, a?.value])),
        accesses: Object.entries(rec.accessLog || {}).map(([id, a]) => ({ id, status: a.status })),
        files: (rec.clientFiles || []).map((f) => f.title || f.type || 'файл'),
        notes: (rec.notes || []).map((n) => n.text),
        scoring: Object.fromEntries(Object.entries(rec.assessment || {}).map(([k, x]) => [k, { state: x.state, gap: x.gap }])),
      },
    };
    const next = [...versions, v].slice(-24);
    const res = await savePatchFor(row.userId, { kbVersions: next });
    setSaving(false);
    if (res.ok) { setVersions(next); toast('✓ Зріз бази знань зафіксовано'); }
    else toast('Не збережено: ' + (res.error || ''), 'err');
  };

  const prev = versions.length ? versions[versions.length - 1] : null;
  const delta = prev ? Object.keys(counts).reduce((acc, k) => {
    const d = (counts[k] || 0) - (prev.counts[k] || 0);
    if (d) acc.push(`${groups.find((g) => g.key === k)?.title || k}: ${d > 0 ? '+' : ''}${d}`);
    return acc;
  }, [] as string[]) : [];
  const empty = groups.filter((g) => g.items.length === 0).map((g) => g.title);

  return (
    <Block title={`База знань · ${total} записів`}>
      <p className="mono adm-hint">
        Збирається з першого дня аудиту й живе далі через впровадження. Це не «результати аудиту», а все,
        що ми знаємо про клієнта, з позначкою, хто це дав.
      </p>
      {empty.length > 0 && (
        <p className="mono adm-empty">Порожньо: {empty.join(' · ')}</p>
      )}
      <div className="adm-kb">
        {groups.filter((g) => g.items.length > 0).map((g) => (
          <div key={g.key} className="adm-kb-g">
            <button className="adm-kb-h" onClick={() => setOpen(open === g.key ? '' : g.key)}>
              <b>{g.title}</b>
              <span className="mono">{g.items.length}{g.expected ? ` / ${g.expected}` : ''}</span>
              <i className="mono">{g.note}</i>
              <span className="mono">{open === g.key ? '−' : '+'}</span>
            </button>
            {open === g.key && (
              <ul className="adm-kv">
                {g.items.map((it, i) => (
                  <li key={i}>
                    <i>
                      <span className={`cab-badge mono tst-${SRC_CLS[it.src]}`}>{it.src}</span>
                      {it.at ? ` ${rel(it.at)}` : ''}
                    </i>
                    <span><b>{it.title}</b>{it.detail ? ` — ${it.detail}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Історія: що ми знали на дату. */}
      <div className="adm-kb-ver">
        <div className="adm-kb-ver-h">
          <b>Історія бази</b>
          <span className="mono">{versions.length} зрізів</span>
          <button className="mc-btn sm" disabled={saving} onClick={snapshot}>
            {saving ? 'Фіксуємо…' : '⎘ Зафіксувати зріз'}
          </button>
        </div>
        {prev && (
          <p className="mono adm-hint">
            Від останнього зрізу ({rel(prev.at)}): {delta.length ? delta.join(' · ') : 'без змін'}
          </p>
        )}
        {versions.length === 0
          ? <p className="mono adm-empty">Зрізів ще немає. Фіксуйте перед рішенням — щоб потім було видно, на чому воно будувалось.</p>
          : (
            <ul className="adm-kv">
              {[...versions].reverse().map((v) => (
                <li key={v.id}>
                  <i>{rel(v.at)}{v.by ? ` · ${v.by}` : ''}</i>
                  <span>{Object.entries(v.counts).filter(([, n]) => n > 0)
                    .map(([k, n]) => `${groups.find((g) => g.key === k)?.title || k}: ${n}`).join(' · ') || 'порожньо'}</span>
                </li>
              ))}
            </ul>
          )}
      </div>
    </Block>
  );
}
