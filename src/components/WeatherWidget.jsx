import { useWeather, weatherIcon, getMamaTips } from '../hooks/useWeather';

const TIP_COLORS = {
  warning: { bg: 'rgba(244,162,97,0.08)', border: 'rgba(244,162,97,0.3)', color: '#F4A261' },
  info:    { bg: 'rgba(108,99,255,0.08)', border: 'rgba(108,99,255,0.25)', color: 'var(--purple)' },
  success: { bg: 'rgba(6,214,160,0.07)', border: 'rgba(6,214,160,0.25)', color: 'var(--teal)' },
};

export default function WeatherWidget({ coords, placeName }) {
  const { weather, loading } = useWeather(coords);

  if (loading) {
    return (
      <div style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 20, opacity: 0.4 }}>🌤️</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Ауа-райы жүктелуде...</div>
      </div>
    );
  }

  if (!weather) return null;

  const tips = getMamaTips(weather);
  const { current, today, tomorrow } = weather;

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{weatherIcon(current.code)}</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
              {current.temp}°C
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{placeName}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
          {[
            { label: 'Жел', val: `${current.wind} м/с`, icon: '💨' },
            { label: 'Ылғал', val: `${current.humidity}%`, icon: '💧' },
            { label: 'Жаңбыр', val: `${today.rainChance}%`, icon: '🌧️' },
          ].map(item => (
            <div key={item.label} style={{ fontSize: 11, color: 'var(--text3)' }}>
              <div style={{ fontSize: 14, marginBottom: 2 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 12 }}>{item.val}</div>
              <div>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Today / Tomorrow */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {[
          { label: 'Бүгін', d: today },
          { label: 'Ертең', d: tomorrow },
        ].map(({ label, d }, i) => (
          <div key={label} style={{ flex: 1, padding: '10px 16px', background: 'var(--surface)', borderRight: i === 0 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{weatherIcon(d.code)}</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                {d.tempMax}° / {d.tempMin}°
              </div>
              <div style={{ fontSize: 11, color: d.windMax >= 15 ? '#F4A261' : 'var(--text3)' }}>
                💨 {d.windMax} м/с · 🌧️ {d.rainChance}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mama tips */}
      <div style={{ padding: '12px 14px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>💜 Mama says</div>
        {tips.map((tip, i) => {
          const c = TIP_COLORS[tip.type];
          return (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 12px', borderRadius: 8, background: c.bg, border: `1px solid ${c.border}` }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{tip.icon}</span>
              <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{tip.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
