// Real road routing via OSRM (Open Source Routing Machine) demo server.
// No API key. Returns a road-following polyline + real turn-by-turn steps.

const OSRM = 'https://router.project-osrm.org/route/v1/driving';

const ICONS = {
  turn_left: '↰', turn_right: '↱', turn_slight_left: '↰', turn_slight_right: '↱',
  turn_sharp_left: '↰', turn_sharp_right: '↱', uturn: '⮌',
  straight: '⬆', continue: '⬆', merge: '⬆', 'on ramp': '⬈', 'off ramp': '⬊',
  fork: '⬆', roundabout: '↻', rotary: '↻', depart: '⬆', arrive: '🏁',
};

function iconFor(maneuver) {
  const t = maneuver?.type || '';
  const m = maneuver?.modifier || '';
  if (t === 'turn' || t === 'end of road' || t === 'new name') {
    if (m.includes('left')) return '↰';
    if (m.includes('right')) return '↱';
    if (m === 'uturn') return '⮌';
    return '⬆';
  }
  return ICONS[t] || '⬆';
}

function textFor(step) {
  const m = step.maneuver || {};
  const road = step.name && step.name.trim() ? step.name : 'the road';
  const mod = m.modifier ? m.modifier.replace(/(^|\s)\w/g, c => c.toUpperCase()) : '';
  switch (m.type) {
    case 'depart':   return `Head out on ${road}`;
    case 'arrive':   return `Arrive at destination`;
    case 'turn':     return `Turn ${mod || ''} onto ${road}`.replace('  ', ' ');
    case 'merge':    return `Merge onto ${road}`;
    case 'on ramp':  return `Take the ramp onto ${road}`;
    case 'off ramp': return `Take exit toward ${road}`;
    case 'fork':     return `Keep ${mod || 'ahead'} at the fork`;
    case 'roundabout':
    case 'rotary':   return `At the roundabout, take exit onto ${road}`;
    case 'end of road': return `Turn ${mod || ''} at the end onto ${road}`.replace('  ', ' ');
    case 'continue': return `Continue on ${road}`;
    case 'new name': return `Continue onto ${road}`;
    default:         return `Continue on ${road}`;
  }
}

function fmtDist(m) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

// origin/dest: { latitude, longitude }
export async function fetchRoute(origin, dest) {
  const url =
    `${OSRM}/${origin.longitude},${origin.latitude};${dest.longitude},${dest.latitude}` +
    `?overview=full&geometries=geojson&steps=true`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let json;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'RoadSOS/1.0 (emergency-response app)' },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    json = await res.json();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }

  const route = json?.routes?.[0];
  if (!route) throw new Error('No route found');

  // GeoJSON coordinates are [lon, lat]
  const coords = (route.geometry?.coordinates || []).map(([lon, lat]) => ({
    latitude: lat, longitude: lon,
  }));

  const rawSteps = route.legs?.[0]?.steps || [];
  const steps = rawSteps
    .filter(s => s.maneuver?.type !== 'arrive' || rawSteps.length === 1)
    .map(s => ({ icon: iconFor(s.maneuver), text: textFor(s), dist: fmtDist(s.distance) }));
  // Always end with an arrival step
  steps.push({ icon: '🏁', text: 'Arrive at destination', dist: 'Arrived' });

  return {
    coords,
    steps,
    distanceKm: route.distance / 1000,
    durationMin: Math.max(1, Math.round(route.duration / 60)),
  };
}
