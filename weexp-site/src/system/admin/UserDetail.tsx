import { lazy, Suspense } from 'react';
import { AutofillPanel } from './AutofillPanel';

import { getProjects, type AdminRow, type LeadRow, type TierStatus, type LeadStatus } from '@/lib/supa';
import { money as fmt, curOf, AGENCY_CUR, sysLabel, actionText, type SysKey } from '../systems';

import '../system.css';
import '../cabinet.css';
import { Panel, PanelBoundary } from './dialog';
import { Block, ACCESS_SOURCES, FUNNEL, LEAD_STAGES, ST, U_TABS, coopLabel, funnelStage, rel, tierLabel, type UTab } from './shared';
import { openClientDossier } from './docs';
import { downloadClientExport } from './exportClient';
/* Вміст вкладок вантажимо на вимогу. Картка відкривається на «Огляді», а
   машинерія аудиту (рушій, оцінка модулів, редактор документа, проєкти) —
   найважче, що тут є; тягнути її заради перегляду профілю немає сенсу. */
const ClientBrief = lazy(() => import('./ClientBrief').then((m) => ({ default: m.ClientBrief })));
const KnowledgeBase = lazy(() => import('./KnowledgeBase').then((m) => ({ default: m.KnowledgeBase })));
const AccessCatalog = lazy(() => import('./panels-audit').then((m) => ({ default: m.AccessCatalog })));
const AuditDocEditor = lazy(() => import('./panels-audit').then((m) => ({ default: m.AuditDocEditor })));
const AuditFill = lazy(() => import('./panels-audit').then((m) => ({ default: m.AuditFill })));
const ExtraEditor = lazy(() => import('./panels-audit').then((m) => ({ default: m.ExtraEditor })));
const ModerationPanel = lazy(() => import('./panels-audit').then((m) => ({ default: m.ModerationPanel })));
const WorkerAudit = lazy(() => import('./panels-audit').then((m) => ({ default: m.WorkerAudit })));
const AdminFiles = lazy(() => import('./panels-client').then((m) => ({ default: m.AdminFiles })));
const GaPreview = lazy(() => import('./panels-client').then((m) => ({ default: m.GaPreview })));
const ModuleScoring = lazy(() => import('./panels-client').then((m) => ({ default: m.ModuleScoring })));
const NotesPanel = lazy(() => import('./panels-client').then((m) => ({ default: m.NotesPanel })));
const PackChecklist = lazy(() => import('./panels-client').then((m) => ({ default: m.PackChecklist })));
const ProjectsManager = lazy(() => import('./ProjectsManager').then((m) => ({ default: m.ProjectsManager })));

