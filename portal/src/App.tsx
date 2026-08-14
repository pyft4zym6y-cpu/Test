import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase, CONFIGURED, DEMO_MEMBER, type Member } from './lib/supabase';
import { seedDemo } from './lib/demoSeed';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DomainPage from './pages/DomainPage';
import AccessPage from './pages/AccessPage';
import AdminPage from './pages/AdminPage';
import PainsPage from './pages/PainsPage';
import ReportPage from './pages/ReportPage';
import CompanyPage from './pages/CompanyPage';
import GoalsPage from './pages/GoalsPage';
import LinksPage from './pages/LinksPage';
import DeliverablesPage from './pages/DeliverablesPage';
import AdminClientPage from './pages/AdminClientPage';
import KpPage from './pages/KpPage';
import DecisionPage from './pages/DecisionPage';
import PrivacyPage from './pages/PrivacyPage';
import ConnectorsPage from './pages/ConnectorsPage';
import AuditRunnerPage from './pages/AuditRunnerPage';
import Assistant from './components/Assistant';

type Ctx = { session: Session | null; member: Member; locked: boolean };
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
          {member && (
            <Link to="/connectors" className="tag">
              Коннекторы
            </Link>
          )}
          {member?.is_admin && (
            <Link to="/audit" className="tag">
              Запустить аудит
            </Link>
          )}
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
  const [locked, setLocked] = useState(false);
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

  // Флаг «приём ответов закрыт» по клиенту участника (админ управляет из /admin)
  useEffect(() => {
    if (!member?.client_id) {
      setLocked(false);
      return;
    }
    supabase
      .from('clients')
      .select('locked')
      .eq('id', member.client_id)
      .maybeSingle()
      .then(({ data }) => setLocked(Boolean((data as any)?.locked)));
  }, [member]);

  if (!CONFIGURED)
    return (
      <AppCtx.Provider value={{ session: null, member: DEMO_MEMBER as Member, locked: false }}>
        <ScrollTop />
        <div
          className="mono"
          style={{
            background: '#12161C',
            color: '#A3E635',
            fontSize: 11.5,
            padding: '8px 16px',
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span>ДЕМО-РЕЖИМ · данные сохраняются только в этом браузере</span>
          <button
            className="chip"
            style={{ fontSize: 11, padding: '3px 10px' }}
            onClick={() => {
              seedDemo();
              window.location.reload();
            }}
          >
            Заполнить демо-данными
          </button>
          <button
            className="chip"
            style={{ fontSize: 11, padding: '3px 10px' }}
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
          >
            Сбросить
          </button>
        </div>
        <Topbar member={DEMO_MEMBER as Member} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/company" element={<CompanyPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/pains" element={<PainsPage />} />
          <Route path="/links" element={<LinksPage />} />
          <Route path="/d/:sheet" element={<DomainPage />} />
          <Route path="/access" element={<AccessPage />} />
          <Route path="/connectors" element={<ConnectorsPage />} />
          <Route path="/audit" element={<AuditRunnerPage />} />
          <Route path="/decision" element={<DecisionPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/report" element={<ReportPage />} />
        <Route path="/deliverables" element={<DeliverablesPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/c/:clientId" element={<AdminClientPage />} />
          <Route path="/kp/:clientId" element={<KpPage />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
        {(DEMO_MEMBER as Member).is_admin && <Assistant />}
      </AppCtx.Provider>
    );

  if (loading) return null;

  if (!session)
    return (
      <>
        <Topbar member={null} />
        <Routes>
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<Login />} />
        </Routes>
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
    <AppCtx.Provider value={{ session, member, locked }}>
      <ScrollTop />
      <Topbar member={member} />
      {locked && !member.is_admin && (
        <div
          className="mono"
          style={{ background: '#B45309', color: '#fff', fontSize: 12, padding: '9px 16px', textAlign: 'center' }}
        >
          Приём ответов закрыт консультантом — бриф доступен только для чтения. Вопросы: pashasidorenko18@gmail.com
        </div>
      )}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/company" element={<CompanyPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/pains" element={<PainsPage />} />
        <Route path="/links" element={<LinksPage />} />
        <Route path="/d/:sheet" element={<DomainPage />} />
        <Route path="/access" element={<AccessPage />} />
        <Route path="/connectors" element={<ConnectorsPage />} />
        <Route path="/audit" element={<AuditRunnerPage />} />
          <Route path="/decision" element={<DecisionPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/deliverables" element={<DeliverablesPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/c/:clientId" element={<AdminClientPage />} />
        <Route path="/kp/:clientId" element={<KpPage />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
      {member.is_admin && <Assistant />}
    </AppCtx.Provider>
  );
}
