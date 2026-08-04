import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase, CONFIGURED, type Member } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DomainPage from './pages/DomainPage';
import AccessPage from './pages/AccessPage';
import AdminPage from './pages/AdminPage';

type Ctx = { session: Session; member: Member };
const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => useContext(AppCtx)!;

function Topbar({ member }: { member: Member | null }) {
  return (
    <div className="topbar">
      <div className="container topbar-in">
        <Link to="/" className="logo">
          WEEXP<b>·DISCOVERY</b>
        </Link>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {member?.is_admin && (
            <Link to="/admin" className="tag">
              Админ
            </Link>
          )}
          {member && (
            <button
              className="chip"
              onClick={() => supabase.auth.signOut()}
              style={{ fontSize: 12 }}
            >
              Выйти
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!CONFIGURED) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user.email) {
      setMember(null);
      return;
    }
    supabase
      .from('members')
      .select('*')
      .eq('email', session.user.email.toLowerCase())
      .maybeSingle()
      .then(({ data }) => setMember(data as Member | null));
  }, [session]);

  if (!CONFIGURED)
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <div className="card">
          <h2>Портал не настроен</h2>
          <p className="sub">
            Задайте переменные окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY (см.
            PORTAL_SETUP.md) и пересоберите проект.
          </p>
        </div>
      </div>
    );

  if (loading) return null;

  if (!session)
    return (
      <>
        <Topbar member={null} />
        <Login />
      </>
    );

  if (!member)
    return (
      <>
        <Topbar member={null} />
        <div className="container" style={{ paddingTop: 60 }}>
          <div className="card">
            <h2>Доступ не подключён</h2>
            <p className="sub">
              Вы вошли как <b>{session.user.email}</b>, но этот e-mail не добавлен ни к одному
              проекту. Напишите нам — подключим за минуту.
            </p>
            <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => supabase.auth.signOut()}>
              Войти под другим e-mail
            </button>
          </div>
        </div>
      </>
    );

  return (
    <AppCtx.Provider value={{ session, member }}>
      <ScrollTop />
      <Topbar member={member} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/d/:sheet" element={<DomainPage />} />
        <Route path="/access" element={<AccessPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </AppCtx.Provider>
  );
}
