import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, DEMO } from '../lib/supabase';
import { QUESTIONS, ACCESSES } from '../lib/model';
import { useApp } from '../App';

type ClientRow = { id: string; name: string; locked?: boolean };
type MemberRow = { email: string; client_id: string | null; name: string | null; role: string | null; is_admin: boolean };

export default function AdminPage() {
  const { member } = useApp();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [access, setAccess] = useState<any[]>([]);
  const [newClient, setNewClient] = useState('');
  const [inv, setInv] = useState({ clientId: '', email: '', name: '', role: 'CEO' });
  const [msg, setMsg] = useState('');
  const [pw, setPw] = useState('');

  const load = () => {
    if (DEMO) {
      setClients([{ id: 'demo', name: 'Demo Store' }]);
      return;
    }
    supabase.from('clients').select('id,name,locked').then(({ data }) => setClients((data as any) ?? []));
    supabase.from('members').select('email,client_id,name,role,is_admin').then(({ data }) => setMembers((data as any) ?? []));
    supabase.from('answers').select('client_id,question_id,answer').then(({ data }) => setAnswers(data ?? []));
    supabase.from('access_status').select('client_id,status').then(({ data }) => setAccess(data ?? []));
  };
  useEffect(load, []);

  if (!member.is_admin)
    return (
      <div className="container" style={{ paddingTop: 50 }}>
        <p className="sub">Доступ только для администраторов.</p>
      </div>
    );

  const createClient = async () => {
    if (!newClient.trim()) return;
    const { error } = await supabase.from('clients').insert({ name: newClient.trim() });
    setMsg(error ? `Ошибка: ${error.message}` : `Клиент «${newClient}» создан`);
    setNewClient('');
    load();
  };

  const addMember = async () => {
    if (!inv.email || !inv.clientId) return;
    const { error } = await supabase.from('members').insert({
      email: inv.email.trim().toLowerCase(),
      client_id: inv.clientId,
      name: inv.name || null,
      role: inv.role,
    });
    setMsg(error ? `Ошибка: ${error.message}` : `Участник ${inv.email} добавлен`);
    setInv({ ...inv, email: '', name: '' });
    load();
  };

  /* Отзыв доступа: строка удаляется из members → is_invited=false, войти больше нельзя. */
  const revokeMember = async (email: string) => {
    if (!window.confirm(`Отозвать доступ у ${email}? Войти в бриф этот адрес больше не сможет.`)) return;
    const { error } = await supabase.from('members').delete().eq('email', email);
    setMsg(error ? `Ошибка: ${error.message}` : `Доступ ${email} отозван`);
    load();
  };

  /* Замок приёма: клиент видит бриф только для чтения, запись блокирует и RLS в базе. */
  const toggleLock = async (c: ClientRow) => {
    const { error } = await supabase.from('clients').update({ locked: !c.locked }).eq('id', c.id);
    setMsg(error
      ? `Ошибка: ${error.message}${error.message.includes('locked') ? ' — выполните свежий schema.sql в Supabase' : ''}`
      : !c.locked ? `«${c.name}»: приём ответов закрыт` : `«${c.name}»: приём ответов открыт`);
    load();
  };

  /* Пароль для входа консультанта: после установки можно входить без magic-link. */
  const setPassword = async () => {
    if (pw.length < 8) { setMsg('Пароль: минимум 8 символов'); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    setMsg(error ? `Ошибка: ${error.message}` : 'Пароль установлен — теперь на экране входа можно входить по email + паролю');
    setPw('');
  };

  const copyInvite = (clientName: string) => {
    // Канонический адрес брифа — страница на основном сайте.
    const portalUrl = 'https://weexp.agency/brief/';
    const text = `Добрый день!\n\nПриглашаем вас в портал диагностики weexp · Commerce OS™ по проекту «${clientName}».\n\n1. Откройте ${portalUrl}\n2. Введите ваш рабочий e-mail — придёт ссылка для входа (пароль не нужен)\n3. Идите по шагам: компания → цели → боли → опросник → конкуренты → доступы → решение и команда\n\nВсё сохраняется автоматически, заполнять можно с любого устройства. Чем конкретнее ответы и цифры — тем точнее аудит посчитает деньги.\n\nКоманда weexp`;
    navigator.clipboard?.writeText(text);
    setMsg('Текст приглашения скопирован — отправьте письмом или в мессенджер');
  };

  const totalL1 = QUESTIONS.filter((q) => q.level === 'L1').length;

  return (
    <div className="container" style={{ padding: '30px 20px 80px' }}>
      <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← На главную</Link>
      <h1 style={{ marginTop: 10 }}>Клиенты</h1>
      {msg && <p className="mono" style={{ fontSize: 12.5, color: 'var(--lime-dark)' }}>{msg}</p>}

      {!DEMO && (
        <div className="grid cols2" style={{ marginTop: 14 }}>
          <div className="card">
            <h2 style={{ fontSize: 15 }}>Новый клиент</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="text" placeholder="Название компании" value={newClient} onChange={(e) => setNewClient(e.target.value)} />
              <button className="btn" style={{ padding: '10px 16px' }} onClick={createClient}>+</button>
            </div>
          </div>
          <div className="card">
            <h2 style={{ fontSize: 15 }}>Пригласить участника</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <select value={inv.clientId} onChange={(e) => setInv({ ...inv, clientId: e.target.value })}>
                <option value="">— клиент —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="email" placeholder="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} />
                <input type="text" placeholder="Имя" value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} style={{ maxWidth: 130 }} />
                <select value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value })} style={{ maxWidth: 140 }}>
                  {['CEO', 'Head E-com', 'CFO', 'COO', 'CRM', 'Маркетинг', 'Другое'].map((r) => <option key={r}>{r}</option>)}
                </select>
                <button className="btn" style={{ padding: '10px 16px' }} onClick={addMember}>+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <table className="admin" style={{ marginTop: 20 }}>
        <thead>
          <tr><th>Клиент</th><th>Ответов (L1)</th><th>Доступов</th><th>Приём</th><th></th><th></th></tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const answered = DEMO
              ? '—'
              : `${new Set(answers.filter((a) => a.client_id === c.id && a.answer).map((a) => a.question_id)).size}/${totalL1}`;
            const acc = DEMO ? '—' : `${access.filter((a) => a.client_id === c.id && a.status === 'Выдан').length}/${ACCESSES.length}`;
            const team = members.filter((m) => m.client_id === c.id);
            return (
              <React.Fragment key={c.id}>
                <tr>
                  <td><b>{c.name}</b></td>
                  <td className="mono">{answered}</td>
                  <td className="mono">{acc}</td>
                  <td>
                    <button
                      className="chip"
                      style={{ color: c.locked ? 'var(--red)' : 'var(--lime-dark)' }}
                      title={c.locked ? 'Заполнение закрыто — нажмите, чтобы открыть' : 'Заполнение открыто — нажмите, чтобы закрыть'}
                      onClick={() => toggleLock(c)}
                    >
                      {c.locked ? '🔒 закрыт' : '🟢 открыт'}
                    </button>
                  </td>
                  <td><button className="chip" onClick={() => copyInvite(c.name)}>Приглашение 📋</button></td>
                  <td><Link to={`/admin/c/${c.id}`} className="chip" style={{ textDecoration: 'none' }}>Открыть →</Link></td>
                </tr>
                {!DEMO && (
                  <tr>
                    <td colSpan={6} style={{ paddingTop: 0 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>Команда:</span>
                        {team.length === 0 && <span className="sub" style={{ fontSize: 11.5 }}>пока никого — пригласите участника выше</span>}
                        {team.map((m) => (
                          <span key={m.email} className="tag" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            {m.name ? `${m.name} · ` : ''}{m.email}{m.role ? ` (${m.role})` : ''}
                            <button
                              onClick={() => revokeMember(m.email)}
                              title="Отозвать доступ"
                              style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontWeight: 800, padding: 0 }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <p className="sub" style={{ fontSize: 12, marginTop: 14 }}>
        «✕» у участника отзывает доступ немедленно (адрес больше не сможет войти).
        «🔒» закрывает приём ответов: бриф у клиента становится только для чтения — блокировка
        работает и на уровне базы данных.
      </p>

      {!DEMO && (
        <div className="card" style={{ marginTop: 22, maxWidth: 520 }}>
          <h2 style={{ fontSize: 15 }}>Мой доступ · пароль консультанта</h2>
          <p className="sub" style={{ fontSize: 12, marginTop: 4 }}>
            Вы вошли как <b>{member.email}</b>. Задайте пароль — и на экране входа появится
            возможность входить по email + паролю, без письма со ссылкой.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              type="password"
              placeholder="Новый пароль (мин. 8 символов)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <button className="btn" style={{ padding: '10px 16px' }} onClick={setPassword}>Задать</button>
          </div>
        </div>
      )}
    </div>
  );
}
