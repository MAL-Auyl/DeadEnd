import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MOCK_USER, ADMIN_CREDENTIALS } from '../data/places';
import { syncTourist, updateTourist, removeTourist, archiveTrip, listenSOSResponse, clearSOSResponse } from '../lib/sync.js';
import { FIREBASE_ENABLED } from '../lib/firebase.js';
import {
  firebaseRegister, firebaseLogin, firebaseLogout, onAuthChange,
  saveUserProfile, loadUserProfile, updateUserProfile,
  savePinIndex, findUserByPin,
} from '../lib/authDb.js';

const TripContext = createContext(null);

// Minutes after the deadline passes (status → 'overdue') before an automatic SOS fires
export const SOS_GRACE_MINUTES = 15;

function safeGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function safeSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function safeRemove(key) { try { localStorage.removeItem(key); } catch {} }

// persistent device id for Firebase keying
function getDeviceId() {
  let id = localStorage.getItem('deadend_device_id');
  if (!id) { id = 'dev_' + Math.random().toString(36).slice(2, 9); localStorage.setItem('deadend_device_id', id); }
  return id;
}
const DEVICE_ID = getDeviceId();

// Local "accounts" store — MVP auth, no backend.
function getAccounts() {
  const accounts = safeGet('deadend_accounts', null);
  if (accounts && accounts.length) return accounts;
  // Migrate any pre-existing single-user profile into the first account.
  const existingUser = safeGet('deadend_user', null);
  const seedAccount = existingUser ? { ...MOCK_USER, ...existingUser } : MOCK_USER;
  const seeded = [seedAccount];
  safeSet('deadend_accounts', seeded);
  return seeded;
}

