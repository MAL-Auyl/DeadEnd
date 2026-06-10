import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { useLang } from '../context/LangContext';

export default function Login() {
  const { isAuthenticated, loginUser } = useTrip();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/" replace />;

  function handleSubmit(e) {
    e.preventDefault();
    const result = loginUser(form);
    if (result.success) {
      navigate('/');
    } else {
      setError(t.auth_err_invalid);
      setForm(p => ({ ...p, password: '' }));
    }
  }

  return (
    <div className="page" style={{ maxWidth: 400 }}>
      <h1 className="page-title">{t.auth_login_title}</h1>
      <p className="page-sub">{t.auth_login_sub}</p>

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
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">{t.auth_password}</label>
          <input
            type="password"
            className="form-input"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={!form.email || !form.password}
          style={{ opacity: (!form.email || !form.password) ? 0.5 : 1, marginBottom: 20 }}
        >
          {t.auth_login_btn}
        </button>
      </form>

      <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>
        {t.auth_no_account}{' '}
        <Link to="/register" style={{ color: 'var(--purple)', fontWeight: 600 }}>
          {t.auth_signup_link}
        </Link>
      </p>
    </div>
  );
}
