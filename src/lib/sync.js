import { ref, set, update, remove, push, get, onValue, off } from 'firebase/database';
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

// ── Weak-connection SOS path ──────────────────────────────────
// A single short HTTPS PATCH to the Realtime Database REST API. Unlike the
// SDK's persistent websocket, this can succeed over a slow/2G link with a
// short timeout + retries, and `hackathon_demo` is open for unauthenticated
// read/write per database.rules.json.

const DB_URL = import.meta.env.VITE_FIREBASE_DATABASE_URL;

function roundCoord(n) {
  return Math.round(n * 10000) / 10000; // ~11m precision — keeps the payload tiny
}

async function restPatch(path, data, { timeoutMs = 5000, retries = 3 } = {}) {
  if (!DB_URL) return false;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${DB_URL}/${path}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) return true;
    } catch {
      clearTimeout(timer);
    }
    if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
  }
  return false;
}

// Pushes SOS fields via the SDK (fast path) and via a compact, retrying REST
// PATCH (reliable path on weak 2G). Resolves true only once the REST call
// has confirmed delivery — callers use this to decide whether to queue for retry.
export async function sendSOSCompact(deviceId, fields) {
  if (!FIREBASE_ENABLED) return false;
  updateTourist(deviceId, fields);
  const compact = { ...fields };
  if (compact.coords) {
    compact.coords = { lat: roundCoord(compact.coords.lat), lng: roundCoord(compact.coords.lng) };
  }
  return restPatch(`${SESSION}/tourists/${deviceId}`, compact);
}

// ── Nearby SOS broadcast (warns other tourists within range) ──

export function broadcastSOS(deviceId, coords, placeName) {
  if (!FIREBASE_ENABLED) return;
  const db = getDB(); if (!db) return;
  set(ref(db, `${SESSION}/sos_broadcasts/${deviceId}`), {
    deviceId, coords, placeName, time: new Date().toISOString(),
  });
}

export function removeSOSBroadcast(deviceId) {
  if (!FIREBASE_ENABLED) return;
  const db = getDB(); if (!db) return;
  remove(ref(db, `${SESSION}/sos_broadcasts/${deviceId}`));
}

export function listenSOSBroadcasts(callback) {
  if (!FIREBASE_ENABLED) return () => {};
  const db = getDB(); if (!db) return () => {};
  const r = ref(db, `${SESSION}/sos_broadcasts`);
  onValue(r, snap => {
    const raw = snap.val();
    callback(raw ? Object.values(raw) : []);
  });
  return () => off(r);
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

// Clears a tourist's SOS response so a stale step doesn't replay on next page load
export function clearSOSResponse(deviceId) {
  if (!FIREBASE_ENABLED) return;
  const db = getDB(); if (!db) return;
  remove(ref(db, `${SESSION}/sos_responses/${deviceId}`));
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

// ── Live share link (mom scans QR, no login) ─────────────────

export function listenTouristByDevice(deviceId, callback) {
  if (!FIREBASE_ENABLED) return () => {};
  const db = getDB(); if (!db) return () => {};
  const r = ref(db, `${SESSION}/tourists/${deviceId}`);
  onValue(r, snap => callback(snap.val()));
  return () => off(r);
}

// ── Group rooms (group tours — one tourist creates a room code, others join) ──

const GROUP_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — easy to read aloud

export function generateGroupCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += GROUP_CODE_CHARS[Math.floor(Math.random() * GROUP_CODE_CHARS.length)];
  return code;
}

export async function createGroup(code, data) {
  if (!FIREBASE_ENABLED) return false;
  const db = getDB(); if (!db) return false;
  await set(ref(db, `${SESSION}/groups/${code}`), data);
  return true;
}

export async function getGroup(code) {
  if (!FIREBASE_ENABLED) return null;
  const db = getDB(); if (!db) return null;
  try {
    const snap = await get(ref(db, `${SESSION}/groups/${code}`));
    return snap.exists() ? snap.val() : null;
  } catch {
    return null;
  }
}

// ── Trip history (for Akimat analytics) ──────────────────────

// Called when a trip ends — keeps a permanent record for stats,
// since `tourists/{deviceId}` is removed once the trip is over.
export function archiveTrip(deviceId, data) {
  if (!FIREBASE_ENABLED) return;
  const db = getDB(); if (!db) return;
  push(ref(db, `${SESSION}/trips_history`), { deviceId, ...data });
}

export function listenTripsHistory(callback) {
  if (!FIREBASE_ENABLED) return () => {};
  const db = getDB(); if (!db) return () => {};
  const r = ref(db, `${SESSION}/trips_history`);
  onValue(r, snap => {
    const raw = snap.val();
    const trips = raw ? Object.values(raw) : [];
    callback(trips);
  });
  return () => off(r);
}
