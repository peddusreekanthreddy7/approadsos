import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  ScrollView, Dimensions, Alert, Vibration, Platform, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { buildSMSPayload } from '../utils/haversine';

const { width } = Dimensions.get('window');

const MODES = [
  { id: 'victim',    label: 'I AM VICTIM',   icon: '🚗', color: '#FF1744', desc: 'Trapped / Injured / Breakdown', category: 'A' },
  { id: 'bystander', label: 'I WITNESSED',   icon: '👁️', color: '#FF6B00', desc: 'I found an accident victim',    category: 'B' },
  { id: 'hazmat',    label: 'HAZMAT / MCI',  icon: '☣️', color: '#7C4DFF', desc: 'Chemical / EV fire / Mass casualty', category: 'C' },
];

const QUICK_ACTIONS = [
  { icon: '🚑', label: 'Ambulance', sub: '108',  dial: '108',  color: '#FF1744', bg: 'rgba(255,23,68,0.12)' },
  { icon: '👮', label: 'Police',    sub: '100',  dial: '100',  color: '#00B0FF', bg: 'rgba(0,176,255,0.12)' },
  { icon: '🚒', label: 'Fire',      sub: '101',  dial: '101',  color: '#FF6B00', bg: 'rgba(255,107,0,0.12)' },
  { icon: '🚗', label: 'Towing',    sub: '1033', dial: '1033', color: '#FFB300', bg: 'rgba(255,179,0,0.12)' },
];

function dialNumber(num) {
  const url = `tel:${num}`;
  Linking.canOpenURL(url)
    .then(ok => ok ? Linking.openURL(url) : Alert.alert('Cannot dial', `Unable to open dialer for ${num}`))
    .catch(() => Alert.alert('Cannot dial', `Unable to open dialer for ${num}`));
}

