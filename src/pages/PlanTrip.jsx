import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PLACES } from '../data/places';
import { useTrip } from '../context/TripContext';
import MapView from '../components/MapView';
import WeatherWidget from '../components/WeatherWidget';

export default function PlanTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, startTrip } = useTrip();
  const place = PLACES.find(p => p.id === id);

  const [clothing, setClothing] = useState('');
  const [vehicle, setVehicle] = useState(place?.vehicles[0] || '');
  const [plate, setPlate] = useState('');
  const [returnTime, setReturnTime] = useState('18:00');
  const [groupType, setGroupType] = useState('solo');
  const [contacts, setContacts] = useState(user.contacts);

  const NON_MOTOR = ['🚶 On foot', '🤙 Hitchhiking'];
  const allVehicles = [...NON_MOTOR, ...(place?.vehicles || []), 'Other'];
  const isMotorized = !NON_MOTOR.includes(vehicle);

  if (!place) return <div className="page">Place not found</div>;

  function handleStart() {
    startTrip(place, { clothing, vehicle, plate, returnTime, groupType, contacts });
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
          <label className="form-label">🚙 Transport</label>
          <select value={vehicle} onChange={e => setVehicle(e.target.value)} className="form-select">
            {allVehicles.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        {/* Plate number — only for motorized transport */}
        {isMotorized && (
          <div className="form-group">
            <label className="form-label">🔢 Plate number</label>
            <input
              value={plate}
              onChange={e => setPlate(e.target.value)}
              placeholder="e.g. 014 BTE 02"
              className="form-input"
            />
          </div>
        )}

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

        <button onClick={handleStart} className="btn btn-primary btn-lg btn-full">
          🚀 Start Trip
        </button>
      </div>
    </div>
  );
}
