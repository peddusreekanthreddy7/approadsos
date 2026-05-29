// Offline Regional Cache — simulates SQLite/OSM data
// In production: populated by Python script querying OpenStreetMap tags

export const EMERGENCY_SERVICES = [
  {
    id: 1, type: 'hospital', level: 'L1',
    name: 'Apollo Hospitals', distance: 1.4, eta: '4 min',
    address: 'Jubilee Hills, Hyderabad', phone: '+914023607777',
    open24h: true, beds: 24, trauma: true,
    lat: 17.4318, lon: 78.4116,
    specialties: ['Trauma', 'Neurology', 'Cardiac'],
  },
  {
    id: 2, type: 'hospital', level: 'L2',
    name: 'KIMS Hospital', distance: 2.8, eta: '7 min',
    address: 'Secunderabad', phone: '+914044885000',
    open24h: true, beds: 12, trauma: true,
    lat: 17.4399, lon: 78.4983,
    specialties: ['Trauma', 'Ortho'],
  },
  {
    id: 3, type: 'hospital', level: 'L2',
    name: 'Care Hospital', distance: 3.5, eta: '9 min',
    address: 'Banjara Hills, Hyderabad', phone: '+914030418888',
    open24h: true, beds: 8, trauma: false,
    lat: 17.4139, lon: 78.4481,
    specialties: ['General', 'Ortho'],
  },
  {
    id: 4, type: 'police',
    name: 'Jubilee Hills PS', distance: 0.9, eta: '3 min',
    address: 'Road No. 36, Jubilee Hills', phone: '+914023555555',
    open24h: true,
    lat: 17.4311, lon: 78.4063,
  },
  {
    id: 5, type: 'police',
    name: 'Banjara Hills PS', distance: 2.1, eta: '5 min',
    address: 'Road No. 12, Banjara Hills', phone: '+914023666666',
    open24h: true,
    lat: 17.4126, lon: 78.4499,
  },
  {
    id: 6, type: 'fire',
    name: 'Fire Station HQ', distance: 1.8, eta: '5 min',
    address: 'Somajiguda, Hyderabad', phone: '+914023777777',
    open24h: true,
    lat: 17.4265, lon: 78.4691,
  },
  {
    id: 7, type: 'towing',
    name: 'Speed Towing 24/7', distance: 1.2, eta: '12 min',
    address: 'Madhapur', phone: '+919876543210',
    open24h: true,
    lat: 17.4435, lon: 78.3772,
  },
  {
    id: 8, type: 'towing',
    name: 'Highway Rescue Tow', distance: 3.0, eta: '18 min',
    address: 'Gachibowli', phone: '+919876500001',
    open24h: false,
    lat: 17.4405, lon: 78.3489,
  },
  {
    id: 9, type: 'puncture',
    name: 'RapidFix Tyres 24H', distance: 0.6, eta: '8 min',
    address: 'Film Nagar', phone: '+919988776655',
    open24h: true,
    lat: 17.4211, lon: 78.3981,
  },
  {
    id: 10, type: 'fuel',
    name: 'HP Petrol Bunk', distance: 0.4, eta: '2 min',
    address: 'Road No. 2, Banjara Hills', phone: '+914044991122',
    open24h: true,
    lat: 17.4155, lon: 78.4422,
  },
];

