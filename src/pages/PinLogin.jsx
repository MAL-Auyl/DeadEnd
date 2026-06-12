import { useState, useRef } from 'react';
import { useTrip } from '../context/TripContext';
import { useLang } from '../context/LangContext';
import { FIREBASE_ENABLED } from '../lib/firebase.js';

const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 30; // секунд

export default function PinLogin() {
  const { t } = useLang();
  const [pin, setPin] = useState('');
  const [found, setFound] = useState(null);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const [checking, setChecking] = useState(false);
  const { accounts, activeTrip, stopTrip, triggerSOS, findAccountByPin } = useTrip();
  const timerRef = useRef(null);

  function startBlockTimer() {
    setBlocked(true);
    setBlockTimer(BLOCK_DURATION);
    timerRef.current = setInterval(() => {
      setBlockTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setBlocked(false);
          setAttempts(0);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function checkPin() {
    if (blocked || checking) return;
    if (pin.length !== 6) { setError(t.pin_need6); return; }

    setChecking(true);
    const account = await findAccountByPin(pin);
    setChecking(false);
    if (account) {
      setFound({
        name: account.firstName + ' ' + account.lastName,
        trip: activeTrip?.placeName || t.pin_unknown,
        returnTime: activeTrip?.expectedReturn || '—',
      });
      setError('');
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setFound(null);
      setPin('');

      if (newAttempts >= MAX_ATTEMPTS) {
        setError(t.pin_blocked_msg.replace('{max}', MAX_ATTEMPTS).replace('{sec}', BLOCK_DURATION));
        startBlockTimer();
      } else {
        setError(`${t.pin_wrong}. ${t.pin_attempts_left.replace('{n}', MAX_ATTEMPTS - newAttempts)}`);
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !blocked) checkPin();
  }

  return (
    <div className="page" style={{ maxWidth: 440 }}>
      <h1 className="page-title">{t.pin_title}</h1>
      <p className="page-sub">{t.pin_sub}</p>

      <div style={{
        background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)',
        borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 28,
        fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
      }}>
        {t.pin_info}
      </div>

      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">{t.pin_label}</label>
        <input
          value={pin}
          onChange={e => !blocked && setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={handleKeyDown}
          className="form-input"
          placeholder="● ● ● ● ● ●"
          disabled={blocked}
          style={{
            fontSize: 28, letterSpacing: '0.4em', textAlign: 'center', fontWeight: 700,
            opacity: blocked ? 0.5 : 1,
          }}
        />
      </div>

      {/* Attempt indicator */}
      {attempts > 0 && !blocked && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, justifyContent: 'center' }}>
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: i < attempts ? 'var(--red)' : 'var(--surface2)',
              border: '1px solid var(--border)',
            }} />
          ))}
        </div>
      )}

      {/* Block timer */}
      {blocked && (
        <div style={{
          background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--red)', fontFamily: 'Syne, sans-serif' }}>{blockTimer}с</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{t.pin_blocked_wait}</div>
        </div>
      )}

      {error && !blocked && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</div>
      )}

      <button
        onClick={checkPin}
        className="btn btn-primary btn-full btn-lg"
        disabled={blocked || checking || pin.length !== 6}
        style={{ marginBottom: 16, opacity: (blocked || checking || pin.length !== 6) ? 0.5 : 1 }}
      >
        {blocked ? t.pin_blocked_btn.replace('{sec}', blockTimer) : checking ? '…' : t.pin_submit}
      </button>

      {!FIREBASE_ENABLED && accounts[0] && (
        <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginBottom: 24 }}>
          {t.pin_demo} <span style={{ color: 'var(--purple)', fontWeight: 700 }}>{accounts[0]?.pin}</span>
        </div>
      )}

      {found && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: 24,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--teal)', marginBottom: 4 }}>{t.pin_found} {found.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
            📍 {found.trip} · {t.pin_return} {found.returnTime}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => { stopTrip(); setFound(null); setPin(''); }} className="btn btn-primary btn-full">
              {t.pin_safe_btn}
            </button>
            <button onClick={() => triggerSOS(null)} className="btn btn-danger btn-full">
              {t.pin_sos_btn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
