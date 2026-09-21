import type {
  WorkoutExercise,
  WorkoutSession,
} from '../types/workout';

/*
 * ========================================
 * BASIC EXERCISE VOLUME
 * ========================================
 *
 * Volume = weight × reps
 *
 * Only completed sets count.
 */

export function getExerciseVolume(
  exercise: WorkoutExercise
): number {
  return exercise.sets.reduce(
    (total, set) => {
      if (!set.completed) {
        return total;
      }

      return total + set.weight * set.reps;
    },
    0
  );
}

/*
 * ========================================
 * WORKOUT VOLUME
 * ========================================
 */

export function getWorkoutVolume(
  workout: WorkoutSession
): number {
  return workout.exercises.reduce(
    (total, exercise) =>
      total + getExerciseVolume(exercise),
    0
  );
}

/*
 * ========================================
 * COMPLETED SETS
 * ========================================
 */

export function getCompletedSets(
  workout: WorkoutSession
): number {
  return workout.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.filter(
        (set) => set.completed
      ).length,
    0
  );
}

/*
 * ========================================
 * COMPLETED REPS
 * ========================================
 */

export function getCompletedReps(
  exercise: WorkoutExercise
): number {
  return exercise.sets.reduce(
    (total, set) =>
      total +
      (set.completed ? set.reps : 0),
    0
  );
}

/*
 * ========================================
 * TOTAL SETS
 * ========================================
 */

export function getTotalSets(
  workout: WorkoutSession
): number {
  return workout.exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.length,
    0
  );
}

/*
 * ========================================
 * COMPLETED SETS FOR EXERCISE
 * ========================================
 */

export function getCompletedSetsForExercise(
  exercise: WorkoutExercise
): number {
  return exercise.sets.filter(
    (set) => set.completed
  ).length;
}

/*
 * ========================================
 * WORKOUT TIMESTAMP
 * ========================================
 */

export function getWorkoutTimestamp(
  workout: WorkoutSession
): number {
  const timestamp =
    workout.endedAt ??
    workout.startedAt;

  if (!timestamp) {
    return 0;
  }

  return new Date(timestamp).getTime();
}

/*
 * ========================================
 * WORKOUT DATE
 * ========================================
 */

export function getWorkoutDate(
  workout: WorkoutSession
): string {
  const timestamp =
    workout.endedAt ??
    workout.startedAt;

  if (!timestamp) {
    return '';
  }

  return new Date(timestamp)
    .toISOString()
    .split('T')[0];
}

/*
 * ========================================
 * COMPLETED WORKOUTS
 * ========================================
 */

export function getCompletedWorkouts(
  workoutHistory: WorkoutSession[]
): WorkoutSession[] {
  return workoutHistory
    .filter(
      (workout) =>
        workout.status === 'completed'
    )
    .sort(
      (a, b) =>
        getWorkoutTimestamp(a) -
        getWorkoutTimestamp(b)
    );
}

/*
 * ========================================
 * SPLIT HISTORY
 * ========================================
 */

export function getSplitHistory(
  splitId: string,
  workoutHistory: WorkoutSession[],
  excludeWorkoutId?: string
): WorkoutSession[] {
  return getCompletedWorkouts(
    workoutHistory
  ).filter(
    (workout) =>
      workout.splitId === splitId &&
      workout.id !== excludeWorkoutId
  );
}

/*
 * ========================================
 * AVERAGE WORKOUT VOLUME
 * ========================================
 */

export function getAverageWorkoutVolume(
  workouts: WorkoutSession[]
): number {
  if (workouts.length === 0) {
    return 0;
  }

  const totalVolume =
    workouts.reduce(
      (total, workout) =>
        total + getWorkoutVolume(workout),
      0
    );

  return totalVolume / workouts.length;
}

/*
 * ========================================
 * FIND PREVIOUS EXERCISE
 * ========================================
 */

export function findPreviousExercise(
  exercise: WorkoutExercise,
  previousWorkouts: WorkoutSession[]
): WorkoutExercise | null {
  for (const workout of previousWorkouts) {
    const previousExercise =
      workout.exercises.find(
        (item) =>
          item.exercise.id ===
          exercise.exercise.id
      );

    if (previousExercise) {
      return previousExercise;
    }
  }

  return null;
}

