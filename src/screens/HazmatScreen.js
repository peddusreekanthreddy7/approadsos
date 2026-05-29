import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HAZMAT_PROTOCOLS, MCI_TRIAGE } from '../data/emergencyData';

const { width } = Dimensions.get('window');

export default function HazmatScreen({ navigation }) {
  const [activeProtocol, setActiveProtocol] = useState('chemical');
  const [mciMode, setMciMode] = useState(false);
  const warningAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(warningAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(warningAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [activeProtocol]);

  const protocol = HAZMAT_PROTOCOLS[activeProtocol];

  const switchProtocol = (key) => {
    opacityAnim.setValue(0);
    slideAnim.setValue(20);
    setActiveProtocol(key);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  if (mciMode) {
    return (
      <LinearGradient colors={['#0A0514', '#060810', '#0A0514']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setMciMode(false)} style={styles.backBtn}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>MCI MODE</Text>
              <View style={styles.mciActiveBadge}>
                <Text style={styles.mciActiveText}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.mciWarning}>
              <LinearGradient colors={['rgba(124,77,255,0.25)', 'rgba(124,77,255,0.1)']} style={styles.mciWarningInner}>
                <Animated.Text style={[styles.mciWarningEmoji, { opacity: warningAnim }]}>🚨</Animated.Text>
                <Text style={styles.mciWarningTitle}>MASS CASUALTY INCIDENT</Text>
                <Text style={styles.mciWarningSub}>Multi-ambulance dispatch initiated. Field triage mode active.</Text>
              </LinearGradient>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TRIAGE PRIORITY SYSTEM</Text>
              {MCI_TRIAGE.priority_guide.map((item, i) => (
                <View key={i} style={[styles.triageCard, { borderColor: `${item.color}40` }]}>
                  <LinearGradient colors={[`${item.color}15`, `${item.color}08`]} style={styles.triageCardInner}>
                    <View style={[styles.triageColorDot, { backgroundColor: item.color }]} />
                    <View style={styles.triageTextWrap}>
                      <Text style={[styles.triageLabel, { color: item.color }]}>{item.label}</Text>
                      <Text style={styles.triageDesc}>{item.desc}</Text>
                    </View>
                    {i === 0 && <Text style={styles.checkFirst}>CHECK FIRST</Text>}
                  </LinearGradient>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>FIELD INSTRUCTIONS</Text>
              {MCI_TRIAGE.field_instructions.map((inst, i) => (
                <View key={i} style={[styles.instructionCard, i === 0 && styles.instructionCardHighlight]}>
                  <LinearGradient colors={i === 0 ? ['rgba(255,23,68,0.15)', 'rgba(255,23,68,0.05)'] : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']} style={styles.instructionInner}>
                    <View style={[styles.instructionNum, { backgroundColor: i === 0 ? '#FF1744' : 'rgba(255,255,255,0.1)' }]}>
                      <Text style={styles.instructionNumText}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.instructionText, i === 0 && { color: '#FF6B6B', fontWeight: '700' }]}>{inst}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.dispatchBtn} onPress={() => Alert.alert('MCI Dispatch', 'Multi-ambulance dispatch request sent to control room.\n\nETA: 3 ambulances in 8–12 minutes')}>
              <LinearGradient colors={['#7C4DFF', '#5C2DE0']} style={styles.dispatchBtnInner}>
                <Text style={styles.dispatchBtnText}>🚑🚑🚑 MULTI-AMBULANCE DISPATCH</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={{ height: 30 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0A0810', '#060812', '#0A0810']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>HAZMAT PROTOCOL</Text>
            <View />
          </View>

          {/* Big Warning */}
          <View style={styles.bigWarning}>
            <LinearGradient colors={[`${protocol.color}20`, 'rgba(8,12,20,0.9)']} style={[styles.bigWarningInner, { borderColor: `${protocol.color}50` }]}>
              <Animated.Text style={[styles.bigWarningEmoji, { opacity: warningAnim }]}>{protocol.icon}</Animated.Text>
              <Text style={[styles.bigWarningTitle, { color: protocol.color }]}>{protocol.title.toUpperCase()}</Text>
              <View style={[styles.safeDistanceBadge, { backgroundColor: `${protocol.color}20`, borderColor: `${protocol.color}40` }]}>
                <Text style={styles.safeDistanceIcon}>⚠️</Text>
                <Text style={[styles.safeDistanceText, { color: protocol.color }]}>SAFE DISTANCE: {protocol.safeDistance}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Protocol Selector */}
          <View style={styles.selectorRow}>
            {Object.entries(HAZMAT_PROTOCOLS).map(([key, p]) => (
              <TouchableOpacity key={key} onPress={() => switchProtocol(key)} style={styles.selectorBtn}>
                <LinearGradient
                  colors={activeProtocol === key ? [`${p.color}25`, `${p.color}10`] : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']}
                  style={[styles.selectorBtnInner, activeProtocol === key && { borderColor: p.color }]}>
                  <Text style={styles.selectorEmoji}>{p.icon}</Text>
                  <Text style={[styles.selectorLabel, activeProtocol === key && { color: p.color }]}>
                    {key.replace('_', '\n').toUpperCase()}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Steps */}
          <Animated.View style={[styles.section, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.sectionTitle}>IMMEDIATE ACTIONS</Text>
            {protocol.steps.map((step, i) => (
              <View key={i} style={styles.stepCard}>
                <LinearGradient
                  colors={i === 0 ? [`${protocol.color}20`, `${protocol.color}08`] : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']}
                  style={[styles.stepInner, { borderColor: i === 0 ? `${protocol.color}40` : 'rgba(255,255,255,0.07)' }]}>
                  <View style={[styles.stepBullet, { backgroundColor: i === 0 ? protocol.color : 'rgba(255,255,255,0.15)' }]}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, i === 0 && { color: '#FFF', fontWeight: '700', fontSize: 14 }]}>{step}</Text>
                </LinearGradient>
              </View>
            ))}
          </Animated.View>

          {/* Dispatch Code */}
          <View style={styles.dispatchSection}>
            <LinearGradient colors={[`${protocol.color}10`, 'rgba(8,12,20,0.8)']} style={[styles.dispatchCard, { borderColor: `${protocol.color}25` }]}>
              <Text style={styles.dispatchLabel}>DISPATCH CODE</Text>
              <Text style={[styles.dispatchCode, { color: protocol.color }]}>{protocol.dispatchCode}</Text>
              <TouchableOpacity onPress={() => Alert.alert('Dispatch Sent', `HAZMAT dispatch code "${protocol.dispatchCode}" sent to control room.`)}
                style={[styles.dispatchCallBtn, { backgroundColor: `${protocol.color}20`, borderColor: `${protocol.color}40` }]}>
                <Text style={[styles.dispatchCallText, { color: protocol.color }]}>📡 SEND TO DISPATCH</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* MCI Mode Switch */}
          <TouchableOpacity onPress={() => setMciMode(true)} style={styles.mciBtn}>
            <LinearGradient colors={['rgba(124,77,255,0.2)', 'rgba(124,77,255,0.1)']} style={styles.mciBtnInner}>
              <Text style={styles.mciBtnIcon}>🚨</Text>
              <View>
                <Text style={styles.mciBtnTitle}>MASS CASUALTY INCIDENT MODE</Text>
                <Text style={styles.mciBtnSub}>Bus rollover, pile-up, or multiple victims</Text>
              </View>
              <Text style={styles.mciBtnArrow}>→</Text>
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
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  bigWarning: { marginHorizontal: 16, marginBottom: 16 },
  bigWarningInner: { borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1.5 },
  bigWarningEmoji: { fontSize: 64, marginBottom: 12 },
  bigWarningTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 2, marginBottom: 14, textAlign: 'center' },
  safeDistanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  safeDistanceIcon: { fontSize: 18 },
  safeDistanceText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  selectorRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 20 },
  selectorBtn: { flex: 1 },
  selectorBtnInner: { borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  selectorEmoji: { fontSize: 24, marginBottom: 6 },
  selectorLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textAlign: 'center', letterSpacing: 1, lineHeight: 13 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 3, marginBottom: 12 },
  stepCard: { marginBottom: 8 },
  stepInner: { borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1 },
  stepBullet: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNum: { fontSize: 12, fontWeight: '900', color: '#FFF' },
  stepText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', flex: 1, lineHeight: 18 },
  dispatchSection: { paddingHorizontal: 16, marginBottom: 14 },
  dispatchCard: { borderRadius: 16, padding: 16, borderWidth: 1, alignItems: 'center' },
  dispatchLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 6 },
  dispatchCode: { fontSize: 20, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  dispatchCallBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1 },
  dispatchCallText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  mciBtn: { marginHorizontal: 16 },
  mciBtnInner: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(124,77,255,0.3)' },
  mciBtnIcon: { fontSize: 28 },
  mciBtnTitle: { fontSize: 13, fontWeight: '800', color: '#B388FF', letterSpacing: 0.5 },
  mciBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  mciBtnArrow: { fontSize: 18, color: '#7C4DFF', marginLeft: 'auto' },
  mciActiveBadge: { backgroundColor: 'rgba(124,77,255,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(124,77,255,0.4)' },
  mciActiveText: { fontSize: 10, color: '#B388FF', fontWeight: '800' },
  mciWarning: { marginHorizontal: 16, marginBottom: 20 },
  mciWarningInner: { borderRadius: 18, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(124,77,255,0.3)' },
  mciWarningEmoji: { fontSize: 52, marginBottom: 10 },
  mciWarningTitle: { fontSize: 20, fontWeight: '900', color: '#B388FF', letterSpacing: 2, marginBottom: 6 },
  mciWarningSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  triageCard: { marginBottom: 8, borderRadius: 14, borderWidth: 1 },
  triageCardInner: { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  triageColorDot: { width: 18, height: 18, borderRadius: 9, flexShrink: 0 },
  triageTextWrap: { flex: 1 },
  triageLabel: { fontSize: 13, fontWeight: '800' },
  triageDesc: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  checkFirst: { fontSize: 10, fontWeight: '900', color: '#FF1744', letterSpacing: 1 },
  instructionCard: { marginBottom: 8 },
  instructionCardHighlight: {},
  instructionInner: { borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  instructionNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  instructionNumText: { fontSize: 12, fontWeight: '900', color: '#FFF' },
  instructionText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', flex: 1, lineHeight: 18 },
  dispatchBtn: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', elevation: 10, shadowColor: '#7C4DFF', shadowOpacity: 0.4, shadowRadius: 10, marginBottom: 16 },
  dispatchBtnInner: { padding: 16, alignItems: 'center' },
  dispatchBtnText: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
});
