import {
  WorkoutSession,
  Exercise,
  WorkoutExercise,
} from '../types/workout';

const benchPress: Exercise = {
  id: 'bench-press',
  name: 'BENCH PRESS',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  equipment: 'barbell',
  isCustom: false,
};

const inclinePress: Exercise = {
  id: 'incline-press',
  name: 'INCLINE DUMBBELL PRESS',
  primaryMuscle: 'chest',
  secondaryMuscles: ['shoulders', 'triceps'],
  equipment: 'dumbbell',
  isCustom: false,
};

const shoulderPress: Exercise = {
  id: 'shoulder-press',
  name: 'SHOULDER PRESS',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['triceps'],
  equipment: 'dumbbell',
  isCustom: false,
};

const benchPressWorkout: WorkoutExercise = {
  exercise: benchPress,

  sets: [
    {
      id: 'bench-1',
      setNumber: 1,
      type: 'working',
      weight: 60,
      reps: 10,
      completed: false,
    },
    {
      id: 'bench-2',
      setNumber: 2,
      type: 'working',
      weight: 60,
      reps: 10,
      completed: false,
    },
    {
      id: 'bench-3',
      setNumber: 3,
      type: 'working',
      weight: 65,
      reps: 8,
      completed: false,
    },
  ],
};

const inclinePressWorkout: WorkoutExercise = {
  exercise: inclinePress,

  sets: [
    {
      id: 'incline-1',
      setNumber: 1,
      type: 'working',
      weight: 20,
      reps: 10,
      completed: false,
    },
    {
      id: 'incline-2',
      setNumber: 2,
      type: 'working',
      weight: 20,
      reps: 10,
      completed: false,
    },
    {
      id: 'incline-3',
      setNumber: 3,
      type: 'working',
      weight: 20,
      reps: 8,
      completed: false,
    },
  ],
};

const shoulderPressWorkout: WorkoutExercise = {
  exercise: shoulderPress,

  sets: [
    {
      id: 'shoulder-1',
      setNumber: 1,
      type: 'working',
      weight: 15,
      reps: 10,
      completed: false,
    },
    {
      id: 'shoulder-2',
      setNumber: 2,
      type: 'working',
      weight: 15,
      reps: 10,
      completed: false,
    },
    {
      id: 'shoulder-3',
      setNumber: 3,
      type: 'working',
      weight: 15,
      reps: 8,
      completed: false,
    },
  ],
};

export const mockWorkout: WorkoutSession = {
  id: 'workout-001',

  splitId: 'push',

  name: 'PUSH DAY',

  startedAt: '2026-09-13T00:00:00.000Z',

  status: 'active',

  exercises: [
    benchPressWorkout,
    inclinePressWorkout,
    shoulderPressWorkout,
  ],
};