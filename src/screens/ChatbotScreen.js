import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Animated, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIRST_AID_STEPS, AMBULANCE_NUMBERS } from '../data/emergencyData';

const { width, height } = Dimensions.get('window');

// ─── 25+ response categories ─────────────────────────────────────────────────
const AI_RESPONSES = {
  greeting: {
    intent: 'greeting', severity: 'low', protocol: null, color: '#00B0FF',
    response: `👋 Hey! I'm RoadSOS AI — your emergency guide.\n\nTell me what's happening and I'll give you step-by-step instructions. I understand:\n\n🚗 Accidents & crashes\n🩸 Bleeding & trauma\n🔥 Vehicle / building fires\n❤️ Heart attack & CPR\n🦴 Fractures & burns\n🔧 Breakdown & flat tyre\n🌊 Drowning & electric shock\n☣️ Hazmat & gas leaks\n🚑 Any emergency\n\nJust describe what you see — I'll guide you.`,
  },
  thanks: {
    intent: 'thanks', severity: 'low', protocol: null, color: '#00E676',
    response: `✅ You're welcome. Stay safe!\n\nIf the situation changes or you need further help — just type anything. I'm here 24/7.\n\n📞 Quick dials: Ambulance 108 · Police 100 · Fire 101`,
  },
  accident: {
    intent: 'accident', severity: 'high', protocol: 'ROAD ACCIDENT', color: '#FF6B00',
    response: `🚗 ROAD ACCIDENT — ACT NOW\n\n1️⃣ STOP your vehicle safely — don't block emergency lane\n2️⃣ Call 108 (ambulance) immediately\n3️⃣ Turn on hazard lights\n4️⃣ Check victims — are they conscious? Breathing?\n5️⃣ Do NOT move anyone with neck/back pain (spinal risk)\n6️⃣ Keep bystanders back — create a 5m clear zone\n7️⃣ Place warning triangle 50m behind if safe\n\n⚠️ If fuel is leaking — move everyone 30m away NOW.\n\nTap 🆘 SOS tab to auto-alert emergency services with your GPS.`,
  },
  trauma: {
    intent: 'trauma', severity: 'critical', protocol: 'LEVEL-1 TRAUMA', color: '#FF1744',
    response: `🩸 SEVERE BLEEDING / TRAUMA\n\n📞 Call 108 NOW — tell them: "severe bleeding, road accident"\n\nWhile waiting:\n1. Apply FIRM, continuous pressure on the wound with cloth\n2. Do NOT lift the cloth — add more on top if soaking through\n3. If limb: raise it ABOVE heart level\n4. Do NOT remove embedded objects (glass, metal)\n5. Do NOT move the victim if they hit their head\n6. Monitor breathing every 30 seconds\n7. Keep victim warm — shock risk\n\n🚫 Do NOT give food, water, or painkiller.\n\nIf unconscious + not breathing → start CPR (type "CPR" for steps).`,
  },
  cardiac: {
    intent: 'cardiac', severity: 'critical', protocol: 'CARDIAC ARREST', color: '#FF1744',
    response: `❤️ HEART ATTACK / CARDIAC ARREST\n\n📞 Call 108 NOW — say "heart attack"\n\nIF UNCONSCIOUS & NOT BREATHING — Start CPR:\n1. Lay flat on hard surface\n2. Kneel beside them\n3. Lock hands — heel on centre of chest\n4. Push HARD & FAST: 100–120 compressions/min\n5. Push down 5–6 cm each time\n6. After 30 compressions → 2 rescue breaths\n7. Continue until ambulance arrives\n\nIF CONSCIOUS:\n• Loosen tight clothing\n• Sit them upright (not lying flat)\n• Give aspirin 325mg if available (chew, don't swallow)\n• Keep calm, no physical exertion\n• Stay with them — deterioration is rapid`,
  },
  fire: {
    intent: 'fire', severity: 'critical', protocol: 'FIRE EVACUATION', color: '#FF6B00',
    response: `🔥 FIRE — EVACUATE IMMEDIATELY\n\n📞 Call 101 (Fire) + 108 (Ambulance)\n\n🚗 Vehicle fire:\n1. Pull over, cut ignition, GET OUT immediately\n2. Move 50m minimum upwind — fuel tank can explode\n3. Do NOT open bonnet if smoke is coming from it\n4. Do NOT use water on electrical/EV fire\n5. Alert oncoming traffic by waving\n\n🏠 Building fire:\n1. Stay LOW — smoke rises, air is cleaner near floor\n2. Feel doors before opening — if hot, find another way\n3. Never use lifts during fire\n4. Meet at assembly point outside\n\n⚡ EV fire? Stay 15m away — high-voltage battery risks re-ignition for hours.`,
  },
  choking: {
    intent: 'choking', severity: 'critical', protocol: 'CHOKING RESPONSE', color: '#FF1744',
    response: `😮 CHOKING — ACT IN THE NEXT 60 SECONDS\n\nIF ADULT / CHILD (over 1 year):\n1. Ask: "Are you choking?" — if they can't speak → it's severe\n2. LEAN them forward\n3. Give 5 hard BACK BLOWS between shoulder blades with heel of hand\n4. If not cleared → HEIMLICH MANEUVER:\n   • Stand behind them\n   • Fist just above navel, other hand over fist\n   • PULL sharply INWARD & UPWARD × 5\n5. Alternate 5 back blows + 5 abdominal thrusts\n6. If unconscious → start CPR\n\n👶 INFANT (under 1 year):\n• Face-down on your forearm\n• 5 back slaps between shoulder blades\n• 5 chest pushes (2 fingers, centre of chest)\n\n📞 Call 108 even if the object comes out.`,
  },
  drowning: {
    intent: 'drowning', severity: 'critical', protocol: 'WATER RESCUE', color: '#00B0FF',
    response: `🌊 DROWNING / WATER EMERGENCY\n\n📞 Call 108 immediately\n\n1. Do NOT jump in unless trained — you may drown too\n2. REACH: extend a rope, branch, clothing, belt\n3. THROW: throw anything that floats (bottle, life ring)\n4. If you must enter: go with a flotation device\n\nONCE OUT OF WATER:\n1. Lay on back on flat surface\n2. Tilt head back, lift chin\n3. Check for breathing — look, listen, feel\n4. If not breathing → 5 rescue breaths FIRST (unlike normal CPR)\n5. Then 30 compressions + 2 breaths, repeat\n6. Keep warm — hypothermia is a major risk\n\n⚠️ Even if they seem fine — mandatory hospital check for "secondary drowning" within 24h.`,
  },
  fracture: {
    intent: 'fracture', severity: 'moderate', protocol: 'FRACTURE PROTOCOL', color: '#FFB300',
    response: `🦴 SUSPECTED FRACTURE / BROKEN BONE\n\n📞 Call 108 if: open fracture, spine/pelvis/femur, victim can't move\n\n✅ DO:\n1. IMMOBILIZE the injured part — support with hands or improvised splint\n2. Use rolled cloth/magazine/board as splint\n3. Tie splint above AND below the break (not on it)\n4. Elevate if possible to reduce swelling\n5. Apply ice wrapped in cloth (not directly on skin)\n\n🚫 DO NOT:\n• Try to straighten or "set" the bone\n• Move the person if spine/neck fracture suspected\n• Remove shoes if ankle/foot fracture\n• Apply heat\n\n⚠️ PELVIS or FEMUR fracture = life-threatening blood loss. Call 108 immediately.`,
  },
  burns: {
    intent: 'burns', severity: 'high', protocol: 'BURNS PROTOCOL', color: '#FF6B00',
    response: `🔥 BURNS TREATMENT\n\n⏱️ First 10 minutes are critical.\n\n✅ IMMEDIATELY:\n1. COOL with running cold water 10–20 minutes (not ice)\n2. Remove jewellery/clothing near burn (if not stuck to skin)\n3. Cover loosely with cling film or clean plastic bag\n\n🚫 DO NOT:\n• Use butter, toothpaste, oil, or ice\n• Break blisters\n• Remove stuck clothing\n\n📞 Call 108 if:\n• Larger than your palm\n• On face, hands, feet, genitals, airway\n• Chemical or electrical burn\n• Child or elderly victim\n• Full-thickness (white/black, no pain)\n\n⚡ Chemical burn? Flush with water 30 minutes minimum.`,
  },
  head_injury: {
    intent: 'head_injury', severity: 'critical', protocol: 'HEAD TRAUMA', color: '#FF1744',
    response: `🧠 HEAD INJURY / CONCUSSION\n\n📞 Call 108 if: unconscious, seizing, vomiting, unequal pupils, can't recall accident\n\n✅ DO:\n1. Keep victim STILL — assume spinal injury until cleared\n2. Hold head steady in line with spine (don't let it roll)\n3. If unconscious but breathing: recovery position (carefully)\n4. Stop any bleeding with firm pressure — but don't press on skull fracture\n5. Monitor every 5 min: breathing, pupils, consciousness level\n\n🚫 DO NOT:\n• Remove a helmet if they are unconscious\n• Give food, water, or painkillers\n• Let them "sleep it off" — dangerous with concussion\n\n⚠️ DANGER SIGNS: one pupil larger than other, clear fluid from nose/ear, worsening headache.`,
  },
  electric_shock: {
    intent: 'electric_shock', severity: 'critical', protocol: 'ELECTRIC SHOCK', color: '#FFB300',
    response: `⚡ ELECTRIC SHOCK\n\n🚨 DO NOT TOUCH THE VICTIM FIRST\n\n1. CUT THE POWER — switch off at the mains/circuit breaker\n2. If you can't: push victim away with non-conductive object (dry wood, rubber, plastic)\n3. DO NOT use metal or wet objects\n4. Once safe: call 108\n\nIF VICTIM IS UNRESPONSIVE:\n• Check breathing\n• Start CPR if not breathing (30 compressions + 2 breaths)\n• Treat burns: cool water, don't remove burned clothing\n\n⚠️ High-voltage (power lines): stay 6m away, call 108 + electricity authority.\n⚠️ Lightning strike: safe to touch — lightning victims carry no charge.`,
  },
  fainting: {
    intent: 'fainting', severity: 'moderate', protocol: 'FAINTING RESPONSE', color: '#00B0FF',
    response: `😵 FAINTING / COLLAPSE\n\n1. Lay person flat on their back\n2. Raise their legs 30cm above heart level\n3. Loosen tight clothing around neck/chest/waist\n4. Ensure fresh air — open windows, clear bystanders\n5. Do NOT give water until fully conscious\n\nIF UNRESPONSIVE:\n• Check breathing — is chest rising?\n• If not breathing → CPR (type "CPR" for steps)\n• If breathing → recovery position: roll gently to side\n\n📞 Call 108 if:\n• Unconscious more than 1 minute\n• Known diabetic, heart condition\n• Hit their head when falling\n• Does not fully recover within 5 minutes`,
  },
  bite: {
    intent: 'bite', severity: 'high', protocol: 'BITE / ENVENOMATION', color: '#7C4DFF',
    response: `🐍 SNAKE BITE / ANIMAL BITE\n\n📞 Call 108 immediately — anti-venom is time-critical\n\n🐍 SNAKE BITE:\n1. Keep victim STILL — movement spreads venom faster\n2. Remove watches, rings near the bite (swelling coming)\n3. Mark the bite site and time with a pen\n4. Keep bitten limb BELOW heart level\n\n🚫 DO NOT:\n• Suck out venom\n• Cut the wound\n• Apply tourniquet or ice\n\n🐕 DOG BITE:\n• Wash wound vigorously with soap for 5 minutes\n• Get anti-rabies injection within 24h — no exceptions\n\n🦂 Scorpion/Insect sting: cold compress, antihistamine, watch for allergic reaction.`,
  },
  shock: {
    intent: 'shock', severity: 'critical', protocol: 'SHOCK TREATMENT', color: '#FF1744',
    response: `⚠️ PHYSICAL SHOCK\n\nSIGNS: pale/grey skin, cold/clammy, rapid weak pulse, rapid breathing, confusion\n\n✅ DO THIS NOW:\n1. Lay flat — do NOT let them sit or stand\n2. Raise legs 30cm (unless head/spine/leg injury)\n3. Keep WARM — cover with blanket/jacket\n4. Loosen tight clothing\n5. Reassure calmly: "Help is coming, stay still"\n\n🚫 DO NOT:\n• Give food or drink\n• Leave them alone\n\n📞 Call 108 — shock requires IV fluids, not first aid alone\n\n⚠️ Anaphylactic shock: needs epinephrine/EpiPen IMMEDIATELY.`,
  },
  breakdown: {
    intent: 'breakdown', severity: 'moderate', protocol: 'AUTOMOTIVE ASSIST', color: '#FFB300',
    response: `🔧 VEHICLE BREAKDOWN — HIGHWAY SAFETY\n\n⚠️ STEP 1 — GET OFF THE ROAD:\n1. Pull as far left as possible (emergency lane)\n2. Turn on hazard lights IMMEDIATELY\n3. Place warning triangle 50m behind your vehicle\n4. Get everyone OUT and OFF the road\n\n📞 WHO TO CALL:\n• Towing: 1033 (NHAI helpline)\n• Ambulance (if injured): 108\n• Traffic Police: 103\n\n🔧 SPECIFIC PROBLEMS:\n• Flat tyre: Go to Services tab\n• Overheating: don't open radiator cap while hot. Wait 20 min\n• Dead battery: hazard lights on, call towing\n\n🌙 Night breakdown: stay visible — use phone flashlight.`,
  },
  trapped: {
    intent: 'trapped', severity: 'critical', protocol: 'RESCUE EXTRACTION', color: '#FF6B00',
    response: `🆘 PERSON TRAPPED IN VEHICLE\n\n📞 Call 101 (Fire Rescue)\n📞 Call 108 (Ambulance) simultaneously\n\nWHILE WAITING:\n1. Do NOT try to force the door — may worsen injuries\n2. Talk to the victim — keep them calm and awake\n3. Cut seatbelt ONLY if vehicle is on fire or sinking\n4. Keep hazard lights on\n\n🚘 Vehicle in water:\n• Open window BEFORE fully submerged\n• Wait until pressure equalises, then push door open\n• Break window with headrest metal prong\n\n⚠️ If vehicle is smoking/burning — try ALL exits before waiting.`,
  },
  mci: {
    intent: 'mci', severity: 'critical', protocol: 'MCI TRIAGE', color: '#7C4DFF',
    response: `🚑 MASS CASUALTY INCIDENT (MCI)\n\n📞 Call 108 + 100 + 101 simultaneously\nTell them: "Multiple casualties, road accident, need all units"\n\nSTART TRIAGE (tag victims by colour):\n🔴 RED — Life threat, treat immediately (not breathing after airway clear → black)\n🟡 YELLOW — Serious but stable, treat second\n🟢 GREEN — Walking wounded, treat last\n⚫ BLACK — Not breathing after airway opened, deceased\n\nDO NOT:\n• Move spinal injury patients unless fire/flood risk\n• Spend more than 30 seconds on any one victim during triage\n• Use your phone for anything except calling 108`,
  },
  hazmat: {
    intent: 'hazmat', severity: 'critical', protocol: 'HAZMAT OVERRIDE', color: '#FF6B00',
    response: `☣️ HAZMAT / CHEMICAL SPILL\n\n🚨 STAY UPWIND & UPHILL — minimum 300m\n\n📞 Call 101 (Fire HAZMAT) + 108\nTell them: chemical tanker/spill, your location\n\n1. DO NOT approach the spill area\n2. Move all bystanders UPWIND immediately\n3. If exposed: remove contaminated clothing, flush skin/eyes with water for 20 min\n4. Don't eat, drink, or touch face\n5. Note tanker plate number/colour (orange placard = hazmat)\n\n⚡ EV fire hazmat: stay 15m+ away, do NOT use water on lithium battery\n\nGas cloud: cover nose/mouth with damp cloth, move CROSSWIND (not just upwind)`,
  },
  gas_leak: {
    intent: 'gas_leak', severity: 'critical', protocol: 'GAS LEAK PROTOCOL', color: '#FFB300',
    response: `💨 GAS LEAK\n\n🚨 EVACUATE IMMEDIATELY — don't use switches or phone inside\n\n1. Do NOT turn lights/switches ON or OFF (spark risk)\n2. Do NOT use mobile phone inside the building\n3. Open all windows/doors as you leave\n4. Shut off gas at the meter if you can reach it safely\n5. Evacuate everyone — go upwind\n\n📞 Once outside and safe:\n• Call gas emergency: your local gas authority\n• Call Fire: 101\n• Do NOT re-enter until declared safe\n\n⚠️ Vehicle gas leak: same rules — don't start engine, no phone near leak, move away.`,
  },
  road_rage: {
    intent: 'road_rage', severity: 'high', protocol: 'ROAD RAGE RESPONSE', color: '#FF6B00',
    response: `😠 ROAD RAGE / THREAT\n\n🔒 LOCK your doors immediately\n\n1. Do NOT make eye contact or engage\n2. Keep driving — do NOT stop unless forced\n3. Drive to nearest police station, hospital, or public area\n4. Activate hazard lights if being followed\n5. Call 100 (Police) while driving if safe\n\n📞 112 (Emergency) if in immediate danger\n\nIF THEY BLOCK YOU:\n• Keep engine running\n• Don't get out\n• Honk continuously to attract attention\n• Record on dashcam/phone if safe\n\nRemember: No road dispute is worth your life.`,
  },
  nearest_hospital: {
    intent: 'nearest_hospital', severity: 'low', protocol: null, color: '#FF1744',
    response: `🏥 FINDING NEAREST HOSPITAL\n\nGo to the SERVICES tab in this app — it shows real hospitals near your live GPS with:\n• Distance and ETA\n• Phone number (tap to call directly)\n• Navigate button (opens Google Maps route)\n• 24/7 status and trauma capability\n\nThe list auto-updates as you move.\n\n📞 Fastest option: Call 108 — they will dispatch an ambulance AND tell you the nearest ER.\n\n⚠️ In a life-threatening emergency: call 108 FIRST, use the app map second.`,
  },
  nearest_police: {
    intent: 'nearest_police', severity: 'low', protocol: null, color: '#00B0FF',
    response: `👮 FINDING NEAREST POLICE\n\nGo to the SERVICES tab → filter by "Police"\n\n• Shows all police stations sorted by distance\n• Tap CALL to dial them directly\n• Tap NAVIGATE for Google Maps route\n\n📞 Quick dial: 100 (Police control room — fastest response)\n📞 Highway patrol: 103\n📞 Emergency (any): 112\n\nThe nearest police station is shown in the Services tab with live distance from your GPS.`,
  },
  sos_general: {
    intent: 'sos_general', severity: 'high', protocol: null, color: '#FF1744',
    response: `🆘 SOS ACTIVATED\n\nGo to the SOS tab immediately.\n\nThe SOS screen will:\n• Share your live GPS with emergency services\n• Auto-dial 108 (Ambulance)\n• Send SMS with coordinates even on low signal\n• Guide you through the next steps\n\n📞 RIGHT NOW:\n• Ambulance: 108\n• Police: 100\n• Fire: 101\n• Highway: 1033\n• Unified: 112\n\nStay on the line with the operator — they will guide you.`,
  },
  first_aid: {
    intent: 'first_aid', severity: 'moderate', protocol: null, color: '#00E676',
    response: `🩺 GENERAL FIRST AID BASICS\n\nPriority order — always check in this sequence:\n\n1. 🫁 AIRWAY — Is it clear? Tilt head back, lift chin\n2. 🌬️ BREATHING — Is chest rising? Look, listen, feel\n3. 🩸 CIRCULATION — Major bleeding? Apply firm pressure\n4. 📞 CALL — 108 for anything serious\n\nCommon emergencies — type to get specific steps:\n• "CPR" — cardiac arrest\n• "bleeding" — severe blood loss\n• "choking" — airway blockage\n• "burns" — heat or chemical burns\n• "fracture" — broken bones\n• "shock" — physical/medical shock\n\nServices tab → nearest hospital, live distance.`,
  },
  pain: {
    intent: 'pain', severity: 'moderate', protocol: null, color: '#FFB300',
    response: `⚠️ SEVERE PAIN REPORTED\n\nPain location matters — tell me more:\n\n🫀 Chest pain → may be cardiac — call 108, chew aspirin if available\n🧠 Head pain → possible head injury or stroke — don't move, call 108\n🦴 Limb pain after accident → possible fracture — immobilise, don't move\n🫁 Chest after impact → possible rib fracture or internal bleeding\n\nGeneral:\n• Do NOT give painkillers without knowing the cause\n• Do NOT give anything by mouth if surgery is possible\n• Keep them still and warm\n• Monitor breathing rate every 2 minutes\n\n📞 If pain is severe or worsening: call 108 now.`,
  },
  medical: {
    intent: 'medical', severity: 'moderate', protocol: null, color: '#00B0FF',
    response: `🤒 MEDICAL EMERGENCY\n\n📞 Call 108 for any sudden severe symptoms\n\n🥵 Heat stroke (not heatstroke — call it HYPERTHERMIA):\n• Move to shade, cool with water, fan vigorously\n• Cold packs to neck, armpits, groin\n• Give water ONLY if conscious and can swallow\n\n🤢 Severe nausea/vomiting:\n• Keep upright or on side (prevent choking)\n• Small sips of water if conscious\n\n😵 Severe dizziness:\n• Sit or lie down immediately\n• Do NOT drive\n• Check blood sugar if diabetic\n\n🤧 Allergic reaction:\n• Mild: antihistamine (Cetirizine/Benadryl)\n• Severe (throat swelling): 108 immediately — anaphylaxis risk`,
  },
  default: {
    intent: 'default', severity: 'low', protocol: null, color: '#00B0FF',
    response: `🤖 I'm your RoadSOS Emergency AI.\n\nDescribe your situation and I'll give immediate, step-by-step guidance.\n\nExamples:\n• "Car accident on highway"\n• "Someone is bleeding badly"\n• "Person not breathing"\n• "Vehicle caught fire"\n• "Flat tyre at night"\n\nOr tap one of the scenario buttons above.\n\n📞 If this is life-threatening: call 108 NOW, then use this app for guidance.\n\nI respond in real-time with AI tailored to Indian road emergencies.`,
  },
};

