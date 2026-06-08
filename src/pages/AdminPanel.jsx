import { useState } from 'react';
import { MOCK_ACTIVE_TOURISTS } from '../data/places';
import { useTrip } from '../context/TripContext';

const statusLabel = { active: '🟢 Active', overdue: '🟡 Overdue', completed: '⚫ Completed', sos: '🔴 SOS' };
const statusBadge = { active: 'badge-teal', overdue: 'badge-amber', completed: 'badge-gray', sos: 'badge-red' };

export default function AdminPanel() {
  const { activeTrip, user, currentCoords, isOnline } = useTrip();
  const [selected, setSelected] = useState(null);

  // Нақты уақыттағы турист қосу
  const liveTourist = activeTrip ? {
    id: 'live-' + activeTrip.id,
    name: user.firstName + ' ' + user.lastName,
    photo: user.photo,
    destination: activeTrip.placeName,
    status: activeTrip.status,
    startTime: new Date(activeTrip.startTime).toLocaleTimeString('kk', { hour: '2-digit', minute: '2-digit' }),
    expectedReturn: activeTrip.expectedReturn,
    clothing: activeTrip.clothing || 'Көрсетілмеген',
    vehicle: activeTrip.vehicle || 'Көрсетілмеген',
    bloodType: user.bloodType,
    contacts: (activeTrip.contacts || []).map(c => `${c.name} ${c.phone}`),
    coords: currentCoords || { lat: 43.65, lng: 51.17 },
    checkpointsDone: (activeTrip.checkpoints || []).filter(c => c.status === 'done').length,
    checkpointsTotal: (activeTrip.checkpoints || []).length,
    isLive: true,
    sosCount: activeTrip.sosCount || 0,
  } : null;

  const tourists = liveTourist
    ? [liveTourist, ...MOCK_ACTIVE_TOURISTS]
    : MOCK_ACTIVE_TOURISTS;

  const sosCount = tourists.filter(t => t.status === 'sos').length;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <h1 className="page-title" style={{ margin: 0 }}>MChS Admin Panel</h1>
        {sosCount > 0 && (
          <span className="badge badge-red" style={{ fontSize: 12, animation: 'pulse 1s infinite' }}>
            🔴 {sosCount} SOS
          </span>
        )}
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 20,
          background: isOnline ? 'rgba(6,214,160,0.1)' : 'rgba(255,71,87,0.1)',
          color: isOnline ? 'var(--teal)' : 'var(--red)',
          border: `1px solid ${isOnline ? 'rgba(6,214,160,0.3)' : 'rgba(255,71,87,0.3)'}`,
          fontWeight: 600, marginLeft: 'auto',
        }}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </span>
      </div>
      <p className="page-sub">Нақты уақыттағы туристерді бақылау — Мангыстау облысы</p>

      {/* Summary */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {[
          { label: 'Активті', val: tourists.filter(t => t.status === 'active').length, color: 'var(--teal)' },
          { label: 'Мерзімі өтті', val: tourists.filter(t => t.status === 'overdue').length, color: 'var(--amber)' },
          { label: 'SOS', val: tourists.filter(t => t.status === 'sos').length, color: 'var(--red)' },
          { label: 'Аяқталды', val: tourists.filter(t => t.status === 'completed').length, color: 'var(--text3)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: s.color, fontFamily: 'Syne, sans-serif' }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="section-label">Туристер тізімі ({tourists.length})</div>
          {tourists.map(t => (
            <div key={t.id} onClick={() => setSelected(t)} style={{
              background: t.status === 'sos' ? 'rgba(255,71,87,0.06)' : t.isLive ? 'rgba(108,99,255,0.04)' : 'var(--surface)',
              border: `1px solid ${t.status === 'sos' ? 'rgba(255,71,87,0.4)' : selected?.id === t.id ? 'var(--purple)' : t.isLive ? 'rgba(108,99,255,0.25)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '14px 16px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s',
            }}>
              <div style={{ position: 'relative' }}>
                <img src={t.photo} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border2)', flexShrink: 0 }} />
                {t.isLive && (
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: 'var(--teal)', border: '2px solid var(--bg2)', animation: 'pulse 1.5s infinite' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  {t.name}
                  {t.isLive && <span style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 700 }}>● LIVE</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>📍 {t.destination} · Қайту: {t.expectedReturn}</div>
              </div>
              <span className={`badge ${statusBadge[t.status]}`}>{statusLabel[t.status]}</span>
            </div>
          ))}
        </div>

        {/* Detail */}
        {selected && (
          <div style={{ width: 320, flexShrink: 0 }}>
            <div className="section-label">Турист карточкасы</div>
            <div style={{
              background: selected.status === 'sos' ? 'rgba(255,71,87,0.06)' : 'var(--surface)',
              border: `1px solid ${selected.status === 'sos' ? 'rgba(255,71,87,0.4)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', overflow: 'hidden',
            }}>
              {selected.status === 'sos' && (
                <div style={{ background: 'var(--red)', padding: '10px 16px', fontSize: 13, fontWeight: 700, color: 'white', textAlign: 'center', animation: 'pulse 1s infinite' }}>
                  🆘 SOS — ДЕРЕУ КӨМЕК КЕРЕК ({selected.sosCount || 1} сигнал)
                </div>
              )}
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                  <img src={selected.photo} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border2)' }} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{selected.name}</div>
                    <span className={`badge ${statusBadge[selected.status]}`}>{statusLabel[selected.status]}</span>
                    {selected.isLive && <div style={{ fontSize: 11, color: 'var(--purple)', marginTop: 4, fontWeight: 600 }}>● Нақты уақыт деректері</div>}
                  </div>
                </div>
                {[
                  ['🩸 Қан тобы', selected.bloodType],
                  ['🧥 Киім', selected.clothing],
                  ['🚙 Көлік', selected.vehicle],
                  ['📍 Бағыт', selected.destination],
                  ['⏰ Қайту', selected.expectedReturn],
                  ['📍 Чекпоинттер', `${selected.checkpointsDone}/${selected.checkpointsTotal}`],
                  selected.coords ? ['🌐 GPS', `${selected.coords.lat?.toFixed(4)}, ${selected.coords.lng?.toFixed(4)}`] : null,
                ].filter(Boolean).map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text3)' }}>{label}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500, textAlign: 'right', maxWidth: 160 }}>{val}</span>
                  </div>
                ))}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Байланыс контактілері</div>
                  {(selected.contacts || []).map((c, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>📞 {c}</div>
                  ))}
                </div>
                {selected.status === 'sos' && (
                  <a href="tel:112" className="btn btn-danger btn-full" style={{ marginTop: 16, textDecoration: 'none' }}>
                    📞 МЧС шақыру — 112
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
