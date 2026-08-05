import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, DEMO } from '../lib/supabase';
import { QUESTIONS, ACCESSES } from '../lib/model';
import { useApp } from '../App';

type ClientRow = { id: string; name: string };

export default function AdminPage() {
  const { member } = useApp();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [access, setAccess] = useState<any[]>([]);
  const [newClient, setNewClient] = useState('');
  const [inv, setInv] = useState({ clientId: '', email: '', name: '', role: 'CEO' });
  const [msg, setMsg] = useState('');

  const load = () => {
    if (DEMO) {
      setClients([{ id: 'demo', name: 'Demo Store' }]);
      return;
    }
    supabase.from('clients').select('id,name').then(({ data }) => setClients(data ?? []));
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
  };

  const copyInvite = (clientName: string) => {
    // В демо origin — это адрес демо-страницы (или артефакта), туда клиента
    // звать нельзя; подставляем канонический адрес боевого портала.
    const portalUrl = DEMO ? 'https://discovery.weexp.agency' : window.location.origin;
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
          <tr><th>Клиент</th><th>Ответов (L1)</th><th>Доступов</th><th></th><th></th></tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const answered = DEMO
              ? '—'
              : `${new Set(answers.filter((a) => a.client_id === c.id && a.answer).map((a) => a.question_id)).size}/${totalL1}`;
            const acc = DEMO ? '—' : `${access.filter((a) => a.client_id === c.id && a.status === 'Выдан').length}/${ACCESSES.length}`;
            return (
              <tr key={c.id}>
                <td><b>{c.name}</b></td>
                <td className="mono">{answered}</td>
                <td className="mono">{acc}</td>
                <td><button className="chip" onClick={() => copyInvite(c.name)}>Приглашение 📋</button></td>
                <td><Link to={`/admin/c/${c.id}`} className="chip" style={{ textDecoration: 'none' }}>Открыть →</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="sub" style={{ fontSize: 12, marginTop: 14 }}>
        Автонапоминания по email требуют подключения почтового сервиса (Resend) — пока
        отправляйте приглашение кнопкой «📋». Magic-link для входа Supabase шлёт сам.
      </p>
    </div>
  );
}
