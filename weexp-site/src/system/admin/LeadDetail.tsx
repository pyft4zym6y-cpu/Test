import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  currentUser, isManager, listAllDiagnostics, listLeads, setTierStatusFor, clearTierStatusFor, setLeadStatus, setLeadDeal, deleteLead, deleteDiagnostics, signTierFile, CONFIGURED,
  findAuditIdByCode, loadAuditAnswers, loadAuditExtra, saveAuditExtra,
  saveProjectsFor, saveAssessmentFor, savePatchFor, runWorkerAudit, uploadAdminFile, deleteAdminFile, maturityToAssessment, sendFindingReviews, loadLearningSnapshot, emptyProject, getProjects, loadPmDirectory, savePmDirectory, aiDraftProject, aiScoreAudit, aiSufficiency, type SufficiencyVerdict, type SharedDoc,
  type ModuleScore, type DiagRecord, type AccessState, type ProjectNote, type AuditJobRef, type AdminFile, type WorkerMaturity, type ReviewableFinding, type FindingReview, type LearningSnapshot, type AuditDoc, type AuditDocSection, type AuditDocVersion, type PackState,
  MANAGER_EMAILS, TEAM_ROLES, ROLE_LABEL, roleOf, can, teamApi, MATURITY_DOMAIN_MODULE, type Role, type TeamMember, type DiagUser, type AdminRow, type LeadRow, type LeadDeal, type TierStatus, type LeadStatus, type AuditAnswer, type ExtraQ,
  type Project, type ProjTask, type ProjMember, type ProjPayment, type ProjMonth, type ProjTariffItem,
  type PmDirectory, type PmSpecialist, type PmRoleRate,
} from '@/lib/supa';
import { eur, sysLabel, actionText, type SysKey } from '../lossModel';
import { toast } from '@/lib/toast';
import { useCabTheme, ThemeToggle } from '@/lib/cabTheme';
import { AuditBuilder } from '../AuditBuilder';
import { loadTemplate, uid, Q_TYPES, type AuditTemplate, type Question } from '../auditTemplate';
import { ACCESS_CATALOG, ACCESS_METHOD_LABEL } from '@/data/accessCatalog';
import { PACK_ARTIFACTS, PACK_REPORTS, chaptersOf, TOTAL_CHAPTERS } from '@/data/auditPack';
import '../system.css';
import '../cabinet.css';
import { Block, COOP_TYPES, LEAD_STAGES, stageOf } from './shared';


export function LeadDetail({ lead, allRows, onClose, onStatus, onDeal, onConvert, onOpenClient, onDelete, busy }: { lead?: LeadRow; allRows: AdminRow[]; onClose: () => void; onStatus: (id: string, s: LeadStatus) => void; onDeal: (id: string, d: LeadDeal) => void; onConvert: (l: LeadRow) => void; onOpenClient: (userId: string) => void; onDelete: (id: string) => void; busy: string }) {
  // Локальний чернетковий стан чек-листа угоди — зберігається кнопкою.
  const [deal, setDeal] = useState<LeadDeal>(lead?.deal || {});
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setDeal(lead?.deal || {}); setDirty(false); }, [lead?.id]);
  if (!lead) return null;
  const cur = stageOf(lead);
  const patchDeal = (p: Partial<LeadDeal>) => { setDeal((d) => ({ ...d, ...p })); setDirty(true); };
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
    <div className="adm-drawer-wrap" onClick={onClose}>
      <aside className="adm-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="adm-drawer-head">
          <a className="adm-email adm-mail" href={`mailto:${lead.email || ''}`}>{lead.email || lead.phone || 'Заявка'}</a>
          <button className="adm-x" onClick={onClose} aria-label="Закрити" title="Закрити">✕</button>
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
                <button className="mc-btn ok" disabled={!dirty || busy === 'deal:' + lead.id} onClick={() => { onDeal(lead.id || '', deal); setDirty(false); }}>
                  {busy === 'deal:' + lead.id ? 'Зберігаємо…' : dirty ? 'Зберегти чек-лист' : '✓ Збережено'}
                </button>
                {deal.projectId && <span className="mono adm-deal-linked">🔗 Звʼязано з проектом</span>}
              </div>
            </div>
          </Block>

          {cur === 'done' && (
            <Block title="Наступний крок">
              {deal.projectId ? (
                <div className="adm-deal-conv">
                  <p className="mono adm-empty">Проект уже створено з цієї заявки.</p>
                  <button className="mc-btn ok" onClick={() => onConvert(lead)}>Відкрити проект клієнта →</button>
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
          )}
          <Block title="Заявка">
            <ul className="adm-kv">
              {rows.filter(([, v]) => v).map(([k, v]) => <li key={k}><i>{k}</i><span>{v}</span></li>)}
            </ul>
          </Block>
          {lead.comment && <Block title="Коментар / проблема"><p className="adm-longtext">{lead.comment}</p></Block>}

          {client ? (
            <Block title="Профіль клієнта">
              {ex ? (
                <div className="adm-lead-client">
                  <div className="adm-lead-ex">
                    <b className="adm-money">{eur(ex.total)}<i> / рік</i></b>
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

