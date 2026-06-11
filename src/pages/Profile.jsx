import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { useLang } from '../context/LangContext';
import KmTracker from '../components/KmTracker';

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

const ALLERGY_SUGGESTIONS = {
  en: ['Penicillin', 'Peanuts', 'Tree nuts', 'Pollen', 'Bee stings', 'Lactose', 'Gluten', 'Shellfish', 'Latex', 'Aspirin'],
  ru: ['Пенициллин', 'Арахис', 'Орехи', 'Пыльца', 'Укусы пчёл/ос', 'Лактоза', 'Глютен', 'Морепродукты', 'Латекс', 'Аспирин'],
  kz: ['Пенициллин', 'Жержаңғақ', 'Жаңғақтар', 'Тозаң', 'Ара/жегі шағуы', 'Лактоза', 'Глютен', 'Теңіз өнімдері', 'Латекс', 'Аспирин'],
};

export default function Profile() {
  const { user, updateUser, addNotification, logoutUser } = useTrip();
  const { t, lang } = useLang();
  const navigate = useNavigate();
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

      {/* KM TRACKER */}
      <KmTracker initialKm={user.totalKm} />

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
            <div className="form-group">
              <label className="form-label">{t.prof_height}</label>
              <input
                type="number"
                value={form.height ?? ''}
                onChange={e => set('height', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="182"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.prof_weight}</label>
              <input
                type="number"
                value={form.weight ?? ''}
                onChange={e => set('weight', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="78"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">{t.prof_allergies}</label>
            <input
              list="allergy-suggestions"
              value={form.allergies || ''}
              onChange={e => set('allergies', e.target.value)}
              placeholder={t.prof_allergies_ph}
              className="form-input"
            />
            <datalist id="allergy-suggestions">
              {(ALLERGY_SUGGESTIONS[lang] || ALLERGY_SUGGESTIONS.en).map(a => <option key={a} value={a} />)}
            </datalist>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">{t.prof_marks}</label>
            <input
              value={form.specialMarks || ''}
              onChange={e => set('specialMarks', e.target.value)}
              placeholder={t.prof_marks_ph}
              className="form-input"
            />
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
              <button
                type="button"
                onClick={() => { const cs = form.contacts.filter((_, j) => j !== i); set('contacts', cs); }}
                className="btn"
                style={{ padding: '0 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
              >×</button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set('contacts', [...form.contacts, { name: '', phone: '' }])}
            className="btn"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          >{t.prof_add_contact}</button>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="btn btn-primary btn-lg btn-full"
        style={{ marginTop: 8 }}
      >{t.prof_save}</button>

      <button
        onClick={() => { logoutUser(); navigate('/login'); }}
        className="btn btn-full"
        style={{ marginTop: 12, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
      >{t.nav_logout}</button>
    </div>
  );
}