export function TripProvider({ children }) {
  const [accounts, setAccounts] = useState(() => FIREBASE_ENABLED ? [] : getAccounts());
  const [user, setUser] = useState(() => {
    if (FIREBASE_ENABLED) return null; // restored async via onAuthChange below
    const accs = getAccounts();
    let sessionId = safeGet('deadend_session', null);
    if (!sessionId && safeGet('deadend_user', null)) {
      // Migrate: existing single-user session stays logged in.
      sessionId = accs[0].id;
      safeSet('deadend_session', sessionId);
    }
    if (!sessionId) return null;
    return accs.find(a => a.id === sessionId) || null;
  });
  // While true, the auth state is still being restored from Firebase — don't redirect to /login yet.
  const [authLoading, setAuthLoading] = useState(() => FIREBASE_ENABLED);
  const [activeTrip, setActiveTrip] = useState(() => safeGet('deadend_trip', null));
  const [isAdmin, setIsAdmin] = useState(() => safeGet('deadend_admin_session', false));
  const [notifications, setNotifications] = useState([]);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const sosLock = useRef(false);
  const stopLock = useRef(false);
  const startLock = useRef(false);
  const lastSosTime = useRef(0);
  const watchId = useRef(null);
  const pendingSync = useRef([]);
  const etaTimerRef = useRef(null);
  const etaAlertedRef = useRef({ thirtyMin: false, oneHour: false });
  const nightRiskAlertedRef = useRef(false);
  const autoSosFiredRef = useRef(false);
  const currentCoordsRef = useRef(null);
  const gpsFirebaseTimer = useRef(null);
  const lastGpsCoordsRef = useRef(null);
  const lastSosResponseStep = useRef(null);
  const activeTripRef = useRef(activeTrip);
  useEffect(() => { activeTripRef.current = activeTrip; }, [activeTrip]);

  useEffect(() => {
    if (etaTimerRef.current) clearInterval(etaTimerRef.current);
    const isTrackable = activeTrip && (activeTrip.status === 'active' || activeTrip.status === 'overdue');
    if (!isTrackable || !activeTrip.expectedReturn) return;

    etaAlertedRef.current = { thirtyMin: false, oneHour: false };
    nightRiskAlertedRef.current = false;
    autoSosFiredRef.current = false;

    function getDeadline() {
      if (activeTrip.expectedReturnAt) return new Date(activeTrip.expectedReturnAt);
      const [h, m] = activeTrip.expectedReturn.split(':').map(Number);
      const d = new Date(); d.setHours(h, m, 0, 0);
      return d;
    }

    function checkTime() {
      const now = new Date();

      if (activeTrip.status === 'active') {
        // Night risk — 40 min before sunset (≈20:40 Mangystau)
        const sunset = new Date(); sunset.setHours(20, 40, 0, 0);
        const minsToSunset = Math.round((sunset - now) / 60000);
        if (minsToSunset <= 40 && minsToSunset > 0 && !nightRiskAlertedRef.current) {
          nightRiskAlertedRef.current = true;
          addNotification(`🌙 Ескерту! ${minsToSunset} минуттан кейін қараңғы түседі. Температура +9°C-ге дейін төмендейді.`, 'info');
        }

        const diffMin = Math.round((getDeadline() - now) / 60000);

        // 30-min warning
        if (diffMin <= 30 && diffMin > 0 && !etaAlertedRef.current.thirtyMin) {
          etaAlertedRef.current.thirtyMin = true;
          addNotification(`⏰ ${activeTrip.placeName} — қайтуға ${diffMin} минут қалды!`, 'info');
        }

        // Deadline passed — go overdue, starts the auto-SOS grace period
        if (diffMin <= 0 && !etaAlertedRef.current.oneHour) {
          etaAlertedRef.current.oneHour = true;
          addNotification(`🚨 ${activeTrip.placeName} — қайту уақыты өтті! "Қайттым" батырмасын баспасаңыз, ${SOS_GRACE_MINUTES} минуттан кейін SOS автоматты жіберіледі.`, 'danger');
          setActiveTrip(prev => prev && prev.status === 'active' ? { ...prev, status: 'overdue', overdueAt: new Date().toISOString() } : prev);
        }
        return;
      }

      // status === 'overdue' — no check-in within the grace period → auto-SOS
      if (autoSosFiredRef.current || !activeTrip.overdueAt) return;
      const overdueAt = new Date(activeTrip.overdueAt);
      const graceMin = (now - overdueAt) / 60000;
      if (graceMin >= SOS_GRACE_MINUTES) {
        autoSosFiredRef.current = true;
        const sosCoords = currentCoordsRef.current || { lat: 43.65, lng: 51.17 };
        const sosTime = new Date().toISOString();
        addNotification('🆘 Уақыт бітті, жауап болмады — SOS автоматты түрде жіберілді!', 'danger');
        updateTourist(DEVICE_ID, {
          status: 'sos',
          sosTime,
          lastSignal: new Date().toTimeString().slice(0, 5),
          coords: sosCoords,
          autoSOS: true,
        });
        setActiveTrip(prev => prev && prev.status === 'overdue'
          ? { ...prev, status: 'sos', sosTime, sosCoords, sosCount: (prev.sosCount || 0) + 1, autoSOS: true }
          : prev);
      }
    }

    // Check immediately on mount (catches already-overdue/-late trips on page reload)
    checkTime();
    etaTimerRef.current = setInterval(checkTime, 60000);

    return () => clearInterval(etaTimerRef.current);
  }, [activeTrip?.id, activeTrip?.expectedReturn, activeTrip?.expectedReturnAt, activeTrip?.status, activeTrip?.overdueAt]);

  // Restore session from Firebase Auth on load, and react to login/logout elsewhere.
  useEffect(() => {
    if (!FIREBASE_ENABLED) return;
    const unsub = onAuthChange(async (fbUser) => {
      if (fbUser) {
        const profile = await loadUserProfile(fbUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); syncPendingData(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Listen for MChS SOS response via Firebase
  useEffect(() => {
    const SOS_MSGS = {
      accepted: '✅ МЧС принял ваш SOS! Обрабатывают вызов.',
      enroute:  '🚗 МЧС выехали! Оставайтесь на месте.',
      search:   '🔍 Спасатели ищут вас. Не двигайтесь.',
      found:    '🎉 Спасатели рядом! Помощь уже идёт.',
      resolved: '✅ Операция МЧС закрыта. Вы в безопасности.',
    };
    const unsub = listenSOSResponse(DEVICE_ID, (resp) => {
      if (resp.step && resp.step !== lastSosResponseStep.current) {
        lastSosResponseStep.current = resp.step;
        // Skip showing a notification for a leftover response from a past trip
        if (activeTripRef.current) {
          addNotification(SOS_MSGS[resp.step] || '✅ МЧС ответил на ваш SOS!', 'success');
          if (resp.step === 'resolved') {
            setActiveTrip(prev => prev ? { ...prev, status: 'active' } : prev);
          }
        }
      }
      // Consume it so it doesn't replay as a stale notification on next page load
      clearSOSResponse(DEVICE_ID);
    });
    return unsub;
  }, []);

  // Синхронизация между вкладками
  useEffect(() => {
    const SOS_MSGS = {
      accepted: '✅ Ваш SOS принят! МЧС обрабатывают вызов.',
      enroute:  '🚗 МЧС выехали! Оставайтесь на месте.',
      search:   '🔍 Спасатели ищут вас. Не двигайтесь.',
      found:    '🎉 Спасатели рядом! Помощь уже идёт.',
      resolved: '✅ Операция МЧС закрыта. Вы в безопасности.',
    };

    const onStorage = (e) => {
      if (e.key === 'deadend_trip') {
        const updated = e.newValue ? JSON.parse(e.newValue) : null;
        setActiveTrip(updated);
      }
      if (e.key === 'deadend_user') {
        const updated = e.newValue ? JSON.parse(e.newValue) : null;
        if (updated) setUser(updated);
      }
      if (e.key === 'deadend_sos_accepted') {
        const resp = e.newValue ? JSON.parse(e.newValue) : null;
        if (resp && resp.deviceId === DEVICE_ID) {
          addNotification(SOS_MSGS[resp.step] || '✅ Ваш SOS принят МЧС!', 'success');
          if (resp.step === 'resolved') setActiveTrip(prev => prev ? { ...prev, status: 'active' } : prev);
        }
      }
    };

    const onSosUpdate = (e) => {
      if (e.detail?.deviceId !== DEVICE_ID) return;
      const step = e.detail?.step;
      addNotification(SOS_MSGS[step] || '✅ Ваш SOS принят МЧС!', 'success');
      if (step === 'resolved') setActiveTrip(prev => prev ? { ...prev, status: 'active' } : prev);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('deadend_sos_update', onSosUpdate);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('deadend_sos_update', onSosUpdate);
    };
  }, []);

  useEffect(() => {
    if (!activeTrip || activeTrip.status === 'completed') {
      if (watchId.current) {
        navigator.geolocation?.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }
    if (!navigator.geolocation) return;

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        currentCoordsRef.current = coords;
        setCurrentCoords(coords);
        if (!navigator.onLine) {
          pendingSync.current.push({ type: 'coords', coords, time: Date.now() });
          safeSet('deadend_pending', pendingSync.current);
        }
        // Debounced GPS push to Firebase (max once per 15s)
        if (!gpsFirebaseTimer.current) {
          gpsFirebaseTimer.current = setTimeout(() => {
            gpsFirebaseTimer.current = null;
            updateTourist(DEVICE_ID, { coords, lastSignal: new Date().toTimeString().slice(0, 5) });
          }, 15000);
        }
        // Accumulate real traveled distance from GPS deltas (filter out noise/jumps)
        const last = lastGpsCoordsRef.current;
        if (last) {
          const delta = getDistanceKm(last.lat, last.lng, coords.lat, coords.lng);
          if (delta > 0.01 && delta < 5) {
            setActiveTrip(prev => prev ? { ...prev, traveledKm: (prev.traveledKm || 0) + delta } : prev);
          }
        }
        lastGpsCoordsRef.current = coords;
        checkCheckpointProximity(coords);
      },
      (err) => { console.warn('GPS error:', err.code); },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => {
      if (watchId.current) {
        navigator.geolocation?.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [activeTrip?.id, activeTrip?.status]);

  function checkCheckpointProximity(coords) {
    setActiveTrip(prev => {
      if (!prev) return prev;
      const checkpoints = prev.checkpoints || [];
      const nextIdx = checkpoints.findIndex(cp => cp.status === 'pending');
      if (nextIdx < 0) return prev;
      const cp = checkpoints[nextIdx];
      if (!cp.coords) return prev;
      const dist = getDistanceKm(coords.lat, coords.lng, cp.coords.lat, cp.coords.lng);
      if (dist < 2) {
        addNotification(`📍 ${cp.name} чекпоинтіне жеттіңіз! ✅`, 'success');
        return {
          ...prev,
          checkpoints: checkpoints.map((c, i) =>
            i === nextIdx ? { ...c, status: 'done', arrivedAt: new Date().toISOString() } : c
          ),
        };
      }
      if (prev.expectedReturn) {
        const now = new Date();
        const returnTime = new Date();
        const [h, m] = prev.expectedReturn.split(':');
        returnTime.setHours(parseInt(h), parseInt(m), 0);
        if (now > returnTime && prev.status === 'active') {
          addNotification(`⚠️ Қайту уақыты өтті! Контактілерге хабар жіберілді.`, 'danger');
        }
      }
      return prev;
    });
  }

  function syncPendingData() {
    const pending = safeGet('deadend_pending', []);
    if (pending.length > 0) {
      addNotification(`🔄 ${pending.length} офлайн оқиға синхронизацияланды`, 'success');
      safeRemove('deadend_pending');
      pendingSync.current = [];
    }
  }

  function getDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  useEffect(() => {
    if (user) safeSet('deadend_user', user);
    else safeRemove('deadend_user');
  }, [user]);
  useEffect(() => { safeSet('deadend_accounts', accounts); }, [accounts]);
  useEffect(() => {
    if (activeTrip) safeSet('deadend_trip', activeTrip);
    else safeRemove('deadend_trip');
  }, [activeTrip]);

  async function registerUser({ firstName, lastName, email, password }) {
    const normEmail = email.trim().toLowerCase();

    if (FIREBASE_ENABLED) {
      const result = await firebaseRegister(normEmail, password);
      if (!result.success) return result;
      const newAccount = {
        id: result.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        gender: '',
        dob: '',
        bloodType: 'O+',
        height: null,
        weight: null,
        country: 'Kazakhstan',
        phone: '',
        allergies: '',
        specialMarks: '',
        photo: `https://i.pravatar.cc/150?u=${encodeURIComponent(normEmail)}`,
        contacts: [],
        pin: String(Math.floor(100000 + Math.random() * 900000)),
        role: 'tourist',
        tripsCompleted: 0,
        totalKm: 0,
      };
      await saveUserProfile(result.uid, newAccount);
      await savePinIndex(newAccount.pin, result.uid);
      setUser(newAccount);
      return { success: true };
    }

    if (accounts.some(a => a.email.trim().toLowerCase() === normEmail)) {
      return { success: false, error: 'exists' };
    }
    const newAccount = {
      id: 'user-' + Date.now(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      gender: '',
      dob: '',
      bloodType: 'O+',
      height: null,
      weight: null,
      country: 'Kazakhstan',
      phone: '',
      allergies: '',
      specialMarks: '',
      photo: `https://i.pravatar.cc/150?u=${encodeURIComponent(normEmail)}`,
      contacts: [],
      pin: String(Math.floor(100000 + Math.random() * 900000)),
      role: 'tourist',
      tripsCompleted: 0,
      totalKm: 0,
    };
    setAccounts(prev => [...prev, newAccount]);
    safeSet('deadend_session', newAccount.id);
    setUser(newAccount);
    return { success: true };
  }

  async function loginUser({ email, password }) {
    const normEmail = email.trim().toLowerCase();

    if (FIREBASE_ENABLED) {
      const result = await firebaseLogin(normEmail, password);
      if (!result.success) return result;
      const profile = await loadUserProfile(result.uid);
      if (!profile) return { success: false, error: 'invalid' };
      setUser(profile);
      return { success: true };
    }

    const found = accounts.find(a => a.email.trim().toLowerCase() === normEmail && a.password === password);
    if (!found) return { success: false, error: 'invalid' };
    safeSet('deadend_session', found.id);
    setUser(found);
    return { success: true };
  }

  function logoutUser() {
    if (FIREBASE_ENABLED) firebaseLogout();
    safeRemove('deadend_session');
    setUser(null);
  }

  // PinLogin: find an account by its emergency PIN without needing to be signed in.
  async function findAccountByPin(pin) {
    if (FIREBASE_ENABLED) return findUserByPin(pin);
    return accounts.find(a => String(a.pin) === pin) || null;
  }

  function login(credentials) {
    if (
      credentials.login === ADMIN_CREDENTIALS.login &&
      credentials.password === ADMIN_CREDENTIALS.password
    ) {
      safeSet('deadend_admin_session', true);
      setIsAdmin(true);
      return true;
    }
    return false;
  }

  function logout() {
    safeRemove('deadend_admin_session');
    setIsAdmin(false);
  }

  function startTrip(place, config) {
    if (startLock.current) return null;
    startLock.current = true;
    setTimeout(() => { startLock.current = false; }, 3000);

    const returnDate = config.returnDate || new Date().toISOString().slice(0, 10);
    const returnTime = config.returnTime || '18:00';
    const expectedReturnAt = new Date(`${returnDate}T${returnTime}:00`).toISOString();

    const trip = {
      id: Date.now(),
      placeId: place.id,
      placeName: place.name,
      startTime: new Date().toISOString(),
      expectedReturn: returnTime,
      expectedReturnDate: returnDate,
      expectedReturnAt,
      clothing: config.clothing || '',
      contacts: config.contacts || user.contacts || [],
      vehicle: config.vehicle || '',
      plate: config.plate || '',
      groupType: config.groupType || 'solo',
      groupMembers: config.groupMembers || [],
      checkpoints: (place.checkpoints || []).map(cp => ({ ...cp, status: 'pending', arrivedAt: null })),
      status: 'active',
      pin: user.pin,
      sosCount: 0,
      placeDistance: place.distance || 0,
      traveledKm: 0,
    };
    lastGpsCoordsRef.current = null;
    setActiveTrip(trip);

    // Sync to Firebase so AdminPanel sees this tourist in real-time
    syncTourist(DEVICE_ID, {
      deviceId: DEVICE_ID,
      id: DEVICE_ID,
      name: `${user.firstName} ${user.lastName}`.trim() || 'Tourist',
      photo: user.photo || `https://i.pravatar.cc/150?u=${DEVICE_ID}`,
      phone: user.phone || '',
      destination: place.name,
      status: 'active',
      startTime: new Date().toTimeString().slice(0, 5),
      expectedReturn: returnTime,
      expectedReturnDate: returnDate,
      expectedReturnAt,
      lastSignal: new Date().toTimeString().slice(0, 5),
      clothing: config.clothing || '',
      vehicle: config.vehicle || '',
      plate: config.plate || '',
      coords: currentCoords || place.coords || { lat: 43.65, lng: 51.17 },
      checkpointsDone: 0,
      checkpointsTotal: (place.checkpoints || []).length,
      emergencyContact: (config.contacts || [])[0] || { name: '—', phone: '—' },
      bloodType: user.bloodType || '',
      height: user.height || null,
      weight: user.weight || null,
      allergies: user.allergies || '',
      specialMarks: user.specialMarks || '',
    });

    addNotification('Сапар басталды! Контактілерге хабар жіберілді. ✅', 'success');
    return trip;
  }

  function stopTrip() {
    if (stopLock.current) return;
    stopLock.current = true;
    if (activeTrip) {
      const traveledKm = Math.round((activeTrip.traveledKm || 0) * 10) / 10;
      setUser(prev => {
        const count = (prev.tripsCompleted || 0) + 1;
        const totalKm = (prev.totalKm || 0) + traveledKm;
        const badges = { 5: '🥉 Bronze Explorer', 10: '🥈 Silver Explorer', 20: '🥇 Gold Explorer' };
        if (badges[count]) {
          setTimeout(() => addNotification(`${badges[count]} статусын алдыңыз! 🎉`, 'success'), 1500);
        }
        if (FIREBASE_ENABLED) updateUserProfile(prev.id, { tripsCompleted: count, totalKm });
        return { ...prev, tripsCompleted: count, totalKm };
      });
      addNotification('Сапар аяқталды. Қауіпсіз оралдыңыз! ✅', 'success');
      archiveTrip(DEVICE_ID, {
        placeId: activeTrip.placeId,
        placeName: activeTrip.placeName,
        groupType: activeTrip.groupType || 'solo',
        vehicle: activeTrip.vehicle || '',
        distance: traveledKm,
        plannedDistance: activeTrip.placeDistance || 0,
        startTime: activeTrip.startTime,
        endTime: new Date().toISOString(),
        hadSOS: (activeTrip.sosCount || 0) > 0 || activeTrip.status === 'sos',
        autoSOS: !!activeTrip.autoSOS,
        finalStatus: activeTrip.status,
      });
      removeTourist(DEVICE_ID);
      setActiveTrip(null);
      setCurrentCoords(null);
    }
    setTimeout(() => { stopLock.current = false; }, 2000);
  }

  function triggerSOS(coords) {
    const now = Date.now();
    if (sosLock.current) { addNotification('SOS жіберілуде... Күте тұрыңыз.', 'info'); return; }
    const timeSinceLast = now - lastSosTime.current;
    if (timeSinceLast < 30000 && lastSosTime.current > 0) {
      const remaining = Math.ceil((30000 - timeSinceLast) / 1000);
      addNotification(`SOS ${remaining} секундтан кейін қайта жіберуге болады.`, 'info');
      return;
    }
    sosLock.current = true;
    lastSosTime.current = now;
    if (!activeTrip) { sosLock.current = false; return; }

    const sosCoords = coords || currentCoords || { lat: 43.65, lng: 51.17 };
    setActiveTrip(prev => {
      if (!prev) return prev;
      return { ...prev, status: 'sos', sosTime: new Date().toISOString(), sosCoords, sosCount: (prev.sosCount || 0) + 1 };
    });

    // Firebase: mark tourist as SOS instantly
    updateTourist(DEVICE_ID, {
      status: 'sos',
      sosTime: new Date().toISOString(),
      lastSignal: new Date().toTimeString().slice(0, 5),
      coords: sosCoords,
    });

    addNotification('🆘 SOS жіберілді! МЧС хабардар етілді.', 'danger');
    setTimeout(() => { sosLock.current = false; }, 30000);
  }

  function updateCheckpoint(checkpointId) {
    if (!activeTrip) return;
    setActiveTrip(prev => {
      if (!prev) return prev;
      const cp = prev.checkpoints?.find(c => c.id === checkpointId);
      if (cp?.status === 'done') return prev;
      return {
        ...prev,
        checkpoints: (prev.checkpoints || []).map(c =>
          c.id === checkpointId ? { ...c, status: 'done', arrivedAt: new Date().toISOString() } : c
        ),
      };
    });
  }

  function addNotification(message, type = 'info') {
    setNotifications(prev => {
      const exists = prev.find(n => n.message === message);
      if (exists) return prev;
      const n = { id: Date.now(), message, type };
      setTimeout(() => setNotifications(p => p.filter(x => x.id !== n.id)), 4000);
      return [n, ...prev];
    });
  }

  function updateUser(updates) {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      if (FIREBASE_ENABLED) updateUserProfile(updated.id, updates);
      else setAccounts(accs => accs.map(a => a.id === updated.id ? updated : a));
      return updated;
    });
  }

  return (
    <TripContext.Provider value={{
      user, updateUser, login, logout, isAdmin,
      accounts, isAuthenticated: !!user, authLoading, registerUser, loginUser, logoutUser, findAccountByPin,
      activeTrip, startTrip, stopTrip, triggerSOS, updateCheckpoint,
      notifications, addNotification,
      currentCoords, isOnline,
    }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be inside TripProvider');
  return ctx;
}
