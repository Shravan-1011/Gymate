import {
  useEffect,
  useState,
} from 'react';

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
import {
  colors,
  spacing,
} from '../../constants/theme';

import {
  useWorkout,
} from '../../context/WorkoutContext';

/*
 * ========================================
 * SCREEN
 * ========================================
 */

export default function WorkoutScreen() {
  const {
    workout,
    startWorkout,
  } = useWorkout();

  /*
   * ======================================
   * STATE
   * ======================================
   */

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  const [
    isStarting,
    setIsStarting,
  ] = useState(false);

  /*
   * ======================================
   * ROUTE PARAMETER
   * ======================================
   */

  const params =
    useLocalSearchParams<{
      splitId?:
        | string
        | string[];
    }>();

  const splitId =
    Array.isArray(params.splitId)
      ? params.splitId[0]
      : params.splitId;

  /*
   * ======================================
   * FIND SELECTED SPLIT
   * ======================================
   */

  const selectedSplit =
    workoutSplits.find(
      (split) =>
        split.id === splitId
    );

  /*
   * ======================================
   * ACTIVE WORKOUT
   * ======================================
   *
   * The setup screen only considers the
   * workout active if it belongs to the
   * selected split.
   */

  const isActiveWorkout =
    Boolean(
      workout &&
        workout.status ===
          'active' &&
        workout.splitId ===
          splitId
    );

  /*
   * ======================================
   * ANOTHER ACTIVE WORKOUT
   * ======================================
   *
   * There can only be one active workout.
   *
   * If the user selects another split while
   * a different workout is active, don't
   * pretend this split is active.
   */

  const hasDifferentActiveWorkout =
    Boolean(
      workout &&
        workout.status ===
          'active' &&
        workout.splitId !==
          splitId
    );

  /*
   * ======================================
   * WORKOUT TIMER
   * ======================================
   *
   * Timer is based on the persisted
   * startedAt timestamp.
   *
   * This means leaving the screen does not
   * reset the timer.
   */

  useEffect(() => {
    if (
      !isActiveWorkout ||
      !workout?.startedAt
    ) {
      setElapsedSeconds(0);
      return;
    }

    const startTime =
      new Date(
        workout.startedAt
      ).getTime();

    if (
      Number.isNaN(startTime)
    ) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const elapsed =
        Math.floor(
          (Date.now() -
            startTime) /
            1000
        );

      setElapsedSeconds(
        Math.max(0, elapsed)
      );
    };

    updateTimer();

    const interval =
      setInterval(
        updateTimer,
        1000
      );

    return () => {
      clearInterval(
        interval
      );
    };
  }, [
    isActiveWorkout,
    workout?.startedAt,
  ]);

  /*
   * ======================================
   * SAFE BACK
   * ======================================
   */

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  /*
   * ======================================
   * START WORKOUT
   * ======================================
   */

  const handleStartWorkout =
    async () => {
      /*
       * Prevent double taps.
       */

      if (isStarting) {
        return;
      }

      /*
       * Split must exist.
       */

      if (!selectedSplit) {
        return;
      }

      /*
       * If another workout is already
       * active, don't start this split.
       */

      if (
        hasDifferentActiveWorkout
      ) {
        return;
      }

      /*
       * If this split is already active,
       * simply continue to it.
       */

      if (isActiveWorkout) {
        router.push(
          {
            pathname:
              '/workout/active',
            params: {
              splitId:
                selectedSplit.id,
              name:
                selectedSplit.name,
            },
          }
        );

        return;
      }

      try {
        setIsStarting(true);

        /*
         * IMPORTANT:
         *
         * Wait for SQLite + Context state
         * to finish before navigating.
         */

        await startWorkout(
          selectedSplit.id,
          selectedSplit.name
        );

        /*
         * Now the active workout exists.
         */

        router.push({
          pathname:
            '/workout/active',
          params: {
            splitId:
              selectedSplit.id,
            name:
              selectedSplit.name,
          },
        });
      } catch (error) {
        console.error(
          'Failed to start workout:',
          error
        );
      } finally {
        setIsStarting(false);
      }
    };

  /*
   * ======================================
   * CONTINUE ACTIVE WORKOUT
   * ======================================
   */

  const handleContinueWorkout =
    () => {
      if (
        !workout ||
        workout.status !==
          'active'
      ) {
        return;
      }

      router.push({
        pathname:
          '/workout/active',
        params: {
          splitId:
            workout.splitId,
          name:
            workout.name,
        },
      });
    };

  /*
   * ======================================
   * SPLIT NOT FOUND
   * ======================================
   */

  if (!selectedSplit) {
    return (
      <View
        style={
          styles.errorContainer
        }
      >
        <Text
          style={
            styles.errorTitle
          }
        >
          WORKOUT NOT FOUND
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          INVALID OR MISSING
          WORKOUT SPLIT.
        </Text>

        <Pressable
          style={
            styles.backButton
          }
          onPress={handleBack}
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            GO BACK
          </Text>
        </Pressable>
      </View>
    );
  }

  /*
   * ======================================
   * SCREEN
   * ======================================
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
      {/* ==================================
          BACK
          ================================== */}

      <Pressable
        style={styles.backRow}
        onPress={handleBack}
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

      {/* ==================================
          HEADER
          ================================== */}

      <Text
        style={styles.eyebrow}
      >
        WORKOUT SETUP
      </Text>

      <Text
        style={styles.title}
      >
        {selectedSplit.name}
      </Text>

      <Text
        style={styles.subtitle}
      >
        {
          selectedSplit.shortDescription
        }
      </Text>

      {/* ==================================
          TARGET MUSCLES
          ================================== */}

      <View
        style={styles.targetCard}
      >
        <Text
          style={
            styles.targetLabel
          }
        >
          TARGET MUSCLES
        </Text>

        <Text
          style={
            styles.targetText
          }
        >
          {selectedSplit.targetMuscles
            .map((muscle) =>
              muscle
                .replace(
                  /-/g,
                  ' '
                )
                .toUpperCase()
            )
            .join(' • ')}
        </Text>
      </View>

      {/* ==================================
          ACTIVE WORKOUT WARNING
          ================================== */}

      {hasDifferentActiveWorkout && (
        <View
          style={
            styles.warningCard
          }
        >
          <Text
            style={
              styles.warningTitle
            }
          >
            WORKOUT ALREADY ACTIVE
          </Text>

          <Text
            style={
              styles.warningText
            }
          >
            YOU ALREADY HAVE AN ACTIVE
            WORKOUT:
          </Text>

          <Text
            style={
              styles.warningWorkout
            }
          >
            {workout?.name ??
              'WORKOUT'}
          </Text>

          <Pressable
            style={({
              pressed,
            }) => [
              styles.continueButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={
              handleContinueWorkout
            }
          >
            <Text
              style={
                styles.continueButtonText
              }
            >
              CONTINUE ACTIVE WORKOUT
            </Text>
          </Pressable>
        </View>
      )}

      {/* ==================================
          ACTIVE SELECTED WORKOUT
          ================================== */}

      {isActiveWorkout && (
        <>
          <View
            style={
              styles.activeCard
            }
          >
            <Text
              style={
                styles.activeLabel
              }
            >
              WORKOUT IN PROGRESS
            </Text>

            <Text
              style={
                styles.activeTime
              }
            >
              {formatTime(
                elapsedSeconds
              )}
            </Text>

            <Text
              style={
                styles.activeSubtext
              }
            >
              {workout?.exercises.length ??
                0}{' '}
              {workout?.exercises.length ===
              1
                ? 'EXERCISE'
                : 'EXERCISES'}{' '}
              ADDED
            </Text>
          </View>

          <Pressable
            style={({
              pressed,
            }) => [
              styles.primaryButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={
              handleContinueWorkout
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              CONTINUE WORKOUT
            </Text>
          </Pressable>
        </>
      )}

      {/* ==================================
          READY TO START
          ================================== */}

      {!isActiveWorkout &&
        !hasDifferentActiveWorkout && (
          <>
            <View
              style={
                styles.readyCard
              }
            >
              <Text
                style={
                  styles.readyTitle
                }
              >
                READY?
              </Text>

              <Text
                style={
                  styles.readyText
                }
              >
                YOUR WORKOUT WILL START
                WHEN YOU PRESS THE BUTTON
                BELOW.
              </Text>

              <Text
                style={
                  styles.readySubtext
                }
              >
                YOU CAN ADD EXERCISES
                AFTER STARTING.
              </Text>
            </View>

            <Pressable
              style={({
                pressed,
              }) => [
                styles.primaryButton,
                pressed &&
                  styles.buttonPressed,
                isStarting &&
                  styles.disabledButton,
              ]}
              onPress={
                handleStartWorkout
              }
              disabled={isStarting}
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {isStarting
                  ? 'STARTING...'
                  : 'START WORKOUT'}
              </Text>
            </Pressable>
          </>
        )}

      {/* ==================================
          EXERCISE PREVIEW
          ================================== */}

      <View
        style={styles.previewSection}
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          RECOMMENDED EXERCISES
        </Text>

        {selectedSplit.recommendedExerciseIds
          .slice(0, 6)
          .map(
            (
              exerciseId,
              index
            ) => (
              <View
                key={exerciseId}
                style={
                  styles.previewRow
                }
              >
                <Text
                  style={
                    styles.previewNumber
                  }
                >
                  {String(
                    index + 1
                  ).padStart(
                    2,
                    '0'
                  )}
                </Text>

                <Text
                  style={
                    styles.previewText
                  }
                >
                  {formatExerciseId(
                    exerciseId
                  )}
                </Text>
              </View>
            )
          )}

        {selectedSplit
          .recommendedExerciseIds
          .length > 6 && (
          <Text
            style={
              styles.moreText
            }
          >
            +
            {selectedSplit
              .recommendedExerciseIds
              .length - 6}{' '}
            MORE AVAILABLE
          </Text>
        )}
      </View>

      {/* ==================================
          FOOTER
          ================================== */}

      <View
        style={styles.footer}
      >
        <Text
          style={
            styles.footerText
          }
        >
          BUILD YOUR WORKOUT.
        </Text>

        <Text
          style={
            styles.footerSubtext
          }
        >
          TRAIN. TRACK. IMPROVE.
        </Text>
      </View>
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
 * FORMAT EXERCISE ID
 * ========================================
 */

function formatExerciseId(
  exerciseId: string
): string {
  return exerciseId
    .replace(/-/g, ' ')
    .toUpperCase();
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
   * BACK
   */

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

  /*
   * HEADER
   */

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
    fontSize: 22,
    color: colors.text,
    marginBottom:
      spacing.sm,
    lineHeight: 30,
  },

  subtitle: {
    fontFamily: 'VT323',
    fontSize: 22,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.xl,
  },

  /*
   * TARGET
   */

  targetCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding: spacing.md,
    marginBottom:
      spacing.lg,
  },

  targetLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.sm,
  },

  targetText: {
    fontFamily: 'VT323',
    fontSize: 19,
    color: colors.primary,
    lineHeight: 22,
  },

  /*
   * WARNING
   */

  warningCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.primary,
    padding: spacing.md,
    marginBottom:
      spacing.lg,
  },

  warningTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color: colors.primary,
    marginBottom:
      spacing.md,
  },

  warningText: {
    fontFamily: 'VT323',
    fontSize: 19,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.xs,
  },

  warningWorkout: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color: colors.text,
    marginBottom:
      spacing.md,
    lineHeight: 18,
  },

  continueButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.primary,
    paddingHorizontal:
      spacing.md,
  },

  continueButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color: colors.primary,
    textAlign: 'center',
  },

  /*
   * ACTIVE
   */

  activeCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.primary,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom:
      spacing.md,
  },

  activeLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color: colors.primary,
    marginBottom:
      spacing.md,
  },

  activeTime: {
    fontFamily: 'VT323',
    fontSize: 52,
    color: colors.text,
    lineHeight: 56,
  },

  activeSubtext: {
    fontFamily: 'VT323',
    fontSize: 19,
    color:
      colors.textSecondary,
    marginTop:
      spacing.sm,
  },

  /*
   * READY
   */

  readyCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding: spacing.lg,
    marginBottom:
      spacing.md,
  },

  readyTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 12,
    color: colors.primary,
    marginBottom:
      spacing.md,
  },

  readyText: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.text,
    lineHeight: 22,
    marginBottom:
      spacing.sm,
  },

  readySubtext: {
    fontFamily: 'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,
  },

  /*
   * BUTTON
   */

  primaryButton: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      colors.primary,
    borderWidth: 2,
    borderColor:
      colors.primary,
    paddingHorizontal:
      spacing.lg,
    marginBottom:
      spacing.xl,
  },

  primaryButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      colors.background,
    textAlign: 'center',
  },

  disabledButton: {
    opacity: 0.5,
  },

  buttonPressed: {
    opacity: 0.65,
    transform: [
      {
        translateX: 2,
      },
    ],
  },

  /*
   * RECOMMENDED PREVIEW
   */

  previewSection: {
    marginTop:
      spacing.md,
    marginBottom:
      spacing.xl,
  },

  sectionTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.md,
  },

  previewRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    paddingHorizontal:
      spacing.md,
    marginBottom:
      spacing.sm,
  },

  previewNumber: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color: colors.primary,
    width: 38,
  },

  previewText: {
    flex: 1,
    fontFamily:
      'VT323',
    fontSize: 20,
    color: colors.text,
  },

  moreText: {
    fontFamily:
      'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,
    marginTop:
      spacing.xs,
  },

  /*
   * FOOTER
   */

  footer: {
    alignItems: 'center',
    paddingTop:
      spacing.md,
  },

  footerText: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color: colors.primary,
    marginBottom:
      spacing.sm,
  },

  footerSubtext: {
    fontFamily: 'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,
  },

  /*
   * ERROR
   */

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
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginBottom:
      spacing.md,
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
    minHeight: 54,
    paddingHorizontal:
      spacing.xl,
    alignItems: 'center',
    justifyContent:
      'center',
    borderWidth: 2,
    borderColor:
      colors.primary,
    backgroundColor:
      colors.surface,
  },

  backButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 9,
    color: colors.primary,
  },
});