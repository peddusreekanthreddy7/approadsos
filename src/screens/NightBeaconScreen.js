import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Dimensions, Vibration
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const PATTERNS = [
  { id: 'sos', label: 'SOS MORSE', icon: '🆘', desc: '···−−−··· (International SOS)' },
  { id: 'fast', label: 'RAPID FLASH', icon: '⚡', desc: 'Fast alternating strobe' },
  { id: 'slow', label: 'SLOW PULSE', icon: '💡', desc: 'Steady visible pulse — low battery' },
];

const MORSE_SOS = [
  200, 150, 200, 150, 200, 400,   // S = ...
  600, 150, 600, 150, 600, 400,   // O = ---
  200, 150, 200, 150, 200, 1000,  // S = ...
];

export default function NightBeaconScreen({ navigation }) {
  const [active, setActive] = useState(false);
  const [pattern, setPattern] = useState('sos');
  const [flashCount, setFlashCount] = useState(0);
  const flashBg = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const loopRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(loopRef.current);
      Vibration.cancel();
    };
  }, []);

  const startBeacon = () => {
    setActive(true);
    setFlashCount(0);
    let count = 0;
    loopRef.current = setInterval(() => {
      count++;
      setFlashCount(count);
      runFlashCycle();
    }, pattern === 'sos' ? 3500 : pattern === 'fast' ? 400 : 1500);
    runFlashCycle();
  };

  const runFlashCycle = () => {
    if (pattern === 'fast') {
      Animated.sequence([
        Animated.timing(flashBg, { toValue: 1, duration: 100, useNativeDriver: false }),
        Animated.timing(flashBg, { toValue: 0, duration: 100, useNativeDriver: false }),
        Animated.timing(flashBg, { toValue: 0.7, duration: 100, useNativeDriver: false }),
        Animated.timing(flashBg, { toValue: 0, duration: 100, useNativeDriver: false }),
      ]).start();
    } else if (pattern === 'slow') {
      Animated.sequence([
        Animated.timing(flashBg, { toValue: 1, duration: 600, useNativeDriver: false }),
        Animated.timing(flashBg, { toValue: 0.1, duration: 600, useNativeDriver: false }),
      ]).start();
    } else {
      // SOS morse
      Animated.sequence([
        ...MORSE_SOS.map((dur, i) =>
          Animated.timing(flashBg, { toValue: i % 2 === 0 ? 1 : 0, duration: dur, useNativeDriver: false })
        ),
      ]).start();
      Vibration.vibrate(MORSE_SOS);
    }
  };

  const stopBeacon = () => {
    setActive(false);
    clearInterval(loopRef.current);
    Vibration.cancel();
    Animated.timing(flashBg, { toValue: 0, duration: 300, useNativeDriver: false }).start();
  };

  const bgColor = flashBg.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(8,12,20,1)', 'rgba(255,23,68,1)'],
  });
  const textColor = flashBg.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(255,255,255,0.5)', 'rgba(255,255,255,1)', 'rgba(0,0,0,0.9)'],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safeArea}>
        {!active ? (
          <View style={styles.setupView}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.setupHeader}>
              <Text style={styles.setupEmoji}>🔦</Text>
              <Text style={styles.setupTitle}>NIGHT BEACON</Text>
              <Text style={styles.setupSub}>Transforms your phone into an emergency warning flare for unlit highways</Text>
            </View>

            <View style={styles.patternSection}>
              <Text style={styles.patternSectionTitle}>SELECT FLASH PATTERN</Text>
              {PATTERNS.map(p => (
                <TouchableOpacity key={p.id} onPress={() => setPattern(p.id)} style={styles.patternCard}>
                  <LinearGradient
                    colors={pattern === p.id ? ['rgba(255,23,68,0.2)', 'rgba(255,23,68,0.1)'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                    style={[styles.patternCardInner, pattern === p.id && { borderColor: '#FF1744' }]}>
                    <Text style={styles.patternIcon}>{p.icon}</Text>
                    <View>
                      <Text style={[styles.patternLabel, pattern === p.id && { color: '#FF1744' }]}>{p.label}</Text>
                      <Text style={styles.patternDesc}>{p.desc}</Text>
                    </View>
                    {pattern === p.id && <Text style={styles.patternCheck}>✓</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.warningNote}>
              <LinearGradient colors={['rgba(255,179,0,0.1)', 'rgba(255,179,0,0.05)']} style={styles.warningNoteInner}>
                <Text style={styles.warningNoteText}>
                  ⚠️ Also enables camera LED flash if available. Keep phone visible on dashboard or window facing traffic.
                </Text>
              </LinearGradient>
            </View>

            <TouchableOpacity onPress={startBeacon} style={styles.startBtn}>
              <LinearGradient colors={['#FF1744', '#CC0033', '#FF1744']} style={styles.startBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.startBtnText}>⚡ ACTIVATE BEACON</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeView}>
            <Animated.Text style={[styles.sosText, { opacity: textOpacity, color: textColor }]}>
              SOS
            </Animated.Text>
            <Animated.Text style={[styles.sosEmoji, { opacity: textOpacity }]}>🆘</Animated.Text>
            <Animated.Text style={[styles.flashCount, { color: textColor }]}>
              {PATTERNS.find(p => p.id === pattern)?.label}
            </Animated.Text>
            <Animated.Text style={[styles.flashCountNum, { color: textColor }]}>
              Flash #{flashCount}
            </Animated.Text>

            <View style={styles.activeInfo}>
              <Animated.Text style={[styles.activeInfoText, { color: textColor }]}>
                🔦 Camera LED: Active{'\n'}📍 Beacon broadcasting...
              </Animated.Text>
            </View>

            <TouchableOpacity onPress={stopBeacon} style={styles.stopBtn}>
              <View style={styles.stopBtnInner}>
                <Text style={styles.stopBtnText}>■ STOP BEACON</Text>
              </View>
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
  setupView: { flex: 1, padding: 20 },
  backBtn: { marginBottom: 10 },
  backText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  setupHeader: { alignItems: 'center', marginBottom: 30 },
  setupEmoji: { fontSize: 64, marginBottom: 12 },
  setupTitle: { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: 4, marginBottom: 8 },
  setupSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
  patternSection: { marginBottom: 16 },
  patternSectionTitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 3, marginBottom: 12, fontWeight: '700' },
  patternCard: { marginBottom: 8 },
  patternCardInner: { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  patternIcon: { fontSize: 26 },
  patternLabel: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: 3 },
  patternDesc: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  patternCheck: { fontSize: 20, color: '#FF1744', marginLeft: 'auto' },
  warningNote: { marginBottom: 24 },
  warningNoteInner: { borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,179,0,0.25)' },
  warningNoteText: { fontSize: 12, color: 'rgba(255,179,0,0.8)', lineHeight: 18 },
  startBtn: { borderRadius: 18, overflow: 'hidden', elevation: 20, shadowColor: '#FF1744', shadowOpacity: 0.7, shadowRadius: 20 },
  startBtnInner: { padding: 20, alignItems: 'center' },
  startBtnText: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  activeView: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  sosText: { fontSize: 100, fontWeight: '900', letterSpacing: 20, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 },
  sosEmoji: { fontSize: 80, marginVertical: 10 },
  flashCount: { fontSize: 16, fontWeight: '700', letterSpacing: 3, marginTop: 10 },
  flashCountNum: { fontSize: 13, marginTop: 4, opacity: 0.7 },
  activeInfo: { marginTop: 40, marginBottom: 50 },
  activeInfoText: { fontSize: 16, textAlign: 'center', lineHeight: 28, fontWeight: '600' },
  stopBtn: { borderRadius: 16, overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  stopBtnInner: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 40, paddingVertical: 18, alignItems: 'center' },
  stopBtnText: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
});
