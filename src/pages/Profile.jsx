import { useState, useRef, useEffect } from 'react';
import { useTrip } from '../context/TripContext';
import { useLang } from '../context/LangContext';

const UNIVERSES = [
  {
    tag: 'Властелин колец',
    facts: [
      { km: 0,    text: 'Фродо ещё в Шире. Кольцо спит.' },
      { km: 285,  text: 'Столько Фродо прошёл до Бри — первого трактира вне Шира.' },
      { km: 750,  text: 'Фродо добрался до Ривенделла. Братство только собирается.' },
      { km: 1050, text: 'Мория позади. Гэндальф пал. Путь не остановить.' },
      { km: 1150, text: 'Лóриэн. Галадриэль предложила Кольцо — и отказалась.' },
      { km: 1650, text: 'Минас Тирит. Война Кольца у порога.' },
      { km: 1800, text: 'Кольцо уничтожено. Фродо прошёл ровно столько же.' },
    ],
  },
  {
    tag: 'Игра Престолов',
    facts: [
      { km: 0,    text: 'Ты в Винтерфелле. Зима близко.' },
      { km: 400,  text: 'Столько Джон Сноу прошёл из Винтерфелла до Стены.' },
      { km: 900,  text: 'Примерно столько Арья Старк брела в одиночку через Вестерос.' },
      { km: 1500, text: 'Путь из Винтерфелла до Королевской Гавани. Нед Старк ехал три недели.' },
      { km: 2000, text: 'Дейенерис пересекла бы Узкое море дважды.' },
    ],
  },
  {
    tag: 'Атака Титанов',
    facts: [
      { km: 0,    text: 'Ты внутри стены Сина. Здесь безопасно.' },
      { km: 100,  text: 'Столько от Шиганшины до Трозта. Первое появление Колоссального.' },
      { km: 500,  text: 'Половина окружности стены Марии. Разведкорпус знает каждый метр.' },
      { km: 960,  text: 'Ровно столько — полная окружность стены Марии. Эрен бы оценил.' },
      { km: 1500, text: 'Как путь от Парадиса до Маре через море. Дорога «Грохота».' },
    ],
  },
  {
    tag: 'Наруто',
    facts: [
      { km: 0,    text: 'Ты в Деревне Листа. До первого задания — рукой подать.' },
      { km: 300,  text: 'Столько от Деревни Листа до Деревни Песка. Гааре — привет.' },
      { km: 700,  text: 'Наруто столько пробежал за время тренировок с Дзирайей.' },
      { km: 1200, text: 'Путь Наруто за Саске после предательства — он не останавливался.' },
      { km: 1800, text: 'Если бы Наруто бежал без остановок — добежал бы до Страны Облаков.' },
    ],
  },
  {
    tag: 'Аватар',
    facts: [
      { km: 0,    text: 'Аанг только проснулся во льдах. Огненная Нация ещё не знает.' },
      { km: 450,  text: 'Аанг пролетел на Аппе от Южного полюса до Огненной Нации.' },
      { km: 900,  text: 'Половина пути до Ба Синг Се. Аппа устал бы.' },
      { km: 1400, text: 'Столько Аанг преодолел, чтобы освоить все четыре стихии.' },
    ],
  },
  {
    tag: 'Ведьмак',
    facts: [
      { km: 0,    text: 'Геральт только покинул Каэр Морхен. Дорога длинная.' },
      { km: 350,  text: 'От Каэр Морхена до Новиграда — примерно столько.' },
      { km: 750,  text: 'Столько Геральт прошёл в поисках Цири по Континенту.' },
      { km: 1300, text: 'Геральт и Цири вместе — от Новиграда до края карты.' },
    ],
  },
];

function getUniverseFact(facts, km) {
  let match = facts[0];
  for (const f of facts) {
    if (km >= f.km) match = f;
    else break;
  }
  return match;
}

function KmWidget({ totalKm }) {
  const km = totalKm || 0;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '20px 20px 18px',
      marginBottom: 16,
    }}>
      {/* big number */}
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 'clamp(32px, 10vw, 44px)', fontWeight: 900,
        color: 'var(--text)', letterSpacing: '-0.05em', lineHeight: 1,
        marginBottom: 4,
      }}>
        {km.toLocaleString()}
        <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text3)', letterSpacing: '-0.02em', marginLeft: 6 }}>км</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
        пройдено в DeadEnd
      </div>

      {/* universe facts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {UNIVERSES.map((u, i) => {
          const fact = getUniverseFact(u.facts, km);
          return (
            <div
              key={u.tag}
              style={{
                paddingTop: i === 0 ? 0 : 12,
                paddingBottom: 12,
                borderBottom: i < UNIVERSES.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'none' : 'translateY(8px)',
                transition: `opacity 400ms ${E} ${i * 70}ms, transform 400ms ${E} ${i * 70}ms`,
              }}
            >
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--gold)',
                marginBottom: 5,
              }}>
                {u.tag}
              </div>
              <div style={{
                fontSize: 13, color: 'var(--text2)', lineHeight: 1.65,
              }}>
                {fact.text}
              </div>
            </div>
          );
        })}
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

      {/* KM WIDGET */}
      <KmWidget totalKm={user.totalKm} />

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