export function UserDetail({ row, leads, canDelete, canAccess, selfEmail, utab, onUtab, onChanged, onClose, openFile, onStatus, onDelete, busy }: { row: AdminRow; leads: LeadRow[] | null; canDelete: boolean; /** manage_access: аудитор бачить картку, але не роздає доступи */ canAccess: boolean; selfEmail: string; /** Вкладка картки живе в адресі — інакше посилання на неї відкриває «Огляд». */
  utab: UTab; onUtab: (t: UTab) => void;
  /** Перечитати картку після запису панелі: інакше «Огляд» і «База знань»
   *  показують старі числа, поки картку не переоткриють. */
  onChanged: () => void;
  onClose: () => void; openFile: (p: string) => void; onStatus: (userId: string, tier: string, status: TierStatus) => void; onDelete: (userId: string, email: string) => void; busy: string }) {
  const rec = row.record || {};
  const company = rec.company;
  const money = rec.stage1Money;
  const tiers = Object.entries(row.funnel?.tierStatus || {});
  const files = Object.entries(row.funnel?.tierFiles || {});
  const code = row.funnel?.accessCode;
  const projects = getProjects(rec);
  // Дані для шапки: угода з заявки, відповідальний PM, дата старту, етап глибокого аудиту.
  const myLead = (leads || []).find((l) => l.deal && (l.email || '').toLowerCase() === row.email.toLowerCase());
  const deal = myLead?.deal;
  const pm = projects.flatMap((p) => p.team || []).find((m) => /pm|проект|менедж/i.test(m.role || ''));
  const startAt = projects.map((p) => p.startMonth).filter(Boolean).sort()[0];
  const deepSt = (row.funnel?.tierStatus || {})['DEEP'];
  const st = FUNNEL.find((x) => x.k === funnelStage(row))!;
  return (
    <section className="adm-userpage">
      <div className="adm-uhead">
        <div className="adm-uhead-top">
          <button className="mc-btn adm-uback" onClick={onClose}>← Назад</button>
          <div className="adm-uhead-id">
            <b className="adm-uhead-name">{company?.name || row.email}</b>
            <a className="adm-email adm-mail" href={`mailto:${row.email}`}>{row.email}</a>
          </div>
          <span className={`cab-badge mono tst-${st.cls} adm-drawer-stage`}>{st.l}</span>
          <button className="mc-btn" onClick={() => openClientDossier(row)} title="Сформувати PDF-досьє клієнта">📄 Досьє PDF</button>
          {/* Два різні вивантаження, і плутати їх не можна: одне йде клієнту на
              руки, друге — наш знімок перед ризикованою правкою. */}
          <button className="mc-btn" onClick={() => downloadClientExport(row, 'client')}
            title="JSON з даними клієнта без наших внутрішніх нотаток і оцінок — на запит клієнта (GDPR, ст. 20)">↓ Дані клієнта</button>
          <button className="mc-btn ghost" onClick={() => downloadClientExport(row, 'full')}
            title="Повний знімок запису разом із внутрішнім шаром — резервна копія перед ризикованою правкою. Клієнту не передавати.">↓ Знімок</button>
        </div>
        <div className="adm-uhead-kv">
          <div className="adm-uhead-cell"><i className="mono">Контакт</i><b>{company?.contactName ? `${company.contactName}${company.contactPhone ? ' · ' + company.contactPhone : ''}` : '—'}</b></div>
          <div className="adm-uhead-cell"><i className="mono">Відп. менеджер</i><b>{pm?.name || '—'}</b></div>
          <div className="adm-uhead-cell"><i className="mono">Тип співпраці</i><b>{coopLabel(deal?.coopType) || deal?.coopForm || (deepSt ? 'Глибокий аудит' : '—')}</b></div>
          <div className="adm-uhead-cell"><i className="mono">Дата початку</i><b>{startAt || (row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('uk-UA') : '—')}</b></div>
          <div className="adm-uhead-cell"><i className="mono">Етап</i><b>{deepSt ? (ST[deepSt]?.txt ?? deepSt) : st.l}</b></div>
        </div>
        <nav className="adm-utabs" role="tablist" aria-label="Розділи картки клієнта">
          {U_TABS.map((tb) => (
            <button key={tb.id} role="tab" aria-selected={utab === tb.id} title={tb.hint}
              className={`adm-utab${utab === tb.id ? ' on' : ''}`} onClick={() => onUtab(tb.id)}>{tb.l}</button>
          ))}
        </nav>
      </div>
      <div className="adm-upage-body">
        {/* Зовнішня межа — остання лінія: ловить те, що не в іменованій панелі
            нижче (інлайн-блоки самої картки). Важкі під-панелі мають власні
            межі: падіння однієї вкладки не має забирати всю картку клієнта.
            Раніше цей коментар стояв тут, а межа була одна на все — тобто
            обіцянка була, а ізоляції не було. */}
        <PanelBoundary title="Картка клієнта"><Suspense fallback={<p className="mc-msg mono">Завантаження…</p>}>
          {utab === 'over' && <PanelBoundary title="Огляд клієнта"><ClientBrief row={row} code={code} /></PanelBoundary>}
          {utab === 'kb' && <PanelBoundary title="База знань"><KnowledgeBase row={row} code={code} author={selfEmail} /></PanelBoundary>}
          {utab === 'over' && code && (
            <Block title="Код доступу">
              <button className="adm-code adm-code-lg" onClick={() => navigator.clipboard?.writeText(code)} title="Скопіювати">🔑 {code}</button>
              <span className="mono adm-empty">клієнт вводить його у «Глибокому аудиті»</span>
            </Block>
          )}
          {utab === 'comp' && (
            <PanelBoundary title="Заповнення з анкети">
              <AutofillPanel userId={row.userId} code={code} rec={rec} onSaved={onChanged} />
            </PanelBoundary>
          )}
          {utab === 'comp' && <Block title="Компанія">{(company?.name || company?.industry) ? (
            <ul className="adm-kv">
              {company.name && <li><i>Назва</i><span>{company.name}</span></li>}
              {company.industry && <li><i>Сфера</i><span>{company.industry}</span></li>}
              {company.bizType && <li><i>Тип</i><span>{company.bizType}</span></li>}
              {company.model && <li><i>Напрям</i><span>{company.model}</span></li>}
              {company.categories && <li><i>Категорії</i><span>{company.categories}</span></li>}
              {company.niche && <li><i>Ніша</i><span>{company.niche}</span></li>}
              {company.markets && <li><i>Ринки</i><span>{company.markets}</span></li>}
              {company.countries && <li><i>Країни</i><span>{company.countries}</span></li>}
              {company.sizeRange && <li><i>Оборот (діапазон)</i><span>{company.sizeRange}</span></li>}
              {company.revenue && <li><i>Виторг €/міс</i><span>{company.revenue}</span></li>}
              {company.teamSize && <li><i>Команда</i><span>{company.teamSize}</span></li>}
              {company.outlets && <li><i>Точки продажу</i><span>{company.outlets}</span></li>}
              {(company.channels?.length ?? 0) > 0 && <li><i>Канали продажів</i><span>{company.channels!.join(', ')}</span></li>}
              {(company.acqChannels?.length ?? 0) > 0 && <li><i>Канали залучення</i><span>{company.acqChannels!.join(', ')}</span></li>}
              {company.site && <li><i>Сайт</i><span>{company.site}</span></li>}
              {company.domains && <li><i>Домени</i><span>{company.domains}</span></li>}
              {company.platform && <li><i>Платформа</i><span>{company.platform}</span></li>}
              {company.crmErp && <li><i>CRM / ERP</i><span>{company.crmErp}</span></li>}
              {company.contactName && <li><i>Контакт</i><span>{company.contactName} {company.contactPhone || ''}</span></li>}
              {company.notes && <li><i>Коментар</i><span>{company.notes}</span></li>}
            </ul>
          ) : <p className="mono adm-empty">профіль не заповнено</p>}</Block>}

          {(utab === 'team' || utab === 'comp') && (
            <Block title="Команда клієнта">
              {(company?.team?.length ?? 0) > 0 ? (
                <ul className="adm-kv">
                  {company!.team!.map((m, i) => (
                    <li key={i}><i>{m.role || 'роль не вказана'}</i><span>{m.name || '—'}{m.email ? ` · ${m.email}` : ''}{m.phone ? ` · ${m.phone}` : ''}</span></li>
                  ))}
                </ul>
              ) : <p className="mono adm-empty">клієнт ще не додав команду у «Дані компанії»</p>}
            </Block>
          )}
          {utab === 'team' && (
            <Block title="Команда WEEXP на проекті">
              {projects.flatMap((p) => p.team || []).length ? (
                <ul className="adm-kv">
                  {projects.flatMap((p) => (p.team || []).map((m) => ({ p: p.title, ...m }))).map((m, i) => (
                    <li key={i}><i>{m.role}</i><span>{m.name}{m.p ? ` · ${m.p}` : ''}</span></li>
                  ))}
                </ul>
              ) : <p className="mono adm-empty">команда призначається у вкладці «Проект» (довідник — у «Проектах → Проект-офіс»)</p>}
            </Block>
          )}

          {utab === 'express' && <Block title="Експрес-аудит">{(() => {
            const ex = rec.express;
            if (ex) {
              const inp = ex.input || {};
              const cur = curOf(inp.currency);   // валюта, у якій клієнт вводив суми
              const rows: { l: string; v: string }[] = [
                { l: 'Оборот / міс', v: inp.monthlyRevenue ? fmt(inp.monthlyRevenue, cur) : '—' },
                { l: 'Середній чек', v: inp.aov ? fmt(inp.aov, cur) : '—' },
                { l: 'Конверсія', v: inp.conversion != null ? `${inp.conversion}%` : '—' },
                { l: 'Повторні покупки', v: inp.repeatRate != null ? `${inp.repeatRate}%` : '—' },
                { l: 'Повернення+скасув.', v: inp.returnsRate != null ? `${inp.returnsRate}%` : '—' },
                { l: 'Валова маржа', v: inp.grossMargin != null ? `${inp.grossMargin}%` : '—' },
                { l: 'CAC', v: inp.cac ? fmt(inp.cac, cur) : '—' },
              ];
              return (
                <div className="adm-express">
                  <p className="adm-money">{fmt(ex.total, cur)} <i>/ рік</i> <span className="mono adm-express-sub">діапазон {fmt(ex.range[0], cur)}–{fmt(ex.range[1], cur)} · Health {ex.overallHealth}/100</span></p>
                  <ul className="adm-kv">
                    <li><i>Пройдено</i><span className="mono">{new Date(ex.at).toLocaleString('uk-UA')}</span></li>
                    <li><i>Ключова проблема</i><span>{sysLabel(ex.primary as SysKey, 'uk')}</span></li>
                    {ex.secondary && <li><i>Друга проблема</i><span>{sysLabel(ex.secondary as SysKey, 'uk')}</span></li>}
                    <li><i>Клієнт</i><span className="mono">{row.email}</span></li>
                    {ex.source && <li><i>Джерело</i><span className="mono">{ex.source}</span></li>}
                  </ul>

                  {ex.input && (
                    <div className="adm-express-sec">
                      <span className="mono adm-empty">Вхідні дані клієнта:</span>
                      <div className="adm-inp-grid">{rows.map((r) => <div key={r.l} className="adm-inp-cell"><i>{r.l}</i><b>{r.v}</b></div>)}</div>
                    </div>
                  )}

                  {ex.symptoms && ex.symptoms.length > 0 && (
                    <div className="adm-express-sec">
                      <span className="mono adm-empty">Обрані симптоми:</span>
                      <div className="adm-sym-tags">{ex.symptoms.map((s) => <span key={s} className="adm-sym">{sysLabel(s as SysKey, 'uk')}</span>)}</div>
                    </div>
                  )}

                  {ex.health && ex.health.length > 0 && (
                    <div className="adm-express-sec">
                      <span className="mono adm-empty">Здоровʼя систем:</span>
                      <div className="adm-hp">{ex.health.map((h) => (
                        <div key={h.key} className="adm-hp-row"><span className="adm-hp-l">{sysLabel(h.key as SysKey, 'uk')}</span><span className="adm-hp-bar"><i style={{ width: `${h.score}%`, background: h.score >= 65 ? 'var(--ok)' : h.score >= 40 ? 'var(--warn)' : 'var(--red)' }} /></span><b className="mono">{h.score}</b></div>
                      ))}</div>
                    </div>
                  )}

                  {ex.leaks && ex.leaks.length > 0 && (
                    <div className="adm-express-sec">
                      <span className="mono adm-empty">Джерела витоку:</span>
                      <ul className="adm-leaks">{ex.leaks.slice(0, 5).map((l) => <li key={l.key}><span>{sysLabel(l.key as SysKey, 'uk')}</span><b className="mono">{fmt(l.amount, cur)}/рік</b></li>)}</ul>
                    </div>
                  )}

                  {ex.actions && ex.actions.length > 0 && (
                    <div className="adm-express-sec">
                      <span className="mono adm-empty">Рекомендації:</span>
                      <ol className="adm-recs">{ex.actions.slice(0, 5).map((a) => <li key={a}>{actionText(a as SysKey, 'uk')}</li>)}</ol>
                    </div>
                  )}
                </div>
              );
            }
            if (money) return <p className="adm-money">{fmt(money[0], AGENCY_CUR)} – {fmt(money[1], AGENCY_CUR)} <i>/ рік</i></p>;
            return <p className="mono adm-empty">{row.hasExpress ? 'є' : 'не рахували'}</p>;
          })()}</Block>}

          {utab === 'work' && <Block title="Аудит рушієм Commerce OS"><PanelBoundary title="Аудит рушієм"><WorkerAudit userId={row.userId} code={code} rec={rec} reviewer={selfEmail} /></PanelBoundary></Block>}

          {utab === 'work' && <Block title="Оцінка модулів (C-level) — внутрішнє"><PanelBoundary title="Оцінка модулів"><ModuleScoring userId={row.userId} initial={rec.assessment || {}} code={code} rec={rec} onSaved={onChanged} /></PanelBoundary></Block>}

          {utab === 'data' && <Block title="Каталог доступів клієнта"><PanelBoundary title="Каталог доступів"><AccessCatalog userId={row.userId} initial={rec.accessLog || {}} onSaved={onChanged} /></PanelBoundary></Block>}

          {utab === 'docs' && <Block title="Аналітика клієнта (GA4 · GSC · PageSpeed)"><PanelBoundary title="Аналітика клієнта"><GaPreview userId={row.userId} siteUrl={company?.site || rec.site || ''} /></PanelBoundary></Block>}

          {utab === 'over' && <Block title="Внутрішні нотатки команди"><PanelBoundary title="Нотатки"><NotesPanel userId={row.userId} initial={rec.notes || []} author={selfEmail} /></PanelBoundary></Block>}

          {utab === 'data' && <Block title="Модерація опитувальника"><PanelBoundary title="Модерація опитувальника"><ModerationPanel userId={row.userId} code={code} rec={rec} reviewer={selfEmail} /></PanelBoundary></Block>}

          {utab === 'pack' && <Block title="Пакет аудиту — 5 звітів"><PanelBoundary title="Пакет аудиту"><PackChecklist userId={row.userId} email={row.email} rec={rec} /></PanelBoundary></Block>}

          {utab === 'pack' && <Block title="Документ аудиту (редагований)"><PanelBoundary title="Документ аудиту"><AuditDocEditor userId={row.userId} email={row.email} rec={rec} /></PanelBoundary></Block>}

          {utab === 'docs' && <Block title="Мої файли та передача клієнту"><PanelBoundary title="Файли й передача"><AdminFiles userId={row.userId} initial={rec.adminFiles || []} sharedInitial={rec.sharedDocs || []} author={selfEmail} openFile={openFile} onSaved={onChanged} /></PanelBoundary></Block>}

          {utab === 'data' && <Block title="Запити доступів">{tiers.length ? (
            <div className="adm-drawer-tiers">
              {tiers.map(([tid, s]) => {
                const b = `${row.userId}:${tid}`;
                return (
                  <div key={tid} className="adm-dtier">
                    <div className="adm-dtier-l"><b className="mc-tid">{tierLabel(tid)}</b><span className={`cab-badge mono tst-${ST[s]?.cls ?? 'muted'}`}>{ST[s]?.txt ?? s}</span></div>
                    {/* Ті самі дії, що й на дошці, — і той самий гейт. Раніше
                        дошку закрили, а картку ні: аудитор видавав доступи звідси. */}
                    {canAccess ? (
                      <div className="mc-tier-act">
                        <button className="mc-btn ok" disabled={busy === b} onClick={() => onStatus(row.userId, tid, 'granted')}>Надати</button>
                        <button className="mc-btn wait" disabled={busy === b} onClick={() => onStatus(row.userId, tid, 'data')}>Дані</button>
                        <button className="mc-btn bad" disabled={busy === b} onClick={() => onStatus(row.userId, tid, 'rejected')}>Відхилити</button>
                      </div>
                    ) : <span className="mono adm-empty">лише перегляд</span>}
                  </div>
                );
              })}
            </div>
          ) : <p className="mono adm-empty">немає запитів</p>}</Block>}

          {utab === 'data' && code && (
            <Block title="Анкета клієнта"><AuditFill code={code} editor={canAccess ? selfEmail : undefined} /></Block>
          )}
          {utab === 'data' && code && (
            <Block title="Уточнення (Крок 2)"><ExtraEditor code={code} /></Block>
          )}

          {utab === 'proj' && <Block title="Проект (ведення)"><PanelBoundary title="Проєкти"><ProjectsManager userId={row.userId} initial={getProjects(rec)} code={code} company={company?.name} /></PanelBoundary></Block>}

          {utab === 'docs' && files.length > 0 && (
            <Block title="Файли">
              <ul className="adm-files">{files.flatMap(([tid, arr]) => arr.map((f, i) => (
                <li key={tid + i}><button className="mono adm-file" onClick={() => openFile(f.path)}>📎 {tid}: {f.name}</button></li>
              )))}</ul>
            </Block>
          )}

          {utab === 'over' && <Block title="Заявки клієнта">{(() => {
            const mine = (leads || []).filter((l) => !ACCESS_SOURCES.includes(l.source || '') && (l.email || '').toLowerCase() === row.email.toLowerCase());
            if (!mine.length) return <p className="mono adm-empty">заявок від цього email немає</p>;
            return <ul className="adm-kv">{mine.map((l) => (
              <li key={l.id}><i>{rel(l.at)}{l.source ? ` · ${l.source}` : ''}</i><span>{l.task || l.comment || '—'}{l.status ? ` · ${LEAD_STAGES.find((s) => s.k === (l.status as LeadStatus))?.l || l.status}` : ''}</span></li>
            ))}</ul>;
          })()}</Block>}

          {utab === 'over' && <Block title="Історія активності">{(() => {
            const ev: { at: string; t: string }[] = [];
            if (row.record?.express?.at) ev.push({ at: row.record.express.at, t: `Пройдено експрес-аудит · ${fmt(row.record.express.total, curOf(row.record.express.input?.currency))}/рік` });
            Object.entries(row.funnel?.tierHistory || {}).forEach(([tid, list]) => (list || []).forEach((e) => ev.push({ at: e.at, t: `${tierLabel(tid)} → ${ST[e.st]?.txt ?? e.st}${e.by === 'manager' ? ' · менеджер' : ''}` })));
            if (row.funnel?.leadAt) ev.push({ at: row.funnel.leadAt, t: 'Заявка на співпрацю з кабінету' });
            if (row.updatedAt) ev.push({ at: row.updatedAt, t: 'Оновлення профілю' });
            ev.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
            if (!ev.length) return <p className="mono adm-empty">Подій ще немає — тут зʼявиться все, що робили з карткою: доступи, статуси, передані документи.</p>;
            return <ul className="adm-activity">{ev.slice(0, 20).map((e, i) => (
              <li key={i}><span className="adm-act-dot" /><span className="adm-act-t">{e.t}</span><span className="mono adm-act-at">{rel(e.at)}</span></li>
            ))}</ul>;
          })()}</Block>}

          {utab === 'over' && canDelete && (
            <div className="adm-danger">
              <span className="mono adm-empty">Небезпечна зона — прибирання тестових даних:</span>
              <button className="mc-btn bad" disabled={busy === 'del:' + row.userId} onClick={() => onDelete(row.userId, row.email)}>
                {busy === 'del:' + row.userId ? 'Видаляємо…' : 'Видалити клієнта та всі його дані'}
              </button>
            </div>
          )}
        </Suspense></PanelBoundary>
        </div>
    </section>
  );
}

/** Редактор персональних уточнень (Крок 2) для клієнта — менеджер додає ad-hoc питання. */
