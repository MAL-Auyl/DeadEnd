import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PLACES } from '../data/places';
import { useTrip } from '../context/TripContext';
import MapView from '../components/MapView';
import WeatherWidget from '../components/WeatherWidget';

const SAFETY_CHECKS = [
  { id: 'told', icon: '📢', text: 'I told someone where I\'m going and when I\'ll be back', textKz: 'Қайда баратынымды және қашан оралатынымды біреуге айттым' },
  { id: 'water', icon: '💧', text: 'I have enough water for the whole route', textKz: 'Бүкіл маршрутқа жеткілікті суым бар' },
  { id: 'offline', icon: '🗺️', text: 'Offline map downloaded (no signal on route)', textKz: 'Офлайн карта жүктелді (маршрутта сигнал жоқ)' },
  { id: 'pin', icon: '🔑', text: 'I memorized my emergency PIN or wrote it down', textKz: 'Авариялық PIN-кодымды жаттадым немесе жаздым' },
  { id: 'fuel', icon: '⛽', text: 'Full tank of fuel — no gas stations on the way', textKz: 'Бак толы — жол бойы бензин құю пункті жоқ' },
];

function SafetyCheckModal({ place, contacts, onConfirm, onCancel }) {
  const [checked, setChecked] = useState({});
  const allDone = SAFETY_CHECKS.every(c => checked[c.id]);

  function toggle(id) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--bg)', borderRadius: 20,
        border: '1px solid var(--border)',
        maxWidth: 480, width: '100%',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a0a00 0%, #2d1200 100%)',
          borderBottom: '1px solid rgba(239,68,68,0.2)',
          padding: '28px 28px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>⛰️</div>
          <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            127 Hours Rule
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Syne, sans-serif', color: 'white', lineHeight: 1.3, marginBottom: 10 }}>
            Aron Ralston survived 127 hours in a canyon — because he told no one where he was going.
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
            Don't repeat his mistake. Confirm before you go.
          </div>
        </div>

        {/* Checklist */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            Before starting · {place.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SAFETY_CHECKS.map(c => (
              <div
                key={c.id}
                onClick={() => toggle(c.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${checked[c.id] ? 'rgba(6,214,160,0.35)' : 'var(--border)'}`,
                  background: checked[c.id] ? 'rgba(6,214,160,0.06)' : 'var(--surface)',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${checked[c.id] ? 'var(--teal)' : 'var(--border)'}`,
                  background: checked[c.id] ? 'var(--teal)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: 'white', fontWeight: 900,
                  transition: 'all 0.15s ease',
                }}>
                  {checked[c.id] ? '✓' : ''}
                </div>
                <div>
                  <span style={{ fontSize: 16, marginRight: 6 }}>{c.icon}</span>
                  <span style={{ fontSize: 13, color: checked[c.id] ? 'var(--teal)' : 'var(--text2)', lineHeight: 1.4 }}>{c.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Contacts reminder */}
          {contacts.length > 0 && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 16 }}>📞</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                <b style={{ color: 'var(--purple)' }}>{contacts.map(c => c.name).join(', ')}</b> will receive your departure notification
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={onCancel} className="btn" style={{
              flex: 1, padding: '13px', fontSize: 14,
              background: 'var(--surface)', color: 'var(--text2)',
              border: '1px solid var(--border)',
            }}>
              ← Go back
            </button>
            <button
              onClick={onConfirm}
              disabled={!allDone}
              className="btn btn-primary"
              style={{
                flex: 2, padding: '13px', fontSize: 14, fontWeight: 700,
                opacity: allDone ? 1 : 0.35,
                cursor: allDone ? 'pointer' : 'not-allowed',
                transition: 'opacity 0.2s',
              }}
            >
              {allDone ? '🚀 Start Trip' : `${Object.values(checked).filter(Boolean).length}/${SAFETY_CHECKS.length} confirmed`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, startTrip } = useTrip();
  const place = PLACES.find(p => p.id === id);

  const [clothing, setClothing] = useState('');
  const [vehicle, setVehicle] = useState(place?.vehicles[0] || '');
  const [returnTime, setReturnTime] = useState('18:00');
  const [groupType, setGroupType] = useState('solo');
  const [contacts, setContacts] = useState(user.contacts);
  const [showSafety, setShowSafety] = useState(false);

  if (!place) return <div className="page">Place not found</div>;

  function handleStart() {
    startTrip(place, { clothing, vehicle, returnTime, groupType, contacts });
    navigate('/tracking');
  }

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>← Back</button>
      <h1 className="page-title">Plan Your Trip</h1>
      <p className="page-sub">📍 {place.name} · {place.distance} km · {place.duration}</p>

      {/* Weather */}
      <div style={{ marginBottom: 24 }}>
        <WeatherWidget coords={place.coords} placeName={place.name} />
      </div>

      {/* Map */}
      <div style={{ marginBottom: 28 }}>
        <MapView place={place} height={200} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Trip type */}
        <div className="form-group">
          <label className="form-label">Trip type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['solo', 'group', 'tour'].map(t => (
              <button key={t} onClick={() => setGroupType(t)} className="btn" style={{
                flex: 1, padding: '10px 16px', fontSize: 13, textTransform: 'capitalize',
                background: groupType === t ? 'var(--purple)' : 'var(--surface)',
                color: groupType === t ? 'white' : 'var(--text2)',
                border: `1px solid ${groupType === t ? 'var(--purple)' : 'var(--border)'}`,
              }}>
                {t === 'solo' ? '👤 Solo' : t === 'group' ? '👥 Group' : '🎯 Tour'}
              </button>
            ))}
          </div>
        </div>

        {/* Return time */}
        <div className="form-group">
          <label className="form-label">⏰ Expected return time</label>
          <input type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)} className="form-input" />
        </div>

        {/* Clothing */}
        <div className="form-group">
          <label className="form-label">🧥 Clothing description (for MChS)</label>
          <input
            value={clothing} onChange={e => setClothing(e.target.value)}
            placeholder="e.g. Yellow jacket, blue jeans, red backpack"
            className="form-input"
          />
        </div>

        {/* Vehicle */}
        <div className="form-group">
          <label className="form-label">🚙 Vehicle</label>
          <select value={vehicle} onChange={e => setVehicle(e.target.value)} className="form-select">
            {place.vehicles.map(v => <option key={v}>{v}</option>)}
            <option>Other</option>
          </select>
        </div>

        {/* Contacts */}
        <div>
          <label className="form-label" style={{ marginBottom: 12 }}>📞 Emergency contacts</label>
          {contacts.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', marginBottom: 8,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{c.phone}</div>
              </div>
              <span style={{ color: 'var(--purple)', fontSize: 18 }}>📞</span>
            </div>
          ))}
        </div>

        {/* Warnings preview */}
        <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>⚠️ Route warnings</div>
          {place.warnings.slice(0, 2).map((w, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6, display: 'flex', gap: 8 }}>
              <span>{w.icon}</span><span>{w.title}</span>
            </div>
          ))}
        </div>

        {/* PIN reminder */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>🔑</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Your emergency PIN code</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--purple)', letterSpacing: '0.2em' }}>{user.pin}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Write this down — use it from any phone to send SOS if you lose your phone</div>
          </div>
        </div>

        <button onClick={() => setShowSafety(true)} className="btn btn-primary btn-lg btn-full">
          🚀 Start Trip
        </button>
      </div>

      {showSafety && (
        <SafetyCheckModal
          place={place}
          contacts={contacts}
          onConfirm={handleStart}
          onCancel={() => setShowSafety(false)}
        />
      )}
    </div>
  );
}