/*
 * ========================================
 * EXERCISE HISTORY
 * ========================================
 */

export function getExerciseHistory(
  exerciseId: string,
  workouts: WorkoutSession[]
): WorkoutExercise[] {
  const history: WorkoutExercise[] = [];

  workouts.forEach((workout) => {
    const exercise =
      workout.exercises.find(
        (item) =>
          item.exercise.id === exerciseId
      );

    if (exercise) {
      history.push(exercise);
    }
  });

  return history;
}

/*
 * ========================================
 * AVERAGE EXERCISE VOLUME
 * ========================================
 */

export function getAverageExerciseVolume(
  exerciseId: string,
  workouts: WorkoutSession[]
): number {
  const exerciseHistory =
    getExerciseHistory(
      exerciseId,
      workouts
    );

  if (exerciseHistory.length === 0) {
    return 0;
  }

  const totalVolume =
    exerciseHistory.reduce(
      (total, exercise) =>
        total + getExerciseVolume(exercise),
      0
    );

  return (
    totalVolume /
    exerciseHistory.length
  );
}

/*
 * ========================================
 * BEST EXERCISE VOLUME
 * ========================================
 */

export function getBestExerciseVolume(
  exerciseId: string,
  workouts: WorkoutSession[]
): number {
  const exerciseHistory =
    getExerciseHistory(
      exerciseId,
      workouts
    );

  if (exerciseHistory.length === 0) {
    return 0;
  }

  return Math.max(
    ...exerciseHistory.map(
      (exercise) =>
        getExerciseVolume(exercise)
    )
  );
}

/*
 * ========================================
 * LATEST EXERCISE
 * ========================================
 */

export function getLatestExercise(
  exerciseId: string,
  workouts: WorkoutSession[]
): WorkoutExercise | null {
  const sorted = [...workouts].sort(
    (a, b) =>
      getWorkoutTimestamp(b) -
      getWorkoutTimestamp(a)
  );

  for (const workout of sorted) {
    const exercise =
      workout.exercises.find(
        (item) =>
          item.exercise.id === exerciseId
      );

    if (exercise) {
      return exercise;
    }
  }

  return null;
}

/*
 * ========================================
 * PERFORMANCE %
 * ========================================
 */

export function calculatePerformance(
  currentValue: number,
  averageValue: number
): number {
  if (averageValue <= 0) {
    return 0;
  }

  return (
    ((currentValue - averageValue) /
      averageValue) *
    100
  );
}

/*
 * ========================================
 * WORKOUT PERFORMANCE
 * ========================================
 */

export function getWorkoutPerformance(
  workout: WorkoutSession,
  workoutHistory: WorkoutSession[]
): number {
  const previousWorkouts =
    getSplitHistory(
      workout.splitId,
      workoutHistory,
      workout.id
    );

  if (previousWorkouts.length === 0) {
    return 0;
  }

  const averageVolume =
    getAverageWorkoutVolume(
      previousWorkouts
    );

  const currentVolume =
    getWorkoutVolume(workout);

  return calculatePerformance(
    currentVolume,
    averageVolume
  );
}

/*
 * ========================================
 * EXERCISE PERFORMANCE
 * ========================================
 */

export function getExercisePerformance(
  exercise: WorkoutExercise,
  previousWorkouts: WorkoutSession[]
): number | null {
  const averageVolume =
    getAverageExerciseVolume(
      exercise.exercise.id,
      previousWorkouts
    );

  if (averageVolume <= 0) {
    return null;
  }

  const currentVolume =
    getExerciseVolume(exercise);

  return calculatePerformance(
    currentVolume,
    averageVolume
  );
}

/*
 * ========================================
 * PERFORMANCE STATUS
 * ========================================
 */

export type PerformanceStatus =
  | 'improved'
  | 'decreased'
  | 'unchanged'
  | 'new';

