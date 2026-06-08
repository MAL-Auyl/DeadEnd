import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLACES } from '../data/places';
import { useTrip } from '../context/TripContext';

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
