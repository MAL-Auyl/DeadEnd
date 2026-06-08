import { useState } from 'react';
import { MOCK_ACTIVE_TOURISTS } from '../data/places';
import { useTrip } from '../context/TripContext';

const COLUMNS = [
  { key: 'sos',       label: 'SOS',          icon: '🆘', color: '#FF4757', bg: 'rgba(255,71,87,0.10)', border: 'rgba(255,71,87,0.4)',  glow: '0 0 0 1px rgba(255,71,87,0.3)' },
  { key: 'overdue',   label: 'Мерзімі өтті', icon: '⚠️', color: '#F4A261', bg: 'rgba(244,162,97,0.09)', border: 'rgba(244,162,97,0.35)', glow: '' },
  { key: 'active',    label: 'Активті',      icon: '✅', color: '#06D6A0', bg: 'rgba(6,214,160,0.08)',  border: 'rgba(6,214,160,0.3)',  glow: '' },
  { key: 'completed', label: 'Аяқталды',     icon: '🏁', color: '#6B7280', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', glow: '' },
];

function StatCard({ col, count }) {
  return (
    <div style={{
      flex: 1, borderRadius: 14, padding: '16px 20px',
      background: col.bg, border: `1px solid ${col.border}`,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${col.color}22`, border: `1px solid ${col.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
      }}>{col.icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color: col.color, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{count}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{col.label}</div>
      </div>
    </div>
  );
}

function TouristCard({ t, col, selected, onClick }) {
  const pct = t.checkpointsTotal > 0 ? (t.checkpointsDone / t.checkpointsTotal) * 100 : 0;
  const isSelected = selected?.id === t.id;
  return (
    <div onClick={onClick} style={{
      borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
      background: isSelected ? col.bg : 'var(--bg2)',
      border: `1px solid ${isSelected ? col.color : 'var(--border)'}`,
      boxShadow: isSelected ? col.glow || `0 0 0 1px ${col.border}` : 'none',
      transition: 'all 0.18s',
    }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: col.color, opacity: isSelected ? 1 : 0.4 }} />

      <div style={{ padding: '14px 14px 12px' }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src={t.photo} alt="" style={{
              width: 44, height: 44, borderRadius: 10, objectFit: 'cover',
              border: `2px solid ${col.color}55`,
            }} />
            {t.isLive && (
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 12, height: 12, borderRadius: '50%',
                background: '#06D6A0', border: '2px solid var(--bg)',
                animation: 'pulse 1.5s infinite',
              }} />
            )}
            {t.status === 'sos' && (
              <div style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, borderRadius: '50%',
                background: '#FF4757', border: '2px solid var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, animation: 'pulse 1s infinite',
              }}>!</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: 'var(--text)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {t.name}
              {t.isLive && <span style={{ fontSize: 9, color: 'var(--purple)', fontWeight: 700, background: 'rgba(108,99,255,0.15)', padding: '1px 5px', borderRadius: 4 }}>LIVE</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              📍 {t.destination}
            </div>
          </div>
        </div>

        {/* Time + blood type row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: t.checkpointsTotal > 0 ? 10 : 0 }}>
          <span style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 6,
            background: 'rgba(255,255,255,0.05)', color: 'var(--text2)', flex: 1, textAlign: 'center',
          }}>⏰ {t.expectedReturn}</span>
          {t.bloodType && (
            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 6,
              background: 'rgba(255,71,87,0.1)', color: '#FF4757', fontWeight: 700,
            }}>🩸 {t.bloodType}</span>
          )}
        </div>

        {/* Progress bar */}
        {t.checkpointsTotal > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>Чекпоинттер</span>
              <span style={{ fontSize: 10, color: col.color, fontWeight: 600 }}>{t.checkpointsDone}/{t.checkpointsTotal}</span>
            </div>
            <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: col.color, borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailPanel({ t, onClose }) {
  const col = COLUMNS.find(c => c.key === t.status) || COLUMNS[2];
  return (
    <div style={{
      width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: `1px solid var(--border)`, background: 'var(--bg2)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 18px', borderBottom: `1px solid var(--border)`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: col.bg,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: col.color }}>{col.icon} {col.label}</span>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
          color: 'var(--text3)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 13,
        }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
        {t.status === 'sos' && (
          <div style={{
            background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.5)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 16,
            textAlign: 'center', animation: 'pulse 1s infinite',
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🆘</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#FF4757' }}>ДЕРЕУ КӨМЕК КЕРЕК</div>
            <div style={{ fontSize: 11, color: 'rgba(255,71,87,0.8)', marginTop: 2 }}>{t.sosCount || 1} SOS сигнал</div>
          </div>
        )}

        {/* Photo + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
          <img src={t.photo} alt="" style={{
            width: 80, height: 80, borderRadius: 16, objectFit: 'cover',
            border: `3px solid ${col.color}55`, marginBottom: 10,
          }} />
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', textAlign: 'center' }}>{t.name}</div>
          {t.isLive && <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 600, marginTop: 2 }}>● Нақты уақыт деректері</div>}
        </div>

        {/* Info grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16 }}>
          {[
            ['🩸 Қан тобы', t.bloodType],
            ['🧥 Киім', t.clothing],
            ['🚙 Көлік', t.vehicle],
            ['📍 Бағыт', t.destination],
            ['⏰ Қайту', t.expectedReturn],
            ['✅ Чекпоинт', `${t.checkpointsDone}/${t.checkpointsTotal}`],
            t.coords ? ['🌐 GPS', `${t.coords.lat?.toFixed(4)}, ${t.coords.lng?.toFixed(4)}`] : null,
          ].filter(Boolean).map(([label, val], i) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 12px', fontSize: 12,
              background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
            }}>
              <span style={{ color: 'var(--text3)' }}>{label}</span>
              <span style={{ color: 'var(--text)', fontWeight: 600, textAlign: 'right', maxWidth: 140, wordBreak: 'break-all' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Contacts */}
        {(t.contacts || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Байланыс</div>
            {t.contacts.map((c, i) => (
              <div key={i} style={{
                fontSize: 12, color: 'var(--text2)', padding: '8px 10px',
                background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 4,
              }}>📞 {c}</div>
            ))}
          </div>
        )}

        {t.status === 'sos' && (
          <a href="tel:112" style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            background: '#FF4757', color: 'white', borderRadius: 10, padding: '12px',
            fontWeight: 700, fontSize: 14, letterSpacing: '0.04em',
          }}>
            📞 МЧС шақыру — 112
          </a>
        )}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { activeTrip, user, currentCoords, isOnline } = useTrip();
  const [selected, setSelected] = useState(null);

  const liveTourist = activeTrip ? {
    id: 'live-' + activeTrip.id,
    name: user.firstName + ' ' + user.lastName,
    photo: user.photo,
    destination: activeTrip.placeName,
    status: activeTrip.status,
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
  const total = tourists.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
            MChS Admin Panel
          </div>
          {sosCount > 0 && (
            <div style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 800,
              background: 'rgba(255,71,87,0.2)', color: '#FF4757',
              border: '1px solid rgba(255,71,87,0.5)', animation: 'pulse 1s infinite',
            }}>🔴 {sosCount} SOS</div>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{total} турист</span>
            <div style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
              background: isOnline ? 'rgba(6,214,160,0.1)' : 'rgba(255,71,87,0.1)',
              color: isOnline ? '#06D6A0' : '#FF4757',
              border: `1px solid ${isOnline ? 'rgba(6,214,160,0.3)' : 'rgba(255,71,87,0.3)'}`,
            }}>{isOnline ? '● Online' : '● Offline'}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Мангыстау облысы — нақты уақыттағы бақылау</div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {COLUMNS.map(col => (
            <StatCard key={col.key} col={col} count={tourists.filter(t => t.status === col.key).length} />
          ))}
        </div>
      </div>

      {/* ── Body: Kanban + Detail ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Kanban columns */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {COLUMNS.map((col, ci) => {
            const cards = tourists.filter(t => t.status === col.key);
            return (
              <div key={col.key} style={{
                flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                borderRight: ci < COLUMNS.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                {/* Column header */}
                <div style={{
                  padding: '12px 14px 10px', flexShrink: 0,
                  borderBottom: `2px solid ${col.border}`,
                  background: col.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{col.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: col.color }}>{col.label}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800, width: 22, height: 22, borderRadius: 6,
                    background: `${col.color}22`, color: col.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{cards.length}</span>
                </div>

                {/* Cards */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cards.length === 0 ? (
                    <div style={{
                      marginTop: 32, textAlign: 'center', fontSize: 12, color: 'var(--text3)',
                      display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
                    }}>
                      <div style={{ fontSize: 28, opacity: 0.3 }}>{col.icon}</div>
                      <span>Жоқ</span>
                    </div>
                  ) : cards.map(t => (
                    <TouristCard
                      key={t.id} t={t} col={col}
                      selected={selected}
                      onClick={() => setSelected(selected?.id === t.id ? null : t)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <DetailPanel t={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
