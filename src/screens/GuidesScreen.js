import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, Image, Modal, StatusBar, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width, height } = Dimensions.get('window');
const PLAYER_HEIGHT = Math.round(width * 9 / 16);

const CATEGORIES = ['All', 'Medical', 'Road', 'Vehicle', 'Safety'];

const GUIDES = [
  // ── Medical ──────────────────────────────────────────────────────────
  { id: 1,  cat: 'Medical',  title: 'How to Do CPR',               desc: 'Adult CPR step-by-step — 30 compressions + 2 breaths',                        icon: '❤️', color: '#FF1744', bg: 'rgba(255,23,68,0.12)',   duration: '4 min', videoId: '6eRwgM2Pa4o' },
  { id: 2,  cat: 'Medical',  title: 'Stop Severe Bleeding',         desc: 'Applying pressure, improvised tourniquet, wound packing',                       icon: '🩸', color: '#FF1744', bg: 'rgba(255,23,68,0.12)',   duration: '5 min', videoId: 'NxO5LvgqZe0' },
  { id: 3,  cat: 'Medical',  title: 'Choking — Heimlich Maneuver',  desc: 'Adult & child choking response — back blows + abdominal thrusts',               icon: '😮', color: '#FF6B00', bg: 'rgba(255,107,0,0.12)',  duration: '3 min', videoId: 'WeY4KJUnfMc' },
  { id: 4,  cat: 'Medical',  title: 'Heart Attack First Aid',       desc: 'Recognising and responding to a heart attack before help arrives',               icon: '💔', color: '#FF1744', bg: 'rgba(255,23,68,0.12)',   duration: '4 min', videoId: 'gDwt7dD3awc' },
  { id: 5,  cat: 'Medical',  title: 'Treating Burns',               desc: 'Cool, cover, call — correct first aid for burns & scalds',                      icon: '🔥', color: '#FF6B00', bg: 'rgba(255,107,0,0.12)',  duration: '3 min', videoId: 'dQozahCH8IE' },
  { id: 6,  cat: 'Medical',  title: 'Recovery Position',            desc: 'How to place an unconscious casualty safely',                                    icon: '😴', color: '#00B0FF', bg: 'rgba(0,176,255,0.12)',  duration: '2 min', videoId: 'TRQePNmR66w' },
  { id: 7,  cat: 'Medical',  title: 'Fracture & Bone Injury',       desc: 'Immobilising broken bones with improvised splints',                              icon: '🦴', color: '#FFB300', bg: 'rgba(255,179,0,0.12)', duration: '5 min', videoId: '2v8vlXgGXwE' },
  { id: 8,  cat: 'Medical',  title: 'Snake Bite First Aid',         desc: 'Keep still, mark bite, reach hospital — do NOT suck venom',                     icon: '🐍', color: '#7C4DFF', bg: 'rgba(124,77,255,0.12)', duration: '4 min', videoId: 'fSJ7WIEDpjU' },
  // ── Road ─────────────────────────────────────────────────────────────
  { id: 9,  cat: 'Road',     title: 'Road Accident Response',       desc: 'What to do in the first 5 minutes at an accident scene',                         icon: '🚗', color: '#FF6B00', bg: 'rgba(255,107,0,0.12)',  duration: '6 min', videoId: 'NnmsmT3U-2Q' },
  { id: 10, cat: 'Road',     title: 'Mass Casualty Triage (START)', desc: 'Field triage for multiple victims — Red/Yellow/Green/Black',                     icon: '🚑', color: '#7C4DFF', bg: 'rgba(124,77,255,0.12)', duration: '7 min', videoId: 'YZ2CXxlP8Ow' },
  { id: 11, cat: 'Road',     title: 'Moving a Crash Victim Safely', desc: 'When and how to move someone — spinal injury precautions',                       icon: '🛡️', color: '#00B0FF', bg: 'rgba(0,176,255,0.12)',  duration: '5 min', videoId: 'Uqy2IUhYkVA' },
  { id: 12, cat: 'Road',     title: 'Vehicle Fire Evacuation',      desc: 'Get out fast — how to escape and what NOT to do',                                 icon: '🔥', color: '#FF6B00', bg: 'rgba(255,107,0,0.12)',  duration: '4 min', videoId: 'TNIws_hLuvo' },
  { id: 13, cat: 'Road',     title: 'Drowning Rescue',              desc: 'Reach, throw, row — safe water rescue without drowning yourself',                  icon: '🌊', color: '#00B0FF', bg: 'rgba(0,176,255,0.12)',  duration: '5 min', videoId: '9uaG2ITdxqw' },
  // ── Vehicle ───────────────────────────────────────────────────────────
  { id: 14, cat: 'Vehicle',  title: 'How to Change a Flat Tyre',    desc: 'Jack, loosen bolts, swap spare — complete roadside guide',                       icon: '🔧', color: '#FFB300', bg: 'rgba(255,179,0,0.12)', duration: '8 min', videoId: 'atI_q-Sskf0' },
  { id: 15, cat: 'Vehicle',  title: 'Jump-Start a Dead Battery',    desc: 'Correct cable order to jump-start without damaging your car',                    icon: '⚡', color: '#FFB300', bg: 'rgba(255,179,0,0.12)', duration: '5 min', videoId: 'sTkwMUEqQHk' },
  { id: 16, cat: 'Vehicle',  title: 'Overheating Engine',           desc: 'Safe steps when your temperature gauge hits red',                                icon: '🌡️', color: '#FF6B00', bg: 'rgba(255,107,0,0.12)',  duration: '4 min', videoId: '8KAszximKhw' },
  { id: 17, cat: 'Vehicle',  title: 'Brake Failure Emergency',      desc: 'Engine braking, hand brake, controlled crash — how to stop',                     icon: '🛑', color: '#FF1744', bg: 'rgba(255,23,68,0.12)',   duration: '5 min', videoId: 'oLlC65n2qBA' },
  // ── Safety ────────────────────────────────────────────────────────────
  { id: 18, cat: 'Safety',   title: 'Highway Safety Tips',          desc: 'Lane discipline, warning triangles, night driving essentials',                   icon: '🛣️', color: '#00E676', bg: 'rgba(0,230,118,0.12)',  duration: '6 min', videoId: 'BpDhGEs5tdY' },
  { id: 19, cat: 'Safety',   title: 'Electric Shock First Aid',     desc: 'Cut power first, then help — do not touch with bare hands',                      icon: '⚡', color: '#FFB300', bg: 'rgba(255,179,0,0.12)', duration: '3 min', videoId: 'xDQi1I04mXc' },
  { id: 20, cat: 'Safety',   title: 'Fire Extinguisher (PASS)',     desc: 'Pull, Aim, Squeeze, Sweep — the correct technique',                              icon: '🧯', color: '#FF6B00', bg: 'rgba(255,107,0,0.12)',  duration: '3 min', videoId: 'uKoCnunmfJQ' },
];

