import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { TripProvider, useTrip } from './context/TripContext';
import { LangProvider, useLang } from './context/LangContext';
import ChatWidget from './components/ChatWidget';
import './index.css';

const Home        = lazy(() => import('./pages/Home'));
const PlaceDetail = lazy(() => import('./pages/PlaceDetail'));
const PlanTrip    = lazy(() => import('./pages/PlanTrip'));
const Tracking    = lazy(() => import('./pages/Tracking'));
const Profile     = lazy(() => import('./pages/Profile'));
const AdminPanel  = lazy(() => import('./pages/AdminPanel'));
const PinLogin    = lazy(() => import('./pages/PinLogin'));
const Login       = lazy(() => import('./pages/Login'));
const Register    = lazy(() => import('./pages/Register'));
const AdminLogin  = lazy(() => import('./pages/AdminLogin'));
const NotFound    = lazy(() => import('./pages/NotFound'));
const Landing     = lazy(() => import('./pages/Landing'));
const AboutUs     = lazy(() => import('./pages/AboutUs'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', minHeight: 200,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2px solid rgba(201,160,85,0.15)',
        borderTopColor: 'var(--gold)',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

function Notifications() {
  const { notifications } = useTrip();
  return (
    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {notifications.map(n => (
        <div key={n.id} className={`notif notif-${n.type}`}>{n.message}</div>
      ))}
    </div>
  );
}

function TopNav() {
  const { activeTrip, user } = useTrip();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();

  return (
    <nav className="app-nav">
      <div className="nav-logo" onClick={() => navigate('/')}>
        dead<span>end</span>
      </div>

      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>
          {t.nav_explore}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>
          {t.nav_profile}
        </NavLink>
        <NavLink to="/mchs" className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>
          {t.nav_mchs}
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>
          {t.nav_about}
        </NavLink>
      </div>

      <div className="nav-right">
        {activeTrip && (
          <div className="nav-trip" onClick={() => navigate('/tracking')}>
            <span className="status-dot status-active" style={{ width: 7, height: 7 }} />
            {t.nav_in_trip} · {activeTrip.placeName}
          </div>
        )}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, overflow: 'hidden', marginRight: 6 }}>
          {['kz','ru','en'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '4px 9px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
              background: lang === l ? 'var(--purple)' : 'transparent',
              color: lang === l ? '#fff' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>{l}</button>
          ))}
        </div>
        {user && (
          <img
            src={user.photo}
            alt=""
            className="nav-avatar"
            onClick={() => navigate('/profile')}
          />
        )}
      </div>
    </nav>
  );
}

// Routes reachable without being logged in (emergency SOS access + auth pages)
const PUBLIC_PATHS = ['/login', '/register', '/pin', '/admin-login'];

function Layout() {
  const { isAuthenticated, authLoading } = useTrip();
  const location = useLocation();

  if (authLoading) return <PageLoader />;

  if (!isAuthenticated && !PUBLIC_PATHS.includes(location.pathname)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <TopNav />
      <main className="app-main">
        <Notifications />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/place/:id" element={<PlaceDetail />} />
            <Route path="/plan/:id"  element={<PlanTrip />} />
            <Route path="/tracking"  element={<Tracking />} />
            <Route path="/profile"   element={<Profile />} />
            <Route path="/pin"       element={<PinLogin />} />
            <Route path="/login"     element={<Login />} />
            <Route path="/register"  element={<Register />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/about-old" element={<Landing />} />
            <Route path="*"          element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <ChatWidget />
    </div>
  );
}

function MChSApp() {
  const { isAdmin, logout } = useTrip();
  const navigate = useNavigate();

  if (!isAdmin) return <Navigate to="/admin-login" replace />;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}>
      <Notifications />
      <div style={{ position: 'absolute', top: 14, right: 16, zIndex: 200, display: 'flex', gap: 8 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.5)', borderRadius: 8,
            padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ← App
        </button>
        <button
          onClick={() => { logout(); navigate('/admin-login'); }}
          style={{
            background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)',
            color: 'var(--red)', borderRadius: 8,
            padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Выйти
        </button>
      </div>
      <Suspense fallback={<PageLoader />}>
        <AdminPanel />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <TripProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/mchs"  element={<MChSApp />} />
            <Route path="/about" element={
              <Suspense fallback={<PageLoader />}>
                <AboutUs />
              </Suspense>
            } />
            <Route path="/*" element={<Layout />} />
          </Routes>
        </BrowserRouter>
      </TripProvider>
    </LangProvider>
  );
}
