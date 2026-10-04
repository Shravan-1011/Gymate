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

import {
  colors,
  spacing,
} from '../../constants/theme';

import { useWorkout } from '../../context/WorkoutContext';

import { useProfile } from '../../context/ProfileContext';

import {
  markDayActive,
} from '../../services/xpService';

export default function ActiveWorkoutScreen() {
  const {
    workout,
    finishWorkout,
  } = useWorkout();

  const {
    profile,
    profileDetails,
  } = useProfile();

  const {
    name,
    splitId,
  } = useLocalSearchParams<{
    name?: string;
    splitId?: string;
  }>();

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  const [isFinishing, setIsFinishing] =
    useState(false);

  /*
   * ========================================
   * WORKOUT TIMER
   * ========================================
   */

  useEffect(() => {
    if (
      !workout ||
      workout.status !== 'active' ||
      !workout.startedAt
    ) {
      return;
    }

    const startTime =
      new Date(
        workout.startedAt
      ).getTime();

    const updateTimer = () => {
      const now = Date.now();

      const elapsed =
        Math.floor(
          (now - startTime) /
            1000
        );

      setElapsedSeconds(
        Math.max(
          0,
          elapsed
        )
      );
    };

    updateTimer();

    const interval =
      setInterval(
        updateTimer,
        1000
      );

    return () => {
      clearInterval(interval);
    };
  }, [
    workout?.startedAt,
    workout?.status,
  ]);

  /*
   * ========================================
   * DISPLAY NAME
   * ========================================
   */

  const displayName =
    workout?.name ||
    name ||
    'WORKOUT';

  /*
   * ========================================
   * ADD EXERCISE
   * ========================================
   */

  const handleAddExercise = () => {
    if (
      !workout ||
      workout.status !== 'active'
    ) {
      return;
    }

    router.push({
      pathname:
        '/workout/add-exercise/[splitId]',
      params: {
        splitId:
          workout.splitId ||
          splitId ||
          '',
      },
    });
  };

  /*
   * ========================================
   * FINISH WORKOUT
   * ========================================
   *
   * XP is intentionally NOT awarded here.
   *
   * The completed workout must first be
   * saved and loaded by the Summary screen.
   *
   * Summary then calculates the final
   * performance and awards workout XP.
   *
   * This prevents the performance from being
   * calculated using stale workout/history data.
   * ========================================
   */

  const handleFinishWorkout =
  async () => {
    /*
     * Prevent duplicate presses.
     */

    if (
      isFinishing ||
      !workout ||
      workout.status !== 'active'
    ) {
      return;
    }

    /*
     * Profile is required.
     */

    const profileId =
      profile?.id;

    if (!profileId) {
      console.error(
        'Cannot finish workout: PROFILE_ID_MISSING'
      );

      return;
    }

    /*
     * Save the ID before the Context
     * changes its active workout state.
     */

    const workoutId =
      workout.id;

    try {
      setIsFinishing(true);

      /*
       * ====================================
       * COMPLETE WORKOUT FIRST
       * ====================================
       *
       * IMPORTANT:
       *
       * This MUST be awaited.
       *
       * SQLite must finish changing the
       * workout from active → completed
       * before Summary opens.
       */

      await finishWorkout();

      /*
       * ====================================
       * MARK DAY ACTIVE
       * ====================================
       *
       * Only mark the day active after the
       * workout has successfully been saved.
       */

      const updatedStreak =
        await markDayActive(
          profileId
        );

      console.log(
        'Workout completed. Current streak:',
        updatedStreak.currentStreak
      );

      /*
       * ====================================
       * OPEN SUMMARY
       * ====================================
       *
       * At this point the workout should
       * already exist in SQLite as completed.
       *
       * Summary can safely load it.
       */

      router.replace({
        pathname:
          '/workout/summary',
        params: {
          workoutId,
        },
      });
    } catch (error) {
      console.error(
        'Failed to finish workout:',
        error
      );

      /*
       * Keep the user on the active workout
       * if anything failed.
       */

      setIsFinishing(false);
    }
  };

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
          HEADER
          ==================================== */}

      <Pressable
        style={styles.backRow}
        onPress={() =>
          router.replace(
            '/(tabs)/train'
          )
        }
      >
        <Text
          style={
            styles.backArrow
          }
        >
          ‹
        </Text>

        <Text
          style={
            styles.backText
          }
        >
          BACK
        </Text>
      </Pressable>

      <Text style={styles.title}>
        {displayName}
      </Text>

      <Text
        style={styles.status}
      >
        WORKOUT IN PROGRESS
      </Text>

      {/* ====================================
          TIMER
          ==================================== */}

      <View
        style={styles.timerCard}
      >
        <Text
          style={
            styles.timerLabel
          }
        >
          WORKOUT TIME
        </Text>

        <Text
          style={styles.timer}
        >
          {formatTime(
            elapsedSeconds
          )}
        </Text>
      </View>

      {/* ====================================
          EXERCISES
          ==================================== */}

      <View
        style={
          styles.sectionHeader
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          YOUR EXERCISES
        </Text>
      </View>

      {workout &&
      workout.exercises.length >
        0 ? (
        <View
          style={
            styles.exerciseList
          }
        >
          {workout.exercises.map(
            (
              workoutExercise,
              index
            ) => (
              <Pressable
                key={
                  workoutExercise
                    .exercise
                    .id
                }
                style={({
                  pressed,
                }) => [
                  styles.exerciseCard,
                  pressed &&
                    styles.exerciseCardPressed,
                ]}
                onPress={() => {
                  if (
                    !workout ||
                    workout.status !==
                      'active'
                  ) {
                    return;
                  }

                  router.push({
                    pathname:
                      '/workout/exercise',
                    params: {
                      exerciseId:
                        workoutExercise
                          .exercise
                          .id,
                    },
                  });
                }}
              >
                <View
                  style={
                    styles.exerciseHeader
                  }
                >
                  <View
                    style={
                      styles.exerciseInfo
                    }
                  >
                    <Text
                      style={
                        styles.exerciseNumber
                      }
                    >
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        '0'
                      )}
                    </Text>

                    <View
                      style={
                        styles.exerciseDetails
                      }
                    >
                      <Text
                        style={
                          styles.exerciseName
                        }
                      >
                        {
                          workoutExercise
                            .exercise
                            .name
                        }
                      </Text>

                      <Text
                        style={
                          styles.exerciseMeta
                        }
                      >
                        {workoutExercise
                          .exercise
                          .primaryMuscle
                          .toUpperCase()}

                        {' • '}

                        {workoutExercise
                          .exercise
                          .equipment
                          .toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.setCount
                    }
                  >
                    {
                      workoutExercise
                        .sets.length
                    }{' '}
                    {workoutExercise
                      .sets
                      .length === 1
                      ? 'SET'
                      : 'SETS'}
                  </Text>
                </View>
              </Pressable>
            )
          )}
        </View>
      ) : (
        <View
          style={
            styles.emptyCard
          }
        >
          <Text
            style={
              styles.emptyTitle
            }
          >
            NO EXERCISES YET
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            ADD EXERCISES TO START
            BUILDING YOUR WORKOUT.
          </Text>
        </View>
      )}

      {/* ====================================
          ADD EXERCISE
          ==================================== */}

      <Pressable
        style={({
          pressed,
        }) => [
          styles.addButton,
          pressed &&
            styles.buttonPressed,
        ]}
        onPress={
          handleAddExercise
        }
        disabled={
          !workout ||
          workout.status !==
            'active' ||
          isFinishing
        }
      >
        <Text
          style={
            styles.addButtonText
          }
        >
          + ADD EXERCISE
        </Text>
      </Pressable>

      {/* ====================================
          FINISH WORKOUT
          ==================================== */}

      <Pressable
        style={({
          pressed,
        }) => [
          styles.finishButton,
          pressed &&
            styles.buttonPressed,
        ]}
        onPress={
          handleFinishWorkout
        }
        disabled={
          !workout ||
          workout.status !==
            'active' ||
          isFinishing
        }
      >
        <Text
          style={
            styles.finishButtonText
          }
        >
          {isFinishing
            ? 'SAVING...'
            : 'FINISH WORKOUT'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

/*
 * ========================================
 * FORMAT TIMER
 * ========================================
 */

function formatTime(
  totalSeconds: number
) {
  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) /
        60
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
    fontSize: 11,
    color:
      colors.textSecondary,
  },

  title: {
    fontFamily:
      'PressStart2P',
    fontSize: 24,
    color: colors.text,
    marginBottom:
      spacing.sm,
  },

  status: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.primary,
    marginBottom:
      spacing.xl,
  },

  timerCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.primary,
    padding:
      spacing.lg,
    marginBottom:
      spacing.xl,
  },

  timerLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.md,
  },

  timer: {
    fontFamily: 'VT323',
    fontSize: 52,
    color:
      colors.primary,
  },

  sectionHeader: {
    marginBottom:
      spacing.md,
  },

  sectionTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 12,
    color:
      colors.text,
  },

  exerciseList: {
    gap: spacing.sm,
    marginBottom:
      spacing.md,
  },

  exerciseCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding:
      spacing.md,
  },

  exerciseCardPressed: {
    opacity: 0.65,
    transform: [
      {
        translateX: 2,
      },
    ],
  },

  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  exerciseInfo: {
    flex: 1,
    flexDirection:
      'row',
    alignItems: 'center',
  },

  exerciseNumber: {
    fontFamily: 'VT323',
    fontSize: 28,
    color:
      colors.primary,
    marginRight:
      spacing.md,
  },

  exerciseDetails: {
    flex: 1,
  },

  exerciseName: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color:
      colors.text,
    marginBottom:
      spacing.sm,
  },

  exerciseMeta: {
    fontFamily: 'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,
  },

  setCount: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color:
      colors.textSecondary,
    marginLeft:
      spacing.sm,
  },

  emptyCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding:
      spacing.lg,
    marginBottom:
      spacing.md,
  },

  emptyTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      colors.text,
    marginBottom:
      spacing.md,
  },

  emptyText: {
    fontFamily: 'VT323',
    fontSize: 20,
    color:
      colors.textSecondary,
    lineHeight: 22,
  },

  addButton: {
    borderWidth: 2,
    borderColor:
      colors.primary,
    paddingVertical:
      spacing.md,
    alignItems: 'center',
    backgroundColor:
      colors.background,
    marginBottom:
      spacing.md,
  },

  addButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      colors.primary,
  },

  finishButton: {
    borderWidth: 2,
    borderColor:
      colors.border,
    paddingVertical:
      spacing.lg,
    alignItems: 'center',
    backgroundColor:
      colors.surface,
  },

  finishButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      colors.text,
  },

  buttonPressed: {
    opacity: 0.65,
  },
});