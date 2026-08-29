import { useEffect, useState } from 'react';
import { clientAccessApi, type ClientAccess } from '@/lib/supa';
import { APP_ORIGIN } from '@/lib/origins';
import { toast } from '@/lib/toast';

/**
 * Доступ клієнта до сервісу ведення проєкту — з картки клієнта.
 *
 * Самореєстрації в сервісі немає: там лежать дані проєктів, і відкритий вхід
 * означав би, що будь-хто з інтернету заводить у ньому акаунт. Тому доступ
 * відкриває менеджер — звідси, не виходячи з картки, з якою й так працює.
 *
 * Усі дії йдуть через /api/client-access: сервісний ключ Supabase живе лише на
 * сервері й у бандл не потрапляє. Ролі команди цей ендпоінт не видає взагалі, а
 * над акаунтами команди не має влади — інакше «блок про клієнтів» став би
 * способом забрати чужий доступ усередині агенції.
 */
export function ClientAccessPanel({ email }: { email?: string }) {
  const [state, setState] = useState<ClientAccess | null>(null);
  const [busy, setBusy] = useState('');
  const [pwd, setPwd] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Куди веде посилання з листа. Явно, бо лист відкриють тоді, коли ми вже не
  // знатимемо, з якого домену його надсилали.
  const redirectTo = `${APP_ORIGIN}/cabinet`;

  const refresh = async () => {
    if (!email) return;
    const r = await clientAccessApi('status', { email });
    if (r.error) { setState(null); return; }
    setState({ exists: !!r.exists, staff: r.staff, confirmed: r.confirmed, banned: r.banned, lastSignIn: r.lastSignIn });
  };
  useEffect(() => { void refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [email]);

  const run = async (action: 'invite' | 'create' | 'reset' | 'revoke' | 'restore', extra: { password?: string } = {}) => {
    if (!email) return;
    setBusy(action);
    const r = await clientAccessApi(action, { email, redirectTo, ...extra });
    setBusy('');
    if (r.error) { toast(r.error, 'err'); return; }
    toast({
      invite: '✓ Запрошення надіслано',
      create: '✓ Акаунт створено',
      reset: '✓ Лист зі зміною пароля надіслано',
      revoke: '✓ Доступ забрано',
      restore: '✓ Доступ повернуто',
    }[action]);
    setPwd(''); setShowCreate(false);
    void refresh();
  };

  if (!email) return <p className="adm-hint mono">Спершу вкажіть email клієнта — доступ відкривається на нього.</p>;

  if (state?.staff) {
    // Акаунт команди сюди не належить: керується в «Налаштування → Команда».
    return <p className="adm-hint mono">{email} — акаунт команди. Ролі змінюються в розділі «Команда».</p>;
  }

  return (
    <div className="adm-cacc">
      <div className="adm-cacc-state">
        <span className="mono">Доступ до сервісу</span>
        {state === null ? <b className="mono">—</b>
          : !state.exists ? <b className="mono adm-cacc-no">не відкрито</b>
          : state.banned ? <b className="mono adm-cacc-no">забрано</b>
          : <b className="mono adm-cacc-ok">{state.confirmed ? 'активний' : 'запрошено, пароль не задано'}</b>}
        {state?.exists && state.lastSignIn && (
          <span className="mono adm-cacc-last">останній вхід {new Date(state.lastSignIn).toLocaleDateString('uk-UA')}</span>
        )}
      </div>

      <div className="adm-cacc-acts">
        {!state?.exists && (
          <>
            <button className="mc-btn ok" disabled={!!busy} onClick={() => run('invite')}>
              {busy === 'invite' ? 'Надсилаємо…' : 'Запросити листом →'}
            </button>
            <button className="mc-btn" disabled={!!busy} onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? 'Сховати' : 'Задати пароль вручну'}
            </button>
          </>
        )}
        {state?.exists && !state.banned && (
          <>
            <button className="mc-btn" disabled={!!busy} onClick={() => run('reset')}>
              {busy === 'reset' ? 'Надсилаємо…' : 'Надіслати зміну пароля'}
            </button>
            <button className="mc-btn danger" disabled={!!busy} onClick={() => run('revoke')}>Забрати доступ</button>
          </>
        )}
        {state?.exists && state.banned && (
          <button className="mc-btn ok" disabled={!!busy} onClick={() => run('restore')}>Повернути доступ</button>
        )}
      </div>

      {showCreate && !state?.exists && (
        <div className="adm-cacc-pwd">
          {/* Запасний шлях: коли пошта клієнта не приймає наші листи. Пароль
              передається людині в переписці, тому мінімум довший за звичайний. */}
          <label className="sysx-inp">
            <span className="sysx-inp-l">Пароль (мінімум 10 символів)</span>
            <input type="text" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="off" />
          </label>
          <button className="mc-btn ok" disabled={!!busy || pwd.length < 10} onClick={() => run('create', { password: pwd })}>
            {busy === 'create' ? 'Створюємо…' : 'Створити акаунт'}
          </button>
          <p className="adm-hint mono">Передайте пароль клієнту особисто й попросіть змінити його після входу.</p>
        </div>
      )}
    </div>
  );
}
