import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import RunningMap from '../../components/activity/RunningMap';
import {
  getRunningSessionById,
} from '../../database/activityRepository';
import {
  evaluateRun,
} from '../../services/activityService';
import type { RunningSession } from '../../types/activity';
import { colors } from '../../constants/theme';

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(
    2,
    '0',
  )}`;
}

function formatPace(secondsPerKm: number | null | undefined) {
  if (
    secondsPerKm == null ||
    !Number.isFinite(secondsPerKm) ||
    secondsPerKm <= 0
  ) {
    return '--';
  }

  const totalSeconds = Math.round(secondsPerKm);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatDistance(meters: number) {
  return (Math.max(0, meters) / 1000).toFixed(2);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function RunSummaryScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    profileId: string;
    runId: string;
  }>();

  const profileId = params.profileId;
  const runId = params.runId;

  const [run, setRun] = useState<RunningSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!profileId || !runId) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const session = await getRunningSessionById(profileId, runId);

        if (!session) {
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        let evaluatedSession = session;

        if (!session.evaluated) {
          const result = await evaluateRun(profileId, runId);

          if (result?.run) {
            evaluatedSession = result.run;
          } else {
            const refreshed = await getRunningSessionById(profileId, runId);

            if (refreshed) {
              evaluatedSession = refreshed;
            }
          }
        }

        if (mounted) {
          setRun(evaluatedSession);
        }
      } catch (error) {
        console.error('Failed to load run summary:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [profileId, runId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>LOADING RUN...</Text>
      </View>
    );
  }

  if (!run) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>RUN NOT FOUND</Text>

        <Pressable
          style={styles.doneButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.doneButtonText}>DONE</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>RUN COMPLETE</Text>

        <Text style={styles.subtitle}>NICE WORK</Text>

        <View style={styles.mapWrapper}>
          <RunningMap
            route={run.route}
            fitRoute
            showMarkers
          />
        </View>

        <View style={styles.distanceSection}>
          <Text style={styles.distance}>{formatDistance(run.distanceMeters)}</Text>

          <Text style={styles.km}>KM</Text>
        </View>

        <Text style={styles.date}>{formatDate(run.activityDate)}</Text>

        <View style={styles.statsCard}>
          <Stat
            value={formatDuration(run.durationSeconds)}
            label="TIME"
          />

          <View style={styles.divider} />

          <Stat
            value={formatPace(run.averagePaceSecondsPerKm)}
            label="AVG PACE"
          />

          <View style={styles.divider} />

          <Stat
            value={formatPace(run.fastestPaceSecondsPerKm)}
            label="BEST PACE"
          />
        </View>

        <View style={styles.xpCard}>
          <Text style={styles.xpValue}>+{run.runningXP} XP</Text>

          <Text style={styles.xpLabel}>RUNNING REWARD</Text>
        </View>

        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>ROUTE</Text>

          <Text style={styles.routeText}>
            {run.route.length} GPS POINTS RECORDED
          </Text>
        </View>

        <Pressable
          style={styles.historyButton}
          onPress={() =>
            router.push({
              pathname: '/activity/run-history',
              params: { profileId },
            })
          }
        >
          <Text style={styles.historyButtonText}>VIEW RUN HISTORY</Text>
        </Pressable>

        <Pressable
          style={styles.doneButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.doneButtonText}>DONE</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 20,
  },

  errorTitle: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 18,
    marginBottom: 30,
  },

  title: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 25,
    textAlign: 'center',
  },

  subtitle: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 11,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 28,
  },

  mapWrapper: {
    height: 300,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#292929',
    backgroundColor: '#151515',
  },

  distanceSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 24,
  },

  distance: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 48,
  },

  km: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 15,
    marginBottom: 7,
    marginLeft: 10,
  },

  date: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },

  statsCard: {
    marginTop: 24,
    backgroundColor: '#181818',
    borderRadius: 18,
    paddingVertical: 25,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  stat: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 15,
  },

  statLabel: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 14,
    marginTop: 8,
  },

  divider: {
    width: 1,
    height: 45,
    backgroundColor: '#303030',
  },

  xpCard: {
    marginTop: 18,
    borderRadius: 18,
    paddingVertical: 28,
    alignItems: 'center',
    backgroundColor: '#182314',
    borderWidth: 1,
    borderColor: '#35492b',
  },

  xpValue: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 28,
  },

  xpLabel: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 16,
    marginTop: 8,
  },

  routeInfo: {
    marginTop: 18,
    padding: 22,
    backgroundColor: '#181818',
    borderRadius: 18,
  },

  routeTitle: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 15,
  },

  routeText: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 18,
    marginTop: 8,
  },

  historyButton: {
    marginTop: 18,
    height: 58,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  historyButtonText: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 11,
  },

  doneButton: {
    marginTop: 14,
    height: 64,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  doneButtonText: {
    color: '#101010',
    fontFamily: 'PressStart2P',
    fontSize: 14,
  },
});