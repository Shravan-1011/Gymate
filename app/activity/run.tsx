import React, {
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  calculateElapsedActiveSeconds,
  finishRunAndStopTracking,

  pauseRunningSession,
  resumeRunningSession,
  startRunningLocationTracking,
} from '../../services/runningTrackingService';

import RunningMap from '../../components/activity/RunningMap';

import {
  getRunningSessionById,
} from '../../database/activityRepository';

import {
  formatPace,
} from '../../utils/runningMath';

import type {
  RunningSession,
} from '../../types/activity';


export default function RunScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      profileId?: string;
      runId?: string;
    }>();

  const profileId =
    typeof params.profileId === 'string'
      ? params.profileId
      : '';

  const runId =
    typeof params.runId === 'string'
      ? params.runId
      : '';

  const [run, setRun] =
    useState<RunningSession | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [elapsed, setElapsed] =
    useState(0);


  /*
   * ======================================
   * LOAD EXACT RUN
   * ======================================
   *
   * We already receive runId from the
   * Activity screen.
   *
   * Therefore we load that exact session
   * directly instead of asking for the
   * "current active session".
   *
   * This avoids the RUN NOT FOUND problem
   * if the active-session query and the
   * navigation state get out of sync.
   * ======================================
   */

  useEffect(() => {
    if (!profileId || !runId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadRun() {
      try {
        const current =
          await getRunningSessionById(
            profileId,
            runId,
          );

        if (!mounted) {
          return;
        }

        if (!current) {
          console.warn(
            '[Gymate] Running session not found:',
            {
              profileId,
              runId,
            },
          );

          setRun(null);
          return;
        }

        setRun(current);

        setElapsed(
          calculateElapsedActiveSeconds(
            current,
          ),
        );

        /*
         * If the run is active, make sure
         * GPS tracking is running.
         */

        if (
          current.status === 'active'
        ) {
          try {
            await startRunningLocationTracking();
          } catch (trackingError) {
            console.error(
              '[Gymate] Failed to start running GPS:',
              trackingError,
            );
          }
        }
      } catch (error) {
        console.error(
          '[Gymate] Failed to load running session:',
          error,
        );

        if (mounted) {
          setRun(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadRun();

    return () => {
      mounted = false;
    };
  }, [
    profileId,
    runId,
  ]);


  /*
   * ======================================
   * LIVE REFRESH
   * ======================================
   *
   * Always refresh the EXACT run by ID.
   * ======================================
   */

  useEffect(() => {
    if (!profileId || !runId) {
      return;
    }

    let mounted = true;

    async function refresh() {
      try {
        const current =
          await getRunningSessionById(
            profileId,
            runId,
          );

        if (!mounted || !current) {
          return;
        }

        setRun(current);

        setElapsed(
          calculateElapsedActiveSeconds(
            current,
          ),
        );
      } catch (error) {
        console.error(
          '[Gymate] Failed to refresh running session:',
          error,
        );
      }
    }

    refresh();

    const interval =
      setInterval(
        refresh,
        1000,
      );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [
    profileId,
    runId,
  ]);


  /*
   * ======================================
   * PAUSE
   * ======================================
   */

  async function handlePause() {
    if (
      !profileId ||
      !runId ||
      !run ||
      busy
    ) {
      return;
    }

    try {
      setBusy(true);

      const updated =
        await pauseRunningSession(
          profileId,
          runId,
        );

      if (updated) {
        setRun(updated);

        setElapsed(
          calculateElapsedActiveSeconds(
            updated,
          ),
        );
      }
    } catch (error) {
      console.error(
        '[Gymate] Failed to pause run:',
        error,
      );

      Alert.alert(
        'Pause Failed',
        'Could not pause the run.',
      );
    } finally {
      setBusy(false);
    }
  }


  /*
   * ======================================
   * RESUME
   * ======================================
   */

  async function handleResume() {
    if (
      !profileId ||
      !runId ||
      !run ||
      busy
    ) {
      return;
    }

    try {
      setBusy(true);

      const updated =
        await resumeRunningSession(
          profileId,
          runId,
        );

      if (updated) {
        setRun(updated);

        setElapsed(
          calculateElapsedActiveSeconds(
            updated,
          ),
        );

        await startRunningLocationTracking();
      }
    } catch (error) {
      console.error(
        '[Gymate] Failed to resume run:',
        error,
      );

      Alert.alert(
        'Resume Failed',
        'Could not resume GPS tracking.',
      );
    } finally {
      setBusy(false);
    }
  }


  /*
   * ======================================
   * FINISH
   * ======================================
   */

  async function handleFinish() {
    if (
      !profileId ||
      !runId ||
      busy
    ) {
      return;
    }

    Alert.alert(
      'Finish Run?',
      'Are you sure you want to finish this run?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Finish',
          style: 'destructive',

          onPress: async () => {
            try {
              setBusy(true);

              const completed =
                await finishRunAndStopTracking(
                  profileId,
                  runId,
                );

              if (!completed) {
                throw new Error(
                  'Run could not be completed.',
                );
              }

              router.replace({
                pathname:
                  '/activity/run-summary',

                params: {
                  profileId,
                  runId,
                },
              });
            } catch (error) {
              console.error(
                '[Gymate] Failed to finish run:',
                error,
              );

              Alert.alert(
                'Finish Failed',
                'Could not finish the run.',
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }


  /*
   * ======================================
   * FORMAT DURATION
   * ======================================
   */

  function formatDuration(
    seconds: number,
  ) {
    const total =
      Math.max(
        0,
        Math.floor(seconds),
      );

    const hours =
      Math.floor(
        total / 3600,
      );

    const minutes =
      Math.floor(
        (total % 3600) / 60,
      );

    const secs =
      total % 60;

    if (hours > 0) {
      return `${hours}:${String(
        minutes,
      ).padStart(2, '0')}:${String(
        secs,
      ).padStart(2, '0')}`;
    }

    return `${String(
      minutes,
    ).padStart(2, '0')}:${String(
      secs,
    ).padStart(2, '0')}`;
  }


  /*
   * ======================================
   * FORMAT DISTANCE
   * ======================================
   */

  function formatDistance(
    meters: number,
  ) {
    return (
      Math.max(0, meters) / 1000
    ).toFixed(2);
  }


  /*
   * ======================================
   * LOADING
   * ======================================
   */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <Text style={styles.loading}>
          LOADING RUN...
        </Text>
      </SafeAreaView>
    );
  }


  /*
   * ======================================
   * RUN NOT FOUND
   * ======================================
   */

  if (!run) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <Text style={styles.errorTitle}>
          RUN NOT FOUND
        </Text>

        <Text style={styles.errorSubtitle}>
          THE RUN SESSION COULD NOT BE LOADED.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            GO BACK
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }


  const pace =
    run.averagePaceSecondsPerKm;


  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.content}>

        {/* ==================================
            TOP BAR
            ================================== */}

        <View style={styles.topBar}>

          <Pressable
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>
              ‹
            </Text>
          </Pressable>

          <View
            style={styles.titleContainer}
          >
            <Text style={styles.title}>
              RUNNING
            </Text>

            <View
              style={styles.statusContainer}
            >
              <View
                style={styles.statusDot}
              />

              <Text
                style={styles.statusText}
              >
                {run.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View
            style={styles.placeholder}
          />
        </View>


        {/* ==================================
            MAIN STATS
            ================================== */}

        <View style={styles.mainStats}>

          <Text style={styles.time}>
            {formatDuration(elapsed)}
          </Text>

          <Text style={styles.timeLabel}>
            DURATION
          </Text>

          <View
            style={styles.distanceBlock}
          >
            <Text
              style={styles.distance}
            >
              {formatDistance(
                run.distanceMeters,
              )}
            </Text>

            <Text
              style={styles.distanceUnit}
            >
              KM
            </Text>
          </View>

        </View>


        {/* ==================================
            PACE STATS
            ================================== */}

        <View style={styles.statsRow}>

          <View style={styles.smallStat}>
            <Text
              style={styles.smallValue}
            >
              {formatPace(pace)}
            </Text>

            <Text
              style={styles.smallLabel}
            >
              AVG PACE
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.smallStat}>
            <Text
              style={styles.smallValue}
            >
              {formatPace(
                run.fastestPaceSecondsPerKm,
              )}
            </Text>

            <Text
              style={styles.smallLabel}
            >
              BEST PACE
            </Text>
          </View>

        </View>


        {/* ==================================
            LIVE ROUTE MAP
            ================================== */}

        <View
          style={styles.mapContainer}
        >
          <RunningMap
            route={run.route}
            followLatest={
              run.status === 'active'
            }
            showMarkers
          />
        </View>


        {/* ==================================
            CONTROLS
            ================================== */}

        <View style={styles.controls}>

          {run.status === 'active' && (
            <Pressable
              style={styles.pauseButton}
              onPress={handlePause}
              disabled={busy}
            >
              <Text
                style={styles.pauseText}
              >
                {busy ? '...' : 'PAUSE'}
              </Text>
            </Pressable>
          )}

          {run.status === 'paused' && (
            <Pressable
              style={styles.resumeButton}
              onPress={handleResume}
              disabled={busy}
            >
              <Text
                style={styles.resumeText}
              >
                {busy ? '...' : 'RESUME'}
              </Text>
            </Pressable>
          )}

          <Pressable
            style={styles.finishButton}
            onPress={handleFinish}
            disabled={busy}
          >
            <Text
              style={styles.finishText}
            >
              FINISH RUN
            </Text>
          </Pressable>

        </View>

      </View>
    </SafeAreaView>
  );
}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: '#101010',
    },

    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
    },

    loading: {
      color: '#b7ff3c',
      fontSize: 14,
      fontWeight: '900',
      textAlign: 'center',
      marginTop: 100,
    },

    errorTitle: {
      color: '#ffffff',
      fontSize: 20,
      fontWeight: '900',
      textAlign: 'center',
      marginTop: 100,
    },

    errorSubtitle: {
      color: '#707070',
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 12,
      paddingHorizontal: 30,
    },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    backIcon: {
      color: '#ffffff',
      fontSize: 38,
      lineHeight: 38,
    },

    titleContainer: {
      alignItems: 'center',
    },

    title: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: 1,
    },

    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },

    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#b7ff3c',
      marginRight: 5,
    },

    statusText: {
      color: '#707070',
      fontSize: 9,
      fontWeight: '800',
    },

    placeholder: {
      width: 25,
    },

    mainStats: {
      alignItems: 'center',
      marginTop: 35,
    },

    time: {
      color: '#b7ff3c',
      fontSize: 48,
      fontWeight: '900',
      letterSpacing: 1,
    },

    timeLabel: {
      color: '#666666',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      marginTop: 4,
    },

    distanceBlock: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: 20,
    },

    distance: {
      color: '#ffffff',
      fontSize: 46,
      fontWeight: '900',
    },

    distanceUnit: {
      color: '#777777',
      fontSize: 15,
      fontWeight: '900',
      marginLeft: 6,
    },

    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 25,
      backgroundColor: '#171717',
      borderRadius: 10,
      paddingVertical: 16,
    },

    smallStat: {
      flex: 1,
      alignItems: 'center',
    },

    smallValue: {
      color: '#ffffff',
      fontSize: 20,
      fontWeight: '900',
    },

    smallLabel: {
      color: '#666666',
      fontSize: 9,
      fontWeight: '800',
      marginTop: 5,
    },

    divider: {
      width: 1,
      height: 35,
      backgroundColor: '#303030',
    },

    controls: {
      marginTop: 18,
    },

    pauseButton: {
      height: 54,
      backgroundColor: '#b7ff3c',
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pauseText: {
      color: '#111111',
      fontSize: 14,
      fontWeight: '900',
    },

    resumeButton: {
      height: 54,
      backgroundColor: '#b7ff3c',
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },

    resumeText: {
      color: '#111111',
      fontSize: 14,
      fontWeight: '900',
    },

    finishButton: {
      height: 50,
      borderWidth: 1,
      borderColor: '#383838',
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },

    finishText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '900',
    },

    backButton: {
      alignSelf: 'center',
      backgroundColor: '#b7ff3c',
      paddingHorizontal: 30,
      paddingVertical: 14,
      borderRadius: 8,
      marginTop: 30,
    },

    backText: {
      color: '#111111',
      fontWeight: '900',
    },

    mapContainer: {
      flex: 1,
      minHeight: 320,
      marginTop: 18,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },

  });