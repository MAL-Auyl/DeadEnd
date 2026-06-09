import { useState, useEffect, useRef, Fragment } from 'react';
import { MOCK_ACTIVE_TOURISTS, PLACES } from '../data/places';
import { useTrip } from '../context/TripContext';
import { listenTourists, sendSOSResponse } from '../lib/sync.js';
import { FIREBASE_ENABLED } from '../lib/firebase.js';

// ── Constants ─────────────────────────────────────────────────
const INITIAL_HISTORY = [
  { id: 'h1', name: 'Алексей Попов',   time: '09:14', date: '07.06.2026', location: 'Бозжыра трактісі',  outcome: 'Эвакуирован вертолётом',    duration: '1ч 22м' },
  { id: 'h2', name: 'Aizat Nurlanova', time: '14:30', date: '06.06.2026', location: 'Шеркала тауы',       outcome: 'Закрыт: ложная тревога',    duration: '12м' },
  { id: 'h3', name: 'Thomas Brauer',   time: '11:55', date: '05.06.2026', location: 'Айрақты каньоны',    outcome: 'Найден группой спасателей', duration: '45м' },
];

const OP_STEPS = [
  { key: 'new',     icon: '🔴', label: 'Новый' },
  { key: 'enroute', icon: '🚗', label: 'Выехали' },
  { key: 'search',  icon: '🔍', label: 'Поиск' },
  { key: 'found',   icon: '✅', label: 'Найден' },
  { key: 'closed',  icon: '🏁', label: 'Закрыто' },
];

const FILTERS = [
  { key: null,      icon: '👥', label: 'Все туристы',  color: '#06D6A0' },
  { key: 'active',  icon: '🗺️', label: 'Активные',     color: '#6C63FF' },
  { key: 'sos',     icon: '🆘', label: 'SOS сегодня',  color: '#FF4757' },
  { key: 'overdue', icon: '📡', label: 'Потеря связи', color: '#F4A261' },
];

// ── V1.5 — Risk level ─────────────────────────────────────────
function computeRisk(t) {
  if (t.status === 'sos') return 'critical';
  if (t.status !== 'overdue') return null;
  const now = new Date();
  const [h, m] = (t.expectedReturn || '18:00').split(':').map(Number);
  const ret = new Date(); ret.setHours(h, m, 0, 0);
  const hoursOverdue = Math.max(0, (now - ret) / 3600000);
  const hr = now.getHours();
  const isNight   = hr >= 21 || hr < 5;
  const isEvening = hr >= 18;
  let score = hoursOverdue >= 6 ? 4 : hoursOverdue >= 3 ? 3 : hoursOverdue >= 1 ? 2 : 1;
  if (isNight) score += 3;
  else if (isEvening) score += 1;
  if (score >= 6) return 'critical';
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

const RISK = {
  critical: { label: 'Критический', color: '#FF4757', bg: 'rgba(255,71,87,0.15)',  icon: '🔴' },
  high:     { label: 'Высокий',     color: '#F97316', bg: 'rgba(249,115,22,0.15)', icon: '🔶' },
  medium:   { label: 'Средний',     color: '#F4A261', bg: 'rgba(244,162,97,0.15)', icon: '🟠' },
  low:      { label: 'Низкий',      color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: '⚪' },
};

function getRiskReasons(t) {
  const reasons = [];
  const now = new Date();
  const hr = now.getHours();
  const [h, m] = (t.expectedReturn || '18:00').split(':').map(Number);
  const ret = new Date(); ret.setHours(h, m, 0, 0);
  const hoursOverdue = Math.max(0, (now - ret) / 3600000);

  if (t.status === 'sos') reasons.push('Нажал кнопку SOS');
  if (hoursOverdue >= 1) reasons.push(`Нет связи ${Math.floor(hoursOverdue)}ч ${Math.round((hoursOverdue % 1) * 60)}м`);
  if (hr >= 21 || hr < 5) reasons.push('Ночное время');
  else if (hr >= 18) reasons.push('Вечернее время');
  if (t.status === 'overdue') reasons.push('Не вернулся в срок');
  return reasons;
}

// ── Helpers ───────────────────────────────────────────────────
function useElapsed(signalTime) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const compute = () => {
      if (!signalTime) { setElapsed('—'); return; }
      const [h, m] = signalTime.split(':').map(Number);
      const now = new Date();
      const sig = new Date(); sig.setHours(h, m, 0, 0);
      let diff = now - sig;
      if (diff < 0) diff += 86400000;
      const total = Math.floor(diff / 60000);
      const hrs = Math.floor(total / 60); const mins = total % 60;
      setElapsed(hrs > 0 ? `${hrs}ч ${mins}м` : `${mins}м`);
    };
    compute();
    const id = setInterval(compute, 30000);
    return () => clearInterval(id);
  }, [signalTime]);
  return elapsed;
}

function nowTime() { return new Date().toTimeString().slice(0, 5); }

function initLogs(t) {
  const entries = [];
  if (t.startTime) entries.push({ time: t.startTime, icon: '🚗', text: 'Турист вышел на маршрут' });
  if (t.status === 'overdue' && t.lastSignal) entries.push({ time: t.lastSignal, icon: '📡', text: 'Связь потеряна' });
  if (t.status === 'sos' && t.lastSignal) entries.push({ time: t.lastSignal, icon: '🆘', text: 'SOS получен' });
  return entries;
}

