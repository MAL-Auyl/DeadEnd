import { useState, useEffect, useRef, Fragment } from 'react';
import { MOCK_ACTIVE_TOURISTS, PLACES } from '../data/places';
import { useTrip } from '../context/TripContext';
import { listenTourists, listenTripsHistory, sendSOSResponse } from '../lib/sync.js';
import { FIREBASE_ENABLED } from '../lib/firebase.js';

// ── Constants ─────────────────────────────────────────────────
const INITIAL_HISTORY = [
  { id: 'h1', name: 'Алексей Попов',   time: '09:14', date: '07.06.2026', location: 'Бозжыра трактісі',  outcome: 'Эвакуирован вертолётом',    duration: '1ч 22м' },
  { id: 'h2', name: 'Aizat Nurlanova', time: '14:30', date: '06.06.2026', location: 'Шеркала тауы',       outcome: 'Закрыт: ложная тревога',    duration: '12м' },
  { id: 'h3', name: 'Thomas Brauer',   time: '11:55', date: '05.06.2026', location: 'Қарынжарық каньоны',    outcome: 'Найден группой спасателей', duration: '45м' },
];

const OP_STEPS = [
  { key: 'new',     label: 'Новый' },
  { key: 'enroute', label: 'Выехали' },
  { key: 'search',  label: 'Поиск' },
  { key: 'found',   label: 'Найден' },
  { key: 'closed',  label: 'Закрыто' },
];

// ── Risk logic (unchanged) ────────────────────────────────────
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
  critical: { label: 'Критический', color: '#dc2626', bg: '#fef2f2',  border: '#fca5a5' },
  high:     { label: 'Высокий',     color: '#ea580c', bg: '#fff7ed',  border: '#fdba74' },
  medium:   { label: 'Средний',     color: '#d97706', bg: '#fffbeb',  border: '#fcd34d' },
  low:      { label: 'Низкий',      color: '#6b7280', bg: '#f9fafb',  border: '#d1d5db' },
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
  if (t.startTime) entries.push({ time: t.startTime, text: 'Турист вышел на маршрут', type: 'start' });
  if (t.status === 'overdue' && t.lastSignal) entries.push({ time: t.lastSignal, text: 'Связь потеряна', type: 'warn' });
  if (t.status === 'sos' && t.lastSignal) entries.push({ time: t.lastSignal, text: 'SOS получен', type: 'sos' });
  return entries;
}

// ── Auto-overdue: escalate active → overdue 12 h after expectedReturn ──
function getEffectiveStatus(t) {
  if (t.status !== 'active') return t.status;
  if (!t.expectedReturn) return 'active';
  const [h, m] = t.expectedReturn.split(':').map(Number);
  const now = new Date();
  const ret = new Date(now);
  ret.setHours(h, m, 0, 0);
  if (ret > now) return 'active';
  const hoursLate = (now - ret) / 3_600_000;
  return hoursLate >= 12 ? 'overdue' : 'active';
}

function applyEffectiveStatuses(tourists) {
  return tourists.map(t => {
    const eff = getEffectiveStatus(t);
    return eff !== t.status ? { ...t, status: eff, _autoEscalated: true } : t;
  });
}

// ── Design tokens ─────────────────────────────────────────────
const C = {
  bg:          '#f4f5f7',
  surface:     '#ffffff',
  border:      '#e2e4e9',
  text1:       '#111318',
  text2:       '#4b5264',
  text3:       '#8f95a3',
  green:       '#16a34a',
  greenBg:     '#f0fdf4',
  greenBorder: '#bbf7d0',
  red:         '#dc2626',
  redBg:       '#fef2f2',
  redBorder:   '#fca5a5',
  amber:       '#d97706',
  amberBg:     '#fffbeb',
  amberBorder: '#fcd34d',
  blue:        '#2563eb',
  blueBg:      '#eff6ff',
  blueBorder:  '#bfdbfe',
};

