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
import { loadTemplate, uid, Q_TYPES, type AuditTemplate, type Question, type Block } from '../auditTemplate';
import { ACCESS_CATALOG, ACCESS_METHOD_LABEL } from '@/data/accessCatalog';
import { PACK_ARTIFACTS, PACK_REPORTS, chaptersOf, TOTAL_CHAPTERS } from '@/data/auditPack';
import '../system.css';
import '../cabinet.css';
import { ALL_ROLES } from './shared';


export function TeamManager({ selfEmail }: { selfEmail: string }) {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [nEmail, setNEmail] = useState('');
  const [nPass, setNPass] = useState('');
  const [nRole, setNRole] = useState<Role>('manager');
  const load = () => { setMsg(''); teamApi('list').then((r) => { if (r.users) setMembers(r.users); else { setMembers([]); setMsg(r.error || 'Не вдалося завантажити список'); } }); };
  useEffect(load, []);
  const run = async (action: string, payload: Record<string, unknown>, key: string) => {
    setBusy(key); const r = await teamApi(action, payload); setBusy('');
    if (r.error) { setMsg('✕ ' + r.error); toast('Помилка: ' + r.error, 'err'); return false; }
    setMsg('✓ Готово'); toast('✓ Готово'); load(); return true;
  };
  const create = async () => {
    if (!nEmail.trim()) { setMsg('Вкажіть email'); return; }
    if (nPass && nPass.length < 8) { setMsg('Пароль — мінімум 8 символів (або залиште порожнім, щоб призначити роль існуючому)'); return; }
    // Порожній пароль → призначити роль існуючому акаунту; з паролем → створити новий.
    if (await run('create', { email: nEmail.trim(), password: nPass || undefined, role: nRole }, 'create')) { setNEmail(''); setNPass(''); }
  };
  const invite = async () => {
    if (!nEmail.trim()) { setMsg('Вкажіть email'); return; }
    if (await run('invite', { email: nEmail.trim(), role: nRole }, 'invite')) setNEmail('');
  };
  return (
    <div className="pj-card">
      <h2 className="pj-h2">Керування командою</h2>
      <p className="pj-sub mono">Створення адмінів, ролі, блокування — через захищений сервер. Ролі зберігаються в акаунті (Supabase Auth). Доступно лише Super Admin.</p>
      {msg && <p className="mono adm-fill-au" style={{ marginBottom: 8 }}>{msg}</p>}

      <div className="adm-team-add">
        <input className="ab-inp" type="email" placeholder="email нового адміна" value={nEmail} onChange={(e) => setNEmail(e.target.value)} />
        <select className="ab-sel" value={nRole} onChange={(e) => setNRole(e.target.value as Role)}>
          {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <input className="ab-inp" type="text" placeholder="пароль (мін. 8) — порожньо = призначити роль існуючому" value={nPass} onChange={(e) => setNPass(e.target.value)} />
        <button className="mc-btn ok" disabled={busy === 'create'} onClick={create}>{busy === 'create' ? '…' : (nPass ? '+ Створити' : '+ Призначити роль')}</button>
        <button className="mc-btn" disabled={busy === 'invite'} onClick={invite} title="Надіслати інвайт-лист (потрібен SMTP у Supabase)">✉ Інвайт</button>
      </div>

      {members === null ? <p className="mono adm-empty">Завантаження…</p> : members.length === 0 ? <p className="mono adm-empty">Членів команди з роллю ще немає (або не налаштовано сервер).</p> : (
        <div className="adm-team-tbl">
          <div className="adm-team-row2 adm-team-th"><span>Email</span><span>Роль</span><span>Стан</span><span>Дії</span></div>
          {members.map((m) => {
            const isSelf = m.email.toLowerCase() === selfEmail.toLowerCase();
            const isBootstrap = MANAGER_EMAILS.includes(m.email.toLowerCase());
            return (
              <div key={m.id} className="adm-team-row2">
                <span className="mono">{m.email}{isSelf ? ' (ви)' : ''}</span>
                <span>
                  <select className="ab-sel sm" value={m.role || 'manager'} disabled={isBootstrap || busy === 'role:' + m.id} onChange={(e) => run('set_role', { userId: m.id, email: m.email, role: e.target.value }, 'role:' + m.id)}>
                    {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                </span>
                <span className="mono">{m.banned ? '🚫 заблоковано' : m.confirmed ? '✓ активний' : '⏳ не підтверджено'}</span>
                <span className="adm-team-acts">
                  <button className="mc-btn ghost" disabled={busy === 'reset:' + m.id} onClick={() => run('reset', { email: m.email }, 'reset:' + m.id)} title="Надіслати лист скидання пароля">🔑</button>
                  {!isBootstrap && !isSelf && <button className="mc-btn ghost" disabled={busy === 'ban:' + m.id} onClick={() => run('ban', { userId: m.id, banned: !m.banned }, 'ban:' + m.id)}>{m.banned ? 'Розблок.' : 'Блок'}</button>}
                  {!isBootstrap && !isSelf && <button className="mc-btn bad" disabled={busy === 'rm:' + m.id} onClick={() => { if (confirm(`Видалити адміна ${m.email}?`)) run('remove', { userId: m.id, email: m.email }, 'rm:' + m.id); }}>✕</button>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

