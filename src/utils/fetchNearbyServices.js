// Live nearby-services fetch from OpenStreetMap (Overpass API).
// No API key needed. Returns services near the user's REAL GPS location,
// shaped to match what ServicesScreen expects.
import { haversineDistance, estimateETA } from './haversine';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

// Map our app categories -> OSM tag filters
const OSM_FILTERS = [
  { type: 'hospital', q: '["amenity"="hospital"]' },
  { type: 'hospital', q: '["amenity"="clinic"]' },
  { type: 'police',   q: '["amenity"="police"]' },
  { type: 'fire',     q: '["amenity"="fire_station"]' },
  { type: 'fuel',     q: '["amenity"="fuel"]' },
  { type: 'puncture', q: '["shop"="tyres"]' },
  { type: 'towing',   q: '["shop"="car_repair"]' },
];

const TRAUMA_HINT = /trauma|emergency|multi|super ?speciality|government|govt|general/i;

function buildQuery(lat, lon, radius) {
  const parts = OSM_FILTERS
    .map(f => `nwr${f.q}(around:${radius},${lat},${lon});`)
    .join('');
  // `out center` already includes tags; centre coords returned for ways/relations
  return `[out:json][timeout:25];(${parts});out center 120;`;
}

function classify(tags) {
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'hospital';
  if (tags.amenity === 'police') return 'police';
  if (tags.amenity === 'fire_station') return 'fire';
  if (tags.amenity === 'fuel') return 'fuel';
  if (tags.shop === 'tyres') return 'puncture';
  if (tags.shop === 'car_repair') return 'towing';
  return 'hospital';
}

const FALLBACK_NAME = {
  hospital: 'Hospital', police: 'Police Station', fire: 'Fire Station',
  fuel: 'Fuel Station', puncture: 'Tyre Shop', towing: 'Car Repair / Towing',
};

function buildAddress(tags) {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'] || tags['addr:neighbourhood'],
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Address from OpenStreetMap';
}

function mapElement(el, userLat, userLon) {
  const tags = el.tags || {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;

  const type = classify(tags);
  const distance = parseFloat(haversineDistance(userLat, userLon, lat, lon).toFixed(1));
  const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null;
  const open24h = tags.opening_hours === '24/7' || ['hospital', 'police', 'fire'].includes(type);

  const out = {
    id: `osm-${el.type}-${el.id}`,
    type,
    name: tags.name || tags['name:en'] || FALLBACK_NAME[type],
    address: buildAddress(tags),
    phone,
    open24h,
    lat, lon,
    distance,
    eta: estimateETA(distance),
  };

  if (type === 'hospital') {
    out.trauma = !!(tags.emergency === 'yes' || TRAUMA_HINT.test(out.name) || tags.healthcare === 'hospital');
    out.level = out.trauma ? 'L1' : 'L2';
    const specs = [];
    if (tags.healthcare_speciality) {
      tags.healthcare_speciality.split(';').forEach(s => specs.push(s.trim()));
    }
    if (out.trauma && !specs.length) specs.push('Trauma', 'Emergency');
    if (specs.length) out.specialties = specs.slice(0, 4);
  }
  return out;
}

async function runOverpass(query) {
  let lastErr;
  for (const url of ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Overpass returns 406 Not Acceptable without a User-Agent
          'User-Agent': 'RoadSOS/1.0 (emergency-response app)',
        },
        body: 'data=' + encodeURIComponent(query),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Overpass unreachable');
}

// Fetch real nearby services. Expands the radius until we find enough results.
export async function fetchNearbyServices(userLat, userLon) {
  const radii = [4000, 10000, 25000]; // metres
  for (const radius of radii) {
    const json = await runOverpass(buildQuery(userLat, userLon, radius));
    const elements = json?.elements || [];
    const mapped = elements
      .map(el => mapElement(el, userLat, userLon))
      .filter(Boolean)
      // de-dupe by name+type (OSM sometimes has node + way for same place)
      .filter((v, i, arr) => arr.findIndex(x => x.name === v.name && x.type === v.type) === i)
      .sort((a, b) => a.distance - b.distance);

    if (mapped.length >= 4 || radius === radii[radii.length - 1]) {
      return mapped.slice(0, 40);
    }
  }
  return [];
}
