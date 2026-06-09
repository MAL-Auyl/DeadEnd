import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLACES } from '../data/places';
import { useTrip } from '../context/TripContext';
import { useWeather, weatherIcon } from '../hooks/useWeather';

const AKTAU = { lat: 43.65, lng: 51.17 };

const CATEGORIES = [
  { id: 'all',      label: 'All' },
  { id: 'sea',      label: 'Sea' },
  { id: 'beach',    label: 'Beach' },
  { id: 'mountain', label: 'Mountain' },
];

function WeatherPill() {
  const { weather } = useWeather(AKTAU);
  if (!weather) return null;
  const { current, today } = weather;
  const isDangerous = today.windMax >= 20 || today.tempMax >= 42;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '9px 18px', borderRadius: 100,
      background: 'rgba(11,9,7,0.65)', backdropFilter: 'blur(14px)',
      border: `1px solid ${isDangerous ? 'rgba(232,154,58,0.5)' : 'rgba(255,255,255,0.12)'}`,
      color: isDangerous ? '#E89A3A' : 'rgba(255,255,255,0.85)',
      fontSize: 14, fontWeight: 600,
    }}>
      <span style={{ fontSize: 16 }}>{weatherIcon(current.code)}</span>
      {current.temp}°C
      <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />
      <span style={{ fontSize: 12, fontWeight: 500 }}>💨 {current.wind} m/s</span>
      {isDangerous && <span style={{ fontSize: 11, color: '#E89A3A' }}>⚠️ сложные</span>}
    </div>
  );
}

export default function Home() {
  const { user, activeTrip } = useTrip();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? PLACES
    : PLACES.filter(p => p.category.includes(activeCategory));
  const hero = PLACES[0];

  const maxDist = Math.max(...PLACES.map(p => p.distance));
  const avgRating = (PLACES.reduce((a, b) => a + b.rating, 0) / PLACES.length).toFixed(1);
  const totalReviews = PLACES.reduce((a, b) => a + (b.reviews || 0), 0);

  const STATS = [
    { num: `${PLACES.length}`,       label: 'Destinations' },
    { num: `${maxDist}+ km`,         label: 'from Aktau' },
    { num: `★ ${avgRating}`,         label: 'Avg rating' },
    { num: `${totalReviews}+`,       label: 'Reviews' },
  ];

  return (
    <div style={{ animation: 'pageFadeIn 0.4s ease' }}>
      {/* AMBIENT ORBS */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />

      {/* HERO */}
      <section className="home-hero" onClick={() => navigate(`/place/${hero.id}`)}>
        <img src={hero.image} alt={hero.name} className="home-hero-bg" />
        <div className="home-hero-gradient" />
        <div className="home-hero-grain" />

        <div className="home-hero-top">
          <WeatherPill />
        </div>

        <div className="home-hero-content">
          <div className="home-hero-eyebrow">Mangystau · Kazakhstan</div>
          <h1 className="home-hero-title">
            Explore the<br />
            <em>Wild Frontier</em>
          </h1>
          <p className="home-hero-sub">
            Ancient canyons, salt flats, and cosmic landscapes at the edge of the Caspian Sea.
          </p>
          <div className="home-hero-actions" onClick={e => e.stopPropagation()}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate(`/place/${hero.id}`)}>
              Explore {hero.name} →
            </button>
            <button
              className="btn btn-glass btn-lg"
              onClick={() => document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View All Places
            </button>
          </div>
        </div>

        <div className="home-hero-scroll">
          <div className="home-scroll-line" />
          <span>scroll</span>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="home-stats-bar">
        {STATS.map(s => (
          <div key={s.label} className="home-stat">
            <div className="home-stat-num">{s.num}</div>
            <div className="home-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ACTIVE TRIP BANNER */}
      {activeTrip && (
        <div className="active-trip-banner" onClick={() => navigate('/tracking')}>
          <span className="status-dot status-active" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)' }}>Active trip in progress</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
              {activeTrip.placeName} · Tap to view tracking
            </div>
          </div>
          <span style={{ color: 'var(--gold)', fontSize: 18 }}>→</span>
        </div>
      )}

      {/* DESTINATIONS */}
      <section className="home-section" id="destinations">
        <div className="home-section-header">
          <div>
            <div className="section-label">Destinations</div>
            <h2 className="home-section-title">
              {user.firstName ? `For you, ${user.firstName}` : 'Best Destinations'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`cat-pill${activeCategory === c.id ? ' cat-pill-active' : ''}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="places-grid">
            {filtered.map((place, i) => (
              <div
                key={place.id}
                className="place-card"
                style={{ '--card-delay': `${i * 70}ms` }}
                onClick={() => navigate(`/place/${place.id}`)}
              >
                <div className="place-card-img">
                  <img src={place.image} alt={place.name} />
                </div>
                <div className="place-card-overlay" />
                <div className="place-card-badge">{place.region}</div>
                <div className="place-card-body">
                  <div className="place-card-name">{place.name}</div>
                  <div className="place-card-meta">
                    <span className="rating">★ {place.rating}</span>
                    <span className="distance">{place.distance} km · {place.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏜️</div>
            <div style={{ fontSize: 16, fontFamily: 'Cormorant Garamond, serif' }}>No places in this category yet</div>
          </div>
        )}
      </section>

      {/* TRAVEL EXPERIENCES */}
      {PLACES.length > 1 && (
        <section style={{ padding: '0 var(--page-px) 88px' }}>
          <div className="home-section-header">
            <div>
              <div className="section-label">Experiences</div>
              <h2 className="home-section-title">Travel Experiences</h2>
            </div>
          </div>
          <div className="experiences-grid">
            {PLACES.slice(1, 4).map((place, i) => (
              <div
                key={place.id}
                className={`exp-card${i === 0 ? ' exp-card--wide' : ''}`}
                onClick={() => navigate(`/place/${place.id}`)}
              >
                <img src={place.image} alt={place.name} />
                <div className="exp-card-overlay" />
                <div className="exp-card-body">
                  <div className="exp-card-region">{place.region}</div>
                  <div className="exp-card-name">{place.name}</div>
                  <div className="exp-card-cta">Explore →</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
