import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMemo, useState } from 'react';

import {
  colors,
  spacing,
} from '../../../constants/theme';

import { workoutSplits } from '../../../data/workoutSplits';

import { useWorkout } from '../../../context/WorkoutContext';

import type { WorkoutSession } from '../../../types/workout';

/*
 * ========================================
 * FILTER TYPES
 * ========================================
 */

type SplitFilter = 'all' | string;

type SortOption =
  | 'newest'
  | 'oldest'
  | 'volume'
  | 'sets';

/*
 * ========================================
 * SCREEN
 * ========================================
 */

export default function WorkoutHistoryScreen() {
  const { workoutHistory } = useWorkout();

  const [
    splitFilter,
    setSplitFilter,
  ] = useState<SplitFilter>('all');

  const [
    sortOption,
    setSortOption,
  ] = useState<SortOption>('newest');

  /*
   * ========================================
   * FILTER + SORT
   * ========================================
   */

  const displayedWorkouts = useMemo(() => {
    let workouts = [...workoutHistory];

    /*
     * FILTER BY SPLIT
     */

    if (splitFilter !== 'all') {
      workouts = workouts.filter(
        (workout) =>
          workout.splitId === splitFilter
      );
    }

    /*
     * SORT
     */

    workouts.sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return (
            getWorkoutTimestamp(a) -
            getWorkoutTimestamp(b)
          );

        case 'volume':
          return (
            getWorkoutVolume(b) -
            getWorkoutVolume(a)
          );

        case 'sets':
          return (
            getTotalSets(b) -
            getTotalSets(a)
          );

        case 'newest':
        default:
          return (
            getWorkoutTimestamp(b) -
            getWorkoutTimestamp(a)
          );
      }
    });

    return workouts;
  }, [
    workoutHistory,
    splitFilter,
    sortOption,
  ]);

  /*
   * ========================================
   * OPEN WORKOUT
   * ========================================
   */

  const handleOpenWorkout = (
    workoutId: string
  ) => {
    router.push({
      pathname:
        '/workout/history/[workoutId]',
      params: {
        workoutId,
      },
    });
  };

  /*
   * ========================================
   * SCREEN
   * ========================================
   */

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <Pressable
          style={styles.backRow}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>
            ‹
          </Text>

          <Text style={styles.backText}>
            BACK
          </Text>
        </Pressable>

        <Text style={styles.heading}>
          WORKOUT HISTORY
        </Text>

        <Text style={styles.subheading}>
          REVIEW YOUR PREVIOUS SESSIONS
        </Text>

        {/* FILTER */}

        <View style={styles.controlSection}>
          <Text style={styles.controlLabel}>
            FILTER BY SPLIT
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.filterList
            }
          >
            {/* ALL */}

            <Pressable
              style={[
                styles.filterButton,
                splitFilter === 'all' &&
                  styles.filterButtonSelected,
              ]}
              onPress={() =>
                setSplitFilter('all')
              }
            >
              <Text
                style={[
                  styles.filterText,
                  splitFilter === 'all' &&
                    styles.filterTextSelected,
                ]}
              >
                ALL
              </Text>
            </Pressable>

            {/* SPLITS */}

            {workoutSplits.map((split) => {
              const selected =
                splitFilter === split.id;

              return (
                <Pressable
                  key={split.id}
                  style={[
                    styles.filterButton,
                    selected &&
                      styles.filterButtonSelected,
                  ]}
                  onPress={() =>
                    setSplitFilter(split.id)
                  }
                >
                  <Text
                    style={[
                      styles.filterText,
                      selected &&
                        styles.filterTextSelected,
                    ]}
                  >
                    {split.name.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* SORT */}

        <View style={styles.controlSection}>
          <Text style={styles.controlLabel}>
            SORT BY
          </Text>

          <View style={styles.sortList}>
            <SortButton
              label="NEWEST"
              selected={
                sortOption === 'newest'
              }
              onPress={() =>
                setSortOption('newest')
              }
            />

            <SortButton
              label="OLDEST"
              selected={
                sortOption === 'oldest'
              }
              onPress={() =>
                setSortOption('oldest')
              }
            />

            <SortButton
              label="VOLUME"
              selected={
                sortOption === 'volume'
              }
              onPress={() =>
                setSortOption('volume')
              }
            />

            <SortButton
              label="SETS"
              selected={
                sortOption === 'sets'
              }
              onPress={() =>
                setSortOption('sets')
              }
            />
          </View>
        </View>

        {/* RESULTS HEADER */}

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            PREVIOUS WORKOUTS
          </Text>

          <Text style={styles.resultsCount}>
            {displayedWorkouts.length}
          </Text>
        </View>

        {/* EMPTY STATE */}

        {displayedWorkouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              NO WORKOUTS FOUND
            </Text>

            <Text style={styles.emptyText}>
              {workoutHistory.length === 0
                ? 'COMPLETE YOUR FIRST WORKOUT TO START BUILDING YOUR HISTORY.'
                : 'NO WORKOUTS MATCH THE CURRENT FILTER.'}
            </Text>

            {workoutHistory.length === 0 && (
              <Pressable
                style={styles.emptyButton}
                onPress={() =>
                  router.back()
                }
              >
                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  START WORKOUT
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          /* WORKOUT LIST */

          <View style={styles.workoutList}>
            {displayedWorkouts.map(
              (workout) => (
                <WorkoutHistoryCard
                  key={workout.id}
                  workout={workout}
                  onPress={() =>
                    handleOpenWorkout(
                      workout.id
                    )
                  }
                />
              )
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * ========================================
 * WORKOUT CARD
 * ========================================
 */

function WorkoutHistoryCard({
  workout,
  onPress,
}: {
  workout: WorkoutSession;
  onPress: () => void;
}) {
  const volume = getWorkoutVolume(workout);

  const totalSets = getTotalSets(workout);

  const duration = getWorkoutDuration(
    workout
  );

  const date = formatWorkoutDate(workout);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.workoutCard,
        pressed &&
          styles.workoutCardPressed,
      ]}
      onPress={onPress}
    >
      {/* TOP */}

      <View style={styles.workoutCardTop}>
        <View style={styles.workoutCardInfo}>
          <Text style={styles.workoutName}>
            {workout.name}
          </Text>

          <Text style={styles.workoutDate}>
            {date}
          </Text>
        </View>

        <Text style={styles.cardArrow}>
          ›
        </Text>
      </View>

      {/* DIVIDER */}

      <View style={styles.divider} />

      {/* STATS */}

      <View style={styles.workoutStats}>
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
          value={`${volume} KG`}
          label="VOLUME"
        />

        <HistoryStat
          value={formatTime(duration)}
          label="TIME"
        />
      </View>
    </Pressable>
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
    <View style={styles.historyStat}>
      <Text
        style={styles.historyStatValue}
      >
        {value}
      </Text>

      <Text
        style={styles.historyStatLabel}
      >
        {label}
      </Text>
    </View>
  );
}

/*
 * ========================================
 * SORT BUTTON
 * ========================================
 */

function SortButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.sortButton,
        selected &&
          styles.sortButtonSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.sortText,
          selected &&
            styles.sortTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/*
 * ========================================
 * HELPERS
 * ========================================
 */

function getWorkoutTimestamp(
  workout: WorkoutSession
) {
  const timestamp =
    workout.endedAt ||
    workout.startedAt;

  return timestamp
    ? new Date(timestamp).getTime()
    : 0;
}

/*
 * ========================================
 * TOTAL SETS
 * ========================================
 */

function getTotalSets(
  workout: WorkoutSession
) {
  return workout.exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.length,
    0
  );
}

/*
 * ========================================
 * TOTAL VOLUME
 * ========================================
 */

function getWorkoutVolume(
  workout: WorkoutSession
) {
  return workout.exercises.reduce(
    (workoutTotal, exercise) =>
      workoutTotal +
      exercise.sets.reduce(
        (exerciseTotal, set) =>
          exerciseTotal +
          set.weight * set.reps,
        0
      ),
    0
  );
}

/*
 * ========================================
 * WORKOUT DURATION
 * ========================================
 */

function getWorkoutDuration(
  workout: WorkoutSession
) {
  if (
    !workout.startedAt ||
    !workout.endedAt
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (new Date(
        workout.endedAt
      ).getTime() -
        new Date(
          workout.startedAt
        ).getTime()) /
        1000
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
) {
  const timestamp =
    getWorkoutTimestamp(workout);

  if (!timestamp) {
    return 'UNKNOWN DATE';
  }

  return new Date(
    timestamp
  ).toLocaleDateString(
    undefined,
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

/*
 * ========================================
 * TIME
 * ========================================
 */

function formatTime(
  totalSeconds: number
) {
  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
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
      String(value).padStart(2, '0')
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 150,
  },

  /* HEADER */

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  backArrow: {
    fontFamily: 'VT323',
    fontSize: 36,
    color: colors.primary,
    marginRight: spacing.sm,
  },

  backText: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.textSecondary,
  },

  heading: {
    fontFamily: 'PressStart2P',
    fontSize: 18,
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  subheading: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  /* CONTROLS */

  controlSection: {
    marginBottom: spacing.lg,
  },

  controlLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  filterList: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },

  filterButton: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  filterButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  filterText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: colors.textSecondary,
  },

  filterTextSelected: {
    color: colors.background,
  },

  sortList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  sortButton: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  sortButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  sortText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: colors.textSecondary,
  },

  sortTextSelected: {
    color: colors.background,
  },

  /* RESULTS */

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  resultsTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.text,
  },

  resultsCount: {
    fontFamily: 'VT323',
    fontSize: 22,
    color: colors.primary,
  },

  /* WORKOUT LIST */

  workoutList: {
    gap: spacing.sm,
  },

  workoutCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
  },

  workoutCardPressed: {
    opacity: 0.65,
    transform: [
      {
        translateX: 2,
      },
    ],
  },

  workoutCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  workoutCardInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },

  workoutName: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  workoutDate: {
    fontFamily: 'VT323',
    fontSize: 19,
    color: colors.primary,
  },

  cardArrow: {
    fontFamily: 'VT323',
    fontSize: 36,
    color: colors.primary,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  historyStat: {
    flex: 1,
  },

  historyStatValue: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.primary,
    marginBottom: 2,
  },

  historyStatLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 6,
    color: colors.textSecondary,
  },

  /* EMPTY */

  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  emptyTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.text,
    marginBottom: spacing.md,
  },

  emptyText: {
    fontFamily: 'VT323',
    fontSize: 20,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  emptyButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  emptyButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.background,
  },
});