// ── In-app video player modal ──────────────────────────────────────────────
function VideoPlayerModal({ guide, onClose }) {
  const [playing,   setPlaying]   = useState(true);
  const [ready,     setReady]     = useState(false);
  const insets = useSafeAreaInsets();

  const onStateChange = useCallback((state) => {
    if (state === 'ended') setPlaying(false);
  }, []);

  if (!guide) return null;

  return (
    <Modal
      visible={!!guide}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={mp.container}>

        {/* Player area */}
        <View style={mp.playerWrap}>
          {!ready && (
            <View style={mp.playerLoader}>
              <ActivityIndicator color={guide.color} size="large" />
              <Text style={mp.loadingText}>Loading video…</Text>
            </View>
          )}
          <YoutubePlayer
            height={PLAYER_HEIGHT}
            width={width}
            play={playing}
            videoId={guide.videoId}
            onReady={() => setReady(true)}
            onChangeState={onStateChange}
            webViewProps={{ allowsFullscreenVideo: true }}
          />
        </View>

        {/* Info panel */}
        <LinearGradient colors={['#080C14', '#0D1421']} style={[mp.infoPanel, { paddingBottom: insets.bottom + 16 }]}>

          {/* Close bar */}
          <TouchableOpacity onPress={onClose} style={mp.closeBar}>
            <View style={mp.closePill} />
          </TouchableOpacity>

          {/* Category + duration row */}
          <View style={mp.metaRow}>
            <View style={[mp.catChip, { backgroundColor: `${guide.color}20`, borderColor: `${guide.color}50` }]}>
              <Text style={[mp.catChipText, { color: guide.color }]}>{guide.icon}  {guide.cat.toUpperCase()}</Text>
            </View>
            <View style={mp.durationChip}>
              <Text style={mp.durationChipText}>🕐 {guide.duration}</Text>
            </View>
          </View>

          <Text style={mp.title}>{guide.title}</Text>
          <Text style={mp.desc}>{guide.desc}</Text>

          {/* Playback controls */}
          <View style={mp.controls}>
            <TouchableOpacity
              style={[mp.playBtn, { backgroundColor: guide.color }]}
              onPress={() => setPlaying(p => !p)}
            >
              <Text style={mp.playBtnText}>{playing ? '⏸  PAUSE' : '▶  PLAY'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={mp.closeBtn} onPress={onClose}>
              <Text style={mp.closeBtnText}>✕  CLOSE</Text>
            </TouchableOpacity>
          </View>

          {/* Progress hint */}
          <Text style={mp.hint}>Tip: Tap fullscreen icon in player for landscape view</Text>
        </LinearGradient>
      </View>
    </Modal>
  );
}

// ── Video card ─────────────────────────────────────────────────────────────
function VideoCard({ guide, index, onPlay }) {
  const scale      = useRef(new Animated.Value(1)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const opacityAnim= useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: 0, duration: 350, delay: (index % 6) * 70, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, delay: (index % 6) * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
    ]).start(() => onPlay(guide));
  };

  const thumbUrl = `https://img.youtube.com/vi/${guide.videoId}/hqdefault.jpg`;

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }, { scale }], opacity: opacityAnim, marginBottom: 14 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.92}>
        <LinearGradient colors={[guide.bg, 'rgba(13,20,33,0.95)']} style={[styles.card, { borderColor: `${guide.color}25` }]}>
          <View style={[styles.accentBar, { backgroundColor: guide.color }]} />

          {/* Thumbnail */}
          <View style={styles.thumbWrap}>
            <Image source={{ uri: thumbUrl }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.playOverlay}>
              <LinearGradient colors={[`${guide.color}EE`, `${guide.color}AA`]} style={styles.playCircle}>
                <Text style={styles.playIcon}>▶</Text>
              </LinearGradient>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{guide.duration}</Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <View style={styles.cardIconRow}>
              <Text style={styles.cardEmoji}>{guide.icon}</Text>
              <View style={[styles.catBadge, { backgroundColor: `${guide.color}20`, borderColor: `${guide.color}40` }]}>
                <Text style={[styles.catText, { color: guide.color }]}>{guide.cat.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{guide.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{guide.desc}</Text>
            <View style={styles.watchRow}>
              <View style={[styles.watchBtn, { backgroundColor: `${guide.color}20`, borderColor: `${guide.color}50` }]}>
                <Text style={[styles.watchText, { color: guide.color }]}>▶ WATCH IN-APP</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function GuidesScreen({ navigation }) {
  const [filter,       setFilter]       = useState('All');
  const [activeGuide,  setActiveGuide]  = useState(null);

  const filtered = filter === 'All' ? GUIDES : GUIDES.filter(g => g.cat === filter);

  return (
    <LinearGradient colors={['#080C14', '#0A1020', '#080C14']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>EMERGENCY <Text style={styles.headerBlue}>GUIDES</Text></Text>
            <Text style={styles.headerSub}>{GUIDES.length} video guides · plays in-app</Text>
          </View>
          <View style={styles.inAppBadge}>
            <Text style={styles.inAppText}>▶ IN-APP</Text>
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setFilter(cat)}
              style={[styles.filterChip, filter === cat && styles.filterChipActive]}>
              <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.count}>{filtered.length} guides</Text>

        {/* Cards */}
        <ScrollView style={styles.list} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}>
          {filtered.map((guide, i) => (
            <VideoCard key={guide.id} guide={guide} index={i} onPlay={setActiveGuide} />
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* In-app player modal */}
      <VideoPlayerModal guide={activeGuide} onClose={() => setActiveGuide(null)} />
    </LinearGradient>
  );
}

// ── Player modal styles ────────────────────────────────────────────────────
const mp = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  playerWrap: { width, height: PLAYER_HEIGHT, backgroundColor: '#000' },
  playerLoader: { position: 'absolute', width, height: PLAYER_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 1 },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  infoPanel: { flex: 1, paddingHorizontal: 20, paddingTop: 4 },
  closeBar: { alignItems: 'center', paddingVertical: 10 },
  closePill: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  catChipText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  durationChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  durationChipText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '900', color: '#FFF', marginBottom: 8, lineHeight: 26 },
  desc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20, marginBottom: 24 },
  controls: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  playBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  playBtnText: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  closeBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  hint: { fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', letterSpacing: 0.3 },
});

