import { useState, useEffect, useRef } from 'react';
import { MOCK_ACTIVE_TOURISTS } from '../data/places';
import { useTrip } from '../context/TripContext';

const SOS_HISTORY = [
  { id: 'h1', name: 'Алексей Попов',   time: '09:14', date: '07.06.2026', location: 'Бозжыра трактісі',  outcome: 'Эвакуирован вертолётом',    duration: '1ч 22м' },
  { id: 'h2', name: 'Aizat Nurlanova', time: '14:30', date: '06.06.2026', location: 'Шеркала тауы',       outcome: 'Закрыт: ложная тревога',    duration: '12м' },
  { id: 'h3', name: 'Thomas Brauer',   time: '11:55', date: '05.06.2026', location: 'Айрақты каньоны',    outcome: 'Найден группой спасателей', duration: '45м' },
];

// ── Map ──────────────────────────────────────────────────────
function AdminMap({ tourists, onSelect }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const onSelectRef  = useRef(onSelect);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current) return;

    const init = () => {
      if (!window.L) { setTimeout(init, 300); return; }
      const L = window.L;

      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      const map = L.map(containerRef.current, {
        center: [43.52, 52.1],
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
      mapRef.current = map;

      const colors = { sos: '#FF4757', overdue: '#F4A261', active: '#06D6A0', completed: '#6B7280' };

      tourists.forEach(t => {
        if (!t.coords?.lat) return;
        const color = colors[t.status] || '#6B7280';
        const size  = t.status === 'sos' ? 22 : 14;
        const shadow = t.status === 'sos'
          ? `0 0 0 5px ${color}44, 0 0 20px ${color}55`
          : `0 0 0 3px ${color}33`;

        const icon = L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            background:${color};border-radius:50%;
            border:3px solid white;
            box-shadow:${shadow};
            cursor:pointer;
          "></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          className: '',
        });

        const marker = L.marker([t.coords.lat, t.coords.lng], { icon });
        marker.on('click', () => onSelectRef.current(t));
        marker.bindTooltip(
          `<b>${t.name}</b><br>${t.destination}`,
          { direction: 'top', offset: [0, -size / 2 - 4] }
        );
        marker.addTo(map);
      });
    };

    init();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []); // eslint-disable-line -- init once; tourists are static mock data

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

