import { useState } from 'react';
import { MOCK_ACTIVE_TOURISTS } from '../data/places';
import { useTrip } from '../context/TripContext';

const COLUMNS = [
  { key: 'sos',       label: '🔴 SOS',         color: 'var(--red)',    bg: 'rgba(255,71,87,0.08)',   border: 'rgba(255,71,87,0.35)' },
  { key: 'overdue',   label: '🟡 Мерзімі өтті', color: 'var(--amber)',  bg: 'rgba(244,162,97,0.07)',  border: 'rgba(244,162,97,0.3)' },
  { key: 'active',    label: '🟢 Активті',      color: 'var(--teal)',   bg: 'rgba(6,214,160,0.06)',   border: 'rgba(6,214,160,0.25)' },
  { key: 'completed', label: '⚫ Аяқталды',     color: 'var(--text3)',  bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.07)' },
];

export default function AdminPanel() {
  const { activeTrip, user, currentCoords, isOnline } = useTrip();
  const [selected, setSelected] = useState(null);

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

  const tourists = liveTourist ? [liveTourist, ...MOCK_ACTIVE_TOURISTS] : MOCK_ACTIVE_TOURISTS;
  const sosCount = tourists.filter(t => t.status === 'sos').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif', margin: 0 }}>MChS Admin Panel</h1>
          {sosCount > 0 && (
            <span style={{
              fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
              background: 'rgba(255,71,87,0.15)', color: 'var(--red)',
              border: '1px solid rgba(255,71,87,0.4)', animation: 'pulse 1s infinite',
            }}>🔴 {sosCount} SOS</span>
          )}
          <span style={{
            marginLeft: 'auto', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
            background: isOnline ? 'rgba(6,214,160,0.1)' : 'rgba(255,71,87,0.1)',
            color: isOnline ? 'var(--teal)' : 'var(--red)',
            border: `1px solid ${isOnline ? 'rgba(6,214,160,0.3)' : 'rgba(255,71,87,0.3)'}`,
          }}>{isOnline ? '🟢 Online' : '🔴 Offline'}</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
          Нақты уақыттағы туристерді бақылау — Мангыстау облысы
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {COLUMNS.map(col => {
            const count = tourists.filter(t => t.status === col.key).length;
            return (
              <div key={col.key} style={{
                flex: 1, padding: '10px 16px', borderRadius: 10,
                background: col.bg, border: `1px solid ${col.border}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: col.color, fontFamily: 'Syne, sans-serif' }}>{count}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{col.label.replace(/^[^ ]+ /, '')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Kanban ── */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
        {COLUMNS.map((col, ci) => {
          const cards = tourists.filter(t => t.status === col.key);
          return (
            <div key={col.key} style={{
              flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              borderRight: ci < COLUMNS.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              {/* Column header */}
              <div style={{
                padding: '14px 16px 10px', borderBottom: `2px solid ${col.border}`,
                background: col.bg, flexShrink: 0,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: col.color }}>{col.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>({cards.length})</span>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cards.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 24 }}>Жоқ</div>
                )}
                {cards.map(t => (
                  <div key={t.id} onClick={() => setSelected(selected?.id === t.id ? null : t)}
                    style={{
                      background: selected?.id === t.id ? col.bg : 'var(--surface)',
                      border: `1px solid ${selected?.id === t.id ? col.border : 'var(--border)'}`,
                      borderRadius: 10, padding: '12px', cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={t.photo} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border2)' }} />
                        {t.isLive && (
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: 'var(--teal)', border: '2px solid var(--bg)', animation: 'pulse 1.5s infinite' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.name}
                          {t.isLive && <span style={{ fontSize: 9, color: 'var(--purple)', fontWeight: 700, marginLeft: 5 }}>● LIVE</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>📍 {t.destination}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>⏰ {t.expectedReturn}</div>
                    {t.checkpointsTotal > 0 && (
                      <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(t.checkpointsDone / t.checkpointsTotal) * 100}%`, background: col.color, borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detail drawer (bottom) ── */}
      {selected && (
        <div style={{
          flexShrink: 0, borderTop: `2px solid ${selected.status === 'sos' ? 'var(--red)' : 'var(--border)'}`,
          background: selected.status === 'sos' ? 'rgba(255,71,87,0.05)' : 'var(--bg2)',
          padding: '16px 28px', maxHeight: 280, overflowY: 'auto',
        }}>
          {selected.status === 'sos' && (
            <div style={{ background: 'var(--red)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: 'white', textAlign: 'center', marginBottom: 14, animation: 'pulse 1s infinite' }}>
              🆘 SOS — ДЕРЕУ КӨМЕК КЕРЕК ({selected.sosCount || 1} сигнал)
            </div>
          )}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 200 }}>
              <img src={selected.photo} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border2)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{selected.name}</div>
                {selected.isLive && <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 600 }}>● Нақты уақыт</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 32, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                ['🩸', selected.bloodType],
                ['🧥', selected.clothing],
                ['🚙', selected.vehicle],
                ['📍', selected.destination],
                ['⏰', selected.expectedReturn],
                ['✅', `${selected.checkpointsDone}/${selected.checkpointsTotal} cp`],
                selected.coords ? ['🌐', `${selected.coords.lat?.toFixed(3)}, ${selected.coords.lng?.toFixed(3)}`] : null,
              ].filter(Boolean).map(([icon, val]) => (
                <div key={icon} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
              {(selected.contacts || []).map((c, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text2)' }}>📞 {c}</div>
              ))}
              {selected.status === 'sos' && (
                <a href="tel:112" className="btn btn-danger" style={{ marginTop: 8, textDecoration: 'none', fontSize: 13 }}>
                  📞 112 шақыру
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
