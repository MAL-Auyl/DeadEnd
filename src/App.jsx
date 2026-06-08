import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { TripProvider, useTrip } from './context/TripContext';
import Home from './pages/Home';
import PlaceDetail from './pages/PlaceDetail';
import PlanTrip from './pages/PlanTrip';
import Tracking from './pages/Tracking';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
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

function Sidebar() {
  const { activeTrip, user } = useTrip();
  const navigate = useNavigate();

  const links = [
    { to: '/', icon: '🏠', label: 'Home' },
    { to: '/profile', icon: '👤', label: 'Profile' },
    { to: '/admin', icon: '🛡️', label: 'МЧС Panel' },
    { to: '/pin', icon: '🔑', label: 'PIN Login' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/')}>
        <span className="logo-dead">Dead</span><span className="logo-end">End</span>
      </div>

      {activeTrip && (
        <div className="sidebar-trip-badge" onClick={() => navigate('/tracking')}>
          <span className="trip-pulse"></span>
          <span>Active trip</span>
          <span className="trip-dest">{activeTrip.placeName}</span>
        </div>
      )}

      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>
            <span className="nav-icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <img src={user.photo} alt="" className="sidebar-avatar" />
        <div>
          <div className="sidebar-name">{user.firstName} {user.lastName}</div>
          <div className="sidebar-email">{user.email}</div>
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
          <Route path="/" element={<Home />} />
          <Route path="/place/:id" element={<PlaceDetail />} />
          <Route path="/plan/:id" element={<PlanTrip />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/pin" element={<PinLogin />} />
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
