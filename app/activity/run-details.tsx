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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateString: string | null) {
  if (!dateString) {
    return '--';
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function RunDetailsScreen() {
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
        setLoading(false);
        return;
      }

      try {
        const result = await getRunningSessionById(profileId, runId);

        if (mounted) {
          setRun(result);
        }
      } catch (error) {
        console.error('Failed to load run details:', error);
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
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!run) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>RUN NOT FOUND</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>RUN DETAILS</Text>

        <Text style={styles.date}>
          {formatDate(run.activityDate)}
        </Text>

        <View style={styles.mapWrapper}>
          <RunningMap
            route={run.route}
            fitRoute
            showMarkers
          />
        </View>

        <View style={styles.distanceRow}>
          <Text style={styles.distance}>
            {formatDistance(run.distanceMeters)}
          </Text>

          <Text style={styles.km}>KM</Text>
        </View>

        <View style={styles.statsCard}>
          <Stat
            value={formatDuration(run.durationSeconds)}
            label="DURATION"
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

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>RUN INFO</Text>

          <InfoRow
            label="STARTED"
            value={formatTime(run.startedAt)}
          />

          <InfoRow
            label="FINISHED"
            value={formatTime(run.endedAt)}
          />

          <InfoRow
            label="DISTANCE"
            value={`${formatDistance(run.distanceMeters)} KM`}
          />

          <InfoRow
            label="DURATION"
            value={formatDuration(run.durationSeconds)}
          />

          <InfoRow
            label="AVG PACE"
            value={`${formatPace(run.averagePaceSecondsPerKm)} /KM`}
          />

          <InfoRow
            label="BEST PACE"
            value={`${formatPace(run.fastestPaceSecondsPerKm)} /KM`}
          />

          <InfoRow
            label="GPS POINTS"
            value={String(run.route.length)}
          />
        </View>

        <View style={styles.xpCard}>
          <Text style={styles.xp}>+{run.runningXP} XP</Text>

          <Text style={styles.xpLabel}>RUNNING REWARD</Text>
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
          <Text style={styles.historyButtonText}>
            BACK TO HISTORY
          </Text>
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
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

  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  error: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 15,
  },

  title: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 22,
    textAlign: 'center',
  },

  date: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 25,
  },

  mapWrapper: {
    height: 300,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#292929',
  },

  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: 24,
  },

  distance: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 44,
  },

  km: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 14,
    marginBottom: 6,
    marginLeft: 8,
  },

  statsCard: {
    marginTop: 22,
    backgroundColor: '#181818',
    borderRadius: 18,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },

  stat: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 13,
  },

  statLabel: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 14,
    marginTop: 7,
  },

  divider: {
    width: 1,
    height: 45,
    backgroundColor: '#303030',
  },

  infoCard: {
    marginTop: 18,
    backgroundColor: '#181818',
    borderRadius: 18,
    padding: 20,
  },

  sectionTitle: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 14,
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },

  infoLabel: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 17,
  },

  infoValue: {
    color: colors.text,
    fontFamily: 'VT323',
    fontSize: 17,
  },

  xpCard: {
    marginTop: 18,
    backgroundColor: '#182314',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#35492b',
    alignItems: 'center',
    paddingVertical: 25,
  },

  xp: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 25,
  },

  xpLabel: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 16,
    marginTop: 7,
  },

  historyButton: {
    marginTop: 18,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  historyButtonText: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 10,
  },
});