export function getPerformanceStatus(
  performance: number | null
): PerformanceStatus {
  if (performance === null) {
    return 'new';
  }

  const threshold = 0.5;

  if (performance > threshold) {
    return 'improved';
  }

  if (performance < -threshold) {
    return 'decreased';
  }

  return 'unchanged';
}

/*
 * ========================================
 * ROUND PERFORMANCE
 * ========================================
 */

export function roundPerformance(
  performance: number
): number {
  return Number(
    performance.toFixed(1)
  );
}

/*
 * ========================================
 * XP CALCULATION
 * ========================================
 */

export function calculateWorkoutXP(
  performance: number,
  baseXP = 100
): number {
  let xp = baseXP;

  if (performance > 0) {
    xp += Math.floor(performance) * 4;
  } else if (performance < 0) {
    xp += Math.ceil(performance);
  }

  return Math.max(0, xp);
}
/*
 * ========================================
 * TRAINING STREAK
 * ========================================
 */

export function getTrainingStreak(
  workoutHistory: WorkoutSession[]
): number {
  const completedWorkouts =
    getCompletedWorkouts(
      workoutHistory
    ).sort(
      (a, b) =>
        getWorkoutTimestamp(b) -
        getWorkoutTimestamp(a)
    );

  if (completedWorkouts.length === 0) {
    return 0;
  }

  const uniqueDates = Array.from(
    new Set(
      completedWorkouts.map((workout) =>
        getWorkoutDate(workout)
      )
    )
  );

  let streak = 1;

  for (
    let i = 1;
    i < uniqueDates.length;
    i++
  ) {
    const previousDate = new Date(
      uniqueDates[i - 1]
    );

    const currentDate = new Date(
      uniqueDates[i]
    );

    const difference = Math.round(
      (previousDate.getTime() -
        currentDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (difference === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/*
 * ========================================
 * TOTAL WORKOUTS
 * ========================================
 */

export function getTotalWorkouts(
  workoutHistory: WorkoutSession[]
): number {
  return getCompletedWorkouts(
    workoutHistory
  ).length;
}

/*
 * ========================================
 * TOTAL TRAINING DAYS
 * ========================================
 */

export function getTotalTrainingDays(
  workoutHistory: WorkoutSession[]
): number {
  const completedWorkouts =
    getCompletedWorkouts(
      workoutHistory
    );

  const dates = new Set<string>();

  completedWorkouts.forEach(
    (workout) => {
      const date = getWorkoutDate(workout);

      if (date) {
        dates.add(date);
      }
    }
  );

  return dates.size;
}

/*
 * ========================================
 * TOTAL TRAINING VOLUME
 * ========================================
 */

export function getTotalTrainingVolume(
  workoutHistory: WorkoutSession[]
): number {
  return getCompletedWorkouts(
    workoutHistory
  ).reduce(
    (total, workout) =>
      total + getWorkoutVolume(workout),
    0
  );
}

/*
 * ========================================
 * AVERAGE TRAINING VOLUME
 * ========================================
 */

export function getAverageTrainingVolume(
  workoutHistory: WorkoutSession[]
): number {
  return getAverageWorkoutVolume(
    getCompletedWorkouts(
      workoutHistory
    )
  );
}

/*
 * ========================================
 * OVERALL AVERAGE VOLUME
 * ========================================
 */

export function getOverallAverageVolume(
  workoutHistory: WorkoutSession[]
): number {
  return roundPerformance(
    getAverageTrainingVolume(
      workoutHistory
    )
  );
}

/*
 * ========================================
 * TOTAL TRAINING XP
 * ========================================
 */

export function getTotalTrainingXP(
  workoutHistory: WorkoutSession[]
): number {
  const completedWorkouts =
    getCompletedWorkouts(
      workoutHistory
    );

  let totalXP = 0;

  const workoutsBySplit: Record<
    string,
    WorkoutSession[]
  > = {};

  completedWorkouts.forEach(
    (workout) => {
      if (
        !workoutsBySplit[workout.splitId]
      ) {
        workoutsBySplit[workout.splitId] =
          [];
      }

      const previousWorkouts =
        workoutsBySplit[workout.splitId];

      if (previousWorkouts.length === 0) {
        totalXP += 100;
      } else {
        const averageVolume =
          getAverageWorkoutVolume(
            previousWorkouts
          );

        const currentVolume =
          getWorkoutVolume(workout);

        const performance =
          calculatePerformance(
            currentVolume,
            averageVolume
          );

        totalXP += calculateWorkoutXP(
          performance
        );
      }

      previousWorkouts.push(workout);
    }
  );

  return totalXP;
}

/*
 * ========================================
 * PROGRESS DATA POINT
 * ========================================
 */

export type ProgressDataPoint = {
  workoutId: string;
  splitId: string;
  date: string;
  volume: number;
  performance: number;
  xp: number;
};

/*
 * ========================================
 * GET PROGRESS DATA
 * ========================================
 */

export function getProgressData(
  workoutHistory: WorkoutSession[]
): ProgressDataPoint[] {
  const completedWorkouts =
    getCompletedWorkouts(
      workoutHistory
    );

  const workoutsBySplit: Record<
    string,
    WorkoutSession[]
  > = {};

  const progress: ProgressDataPoint[] =
    [];

  completedWorkouts.forEach(
    (workout) => {
      if (
        !workoutsBySplit[workout.splitId]
      ) {
        workoutsBySplit[workout.splitId] =
          [];
      }

      const previousWorkouts =
        workoutsBySplit[workout.splitId];

      const currentVolume =
        getWorkoutVolume(workout);

      let performance = 0;

      if (previousWorkouts.length > 0) {
        const averageVolume =
          getAverageWorkoutVolume(
            previousWorkouts
          );

        performance =
          calculatePerformance(
            currentVolume,
            averageVolume
          );
      }

      const xp =
        previousWorkouts.length === 0
          ? 100
          : calculateWorkoutXP(
              performance
            );

      progress.push({
        workoutId: workout.id,
        splitId: workout.splitId,
        date: getWorkoutDate(workout),
        volume: currentVolume,
        performance:
          roundPerformance(
            performance
          ),
        xp,
      });

      previousWorkouts.push(workout);
    }
  );

  return progress;
}

/*
 * ========================================
 * VOLUME TREND
 * ========================================
 */

export function getVolumeTrend(
  workoutHistory: WorkoutSession[]
): {
  workoutId: string;
  date: string;
  value: number;
}[] {
  return getProgressData(
    workoutHistory
  ).map((item) => ({
    workoutId: item.workoutId,
    date: item.date,
    value: item.volume,
  }));
}

/*
 * ========================================
 * PERFORMANCE TREND
 * ========================================
 */

export function getPerformanceTrend(
  workoutHistory: WorkoutSession[]
): {
  workoutId: string;
  date: string;
  value: number;
}[] {
  return getProgressData(
    workoutHistory
  ).map((item) => ({
    workoutId: item.workoutId,
    date: item.date,
    value: item.performance,
  }));
}

/*
 * ========================================
 * XP TREND
 * ========================================
 *
 * Third graph:
 *
 * XP earned per workout.
 */

export function getXPTrend(
  workoutHistory: WorkoutSession[]
): {
  workoutId: string;
  date: string;
  value: number;
}[] {
  return getProgressData(
    workoutHistory
  ).map((item) => ({
    workoutId: item.workoutId,
    date: item.date,
    value: item.xp,
  }));
}

/*
 * ========================================
 * SETS TREND
 * ========================================
 *
 * Useful additional graph data.
 *
 * Shows completed sets per workout.
 */

export function getSetsTrend(
  workoutHistory: WorkoutSession[]
): {
  workoutId: string;
  date: string;
  value: number;
}[] {
  return getCompletedWorkouts(
    workoutHistory
  ).map((workout) => ({
    workoutId: workout.id,
    date: getWorkoutDate(workout),
    value: getCompletedSets(workout),
  }));
}

/*
 * ========================================
 * REPS TREND
 * ========================================
 */

export function getRepsTrend(
  workoutHistory: WorkoutSession[]
): {
  workoutId: string;
  date: string;
  value: number;
}[] {
  return getCompletedWorkouts(
    workoutHistory
  ).map((workout) => ({
    workoutId: workout.id,
    date: getWorkoutDate(workout),
    value: workout.exercises.reduce(
      (total, exercise) =>
        total +
        getCompletedReps(exercise),
      0
    ),
  }));
}

/*
 * ========================================
 * EXERCISE PROGRESS POINT
 * ========================================
 */

export type ExerciseProgressPoint = {
  workoutId: string;

  date: string;

  volume: number;

  averageVolume: number;

  performance: number | null;

  sets: number;

  reps: number;

  bestSetWeight: number;

  bestSetReps: number;

  estimatedOneRepMax: number;
};

/*
 * ========================================
 * ESTIMATED 1RM
 * ========================================
 *
 * Epley formula:
 *
 * 1RM = weight × (1 + reps / 30)
 *
 * This is an estimate, not an actual max.
 */

export function getEstimatedOneRepMax(
  exercise: WorkoutExercise
): number {
  let best = 0;

  exercise.sets.forEach((set) => {
    if (
      !set.completed ||
      set.weight <= 0 ||
      set.reps <= 0
    ) {
      return;
    }

    const estimated =
      set.weight *
      (1 + set.reps / 30);

    best = Math.max(
      best,
      estimated
    );
  });

  return best;
}

/*
 * ========================================
 * BEST SET
 * ========================================
 */

export function getBestSet(
  exercise: WorkoutExercise
): {
  weight: number;
  reps: number;
} {
  let bestWeight = 0;
  let bestReps = 0;

  exercise.sets.forEach((set) => {
    if (
      !set.completed ||
      set.weight <= 0 ||
      set.reps <= 0
    ) {
      return;
    }

    /*
     * Prioritize heavier weight.
     * If equal weight, prioritize reps.
     */

    if (
      set.weight > bestWeight ||
      (
        set.weight === bestWeight &&
        set.reps > bestReps
      )
    ) {
      bestWeight = set.weight;
      bestReps = set.reps;
    }
  });

  return {
    weight: bestWeight,
    reps: bestReps,
  };
}

/*
 * ========================================
 * EXERCISE PROGRESS
 * ========================================
 */

export function getExerciseProgress(
  exerciseId: string,
  workoutHistory: WorkoutSession[]
): ExerciseProgressPoint[] {
  const completedWorkouts =
    getCompletedWorkouts(
      workoutHistory
    );

  const previousExercises: WorkoutExercise[] =
    [];

  const progress: ExerciseProgressPoint[] =
    [];

  completedWorkouts.forEach(
    (workout) => {
      const exercise =
        workout.exercises.find(
          (item) =>
            item.exercise.id ===
            exerciseId
        );

      if (!exercise) {
        return;
      }

      const volume =
        getExerciseVolume(exercise);

      const averageVolume =
        previousExercises.length > 0
          ? previousExercises.reduce(
              (total, item) =>
                total +
                getExerciseVolume(item),
              0
            ) /
            previousExercises.length
          : 0;

      const performance =
        previousExercises.length > 0
          ? calculatePerformance(
              volume,
              averageVolume
            )
          : null;

      const bestSet =
        getBestSet(exercise);

      const estimatedOneRepMax =
        getEstimatedOneRepMax(
          exercise
        );

      progress.push({
        workoutId: workout.id,

        date: getWorkoutDate(workout),

        volume,

        averageVolume,

        performance:
          performance === null
            ? null
            : roundPerformance(
                performance
              ),

        sets:
          getCompletedSetsForExercise(
            exercise
          ),

        reps:
          getCompletedReps(exercise),

        bestSetWeight:
          bestSet.weight,

        bestSetReps:
          bestSet.reps,

        estimatedOneRepMax:
          roundNumber(
            estimatedOneRepMax
          ),
      });

      previousExercises.push(
        exercise
      );
    }
  );

  return progress;
}

/*
 * ========================================
 * MOST TRAINED EXERCISE
 * ========================================
 */

export function getMostTrainedExercise(
  workoutHistory: WorkoutSession[]
): {
  exerciseId: string;
  exerciseName: string;
  sessions: number;
} | null {
  const counts: Record<
    string,
    {
      exerciseName: string;
      sessions: number;
    }
  > = {};

  const completedWorkouts =
    getCompletedWorkouts(
      workoutHistory
    );

  completedWorkouts.forEach(
    (workout) => {
      workout.exercises.forEach(
        (exercise) => {
          const id =
            exercise.exercise.id;

          if (!counts[id]) {
            counts[id] = {
              exerciseName:
                exercise.exercise.name,

              sessions: 0,
            };
          }

          counts[id].sessions++;
        }
      );
    }
  );

  const entries =
    Object.entries(counts);

  if (entries.length === 0) {
    return null;
  }

  const [exerciseId, data] =
    entries.reduce(
      (best, current) =>
        current[1].sessions >
        best[1].sessions
          ? current
          : best
    );

  return {
    exerciseId,

    exerciseName:
      data.exerciseName,

    sessions:
      data.sessions,
  };
}

/*
 * ========================================
 * BEST TRAINING STREAK
 * ========================================
 */

export function getBestTrainingStreak(
  workoutHistory: WorkoutSession[]
): number {
  const completedWorkouts =
    getCompletedWorkouts(
      workoutHistory
    );

  if (completedWorkouts.length === 0) {
    return 0;
  }

  const uniqueDates = Array.from(
    new Set(
      completedWorkouts
        .sort(
          (a, b) =>
            getWorkoutTimestamp(a) -
            getWorkoutTimestamp(b)
        )
        .map((workout) =>
          getWorkoutDate(workout)
        )
    )
  );

  if (uniqueDates.length === 0) {
    return 0;
  }

  let bestStreak = 1;
  let currentStreak = 1;

  for (
    let i = 1;
    i < uniqueDates.length;
    i++
  ) {
    const previousDate = new Date(
      uniqueDates[i - 1]
    );

    const currentDate = new Date(
      uniqueDates[i]
    );

    const difference = Math.round(
      (currentDate.getTime() -
        previousDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (difference === 1) {
      currentStreak++;

      bestStreak = Math.max(
        bestStreak,
        currentStreak
      );
    } else {
      currentStreak = 1;
    }
  }

  return bestStreak;
}

/*
 * ========================================
 * WORKOUT PROGRESS POINT
 * ========================================
 */

export type WorkoutProgressPoint = {
  workoutId: string;

  splitId: string;

  date: string;

  volume: number;

  averageVolume: number;

  performance: number;

  xp: number;

  completedSets: number;

  completedReps: number;
};

/*
 * ========================================
 * WORKOUT PROGRESS
 * ========================================
 */

export function getWorkoutProgress(
  workoutHistory: WorkoutSession[]
): WorkoutProgressPoint[] {
  const completedWorkouts =
    getCompletedWorkouts(
      workoutHistory
    );

  const workoutsBySplit: Record<
    string,
    WorkoutSession[]
  > = {};

  return completedWorkouts.map(
    (workout) => {
      if (
        !workoutsBySplit[workout.splitId]
      ) {
        workoutsBySplit[workout.splitId] =
          [];
      }

      const previousWorkouts =
        workoutsBySplit[workout.splitId];

      const volume =
        getWorkoutVolume(workout);

      const averageVolume =
        getAverageWorkoutVolume(
          previousWorkouts
        );

      const performance =
        previousWorkouts.length > 0
          ? calculatePerformance(
              volume,
              averageVolume
            )
          : 0;

      const xp =
        previousWorkouts.length === 0
          ? 100
          : calculateWorkoutXP(
              performance
            );

      const completedSets =
        getCompletedSets(workout);

      const completedReps =
        workout.exercises.reduce(
          (total, exercise) =>
            total +
            getCompletedReps(exercise),
          0
        );

      previousWorkouts.push(workout);

      return {
        workoutId: workout.id,

        splitId: workout.splitId,

        date: getWorkoutDate(workout),

        volume,

        averageVolume,

        performance:
          roundPerformance(
            performance
          ),

        xp,

        completedSets,

        completedReps,
      };
    }
  );
}

/*
 * ========================================
 * SPLIT ANALYTICS
 * ========================================
 */

export type SplitAnalytics = {
  splitId: string;

  workoutCount: number;

  totalVolume: number;

  averageVolume: number;

  latestVolume: number;

  latestPerformance: number;
};

/*
 * ========================================
 * GET SPLIT ANALYTICS
 * ========================================
 */

export function getSplitAnalytics(
  splitId: string,
  workoutHistory: WorkoutSession[]
): SplitAnalytics {
  const workouts =
    getSplitHistory(
      splitId,
      workoutHistory
    );

  const latestWorkout =
    [...workouts].sort(
      (a, b) =>
        getWorkoutTimestamp(b) -
        getWorkoutTimestamp(a)
    )[0];

  const totalVolume =
    workouts.reduce(
      (total, workout) =>
        total + getWorkoutVolume(workout),
      0
    );

  const averageVolume =
    getAverageWorkoutVolume(
      workouts
    );

  const latestVolume =
    latestWorkout
      ? getWorkoutVolume(
          latestWorkout
        )
      : 0;

  const latestPerformance =
    latestWorkout
      ? getWorkoutPerformance(
          latestWorkout,
          workoutHistory
        )
      : 0;

  return {
    splitId,

    workoutCount:
      workouts.length,

    totalVolume,

    averageVolume,

    latestVolume,

    latestPerformance:
      roundPerformance(
        latestPerformance
      ),
  };
}

/*
 * ========================================
 * EXERCISE PROGRESS SUMMARY
 * ========================================
 */

export type ExerciseProgressSummary = {
  exerciseId: string;

  exerciseName: string;

  workoutCount: number;

  currentVolume: number;

  averageVolume: number;

  bestVolume: number;

  improvement: number;

  totalSets: number;

  totalReps: number;

  bestSetWeight: number;

  bestSetReps: number;

  estimatedOneRepMax: number;
};

/*
 * ========================================
 * GET EXERCISE PROGRESS SUMMARY
 * ========================================
 */

export function getExerciseProgressSummary(
  exerciseId: string,
  exerciseName: string,
  workoutHistory: WorkoutSession[]
): ExerciseProgressSummary {
  const completedWorkouts =
    getCompletedWorkouts(
      workoutHistory
    );

  const exerciseHistory =
    getExerciseHistory(
      exerciseId,
      completedWorkouts
    );

  if (exerciseHistory.length === 0) {
    return {
      exerciseId,

      exerciseName,

      workoutCount: 0,

      currentVolume: 0,

      averageVolume: 0,

      bestVolume: 0,

      improvement: 0,

      totalSets: 0,

      totalReps: 0,

      bestSetWeight: 0,

      bestSetReps: 0,

      estimatedOneRepMax: 0,
    };
  }

  const volumes =
    exerciseHistory.map(
      (exercise) =>
        getExerciseVolume(exercise)
    );

  const currentVolume =
    volumes[volumes.length - 1];

  const averageVolume =
    volumes.reduce(
      (total, volume) =>
        total + volume,
      0
    ) / volumes.length;

  const bestVolume =
    Math.max(...volumes);

  const previousVolumes =
    volumes.slice(0, -1);

  const previousAverage =
    previousVolumes.length > 0
      ? previousVolumes.reduce(
          (total, volume) =>
            total + volume,
          0
        ) / previousVolumes.length
      : 0;

  const improvement =
    previousAverage > 0
      ? calculatePerformance(
          currentVolume,
          previousAverage
        )
      : 0;

  const totalSets =
    exerciseHistory.reduce(
      (total, exercise) =>
        total +
        getCompletedSetsForExercise(
          exercise
        ),
      0
    );

  const totalReps =
    exerciseHistory.reduce(
      (total, exercise) =>
        total +
        getCompletedReps(exercise),
      0
    );

  const latestExercise =
    exerciseHistory[
      exerciseHistory.length - 1
    ];

  const bestSet =
    getBestSet(
      latestExercise
    );

  const estimatedOneRepMax =
    Math.max(
      ...exerciseHistory.map(
        (exercise) =>
          getEstimatedOneRepMax(
            exercise
          )
      )
    );

  return {
    exerciseId,

    exerciseName,

    workoutCount:
      exerciseHistory.length,

    currentVolume,

    averageVolume,

    bestVolume,

    improvement:
      roundPerformance(
        improvement
      ),

    totalSets,

    totalReps,

    bestSetWeight:
      bestSet.weight,

    bestSetReps:
      bestSet.reps,

    estimatedOneRepMax:
      roundNumber(
        estimatedOneRepMax
      ),
  };
}

/*
 * ========================================
 * TRAINING DASHBOARD
 * ========================================
 */

export type TrainingDashboard = {
  totalWorkouts: number;

  totalVolume: number;

  averageVolume: number;

  trainingXP: number;

  currentStreak: number;

  bestStreak: number;

  progress: WorkoutProgressPoint[];
};

/*
 * ========================================
 * GET TRAINING DASHBOARD
 * ========================================
 */

export function getTrainingDashboard(
  workoutHistory: WorkoutSession[]
): TrainingDashboard {
  return {
    totalWorkouts:
      getTotalWorkouts(
        workoutHistory
      ),

    totalVolume:
      getTotalTrainingVolume(
        workoutHistory
      ),

    averageVolume:
      getAverageTrainingVolume(
        workoutHistory
      ),

    trainingXP:
      getTotalTrainingXP(
        workoutHistory
      ),

    currentStreak:
      getTrainingStreak(
        workoutHistory
      ),

    bestStreak:
      getBestTrainingStreak(
        workoutHistory
      ),

    progress:
      getWorkoutProgress(
        workoutHistory
      ),
  };
}

/*
 * ========================================
 * TRAINING PROGRESS
 * ========================================
 */

export type TrainingProgress = {
  totalWorkouts: number;

  totalVolume: number;

  averageVolume: number;

  currentStreak: number;

  bestStreak: number;

  progress: WorkoutProgressPoint[];

  exercises: ExerciseProgressSummary[];
};

/*
 * ========================================
 * GET TRAINING PROGRESS
 * ========================================
 */

export function getTrainingProgress(
  workoutHistory: WorkoutSession[]
): TrainingProgress {
  const completedWorkouts =
    getCompletedWorkouts(
      workoutHistory
    );

  /*
   * ----------------------------------------
   * COLLECT UNIQUE EXERCISES
   * ----------------------------------------
   */

  const exerciseMap =
    new Map<string, string>();

  completedWorkouts.forEach(
    (workout) => {
      workout.exercises.forEach(
        (exercise) => {
          exerciseMap.set(
            exercise.exercise.id,
            exercise.exercise.name
          );
        }
      );
    }
  );

  /*
   * ----------------------------------------
   * BUILD EXERCISE SUMMARIES
   * ----------------------------------------
   */

  const exercises =
    Array.from(
      exerciseMap.entries()
    ).map(
      ([
        exerciseId,
        exerciseName,
      ]) =>
        getExerciseProgressSummary(
          exerciseId,
          exerciseName,
          completedWorkouts
        )
    );

  /*
   * ----------------------------------------
   * RETURN PROGRESS
   * ----------------------------------------
   */

  return {
    totalWorkouts:
      getTotalWorkouts(
        workoutHistory
      ),

    totalVolume:
      getTotalTrainingVolume(
        workoutHistory
      ),

    averageVolume:
      getAverageTrainingVolume(
        workoutHistory
      ),

    currentStreak:
      getTrainingStreak(
        workoutHistory
      ),

    bestStreak:
      getBestTrainingStreak(
        workoutHistory
      ),

    progress:
      getWorkoutProgress(
        workoutHistory
      ),

    exercises,
  };
}

/*
 * ========================================
 * ROUND NUMBER
 * ========================================
 *
 * Kept at the bottom so all analytics
 * helpers can use the same formatter.
 */

export function roundNumber(
  value: number
): number {
  return Number(
    value.toFixed(1)
  );
}