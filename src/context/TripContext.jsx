import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MOCK_USER, ADMIN_CREDENTIALS } from '../data/places';

const TripContext = createContext(null);

function safeGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function safeSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function safeRemove(key) { try { localStorage.removeItem(key); } catch {} }

export function TripProvider({ children }) {
  const [user, setUser] = useState(() => safeGet('deadend_user', MOCK_USER));
  const [activeTrip, setActiveTrip] = useState(() => safeGet('deadend_trip', null));
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

  useEffect(() => {
    if (etaTimerRef.current) clearInterval(etaTimerRef.current);
    if (!activeTrip || activeTrip.status !== 'active' || !activeTrip.expectedReturn) return;

    etaAlertedRef.current = { thirtyMin: false, oneHour: false };
    nightRiskAlertedRef.current = false;

    etaTimerRef.current = setInterval(() => {
      // Night Risk: warn 40 min before sunset (≈20:40 in Mangystau)
      const now = new Date();
      const sunset = new Date(); sunset.setHours(20, 40, 0, 0);
      const minsToSunset = Math.round((sunset - now) / 60000);
      if (minsToSunset <= 40 && minsToSunset > 0 && !nightRiskAlertedRef.current) {
        nightRiskAlertedRef.current = true;
        addNotification(`🌙 Ескерту! ${minsToSunset} минуттан кейін қараңғы түседі. Температура +9°C-ге дейін төмендейді.`, 'info');
      }

      const [h, m] = activeTrip.expectedReturn.split(':').map(Number);
      const returnTime = new Date();
      returnTime.setHours(h, m, 0, 0);
      const diffMs = returnTime - now;
      const diffMin = Math.round(diffMs / 60000);

      if (diffMin <= 30 && diffMin > 0 && !etaAlertedRef.current.thirtyMin) {
        etaAlertedRef.current.thirtyMin = true;
        addNotification(`⏰ ${activeTrip.placeName} — қайтуға ${diffMin} минут қалды!`, 'info');
      }

      if (diffMin <= 0 && diffMin > -30 && !etaAlertedRef.current.oneHour) {
        etaAlertedRef.current.oneHour = true;
        addNotification(`🚨 Қайту уақыты өтті! Контактілерге хабар жіберілді.`, 'danger');
        setActiveTrip(prev => prev ? { ...prev, status: 'overdue' } : prev);
      }
    }, 30000);

    return () => clearInterval(etaTimerRef.current);
  }, [activeTrip?.id, activeTrip?.expectedReturn, activeTrip?.status]);

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

  // Синхронизация между вкладками: когда турист нажимает SOS в одной вкладке,
  // вкладка админа сразу видит изменение через localStorage storage event
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'deadend_trip') {
        const updated = e.newValue ? JSON.parse(e.newValue) : null;
        setActiveTrip(updated);
      }
      if (e.key === 'deadend_user') {
        const updated = e.newValue ? JSON.parse(e.newValue) : null;
        if (updated) setUser(updated);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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
        setCurrentCoords(coords);
        if (!navigator.onLine) {
          pendingSync.current.push({ type: 'coords', coords, time: Date.now() });
          safeSet('deadend_pending', pendingSync.current);
        }
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

  useEffect(() => { safeSet('deadend_user', user); }, [user]);
  useEffect(() => {
    if (activeTrip) safeSet('deadend_trip', activeTrip);
    else safeRemove('deadend_trip');
  }, [activeTrip]);

  function login(credentials) {
    if (
      credentials.login === ADMIN_CREDENTIALS.login &&
      credentials.password === ADMIN_CREDENTIALS.password
    ) {
      setUser(prev => ({ ...prev, role: 'admin' }));
      return true;
    }
    return false;
  }

  function logout() {
    setUser(prev => ({ ...prev, role: 'tourist' }));
  }

  function startTrip(place, config) {
    if (startLock.current) return null;
    startLock.current = true;
    setTimeout(() => { startLock.current = false; }, 3000);

    const trip = {
      id: Date.now(),
      placeId: place.id,
      placeName: place.name,
      startTime: new Date().toISOString(),
      expectedReturn: config.returnTime || '18:00',
      clothing: config.clothing || '',
      contacts: config.contacts || user.contacts || [],
      vehicle: config.vehicle || '',
      groupType: config.groupType || 'solo',
      groupMembers: config.groupMembers || [],
      checkpoints: (place.checkpoints || []).map(cp => ({ ...cp, status: 'pending', arrivedAt: null })),
      status: 'active',
      pin: user.pin,
      sosCount: 0,
    };
    setActiveTrip(trip);
    addNotification('Сапар басталды! Контактілерге хабар жіберілді. ✅', 'success');
    return trip;
  }

  function stopTrip() {
    if (stopLock.current) return;
    stopLock.current = true;
    if (activeTrip) {
      setUser(prev => {
        const count = (prev.tripsCompleted || 0) + 1;
        const prev5 = prev.tripsCompleted || 0;
        const badges = { 5: '🥉 Bronze Explorer', 10: '🥈 Silver Explorer', 20: '🥇 Gold Explorer' };
        if (badges[count]) {
          setTimeout(() => addNotification(`${badges[count]} статусын алдыңыз! 🎉`, 'success'), 1500);
        }
        return { ...prev, tripsCompleted: count };
      });
      addNotification('Сапар аяқталды. Қауіпсіз оралдыңыз! ✅', 'success');
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

  function updateUser(updates) { setUser(prev => ({ ...prev, ...updates })); }

  return (
    <TripContext.Provider value={{
      user, updateUser, login, logout,
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
