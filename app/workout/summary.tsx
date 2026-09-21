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

import type {
  WorkoutExercise,
  WorkoutSession,
} from '../../types/workout';

import {
  getCompletedReps,
  getCompletedSets,
  getCompletedSetsForExercise,
  getExerciseVolume,
  getWorkoutPerformance,
  getWorkoutVolume,
  getTotalSets,
  roundPerformance,
} from '../../utils/workoutAnalytics';

import {
  awardWorkoutXP,
} from '../../services/xpService';

import {
  useEffect,
  useState,
} from 'react';

export default function WorkoutSummaryScreen() {
  const {
    workout,
    workoutHistory,
    getPreviousWorkout,
    getWorkoutById,
  } = useWorkout();

  const {
    profile,
  } = useProfile();

  const { workoutId } =
    useLocalSearchParams<{
      workoutId?: string;
    }>();

  /*
   * ========================================
   * LOCAL WORKOUT STATE
   * ========================================
   */

  const [summaryWorkout, setSummaryWorkout] =
    useState<WorkoutSession | null>(null);

  const [previousWorkout, setPreviousWorkout] =
    useState<WorkoutSession | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  /*
   * ========================================
   * XP STATE
   * ========================================
   */

  const [workoutXP, setWorkoutXP] =
    useState<number | null>(null);

  const [xpAlreadyAwarded, setXPAlreadyAwarded] =
    useState(false);

  const [xpError, setXPError] =
    useState<string | null>(null);

  /*
   * ========================================
   * LOAD WORKOUT
   * ========================================
   *
   * IMPORTANT:
   *
   * Only workoutId is used as the dependency.
   *
   * Context functions can have changing
   * references. We don't want the Summary
   * screen constantly reloading the workout.
   *
   * ========================================
   */

  useEffect(() => {
    let mounted = true;

    const loadWorkout = async () => {
      if (!workoutId) {
        if (mounted) {
          setSummaryWorkout(null);
          setPreviousWorkout(null);
          setIsLoading(false);
        }

        return;
      }

      try {
        setIsLoading(true);

        let currentWorkout:
          | WorkoutSession
          | null = null;

        /*
         * ====================================
         * TRY CONTEXT FIRST
         * ====================================
         */

        if (
          workout &&
          workout.id === workoutId
        ) {
          currentWorkout = workout;
        } else {
          /*
           * ==================================
           * LOAD FROM SQLITE
           * ==================================
           */

          currentWorkout =
            await getWorkoutById(
              workoutId
            );
        }

        if (!mounted) {
          return;
        }

        setSummaryWorkout(
          currentWorkout
        );

        /*
         * ====================================
         * LOAD PREVIOUS WORKOUT
         * ====================================
         */

        if (currentWorkout) {
          const previous =
            await getPreviousWorkout(
              currentWorkout.splitId,
              currentWorkout.id
            );

          if (!mounted) {
            return;
          }

          setPreviousWorkout(
            previous
          );
        } else {
          setPreviousWorkout(null);
        }

        /*
         * ====================================
         * LOADING COMPLETE
         * ====================================
         */

        if (mounted) {
          setIsLoading(false);
        }

      } catch (error) {
        console.error(
          'SUMMARY LOAD ERROR:',
          error
        );

        if (mounted) {
          setSummaryWorkout(null);
          setPreviousWorkout(null);
          setIsLoading(false);
        }
      }
    };

    loadWorkout();

    return () => {
      mounted = false;
    };

    /*
     * IMPORTANT:
     *
     * Do not add workout,
     * getWorkoutById or
     * getPreviousWorkout here.
     *
     * We only want this to run when
     * the workout ID changes.
     */

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  /*
   * ========================================
   * PERFORMANCE
   * ========================================
   */

  const performance =
    summaryWorkout
      ? getWorkoutPerformance(
          summaryWorkout,
          workoutHistory
        )
      : 0;

  const roundedPerformance =
    roundPerformance(
      performance
    );

  /*
   * ========================================
   * AWARD WORKOUT XP
   * ========================================
   *
   * This runs only after:
   *
   * 1. Workout has loaded
   * 2. Profile exists
   * 3. Workout ID exists
   *
   * ========================================
   */

  useEffect(() => {
    if (
      isLoading ||
      !profile?.id ||
      !workoutId ||
      !summaryWorkout
    ) {
      return;
    }

    let cancelled = false;

    const awardFinalWorkoutXP =
      async () => {
        try {
          setXPError(null);

          /*
           * ==================================
           * ACTIVITY DATE
           * ==================================
           *
           * Use the actual workout completion
           * date rather than today's date.
           */

          const dateSource =
            summaryWorkout.endedAt
              ? new Date(
                  summaryWorkout.endedAt
                )
              : new Date();

          const year =
            dateSource.getFullYear();

          const month =
            String(
              dateSource.getMonth() + 1
            ).padStart(2, '0');

          const day =
            String(
              dateSource.getDate()
            ).padStart(2, '0');

          const activityDate =
            `${year}-${month}-${day}`;

          /*
           * ==================================
           * DEBUG
           * ==================================
           */

          console.log(
            '========== AWARDING WORKOUT XP =========='
          );

          console.log(
            'Profile:',
            profile.id
          );

          console.log(
            'Workout:',
            summaryWorkout.id
          );

          console.log(
            'Performance:',
            performance
          );

          console.log(
            'Rounded performance:',
            roundedPerformance
          );

          console.log(
            'Activity date:',
            activityDate
          );

          /*
           * ==================================
           * AWARD XP
           * ==================================
           */

          const result =
            await awardWorkoutXP(
              profile.id,
              summaryWorkout.id,
              performance,
              activityDate
            );

          if (cancelled) {
            return;
          }

          /*
           * ==================================
           * SAVE RESULT TO UI
           * ==================================
           */

          if (result) {
            setWorkoutXP(
              result.xpAwarded
            );

            setXPAlreadyAwarded(
              result.alreadyAwarded
            );

            console.log(
              'XP AWARDED:',
              result.xpAwarded
            );

            console.log(
              'PREVIOUS XP:',
              result.previousXP
            );

            console.log(
              'TOTAL XP:',
              result.totalXP
            );

            console.log(
              'ALREADY AWARDED:',
              result.alreadyAwarded
            );

            console.log(
              '=========================================='
            );
          } else {
            /*
             * -100% performance results
             * in zero XP.
             */

            setWorkoutXP(0);

            setXPAlreadyAwarded(false);

            console.log(
              'XP AWARDED: 0'
            );

            console.log(
              '=========================================='
            );
          }

        } catch (error) {
          console.error(
            '========== XP AWARD ERROR =========='
          );

          console.error(
            error
          );

          console.error(
            '===================================='
          );

          if (!cancelled) {
            setXPError(
              error instanceof Error
                ? error.message
                : 'FAILED TO AWARD XP'
            );

            /*
             * Don't leave the UI stuck
             * at CALCULATING forever.
             */

            setWorkoutXP(0);
          }
        }
      };

    awardFinalWorkoutXP();

    return () => {
      cancelled = true;
    };

  }, [
    isLoading,
    profile?.id,
    workoutId,
    summaryWorkout,
    performance,
    roundedPerformance,
  ]);

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
          style={
            styles.loadingText
          }
        >
          LOADING WORKOUT...
        </Text>
      </View>
    );
  }

  /*
   * ========================================
   * WORKOUT NOT FOUND
   * ========================================
   */

  if (!summaryWorkout) {
    return (
      <View
        style={
          styles.errorContainer
        }
      >
        <Text
          style={
            styles.errorText
          }
        >
          WORKOUT NOT FOUND
        </Text>

        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.replace(
              '/(tabs)/train'
            )
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            GO HOME
          </Text>
        </Pressable>
      </View>
    );
  }

  /*
   * ========================================
   * CURRENT WORKOUT
   * ========================================
   */

  const currentWorkout =
    summaryWorkout;

  /*
   * ========================================
   * WORKOUT STATS
   * ========================================
   */

  const totalSets =
    getTotalSets(
      currentWorkout
    );

  const completedSets =
    getCompletedSets(
      currentWorkout
    );

  const totalVolume =
    getWorkoutVolume(
      currentWorkout
    );

  const duration =
    getWorkoutDuration(
      currentWorkout
    );

  /*
   * ========================================
   * PREVIOUS STATS
   * ========================================
   */

  const previousVolume =
    previousWorkout
      ? getWorkoutVolume(
          previousWorkout
        )
      : 0;

  const volumeDifference =
    totalVolume -
    previousVolume;

  /*
   * ========================================
   * SCREEN
   * ========================================
   */

  return (
    <ScrollView
      style={
        styles.container
      }
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

      <Text
        style={
          styles.eyebrow
        }
      >
        WORKOUT COMPLETE
      </Text>

      <Text
        style={
          styles.title
        }
      >
        {currentWorkout.name}
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        GOOD WORK. SESSION LOGGED.
      </Text>

      {/* ====================================
          XP RESULT
          ==================================== */}

      <View
        style={
          styles.xpCard
        }
      >
        <Text
          style={
            styles.xpLabel
          }
        >
          WORKOUT XP
        </Text>

        <Text
          style={
            styles.xpValue
          }
        >
          {workoutXP === null
            ? 'CALCULATING...'
            : `+${workoutXP} XP`}
        </Text>

        {xpAlreadyAwarded && (
          <Text
            style={
              styles.xpAlreadyText
            }
          >
            XP ALREADY AWARDED
          </Text>
        )}

        {xpError && (
          <Text
            style={
              styles.xpErrorText
            }
          >
            XP ERROR: {xpError}
          </Text>
        )}
      </View>

      {/* ====================================
          DURATION
          ==================================== */}

      <View
        style={
          styles.durationCard
        }
      >
        <Text
          style={
            styles.durationLabel
          }
        >
          WORKOUT TIME
        </Text>

        <Text
          style={
            styles.duration
          }
        >
          {formatTime(
            duration
          )}
        </Text>
      </View>

      {/* ====================================
          STATS
          ==================================== */}

      <View
        style={
          styles.statsGrid
        }
      >
        <StatCard
          value={String(
            currentWorkout
              .exercises.length
          )}
          label="EXERCISES"
        />

        <StatCard
          value={String(
            totalSets
          )}
          label="TOTAL SETS"
        />

        <StatCard
          value={String(
            completedSets
          )}
          label="COMPLETED"
        />

        <StatCard
          value={`${totalVolume} KG`}
          label="VOLUME"
        />
      </View>

      {/* ====================================
          PERFORMANCE
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
          PERFORMANCE
        </Text>
      </View>

      {!previousWorkout ? (
        <View
          style={
            styles.noPreviousCard
          }
        >
          <Text
            style={
              styles.noPreviousTitle
            }
          >
            FIRST WORKOUT
          </Text>

          <Text
            style={
              styles.noPreviousText
            }
          >
            COMPLETE ANOTHER WORKOUT
            FOR THIS SPLIT TO SEE YOUR
            PERFORMANCE TREND.
          </Text>
        </View>
      ) : (
        <>
          <PerformanceOverview
            currentVolume={
              totalVolume
            }
            previousVolume={
              previousVolume
            }
            volumeDifference={
              volumeDifference
            }
            performance={
              roundedPerformance
            }
          />

          <View
            style={
              styles.exerciseComparisonList
            }
          >
            {currentWorkout.exercises.map(
              (
                currentExercise
              ) => {
                const previousExercise =
                  previousWorkout.exercises.find(
                    (exercise) =>
                      exercise.exercise.id ===
                      currentExercise
                        .exercise.id
                  );

                return (
                  <ExerciseComparison
                    key={
                      currentExercise
                        .exercise.id
                    }
                    currentExercise={
                      currentExercise
                    }
                    previousExercise={
                      previousExercise
                    }
                  />
                );
              }
            )}
          </View>
        </>
      )}

      {/* ====================================
          SESSION BREAKDOWN
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
          SESSION BREAKDOWN
        </Text>
      </View>

      {currentWorkout.exercises.map(
        (
          workoutExercise,
          index
        ) => {
          const exerciseVolume =
            getExerciseVolume(
              workoutExercise
            );

          const completed =
            getCompletedSetsForExercise(
              workoutExercise
            );

          return (
            <View
              key={
                workoutExercise
                  .exercise.id
              }
              style={
                styles.exerciseCard
              }
            >
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
                  {String(
                    index + 1
                  ).padStart(
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
                    {
                      workoutExercise
                        .exercise.name
                    }
                  </Text>

                  <Text
                    style={
                      styles.exerciseMeta
                    }
                  >
                    {
                      workoutExercise
                        .sets.length
                    }{' '}
                    SETS
                    {' • '}
                    {completed}{' '}
                    DONE
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.exerciseStats
                }
              >
                <Text
                  style={
                    styles.exerciseVolume
                  }
                >
                  {exerciseVolume} KG
                </Text>

                <Text
                  style={
                    styles.exerciseVolumeLabel
                  }
                >
                  VOLUME
                </Text>
              </View>
            </View>
          );
        }
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
          router.replace(
            '/(tabs)/train'
          )
        }
      >
        <Text
          style={
            styles.doneButtonText
          }
        >
          DONE
        </Text>
      </Pressable>
    </ScrollView>
  );
}

/*
 * ========================================
 * PERFORMANCE OVERVIEW
 * ========================================
 */

function PerformanceOverview({
  currentVolume,
  previousVolume,
  volumeDifference,
  performance,
}: {
  currentVolume: number;
  previousVolume: number;
  volumeDifference: number;
  performance: number;
}) {
  const improved =
    performance > 0.5;

  const decreased =
    performance < -0.5;

  const unchanged =
    !improved &&
    !decreased;

  return (
    <View
      style={
        styles.performanceCard
      }
    >
      <Text
        style={
          styles.performanceLabel
        }
      >
        OVERALL PERFORMANCE
      </Text>

      <View
        style={
          styles.performanceMain
        }
      >
        <Text
          style={[
            styles.performanceStatus,
            improved &&
              styles.improvedText,
            decreased &&
              styles.decreasedText,
            unchanged &&
              styles.unchangedText,
          ]}
        >
          {improved
            ? '↑ IMPROVED'
            : decreased
            ? '↓ DECREASED'
            : '→ UNCHANGED'}
        </Text>

        <Text
          style={
            styles.performancePercentage
          }
        >
          {formatSignedPercentage(
            performance
          )}
        </Text>
      </View>

      <View
        style={
          styles.performanceStats
        }
      >
        <ComparisonStat
          label="LAST"
          value={`${previousVolume} KG`}
        />

        <ComparisonStat
          label="TODAY"
          value={`${currentVolume} KG`}
        />

        <ComparisonStat
          label="CHANGE"
          value={`${formatSignedNumber(
            volumeDifference
          )} KG`}
        />
      </View>
    </View>
  );
}

/*
 * ========================================
 * EXERCISE COMPARISON
 * ========================================
 */

function ExerciseComparison({
  currentExercise,
  previousExercise,
}: {
  currentExercise: WorkoutExercise;
  previousExercise?: WorkoutExercise;
}) {
  if (!previousExercise) {
    return (
      <View
        style={
          styles.comparisonCard
        }
      >
        <Text
          style={
            styles.comparisonExerciseName
          }
        >
          {currentExercise.exercise.name}
        </Text>

        <Text
          style={
            styles.noPreviousExercise
          }
        >
          NEW EXERCISE
        </Text>

        <Text
          style={
            styles.comparisonMuted
          }
        >
          NO PREVIOUS DATA
        </Text>
      </View>
    );
  }

  const currentVolume =
    getExerciseVolume(
      currentExercise
    );

  const previousVolume =
    getExerciseVolume(
      previousExercise
    );

  const volumeDifference =
    currentVolume -
    previousVolume;

  const percentage =
    previousVolume > 0
      ? (volumeDifference /
          previousVolume) *
        100
      : 0;

  const currentReps =
    getCompletedReps(
      currentExercise
    );

  const previousReps =
    getCompletedReps(
      previousExercise
    );

  const repsDifference =
    currentReps -
    previousReps;

  const currentSets =
    getCompletedSetsForExercise(
      currentExercise
    );

  const previousSets =
    getCompletedSetsForExercise(
      previousExercise
    );

  const setsDifference =
    currentSets -
    previousSets;

  const improved =
    volumeDifference > 0;

  const decreased =
    volumeDifference < 0;

  const unchanged =
    volumeDifference === 0;

  return (
    <View
      style={
        styles.comparisonCard
      }
    >
      <Text
        style={
          styles.comparisonExerciseName
        }
      >
        {currentExercise.exercise.name}
      </Text>

      <View
        style={
          styles.comparisonStatusRow
        }
      >
        <Text
          style={[
            styles.comparisonStatus,
            improved &&
              styles.improvedText,
            decreased &&
              styles.decreasedText,
            unchanged &&
              styles.unchangedText,
          ]}
        >
          {improved
            ? '↑ IMPROVED'
            : decreased
            ? '↓ DECREASED'
            : '→ UNCHANGED'}
        </Text>

        <Text
          style={[
            styles.comparisonPercentage,
            improved &&
              styles.improvedText,
            decreased &&
              styles.decreasedText,
          ]}
        >
          {formatSignedPercentage(
            percentage
          )}
        </Text>
      </View>

      <View
        style={
          styles.comparisonStats
        }
      >
        <ComparisonStat
          label="LAST"
          value={`${previousVolume} KG`}
        />

        <ComparisonStat
          label="TODAY"
          value={`${currentVolume} KG`}
        />

        <ComparisonStat
          label="VOLUME"
          value={`${formatSignedNumber(
            volumeDifference
          )} KG`}
        />
      </View>

      <View
        style={
          styles.comparisonSecondary
        }
      >
        <ComparisonSecondaryStat
          label="REPS"
          value={`${formatSignedNumber(
            repsDifference
          )}`}
        />

        <ComparisonSecondaryStat
          label="SETS"
          value={`${formatSignedNumber(
            setsDifference
          )}`}
        />
      </View>
    </View>
  );
}

/*
 * ========================================
 * COMPARISON STAT
 * ========================================
 */

function ComparisonStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.comparisonStat
      }
    >
      <Text
        style={
          styles.comparisonStatValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.comparisonStatLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

/*
 * ========================================
 * SECONDARY COMPARISON STAT
 * ========================================
 */

function ComparisonSecondaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const numericValue =
    Number(value);

  return (
    <View
      style={
        styles.secondaryStat
      }
    >
      <Text
        style={
          styles.secondaryStatLabel
        }
      >
        {label}
      </Text>

      <Text
        style={[
          styles.secondaryStatValue,
          numericValue > 0 &&
            styles.improvedText,
          numericValue < 0 &&
            styles.decreasedText,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/*
 * ========================================
 * STAT CARD
 * ========================================
 */

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View
      style={
        styles.statCard
      }
    >
      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

/*
 * ========================================
 * WORKOUT DURATION
 * ========================================
 */

function getWorkoutDuration(
  workout: WorkoutSession
): number {
  if (!workout.startedAt) {
    return 0;
  }

  const endTime =
    workout.endedAt
      ? new Date(
          workout.endedAt
        ).getTime()
      : Date.now();

  const startTime =
    new Date(
      workout.startedAt
    ).getTime();

  return Math.max(
    0,
    Math.floor(
      (endTime - startTime) /
        1000
    )
  );
}

/*
 * ========================================
 * FORMAT TIME
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
 * SIGNED NUMBER
 * ========================================
 */

function formatSignedNumber(
  value: number
): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

/*
 * ========================================
 * SIGNED PERCENTAGE
 * ========================================
 */

function formatSignedPercentage(
  value: number
): string {
  if (value > 0) {
    return `+${value.toFixed(1)}%`;
  }

  if (value < 0) {
    return `${value.toFixed(1)}%`;
  }

  return '0.0%';
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

  /*
   * XP
   */

  xpCard: {
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

  xpLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.sm,
  },

  xpValue: {
    fontFamily:
      'VT323',
    fontSize: 40,
    color:
      colors.primary,
  },

  xpAlreadyText: {
    fontFamily:
      'PressStart2P',
    fontSize: 7,
    color:
      colors.textSecondary,
    marginTop:
      spacing.sm,
  },

  xpErrorText: {
    fontFamily:
      'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,
    marginTop:
      spacing.sm,
  },

  /*
   * HEADER
   */

  eyebrow: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color:
      colors.primary,
    marginBottom:
      spacing.md,
  },

  title: {
    fontFamily:
      'PressStart2P',
    fontSize: 22,
    color:
      colors.text,
    marginBottom:
      spacing.sm,
  },

  subtitle: {
    fontFamily:
      'VT323',
    fontSize: 20,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.xl,
  },

  /*
   * DURATION
   */

  durationCard: {
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

  durationLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.md,
  },

  duration: {
    fontFamily:
      'VT323',
    fontSize: 48,
    color:
      colors.primary,
  },

  /*
   * STATS
   */

  statsGrid: {
    flexDirection:
      'row',
    flexWrap:
      'wrap',
    gap:
      spacing.sm,
    marginBottom:
      spacing.xl,
  },

  statCard: {
    width:
      '48%',
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding:
      spacing.md,
  },

  statValue: {
    fontFamily:
      'VT323',
    fontSize: 30,
    color:
      colors.primary,
    marginBottom:
      spacing.sm,
  },

  statLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color:
      colors.textSecondary,
  },

  /*
   * SECTION
   */

  sectionHeader: {
    marginBottom:
      spacing.md,
  },

  sectionTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      colors.text,
  },

  /*
   * PERFORMANCE
   */

  performanceCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.primary,
    padding:
      spacing.md,
    marginBottom:
      spacing.md,
  },

  performanceLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.md,
  },

  performanceMain: {
    flexDirection:
      'row',
    alignItems:
      'center',
    justifyContent:
      'space-between',
    marginBottom:
      spacing.lg,
  },

  performanceStatus: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
  },

  performancePercentage: {
    fontFamily:
      'VT323',
    fontSize: 30,
    color:
      colors.primary,
  },

  performanceStats: {
    flexDirection:
      'row',
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    paddingTop:
      spacing.md,
  },

  comparisonStat: {
    flex: 1,
  },

  comparisonStatValue: {
    fontFamily:
      'VT323',
    fontSize: 22,
    color:
      colors.primary,
    marginBottom: 2,
  },

  comparisonStatLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 6,
    color:
      colors.textSecondary,
  },

  improvedText: {
    color:
      colors.primary,
  },

  decreasedText: {
    color:
      colors.textSecondary,
  },

  unchangedText: {
    color:
      colors.text,
  },

  /*
   * EXERCISE COMPARISON
   */

  exerciseComparisonList: {
    gap:
      spacing.sm,
    marginBottom:
      spacing.xl,
  },

  comparisonCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding:
      spacing.md,
  },

  comparisonExerciseName: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color:
      colors.text,
    marginBottom:
      spacing.md,
  },

  comparisonStatusRow: {
    flexDirection:
      'row',
    alignItems:
      'center',
    justifyContent:
      'space-between',
    marginBottom:
      spacing.md,
  },

  comparisonStatus: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
  },

  comparisonPercentage: {
    fontFamily:
      'VT323',
    fontSize: 24,
    color:
      colors.text,
  },

  comparisonStats: {
    flexDirection:
      'row',
    paddingTop:
      spacing.sm,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  comparisonSecondary: {
    flexDirection:
      'row',
    marginTop:
      spacing.md,
    paddingTop:
      spacing.sm,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  secondaryStat: {
    flexDirection:
      'row',
    alignItems:
      'center',
    marginRight:
      spacing.xl,
  },

  secondaryStatLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 6,
    color:
      colors.textSecondary,
    marginRight:
      spacing.sm,
  },

  secondaryStatValue: {
    fontFamily:
      'VT323',
    fontSize: 20,
    color:
      colors.text,
  },

  noPreviousExercise: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color:
      colors.primary,
    marginBottom:
      spacing.sm,
  },

  comparisonMuted: {
    fontFamily:
      'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,
  },

  noPreviousCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding:
      spacing.lg,
    marginBottom:
      spacing.xl,
  },

  noPreviousTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      colors.primary,
    marginBottom:
      spacing.md,
  },

  noPreviousText: {
    fontFamily:
      'VT323',
    fontSize: 20,
    lineHeight: 22,
    color:
      colors.textSecondary,
  },

  /*
   * SESSION BREAKDOWN
   */

  exerciseCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding:
      spacing.md,
    marginBottom:
      spacing.sm,
  },

  exerciseHeader: {
    flexDirection:
      'row',
    alignItems:
      'center',
  },

  exerciseNumber: {
    fontFamily:
      'VT323',
    fontSize: 28,
    color:
      colors.primary,
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
    color:
      colors.text,
    marginBottom:
      spacing.sm,
  },

  exerciseMeta: {
    fontFamily:
      'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,
  },

  exerciseStats: {
    marginTop:
      spacing.md,
    paddingTop:
      spacing.md,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  exerciseVolume: {
    fontFamily:
      'VT323',
    fontSize: 24,
    color:
      colors.primary,
  },

  exerciseVolumeLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 7,
    color:
      colors.textSecondary,
  },

  /*
   * DONE
   */

  doneButton: {
    borderWidth:
      2,
    borderColor:
      colors.primary,
    backgroundColor:
      colors.primary,
    paddingVertical:
      spacing.lg,
    alignItems:
      'center',
    marginTop:
      spacing.lg,
  },

  doneButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      colors.background,
  },

  buttonPressed: {
    opacity: 0.65,
  },

  /*
   * ERROR
   */

  errorContainer: {
    flex: 1,
    alignItems:
      'center',
    justifyContent:
      'center',
    backgroundColor:
      colors.background,
    padding:
      spacing.lg,
  },

  errorText: {
    fontFamily:
      'PressStart2P',
    fontSize: 13,
    color:
      colors.primary,
    marginBottom:
      spacing.xl,
  },

  loadingText: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      colors.primary,
  },

  backButton: {
    borderWidth:
      2,
    borderColor:
      colors.border,
    padding:
      spacing.md,
  },

  backButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color:
      colors.text,
  },
});