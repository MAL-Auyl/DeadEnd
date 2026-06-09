import { useState, useRef, useEffect } from 'react';
import { useTrip } from '../context/TripContext';
import { useLang } from '../context/LangContext';

const MORDOR_KM = 1800;
const WAYPOINTS = [
  { km: 0,    label: 'Шир' },
  { km: 450,  label: 'Бри' },
  { km: 750,  label: 'Ривенделл' },
  { km: 1050, label: 'Мория' },
  { km: 1150, label: 'Лóриэн' },
  { km: 1650, label: 'Минас Тирит' },
  { km: 1800, label: 'Роковая гора' },
];

function getCurrentWaypoint(km) {
  for (let i = WAYPOINTS.length - 1; i >= 0; i--) {
    if (km >= WAYPOINTS[i].km) return WAYPOINTS[i];
  }
  return WAYPOINTS[0];
}

function LotRProgress({ totalKm }) {
  const km        = Math.min(totalKm || 0, MORDOR_KM);
  const pct       = (km / MORDOR_KM) * 100;
  const remaining = MORDOR_KM - km;
  const current   = getCurrentWaypoint(km);
  const [mounted, setMounted]   = useState(false);
  const [hov, setHov]           = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 520);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    const onResize = () => setIsMobile(window.innerWidth < 520);
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', onResize); };
  }, []);

  const visibleWaypoints = isMobile
    ? WAYPOINTS.filter(wp => [0, 750, 1050, 1800].includes(wp.km))
    : WAYPOINTS;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.985)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = hov ? 'translateY(-3px)' : ''; }}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hov ? 'rgba(201,160,85,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '20px 20px 22px',
        marginBottom: 16,
        cursor: 'default',
        transform: hov ? 'translateY(-3px)' : 'none',
        transition: `transform 260ms ${E}, border-color 220ms ease, box-shadow 260ms ease`,
        boxShadow: hov ? '0 8px 32px rgba(201,160,85,0.1)' : 'none',
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 900,
            color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1,
          }}>
            {km.toLocaleString()} км
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, letterSpacing: '0.01em' }}>
            пройдено в DeadEnd
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800,
            color: 'var(--gold)', letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {remaining > 0 ? `−${remaining.toLocaleString()} км` : 'Ты дошёл!'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            {remaining > 0 ? 'до Роковой горы' : 'до Роковой горы'}
          </div>
        </div>
      </div>

      {/* progress bar */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <div style={{
          height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'visible', position: 'relative',
        }}>
          <div style={{
            height: '100%', borderRadius: 3,
            width: mounted ? `${pct}%` : '0%',
            background: `linear-gradient(90deg, var(--gold) 0%, var(--gold2) 100%)`,
            transition: `width 900ms ${E}`,
            position: 'relative',
          }}>
            {/* you are here dot */}
            <div style={{
              position: 'absolute', right: -6, top: '50%',
              transform: 'translateY(-50%)',
              width: 12, height: 12, borderRadius: '50%',
              background: 'var(--gold)',
              border: '2px solid var(--bg)',
              animation: 'lotrPulse 2s infinite',
            }} />
          </div>
        </div>

        {/* waypoint ticks */}
        {visibleWaypoints.map((wp, i) => {
          const pos    = (wp.km / MORDOR_KM) * 100;
          const passed = km >= wp.km;
          return (
            <div key={wp.km} style={{
              position: 'absolute', top: -3,
              left: `${pos}%`, transform: 'translateX(-50%)',
            }}>
              <div style={{
                width: 2, height: 12, borderRadius: 1,
                background: passed ? 'var(--gold)' : 'var(--border2)',
                transition: `background 400ms ease ${i * 80}ms`,
              }} />
            </div>
          );
        })}
      </div>

      {/* waypoint labels */}
      <div style={{ position: 'relative', height: 28 }}>
        {visibleWaypoints.map((wp, i) => {
          const pos    = (wp.km / MORDOR_KM) * 100;
          const passed = km >= wp.km;
          const isNow  = current.km === wp.km;
          const last   = i === visibleWaypoints.length - 1;
          return (
            <div key={wp.km} style={{
              position: 'absolute',
              left: `${pos}%`,
              transform: i === 0 ? 'none' : last ? 'translateX(-100%)' : 'translateX(-50%)',
              fontSize: isMobile ? 9 : 10, fontWeight: isNow ? 700 : 500,
              color: isNow ? 'var(--gold)' : passed ? 'var(--text2)' : 'var(--text3)',
              whiteSpace: 'nowrap',
              transition: `color 400ms ease`,
              lineHeight: 1.2,
            }}>
              {last ? '🌋' : wp.label}
            </div>
          );
        })}
      </div>

      {/* current location line */}
      <div style={{
        marginTop: 14, paddingTop: 14,
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--gold)', flexShrink: 0, display: 'inline-block',
          boxShadow: '0 0 6px rgba(201,160,85,0.6)',
        }} />
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>
          Сейчас ты у{' '}
          <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{current.label}</span>
          {remaining > 0
            ? ` — ${remaining.toLocaleString()} км до того, как бросить кольцо`
            : ' — ты дошёл до Роковой горы!'}
        </span>
      </div>
    </div>
  );
}

function getExplorerBadge(count) {
  if (count >= 20) return { label: 'Gold Explorer',   color: '#F4C430', bg: 'rgba(244,196,48,0.1)',  border: 'rgba(244,196,48,0.3)'  };
  if (count >= 10) return { label: 'Silver Explorer', color: '#A8B2BD', bg: 'rgba(168,178,189,0.1)', border: 'rgba(168,178,189,0.3)' };
  if (count >= 5)  return { label: 'Bronze Explorer', color: '#CD7F32', bg: 'rgba(205,127,50,0.1)',  border: 'rgba(205,127,50,0.3)'  };
  return null;
}

