import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { useLang } from '../context/LangContext';

export default function ForgotPassword() {
  const { isAuthenticated, forgotPassword } = useTrip();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);
    if (result.success) {
      setSent(true);
    } else if (result.error === 'required') {
      setError(t.auth_err_required);
    } else {
      setError(t.auth_err_config);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 400 }}>
      <h1 className="page-title">{t.auth_forgot_title}</h1>
      <p className="page-sub">{t.auth_forgot_sub}</p>

      {sent ? (
        <div style={{
          background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)',
          borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 28,
          fontSize: 13, color: 'var(--text2)',
        }}>
          ✅ {t.auth_forgot_sent}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">{t.auth_email}</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          {error && (
            <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={!email || loading}
            style={{ opacity: (!email || loading) ? 0.5 : 1, marginBottom: 20 }}
          >
            {loading ? '…' : t.auth_forgot_btn}
          </button>
        </form>
      )}

      <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>
        <Link to="/login" style={{ color: 'var(--purple)', fontWeight: 600 }}>
          {t.auth_forgot_back}
        </Link>
      </p>
    </div>
  );
}
