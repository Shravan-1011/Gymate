import { Exercise } from '../types/workout';

export const exercises: Exercise[] = [

  // ============================================================
  // CHEST
  // ============================================================

  {
    id: 'bench-press',
    name: 'BENCH PRESS',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'incline-bench-press',
    name: 'INCLINE BENCH PRESS',
    primaryMuscle: 'upper-chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'incline-dumbbell-press',
    name: 'INCLINE DUMBBELL PRESS',
    primaryMuscle: 'upper-chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'flat-dumbbell-press',
    name: 'FLAT DUMBBELL PRESS',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'decline-bench-press',
    name: 'DECLINE BENCH PRESS',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'decline-dumbbell-press',
    name: 'DECLINE DUMBBELL PRESS',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'cable-fly',
    name: 'CABLE FLY',
    primaryMuscle: 'chest',
    secondaryMuscles: [],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'low-to-high-cable-fly',
    name: 'LOW TO HIGH CABLE FLY',
    primaryMuscle: 'upper-chest',
    secondaryMuscles: [],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'high-to-low-cable-fly',
    name: 'HIGH TO LOW CABLE FLY',
    primaryMuscle: 'chest',
    secondaryMuscles: [],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'pec-deck',
    name: 'PEC DECK',
    primaryMuscle: 'chest',
    secondaryMuscles: [],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'chest-press-machine',
    name: 'CHEST PRESS MACHINE',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'push-up',
    name: 'PUSH UP',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'bodyweight',
    isCustom: false,
  },

  {
    id: 'dips-chest',
    name: 'CHEST DIPS',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'bodyweight',
    isCustom: false,
  },

  // ============================================================
  // BACK
  // ============================================================

  {
    id: 'deadlift',
    name: 'DEADLIFT',
    primaryMuscle: 'back',
    secondaryMuscles: ['hamstrings', 'glutes', 'traps'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'pull-up',
    name: 'PULL UP',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'bodyweight',
    isCustom: false,
  },

  {
    id: 'chin-up',
    name: 'CHIN UP',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'bodyweight',
    isCustom: false,
  },

  {
    id: 'lat-pulldown',
    name: 'LAT PULLDOWN',
    primaryMuscle: 'lats',
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'close-grip-lat-pulldown',
    name: 'CLOSE GRIP LAT PULLDOWN',
    primaryMuscle: 'lats',
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'barbell-row',
    name: 'BARBELL ROW',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps', 'rear-delts'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'pendlay-row',
    name: 'PENDLAY ROW',
    primaryMuscle: 'back',
    secondaryMuscles: ['lats', 'rear-delts', 'biceps'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'dumbbell-row',
    name: 'DUMBBELL ROW',
    primaryMuscle: 'back',
    secondaryMuscles: ['lats', 'biceps'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'seated-cable-row',
    name: 'SEATED CABLE ROW',
    primaryMuscle: 'back',
    secondaryMuscles: ['lats', 'biceps'],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'single-arm-cable-row',
    name: 'SINGLE ARM CABLE ROW',
    primaryMuscle: 'lats',
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'machine-row',
    name: 'MACHINE ROW',
    primaryMuscle: 'back',
    secondaryMuscles: ['lats', 'biceps'],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'straight-arm-pulldown',
    name: 'STRAIGHT ARM PULLDOWN',
    primaryMuscle: 'lats',
    secondaryMuscles: [],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'chest-supported-row',
    name: 'CHEST SUPPORTED ROW',
    primaryMuscle: 'back',
    secondaryMuscles: ['lats', 'rear-delts'],
    equipment: 'machine',
    isCustom: false,
  },

  // ============================================================
  // SHOULDERS
  // ============================================================

  {
    id: 'overhead-press',
    name: 'OVERHEAD PRESS',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps', 'upper-chest'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'dumbbell-shoulder-press',
    name: 'DUMBBELL SHOULDER PRESS',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'arnold-press',
    name: 'ARNOLD PRESS',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'lateral-raise',
    name: 'LATERAL RAISE',
    primaryMuscle: 'shoulders',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'cable-lateral-raise',
    name: 'CABLE LATERAL RAISE',
    primaryMuscle: 'shoulders',
    secondaryMuscles: [],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'machine-lateral-raise',
    name: 'MACHINE LATERAL RAISE',
    primaryMuscle: 'shoulders',
    secondaryMuscles: [],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'front-raise',
    name: 'FRONT RAISE',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['upper-chest'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'rear-delt-fly',
    name: 'REAR DELT FLY',
    primaryMuscle: 'rear-delts',
    secondaryMuscles: ['shoulders'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'reverse-pec-deck',
    name: 'REVERSE PEC DECK',
    primaryMuscle: 'rear-delts',
    secondaryMuscles: ['shoulders'],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'face-pull',
    name: 'FACE PULL',
    primaryMuscle: 'rear-delts',
    secondaryMuscles: ['shoulders', 'traps'],
    equipment: 'cable',
    isCustom: false,
  },

  // ============================================================
  // BICEPS
  // ============================================================

  {
    id: 'barbell-curl',
    name: 'BARBELL CURL',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'ez-bar-curl',
    name: 'EZ BAR CURL',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'dumbbell-curl',
    name: 'DUMBBELL CURL',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'alternating-dumbbell-curl',
    name: 'ALTERNATING DUMBBELL CURL',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'hammer-curl',
    name: 'HAMMER CURL',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'cross-body-hammer-curl',
    name: 'CROSS BODY HAMMER CURL',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'preacher-curl',
    name: 'PREACHER CURL',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'preacher-dumbbell-curl',
    name: 'PREACHER DUMBBELL CURL',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'cable-curl',
    name: 'CABLE CURL',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'incline-dumbbell-curl',
    name: 'INCLINE DUMBBELL CURL',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'concentration-curl',
    name: 'CONCENTRATION CURL',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  // ============================================================
  // TRICEPS
  // ============================================================

  {
    id: 'tricep-pushdown',
    name: 'TRICEP PUSHDOWN',
    primaryMuscle: 'triceps',
    secondaryMuscles: [],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'rope-tricep-pushdown',
    name: 'ROPE TRICEP PUSHDOWN',
    primaryMuscle: 'triceps',
    secondaryMuscles: [],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'overhead-tricep-extension',
    name: 'OVERHEAD TRICEP EXTENSION',
    primaryMuscle: 'triceps',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'cable-overhead-tricep-extension',
    name: 'CABLE OVERHEAD TRICEP EXTENSION',
    primaryMuscle: 'triceps',
    secondaryMuscles: [],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'skull-crusher',
    name: 'SKULL CRUSHER',
    primaryMuscle: 'triceps',
    secondaryMuscles: [],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'close-grip-bench-press',
    name: 'CLOSE GRIP BENCH PRESS',
    primaryMuscle: 'triceps',
    secondaryMuscles: ['chest', 'shoulders'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'tricep-dips',
    name: 'TRICEP DIPS',
    primaryMuscle: 'triceps',
    secondaryMuscles: ['chest', 'shoulders'],
    equipment: 'bodyweight',
    isCustom: false,
  },

  {
    id: 'dumbbell-kickback',
    name: 'DUMBBELL KICKBACK',
    primaryMuscle: 'triceps',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'machine-tricep-extension',
    name: 'MACHINE TRICEP EXTENSION',
    primaryMuscle: 'triceps',
    secondaryMuscles: [],
    equipment: 'machine',
    isCustom: false,
  },

  // ============================================================
  // QUADS
  // ============================================================

  {
    id: 'barbell-squat',
    name: 'BARBELL SQUAT',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'front-squat',
    name: 'FRONT SQUAT',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'hack-squat',
    name: 'HACK SQUAT',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes'],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'leg-press',
    name: 'LEG PRESS',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes'],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'leg-extension',
    name: 'LEG EXTENSION',
    primaryMuscle: 'quads',
    secondaryMuscles: [],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'walking-lunge',
    name: 'WALKING LUNGE',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'reverse-lunge',
    name: 'REVERSE LUNGE',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'goblet-squat',
    name: 'GOBLET SQUAT',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  // ============================================================
  // HAMSTRINGS
  // ============================================================

  {
    id: 'romanian-deadlift',
    name: 'ROMANIAN DEADLIFT',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: ['glutes', 'back'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'dumbbell-romanian-deadlift',
    name: 'DUMBBELL ROMANIAN DEADLIFT',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: ['glutes'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'stiff-leg-deadlift',
    name: 'STIFF LEG DEADLIFT',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: ['glutes', 'back'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'leg-curl',
    name: 'LEG CURL',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: [],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'seated-leg-curl',
    name: 'SEATED LEG CURL',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: [],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'lying-leg-curl',
    name: 'LYING LEG CURL',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: [],
    equipment: 'machine',
    isCustom: false,
  },

  // ============================================================
  // GLUTES
  // ============================================================

  {
    id: 'hip-thrust',
    name: 'HIP THRUST',
    primaryMuscle: 'glutes',
    secondaryMuscles: ['hamstrings'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'barbell-glute-bridge',
    name: 'BARBELL GLUTE BRIDGE',
    primaryMuscle: 'glutes',
    secondaryMuscles: ['hamstrings'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'bulgarian-split-squat',
    name: 'BULGARIAN SPLIT SQUAT',
    primaryMuscle: 'glutes',
    secondaryMuscles: ['quads', 'hamstrings'],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'cable-kickback',
    name: 'CABLE KICKBACK',
    primaryMuscle: 'glutes',
    secondaryMuscles: [],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'glute-kickback-machine',
    name: 'GLUTE KICKBACK MACHINE',
    primaryMuscle: 'glutes',
    secondaryMuscles: [],
    equipment: 'machine',
    isCustom: false,
  },

  // ============================================================
  // CALVES
  // ============================================================

  {
    id: 'calf-raise',
    name: 'CALF RAISE',
    primaryMuscle: 'calves',
    secondaryMuscles: [],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'standing-calf-raise',
    name: 'STANDING CALF RAISE',
    primaryMuscle: 'calves',
    secondaryMuscles: [],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'seated-calf-raise',
    name: 'SEATED CALF RAISE',
    primaryMuscle: 'calves',
    secondaryMuscles: [],
    equipment: 'machine',
    isCustom: false,
  },

  {
    id: 'dumbbell-calf-raise',
    name: 'DUMBBELL CALF RAISE',
    primaryMuscle: 'calves',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    isCustom: false,
  },

  // ============================================================
  // ABS
  // ============================================================

  {
    id: 'crunch',
    name: 'CRUNCH',
    primaryMuscle: 'abs',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    isCustom: false,
  },

  {
    id: 'cable-crunch',
    name: 'CABLE CRUNCH',
    primaryMuscle: 'abs',
    secondaryMuscles: [],
    equipment: 'cable',
    isCustom: false,
  },

  {
    id: 'hanging-leg-raise',
    name: 'HANGING LEG RAISE',
    primaryMuscle: 'abs',
    secondaryMuscles: ['hip-flexors'],
    equipment: 'bodyweight',
    isCustom: false,
  },

  {
    id: 'lying-leg-raise',
    name: 'LYING LEG RAISE',
    primaryMuscle: 'abs',
    secondaryMuscles: ['hip-flexors'],
    equipment: 'bodyweight',
    isCustom: false,
  },

  {
    id: 'knee-raise',
    name: 'KNEE RAISE',
    primaryMuscle: 'abs',
    secondaryMuscles: ['hip-flexors'],
    equipment: 'bodyweight',
    isCustom: false,
  },

  {
    id: 'ab-wheel-rollout',
    name: 'AB WHEEL ROLLOUT',
    primaryMuscle: 'abs',
    secondaryMuscles: [],
    equipment: 'other',
    isCustom: false,
  },

  {
    id: 'plank',
    name: 'PLANK',
    primaryMuscle: 'abs',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    isCustom: false,
  },

  {
    id: 'russian-twist',
    name: 'RUSSIAN TWIST',
    primaryMuscle: 'abs',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    isCustom: false,
  },

  // ============================================================
  // FOREARMS
  // ============================================================

  {
    id: 'wrist-curl',
    name: 'WRIST CURL',
    primaryMuscle: 'forearms',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'reverse-wrist-curl',
    name: 'REVERSE WRIST CURL',
    primaryMuscle: 'forearms',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    isCustom: false,
  },

  {
    id: 'reverse-curl',
    name: 'REVERSE CURL',
    primaryMuscle: 'forearms',
    secondaryMuscles: ['biceps'],
    equipment: 'barbell',
    isCustom: false,
  },

  {
    id: 'farmer-walk',
    name: 'FARMER WALK',
    primaryMuscle: 'forearms',
    secondaryMuscles: ['traps'],
    equipment: 'dumbbell',
    isCustom: false,
  },

];