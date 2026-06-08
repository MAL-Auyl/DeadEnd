import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLACES } from '../data/places';
import { useTrip } from '../context/TripContext';
import { useWeather, weatherIcon, getMamaTips } from '../hooks/useWeather';

const AKTAU = { lat: 43.65, lng: 51.17 };

function HomeWeatherBanner() {
  const { weather, loading } = useWeather(AKTAU);

  if (loading) {
    return (
      <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 18, opacity: 0.4 }}>🌤️</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Загрузка погоды...</div>
      </div>
    );
  }
  if (!weather) return null;

  const { current, today } = weather;
  const tips = getMamaTips(weather);
  const hasWarning = tips.some(t => t.type === 'warning');
  const firstWarning = tips.find(t => t.type === 'warning');
  const isDangerous = today.windMax >= 20 || today.tempMax >= 42 || today.rainChance >= 60;

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden', marginBottom: 28,
      border: `1px solid ${isDangerous ? 'rgba(244,162,97,0.35)' : 'var(--border)'}`,
      background: isDangerous ? 'rgba(244,162,97,0.05)' : 'var(--bg2)',
    }}>
      {/* Main row */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 32 }}>{weatherIcon(current.code)}</span>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
            {current.temp}°C
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Мангыстау · сегодня</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 18 }}>
          {[
            { icon: '💨', val: `${current.wind} м/с`, warn: current.wind >= 15 },
            { icon: '🌡️', val: `${today.tempMax}° / ${today.tempMin}°`, warn: today.tempMax >= 40 },
            { icon: '🌧️', val: `${today.rainChance}%`, warn: today.rainChance >= 50 },
          ].map(({ icon, val, warn }) => (
            <div key={icon} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14 }}>{icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: warn ? '#F4A261' : 'var(--text)', marginTop: 2 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning strip */}
      {hasWarning && firstWarning && (
        <div style={{
          padding: '9px 18px', borderTop: '1px solid rgba(244,162,97,0.2)',
          background: 'rgba(244,162,97,0.07)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 15 }}>{firstWarning.icon}</span>
          <span style={{ fontSize: 12, color: '#F4A261', lineHeight: 1.4 }}>{firstWarning.text}</span>
        </div>
      )}

      {/* All clear */}
      {!hasWarning && (
        <div style={{
          padding: '8px 18px', borderTop: '1px solid var(--border)',
          background: 'rgba(6,214,160,0.05)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>✅</span>
          <span style={{ fontSize: 12, color: 'var(--teal)' }}>Условия нормальные. Хорошего путешествия!</span>
        </div>
      )}
    </div>
  );
}

const CATEGORIES = [
  { id: 'popular', label: '🔥 Popular' },
  { id: 'sea', label: '🌊 Sea' },
  { id: 'beach', label: '🏖️ Beach' },
  { id: 'mountain', label: '⛰️ Mountain' },
];

export default function Home() {
  const { user, activeTrip } = useTrip();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('popular');

  const filtered = PLACES.filter(p => p.category.includes(activeCategory));

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 4 }}>Hi {user.firstName},</div>
        <h1 className="page-title">Where do you<br />wanna go?</h1>
        <p className="page-sub">Mangystau, Kazakhstan</p>
      </div>

      <HomeWeatherBanner />

      {/* Active trip banner */}
      {activeTrip && (
        <div
          onClick={() => navigate('/tracking')}
          style={{
            background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 28,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <span className="status-dot status-active"></span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--purple)' }}>Active trip in progress</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{activeTrip.placeName} · Tap to view tracking</div>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--text3)' }}>→</span>
        </div>
      )}

      {/* Featured place */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer',
            border: '1px solid var(--border)', position: 'relative',
          }}
          onClick={() => navigate(`/place/${PLACES[0].id}`)}
        >
          <img src={PLACES[0].image} alt="" style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            padding: '40px 24px 24px',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'white', marginBottom: 4 }}>{PLACES[0].name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{PLACES[0].region}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
              <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 14 }}>★ {PLACES[0].rating}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{PLACES[0].distance} km · {PLACES[0].duration}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className="btn"
            style={{
              padding: '8px 16px', fontSize: 13,
              background: activeCategory === c.id ? 'var(--purple)' : 'var(--surface)',
              color: activeCategory === c.id ? 'white' : 'var(--text2)',
              border: `1px solid ${activeCategory === c.id ? 'var(--purple)' : 'var(--border)'}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Places grid */}
      <div className="grid-3" style={{ gap: 20 }}>
        {filtered.map(place => (
          <div key={place.id} className="place-card" onClick={() => navigate(`/place/${place.id}`)}>
            <img src={place.image} alt={place.name} />
            <div className="place-card-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <div className="place-card-name">{place.name}</div>
                <span style={{ fontSize: 18, cursor: 'pointer' }}>♡</span>
              </div>
              <div className="place-card-region">📍 {place.region}</div>
              <div className="place-card-meta">
                <span className="rating">★ {place.rating}</span>
                <span className="distance">{place.distance} km · {place.duration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
