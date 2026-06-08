import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PLACES } from '../data/places';
import MapView from '../components/MapView';
import LiveAlerts from '../components/LiveAlerts';
import WeatherWidget from '../components/WeatherWidget';

export default function PlaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const place = PLACES.find(p => p.id === id);
  const [tab, setTab] = useState('info');

  if (!place) return <div className="page"><div style={{ color: 'var(--text2)' }}>Place not found</div></div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Hero image */}
      <div style={{ position: 'relative', height: 340 }}>
        <img src={place.image} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(10,10,20,0.95))' }} />

        {/* Back btn */}
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 20, left: 20,
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'white', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13,
        }}>← Back</button>

        {/* Thumbnail strip */}
        <div style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {place.images.map((img, i) => (
            <div key={i} style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)' }}>
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>

        {/* Title */}
        <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 4 }}>{place.name}</h1>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>📍 {place.region}</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
        {[
          { icon: '★', label: 'Rating', val: `${place.rating} (${place.reviews})` },
          { icon: '📍', label: 'Distance', val: `${place.distance} km` },
          { icon: '⏱️', label: 'Drive time', val: place.duration },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '16px 20px', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: i === 0 ? 'var(--amber)' : 'var(--text)' }}>{s.icon} {s.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', padding: '0 24px' }}>
        {['info', 'warnings', 'mama', 'gear'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'capitalize',
            color: tab === t ? 'var(--purple)' : 'var(--text3)',
            borderBottom: tab === t ? '2px solid var(--purple)' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {t === 'mama' ? '💬 Mama says' : t === 'gear' ? '🎒 Gear' : t === 'warnings' ? '⚠️ Warnings' : 'ℹ️ Info'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: 28, background: 'var(--bg)' }}>
        {tab === 'info' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <WeatherWidget coords={place.coords} placeName={place.name} />
            </div>
            <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 24 }}>{place.description}</p>
            <div className="section-label" style={{ marginBottom: 12 }}>Route map</div>
            <div style={{ marginBottom: 24 }}><MapView place={place} height={220} /></div>
            <div className="section-label">Vehicles recommended</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {place.vehicles.map(v => <span key={v} className="badge badge-gray">🚙 {v}</span>)}
            </div>
            <div className="section-label">Checkpoints ({place.checkpoints.length})</div>
            <div className="checkpoint-line">
              {place.checkpoints.map((cp, i) => (
                <div key={cp.id} className="cp-item">
                  <div className={`cp-circle ${i === 0 ? 'cp-done' : 'cp-pending'}`}>
                    {i === 0 ? '✓' : i + 1}
                  </div>
                  <div>
                    <div className="cp-name">{cp.name}</div>
                    <div className="cp-km">{cp.km} km from start</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'warnings' && (
          <div>
            <LiveAlerts placeId={place.id} />
            <div className="divider" />
            <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 16 }}>General route warnings:</p>
            {place.warnings.map((w, i) => (
              <div key={i} className={`warn-card warn-${w.type}`}>
                <div className="warn-icon">{w.icon}</div>
                <div>
                  <div className="warn-title">{w.title}</div>
                  <div className="warn-desc">{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'mama' && (
          <div>
            <div style={{
              background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)',
              borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20,
              fontSize: 14, color: 'var(--text2)', fontStyle: 'italic',
            }}>
              💜 "Mama says" — жылы кеңестер, жергілікті тәжірибеден. Сіздің қауіпсіздігіңіз — бізге маңызды.
            </div>
            {place.mamaSays.map((m, i) => (
              <div key={i} className="mama-card">
                <div className="mama-emoji">{m.icon}</div>
                <div className="mama-tip">{m.tip}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'gear' && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 20 }}>Everything you need for this trip.</p>
            <div className="grid-2">
              {place.gear.map((g, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                }}>
                  <span style={{ color: 'var(--teal)', fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 14, color: 'var(--text)' }}>{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: '0 28px 40px', background: 'var(--bg)' }}>
        <button onClick={() => navigate(`/plan/${place.id}`)} className="btn btn-primary btn-lg btn-full">
          Select A Trip →
        </button>
      </div>
    </div>
  );
}
