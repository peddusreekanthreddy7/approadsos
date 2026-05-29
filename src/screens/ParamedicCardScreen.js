import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

const CONSCIOUSNESS_LEVELS = [
  { id: 'A', label: 'ALERT', desc: 'Fully conscious', color: '#00E676' },
  { id: 'V', label: 'VOICE', desc: 'Responds to voice', color: '#FFB300' },
  { id: 'P', label: 'PAIN', desc: 'Responds to pain only', color: '#FF6B00' },
  { id: 'U', label: 'UNRESPONSIVE', desc: 'No response', color: '#FF1744' },
];

const INJURY_OPTIONS = [
  '🩸 Severe bleeding', '🦴 Suspected fracture', '🧠 Head injury',
  '🫁 Breathing difficulty', '🫀 Chest pain', '🔥 Burns', '👁️ Eye injury', '🩹 Lacerations',
];

const FIRSTAID_OPTIONS = [
  '🩸 Direct pressure applied', '🩹 Wound cleaned & covered', '🦴 Limb immobilized',
  '💉 Tourniquet applied', '🫁 CPR initiated', '🛡️ Recovery position',
  '🧊 Ice pack applied', '💧 Hydration given',
];

function TimelineItem({ time, action, color }) {
  return (
    <View style={styles.timelineItem}>
      <View style={[styles.timelineDot, { backgroundColor: color }]} />
      <View style={styles.timelineLine} />
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineTime, { color }]}>{time}</Text>
        <Text style={styles.timelineAction}>{action}</Text>
      </View>
    </View>
  );
}

