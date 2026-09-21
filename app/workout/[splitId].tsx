import { useEffect, useState } from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { workoutSplits } from '../../data/workoutSplits';
import { colors, spacing } from '../../constants/theme';
import { useWorkout } from '../../context/WorkoutContext';

export default function WorkoutScreen() {
  const {
    workout,
    startWorkout,
  } = useWorkout();

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  /*
   * ========================================
   * ROUTE PARAMETER
   * ========================================
   */

  const params = useLocalSearchParams<{
    splitId?: string | string[];
  }>();

  const splitId = Array.isArray(params.splitId)
    ? params.splitId[0]
    : params.splitId;

  /*
   * ========================================
   * FIND SELECTED SPLIT
   * ========================================
   */

  const selectedSplit = workoutSplits.find(
    (split) => split.id === splitId
  );

  /*
   * ========================================
   * WORKOUT TIMER
   * ========================================
   *
   * Timer only runs while the workout is active.
   */

  useEffect(() => {
    if (
      !workout ||
      workout.status !== 'active' ||
      workout.splitId !== splitId
    ) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = workout.startedAt;

    if (!startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startTime =
      new Date(startedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();

      const elapsed = Math.floor(
        (now - startTime) / 1000
      );

      setElapsedSeconds(
        Math.max(0, elapsed)
      );
    };

    updateTimer();

    const interval = setInterval(
      updateTimer,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [
    workout,
    splitId,
  ]);

  /*
   * ========================================
   * SAFE BACK
   * ========================================
   */

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  /*
   * ========================================
   * SPLIT NOT FOUND
   * ========================================
   */

  if (!selectedSplit) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          WORKOUT NOT FOUND
        </Text>

        <Text style={styles.errorSubtext}>
          INVALID OR MISSING WORKOUT SPLIT
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>
            GO HOME
          </Text>
        </Pressable>
      </View>
    );
  }

  /*
   * ========================================
   * IS THIS WORKOUT ACTIVE?
   * ========================================
   */

  const isActiveWorkout =
    workout?.status === 'active' &&
    workout.splitId === selectedSplit.id;

  /*
   * ========================================
   * START WORKOUT
   * ========================================
   */

  const handleStartWorkout = () => {
    startWorkout(
      selectedSplit.id,
      selectedSplit.name
    );

    router.push({
      pathname: '/workout/active',
      params: {
        splitId: selectedSplit.id,
        name: selectedSplit.name,
      },
    });
  };

  /*
   * ========================================
   * ADD EXERCISE
   * ========================================
   *
   * Exercises can ONLY be added once this
   * workout has started.
   */

  const handleAddExercise = () => {
    if (!isActiveWorkout) {
      return;
    }

    router.push({
      pathname:
        '/workout/add-exercise/[splitId]',
      params: {
        splitId: selectedSplit.id,
      },
    });
  };

  /*
   * ========================================
   * SCREEN
   * ========================================
   */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <Pressable
        style={styles.backRow}
        onPress={handleBack}
      >
        <Text style={styles.backArrow}>
          ‹
        </Text>

        <Text style={styles.backText}>
          BACK
        </Text>
      </Pressable>

      <Text style={styles.title}>
        {selectedSplit.name}
      </Text>

      <Text style={styles.subtitle}>
        {selectedSplit.shortDescription}
      </Text>

      {/* TIMER */}

      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>
          WORKOUT TIME
        </Text>

        <Text style={styles.timer}>
          {formatTime(elapsedSeconds)}
        </Text>
      </View>

      {/* EXERCISES */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          YOUR EXERCISES
        </Text>
      </View>

      {isActiveWorkout &&
      workout.exercises.length > 0 ? (
        <View style={styles.exerciseList}>
          {workout.exercises.map(
            (workoutExercise, index) => (
              <View
                key={
                  workoutExercise.exercise.id
                }
                style={styles.exerciseCard}
              >
                <Text
                  style={
                    styles.exerciseNumber
                  }
                >
                  {String(index + 1).padStart(
                    2,
                    '0'
                  )}
                </Text>

                <View
                  style={styles.exerciseInfo}
                >
                  <Text
                    style={styles.exerciseName}
                  >
                    {
                      workoutExercise
                        .exercise.name
                    }
                  </Text>

                  <Text
                    style={styles.exerciseMeta}
                  >
                    {workoutExercise.exercise.primaryMuscle.toUpperCase()}
                    {' • '}
                    {workoutExercise.exercise.equipment.toUpperCase()}
                  </Text>
                </View>

                <Text
                  style={styles.setCount}
                >
                  {workoutExercise.sets.length}{' '}
                  {workoutExercise.sets.length ===
                  1
                    ? 'SET'
                    : 'SETS'}
                </Text>
              </View>
            )
          )}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            NO EXERCISES YET
          </Text>

          <Text style={styles.emptyText}>
            {isActiveWorkout
              ? 'ADD EXERCISES TO START BUILDING YOUR WORKOUT.'
              : 'START YOUR WORKOUT THEN ADD EXERCISES.'}
          </Text>
        </View>
      )}

      {/* ADD EXERCISE */}

      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed &&
            styles.buttonPressed,

          !isActiveWorkout &&
            styles.disabledButton,
        ]}
        onPress={handleAddExercise}
        disabled={!isActiveWorkout}
      >
        <Text
          style={[
            styles.addButtonText,
            !isActiveWorkout &&
              styles.disabledButtonText,
          ]}
        >
          + ADD EXERCISE
        </Text>
      </Pressable>

      {/* START WORKOUT */}

      {!isActiveWorkout && (
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            pressed &&
              styles.buttonPressed,
          ]}
          onPress={handleStartWorkout}
        >
          <Text
            style={styles.startButtonText}
          >
            START WORKOUT
          </Text>
        </Pressable>
      )}

      {/* ACTIVE WORKOUT */}

      {isActiveWorkout && (
        <View style={styles.activeCard}>
          <Text
            style={styles.activeText}
          >
            WORKOUT IN PROGRESS
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

/*
 * ========================================
 * FORMAT TIMER
 * ========================================
 */

function formatTime(totalSeconds: number) {
  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

  return [
    hours,
    minutes,
    seconds,
  ]
    .map((value) =>
      String(value).padStart(2, '0')
    )
    .join(':');
}

/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: 150,
  },

  /* HEADER */

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  backArrow: {
    fontFamily: 'VT323',
    fontSize: 36,
    color: colors.primary,
    marginRight: spacing.sm,
  },

  backText: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.textSecondary,
  },

  title: {
    fontFamily: 'PressStart2P',
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.md,
  },

  subtitle: {
    fontFamily: 'VT323',
    fontSize: 22,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  /* TIMER */

  timerCard: {
    backgroundColor: colors.surface,

    borderWidth: 2,
    borderColor: colors.border,

    padding: spacing.lg,
    marginBottom: spacing.xl,
  },

  timerLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  timer: {
    fontFamily: 'VT323',
    fontSize: 48,
    color: colors.primary,
  },

  /* SECTION */

  sectionHeader: {
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.text,
  },

  /* EXERCISES */

  exerciseList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  exerciseCard: {
    minHeight: 70,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: colors.surface,

    borderWidth: 2,
    borderColor: colors.border,

    padding: spacing.md,
  },

  exerciseNumber: {
    fontFamily: 'VT323',
    fontSize: 28,
    color: colors.primary,
    marginRight: spacing.md,
  },

  exerciseInfo: {
    flex: 1,
  },

  exerciseName: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  exerciseMeta: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: colors.textSecondary,
  },

  setCount: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },

  /* EMPTY */

  emptyCard: {
    backgroundColor: colors.surface,

    borderWidth: 2,
    borderColor: colors.border,

    padding: spacing.lg,

    marginBottom: spacing.md,
  },

  emptyTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.text,

    marginBottom: spacing.md,
  },

  emptyText: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  /* ADD */

  addButton: {
    borderWidth: 2,
    borderColor: colors.primary,

    paddingVertical: spacing.md,

    alignItems: 'center',

    backgroundColor: colors.background,

    marginBottom: spacing.md,
  },

  addButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.primary,
  },

  disabledButton: {
    borderColor: colors.border,
    opacity: 0.5,
  },

  disabledButtonText: {
    color: colors.textSecondary,
  },

  /* START */

  startButton: {
    borderWidth: 2,
    borderColor: colors.primary,

    paddingVertical: spacing.lg,

    alignItems: 'center',

    backgroundColor: colors.primary,
  },

  startButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.background,
  },

  /* ACTIVE */

  activeCard: {
    borderWidth: 2,
    borderColor: colors.primary,

    paddingVertical: spacing.lg,

    alignItems: 'center',

    backgroundColor: colors.surface,
  },

  activeText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.primary,
  },

  /* PRESSED */

  buttonPressed: {
    opacity: 0.65,
  },

  /* ERROR */

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.background,

    padding: spacing.lg,
  },

  errorText: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: colors.primary,

    marginBottom: spacing.md,
  },

  errorSubtext: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: colors.textSecondary,

    marginBottom: spacing.xl,
    textAlign: 'center',
  },

  backButton: {
    borderWidth: 2,
    borderColor: colors.border,

    padding: spacing.md,
  },

  backButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.text,
  },
});