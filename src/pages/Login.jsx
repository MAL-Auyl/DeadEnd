import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { useLang } from '../context/LangContext';
import GoogleIcon from '../components/GoogleIcon';
import Mascot from '../components/Mascot';

export default function Login() {
  const { isAuthenticated, loginUser, loginWithGoogle } = useTrip();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const result = await loginUser(form);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else if (result.error === 'config') {
      setError(t.auth_err_config);
    } else {
      setError(t.auth_err_invalid);
      setForm(p => ({ ...p, password: '' }));
    }
  }

  async function handleGoogle() {
    setError('');
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    setGoogleLoading(false);
    if (result.success) {
      navigate('/');
    } else if (result.error === 'account-exists') {
      if (result.email) setForm(p => ({ ...p, email: result.email }));
      setError(t.auth_err_account_exists);
    } else if (result.error !== 'cancelled') {
      setError(t.auth_err_config);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 400 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <Mascot size={100} style={{ animation: 'mascotFloat 4s ease-in-out infinite' }} />
      </div>
      <h1 className="page-title" style={{ textAlign: 'center' }}>{t.auth_login_title}</h1>
      <p className="page-sub" style={{ textAlign: 'center' }}>{t.auth_login_sub}</p>

      <div style={{
        background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 28,
        fontSize: 13, color: 'var(--text2)',
      }}>
        🔑 {t.auth_demo_hint}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">{t.auth_email}</label>
          <input
            type="email"
            className="form-input"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            autoComplete="username"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 8 }}>
          <label className="form-label">{t.auth_password}</label>
          <input
            type="password"
            className="form-input"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            autoComplete="current-password"
          />
        </div>

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--purple)', fontWeight: 600 }}>
            {t.auth_forgot_link}
          </Link>
        </div>

        {error && (
          <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={!form.email || !form.password || loading}
          style={{ opacity: (!form.email || !form.password || loading) ? 0.5 : 1, marginBottom: 20 }}
        >
          {loading ? '…' : t.auth_login_btn}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 20px' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.auth_or}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="btn btn-ghost btn-full btn-lg"
        style={{ opacity: googleLoading ? 0.5 : 1, marginBottom: 20 }}
      >
        <GoogleIcon />
        {googleLoading ? '…' : t.auth_google_btn}
      </button>

      <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>
        {t.auth_no_account}{' '}
        <Link to="/register" style={{ color: 'var(--purple)', fontWeight: 600 }}>
          {t.auth_signup_link}
        </Link>
      </p>
    </div>
  );
}
