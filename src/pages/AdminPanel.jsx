import { useState, useEffect, useRef } from 'react';
import { MOCK_ACTIVE_TOURISTS } from '../data/places';
import { useTrip } from '../context/TripContext';

const INITIAL_HISTORY = [
  { id: 'h1', name: 'Алексей Попов',   time: '09:14', date: '07.06.2026', location: 'Бозжыра трактісі',  outcome: 'Эвакуирован вертолётом',    duration: '1ч 22м' },
  { id: 'h2', name: 'Aizat Nurlanova', time: '14:30', date: '06.06.2026', location: 'Шеркала тауы',       outcome: 'Закрыт: ложная тревога',    duration: '12м' },
  { id: 'h3', name: 'Thomas Brauer',   time: '11:55', date: '05.06.2026', location: 'Айрақты каньоны',    outcome: 'Найден группой спасателей', duration: '45м' },
];

const FILTERS = [
  { key: null,      icon: '👥', label: 'Все туристы',     color: '#06D6A0' },
  { key: 'active',  icon: '🗺️', label: 'Активные',        color: '#6C63FF' },
  { key: 'sos',     icon: '🆘', label: 'SOS сегодня',     color: '#FF4757' },
  { key: 'overdue', icon: '📡', label: 'Потеря связи',    color: '#F4A261' },
];

// ── Stat / filter card ───────────────────────────────────────
function StatCard({ icon, value, label, color, active, blink, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 18px', borderRadius: 12, flex: 1,
      background: active ? `${color}22` : `${color}0d`,
      border: `1px solid ${active ? color : `${color}33`}`,
      cursor: 'pointer', textAlign: 'left',
      boxShadow: active ? `0 0 0 1px ${color}44` : 'none',
      animation: blink ? 'pulse 1.2s infinite' : 'none',
      transition: 'all 0.15s',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1, fontFamily: 'Syne, sans-serif' }}>{value}</div>
        <div style={{ fontSize: 10, color: active ? color : 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{label}</div>
      </div>
    </button>
  );
}