// ─── Intent detection ────────────────────────────────────────────────────────
function detectIntent(text) {
  const t = text.toLowerCase();
  if (/\b(hi|hello|hey|good morning|good evening|how are|what can)\b/.test(t)) return 'greeting';
  if (/\b(thank|thanks|thx|ty|appreciate)\b/.test(t)) return 'thanks';
  if (/sos|help me|emergency|urgent|mayday/.test(t) && !/accident|crash|fire|bleed|chok/.test(t)) return 'sos_general';
  if (/\b(cardiac arrest|heart attack|chest pain|not breathing|no pulse|cpr)\b/.test(t)) return 'cardiac';
  if (/\b(bleed|haemorrhage|hemorrhage|blood|wound|cut|stab|puncture|tourniquet)\b/.test(t)) return 'trauma';
  if (/\b(accident|crash|collision|hit|vehicle|car|truck|bus|knocked)\b/.test(t)) return 'accident';
  if (/\b(fire|burning|smoke|flame|blaze|vehicle.*fire|car.*fire)\b/.test(t)) return 'fire';
  if (/\b(chok|heimlich|swallowed|can't breathe|airway blocked)\b/.test(t)) return 'choking';
  if (/\b(drown|water|flood|submerged|river|pool|lake)\b/.test(t)) return 'drowning';
  if (/\b(fracture|broken bone|snap|break.*arm|break.*leg|broken.*wrist)\b/.test(t)) return 'fracture';
  if (/\b(burn|scald|hot water|fire.*skin|chemical burn)\b/.test(t)) return 'burns';
  if (/\b(head injury|concussion|skull|head.*bleed|head.*hit|head.*trauma)\b/.test(t)) return 'head_injury';
  if (/\b(electric|electrocute|shock.*wire|power line|lightning)\b/.test(t)) return 'electric_shock';
  if (/\b(snake.*bite|snakebite|dog.*bite|animal.*bite|scorpion|sting|venom)\b/.test(t)) return 'bite';
  if (/\b(faint|collapse|unconscious|pass.*out|blacked out|fell down)\b/.test(t)) return 'fainting';
  if (/\b(shock|pale.*skin|cold.*sweat|rapid.*pulse|organ)\b/.test(t)) return 'shock';
  if (/\b(breakdown|flat tyre|flat tire|puncture|dead battery|overheating|stranded)\b/.test(t)) return 'breakdown';
  if (/\b(trapped|stuck.*car|can't.*out|jammed|locked.*in)\b/.test(t)) return 'trapped';
  if (/\b(mci|mass.*cas|multiple.*victim|bus.*crash|train.*crash|many.*injur)\b/.test(t)) return 'mci';
  if (/\b(hazmat|chemical.*spill|toxic|tanker.*spill|gas.*leak.*road)\b/.test(t)) return 'hazmat';
  if (/\b(gas.*leak|lpg|cylinder|smell.*gas|pipe.*burst)\b/.test(t)) return 'gas_leak';
  if (/\b(road rage|threat|aggressive.*driver|following me|chasing)\b/.test(t)) return 'road_rage';
  if (/nearest.*hospital|hospital.*near|closest.*hospital|emergency.*room/.test(t)) return 'nearest_hospital';
  if (/nearest.*police|police.*near|closest.*police/.test(t)) return 'nearest_police';
  if (/\b(first aid|basic.*help|what.*do|how.*help)\b/.test(t)) return 'first_aid';
  if (/\bpain\b|hurting badly|severe.*pain|pain.*severe/.test(t)) return 'pain';
  if (/fever|vomit|nausea|dizzy|heatstroke|heat.*stroke|dehydrat|allergic.*reaction/.test(t)) return 'medical';
  return 'default';
}

const SCENARIO_PROMPTS = [
  { label: '🚗 Car accident on highway', key: 'accident' },
  { label: '🩸 Someone is bleeding badly', key: 'trauma' },
  { label: '❤️ Person having heart attack', key: 'cardiac' },
  { label: '🔥 Vehicle is on fire', key: 'fire' },
  { label: '🔧 Flat tyre at night', key: 'breakdown' },
  { label: '🚌 Bus crash, many injured', key: 'mci' },
  { label: '😮 Person is choking', key: 'choking' },
  { label: '☣️ Chemical tanker spill', key: 'hazmat' },
];

const PROTOCOL_MAP = {
  trauma:        { protocol: 'LEVEL-1 TRAUMA',     color: '#FF1744' },
  cardiac:       { protocol: 'CARDIAC ARREST',     color: '#FF1744' },
  accident:      { protocol: 'ROAD ACCIDENT',      color: '#FF6B00' },
  fire:          { protocol: 'FIRE EVACUATION',    color: '#FF6B00' },
  trapped:       { protocol: 'RESCUE EXTRACTION',  color: '#FF6B00' },
  mci:           { protocol: 'MCI TRIAGE',         color: '#7C4DFF' },
  hazmat:        { protocol: 'HAZMAT OVERRIDE',    color: '#FF6B00' },
  choking:       { protocol: 'CHOKING RESPONSE',   color: '#FF1744' },
  drowning:      { protocol: 'WATER RESCUE',       color: '#00B0FF' },
  head_injury:   { protocol: 'HEAD TRAUMA',        color: '#FF1744' },
  electric_shock:{ protocol: 'ELECTRIC SHOCK',     color: '#FFB300' },
  fracture:      { protocol: 'FRACTURE PROTOCOL',  color: '#FFB300' },
  burns:         { protocol: 'BURNS PROTOCOL',     color: '#FF6B00' },
  gas_leak:      { protocol: 'GAS LEAK PROTOCOL',  color: '#FFB300' },
  shock:         { protocol: 'SHOCK TREATMENT',    color: '#FF1744' },
  breakdown:     { protocol: 'AUTOMOTIVE ASSIST',  color: '#FFB300' },
};

const SYSTEM_PROMPT =
  `You are RoadSOS, an AI emergency guide for Indian road users. ` +
  `Give immediate, clear, step-by-step guidance. ` +
  `Indian emergency numbers: Ambulance 108, Police 100, Fire 101, Highway 1033, Disaster 1070. ` +
  `Rules: Keep under 150 words. Use short bullet points. Be calm and directive. No disclaimers. ` +
  `If asked about nearby hospitals or police, tell them to use the Services tab in this app.`;

async function callAI(history, newUserText) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-8).map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text,
    })),
    { role: 'user', content: newUserText },
  ];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);
  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model: 'openai' }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return (await res.text()).trim();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ─── 3D AI Avatar Header Component ─────────────────────────────────────────
