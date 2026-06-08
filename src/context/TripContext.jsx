import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { MOCK_USER } from '../data/places';

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

  // ── Online/offline detection ──
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ── GPS watchPosition — үздіксіз жаңару ──
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

        // Офлайн болса — pending queue-ға қос
        if (!navigator.onLine) {
          pendingSync.current.push({ type: 'coords', coords, time: Date.now() });
          safeSet('deadend_pending', pendingSync.current);
        }

        // Чекпоинт жетті ме тексер
        checkCheckpointProximity(coords);
      },
      (err) => {
        console.warn('GPS error:', err.code);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => {
      if (watchId.current) {
        navigator.geolocation?.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [activeTrip?.id, activeTrip?.status]);

  // ── Автоматты чекпоинт proximity тексеру ──
  function checkCheckpointProximity(coords) {
    setActiveTrip(prev => {
      if (!prev) return prev;
      const checkpoints = prev.checkpoints || [];
      const nextIdx = checkpoints.findIndex(cp => cp.status === 'pending');
      if (nextIdx < 0) return prev;

      const cp = checkpoints[nextIdx];
      if (!cp.coords) return prev;

      const dist = getDistanceKm(coords.lat, coords.lng, cp.coords.lat, cp.coords.lng);

      // 2 км радиуста болса — автоматты "arrived"
      if (dist < 2) {
        addNotification(`📍 ${cp.name} чекпоинтіне жеттіңіз! ✅`, 'success');
        return {
          ...prev,
          checkpoints: checkpoints.map((c, i) =>
            i === nextIdx ? { ...c, status: 'done', arrivedAt: new Date().toISOString() } : c
          ),
        };
      }

      // Чекпоинтке жету уақыты өтіп кетсе — алерт
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

  // ── Офлайн деректерді синхронизациялау ──
  function syncPendingData() {
    const pending = safeGet('deadend_pending', []);
    if (pending.length > 0) {
      addNotification(`🔄 ${pending.length} офлайн оқиға синхронизацияланды`, 'success');
      safeRemove('deadend_pending');
      pendingSync.current = [];
    }
  }

  // ── Координаттар арасындағы қашықтық (Haversine) ──
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
      user, updateUser,
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

  // Refs для защиты от race conditions
  const sosLock = useRef(false);
  const stopLock = useRef(false);
  const startLock = useRef(false);
  const lastSosTime = useRef(0);

  useEffect(() => { safeSet('deadend_user', user); }, [user]);
  useEffect(() => {
    if (activeTrip) safeSet('deadend_trip', activeTrip);
    else safeRemove('deadend_trip');
  }, [activeTrip]);

  function startTrip(place, config) {
    // Защита от двойного нажатия
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
      checkpoints: (place.checkpoints || []).map(cp => ({
        ...cp, status: 'pending', arrivedAt: null,
      })),
      status: 'active',
      pin: user.pin,
      sosCount: 0,
    };
    setActiveTrip(trip);
    addNotification('Сапар басталды! Контактілерге хабар жіберілді. ✅', 'success');
    return trip;
  }

  function stopTrip() {
    // Защита от двойного нажатия
    if (stopLock.current) return;
    stopLock.current = true;

    if (activeTrip) {
      addNotification('Сапар аяқталды. Қауіпсіз оралдыңыз! ✅', 'success');
      setActiveTrip(null);
    }

    // Разблокировать через 2 сек
    setTimeout(() => { stopLock.current = false; }, 2000);
  }

  function triggerSOS(coords) {
    const now = Date.now();

    // 1. Если уже идёт SOS — игнорируем
    if (sosLock.current) {
      addNotification('SOS жіберілуде... Күте тұрыңыз.', 'info');
      return;
    }

    // 2. Cooldown 30 секунд между SOS
    const timeSinceLast = now - lastSosTime.current;
    if (timeSinceLast < 30000 && lastSosTime.current > 0) {
      const remaining = Math.ceil((30000 - timeSinceLast) / 1000);
      addNotification(`SOS ${remaining} секундтан кейін қайта жіберуге болады.`, 'info');
      return;
    }

    // 3. Блокируем
    sosLock.current = true;
    lastSosTime.current = now;

    if (!activeTrip) {
      sosLock.current = false;
      return;
    }

    setActiveTrip(prev => {
      if (!prev) return prev;
      const sosCount = (prev.sosCount || 0) + 1;
      return {
        ...prev,
        status: 'sos',
        sosTime: new Date().toISOString(),
        sosCoords: coords,
        sosCount,
      };
    });

    addNotification('🆘 SOS жіберілді! МЧС хабардар етілді.', 'danger');

    // Разблокировать через 30 сек
    setTimeout(() => { sosLock.current = false; }, 30000);
  }

  function updateCheckpoint(checkpointId) {
    if (!activeTrip) return;
    setActiveTrip(prev => {
      if (!prev) return prev;
      // Проверяем что чекпоинт ещё не отмечен
      const cp = prev.checkpoints?.find(c => c.id === checkpointId);
      if (cp?.status === 'done') return prev;
      return {
        ...prev,
        checkpoints: (prev.checkpoints || []).map(c =>
          c.id === checkpointId
            ? { ...c, status: 'done', arrivedAt: new Date().toISOString() }
            : c
        ),
      };
    });
  }

  function addNotification(message, type = 'info') {
    // Не дублировать одинаковые уведомления
    setNotifications(prev => {
      const exists = prev.find(n => n.message === message);
      if (exists) return prev;
      const n = { id: Date.now(), message, type };
      setTimeout(() => setNotifications(p => p.filter(x => x.id !== n.id)), 4000);
      return [n, ...prev];
    });
  }

  function updateUser(updates) {
    setUser(prev => ({ ...prev, ...updates }));
  }

  return (
    <TripContext.Provider value={{
      user, updateUser,
      activeTrip, startTrip, stopTrip, triggerSOS, updateCheckpoint,
      notifications, addNotification,
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
