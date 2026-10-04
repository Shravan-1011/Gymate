import type {
  MuscleGroup,
  WorkoutSplit,
} from '../types/workout';

export const workoutSplits: WorkoutSplit[] = [
  // =========================================
  // STANDARD — PUSH / PULL / LEGS
  // =========================================

  {
    id: 'push',
    name: 'PUSH',
    shortDescription: 'Chest, shoulders and triceps',
    targetMuscles: [
      'chest',
      'shoulders',
      'triceps',
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'bench-press',
      'incline-press',
      'shoulder-press',
      'lateral-raise',
      'tricep-pushdown',
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
    ] as MuscleGroup[],
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
    ] as MuscleGroup[],
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
  // STANDARD — UPPER / LOWER
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
    ] as MuscleGroup[],
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
    ] as MuscleGroup[],
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
  // BRO SPLITS
  // =========================================

  {
    id: 'chest-triceps',
    name: 'CHEST + TRICEPS',
    shortDescription: 'Chest and triceps focused workout',
    targetMuscles: [
      'chest',
      'triceps',
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'bench-press',
      'incline-dumbbell-press',
      'cable-fly',
      'tricep-pushdown',
      'overhead-tricep-extension',
      'skullcrusher',
    ],
  },

  {
    id: 'back-biceps',
    name: 'BACK + BICEPS',
    shortDescription: 'Back and biceps focused workout',
    targetMuscles: [
      'back',
      'lats',
      'biceps',
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'deadlift',
      'pull-up',
      'lat-pulldown',
      'barbell-row',
      'seated-cable-row',
      'barbell-curl',
      'hammer-curl',
    ],
  },

  {
    id: 'legs-shoulders',
    name: 'LEGS + SHOULDERS',
    shortDescription: 'Legs and shoulders focused workout',
    targetMuscles: [
      'quads',
      'hamstrings',
      'glutes',
      'calves',
      'shoulders',
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'barbell-squat',
      'leg-press',
      'romanian-deadlift',
      'leg-curl',
      'calf-raise',
      'overhead-press',
      'lateral-raise',
      'rear-delt-fly',
    ],
  },

  // =========================================
  // INDIVIDUAL MUSCLE
  // =========================================

  {
    id: 'chest',
    name: 'CHEST',
    shortDescription: 'Chest focused workout',
    targetMuscles: [
      'chest',
      'upper-chest',
    ] as MuscleGroup[],
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
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'barbell-row',
      'lat-pulldown',
      'seated-cable-row',
      'pull-up',
    ],
  },

  {
    id: 'shoulders',
    name: 'SHOULDERS',
    shortDescription: 'Shoulder focused workout',
    targetMuscles: [
      'shoulders',
      'rear-delts',
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'overhead-press',
      'lateral-raise',
      'rear-delt-fly',
    ],
  },

  {
    id: 'biceps',
    name: 'BICEPS',
    shortDescription: 'Biceps focused workout',
    targetMuscles: [
      'biceps',
      'forearms',
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'barbell-curl',
      'hammer-curl',
    ],
  },

  {
    id: 'triceps',
    name: 'TRICEPS',
    shortDescription: 'Triceps focused workout',
    targetMuscles: [
      'triceps',
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'tricep-pushdown',
      'overhead-tricep-extension',
      'skullcrusher',
    ],
  },

  {
    id: 'forearms',
    name: 'FOREARMS',
    shortDescription: 'Forearm focused workout',
    targetMuscles: [
      'forearms',
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'hammer-curl',
    ],
  },

  {
    id: 'quads',
    name: 'QUADS',
    shortDescription: 'Quadriceps focused workout',
    targetMuscles: [
      'quads',
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'barbell-squat',
      'leg-press',
      'leg-extension',
    ],
  },

  {
    id: 'hamstrings',
    name: 'HAMSTRINGS',
    shortDescription: 'Hamstring focused workout',
    targetMuscles: [
      'hamstrings',
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'romanian-deadlift',
      'leg-curl',
    ],
  },

  {
    id: 'glutes',
    name: 'GLUTES',
    shortDescription: 'Glute focused workout',
    targetMuscles: [
      'glutes',
      'hamstrings',
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'hip-thrust',
      'romanian-deadlift',
    ],
  },

  {
    id: 'calves',
    name: 'CALVES',
    shortDescription: 'Calf focused workout',
    targetMuscles: [
      'calves',
    ] as MuscleGroup[],
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
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'plank',
      'russian-twist',
      'mountain-climber',
    ],
  },

  {
    id: 'hip-flexors',
    name: 'HIP FLEXORS',
    shortDescription: 'Hip flexor focused workout',
    targetMuscles: [
      'hip-flexors',
    ] as MuscleGroup[],
    recommendedExerciseIds: [
      'mountain-climber',
    ],
  },
];