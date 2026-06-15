import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useTrip, SOS_GRACE_MINUTES } from '../context/TripContext';
import { useLang } from '../context/LangContext';
import { PLACES, VIBES } from '../data/places';
import MapView from '../components/MapView';
import { listenTourists } from '../lib/sync.js';

const BCP47 = { kz: 'kk-KZ', ru: 'ru-RU', en: 'en-US' };
const VOICE_SOS_PHRASES = ['комек керек', 'көмек керек', 'помогите', 'помощь', 'help me', 'sos'];

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const BADGES = { 5: '🥉 Bronze Explorer', 10: '🥈 Silver Explorer', 20: '🥇 Gold Explorer' };

function CompletionScreen({ data, onHome }) {
  const { placeName, duration, distance, doneCps, totalCps, badge } = data;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
    }}>
      {/* Icon */}
      <div style={{
        width: 88, height: 88, borderRadius: '50%', marginBottom: 28,
        background: 'rgba(6,214,160,0.12)', border: '2px solid rgba(6,214,160,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
        boxShadow: '0 0 40px rgba(6,214,160,0.2)',
      }}>🏁</div>

      {/* Title */}
      <div style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
        Маршрут завершён
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Syne, sans-serif', color: 'var(--text)', marginBottom: 6, lineHeight: 1.2 }}>
        {placeName}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 32 }}>
        Всё прошло безопасно 🌿
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '⏱️', val: duration,              label: 'Время в пути' },
          { icon: '📍', val: `${distance} км`,       label: 'Расстояние' },
          { icon: '✅', val: `${doneCps}/${totalCps}`, label: 'Чекпоинтов' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '16px 20px', minWidth: 90,
          }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', fontFamily: 'Syne, sans-serif', marginTop: 6, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badge */}
      {badge && (
        <div style={{
          background: 'rgba(244,162,97,0.1)', border: '1px solid rgba(244,162,97,0.35)',
          borderRadius: 14, padding: '14px 24px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 28 }}>{badge.split(' ')[0]}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#F4A261' }}>{badge}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Новое достижение разблокировано!</div>
          </div>
        </div>
      )}

      <button onClick={onHome} style={{
        background: 'var(--purple)', color: 'white', border: 'none',
        borderRadius: 14, padding: '14px 40px',
        fontSize: 16, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'Syne, sans-serif',
      }}>
        На главную →
      </button>
    </div>
  );
}