const E = 'cubic-bezier(0.16,1,0.3,1)';

function SectionLabel({ children, accent }) {
  return (
    <div className="profile-section-label" style={accent ? { color: accent } : {}}>
      <span className="profile-section-line" style={accent ? { background: accent } : {}} />
      {children}
    </div>
  );
}

export default function Profile() {
  const { user, updateUser, addNotification } = useTrip();
  const { t } = useLang();
  const [form, setForm] = useState(user);

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })); }
  function handleSave() { updateUser(form); addNotification(t.prof_saved, 'success'); }

  const badge = getExplorerBadge(user.tripsCompleted || 0);
  const trips = user.tripsCompleted || 0;
  const nextBadge = trips < 5
    ? { need: 5,  label: 'Bronze Explorer' }
    : trips < 10 ? { need: 10, label: 'Silver Explorer' }
    : trips < 20 ? { need: 20, label: 'Gold Explorer' }
    : null;

  return (
    <div className="profile-page">

      {/* HEADER */}
      <div className="profile-header">
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={form.photo || user.photo}
            alt=""
            style={{
              width: 88, height: 88, borderRadius: '50%',
              objectFit: 'cover', border: '2px solid var(--border2)', display: 'block',
            }}
          />
          <label
            htmlFor="avatar-upload"
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--gold)', border: '2px solid var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#0B0907',
              transition: `transform 140ms ${E}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => set('photo', ev.target.result);
              reader.readAsDataURL(file);
            }}
          />
        </div>

        <div style={{ flex: 1, paddingTop: 2 }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800,
            color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 7,
          }}>
            {user.firstName} {user.lastName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user.email}</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text3)', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{trips} {t.prof_trips}</span>
          </div>
          {badge ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '3px 12px',
              borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
              color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
            }}>{badge.label}</span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '3px 12px',
              borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
              color: 'var(--text3)', background: 'var(--surface)', border: '1px solid var(--border)',
            }}>Explorer</span>
          )}
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>{t.prof_change}</div>
        </div>
      </div>

      {/* BADGE PROGRESS */}
      {nextBadge && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '14px 18px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
              {t.prof_next} {nextBadge.label}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
              {trips} / {nextBadge.need}
            </span>
          </div>
          <div style={{ height: 2, borderRadius: 1, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min((trips / nextBadge.need) * 100, 100)}%`,
              background: 'var(--gold)', borderRadius: 1,
              transition: `width 0.7s ${E}`,
            }} />
          </div>
        </div>
      )}

      {/* LOTR PROGRESS */}
      <LotRProgress totalKm={user.totalKm} />

      {/* EMERGENCY PIN */}
      <div className="profile-pin-card">
        <div className="profile-pin-label">Emergency PIN</div>
        <div className="profile-pin-number">
          {String(user.pin).slice(0, 3)}
          <span style={{ color: 'var(--text3)', fontWeight: 400, letterSpacing: '0.04em' }}> - </span>
          {String(user.pin).slice(3)}
        </div>
        <div className="profile-pin-hint">
          Write this down. Works from any phone to send SOS without login.
        </div>
      </div>

      {/* CRITICAL INFO */}
      <div>
        <SectionLabel accent="var(--red)">{t.prof_critical}</SectionLabel>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderLeft: '2px solid rgba(224,82,82,0.5)',
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          padding: '18px 20px', marginBottom: 16,
        }}>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">{t.prof_blood}</label>
              <select className="form-select" value={form.bloodType} onChange={e => set('bloodType', e.target.value)}>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt}>{bt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.prof_country}</label>
              <select className="form-select" value={form.country} onChange={e => set('country', e.target.value)}>
                {['Kazakhstan','USA','Russia','Germany','UK','France','Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* PERSONAL INFO */}
      <div>
        <SectionLabel>Personal</SectionLabel>
        <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'firstName', labelKey: 'prof_fname', type: 'text' },
            { key: 'lastName',  labelKey: 'prof_lname', type: 'text' },
            { key: 'phone',     labelKey: 'prof_phone', type: 'tel'  },
          ].map(f => (
            <div key={f.key} className="form-group">
              <label className="form-label">{t[f.labelKey]}</label>
              <input
                type={f.type}
                value={form[f.key] || ''}
                onChange={e => set(f.key, e.target.value)}
                className="form-input"
              />
            </div>
          ))}
        </div>
      </div>

      {/* EMERGENCY CONTACTS */}
      <div>
        <SectionLabel>{t.prof_contacts}</SectionLabel>
        <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {form.contacts.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <input
                value={c.name}
                onChange={e => { const cs = [...form.contacts]; cs[i] = { ...cs[i], name: e.target.value }; set('contacts', cs); }}
                placeholder={t.pt_contact_name}
                className="form-input"
                style={{ flex: 1 }}
              />
              <input
                value={c.phone}
                onChange={e => { const cs = [...form.contacts]; cs[i] = { ...cs[i], phone: e.target.value }; set('contacts', cs); }}
                placeholder={t.pt_contact_ph}
                className="form-input"
                style={{ flex: 1 }}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="btn btn-primary btn-lg btn-full"
        style={{ marginTop: 8 }}
      >{t.prof_save}</button>
    </div>
  );
}
