import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { RouteSeo } from '@/lib/seo';
import { Engagement } from '@/lib/engagement';
import { Toaster } from '@/lib/toast';
import '@/lib/primitives.css';

/**
 * Запобіжник від «білого екрана»: будь-яка помилка рендера всередині маршрутів
 * ловиться тут і показує зрозумілий екран із діями, а не порожню сторінку без
 * можливості продовжити. Chunk-помилки (застарілий бандл) обробляє main.tsx —
 * тут ловимо решту (краш компонента), щоб клієнт міг перезавантажити або піти на сайт.
 */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) {
    // Застарілий бандл після деплою → тихе перезавантаження (guard від циклу).
    if (/dynamically imported module|Loading chunk|ChunkLoadError|module script failed/i.test(String(error?.message))) {
      try {
        const now = Date.now(); const last = Number(sessionStorage.getItem('weexp-eb-reload') || 0);
        if (now - last > 20000) { sessionStorage.setItem('weexp-eb-reload', String(now)); location.reload(); }
      } catch { /* ignore */ }
    }
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '40px 20px', fontFamily: 'Golos Text, system-ui, sans-serif', color: '#141210' }}>
        <div style={{ maxWidth: 460, border: '2.5px solid #141210', boxShadow: '6px 6px 0 #141210', background: '#fff', padding: '28px 26px' }}>
          <b style={{ display: 'block', fontSize: 22, marginBottom: 8 }}>Сторінка не завантажилась</b>
          <p style={{ color: '#6B675E', marginBottom: 18, fontSize: 14, lineHeight: 1.5 }}>Стався технічний збій. Ваші дані збережені — перезавантажте сторінку або поверніться на сайт, нічого не втрачено.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => location.reload()} style={{ border: '2.5px solid #141210', background: '#FFD200', padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>Перезавантажити</button>
            <a href="/" style={{ border: '2.5px solid #141210', background: '#fff', padding: '10px 18px', fontWeight: 700, textDecoration: 'none', color: '#141210' }}>На головну</a>
          </div>
        </div>
      </div>
    );
  }
}

// Легкий індикатор замість порожнечі, поки вантажиться lazy-чанк сторінки.
function RouteLoading() {
  return <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', color: '#6B675E', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>Завантаження…</div>;
}

// Нова сторінка — на початок (щоб перехід, напр. «Формати і ціни», відкривався
// зверху, а не з середини/низу через відновлення позиції скролу). Хеш — не чіпаємо.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (!hash) window.scrollTo(0, 0); }, [pathname, hash]);
  return null;
}

// Плавний скрол до якоря (#systems тощо) при зміні хеша — для об'єднаних сторінок.
function ScrollToHash() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    let tries = 0;
    const go = () => {
      const el = document.getElementById(id);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if (tries++ < 20) setTimeout(go, 120);   // чекаємо, поки lazy-секція змонтується
    };
    setTimeout(go, 80);
  }, [hash]);
  return null;
}

// Легасі темний сайт (Layout + Home/CaseDetail/SystemPage/NotFound) виведено з
// ужитку: усі старі маршрути 301-редиректяться у світлий v2 (див. нижче + root
// vercel.json), щоб на сайті була ОДНА айдентика. Світла 404 — SystemNotFound.
const SystemInMotion = lazy(() => import('@/system/SystemInMotion').then((m) => ({ default: m.SystemInMotion })));
const SystemNotFound = lazy(() => import('@/system/SystemNotFound').then((m) => ({ default: m.SystemNotFound })));
const CasesFilm = lazy(() => import('@/system/CasesFilm').then((m) => ({ default: m.CasesFilm })));
const About = lazy(() => import('@/system/About').then((m) => ({ default: m.About })));
const ExpansionHub = lazy(() => import('@/system/ExpansionHub').then((m) => ({ default: m.ExpansionHub })));
const Expertise = lazy(() => import('@/system/Expertise').then((m) => ({ default: m.Expertise })));
const ContactFilm = lazy(() => import('@/system/ContactFilm').then((m) => ({ default: m.ContactFilm })));
const SystemShell = lazy(() => import('@/system/SystemShell').then((m) => ({ default: m.SystemShell })));
const LossCalculator = lazy(() => import('@/system/LossCalculator').then((m) => ({ default: m.LossCalculator })));
const Cabinet = lazy(() => import('@/system/Cabinet').then((m) => ({ default: m.Cabinet })));
const AdminPanel = lazy(() => import('@/system/AdminPanel').then((m) => ({ default: m.AdminPanel })));
const ServicePage = lazy(() => import('@/system/ServicePage').then((m) => ({ default: m.ServicePage })));
const Pricing = lazy(() => import('@/system/Pricing').then((m) => ({ default: m.Pricing })));
const AuditPackPage = lazy(() => import('@/system/AuditPackPage').then((m) => ({ default: m.AuditPackPage })));