// ── Stat card ────────────────────────────────────────────────
function StatCard({ icon, value, label, color, blink }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 18px', borderRadius: 12, flex: 1,
      background: `${color}11`, border: `1px solid ${color}33`,
      animation: blink ? 'pulse 1.2s infinite' : 'none',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}22`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 18, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, fontFamily: 'Syne, sans-serif' }}>{value}</div>
        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Tourist panel ────────────────────────────────────────────
function TouristPanel({ t, onClose }) {
  const isSOS      = t.status === 'sos';
  const isNoSignal = t.status === 'overdue';
  const accentColor = isSOS ? '#FF4757' : isNoSignal ? '#F4A261' : '#06D6A0';

  const Row = ({ icon, label, value, redValue }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '9px 12px', fontSize: 12,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ color: 'var(--text3)', flexShrink: 0, marginRight: 8 }}>{icon} {label}</span>
      <span style={{
        color: redValue ? '#FF4757' : 'var(--text)',
        fontWeight: redValue ? 800 : 600,
        textAlign: 'right', wordBreak: 'break-word', maxWidth: 170,
      }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{
      width: 310, flexShrink: 0,
      background: 'var(--bg2)',
      borderLeft: `1px solid ${isSOS ? 'rgba(255,71,87,0.35)' : 'var(--border)'}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: `1px solid var(--border)`,
        background: isSOS ? 'rgba(255,71,87,0.08)' : isNoSignal ? 'rgba(244,162,97,0.06)' : 'var(--bg3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        {isSOS ? (
          <span style={{
            background: '#FF4757', color: 'white',
            padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 800,
            animation: 'pulse 1s infinite',
          }}>🆘 SOS — НУЖНА ПОМОЩЬ</span>
        ) : isNoSignal ? (
          <span style={{
            background: 'rgba(244,162,97,0.15)', color: '#F4A261',
            border: '1px solid rgba(244,162,97,0.4)',
            padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
          }}>📡 Нет связи</span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>🟢 В пути</span>
        )}
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
          color: 'var(--text3)', borderRadius: 6, width: 28, height: 28,
          cursor: 'pointer', fontSize: 14,
        }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 18px' }}>
        {/* Photo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <img src={t.photo} alt="" style={{
            width: 60, height: 60, borderRadius: 12, objectFit: 'cover', flexShrink: 0,
            border: `3px solid ${accentColor}55`,
          }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{t.name}</div>
            {t.phone && (
              <a href={`tel:${t.phone}`} style={{
                fontSize: 12, color: 'var(--purple)', textDecoration: 'none',
                display: 'block', marginTop: 4,
              }}>📞 {t.phone}</a>
            )}
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
              Выход {t.startTime} · Возврат {t.expectedReturn}
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 14 }}>
          <Row icon="🩸" label="Группа крови"    value={t.bloodType}    redValue />
          <Row icon="🚗" label="Автомобиль"      value={t.vehicle} />
          <Row icon="🔢" label="Госномер"         value={t.plate} />
          <Row icon="📍" label="Маршрут"          value={t.destination} />
          <Row icon="🌐" label="Последняя GPS"    value={t.coords ? `${t.coords.lat.toFixed(4)}, ${t.coords.lng.toFixed(4)}` : null} />
          <Row icon="📡" label="Последний сигнал" value={t.lastSignal} />
        </div>

        {/* Emergency contact */}
        {t.emergencyContact && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 8,
            }}>Контакт родственника</div>
            <a href={`tel:${t.emergencyContact.phone}`} style={{
              display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
              padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)', borderRadius: 10,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  {t.emergencyContact.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {t.emergencyContact.relation} · {t.emergencyContact.phone}
                </div>
              </div>
              <span style={{
                marginLeft: 'auto', fontSize: 11, color: 'var(--purple)',
                fontWeight: 600, flexShrink: 0,
              }}>Позвонить →</span>
            </a>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isSOS && t.phone && (
            <a href={`tel:${t.phone}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#FF4757', color: 'white', borderRadius: 10, padding: '11px',
              fontWeight: 700, fontSize: 14, textDecoration: 'none',
              animation: 'pulse 1.2s infinite',
            }}>📞 Позвонить туристу</a>
          )}

          <button
            onClick={() => t.coords && window.open(`https://maps.google.com/?q=${t.coords.lat},${t.coords.lng}`, '_blank')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'rgba(108,99,255,0.12)', color: '#6C63FF',
              border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, padding: '10px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
            }}>🗺️ Открыть маршрут</button>

          {(isSOS || isNoSignal) && (
            <button style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'rgba(244,162,97,0.1)', color: '#F4A261',
              border: '1px solid rgba(244,162,97,0.3)', borderRadius: 10, padding: '10px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
            }}>🚨 Создать операцию</button>
          )}

          {isSOS && (
            <button style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'rgba(6,214,160,0.08)', color: '#06D6A0',
              border: '1px solid rgba(6,214,160,0.25)', borderRadius: 10, padding: '10px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
            }}>✅ Закрыть инцидент</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SOS + History table ──────────────────────────────────────
