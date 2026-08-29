import { useEffect, useState } from 'react';
import { clientAccessApi, type ClientAccount } from '@/lib/supa';
import { PasswordForm, PWD_MIN, genPassword } from '@/system/admin/ClientAccessPanel';
import { toast } from '@/lib/toast';

/**
 * «Облікові записи» — усі доступи клієнтів у сервіс ведення проєкту.
 *
 * Той самий доступ можна відкрити з картки клієнта, і там це доречніше: заводиш
 * доступ тому, з ким саме працюєш. Але коли треба відповісти на питання «а хто
 * взагалі має вхід» або «цей клієнт заходив хоч раз», ходити по картках не
 * годиться — потрібен один список.
 *
 * Акаунтів КОМАНДИ тут немає: вони живуть у «Налаштування → Команда», бо в них
 * є ролі, і показувати їх поруч із клієнтськими означало б запрошувати помилку —
 * зняти доступ не тому. Ендпоінт їх і не віддає.
 */
export function AccountsPanel() {
  const [rows, setRows] = useState<ClientAccount[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [q, setQ] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const r = await clientAccessApi('list');
    if (r.error) { setErr(r.error); setRows([]); return; }
    setErr(''); setRows(r.users || []);
  };
  useEffect(() => { void load(); }, []);

  const act = async (action: 'revoke' | 'restore' | 'set_password', email: string, password?: string) => {
    setBusy(email + ':' + action);
    const r = await clientAccessApi(action, { email, ...(password ? { password } : {}) });
    setBusy('');
    if (r.error) { toast(r.error, 'err'); return; }
    toast({ revoke: '✓ Доступ забрано', restore: '✓ Доступ повернуто', set_password: '✓ Пароль змінено' }[action]);
    void load();
  };

  const create = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) { toast('Вкажіть email — він і буде логіном', 'err'); return; }
    setBusy('new');
    const r = await clientAccessApi('create', { email, password: pwd });
    setBusy('');
    if (r.error) { toast(r.error, 'err'); return; }
    toast('✓ Обліковий запис створено. Передайте логін і пароль клієнту.');
    setNewEmail(''); setPwd(''); setAdding(false);
    void load();
  };

  const list = (rows || []).filter((u) => !q || u.email.toLowerCase().includes(q.toLowerCase()));
  const date = (s: string | null) => (s ? new Date(s).toLocaleDateString('uk-UA') : '—');

  return (
    <div className="adm-acc">
      {/* Той самий заголовок, що й в інших розділах консолі: adm-h2 не існує
          в стилях, і рядок виходив кремовим по кремовому — майже невидимим. */}
      <div className="adm-acc-head adm-sec-head">
        <div>
          <h1 className="sysx-display adm-h1">Облікові записи</h1>
          <p className="adm-hint mono">
            Логін — email клієнта, пароль задаєте ви й передаєте особисто.
            Ні запрошень, ні листів зі зміною пароля сервіс не надсилає.
          </p>
        </div>
        <button className="mc-btn ok" onClick={() => { setAdding((v) => !v); setPwd(''); }}>
          {adding ? 'Сховати' : '+ Новий доступ'}
        </button>
      </div>

      {adding && (
        <div className="adm-acc-new">
          <label className="sysx-inp">
            <span className="sysx-inp-l">Логін (email клієнта)</span>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="off" />
          </label>
          <PasswordForm busy={busy === 'new'} cta="Створити доступ" value={pwd} onChange={setPwd} onSubmit={create} />
        </div>
      )}

      {err && <p className="mc-msg">{err}</p>}
      {rows === null && <p className="adm-empty mono">Завантаження…</p>}
      {rows !== null && !rows.length && !err && (
        <p className="adm-empty mono">Жодного клієнтського доступу ще не створено.</p>
      )}

      {!!rows?.length && (
        <>
          <input className="adm-search" placeholder="Пошук за email…" value={q} onChange={(e) => setQ(e.target.value)} />
          <table className="adm-table adm-acc-t">
            <thead>
              <tr><th>Логін</th><th>Стан</th><th>Створено</th><th>Останній вхід</th><th /></tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <AccountRow key={u.id} u={u} busy={busy} date={date} onAct={act} />
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function AccountRow({ u, busy, date, onAct }: {
  u: ClientAccount; busy: string; date: (s: string | null) => string;
  onAct: (a: 'revoke' | 'restore' | 'set_password', email: string, password?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState('');
  return (
    <>
      <tr className={u.banned ? 'is-off' : ''}>
        <td><b>{u.email}</b></td>
        <td><span className={'mono ' + (u.banned ? 'adm-cacc-no' : 'adm-cacc-ok')}>{u.banned ? 'забрано' : 'активний'}</span></td>
        <td className="mono">{date(u.createdAt)}</td>
        {/* «Ще не заходив» — не порожньо: це відповідь на питання, чи дійшов
            пароль до клієнта взагалі. Прочерк на це питання не відповідає. */}
        <td className="mono">{u.lastSignIn ? date(u.lastSignIn) : 'ще не заходив'}</td>
        <td className="adm-acc-acts">
          {!u.banned && (
            <button className="mc-btn" disabled={!!busy} onClick={() => { setPwd(genPassword()); setOpen((v) => !v); }}>
              {open ? 'Сховати' : 'Змінити пароль'}
            </button>
          )}
          {u.banned
            ? <button className="mc-btn ok" disabled={!!busy} onClick={() => onAct('restore', u.email)}>Повернути</button>
            : <button className="mc-btn danger" disabled={!!busy} onClick={() => onAct('revoke', u.email)}>Забрати</button>}
        </td>
      </tr>
      {open && (
        <tr><td colSpan={5}>
          <PasswordForm
            busy={busy === u.email + ':set_password'}
            cta="Зберегти пароль"
            value={pwd}
            onChange={setPwd}
            onSubmit={() => { if (pwd.length >= PWD_MIN) { onAct('set_password', u.email, pwd); setOpen(false); } }}
          />
        </td></tr>
      )}
    </>
  );
}
