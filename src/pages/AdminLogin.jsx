import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';

export default function AdminLogin() {
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useTrip();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (login(form)) {
      navigate('/admin');
    } else {
      setError('Неверный логин или пароль');
      setForm(p => ({ ...p, password: '' }));
    }
  }

  return (
    <div className="page" style={{ maxWidth: 400 }}>
      <h1 className="page-title">МЧС Admin Login</h1>
      <p className="page-sub">Доступ только для сотрудников МЧС</p>

      <div style={{
        background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)',
        borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 28,
        fontSize: 13, color: 'var(--text2)',
      }}>
        🛡️ Demo: login <b>admin</b> / password <b>mchs2024</b>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Логин</label>
          <input
            className="form-input"
            value={form.login}
            onChange={e => setForm(p => ({ ...p, login: e.target.value }))}
            autoComplete="username"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Пароль</label>
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
          disabled={!form.login || !form.password}
          style={{ opacity: (!form.login || !form.password) ? 0.5 : 1 }}
        >
          Войти
        </button>
      </form>
    </div>
  );
}
