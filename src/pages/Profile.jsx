import { useState, useRef, useEffect } from 'react';
import { useTrip } from '../context/TripContext';
import { useLang } from '../context/LangContext';

import mapLotr from '../assets/map-lotr.webp';

const MORDOR_KM = 1800;
// x/y = % of map image (800×785px)
const WAYPOINTS = [
  { km: 0,    label: 'Шир',          x: 17, y: 73 },
  { km: 450,  label: 'Бри',          x: 23, y: 60 },
  { km: 750,  label: 'Ривенделл',    x: 30, y: 47 },
  { km: 1050, label: 'Мория',        x: 47, y: 43 },
  { km: 1150, label: 'Лóриэн',       x: 57, y: 53 },
  { km: 1650, label: 'Минас Тирит',  x: 41, y: 25 },
  { km: 1800, label: 'Роковая гора', x: 68, y: 19 },
];

// smooth cubic-bezier path through all waypoints (viewBox 0 0 100 100)
const ROUTE_PATH = [
  'M 17,73',
  'C 19,68 21,64 23,60',
  'C 25,55 27,51 30,47',
  'C 37,45 42,44 47,43',
  'C 52,47 55,51 57,53',
  'C 53,44 47,34 41,25',
  'C 51,22 60,20 68,19',
].join(' ');

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
  const pathRef   = useRef(null);
  const [pathLen, setPathLen] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (pathRef.current) setPathLen(pathRef.current.getTotalLength());
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const progress    = km / MORDOR_KM;
  const dashArray   = pathLen || 9999;
  // before measured: hide; after: animate traveled portion
  const dashOffset  = pathLen === 0 ? 9999 : mounted ? pathLen * (1 - progress) : pathLen;

  return (
    <div style={{ marginBottom: 16, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ position: 'relative', lineHeight: 0 }}>

        {/* base map */}
        <img src={mapLotr} alt="Путь Фродо" style={{ width: '100%', display: 'block' }} />

        {/* SVG route overlay — same coordinate space as image */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {/* ghost path — future route, very dim */}
          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="rgba(201,160,85,0.18)"
            strokeWidth="1.4"
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />

          {/* traveled path — draws in on mount */}
          <path
            ref={pathRef}
            d={ROUTE_PATH}
            fill="none"
            stroke="#C9A055"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            vectorEffect="non-scaling-stroke"
            style={{ transition: `stroke-dashoffset 1400ms ${E}`, filter: 'drop-shadow(0 0 3px rgba(201,160,85,0.7))' }}
          />

          {/* waypoint circles — only passed ones */}
          {WAYPOINTS.map((wp, i) => {
            const passed    = km >= wp.km;
            const isCurrent = current.km === wp.km;
            return (
              <circle
                key={wp.km}
                cx={wp.x} cy={wp.y} r="1.6"
                fill={isCurrent ? '#C9A055' : passed ? '#DDB96A' : 'rgba(201,160,85,0.08)'}
                stroke={passed ? 'rgba(11,9,7,0.85)' : 'rgba(201,160,85,0.1)'}
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
                opacity={passed ? (mounted ? 1 : 0) : 0.25}
                style={{ transition: `opacity 400ms ease ${i * 90}ms, fill 600ms ease` }}
              />
            );
          })}
        </svg>

        {/* traveler icon — moves to current waypoint */}
        <div style={{
          position: 'absolute',
          left: `${current.x}%`,
          top:  `${current.y}%`,
          transform: 'translate(-50%, -160%)',
          fontSize: 17,
          lineHeight: 1,
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.95))',
          transition: `left 900ms ${E}, top 900ms ${E}`,
          zIndex: 5,
          pointerEvents: 'none',
        }}>🧙</div>

        {/* labels — only passed waypoints */}
        {WAYPOINTS.map((wp, i) => {
          const passed    = km >= wp.km;
          const isCurrent = current.km === wp.km;
          if (!passed) return null;
          return (
            <div key={wp.km} style={{
              position: 'absolute',
              left: `${wp.x}%`,
              top:  `${wp.y}%`,
              transform: `translate(-50%, ${isCurrent ? '-290%' : '-240%'})`,
              fontSize: isCurrent ? 9 : 8,
              fontFamily: 'Syne, sans-serif',
              fontWeight: isCurrent ? 700 : 500,
              color: isCurrent ? '#C9A055' : 'rgba(240,232,216,0.78)',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 5px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.8)',
              letterSpacing: '0.04em',
              opacity: mounted ? 1 : 0,
              transition: `opacity 450ms ease ${i * 90}ms`,
              zIndex: 4,
              pointerEvents: 'none',
            }}>
              {wp.label}
            </div>
          );
        })}
      </div>

      {/* stats strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 16px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: 'var(--gold)', display: 'inline-block',
            animation: 'lotrPulse 2s infinite',
          }} />
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>
            у <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{current.label}</span>
          </span>
        </div>
        <div>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800,
            color: 'var(--text)', letterSpacing: '-0.03em',
          }}>
            {km.toLocaleString()} км
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>
            {remaining > 0 ? `· ещё ${remaining.toLocaleString()} до Роковой горы` : '· 🌋 дошёл!'}
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