function AlertTable({ tourists, onSelect }) {
  const [tab, setTab] = useState('sos');

  const alerted = tourists.filter(t => t.status === 'sos' || t.status === 'overdue');

  const Th = ({ children }) => (
    <th style={{
      padding: '8px 14px', textAlign: 'left',
      fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase',
      letterSpacing: '0.07em', fontWeight: 600, whiteSpace: 'nowrap',
      borderBottom: '1px solid var(--border)',
    }}>{children}</th>
  );

  return (
    <div style={{
      height: 210, flexShrink: 0,
      borderTop: '1px solid var(--border)',
      background: 'var(--bg2)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'sos',     label: `🚨 Список SOS (${alerted.length})` },
          { key: 'history', label: '📋 История' },
        ].map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: tab === tb.key ? 700 : 400,
            color: tab === tb.key ? 'var(--text)' : 'var(--text3)',
            borderBottom: tab === tb.key ? '2px solid var(--purple)' : '2px solid transparent',
            transition: 'color 0.15s',
          }}>{tb.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'sos' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg2)' }}>
              <Th>Время</Th><Th>Турист</Th><Th>Локация</Th><Th>Статус</Th>
            </tr></thead>
            <tbody>
              {alerted.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
                  Нет активных тревог
                </td></tr>
              ) : alerted.map(t => (
                <tr key={t.id}
                  onClick={() => onSelect(t)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '9px 14px', fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    {t.lastSignal || t.startTime}
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={t.photo} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: 13, color: 'var(--text2)' }}>{t.destination}</td>
                  <td style={{ padding: '9px 14px' }}>
                    {t.status === 'sos' ? (
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                        background: 'rgba(255,71,87,0.18)', color: '#FF4757',
                        border: '1px solid rgba(255,71,87,0.4)', animation: 'pulse 1.2s infinite',
                      }}>🔴 Новый SOS</span>
                    ) : (
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                        background: 'rgba(244,162,97,0.13)', color: '#F4A261',
                        border: '1px solid rgba(244,162,97,0.35)',
                      }}>🟡 Нет связи</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'history' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg2)' }}>
              <Th>Турист</Th><Th>Время</Th><Th>Локация</Th><Th>Итог</Th><Th>Длит.</Th>
            </tr></thead>
            <tbody>
              {SOS_HISTORY.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{h.name}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{h.time} · {h.date}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text2)' }}>{h.location}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: '#06D6A0' }}>{h.outcome}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text3)' }}>{h.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function AdminPanel() {
  const { activeTrip, user, currentCoords, isOnline } = useTrip();
  const [selected, setSelected] = useState(null);
  const prevStatusRef   = useRef(null);
  const liveTouristRef  = useRef(null);

  const liveTourist = activeTrip ? {
    id: 'live-' + activeTrip.id,
    name: `${user.firstName} ${user.lastName}`,
    photo: user.photo,
    phone: user.phone,
    destination: activeTrip.placeName,
    status: activeTrip.status,
    startTime: new Date(activeTrip.startTime).toTimeString().slice(0, 5),
    expectedReturn: activeTrip.expectedReturn,
    lastSignal: new Date().toTimeString().slice(0, 5),
    clothing: activeTrip.clothing || '—',
    vehicle: activeTrip.vehicle || '—',
    plate: '—',
    bloodType: user.bloodType,
    emergencyContact: user.contacts?.[0]
      ? { name: user.contacts[0].name, phone: user.contacts[0].phone, relation: user.contacts[0].relation }
      : null,
    contacts: (activeTrip.contacts || []).map(c => c.phone),
    coords: currentCoords || { lat: 43.65, lng: 51.17 },
    checkpointsDone: (activeTrip.checkpoints || []).filter(c => c.status === 'done').length,
    checkpointsTotal: (activeTrip.checkpoints || []).length,
    isLive: true,
  } : null;

  liveTouristRef.current = liveTourist;

  // Автоматически открывать карточку при переходе в SOS
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = activeTrip?.status;
    if (curr === 'sos' && prev !== 'sos' && liveTouristRef.current) {
      setSelected(liveTouristRef.current);
    }
    prevStatusRef.current = curr ?? null;
  }, [activeTrip?.status]);

  const tourists = liveTourist ? [liveTourist, ...MOCK_ACTIVE_TOURISTS] : MOCK_ACTIVE_TOURISTS;

  const sosCount      = tourists.filter(t => t.status === 'sos').length;
  const noSignalCount = tourists.filter(t => t.status === 'overdue').length;
  const activeCount   = tourists.filter(t => t.status === 'active').length;

  const handleSelect = (t) => setSelected(prev => prev?.id === t.id ? null : t);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
              🛡️ МЧС — Центр мониторинга
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              Мангыстауская область · Реальное время
            </div>
          </div>
          <div style={{
            fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
            background: isOnline ? 'rgba(6,214,160,0.1)' : 'rgba(255,71,87,0.1)',
            color: isOnline ? '#06D6A0' : '#FF4757',
            border: `1px solid ${isOnline ? 'rgba(6,214,160,0.3)' : 'rgba(255,71,87,0.3)'}`,
          }}>{isOnline ? '● Онлайн' : '● Офлайн'}</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard icon="👥" value={tourists.length}  label="Активные туристы"  color="#06D6A0" />
          <StatCard icon="🗺️" value={activeCount}      label="Активные маршруты" color="#6C63FF" />
          <StatCard icon="🆘" value={sosCount}         label="SOS сегодня"       color="#FF4757" blink={sosCount > 0} />
          <StatCard icon="📡" value={noSignalCount}    label="Потеря связи"      color="#F4A261" />
        </div>
      </div>

      {/* ── Map + Panel ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>
        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Legend */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 500,
            background: 'rgba(10,10,20,0.88)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px',
            display: 'flex', flexDirection: 'column', gap: 7,
          }}>
            {[
              { dot: '#06D6A0', label: '🟢 В пути' },
              { dot: '#F4A261', label: '🟡 Нет связи' },
              { dot: '#FF4757', label: '🔴 SOS' },
            ].map(({ dot, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
              </div>
            ))}
            <div style={{ marginTop: 2, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: 'var(--text3)' }}>
              Нажмите на метку
            </div>
          </div>

          <AdminMap tourists={tourists} onSelect={handleSelect} />
        </div>

        {/* Tourist detail panel */}
        {selected && <TouristPanel t={selected} onClose={() => setSelected(null)} />}
      </div>

      {/* ── SOS / History table ── */}
      <AlertTable tourists={tourists} onSelect={handleSelect} />
    </div>
  );
}
