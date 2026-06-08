import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { PLACES, VIBES } from '../data/places';
import MapView from '../components/MapView';

export default function Tracking() {
  const navigate = useNavigate();
  const { activeTrip, stopTrip, triggerSOS, updateCheckpoint } = useTrip();
  const [elapsed, setElapsed] = useState(0);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [playingVibe, setPlayingVibe] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [stopSending, setStopSending] = useState(false);

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
        <h2 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>No active trip</h2>
        <p style={{ color: 'var(--text2)' }}>Start a trip from the Home page</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">Browse places</button>
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

  function handleStop() {
    if (stopSending) return;
    setStopSending(true);
    stopTrip();
    setShowStopConfirm(false);
    navigate('/');
  }

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>In progress</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>📍 {activeTrip.placeName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--purple)', letterSpacing: '0.05em' }}>{timeStr}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>elapsed</div>
        </div>
      </div>

      {/* Map */}
      <div style={{ marginBottom: 24 }}>
        <MapView place={place} activeTrip={activeTrip} height={220} />
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Return by', val: activeTrip.expectedReturn || '—', icon: '⏰' },
          { label: 'Checkpoints', val: `${doneCps}/${checkpoints.length}`, icon: '📍' },
          { label: 'Trip type', val: activeTrip.groupType || 'solo', icon: '👤' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize' }}>{s.val}</div>
          </div>
        ))}
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
        <div className="section-label" style={{ marginBottom: 12 }}>Trip info (visible to MChS)</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>🧥 <strong style={{ color: 'var(--text)' }}>Clothing:</strong> {activeTrip.clothing || 'Not specified'}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>🚙 <strong style={{ color: 'var(--text)' }}>Vehicle:</strong> {activeTrip.vehicle || 'Not specified'}</div>
        {(activeTrip.contacts || []).map((c, i) => (
          <div key={i} style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>📞 {c.name} · {c.phone}</div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => setShowSOSConfirm(true)} className="sos-btn">🆘 SOS — EMERGENCY</button>
        <button onClick={() => setShowStopConfirm(true)} className="btn btn-ghost btn-lg btn-full">⏹ Stop Trip — I'm safe</button>
      </div>

      {/* SOS Modal */}
      {showSOSConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid rgba(255,71,87,0.4)', borderRadius: 'var(--radius)', padding: 32, maxWidth: 400, width: '100%' }}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>🆘</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, textAlign: 'center', color: 'var(--red)', marginBottom: 12 }}>Send SOS?</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>Your GPS location, profile and trip details will be sent immediately to MChS and your emergency contacts.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowSOSConfirm(false)} className="btn btn-ghost btn-full" disabled={sosSending}>Cancel</button>
              <button onClick={handleSOS} className="btn btn-danger btn-full" disabled={sosSending} style={{ opacity: sosSending ? 0.7 : 1 }}>
                {sosSending ? '📡 Жіберілуде...' : 'SEND SOS NOW'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Modal */}
      {showStopConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, maxWidth: 400, width: '100%' }}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>✅</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, textAlign: 'center', color: 'var(--teal)', marginBottom: 12 }}>End trip?</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>Your contacts and MChS will be notified that you returned safely.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowStopConfirm(false)} className="btn btn-ghost btn-full" disabled={stopSending}>Continue trip</button>
              <button onClick={handleStop} className="btn btn-primary btn-full" disabled={stopSending} style={{ opacity: stopSending ? 0.7 : 1 }}>
                {stopSending ? 'Аяқталуда...' : "I'm safe, end trip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
