import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { getDB, getFirebaseAuth, FIREBASE_ENABLED } from './firebase.js';

// ── Firebase Authentication ──────────────────────────────────

export async function firebaseRegister(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) return { success: false, error: 'disabled' };
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, uid: cred.user.uid };
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') return { success: false, error: 'exists' };
    if (e.code === 'auth/weak-password') return { success: false, error: 'weak' };
    if (e.code === 'auth/invalid-email') return { success: false, error: 'required' };
    if (e.code === 'auth/configuration-not-found') return { success: false, error: 'config' };
    return { success: false, error: 'required' };
  }
}

export async function firebaseLogin(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) return { success: false, error: 'disabled' };
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, uid: cred.user.uid };
  } catch (e) {
    if (e.code === 'auth/configuration-not-found') return { success: false, error: 'config' };
    return { success: false, error: 'invalid' };
  }
}

export async function firebaseGoogleSignIn() {
  const auth = getFirebaseAuth();
  if (!auth) return { success: false, error: 'disabled' };
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    return { success: true, uid: cred.user.uid, profile: cred.additionalUserInfo?.profile, fbUser: cred.user };
  } catch (e) {
    if (e.code === 'auth/configuration-not-found') return { success: false, error: 'config' };
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return { success: false, error: 'cancelled' };
    // Email already has a password-based account — Google sign-in for the
    // same address is rejected by Firebase ("one account per email").
    if (e.code === 'auth/account-exists-with-different-credential') {
      return { success: false, error: 'account-exists', email: e.customData?.email };
    }
    return { success: false, error: 'invalid' };
  }
}

// Sends a reset link to the given email. Always reports success when the
// address is well-formed — never reveal whether an account exists for it.
export async function firebaseSendPasswordReset(email) {
  const auth = getFirebaseAuth();
  if (!auth) return { success: false, error: 'disabled' };
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (e) {
    if (e.code === 'auth/configuration-not-found') return { success: false, error: 'config' };
    if (e.code === 'auth/invalid-email') return { success: false, error: 'required' };
    if (e.code === 'auth/user-not-found') return { success: true };
    return { success: false, error: 'invalid' };
  }
}

export async function firebaseLogout() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  try { await signOut(auth); } catch {}
}

// Fires immediately with the current user (or null), then on every change.
export function onAuthChange(callback) {
  const auth = getFirebaseAuth();
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

// ── User profile (Realtime Database) ─────────────────────────

export async function saveUserProfile(uid, profile) {
  if (!FIREBASE_ENABLED) return;
  const db = getDB(); if (!db) return;
  await set(ref(db, `users/${uid}`), profile);
}

// Realtime Database drops empty arrays/objects and `null` values on write,
// so they come back missing on read — fill them back in with defaults.
const PROFILE_DEFAULTS = {
  gender: '', dob: '', bloodType: 'O+', height: null, weight: null,
  country: 'Kazakhstan', phone: '', allergies: '', specialMarks: '',
  contacts: [], role: 'tourist', tripsCompleted: 0, totalKm: 0,
};

export async function loadUserProfile(uid) {
  if (!FIREBASE_ENABLED) return null;
  const db = getDB(); if (!db) return null;
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? { ...PROFILE_DEFAULTS, ...snap.val() } : null;
}

export async function updateUserProfile(uid, fields) {
  if (!FIREBASE_ENABLED) return;
  const db = getDB(); if (!db) return;
  await update(ref(db, `users/${uid}`), fields);
}

// ── PIN index — lets PinLogin find an account without auth ───

export async function savePinIndex(pin, uid) {
  if (!FIREBASE_ENABLED) return;
  const db = getDB(); if (!db) return;
  await set(ref(db, `pins/${pin}`), uid);
}

export async function findUserByPin(pin) {
  if (!FIREBASE_ENABLED) return null;
  const db = getDB(); if (!db) return null;
  const pinSnap = await get(ref(db, `pins/${pin}`));
  if (!pinSnap.exists()) return null;
  const uid = pinSnap.val();
  return loadUserProfile(uid);
}
