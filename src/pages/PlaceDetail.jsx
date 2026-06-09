import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { PLACES } from '../data/places';
import { useTrip } from '../context/TripContext';
import { useLang } from '../context/LangContext';
import LiveAlerts from '../components/LiveAlerts';
import WeatherWidget from '../components/WeatherWidget';
import MapView from '../components/MapView';

// ── Quick Start Drawer ────────────────────────────────────────
function QuickStartDrawer({ place, onClose }) {
  const { user, startTrip } = useTrip();
  const { t } = useLang();
  const navigate = useNavigate();
  const [returnTime, setReturnTime] = useState('18:00');
  const [vehicle, setVehicle] = useState(place.vehicles[0]);
  const [plate, setPlate] = useState('');

  const NON_MOTOR = ['🚶 On foot', '🤙 Hitchhiking'];
  const allVehicles = [...NON_MOTOR, ...place.vehicles];
  const isMotorized = !NON_MOTOR.includes(vehicle);

  function handleStart() {
    startTrip(place, { returnTime, vehicle, plate, contacts: user.contacts, groupType: 'solo', clothing: '' });
    navigate('/tracking');
  }

  return (
    <div className="qs-overlay" onClick={onClose}>
      <div className="qs-sheet" onClick={e => e.stopPropagation()}>
        <div className="qs-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Syne, sans-serif', color: 'var(--text)', marginBottom: 4 }}>{t.pd_ready}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>📍 {place.name} · {place.distance} {t.km} · {place.duration}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{t.qs_return}</div>
            <input type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)} className="form-input" style={{ width: '100%' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{t.pd_notify}</div>
            <div style={{ padding: '11px 14px', borderRadius: 8, background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.2)', fontSize: 13, color: 'var(--teal)', fontWeight: 600 }}>
              {user.contacts.length > 0 ? user.contacts.map(c => c.name).join(', ') : t.pd_contacts_none}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: isMotorized ? 12 : 24 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{t.qs_vehicle}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {allVehicles.map(v => (
              <button key={v} onClick={() => setVehicle(v)} className={`qs-vehicle-btn${vehicle === v ? ' active' : ''}`}>{v}</button>
            ))}
          </div>
        </div>
        {isMotorized && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{t.qs_plate}</div>
            <input value={plate} onChange={e => setPlate(e.target.value)} placeholder="014 BTE 02" className="form-input" style={{ width: '100%' }} />
          </div>
        )}
        {place.warnings.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {place.warnings.slice(0, 3).map((w, i) => (
              <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'rgba(244,162,97,0.08)', color: '#F4A261', border: '1px solid rgba(244,162,97,0.2)' }}>
                {w.icon} {w.title}
              </span>
            ))}
          </div>
        )}
        <button onClick={handleStart} className="btn btn-primary btn-lg btn-full" style={{ fontSize: 17 }}>{t.pd_start_btn}</button>
      </div>
    </div>
  );
}