export default function Tracking() {
  const navigate = useNavigate();
  const { activeTrip, stopTrip, triggerSOS, cancelSOS, updateCheckpoint, user, isOnline, connectionType, deviceId, currentCoords, shakePermission, enableShakeAlerts } = useTrip();
  const { t, lang } = useLang();
  const [elapsed, setElapsed] = useState(0);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showCancelSOS, setShowCancelSOS] = useState(false);
  const [showLiveShare, setShowLiveShare] = useState(false);
  const [liveQR, setLiveQR] = useState(null);
  const [liveCopied, setLiveCopied] = useState(false);
  const [playingVibe, setPlayingVibe] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [stopSending, setStopSending] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [voiceSOSOn, setVoiceSOSOn] = useState(false);
  const [showEmergencyCard, setShowEmergencyCard] = useState(false);
  const [emergencyQR, setEmergencyQR] = useState(null);
  const [nearbyTourists, setNearbyTourists] = useState([]);
  const now = useClock();
  const liveUrl = `${window.location.origin}/live/${deviceId}`;
  const voiceSOSSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!showLiveShare) return;
    QRCode.toDataURL(liveUrl, { width: 240, margin: 1, color: { dark: '#1a1a2e', light: '#ffffff' } })
      .then(setLiveQR)
      .catch(() => setLiveQR(null));
  }, [showLiveShare, liveUrl]);

  function handleCopyLive() {
    navigator.clipboard?.writeText(liveUrl).then(() => {
      setLiveCopied(true);
      setTimeout(() => setLiveCopied(false), 2000);
    });
  }

  // Voice SOS — say "помогите" / "көмек керек" / "help" to trigger SOS hands-free
  useEffect(() => {
    if (!voiceSOSOn || !activeTrip || activeTrip.status === 'sos') return;
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) return;

    let stopped = false;
    let recog;
    function start() {
      recog = new SpeechRecognitionImpl();
      recog.lang = BCP47[lang] || 'ru-RU';
      recog.continuous = true;
      recog.interimResults = false;
      recog.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = (e.results[i][0]?.transcript || '').toLowerCase();
          if (VOICE_SOS_PHRASES.some(p => transcript.includes(p))) {
            triggerSOS();
            return;
          }
        }
      };
      recog.onend = () => { if (!stopped) { try { recog.start(); } catch {} } };
      recog.onerror = () => {};
      try { recog.start(); } catch {}
    }
    start();

    return () => { stopped = true; recog?.stop(); };
  }, [voiceSOSOn, activeTrip?.status, lang]);

  // Emergency ID card QR — works offline, encodes plain-text medical info (no URL/login needed)
  useEffect(() => {
    if (!showEmergencyCard || !activeTrip) return;
    const lines = [
      'DeadEnd — Emergency Info',
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—',
      user.bloodType ? `Blood type: ${user.bloodType}` : null,
      user.allergies ? `Allergies: ${user.allergies}` : null,
      user.specialMarks ? `Special marks: ${user.specialMarks}` : null,
      (user.height || user.weight) ? `Height/Weight: ${user.height || '?'}cm / ${user.weight || '?'}kg` : null,
      ...(activeTrip.contacts || []).map(c => `Contact: ${c.name} ${c.phone}`),
    ].filter(Boolean);
    QRCode.toDataURL(lines.join('\n'), { width: 240, margin: 1, color: { dark: '#1a1a2e', light: '#ffffff' } })
      .then(setEmergencyQR)
      .catch(() => setEmergencyQR(null));
  }, [showEmergencyCard, user, activeTrip]);

  // Other tourists currently heading to the same place — situational awareness on the map
  useEffect(() => {
    if (!activeTrip) return;
    const unsub = listenTourists((tourists) => {
      setNearbyTourists(tourists.filter(t =>
        t.id !== deviceId && t.coords &&
        t.destination === activeTrip.placeName &&
        (t.status === 'active' || t.status === 'overdue')
      ));
    });
    return unsub;
  }, [activeTrip?.placeName, deviceId]);

  function buildSosSmsHref() {
    const coords = activeTrip.sosCoords || currentCoords || { lat: 43.65, lng: 51.17 };
    const numbers = (activeTrip.contacts || []).map(c => c.phone).filter(Boolean);
    const to = numbers.length ? numbers.join(',') : '112';
    const text = `SOS! ${user.firstName || ''} ${user.lastName || ''} — ${activeTrip.placeName}. https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    return `sms:${to}?body=${encodeURIComponent(text)}`;
  }

  useEffect(() => {
    if (!activeTrip) return;
    const start = new Date(activeTrip.startTime).getTime();
    const tick = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(tick);
  }, [activeTrip?.startTime]);

  if (!activeTrip) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <span style={{ fontSize: 48 }}>🗺️</span>
        <h2 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>{t.tr_no_trip}</h2>
        <p style={{ color: 'var(--text2)' }}>{t.tr_no_trip_sub}</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">{t.tr_browse}</button>
      </div>
    );
  }

  const place = PLACES.find(p => p.id === activeTrip.placeId) || null;
  const vibe = VIBES[activeTrip.placeId] || VIBES['highway'];
  const hours = Math.floor(elapsed / 3600000);
  const mins = Math.floor((elapsed % 3600000) / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  const timeStr = `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  const checkpoints = activeTrip.checkpoints || [];
  const doneCps = checkpoints.filter(cp => cp.status === 'done').length;

  // Current time + overdue calculation
  const clockStr = now.toTimeString().slice(0, 5);
  const isOverdue = activeTrip.status === 'overdue' || activeTrip.status === 'sos';
  const deadline = (() => {
    if (activeTrip.expectedReturnAt) return new Date(activeTrip.expectedReturnAt);
    if (!activeTrip.expectedReturn) return null;
    const [h, m] = activeTrip.expectedReturn.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0);
    return d;
  })();
  const overdueMinutes = (() => {
    if (!deadline) return 0;
    const diff = Math.round((now - deadline) / 60000);
    return diff > 0 ? diff : 0;
  })();
  // Minutes left before an unanswered deadline auto-escalates to SOS
  const graceRemaining = (() => {
    if (activeTrip.status !== 'overdue' || !activeTrip.overdueAt) return null;
    const elapsedMin = (now - new Date(activeTrip.overdueAt)) / 60000;
    return Math.max(0, Math.ceil(SOS_GRACE_MINUTES - elapsedMin));
  })();

  function handleSOS() {
    setSosSending(true);
    const onSuccess = (pos) => {
      triggerSOS({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setSosSending(false);
      setShowSOSConfirm(false);
    };
    const onError = () => {
      triggerSOS({ lat: 43.65, lng: 51.17 });
      setSosSending(false);
      setShowSOSConfirm(false);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: 5000 });
    } else {
      onError();
    }
  }

  function handleCancelSOS(reason) {
    cancelSOS(reason);
    setShowCancelSOS(false);
  }

  function handleStop() {
    if (stopSending) return;
    setStopSending(true);

    const hrs  = Math.floor(elapsed / 3600000);
    const mins = Math.floor((elapsed % 3600000) / 60000);
    const duration = hrs > 0 ? `${hrs}ч ${mins}м` : `${mins}м`;
    const cps = activeTrip.checkpoints || [];
    const nextCount = (user.tripsCompleted || 0) + 1;

    setCompletionData({
      placeName:  activeTrip.placeName,
      duration,
      distance:   Math.round((activeTrip.traveledKm || 0) * 10) / 10,
      doneCps:    cps.filter(c => c.status === 'done').length,
      totalCps:   cps.length,
      badge:      BADGES[nextCount] || null,
    });
    stopTrip();
    setShowStopConfirm(false);
  }

  if (completionData) {
    return <CompletionScreen data={completionData} onHome={() => navigate('/')} />;
  }

  return (
    <div className="page" style={{ maxWidth: 700 }}>

      {/* Overdue / SOS banner */}
      {activeTrip.status === 'sos' && (
        <div style={{
          marginBottom: 20, padding: '14px 18px', borderRadius: 14,
          background: 'rgba(255,71,87,0.12)', border: '2px solid rgba(255,71,87,0.6)',
          display: 'flex', alignItems: 'center', gap: 14,
          animation: 'pulse 1.2s infinite',
        }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>🆘</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#FF4757', fontFamily: 'Syne, sans-serif' }}>{t.tr_sos_sent}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>{t.tr_sos_stay}</div>
          </div>
        </div>
      )}

      {activeTrip.status === 'sos' && !showCancelSOS && (
        <button
          onClick={() => setShowCancelSOS(true)}
          className="btn btn-ghost btn-lg btn-full"
          style={{ marginBottom: 20 }}
        >
          {t.tr_sos_cancel_btn}
        </button>
      )}

      {activeTrip.status === 'sos' && showCancelSOS && (
        <div style={{
          marginBottom: 20, padding: '14px 18px', borderRadius: 14,
          background: 'var(--surface)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', fontFamily: 'Syne, sans-serif', marginBottom: 10 }}>
            {t.tr_sos_cancel_title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => handleCancelSOS('ok')} className="btn btn-ghost btn-full">{t.tr_sos_cancel_reason_ok}</button>
            <button onClick={() => handleCancelSOS('misclick')} className="btn btn-ghost btn-full">{t.tr_sos_cancel_reason_misclick}</button>
            <button onClick={() => handleCancelSOS('resolved')} className="btn btn-ghost btn-full">{t.tr_sos_cancel_reason_resolved}</button>
            <button onClick={() => handleCancelSOS('other')} className="btn btn-ghost btn-full">{t.tr_sos_cancel_reason_other}</button>
            <button onClick={() => setShowCancelSOS(false)} style={{
              background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13,
              padding: '6px 0', cursor: 'pointer',
            }}>{t.tr_cancel}</button>
          </div>
        </div>
      )}

      {activeTrip.status === 'overdue' && (
        <div style={{
          marginBottom: 20, padding: '14px 18px', borderRadius: 14,
          background: 'rgba(244,162,97,0.1)', border: '2px solid rgba(244,162,97,0.5)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>⏰</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#F4A261', fontFamily: 'Syne, sans-serif' }}>
              {t.tr_overdue}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>
              {t.tr_overdue_by} <strong style={{ color: '#F4A261' }}>{overdueMinutes} {t.tr_min}</strong> · {t.tr_overdue_was} {activeTrip.expectedReturn}
            </div>
            {graceRemaining !== null && (
              <div style={{ fontSize: 13, color: '#FF4757', fontWeight: 700, marginTop: 4 }}>
                🆘 {t.tr_auto_sos_in} {graceRemaining} {t.tr_min}
              </div>
            )}
          </div>
          <button onClick={() => setShowStopConfirm(true)} style={{
            background: '#06D6A0', color: 'white', border: 'none',
            borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}>{t.tr_returned}</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>{t.tr_title}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>📍 {activeTrip.placeName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {/* Live clock */}
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 2, fontFamily: 'Syne, sans-serif' }}>
            🕐 {clockStr}
          </div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: isOverdue ? '#F4A261' : 'var(--purple)', letterSpacing: '0.05em' }}>{timeStr}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t.tr_title} · {activeTrip.expectedReturn}</div>
        </div>
      </div>

      {/* Map */}
      <div style={{ marginBottom: 24 }}>
        <MapView
          place={place} activeTrip={activeTrip} height={220} lang={lang}
          otherTourists={nearbyTourists.map(t => ({ id: t.id, coords: t.coords, name: t.name }))}
        />
        {nearbyTourists.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
            🚶 {nearbyTourists.length} {t.tr_others_on_route}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {/* Return time card — dynamic */}
        <div style={{
          background: isOverdue ? 'rgba(244,162,97,0.08)' : 'var(--surface)',
          border: `1px solid ${isOverdue ? 'rgba(244,162,97,0.4)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', padding: '14px 16px',
        }}>
          <div style={{ fontSize: 11, color: isOverdue ? '#F4A261' : 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            ⏰ {isOverdue ? 'Просрочено' : 'Вернуться к'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: isOverdue ? '#F4A261' : 'var(--text)' }}>
            {isOverdue ? `+${overdueMinutes} мин` : activeTrip.expectedReturn || '—'}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>📍 Чекпоинты</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{doneCps}/{checkpoints.length}</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>👤 Группа</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize' }}>{activeTrip.groupType || 'solo'}</div>
        </div>
      </div>

      {/* Checkpoints */}
      {checkpoints.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 24 }}>
          <div className="section-label" style={{ marginBottom: 16 }}>Checkpoints</div>
          <div className="checkpoint-line">
            {checkpoints.map((cp, i) => {
              const statusClass = cp.status === 'done' ? 'cp-done' : i === doneCps ? 'cp-active' : 'cp-pending';
              return (
                <div key={cp.id} className="cp-item">
                  <div className={`cp-circle ${statusClass}`}>{cp.status === 'done' ? '✓' : i === doneCps ? '●' : i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div className="cp-name">{cp.name}</div>
                    <div className="cp-km">{cp.km} km · {cp.arrivedAt ? `Arrived ${new Date(cp.arrivedAt).toLocaleTimeString()}` : i === doneCps ? 'Current destination' : 'Pending'}</div>
                  </div>
                  {i === doneCps && (
                    <button onClick={() => updateCheckpoint(cp.id)} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>Mark arrived</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Route Vibes Radio */}
      <div style={{
        background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)',
        borderRadius: 'var(--radius)', padding: 20, marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: playingVibe ? 12 : 0 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>🎵 Route Vibes Radio</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{vibe.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{vibe.mood}</div>
          </div>
          <button onClick={() => setPlayingVibe(!playingVibe)} style={{
            width: 44, height: 44, borderRadius: '50%',
            background: playingVibe ? 'var(--purple)' : 'var(--surface2)',
            border: '1px solid rgba(108,99,255,0.4)', cursor: 'pointer',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{playingVibe ? '⏸' : '▶'}</button>
        </div>
        {playingVibe && (vibe.tracks || []).map((t, i) => (
          <div key={i} style={{
            fontSize: 13, color: i === 0 ? 'var(--text)' : 'var(--text3)',
            padding: '8px 12px', borderRadius: 8,
            background: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
            display: 'flex', gap: 10,
          }}>
            <span>{i === 0 ? '▶' : '○'}</span> {t}
          </div>
        ))}
      </div>

      {/* Trip info */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>{t.tr_trip_info}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>🧥 <strong style={{ color: 'var(--text)' }}>{t.tr_clothing}</strong> {activeTrip.clothing || '—'}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>🚙 <strong style={{ color: 'var(--text)' }}>{t.tr_vehicle}</strong> {activeTrip.vehicle || '—'}</div>
        {(activeTrip.contacts || []).map((c, i) => (
          <div key={i} style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>📞 {c.name} · {c.phone}</div>
        ))}
      </div>

      {/* Connection quality — SOS falls back to a compact retrying signal on weak/2G */}
      {(!isOnline || connectionType === '2g' || connectionType === 'slow-2g') && (
        <div style={{
          marginBottom: 12, padding: '8px 14px', borderRadius: 10,
          background: 'rgba(244,162,97,0.1)', border: '1px solid rgba(244,162,97,0.4)',
          fontSize: 12, color: '#F4A261', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>📶</span>
          {!isOnline
            ? 'Желі жоқ — SOS қосылған кезде автоматты жіберіледі'
            : 'Әлсіз 2G байланыс — SOS сигналы қысқартылған форматта жіберіледі'}
        </div>
      )}

      {/* Shake-to-alert status */}
      {shakePermission === 'granted' && (
        <div style={{
          marginBottom: 12, padding: '8px 14px', borderRadius: 10,
          background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)',
          fontSize: 12, color: 'var(--text2)',
        }}>
          {t.tr_shake_active}
        </div>
      )}
      {shakePermission === 'prompt' && (
        <button onClick={enableShakeAlerts} className="btn btn-ghost btn-full" style={{ marginBottom: 12, fontSize: 13 }}>
          📳 {t.tr_shake_enable}
        </button>
      )}

      {/* Voice SOS status */}
      {voiceSOSSupported && activeTrip.status !== 'sos' && (
        voiceSOSOn ? (
          <div style={{
            marginBottom: 12, padding: '8px 14px', borderRadius: 10,
            background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)',
            fontSize: 12, color: 'var(--text2)',
          }}>
            {t.tr_voice_sos_active}
          </div>
        ) : (
          <button onClick={() => setVoiceSOSOn(true)} className="btn btn-ghost btn-full" style={{ marginBottom: 12, fontSize: 13 }}>
            🎤 {t.tr_voice_sos_enable}
          </button>
        )
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => setShowLiveShare(true)} className="btn btn-ghost btn-lg btn-full">
          📡 {t.tr_live_share}
        </button>
        <button onClick={() => setShowEmergencyCard(true)} className="btn btn-ghost btn-lg btn-full">
          🚨 {t.tr_emergency_card}
        </button>
        <a href={buildSosSmsHref()} className="btn btn-ghost btn-lg btn-full" style={{ textAlign: 'center', textDecoration: 'none' }}>
          📨 {t.tr_sms_fallback}
        </a>
        <button onClick={() => setShowSOSConfirm(true)} className="sos-btn">{t.tr_sos_btn}</button>
        {activeTrip.status !== 'sos' && (
          <button onClick={() => setShowStopConfirm(true)} className="btn btn-ghost btn-lg btn-full">{t.tr_stop_btn}</button>
        )}
      </div>

      {/* SOS Modal */}
      {showSOSConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid rgba(255,71,87,0.4)', borderRadius: 'var(--radius)', padding: 32, maxWidth: 400, width: '100%' }}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>🆘</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, textAlign: 'center', color: 'var(--red)', marginBottom: 12 }}>{t.tr_sos_modal_title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>{t.tr_sos_modal_sub}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowSOSConfirm(false)} className="btn btn-ghost btn-full" disabled={sosSending}>{t.tr_cancel}</button>
              <button onClick={handleSOS} className="btn btn-danger btn-full" disabled={sosSending} style={{ opacity: sosSending ? 0.7 : 1 }}>
                {sosSending ? '📡...' : t.tr_send_sos}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Share Modal */}
      {showLiveShare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📡</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>{t.tr_live_title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>{t.tr_live_sub}</p>
            {liveQR && (
              <img src={liveQR} alt="QR" style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 20 }} />
            )}
            <div style={{
              fontSize: 12, color: 'var(--text3)', wordBreak: 'break-all',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 20,
            }}>{liveUrl}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowLiveShare(false)} className="btn btn-ghost btn-full">{t.tr_live_close}</button>
              <button onClick={handleCopyLive} className="btn btn-primary btn-full">
                {liveCopied ? t.tr_live_copied : t.tr_live_copy}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Card Modal */}
      {showEmergencyCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚨</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>{t.tr_emergency_card_title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>{t.tr_emergency_card_sub}</p>
            {emergencyQR && (
              <img src={emergencyQR} alt="QR" style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 20 }} />
            )}
            <button onClick={() => setShowEmergencyCard(false)} className="btn btn-ghost btn-full">{t.tr_live_close}</button>
          </div>
        </div>
      )}

      {/* Stop Modal */}
      {showStopConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, maxWidth: 400, width: '100%' }}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>✅</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, textAlign: 'center', color: 'var(--teal)', marginBottom: 12 }}>{t.tr_end_trip}</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>{t.tr_end_sub}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowStopConfirm(false)} className="btn btn-ghost btn-full" disabled={stopSending}>{t.tr_continue}</button>
              <button onClick={handleStop} className="btn btn-primary btn-full" disabled={stopSending} style={{ opacity: stopSending ? 0.7 : 1 }}>
                {stopSending ? '...' : t.tr_end_safe}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
