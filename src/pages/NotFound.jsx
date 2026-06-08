import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 64 }}>🏔️</div>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 48, fontWeight: 900, color: 'var(--purple)' }}>404</h1>
      <p style={{ fontSize: 18, color: 'var(--text2)', marginBottom: 8 }}>Бұл жол картада жоқ</p>
      <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>Page not found — жоғалып кеттіңіз бе? 😄</p>
      <button onClick={() => navigate('/')} className="btn btn-primary btn-lg">🏠 Басты бетке қайту</button>
    </div>
  );
}
