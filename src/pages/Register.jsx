import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { useLang } from '../context/LangContext';
import GoogleIcon from '../components/GoogleIcon';
import Mascot from '../components/Mascot';

export default function Register() {
  const { isAuthenticated, registerUser, loginWithGoogle } = useTrip();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }

  async function handleGoogle() {
    setError('');
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    setGoogleLoading(false);
    if (result.success) {
      navigate('/');
    } else if (result.error === 'account-exists') {
      if (result.email) set('email', result.email);
      setError(t.auth_err_account_exists);
    } else if (result.error !== 'cancelled') {
      setError(t.auth_err_config);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError(t.auth_err_required);
      return;
    }
    setLoading(true);
    const result = await registerUser(form);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else if (result.error === 'exists') {
      setError(t.auth_err_exists);
    } else if (result.error === 'weak') {
      setError(t.auth_err_weak);
    } else if (result.error === 'config') {
      setError(t.auth_err_config);
    } else {
      setError(t.auth_err_required);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 400 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <Mascot size={100} style={{ animation: 'mascotFloat 4s ease-in-out infinite' }} />
      </div>
      <h1 className="page-title" style={{ textAlign: 'center' }}>{t.auth_register_title}</h1>
      <p className="page-sub" style={{ textAlign: 'center' }}>{t.auth_register_sub}</p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">{t.auth_firstname}</label>
            <input
              className="form-input"
              value={form.firstName}
              onChange={e => set('firstName', e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">{t.auth_lastname}</label>
            <input
              className="form-input"
              value={form.lastName}
              onChange={e => set('lastName', e.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">{t.auth_email}</label>
          <input
            type="email"
            className="form-input"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">{t.auth_password}</label>
          <input
            type="password"
            className="form-input"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={!form.firstName || !form.lastName || !form.email || !form.password || loading}
          style={{
            opacity: (!form.firstName || !form.lastName || !form.email || !form.password || loading) ? 0.5 : 1,
            marginBottom: 20,
          }}
        >
          {loading ? '…' : t.auth_register_btn}
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
        {t.auth_have_account}{' '}
        <Link to="/login" style={{ color: 'var(--purple)', fontWeight: 600 }}>
          {t.auth_signin_link}
        </Link>
      </p>
    </div>
  );
}
