

import {
  getProjects,
  type ModuleScore,
  type DiagRecord,
  type AuditDoc,
  type AuditDocSection,
  type PackState,
  type AdminRow,
  type TierStatus
} from '@/lib/supa';
import { money as fmt, curOf, AGENCY_CUR, sysLabel, type SysKey } from '../systems';
import { toast } from '@/lib/toast';

import { loadTemplate, uid, type AuditTemplate } from '../auditTemplate';
import { ACCESS_CATALOG, ACCESS_METHOD_LABEL } from '@/data/accessCatalog';
import { PACK_ARTIFACTS } from '@/data/auditPack';
import '../system.css';
import '../cabinet.css';
import { ST, escH, openPrintDoc } from './shared';
import { INK } from '../docInk';
import { bindPrint, printButton } from '@/lib/printDoc';
import { DOC_LOGO, DOC_LOGO_CSS } from '@/system/docLogo';

export async function openClientDossier(row: AdminRow) {
  const w = window.open('', '_blank');
  if (!w) { toast('Дозвольте спливаючі вікна, щоб відкрити досьє', 'err'); return; }
  w.document.write('<!doctype html><meta charset="utf-8"><body style="font-family:system-ui,sans-serif;padding:28px;color:#6B675E">Формуємо досьє…</body>');
  const rec = row.record || {};
  const c = rec.company || {};
  const ex = rec.express;
  const tiers = Object.entries(row.funnel?.tierStatus || {});
  const code = row.funnel?.accessCode;
  const now = new Date().toLocaleString('uk-UA');
  const kv = (rows: [string, unknown][]) => rows.filter(([, v]) => v != null && v !== '').map(([k, v]) => `<tr><td class="k">${escH(k)}</td><td>${escH(v)}</td></tr>`).join('');
  const companyRows: [string, unknown][] = [
    ['Назва', c.name], ['Сфера', c.industry], ['Тип', c.bizType], ['Напрям', c.model],
    ['Категорії', c.categories], ['Ніша', c.niche], ['Ринки', c.markets], ['Країни', c.countries],
    ['Оборот (діапазон)', c.sizeRange], ['Виторг €/міс', c.revenue], ['Команда', c.teamSize],
    ['Точки продажу', c.outlets], ['Канали продажів', (c.channels || []).join(', ')],
    ['Канали залучення', (c.acqChannels || []).join(', ')], ['Сайт', c.site], ['Платформа', c.platform],
    ['CRM / ERP', c.crmErp], ['Контакт', c.contactName ? `${c.contactName} ${c.contactPhone || ''}` : ''], ['Коментар', c.notes],
  ];
  const inp = ex?.input || {};
  const cur = curOf(inp.currency);   // документ показує гроші в тій валюті, у якій їх вводив клієнт
  const exRows: [string, unknown][] = ex ? [
    ['Пройдено', new Date(ex.at).toLocaleString('uk-UA')],
    ['Витік / рік', fmt(ex.total, cur)], ['Діапазон', `${fmt(ex.range[0], cur)}–${fmt(ex.range[1], cur)}`],
    ['Business Health', `${ex.overallHealth}/100`],
    ['Ключова проблема', sysLabel(ex.primary as SysKey, 'uk')],
    ['Друга проблема', ex.secondary ? sysLabel(ex.secondary as SysKey, 'uk') : ''],
    ['Оборот / міс', inp.monthlyRevenue ? fmt(inp.monthlyRevenue, cur) : ''],
    ['Середній чек', inp.aov ? fmt(inp.aov, cur) : ''],
    ['Конверсія', inp.conversion != null ? `${inp.conversion}%` : ''],
    ['Повторні покупки', inp.repeatRate != null ? `${inp.repeatRate}%` : ''],
    ['Валова маржа', inp.grossMargin != null ? `${inp.grossMargin}%` : ''],
    ['CAC', inp.cac ? fmt(inp.cac, cur) : ''], ['Джерело', ex.source],
  ] : [];
  const tierRows = tiers.map(([tid, st]) => `<tr><td class="k">${escH(tid)}</td><td>${escH(ST[st as TierStatus]?.txt || st)}</td></tr>`).join('');
  // C-level оцінка модулів (з активного шаблону — для назв модулів).
  const asm = rec.assessment || {};
  let tpl: AuditTemplate | null = null; try { tpl = await loadTemplate(); } catch { /* ignore */ }
  const modTitle = (k: string) => tpl?.blocks.find((bl) => bl.key === k)?.title || k;
  const asmKeys = Object.keys(asm).filter((k) => { const s = asm[k]; return s && (s.score != null || s.state || s.gap || s.rec || s.priority); });
  const asmScores = asmKeys.map((k) => asm[k].score).filter((n): n is number => typeof n === 'number');
  const asmAvg = asmScores.length ? Math.round(asmScores.reduce((a, b) => a + b, 0) / asmScores.length) : null;
  const asmRows = asmKeys.map((k) => { const s = asm[k]; return `<tr><td>${escH(modTitle(k))}</td><td class="c">${s.score != null ? escH(s.score) : '—'}</td><td class="c">${escH(s.priority || '—')}</td><td>${escH(s.gap || s.rec || s.state || '')}</td></tr>`; }).join('');
  const html = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Досьє — ${escH(row.email)}</title><style>
@page{margin:16mm}*{box-sizing:border-box}body{font-family:"IBM Plex Sans","Segoe UI",system-ui,Arial,sans-serif;color:#141210;margin:0;font-size:13px;line-height:1.5}
.bar{height:8px;background:#F5301C}.wrap{padding:26px 30px}
.top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #141210;padding-bottom:12px;margin-bottom:18px}
${DOC_LOGO_CSS}.meta{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#6B675E;text-align:right}
h1{font-size:18px;margin:2px 0 2px}.sub{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6B675E}
h2{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:${INK.red};margin:22px 0 8px;border-bottom:1px solid #E3D9C0;padding-bottom:4px}
table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #EEE7D6;padding:6px 8px;vertical-align:top}td.k{width:210px;color:#6B675E;font-weight:600}
.money{font-size:26px;font-weight:800;margin:4px 0}.money i{font-size:13px;color:#6B675E;font-weight:500;font-style:normal}
.empty{color:#9a9488;font-style:italic}.code{font-family:"IBM Plex Mono",monospace;font-weight:700;background:#FFF6C2;padding:3px 8px;border:1px solid #E3D9C0}
td.c{text-align:center;width:56px;font-weight:600}
.foot{margin-top:26px;padding-top:12px;border-top:1px solid #E3D9C0;color:#9a9488;font-size:10.5px}
@media print{.noprint{display:none}}
</style></head><body><div class="bar"></div><div class="wrap">
<div class="top"><div>${DOC_LOGO}<div class="sub">Досьє клієнта · конфіденційно</div></div>
<div class="meta">${escH(row.email)}<br>сформовано ${escH(now)}${code ? `<br>код: <span class="code">${escH(code)}</span>` : ''}</div></div>
${printButton(INK.red, '0 0 14px')}
<h2>Профіль компанії</h2>${companyRows.some(([, v]) => v) ? `<table>${kv(companyRows)}</table>` : '<p class="empty">Профіль не заповнено.</p>'}
<h2>Експрес-аудит</h2>${ex ? `<p class="money">${escH(fmt(ex.total, cur))} <i>/ рік · витік</i></p><table>${kv(exRows)}</table>` : '<p class="empty">Експрес-аудит не проходив.</p>'}
${asmKeys.length ? `<h2>C-level оцінка модулів${asmAvg != null ? ` · зрілість ${asmAvg}/100` : ''}</h2><table><tr><td class="k">Модуль</td><td class="c">Score</td><td class="c">Prio</td><td>Розрив / рекомендація</td></tr>${asmRows}</table>` : ''}
<h2>Статуси доступу до глибокого аудиту</h2>${tierRows ? `<table>${tierRows}</table>` : '<p class="empty">Запитів не було.</p>'}
<div class="foot">WEEXP · weexp.agency · hello@weexp.agency · Документ містить конфіденційні дані клієнта. Не для розповсюдження.</div>
</div></body></html>`;
  w.document.open(); w.document.write(html); w.document.close();
  bindPrint(w);
}

// Горизонтальні вкладки повної сторінки клієнта (замість бокового drawer).

export function seedAuditSections(rec: DiagRecord, modTitle: (k: string) => string): AuditDocSection[] {
  const secs: AuditDocSection[] = [];
  const jobSum = (rec.auditJobs || []).find((j) => j.summary)?.summary;
  const ex = rec.express;
  const exCur = curOf(ex?.input?.currency);
  const resume = jobSum || (ex ? `Business Health ${ex.overallHealth}/100. Ключова проблема: ${sysLabel(ex.primary as SysKey, 'uk')}. Оцінений витік ≈ ${fmt(ex.total, exCur)}/рік.` : '');
  secs.push({ id: uid(), heading: 'Резюме', body: resume || 'Короткий підсумок аудиту…' });
  const asm = rec.assessment || {};
  const keys = Object.keys(asm).filter((k) => { const s = asm[k]; return s && (s.score != null || s.gap || s.rec || s.state); });
  if (keys.length) {
    const body = keys.map((k) => { const s = asm[k]; return `• ${modTitle(k)} — ${s.score != null ? `${s.score}/100` : '—'}${s.priority ? ` [${s.priority}]` : ''}\n  ${s.gap || s.state || ''}${s.rec ? `\n  → ${s.rec}` : ''}`; }).join('\n\n');
    secs.push({ id: uid(), heading: 'Оцінка модулів (C-level)', body });
    const recs = keys.filter((k) => asm[k].rec).map((k) => `• ${modTitle(k)}: ${asm[k].rec}${asm[k].expected ? ` (ефект: ${asm[k].expected})` : ''}`);
    if (recs.length) secs.push({ id: uid(), heading: 'Рекомендації', body: recs.join('\n') });
  }
  const notes = rec.notes || [];
  if (notes.length) secs.push({ id: uid(), heading: 'Нотатки команди', body: notes.map((n) => `• ${n.text}`).join('\n') });
  secs.push({ id: uid(), heading: 'Дорожня карта', body: 'Етап 1 — …\nЕтап 2 — …\nЕтап 3 — …' });
  return secs;
}

/** Експорт документа аудиту у друкований HTML (→ PDF), у брендованому шаблоні WEEXP. */
export function exportAuditDocPdf(doc: AuditDoc, email: string) {
  const w = window.open('', '_blank');
  if (!w) { toast('Дозвольте спливаючі вікна, щоб відкрити документ', 'err'); return; }
  const now = new Date().toLocaleString('uk-UA');
  const body = doc.sections.map((s) => `<h2>${escH(s.heading)}</h2><div class="body">${escH(s.body).replace(/\n/g, '<br>')}</div>`).join('');
  const html = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>${escH(doc.title)} — ${escH(email)}</title><style>
@page{margin:16mm}*{box-sizing:border-box}body{font-family:"IBM Plex Sans","Segoe UI",system-ui,Arial,sans-serif;color:#141210;margin:0;font-size:13px;line-height:1.55}
.bar{height:8px;background:#F5301C}.wrap{padding:26px 30px;max-width:900px}
.top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #141210;padding-bottom:12px;margin-bottom:18px}
${DOC_LOGO_CSS}.meta{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#6B675E;text-align:right}
h1{font-size:20px;margin:2px 0 2px}.sub{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6B675E}
h2{font-size:14px;letter-spacing:.04em;color:${INK.red};margin:22px 0 8px;border-bottom:1px solid #E3D9C0;padding-bottom:4px}
.body{white-space:normal}.foot{margin-top:26px;padding-top:12px;border-top:1px solid #E3D9C0;color:#9a9488;font-size:10.5px}
@media print{.noprint{display:none}}
</style></head><body><div class="bar"></div><div class="wrap">
<div class="top"><div>${DOC_LOGO}<div class="sub">Документ аудиту · конфіденційно</div></div>
<div class="meta">${escH(email)}<br>сформовано ${escH(now)}</div></div>
<h1>${escH(doc.title)}</h1>
${printButton(INK.red, '14px 0')}
${body}
<div class="foot">WEEXP · weexp.agency · hello@weexp.agency · Документ містить конфіденційні дані клієнта. Не для розповсюдження.</div>
</div></body></html>`;
  w.document.open(); w.document.write(html); w.document.close();
  bindPrint(w);
}

/** Редактор документа аудиту: коригуємо те, що зібрав рушій; версіонуємо; експорт у PDF. */

export function genAccessMap(rec: DiagRecord, email: string) {
  const log = rec.accessLog || {};
  const stTxt: Record<string, string> = { requested: 'запрошено', granted: '<span class="ok">надано</span>', verified: '<span class="ok">перевірено</span>', na: '<span class="muted">не потрібно</span>' };
  const rows = ACCESS_CATALOG.map((a) => {
    const s = log[a.id] || {};
    return `<tr><td><b>${escH(a.system)}</b><br><span class="muted">${escH(a.why)}</span></td><td>${escH(a.category)}</td><td>${s.method ? escH(ACCESS_METHOD_LABEL[s.method]) : '<span class="muted">—</span>'}</td><td>${s.status ? stTxt[s.status] : '<span class="warn">очікується</span>'}</td><td>${escH(s.note || '')}</td></tr>`;
  }).join('');
  const granted = ACCESS_CATALOG.filter((a) => ['granted', 'verified'].includes(log[a.id]?.status || '')).length;
  // «Обмеження та припущення»: системи без доступу → що НЕ перевірялось і чому.
  const missing = ACCESS_CATALOG.filter((a) => !['granted', 'verified', 'na'].includes(log[a.id]?.status || ''));
  const limits = missing.length
    ? `<h2>Обмеження та припущення</h2><p>Наведені нижче ділянки НЕ перевірялися напряму (доступ не надано на момент аудиту) — висновки по них спираються на зовнішні спостереження та відповіді опитувальника і мають нижчу впевненість:</p>
       <table><tr><th>Система</th><th>Що лишилось поза перевіркою</th></tr>${missing.map((a) => `<tr><td><b>${escH(a.system)}</b></td><td>${escH(a.why)}</td></tr>`).join('')}</table>`
    : '<h2>Обмеження та припущення</h2><p class="ok">Усі необхідні доступи було надано — суттєвих обмежень перевірки немає.</p>';
  openPrintDoc('Карта доступів і даних', email,
    `<p>Периметр аудиту: надано <b>${granted}/${ACCESS_CATALOG.length}</b> доступів. Способи: перегляд (корпоративна пошта), OAuth-конектор, вивантаження файлів.</p>
     <table><tr><th>Система</th><th>Категорія</th><th>Спосіб</th><th>Статус</th><th>Нотатка</th></tr>${rows}</table>
     ${limits}`);
}

/** a15 — Роадмапа + Гант А→Б: кожен крок по місяцях, бюджет, команда, розподіл власників. */
export function genGantt(rec: DiagRecord, email: string) {
  const p = getProjects(rec)[0];
  const tasks = p?.tasks || [];
  if (!p || !tasks.length) { toast('Спершу заповніть «Проект» у картці клієнта (задачі Ганта, команда, тарифікація).', 'err'); return; }
  const span = Math.max(1, Math.min(24, p.span || 6));
  const mLbl = (i: number) => {
    if (!p.startMonth) return 'М' + (i + 1);
    const [y, m] = p.startMonth.split('-').map(Number);
    try { return new Date(y, (m - 1) + i, 1).toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' }); } catch { return 'М' + (i + 1); }
  };
  const head = Array.from({ length: span }, (_, i) => `<th style="text-align:center">${mLbl(i)}</th>`).join('');
  const gantt = tasks.map((tk) => {
    const cells = Array.from({ length: span }, (_, i) => {
      const on = i >= (tk.startM || 0) && i < (tk.startM || 0) + Math.max(1, tk.lenM || 1);
      return `<td style="text-align:center;padding:4px 2px">${on ? '<span style="display:block;height:14px;background:#F5301C"></span>' : ''}</td>`;
    }).join('');
    return `<tr><td><b>${escH(tk.name)}</b>${tk.track ? `<br><span class="muted">${escH(tk.track)}</span>` : ''}</td><td>${escH(tk.owner || '—')}</td>${cells}</tr>`;
  }).join('');
  // Бюджет по місяцях (тарифікація: години × ставка).
  const tariff = (p.tariff || []).map((mo) => {
    const sum = (mo.items || []).reduce((s, it) => s + (it.hours || 0) * (it.rate || 0), 0);
    return `<tr><td>${escH(mo.month)}</td><td>${(mo.items || []).map((it) => escH(`${it.label} · ${it.hours} год × €${it.rate}`)).join('<br>')}</td><td><b>€${Math.round(sum).toLocaleString('en-US')}</b></td></tr>`;
  }).join('');
  const total = (p.tariff || []).reduce((s, mo) => s + (mo.items || []).reduce((x, it) => x + (it.hours || 0) * (it.rate || 0), 0), 0);
  const team = (p.team || []).map((tm) => `<tr><td><b>${escH(tm.role)}</b></td><td>${escH(tm.name || 'підбирається')}</td></tr>`).join('');
  // Розподіл відповідальності: групуємо задачі за власником (WEEXP / партнер / команда клієнта).
  const owners = new Map<string, string[]>();
  tasks.forEach((tk) => { const o = tk.owner || 'Не призначено'; owners.set(o, [...(owners.get(o) || []), tk.name]); });
  const split = [...owners.entries()].map(([o, ts]) => `<tr><td><b>${escH(o)}</b></td><td>${ts.map(escH).join(' · ')}</td></tr>`).join('');
  openPrintDoc(`Роадмапа: ${p.title || 'проєкт'} — Гант А→Б`, email,
    `<p>Дорожня карта з точки А в точку Б: ${tasks.length} кроків · горизонт ${span} міс${total ? ` · бюджет €${Math.round(total).toLocaleString('en-US')}` : ''}.</p>
     <h2>Діаграма Ганта</h2><table><tr><th>Крок</th><th>Власник</th>${head}</tr>${gantt}</table>
     ${team ? `<h2>Необхідна команда</h2><table><tr><th>Роль</th><th>Спеціаліст</th></tr>${team}</table>` : ''}
     ${split ? `<h2>Розподіл відповідальності (ми / партнери / команда клієнта)</h2><table><tr><th>Власник</th><th>Задачі</th></tr>${split}</table>` : ''}
     ${tariff ? `<h2>Бюджет по місяцях</h2><table><tr><th>Місяць</th><th>Склад робіт</th><th>Сума</th></tr>${tariff}<tr><td colspan="2"><b>Разом</b></td><td><b>€${Math.round(total).toLocaleString('en-US')}</b></td></tr></table>` : ''}`);
}

/** a16 — План перших 90 днів: рекомендації з C-level оцінки за пріоритетами. */
export function genPlan90(rec: DiagRecord, email: string, modTitle: (k: string) => string) {
  const asm = rec.assessment || {};
  const by = (p: 'P1' | 'P2' | 'P3') => Object.entries(asm).filter(([, s]) => s.priority === p && (s.rec || s.gap));
  const sec = (label: string, items: [string, ModuleScore][]) => items.length
    ? `<h2>${label}</h2><table><tr><th>Модуль</th><th>Дія</th><th>Очікуваний ефект</th></tr>${items.map(([k, s]) => `<tr><td><b>${escH(modTitle(k))}</b></td><td>${escH(s.rec || s.gap || '')}</td><td>${escH(s.expected || '—')}</td></tr>`).join('')}</table>`
    : '';
  const p1 = by('P1'), p2 = by('P2'), p3 = by('P3');
  if (!p1.length && !p2.length && !p3.length) { toast('Спершу заповніть C-level оцінку модулів (рекомендації з пріоритетами).', 'err'); return; }
  openPrintDoc('План перших 90 днів', email,
    `<p>Швидкі перемоги та перші системні кроки — з C-level оцінки модулів. Пріоритет P1 — дні 1–30, P2 — дні 31–60, P3 — дні 61–90.</p>
     ${sec('Дні 1–30 · критичні (P1)', p1)}${sec('Дні 31–60 · важливі (P2)', p2)}${sec('Дні 61–90 · системні (P3)', p3)}`);
}

/** a17 — Цільова модель (DoD): поточні score → цільові, з очікуваним ефектом. */
export function genDoD(rec: DiagRecord, email: string, modTitle: (k: string) => string) {
  const asm = rec.assessment || {};
  const rows = Object.entries(asm).filter(([, s]) => s.score != null || s.state || s.expected);
  if (!rows.length) { toast('Спершу заповніть C-level оцінку модулів.', 'err'); return; }
  const body = rows.map(([k, s]) => {
    const cur = typeof s.score === 'number' ? s.score : null;
    const tgt = cur != null ? Math.min(90, Math.max(cur + 20, 60)) : null;
    return `<tr><td><b>${escH(modTitle(k))}</b></td><td>${cur != null ? cur + '/100' : '—'}</td><td>${tgt != null ? '<b>' + tgt + '/100</b>' : '—'}</td><td>${escH(s.expected || s.rec || '—')}</td></tr>`;
  }).join('');
  openPrintDoc('Цільова модель (Definition of Done)', email,
    `<p>Куди мають прийти системи бізнесу за 6–9 місяців роботи. Ціль — вимірна: зрілість модуля за шкалою 0–100, критерій готовності — очікуваний ефект.</p>
     <table><tr><th>Модуль</th><th>Зараз</th><th>Ціль</th><th>Критерій готовності / ефект</th></tr>${body}</table>`);
}

/** a19 — Протокол передачі: стан глав пакета + умови супроводу. */
export function genHandover(rec: DiagRecord, email: string, checklist: Record<string, PackState>) {
  const rows = PACK_ARTIFACTS.map((a, i) => {
    const st = checklist[a.id]?.st;
    const stH = st === 'delivered' ? '<span class="ok">передано</span>' : st === 'ready' ? '<span class="warn">готово</span>' : '<span class="muted">в роботі</span>';
    return `<tr><td>${String(i + 1).padStart(2, '0')}</td><td><b>${escH(a.uk)}</b></td><td>${stH}</td></tr>`;
  }).join('');
  const delivered = PACK_ARTIFACTS.filter((a) => checklist[a.id]?.st === 'delivered').length;
  const call = new Date(Date.now() + 30 * 864e5).toLocaleDateString('uk-UA');
  openPrintDoc('Протокол передачі пакета аудиту', email,
    `<p>Передано глав пакета: <b>${delivered}/${PACK_ARTIFACTS.length}</b> (5 звітів). До пакета входять 4 години консультацій із розбором документів і контрольний дзвінок <b>${call}</b> (через 30 днів) — перевіряємо, що впровадження пішло.</p>
     <table><tr><th>№</th><th>Глава</th><th>Стан</th></tr>${rows}</table>
     <h2>Умови зарахування</h2><p>100% вартості аудиту зараховується в перший місяць формату 03 (50% — у формат 02), якщо старт упродовж 30 днів.</p>`);
}

/** Чеклист готовності пакета аудиту в картці клієнта. */
