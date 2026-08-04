import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setErr(error.message);
    else setSent(true);
  };

  return (
    <div className="container" style={{ paddingTop: 70, maxWidth: 460 }}>
      <p className="eyebrow">weexp · Commerce OS™ · Discovery</p>
      <h1>Вход в портал диагностики</h1>
      <p className="sub" style={{ marginBottom: 22 }}>
        Опросники и передача доступов для аудита. Введите рабочий e-mail — пришлём ссылку для
        входа, пароль не нужен.
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
          <button className="btn" type="submit">
            Получить ссылку для входа
          </button>
          {err && <p style={{ color: 'var(--red)', fontSize: 13 }}>{err}</p>}
        </form>
      )}
    </div>
  );
}