function AIAvatarHeader({ isTyping }) {
  const spinOrbit  = useRef(new Animated.Value(0)).current;
  const glowPulse  = useRef(new Animated.Value(0.4)).current;
  const rockY      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(spinOrbit, { toValue: 1, duration: 4000, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glowPulse, { toValue: 1,   duration: 1200, useNativeDriver: true }),
      Animated.timing(glowPulse, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(rockY, { toValue: 1, duration: 2500, useNativeDriver: true }),
      Animated.timing(rockY, { toValue: 0, duration: 2500, useNativeDriver: true }),
    ])).start();
  }, []);

  const spinDeg = spinOrbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rockDeg = rockY.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <LinearGradient colors={['#060A12', '#0D1428', '#060A12']} style={styles.header}>
      {/* Scan line */}
      <View style={styles.headerScanLine} />

      <View style={styles.headerLeft}>
        {/* 3D Avatar container */}
        <View style={styles.avatarContainer}>
          {/* Glow halo */}
          <Animated.View style={[styles.avatarGlow, { opacity: glowPulse }]} />
          {/* Orbital ring */}
          <Animated.View style={[styles.avatarOrbit, { transform: [{ perspective: 400 }, { rotateX: '68deg' }, { rotateZ: spinDeg }] }]} />
          {/* Main avatar with 3D rock */}
          <Animated.View style={[styles.aiAvatar, { transform: [{ perspective: 500 }, { rotateY: rockDeg }] }]}>
            <LinearGradient colors={['rgba(0,176,255,0.3)', 'rgba(0,80,180,0.2)']} style={styles.aiAvatarGrad}>
              <Text style={{ fontSize: 22 }}>🤖</Text>
            </LinearGradient>
          </Animated.View>
          {/* Status dot */}
          <View style={[styles.avatarStatusDot, { backgroundColor: isTyping ? '#FFB300' : '#00E676' }]} />
        </View>

        <View style={{ marginLeft: 4 }}>
          <Text style={styles.headerTitle}>RoadSOS <Text style={styles.aiLabel}>AI</Text></Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: isTyping ? '#FFB300' : '#00E676' }]} />
            <Text style={[styles.onlineText, { color: isTyping ? '#FFB300' : 'rgba(0,230,118,0.85)' }]}>
              {isTyping ? 'AI PROCESSING...' : '🟢 ONLINE · POLLINATIONS AI'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.modelBadge}>
        <LinearGradient colors={['rgba(0,176,255,0.2)', 'rgba(0,80,200,0.1)']} style={styles.modelBadgeGrad}>
          <Text style={styles.modelText}>REAL AI</Text>
        </LinearGradient>
      </View>
    </LinearGradient>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChatbotScreen({ navigation }) {
  const [messages, setMessages] = useState([{
    id: 1, role: 'ai', text: AI_RESPONSES.default.response,
    intent: null, timestamp: new Date(),
  }]);
  const [input,          setInput]          = useState('');
  const [isTyping,       setIsTyping]       = useState(false);
  const [activeProtocol, setActiveProtocol] = useState(null);

  const typingDot1    = useRef(new Animated.Value(0.3)).current;
  const typingDot2    = useRef(new Animated.Value(0.3)).current;
  const typingDot3    = useRef(new Animated.Value(0.3)).current;
  const protocolAnim  = useRef(new Animated.Value(0)).current;
  const inputGlow     = useRef(new Animated.Value(0)).current;
  const scrollRef     = useRef(null);

  useEffect(() => {
    Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(typingDot1, { toValue: 1,   duration: 400, useNativeDriver: true }),
          Animated.timing(typingDot1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(typingDot2, { toValue: 1,   duration: 400, useNativeDriver: true }),
          Animated.timing(typingDot2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(typingDot3, { toValue: 1,   duration: 400, useNativeDriver: true }),
          Animated.timing(typingDot3, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Input glow pulse
    Animated.loop(Animated.sequence([
      Animated.timing(inputGlow, { toValue: 1,   duration: 1800, useNativeDriver: false }),
      Animated.timing(inputGlow, { toValue: 0.3, duration: 1800, useNativeDriver: false }),
    ])).start();
  }, []);

  const sendMessage = async (text = input) => {
    const trimmed = (typeof text === 'string' ? text : input).trim();
    if (!trimmed || isTyping) return;

    const userMsg = { id: Date.now(), role: 'user', text: trimmed, timestamp: new Date() };
    const historySnapshot = messages;
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    const intent = detectIntent(trimmed);
    const proto  = PROTOCOL_MAP[intent] || null;

    let aiText;
    try {
      aiText = await callAI(historySnapshot, trimmed);
    } catch (e) {
      const fallback = AI_RESPONSES[intent] || AI_RESPONSES.default;
      aiText = fallback.response;
    }

    setIsTyping(false);
    const aiMsg = {
      id: Date.now() + 1, role: 'ai', text: aiText,
      protocol: proto?.protocol || null,
      color: proto?.color || '#00B0FF',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMsg]);

    if (proto?.protocol) {
      setActiveProtocol(proto);
      Animated.timing(protocolAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const inputBorderColor = inputGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,176,255,0.15)', 'rgba(0,176,255,0.45)'],
  });

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <LinearGradient colors={['#04080F', '#080C14', '#04080F']} style={styles.container}>
      {/* Background scan lines */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {[0.22, 0.42, 0.62, 0.82].map((frac, i) => (
          <View key={i} style={[styles.scanLine, { top: height * frac }]} />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* 3D Header */}
        <AIAvatarHeader isTyping={isTyping} />

        {/* Protocol Banner */}
        {activeProtocol && (
          <Animated.View style={[styles.protocolBanner, { opacity: protocolAnim }]}>
            <LinearGradient
              colors={[`${activeProtocol.color}28`, `${activeProtocol.color}10`]}
              style={[styles.protocolInner, {
                borderColor: `${activeProtocol.color}50`,
                shadowColor: activeProtocol.color,
                shadowOpacity: 0.6,
                shadowRadius: 12,
                elevation: 12,
              }]}
            >
              {/* Shine */}
              <LinearGradient colors={['rgba(255,255,255,0.08)', 'transparent']} style={styles.protocolShine} />
              <Text style={styles.protocolEmoji}>⚡</Text>
              <Text style={[styles.protocolText, { color: activeProtocol.color }]}>
                PROTOCOL: {activeProtocol.protocol}
              </Text>
              <TouchableOpacity onPress={() => { setActiveProtocol(null); protocolAnim.setValue(0); }}>
                <Text style={styles.protocolClose}>✕</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Quick Scenarios */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scenariosRow}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {SCENARIO_PROMPTS.map(s => (
            <TouchableOpacity key={s.key} onPress={() => sendMessage(s.label)}>
              <LinearGradient colors={['rgba(255,23,68,0.1)', 'rgba(255,23,68,0.04)']}
                style={styles.scenarioChip}>
                <Text style={styles.scenarioText}>{s.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={styles.messages}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}>
          {messages.map(msg => (
            <View key={msg.id} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
              {msg.role === 'ai' && (
                <View style={styles.aiAvatarSmallWrap}>
                  <View style={styles.aiAvatarSmall}>
                    <Text style={{ fontSize: 14 }}>🤖</Text>
                  </View>
                  {/* Tiny orbit ring around small avatar */}
                  <View style={styles.smallOrbit} />
                </View>
              )}

              {msg.role === 'ai' ? (
                <View style={[styles.bubbleAI, msg.protocol && { borderColor: `${msg.color}50`, shadowColor: msg.color, shadowOpacity: 0.2, shadowRadius: 10 }]}>
                  {msg.protocol && (
                    <LinearGradient colors={[`${msg.color}20`, 'transparent']} style={styles.protocolTag}>
                      <Text style={[styles.protocolTagText, { color: msg.color }]}>⚡ {msg.protocol}</Text>
                    </LinearGradient>
                  )}
                  <Text style={styles.bubbleText}>{msg.text}</Text>
                  <Text style={styles.timestamp}>{formatTime(msg.timestamp)}</Text>
                </View>
              ) : (
                <LinearGradient colors={['rgba(255,23,68,0.28)', 'rgba(160,0,25,0.2)']} style={styles.bubbleUser}>
                  <Text style={styles.bubbleTextUser}>{msg.text}</Text>
                  <Text style={[styles.timestamp, { color: 'rgba(255,180,180,0.5)' }]}>{formatTime(msg.timestamp)}</Text>
                </LinearGradient>
              )}
            </View>
          ))}

          {isTyping && (
            <View style={styles.typingRow}>
              <View style={styles.aiAvatarSmallWrap}>
                <View style={styles.aiAvatarSmall}><Text style={{ fontSize: 14 }}>🤖</Text></View>
                <View style={styles.smallOrbit} />
              </View>
              <View style={styles.typingBubble}>
                <Text style={styles.typingLabel}>AI PROCESSING</Text>
                <View style={styles.typingDots}>
                  {[typingDot1, typingDot2, typingDot3].map((dot, i) => (
                    <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <LinearGradient colors={['rgba(4,8,15,0.98)', 'rgba(8,12,20,0.99)']} style={styles.inputRow}>
            <Animated.View style={[styles.inputWrap, { borderColor: inputBorderColor }]}>
              <TextInput
                style={styles.input}
                placeholder="Describe your emergency..."
                placeholderTextColor="rgba(255,255,255,0.22)"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage()}
              />
            </Animated.View>
            <TouchableOpacity onPress={() => sendMessage()} disabled={!input.trim() || isTyping}>
              <LinearGradient
                colors={input.trim() && !isTyping ? ['#FF3060', '#FF1744', '#CC001A'] : ['#1A2030', '#1A2030']}
                style={styles.sendBtnInner}
              >
                <Text style={[styles.sendIcon, { opacity: input.trim() && !isTyping ? 1 : 0.3 }]}>➤</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Background scan lines
  scanLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,176,255,0.03)' },

  // Header
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,176,255,0.1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' },
  headerScanLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,176,255,0.15)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  aiLabel: { color: '#00B0FF' },

  // 3D Avatar
  avatarContainer: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  avatarGlow: {
    position: 'absolute', width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(0,176,255,0.18)',
    shadowColor: '#00B0FF', shadowOpacity: 0.9, shadowRadius: 16, shadowOffset: { width: 0, height: 0 },
  },
  avatarOrbit: {
    position: 'absolute', width: 58, height: 58, borderRadius: 29,
    borderWidth: 1.5, borderColor: 'rgba(0,176,255,0.55)',
    backgroundColor: 'transparent',
  },
  aiAvatar: {
    width: 46, height: 46, borderRadius: 23, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(0,176,255,0.4)',
    elevation: 10, shadowColor: '#00B0FF', shadowOpacity: 0.6, shadowRadius: 10,
  },
  aiAvatarGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarStatusDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1.5, borderColor: '#04080F',
  },

  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  modelBadge: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,176,255,0.3)' },
  modelBadgeGrad: { paddingHorizontal: 10, paddingVertical: 5 },
  modelText: { fontSize: 10, color: '#00B0FF', fontWeight: '800', letterSpacing: 1 },

  // Protocol banner
  protocolBanner: { marginHorizontal: 12, marginTop: 8 },
  protocolInner: { borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, overflow: 'hidden' },
  protocolShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 24, borderRadius: 14 },
  protocolEmoji: { fontSize: 18 },
  protocolText: { flex: 1, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  protocolClose: { fontSize: 14, color: 'rgba(255,255,255,0.4)', padding: 4 },

  // Scenario chips
  scenariosRow: { maxHeight: 50, marginTop: 8 },
  scenarioChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,23,68,0.28)' },
  scenarioText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  // Messages
  messages: { flex: 1, marginTop: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end', gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },

  // Small avatar
  aiAvatarSmallWrap: { position: 'relative', width: 32, height: 32, flexShrink: 0 },
  aiAvatarSmall: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,176,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(0,176,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  smallOrbit: {
    position: 'absolute', top: -3, left: -3, width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: 'rgba(0,176,255,0.25)',
    transform: [{ perspective: 300 }, { rotateX: '55deg' }],
  },

  // AI bubble
  bubbleAI: {
    maxWidth: width * 0.75, borderRadius: 18, borderTopLeftRadius: 4,
    padding: 13, paddingBottom: 8,
    backgroundColor: 'rgba(10,20,45,0.97)',
    borderWidth: 1, borderColor: 'rgba(0,176,255,0.18)',
    elevation: 6, shadowColor: '#00B0FF', shadowOpacity: 0.15, shadowRadius: 12,
  },
  // User bubble
  bubbleUser: {
    maxWidth: width * 0.75, borderRadius: 18, borderTopRightRadius: 4,
    padding: 13, paddingBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,23,68,0.35)',
    elevation: 6, shadowColor: '#FF1744', shadowOpacity: 0.2, shadowRadius: 10,
  },
  protocolTag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8, alignSelf: 'flex-start' },
  protocolTagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  bubbleText: { fontSize: 13.5, color: 'rgba(255,255,255,0.88)', lineHeight: 20 },
  bubbleTextUser: { fontSize: 13.5, color: '#FFF', lineHeight: 20 },
  timestamp: { fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 5, alignSelf: 'flex-end' },

  // Typing
  typingRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end', gap: 8 },
  typingBubble: {
    backgroundColor: 'rgba(10,20,45,0.97)', borderRadius: 18, borderTopLeftRadius: 4,
    padding: 14, borderWidth: 1, borderColor: 'rgba(0,176,255,0.2)',
    elevation: 4,
  },
  typingLabel: { fontSize: 9, color: 'rgba(0,176,255,0.6)', marginBottom: 8, fontWeight: '800', letterSpacing: 2 },
  typingDots: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#00B0FF',
    shadowColor: '#00B0FF', shadowOpacity: 1, shadowRadius: 6,
  },

  // Input
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,176,255,0.12)' },
  inputWrap: {
    flex: 1, borderRadius: 22, borderWidth: 1.5,
    backgroundColor: 'rgba(8,16,32,0.98)',
    paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100,
    shadowColor: '#00B0FF', shadowOpacity: 0.12, shadowRadius: 12,
  },
  input: { color: '#FFF', fontSize: 14, lineHeight: 20 },
  sendBtnInner: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    elevation: 12, shadowColor: '#FF1744', shadowOpacity: 0.7, shadowRadius: 16,
  },
  sendIcon: { fontSize: 18, color: '#FFF', fontWeight: '900' },
});
