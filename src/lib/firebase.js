import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const FIREBASE_ENABLED = !!import.meta.env.VITE_FIREBASE_DATABASE_URL;

let db = null;
let auth = null;

function getApp() {
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

export function getDB() {
  if (!FIREBASE_ENABLED) return null;
  if (db) return db;
  try {
    db = getDatabase(getApp());
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
  }
  return db;
}

export function getFirebaseAuth() {
  if (!FIREBASE_ENABLED) return null;
  if (auth) return auth;
  try {
    auth = getAuth(getApp());
  } catch (e) {
    console.warn('Firebase auth init failed:', e.message);
  }
  return auth;
}
