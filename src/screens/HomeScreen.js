import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Dimensions, Platform, ActivityIndicator, Image, Linking, Vibration
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { fetchNearbyServices } from '../utils/fetchNearbyServices';
import { fetchRoute } from '../utils/fetchRoute';
import { haversineDistance } from '../utils/haversine';

const { width, height } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

// ── Real map via OpenStreetMap / CartoDB dark tiles (no API key, works in Expo Go) ──
const TILE = 256;
const ZOOM = 16;
function projectPx(lat, lon, z = ZOOM) {
  const n = Math.pow(2, z);
  const x = ((lon + 180) / 360) * n * TILE;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * TILE;
  return { x, y };
}

// Build a mock route + destination + blackspots RELATIVE to actual GPS position
function buildDynamicData(lat, lon) {
  const dest = { latitude: lat + 0.010, longitude: lon + 0.009 };
  const route = [
    { latitude: lat,           longitude: lon },
    { latitude: lat + 0.002,   longitude: lon + 0.001 },
    { latitude: lat + 0.004,   longitude: lon + 0.003 },
    { latitude: lat + 0.006,   longitude: lon + 0.005 },
    { latitude: lat + 0.008,   longitude: lon + 0.007 },
    { latitude: lat + 0.009,   longitude: lon + 0.008 },
    { latitude: dest.latitude, longitude: dest.longitude },
  ];
  const blackspots = [
    { id: 1, latitude: lat + 0.003, longitude: lon - 0.002, severity: 'high',   name: 'Junction Ahead', incidents: 14 },
    { id: 2, latitude: lat - 0.003, longitude: lon + 0.004, severity: 'medium', name: 'School Zone',     incidents: 7  },
    { id: 3, latitude: lat + 0.007, longitude: lon - 0.004, severity: 'high',   name: 'Blind Curve',    incidents: 22 },
  ];
  return { dest, route, blackspots };
}

const TURNS = [
  { icon: '↰', text: 'Turn left at next signal',     dist: '300m'  },
  { icon: '↱', text: 'Turn right after flyover',     dist: '0.8km' },
  { icon: '⬆', text: 'Continue straight',            dist: '0.5km' },
  { icon: '🏥', text: 'Destination on your right',   dist: 'Arrived'},
];