export const HAZMAT_PROTOCOLS = {
  chemical: {
    title: 'Chemical Spill / Tanker',
    color: '#FF6B00',
    icon: '☣️',
    safeDistance: '200m upwind',
    steps: [
      'Move 200 metres UPWIND immediately',
      'Do NOT approach the vehicle',
      'Call HAZMAT dispatch: 1800-HAZMAT',
      'Warn oncoming traffic if safe to do so',
      'Do not use open flames or sparks',
      'Await HAZMAT team — ETA ~15min',
    ],
    dispatchCode: 'HAZMAT-CHEM',
  },
  ev_fire: {
    title: 'EV / Electric Vehicle Fire',
    color: '#FF1744',
    icon: '⚡🔥',
    safeDistance: '100m (thermal runaway risk)',
    steps: [
      'Move 100 metres away IMMEDIATELY',
      'Thermal runaway risk — do NOT use water',
      'Call Fire Brigade: 101',
      'EV fires can reignite even after appearing out',
      'Keep crowd 100m away minimum',
      'Only specialized foam extinguishers work',
    ],
    dispatchCode: 'HAZMAT-EV',
  },
  gas_leak: {
    title: 'Gas Tanker / LPG Leak',
    color: '#FFB300',
    icon: '💨',
    safeDistance: '300m — explosive radius',
    steps: [
      'Evacuate 300m radius immediately',
      'No sparks, lighters, or phones nearby',
      'Call Gas Emergency: 1906',
      'Move upwind of the leak direction',
      'Do not use vehicle engine near leak',
      'Alert highway patrol immediately',
    ],
    dispatchCode: 'HAZMAT-GAS',
  },
};

export const MCI_TRIAGE = {
  title: 'Mass Casualty Incident (MCI)',
  priority_guide: [
    { color: '#FF1744', label: 'RED — Immediate', desc: 'Silent, not moving, serious breathing. Treat FIRST.' },
    { color: '#FFB300', label: 'YELLOW — Delayed', desc: 'Injured but stable. Can wait 30–60 min.' },
    { color: '#00E676', label: 'GREEN — Minor', desc: 'Walking, talking, screaming. Wait — they are stable.' },
    { color: '#333', label: 'BLACK — Expectant', desc: 'No pulse, not breathing. Do not attempt CPR in MCI.' },
  ],
  field_instructions: [
    'IGNORE victims who are screaming or walking',
    'Find victims who are SILENT or breathing heavily',
    'Check RED priority victims FIRST',
    'Do not move spinal injury victims',
    'Flag each victim with cloth: Red/Yellow/Green',
    'Request multi-ambulance dispatch',
  ],
};

export const ACCIDENT_BLACKSPOTS = [
  { id: 1, lat: 17.4350, lon: 78.4150, severity: 'high', name: 'Jubilee Hills Checkpost', incidents: 24 },
  { id: 2, lat: 17.4280, lon: 78.4600, severity: 'medium', name: 'Banjara Hills Flyover', incidents: 12 },
  { id: 3, lat: 17.4450, lon: 78.3800, severity: 'high', name: 'Hitech City Junction', incidents: 31 },
  { id: 4, lat: 17.4100, lon: 78.4300, severity: 'low', name: 'Panjagutta Circle', incidents: 7 },
];

export const AMBULANCE_NUMBERS = {
  national: '108',
  police: '100',
  fire: '101',
  womens: '1091',
  disaster: '1078',
  highway: '1033',
};

export const FIRST_AID_STEPS = {
  bleeding: [
    'Do NOT remove embedded objects',
    'Apply firm, direct pressure with clean cloth',
    'Elevate the wound above heart level if possible',
    'Do not remove cloth — add more on top if soaked',
    'Maintain pressure for at least 10 minutes',
  ],
  unconscious: [
    'Do NOT move the victim (spinal injury risk)',
    'Do NOT remove the helmet',
    'Check breathing — tilt chin up if no spinal risk',
    'Place in recovery position if breathing',
    'Begin CPR if no pulse: 30 compressions, 2 breaths',
    'Keep airway open — do not give water',
  ],
  fracture: [
    'Immobilize the limb — do NOT straighten it',
    'Splint with available material (stick, board)',
    'Elevate if possible to reduce swelling',
    'Apply ice pack wrapped in cloth',
    'Do not attempt to realign bone',
  ],
  burns: [
    'Cool with running cool water for 20 minutes',
    'Do NOT use ice, butter, or toothpaste',
    'Remove jewellery near burn area',
    'Cover with clean non-fluffy material',
    'Do NOT pop blisters',
  ],
};