// ── Mini map ──────────────────────────────────────────────────
function MiniMap({ tourist }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const place = PLACES.find(p => p.name === tourist.destination);

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
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [size, size], iconAnchor: [size / 2, size / 2], className: '',
      });
      const pts = [];
      if (place?.checkpoints?.length) {
        place.checkpoints.forEach((cp, i) => {
          const isStart = i === 0; const isEnd = i === place.checkpoints.length - 1;
          L.marker([cp.coords.lat, cp.coords.lng], { icon: mkIcon(isStart ? C.blue : isEnd ? C.red : C.amber, isStart || isEnd ? 14 : 10) })
            .bindTooltip(cp.name).addTo(map);
          pts.push([cp.coords.lat, cp.coords.lng]);
        });
        if (pts.length > 1) L.polyline(pts, { color: C.blue, weight: 2, opacity: 0.6, dashArray: '6 4' }).addTo(map);
        map.fitBounds(pts, { padding: [20, 20] });
      }
      if (tourist.coords) {
        const liveIcon = L.divIcon({
          html: `<div style="width:14px;height:14px;background:${C.green};border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(22,163,74,0.25)"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7], className: '',
        });
        L.marker([tourist.coords.lat, tourist.coords.lng], { icon: liveIcon }).bindTooltip('Последняя точка').addTo(map);
      }
    };
    init();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [tourist.id]);

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Маршрут</div>
      <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: 10 }}>
        <div ref={ref} style={{ height: 180 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[{ dot: C.blue, label: 'Старт' }, { dot: C.amber, label: 'Чекпоинт' }, { dot: C.red, label: 'Финиш' }, { dot: C.green, label: 'Позиция' }].map(({ dot, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />
            <span style={{ fontSize: 11, color: C.text3 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Activity log ──────────────────────────────────────────────
function ActivityLog({ entries }) {
  if (!entries?.length) return <div style={{ fontSize: 13, color: C.text3, textAlign: 'center', padding: '24px 0' }}>Нет записей</div>;
  const typeColor = { start: C.green, warn: C.amber, sos: C.red, default: C.text3 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 14, position: 'relative' }}>
          {i < entries.length - 1 && (
            <div style={{ position: 'absolute', left: 15, top: 22, width: 1, height: 'calc(100% - 10px)', background: C.border }} />
          )}
          <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColor[e.type] || typeColor.default }} />
          </div>
          <div style={{ paddingTop: 5 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text1, lineHeight: 1.3 }}>{e.text}</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{e.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Metric card ───────────────────────────────────────────────
function MetricCard({ value, label, color, bg, border, blink, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '14px 18px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
      background: active ? bg : C.surface,
      border: `1px solid ${active ? border : C.border}`,
      transition: 'all 0.15s',
      boxShadow: active ? `0 0 0 3px ${bg}` : '0 1px 3px rgba(0,0,0,0.04)',
      animation: blink ? 'adminPulse 1.5s ease infinite' : 'none',
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'Syne, sans-serif', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </button>
  );
}

// ── Tourist list ──────────────────────────────────────────────
function TouristList({ tourists, selected, onSelect }) {
  if (!tourists.length) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3, fontSize: 13 }}>Нет туристов</div>;
  }

  const STATUS = {
    active:    { label: 'В пути',    color: C.green,  bg: C.greenBg,  border: C.greenBorder },
    overdue:   { label: 'Нет связи', color: C.amber,  bg: C.amberBg,  border: C.amberBorder },
    sos:       { label: 'SOS',       color: C.red,    bg: C.redBg,    border: C.redBorder },
    completed: { label: 'Завершён',  color: C.text3,  bg: C.bg,       border: C.border },
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
      {tourists.map(t => {
        const st = STATUS[t.status] || STATUS.active;
        const risk = computeRisk(t);
        const rc = risk ? RISK[risk] : null;
        const isSelected = selected?.id === t.id;
        const isSOS = t.status === 'sos';

        return (
          <div key={t.id} onClick={() => onSelect(t)} style={{
            padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 4,
            background: isSelected ? (isSOS ? C.redBg : C.blueBg) : C.surface,
            border: `1px solid ${isSelected ? (isSOS ? C.redBorder : C.blueBorder) : C.border}`,
            transition: 'all 0.12s',
            animation: isSOS && !isSelected ? 'adminPulse 1.5s ease infinite' : 'none',
          }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.bg; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = C.surface; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src={t.photo} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: st.color, border: '2px solid white' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text1, marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: C.text2, display: 'flex', gap: 8 }}>
                  <span>{t.destination}</span>
                  <span style={{ color: C.text3 }}>·</span>
                  <span>{t.expectedReturn}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                  {st.label}
                </span>
                {rc && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                    {rc.label}
                  </span>
                )}
              </div>
            </div>
            {rc && (risk === 'critical' || risk === 'high') && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {getRiskReasons(t).map((r, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: C.bg, color: C.text3, border: `1px solid ${C.border}` }}>{r}</span>
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
  const [tab, setTab] = useState('card');
  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome] = useState('');

  const isSOS = t.status === 'sos';
  const isNoSignal = t.status === 'overdue';

  const waLink = (phone) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  const Row = ({ label, value, red }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
      <span style={{ color: C.text3, flexShrink: 0, marginRight: 8 }}>{label}</span>
      <span style={{ color: red ? C.red : C.text1, fontWeight: red ? 700 : 500, textAlign: 'right', wordBreak: 'break-word', maxWidth: 180 }}>{value || '—'}</span>
    </div>
  );

  const TABS = [
    { key: 'card',  label: 'Карточка' },
    { key: 'route', label: 'Маршрут' },
    { key: 'log',   label: `Журнал (${logs?.length || 0})` },
  ];

  const headerBg     = isSOS ? C.redBg : isNoSignal ? C.amberBg : C.surface;
  const headerBorder = isSOS ? C.redBorder : isNoSignal ? C.amberBorder : C.border;

  return (
    <div style={{ width: 340, flexShrink: 0, background: C.surface, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${headerBorder}`, flexShrink: 0, background: headerBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {isSOS
          ? <span style={{ background: C.red, color: 'white', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, animation: 'adminPulse 1s infinite' }}>SOS — НУЖНА ПОМОЩЬ</span>
          : isNoSignal
            ? <span style={{ background: C.amberBg, color: C.amber, border: `1px solid ${C.amberBorder}`, padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>Нет связи</span>
            : <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>● В пути</span>
        }
        <button onClick={onClose} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text3, borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0, padding: '0 16px' }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: tab === tb.key ? 700 : 400, marginRight: 16,
            color: tab === tb.key ? C.text1 : C.text3,
            borderBottom: tab === tb.key ? `2px solid ${C.text1}` : '2px solid transparent',
            transition: 'all 0.12s',
          }}>{tb.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {tab === 'card' && <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <img src={t.photo} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text1, lineHeight: 1.2 }}>{t.name}</div>
              {t.phone && <a href={`tel:${t.phone}`} onClick={() => onAddLog('📞', `Позвонили (${t.phone})`)} style={{ fontSize: 12, color: C.blue, textDecoration: 'none', display: 'block', marginTop: 3 }}>{t.phone}</a>}
              <div style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>Выход {t.startTime} · Возврат {t.expectedReturn}</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Row label="Группа крови"     value={t.bloodType}   red />
            <Row label="Аллергии"         value={t.allergies}   red />
            <Row label="Особые приметы"   value={t.specialMarks} />
            <Row label="Рост / вес"       value={t.height || t.weight ? `${t.height || '—'} см / ${t.weight || '—'} кг` : null} />
            <Row label="Автомобиль"       value={t.vehicle} />
            <Row label="Госномер"         value={t.plate} />
            <Row label="Маршрут"          value={t.destination} />
            <Row label="Последняя GPS"    value={t.coords ? `${t.coords.lat.toFixed(4)}, ${t.coords.lng.toFixed(4)}` : null} />
            <Row label="Последний сигнал" value={t.lastSignal} />
          </div>

          {t.emergencyContact && (
            <div style={{ marginBottom: 16, padding: '12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Родственник</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text1 }}>{t.emergencyContact.name}</div>
              <div style={{ fontSize: 12, color: C.text3, marginBottom: 10 }}>{t.emergencyContact.relation}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`tel:${t.emergencyContact.phone}`} onClick={() => onAddLog('📞', `Позвонили — ${t.emergencyContact.name}`)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px', borderRadius: 8, background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBorder}`, textDecoration: 'none', fontSize: 12, fontWeight: 600,
                }}>Позвонить</a>
                <a href={waLink(t.emergencyContact.phone)} target="_blank" rel="noreferrer" onClick={() => onAddLog('💬', `WhatsApp — ${t.emergencyContact.name}`)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', textDecoration: 'none', fontSize: 12, fontWeight: 600,
                }}>WhatsApp</a>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(isSOS || isNoSignal) && (
              <button onClick={() => {
                onCreateOperation(t);
                onAddLog('🚨', 'Создана операция');
                const targetId = t.deviceId || t.id;
                try { localStorage.setItem('deadend_sos_accepted', JSON.stringify({ step: 'accepted', time: nowTime(), deviceId: targetId })); } catch {}
                window.dispatchEvent(new CustomEvent('deadend_sos_update', { detail: { step: 'accepted', deviceId: targetId } }));
                if (t.deviceId || t.id?.startsWith('dev_')) sendSOSResponse(t.deviceId || t.id, 'accepted');
              }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSOS ? C.red : C.amberBg, border: isSOS ? 'none' : `1px solid ${C.amberBorder}`,
                color: isSOS ? 'white' : C.amber, borderRadius: 8, padding: '11px', fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%',
                animation: isSOS ? 'adminPulse 1.2s infinite' : 'none',
              }}>Начать операцию</button>
            )}
            {isSOS && t.phone && (
              <a href={`tel:${t.phone}`} onClick={() => onAddLog('📞', 'Позвонили туристу')} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: C.redBg, color: C.red, border: `1px solid ${C.redBorder}`,
                borderRadius: 8, padding: '10px', fontWeight: 600, fontSize: 13, textDecoration: 'none',
              }}>Позвонить туристу</a>
            )}
            <button onClick={() => t.coords && window.open(`https://maps.google.com/?q=${t.coords.lat},${t.coords.lng}`, '_blank')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: C.bg, color: C.text2, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '10px', fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
            }}>Открыть в Google Maps</button>
            {(isSOS || isNoSignal) && !confirming && (
              <button onClick={() => setConfirming(true)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}`,
                borderRadius: 8, padding: '10px', fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
              }}>Закрыть инцидент</button>
            )}
            {confirming && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8 }}>Итог операции:</div>
                <input value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="Напр.: Найден, эвакуирован..." style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  background: C.surface, border: `1px solid ${C.border}`,
                  color: C.text1, fontSize: 13, outline: 'none', marginBottom: 8, boxSizing: 'border-box',
                }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirming(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.text3, cursor: 'pointer', fontSize: 12 }}>Отмена</button>
                  <button onClick={() => onCloseIncident(t, outcome || 'Закрыт')} style={{ flex: 2, padding: '8px', borderRadius: 8, background: C.green, border: 'none', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Закрыть дело</button>
                </div>
              </div>
            )}
          </div>
        </>}
        {tab === 'route' && <MiniMap tourist={t} />}
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

  useEffect(() => {
    const calc = () => {
      const [h, m] = deadline.split(':').map(Number);
      const now = new Date();
      const dl = new Date(); dl.setHours(h, m, 0, 0);
      const diff = dl - now;
      if (diff < 0) { setDeadlineCd('Дедлайн прошёл'); return; }
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
    const targetId = t.deviceId || t.id;
    try { localStorage.setItem('deadend_sos_accepted', JSON.stringify({ step: s, time: nowTime(), deviceId: targetId })); } catch {}
    window.dispatchEvent(new CustomEvent('deadend_sos_update', { detail: { step: s, deviceId: targetId } }));
    if (t.deviceId || t.id?.startsWith('dev_')) sendSOSResponse(t.deviceId || t.id, s);
  }

  const ACTIONS = {
    new:     { label: 'Принять — выслать группу', next: 'enroute', bg: C.red,   color: 'white' },
    enroute: { label: 'Прибыли — начать поиск',   next: 'search',  bg: C.amber, color: 'white' },
    search:  { label: 'Турист найден!',            next: 'found',   bg: C.green, color: 'white' },
    found:   { label: 'Закрыть операцию',          next: 'closed',  bg: C.blue,  color: 'white' },
  };
  const LOG_MSGS = { enroute: 'Группа выехала', search: 'Начат поиск', found: 'Турист найден', closed: 'Операция завершена' };
  const TOURIST_MSGS = {
    new:     { text: '⏳ SOS получен. Ожидайте — МЧС принимает вызов.',   color: C.amber, bg: C.amberBg, border: C.amberBorder },
    enroute: { text: '🚗 МЧС выехали! Не двигайтесь, оставайтесь на месте.', color: C.blue,  bg: C.blueBg,  border: C.blueBorder  },
    search:  { text: '🔍 Спасатели ищут вас. Не двигайтесь, подавайте сигналы!', color: C.amber, bg: C.amberBg, border: C.amberBorder },
    found:   { text: '🎉 Спасатели рядом! Помощь уже идёт.',              color: C.green, bg: C.greenBg, border: C.greenBorder },
    closed:  { text: '✅ Операция МЧС закрыта. Вы в безопасности.',       color: C.green, bg: C.greenBg, border: C.greenBorder },
  };

  function handleNext() {
    const action = ACTIONS[step];
    if (!action) return;
    const next = action.next;
    if (LOG_MSGS[next]) onAddLog('→', LOG_MSGS[next]);
    if (['enroute', 'search', 'found'].includes(next)) notifyTourist(next);
    setStep(next);
    onStepChange(next);
    if (next === 'closed') {
      onAddLog('✓', `Дело закрыто: ${notes || 'Операция завершена'}`);
      onCloseIncident(t, notes || 'Операция завершена', elapsed);
    }
  }

  const action = ACTIONS[step];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 540, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.redBorder}`, background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: C.red, fontFamily: 'Syne, sans-serif', animation: step === 'new' ? 'adminPulse 1s infinite' : 'none' }}>Операция МЧС</span>
            <span style={{ fontSize: 12, color: C.text3, background: C.bg, padding: '2px 8px', borderRadius: 6, border: `1px solid ${C.border}` }}>#{String(t.id).slice(-4).toUpperCase()}</span>
            {step !== 'new' && (
              <span style={{ fontSize: 11, color: C.green, background: C.greenBg, border: `1px solid ${C.greenBorder}`, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                {OP_STEPS.find(s => s.key === step)?.label}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text3, borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', marginBottom: 16, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <img src={t.photo} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text1 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{t.destination}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <span style={{ fontSize: 12, background: C.redBg, color: C.red, padding: '2px 8px', borderRadius: 6, fontWeight: 700, border: `1px solid ${C.redBorder}` }}>{t.bloodType}</span>
              <span style={{ fontSize: 11, color: C.text3 }}>{t.vehicle} · {t.plate}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: C.redBg, border: `1px solid ${C.redBorder}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>SOS поступил</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.red, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{elapsed}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>Сигнал: {t.lastSignal || t.startTime}</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: C.blueBg, border: `1px solid ${C.blueBorder}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Дедлайн прибытия</div>
              <input type="time" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ background: 'transparent', border: 'none', color: C.blue, fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif', outline: 'none', width: '100%', padding: 0 }} />
              <div style={{ fontSize: 11, color: deadlineCd.includes('прошёл') ? C.red : C.text3, marginTop: 2, fontWeight: deadlineCd.includes('прошёл') ? 700 : 400 }}>{deadlineCd}</div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Прогресс операции</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {OP_STEPS.map((s, i) => {
                const isDone = i < stepIndex; const isActive = i === stepIndex; const isLast = i === OP_STEPS.length - 1;
                return (
                  <Fragment key={s.key}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 60 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: isDone ? C.green : isActive ? C.blue : C.bg,
                        border: `2px solid ${isDone ? C.green : isActive ? C.blue : C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, color: isDone || isActive ? 'white' : C.text3,
                        transition: 'all 0.25s',
                      }}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? C.blue : isDone ? C.green : C.text3, whiteSpace: 'nowrap', textAlign: 'center' }}>{s.label}</span>
                    </div>
                    {!isLast && <div style={{ flex: 1, height: 2, background: isDone ? C.green : C.border, transition: 'background 0.3s', minWidth: 4, marginBottom: 18 }} />}
                  </Fragment>
                );
              })}
            </div>
          </div>

          {TOURIST_MSGS[step] && (
            <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, background: TOURIST_MSGS[step].bg, border: `1px solid ${TOURIST_MSGS[step].border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: TOURIST_MSGS[step].color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Сообщение туристу (видит на экране)</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TOURIST_MSGS[step].color, lineHeight: 1.4 }}>{TOURIST_MSGS[step].text}</div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Заметки</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Координаты группы, детали местности..." rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, resize: 'none', background: C.bg, border: `1px solid ${C.border}`, color: C.text1, fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.text2, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Свернуть</button>
            {action && (
              <button onClick={handleNext} style={{
                flex: 2, padding: '13px', borderRadius: 8, background: action.bg,
                border: 'none', color: action.color, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                animation: step === 'new' ? 'adminPulse 1.2s infinite' : 'none',
                transition: 'background 0.15s',
              }}>{action.label}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Alert / history table ─────────────────────────────────────
function AlertTable({ tourists, history, activeTab, onTabChange, onSelect }) {
  const alerted = tourists.filter(t => t.status === 'sos' || t.status === 'overdue');

  const Th = ({ children }) => (
    <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`, background: C.bg }}>{children}</th>
  );

  return (
    <div style={{ height: 210, flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.surface, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: `1px solid ${C.border}`, padding: '0 16px' }}>
        {[{ key: 'sos', label: `Список SOS (${alerted.length})` }, { key: 'history', label: `История (${history.length})` }].map(tb => (
          <button key={tb.key} onClick={() => onTabChange(tb.key)} style={{
            padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', marginRight: 16,
            fontSize: 12, fontWeight: activeTab === tb.key ? 700 : 400,
            color: activeTab === tb.key ? C.text1 : C.text3,
            borderBottom: activeTab === tb.key ? `2px solid ${C.text1}` : '2px solid transparent',
            transition: 'color 0.12s',
          }}>{tb.label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'sos' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Время</Th><Th>Турист</Th><Th>Локация</Th><Th>Риск</Th><Th>Статус</Th></tr></thead>
            <tbody>
              {alerted.length === 0
                ? <tr><td colSpan={5} style={{ padding: '20px 14px', textAlign: 'center', color: C.text3, fontSize: 13 }}>Нет активных тревог</td></tr>
                : alerted.map(t => {
                    const risk = computeRisk(t); const rc = risk ? RISK[risk] : null;
                    return (
                      <tr key={t.id} onClick={() => onSelect(t)} style={{ cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = C.bg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '9px 14px', fontSize: 13, color: C.text2, whiteSpace: 'nowrap' }}>{t.lastSignal || t.startTime}</td>
                        <td style={{ padding: '9px 14px', fontSize: 13 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img src={t.photo} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, color: C.text1 }}>{t.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '9px 14px', fontSize: 13, color: C.text2 }}>{t.destination}</td>
                        <td style={{ padding: '9px 14px' }}>
                          {rc && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>{rc.label}</span>}
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          {t.status === 'sos'
                            ? <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 700, background: C.redBg, color: C.red, border: `1px solid ${C.redBorder}`, animation: 'adminPulse 1.2s infinite' }}>SOS</span>
                            : <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600, background: C.amberBg, color: C.amber, border: `1px solid ${C.amberBorder}` }}>Нет связи</span>
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
                <tr key={h.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, color: C.text1 }}>{h.name}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: C.text2, whiteSpace: 'nowrap' }}>{h.time} · {h.date}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: C.text2 }}>{h.location}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: C.green, fontWeight: 500 }}>{h.outcome}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: C.text3 }}>{h.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Akimat stats ──────────────────────────────────────────────
const MONTHLY_STATS = { total: 847, foreign: 312, local: 535, avgDay: 27, sos: 8, sosClosed: 6, sosAvgMin: 42 };
const ROUTE_STATS = [
  { name: 'Бозжыра',    visits: 214, sos: 2 },
  { name: 'Шеркала',    visits: 189, sos: 1 },
  { name: 'Жыгылған',   visits: 156, sos: 1 },
  { name: 'Карынжарық', visits: 98,  sos: 2 },
  { name: 'Торыш',      visits: 87,  sos: 0 },
  { name: 'Қарынжарық', visits: 76,  sos: 0 },
  { name: 'Шақпақ-ата', visits: 62,  sos: 1 },
  { name: 'Сарыташ',    visits: 34,  sos: 1 },
];
const DANGER_ZONES = [
  { name: 'Карынжарық — дно ойпаты',  reason: 'Экстремальная жара +50°C, нет связи', level: 'critical', color: '#dc2626' },
  { name: 'Сарыташ — дальний каньон',  reason: 'Нет дороги, нет связи 80 км',         level: 'high',     color: '#ea580c' },
  { name: 'Бозжыра — выход на плато',  reason: 'Сильный ветер, крутые спуски',         level: 'high',     color: '#ea580c' },
  { name: 'Жыгылған — нижние уступы', reason: 'Осыпающийся известняк у воды',         level: 'medium',   color: '#d97706' },
  { name: 'Шеркала — ночёвка в горах', reason: 'Гипотермия, нет освещения',            level: 'medium',   color: '#d97706' },
];
const MONTHS = [
  { m: 'Янв', v: 42 }, { m: 'Фев', v: 58 }, { m: 'Мар', v: 134 },
  { m: 'Апр', v: 289 }, { m: 'Май', v: 512 }, { m: 'Июн', v: 847 },
];
const TOURIST_TYPES = [
  { label: 'Казахстанцы', value: 535, pct: 63, color: '#2563eb' },
  { label: 'СНГ',         value: 178, pct: 21, color: '#16a34a' },
  { label: 'Иностранцы',  value: 134, pct: 16, color: '#d97706' },
];

function AkimatStats({ liveStats }) {
  const { total: liveTotal = 0, sos: liveSos = 0, routeCounts: liveRouteCounts = {}, connected = false } = liveStats || {};

  // Blend the live (real, Firebase-backed) counters into the season baseline
  const mergedRoutes = (() => {
    const map = new Map(ROUTE_STATS.map(r => [r.name, { ...r }]));
    Object.entries(liveRouteCounts).forEach(([name, count]) => {
      if (map.has(name)) map.get(name).visits += count;
      else map.set(name, { name, visits: count, sos: 0 });
    });
    return [...map.values()].sort((a, b) => b.visits - a.visits);
  })();

  const maxVisits = mergedRoutes[0]?.visits || 1;
  const maxMonth  = Math.max(...MONTHS.map(m => m.v));
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: C.bg }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Мангыстауская область · Июнь 2026</div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
            padding: '2px 8px', borderRadius: 999,
            color: connected ? C.green : C.text3,
            background: connected ? C.greenBg : C.bg,
            border: `1px solid ${connected ? C.greenBorder : C.border}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? C.green : C.text3 }} />
            {connected ? 'Live из Firebase' : 'Демо-режим (Firebase не подключен)'}
          </span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: C.text1 }}>Отчёт туристической активности</div>
        <div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>Данные актуальны на {new Date().toLocaleDateString('ru-RU')} · Для Акимата Мангыстауской области</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { val: (MONTHLY_STATS.total + liveTotal).toLocaleString(), label: 'Туристов за месяц', color: C.blue, live: liveTotal },
          { val: MONTHLY_STATS.foreign,                label: 'Иностранцев',       color: C.green },
          { val: MONTHLY_STATS.avgDay,                 label: 'В среднем в день',  color: C.amber },
          { val: MONTHLY_STATS.sos + liveSos,          label: 'SOS за месяц',      color: C.red, live: liveSos },
        ].map(k => (
          <div key={k.label} style={{ padding: '18px 20px', borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: k.color, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{k.val}</div>
              {!!k.live && <div style={{ fontSize: 11, fontWeight: 700, color: C.green }}>+{k.live} live</div>}
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text1, marginBottom: 16 }}>Поток туристов по месяцам</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
            {MONTHS.map(({ m, v }) => (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, color: C.text3, fontWeight: 600 }}>{v >= 100 ? v : ''}</div>
                <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: v === maxMonth ? C.blue : C.blueBg, border: v === maxMonth ? 'none' : `1px solid ${C.blueBorder}`, height: `${Math.round((v / maxMonth) * 72)}px` }} />
                <div style={{ fontSize: 10, color: C.text3 }}>{m}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: C.text3, textAlign: 'center' }}>Пик сезона — май–август</div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text1, marginBottom: 16 }}>Состав туристов</div>
          <div style={{ height: 10, borderRadius: 6, overflow: 'hidden', display: 'flex', marginBottom: 18 }}>
            {TOURIST_TYPES.map(t => <div key={t.label} style={{ width: `${t.pct}%`, background: t.color }} />)}
          </div>
          {TOURIST_TYPES.map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color }} />
                <span style={{ fontSize: 13, color: C.text2 }}>{t.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>{t.value.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: C.text3, minWidth: 30, textAlign: 'right' }}>{t.pct}%</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: '9px 12px', borderRadius: 8, background: C.greenBg, border: `1px solid ${C.greenBorder}`, fontSize: 12, color: C.green, fontWeight: 500 }}>
            {MONTHLY_STATS.sosClosed}/{MONTHLY_STATS.sos} SOS закрыты · Ср. время реакции {MONTHLY_STATS.sosAvgMin} мин
          </div>
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text1, marginBottom: 16 }}>Популярные маршруты</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mergedRoutes.map((r, i) => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 22, fontSize: 12, fontWeight: 700, color: i < 3 ? C.blue : C.text3, textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text1, minWidth: 130, flexShrink: 0 }}>{r.name}</div>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.bg, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${Math.round((r.visits / maxVisits) * 100)}%`, background: i < 3 ? C.blue : C.blueBg }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text1, minWidth: 36, textAlign: 'right' }}>{r.visits}</div>
              {r.sos > 0 && (
                <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: C.redBg, color: C.red, border: `1px solid ${C.redBorder}`, flexShrink: 0 }}>SOS {r.sos}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>Опасные зоны</div>
          <div style={{ fontSize: 11, color: C.text3 }}>По данным МЧС · Июнь 2026</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DANGER_ZONES.map((z, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 14px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: z.color, flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text1, marginBottom: 2 }}>{z.name}</div>
                <div style={{ fontSize: 12, color: C.text2 }}>{z.reason}</div>
              </div>
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600, color: z.color, background: z.color + '15', border: `1px solid ${z.color}40`, flexShrink: 0 }}>
                {z.level === 'critical' ? 'Критичный' : z.level === 'high' ? 'Высокий' : 'Средний'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 12, padding: '20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.blue, marginBottom: 14 }}>Рекомендации акимату</div>
        {[
          'Установить 3 ретранслятора на маршруте Бозжыра–Карынжарық для покрытия сети',
          'Разместить информационные щиты с QR-кодом на DeadEnd у въезда в Сарыташ и Жыгылған',
          'Оборудовать точку первой помощи у основания Карынжарық — наиболее опасная зона',
          'Пик сезона июль–август: усилить дежурство МЧС — ожидается рост потока до 1200 чел/мес',
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: C.blue, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Filter config ─────────────────────────────────────────────
const FILTERS = [
  { key: null,      label: 'Все туристы',  countKey: 'all' },
  { key: 'active',  label: 'Активные',     countKey: 'active' },
  { key: 'sos',     label: 'SOS',          countKey: 'sos' },
  { key: 'overdue', label: 'Нет связи',    countKey: 'overdue' },
];

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
  const prevStatusRef             = useRef(null);
  const liveTouristRef            = useRef(null);
  const [firebaseTourists, setFirebaseTourists] = useState([]);
  const [tripsHistory, setTripsHistory] = useState([]);
  const [tick, setTick]           = useState(0);         // 30s ticker → re-evaluate statuses
  const [adminAlerts, setAdminAlerts] = useState([]);    // overdue transition toasts
  const notifiedOverdueRef        = useRef(new Set());

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
    vehicle: activeTrip.vehicle || '—',
    plate: '—',
    bloodType: user.bloodType,
    height: user.height,
    weight: user.weight,
    allergies: user.allergies,
    specialMarks: user.specialMarks,
    emergencyContact: user.contacts?.[0]
      ? { name: user.contacts[0].name, phone: user.contacts[0].phone, relation: user.contacts[0].relation }
      : null,
    coords: currentCoords || { lat: 43.65, lng: 51.17 },
    isLive: true,
  } : null;

  liveTouristRef.current = liveTourist;

  useEffect(() => {
    const initial = {};
    MOCK_ACTIVE_TOURISTS.forEach(t => { initial[t.id] = initLogs(t); });
    setLogs(initial);
  }, []);

  useEffect(() => {
    const unsub = listenTourists((tourists) => {
      setFirebaseTourists(tourists);
      tourists.forEach(t => {
        if (t.status === 'sos' && !selected) {
          setSelected(t); setFilter('sos'); addLog(t.id, '→', 'SOS получен (Firebase)');
        }
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = listenTripsHistory(setTripsHistory);
    return unsub;
  }, []);

  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = activeTrip?.status;
    if (curr === 'sos' && prev !== 'sos' && liveTouristRef.current) {
      const t = liveTouristRef.current;
      setSelected(t); setFilter('sos'); addLog(t.id, '→', 'SOS получен');
    }
    prevStatusRef.current = curr ?? null;
  }, [activeTrip?.status]);

  const addLog = (touristId, icon, text) => {
    const time = nowTime();
    const type = text.includes('SOS') ? 'sos' : text.includes('потеряна') ? 'warn' : 'start';
    setLogs(prev => ({ ...prev, [touristId]: [{ time, text, type }, ...(prev[touristId] || [])] }));
  };

  // 30-second ticker — forces re-render so status badges stay in sync with real time
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const firebaseIds  = new Set(firebaseTourists.map(t => t.id));
  const mockFallback = MOCK_ACTIVE_TOURISTS.filter(t => !firebaseIds.has(t.id));
  const baseTourists = firebaseTourists.length > 0
    ? [...firebaseTourists, ...mockFallback]
    : (liveTourist ? [liveTourist, ...MOCK_ACTIVE_TOURISTS] : MOCK_ACTIVE_TOURISTS);

  // Apply real-time status: active → overdue when expectedReturn has passed
  const allTourists = applyEffectiveStatuses(baseTourists);

  // Real per-trip records archived to Firebase — feeds the Akimat dashboard
  const liveRouteCounts = {};
  let liveSosCount = 0;
  tripsHistory.forEach(t => {
    if (t.placeName) liveRouteCounts[t.placeName] = (liveRouteCounts[t.placeName] || 0) + 1;
    if (t.hadSOS) liveSosCount++;
  });
  const liveStats = {
    total: tripsHistory.length,
    sos: liveSosCount,
    routeCounts: liveRouteCounts,
    connected: FIREBASE_ENABLED,
  };

  // Detect new overdue transitions on each tick and fire admin notifications
  useEffect(() => {
    allTourists.forEach(t => {
      if (!t._autoEscalated || closedIds.has(t.id) || notifiedOverdueRef.current.has(t.id)) return;
      notifiedOverdueRef.current.add(t.id);
      const alertId = `${t.id}-od`;
      const msg = `${t.name} — нет связи 12+ ч. Ожидался в ${t.expectedReturn}`;
      setAdminAlerts(prev => [...prev, { id: alertId, msg }]);
      addLog(t.id, 'warn', `Прошло 12 часов с момента возврата — статус «Нет связи»`);
      setTimeout(() => setAdminAlerts(prev => prev.filter(a => a.id !== alertId)), 10000);
    });
  }, [tick, allTourists.length]);

  const visible = allTourists.filter(t => !closedIds.has(t.id)).filter(t => filter === null || t.status === filter);

  const counts = {
    all:     allTourists.filter(t => !closedIds.has(t.id)).length,
    active:  allTourists.filter(t => !closedIds.has(t.id) && t.status === 'active').length,
    sos:     allTourists.filter(t => !closedIds.has(t.id) && t.status === 'sos').length,
    overdue: allTourists.filter(t => !closedIds.has(t.id) && t.status === 'overdue').length,
  };

  // Keep selected tourist's status in sync with live auto-escalation
  useEffect(() => {
    if (!selected) return;
    const live = allTourists.find(t => t.id === selected.id);
    if (live && live.status !== selected.status) setSelected(live);
  }, [tick, allTourists.length]);

  const handleSelect = (t) => {
    setSelected(prev => {
      if (prev?.id === t.id) return null;
      addLog(t.id, '→', 'Оператор открыл карточку');
      return t;
    });
  };

  const handleCloseIncident = (t, outcome, duration = '—') => {
    const now = new Date();
    setHistory(prev => [{ id: 'c-' + t.id, name: t.name, time: now.toTimeString().slice(0, 5), date: now.toLocaleDateString('ru-RU'), location: t.destination, outcome, duration }, ...prev]);
    setClosedIds(prev => new Set([...prev, t.id]));
    setOpSteps(prev => { const next = { ...prev }; delete next[t.id]; return next; });
    delete opSentSteps.current[t.id];
    const targetId = t.deviceId || t.id;
    if (t.deviceId || t.id?.startsWith('dev_')) sendSOSResponse(t.deviceId || t.id, 'resolved');
    try { localStorage.setItem('deadend_sos_accepted', JSON.stringify({ step: 'resolved', time: now.toTimeString().slice(0, 5), deviceId: targetId })); } catch {}
    window.dispatchEvent(new CustomEvent('deadend_sos_update', { detail: { step: 'resolved', deviceId: targetId } }));
    setSelected(null); setOperation(null); setAlertTab('history');
  };

  return (
    <>
      <style>{`
        @keyframes adminPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes adminAlertIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: C.bg, fontFamily: 'DM Sans, sans-serif', color: C.text1 }}>

        {/* Overdue transition alerts */}
        {adminAlerts.length > 0 && (
          <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 500, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none' }}>
            {adminAlerts.map(a => (
              <div key={a.id} style={{
                padding: '10px 18px', borderRadius: 10, background: C.amberBg, border: `1px solid ${C.amberBorder}`,
                color: C.amber, fontWeight: 700, fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap',
                animation: 'adminAlertIn 0.25s cubic-bezier(0.23,1,0.32,1)',
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                {a.msg}
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.surface }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: view === 'ops' ? 14 : 0 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: C.text1 }}>МЧС — Центр мониторинга</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Мангыстауская область · Нажмите туриста для подробностей</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                {[{ key: 'ops', label: 'Операции' }, { key: 'stats', label: 'Акимат' }].map(v => (
                  <button key={v.key} onClick={() => setView(v.key)} style={{
                    padding: '6px 16px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: view === v.key ? C.text1 : 'transparent',
                    color: view === v.key ? 'white' : C.text3,
                    transition: 'all 0.12s',
                  }}>{v.label}</button>
                ))}
              </div>
              <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, fontWeight: 600, background: isOnline ? C.greenBg : C.redBg, color: isOnline ? C.green : C.red, border: `1px solid ${isOnline ? C.greenBorder : C.redBorder}` }}>
                {isOnline ? '● Онлайн' : '● Офлайн'}
              </div>
            </div>
          </div>

          {view === 'ops' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {FILTERS.map(f => {
                const count    = counts[f.countKey];
                const isSOS    = f.key === 'sos' && counts.sos > 0;
                const isActive = filter === f.key;
                return (
                  <MetricCard
                    key={String(f.key)} value={count} label={f.label}
                    color={isSOS ? C.red : isActive ? C.blue : C.text1}
                    bg={isSOS ? C.redBg : C.blueBg}
                    border={isSOS ? C.redBorder : C.blueBorder}
                    blink={isSOS} active={isActive}
                    onClick={() => setFilter(prev => prev === f.key ? null : f.key)}
                  />
                );
              })}
            </div>
          )}
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
            <AkimatStats liveStats={liveStats} />
          </div>
        )}
      </div>
    </>
  );
}