// ── Real live map: renders OSM/CartoDB dark tiles as images, centered on GPS ──
function TileMapView({ lat, lon, mapData }) {
  const pulse = useRef(new Animated.Value(0.8)).current;
  const pop   = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(pulse, { toValue: 2.6, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.8, duration: 0,    useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(pop, { toValue: 0,   duration: 1600, useNativeDriver: true }),
        Animated.timing(pop, { toValue: 0.7, duration: 0,    useNativeDriver: true }),
      ]),
    ])).start();
  }, []);

  const useLat = lat ?? 20.5937;
  const useLon = lon ?? 78.9629;
  const center = projectPx(useLat, useLon);
  const n = Math.pow(2, ZOOM);

  const cTileX = Math.floor(center.x / TILE);
  const cTileY = Math.floor(center.y / TILE);
  const hC = Math.ceil(width  / TILE / 2) + 1;
  const hR = Math.ceil(height / TILE / 2) + 1;

  const tiles = [];
  for (let dx = -hC; dx <= hC; dx++) {
    for (let dy = -hR; dy <= hR; dy++) {
      const tx = cTileX + dx, ty = cTileY + dy;
      if (tx < 0 || ty < 0 || tx >= n || ty >= n) continue;
      tiles.push(
        <Image
          key={`${tx}_${ty}`}
          source={{ uri: `https://a.basemaps.cartocdn.com/dark_all/${ZOOM}/${tx}/${ty}.png` }}
          style={{
            position: 'absolute',
            left: tx * TILE - center.x + width / 2,
            top:  ty * TILE - center.y + height / 2,
            width: TILE, height: TILE,
          }}
          fadeDuration={0}
        />
      );
    }
  }

  const toScreen = (p) => {
    const w = projectPx(p.latitude, p.longitude);
    return { x: w.x - center.x + width / 2, y: w.y - center.y + height / 2 };
  };

  const segs = [];
  if (mapData?.route) {
    for (let i = 0; i < mapData.route.length - 1; i++) {
      const a = toScreen(mapData.route[i]);
      const b = toScreen(mapData.route[i + 1]);
      const dxp = b.x - a.x, dyp = b.y - a.y;
      const len = Math.sqrt(dxp * dxp + dyp * dyp);
      segs.push({ cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, len, ang: Math.atan2(dyp, dxp) });
    }
  }

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0b1322', overflow: 'hidden' }]}>
      {tiles}

      {/* Route casing (dark, wide) */}
      {segs.map((sg, i) => (
        <View key={`c${i}`} style={{
          position: 'absolute', left: sg.cx - sg.len / 2 - 3, top: sg.cy - 8,
          width: sg.len + 6, height: 16, borderRadius: 8,
          backgroundColor: 'rgba(0,0,0,0.5)',
          transform: [{ rotateZ: `${sg.ang}rad` }],
        }} />
      ))}
      {/* Route line (blue) */}
      {segs.map((sg, i) => (
        <View key={`l${i}`} style={{
          position: 'absolute', left: sg.cx - sg.len / 2, top: sg.cy - 4,
          width: sg.len, height: 8, borderRadius: 4,
          backgroundColor: '#2E9BFF',
          transform: [{ rotateZ: `${sg.ang}rad` }],
        }} />
      ))}

      {/* Blackspots */}
      {(mapData?.blackspots || []).map(sp => {
        const p = toScreen(sp);
        return (
          <View key={sp.id} style={{ position: 'absolute', left: p.x - 24, top: p.y - 13 }}>
            <View style={[s.mapMarker, sp.severity === 'high' ? s.markerHigh : s.markerMed]}>
              <Text style={s.markerTxt}>⚠️ {sp.incidents}</Text>
            </View>
          </View>
        );
      })}

      {/* Destination */}
      {mapData?.dest && (() => {
        const p = toScreen(mapData.dest);
        return (
          <View style={{ position: 'absolute', left: p.x - 22, top: p.y - 58, alignItems: 'center' }}>
            <LinearGradient colors={['#FF1744', '#CC0022']} style={s.destCircle}>
              <Text style={{ fontSize: 18 }}>📍</Text>
            </LinearGradient>
            <View style={s.destStem} />
          </View>
        );
      })()}

      {/* User puck — fixed at screen center, with live pulse */}
      <View style={{ position: 'absolute', left: width / 2 - 30, top: height / 2 - 30, width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[s.userRing, { transform: [{ scale: pulse }], opacity: pop }]} />
        <View style={s.userDot} />
      </View>
    </View>
  );
}

// ── Loading screen while GPS acquires ─────────────────────────────
function GPSLoadingScreen() {
  const ring = useRef(new Animated.Value(0.6)).current;
  const op   = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(ring, { toValue: 2.0, duration: 1200, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 0.6, duration: 0,    useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(op, { toValue: 0,   duration: 1200, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.8, duration: 0,    useNativeDriver: true }),
      ]),
    ])).start();
  }, []);
  return (
    <LinearGradient colors={['#080C14','#0D1826']} style={s.loadScreen}>
      <View style={s.loadCenter}>
        <Animated.View style={[s.loadRing, { transform:[{scale:ring}], opacity:op }]} />
        <View style={s.loadDot}><Text style={{ fontSize: 30 }}>📡</Text></View>
      </View>
      <Text style={s.loadTitle}>Acquiring GPS</Text>
      <Text style={s.loadSub}>Getting your live location...</Text>
      <ActivityIndicator color="#4285F4" size="small" style={{ marginTop: 16 }} />
    </LinearGradient>
  );
}