// ── Tourist list ─────────────────────────────────────────────
function TouristList({ tourists, selected, onSelect }) {
  const STATUS = {
    active:    { label: 'В пути',    dot: '#06D6A0' },
    overdue:   { label: 'Нет связи', dot: '#F4A261' },
    sos:       { label: 'SOS',       dot: '#FF4757' },
    completed: { label: 'Завершён',  dot: '#6B7280' },
  };

  if (tourists.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
        Нет туристов в этой категории
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tourists.map(t => {
        const st = STATUS[t.status] || STATUS.active;
        const isSelected = selected?.id === t.id;
        const isSOS = t.status === 'sos';
        return (
          <div key={t.id} onClick={() => onSelect(t)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
            background: isSelected ? (isSOS ? 'rgba(255,71,87,0.1)' : 'rgba(255,255,255,0.06)') : 'var(--bg2)',
            border: `1px solid ${isSelected ? (isSOS ? 'rgba(255,71,87,0.4)' : 'rgba(255,255,255,0.15)') : 'var(--border)'}`,
            transition: 'all 0.15s',
            animation: isSOS ? 'pulse 2s infinite' : 'none',
          }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg2)'; }}
          >
            {/* Photo */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src={t.photo} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 12, height: 12, borderRadius: '50%',
                background: st.dot, border: '2px solid var(--bg)',
              }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 10 }}>
                <span>📍 {t.destination}</span>
                <span>⏰ {t.expectedReturn}</span>
              </div>
            </div>

            {/* Status badge */}
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, flexShrink: 0,
              background: `${st.dot}18`, color: st.dot,
              border: `1px solid ${st.dot}44`,
            }}>{st.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Tourist detail panel ─────────────────────────────────────
function TouristPanel({ t, onClose, onCloseIncident }) {
  const [outcome, setOutcome] = useState('');
  const [confirming, setConfirming] = useState(false);

  const isSOS      = t.status === 'sos';
  const isNoSignal = t.status === 'overdue';
  const accentColor = isSOS ? '#FF4757' : isNoSignal ? '#F4A261' : '#06D6A0';

  const Row = ({ icon, label, value, red }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '9px 12px', fontSize: 12,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ color: 'var(--text3)', flexShrink: 0, marginRight: 8 }}>{icon} {label}</span>
      <span style={{ color: red ? '#FF4757' : 'var(--text)', fontWeight: red ? 800 : 600, textAlign: 'right', wordBreak: 'break-word', maxWidth: 170 }}>
        {value || '—'}
      </span>
    </div>
  );

  return (
    <div style={{
      width: 310, flexShrink: 0, background: 'var(--bg2)',
      borderLeft: `1px solid ${isSOS ? 'rgba(255,71,87,0.35)' : 'var(--border)'}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        background: isSOS ? 'rgba(255,71,87,0.08)' : isNoSignal ? 'rgba(244,162,97,0.06)' : 'var(--bg3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {isSOS ? (
          <span style={{ background: '#FF4757', color: 'white', padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 800, animation: 'pulse 1s infinite' }}>
            🆘 SOS — НУЖНА ПОМОЩЬ
          </span>
        ) : isNoSignal ? (
          <span style={{ background: 'rgba(244,162,97,0.15)', color: '#F4A261', border: '1px solid rgba(244,162,97,0.4)', padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
            📡 Нет связи
          </span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>🟢 В пути</span>
        )}
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 18px' }}>
        {/* Photo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <img src={t.photo} alt="" style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: `3px solid ${accentColor}55` }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{t.name}</div>
            {t.phone && (
              <a href={`tel:${t.phone}`} style={{ fontSize: 12, color: 'var(--purple)', textDecoration: 'none', display: 'block', marginTop: 4 }}>📞 {t.phone}</a>
            )}
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Выход {t.startTime} · Возврат {t.expectedReturn}</div>
          </div>
        </div>

        {/* Info */}
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 14 }}>
          <Row icon="🩸" label="Группа крови"    value={t.bloodType}    red />
          <Row icon="🚗" label="Автомобиль"      value={t.vehicle} />
          <Row icon="🔢" label="Госномер"        value={t.plate} />
          <Row icon="📍" label="Маршрут"         value={t.destination} />
          <Row icon="🌐" label="Последняя GPS"   value={t.coords ? `${t.coords.lat.toFixed(4)}, ${t.coords.lng.toFixed(4)}` : null} />
          <Row icon="📡" label="Последний сигнал" value={t.lastSignal} />
        </div>

        {/* Emergency contact */}
        {t.emergencyContact && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Контакт родственника</div>
            <a href={`tel:${t.emergencyContact.phone}`} style={{
              display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
              padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)', borderRadius: 10,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t.emergencyContact.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.emergencyContact.relation} · {t.emergencyContact.phone}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--purple)', fontWeight: 600, flexShrink: 0 }}>Позвонить →</span>
            </a>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isSOS && t.phone && (
            <a href={`tel:${t.phone}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#FF4757', color: 'white', borderRadius: 10, padding: '11px',
              fontWeight: 700, fontSize: 14, textDecoration: 'none', animation: 'pulse 1.2s infinite',
            }}>📞 Позвонить туристу</a>
          )}

          <button onClick={() => t.coords && window.open(`https://maps.google.com/?q=${t.coords.lat},${t.coords.lng}`, '_blank')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(108,99,255,0.12)', color: '#6C63FF',
            border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, padding: '10px',
            fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
          }}>🗺️ Открыть маршрут</button>

          {(isSOS || isNoSignal) && (
            <button onClick={() => setConfirming(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'rgba(244,162,97,0.1)', color: '#F4A261',
              border: '1px solid rgba(244,162,97,0.3)', borderRadius: 10, padding: '10px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
            }}>🚨 Создать операцию</button>
          )}

          {/* Close incident block */}
          {(isSOS || isNoSignal) && !confirming && (
            <button onClick={() => setConfirming(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'rgba(6,214,160,0.08)', color: '#06D6A0',
              border: '1px solid rgba(6,214,160,0.25)', borderRadius: 10, padding: '10px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
            }}>✅ Закрыть инцидент</button>
          )}

          {confirming && (
            <div style={{ background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.25)', borderRadius: 10, padding: '12px' }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Итог операции:</div>
              <input
                value={outcome}
                onChange={e => setOutcome(e.target.value)}
                placeholder="Напр.: Найден, эвакуирован..."
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 12, outline: 'none', marginBottom: 8,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirming(false)} style={{
                  flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)', color: 'var(--text3)', cursor: 'pointer', fontSize: 12,
                }}>Отмена</button>
                <button onClick={() => onCloseIncident(t, outcome || 'Инцидент закрыт')} style={{
                  flex: 2, padding: '8px', borderRadius: 8, background: '#06D6A0',
                  border: 'none', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                }}>✅ Закрыть дело</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Alert table + History ────────────────────────────────────
function AlertTable({ tourists, history, activeTab, onTabChange, onSelect }) {
  const alerted = tourists.filter(t => t.status === 'sos' || t.status === 'overdue');

  const Th = ({ children }) => (
    <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>
      {children}
    </th>
  );

  return (
    <div style={{ height: 210, flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'sos',     label: `🚨 Список SOS (${alerted.length})` },
          { key: 'history', label: `📋 История (${history.length})` },
        ].map(tb => (
          <button key={tb.key} onClick={() => onTabChange(tb.key)} style={{
            padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: activeTab === tb.key ? 700 : 400,
            color: activeTab === tb.key ? 'var(--text)' : 'var(--text3)',
            borderBottom: activeTab === tb.key ? '2px solid var(--purple)' : '2px solid transparent',
            transition: 'color 0.15s',
          }}>{tb.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'sos' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Время</Th><Th>Турист</Th><Th>Локация</Th><Th>Статус</Th></tr></thead>
            <tbody>
              {alerted.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>Нет активных тревог</td></tr>
              ) : alerted.map(t => (
                <tr key={t.id} onClick={() => onSelect(t)} style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '9px 14px', fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{t.lastSignal || t.startTime}</td>
                  <td style={{ padding: '9px 14px', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={t.photo} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: 13, color: 'var(--text2)' }}>{t.destination}</td>
                  <td style={{ padding: '9px 14px' }}>
                    {t.status === 'sos'
                      ? <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: 'rgba(255,71,87,0.18)', color: '#FF4757', border: '1px solid rgba(255,71,87,0.4)', animation: 'pulse 1.2s infinite' }}>🔴 Новый SOS</span>
                      : <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: 'rgba(244,162,97,0.13)', color: '#F4A261', border: '1px solid rgba(244,162,97,0.35)' }}>🟡 Нет связи</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'history' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Турист</Th><Th>Время</Th><Th>Локация</Th><Th>Итог</Th><Th>Длит.</Th></tr></thead>
            <tbody>
              {history.map(h => (
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
  const [filter, setFilter]       = useState(null);
  const [selected, setSelected]   = useState(null);
  const [closedIds, setClosedIds] = useState(new Set());
  const [history, setHistory]     = useState(INITIAL_HISTORY);
  const [alertTab, setAlertTab]   = useState('sos');

  const prevStatusRef  = useRef(null);
  const liveTouristRef = useRef(null);

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
    coords: currentCoords || { lat: 43.65, lng: 51.17 },
    checkpointsDone: (activeTrip.checkpoints || []).filter(c => c.status === 'done').length,
    checkpointsTotal: (activeTrip.checkpoints || []).length,
    isLive: true,
  } : null;

  liveTouristRef.current = liveTourist;

  // Автоматически открывать карточку при SOS
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = activeTrip?.status;
    if (curr === 'sos' && prev !== 'sos' && liveTouristRef.current) {
      setSelected(liveTouristRef.current);
      setFilter('sos');
    }
    prevStatusRef.current = curr ?? null;
  }, [activeTrip?.status]);

  const allTourists = liveTourist
    ? [liveTourist, ...MOCK_ACTIVE_TOURISTS]
    : MOCK_ACTIVE_TOURISTS;

  const visibleTourists = allTourists
    .filter(t => !closedIds.has(t.id))
    .filter(t => filter === null || t.status === filter);

  const counts = {
    all:     allTourists.filter(t => !closedIds.has(t.id)).length,
    active:  allTourists.filter(t => !closedIds.has(t.id) && t.status === 'active').length,
    sos:     allTourists.filter(t => !closedIds.has(t.id) && t.status === 'sos').length,
    overdue: allTourists.filter(t => !closedIds.has(t.id) && t.status === 'overdue').length,
  };

  const handleSelect = (t) => setSelected(prev => prev?.id === t.id ? null : t);

  const handleCloseIncident = (t, outcome) => {
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    const date = now.toLocaleDateString('ru-RU');
    setHistory(prev => [{
      id: 'c-' + t.id,
      name: t.name,
      time,
      date,
      location: t.destination,
      outcome,
      duration: '—',
    }, ...prev]);
    setClosedIds(prev => new Set([...prev, t.id]));
    setSelected(null);
    setAlertTab('history');
  };

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
              Мангыстауская область · Нажмите на карточку для фильтрации
            </div>
          </div>
          <div style={{
            fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
            background: isOnline ? 'rgba(6,214,160,0.1)' : 'rgba(255,71,87,0.1)',
            color: isOnline ? '#06D6A0' : '#FF4757',
            border: `1px solid ${isOnline ? 'rgba(6,214,160,0.3)' : 'rgba(255,71,87,0.3)'}`,
          }}>{isOnline ? '● Онлайн' : '● Офлайн'}</div>
        </div>

        {/* Filter stat cards */}
        <div style={{ display: 'flex', gap: 10 }}>
          {FILTERS.map(f => (
            <StatCard
              key={String(f.key)}
              icon={f.icon}
              label={f.label}
              color={f.color}
              value={f.key === null ? counts.all : f.key === 'active' ? counts.active : f.key === 'sos' ? counts.sos : counts.overdue}
              active={filter === f.key}
              blink={f.key === 'sos' && counts.sos > 0}
              onClick={() => setFilter(prev => prev === f.key ? null : f.key)}
            />
          ))}
        </div>
      </div>

      {/* ── Body: list + panel ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <TouristList tourists={visibleTourists} selected={selected} onSelect={handleSelect} />
        {selected && (
          <TouristPanel
            t={selected}
            onClose={() => setSelected(null)}
            onCloseIncident={handleCloseIncident}
          />
        )}
      </div>

      {/* ── SOS table + History ── */}
      <AlertTable
        tourists={allTourists.filter(t => !closedIds.has(t.id))}
        history={history}
        activeTab={alertTab}
        onTabChange={setAlertTab}
        onSelect={handleSelect}
      />
    </div>
  );
}