export default function ParamedicCardScreen({ navigation }) {
  const [consciousnessLevel, setConsciousnessLevel] = useState('A');
  const [injuries, setInjuries] = useState([]);
  const [firstAid, setFirstAid] = useState([]);
  const [location, setLocation] = useState(null);
  const [incidentTime] = useState(new Date());
  const [editMode, setEditMode] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  const toggleItem = (list, setList, item) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const selectedConsciousness = CONSCIOUSNESS_LEVELS.find(l => l.id === consciousnessLevel);
  const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const timeline = [
    { time: formatTime(incidentTime), action: 'Incident reported via RoadSOS', color: '#FF1744' },
    { time: formatTime(new Date(incidentTime.getTime() + 60000)), action: `Consciousness checked: ${consciousnessLevel} — ${selectedConsciousness?.label}`, color: '#FFB300' },
    ...firstAid.map((fa, i) => ({
      time: formatTime(new Date(incidentTime.getTime() + (i + 2) * 90000)),
      action: fa, color: '#00E676',
    })),
    { time: formatTime(new Date(incidentTime.getTime() + 300000)), action: 'Awaiting emergency services', color: '#00B0FF' },
  ];

  return (
    <LinearGradient colors={['#060810', '#050A0F', '#060810']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>PARAMEDIC CARD</Text>
              <Text style={styles.headerSub}>Tap to show paramedic on arrival</Text>
            </View>
            <TouchableOpacity onPress={() => setEditMode(!editMode)} style={styles.editBtn}>
              <Text style={styles.editText}>{editMode ? '✓ LOCK' : '✏️ EDIT'}</Text>
            </TouchableOpacity>
          </View>

          {/* PARAMEDIC DISPLAY CARD */}
          <View style={styles.displayCard}>
            <LinearGradient colors={['#0A1228', '#060810']} style={styles.displayCardInner}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardHeaderTitle}>🏥 MEDICAL INCIDENT CARD</Text>
                  <Text style={styles.cardHeaderSub}>RoadSOS Emergency System</Text>
                </View>
                <View style={styles.cardQR}>
                  <Text style={styles.cardQRText}>QR{'\n'}SOS</Text>
                </View>
              </View>

              <View style={styles.cardRow}>
                <View style={styles.cardField}>
                  <Text style={styles.fieldLabel}>INCIDENT TIME</Text>
                  <Text style={styles.fieldValue}>{incidentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text style={styles.fieldSub}>{incidentTime.toLocaleDateString()}</Text>
                </View>
                <View style={styles.cardField}>
                  <Text style={styles.fieldLabel}>LOCATION</Text>
                  <Text style={styles.fieldValue}>{location ? `${location.latitude.toFixed(4)}°N` : 'Acquiring...'}</Text>
                  <Text style={styles.fieldSub}>{location ? `${location.longitude.toFixed(4)}°E` : ''}</Text>
                </View>
              </View>

              {/* Consciousness Level - BIG display */}
              <View style={[styles.consciousnessDisplay, { borderColor: `${selectedConsciousness?.color}60`, backgroundColor: `${selectedConsciousness?.color}10` }]}>
                <Text style={styles.consciousnessLabel}>AVPU CONSCIOUSNESS SCORE</Text>
                <Text style={[styles.consciousnessLetter, { color: selectedConsciousness?.color }]}>
                  {consciousnessLevel}
                </Text>
                <Text style={[styles.consciousnessDesc, { color: selectedConsciousness?.color }]}>
                  {selectedConsciousness?.label} — {selectedConsciousness?.desc}
                </Text>
              </View>

              {/* Injuries */}
              {injuries.length > 0 && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>INJURIES NOTED</Text>
                  {injuries.map(inj => (
                    <Text key={inj} style={styles.injuryItem}>• {inj}</Text>
                  ))}
                </View>
              )}

              {/* First Aid */}
              {firstAid.length > 0 && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardSectionTitle}>FIRST AID CONDUCTED</Text>
                  {firstAid.map(fa => (
                    <Text key={fa} style={styles.firstAidItem}>✓ {fa}</Text>
                  ))}
                </View>
              )}

              {/* Timeline */}
              <View style={styles.cardSection}>
                <Text style={styles.cardSectionTitle}>INCIDENT TIMELINE</Text>
                {timeline.map((t, i) => (
                  <TimelineItem key={i} time={t.time} action={t.action} color={t.color} />
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Edit controls */}
          {editMode && (
            <>
              <View style={styles.editSection}>
                <Text style={styles.editSectionTitle}>CONSCIOUSNESS LEVEL (AVPU)</Text>
                <View style={styles.avpuRow}>
                  {CONSCIOUSNESS_LEVELS.map(l => (
                    <TouchableOpacity key={l.id} onPress={() => setConsciousnessLevel(l.id)} style={styles.avpuBtn}>
                      <LinearGradient
                        colors={consciousnessLevel === l.id ? [`${l.color}30`, `${l.color}15`] : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']}
                        style={[styles.avpuBtnInner, consciousnessLevel === l.id && { borderColor: l.color }]}>
                        <Text style={[styles.avpuLetter, consciousnessLevel === l.id && { color: l.color }]}>{l.id}</Text>
                        <Text style={styles.avpuLabel}>{l.label}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.editSection}>
                <Text style={styles.editSectionTitle}>INJURIES (SELECT ALL THAT APPLY)</Text>
                <View style={styles.checkGrid}>
                  {INJURY_OPTIONS.map(item => (
                    <TouchableOpacity key={item} onPress={() => toggleItem(injuries, setInjuries, item)}
                      style={[styles.checkItem, injuries.includes(item) && styles.checkItemActive]}>
                      <Text style={[styles.checkText, injuries.includes(item) && styles.checkTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.editSection}>
                <Text style={styles.editSectionTitle}>FIRST AID CONDUCTED</Text>
                <View style={styles.checkGrid}>
                  {FIRSTAID_OPTIONS.map(item => (
                    <TouchableOpacity key={item} onPress={() => toggleItem(firstAid, setFirstAid, item)}
                      style={[styles.checkItem, styles.checkItemFirstAid, firstAid.includes(item) && styles.checkItemFirstAidActive]}>
                      <Text style={[styles.checkText, firstAid.includes(item) && styles.checkTextFirstAidActive]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          <TouchableOpacity onPress={() => Alert.alert('Card Shared', 'Paramedic Card sent to emergency dispatch and saved locally.')} style={styles.shareBtn}>
            <LinearGradient colors={['#FF1744', '#CC0033']} style={styles.shareBtnInner}>
              <Text style={styles.shareBtnText}>📤 SHARE WITH PARAMEDIC</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { paddingRight: 8 },
  backText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2, textAlign: 'center' },
  headerSub: { fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 2 },
  editBtn: { backgroundColor: 'rgba(0,176,255,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(0,176,255,0.3)' },
  editText: { fontSize: 11, color: '#00B0FF', fontWeight: '700' },
  displayCard: { marginHorizontal: 16, marginBottom: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,23,68,0.3)', elevation: 15, shadowColor: '#FF1744', shadowOpacity: 0.3, shadowRadius: 15 },
  displayCardInner: { padding: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,23,68,0.2)', paddingBottom: 14 },
  cardHeaderLeft: {},
  cardHeaderTitle: { fontSize: 14, fontWeight: '900', color: '#FF1744', letterSpacing: 1 },
  cardHeaderSub: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 },
  cardQR: { width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  cardQRText: { fontSize: 12, fontWeight: '900', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 14 },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  cardField: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  fieldLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 4 },
  fieldValue: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  fieldSub: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  consciousnessDisplay: { borderRadius: 14, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 2 },
  consciousnessLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 6 },
  consciousnessLetter: { fontSize: 52, fontWeight: '900', lineHeight: 56 },
  consciousnessDesc: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  cardSection: { marginBottom: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12 },
  cardSectionTitle: { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  injuryItem: { fontSize: 13, color: '#FF6B6B', marginBottom: 4 },
  firstAidItem: { fontSize: 13, color: '#00E676', marginBottom: 4 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, marginRight: 8, flexShrink: 0 },
  timelineLine: {},
  timelineContent: {},
  timelineTime: { fontSize: 10, fontWeight: '700', marginBottom: 1 },
  timelineAction: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  editSection: { paddingHorizontal: 16, marginBottom: 20 },
  editSectionTitle: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 12 },
  avpuRow: { flexDirection: 'row', gap: 8 },
  avpuBtn: { flex: 1 },
  avpuBtnInner: { borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  avpuLetter: { fontSize: 22, fontWeight: '900', color: 'rgba(255,255,255,0.4)' },
  avpuLabel: { fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2, textAlign: 'center' },
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  checkItem: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  checkItemActive: { backgroundColor: 'rgba(255,23,68,0.15)', borderColor: 'rgba(255,23,68,0.4)' },
  checkItemFirstAid: {},
  checkItemFirstAidActive: { backgroundColor: 'rgba(0,230,118,0.15)', borderColor: 'rgba(0,230,118,0.4)' },
  checkText: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  checkTextActive: { color: '#FF6B6B' },
  checkTextFirstAidActive: { color: '#00E676' },
  shareBtn: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', elevation: 10, shadowColor: '#FF1744', shadowOpacity: 0.4, shadowRadius: 10 },
  shareBtnInner: { padding: 16, alignItems: 'center' },
  shareBtnText: { fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
});