export default function HomeScreen({ navigation }) {
  const [gpsReady, setGpsReady]  = useState(false);
  const [coords,   setCoords]    = useState(null);   // { latitude, longitude }
  const [mapData,  setMapData]   = useState(null);   // { dest, route, blackspots }
  const [speed,    setSpeed]     = useState(0);
  const [turnIdx,  setTurnIdx]   = useState(0);
  const [warnVis,  setWarnVis]   = useState(false);
  const [clock,    setClock]     = useState(new Date());
  const [place,    setPlace]     = useState(null);   // reverse-geocoded area name
  const [dest,     setDest]      = useState(null);   // destination service { name, lat, lon }
  const [nav,      setNav]       = useState(null);   // { steps, distanceKm, durationMin }
  const [navState, setNavState]  = useState('idle'); // idle | routing | active | failed
  const [weather,  setWeather]   = useState(null);   // { temp, icon, desc }

  const sosScale   = useRef(new Animated.Value(1)).current;
  const turnOp     = useRef(new Animated.Value(0)).current;
  const turnSlide  = useRef(new Animated.Value(-60)).current;
  const warnAnim   = useRef(new Animated.Value(0)).current;
  const locWatcher  = useRef(null);
  const destRef     = useRef(null);   // current destination (survives watcher closure)
  const lastRouteRef= useRef(null);   // {lat,lon} where we last computed the route
  const routingRef  = useRef(false);  // prevents overlapping route fetches

  // Build a REAL road route using OSRM. Finds nearest hospital once (Overpass),
  // then re-routes from the user's live position toward that same destination.
  const buildNavigation = async (lat, lon, keepDest) => {
    if (routingRef.current) return;
    routingRef.current = true;
    setNavState('routing');
    try {
      let target = keepDest || destRef.current;
      if (!target) {
        const services = await fetchNearbyServices(lat, lon);
        const hospital = (services || []).find(s => s.type === 'hospital') || (services || [])[0];
        if (!hospital) { setNavState('failed'); routingRef.current = false; return; }
        target = { name: hospital.name, lat: hospital.lat, lon: hospital.lon };
        destRef.current = target;
        setDest(target);
      }

      const r = await fetchRoute(
        { latitude: lat, longitude: lon },
        { latitude: target.lat, longitude: target.lon }
      );
      setNav({ steps: r.steps, distanceKm: r.distanceKm, durationMin: r.durationMin });
      setMapData(prev => ({
        ...(prev || {}),
        dest: { latitude: target.lat, longitude: target.lon, name: target.name },
        route: r.coords,
      }));
      lastRouteRef.current = { lat, lon };
      setTurnIdx(0);
      setNavState('active');
    } catch (e) {
      setNavState('failed');
    } finally {
      routingRef.current = false;
    }
  };

  useEffect(() => {
    const clockTimer = setInterval(() => setClock(new Date()), 30000);

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsReady(true); return; } // still show map

      // Get initial fix
      const init = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude, speed: spd } = init.coords;
      setCoords({ latitude, longitude });
      setMapData(buildDynamicData(latitude, longitude));
      setSpeed(Math.round((spd || 0) * 3.6));
      setGpsReady(true);

      // Reverse-geocode to prove it's the user's REAL location
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo && geo[0]) {
          const g = geo[0];
          setPlace([g.name || g.street, g.district || g.subregion || g.city, g.region]
            .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2).join(', '));
        }
      } catch (e) { /* geocoding best-effort */ }

      // Fetch current weather from open-meteo (free, no key)
      try {
        const wRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,wind_speed_10m&timezone=auto`
        );
        if (wRes.ok) {
          const wJson = await wRes.json();
          const code = wJson.current?.weathercode ?? -1;
          const temp = Math.round(wJson.current?.temperature_2m ?? 0);
          const wIcon =
            code === 0 ? '☀️' : code <= 3 ? '🌤️' : code <= 48 ? '🌫️' :
            code <= 67 ? '🌧️' : code <= 77 ? '❄️' : code <= 82 ? '🌦️' : '⛈️';
          const wDesc =
            code === 0 ? 'Clear' : code <= 3 ? 'Partly cloudy' : code <= 48 ? 'Foggy' :
            code <= 67 ? 'Rain' : code <= 77 ? 'Snow' : code <= 82 ? 'Showers' : 'Storm';
          setWeather({ temp, icon: wIcon, desc: wDesc, wind: Math.round(wJson.current?.wind_speed_10m ?? 0) });
        }
      } catch (e) { /* weather is non-critical */ }

      // Build a REAL route to the nearest hospital (live navigation)
      buildNavigation(latitude, longitude);

      // Live tracking — map follows you AND the route re-computes as you move
      locWatcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 10, timeInterval: 3000 },
        (loc) => {
          const { latitude: la, longitude: lo, speed: sp } = loc.coords;
          setCoords({ latitude: la, longitude: lo });   // TileMapView re-centers on this
          const kmh = Math.round((sp || 0) * 3.6);
          setSpeed(kmh);
          // Vibrate when over speed limit
          if (kmh > 80) Vibration.vibrate([0, 120, 80, 120]);

          // Re-route from new position toward the same destination once moved >150m
          const last = lastRouteRef.current;
          if (destRef.current && last && !routingRef.current) {
            if (haversineDistance(la, lo, last.lat, last.lon) > 0.15) {
              buildNavigation(la, lo, destRef.current);
            }
          }
        }
      );
    })();

    // SOS pulse
    Animated.loop(Animated.sequence([
      Animated.timing(sosScale, { toValue: 1.13, duration: 900, useNativeDriver: true }),
      Animated.timing(sosScale, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ])).start();

    // Turn card
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(turnSlide, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
        Animated.timing(turnOp,    { toValue: 1, duration: 400,            useNativeDriver: true }),
      ]).start();
    }, 500);

    const turnTimer = setInterval(() => {
      setTurnIdx(i => {
        Animated.sequence([
          Animated.timing(turnOp, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(turnOp, { toValue: 1, duration: 280, useNativeDriver: true }),
        ]).start();
        return i + 1;   // render applies % steps.length
      });
    }, 4500);

    setTimeout(() => {
      setWarnVis(true);
      Animated.timing(warnAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 4000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(turnTimer);
      if (locWatcher.current) locWatcher.current.remove();
    };
  }, []);

  if (!gpsReady) return <GPSLoadingScreen />;

  const steps = (nav?.steps && nav.steps.length) ? nav.steps : TURNS;
  const turn  = steps[turnIdx % steps.length];
  const nextTurn = steps[(turnIdx + 1) % steps.length];
  const spd  = speed;
  const speedColor = spd > 80 ? '#FF1744' : spd > 60 ? '#FFB300' : '#4EB3FF';

  return (
    <View style={s.container}>

      {/* MAP — real OSM dark tiles, no API key needed */}
      <TileMapView lat={coords?.latitude} lon={coords?.longitude} mapData={mapData} />

      {/* Night gradient — blends map into the HUD top & bottom for readability */}
      <LinearGradient
        colors={['rgba(8,12,20,0.78)', 'rgba(8,12,20,0)', 'rgba(8,12,20,0)', 'rgba(8,12,20,0.85)']}
        locations={[0, 0.28, 0.64, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* TOP HUD */}
      <SafeAreaView style={s.topHUD} pointerEvents="box-none">
        <Animated.View style={[s.turnCard, { opacity: turnOp, transform: [{ translateY: turnSlide }] }]}>
          <LinearGradient colors={['#1A2745','#0F1A35']} style={s.turnCardInner}>
            <View style={s.turnIconBox}><Text style={s.turnIconTxt}>{turn.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.turnDist}>{turn.dist}</Text>
              <Text style={s.turnInstr} numberOfLines={1}>{turn.text}</Text>
            </View>
            <View style={s.turnNext}>
              <Text style={s.turnNextLbl}>THEN</Text>
              <Text style={s.turnNextIcon}>{nextTurn.icon}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={s.statusBar}>
          <View style={s.statusLeft}>
            <View style={[s.badge, s.badgeLive]}>
              <View style={[s.badgeDot, { backgroundColor: '#00E676' }]} />
              <Text style={s.badgeTxt}>LIVE GPS</Text>
            </View>
            {coords && (
              <View style={[s.badge, s.badgeCoords]}>
                <Text style={s.badgeTxt} numberOfLines={1}>
                  {place ? `📍 ${place}` : `${coords.latitude.toFixed(3)}°  ${coords.longitude.toFixed(3)}°`}
                </Text>
              </View>
            )}
          </View>
          <Text style={s.clockTxt}>{clock.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</Text>
        </View>
      </SafeAreaView>

      {/* BLACKSPOT WARNING */}
      {warnVis && (
        <Animated.View style={[s.warnBanner, { opacity: warnAnim, transform:[{ translateY: warnAnim.interpolate({ inputRange:[0,1], outputRange:[-44,0] }) }] }]}>
          <LinearGradient colors={['#B71C1C','#E53935']} style={s.warnInner} start={{x:0,y:0}} end={{x:1,y:0}}>
            <Text style={{ fontSize: 22 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.warnTitle}>ACCIDENT BLACKSPOT — 400m ahead</Text>
              <Text style={s.warnSub}>High incident zone · Slow down to 40 km/h</Text>
            </View>
            <TouchableOpacity onPress={() => setWarnVis(false)} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
              <Text style={s.warnX}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* SPEED DIAL */}
      <View style={s.speedBlock}>
        <LinearGradient colors={['#1A2745','#0F1A35']} style={s.speedCard}>
          <Text style={[s.speedNum, { color: speedColor }]}>{spd}</Text>
          <Text style={s.speedUnit}>km/h</Text>
        </LinearGradient>
        <View style={[s.limitCircle, { borderColor: spd > 80 ? '#FF1744' : '#333' }]}>
          <Text style={[s.limitNum, { color: spd > 80 ? '#FF1744' : '#333' }]}>80</Text>
          <Text style={s.limitLabel}>LIMIT</Text>
        </View>
        {/* Weather widget */}
        {weather && (
          <LinearGradient colors={['#1A2745','#0F1A35']} style={s.weatherCard}>
            <Text style={s.weatherIcon}>{weather.icon}</Text>
            <Text style={s.weatherTemp}>{weather.temp}°</Text>
            <Text style={s.weatherDesc}>{weather.desc}</Text>
            <Text style={s.weatherWind}>💨 {weather.wind}</Text>
          </LinearGradient>
        )}
      </View>

      {/* SOS FAB */}
      <Animated.View style={[s.sosFab, { transform:[{ scale: sosScale }] }]}>
        <TouchableOpacity onPress={() => navigation.navigate('SOS')} activeOpacity={0.85}>
          <LinearGradient colors={['#FF1744','#CC001A']} style={s.sosCircle}>
            <Text style={s.sosTxt}>SOS</Text>
          </LinearGradient>
          <View style={s.sosGlow} />
        </TouchableOpacity>
      </Animated.View>

      {/* BOTTOM ETA SHEET */}
      <View style={s.bottomSheet}>
        <LinearGradient colors={['rgba(15,26,53,0.97)','rgba(8,14,30,0.99)']} style={s.bottomInner}>
          <TouchableOpacity style={s.etaRow} activeOpacity={navState === 'failed' ? 0.7 : 1}
            onPress={() => { if (navState !== 'routing' && coords) buildNavigation(coords.latitude, coords.longitude); }}>
            <View style={{ flex: 1 }}>
              <Text style={s.etaTime}>
                {nav ? `${nav.durationMin} min` : navState === 'routing' ? 'Routing…' : '—'}
              </Text>
              <Text style={s.etaDest} numberOfLines={1}>
                {dest?.name || (navState === 'failed' ? 'No route — tap to retry' : 'Finding nearest hospital…')}
              </Text>
            </View>
            <View style={{ alignItems:'flex-end' }}>
              <Text style={s.etaDist}>{nav ? `${nav.distanceKm.toFixed(1)} km` : ''}</Text>
              <Text style={s.etaArrival}>
                {nav ? `ETA ${new Date(Date.now() + nav.durationMin * 60000).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}` : 'OSM · live route'}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={s.quickRow}>
            {[
              { icon:'🚑', label:'108',    color:'#FF1744' },
              { icon:'👮', label:'100',    color:'#4285F4' },
              { icon:'🚒', label:'101',    color:'#FF6B00' },
              { icon:'🔦', label:'Beacon', color:'#FFB300' },
            ].map(b => (
              <TouchableOpacity key={b.label} style={s.qBtn}
                onPress={() => b.label === 'Beacon'
                  ? navigation.navigate('NightBeacon')
                  : Linking.openURL(`tel:${b.label}`).catch(() => {})}>
                <View style={[s.qBtnCircle, { borderColor:`${b.color}50` }]}>
                  <Text style={{ fontSize: 22 }}>{b.icon}</Text>
                </View>
                <Text style={[s.qBtnLabel, { color: b.color }]}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1A35' },

  // Loading
  loadScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadCenter: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  loadRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#4285F4' },
  loadDot: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(66,133,244,0.15)', borderWidth: 2, borderColor: 'rgba(66,133,244,0.4)', alignItems: 'center', justifyContent: 'center' },
  loadTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  loadSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 },

  // Web mock map
  mockMap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(30,60,110,0.22)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(30,60,110,0.22)' },
  road: { position: 'absolute' },
  water: { position: 'absolute', borderTopRightRadius: 60 },
  routeCasing: { position: 'absolute', top: '43%', left: '33%', width: 170, height: 14, backgroundColor: '#0A2A6E', borderRadius: 7, transform: [{ rotate: '-16deg' }] },
  routeBlue: { position: 'absolute', top: '43.5%', left: '33.5%', width: 168, height: 8, backgroundColor: '#4285F4', borderRadius: 4, transform: [{ rotate: '-16deg' }], shadowColor: '#4285F4', shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  routeDash: { position: 'absolute', top: '43.8%', width: 20, height: 3, backgroundColor: '#FFF', borderRadius: 2, opacity: 0.5 },
  userWrap: { position: 'absolute', top: '45%', left: '38%', width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  userRing: { position: 'absolute', width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#4285F4' },
  userDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#4285F4', borderWidth: 3, borderColor: '#FFF', elevation: 6, shadowColor: '#4285F4', shadowOpacity: 0.9, shadowRadius: 8 },
  scanLine: { position: 'absolute', width: 32, height: 2, backgroundColor: 'rgba(66,133,244,0.6)', left: 25, top: 25, borderRadius: 1 },
  destWrap: { position: 'absolute', top: '20%', right: '15%', alignItems: 'center' },
  bsPin: { position: 'absolute', alignItems: 'center' },
  bsDot: { width: 12, height: 12, borderRadius: 6 },
  bsHigh: { backgroundColor: '#B71C1C', borderWidth: 2, borderColor: '#FF1744' },
  bsMed: { backgroundColor: '#BF360C', borderWidth: 2, borderColor: '#FF6B00' },
  bsTag: { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2, marginTop: 2 },
  bsTagTxt: { fontSize: 12 },
  coordBox: { position: 'absolute', bottom: 170, left: 16, backgroundColor: 'rgba(10,18,40,0.85)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(66,133,244,0.3)' },
  coordText: { fontSize: 11, color: '#4285F4', fontWeight: '700' },
  coordSub: { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  // Map markers
  mapMarker: { borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1.5 },
  markerHigh: { backgroundColor: 'rgba(183,28,28,0.92)', borderColor: '#FF1744' },
  markerMed: { backgroundColor: 'rgba(230,81,0,0.88)', borderColor: '#FF6B00' },
  markerTxt: { fontSize: 11, color: '#FFF', fontWeight: '900' },
  destCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#FF1744', shadowOpacity: 0.7, shadowRadius: 10 },
  destStem: { width: 3, height: 14, backgroundColor: '#FF1744', borderRadius: 2 },
  destLbl: { backgroundColor: 'rgba(10,18,38,0.9)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
  destLblTxt: { fontSize: 10, color: '#FFF', fontWeight: '700' },

  // Top HUD
  topHUD: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  turnCard: { marginHorizontal: 12, marginTop: 8, borderRadius: 18, overflow: 'hidden', elevation: 18, shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  turnCardInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12, borderWidth: 1, borderColor: 'rgba(66,133,244,0.2)', borderRadius: 18 },
  turnIconBox: { width: 54, height: 54, backgroundColor: '#4285F4', borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#4285F4', shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  turnIconTxt: { fontSize: 28 },
  turnDist: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  turnInstr: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  turnNext: { alignItems: 'center', paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)' },
  turnNextLbl: { fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },
  turnNextIcon: { fontSize: 22, marginTop: 4 },

  statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 8 },
  statusLeft: { flexDirection: 'row', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  badgeLive: { backgroundColor: 'rgba(0,230,118,0.15)', borderWidth: 1, borderColor: 'rgba(0,230,118,0.3)' },
  badgeCoords: { backgroundColor: 'rgba(66,133,244,0.12)', borderWidth: 1, borderColor: 'rgba(66,133,244,0.28)' },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 0.5 },
  clockTxt: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },

  warnBanner: { position: 'absolute', left: 12, right: 12, top: 178, zIndex: 20 },
  warnInner: { borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 12 },
  warnTitle: { fontSize: 12, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  warnSub: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  warnX: { fontSize: 16, color: 'rgba(255,255,255,0.6)', paddingLeft: 4 },

  speedBlock: { position: 'absolute', left: 14, bottom: 180, gap: 6, zIndex: 10, alignItems: 'center' },
  speedCard: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', minWidth: 72, borderWidth: 1, borderColor: 'rgba(66,133,244,0.2)', elevation: 8 },
  speedNum: { fontSize: 32, fontWeight: '900', lineHeight: 34 },
  speedUnit: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1 },
  limitCircle: { width: 46, height: 46, borderRadius: 23, borderWidth: 3.5, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  limitNum: { fontSize: 15, fontWeight: '900', lineHeight: 16 },
  limitLabel: { fontSize: 6, color: '#555', fontWeight: '900', letterSpacing: 0.5 },
  weatherCard: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', minWidth: 64, borderWidth: 1, borderColor: 'rgba(66,133,244,0.2)', marginTop: 4 },
  weatherIcon: { fontSize: 18 },
  weatherTemp: { fontSize: 16, fontWeight: '900', color: '#FFF', lineHeight: 18 },
  weatherDesc: { fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: 0.3 },
  weatherWind: { fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 1 },

  sosFab: { position: 'absolute', right: 14, bottom: 180, zIndex: 10, elevation: 22, shadowColor: '#FF1744', shadowOpacity: 0.85, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
  sosCircle: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
  sosTxt: { fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  sosGlow: { position: 'absolute', width: 82, height: 82, borderRadius: 41, backgroundColor: 'rgba(255,23,68,0.16)', top: -8, left: -8, zIndex: -1 },

  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  bottomInner: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 16, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderTopWidth: 1, borderColor: 'rgba(66,133,244,0.2)' },
  etaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  etaTime: { fontSize: 28, fontWeight: '900', color: '#4285F4' },
  etaDest: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  etaDist: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  etaArrival: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-around' },
  qBtn: { alignItems: 'center', gap: 5 },
  qBtnCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qBtnLabel: { fontSize: 11, fontWeight: '700' },
});
