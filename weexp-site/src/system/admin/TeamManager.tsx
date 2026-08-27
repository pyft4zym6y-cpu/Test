import { useEffect, useState } from 'react';
import { askConfirm } from './dialog';

import { MANAGER_EMAILS, ROLE_LABEL, teamApi, type Role, type TeamMember } from '@/lib/supa';

import { toast } from '@/lib/toast';

import '../system.css';
import '../cabinet.css';
import { ALL_ROLES } from './shared';

export function TeamManager({ selfEmail }: { selfEmail: string }) {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [nEmail, setNEmail] = useState('');
  const [nPass, setNPass] = useState('');
  // Пароль не має світитися на екрані й потрапляти в автозаповнення як звичайний текст.
  const [showPass, setShowPass] = useState(false);
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
        <span className="adm-pass">
          <input className="ab-inp" type={showPass ? 'text' : 'password'} autoComplete="new-password"
            placeholder="пароль (мін. 8) — порожньо = призначити роль існуючому" value={nPass} onChange={(e) => setNPass(e.target.value)} />
          <button type="button" className="mc-btn sm ghost" onClick={() => setShowPass((v) => !v)} title={showPass ? 'Сховати' : 'Показати'}>{showPass ? '🙈' : '👁'}</button>
        </span>
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
                  {/* Зміна ролі — з підтвердженням: раніше спрацьовувала одразу
                      на onChange, і промах у списку тихо міняв чужі права.
                      Свою роль змінити не можна (сервер теж це відхилить). */}
                  <select className="ab-sel sm" value={m.role || 'manager'} disabled={isBootstrap || isSelf || busy === 'role:' + m.id}
                    onChange={async (e) => {
                      const next = e.target.value as Role;
                      const cur = (m.role || 'manager') as Role;
                      e.target.value = cur;   // відкат, поки не підтвердили
                      if (next === cur) return;
                      const ok = await askConfirm({
                        title: `Змінити роль ${m.email}?`,
                        text: `${ROLE_LABEL[cur]} → ${ROLE_LABEL[next]}. Права зміняться негайно.`,
                        confirmLabel: 'Змінити роль',
                      });
                      if (ok) run('set_role', { userId: m.id, email: m.email, role: next }, 'role:' + m.id);
                    }}>
                    {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                </span>
                <span className="mono">{m.banned ? '🚫 заблоковано' : m.confirmed ? '✓ активний' : '⏳ не підтверджено'}</span>
                <span className="adm-team-acts">
                  <button className="mc-btn ghost" disabled={busy === 'reset:' + m.id} onClick={() => run('reset', { email: m.email }, 'reset:' + m.id)} title="Надіслати лист скидання пароля">🔑</button>
                  {!isBootstrap && !isSelf && <button className="mc-btn ghost" disabled={busy === 'ban:' + m.id}
                    onClick={async () => { if (await askConfirm({ title: m.banned ? `Розблокувати ${m.email}?` : `Заблокувати ${m.email}?`, text: m.banned ? 'Доступ повернеться негайно.' : 'Вхід буде закрито негайно.', confirmLabel: m.banned ? 'Розблокувати' : 'Заблокувати', tone: m.banned ? 'ok' : 'bad' })) run('ban', { userId: m.id, banned: !m.banned }, 'ban:' + m.id); }}>{m.banned ? 'Розблок.' : 'Блок'}</button>}
                  {!isBootstrap && !isSelf && <button className="mc-btn bad" disabled={busy === 'rm:' + m.id} onClick={async () => { if (await askConfirm({ title: `Видалити адміна ${m.email}?`, text: 'Обліковий запис втратить доступ до адмінки негайно.', confirmLabel: 'Видалити', tone: 'bad' })) run('remove', { userId: m.id, email: m.email }, 'rm:' + m.id); }} aria-label={`Видалити адміністратора ${m.email}`} title="Видалити адміністратора">✕</button>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

