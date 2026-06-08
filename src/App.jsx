import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { TripProvider, useTrip } from './context/TripContext';
import Home from './pages/Home';
import PlaceDetail from './pages/PlaceDetail';
import PlanTrip from './pages/PlanTrip';
import Tracking from './pages/Tracking';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import PinLogin from './pages/PinLogin';
import NotFound from './pages/NotFound';
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

const TOURIST_LINKS = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/profile', icon: '👤', label: 'Profile' },
  { to: '/pin', icon: '🔑', label: 'Emergency' },
];

const ADMIN_LINKS = [
  { to: '/admin', icon: '🛡️', label: 'Dashboard' },
];

function Sidebar() {
  const { activeTrip, user, logout } = useTrip();
  const navigate = useNavigate();
  const isAdmin = user.role === 'admin';
  const links = isAdmin ? ADMIN_LINKS : TOURIST_LINKS;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate(isAdmin ? '/admin' : '/')}>
        <span className="logo-dead">Dead</span><span className="logo-end">End</span>
      </div>

      {!isAdmin && activeTrip && (
        <div className="sidebar-trip-badge" onClick={() => navigate('/tracking')}>
          <span className="trip-pulse"></span>
          <span>Active trip</span>
          <span className="trip-dest">{activeTrip.placeName}</span>
        </div>
      )}

      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to === '/' || l.to === '/admin'} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>
            <span className="nav-icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <button
            className="nav-link"
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => { logout(); navigate('/'); }}
          >
            <span className="nav-icon">🚪</span>
            <span>Выйти</span>
          </button>
        )}

        {!isAdmin && (
          <NavLink to="/admin-login" className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>
            <span className="nav-icon">🛡️</span>
            <span>МЧС Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-user">
        <img src={user.photo} alt="" className="sidebar-avatar" />
        <div>
          <div className="sidebar-name">{user.firstName} {user.lastName}</div>
          <div className="sidebar-email">{isAdmin ? '🛡️ Admin' : user.email}</div>
        </div>
      </div>
    </aside>
  );
}

function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Notifications />
        <Routes>
          {/* Tourist routes */}
          <Route path="/" element={<Home />} />
          <Route path="/place/:id" element={<PlaceDetail />} />
          <Route path="/plan/:id" element={<PlanTrip />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pin" element={<PinLogin />} />

          {/* Admin routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminPanel />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <TripProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </TripProvider>
  );
}
