import { ref, set, update, remove, onValue, off } from 'firebase/database';
import { getDB, FIREBASE_ENABLED } from './firebase.js';

const SESSION = 'hackathon_demo';

// ── Tourist → Firebase ────────────────────────────────────────

export function syncTourist(deviceId, data) {
  if (!FIREBASE_ENABLED) return;
  const db = getDB(); if (!db) return;
  set(ref(db, `${SESSION}/tourists/${deviceId}`), data);
}

export function updateTourist(deviceId, fields) {
  if (!FIREBASE_ENABLED) return;
  const db = getDB(); if (!db) return;
  update(ref(db, `${SESSION}/tourists/${deviceId}`), fields);
}

export function removeTourist(deviceId) {
  if (!FIREBASE_ENABLED) return;
  const db = getDB(); if (!db) return;
  remove(ref(db, `${SESSION}/tourists/${deviceId}`));
}

// ── MChS → Tourist (SOS response) ────────────────────────────

export function sendSOSResponse(deviceId, step) {
  if (!FIREBASE_ENABLED) return;
  const db = getDB(); if (!db) return;
  set(ref(db, `${SESSION}/sos_responses/${deviceId}`), {
    step,
    time: new Date().toISOString(),
  });
}

export function listenSOSResponse(deviceId, callback) {
  if (!FIREBASE_ENABLED) return () => {};
  const db = getDB(); if (!db) return () => {};
  const r = ref(db, `${SESSION}/sos_responses/${deviceId}`);
  onValue(r, snap => { if (snap.val()) callback(snap.val()); });
  return () => off(r);
}

// ── AdminPanel ← Firebase ─────────────────────────────────────

export function listenTourists(callback) {
  if (!FIREBASE_ENABLED) return () => {};
  const db = getDB(); if (!db) return () => {};
  const r = ref(db, `${SESSION}/tourists`);
  onValue(r, snap => {
    const raw = snap.val();
    const tourists = raw ? Object.values(raw).filter(t => t && t.name && t.id) : [];
    callback(tourists);
  });
  return () => off(r);
}
