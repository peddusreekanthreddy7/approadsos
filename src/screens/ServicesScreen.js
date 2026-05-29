import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, Alert, Linking, Platform, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { EMERGENCY_SERVICES } from '../data/emergencyData';
import { getNearestServices, formatDistance, haversineDistance, estimateETA } from '../utils/haversine';
import { fetchNearbyServices } from '../utils/fetchNearbyServices';

const { width } = Dimensions.get('window');

const FILTERS = [
  { id: 'all', label: 'All', icon: '⚡', color: '#FF1744' },
  { id: 'hospital', label: 'Hospital', icon: '🏥', color: '#FF1744' },
  { id: 'police', label: 'Police', icon: '👮', color: '#00B0FF' },
  { id: 'fire', label: 'Fire', icon: '🚒', color: '#FF6B00' },
  { id: 'towing', label: 'Towing', icon: '🚗', color: '#FFB300' },
  { id: 'puncture', label: 'Tyres', icon: '🔧', color: '#00E676' },
  { id: 'fuel', label: 'Fuel', icon: '⛽', color: '#7C4DFF' },
];

const TYPE_CONFIG = {
  hospital: { color: '#FF1744', bg: 'rgba(255,23,68,0.1)', border: 'rgba(255,23,68,0.25)', levelBadge: true },
  police: { color: '#00B0FF', bg: 'rgba(0,176,255,0.1)', border: 'rgba(0,176,255,0.25)' },
  fire: { color: '#FF6B00', bg: 'rgba(255,107,0,0.1)', border: 'rgba(255,107,0,0.25)' },
  towing: { color: '#FFB300', bg: 'rgba(255,179,0,0.1)', border: 'rgba(255,179,0,0.25)' },
  puncture: { color: '#00E676', bg: 'rgba(0,230,118,0.1)', border: 'rgba(0,230,118,0.25)' },
  fuel: { color: '#7C4DFF', bg: 'rgba(124,77,255,0.1)', border: 'rgba(124,77,255,0.25)' },
};

const TYPE_ICONS = { hospital: '🏥', police: '👮', fire: '🚒', towing: '🚗', puncture: '🔧', fuel: '⛽' };

function callService(service) {
  if (!service.phone) {
    Alert.alert('No number', `No phone number on file for ${service.name}`);
    return;
  }
  const url = `tel:${service.phone}`;
  Linking.openURL(url).catch(() => Alert.alert('Cannot dial', `Unable to open dialer for ${service.name}`));
}

function navigateToService(service) {
  const label = encodeURIComponent(service.name);
  const dest = `${service.lat},${service.lon}`;
  const url = Platform.select({
    ios: `maps://?daddr=${dest}&q=${label}`,
    android: `google.navigation:q=${dest}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
  });
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}`)
      .catch(() => Alert.alert('Cannot navigate', `Unable to open maps for ${service.name}`))
  );
}

