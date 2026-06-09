import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { TripProvider, useTrip } from './context/TripContext';
import { LangProvider, useLang } from './context/LangContext';
import Home from './pages/Home';
import PlaceDetail from './pages/PlaceDetail';
import PlanTrip from './pages/PlanTrip';
import Tracking from './pages/Tracking';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import PinLogin from './pages/PinLogin';
import NotFound from './pages/NotFound';
import Landing from './pages/Landing';
import './index.css';

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

function ProtectedRoute({ role, children }) {
  const { user } = useTrip();
  if (user.role !== role) {
    return <Navigate to={role === 'admin' ? '/admin-login' : '/'} replace />;
  }
  return children;
}

function TopNav() {
  const { activeTrip, user, logout } = useTrip();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const isAdmin = user.role === 'admin';

  return (
    <nav className="app-nav">
      <div className="nav-logo" onClick={() => navigate(isAdmin ? '/admin' : '/')}>
        dead<span>end</span>
      </div>

      <div className="nav-links">
        {!isAdmin ? (
          <>
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>
              {t.nav_explore}
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>
              {t.nav_profile}
            </NavLink>
            <NavLink to="/pin" className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>
              {t.nav_emergency}
            </NavLink>
            <NavLink to="/admin-login" className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>
              {t.nav_mchs}
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>
              {t.nav_about}
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/admin" end className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>
              {t.nav_dashboard}
            </NavLink>
            <button className="nav-link" onClick={() => { logout(); navigate('/'); }}>
              {t.nav_logout}
            </button>
          </>
        )}
      </div>

      <div className="nav-right">
        {!isAdmin && activeTrip && (
          <div className="nav-trip" onClick={() => navigate('/tracking')}>
            <span className="status-dot status-active" style={{ width: 7, height: 7 }} />
            {t.nav_in_trip} · {activeTrip.placeName}
          </div>
        )}
        {/* Language switcher */}
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
        <img
          src={user.photo}
          alt=""
          className="nav-avatar"
          onClick={() => navigate(isAdmin ? '/admin' : '/profile')}
        />
      </div>
    </nav>
  );
}

function Layout() {
  return (
    <div className="app-layout">
      <TopNav />
      <main className="app-main">
        <Notifications />
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/place/:id"   element={<PlaceDetail />} />
          <Route path="/plan/:id"    element={<PlanTrip />} />
          <Route path="/tracking"    element={<Tracking />} />
          <Route path="/profile"     element={<Profile />} />
          <Route path="/pin"         element={<PinLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="/about" element={<Landing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <TripProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </TripProvider>
    </LangProvider>
  );
}
