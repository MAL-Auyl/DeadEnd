import { LIVE_ALERTS } from '../data/alerts';

const typeStyle = {
  danger: { bg: 'rgba(255,71,87,0.08)', border: 'rgba(255,71,87,0.3)', dot: '#FF4757' },
  warning: { bg: 'rgba(244,162,97,0.08)', border: 'rgba(244,162,97,0.3)', dot: '#F4A261' },
  info: { bg: 'rgba(6,214,160,0.06)', border: 'rgba(6,214,160,0.2)', dot: '#06D6A0' },
};

export default function LiveAlerts({ placeId, limit = 10 }) {
  const alerts = LIVE_ALERTS.filter(a => !placeId || a.placeId === placeId).slice(0, limit);

  if (!alerts.length) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div className="section-label" style={{ margin: 0 }}>🔴 Live alerts</div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
          background: 'rgba(255,71,87,0.15)', color: '#FF4757', letterSpacing: '0.06em',
          animation: 'pulse 2s infinite',
        }}>LIVE</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.map(a => {
          const s = typeStyle[a.type];
          return (
            <div key={a.id} style={{
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 'var(--radius-sm)', padding: '14px 16px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{a.title}</span>
                  {a.verified && (
                    <span style={{ fontSize: 10, color: '#06D6A0', fontWeight: 600 }}>✓ verified</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 8 }}>{a.message}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)' }}>
                  <span>👤 {a.source}</span>
                  <span>🕐 {a.time}</span>
                </div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0, marginTop: 4 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
