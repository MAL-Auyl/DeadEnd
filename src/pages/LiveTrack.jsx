import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { FIREBASE_ENABLED } from '../lib/firebase';
import { listenTouristByDevice } from '../lib/sync.js';
import MapView from '../components/MapView';

const TX = {
  en: {
    title: 'Live tracking',
    subtitle: 'Read-only — no app or login needed',
    status_active: 'On the trip',
    status_overdue: 'Return time passed',
    status_sos: 'SOS — emergency',
    destination: 'Destination',
    expected_return: 'Expected back',
    last_signal: 'Last signal',
    updated_now: 'updated just now',
    updated_ago: 'updated {s}s ago',
    not_found_title: 'No live trip',
    not_found_sub: 'This trip has ended, or the link is no longer active.',
    disabled_title: 'Live tracking unavailable',
    disabled_sub: 'This build has no real-time sync configured.',
    open_app: 'Open DeadEnd →',
  },
  ru: {
    title: 'Живой трек',
    subtitle: 'Только просмотр — без приложения и входа',
    status_active: 'В пути',
    status_overdue: 'Время возвращения прошло',
    status_sos: 'SOS — экстренная ситуация',
    destination: 'Куда',
    expected_return: 'Вернётся к',
    last_signal: 'Последний сигнал',
    updated_now: 'обновлено только что',
    updated_ago: 'обновлено {s} сек назад',
    not_found_title: 'Активного трека нет',
    not_found_sub: 'Поездка завершена, либо ссылка больше не активна.',
    disabled_title: 'Живой трек недоступен',
    disabled_sub: 'В этой сборке не настроена синхронизация в реальном времени.',
    open_app: 'Открыть DeadEnd →',
  },
  kz: {
    title: 'Тірі трек',
    subtitle: 'Тек қарау — қолданба мен кірусіз',
    status_active: 'Жолда',
    status_overdue: 'Қайту уақыты өтті',
    status_sos: 'SOS — төтенше жағдай',
    destination: 'Бағыт',
    expected_return: 'Қайту уақыты',
    last_signal: 'Соңғы сигнал',
    updated_now: 'дәл қазір жаңартылды',
    updated_ago: '{s} сек бұрын жаңартылды',
    not_found_title: 'Белсенді трек жоқ',
    not_found_sub: 'Сапар аяқталды немесе сілтеме енді белсенді емес.',
    disabled_title: 'Тірі трек қолжетімсіз',
    disabled_sub: 'Бұл құрастырмада нақты уақыт синхронизациясы орнатылмаған.',
    open_app: 'DeadEnd ашу →',
  },
};

const STATUS_STYLE = {
  active:  { bg: 'rgba(6,214,160,0.12)',  border: 'rgba(6,214,160,0.4)',  color: '#06D6A0', icon: '🟢' },
  overdue: { bg: 'rgba(244,162,97,0.12)', border: 'rgba(244,162,97,0.5)', color: '#F4A261', icon: '⏰' },
  sos:     { bg: 'rgba(255,71,87,0.12)',  border: 'rgba(255,71,87,0.6)',  color: '#FF4757', icon: '🆘' },
};

function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function LiveTrack() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { lang } = useLang();
  const tx = TX[lang] || TX.ru;
  const [tourist, setTourist] = useState(undefined); // undefined = loading, null = not found
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const now = useClock();

  useEffect(() => {
    if (!FIREBASE_ENABLED) { setTourist(null); return; }
    const unsub = listenTouristByDevice(deviceId, data => {
      setTourist(data || null);
      setLastUpdate(Date.now());
    });
    return unsub;
  }, [deviceId]);

  const secsAgo = Math.max(0, Math.floor((now - lastUpdate) / 1000));
  const status = STATUS_STYLE[tourist?.status] || STATUS_STYLE.active;
  const statusLabel = tourist?.status === 'sos' ? tx.status_sos
    : tourist?.status === 'overdue' ? tx.status_overdue
    : tx.status_active;

  return (
    <div style={{
      height: '100vh', overflowY: 'auto',
      background: 'var(--bg)', color: 'var(--text)',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div onClick={() => navigate('/')} style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 20,
          cursor: 'pointer', marginBottom: 6,
        }}>
          dead<span style={{ color: 'var(--purple)' }}>end</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 28 }}>
          📡 {tx.title} · {tx.subtitle}
        </div>

        {!FIREBASE_ENABLED && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: 32, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, marginBottom: 8 }}>{tx.disabled_title}</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>{tx.disabled_sub}</p>
          </div>
        )}

        {FIREBASE_ENABLED && tourist === null && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: 32, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏁</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, marginBottom: 8 }}>{tx.not_found_title}</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>{tx.not_found_sub}</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">{tx.open_app}</button>
          </div>
        )}

        {tourist && (
          <>
            {/* Status banner */}
            <div style={{
              background: status.bg, border: `2px solid ${status.border}`,
              borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 14,
              animation: tourist.status === 'sos' ? 'pulse 1.2s infinite' : 'none',
            }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{status.icon}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: status.color, fontFamily: 'Syne, sans-serif' }}>
                  {statusLabel}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                  {secsAgo < 5 ? tx.updated_now : tx.updated_ago.replace('{s}', secsAgo)}
                </div>
              </div>
            </div>

            {/* Tourist card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              {tourist.photo && (
                <img src={tourist.photo} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
              )}
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>{tourist.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>📍 {tourist.destination}</div>
              </div>
            </div>

            {/* Map */}
            <div style={{ marginBottom: 20 }}>
              <MapView
                height={300}
                lang={lang}
                liveCoords={tourist.coords}
                liveLabel={tourist.name}
              />
            </div>

            {/* Stats */}
            <div className="grid-3">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{tx.destination}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{tourist.destination || '—'}</div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{tx.expected_return}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{tourist.expectedReturn || '—'}</div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{tx.last_signal}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{tourist.lastSignal || '—'}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
