import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFocusEffect } from 'expo-router';

import {
  getTodayStepsProgress,
  refreshTodaySteps,
  subscribeToDeviceSteps,
  evaluateTodayStepsXP,
  requestDevicePedometerPermission,
  getDevicePedometerStatus,
  type StepsProgress,
} from '../../services/activityService';

type StepsCardProps = {
  profileId: string;
};

export default function StepsCard({
  profileId,
}: StepsCardProps) {
  const [steps, setSteps] =
    useState<StepsProgress | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [evaluating, setEvaluating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const subscriptionRef = useRef<{
    remove: () => void;
  } | null>(null);

  /*
   * ========================================
   * LOAD / SYNC STEPS
   * ========================================
   */

  const loadSteps = useCallback(async () => {
    try {
      setError(null);

      /*
       * Check whether the device supports
       * the pedometer.
       */

      const status =
        await getDevicePedometerStatus();

      if (!status.available) {
        setError(
          'Step counter is not available on this device.',
        );

        setSteps(null);

        return;
      }

      /*
       * Ask for permission when necessary.
       */

      if (
        status.permission !== 'granted'
      ) {
         const diagnostic =
    await getDevicePedometerStatus();
        const permission =
          await requestDevicePedometerPermission();

        if (permission !== 'granted') {
          setError(
             `Pedometer permission: ${diagnostic.rawStatus} | available: ${diagnostic.available}`,
          );

          setSteps(null);

          return;
        }
      }

      
      /*
       * Read today's actual system
       * step count.
       */

      await refreshTodaySteps(
        profileId,
      );

      /*
       * Read the value Gymate stored
       * after synchronization.
       */

      const progress =
        await getTodayStepsProgress(
          profileId,
        );

      setSteps(progress);
    } catch (err) {
      console.error(
        'Failed to load steps:',
        err,
      );

      setError(
        'Unable to read your steps right now.',
      );
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  /*
   * ========================================
   * INITIAL SETUP
   * ========================================
   */

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        setLoading(true);
        setError(null);

        /*
         * Check pedometer availability.
         */

        const status =
          await getDevicePedometerStatus();

        if (!mounted) {
          return;
        }

        if (!status.available) {
          setError(
            'Step counter is not available on this device.',
          );

          setLoading(false);

          return;
        }

        /*
         * Request permission if needed.
         */

        let permission =
          status.permission;

        if (
          permission !== 'granted'
        ) {
          permission =
            await requestDevicePedometerPermission();
        }

        if (!mounted) {
          return;
        }

        if (
          permission !== 'granted'
        ) {
          setError(
            'Step counter permission is required to read your steps.',
          );

          setLoading(false);

          return;
        }

        /*
         * Initial sync.
         */

        await refreshTodaySteps(
          profileId,
        );

        const initialProgress =
          await getTodayStepsProgress(
            profileId,
          );

        if (!mounted) {
          return;
        }

        setSteps(initialProgress);
        setLoading(false);

        /*
         * Start live pedometer watcher.
         *
         * IMPORTANT:
         * activityService re-reads the
         * complete today's step count when
         * the watcher fires.
         */

        subscriptionRef.current =
          await subscribeToDeviceSteps(
            profileId,
            async () => {
              if (!mounted) {
                return;
              }

              try {
                const updated =
                  await getTodayStepsProgress(
                    profileId,
                  );

                if (mounted) {
                  setSteps(updated);
                }
              } catch (err) {
                console.error(
                  'Failed to update steps:',
                  err,
                );
              }
            },
          );
      } catch (err) {
        console.error(
          'Failed to initialise step tracking:',
          err,
        );

        if (mounted) {
          setError(
            'Unable to start step tracking.',
          );

          setLoading(false);
        }
      }
    }

    setup();

    return () => {
      mounted = false;

      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [profileId]);

  /*
   * ========================================
   * REFRESH WHEN RETURNING TO ACTIVITY
   * ========================================
   *
   * This is important because the user can
   * walk while Gymate is closed/backgrounded.
   */

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function refreshOnFocus() {
        try {
          await refreshTodaySteps(
            profileId,
          );

          if (!active) {
            return;
          }

          const updated =
            await getTodayStepsProgress(
              profileId,
            );

          if (active) {
            setSteps(updated);
          }
        } catch (err) {
          console.error(
            'Failed to refresh steps on focus:',
            err,
          );
        }
      }

      refreshOnFocus();

      return () => {
        active = false;
      };
    }, [profileId]),
  );

  /*
   * ========================================
   * CLAIM STEP XP
   * ========================================
   */

  async function handleEvaluate() {
    if (
      !steps?.goalReached ||
      evaluating
    ) {
      return;
    }

    try {
      setEvaluating(true);
      setError(null);

      await evaluateTodayStepsXP(
        profileId,
      );

      /*
       * Reload after evaluation so the
       * evaluated state is immediately
       * reflected.
       */

      const updated =
        await getTodayStepsProgress(
          profileId,
        );

      setSteps(updated);
    } catch (err) {
      console.error(
        'Failed to evaluate step XP:',
        err,
      );

      setError(
        'Unable to evaluate step XP.',
      );
    } finally {
      setEvaluating(false);
    }
  }

  /*
   * ========================================
   * LOADING
   * ========================================
   */

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>
            STEPS
          </Text>

          <ActivityIndicator
            color="#b7ff3c"
          />
        </View>

        <Text style={styles.loadingText}>
          Reading today's steps...
        </Text>
      </View>
    );
  }

  /*
   * ========================================
   * ERROR
   * ========================================
   */

  if (!steps) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>
          STEPS
        </Text>

        <Text style={styles.errorText}>
          {error ??
            'No step data available.'}
        </Text>

        <Pressable
          style={styles.refreshButton}
          onPress={loadSteps}
        >
          <Text style={styles.refreshText}>
            TRY AGAIN
          </Text>
        </Pressable>
      </View>
    );
  }

  const progressWidth =
    `${steps.progressPercent}%` as `${number}%`;

  /*
   * ========================================
   * MAIN CARD
   * ========================================
   */

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            STEPS
          </Text>

          <Text style={styles.subtitle}>
            DAILY ACTIVITY
          </Text>
        </View>

        <Text style={styles.percent}>
          {steps.progressPercent}%
        </Text>
      </View>

      <View style={styles.stepRow}>
        <Text style={styles.stepsNumber}>
          {steps.stepCount.toLocaleString()}
        </Text>

        <Text style={styles.goalText}>
          / {steps.goal.toLocaleString()}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
            },
          ]}
        />
      </View>

      <View style={styles.bottomRow}>
        <View>
          {steps.goalReached ? (
            <Text style={styles.successText}>
              10K GOAL COMPLETE
            </Text>
          ) : (
            <Text style={styles.remainingText}>
              {steps.remaining.toLocaleString()}{' '}
              steps remaining
            </Text>
          )}
        </View>

        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>
            +{steps.xp} XP
          </Text>
        </View>
      </View>

      {steps.goalReached &&
        !steps.evaluated && (
          <Pressable
            style={styles.claimButton}
            onPress={handleEvaluate}
            disabled={evaluating}
          >
            {evaluating ? (
              <ActivityIndicator
                color="#111111"
              />
            ) : (
              <Text style={styles.claimText}>
                CLAIM +100 XP
              </Text>
            )}
          </Pressable>
        )}

      {steps.evaluated && (
        <View style={styles.evaluatedBox}>
          <Text style={styles.evaluatedText}>
            ✓ TODAY'S STEP XP EVALUATED
          </Text>
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      <Pressable
        style={styles.refreshButton}
        onPress={loadSteps}
      >
        <Text style={styles.refreshText}>
          REFRESH
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },

  subtitle: {
    color: '#707070',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 1,
  },

  percent: {
    color: '#b7ff3c',
    fontSize: 18,
    fontWeight: '900',
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 22,
  },

  stepsNumber: {
    color: '#b7ff3c',
    fontSize: 42,
    fontWeight: '900',
  },

  goalText: {
    color: '#777777',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 7,
  },

  progressTrack: {
    height: 10,
    backgroundColor: '#292929',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 16,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#b7ff3c',
    borderRadius: 5,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  remainingText: {
    color: '#8a8a8a',
    fontSize: 12,
    fontWeight: '600',
  },

  successText: {
    color: '#b7ff3c',
    fontSize: 12,
    fontWeight: '900',
  },

  xpBadge: {
    backgroundColor: '#232323',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  xpText: {
    color: '#b7ff3c',
    fontSize: 12,
    fontWeight: '900',
  },

  claimButton: {
    height: 48,
    backgroundColor: '#b7ff3c',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  claimText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  evaluatedBox: {
    height: 44,
    backgroundColor: '#202820',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  evaluatedText: {
    color: '#b7ff3c',
    fontSize: 11,
    fontWeight: '800',
  },

  refreshButton: {
    height: 40,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  refreshText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '800',
  },

  loadingText: {
    color: '#888888',
    marginTop: 20,
  },

  errorText: {
    color: '#ff7777',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
});