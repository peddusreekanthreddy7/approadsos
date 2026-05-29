import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Dimensions, Linking, TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AMBULANCE_NUMBERS } from '../data/emergencyData';

const { width } = Dimensions.get('window');

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

function SettingRow({ icon, title, sub, value, onToggle, isSwitch, color = '#00B0FF', onPress, badge }) {
  return (
    <TouchableOpacity onPress={!isSwitch ? onPress : null} activeOpacity={isSwitch ? 1 : 0.7}>
      <View style={styles.settingRow}>
        <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <View style={styles.settingText}>
          <View style={styles.settingTitleRow}>
            <Text style={styles.settingTitle}>{title}</Text>
            {badge && <View style={[styles.settingBadge, { backgroundColor: `${badge.color}20`, borderColor: `${badge.color}40` }]}>
              <Text style={[styles.settingBadgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>}
          </View>
          {sub && <Text style={styles.settingSub}>{sub}</Text>}
        </View>
        {isSwitch ? (
          <Switch value={value} onValueChange={onToggle} trackColor={{ false: 'rgba(255,255,255,0.1)', true: `${color}60` }} thumbColor={value ? color : 'rgba(255,255,255,0.4)'} />
        ) : (
          <Text style={styles.settingArrow}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function dialNumber(num) {
  const url = `tel:${num}`;
  Linking.canOpenURL(url)
    .then(ok => ok ? Linking.openURL(url) : Alert.alert('Cannot dial', `Unable to open dialer for ${num}`))
    .catch(() => Alert.alert('Cannot dial', `Unable to open dialer for ${num}`));
}

export default function SettingsScreen({ navigation }) {
  const [crashDetection,   setCrashDetection]   = useState(true);
  const [geoFencing,       setGeoFencing]       = useState(true);
  const [voiceAlerts,      setVoiceAlerts]      = useState(true);
  const [offlineMode,      setOfflineMode]       = useState(false);
  const [darkHUD,          setDarkHUD]          = useState(true);
  const [smsbridge,        setSmsbridge]         = useState(true);
  const [nightBeaconAuto,  setNightBeaconAuto]  = useState(true);

  // Medical profile
  const [bloodType,        setBloodType]        = useState('B+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyName,    setEmergencyName]    = useState('');
  const [allergies,        setAllergies]        = useState('');
  const [conditions,       setConditions]       = useState('');
  const [editingMedical,   setEditingMedical]   = useState(false);

  return (
    <LinearGradient colors={['#080C14', '#0A1020', '#080C14']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>SETTINGS</Text>
            <Text style={styles.headerSub}>Configure RoadSOS</Text>
          </View>

          {/* App Info Card */}
          <View style={styles.appCard}>
            <LinearGradient colors={['rgba(255,23,68,0.15)', 'rgba(255,23,68,0.05)']} style={styles.appCardInner}>
              <View style={styles.appCardRow}>
                <View>
                  <Text style={styles.appCardName}>ROAD<Text style={{ color: '#FF1744' }}>SOS</Text></Text>
                  <Text style={styles.appCardVersion}>v1.0.0 · CoERS · IIT Madras</Text>
                </View>
                <View style={styles.appCardBadges}>
                  <View style={styles.appBadge}><Text style={styles.appBadgeText}>AI: Pollinations</Text></View>
                  <View style={styles.appBadge}><Text style={styles.appBadgeText}>DB: OSM Live</Text></View>
                </View>
              </View>
              <View style={styles.statRow}>
                {[
                  { val: '10+', label: 'Services', color: '#FF1744' },
                  { val: 'OSM', label: 'Map Data', color: '#00E676' },
                  { val: 'AI',  label: 'ChatBot',  color: '#00B0FF' },
                  { val: '₹0',  label: 'Cost',     color: '#FFB300' },
                ].map(s => (
                  <View key={s.label} style={styles.statItem}>
                    <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* ── MEDICAL PROFILE ── */}
          <SectionHeader title="MEDICAL PROFILE" />
          <View style={[styles.sectionCard, { marginBottom: 8 }]}>
            {/* Blood type selector */}
            <View style={styles.bloodTypeRow}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(255,23,68,0.15)' }]}>
                <Text style={{ fontSize: 20 }}>🩸</Text>
              </View>
              <Text style={styles.bloodTypeLabel}>Blood Type</Text>
              <View style={styles.bloodTypeChips}>
                {BLOOD_TYPES.map(bt => (
                  <TouchableOpacity key={bt} onPress={() => setBloodType(bt)}
                    style={[styles.bloodChip, bloodType === bt && styles.bloodChipActive]}>
                    <Text style={[styles.bloodChipText, bloodType === bt && styles.bloodChipTextActive]}>{bt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.divider} />

            {/* Emergency contact */}
            <View style={styles.medRow}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(0,176,255,0.15)' }]}>
                <Text style={{ fontSize: 20 }}>📞</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Emergency Contact</Text>
                {editingMedical ? (
                  <View style={{ gap: 6, marginTop: 6 }}>
                    <TextInput
                      style={styles.medInput}
                      value={emergencyName}
                      onChangeText={setEmergencyName}
                      placeholder="Contact name"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                    />
                    <TextInput
                      style={styles.medInput}
                      value={emergencyContact}
                      onChangeText={setEmergencyContact}
                      placeholder="Phone number"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      keyboardType="phone-pad"
                    />
                  </View>
                ) : (
                  <Text style={styles.settingSub}>
                    {emergencyName ? `${emergencyName} · ${emergencyContact || 'No number'}` : 'Tap Edit to add'}
                  </Text>
                )}
              </View>
              {!editingMedical && emergencyContact ? (
                <TouchableOpacity onPress={() => dialNumber(emergencyContact)} style={styles.callChip}>
                  <Text style={styles.callChipText}>CALL</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.divider} />

            {/* Allergies */}
            <View style={styles.medRow}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(255,179,0,0.15)' }]}>
                <Text style={{ fontSize: 20 }}>⚠️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Allergies</Text>
                {editingMedical ? (
                  <TextInput
                    style={[styles.medInput, { marginTop: 6 }]}
                    value={allergies}
                    onChangeText={setAllergies}
                    placeholder="e.g. Penicillin, Nuts"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                  />
                ) : (
                  <Text style={styles.settingSub}>{allergies || 'None listed'}</Text>
                )}
              </View>
            </View>
            <View style={styles.divider} />

            {/* Medical conditions */}
            <View style={styles.medRow}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(124,77,255,0.15)' }]}>
                <Text style={{ fontSize: 20 }}>💊</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Medical Conditions</Text>
                {editingMedical ? (
                  <TextInput
                    style={[styles.medInput, { marginTop: 6 }]}
                    value={conditions}
                    onChangeText={setConditions}
                    placeholder="e.g. Diabetic, Hypertension"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                  />
                ) : (
                  <Text style={styles.settingSub}>{conditions || 'None listed'}</Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.editMedBtn}
              onPress={() => setEditingMedical(e => !e)}
            >
              <LinearGradient
                colors={editingMedical ? ['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.08)'] : ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)']}
                style={styles.editMedBtnInner}
              >
                <Text style={[styles.editMedBtnText, editingMedical && { color: '#00E676' }]}>
                  {editingMedical ? '✓  SAVE PROFILE' : '✏️  EDIT PROFILE'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Emergency Contacts */}
          <SectionHeader title="EMERGENCY CONTACTS" />
          <View style={styles.sectionCard}>
            {Object.entries(AMBULANCE_NUMBERS).map(([key, num]) => (
              <TouchableOpacity key={key} onPress={() => dialNumber(num)} style={styles.contactRow}>
                <Text style={styles.contactKey}>{key.toUpperCase().replace('_', ' ')}</Text>
                <Text style={styles.contactNum}>{num}</Text>
                <View style={styles.callChip}><Text style={styles.callChipText}>CALL</Text></View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Crash Detection */}
          <SectionHeader title="CRASH DETECTION" />
          <View style={styles.sectionCard}>
            <SettingRow icon="🛡️" title="Crash Detection" sub="Monitor accelerometer for high-G events" value={crashDetection} onToggle={setCrashDetection} isSwitch color="#FF1744" badge={{ label: 'ACTIVE', color: '#00E676' }} />
            <View style={styles.divider} />
            <SettingRow icon="⏱️" title="15-Second Shield" sub="Grace period before auto-SOS dispatch" value={true} isSwitch color="#FF6B00" />
            <View style={styles.divider} />
            <SettingRow icon="💥" title="Sensitivity" sub="Current threshold: 2.5G deceleration" onPress={() => Alert.alert('Sensitivity', 'Adjust crash detection threshold')} color="#FFB300" />
            <View style={styles.divider} />
            <SettingRow icon="🔦" title="Auto Night Beacon" sub="Enable strobe automatically on crash after sunset" value={nightBeaconAuto} onToggle={setNightBeaconAuto} isSwitch color="#FFB300" />
          </View>

          {/* Network & Offline */}
          <SectionHeader title="NETWORK & OFFLINE" />
          <View style={styles.sectionCard}>
            <SettingRow icon="📡" title="SMS Bridge" sub="Emergency SMS via native SIM — works offline" value={smsbridge} onToggle={setSmsbridge} isSwitch color="#00E676" badge={{ label: 'RECOMMENDED', color: '#00E676' }} />
            <View style={styles.divider} />
            <SettingRow icon="🗺️" title="Offline Map Cache" sub="OpenStreetMap data stored locally" onPress={() => Alert.alert('Cache', 'Offline cache: 8.2MB\nLast updated: today\nRegion: Hyderabad (50km radius)')} color="#00B0FF" />
            <View style={styles.divider} />
            <SettingRow icon="🔄" title="Force Offline Mode" sub="Use only local cache, no network requests" value={offlineMode} onToggle={setOfflineMode} isSwitch color="#7C4DFF" />
          </View>

          {/* Navigation */}
          <SectionHeader title="NAVIGATION & ALERTS" />
          <View style={styles.sectionCard}>
            <SettingRow icon="🔊" title="Voice Alerts" sub="Spoken turn-by-turn and hazard warnings" value={voiceAlerts} onToggle={setVoiceAlerts} isSwitch color="#00B0FF" />
            <View style={styles.divider} />
            <SettingRow icon="📍" title="Geo-Fence Broadcasts" sub="Receive accident warnings within 2km" value={geoFencing} onToggle={setGeoFencing} isSwitch color="#FF6B00" />
            <View style={styles.divider} />
            <SettingRow icon="🌙" title="Dark HUD Mode" sub="High contrast navigation overlay" value={darkHUD} onToggle={setDarkHUD} isSwitch color="#7C4DFF" />
          </View>

          {/* About */}
          <SectionHeader title="ABOUT" />
          <View style={styles.sectionCard}>
            <SettingRow icon="📖" title="Architecture Overview" sub="System design & live pipeline" onPress={() => Alert.alert('Architecture', 'Live GPS → OSRM Road Routing → OSM Overpass Services → Pollinations AI → Real-time Updates\n\nAll data fetched live from free APIs.')} color="#00B0FF" />
            <View style={styles.divider} />
            <SettingRow icon="🤖" title="AI Model Info" sub="Pollinations.ai (cloud, free, no API key)" onPress={() => Alert.alert('AI Model', 'Provider: Pollinations.ai\nModel: Auto (free tier)\nInternet required: Yes\nCost: ₹0\nFallback: Local response library')} color="#7C4DFF" />
            <View style={styles.divider} />
            <SettingRow icon="🏆" title="Hackathon" sub="CoERS · RBG Labs · IIT Madras" onPress={() => Alert.alert('RoadSOS', 'Built for CoERS Hackathon\nCentre of Excellence for Road Safety\nRBG Labs, IIT Madras')} color="#FFB300" />
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: 3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, letterSpacing: 1 },
  appCard: { marginHorizontal: 16, marginBottom: 20 },
  appCardInner: { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,23,68,0.25)' },
  appCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  appCardName: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  appCardVersion: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 },
  appCardBadges: { gap: 4 },
  appBadge: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignItems: 'flex-end' },
  appBadgeText: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12 },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  sectionHeader: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 3, paddingHorizontal: 20, marginBottom: 8, marginTop: 6 },
  sectionCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingText: { flex: 1 },
  settingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  settingTitle: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  settingBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  settingBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  settingSub: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  settingArrow: { fontSize: 22, color: 'rgba(255,255,255,0.2)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 66 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 12 },
  contactKey: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', width: 100 },
  contactNum: { fontSize: 16, fontWeight: '800', color: '#FFF', flex: 1 },
  callChip: { backgroundColor: 'rgba(0,230,118,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(0,230,118,0.3)' },
  callChipText: { fontSize: 11, color: '#00E676', fontWeight: '700' },

  // Medical profile
  bloodTypeRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 13, gap: 12, flexWrap: 'wrap' },
  bloodTypeLabel: { fontSize: 14, fontWeight: '700', color: '#FFF', paddingTop: 10, marginRight: 4 },
  bloodTypeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1, paddingTop: 4 },
  bloodChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' },
  bloodChipActive: { borderColor: '#FF1744', backgroundColor: 'rgba(255,23,68,0.2)' },
  bloodChipText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.45)' },
  bloodChipTextActive: { color: '#FF1744' },
  medRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  medInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    color: '#FFF', fontSize: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  editMedBtn: { marginHorizontal: 14, marginVertical: 12 },
  editMedBtnInner: { borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  editMedBtnText: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
});
