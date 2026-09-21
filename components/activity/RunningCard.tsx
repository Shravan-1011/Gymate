import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type RunningCardProps = {
  active: boolean;
  distanceMeters: number;
  durationSeconds: number;
  paceSecondsPerKm: number | null;
  onStart: () => void;
  onOpenRun?: () => void;
  loading?: boolean;
};

function formatDuration(
  totalSeconds: number,
): string {
  const seconds = Math.max(
    0,
    Math.floor(totalSeconds),
  );

  const hours = Math.floor(
    seconds / 3600,
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60,
  );

  const remainingSeconds =
    seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(remainingSeconds).padStart(
      2,
      '0',
    )}`;
  }

  return `${String(minutes).padStart(
    2,
    '0',
  )}:${String(remainingSeconds).padStart(
    2,
    '0',
  )}`;
}

function formatDistance(
  meters: number,
): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(2)} km`;
}

function formatPace(
  secondsPerKm: number | null,
): string {
  if (
    secondsPerKm == null ||
    !Number.isFinite(secondsPerKm)
  ) {
    return '--:--';
  }

  const totalSeconds = Math.max(
    0,
    Math.round(secondsPerKm),
  );

  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${String(
    seconds,
  ).padStart(2, '0')}`;
}

export default function RunningCard({
  active,
  distanceMeters,
  durationSeconds,
  paceSecondsPerKm,
  onStart,
  onOpenRun,
  loading = false,
}: RunningCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            RUNNING
          </Text>

          <Text style={styles.subtitle}>
            GPS TRACKING
          </Text>
        </View>

        {active && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />

            <Text style={styles.liveText}>
              LIVE
            </Text>
          </View>
        )}
      </View>

      {active ? (
        <>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatDistance(
                  distanceMeters,
                )}
              </Text>

              <Text style={styles.statLabel}>
                DISTANCE
              </Text>
            </View>

            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatDuration(
                  durationSeconds,
                )}
              </Text>

              <Text style={styles.statLabel}>
                TIME
              </Text>
            </View>

            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatPace(
                  paceSecondsPerKm,
                )}
              </Text>

              <Text style={styles.statLabel}>
                /KM
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.continueButton}
            onPress={onOpenRun}
          >
            <Text style={styles.continueText}>
              OPEN RUN
            </Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={styles.startButton}
          onPress={onStart}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.startText}>
              START RUN
            </Text>
          )}
        </Pressable>
      )}
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

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#b7ff3c',
    marginRight: 5,
  },

  liveText: {
    color: '#b7ff3c',
    fontSize: 10,
    fontWeight: '900',
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
  },

  stat: {
    flex: 1,
  },

  statValue: {
    color: '#b7ff3c',
    fontSize: 22,
    fontWeight: '900',
  },

  statLabel: {
    color: '#707070',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 5,
  },

  startButton: {
    height: 52,
    backgroundColor: '#b7ff3c',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  startText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  continueButton: {
    height: 48,
    backgroundColor: '#252525',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  continueText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});