import { useNavigate } from 'react-router-dom';
import { PLACES } from '../data/places';
import { useTrip } from '../context/TripContext';
import { useLang } from '../context/LangContext';
import { useWeather, weatherIcon } from '../hooks/useWeather';
import heroPhoto from '../assets/photos/robmiddleton__1780509245_3911514779171669734_7000075621.jpg';

const AKTAU = { lat: 43.65, lng: 51.17 };

function loc(obj, field, lang) {
  const key = lang === 'kz' ? field + 'Kz' : lang === 'ru' ? field + 'Ru' : field;
  return obj[key] ?? obj[field];
}

function WeatherPill() {
  const { t } = useLang();
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
      {isDangerous && <span style={{ fontSize: 11, color: '#E89A3A' }}>⚠️ {t.home_difficult}</span>}
    </div>
  );
}

export default function Home() {
  const { activeTrip } = useTrip();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const hero = PLACES.find(p => p.id === 'karynzharyk') || PLACES[0];
  const heroBg = heroPhoto;
  const featured = PLACES.find(p => p.id === 'bozzhyra') || PLACES[0];
  const destinations = PLACES.slice(0, 4);

  return (
    <div style={{ animation: 'pageFadeIn 0.4s ease' }}>
      {/* AMBIENT ORBS */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />

      {/* HERO */}
      <section className="home-hero" onClick={() => navigate(`/place/${hero.id}`)}>
        <img src={heroBg} alt={hero.name} className="home-hero-bg" />
        <div className="home-hero-gradient" />
        <div className="home-hero-grain" />

        <div className="home-hero-top">
          <WeatherPill />
        </div>

        <div className="home-hero-content">
          <div className="home-hero-eyebrow">{t.home_eyebrow}</div>
          <h1 className="home-hero-title" style={{ whiteSpace: 'pre-line' }}>
            {t.home_title}
          </h1>
          <p className="home-hero-sub">{t.home_sub}</p>
          <div className="home-hero-actions" onClick={e => e.stopPropagation()}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate(`/place/${hero.id}`)}>
              {t.home_start}
            </button>
            <button
              className="btn btn-glass btn-lg"
              onClick={() => document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t.home_view_all}
            </button>
          </div>
        </div>

        <div className="home-hero-scroll">
          <div className="home-scroll-line" />
          <span>{t.home_scroll}</span>
        </div>
      </section>

      {/* ACTIVE TRIP BANNER */}
      {activeTrip && (
        <div className="active-trip-banner" onClick={() => navigate('/tracking')}>
          <span className="status-dot status-active" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)' }}>{t.home_active_trip}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
              {activeTrip.placeName} · {t.home_tap_track}
            </div>
          </div>
          <span style={{ color: 'var(--gold)', fontSize: 18 }}>→</span>
        </div>
      )}

      {/* FEATURED DESTINATION */}
      <section className="home-featured" onClick={() => navigate(`/place/${featured.id}`)}>
        <img
          src={featured.images?.[1] || featured.image}
          alt={featured.name}
          className="home-featured-bg"
        />
        <div className="home-featured-overlay" />
        <div className="home-featured-content">
          <div className="home-featured-eyebrow">{t.home_featured}</div>
          <h2 className="home-featured-title">
            {loc(featured, 'name', lang)}
          </h2>
          <p className="home-featured-desc">{loc(featured, 'description', lang)}</p>
          <div className="home-featured-stats">
            <span>{featured.distance} {t.km}</span>
            <span className="home-featured-dot" />
            <span>{featured.duration}</span>
            <span className="home-featured-dot" />
            <span>★ {featured.rating.toFixed(1)}</span>
          </div>
          <button
            className="home-featured-cta"
            onClick={e => { e.stopPropagation(); navigate(`/place/${featured.id}`); }}
          >
            {t.home_explore}
          </button>
        </div>
      </section>

      {/* DESTINATIONS GRID */}
      <section className="home-section" id="destinations">
        <div className="home-section-header" style={{ marginBottom: 28 }}>
          <div>
            <div className="section-label">{t.home_dest_label}</div>
            <h2 className="home-section-title">{t.home_dest_best}</h2>
          </div>
        </div>
        <div className="home-dest-grid">
          {destinations.map((place, i) => (
            <div
              key={place.id}
              className="home-dest-card"
              style={{ '--card-delay': `${i * 80}ms` }}
              onClick={() => navigate(`/place/${place.id}`)}
            >
              <div className="home-dest-img">
                <img src={place.image} alt={place.name} />
              </div>
              <div className="home-dest-overlay" />
              <div className="home-dest-badge">{place.region}</div>
              <div className="home-dest-body">
                <div className="home-dest-name">
                  {loc(place, 'name', lang)}
                </div>
                <div className="home-dest-sub">
                  {loc(place, 'description', lang)?.split('.')[0]}.
                </div>
                <div className="home-dest-meta">
                  <span className="home-dest-rating">★ {place.rating}</span>
                  <span className="home-dest-distance">{place.distance} {t.km} · {place.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