// ── Photo + Video Slider ──────────────────────────────────────
function PhotoSlider({ images, name }) {
  const { t } = useLang();
  const [idx, setIdx] = useState(0);
  const slides = [...images, 'VIDEO'];
  const total = slides.length;

  const goTo = (n) => setIdx((n + total) % total);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#000', overflow: 'hidden' }}>
      {slides[idx] === 'VIDEO' ? (
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1030 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(108,99,255,0.2)', border: '2px solid rgba(108,99,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, cursor: 'pointer',
            boxShadow: '0 0 40px rgba(108,99,255,0.3)',
          }}>▶</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{t.pd_video}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8, textAlign: 'center', padding: '0 40px' }}>
            {t.pd_drone}
          </div>
        </div>
      ) : (
        <img
          src={slides[idx]} alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Nav arrows */}
      {idx > 0 && (
        <button onClick={() => goTo(idx - 1)} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white',
          fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>‹</button>
      )}
      {idx < total - 1 && (
        <button onClick={() => goTo(idx + 1)} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white',
          fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>›</button>
      )}

      {/* Dot indicators */}
      <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
        {slides.map((s, i) => (
          <div key={i} onClick={() => goTo(i)} style={{
            width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
            background: i === idx ? 'white' : 'rgba(255,255,255,0.45)',
            cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        ))}
      </div>

      {/* Counter badge */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        color: 'white', fontSize: 12, fontWeight: 600,
        padding: '4px 10px', borderRadius: 20,
      }}>
        {slides[idx] === 'VIDEO' ? '🎬' : `${idx + 1}/${total}`}
      </div>

      {/* Back button */}
      <button onClick={() => window.history.back()} style={{
        position: 'absolute', top: 14, left: 14,
        width: 34, height: 34, borderRadius: '50%',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        border: 'none', color: 'white', fontSize: 16, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>←</button>
    </div>
  );
}

// ── Highlights row ────────────────────────────────────────────
function useHighlights() {
  const { t } = useLang();
  return [
    { id: 'weather', icon: '🌤️', label: t.pd_hl_weather },
    { id: 'warnings', icon: '⚠️', label: t.pd_hl_risks },
    { id: 'mama', icon: '💬', label: t.pd_hl_tips },
    { id: 'gear', icon: '🎒', label: t.pd_hl_gear },
    { id: 'route', icon: '🗺️', label: t.pd_hl_route },
  ];
}

// ── Section wrapper ───────────────────────────────────────────
function Section({ id, title, icon, children }) {
  return (
    <div id={id} style={{ padding: '20px 16px', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        <span>{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function PlaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const place = PLACES.find(p => p.id === id);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount] = useState(place?.reviews || 0);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [expandDesc, setExpandDesc] = useState(false);
  const highlights = useHighlights();

  if (!place) return <div className="page"><div style={{ color: 'var(--text2)' }}>Place not found</div></div>;

  const placeName = lang === 'kz' ? (place.nameKz || place.name) : place.name;
  const hashtags = `#${place.id} #Мангыстау #Kazakhstan #Adventure #Travel #Explore`;

  function scrollTo(sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: 'var(--bg)', minHeight: '100vh', paddingBottom: 100 }}>

      {/* ── PHOTO SLIDER ── */}
      <PhotoSlider images={place.images} name={place.name} />

      {/* ── POST HEADER ── */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--purple), var(--teal))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
            border: '2px solid transparent',
            boxShadow: '0 0 0 2px var(--bg), 0 0 0 4px rgba(108,99,255,0.5)',
          }}>⛰️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>{placeName}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>📍 {place.region}</div>
          </div>
        </div>
        <button
          onClick={() => setShowQuickStart(true)}
          style={{
            background: 'var(--purple)', color: 'white', border: 'none',
            borderRadius: 8, padding: '7px 16px', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {t.pd_go}
        </button>
      </div>

      {/* ── ACTION BAR ── */}
      <div style={{ padding: '2px 16px 10px', display: 'flex', alignItems: 'center', gap: 18 }}>
        <button onClick={() => setLiked(l => !l)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 26, transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          transform: liked ? 'scale(1.3)' : 'scale(1)',
        }}>{liked ? '❤️' : '🤍'}</button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24 }}>💬</button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24 }}>📤</button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setSaved(s => !s)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 24, transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          transform: saved ? 'scale(1.2)' : 'scale(1)',
        }}>{saved ? '🔖' : '🏷️'}</button>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          {liked ? (likeCount + 1).toLocaleString() : likeCount.toLocaleString()} {t.pd_likes}
        </span>
        <span style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 700 }}>★ {place.rating}</span>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>📍 {place.distance} {t.km}</span>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>⏱ {place.duration}</span>
      </div>

      {/* ── CAPTION ── */}
      <div style={{ padding: '0 16px 16px' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginRight: 6 }}>{placeName}</span>
        <span style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
          {expandDesc ? place.description : place.description.slice(0, 100) + (place.description.length > 100 ? '...' : '')}
        </span>
        {place.description.length > 100 && (
          <button onClick={() => setExpandDesc(e => !e)} style={{
            background: 'none', border: 'none', color: 'var(--text3)',
            cursor: 'pointer', fontSize: 13, padding: 0, marginLeft: 4,
          }}>{expandDesc ? t.pd_show_less : t.pd_show_more}</button>
        )}
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--purple)', lineHeight: 1.8 }}>{hashtags}</div>
      </div>

      {/* ── STORY HIGHLIGHTS ── */}
      <div style={{ padding: '4px 16px 18px', display: 'flex', gap: 18, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {highlights.map(h => (
          <div key={h.id} onClick={() => scrollTo(h.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{
              width: 62, height: 62, borderRadius: '50%',
              background: 'var(--bg2)',
              border: '2px solid transparent',
              backgroundClip: 'padding-box',
              boxShadow: '0 0 0 2px var(--bg), 0 0 0 4px rgba(108,99,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, transition: 'transform 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {h.icon}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{h.label}</div>
          </div>
        ))}
      </div>

      {/* ── LIVE ALERTS (if any) ── */}
      <div id="warnings-live" style={{ padding: '0 16px', marginBottom: 4 }}>
        <LiveAlerts placeId={place.id} />
      </div>

      {/* ── WEATHER ── */}
      <Section id="weather" icon="🌤️" title={t.pd_weather_now}>
        <WeatherWidget coords={place.coords} placeName={place.name} />
      </Section>

      {/* ── WARNINGS ── */}
      <Section id="warnings" icon="⚠️" title={t.pd_route_warnings}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {place.warnings.map((w, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '14px 14px',
              background: 'rgba(244,162,97,0.06)', border: '1px solid rgba(244,162,97,0.18)',
              borderRadius: 12,
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{w.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{w.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{w.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── MAMA SAYS ── */}
      <Section id="mama" icon="💬" title={t.pd_mama_says}>
        <div style={{
          background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.2)',
          borderRadius: 12, padding: '12px 14px', marginBottom: 12,
          fontSize: 13, color: 'var(--text2)', fontStyle: 'italic',
        }}>
          {t.pd_mama_sub}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {place.mamaSays.map((m, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '13px 14px',
              background: 'rgba(108,99,255,0.05)', border: '1px solid rgba(108,99,255,0.14)',
              borderRadius: 12,
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{m.icon}</span>
              <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{m.tip}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── GEAR ── */}
      <Section id="gear" icon="🎒" title={t.pd_gear_title}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {place.gear.map((g, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px',
              background: 'rgba(6,214,160,0.05)', border: '1px solid rgba(6,214,160,0.15)',
              borderRadius: 10,
            }}>
              <span style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 13 }}>✓</span>
              <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.35 }}>{g}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── ROUTE MAP + CHECKPOINTS ── */}
      <Section id="route" icon="🗺️" title={`${t.pd_hl_route} · ${place.checkpoints.length} ${t.pd_pts}`}>
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, border: '1px solid var(--border)' }}>
          <MapView place={place} height={200} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {place.checkpoints.map((cp, i) => (
            <div key={cp.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
              borderBottom: i < place.checkpoints.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: i === 0 ? 'rgba(108,99,255,0.15)' : i === place.checkpoints.length - 1 ? 'rgba(255,71,87,0.15)' : 'rgba(244,162,97,0.1)',
                border: `2px solid ${i === 0 ? 'var(--purple)' : i === place.checkpoints.length - 1 ? 'var(--red)' : 'rgba(244,162,97,0.4)'}`,
                color: i === 0 ? 'var(--purple)' : i === place.checkpoints.length - 1 ? 'var(--red)' : '#F4A261',
              }}>
                {i === 0 ? '🏁' : i === place.checkpoints.length - 1 ? '⛳' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cp.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{cp.km} {t.pd_from_start}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          {place.vehicles.map(v => (
            <span key={v} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              🚙 {v}
            </span>
          ))}
        </div>
      </Section>

      {/* ── STICKY CTA ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 20px 20px',
        background: 'linear-gradient(transparent, var(--bg) 40%)',
        maxWidth: 600, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowQuickStart(true)} className="btn btn-primary btn-lg btn-full" style={{ fontSize: 16, fontWeight: 800 }}>
            {t.pd_start_btn}
          </button>
          <button onClick={() => navigate(`/plan/${place.id}`)} className="btn btn-ghost btn-lg" style={{ flexShrink: 0, padding: '16px 18px', fontSize: 14 }} title="Детальные настройки">
            ⚙️
          </button>
        </div>
      </div>

      {showQuickStart && <QuickStartDrawer place={place} onClose={() => setShowQuickStart(false)} />}
    </div>
  );
}
