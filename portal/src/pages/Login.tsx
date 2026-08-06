import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [notInvited, setNotInvited] = useState(false);
  // Два способа входа: клиентам — ссылка на почту (без пароля);
  // консультанту — email + пароль (пароль задаётся в админке).
  const [mode, setMode] = useState<'link' | 'password'>('link');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setNotInvited(false);
    setBusy(true);
    const em = email.trim().toLowerCase();

    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
      setBusy(false);
      if (error) setErr(error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : error.message);
      return;
    }

    // Портал работает по приглашениям: magic-link уходит только адресам,
    // заранее добавленным консультантом в members (RPC is_invited из schema.sql).
    try {
      const { data: invited, error: rpcErr } = await supabase.rpc('is_invited', { p_email: em });
      if (!rpcErr && invited === false) {
        setNotInvited(true);
        setBusy(false);
        return;
      }
    } catch { /* функции ещё нет в базе — падаем на старое поведение */ }
    const { error } = await supabase.auth.signInWithOtp({
      email: em,
      // путь важен: на сайте бриф живёт под /brief/, а не в корне домена
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  };

  return (
    <div className="container" style={{ paddingTop: 70, maxWidth: 460 }}>
      <p className="eyebrow">weexp · Commerce OS™ · Discovery</p>
      <h1>Вход в портал диагностики</h1>
      <p className="sub" style={{ marginBottom: 22 }}>
        {mode === 'link'
          ? 'Опросники и передача доступов для аудита. Введите рабочий e-mail — пришлём ссылку для входа, пароль не нужен.'
          : 'Вход для команды weexp: email и пароль, заданный в админке.'}
      </p>
      {sent ? (
        <div className="card">
          <h2>Проверьте почту</h2>
          <p className="sub">
            Отправили ссылку на <b>{email}</b>. Откройте письмо и нажмите «Войти».
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode === 'password' && (
            <input
              type="password"
              required
              placeholder="Пароль"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          )}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Секунду…' : mode === 'link' ? 'Получить ссылку для входа' : 'Войти'}
          </button>
          {err && <p style={{ color: 'var(--red)', fontSize: 13 }}>{err}</p>}
          {notInvited && (
            <div className="note" style={{ marginTop: 4 }}>
              Портал работает по приглашениям, и адреса <b>{email}</b> пока нет в списке.
              Если мы уже общаемся о проекте — напишите на{' '}
              <a href="mailto:pashasidorenko18@gmail.com" style={{ color: 'var(--lime-dark)' }}>
                pashasidorenko18@gmail.com
              </a>{' '}
              с этого адреса, добавим за минуту. Если ещё нет — начните с{' '}
              <a href="https://weexp.agency" style={{ color: 'var(--lime-dark)' }}>weexp.agency</a>.
            </div>
          )}
          <button
            type="button"
            className="mono"
            onClick={() => { setMode(mode === 'link' ? 'password' : 'link'); setErr(''); setNotInvited(false); }}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11.5, cursor: 'pointer', textAlign: 'left', padding: 0 }}
          >
            {mode === 'link' ? 'Я консультант — войти с паролем →' : '← Клиентский вход по ссылке на почту'}
          </button>
        </form>
      )}
      <p className="sub" style={{ fontSize: 11.5, marginTop: 16 }}>
        Мы не запрашиваем пароли у клиентов и не передаём данные третьим лицам ·{' '}
        <Link to="/privacy" style={{ color: 'var(--lime-dark)' }}>как мы обращаемся с данными →</Link>
      </p>
    </div>
  );
}
