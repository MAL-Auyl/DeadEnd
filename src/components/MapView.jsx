import { useEffect, useRef } from 'react';

export default function MapView({ place, activeTrip, height = 260 }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

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
    };

    tryInit();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [place?.id]);

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div ref={mapRef} style={{ height, width: '100%', background: '#1a1a2e' }} />
    </div>
  );
}
