// program.js
// Fixed 6-day training program data. Exercise ids are PERMANENT storage keys —
// never rename them, even if the displayed name or scheme changes.
// Do not alter values, reorder, or "improve" the program.

const WEEKLY_MET_TARGET = 20.0;

const PROGRAM = [
  // --- Sunday (dow 0) ---------------------------------------------------
  {
    dow: 0,
    type: 'rest',
    eyebrow: '',
    title: 'Rest',
    durationMin: 0,
    cardio: [],
    protocol: [],
    exercises: []
  },

  // --- Monday (dow 1) -----------------------------------------------------
  {
    dow: 1,
    type: 'lift',
    eyebrow: 'Lower A',
    title: 'Squat & Quad Emphasis',
    durationMin: 45,
    cardio: [
      { id: 'mon-walk', name: 'Incline walk', detail: '20 min · 3.4 mph · 6% · 6.4 MET', metHours: 2.13 }
    ],
    protocol: [],
    exercises: [
      { id: 'mon-deadbug', name: 'Dead Bug', scheme: '3 × 8/side', note: 'Superset with Pallof. Anti-extension core.', intensity: 'bodyweight', unit: '' },
      { id: 'mon-pallof', name: 'Pallof Press', scheme: '3 × 10/side', note: 'Anti-rotation. Cable at chest height.', intensity: 'reserve', unit: 'kg' },
      { id: 'mon-squat', name: 'Barbell Back Squat', scheme: '4 × 6–8', note: 'Primary. Progress 2.5–5 kg/week.', intensity: 'reserve', unit: 'kg' },
      { id: 'mon-rdl', name: 'Barbell RDL', scheme: '3 × 8–10', note: 'Bar, not dumbbells. Hinge, soft knees.', intensity: 'reserve', unit: 'kg' },
      { id: 'mon-legext', name: 'Leg Extension', scheme: '3 × 12–15', note: 'Quad isolation. Take these genuinely hard.', intensity: 'failure', unit: 'kg' },
      { id: 'mon-abd', name: 'Hip Abduction Machine', scheme: '3 × 15', note: 'Superset with calves. Glute medius.', intensity: 'failure', unit: 'kg' },
      { id: 'mon-calf', name: 'Standing Calf Raise', scheme: '3 × 12–15', note: 'Straight knee — gastrocnemius.', intensity: 'failure', unit: 'kg' }
    ]
  },

  // --- Tuesday (dow 2) ------------------------------------------------------
  {
    dow: 2,
    type: 'lift',
    eyebrow: 'Upper A',
    title: 'Horizontal Emphasis',
    durationMin: 45,
    cardio: [
      { id: 'tue-bike', name: 'Hard bike', detail: '20 min · RPE 7–8 · ~10 MET', metHours: 3.33 }
    ],
    protocol: [],
    exercises: [
      { id: 'tue-bench', name: 'DB Bench Press', scheme: '4 × 6–8', note: 'Dumbbells — less wrist extension than bar.', intensity: 'reserve', unit: 'kg' },
      { id: 'tue-csrow', name: 'Chest-Supported Row', scheme: '4 × 8–10', note: 'Removes lower-back and wrist load.', intensity: 'reserve', unit: 'kg' },
      { id: 'tue-pulldown', name: 'Lat Pulldown', scheme: '3 × 8–10', note: 'Neutral grip + straps until wrist settles.', intensity: 'reserve', unit: 'kg' },
      { id: 'tue-ohp', name: 'DB Shoulder Press', scheme: '3 × 8–10', note: 'Only vertical push of the week.', intensity: 'reserve', unit: 'kg' },
      { id: 'tue-face', name: 'Face Pull', scheme: '3 × 15', note: '2 sec hold at peak. Add pause before load.', intensity: 'failure', unit: 'kg' },
      { id: 'tue-pushdown', name: 'Tricep Pushdown', scheme: '3 × 12', note: 'Superset with curls.', intensity: 'failure', unit: 'kg' },
      { id: 'tue-curl', name: 'DB Curl', scheme: '3 × 10–12', note: 'Supinated grip. 10 kg, not 12.5.', intensity: 'failure', unit: 'kg' }
    ]
  },

  // --- Wednesday (dow 3) ------------------------------------------------
  {
    dow: 3,
    type: 'cardio',
    eyebrow: 'Cardio',
    title: 'Moderate Steady + Balance',
    durationMin: 60,
    cardio: [
      { id: 'wed-steady', name: 'Steady bike or row', detail: '50 min · RPE 5–6 · 65–75% HRmax · 7 MET', metHours: 5.83 }
    ],
    protocol: [
      '50 min continuous, conversational pace',
      'Single-leg balance hold 3 × 30s/side',
      'Tandem stance 3 × 20s',
      'Towel scrunch 3 × 15 (foot intrinsics)'
    ],
    exercises: []
  },

  // --- Thursday (dow 4) ------------------------------------------------
  {
    dow: 4,
    type: 'lift',
    eyebrow: 'Lower B',
    title: 'Unilateral & Posterior',
    durationMin: 45,
    cardio: [
      { id: 'thu-walk', name: 'Incline walk', detail: '20 min · 3.4 mph · 6% · 6.4 MET', metHours: 2.13 }
    ],
    protocol: [],
    exercises: [
      { id: 'thu-birddog', name: 'Bird Dog', scheme: '3 × 8/side', note: '3 sec hold. Superset with plank.', intensity: 'bodyweight', unit: '' },
      { id: 'thu-plank', name: 'Plank', scheme: '3 × 40s', note: 'Up from 30s. Log seconds held.', intensity: 'bodyweight', unit: 'sec' },
      { id: 'thu-thrust', name: 'Barbell Hip Thrust', scheme: '4 × 8–10', note: 'Bench-elevated. Full ROM beats floor bridge.', intensity: 'reserve', unit: 'kg' },
      { id: 'thu-lunge', name: 'DB Reverse Lunge', scheme: '3 × 10/leg', note: 'Step back, in place. No floor space needed.', intensity: 'reserve', unit: 'kg' },
      { id: 'thu-slrdl', name: 'Single-leg RDL', scheme: '3 × 8/leg', note: 'Best proprioceptive exercise you have. Control over load.', intensity: 'reserve', unit: 'kg' },
      { id: 'thu-seatcalf', name: 'Seated Calf Raise', scheme: '3 × 15', note: 'Bent knee — soleus. Different from Monday.', intensity: 'failure', unit: 'kg' },
      { id: 'thu-balance', name: 'Single-leg Balance', scheme: '3 × 30s/side', note: 'Eyes open. Eyes closed after 2 stable weeks.', intensity: 'bodyweight', unit: 'sec' }
    ]
  },

  // --- Friday (dow 5) ----------------------------------------------------
  {
    dow: 5,
    type: 'lift',
    eyebrow: 'Upper B',
    title: 'Vertical Emphasis',
    durationMin: 45,
    cardio: [],
    protocol: [],
    exercises: [
      { id: 'fri-pullup', name: 'Pull-ups', scheme: '4 × 5', note: 'Box entry + straps for wrist. Log added kg (0 = bodyweight).', intensity: 'reserve', unit: 'kg' },
      { id: 'fri-incline', name: 'Incline DB Press', scheme: '4 × 8–10', note: 'Bench 30–45°. Only push of the day.', intensity: 'reserve', unit: 'kg' },
      { id: 'fri-sarow', name: 'Single-arm Cable Row', scheme: '3 × 10–12/side', note: 'Unilateral anti-rotation demand.', intensity: 'reserve', unit: 'kg' },
      { id: 'fri-lat', name: 'DB Lateral Raise', scheme: '3 × 12–15', note: 'Medial deltoid. Take to near failure.', intensity: 'failure', unit: 'kg' },
      { id: 'fri-extrot', name: 'Cable External Rotation', scheme: '2 × 15', note: '≤5 kg. This is rehab, not a strength lift.', intensity: 'reserve', unit: 'kg' },
      { id: 'fri-hammer', name: 'DB Hammer Curl', scheme: '3 × 10–12', note: 'Neutral grip — brachialis.', intensity: 'failure', unit: 'kg' }
    ]
  },

  // --- Saturday (dow 6) --------------------------------------------------
  {
    dow: 6,
    type: 'cardio',
    eyebrow: 'Cardio',
    title: 'Intervals + Steady',
    durationMin: 55,
    cardio: [
      { id: 'sat-int', name: 'Interval session', detail: '55 min · bike or row · ~7.2 MET avg', metHours: 6.57 }
    ],
    protocol: [
      '8 min easy warm-up',
      '8 × (60s @ RPE 8–9 / 90s easy) — 20 min',
      '22 min steady moderate',
      '5 min cooldown'
    ],
    exercises: []
  }
];

// Stable lookup by day-of-week (0=Sunday .. 6=Saturday).
const PROGRAM_BY_DOW = {};
for (const day of PROGRAM) PROGRAM_BY_DOW[day.dow] = day;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PROGRAM, PROGRAM_BY_DOW, WEEKLY_MET_TARGET };
}
