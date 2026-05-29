import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Dimensions, ScrollView, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');

// ── Railway-station style announcement script ──────────────────────────────
const ANNOUNCEMENT_SCRIPT = [
  { text: 'Attention please.', pause: 600 },
  { text: 'Welcome to Road SOS.', pause: 400 },
  { text: "India's first AI-powered emergency navigation system.", pause: 700 },
  { text: 'Road SOS is now active and ready to assist you.', pause: 700 },
  { text: 'Feature one. Live GPS Navigation.', pause: 300 },
  { text: 'Navigate to the nearest hospital, police station, or emergency service in real time using live road routing.', pause: 800 },
  { text: 'Feature two. Emergency SOS Button.', pause: 300 },
  { text: 'Press the SOS button to instantly alert emergency services with your live GPS location. Works even on low signal using SMS bridge.', pause: 800 },
  { text: 'Feature three. AI Emergency Chatbot.', pause: 300 },
  { text: 'Get step-by-step guidance for any emergency — heart attack, accident, fire, choking, and more — from our real-time AI assistant.', pause: 800 },
  { text: 'Feature four. Real-time Nearby Services.', pause: 300 },
  { text: 'Find hospitals, police stations, fire stations, towing, fuel, and tyre shops near your live location, sorted by distance.', pause: 800 },
  { text: 'Feature five. Emergency Video Guides.', pause: 300 },
  { text: 'Watch expert tutorials for CPR, accident response, flat tyre, burns, snake bite, and twenty other emergency scenarios.', pause: 800 },
  { text: 'Feature six. Paramedic Card.', pause: 300 },
  { text: 'Store your blood type, medical conditions, allergies, and emergency contact for first responders to access instantly.', pause: 800 },
  { text: 'Feature seven. Crash Shield.', pause: 300 },
  { text: 'Automatic crash detection using accelerometer. Dispatches SOS if no response in fifteen seconds.', pause: 800 },
  { text: 'Feature eight. Night Beacon.', pause: 300 },
  { text: 'High-visibility strobe light for roadside emergencies in low-light conditions.', pause: 800 },
  { text: 'Important emergency numbers.', pause: 400 },
  { text: 'Ambulance — one zero eight.', pause: 300 },
  { text: 'Police — one zero zero.', pause: 300 },
  { text: 'Fire — one zero one.', pause: 300 },
  { text: 'Highway helpline — one zero three three.', pause: 600 },
  { text: 'Road SOS is developed by R B G Labs, Centre of Excellence for Road Safety, IIT Madras.', pause: 700 },
  { text: 'Road SOS is proudly built by Team Status 200.', pause: 400 },
  { text: 'Team members — Srikanth and Karthikeya.', pause: 700 },
  { text: 'Thank you for using Road SOS.', pause: 400 },
  { text: 'Stay alert. Stay safe. Drive responsibly.', pause: 800 },
  { text: 'This announcement will now repeat.', pause: 1200 },
];

const FEATURES = [
  { icon: '🗺️', title: 'Live GPS Navigation',     desc: 'Real road routing to nearest services',   color: '#4285F4' },
  { icon: '🆘', title: 'Emergency SOS',            desc: 'Instant GPS dispatch + SMS bridge',        color: '#FF1744' },
  { icon: '🤖', title: 'AI Emergency Chatbot',     desc: 'Step-by-step real-time AI guidance',       color: '#00B0FF' },
  { icon: '🏥', title: 'Live Nearby Services',     desc: 'Hospitals, police, fuel sorted by distance', color: '#00E676' },
  { icon: '🎬', title: 'Emergency Video Guides',   desc: '20 expert tutorials, plays in-app',        color: '#FFB300' },
  { icon: '🩺', title: 'Paramedic Card',           desc: 'Medical profile for first responders',     color: '#7C4DFF' },
  { icon: '🛡️', title: 'Crash Shield',            desc: 'Auto-detect crash, auto-dispatch SOS',     color: '#FF6B00' },
  { icon: '🔦', title: 'Night Beacon',             desc: 'Strobe light for roadside safety',         color: '#FFD700' },
];

