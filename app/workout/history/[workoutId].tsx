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

import {
  useEffect,
  useState,
} from 'react';

import {
  colors,
  spacing,
} from '../../../constants/theme';

import { useWorkout } from '../../../context/WorkoutContext';

import type {
  WorkoutExercise,
  WorkoutSession,
} from '../../../types/workout';

export default function WorkoutHistoryDetailScreen() {
  const { getWorkoutById } = useWorkout();

  const { workoutId } =
    useLocalSearchParams<{
      workoutId?: string;
    }>();

  /*
   * ========================================
   * WORKOUT STATE
   * ========================================
   */

  const [workout, setWorkout] =
    useState<WorkoutSession | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  /*
   * ========================================
   * LOAD WORKOUT FROM SQLITE
   * ========================================
   */

  useEffect(() => {
    let mounted = true;

    const loadWorkout = async () => {
      if (!workoutId) {
        if (mounted) {
          setWorkout(null);
          setIsLoading(false);
        }

        return;
      }

      try {
        setIsLoading(true);

        const result =
          await getWorkoutById(
            workoutId
          );

        if (mounted) {
          setWorkout(result);
        }
      } catch (error) {
        console.error(
          'Failed to load workout:',
          error
        );

        if (mounted) {
          setWorkout(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadWorkout();

    return () => {
      mounted = false;
    };
  }, [workoutId]);

  /*
   * ========================================
   * LOADING
   * ========================================
   */

  if (isLoading) {
    return (
      <View
        style={
          styles.errorContainer
        }
      >
        <Text
          style={styles.errorTitle}
        >
          LOADING WORKOUT
        </Text>

        <Text
          style={styles.errorText}
        >
          READING YOUR WORKOUT
          FROM SQLITE...
        </Text>
      </View>
    );
  }

  /*
   * ========================================
   * WORKOUT NOT FOUND
   * ========================================
   */

  if (!workout) {
    return (
      <View
        style={
          styles.errorContainer
        }
      >
        <Text
          style={styles.errorTitle}
        >
          WORKOUT NOT FOUND
        </Text>

        <Text
          style={styles.errorText}
        >
          THIS WORKOUT COULD NOT BE
          FOUND IN YOUR HISTORY.
        </Text>

        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.replace(
              '/workout/history'
            )
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            BACK TO HISTORY
          </Text>
        </Pressable>
      </View>
    );
  }

  /*
   * ========================================
   * STATS
   * ========================================
   */

  const totalSets =
    getTotalSets(workout);

  const completedSets =
    getCompletedSets(workout);

  const totalVolume =
    getWorkoutVolume(workout);

  const duration =
    getWorkoutDuration(workout);

  /*
   * ========================================
   * SCREEN
   * ========================================
   */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* ====================================
          BACK
          ==================================== */}

      <Pressable
        style={styles.backRow}
        onPress={() =>
          router.back()
        }
      >
        <Text
          style={styles.backArrow}
        >
          ‹
        </Text>

        <Text
          style={styles.backText}
        >
          HISTORY
        </Text>
      </Pressable>

      {/* ====================================
          HEADER
          ==================================== */}

      <Text
        style={styles.eyebrow}
      >
        WORKOUT HISTORY
      </Text>

      <Text
        style={styles.title}
      >
        {workout.name}
      </Text>

      <Text
        style={styles.date}
      >
        {formatWorkoutDate(workout)}
      </Text>

      {/* ====================================
          SUMMARY
          ==================================== */}

      <View
        style={styles.summaryCard}
      >
        <HistoryStat
          value={String(
            workout.exercises.length
          )}
          label="EXERCISES"
        />

        <HistoryStat
          value={String(totalSets)}
          label="SETS"
        />

        <HistoryStat
          value={String(
            completedSets
          )}
          label="COMPLETED"
        />

        <HistoryStat
          value={`${totalVolume} KG`}
          label="VOLUME"
        />

        <HistoryStat
          value={formatTime(duration)}
          label="DURATION"
        />
      </View>

      {/* ====================================
          SESSION BREAKDOWN
          ==================================== */}

      <View
        style={
          styles.sectionHeader
        }
      >
        <Text
          style={styles.sectionTitle}
        >
          SESSION BREAKDOWN
        </Text>
      </View>

      {workout.exercises.length ===
      0 ? (
        <View
          style={styles.emptyCard}
        >
          <Text
            style={styles.emptyTitle}
          >
            NO EXERCISES
          </Text>

          <Text
            style={styles.emptyText}
          >
            NO EXERCISES WERE RECORDED
            IN THIS WORKOUT.
          </Text>
        </View>
      ) : (
        workout.exercises.map(
          (
            exercise,
            index
          ) => (
            <HistoryExerciseCard
              key={
                exercise.exercise.id
              }
              exercise={exercise}
              index={index}
            />
          )
        )
      )}

      {/* ====================================
          DONE
          ==================================== */}

      <Pressable
        style={({ pressed }) => [
          styles.doneButton,
          pressed &&
            styles.buttonPressed,
        ]}
        onPress={() =>
          router.back()
        }
      >
        <Text
          style={
            styles.doneButtonText
          }
        >
          BACK TO HISTORY
        </Text>
      </Pressable>
    </ScrollView>
  );
}

/*
 * ========================================
 * HISTORY EXERCISE CARD
 * ========================================
 */

function HistoryExerciseCard({
  exercise,
  index,
}: {
  exercise: WorkoutExercise;
  index: number;
}) {
  const exerciseVolume =
    getExerciseVolume(exercise);

  const completedSets =
    exercise.sets.filter(
      (set) => set.completed
    ).length;

  return (
    <View
      style={styles.exerciseCard}
    >
      {/* ====================================
          EXERCISE HEADER
          ==================================== */}

      <View
        style={
          styles.exerciseHeader
        }
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
          style={
            styles.exerciseInfo
          }
        >
          <Text
            style={
              styles.exerciseName
            }
          >
            {exercise.exercise.name}
          </Text>

          <Text
            style={
              styles.exerciseMeta
            }
          >
            {exercise.sets.length}{' '}
            SETS
            {' • '}
            {completedSets} DONE
          </Text>
        </View>
      </View>

      {/* ====================================
          SET HEADER
          ==================================== */}

      <View
        style={styles.setHeader}
      >
        <Text
          style={
            styles.setHeaderText
          }
        >
          SET
        </Text>

        <Text
          style={
            styles.setHeaderText
          }
        >
          TYPE
        </Text>

        <Text
          style={
            styles.setHeaderText
          }
        >
          KG
        </Text>

        <Text
          style={
            styles.setHeaderText
          }
        >
          REPS
        </Text>
      </View>

      {/* ====================================
          SETS
          ==================================== */}

      {exercise.sets.map(
        (set, setIndex) => (
          <View
            key={set.id}
            style={styles.setRow}
          >
            <Text
              style={
                styles.setNumber
              }
            >
              {String(
                setIndex + 1
              ).padStart(2, '0')}
            </Text>

            <Text
              style={[
                styles.setType,
                !set.completed &&
                  styles.setIncomplete,
              ]}
            >
              {set.type.toUpperCase()}
            </Text>

            <Text
              style={[
                styles.setValue,
                !set.completed &&
                  styles.setIncomplete,
              ]}
            >
              {set.weight}
            </Text>

            <Text
              style={[
                styles.setValue,
                !set.completed &&
                  styles.setIncomplete,
              ]}
            >
              {set.reps}
            </Text>
          </View>
        )
      )}

      {/* ====================================
          EXERCISE VOLUME
          ==================================== */}

      <View
        style={
          styles.exerciseFooter
        }
      >
        <Text
          style={
            styles.exerciseVolumeLabel
          }
        >
          EXERCISE VOLUME
        </Text>

        <Text
          style={
            styles.exerciseVolume
          }
        >
          {exerciseVolume} KG
        </Text>
      </View>

      {/* ====================================
          NOTES
          ==================================== */}

      {exercise.notes ? (
        <View
          style={
            styles.notesSection
          }
        >
          <Text
            style={styles.notesLabel}
          >
            NOTES
          </Text>

          <Text
            style={styles.notesText}
          >
            {exercise.notes}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/*
 * ========================================
 * HISTORY STAT
 * ========================================
 */

function HistoryStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View
      style={styles.historyStat}
    >
      <Text
        style={
          styles.historyStatValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.historyStatLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

/*
 * ========================================
 * TOTAL SETS
 * ========================================
 */

function getTotalSets(
  workout: WorkoutSession
): number {
  return workout.exercises.reduce(
    (total, exercise) =>
      total +
      (exercise.sets?.length ?? 0),
    0
  );
}

/*
 * ========================================
 * COMPLETED SETS
 * ========================================
 */

function getCompletedSets(
  workout: WorkoutSession
): number {
  return workout.exercises.reduce(
    (total, exercise) =>
      total +
      (exercise.sets ?? []).filter(
        (set) => set.completed
      ).length,
    0
  );
}

/*
 * ========================================
 * WORKOUT VOLUME
 * ========================================
 */

function getWorkoutVolume(
  workout: WorkoutSession
): number {
  return workout.exercises.reduce(
    (total, exercise) =>
      total +
      getExerciseVolume(exercise),
    0
  );
}

/*
 * ========================================
 * EXERCISE VOLUME
 * ========================================
 */

function getExerciseVolume(
  exercise: WorkoutExercise
): number {
  return (exercise.sets ?? []).reduce(
    (total, set) => {
      if (!set.completed) {
        return total;
      }

      return (
        total +
        set.weight * set.reps
      );
    },
    0
  );
}

/*
 * ========================================
 * DURATION
 * ========================================
 */

function getWorkoutDuration(
  workout: WorkoutSession
): number {
  if (
    !workout.startedAt ||
    !workout.endedAt
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (
        new Date(
          workout.endedAt
        ).getTime() -
        new Date(
          workout.startedAt
        ).getTime()
      ) / 1000
    )
  );
}

/*
 * ========================================
 * DATE
 * ========================================
 */

function formatWorkoutDate(
  workout: WorkoutSession
): string {
  const timestamp =
    workout.endedAt ||
    workout.startedAt;

  if (!timestamp) {
    return 'UNKNOWN DATE';
  }

  return new Date(
    timestamp
  )
    .toLocaleDateString(
      undefined,
      {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
    .toUpperCase();
}

/*
 * ========================================
 * TIME
 * ========================================
 */

function formatTime(
  totalSeconds: number
): string {
  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
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
      String(value).padStart(
        2,
        '0'
      )
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
    backgroundColor:
      colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: 150,
  },

  /* BACK */

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom:
      spacing.xl,
  },

  backArrow: {
    fontFamily: 'VT323',
    fontSize: 36,
    color: colors.primary,
    marginRight:
      spacing.sm,
  },

  backText: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color:
      colors.textSecondary,
  },

  /* HEADER */

  eyebrow: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color: colors.primary,
    marginBottom:
      spacing.md,
  },

  title: {
    fontFamily:
      'PressStart2P',
    fontSize: 20,
    color: colors.text,
    marginBottom:
      spacing.sm,
  },

  date: {
    fontFamily: 'VT323',
    fontSize: 21,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.xl,
  },

  /* SUMMARY */

  summaryCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.primary,
    padding: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom:
      spacing.xl,
  },

  historyStat: {
    width: '33.33%',
    paddingVertical:
      spacing.sm,
  },

  historyStatValue: {
    fontFamily: 'VT323',
    fontSize: 25,
    color: colors.primary,
    marginBottom: 2,
  },

  historyStatLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 6,
    color:
      colors.textSecondary,
  },

  /* SECTION */

  sectionHeader: {
    marginBottom:
      spacing.md,
  },

  sectionTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color: colors.text,
  },

  /* EXERCISE */

  exerciseCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding: spacing.md,
    marginBottom:
      spacing.sm,
  },

  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom:
      spacing.md,
  },

  exerciseNumber: {
    fontFamily: 'VT323',
    fontSize: 30,
    color: colors.primary,
    marginRight:
      spacing.md,
  },

  exerciseInfo: {
    flex: 1,
  },

  exerciseName: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color: colors.text,
    marginBottom:
      spacing.sm,
  },

  exerciseMeta: {
    fontFamily: 'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,
  },

  /* SET TABLE */

  setHeader: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor:
      colors.border,
    paddingVertical:
      spacing.sm,
  },

  setHeaderText: {
    fontFamily:
      'PressStart2P',
    fontSize: 6,
    color:
      colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
    paddingVertical:
      spacing.sm,
  },

  setNumber: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.primary,
    flex: 1,
    textAlign: 'center',
  },

  setType: {
    fontFamily:
      'PressStart2P',
    fontSize: 5,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },

  setValue: {
    fontFamily: 'VT323',
    fontSize: 21,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },

  setIncomplete: {
    color:
      colors.textSecondary,
  },

  /* FOOTER */

  exerciseFooter: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    paddingTop:
      spacing.md,
  },

  exerciseVolumeLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 6,
    color:
      colors.textSecondary,
  },

  exerciseVolume: {
    fontFamily: 'VT323',
    fontSize: 24,
    color: colors.primary,
  },

  /* NOTES */

  notesSection: {
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    marginTop: spacing.md,
    paddingTop:
      spacing.md,
  },

  notesLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 7,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.sm,
  },

  notesText: {
    fontFamily: 'VT323',
    fontSize: 19,
    color: colors.text,
  },

  /* EMPTY */

  emptyCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding: spacing.lg,
  },

  emptyTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color: colors.primary,
    marginBottom:
      spacing.md,
  },

  emptyText: {
    fontFamily: 'VT323',
    fontSize: 20,
    color:
      colors.textSecondary,
  },

  /* BUTTON */

  doneButton: {
    backgroundColor:
      colors.primary,
    borderWidth: 2,
    borderColor:
      colors.primary,
    paddingVertical:
      spacing.lg,
    alignItems: 'center',
    marginTop:
      spacing.lg,
  },

  doneButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color:
      colors.background,
  },

  buttonPressed: {
    opacity: 0.65,
  },

  /* ERROR */

  errorContainer: {
    flex: 1,
    backgroundColor:
      colors.background,
    alignItems: 'center',
    justifyContent:
      'center',
    padding: spacing.lg,
  },

  errorTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 12,
    color: colors.primary,
    marginBottom:
      spacing.md,
    textAlign: 'center',
  },

  errorText: {
    fontFamily: 'VT323',
    fontSize: 20,
    color:
      colors.textSecondary,
    textAlign: 'center',
    marginBottom:
      spacing.xl,
  },

  backButton: {
    borderWidth: 2,
    borderColor:
      colors.border,
    padding: spacing.md,
  },

  backButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color: colors.text,
  },
});