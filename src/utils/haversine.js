// Haversine formula — offline distance calculation between GPS coordinates
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * (Math.PI / 180); }

export function getNearestServices(userLat, userLon, services, type = 'all', limit = 10) {
  return services
    .filter(s => type === 'all' || s.type === type)
    .map(s => ({ ...s, distance: parseFloat(haversineDistance(userLat, userLon, s.lat, s.lon).toFixed(1)) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export function estimateETA(distanceKm, speedKmh = 40) {
  const minutes = Math.round((distanceKm / speedKmh) * 60);
  if (minutes < 1) return '< 1 min';
  return `${minutes} min`;
}

export function buildSMSPayload(lat, lon, incidentType, severity) {
  // SMS-Bridge format for zero-data emergency
  return `[SOS][Lat:${lat.toFixed(4)}][Lon:${lon.toFixed(4)}][Type:${incidentType}][Sev:${severity}][v:RoadSOS1.0]`;
}
