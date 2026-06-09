import { useState, useRef, useEffect } from 'react';
import { useTrip } from '../context/TripContext';
import { useLang } from '../context/LangContext';

import mapLotr from '../assets/map-lotr.webp';

const MORDOR_KM = 1800;
// x/y = % position on the map image
const WAYPOINTS = [
  { km: 0,    label: 'Шир',          x: 17, y: 73 },
  { km: 450,  label: 'Бри',          x: 23, y: 60 },
  { km: 750,  label: 'Ривенделл',    x: 30, y: 47 },
  { km: 1050, label: 'Мория',        x: 47, y: 43 },
  { km: 1150, label: 'Лóриэн',       x: 57, y: 53 },
  { km: 1650, label: 'Минас Тирит',  x: 41, y: 25 },
  { km: 1800, label: 'Роковая гора', x: 68, y: 19 },
];

function getCurrentWaypoint(km) {
  for (let i = WAYPOINTS.length - 1; i >= 0; i--) {
    if (km >= WAYPOINTS[i].km) return WAYPOINTS[i];
  }
  return WAYPOINTS[0];
}

function LotRProgress({ totalKm }) {
  const km        = Math.min(totalKm || 0, MORDOR_KM);
  const remaining = MORDOR_KM - km;
  const current   = getCurrentWaypoint(km);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div style={{ marginBottom: 16, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>

      {/* map with waypoint overlays */}
      <div style={{ position: 'relative', lineHeight: 0 }}>
        <img
          src={mapLotr}
          alt="Путь от Шира до Роковой горы"
          style={{ width: '100%', display: 'block', objectFit: 'cover' }}
        />

        {/* dim overlay over future area */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(11,9,7,0.18)',
          pointerEvents: 'none',
        }} />

        {/* waypoint markers */}
        {WAYPOINTS.map((wp, i) => {
          const passed  = km >= wp.km;
          const isCurrent = current.km === wp.km;
          const isLast  = wp.km === MORDOR_KM;
          if (!passed) return null;
          return (
            <div
              key={wp.km}
              style={{
                position: 'absolute',
                left: `${wp.x}%`,
                top:  `${wp.y}%`,
                transform: 'translate(-50%, -50%)',
                opacity: mounted ? 1 : 0,
                transition: `opacity 400ms ${E} ${i * 120}ms`,
                zIndex: isCurrent ? 3 : 2,
              }}
            >
              {/* glow ring for current */}
              {isCurrent && (
                <div style={{
                  position: 'absolute', inset: -6,
                  borderRadius: '50%',
                  background: 'rgba(201,160,85,0.2)',
                  animation: 'lotrPulse 2s infinite',
                }} />
              )}
              {/* dot */}
              <div style={{
                width:  isCurrent ? 12 : 8,
                height: isCurrent ? 12 : 8,
                borderRadius: '50%',
                background: isCurrent ? 'var(--gold)' : isLast ? '#ff4444' : 'var(--gold2)',
                border: `2px solid rgba(11,9,7,0.7)`,
                boxShadow: isCurrent
                  ? '0 0 10px rgba(201,160,85,0.9), 0 0 3px rgba(201,160,85,0.6)'
                  : '0 0 5px rgba(201,160,85,0.5)',
              }} />
              {/* label */}
              <div style={{
                position: 'absolute',
                left: '50%', top: -20,
                transform: 'translateX(-50%)',
                fontSize: 9, fontWeight: 700,
                fontFamily: 'Syne, sans-serif',
                color: isCurrent ? 'var(--gold)' : 'rgba(240,232,216,0.75)',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)',
                letterSpacing: '0.04em',
              }}>
                {wp.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* bottom stats strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--gold)', flexShrink: 0, display: 'inline-block',
            animation: 'lotrPulse 2s infinite',
          }} />
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>
            у <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{current.label}</span>
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800,
            color: 'var(--text)', letterSpacing: '-0.03em',
          }}>
            {km.toLocaleString()} км
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>
            {remaining > 0 ? `ещё ${remaining.toLocaleString()} до Роковой горы` : '🌋 ты дошёл!'}
          </span>
        </div>
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
