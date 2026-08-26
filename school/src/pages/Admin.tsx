import { useCallback, useEffect, useMemo, useState } from 'react';

// Міні-CRM заявок: /admin. Логін фіксований (env ADMIN_LOGIN/ADMIN_PASSWORD),
// дані — Supabase через /api/admin. Якщо база не підключена — демо-режим
// на localStorage, щоб воронку можна було покрутити одразу.

interface Lead {
  id: string;
  created_at: string;
  name: string;
  contact: string;
  course: string;
  comment: string;
  status: string;
  note: string | null;
}

const STAGES = [
  { id: 'new', label: 'Нові', bg: 'bg-sun' },
  { id: 'contacted', label: 'В контакті', bg: 'bg-white' },
  { id: 'paid', label: 'Оплата', bg: 'bg-white' },
  { id: 'studying', label: 'Навчається', bg: 'bg-white' },
  { id: 'rejected', label: 'Відмова', bg: 'bg-white' },
] as const;

const TOKEN_KEY = 'ca_admin_token';
const MODE_KEY = 'ca_admin_mode'; // 'live' | 'demo'
const DEMO_KEY = 'ca_demo_leads';

const DEMO_LEADS: Lead[] = [
  { id: 'd1', created_at: '2026-08-25T09:12:00Z', name: 'Оксана', contact: 'oksana@example.com', course: 'Аналітика і воронка', comment: 'Чи можна почати з середини місяця?', status: 'new', note: null },
  { id: 'd2', created_at: '2026-08-25T08:40:00Z', name: 'Дмитро', contact: '+380 67 000 11 22', course: 'E-Commerce Director. Повний шлях', comment: 'Цікавить розстрочка на 15 місяців', status: 'new', note: null },
  { id: 'd3', created_at: '2026-08-24T16:05:00Z', name: 'Ірина', contact: 'iryna.k@example.com', course: 'SEO, GEO і розробка', comment: '', status: 'contacted', note: 'Дзвінок у четвер о 15:00' },
  { id: 'd4', created_at: '2026-08-23T11:30:00Z', name: 'Максим', contact: 'max@example.com', course: 'Фінанси і юніт-економіка', comment: 'Питав про сертифікат', status: 'paid', note: 'Оплатив частинами 1/3' },
  { id: 'd5', created_at: '2026-08-20T10:00:00Z', name: 'Соломія', contact: 'sol@example.com', course: 'Фундамент', comment: '', status: 'studying', note: 'Рівень 2, темп добрий' },
  { id: 'd6', created_at: '2026-08-19T14:20:00Z', name: 'Артем', contact: '+380 50 333 44 55', course: 'AI Commerce', comment: 'Хотів корпоративний формат', status: 'rejected', note: 'Пішов думати, нагадати у вересні' },
];

async function api(body: object): Promise<Record<string, unknown>> {
  const r = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function readDemo(): Lead[] {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw) as Lead[];
  } catch { /* ignore */ }
  return DEMO_LEADS;
}
function writeDemo(leads: Lead[]) {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(leads)); } catch { /* ignore */ }
}

function Login({ onOk }: { onOk: (token: string, mode: 'live' | 'demo') => void }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await api({ action: 'login', login, password });
      if (typeof r.token === 'string') {
        onOk(r.token, r.configured ? 'live' : 'demo');
      } else {
        setErr(String(r.error || 'Помилка входу'));
      }
    } catch {
      // без бекенда (демо-артефакт): пускаємо з демо-даними за дефолтними кредами
      if (login === 'admin' && password === 'school2026') onOk('demo-offline', 'demo');
      else setErr('Сервер недоступний');
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen halftone flex items-center justify-center px-6 pt-20">
      <form onSubmit={submit} className="comic-border bg-white hard-shadow p-8 w-full max-w-sm">
        <div className="font-oswald font-bold uppercase text-2xl leading-none mb-1">
          Commerce <span className="text-brand">Architecture</span>
        </div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-ink/50 mb-6">
          Службовий вхід
        </div>
        <label className="block text-[12px] font-extrabold uppercase tracking-wider mb-1">Логін</label>
        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          className="w-full comic-border px-3 py-2.5 mb-4 font-semibold outline-none focus:bg-sun/20"
          autoComplete="username"
        />
        <label className="block text-[12px] font-extrabold uppercase tracking-wider mb-1">Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full comic-border px-3 py-2.5 mb-5 font-semibold outline-none focus:bg-sun/20"
          autoComplete="current-password"
        />
        {err && <div className="text-brand font-bold text-[13px] mb-4">{err}</div>}
        <button
          disabled={busy}
          className="w-full comic-border bg-brand text-white font-oswald font-bold uppercase tracking-wider py-3 hard-shadow-sm hover:-translate-y-0.5 transition-transform disabled:opacity-60"
        >
          {busy ? 'Вхід…' : 'Увійти'}
        </button>
      </form>
    </div>
  );
}

