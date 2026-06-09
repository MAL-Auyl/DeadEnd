import { useState } from 'react';
import { useTrip } from '../context/TripContext';

function getExplorerBadge(count) {
  if (count >= 20) return { label: 'Gold Explorer', icon: '🥇', color: '#F4C430', bg: 'rgba(244,196,48,0.1)', border: 'rgba(244,196,48,0.3)' };
  if (count >= 10) return { label: 'Silver Explorer', icon: '🥈', color: '#A8B2BD', bg: 'rgba(168,178,189,0.1)', border: 'rgba(168,178,189,0.3)' };
  if (count >= 5)  return { label: 'Bronze Explorer', icon: '🥉', color: '#CD7F32', bg: 'rgba(205,127,50,0.1)', border: 'rgba(205,127,50,0.3)' };
  return null;
}

export default function Profile() {
  const { user, updateUser, addNotification } = useTrip();
  const [form, setForm] = useState(user);

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })); }
  function handleSave() { updateUser(form); addNotification('Profile saved! ✅', 'success'); }

  const badge = getExplorerBadge(user.tripsCompleted || 0);
  const nextBadge = user.tripsCompleted < 5 ? { need: 5, label: 'Bronze Explorer', icon: '🥉' }
    : user.tripsCompleted < 10 ? { need: 10, label: 'Silver Explorer', icon: '🥈' }
    : user.tripsCompleted < 20 ? { need: 20, label: 'Gold Explorer', icon: '🥇' }
    : null;

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <h1 className="page-title">Profile</h1>
      <p className="page-sub">Your data is shared with MChS if you send SOS</p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <img
            src={form.photo || user.photo}
            alt=""
            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--gold)' }}
          />
          <label htmlFor="avatar-upload" style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--gold)', border: '2px solid var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 14,
          }} title="Change photo">📷</label>
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
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{user.firstName} {user.lastName}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{user.email}</div>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>Нажми 📷 чтобы сменить фото</span>
      </div>

      {/* Explorer Badge */}
      <div style={{ marginBottom: 24, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ padding: '14px 18px', background: badge ? badge.bg : 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 36 }}>{badge ? badge.icon : '🗺️'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: badge ? badge.color : 'var(--text2)' }}>
              {badge ? badge.label : 'Explorer'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              {user.tripsCompleted || 0} маршрут аяқталды
            </div>
          </div>
          {badge && <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontWeight: 700 }}>Verified ✓</div>}
        </div>
        {nextBadge && (
          <div style={{ padding: '10px 18px', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Келесі: {nextBadge.icon} {nextBadge.label}</span>
            <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((user.tripsCompleted || 0) / nextBadge.need) * 100}%`, background: 'var(--purple)', borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{user.tripsCompleted || 0}/{nextBadge.need}</span>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>🩸 Critical for rescue</div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Blood type</label>
            <select className="form-select" value={form.bloodType} onChange={e => set('bloodType', e.target.value)}>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Country</label>
            <select className="form-select" value={form.country} onChange={e => set('country', e.target.value)}>
              {['Kazakhstan','USA','Russia','Germany','UK','France','Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {[
          { key: 'firstName', label: "First name", type: 'text' },
          { key: 'lastName', label: 'Last name', type: 'text' },
          { key: 'phone', label: 'Phone number', type: 'tel' },
          { key: 'dob', label: 'Date of birth', type: 'date' },
          { key: 'height', label: 'Height (cm)', type: 'number' },
          { key: 'weight', label: 'Weight (kg)', type: 'number' },
          { key: 'allergies', label: 'Allergies or medical conditions', type: 'text' },
        ].map(f => (
          <div key={f.key} className="form-group">
            <label className="form-label">{f.label}</label>
            <input type={f.type} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="form-input" />
          </div>
        ))}
      </div>

      <div className="section-label" style={{ marginBottom: 12 }}>Emergency contacts</div>
      {form.contacts.map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input value={c.name} onChange={e => { const cs = [...form.contacts]; cs[i] = { ...cs[i], name: e.target.value }; set('contacts', cs); }} placeholder="Name" className="form-input" style={{ flex: 1 }} />
          <input value={c.phone} onChange={e => { const cs = [...form.contacts]; cs[i] = { ...cs[i], phone: e.target.value }; set('contacts', cs); }} placeholder="Phone" className="form-input" style={{ flex: 1 }} />
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--purple)', fontSize: 20 }}>📞</span>
        </div>
      ))}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 28, display: 'flex', gap: 16, alignItems: 'center', marginTop: 20 }}>
        <span style={{ fontSize: 28 }}>🔑</span>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>YOUR EMERGENCY PIN CODE</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--purple)', letterSpacing: '0.3em' }}>{user.pin}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Write this down. Use from any phone to send SOS.</div>
        </div>
      </div>

      <button onClick={handleSave} className="btn btn-primary btn-lg btn-full">Save Profile</button>
    </div>
  );
}
