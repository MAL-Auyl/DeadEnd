import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PLACES } from '../data/places';
import { useTrip, SOS_GRACE_MINUTES } from '../context/TripContext';
import { useLang } from '../context/LangContext';
import MapView from '../components/MapView';
import WeatherWidget from '../components/WeatherWidget';

function loc(obj, field, lang) {
  const key = lang === 'kz' ? field + 'Kz' : lang === 'ru' ? field + 'Ru' : field;
  return obj[key] ?? obj[field];
}

export default function PlanTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, startTrip } = useTrip();
  const { t, lang } = useLang();
  const place = PLACES.find(p => p.id === id);

  const [clothing, setClothing] = useState('');
  const [vehicle, setVehicle] = useState(place?.vehicles[0] || '');
  const [plate, setPlate] = useState('');
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [returnTime, setReturnTime] = useState('18:00');
  const [groupType, setGroupType] = useState('solo');
  const [contacts, setContacts] = useState(user.contacts);

  const NON_MOTOR = ['🚶 On foot', '🤙 Hitchhiking'];
  const allVehicles = [...NON_MOTOR, ...(place?.vehicles || []), 'Other'];
  const isMotorized = !NON_MOTOR.includes(vehicle);

  if (!place) return <div className="page">{t.place_not_found}</div>;

  const placeName = loc(place, 'name', lang);

  function handleStart() {
    startTrip(place, { clothing, vehicle, plate, returnDate, returnTime, groupType, contacts });
    navigate('/tracking');
  }

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>{t.back}</button>
      <h1 className="page-title">{t.pt_title}</h1>
      <p className="page-sub">📍 {placeName} · {place.distance} {t.km} · {place.duration}</p>

      {/* Weather */}
      <div style={{ marginBottom: 24 }}>
        <WeatherWidget coords={place.coords} placeName={placeName} />
      </div>

      {/* Map */}
      <div style={{ marginBottom: 28 }}>
        <MapView place={place} height={200} lang={lang} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Trip type */}
        <div className="form-group">
          <label className="form-label">{t.pt_trip_type}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['solo', 'group', 'tour'].map(gt => (
              <button key={gt} onClick={() => setGroupType(gt)} className="btn" style={{
                flex: 1, padding: '10px 16px', fontSize: 13, textTransform: 'capitalize',
                background: groupType === gt ? 'var(--purple)' : 'var(--surface)',
                color: groupType === gt ? 'white' : 'var(--text2)',
                border: `1px solid ${groupType === gt ? 'var(--purple)' : 'var(--border)'}`,
              }}>
                {gt === 'solo' ? t.pt_type_solo : gt === 'group' ? t.pt_type_group : t.pt_type_tour}
              </button>
            ))}
          </div>
        </div>

        {/* Return date & time */}
        <div className="form-group">
          <label className="form-label">{t.qs_return}</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="date" value={returnDate} min={new Date().toISOString().slice(0, 10)}
              onChange={e => setReturnDate(e.target.value)} className="form-input" style={{ flex: 1 }}
            />
            <input
              type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)}
              className="form-input" style={{ flex: 1 }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
            {t.pt_sos_auto_pre} {SOS_GRACE_MINUTES} {t.pt_sos_auto_post}
          </div>
        </div>

        {/* Clothing */}
        <div className="form-group">
          <label className="form-label">{t.pt_clothing}</label>
          <input
            value={clothing} onChange={e => setClothing(e.target.value)}
            placeholder={t.pt_clothing_ph}
            className="form-input"
          />
        </div>

        {/* Vehicle */}
        <div className="form-group">
          <label className="form-label">{t.pt_transport}</label>
          <select value={vehicle} onChange={e => setVehicle(e.target.value)} className="form-select">
            {allVehicles.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        {/* Plate number — only for motorized transport */}
        {isMotorized && (
          <div className="form-group">
            <label className="form-label">{t.qs_plate}</label>
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
          <label className="form-label" style={{ marginBottom: 12 }}>{t.pt_contacts}</label>
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
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>⚠️ {t.pd_route_warnings}</div>
          {place.warnings.slice(0, 2).map((w, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6, display: 'flex', gap: 8 }}>
              <span>{w.icon}</span><span>{loc(w, 'title', lang)}</span>
            </div>
          ))}
        </div>

        {/* PIN reminder */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>🔑</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{t.pt_pin_title}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--purple)', letterSpacing: '0.2em' }}>{user.pin}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.pt_pin_desc}</div>
          </div>
        </div>

        <button onClick={handleStart} className="btn btn-primary btn-lg btn-full">
          {t.pt_start_btn}
        </button>
      </div>
    </div>
  );
}
