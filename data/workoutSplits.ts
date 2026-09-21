import { WorkoutSplit } from '../types/workout';



export const workoutSplits: WorkoutSplit[] = [
  // =========================================
  // CLASSIC SPLITS
  // =========================================

  {
    id: 'push',
    name: 'PUSH',
    shortDescription: 'Chest, shoulders and triceps',
    targetMuscles: [
      'chest',
      'shoulders',
      'triceps',
    ],
    recommendedExerciseIds: [
  'bench-press',
  'incline-press',
  'shoulder-press',
],
  },

  {
    id: 'pull',
    name: 'PULL',
    shortDescription: 'Back, biceps and rear delts',
    targetMuscles: [
      'back',
      'lats',
      'biceps',
      'rear-delts',
    ],
    recommendedExerciseIds: [
  'deadlift',
  'pull-up',
  'lat-pulldown',
  'barbell-row',
  'seated-cable-row',
  'barbell-curl',
  'hammer-curl',
  'rear-delt-fly',
],
  },

  {
    id: 'legs',
    name: 'LEGS',
    shortDescription: 'Quads, hamstrings, glutes and calves',
    targetMuscles: [
      'quads',
      'hamstrings',
      'glutes',
      'calves',
    ],
    recommendedExerciseIds: [
  'barbell-squat',
  'leg-press',
  'romanian-deadlift',
  'leg-curl',
  'leg-extension',
  'calf-raise',
],
  },

  // =========================================
  // UPPER / LOWER
  // =========================================

  {
    id: 'upper',
    name: 'UPPER BODY',
    shortDescription: 'Complete upper-body training',
    targetMuscles: [
      'chest',
      'back',
      'shoulders',
      'biceps',
      'triceps',
      'forearms',
    ],
    recommendedExerciseIds: [
  'bench-press',
  'incline-dumbbell-press',
  'pull-up',
  'lat-pulldown',
  'barbell-row',
  'overhead-press',
  'lateral-raise',
  'barbell-curl',
  'tricep-pushdown',
],

  },

  {
    id: 'lower',
    name: 'LOWER BODY',
    shortDescription: 'Complete lower-body training',
    targetMuscles: [
      'quads',
      'hamstrings',
      'glutes',
      'calves',
    ],
    recommendedExerciseIds: [
  'barbell-squat',
  'leg-press',
  'romanian-deadlift',
  'leg-curl',
  'leg-extension',
  'hip-thrust',
  'calf-raise',
],
  },

  // =========================================
  // FULL BODY
  // =========================================

  {
    id: 'full-body',
    name: 'FULL BODY',
    shortDescription: 'Train your entire body',
    targetMuscles: [
      'chest',
      'back',
      'shoulders',
      'quads',
      'hamstrings',
      'glutes',
      'biceps',
      'triceps',
      'calves',
      'abs',
    ],
    recommendedExerciseIds: [
  'barbell-squat',
  'bench-press',
  'barbell-row',
  'overhead-press',
  'romanian-deadlift',
  'lat-pulldown',
  'calf-raise',
  'crunch',
],
  },

  // =========================================
  // BRO SPLIT
  // =========================================

  {
    id: 'bro-split',
    name: 'BRO SPLIT',
    shortDescription: 'One major muscle group per training day',
    targetMuscles: [
      'chest',
      'back',
      'shoulders',
      'biceps',
      'triceps',
      'quads',
      'hamstrings',
    ],
    recommendedExerciseIds: [
  'bench-press',
  'incline-dumbbell-press',
  'cable-fly',
  'barbell-row',
  'lat-pulldown',
  'seated-cable-row',
  'barbell-curl',
  'tricep-pushdown',
  'barbell-squat',
  'leg-curl',
  'lateral-raise',
  'rear-delt-fly',
],
  },

  // =========================================
  // ARNOLD SPLIT
  // =========================================

  {
    id: 'arnold-split',
    name: 'ARNOLD SPLIT',
    shortDescription: 'Chest, back, shoulders and arms focused training',
    targetMuscles: [
      'chest',
      'back',
      'shoulders',
      'biceps',
      'triceps',
    ],
    recommendedExerciseIds: [
  'bench-press',
  'incline-dumbbell-press',
  'cable-fly',
  'barbell-row',
  'lat-pulldown',
  'seated-cable-row',
  'overhead-press',
  'lateral-raise',
  'rear-delt-fly',
  'barbell-curl',
  'tricep-pushdown',
],
  },

  // =========================================
  // PHUL
  // =========================================

  {
    id: 'phul',
    name: 'PHUL',
    shortDescription: 'Power and hypertrophy upper/lower split',
    targetMuscles: [
      'chest',
      'back',
      'shoulders',
      'biceps',
      'triceps',
      'quads',
      'hamstrings',
      'glutes',
    ],
    recommendedExerciseIds: [
  'barbell-squat',
  'bench-press',
  'deadlift',
  'overhead-press',
  'barbell-row',
  'barbell-curl',
  'tricep-pushdown',
  'leg-curl',
  'calf-raise',
],
  },

  // =========================================
  // PHAT
  // =========================================

  {
    id: 'phat',
    name: 'PHAT',
    shortDescription: 'Power and hypertrophy focused training',
    targetMuscles: [
      'chest',
      'back',
      'shoulders',
      'biceps',
      'triceps',
      'quads',
      'hamstrings',
      'glutes',
      'calves',
    ],
    recommendedExerciseIds: [
  'barbell-squat',
  'bench-press',
  'deadlift',
  'overhead-press',
  'barbell-row',
  'pull-up',
  'incline-dumbbell-press',
  'romanian-deadlift',
  'barbell-curl',
  'tricep-pushdown',
  'lateral-raise',
],
  },

  // =========================================
  // PPL × 2
  // =========================================

  {
    id: 'ppl-x2',
    name: 'PPL × 2',
    shortDescription: 'Push, pull and legs repeated twice per week',
    targetMuscles: [
      'chest',
      'back',
      'shoulders',
      'biceps',
      'triceps',
      'quads',
      'hamstrings',
      'glutes',
      'calves',
    ],
    recommendedExerciseIds: [
  'bench-press',
  'incline-dumbbell-press',
  'overhead-press',
  'lateral-raise',
  'tricep-pushdown',
  'pull-up',
  'lat-pulldown',
  'barbell-row',
  'seated-cable-row',
  'barbell-curl',
  'barbell-squat',
  'leg-press',
  'romanian-deadlift',
  'leg-curl',
  'calf-raise',
],
  },

  // =========================================
  // MUSCLE FOCUSED
  // =========================================

  {
    id: 'chest',
    name: 'CHEST',
    shortDescription: 'Chest focused workout',
    targetMuscles: [
      'chest',
      'upper-chest',
    ],
    recommendedExerciseIds: [
      'bench-press',
      'incline-dumbbell-press',
      'cable-fly',
    ],
  },

  {
    id: 'back',
    name: 'BACK',
    shortDescription: 'Back focused workout',
    targetMuscles: [
      'back',
      'lats',
      'traps',
    ],
    recommendedExerciseIds: [
      'barbell-row',
      'lat-pulldown',
      'seated-cable-row',
    ],
  },

  {
    id: 'shoulders',
    name: 'SHOULDERS',
    shortDescription: 'Shoulder focused workout',
    targetMuscles: [
      'shoulders',
      'rear-delts',
    ],
    recommendedExerciseIds: [
      'overhead-press',
      'lateral-raise',
      'rear-delt-fly',
    ],
  },

  {
    id: 'arms',
    name: 'ARMS',
    shortDescription: 'Biceps, triceps and forearms',
    targetMuscles: [
      'biceps',
      'triceps',
      'forearms',
    ],
    recommendedExerciseIds: [
      'barbell-curl',
      'tricep-pushdown',
      'hammer-curl',
    ],
  },

  {
    id: 'biceps',
    name: 'BICEPS',
    shortDescription: 'Biceps focused workout',
    targetMuscles: [
      'biceps',
      'forearms',
    ],
    recommendedExerciseIds: [
      'barbell-curl',
      'incline-dumbbell-press',
      'hammer-curl',
    ],
  },

  {
    id: 'triceps',
    name: 'TRICEPS',
    shortDescription: 'Triceps focused workout',
    targetMuscles: [
      'triceps',
    ],
    recommendedExerciseIds: [
      'tricep-pushdown',
      'overhead-tricep-extension',
      'skullcrusher',
    ],
  },

  {
    id: 'quads',
    name: 'QUADS',
    shortDescription: 'Quadriceps focused workout',
    targetMuscles: [
      'quads',
    ],
    recommendedExerciseIds: [
      'barbell-squat',
      'leg-press',
      'romanian-deadlift',
    ],
  },

  {
    id: 'hamstrings',
    name: 'HAMSTRINGS',
    shortDescription: 'Hamstring focused workout',
    targetMuscles: [
      'hamstrings',
      'glutes',
    ],
    recommendedExerciseIds: [
      'romanian-deadlift',
      'leg-curl',
      'glute-bench',
    ],
  },

  {
    id: 'glutes',
    name: 'GLUTES',
    shortDescription: 'Glute focused workout',
    targetMuscles: [
      'glutes',
      'hamstrings',
    ],
    recommendedExerciseIds: [
      'glute-bench',
      'hip-thruster',
      'single-leg-glute-hamraise',
    ],
  },

  {
    id: 'calves',
    name: 'CALVES',
    shortDescription: 'Calf focused workout',
    targetMuscles: [
      'calves',
    ],
    recommendedExerciseIds: [
      'calf-raise',
    ],
  },

  {
    id: 'abs',
    name: 'ABS',
    shortDescription: 'Core and abdominal focused workout',
    targetMuscles: [
      'abs',
      'hip-flexors',
    ],
    recommendedExerciseIds: [
      'plank',
      'russian-twist',
      'mountain-climber',
    ],
  },

  // =========================================
  // CUSTOM
  // =========================================

  {
    id: 'custom',
    name: 'CUSTOM',
    shortDescription: 'Build your own workout split',
    targetMuscles: [],
    recommendedExerciseIds: [],
  },
];