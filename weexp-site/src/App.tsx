import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { RouteSeo } from '@/lib/seo';
import { Engagement } from '@/lib/engagement';
import { Toaster } from '@/lib/toast';
import '@/lib/primitives.css';
import { langOf } from '@/i18n';
import { reloadOnceForChunk } from '@/lib/chunkReload';
import { HostGuard } from '@/lib/HostGuard';

/**
 * Переклад без контексту: мова визначається прямо з URL.
 *
 * Потрібен там, де хук useT недоступний або ненадійний — у класовому
 * ErrorBoundary і в Suspense-заглушці маршруту. У момент збою або до монтування
 * сторінки контекст може бути ще (або вже) не тим, а екран усе одно має
 * говорити мовою відвідувача.
 */
function trByUrl(): (uk: string, en: string) => string {
  const en = typeof location !== 'undefined' && langOf(location.pathname) === 'en';
  return (uk, eng) => (en ? eng : uk);
}

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
    reloadOnceForChunk(error?.message, 'boundary');
  }
  render() {
    if (!this.state.error) return this.props.children;
    /*
     * Мова беремо з URL напряму, а не через useT: це класовий компонент, і —
     * головне — саме тут контекст міг зламатись разом зі сторінкою. Екран
     * помилки має працювати, коли не працює все інше.
     *
     * Раніше він був лише українською: англомовний відвідувач у момент збою
     * бачив незрозумілий текст — найгірший з можливих моментів для цього.
     */
    const tr = trByUrl();
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '40px 20px', fontFamily: 'Golos Text, system-ui, sans-serif', color: '#141210' }}>
        <div style={{ maxWidth: 460, border: '2.5px solid #141210', boxShadow: '6px 6px 0 #141210', background: '#fff', padding: '28px 26px' }}>
          <b style={{ display: 'block', fontSize: 22, marginBottom: 8 }}>{tr('Сторінка не завантажилась', 'This page failed to load')}</b>
          <p style={{ color: '#6B675E', marginBottom: 18, fontSize: 14, lineHeight: 1.5 }}>{tr(
            'Стався технічний збій. Ваші дані збережені — перезавантажте сторінку або поверніться на сайт, нічого не втрачено.',
            'A technical error occurred. Your data is saved — reload the page or go back to the site, nothing is lost.',
          )}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => location.reload()} style={{ border: '2.5px solid #141210', background: '#FFD200', padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>{tr('Перезавантажити', 'Reload')}</button>
            <a href={tr('/', '/en')} style={{ border: '2.5px solid #141210', background: '#fff', padding: '10px 18px', fontWeight: 700, textDecoration: 'none', color: '#141210' }}>{tr('На головну', 'Back to home')}</a>
          </div>
        </div>
      </div>
    );
  }
}

// Легкий індикатор замість порожнечі, поки вантажиться lazy-чанк сторінки.
function RouteLoading() {
  const tr = trByUrl();
  return <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', color: '#6B675E', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{tr('Завантаження…', 'Loading…')}</div>;
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
const SystemsHub = lazy(() => import('@/system/SystemsHub').then((m) => ({ default: m.SystemsHub })));
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
const BlogHub = lazy(() => import('@/system/BlogHub').then((m) => ({ default: m.BlogHub })));
const BlogPost = lazy(() => import('@/system/BlogPost').then((m) => ({ default: m.BlogPost })));
const AuditPackPage = lazy(() => import('@/system/AuditPackPage').then((m) => ({ default: m.AuditPackPage })));

// /challenges/:slug (легасі) → відповідна світла сторінка системи /systems/:slug
// (слаги збігаються), щоб зберегти глибокі посилання, а не кидати все на індекс.
function ChallengeRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/systems/${slug}` : '/systems'} replace />;
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
  // Блог поки лише українською: сторінки монтуються і під /en, але BlogTeaser
  // там не показується, а сам блог веде на українські тексти. Це свідомо —
  // англомовний читач на українському лонгриді гірший за його відсутність.
  { path: '/blog', el: <BlogHub /> },
  { path: '/blog/:slug', el: <BlogPost /> },
  { path: '/systems', el: <SystemsHub /> },
  { path: '/systems/:slug', el: <ServicePage /> },
  { path: '/contact', el: <ContactFilm /> },
];

export default function App() {
  return (
    <BrowserRouter>
      <RouteSeo />
      {/* Сайт і ведення проєкту живуть на різних походженнях: сторож приводить
          адресу до правильного, зокрема при клієнтській навігації, якої
          серверні редиректи не бачать. */}
      <HostGuard />
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

          {/* Дві поверхні адміністрування, а не одна.
              /admin — адмінка САЙТУ: заявки, які породжує сама сторінка.
              /manage — сервіс ведення проєкту: клієнти, аудити, воркер, методики;
              живе на app.weexp.agency поруч із кабінетом клієнта.
              Розділ і відкритий клієнт живуть в адресі: інакше картку не можна
              переслати колезі, F5 скидав позицію, а «Назад» вивалював із адмінки. */}
          <Route path="/admin" element={<AdminPanel surface="site" />} />
          <Route path="/admin/:tab" element={<AdminPanel surface="site" />} />
          <Route path="/admin/:tab/c/:clientId" element={<AdminPanel surface="site" />} />
          <Route path="/admin/:tab/c/:clientId/:utab" element={<AdminPanel surface="site" />} />
          <Route path="/manage" element={<AdminPanel surface="pm" />} />
          <Route path="/manage/:tab" element={<AdminPanel surface="pm" />} />
          <Route path="/manage/:tab/c/:clientId" element={<AdminPanel surface="pm" />} />
          <Route path="/manage/:tab/c/:clientId/:utab" element={<AdminPanel surface="pm" />} />

          {/* Клієнтські редиректи (дублюють 301 у root vercel.json — для SPA-навігації).
              Легасі темні маршрути ведуть у світлі аналоги; окремої тёмної айдентики немає. */}
          <Route path="/system" element={<Navigate to="/" replace />} />
          <Route path="/loss" element={<Navigate to="/diagnose" replace />} />
          <Route path="/classic" element={<Navigate to="/" replace />} />
          <Route path="/cases" element={<Navigate to="/proof" replace />} />
          <Route path="/cases/:slug" element={<Navigate to="/proof" replace />} />
          <Route path="/challenges" element={<Navigate to="/systems" replace />} />
          <Route path="/challenges/:slug" element={<ChallengeRedirect />} />
          <Route path="/what-we-build" element={<Navigate to="/systems" replace />} />
          <Route path="/what-we-build/eu-expansion" element={<Navigate to="/expansion" replace />} />
          <Route path="/expansion/web" element={<Navigate to="/expansion/technology" replace />} />
          <Route path="/en/expansion/web" element={<Navigate to="/en/expansion/technology" replace />} />
          <Route path="/how-it-works" element={<Navigate to="/systems" replace />} />
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