function LeadCard({ lead, mode, onMove, onNote }: {
  lead: Lead;
  mode: 'live' | 'demo';
  onMove: (id: string, dir: -1 | 1) => void;
  onNote: (id: string, note: string) => void;
}) {
  const [note, setNote] = useState(lead.note ?? '');
  const idx = STAGES.findIndex((s) => s.id === lead.status);
  return (
    <div className="comic-border bg-white hard-shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-oswald font-bold uppercase text-[15px] leading-tight">
          {lead.name || 'Без імені'}
        </div>
        <div className="text-[10px] font-extrabold uppercase text-ink/40 whitespace-nowrap">
          {fmtDate(lead.created_at)}
        </div>
      </div>
      <div className="text-[13px] font-bold text-brand break-all mb-1">{lead.contact}</div>
      {lead.course && (
        <div className="inline-block comic-border bg-sun px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider mb-2">
          {lead.course}
        </div>
      )}
      {lead.comment && <p className="text-[12.5px] text-ink/70 leading-snug mb-2">{lead.comment}</p>}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => note !== (lead.note ?? '') && onNote(lead.id, note)}
        placeholder="Нотатка…"
        rows={2}
        className="w-full comic-border px-2 py-1.5 text-[12.5px] outline-none focus:bg-sun/20 resize-none mb-2"
      />
      <div className="flex justify-between gap-2">
        <button
          onClick={() => onMove(lead.id, -1)}
          disabled={idx <= 0}
          className="flex-1 comic-border bg-white py-1 text-[13px] font-extrabold hover:bg-sun disabled:opacity-30"
          title="Попередній етап"
        >
          ←
        </button>
        <button
          onClick={() => onMove(lead.id, 1)}
          disabled={idx >= STAGES.length - 1}
          className="flex-1 comic-border bg-white py-1 text-[13px] font-extrabold hover:bg-sun disabled:opacity-30"
          title="Наступний етап"
        >
          →
        </button>
      </div>
      {mode === 'demo' && <div className="sr-only">demo</div>}
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  });
  const [mode, setMode] = useState<'live' | 'demo'>(() => {
    try { return (localStorage.getItem(MODE_KEY) as 'live' | 'demo') || 'demo'; } catch { return 'demo'; }
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courseFilter, setCourseFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async (tok: string, m: 'live' | 'demo') => {
    if (m === 'demo') {
      setLeads(readDemo());
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const r = await api({ action: 'list', token: tok });
      if (Array.isArray(r.leads)) setLeads(r.leads as Lead[]);
      else if (r.error === 'not_configured') {
        setMode('demo');
        try { localStorage.setItem(MODE_KEY, 'demo'); } catch { /* ignore */ }
        setLeads(readDemo());
      } else if (r.error === 'unauthorized') {
        setToken(null);
        try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
      } else setErr(String(r.error || 'Помилка завантаження'));
    } catch {
      setErr('Сервер недоступний');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) void load(token, mode);
  }, [token, mode, load]);

  function handleLogin(tok: string, m: 'live' | 'demo') {
    try {
      localStorage.setItem(TOKEN_KEY, tok);
      localStorage.setItem(MODE_KEY, m);
    } catch { /* ignore */ }
    setToken(tok);
    setMode(m);
  }

  function logout() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    setToken(null);
  }

  function patchLocal(id: string, patch: Partial<Lead>) {
    setLeads((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, ...patch } : l));
      if (mode === 'demo') writeDemo(next);
      return next;
    });
  }

  function move(id: string, dir: -1 | 1) {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    const idx = STAGES.findIndex((s) => s.id === lead.status);
    const next = STAGES[idx + dir];
    if (!next) return;
    patchLocal(id, { status: next.id });
    if (mode === 'live' && token) void api({ action: 'update', token, id, status: next.id });
  }

  function saveNote(id: string, note: string) {
    patchLocal(id, { note });
    if (mode === 'live' && token) void api({ action: 'update', token, id, note });
  }

  const courses = useMemo(
    () => Array.from(new Set(leads.map((l) => l.course).filter(Boolean))).sort(),
    [leads],
  );
  const visible = courseFilter === 'all' ? leads : leads.filter((l) => l.course === courseFilter);

  if (!token) return <Login onOk={handleLogin} />;

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16 px-4 md:px-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h1 className="font-oswald font-bold uppercase text-[26px] leading-none">
          Заявки <span className="text-brand">/ воронка</span>
        </h1>
        <span className="comic-border bg-white px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider">
          {visible.length} {courseFilter === 'all' ? 'всього' : 'у фільтрі'}
        </span>
        {mode === 'demo' && (
          <span className="comic-border bg-sun px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider">
            Демо-режим · Supabase не підключено
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="comic-border bg-white px-3 py-2 text-[13px] font-bold outline-none"
        >
          <option value="all">Усі курси</option>
          {courses.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {mode === 'live' && (
          <button
            onClick={() => token && load(token, mode)}
            className="comic-border bg-white px-3 py-2 text-[12px] font-extrabold uppercase tracking-wider hover:bg-sun"
          >
            {loading ? 'Оновлюю…' : 'Оновити'}
          </button>
        )}
        <button
          onClick={logout}
          className="comic-border bg-white px-3 py-2 text-[12px] font-extrabold uppercase tracking-wider hover:bg-brand hover:text-white ml-auto"
        >
          Вийти
        </button>
      </div>
      {err && <div className="comic-border bg-white p-4 text-brand font-bold mb-6">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-5 items-start">
        {STAGES.map((stage) => {
          const items = visible.filter((l) => l.status === stage.id);
          return (
            <div key={stage.id}>
              <div className={`comic-border ${stage.bg} hard-shadow-sm px-3 py-2 mb-4 flex items-center justify-between`}>
                <span className="font-oswald font-bold uppercase text-[14px] tracking-wide">{stage.label}</span>
                <span className="font-oswald font-bold text-[14px] text-brand">{items.length}</span>
              </div>
              <div className="flex flex-col gap-4">
                {items.map((l) => (
                  <LeadCard key={l.id} lead={l} mode={mode} onMove={move} onNote={saveNote} />
                ))}
                {items.length === 0 && (
                  <div className="border-[3px] border-dashed border-ink/20 p-4 text-center text-[12px] font-bold text-ink/40 uppercase tracking-wider">
                    порожньо
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