// /challenges/:slug (легасі) → відповідна світла сторінка системи /systems/:slug
// (слаги збігаються), щоб зберегти глибокі посилання, а не кидати все на індекс.
function ChallengeRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/systems/${slug}` : '/#systems'} replace />;
}

// Єдиний перелік сторінок — рендериться двічі (UK на «/», EN на «/en»).
const PAGES: { path: string; el: JSX.Element }[] = [
  { path: '/', el: <SystemInMotion /> },
  { path: '/cabinet', el: <Cabinet /> },
  { path: '/proof', el: <CasesFilm /> },
  { path: '/people', el: <About /> },
  { path: '/expansion', el: <ExpansionHub /> },
  { path: '/expansion/:slug', el: <Expertise /> },
  { path: '/diagnose', el: <LossCalculator /> },
  { path: '/pricing', el: <Pricing /> },
  { path: '/audit-pack', el: <AuditPackPage /> },
  { path: '/systems/:slug', el: <ServicePage /> },
  { path: '/contact', el: <ContactFilm /> },
];

export default function App() {
  return (
    <BrowserRouter>
      <RouteSeo />
      <Engagement />
      <ScrollToTop />
      <ScrollToHash />
      <ErrorBoundary>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          {/* Реальні сторінки — усі під спільною світлою оболонкою (одна айдентика).
              Кожна сторінка монтується двічі: українською (типово) і англійською
              під префіксом /en — та сама React-сторінка, мова читається з URL (i18n). */}
          <Route element={<SystemShell />}>
            {PAGES.map((p) => <Route key={p.path} path={p.path} element={p.el} />)}
            {PAGES.map((p) => <Route key={'en' + p.path} path={p.path === '/' ? '/en' : '/en' + p.path} element={p.el} />)}
            {/* Світла 404 у тій же оболонці (шапка/крихти/підвал). */}
            <Route path="*" element={<SystemNotFound />} />
          </Route>

          {/* Операційна адмінка — окремий маршрут поза оболонкою сайту. */}
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/manage" element={<Navigate to="/admin" replace />} />

          {/* Клієнтські редиректи (дублюють 301 у root vercel.json — для SPA-навігації).
              Легасі темні маршрути ведуть у світлі аналоги; окремої тёмної айдентики немає. */}
          <Route path="/system" element={<Navigate to="/" replace />} />
          <Route path="/systems" element={<Navigate to="/#systems" replace />} />
          <Route path="/loss" element={<Navigate to="/diagnose" replace />} />
          <Route path="/classic" element={<Navigate to="/" replace />} />
          <Route path="/cases" element={<Navigate to="/proof" replace />} />
          <Route path="/cases/:slug" element={<Navigate to="/proof" replace />} />
          <Route path="/challenges" element={<Navigate to="/#systems" replace />} />
          <Route path="/challenges/:slug" element={<ChallengeRedirect />} />
          <Route path="/what-we-build" element={<Navigate to="/#systems" replace />} />
          <Route path="/what-we-build/eu-expansion" element={<Navigate to="/expansion" replace />} />
          <Route path="/expansion/web" element={<Navigate to="/expansion/technology" replace />} />
          <Route path="/en/expansion/web" element={<Navigate to="/en/expansion/technology" replace />} />
          <Route path="/how-it-works" element={<Navigate to="/#systems" replace />} />
          <Route path="/how-it-works/business-health" element={<Navigate to="/diagnose" replace />} />
          <Route path="/how-it-works/independence-score" element={<Navigate to="/diagnose" replace />} />
          <Route path="/how-it-works/benchmark" element={<Navigate to="/diagnose" replace />} />
          <Route path="/intelligence" element={<Navigate to="/proof" replace />} />
          <Route path="/about" element={<Navigate to="/people" replace />} />
          <Route path="/about/founder" element={<Navigate to="/people" replace />} />
          <Route path="/about/team" element={<Navigate to="/people" replace />} />
          <Route path="/about/standard" element={<Navigate to="/people" replace />} />
          <Route path="/diagnose/full" element={<Navigate to="/diagnose" replace />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
      <Toaster />
    </BrowserRouter>
  );
}