// 3D Radar loading animation
function RadarLoader() {
  const sweep = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0.3)).current;
  const ring2 = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(sweep, { toValue: 1, duration: 2000, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(ring1, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      Animated.timing(ring1, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.delay(500),
      Animated.timing(ring2, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      Animated.timing(ring2, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);
  const sweepDeg = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={rdr.container}>
      {/* Rings */}
      <Animated.View style={[rdr.ring, { width: 180, height: 180, borderRadius: 90, opacity: ring1, borderColor: 'rgba(0,176,255,0.4)' }]} />
      <Animated.View style={[rdr.ring, { width: 120, height: 120, borderRadius: 60, opacity: ring2, borderColor: 'rgba(0,176,255,0.6)' }]} />
      <View style={[rdr.ring, { width: 60, height: 60, borderRadius: 30, borderColor: 'rgba(0,176,255,0.8)', opacity: 0.7 }]} />
      {/* Cross hairs */}
      <View style={rdr.crossH} /><View style={rdr.crossV} />
      {/* Sweep arm */}
      <Animated.View style={[rdr.sweepWrap, { transform: [{ rotateZ: sweepDeg }] }]}>
        <LinearGradient colors={['transparent', 'rgba(0,176,255,0.5)', 'rgba(0,230,118,0.7)']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={rdr.sweepArm} />
      </Animated.View>
      {/* Centre dot */}
      <View style={rdr.centreDot} />
      <Text style={rdr.label}>SCANNING AREA</Text>
      <Text style={rdr.sub}>Finding real emergency services near your GPS…</Text>
    </View>
  );
}
const rdr = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  ring: { position: 'absolute', borderWidth: 1, backgroundColor: 'transparent' },
  crossH: { position: 'absolute', width: 180, height: 1, backgroundColor: 'rgba(0,176,255,0.15)' },
  crossV: { position: 'absolute', width: 1, height: 180, backgroundColor: 'rgba(0,176,255,0.15)' },
  sweepWrap: { position: 'absolute', width: 90, height: 90, top: '50%', left: '50%', marginTop: -90, marginLeft: 0 },
  sweepArm: { width: 90, height: 2, borderRadius: 1, marginTop: 90 },
  centreDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00E676', shadowColor: '#00E676', shadowOpacity: 1, shadowRadius: 8 },
  label: { marginTop: 110, fontSize: 12, fontWeight: '800', color: '#00B0FF', letterSpacing: 3 },
  sub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },
});

function ServiceCard({ service, index }) {
  const slideAnim  = useRef(new Animated.Value(50)).current;
  const opacityAnim= useRef(new Animated.Value(0)).current;
  const tiltAnim   = useRef(new Animated.Value(0)).current;
  const cfg = TYPE_CONFIG[service.type] || TYPE_CONFIG.police;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: 0, duration: 380, delay: index * 70, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 380, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const tiltDeg = tiltAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '2.5deg'] });

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ translateY: slideAnim }, { perspective: 800 }, { rotateX: tiltDeg }], opacity: opacityAnim }]}>
      <TouchableOpacity
        activeOpacity={0.97}
        onPressIn={() => Animated.timing(tiltAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start()}
        onPressOut={() => Animated.timing(tiltAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start()}
      >
      <LinearGradient colors={[cfg.bg, 'rgba(10,16,28,0.97)']} style={[styles.card, {
        borderColor: cfg.border,
        shadowColor: cfg.color, shadowOpacity: 0.28, shadowRadius: 14, elevation: 12,
      }]}>
        {/* 3D depth layer */}
        <View style={[styles.cardAccentBar, { backgroundColor: cfg.color }]} />
        {/* Shine overlay */}
        <LinearGradient colors={['rgba(255,255,255,0.05)', 'transparent']} style={styles.cardShine} />

        <View style={styles.cardTop}>
          <View style={[styles.cardIconCircle, {
            backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}40`,
            shadowColor: cfg.color, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
          }]}>
            <Text style={styles.cardIcon}>{TYPE_ICONS[service.type]}</Text>
          </View>

          <View style={styles.cardInfo}>
            <View style={styles.cardNameRow}>
              <Text style={styles.cardName}>{service.name}</Text>
              {service.level && (
                <View style={[styles.levelBadge, { backgroundColor: `${cfg.color}20`, borderColor: `${cfg.color}50` }]}>
                  <Text style={[styles.levelBadgeText, { color: cfg.color }]}>{service.level}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardAddress}>{service.address}</Text>

            <View style={styles.cardTagRow}>
              <View style={[styles.openBadge, service.open24h ? styles.openGreen : styles.openRed]}>
                <View style={[styles.openDot, { backgroundColor: service.open24h ? '#00E676' : '#FF1744' }]} />
                <Text style={[styles.openText, { color: service.open24h ? '#00E676' : '#FF1744' }]}>
                  {service.open24h ? '24/7 OPEN' : 'CHECK HOURS'}
                </Text>
              </View>
              {service.trauma && (
                <View style={styles.traumaBadge}>
                  <Text style={styles.traumaText}>⚕️ TRAUMA</Text>
                </View>
              )}
            </View>

            {service.specialties && (
              <View style={styles.specialtiesRow}>
                {service.specialties.map(sp => (
                  <View key={sp} style={styles.specialtyTag}>
                    <Text style={styles.specialtyText}>{sp}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardMetaRow}>
          <View style={[styles.distanceBadge, { backgroundColor: `${cfg.color}15` }]}>
            <Text style={[styles.distanceText, { color: cfg.color }]}>{formatDistance(service.distance)}</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>🕐 {service.eta}</Text>
          </View>
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>📡 OFFLINE</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.callBtn, { backgroundColor: `${cfg.color}20`, borderColor: `${cfg.color}40` }]}
            onPress={() => callService(service)}>
            <Text style={[styles.callBtnText, { color: cfg.color }]}>📞 CALL NOW</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, { shadowColor: '#00B0FF', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 }]}
            onPress={() => navigateToService(service)}>
            <LinearGradient colors={['#00C4FF', '#00B0FF', '#0066FF']} style={styles.navBtnInner}>
              <Text style={styles.navBtnText}>🗺️ NAVIGATE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Recompute distance/ETA from a new position and re-sort (instant, local)
function rescore(list, lat, lon) {
  return list
    .map(s => {
      const d = parseFloat(haversineDistance(lat, lon, s.lat, s.lon).toFixed(1));
      return { ...s, distance: d, eta: estimateETA(d) };
    })
    .sort((a, b) => a.distance - b.distance);
}

export default function ServicesScreen({ navigation }) {
  const [filter, setFilter] = useState('all');
  const [location, setLocation] = useState(null);
  const [services, setServices] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const watcher     = useRef(null);
  const lastFetch   = useRef(null);   // {lat,lon} of last Overpass query
  const fetchingRef = useRef(false);

  // Pull fresh REAL services around a position (Overpass), with cached fallback
  const fetchAround = async (lat, lon) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const live = await fetchNearbyServices(lat, lon);
      if (live && live.length) {
        setServices(live);
        setIsOffline(false);
        setErrorMsg(null);
        lastFetch.current = { lat, lon };
      } else {
        setServices(getNearestServices(lat, lon, EMERGENCY_SERVICES));
        setIsOffline(true);
        setErrorMsg('No mapped services nearby — showing cached list.');
      }
    } catch (e) {
      setServices(prev => prev.length ? rescore(prev, lat, lon) : getNearestServices(lat, lon, EMERGENCY_SERVICES));
      setIsOffline(true);
      setErrorMsg('Weak signal — will refresh as you move.');
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  // Manual refresh button uses last known location
  const manualRefresh = () => {
    if (location) { setLoading(true); fetchAround(location.latitude, location.longitude); }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied — showing cached list.');
        setServices(EMERGENCY_SERVICES);
        setIsOffline(true);
        setLoading(false);
        return;
      }
      const init = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!mounted) return;
      setLocation(init.coords);
      await fetchAround(init.coords.latitude, init.coords.longitude);

      // Live tracking — distances update instantly, real data refreshes on bigger moves
      watcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 25, timeInterval: 5000 },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          setLocation(loc.coords);
          setServices(prev => prev.length ? rescore(prev, latitude, longitude) : prev);
          const last = lastFetch.current;
          if (!last || haversineDistance(latitude, longitude, last.lat, last.lon) > 0.4) {
            fetchAround(latitude, longitude);
          }
        }
      );
    })();
    return () => { mounted = false; if (watcher.current) watcher.current.remove(); };
  }, []);

  const filtered = filter === 'all' ? services : services.filter(s => s.type === filter);

  return (
    <LinearGradient colors={['#080C14', '#0A1020', '#080C14']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Video Guides banner */}
        <TouchableOpacity onPress={() => navigation.navigate('Guides')} activeOpacity={0.85}>
          <LinearGradient colors={['rgba(0,176,255,0.18)', 'rgba(124,77,255,0.18)']} style={styles.guidesBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.guidesIcon}>🎬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.guidesTitle}>VIDEO GUIDES · 20 tutorials</Text>
              <Text style={styles.guidesSub}>CPR · Accident · Flat tyre · Burns · Choking + more</Text>
            </View>
            <Text style={styles.guidesArrow}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>EMERGENCY <Text style={styles.headerBlue}>SERVICES</Text></Text>
            <Text style={styles.headerSub}>
              {loading ? 'Finding services near you…' : `${isOffline ? 'Cached' : 'Live OSM'} · ${services.length} nearby`}
            </Text>
          </View>
          <TouchableOpacity style={[styles.cacheBadge, isOffline && styles.cacheBadgeOffline]} onPress={manualRefresh} disabled={loading}>
            <Text style={styles.cacheText}>{loading ? '⏳ …' : isOffline ? '📡 CACHED · RETRY' : '🟢 LIVE · TRACKING'}</Text>
          </TouchableOpacity>
        </View>

        {/* Distance info */}
        {location && (
          <View style={styles.locationInfo}>
            <LinearGradient colors={['rgba(0,176,255,0.1)', 'rgba(0,176,255,0.05)']} style={styles.locationCard}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
              <Text style={styles.locationSub}>Sorted by distance from you</Text>
            </LinearGradient>
          </View>
        )}

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f.id} onPress={() => setFilter(f.id)}
              style={[styles.filterChip,
                filter === f.id && {
                  backgroundColor: `${f.color}20`, borderColor: `${f.color}60`,
                  shadowColor: f.color, shadowOpacity: 0.55, shadowRadius: 8, elevation: 8,
                }
              ]}>
              <Text style={styles.filterIcon}>{f.icon}</Text>
              <Text style={[styles.filterText, filter === f.id && { color: f.color, fontWeight: '800' }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Services List */}
        <ScrollView style={styles.list} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          {errorMsg && (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>{errorMsg}</Text>
            </View>
          )}
          {loading ? (
            <RadarLoader />
          ) : filtered.length === 0 ? (
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>No {filter === 'all' ? '' : filter + ' '}services found nearby. Tap RETRY above.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultsCount}>{filtered.length} {filter === 'all' ? 'services' : filter + ' stations'} found</Text>
              {filtered.map((service, i) => (
                <ServiceCard key={service.id} service={service} index={i} />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  headerBlue: { color: '#00B0FF' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  cacheBadge: { backgroundColor: 'rgba(0,230,118,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(0,230,118,0.3)' },
  cacheBadgeOffline: { backgroundColor: 'rgba(255,179,0,0.12)', borderColor: 'rgba(255,179,0,0.3)' },
  cacheText: { fontSize: 10, color: '#00E676', fontWeight: '700' },
  locationInfo: { paddingHorizontal: 16, marginBottom: 8 },
  locationCard: { borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(0,176,255,0.15)' },
  locationIcon: { fontSize: 18 },
  locationText: { fontSize: 12, color: '#00B0FF', fontWeight: '600', flex: 1 },
  locationSub: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  filterRow: { maxHeight: 52, marginBottom: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterIcon: { fontSize: 14 },
  filterText: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  list: { flex: 1 },
  resultsCount: { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 12 },
  loadingBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 14 },
  loadingText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingHorizontal: 30, lineHeight: 18 },
  noticeBox: { backgroundColor: 'rgba(255,179,0,0.1)', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,179,0,0.25)' },
  noticeText: { fontSize: 11, color: '#FFB300', textAlign: 'center' },
  cardWrap: { marginBottom: 14 },
  card: { borderRadius: 20, padding: 16, borderWidth: 1, overflow: 'hidden' },
  cardAccentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  cardShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 50, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  cardIconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0, transform: [{ perspective: 500 }, { rotateY: '5deg' }] },
  cardIcon: { fontSize: 26 },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' },
  cardName: { fontSize: 15, fontWeight: '800', color: '#FFF', flex: 1 },
  levelBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  levelBadgeText: { fontSize: 10, fontWeight: '900' },
  cardAddress: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 },
  cardTagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  openGreen: { backgroundColor: 'rgba(0,230,118,0.1)', borderColor: 'rgba(0,230,118,0.3)' },
  openRed: { backgroundColor: 'rgba(255,23,68,0.1)', borderColor: 'rgba(255,23,68,0.3)' },
  openDot: { width: 5, height: 5, borderRadius: 3 },
  openText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  traumaBadge: { backgroundColor: 'rgba(255,23,68,0.1)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,23,68,0.3)' },
  traumaText: { fontSize: 9, color: '#FF1744', fontWeight: '700' },
  specialtiesRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 5 },
  specialtyTag: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  specialtyText: { fontSize: 9, color: 'rgba(255,255,255,0.45)' },
  cardMetaRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  distanceBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  distanceText: { fontSize: 13, fontWeight: '900' },
  etaBadge: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  etaText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  offlineBadge: { backgroundColor: 'rgba(0,176,255,0.08)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,176,255,0.2)' },
  offlineText: { fontSize: 9, color: '#00B0FF', fontWeight: '700', letterSpacing: 0.5 },
  cardActions: { flexDirection: 'row', gap: 10 },
  callBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  callBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  navBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  navBtnInner: { paddingVertical: 10, alignItems: 'center' },
  navBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  guidesBanner: { marginHorizontal: 16, marginTop: 10, marginBottom: 4, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(0,176,255,0.35)', shadowColor: '#00B0FF', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
  guidesIcon: { fontSize: 26 },
  guidesTitle: { fontSize: 12, fontWeight: '800', color: '#00B0FF', letterSpacing: 0.5 },
  guidesSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  guidesArrow: { fontSize: 26, color: '#00B0FF', fontWeight: '300' },
});
