import { useEffect, useRef } from 'react';

const ROUTE_POINT_STYLES = {
  photo: { emoji: '📸', bg: '#C9A055' },
  water: { emoji: '💧', bg: '#4CAF7D' },
  road: { emoji: '⚠️', bg: '#E89A3A' },
  animal: { emoji: '🐄', bg: '#E05252' },
};

function loc(obj, field, lang) {
  const key = lang === 'kz' ? field + 'Kz' : lang === 'ru' ? field + 'Ru' : field;
  return obj[key] || obj[field];
}

function liveIcon() {
  return window.L.divIcon({
    html: '<div style="background:#06D6A0;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(6,214,160,0.25)"></div>',
    iconSize: [18, 18], iconAnchor: [9, 9], className: '',
  });
}

function otherTouristIcon() {
  return window.L.divIcon({
    html: '<div style="background:#A78BFA;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:9px">🚶</div>',
    iconSize: [16, 16], iconAnchor: [8, 8], className: '',
  });
}

export default function MapView({ place, activeTrip, height = 260, lang = 'en', liveCoords = null, liveLabel = '', otherTourists = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const liveMarkerRef = useRef(null);
  const otherMarkersRef = useRef({});

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const tryInit = () => {
      if (!window.L) { setTimeout(tryInit, 300); return; }
      const L = window.L;
      const center = place?.coords || { lat: 43.65, lng: 51.17 };

      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: place ? 8 : 7,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
      mapInstance.current = map;

      const startIcon = L.divIcon({
        html: '<div style="background:#6C63FF;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7], className: '',
      });
      L.marker([43.65, 51.17], { icon: startIcon }).addTo(map).bindPopup('<b>Aktau</b><br>Start point');

      if (place?.coords) {
        const destIcon = L.divIcon({
          html: '<div style="background:#FF4757;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>',
          iconSize: [16, 16], iconAnchor: [8, 8], className: '',
        });
        L.marker([place.coords.lat, place.coords.lng], { icon: destIcon })
          .addTo(map).bindPopup(`<b>${place.name}</b><br>${place.distance} km`);

        if (place.checkpoints?.length) {
          place.checkpoints.forEach((cp, i) => {
            if (i === 0 || i === place.checkpoints.length - 1) return;
            const cpIcon = L.divIcon({
              html: '<div style="background:#F4A261;width:10px;height:10px;border-radius:50%;border:2px solid white"></div>',
              iconSize: [10, 10], iconAnchor: [5, 5], className: '',
            });
            L.marker([cp.coords.lat, cp.coords.lng], { icon: cpIcon }).addTo(map).bindPopup(`<b>${cp.name}</b><br>${cp.km} km`);
          });

          const pts = place.checkpoints.map(cp => [cp.coords.lat, cp.coords.lng]);
          L.polyline(pts, { color: '#6C63FF', weight: 3, opacity: 0.8, dashArray: '8 4' }).addTo(map);
          map.fitBounds(pts, { padding: [32, 32] });
        }

        if (place.routePoints?.length) {
          place.routePoints.forEach(rp => {
            const style = ROUTE_POINT_STYLES[rp.type] || ROUTE_POINT_STYLES.photo;
            const icon = L.divIcon({
              html: `<div style="background:${style.bg};width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:13px;line-height:1">${style.emoji}</span></div>`,
              iconSize: [26, 26], iconAnchor: [13, 26], className: '',
            });
            const title = loc(rp, 'title', lang);
            const desc = loc(rp, 'desc', lang);
            const km = rp.km != null ? ` · ${rp.km} km` : '';
            L.marker([rp.coords.lat, rp.coords.lng], { icon })
              .addTo(map)
              .bindPopup(`<b>${style.emoji} ${title}</b>${km}${desc ? `<br>${desc}` : ''}`);
          });
        }
      }

      if (activeTrip) {
        navigator.geolocation?.getCurrentPosition(pos => {
          if (!mapInstance.current) return;
          const userIcon = L.divIcon({
            html: '<div style="background:#06D6A0;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(6,214,160,0.3)"></div>',
            iconSize: [16, 16], iconAnchor: [8, 8], className: '',
          });
          L.marker([pos.coords.latitude, pos.coords.longitude], { icon: userIcon })
            .addTo(mapInstance.current).bindPopup('<b>You are here</b>');
        });
      }

      if (liveCoords) {
        liveMarkerRef.current = L.marker([liveCoords.lat, liveCoords.lng], { icon: liveIcon() })
          .addTo(map).bindPopup(liveLabel || 'Live');
        map.panTo([liveCoords.lat, liveCoords.lng]);
        map.setZoom(Math.max(map.getZoom(), 9));
      }
    };

    tryInit();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      liveMarkerRef.current = null;
      otherMarkersRef.current = {};
    };
  }, [place?.id, lang]);

  // Live position updates — move the marker instead of rebuilding the map
  useEffect(() => {
    if (!liveCoords || !mapInstance.current || !window.L) return;
    if (liveMarkerRef.current) {
      liveMarkerRef.current.setLatLng([liveCoords.lat, liveCoords.lng]);
    } else {
      liveMarkerRef.current = window.L.marker([liveCoords.lat, liveCoords.lng], { icon: liveIcon() })
        .addTo(mapInstance.current).bindPopup(liveLabel || 'Live');
    }
    mapInstance.current.panTo([liveCoords.lat, liveCoords.lng]);
  }, [liveCoords?.lat, liveCoords?.lng]);

  // Other tourists on the same route — add/move/remove markers without rebuilding the map
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    const map = mapInstance.current;
    const seen = new Set();
    otherTourists.forEach(ot => {
      if (!ot.coords || !ot.id) return;
      seen.add(ot.id);
      if (otherMarkersRef.current[ot.id]) {
        otherMarkersRef.current[ot.id].setLatLng([ot.coords.lat, ot.coords.lng]);
      } else {
        otherMarkersRef.current[ot.id] = window.L.marker([ot.coords.lat, ot.coords.lng], { icon: otherTouristIcon() })
          .addTo(map).bindPopup(ot.name || 'Tourist');
      }
    });
    Object.keys(otherMarkersRef.current).forEach(id => {
      if (!seen.has(id)) {
        otherMarkersRef.current[id].remove();
        delete otherMarkersRef.current[id];
      }
    });
  }, [otherTourists]);

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div ref={mapRef} style={{ height, width: '100%', background: '#1a1a2e' }} />
    </div>
  );
}