// ── Card list styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#FFF', fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  headerBlue: { color: '#00B0FF' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  inAppBadge: { backgroundColor: 'rgba(0,176,255,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(0,176,255,0.4)' },
  inAppText: { fontSize: 10, color: '#00B0FF', fontWeight: '800' },
  filterRow: { maxHeight: 50, marginTop: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterChipActive: { backgroundColor: 'rgba(0,176,255,0.2)', borderColor: 'rgba(0,176,255,0.5)' },
  filterText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  filterTextActive: { color: '#00B0FF' },
  count: { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, paddingHorizontal: 16, marginTop: 10, marginBottom: 6 },
  list: { flex: 1 },
  card: { borderRadius: 18, padding: 14, flexDirection: 'row', gap: 12, borderWidth: 1, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10 },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  thumbWrap: { width: 110, height: 80, borderRadius: 12, overflow: 'hidden', flexShrink: 0, backgroundColor: '#0D1421' },
  thumb: { width: '100%', height: '100%' },
  playOverlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  playCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 14, color: '#FFF', marginLeft: 2 },
  durationBadge: { position: 'absolute', bottom: 5, right: 6, backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  durationText: { fontSize: 10, color: '#FFF', fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  cardEmoji: { fontSize: 18 },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  catText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardTitle: { fontSize: 13.5, fontWeight: '800', color: '#FFF', lineHeight: 19, marginBottom: 3 },
  cardDesc: { fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 15, marginBottom: 8 },
  watchRow: { flexDirection: 'row' },
  watchBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  watchText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