// ── V1.4 — Mini route map ────────────────────────────────────
function MiniMap({ tourist }) {
  const ref    = useRef(null);
  const mapRef = useRef(null);
  const place  = PLACES.find(p => p.name === tourist.destination);

  useEffect(() => {
    if (!ref.current) return;
    const init = () => {
      if (!window.L) { setTimeout(init, 300); return; }
      const L = window.L;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      const center = tourist.coords || place?.coords || { lat: 43.5, lng: 52.0 };
      const map = L.map(ref.current, { center: [center.lat, center.lng], zoom: 8, zoomControl: false, attributionControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
      mapRef.current = map;

      const mkIcon = (color, size = 12) => L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
        iconSize: [size, size], iconAnchor: [size / 2, size / 2], className: '',
      });

      const pts = [];
      if (place?.checkpoints?.length) {
        place.checkpoints.forEach((cp, i) => {
          const isStart = i === 0;
          const isEnd   = i === place.checkpoints.length - 1;
          L.marker([cp.coords.lat, cp.coords.lng], { icon: mkIcon(isStart ? '#6C63FF' : isEnd ? '#FF4757' : '#F4A261', isStart || isEnd ? 14 : 10) })
            .bindTooltip(cp.name).addTo(map);
          pts.push([cp.coords.lat, cp.coords.lng]);
        });
        if (pts.length > 1) L.polyline(pts, { color: '#6C63FF', weight: 2, opacity: 0.7, dashArray: '6 4' }).addTo(map);
        map.fitBounds(pts, { padding: [20, 20] });
      }

      if (tourist.coords) {
        const liveIcon = L.divIcon({
          html: `<div style="width:16px;height:16px;background:#06D6A0;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(6,214,160,0.3)"></div>`,
          iconSize: [16, 16], iconAnchor: [8, 8], className: '',
        });
        L.marker([tourist.coords.lat, tourist.coords.lng], { icon: liveIcon })
          .bindTooltip('Последняя точка').addTo(map);
      }
    };
    init();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [tourist.id]);

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        Маршрут и последняя точка
      </div>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 10 }}>
        <div ref={ref} style={{ height: 200 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { dot: '#6C63FF', label: 'Старт' },
          { dot: '#F4A261', label: 'Чекпоинт' },
          { dot: '#FF4757', label: 'Финиш' },
          { dot: '#06D6A0', label: 'Последняя точка' },
        ].map(({ dot, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── V1.2 — Activity log ───────────────────────────────────────
function ActivityLog({ entries }) {
  if (!entries?.length) {
    return <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>Нет записей</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 12, position: 'relative' }}>
          {/* Vertical line */}
          {i < entries.length - 1 && (
            <div style={{ position: 'absolute', left: 18, top: 24, width: 1, height: 'calc(100% - 12px)', background: 'rgba(255,255,255,0.08)' }} />
          )}
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, zIndex: 1,
          }}>{e.icon}</div>
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{e.text}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{e.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stat / filter card ────────────────────────────────────────
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
      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1, fontFamily: 'Syne, sans-serif' }}>{value}</div>
        <div style={{ fontSize: 10, color: active ? color : 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{label}</div>
      </div>
    </button>
  );
}

// ── Tourist list ──────────────────────────────────────────────
function TouristList({ tourists, selected, onSelect }) {
  const STATUS = {
    active:    { label: 'В пути',    dot: '#06D6A0' },
    overdue:   { label: 'Нет связи', dot: '#F4A261' },
    sos:       { label: 'SOS',       dot: '#FF4757' },
    completed: { label: 'Завершён',  dot: '#6B7280' },
  };

  if (!tourists.length) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>Нет туристов</div>;
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tourists.map(t => {
        const st       = STATUS[t.status] || STATUS.active;
        const risk     = computeRisk(t);
        const rc       = risk ? RISK[risk] : null;
        const isSelected = selected?.id === t.id;
        const isSOS    = t.status === 'sos';

        return (
          <div key={t.id} onClick={() => onSelect(t)} style={{
            padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
            background: isSelected ? (isSOS ? 'rgba(255,71,87,0.1)' : 'rgba(255,255,255,0.06)') : 'var(--bg2)',
            border: `1px solid ${isSelected ? (isSOS ? 'rgba(255,71,87,0.5)' : 'rgba(255,255,255,0.15)') : 'var(--border)'}`,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg2)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src={t.photo} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: st.dot, border: '2px solid var(--bg)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 10 }}>
                  <span>📍 {t.destination}</span>
                  <span>⏰ {t.expectedReturn}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: `${st.dot}18`, color: st.dot, border: `1px solid ${st.dot}44` }}>
                  {st.label}
                </span>
                {rc && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: rc.bg, color: rc.color, border: `1px solid ${rc.color}44` }}>
                    {rc.icon} {rc.label}
                  </span>
                )}
              </div>
            </div>

            {/* V1.5 — Risk reasons for critical/high */}
            {rc && (risk === 'critical' || risk === 'high') && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {getRiskReasons(t).map((r, i) => (
                  <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'var(--text3)' }}>{r}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tourist detail panel ──────────────────────────────────────
function TouristPanel({ t, logs, onClose, onCloseIncident, onCreateOperation, onAddLog }) {
  const [tab, setTab]           = useState('card');
  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome]   = useState('');

  const isSOS      = t.status === 'sos';
  const isNoSignal = t.status === 'overdue';
  const accentColor = isSOS ? '#FF4757' : isNoSignal ? '#F4A261' : '#06D6A0';

  // V1.3 — WhatsApp link
  const waLink = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return `https://wa.me/${digits}`;
  };

  const Row = ({ icon, label, value, red }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 12px', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ color: 'var(--text3)', flexShrink: 0, marginRight: 8 }}>{icon} {label}</span>
      <span style={{ color: red ? '#FF4757' : 'var(--text)', fontWeight: red ? 800 : 600, textAlign: 'right', wordBreak: 'break-word', maxWidth: 170 }}>{value || '—'}</span>
    </div>
  );

  const TABS = [
    { key: 'card',  label: '📋 Карточка' },
    { key: 'route', label: '🗺️ Маршрут' },
    { key: 'log',   label: `📝 Журнал (${logs?.length || 0})` },
  ];

  return (
    <div style={{ width: 340, flexShrink: 0, background: 'var(--bg2)', borderLeft: `1px solid ${isSOS ? 'rgba(255,71,87,0.35)' : 'var(--border)'}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: isSOS ? 'rgba(255,71,87,0.08)' : isNoSignal ? 'rgba(244,162,97,0.06)' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {isSOS
          ? <span style={{ background: '#FF4757', color: 'white', padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 800, animation: 'pulse 1s infinite' }}>🆘 SOS — НУЖНА ПОМОЩЬ</span>
          : isNoSignal
            ? <span style={{ background: 'rgba(244,162,97,0.15)', color: '#F4A261', border: '1px solid rgba(244,162,97,0.4)', padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>📡 Нет связи</span>
            : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>🟢 В пути</span>
        }
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            flex: 1, padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: tab === tb.key ? 700 : 400,
            color: tab === tb.key ? 'var(--text)' : 'var(--text3)',
            borderBottom: tab === tb.key ? '2px solid var(--purple)' : '2px solid transparent',
            transition: 'color 0.15s',
          }}>{tb.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 18px' }}>
        {/* ── TAB: CARD ── */}
        {tab === 'card' && <>
          {/* Photo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <img src={t.photo} alt="" style={{ width: 58, height: 58, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: `3px solid ${accentColor}55` }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{t.name}</div>
              {t.phone && <a href={`tel:${t.phone}`} onClick={() => onAddLog('📞', `Позвонили туристу (${t.phone})`)} style={{ fontSize: 12, color: 'var(--purple)', textDecoration: 'none', display: 'block', marginTop: 4 }}>📞 {t.phone}</a>}
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Выход {t.startTime} · Возврат {t.expectedReturn}</div>
            </div>
          </div>

          {/* Info rows */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 14 }}>
            <Row icon="🩸" label="Группа крови"     value={t.bloodType}   red />
            <Row icon="🚗" label="Автомобиль"       value={t.vehicle} />
            <Row icon="🔢" label="Госномер"          value={t.plate} />
            <Row icon="📍" label="Маршрут"           value={t.destination} />
            <Row icon="🌐" label="Последняя GPS"    value={t.coords ? `${t.coords.lat.toFixed(4)}, ${t.coords.lng.toFixed(4)}` : null} />
            <Row icon="📡" label="Последний сигнал" value={t.lastSignal} />
          </div>

          {/* V1.3 — Contacts */}
          {t.emergencyContact && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>📞 Родственник</div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{t.emergencyContact.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>{t.emergencyContact.relation}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`tel:${t.emergencyContact.phone}`} onClick={() => onAddLog('📞', `Позвонили родственнику — ${t.emergencyContact.name}`)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px', borderRadius: 8, background: 'rgba(108,99,255,0.12)',
                    color: '#6C63FF', border: '1px solid rgba(108,99,255,0.3)', textDecoration: 'none',
                    fontSize: 12, fontWeight: 600,
                  }}>📞 Позвонить</a>
                  <a href={waLink(t.emergencyContact.phone)} target="_blank" rel="noreferrer" onClick={() => onAddLog('💬', `WhatsApp родственнику — ${t.emergencyContact.name}`)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px', borderRadius: 8, background: 'rgba(37,211,102,0.12)',
                    color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', textDecoration: 'none',
                    fontSize: 12, fontWeight: 600,
                  }}>💬 WhatsApp</a>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Создать операцию — первая кнопка при SOS */}
            {(isSOS || isNoSignal) && (
              <button onClick={() => {
                onCreateOperation(t);
                onAddLog('🚨', 'Создана операция');
                // Немедленно уведомить туриста что SOS принят
                try { localStorage.setItem('deadend_sos_accepted', JSON.stringify({ step: 'accepted', time: new Date().toTimeString().slice(0, 5) })); } catch {}
                window.dispatchEvent(new CustomEvent('deadend_sos_update', { detail: { step: 'accepted' } }));
                if (t.deviceId || t.id?.startsWith('dev_')) sendSOSResponse(t.deviceId || t.id, 'accepted');
              }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: isSOS ? '#FF4757' : 'rgba(244,162,97,0.12)',
                border: isSOS ? 'none' : '1px solid rgba(244,162,97,0.3)',
                color: isSOS ? 'white' : '#F4A261',
                borderRadius: 10, padding: '12px', fontWeight: 800, fontSize: 14, cursor: 'pointer', width: '100%',
                animation: isSOS ? 'pulse 1.2s infinite' : 'none',
              }}>🚨 Начать операцию</button>
            )}

            {isSOS && t.phone && (
              <a href={`tel:${t.phone}`} onClick={() => onAddLog('📞', 'Позвонили туристу')} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'rgba(255,71,87,0.12)', color: '#FF4757', border: '1px solid rgba(255,71,87,0.3)',
                borderRadius: 10, padding: '10px',
                fontWeight: 700, fontSize: 13, textDecoration: 'none',
              }}>📞 Позвонить туристу</a>
            )}

            <button onClick={() => t.coords && window.open(`https://maps.google.com/?q=${t.coords.lat},${t.coords.lng}`, '_blank')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'rgba(108,99,255,0.12)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.3)',
              borderRadius: 10, padding: '10px', fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
            }}>🗺️ Открыть в Google Maps</button>

            {(isSOS || isNoSignal) && !confirming && (
              <button onClick={() => setConfirming(true)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'rgba(6,214,160,0.08)', color: '#06D6A0', border: '1px solid rgba(6,214,160,0.25)',
                borderRadius: 10, padding: '10px', fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
              }}>✅ Закрыть инцидент</button>
            )}

            {confirming && (
              <div style={{ background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.25)', borderRadius: 10, padding: '12px' }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Итог:</div>
                <input value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="Напр.: Найден, эвакуирован..." style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 12, outline: 'none', marginBottom: 8, boxSizing: 'border-box',
                }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirming(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text3)', cursor: 'pointer', fontSize: 12 }}>Отмена</button>
                  <button onClick={() => onCloseIncident(t, outcome || 'Закрыт')} style={{ flex: 2, padding: '8px', borderRadius: 8, background: '#06D6A0', border: 'none', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✅ Закрыть дело</button>
                </div>
              </div>
            )}
          </div>
        </>}

        {/* ── TAB: ROUTE ── */}
        {tab === 'route' && <MiniMap tourist={t} />}

        {/* ── TAB: LOG ── */}
        {tab === 'log' && <ActivityLog entries={logs} />}
      </div>
    </div>
  );
}

// ── Operation modal ───────────────────────────────────────────
function OperationModal({ t, initialStep, onStepChange, sentSteps, onStepSent, onClose, onCloseIncident, onAddLog }) {
  const [step, setStep]   = useState(initialStep || 'new');
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(); d.setHours(d.getHours() + 2);
    return d.toTimeString().slice(0, 5);
  });
  const [deadlineCd, setDeadlineCd] = useState('');
  const elapsed = useElapsed(t.lastSignal || t.startTime);
  const stepIndex = OP_STEPS.findIndex(s => s.key === step);

  // Deadline countdown
  useEffect(() => {
    const calc = () => {
      const [h, m] = deadline.split(':').map(Number);
      const now = new Date();
      const dl = new Date(); dl.setHours(h, m, 0, 0);
      const diff = dl - now;
      if (diff < 0) { setDeadlineCd('⚠️ Дедлайн прошёл!'); return; }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setDeadlineCd(hrs > 0 ? `${hrs}ч ${mins}м` : `${mins}м`);
    };
    calc();
    const id = setInterval(calc, 15000);
    return () => clearInterval(id);
  }, [deadline]);

  function notifyTourist(s) {
    if (sentSteps.has(s)) return;
    onStepSent(s);
    try { localStorage.setItem('deadend_sos_accepted', JSON.stringify({ step: s, time: nowTime() })); } catch {}
    window.dispatchEvent(new CustomEvent('deadend_sos_update', { detail: { step: s } }));
    if (t.deviceId || t.id?.startsWith('dev_')) {
      sendSOSResponse(t.deviceId || t.id, s);
    }
  }

  // step → { label, next, color }
  const ACTIONS = {
    new:     { label: '✅ Принять SOS — выслать группу', next: 'enroute', color: '#FF4757' },
    enroute: { label: '🔍 Прибыли — начать поиск',       next: 'search',  color: '#F4A261' },
    search:  { label: '✅ Турист найден!',                next: 'found',   color: '#06D6A0' },
    found:   { label: '🏁 Закрыть операцию',             next: 'closed',  color: '#6C63FF' },
  };
  const LOG_MSGS = {
    enroute: 'Группа выехала к туристу',
    search:  'Начат активный поиск',
    found:   'Турист найден',
    closed:  'Операция завершена',
  };

  function handleNext() {
    const action = ACTIONS[step];
    if (!action) return;
    const next = action.next;
    const opStep = OP_STEPS.find(s => s.key === next);
    if (LOG_MSGS[next]) onAddLog(opStep?.icon || '✅', LOG_MSGS[next]);
    if (['enroute', 'search', 'found'].includes(next)) notifyTourist(next);
    setStep(next);
    onStepChange(next);
    if (next === 'closed') {
      onAddLog('🏁', `Дело закрыто: ${notes || 'Операция завершена'}`);
      onCloseIncident(t, notes || 'Операция завершена', elapsed);
    }
  }

  const action = ACTIONS[step];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 520, borderRadius: 16, background: 'var(--bg2)', border: '1px solid rgba(255,71,87,0.25)', boxShadow: '0 28px 64px rgba(0,0,0,0.7)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', background: 'rgba(255,71,87,0.08)', borderBottom: '1px solid rgba(255,71,87,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#FF4757', animation: step === 'new' ? 'pulse 1s infinite' : 'none' }}>🚨 Операция</span>
            <span style={{ fontSize: 12, color: 'var(--text3)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 6 }}>#{String(t.id).slice(-4).toUpperCase()}</span>
            {step !== 'new' && (
              <span style={{ fontSize: 11, color: '#06D6A0', background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.3)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                {OP_STEPS.find(s => s.key === step)?.icon} {OP_STEPS.find(s => s.key === step)?.label}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Tourist card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', marginBottom: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <img src={t.photo} alt="" style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>📍 {t.destination}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <span style={{ fontSize: 12, background: 'rgba(255,71,87,0.15)', color: '#FF4757', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>🩸 {t.bloodType}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>🚗 {t.vehicle} · {t.plate}</span>
            </div>
          </div>

          {/* Timer + Deadline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,71,87,0.07)', border: '1px solid rgba(255,71,87,0.2)' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>⏱ SOS поступил</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FF4757', fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{elapsed}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Сигнал: {t.lastSignal || t.startTime}</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.2)' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>⏰ Дедлайн прибытия</div>
              <input type="time" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--purple)', fontSize: 22, fontWeight: 900, fontFamily: 'Syne, sans-serif', outline: 'none', width: '100%', padding: 0 }} />
              <div style={{ fontSize: 11, color: deadlineCd.includes('⚠️') ? '#FF4757' : 'var(--text3)', marginTop: 2, fontWeight: deadlineCd.includes('⚠️') ? 700 : 400 }}>{deadlineCd}</div>
            </div>
          </div>

          {/* Progress stepper — visual only, advance via button */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Прогресс операции</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {OP_STEPS.map((s, i) => {
                const isDone = i < stepIndex; const isActive = i === stepIndex; const isLast = i === OP_STEPS.length - 1;
                return (
                  <Fragment key={s.key}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 60 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: isDone ? '#06D6A0' : isActive ? 'var(--purple)' : 'rgba(255,255,255,0.06)',
                        border: `2px solid ${isDone ? '#06D6A0' : isActive ? 'var(--purple)' : 'rgba(255,255,255,0.12)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: isDone ? 14 : 16, color: isDone || isActive ? 'white' : 'var(--text3)',
                        transition: 'all 0.3s',
                        boxShadow: isActive ? '0 0 12px rgba(108,99,255,0.4)' : 'none',
                      }}>
                        {isDone ? '✓' : s.icon}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--purple)' : isDone ? '#06D6A0' : 'var(--text3)', whiteSpace: 'nowrap', textAlign: 'center' }}>{s.label}</span>
                    </div>
                    {!isLast && <div style={{ flex: 1, height: 2, background: isDone ? '#06D6A0' : 'rgba(255,255,255,0.08)', transition: 'background 0.4s', minWidth: 4, marginBottom: 14 }} />}
                  </Fragment>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>📝 Заметки</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Координаты группы, детали местности, описание туриста..." rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, resize: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }} />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text3)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Свернуть</button>
            {action && (
              <button onClick={handleNext} style={{
                flex: 2, padding: '13px', borderRadius: 10, background: action.color,
                border: 'none', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                animation: step === 'new' ? 'pulse 1.2s infinite' : 'none',
                transition: 'background 0.2s',
              }}>
                {action.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Alert table + History ─────────────────────────────────────
function AlertTable({ tourists, history, activeTab, onTabChange, onSelect }) {
  const alerted = tourists.filter(t => t.status === 'sos' || t.status === 'overdue');
  const Th = ({ children }) => (
    <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{children}</th>
  );
  return (
    <div style={{ height: 210, flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        {[{ key: 'sos', label: `🚨 Список SOS (${alerted.length})` }, { key: 'history', label: `📋 История (${history.length})` }].map(tb => (
          <button key={tb.key} onClick={() => onTabChange(tb.key)} style={{ padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: activeTab === tb.key ? 700 : 400, color: activeTab === tb.key ? 'var(--text)' : 'var(--text3)', borderBottom: activeTab === tb.key ? '2px solid var(--purple)' : '2px solid transparent', transition: 'color 0.15s' }}>{tb.label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'sos' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Время</Th><Th>Турист</Th><Th>Локация</Th><Th>Риск</Th><Th>Статус</Th></tr></thead>
            <tbody>
              {alerted.length === 0
                ? <tr><td colSpan={5} style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>Нет активных тревог</td></tr>
                : alerted.map(t => {
                    const risk = computeRisk(t); const rc = risk ? RISK[risk] : null;
                    return (
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
                          {rc && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 700, background: rc.bg, color: rc.color, border: `1px solid ${rc.color}44` }}>{rc.icon} {rc.label}</span>}
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          {t.status === 'sos'
                            ? <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: 'rgba(255,71,87,0.18)', color: '#FF4757', border: '1px solid rgba(255,71,87,0.4)', animation: 'pulse 1.2s infinite' }}>🔴 SOS</span>
                            : <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: 'rgba(244,162,97,0.13)', color: '#F4A261', border: '1px solid rgba(244,162,97,0.35)' }}>🟡 Нет связи</span>
                          }
                        </td>
                      </tr>
                    );
                  })
              }
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

// ── Акимат Statistics ─────────────────────────────────────────
const MONTHLY_STATS = {
  total: 847, foreign: 312, local: 535, avgDay: 27,
  sos: 8, sosClosed: 6, sosAvgMin: 42,
  topMonth: 'Июнь 2026',
};

const ROUTE_STATS = [
  { name: 'Бозжыра',       id: 'bozzhyra',    visits: 214, sos: 2, pct: 100 },
  { name: 'Шеркала',       id: 'sherkala',    visits: 189, sos: 1, pct: 88 },
  { name: 'Жыгылған',      id: 'zhygylgan',   visits: 156, sos: 1, pct: 73 },
  { name: 'Карынжарық',    id: 'karynzharyk', visits: 98,  sos: 2, pct: 46 },
  { name: 'Торыш',         id: 'torysh',      visits: 87,  sos: 0, pct: 41 },
  { name: 'Айрақты',       id: 'ayraqty',     visits: 76,  sos: 0, pct: 36 },
  { name: 'Шақпақ-ата',    id: 'shakpak-ata', visits: 62,  sos: 1, pct: 29 },
  { name: 'Сарыташ',       id: 'sarytas',     visits: 34,  sos: 1, pct: 16 },
];

const DANGER_ZONES = [
  { name: 'Карынжарық — дно ойпаты',  reason: 'Экстремальная жара +50°C, нет связи', level: 'critical', sos: 2, color: '#FF4757' },
  { name: 'Сарыташ — дальний каньон',  reason: 'Нет дороги, нет связи 80 км',         level: 'high',     sos: 1, color: '#F97316' },
  { name: 'Бозжыра — выход на плато',  reason: 'Сильный ветер, крутые спуски',         level: 'high',     sos: 2, color: '#F97316' },
  { name: 'Жыгылған — нижние уступы', reason: 'Осыпающийся известняк у воды',         level: 'medium',   sos: 1, color: '#F4A261' },
  { name: 'Шеркала — ночёвка в горах', reason: 'Гипотермия, нет освещения',            level: 'medium',   sos: 1, color: '#F4A261' },
];

const MONTHS = [
  { m: 'Янв', v: 42 }, { m: 'Фев', v: 58 }, { m: 'Мар', v: 134 },
  { m: 'Апр', v: 289 }, { m: 'Май', v: 512 }, { m: 'Июн', v: 847 },
];

const TOURIST_TYPES = [
  { label: 'Казахстанцы', value: 535, pct: 63, color: '#6C63FF' },
  { label: 'СНГ',         value: 178, pct: 21, color: '#06D6A0' },
  { label: 'Иностранцы',  value: 134, pct: 16, color: '#F4A261' },
];

function AkimatStats() {
  const maxVisits = ROUTE_STATS[0].visits;
  const maxMonth = Math.max(...MONTHS.map(m => m.v));

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

      {/* Title */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          Мангыстауская область · {MONTHLY_STATS.topMonth}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
          Отчёт туристической активности
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
          Данные актуальны на {new Date().toLocaleDateString('ru-RU')} · Для Акимата Мангыстауской области
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { icon: '🧳', val: MONTHLY_STATS.total.toLocaleString(), label: 'Туристов за месяц', color: '#6C63FF' },
          { icon: '🌍', val: MONTHLY_STATS.foreign, label: 'Иностранцев', color: '#06D6A0' },
          { icon: '📅', val: MONTHLY_STATS.avgDay, label: 'В среднем в день', color: '#F4A261' },
          { icon: '🆘', val: MONTHLY_STATS.sos, label: 'SOS за месяц', color: '#FF4757' },
        ].map(k => (
          <div key={k.label} style={{
            padding: '18px 20px', borderRadius: 14,
            background: `${k.color}10`, border: `1px solid ${k.color}30`,
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: k.color, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Monthly trend */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 18 }}>📈 Поток туристов по месяцам</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {MONTHS.map(({ m, v }) => (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{v >= 100 ? v : ''}</div>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  background: v === maxMonth ? 'var(--purple)' : 'rgba(108,99,255,0.35)',
                  height: `${Math.round((v / maxMonth) * 80)}px`,
                  transition: 'height 0.3s',
                }} />
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{m}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
            ↑ Пик сезона — май–август
          </div>
        </div>

        {/* Tourist type breakdown */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 18 }}>🌐 Состав туристов</div>
          {/* Stacked bar */}
          <div style={{ height: 14, borderRadius: 8, overflow: 'hidden', display: 'flex', marginBottom: 20 }}>
            {TOURIST_TYPES.map(t => (
              <div key={t.label} style={{ width: `${t.pct}%`, background: t.color }} />
            ))}
          </div>
          {TOURIST_TYPES.map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{t.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t.value.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 30, textAlign: 'right' }}>{t.pct}%</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.2)', fontSize: 12, color: 'var(--teal)' }}>
            ✅ {MONTHLY_STATS.sosClosed}/{MONTHLY_STATS.sos} SOS закрыты · Ср. время реакции {MONTHLY_STATS.sosAvgMin} мин
          </div>
        </div>
      </div>

      {/* Popular routes */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 18 }}>🗺️ Популярные маршруты</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ROUTE_STATS.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 22, fontSize: 12, fontWeight: 700, color: i < 3 ? 'var(--purple)' : 'var(--text3)', textAlign: 'center', flexShrink: 0 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', minWidth: 130, flexShrink: 0 }}>{r.name}</div>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${Math.round((r.visits / maxVisits) * 100)}%`,
                  background: i < 3 ? 'var(--purple)' : 'rgba(108,99,255,0.4)',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 36, textAlign: 'right' }}>{r.visits}</div>
              {r.sos > 0 && (
                <div style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: 'rgba(255,71,87,0.12)', color: '#FF4757', border: '1px solid rgba(255,71,87,0.3)', flexShrink: 0 }}>
                  🆘 {r.sos}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Danger zones */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>⚠️ Опасные зоны</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>По данным МЧС · Июнь 2026</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DANGER_ZONES.map((z, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 14px',
              borderRadius: 10, background: `${z.color}08`, border: `1px solid ${z.color}25`,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: z.color, flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{z.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{z.reason}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 700, background: `${z.color}18`, color: z.color, border: `1px solid ${z.color}40` }}>
                  {z.level === 'critical' ? 'Критичный' : z.level === 'high' ? 'Высокий' : 'Средний'}
                </span>
                {z.sos > 0 && <span style={{ fontSize: 10, color: 'var(--text3)' }}>🆘 {z.sos} SOS</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 14, padding: '20px 22px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)', marginBottom: 14 }}>📋 Рекомендации акимату</div>
        {[
          { icon: '📡', text: 'Установить 3 ретранслятора на маршруте Бозжыра–Карынжарық для покрытия сети' },
          { icon: '🪧', text: 'Разместить информационные щиты с QR-кодом на DeadEnd у въезда в Сарыташ и Жыгылған' },
          { icon: '🏥', text: 'Оборудовать точку первой помощи у основания Карынжарық — наиболее опасная зона' },
          { icon: '🚁', text: 'Пик сезона июль–август: усилить дежурство МЧС — ожидается рост потока до 1200 чел/мес' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 3 ? 12 : 0 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{r.icon}</span>
            <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AdminPanel() {
  const { activeTrip, user, currentCoords, isOnline } = useTrip();
  const [view, setView]           = useState('ops');
  const [filter, setFilter]       = useState(null);
  const [selected, setSelected]   = useState(null);
  const [operation, setOperation] = useState(null);
  const [closedIds, setClosedIds] = useState(new Set());
  const [history, setHistory]     = useState(INITIAL_HISTORY);
  const [alertTab, setAlertTab]   = useState('sos');
  const [logs, setLogs]           = useState({});
  const [opSteps, setOpSteps]     = useState({});
  const opSentSteps               = useRef({});

  const prevStatusRef  = useRef(null);
  const liveTouristRef = useRef(null);
  const [firebaseTourists, setFirebaseTourists] = useState([]);

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

  // Init logs for mock tourists
  useEffect(() => {
    const initial = {};
    MOCK_ACTIVE_TOURISTS.forEach(t => { initial[t.id] = initLogs(t); });
    setLogs(initial);
  }, []);

  // Subscribe to real tourists from Firebase
  useEffect(() => {
    const unsub = listenTourists((tourists) => {
      setFirebaseTourists(tourists);
      // Auto-open SOS card when a new Firebase tourist triggers SOS
      tourists.forEach(t => {
        if (t.status === 'sos' && !selected) {
          setSelected(t);
          setFilter('sos');
          addLog(t.id, '🆘', 'SOS получен (Firebase)');
        }
      });
    });
    return unsub;
  }, []);

  // Auto-open card on SOS
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = activeTrip?.status;
    if (curr === 'sos' && prev !== 'sos' && liveTouristRef.current) {
      const t = liveTouristRef.current;
      setSelected(t);
      setFilter('sos');
      addLog(t.id, '🆘', 'SOS получен');
    }
    prevStatusRef.current = curr ?? null;
  }, [activeTrip?.status]);

  const addLog = (touristId, icon, text) => {
    const time = nowTime();
    setLogs(prev => ({
      ...prev,
      [touristId]: [{ time, icon, text }, ...(prev[touristId] || [])],
    }));
  };

  // Firebase tourists take priority; keep mock ones not already covered by Firebase
  const firebaseIds = new Set(firebaseTourists.map(t => t.id));
  const mockFallback = MOCK_ACTIVE_TOURISTS.filter(t => !firebaseIds.has(t.id));
  const baseTourists = firebaseTourists.length > 0
    ? [...firebaseTourists, ...mockFallback]
    : (liveTourist ? [liveTourist, ...MOCK_ACTIVE_TOURISTS] : MOCK_ACTIVE_TOURISTS);
  const allTourists = baseTourists;
  const visible = allTourists.filter(t => !closedIds.has(t.id)).filter(t => filter === null || t.status === filter);

  const counts = {
    all:     allTourists.filter(t => !closedIds.has(t.id)).length,
    active:  allTourists.filter(t => !closedIds.has(t.id) && t.status === 'active').length,
    sos:     allTourists.filter(t => !closedIds.has(t.id) && t.status === 'sos').length,
    overdue: allTourists.filter(t => !closedIds.has(t.id) && t.status === 'overdue').length,
  };

  const handleSelect = (t) => {
    setSelected(prev => {
      if (prev?.id === t.id) return null;
      addLog(t.id, '👁️', 'Оператор открыл карточку');
      return t;
    });
  };

  const handleCloseIncident = (t, outcome, duration = '—') => {
    const now = new Date();
    setHistory(prev => [{ id: 'c-' + t.id, name: t.name, time: now.toTimeString().slice(0, 5), date: now.toLocaleDateString('ru-RU'), location: t.destination, outcome, duration }, ...prev]);
    setClosedIds(prev => new Set([...prev, t.id]));
    setOpSteps(prev => { const next = { ...prev }; delete next[t.id]; return next; });
    delete opSentSteps.current[t.id];
    // Notify tourist that SOS operation is resolved — clears SOS status on their device
    if (t.deviceId || t.id?.startsWith('dev_')) sendSOSResponse(t.deviceId || t.id, 'resolved');
    try { localStorage.setItem('deadend_sos_accepted', JSON.stringify({ step: 'resolved', time: now.toTimeString().slice(0, 5) })); } catch {}
    window.dispatchEvent(new CustomEvent('deadend_sos_update', { detail: { step: 'resolved' } }));
    setSelected(null);
    setOperation(null);
    setAlertTab('history');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>🛡️ МЧС — Центр мониторинга</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Мангыстауская область · Нажмите на карточку для фильтрации</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View switcher */}
            <div style={{ display: 'flex', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {[
                { key: 'ops',   label: '🛡️ МЧС' },
                { key: 'stats', label: '📊 Акимат' },
              ].map(v => (
                <button key={v.key} onClick={() => setView(v.key)} style={{
                  padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: view === v.key ? 'var(--purple)' : 'transparent',
                  color: view === v.key ? 'white' : 'var(--text3)',
                  transition: 'all 0.15s',
                }}>{v.label}</button>
              ))}
            </div>
            <div style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600, background: isOnline ? 'rgba(6,214,160,0.1)' : 'rgba(255,71,87,0.1)', color: isOnline ? '#06D6A0' : '#FF4757', border: `1px solid ${isOnline ? 'rgba(6,214,160,0.3)' : 'rgba(255,71,87,0.3)'}` }}>
              {isOnline ? '● Онлайн' : '● Офлайн'}
            </div>
          </div>
        </div>
        {view === 'ops' && <div style={{ display: 'flex', gap: 10 }}>
          {FILTERS.map(f => (
            <StatCard key={String(f.key)} icon={f.icon} label={f.label} color={f.color}
              value={f.key === null ? counts.all : f.key === 'active' ? counts.active : f.key === 'sos' ? counts.sos : counts.overdue}
              active={filter === f.key} blink={f.key === 'sos' && counts.sos > 0}
              onClick={() => setFilter(prev => prev === f.key ? null : f.key)}
            />
          ))}
        </div>}
      </div>

      {/* Body */}
      {view === 'ops' ? (
        <>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
            <TouristList tourists={visible} selected={selected} onSelect={handleSelect} />
            {selected && (
              <TouristPanel
                t={selected}
                logs={logs[selected.id] || []}
                onClose={() => setSelected(null)}
                onCloseIncident={handleCloseIncident}
                onCreateOperation={setOperation}
                onAddLog={(icon, text) => addLog(selected.id, icon, text)}
              />
            )}
          </div>
          {operation && (
            <OperationModal
              t={operation}
              initialStep={opSteps[operation.id] || 'new'}
              onStepChange={(step) => setOpSteps(prev => ({ ...prev, [operation.id]: step }))}
              sentSteps={opSentSteps.current[operation.id] || new Set()}
              onStepSent={(step) => {
                if (!opSentSteps.current[operation.id]) opSentSteps.current[operation.id] = new Set();
                opSentSteps.current[operation.id].add(step);
              }}
              onClose={() => setOperation(null)}
              onCloseIncident={handleCloseIncident}
              onAddLog={(icon, text) => addLog(operation.id, icon, text)}
            />
          )}
          <AlertTable
            tourists={allTourists.filter(t => !closedIds.has(t.id))}
            history={history}
            activeTab={alertTab}
            onTabChange={setAlertTab}
            onSelect={handleSelect}
          />
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          <AkimatStats />
        </div>
      )}
    </div>
  );
}
