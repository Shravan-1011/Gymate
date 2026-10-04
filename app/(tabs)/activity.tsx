  import React, {
    useCallback,
    useEffect,
    useState,
  } from 'react';

  import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    Alert,
    View,
  } from 'react-native';

  import { useRouter } from 'expo-router';

  import { useProfile } from '../../context/ProfileContext';

  import { colors } from '../../constants/theme';

  import StepsCard from '../../components/activity/StepsCard';
  import RunningCard from '../../components/activity/RunningCard';
  import TodoCard from '../../components/activity/TodoCard';

  import {
    getCurrentRunningSession,
    startRunningLocationTracking,
    startRunningSession,
  } from '../../services/runningTrackingService';

  import type { RunningSession } from '../../types/activity';

  /*
  * ========================================
  * ACTIVITY SCREEN
  * ========================================
  */

  export default function ActivityScreen() {
    const router = useRouter();

    /*
    * ========================================
    * PROFILE
    * ========================================
    *
    * Use the same real profile mechanism
    * used by Diet.
    */

    const {
      profile,
      isLoading: profileLoading,
    } = useProfile();

    const profileId =
      profile?.id ?? null;

    /*
    * ========================================
    * RUNNING STATE
    * ========================================
    */

    const [activeRun, setActiveRun] =
      useState<RunningSession | null>(null);

    const [loadingRun, setLoadingRun] =
      useState(true);

    const [startingRun, setStartingRun] =
      useState(false);

    /*
    * ========================================
    * LOAD ACTIVE RUN
    * ========================================
    */

    const loadActiveRun =
      useCallback(async () => {
        if (!profileId) {
          setActiveRun(null);
          setLoadingRun(false);
          return;
        }

        try {
          setLoadingRun(true);

          const run =
            await getCurrentRunningSession(
              profileId,
            );

          setActiveRun(run);
        } catch (error) {
          console.error(
            '[Gymate] Failed to load active run:',
            error,
          );

          setActiveRun(null);
        } finally {
          setLoadingRun(false);
        }
      }, [profileId]);

    /*
    * ========================================
    * LOAD RUN WHEN PROFILE IS READY
    * ========================================
    */

    useEffect(() => {
      loadActiveRun();
    }, [loadActiveRun]);

    /*
    * ========================================
    * START RUN
    * ========================================
    */

    async function handleStartRun() {
  if (!profileId || startingRun) {
    return;
  }

  try {
    setStartingRun(true);

    const run = await startRunningSession(profileId);

    setActiveRun(run);

    router.push({
      pathname: '/activity/run',
      params: {
        profileId,
        runId: run.id,
      },
    });

    try {
      await startRunningLocationTracking();
    } catch (trackingError) {
      console.error('[Gymate] Failed to start GPS tracking:', trackingError);
      Alert.alert(
        'GPS tracking issue',
        trackingError instanceof Error ? trackingError.message : String(trackingError),
      );
    }
  } catch (error) {
    console.error('[Gymate] Failed to start run:', error);
    Alert.alert(
      'Could not start run',
      error instanceof Error ? error.message : 'Something went wrong starting the run.',
    );
  } finally {
    setStartingRun(false);
  }
}

    /*
    * ========================================
    * OPEN ACTIVE RUN
    * ========================================
    */

    function handleOpenRun() {
      if (
        !profileId ||
        !activeRun
      ) {
        return;
      }

      router.push({
        pathname: '/activity/run',
        params: {
          profileId,
          runId: activeRun.id,
        },
      });
    }

    /*
    * ========================================
    * RUN HISTORY
    * ========================================
    */

    function handleRunHistory() {
      if (!profileId) {
        return;
      }

      router.push({
        pathname: '/activity/run-history',
        params: {
          profileId,
        },
      });
    }

    /*
    * ========================================
    * PROFILE LOADING
    * ========================================
    */

    if (profileLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingProfileText}>
            LOADING PROFILE...
          </Text>
        </View>
      );
    }

    /*
    * ========================================
    * NO PROFILE
    * ========================================
    */

    if (!profileId) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            PROFILE REQUIRED
          </Text>

          <Text style={styles.emptyText}>
            Create or select a profile to
            start tracking activity.
          </Text>
        </View>
      );
    }

    /*
    * ========================================
    * ACTIVITY SCREEN
    * ========================================
    */

    return (
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.content
          }
        >
          {/* ====================================
              HEADER
              ==================================== */}

          <Text style={styles.title}>
            ACTIVITY
          </Text>

          <Text style={styles.subtitle}>
            YOUR MOVEMENT JOURNEY
          </Text>

          {/* ====================================
              STEPS
              ==================================== */}

          <StepsCard
            profileId={profileId}
          />

          {/* ====================================
              RUNNING
              ==================================== */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              RUNNING
            </Text>

            {loadingRun ? (
              <View
                style={styles.loadingCard}
              >
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                />

                <Text
                  style={styles.loadingText}
                >
                  CHECKING ACTIVE RUN...
                </Text>
              </View>
            ) : (
              <RunningCard
                active={
                  activeRun !== null
                }

                distanceMeters={
                  activeRun?.distanceMeters ??
                  0
                }

                durationSeconds={
                  activeRun?.durationSeconds ??
                  0
                }

                paceSecondsPerKm={
                  activeRun?.averagePaceSecondsPerKm ??
                  null
                }

                onStart={
                  handleStartRun
                }

                onOpenRun={
                  handleOpenRun
                }

                loading={
                  startingRun
                }
              />
            )}

            <Pressable
              style={styles.historyButton}
              onPress={
                handleRunHistory
              }
            >
              <View>
                <Text
                  style={
                    styles.historyTitle
                  }
                >
                  RUN HISTORY
                </Text>

                <Text
                  style={
                    styles.historySubtitle
                  }
                >
                  VIEW YOUR PREVIOUS RUNS
                </Text>
              </View>

              <Text
                style={
                  styles.historyArrow
                }
              >
                →
              </Text>
            </Pressable>
          </View>

          {/* ====================================
              DAILY TODO
              ==================================== */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              DAILY TODO
            </Text>

            <TodoCard
              profileId={profileId}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  /*
  * ========================================
  * STYLES
  * ========================================
  */

  const styles = StyleSheet.create({
    /*
    * ======================================
    * MAIN
    * ======================================
    */

    container: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    content: {
      paddingTop: 60,
      paddingHorizontal: 18,

      /*
      * Extra space at the bottom so the
      * final Todo content can comfortably
      * scroll above the tab bar.
      */
      paddingBottom: 100,
    },

    /*
    * ======================================
    * CENTER STATES
    * ======================================
    */

    center: {
      flex: 1,
      backgroundColor:
        colors.background,

      alignItems: 'center',
      justifyContent: 'center',

      paddingHorizontal: 24,
    },

    loadingProfileText: {
      color:
        colors.textSecondary,

      fontFamily:
        'VT323',

      fontSize: 18,

      marginTop: 10,
    },

    emptyTitle: {
      color:
        colors.text,

      fontFamily:
        'PressStart2P',

      fontSize: 14,

      textAlign: 'center',
    },

    emptyText: {
      color:
        colors.textSecondary,

      fontFamily:
        'VT323',

      fontSize: 18,

      textAlign: 'center',

      marginTop: 12,

      lineHeight: 23,
    },

    /*
    * ======================================
    * HEADER
    * ======================================
    */

    title: {
      color:
        colors.text,

      fontFamily:
        'PressStart2P',

      fontSize: 24,

      textAlign: 'center',
    },

    subtitle: {
      color:
        colors.textSecondary,

      fontFamily:
        'PressStart2P',

      fontSize: 9,

      letterSpacing: 2,

      textAlign: 'center',

      marginTop: 12,

      marginBottom: 28,
    },

    /*
    * ======================================
    * SECTIONS
    * ======================================
    */

    section: {
      marginTop: 28,
    },

    sectionTitle: {
      color:
        colors.text,

      fontFamily:
        'PressStart2P',

      fontSize: 14,

      marginBottom: 12,
    },

    /*
    * ======================================
    * RUNNING LOADING
    * ======================================
    */

    loadingCard: {
      minHeight: 110,

      backgroundColor:
        '#181818',

      borderRadius: 18,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    loadingText: {
      color:
        colors.textSecondary,

      fontFamily:
        'VT323',

      fontSize: 17,

      marginTop: 8,
    },

    /*
    * ======================================
    * RUN HISTORY
    * ======================================
    */

    historyButton: {
      marginTop: 12,

      minHeight: 76,

      paddingHorizontal: 18,

      paddingVertical: 15,

      borderRadius: 17,

      backgroundColor:
        '#181818',

      borderWidth: 1,

      borderColor:
        '#292929',

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    historyTitle: {
      color:
        colors.text,

      fontFamily:
        'PressStart2P',

      fontSize: 11,
    },

    historySubtitle: {
      color:
        colors.textSecondary,

      fontFamily:
        'VT323',

      fontSize: 16,

      marginTop: 6,
    },

    historyArrow: {
      color:
        colors.primary,

      fontFamily:
        'VT323',

      fontSize: 32,
    },
  });