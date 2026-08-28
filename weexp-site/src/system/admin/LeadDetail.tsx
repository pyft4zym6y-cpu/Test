import { useEffect, useState } from 'react';

import { setLeadDeal, type AdminRow, type LeadRow, type LeadDeal, type LeadStatus } from '@/lib/supa';
import { money as fmt, curOf, AGENCY_CUR, sysLabel, type SysKey } from '../systems';

import '../system.css';
import '../cabinet.css';
import { Block, COOP_TYPES, LEAD_STAGES, SaveBadge, stageOf } from './shared';
import { useAutosave } from './useAutosave';
import { auditStatusOf, nextStep, phaseOf, slaOf, PHASES, STAGE_OF } from './auditRequests';

export function LeadDetail({ lead, allRows, onClose, onStatus, onDeal, onConvert, onOpenClient, onDelete, busy }: { lead?: LeadRow; allRows: AdminRow[]; onClose: () => void; onStatus: (id: string, s: LeadStatus) => void;
  /** Повідомити батька про збережену угоду, щоб список не показував старе. */
  onDeal: (id: string, d: LeadDeal) => void; onConvert: (l: LeadRow) => void; onOpenClient: (userId: string) => void; onDelete: (id: string) => void; busy: string }) {
  /**
   * Чек-лист угоди був єдиним редактором, що лишився поза автозбереженням:
   * ручна кнопка, прапорець `dirty` — і жодного захисту. Клік повз шторку, ✕ або
   * Esc з незбереженими умовами угоди — дані зникали мовчки. Тепер той самий
   * хук, що й скрізь: дебаунс, попередження при закритті вкладки, збереження
   * при демонтажі, помилка з кнопкою «Повторити».
   */
  const [deal, setDeal] = useState<LeadDeal>(lead?.deal || {});
  const leadId = lead?.id || '';
  const auto = useAutosave<LeadDeal>(async (d) => {
    if (!leadId) return { ok: false, error: 'Заявка без id' };
    const r = await setLeadDeal(leadId, d);
    if (r.ok) onDeal(leadId, d);   // синхронізуємо список у батька
    return r;
  }, 1200);
  useEffect(() => { setDeal(lead?.deal || {}); }, [lead?.id]);
  // Закриття шторки з незбереженим — спершу дозберігаємо.
  const closeSafely = () => { void auto.flush().finally(onClose); };
  if (!lead) return null;
  const cur = stageOf(lead);
  const patchDeal = (p: Partial<LeadDeal>) => { setDeal((d) => { const next = { ...d, ...p }; auto.touch(next); return next; }); };
  // Звʼязок «заявка → клієнт»: шукаємо зареєстрований акаунт за email заявки.
  const client = lead.email ? allRows.find((r) => (r.email || '').toLowerCase() === lead.email!.toLowerCase()) : undefined;
  const ex = client?.record?.express;
  const rows: [string, string | undefined][] = [
    ['Дата', lead.at ? new Date(lead.at).toLocaleString('uk-UA') : undefined],
    ['Джерело', lead.source],
    ['Email', lead.email],
    ['Телефон', lead.phone],
    ['Імʼя', lead.name],
    ['Роль', lead.role],
    ['Магазин / сайт', lead.store],
    ['Оборот / міс', lead.turnover],
    ['Задача', lead.task],
    ['Терміни', lead.timeline],
    ['Бюджет', lead.budget],
  ];
  return (
    <div className="adm-drawer-wrap" onClick={closeSafely}>
      <aside className="adm-drawer" role="dialog" aria-modal="true" aria-label="Картка заявки" onClick={(e) => e.stopPropagation()}>
        <div className="adm-drawer-head">
          <a className="adm-email adm-mail" href={`mailto:${lead.email || ''}`}>{lead.email || lead.phone || 'Заявка'}</a>
          <SaveBadge state={auto.state} error={auto.error} savedAt={auto.savedAt} onRetry={auto.flush} />
          <button className="adm-x" onClick={closeSafely} aria-label="Закрити" title="Закрити">✕</button>
        </div>
        <div className="adm-drawer-body">
          <Block title="Стадія CRM">
            <div className="adm-stage-pick">
              {LEAD_STAGES.map((s) => (
                <button key={s.k} className={`adm-stage-b tst-${s.cls}${cur === s.k ? ' on' : ''}`} disabled={busy === 'lead:' + lead.id}
                  onClick={() => cur !== s.k && onStatus(lead.id || '', s.k)}>{s.l}</button>
              ))}
            </div>
          </Block>

          <Block title="Чек-лист угоди">
            <div className="adm-deal">
              <label className="adm-deal-row">
                <span className="adm-deal-l mono">Тип співпраці</span>
                <div className="adm-deal-opts">
                  {COOP_TYPES.map((c) => (
                    <button key={c.k} className={`mc-btn sm${deal.coopType === c.k ? ' ok' : ''}`} onClick={() => patchDeal({ coopType: deal.coopType === c.k ? undefined : c.k })}>{c.l}</button>
                  ))}
                </div>
              </label>
              {deal.coopType === 'other' && (
                <label className="adm-deal-row">
                  <span className="adm-deal-l mono">Який саме</span>
                  <input className="adm-deal-inp" value={deal.coopForm || ''} onChange={(e) => patchDeal({ coopForm: e.target.value })} placeholder="Напр.: SEO-супровід, розробка…" />
                </label>
              )}
              {deal.coopType !== 'other' && (
                <label className="adm-deal-row">
                  <span className="adm-deal-l mono">Форма співпраці</span>
                  <input className="adm-deal-inp" value={deal.coopForm || ''} onChange={(e) => patchDeal({ coopForm: e.target.value })} placeholder="Напр.: фікс за пакет / помісячний retainer" />
                </label>
              )}
              <label className="adm-deal-row">
                <span className="adm-deal-l mono">До чого домовились</span>
                <textarea className="adm-deal-ta" rows={3} value={deal.agreed || ''} onChange={(e) => patchDeal({ agreed: e.target.value })} placeholder="Обсяг, строки, ціна, наступний крок…" />
              </label>
              <div className="adm-deal-flags">
                <button className={`mc-btn sm${deal.contractSigned ? ' ok' : ''}`} onClick={() => patchDeal({ contractSigned: !deal.contractSigned })}>
                  {deal.contractSigned ? '✓ Договір укладено' : 'Договір не укладено'}
                </button>
                <button className={`mc-btn sm${deal.paidFirst ? ' ok' : ''}`} onClick={() => patchDeal({ paidFirst: !deal.paidFirst })}>
                  {deal.paidFirst ? '✓ Первинна оплата отримана' : 'Первинна оплата відсутня'}
                </button>
              </div>
              <div className="adm-deal-save">
                <button className="mc-btn ok" disabled={auto.state === 'saving' || auto.state === 'idle'} onClick={() => void auto.flush()}>
                  {auto.state === 'saving' ? 'Зберігаємо…' : auto.state === 'dirty' ? 'Зберегти зараз' : '✓ Збережено'}
                </button>
                {deal.projectId && <span className="mono adm-deal-linked">🔗 Звʼязано з проектом</span>}
              </div>
            </div>
          </Block>

          {/*
            * Блок показувався ЛИШЕ на стадії «Завершена». Менеджер, дивлячись
            * на «Нову» заявку, не бачив ні кнопки, ні натяку, що переведення в
            * проект узагалі існує — звідси питання «як перевести клієнта з
            * воронки в проект». Тепер крок видно завжди: якщо ще рано або
            * немає кабінету, блок каже, ЧОГО саме бракує, замість того щоб
            * зникнути. Правило «проект створюємо із завершеної заявки»
            * лишається — воно просто перестало бути невидимим.
            */}
          <Block title="Наступний крок">
            {deal.projectId ? (
                <div className="adm-deal-conv">
                  <p className="mono adm-empty">Проект уже створено з цієї заявки.</p>
                  <button className="mc-btn ok" onClick={() => onConvert(lead)}>Відкрити проект клієнта →</button>
                </div>
              ) : cur !== 'done' ? (
                <div className="adm-deal-conv">
                  <p className="mono adm-empty">
                    Проект створюється із <b>завершеної</b> заявки. Зараз стадія — «{LEAD_STAGES.find((x) => x.k === cur)?.l || cur}»:
                    переведіть заявку в «Завершена» (кнопки стадій угорі картки), і тут зʼявиться кнопка.
                  </p>
                  <button className="mc-btn ok" onClick={() => lead.id && onStatus(lead.id, 'done')}>Позначити завершеною →</button>
                </div>
              ) : !client ? (
                <div className="adm-deal-conv">
                  <p className="mono adm-empty">
                    Проект створюється в кабінеті клієнта, а кабінету з поштою <b>{lead.email || '—'}</b> ще немає.
                    Запросіть клієнта зареєструватись цією ж поштою — після цього кнопка запрацює.
                  </p>
                </div>
              ) : (
                <div className="adm-deal-conv">
                  <p className="mono adm-empty">Заявка завершена — переведіть її в проект: створимо проект у «Проектах», підтягнемо клієнта, компанію і умови угоди. Заявка залишиться в CRM.</p>
                  <button className="mc-btn ok" disabled={busy === 'conv:' + lead.id} onClick={() => onConvert(lead)}>
                    {busy === 'conv:' + lead.id ? 'Створюємо проект…' : '⇢ Перевести в проєкти'}
                  </button>
                </div>
              )}
          </Block>
          <Block title="Заявка">
            <ul className="adm-kv">
              {rows.filter(([, v]) => v).map(([k, v]) => <li key={k}><i>{k}</i><span>{v}</span></li>)}
            </ul>
          </Block>
          {lead.comment && <Block title="Коментар / проблема"><p className="adm-longtext">{lead.comment}</p></Block>}

          {/* Дві воронки — заявки і аудит — стояли поруч без стику: із картки
              заявки не було видно, що клієнт уже пройшов половину аудиту. */}
          {client && (() => {
            const st = auditStatusOf(client);
            if (!st) return null;
            const step = nextStep(client);
            const sla = slaOf(client);
            return (
              <Block title="Цей клієнт в аудиті">
                <ul className="adm-kv">
                  <li><i>Фаза</i><span>{PHASES[phaseOf(st)].l}</span></li>
                  <li><i>Стадія</i><span><span className={`cab-badge mono tst-${STAGE_OF[st].cls}`}>{STAGE_OF[st].l}</span></span></li>
                  <li><i>Хід за</i><span className={step.who === 'ми' ? 'tst-bad' : ''}>{step.who === 'ми' ? 'нами' : 'клієнтом'}</span></li>
                  {sla.state !== 'ok' && <li><i>Без руху</i><span className={sla.state === 'breach' ? 'tst-bad' : ''}>{sla.days} дн. (норматив {sla.limit})</span></li>}
                </ul>
                <p className="mono adm-hint">{step.text}</p>
              </Block>
            );
          })()}

          {client ? (
            <Block title="Профіль клієнта">
              {ex ? (
                <div className="adm-lead-client">
                  <div className="adm-lead-ex">
                    <b className="adm-money">{fmt(ex.total, curOf(ex.input?.currency))}<i> / рік</i></b>
                    <span className="mono adm-express-sub">{sysLabel(ex.primary as SysKey, 'uk')} · Health {ex.overallHealth}/100 · {new Date(ex.at).toLocaleDateString('uk-UA')}</span>
                  </div>
                  {ex.symptoms && ex.symptoms.length > 0 && <div className="adm-sym-tags">{ex.symptoms.slice(0, 6).map((s) => <span key={s} className="adm-sym">{sysLabel(s as SysKey, 'uk')}</span>)}</div>}
                  <button className="mc-btn ok" onClick={() => onOpenClient(client.userId)}>Відкрити повну картку клієнта →</button>
                </div>
              ) : (
                <div className="adm-lead-client">
                  <p className="mono adm-empty">Клієнт зареєстрований, але експрес-аудит ще не привʼязаний.</p>
                  <button className="mc-btn" onClick={() => onOpenClient(client.userId)}>Відкрити картку клієнта →</button>
                </div>
              )}
            </Block>
          ) : (
            <Block title="Профіль клієнта"><p className="mono adm-empty">Немає зареєстрованого акаунту з цим email (клієнт не заводив кабінет).</p></Block>
          )}

          {lead.diag && <Block title="Результат діагностики (X-Ray)"><pre className="adm-pre">{lead.diag}</pre></Block>}
          {lead.calc && <Block title="Розрахунок калькулятора"><pre className="adm-pre">{lead.calc}</pre></Block>}

          <div className="adm-danger">
            <button className="mc-btn bad" disabled={busy === 'del:' + lead.id} onClick={() => lead.id && onDelete(lead.id)}>
              {busy === 'del:' + lead.id ? 'Видаляємо…' : 'Видалити заявку'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

