import { useEffect, useState } from 'react';
import { clientAccessApi, type ClientAccess } from '@/lib/supa';
import { toast } from '@/lib/toast';

/**
 * Доступ клієнта до сервісу ведення проєкту — з картки клієнта.
 *
 * Самореєстрації в сервісі немає: там лежать дані проєктів, і відкритий вхід
 * означав би, що будь-хто з інтернету заводить у ньому акаунт. Логін і пароль
 * задає менеджер і передає клієнту сам.
 *
 * Пошти в цьому шляху немає жодної — ні запрошень, ні листів зі зміною пароля.
 * Це знімає залежність від SMTP: доступ працює одразу й не ламається, коли лист
 * не дійшов або потрапив у спам. Ціна — пароль треба передати людині власноруч,
 * і тому він показується тут рівно один раз, поки менеджер його не скопіював.
 *
 * Усі дії йдуть через /api/client-access: сервісний ключ Supabase живе лише на
 * сервері. Ролей ендпоінт не видає й над акаунтами команди влади не має.
 */
export function ClientAccessPanel({ email }: { email?: string }) {
  const [state, setState] = useState<ClientAccess | null>(null);
  const [busy, setBusy] = useState('');
  const [pwd, setPwd] = useState('');
  const [mode, setMode] = useState<'' | 'create' | 'change'>('');

  const refresh = async () => {
    if (!email) return;
    const r = await clientAccessApi('status', { email });
    if (r.error) { setState(null); return; }
    setState({ exists: !!r.exists, staff: r.staff, confirmed: r.confirmed, banned: r.banned, lastSignIn: r.lastSignIn });
  };
  useEffect(() => { void refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [email]);

  const run = async (action: 'create' | 'set_password' | 'revoke' | 'restore', extra: { password?: string } = {}) => {
    if (!email) return;
    setBusy(action);
    const r = await clientAccessApi(action, { email, ...extra });
    setBusy('');
    if (r.error) { toast(r.error, 'err'); return; }
    toast({
      create: '✓ Обліковий запис створено',
      set_password: '✓ Пароль змінено',
      revoke: '✓ Доступ забрано',
      restore: '✓ Доступ повернуто',
    }[action]);
    setMode('');
    void refresh();
  };

  if (!email) return <p className="adm-hint mono">Спершу вкажіть email клієнта — він і буде логіном.</p>;

  if (state?.staff) {
    return <p className="adm-hint mono">{email} — акаунт команди. Ролі змінюються в розділі «Команда».</p>;
  }

  return (
    <div className="adm-cacc">
      <div className="adm-cacc-state">
        <span className="mono">Доступ до сервісу</span>
        {state === null ? <b className="mono">—</b>
          : !state.exists ? <b className="mono adm-cacc-no">не відкрито</b>
          : state.banned ? <b className="mono adm-cacc-no">забрано</b>
          : <b className="mono adm-cacc-ok">активний</b>}
        {state?.exists && (
          <span className="mono adm-cacc-last">
            {state.lastSignIn ? `останній вхід ${new Date(state.lastSignIn).toLocaleDateString('uk-UA')}` : 'ще не заходив'}
          </span>
        )}
      </div>
      <p className="adm-hint mono">Логін — {email}. Пароль задаєте ви й передаєте клієнту особисто.</p>

      <div className="adm-cacc-acts">
        {!state?.exists && (
          <button className="mc-btn ok" disabled={!!busy} onClick={() => { setPwd(''); setMode(mode === 'create' ? '' : 'create'); }}>
            {mode === 'create' ? 'Сховати' : 'Створити обліковий запис'}
          </button>
        )}
        {state?.exists && !state.banned && (
          <>
            <button className="mc-btn" disabled={!!busy} onClick={() => { setPwd(''); setMode(mode === 'change' ? '' : 'change'); }}>
              {mode === 'change' ? 'Сховати' : 'Змінити пароль'}
            </button>
            <button className="mc-btn danger" disabled={!!busy} onClick={() => run('revoke')}>Забрати доступ</button>
          </>
        )}
        {state?.exists && state.banned && (
          <button className="mc-btn ok" disabled={!!busy} onClick={() => run('restore')}>Повернути доступ</button>
        )}
      </div>

      {mode && <PasswordForm
        busy={!!busy}
        cta={mode === 'create' ? 'Створити' : 'Змінити пароль'}
        value={pwd}
        onChange={setPwd}
        onSubmit={() => run(mode === 'create' ? 'create' : 'set_password', { password: pwd })}
      />}
    </div>
  );
}

/** Мінімальна довжина: пароль передається в переписці й живе довше за придуманий собі. */
export const PWD_MIN = 10;

/**
 * Поле пароля з генератором.
 *
 * Генератор тут не прикраса: пароль, який менеджер вигадує на ходу для двадцяти
 * клієнтів, у підсумку виявляється одним і тим самим. Кнопка «Згенерувати» —
 * найдешевший спосіб цього не допустити.
 */
export function PasswordForm({ busy, cta, value, onChange, onSubmit }: {
  busy: boolean; cta: string; value: string; onChange: (v: string) => void; onSubmit: () => void;
}) {
  return (
    <div className="adm-cacc-pwd">
      <label className="sysx-inp">
        <span className="sysx-inp-l">Пароль (мінімум {PWD_MIN} символів)</span>
        {/* type=text свідомо: менеджер має бачити те, що передає клієнту.
            Ховати пароль, який усе одно доведеться продиктувати, — театр. */}
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" spellCheck={false} />
      </label>
      <div className="adm-cacc-pwd-row">
        <button type="button" className="mc-btn" onClick={() => onChange(genPassword())}>Згенерувати</button>
        <button type="button" className="mc-btn" disabled={!value} onClick={() => { void navigator.clipboard?.writeText(value); toast('✓ Скопійовано'); }}>Скопіювати</button>
        <button type="button" className="mc-btn ok" disabled={busy || value.length < PWD_MIN} onClick={onSubmit}>{cta}</button>
      </div>
      <p className="adm-hint mono">Передайте пароль клієнту безпечним каналом. Після збереження побачити його тут уже не можна.</p>
    </div>
  );
}

/**
 * Пароль із crypto, а не з Math.random.
 *
 * Math.random не криптографічний: послідовність передбачувана, і паролі, видані
 * підряд, пов'язані між собою. Для того, що відкриває дані клієнта, це не
 * годиться. Алфавіт без 0/O та 1/l/I — пароль диктують уголос.
 */
export function genPassword(len = 14): string {
  const A = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => A[n % A.length]).join('');
}
