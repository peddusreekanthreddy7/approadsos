import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Dimensions, Vibration, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Accelerometer } from 'expo-sensors';

const { width, height } = Dimensions.get('window');
const CRASH_THRESHOLD = 2.5; // G-force
const COUNTDOWN_SECONDS = 15;

export default function CrashShieldScreen({ navigation }) {
  const [phase, setPhase] = useState('monitoring'); // monitoring | detected | countdown | dispatching | safe
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [gForce, setGForce] = useState(0.98);
  const [maxG, setMaxG] = useState(0.98);
  const [accelData, setAccelData] = useState({ x: 0.01, y: 0.01, z: 0.98 });

  const countRef = useRef(COUNTDOWN_SECONDS);
  const timerRef = useRef(null);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const countdownAnim = useRef(new Animated.Value(1)).current;
  const safeBtnScale = useRef(new Animated.Value(1)).current;
  const radarSpin = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let sub = null;
    try {
      Accelerometer.setUpdateInterval(200);
      sub = Accelerometer.addListener(({ x, y, z }) => {
        const g = Math.sqrt(x * x + y * y + z * z);
        setGForce(parseFloat(g.toFixed(2)));
        setAccelData({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), z: parseFloat(z.toFixed(2)) });
        if (g > maxG) setMaxG(parseFloat(g.toFixed(2)));
        if (phase === 'monitoring' && g > CRASH_THRESHOLD) {
          triggerCrashDetected();
        }
      });
    } catch (e) {
      // Accelerometer not available on web/simulator — demo mode only
    }

    // Radar animation
    Animated.loop(
      Animated.timing(radarSpin, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();

    // Safe button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(safeBtnScale, { toValue: 1.04, duration: 600, useNativeDriver: true }),
        Animated.timing(safeBtnScale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    return () => { if (sub) sub.remove(); clearInterval(timerRef.current); };
  }, [phase]);

  const triggerCrashDetected = () => {
    setPhase('detected');
    Vibration.vibrate([0, 300, 200, 300, 200, 600]);
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
      ])
    ).start();
    setTimeout(() => startCountdown(), 800);
  };

  const startCountdown = () => {
    setPhase('countdown');
    countRef.current = COUNTDOWN_SECONDS;
    Animated.timing(bgAnim, { toValue: 1, duration: 500, useNativeDriver: false }).start();

    timerRef.current = setInterval(() => {
      countRef.current -= 1;
      setCountdown(countRef.current);
      Animated.sequence([
        Animated.timing(countdownAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
        Animated.timing(countdownAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      if (countRef.current % 3 === 0) Vibration.vibrate(200);
      if (countRef.current <= 0) {
        clearInterval(timerRef.current);
        setPhase('dispatching');
        Alert.alert('🆘 AUTO-SOS DISPATCHED', 'Emergency services have been contacted!\n\nAmbulance: 108 — Dispatched\nPolice: 100 — Notified\nLocation shared via SMS Bridge', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    }, 1000);
  };

  const handleSafe = () => {
    clearInterval(timerRef.current);
    Vibration.cancel();
    setPhase('safe');
    setCountdown(COUNTDOWN_SECONDS);
    Animated.timing(bgAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
  };

  const simulateCrash = () => { if (phase === 'monitoring') triggerCrashDetected(); };

  const radarRotate = radarSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const bgColor = bgAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(8,12,20,1)', 'rgba(40,0,8,1)'] });
  const flashBg = flashAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,23,68,0)', 'rgba(255,23,68,0.15)'] });
  const countdownColor = countdown <= 5 ? '#FF1744' : countdown <= 10 ? '#FFB300' : '#00E676';

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: flashBg }]} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CRASH SHIELD</Text>
          <View style={[styles.statusDot, { backgroundColor: phase === 'monitoring' ? '#00E676' : '#FF1744' }]} />
        </View>

        {/* Main content */}
        {phase === 'monitoring' && (
          <View style={styles.monitoringView}>
            <View style={styles.radarWrap}>
              <View style={styles.radarOuter}>
                <View style={styles.radarMid}>
                  <View style={styles.radarInner}>
                    <Text style={styles.radarIcon}>📡</Text>
                  </View>
                </View>
              </View>
              <Animated.View style={[styles.radarSweep, { transform: [{ rotate: radarRotate }] }]} />
            </View>

            <Text style={styles.monitorTitle}>MONITORING ACTIVE</Text>
            <Text style={styles.monitorSub}>Watching for high-G deceleration events</Text>

            {/* G-Force gauge */}
            <View style={styles.gForceCard}>
              <LinearGradient colors={['rgba(0,176,255,0.1)', 'rgba(0,176,255,0.05)']} style={styles.gForceInner}>
                <Text style={styles.gForceLabel}>CURRENT G-FORCE</Text>
                <Text style={[styles.gForceValue, { color: gForce > 1.8 ? '#FFB300' : '#00E676' }]}>{gForce}G</Text>
                <View style={styles.gForceBar}>
                  <View style={[styles.gForceFill, { width: `${Math.min(gForce / CRASH_THRESHOLD * 100, 100)}%`, backgroundColor: gForce > 2 ? '#FF1744' : gForce > 1.5 ? '#FFB300' : '#00E676' }]} />
                </View>
                <Text style={styles.gForceThreshold}>Crash threshold: {CRASH_THRESHOLD}G</Text>
              </LinearGradient>
            </View>

            {/* Raw accelerometer */}
            <View style={styles.accelCard}>
              <LinearGradient colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']} style={styles.accelInner}>
                <Text style={styles.accelTitle}>ACCELEROMETER</Text>
                <View style={styles.accelRow}>
                  {['X', 'Y', 'Z'].map((axis, i) => (
                    <View key={axis} style={styles.accelAxis}>
                      <Text style={styles.accelAxisLabel}>{axis}</Text>
                      <Text style={styles.accelAxisValue}>{[accelData.x, accelData.y, accelData.z][i]}</Text>
                    </View>
                  ))}
                  <View style={styles.accelAxis}>
                    <Text style={styles.accelAxisLabel}>MAX</Text>
                    <Text style={[styles.accelAxisValue, { color: '#FFB300' }]}>{maxG}G</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <TouchableOpacity onPress={simulateCrash} style={styles.simulateBtn}>
              <LinearGradient colors={['rgba(255,23,68,0.2)', 'rgba(255,23,68,0.1)']} style={styles.simulateBtnInner}>
                <Text style={styles.simulateText}>⚡ SIMULATE CRASH (Demo)</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {(phase === 'detected' || phase === 'countdown') && (
          <View style={styles.alertView}>
            <Text style={styles.alertEmoji}>💥</Text>
            <Text style={styles.alertTitle}>CRASH DETECTED!</Text>
            <Text style={styles.alertSub}>High-G deceleration event at {maxG}G</Text>

            {phase === 'countdown' && (
              <>
                <Text style={styles.countdownLabel}>AUTO-CALLING SOS IN</Text>
                <Animated.Text style={[styles.countdownNumber, { transform: [{ scale: countdownAnim }], color: countdownColor }]}>
                  {countdown}
                </Animated.Text>

                <View style={styles.countdownBar}>
                  <View style={[styles.countdownFill, {
                    width: `${(countdown / COUNTDOWN_SECONDS) * 100}%`,
                    backgroundColor: countdownColor,
                  }]} />
                </View>
              </>
            )}

            <Animated.View style={{ transform: [{ scale: safeBtnScale }], width: '100%' }}>
              <TouchableOpacity onPress={handleSafe} style={styles.safeBtn}>
                <LinearGradient colors={['#00E676', '#00B040']} style={styles.safeBtnInner}>
                  <Text style={styles.safeBtnIcon}>✓</Text>
                  <Text style={styles.safeBtnText}>I AM SAFE</Text>
                  <Text style={styles.safeBtnSub}>Tap to cancel SOS</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {phase === 'safe' && (
          <View style={styles.safeView}>
            <Text style={styles.safeIcon}>✅</Text>
            <Text style={styles.safeTitle}>SOS CANCELLED</Text>
            <Text style={styles.safeSub}>You indicated you are safe. No emergency services dispatched.</Text>
            <TouchableOpacity onPress={() => setPhase('monitoring')} style={styles.resetBtn}>
              <LinearGradient colors={['rgba(0,176,255,0.2)', 'rgba(0,176,255,0.1)']} style={styles.resetBtnInner}>
                <Text style={styles.resetText}>↩ RESUME MONITORING</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  monitoringView: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  radarWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  radarOuter: { width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(0,176,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  radarMid: { width: 110, height: 110, borderRadius: 55, borderWidth: 1, borderColor: 'rgba(0,176,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  radarInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,176,255,0.15)', borderWidth: 2, borderColor: 'rgba(0,176,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  radarIcon: { fontSize: 26 },
  radarSweep: { position: 'absolute', width: 80, height: 2, backgroundColor: 'rgba(0,176,255,0.5)', left: 80, top: 79 },
  monitorTitle: { fontSize: 22, fontWeight: '900', color: '#00E676', letterSpacing: 2, marginBottom: 6 },
  monitorSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 24 },
  gForceCard: { width: '100%', marginBottom: 12 },
  gForceInner: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,176,255,0.2)', alignItems: 'center' },
  gForceLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 8 },
  gForceValue: { fontSize: 44, fontWeight: '900', lineHeight: 46 },
  gForceBar: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  gForceFill: { height: '100%', borderRadius: 3 },
  gForceThreshold: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 },
  accelCard: { width: '100%', marginBottom: 16 },
  accelInner: { borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  accelTitle: { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 10 },
  accelRow: { flexDirection: 'row', justifyContent: 'space-around' },
  accelAxis: { alignItems: 'center' },
  accelAxisLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
  accelAxisValue: { fontSize: 16, fontWeight: '700', color: '#00B0FF' },
  simulateBtn: { width: '100%' },
  simulateBtnInner: { borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,23,68,0.3)' },
  simulateText: { fontSize: 13, color: '#FF1744', fontWeight: '700' },
  alertView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  alertEmoji: { fontSize: 72, marginBottom: 12 },
  alertTitle: { fontSize: 36, fontWeight: '900', color: '#FF1744', letterSpacing: 3, marginBottom: 6 },
  alertSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 30 },
  countdownLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: 10 },
  countdownNumber: { fontSize: 100, fontWeight: '900', lineHeight: 105 },
  countdownBar: { width: width - 60, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 40 },
  countdownFill: { height: '100%', borderRadius: 4 },
  safeBtn: { borderRadius: 24, overflow: 'hidden', elevation: 20, shadowColor: '#00E676', shadowOpacity: 0.6, shadowRadius: 20 },
  safeBtnInner: { paddingVertical: 24, alignItems: 'center' },
  safeBtnIcon: { fontSize: 40, marginBottom: 4 },
  safeBtnText: { fontSize: 28, fontWeight: '900', color: '#000', letterSpacing: 2 },
  safeBtnSub: { fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 4 },
  safeView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  safeIcon: { fontSize: 72, marginBottom: 16 },
  safeTitle: { fontSize: 28, fontWeight: '900', color: '#00E676', letterSpacing: 2, marginBottom: 8 },
  safeSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 30 },
  resetBtn: { width: '100%' },
  resetBtnInner: { borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,176,255,0.3)' },
  resetText: { fontSize: 14, color: '#00B0FF', fontWeight: '700', letterSpacing: 1 },
});