export default function WelcomeScreen({ onDone }) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [scriptIdx,      setScriptIdx]      = useState(0);
  const [displayText,    setDisplayText]    = useState('');
  const [isSpeaking,     setIsSpeaking]     = useState(false);
  const [loopCount,      setLoopCount]      = useState(0);

  // Animations
  const speakerScale   = useRef(new Animated.Value(1)).current;
  const speakerGlow    = useRef(new Animated.Value(0.3)).current;
  const tickerX        = useRef(new Animated.Value(width)).current;
  const featureSlide   = useRef(new Animated.Value(30)).current;
  const featureOpacity = useRef(new Animated.Value(0)).current;
  const titleScale     = useRef(new Animated.Value(0.8)).current;
  const titleOpacity   = useRef(new Animated.Value(0)).current;
  const dot1           = useRef(new Animated.Value(0.3)).current;
  const dot2           = useRef(new Animated.Value(0.3)).current;
  const dot3           = useRef(new Animated.Value(0.3)).current;
  const boardFlip      = useRef(new Animated.Value(0)).current;
  const orbitSpin      = useRef(new Animated.Value(0)).current;

  // Ticker animation (continuous left scroll)
  const runTicker = useCallback(() => {
    tickerX.setValue(width);
    Animated.timing(tickerX, {
      toValue: -width * 2.5,
      duration: 18000,
      useNativeDriver: true,
    }).start(({ finished }) => { if (finished) runTicker(); });
  }, []);

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(titleScale,   { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    // Speaker pulse
    Animated.loop(Animated.sequence([
      Animated.timing(speakerScale, { toValue: 1.18, duration: 700, useNativeDriver: true }),
      Animated.timing(speakerScale, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(speakerGlow, { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.timing(speakerGlow, { toValue: 0.25,duration: 700, useNativeDriver: true }),
    ])).start();

    // Dots
    Animated.loop(Animated.stagger(250, [
      Animated.sequence([Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(dot1, { toValue: 0.3, duration: 400, useNativeDriver: true })]),
      Animated.sequence([Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(dot2, { toValue: 0.3, duration: 400, useNativeDriver: true })]),
      Animated.sequence([Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(dot3, { toValue: 0.3, duration: 400, useNativeDriver: true })]),
    ])).start();

    // Orbit spin
    Animated.loop(Animated.timing(orbitSpin, { toValue: 1, duration: 6000, useNativeDriver: true })).start();

    // Ticker
    runTicker();

    // Start announcement
    startAnnouncement(0);

    return () => {
      Speech.stop();
      tickerX.stopAnimation();
    };
  }, []);

  // Rotate through feature cards
  useEffect(() => {
    const t = setInterval(() => {
      featureSlide.setValue(30);
      featureOpacity.setValue(0);
      setCurrentFeature(i => (i + 1) % FEATURES.length);
      Animated.parallel([
        Animated.spring(featureSlide,   { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
        Animated.timing(featureOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 3200);
    return () => clearInterval(t);
  }, []);

  const startAnnouncement = async (startIdx) => {
    let idx = startIdx;
    const speakNext = async () => {
      if (idx >= ANNOUNCEMENT_SCRIPT.length) {
        idx = 0;
        setLoopCount(c => c + 1);
      }
      const item = ANNOUNCEMENT_SCRIPT[idx];
      setScriptIdx(idx);
      setDisplayText(item.text);
      setIsSpeaking(true);

      // Flip board animation
      Animated.sequence([
        Animated.timing(boardFlip, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(boardFlip, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();

      await new Promise(resolve => {
        Speech.speak(item.text, {
          language: 'en-IN',
          pitch: 0.95,
          rate: 0.82,
          onDone: () => {
            setIsSpeaking(false);
            setTimeout(resolve, item.pause);
          },
          onError: () => {
            setIsSpeaking(false);
            setTimeout(resolve, item.pause);
          },
          onStopped: () => {
            setIsSpeaking(false);
            resolve();
          },
        });
      });

      idx++;
      speakNext();
    };
    speakNext();
  };

  const spinDeg = orbitSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const flipScale = boardFlip.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.96, 1] });

  const feature = FEATURES[currentFeature];
  const scriptLine = ANNOUNCEMENT_SCRIPT[scriptIdx];

  return (
    <LinearGradient colors={['#02040A', '#050810', '#02040A']} style={st.container}>
      <StatusBar backgroundColor="#02040A" barStyle="light-content" />

      {/* Background grid lines */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {[0.18, 0.36, 0.55, 0.72, 0.89].map((f, i) => (
          <View key={i} style={[st.gridH, { top: height * f }]} />
        ))}
        {[0.2, 0.5, 0.8].map((f, i) => (
          <View key={i} style={[st.gridV, { left: width * f }]} />
        ))}
      </View>

      {/* ── TOP: PA speaker + logo ── */}
      <View style={st.topSection}>
        {/* Orbital speaker badge */}
        <View style={st.speakerWrap}>
          <Animated.View style={[st.speakerOrbit, { transform: [{ perspective: 400 }, { rotateX: '65deg' }, { rotateZ: spinDeg }] }]} />
          <Animated.View style={[st.speakerGlow, { opacity: speakerGlow }]} />
          <Animated.View style={[st.speakerCircle, { transform: [{ scale: speakerScale }] }]}>
            <LinearGradient colors={['rgba(255,179,0,0.3)', 'rgba(255,107,0,0.2)']} style={st.speakerGrad}>
              <Text style={st.speakerIcon}>📢</Text>
            </LinearGradient>
          </Animated.View>
          {/* PA indicator dots */}
          <View style={st.paDotsRow}>
            {[dot1, dot2, dot3].map((d, i) => (
              <Animated.View key={i} style={[st.paDot, { opacity: d }]} />
            ))}
          </View>
        </View>

        {/* Title */}
        <Animated.View style={{ transform: [{ scale: titleScale }], opacity: titleOpacity, alignItems: 'center' }}>
          <Text style={st.paLabel}>◆ PUBLIC ADDRESS SYSTEM ◆</Text>
          <Text style={st.titleMain}>ROAD<Text style={st.titleRed}>SOS</Text></Text>
          <Text style={st.titleSub}>EMERGENCY NAVIGATION SYSTEM</Text>
        </Animated.View>
      </View>

      {/* ── ANNOUNCEMENT BOARD ── */}
      <View style={st.boardSection}>
        <LinearGradient colors={['#0A0E18', '#060A14']} style={st.board}>
          {/* Board header */}
          <LinearGradient colors={['#FFB300', '#FF8C00']} style={st.boardHeader}>
            <Text style={st.boardHeaderText}>◀ ANNOUNCEMENT ▶</Text>
          </LinearGradient>

          {/* Display text — flip-board style */}
          <Animated.View style={[st.boardContent, { transform: [{ scaleY: flipScale }] }]}>
            <Text style={st.boardText}>{displayText || 'Preparing announcement…'}</Text>
          </Animated.View>

          {/* Speaking indicator */}
          <View style={st.boardFooter}>
            <View style={[st.speakingDot, { backgroundColor: isSpeaking ? '#00E676' : '#333' }]} />
            <Text style={[st.speakingLabel, { color: isSpeaking ? '#00E676' : '#444' }]}>
              {isSpeaking ? 'SPEAKING' : 'PROCESSING'}
            </Text>
            <Text style={st.loopBadge}>Loop {loopCount + 1}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* ── FEATURE CARD (rotating) ── */}
      <View style={st.featureSection}>
        <Text style={st.featureLabel}>FEATURES</Text>
        <Animated.View style={[st.featureCard, {
          transform: [{ translateY: featureSlide }],
          opacity: featureOpacity,
          borderColor: `${feature.color}40`,
          shadowColor: feature.color,
        }]}>
          <LinearGradient colors={[`${feature.color}15`, 'rgba(8,12,20,0.9)']} style={st.featureCardInner}>
            <View style={[st.featureIconCircle, { backgroundColor: `${feature.color}20`, borderColor: `${feature.color}40`,
              shadowColor: feature.color, shadowOpacity: 0.6, shadowRadius: 10 }]}>
              <Text style={st.featureIcon}>{feature.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.featureTitle, { color: feature.color }]}>{feature.title}</Text>
              <Text style={st.featureDesc}>{feature.desc}</Text>
            </View>
            <Text style={st.featureNum}>{currentFeature + 1}/{FEATURES.length}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Feature progress dots */}
        <View style={st.featureDots}>
          {FEATURES.map((_, i) => (
            <View key={i} style={[st.featureDot, i === currentFeature && { backgroundColor: feature.color, width: 16 }]} />
          ))}
        </View>
      </View>

      {/* ── SCROLLING TICKER ── */}
      <View style={st.tickerWrap}>
        <LinearGradient colors={['#FFB300', '#FF8C00']} style={st.tickerBar}>
          <Animated.Text style={[st.tickerText, { transform: [{ translateX: tickerX }] }]}>
            {'  ◆  AMBULANCE: 108   ◆   POLICE: 100   ◆   FIRE: 101   ◆   HIGHWAY: 1033   ◆   AI EMERGENCY GUIDE ACTIVE   ◆   GPS TRACKING LIVE   ◆   SMS BRIDGE READY   ◆   BUILT BY RBG LABS, IIT MADRAS   ◆   STAY SAFE ON INDIAN ROADS   ◆  '}
          </Animated.Text>
        </LinearGradient>
      </View>

      {/* ── EMERGENCY NUMBERS ── */}
      <View style={st.numbersRow}>
        {[
          { n: '108', label: 'AMBULANCE', color: '#FF1744' },
          { n: '100', label: 'POLICE',    color: '#4285F4' },
          { n: '101', label: 'FIRE',      color: '#FF6B00' },
          { n: '1033',label: 'HIGHWAY',   color: '#FFB300' },
        ].map(e => (
          <View key={e.n} style={[st.numCard, { borderColor: `${e.color}40`,
            shadowColor: e.color, shadowOpacity: 0.3, shadowRadius: 8 }]}>
            <LinearGradient colors={[`${e.color}15`, 'transparent']} style={st.numCardInner}>
              <Text style={[st.numVal, { color: e.color }]}>{e.n}</Text>
              <Text style={st.numLabel}>{e.label}</Text>
            </LinearGradient>
          </View>
        ))}
      </View>

      {/* ── ENTER BUTTON ── */}
      <View style={st.enterRow}>
        <TouchableOpacity onPress={onDone} activeOpacity={0.85}>
          <LinearGradient colors={['#FF3060', '#FF1744', '#CC001A']} style={st.enterBtn}>
            <LinearGradient colors={['rgba(255,255,255,0.2)', 'transparent']} style={st.enterShine} />
            <Text style={st.enterText}>ENTER ROAD SOS  ▶</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { Speech.stop(); onDone(); }} style={st.skipBtn}>
          <Text style={st.skipText}>Skip announcement</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom credit */}
      <Text style={st.credit}>CoERS · RBG Labs · IIT Madras</Text>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },

  // Grid
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.025)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.025)' },

  // Top section
  topSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 44, paddingBottom: 12, gap: 14 },

  // Speaker
  speakerWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  speakerOrbit: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    borderWidth: 1.5, borderColor: 'rgba(255,179,0,0.55)', backgroundColor: 'transparent',
  },
  speakerGlow: {
    position: 'absolute', width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,179,0,0.15)',
    shadowColor: '#FFB300', shadowOpacity: 1, shadowRadius: 20,
  },
  speakerCircle: {
    width: 58, height: 58, borderRadius: 29, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,179,0,0.5)',
    elevation: 12, shadowColor: '#FFB300', shadowOpacity: 0.7, shadowRadius: 16,
  },
  speakerGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  speakerIcon: { fontSize: 28 },
  paDotsRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  paDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFB300',
    shadowColor: '#FFB300', shadowOpacity: 1, shadowRadius: 4 },

  // Title
  paLabel: { fontSize: 9, fontWeight: '800', color: '#FFB300', letterSpacing: 2.5, marginBottom: 4 },
  titleMain: { fontSize: 42, fontWeight: '900', color: '#FFF', letterSpacing: 4 },
  titleRed: { color: '#FF1744' },
  titleSub: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, marginTop: 2 },

  // Announcement board
  boardSection: { marginHorizontal: 16, marginBottom: 12 },
  board: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,179,0,0.3)',
    shadowColor: '#FFB300', shadowOpacity: 0.2, shadowRadius: 14, elevation: 12 },
  boardHeader: { paddingVertical: 7, alignItems: 'center' },
  boardHeaderText: { fontSize: 11, fontWeight: '900', color: '#000', letterSpacing: 2 },
  boardContent: { minHeight: 64, padding: 14, justifyContent: 'center' },
  boardText: { fontSize: 15, fontWeight: '700', color: '#FFF', lineHeight: 22, letterSpacing: 0.3, textAlign: 'center' },
  boardFooter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', gap: 8 },
  speakingDot: { width: 8, height: 8, borderRadius: 4 },
  speakingLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, flex: 1 },
  loopBadge: { fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },

  // Feature card
  featureSection: { marginHorizontal: 16, marginBottom: 10 },
  featureLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 3, marginBottom: 8 },
  featureCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', elevation: 10 },
  featureCardInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  featureIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  featureIcon: { fontSize: 24 },
  featureTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  featureDesc: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  featureNum: { fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: '700' },
  featureDots: { flexDirection: 'row', gap: 5, justifyContent: 'center', marginTop: 8 },
  featureDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Ticker
  tickerWrap: { marginBottom: 10, overflow: 'hidden' },
  tickerBar: { paddingVertical: 8, paddingHorizontal: 0 },
  tickerText: { fontSize: 12, fontWeight: '800', color: '#000', letterSpacing: 1.5, whiteSpace: 'nowrap' },

  // Emergency numbers
  numbersRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  numCard: { flex: 1, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  numCardInner: { alignItems: 'center', paddingVertical: 10 },
  numVal: { fontSize: 18, fontWeight: '900' },
  numLabel: { fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },

  // Enter button
  enterRow: { alignItems: 'center', gap: 10, marginBottom: 8, paddingHorizontal: 16 },
  enterBtn: {
    borderRadius: 18, paddingVertical: 16, paddingHorizontal: 48,
    overflow: 'hidden',
    elevation: 20, shadowColor: '#FF1744', shadowOpacity: 0.7, shadowRadius: 20,
  },
  enterShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 24, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  enterText: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  skipText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },

  credit: { fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', letterSpacing: 1.5, marginBottom: 10 },
});
