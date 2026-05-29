import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// 3D orbital ring: a circle with perspective+rotateX looks like a tilted ellipse in 3D space
function OrbitalRing({ size, color, tiltX, tiltZ = '0deg', animated = false, spin, opacity = 0.6, borderWidth = 1.5 }) {
  const style = {
    position: 'absolute',
    width: size, height: size, borderRadius: size / 2,
    borderWidth, borderColor: color,
    transform: animated && spin
      ? [{ perspective: 700 }, { rotateX: tiltX }, { rotateZ: spin }]
      : [{ perspective: 700 }, { rotateX: tiltX }, { rotateZ: tiltZ }],
    opacity,
  };
  return <View style={style} />;
}

// Floating particle dot
function Particle({ x, y, size, color, delay, anim }) {
  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color,
      opacity: anim,
    }} />
  );
}

export default function SplashScreen({ onDone }) {
  const scale      = useRef(new Animated.Value(0.2)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const rockX      = useRef(new Animated.Value(0)).current;
  const rockY      = useRef(new Animated.Value(0)).current;
  const spin       = useRef(new Animated.Value(0)).current;
  const spin2      = useRef(new Animated.Value(0)).current;
  const glow       = useRef(new Animated.Value(0.5)).current;
  const tagOp      = useRef(new Animated.Value(0)).current;
  const badgeOp    = useRef(new Animated.Value(0)).current;
  const progressW  = useRef(new Animated.Value(0)).current;

  // Particle opacities
  const p1 = useRef(new Animated.Value(0)).current;
  const p2 = useRef(new Animated.Value(0)).current;
  const p3 = useRef(new Animated.Value(0)).current;
  const p4 = useRef(new Animated.Value(0)).current;
  const p5 = useRef(new Animated.Value(0)).current;
  const p6 = useRef(new Animated.Value(0)).current;

  function pulsePart(a, delay) {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(a, { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.1, duration: 700, useNativeDriver: true }),
    ])).start();
  }

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, tension: 45, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();

    // 3D orbital ring spin
    Animated.loop(Animated.timing(spin,  { toValue: 1, duration: 6000, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(spin2, { toValue: 1, duration: 9000, useNativeDriver: true })).start();

    // Gentle 3D rocking on logo
    Animated.loop(Animated.sequence([
      Animated.timing(rockX, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(rockX, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(rockY, { toValue: 1, duration: 3000, useNativeDriver: true }),
      Animated.timing(rockY, { toValue: 0, duration: 3000, useNativeDriver: true }),
    ])).start();

    // Glow pulse
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1,   duration: 1200, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
    ])).start();

    // Particles
    pulsePart(p1, 0); pulsePart(p2, 300); pulsePart(p3, 600);
    pulsePart(p4, 150); pulsePart(p5, 450); pulsePart(p6, 750);

    // Text entry
    setTimeout(() => Animated.timing(tagOp, { toValue: 1, duration: 800, useNativeDriver: true }).start(), 700);
    setTimeout(() => Animated.timing(badgeOp, { toValue: 1, duration: 700, useNativeDriver: true }).start(), 1200);

    // Progress bar
    Animated.timing(progressW, { toValue: width - 80, duration: 2900, useNativeDriver: false }).start();

    setTimeout(onDone, 3400);
  }, []);

  const spinDeg  = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spin2Deg = spin2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const rockXDeg = rockX.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });
  const rockYDeg = rockY.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] });

  return (
    <LinearGradient colors={['#04060E', '#080C14', '#04060E']} style={styles.container}>

      {/* Radial background glow */}
      <Animated.View style={[styles.bgGlow, { opacity: glow }]} />

      {/* 3D Orbital rings — perspective+rotateX = tilted ellipse = 3D orbit */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* Orbit ring 1 — static tilt */}
        <View style={[styles.orbitRing, { width: 260, height: 260, borderRadius: 130, top: height/2 - 130, left: width/2 - 130,
          borderColor: 'rgba(255,23,68,0.35)', transform: [{ perspective: 700 }, { rotateX: '70deg' }] }]} />

        {/* Orbit ring 2 — different plane */}
        <View style={[styles.orbitRing, { width: 310, height: 310, borderRadius: 155, top: height/2 - 155, left: width/2 - 155,
          borderColor: 'rgba(255,107,0,0.2)', transform: [{ perspective: 700 }, { rotateX: '75deg' }, { rotateZ: '60deg' }] }]} />

        {/* Animated spinning orbit */}
        <Animated.View style={[styles.orbitRing, { width: 360, height: 360, borderRadius: 180, top: height/2 - 180, left: width/2 - 180,
          borderColor: 'rgba(0,176,255,0.18)', transform: [{ perspective: 700 }, { rotateX: '72deg' }, { rotateZ: spinDeg }] }]} />

        {/* Animated counter-spin orbit */}
        <Animated.View style={[styles.orbitRing, { width: 280, height: 280, borderRadius: 140, top: height/2 - 140, left: width/2 - 140,
          borderColor: 'rgba(124,77,255,0.2)', transform: [{ perspective: 700 }, { rotateX: '68deg' }, { rotateZ: spin2Deg }],
          borderWidth: 1 }]} />

        {/* Outer glow ring */}
        <View style={[styles.orbitRing, { width: 420, height: 420, borderRadius: 210, top: height/2 - 210, left: width/2 - 210,
          borderColor: 'rgba(255,23,68,0.08)', borderWidth: 1, transform: [{ perspective: 700 }, { rotateX: '78deg' }] }]} />
      </View>

      {/* Particles */}
      <Particle x={width*0.15} y={height*0.22} size={5} color="#FF1744" anim={p1} />
      <Particle x={width*0.82} y={height*0.28} size={4} color="#00B0FF" anim={p2} />
      <Particle x={width*0.10} y={height*0.68} size={6} color="#FF6B00" anim={p3} />
      <Particle x={width*0.88} y={height*0.65} size={4} color="#7C4DFF" anim={p4} />
      <Particle x={width*0.50} y={height*0.18} size={5} color="#00E676" anim={p5} />
      <Particle x={width*0.70} y={height*0.78} size={4} color="#FF1744" anim={p6} />

      {/* 3D rocking logo */}
      <Animated.View style={[styles.logoWrap, { opacity, transform: [
        { scale },
        { perspective: 600 },
        { rotateX: rockXDeg },
        { rotateY: rockYDeg },
      ]}]}>
        {/* Outer shadow ring */}
        <Animated.View style={[styles.glowRing, { opacity: glow }]} />

        <LinearGradient
          colors={['#FF4060', '#FF1744', '#CC001A', '#FF1744']}
          style={styles.logoCircle}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          {/* Inner 3D depth layers */}
          <View style={styles.logoInner3D}>
            <LinearGradient colors={['rgba(255,255,255,0.25)', 'transparent']} style={styles.logoShine} />
            <Text style={styles.logoEmoji}>🆘</Text>
          </View>
        </LinearGradient>

        {/* Bottom shadow for 3D depth */}
        <View style={styles.logo3DShadow} />
      </Animated.View>

      {/* App name */}
      <Animated.View style={[styles.textWrap, { opacity }]}>
        <Text style={styles.appName}>ROAD<Text style={styles.appNameRed}>SOS</Text></Text>
        <View style={styles.subtitleRow}>
          <View style={styles.subtitleLine} />
          <Text style={styles.appSub}>EMERGENCY NAVIGATION SYSTEM</Text>
          <View style={styles.subtitleLine} />
        </View>
      </Animated.View>

      {/* Tagline + badges */}
      <Animated.View style={[styles.taglineWrap, { opacity: tagOp }]}>
        <Text style={styles.tagline}>"Every Second Saves a Life"</Text>
      </Animated.View>

      <Animated.View style={[styles.badgeRow, { opacity: badgeOp }]}>
        {[
          { icon: '📡', text: 'LIVE GPS', color: '#00E676' },
          { icon: '🤖', text: 'REAL AI', color: '#00B0FF' },
          { icon: '🗺️', text: 'LIVE MAP', color: '#FFB300' },
          { icon: '🏥', text: 'OSM DATA', color: '#FF6B00' },
        ].map(b => (
          <View key={b.text} style={[styles.badge, { borderColor: `${b.color}40`, backgroundColor: `${b.color}12` }]}>
            <Text style={styles.badgeIcon}>{b.icon}</Text>
            <Text style={[styles.badgeText, { color: b.color }]}>{b.text}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: progressW }]} />
      </View>
      <Text style={styles.loadingText}>INITIALISING EMERGENCY SYSTEMS...</Text>

      {/* Bottom credits */}
      <View style={styles.creditsRow}>
        <View style={styles.creditsDivider} />
        <Text style={styles.creditsText}>CoERS · RBG Labs · IIT Madras</Text>
        <View style={styles.creditsDivider} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bgGlow: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(255,23,68,0.06)',
    top: height / 2 - 200, left: width / 2 - 200,
  },
  orbitRing: {
    position: 'absolute', borderWidth: 1.5, backgroundColor: 'transparent',
  },
  logoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  glowRing: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,23,68,0.2)',
    shadowColor: '#FF1744', shadowOpacity: 1, shadowRadius: 40, shadowOffset: { width: 0, height: 0 },
  },
  logoCircle: {
    width: 130, height: 130, borderRadius: 65,
    alignItems: 'center', justifyContent: 'center',
    elevation: 40,
    shadowColor: '#FF1744', shadowOpacity: 0.9, shadowRadius: 35, shadowOffset: { width: 0, height: 15 },
    overflow: 'hidden',
  },
  logoInner3D: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  logoShine: {
    position: 'absolute', top: -65, left: -65, width: 130, height: 130, borderRadius: 65,
  },
  logoEmoji: { fontSize: 62 },
  logo3DShadow: {
    width: 110, height: 18, borderRadius: 55,
    backgroundColor: 'rgba(255,23,68,0.25)',
    marginTop: 10, alignSelf: 'center',
    shadowColor: '#FF1744', shadowOpacity: 0.5, shadowRadius: 12,
  },
  textWrap: { alignItems: 'center', marginBottom: 16 },
  appName: { fontSize: 52, fontWeight: '900', color: '#FFF', letterSpacing: 5 },
  appNameRed: { color: '#FF1744' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  subtitleLine: { height: 1, width: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  appSub: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 3 },
  taglineWrap: { alignItems: 'center', marginBottom: 22 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', letterSpacing: 0.5 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 44 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  badgeIcon: { fontSize: 12 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  progressBar: { width: width - 80, height: 3, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: '#FF1744', shadowColor: '#FF1744', shadowOpacity: 1, shadowRadius: 8 },
  loadingText: { fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 3 },
  creditsRow: { position: 'absolute', bottom: 28, flexDirection: 'row', alignItems: 'center', gap: 10 },
  creditsDivider: { height: 1, width: 30, backgroundColor: 'rgba(255,255,255,0.15)' },
  creditsText: { fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 2 },
});
