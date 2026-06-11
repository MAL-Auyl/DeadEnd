// Network Information API helpers — used to detect a weak/2G connection so
// SOS and GPS sync can fall back to smaller, less frequent payloads.

function getConnection() {
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

export function getConnectionType() {
  return getConnection()?.effectiveType || null;
}

export function isSlowConnection() {
  const c = getConnection();
  if (!c) return false;
  return !!c.saveData || c.effectiveType === '2g' || c.effectiveType === 'slow-2g';
}