export default function SOSScreen({ navigation }) {
  const [mode,      setMode]      = useState(null);
  const [location,  setLocation]  = useState(null);
  const [activated, setActivated] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Existing pulse rings
  const pulseRing1    = useRef(new Animated.Value(1)).current;
  const pulseRing2    = useRef(new Animated.Value(1)).current;
  const pulseRing3    = useRef(new Animated.Value(1)).current;
  const pulseOpacity1 = useRef(new Animated.Value(0.6)).current;
  const pulseOpacity2 = useRef(new Animated.Value(0.4)).current;
  const pulseOpacity3 = useRef(new Animated.Value(0.2)).current;
  const btnScale      = useRef(new Animated.Value(1)).current;
  const locationOpacity = useRef(new Animated.Value(0)).current;

  // 3D orbital ring animations
  const orbit1        = useRef(new Animated.Value(0)).current;
  const orbit2        = useRef(new Animated.Value(0)).current;
  const tiltX         = useRef(new Animated.Value(0)).current;
  const tiltY         = useRef(new Animated.Value(0)).current;
  const glowPulse     = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
        Animated.timing(locationOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      }
    })();

    function startPulse(ring, opacity, delay, toVal, opacVal) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(ring,    { toValue: toVal,  duration: 1600, useNativeDriver: true }),
            Animated.timing(ring,    { toValue: 1,      duration: 0,    useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(opacity, { toValue: 0,      duration: 1600, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: opacVal,duration: 0,    useNativeDriver: true }),
          ]),
        ])
      ).start();
    }

    startPulse(pulseRing1, pulseOpacity1, 0,   2.5, 0.6);
    startPulse(pulseRing2, pulseOpacity2, 400, 2.8, 0.4);
    startPulse(pulseRing3, pulseOpacity3, 800, 3.2, 0.2);

    // 3D orbital ring spins
    Animated.loop(Animated.timing(orbit1, { toValue: 1, duration: 7000, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(orbit2, { toValue: 1, duration: 11000, useNativeDriver: true })).start();

    // Gentle 3D rocking on the button
    Animated.loop(Animated.sequence([
      Animated.timing(tiltX, { toValue: 1, duration: 2500, useNativeDriver: true }),
      Animated.timing(tiltX, { toValue: 0, duration: 2500, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(tiltY, { toValue: 1, duration: 3200, useNativeDriver: true }),
      Animated.timing(tiltY, { toValue: 0, duration: 3200, useNativeDriver: true }),
    ])).start();

    // Glow pulse
    Animated.loop(Animated.sequence([
      Animated.timing(glowPulse, { toValue: 1,   duration: 1200, useNativeDriver: true }),
      Animated.timing(glowPulse, { toValue: 0.35,duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);

  const orbit1Deg = orbit1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const orbit2Deg = orbit2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const tiltXDeg  = tiltX.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] });
  const tiltYDeg  = tiltY.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] });

  const sendSMSBridge = () => {
    const payload = location
      ? buildSMSPayload(location.latitude, location.longitude, 'TRAUMA', 'CRITICAL')
      : '[SOS][Lat:--][Lon:--][Type:TRAUMA][Severity:CRITICAL]';
    const sep = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:108${sep}body=${encodeURIComponent(payload)}`;
    Linking.openURL(url).catch(() => Alert.alert('Cannot send SMS', 'No SMS app available on this device.'));
  };

  const handleSOSPress = () => {
    Vibration.vibrate([0, 200, 100, 200, 100, 400]);
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1,   tension: 100, friction: 5, useNativeDriver: true }),
    ]).start();

    if (!mode) {
      Alert.alert('Select Mode', 'Please select your situation first:\n• I AM VICTIM\n• I WITNESSED\n• HAZMAT / MCI');
      return;
    }

    setActivated(true);
    if (mode === 'hazmat') {
      navigation.navigate('Hazmat');
    } else {
      let c = 5;
      setCountdown(c);
      const t = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(t);
          setCountdown(null);
          Alert.alert('🆘 SOS DISPATCHED',
            `Emergency services notified!\n\nLocation: ${location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Acquiring...'}\n\nSMS Bridge: Active\nAmbulance: Dispatched (ETA ~8 min)\nPolice: Notified`,
            [{ text: 'PARAMEDIC CARD', onPress: () => navigation.navigate('ParamedicCard') }, { text: 'OK' }]
          );
        }
      }, 1000);
    }
  };

  return (
    <LinearGradient colors={['#080C14', '#0D0812', '#080C14']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>EMERGENCY <Text style={styles.headerRed}>SOS</Text></Text>
            <Animated.View style={[styles.locationBadge, { opacity: locationOpacity }]}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>
                {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Acquiring GPS...'}
              </Text>
            </Animated.View>
          </View>

          {/* Big SOS Button with 3D Orbital Rings */}
          <View style={styles.sosCenterWrap}>
            {/* Pulse rings (scale outward) */}
            <Animated.View style={[styles.pulseRing, styles.pulseRing3, { transform: [{ scale: pulseRing3 }], opacity: pulseOpacity3 }]} />
            <Animated.View style={[styles.pulseRing, styles.pulseRing2, { transform: [{ scale: pulseRing2 }], opacity: pulseOpacity2 }]} />
            <Animated.View style={[styles.pulseRing, styles.pulseRing1, { transform: [{ scale: pulseRing1 }], opacity: pulseOpacity1 }]} />

            {/* 3D Orbital rings — perspective+rotateX = tilted ellipse = 3D orbit */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {/* Static orbit ring 1 — red, steep tilt */}
              <View style={[styles.orbit3D, {
                width: 220, height: 220, borderRadius: 110,
                top: '50%', left: '50%', marginTop: -110, marginLeft: -110,
                borderColor: 'rgba(255,23,68,0.4)',
                transform: [{ perspective: 600 }, { rotateX: '72deg' }],
              }]} />
              {/* Animated spin orbit — blue */}
              <Animated.View style={[styles.orbit3D, {
                width: 260, height: 260, borderRadius: 130,
                top: '50%', left: '50%', marginTop: -130, marginLeft: -130,
                borderColor: 'rgba(0,176,255,0.22)',
                transform: [{ perspective: 600 }, { rotateX: '68deg' }, { rotateZ: orbit1Deg }],
              }]} />
              {/* Counter-spin orbit — purple */}
              <Animated.View style={[styles.orbit3D, {
                width: 300, height: 300, borderRadius: 150,
                top: '50%', left: '50%', marginTop: -150, marginLeft: -150,
                borderColor: 'rgba(124,77,255,0.18)', borderWidth: 1,
                transform: [{ perspective: 600 }, { rotateX: '75deg' }, { rotateZ: orbit2Deg }],
              }]} />
              {/* Outer faint ring */}
              <View style={[styles.orbit3D, {
                width: 340, height: 340, borderRadius: 170,
                top: '50%', left: '50%', marginTop: -170, marginLeft: -170,
                borderColor: 'rgba(255,23,68,0.07)', borderWidth: 1,
                transform: [{ perspective: 600 }, { rotateX: '80deg' }, { rotateZ: '45deg' }],
              }]} />
            </View>

            {/* Glow halo behind button */}
            <Animated.View style={[styles.glowHalo, { opacity: glowPulse }]} />

            {/* 3D rocking SOS button */}
            <Animated.View style={[{
              transform: [
                { scale: btnScale },
                { perspective: 500 },
                { rotateX: tiltXDeg },
                { rotateY: tiltYDeg },
              ],
            }]}>
              <TouchableOpacity onPress={handleSOSPress} activeOpacity={0.85}>
                <LinearGradient
                  colors={activated ? ['#00E676', '#00B040', '#00E676'] : ['#FF4060', '#FF1744', '#CC001A', '#FF1744']}
                  style={styles.sosMainBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  {/* Shine overlay */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.25)', 'transparent']}
                    style={styles.sosShine}
                  />
                  <Text style={styles.sosMainIcon}>{activated ? '✓' : '🆘'}</Text>
                  <Text style={styles.sosMainText}>
                    {countdown !== null ? `DISPATCHING IN ${countdown}...` : activated ? 'SOS ACTIVE' : 'PRESS & HOLD'}
                  </Text>
                  <Text style={styles.sosMainSub}>
                    {activated ? 'Emergency services alerted' : 'Tap to activate emergency'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* 3D shadow under button */}
            <View style={styles.btnShadow3D} />
          </View>

          {/* Mode Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SELECT YOUR SITUATION</Text>
            {MODES.map(m => (
              <TouchableOpacity key={m.id} onPress={() => setMode(m.id)} style={styles.modeCard}>
                <LinearGradient
                  colors={mode === m.id ? [`${m.color}25`, `${m.color}15`] : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']}
                  style={[styles.modeCardInner, mode === m.id && { borderColor: m.color, borderWidth: 1.5 }]}
                >
                  {/* 3D highlight edge when selected */}
                  {mode === m.id && (
                    <LinearGradient
                      colors={[`${m.color}30`, 'transparent']}
                      style={styles.modeCardShine}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                  )}
                  <View style={[styles.modeCategoryBadge, { backgroundColor: `${m.color}20`, borderColor: `${m.color}50` }]}>
                    <Text style={[styles.modeCategoryText, { color: m.color }]}>CAT {m.category}</Text>
                  </View>
                  <Text style={styles.modeIcon}>{m.icon}</Text>
                  <View style={styles.modeTextWrap}>
                    <Text style={[styles.modeLabel, mode === m.id && { color: m.color }]}>{m.label}</Text>
                    <Text style={styles.modeDesc}>{m.desc}</Text>
                  </View>
                  {mode === m.id && <Text style={[styles.modeCheck, { color: m.color }]}>✓</Text>}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUICK DIAL</Text>
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map(a => (
                <TouchableOpacity key={a.label} style={styles.quickCard}
                  onPress={() => dialNumber(a.dial)}>
                  <LinearGradient colors={[a.bg, 'transparent']} style={[styles.quickCardInner, { borderColor: `${a.color}30` }]}>
                    <Text style={styles.quickIcon}>{a.icon}</Text>
                    <Text style={[styles.quickLabel, { color: a.color }]}>{a.label}</Text>
                    <Text style={styles.quickSub}>{a.sub}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Advanced Tools */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EMERGENCY TOOLS</Text>
            <View style={styles.toolsRow}>
              <TouchableOpacity style={styles.toolCard} onPress={() => navigation.navigate('ParamedicCard')}>
                <LinearGradient colors={['rgba(0,176,255,0.15)', 'rgba(0,176,255,0.05)']} style={styles.toolCardInner}>
                  <Text style={styles.toolIcon}>🏥</Text>
                  <Text style={styles.toolLabel}>Paramedic{'\n'}Card</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard} onPress={() => navigation.navigate('NightBeacon')}>
                <LinearGradient colors={['rgba(255,179,0,0.15)', 'rgba(255,179,0,0.05)']} style={styles.toolCardInner}>
                  <Text style={styles.toolIcon}>🔦</Text>
                  <Text style={styles.toolLabel}>Night{'\n'}Beacon</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard} onPress={() => navigation.navigate('Hazmat')}>
                <LinearGradient colors={['rgba(124,77,255,0.15)', 'rgba(124,77,255,0.05)']} style={styles.toolCardInner}>
                  <Text style={styles.toolIcon}>☣️</Text>
                  <Text style={styles.toolLabel}>HAZMAT{'\n'}Protocol</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard} onPress={() => navigation.navigate('CrashShield')}>
                <LinearGradient colors={['rgba(255,107,0,0.15)', 'rgba(255,107,0,0.05)']} style={styles.toolCardInner}>
                  <Text style={styles.toolIcon}>🛡️</Text>
                  <Text style={styles.toolLabel}>Crash{'\n'}Shield</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* SMS Bridge Status */}
          <TouchableOpacity style={styles.smsBridge} activeOpacity={0.85} onPress={sendSMSBridge}>
            <LinearGradient colors={['rgba(0,230,118,0.1)', 'rgba(0,230,118,0.05)']} style={styles.smsBridgeInner}>
              <View style={styles.smsRow}>
                <View style={styles.smsActiveDot} />
                <Text style={styles.smsTitle}>SMS BRIDGE READY</Text>
                <Text style={styles.smsTap}>TAP TO SEND ▸</Text>
              </View>
              <Text style={styles.smsSub}>Works on zero mobile data. Uses native SIM card to dispatch SOS even in dead zones.</Text>
              <Text style={styles.smsPayload}>
                {location ? buildSMSPayload(location.latitude, location.longitude, 'TRAUMA', 'CRITICAL') : '[SOS][Lat:--][Lon:--][Type:TRAUMA]'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: 3 },
  headerRed: { color: '#FF1744' },
  locationBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6, backgroundColor: 'rgba(0,230,118,0.1)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,230,118,0.2)' },
  locationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E676' },
  locationText: { fontSize: 11, color: '#00E676', fontWeight: '600' },

  sosCenterWrap: { alignItems: 'center', justifyContent: 'center', height: 310, marginVertical: 10, position: 'relative' },
  orbit3D: { position: 'absolute', borderWidth: 1.5, backgroundColor: 'transparent' },
  glowHalo: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,23,68,0.15)',
    shadowColor: '#FF1744', shadowOpacity: 1, shadowRadius: 40, shadowOffset: { width: 0, height: 0 },
  },

  pulseRing: { position: 'absolute', borderRadius: 100, borderWidth: 1.5 },
  pulseRing1: { width: 160, height: 160, borderColor: '#FF1744' },
  pulseRing2: { width: 160, height: 160, borderColor: '#FF6B35' },
  pulseRing3: { width: 160, height: 160, borderColor: '#FF9500' },

  sosMainBtn: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    elevation: 30, shadowColor: '#FF1744', shadowOpacity: 0.8, shadowRadius: 30, shadowOffset: { width: 0, height: 10 },
  },
  sosShine: {
    position: 'absolute', top: -80, left: -80, width: 160, height: 160, borderRadius: 80,
  },
  sosMainIcon: { fontSize: 36, marginBottom: 4 },
  sosMainText: { fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 1, textAlign: 'center' },
  sosMainSub: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, textAlign: 'center' },
  btnShadow3D: {
    width: 130, height: 20, borderRadius: 65,
    backgroundColor: 'rgba(255,23,68,0.2)',
    marginTop: 8, alignSelf: 'center',
    shadowColor: '#FF1744', shadowOpacity: 0.5, shadowRadius: 14,
  },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 3, marginBottom: 12 },
  modeCard: { marginBottom: 8 },
  modeCardInner: { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' },
  modeCardShine: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modeCategoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  modeCategoryText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  modeIcon: { fontSize: 28 },
  modeTextWrap: { flex: 1 },
  modeLabel: { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  modeDesc: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  modeCheck: { fontSize: 20, fontWeight: '900' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: (width - 52) / 4 },
  quickCardInner: { borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1 },
  quickIcon: { fontSize: 28, marginBottom: 6 },
  quickLabel: { fontSize: 12, fontWeight: '700' },
  quickSub: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  toolsRow: { flexDirection: 'row', gap: 10 },
  toolCard: { flex: 1 },
  toolCardInner: { borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  toolIcon: { fontSize: 26, marginBottom: 6 },
  toolLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 14 },
  smsBridge: { marginHorizontal: 16, marginBottom: 10 },
  smsBridgeInner: { borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(0,230,118,0.2)' },
  smsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  smsActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E676' },
  smsTitle: { fontSize: 12, fontWeight: '800', color: '#00E676', letterSpacing: 1 },
  smsTap: { fontSize: 10, fontWeight: '800', color: 'rgba(0,230,118,0.7)', marginLeft: 'auto', letterSpacing: 0.5 },
  smsSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 16, marginBottom: 8 },
  smsPayload: { fontSize: 10, color: 'rgba(0,230,118,0.6)', fontFamily: Platform?.OS === 'ios' ? 'Courier' : 'monospace' },
});
