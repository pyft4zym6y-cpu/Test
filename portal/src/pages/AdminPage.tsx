import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { QUESTIONS, DOMAINS, ACCESSES, byId } from '../lib/model';
import { useApp } from '../App';

type ClientRow = { id: string; name: string };

export default function AdminPage() {
  const { member } = useApp();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [access, setAccess] = useState<any[]>([]);

  useEffect(() => {
    if (!member.is_admin) return;
    supabase.from('clients').select('id,name').then(({ data }) => setClients(data ?? []));
    supabase.from('answers').select('*').then(({ data }) => setAnswers(data ?? []));
    supabase.from('access_status').select('*').then(({ data }) => setAccess(data ?? []));
  }, [member.is_admin]);

  if (!member.is_admin)
    return (
      <div className="container" style={{ paddingTop: 50 }}>
        <p className="sub">Доступ только для администраторов.</p>
      </div>
    );

  const exportCsv = (clientId: string, name: string) => {
    const rows = answers.filter((a) => a.client_id === clientId);
    const esc = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const csv = [
      ['ID', 'Домен', 'Вопрос', 'Ответ', 'Факты', 'Кто', 'Когда'].map(esc).join(';'),
      ...rows.map((r) => {
        const q = byId.get(r.question_id);
        return [r.question_id, q?.domain, q?.text, r.answer, r.facts, r.updated_by, r.updated_at]
          .map(esc)
          .join(';');
      }),
    ].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `discovery-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const totalL1 = QUESTIONS.filter((q) => q.level === 'L1').length;

  return (
    <div className="container" style={{ padding: '30px 20px 80px' }}>
      <Link to="/" className="mono" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
        ← На главную
      </Link>
      <h1 style={{ marginTop: 10 }}>Сводка по клиентам</h1>
      <table className="admin" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Клиент</th>
            <th>Ответов (L1)</th>
            <th>Доступов выдано</th>
            <th>Слабые домены</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const ca = answers.filter((a) => a.client_id === c.id && a.answer);
            const answeredIds = new Set(ca.map((a) => a.question_id));
            const l1done = QUESTIONS.filter((q) => q.level === 'L1' && answeredIds.has(q.id)).length;
            const acc = access.filter((a) => a.client_id === c.id && a.status === 'Выдан').length;
            const weak = DOMAINS.filter((d) => {
              const qs = QUESTIONS.filter((q) => q.domain === d.key && q.level === 'L1');
              const done = qs.filter((q) => answeredIds.has(q.id)).length;
              return qs.length > 0 && done / qs.length < 0.34;
            })
              .slice(0, 4)
              .map((d) => d.key)
              .join(', ');
            return (
              <tr key={c.id}>
                <td>
                  <b>{c.name}</b>
                </td>
                <td className="mono">
                  {l1done}/{totalL1}
                </td>
                <td className="mono">
                  {acc}/{ACCESSES.length}
                </td>
                <td style={{ color: 'var(--muted)', fontSize: 12 }}>{weak || '—'}</td>
                <td>
                  <button className="chip" onClick={() => exportCsv(c.id, c.name)}>
                    CSV ↓
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="sub" style={{ marginTop: 18 }}>
        Новый клиент и его участники добавляются в Supabase (Table Editor → clients / members) —
        SQL-заготовки в PORTAL_SETUP.md.
      </p>
    </div>
  );
}
