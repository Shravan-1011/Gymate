import React, { useMemo, useState } from 'react';

import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  LineChart,
  BarChart,
} from 'react-native-chart-kit';

import { colors, spacing } from '../../constants/theme';

import { useWorkout } from '../../context/WorkoutContext';

import {
  getTrainingProgress,
  getVolumeTrend,
  getPerformanceTrend,
  getExerciseProgress,
  type ExerciseProgressSummary,
  type WorkoutProgressPoint,
} from '../../utils/workoutAnalytics';

const SCREEN_WIDTH =
  Dimensions.get('window').width;

/*
 * ========================================
 * PROGRESS SCREEN
 * ========================================
 */

export default function ProgressScreen() {
  const { workoutHistory } = useWorkout();

  const progress = useMemo(
    () =>
      getTrainingProgress(
        workoutHistory
      ),
    [workoutHistory]
  );

  const hasWorkouts =
    progress.totalWorkouts > 0;

  const [
    selectedExerciseId,
    setSelectedExerciseId,
  ] = useState(
    progress.exercises[0]?.exerciseId ??
      null
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ====================================
          HEADER
          ==================================== */}

      <Text style={styles.eyebrow}>
        TRAINING DATA
      </Text>

      <Text style={styles.title}>
        PROGRESS
      </Text>

      <Text style={styles.subtitle}>
        TRACK YOUR TRAINING. BUILD YOUR LEGACY.
      </Text>

      {!hasWorkouts ? (
        <EmptyState />
      ) : (
        <>
          {/* ====================================
              OVERVIEW
              ==================================== */}

          <SectionTitle title="OVERVIEW" />

          <View style={styles.statsGrid}>
            <StatCard
              value={String(
                progress.totalWorkouts
              )}
              label="WORKOUTS"
            />

            <StatCard
              value={formatVolume(
                progress.totalVolume
              )}
              label="TOTAL VOLUME"
            />

            <StatCard
              value={formatVolume(
                progress.averageVolume
              )}
              label="AVG VOLUME"
            />

            <StatCard
              value={String(
                progress.currentStreak
              )}
              label="CURRENT STREAK"
              suffix=" DAYS"
            />

            <StatCard
              value={String(
                progress.bestStreak
              )}
              label="BEST STREAK"
              suffix=" DAYS"
            />
          </View>

          {/* ====================================
              CHART 1
              LINE GRAPH
              ==================================== */}

          <SectionTitle title="VOLUME TREND" />

          <VolumeChart
            workoutHistory={workoutHistory}
          />

          {/* ====================================
              CHART 2
              BAR GRAPH
              ==================================== */}

          <SectionTitle title="PERFORMANCE TREND" />

          <PerformanceChart
            workoutHistory={workoutHistory}
          />

          {/* ====================================
              CHART 3
              EXERCISE GRAPH
              ==================================== */}

          <SectionTitle title="EXERCISE PROGRESS" />

          <ExerciseChart
            workoutHistory={workoutHistory}
            exercises={progress.exercises}
            selectedExerciseId={
              selectedExerciseId
            }
            onSelectExercise={
              setSelectedExerciseId
            }
          />

          {/* ====================================
              WORKOUT HISTORY
              ==================================== */}

          <SectionTitle title="WORKOUT HISTORY" />

          <WorkoutProgressSection
            progress={progress.progress}
          />

          {/* ====================================
              EXERCISE SUMMARIES
              ==================================== */}

          <SectionTitle title="EXERCISE SUMMARY" />

          {progress.exercises.map(
            (exercise) => (
              <ExerciseProgressCard
                key={
                  exercise.exerciseId
                }
                exercise={exercise}
              />
            )
          )}
        </>
      )}
    </ScrollView>
  );
}

/*
 * ========================================
 * EMPTY STATE
 * ========================================
 */

function EmptyState() {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>
        NO TRAINING DATA
      </Text>

      <Text style={styles.emptyText}>
        COMPLETE YOUR FIRST WORKOUT
        TO START BUILDING YOUR
        PROGRESS HISTORY.
      </Text>
    </View>
  );
}

/*
 * ========================================
 * SECTION TITLE
 * ========================================
 */

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {title}
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
  suffix = '',
}: {
  value: string;
  label: string;
  suffix?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text
        style={styles.statValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
        {suffix}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

/*
 * ========================================
 * CHART CARD
 * ========================================
 */

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>
        {title}
      </Text>

      {children}
    </View>
  );
}

/*
 * ========================================
 * CHART CONFIG
 * ========================================
 */

const chartConfig = {
  backgroundGradientFrom:
    colors.surface,

  backgroundGradientTo:
    colors.surface,

  decimalPlaces: 0,

  color: () =>
    colors.primary,

  labelColor: () =>
    colors.textSecondary,

  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.primary,
  },

  propsForBackgroundLines: {
    strokeDasharray: '',
    strokeWidth: 1,
    stroke: colors.border,
  },

  propsForLabels: {
    fontFamily: 'VT323',
  },

  barPercentage: 0.65,
};

/*
 * ========================================
 * PERFORMANCE CHART CONFIG
 * ========================================
 */

const performanceChartConfig = {
  ...chartConfig,

  decimalPlaces: 1,

  barPercentage: 0.55,
};

/*
 * ========================================
 * CHART WIDTH
 * ========================================
 */

function getChartWidth(
  pointCount: number
): number {
  return Math.max(
    SCREEN_WIDTH -
      spacing.lg * 2 -
      32,
    pointCount * 65
  );
}

/*
 * ========================================
 * DATE LABEL
 * ========================================
 */

function shortDate(
  date: string
): string {
  if (!date) {
    return '';
  }

  const parsed = new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return '';
  }

  return parsed
    .toLocaleDateString(
      undefined,
      {
        day: '2-digit',
        month: 'short',
      }
    )
    .toUpperCase();
}

/*
 * ========================================
 * VOLUME CHART
 * ========================================
 *
 * STYLE:
 * LINE GRAPH
 *
 * Shows total training volume over time.
 */

function VolumeChart({
  workoutHistory,
}: {
  workoutHistory: any[];
}) {
  const data = useMemo(
    () =>
      getVolumeTrend(
        workoutHistory
      ),
    [workoutHistory]
  );

  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState(
    data.length > 0
      ? data.length - 1
      : 0
  );

  if (data.length === 0) {
    return (
      <ChartCard title="VOLUME">
        <Text style={styles.noChartData}>
          NO VOLUME DATA AVAILABLE.
        </Text>
      </ChartCard>
    );
  }

  const safeIndex = Math.min(
    selectedIndex,
    data.length - 1
  );

  const selected = data[safeIndex];

  const labels = data.map(
    (item, index) => {
      if (
        data.length <= 6 ||
        index === 0 ||
        index ===
          data.length - 1
      ) {
        return shortDate(
          item.date
        );
      }

      return '';
    }
  );

  /*
   * react-native-chart-kit
   * LineChart behaves better with
   * at least two points.
   */

  const chartData =
    data.length === 1
      ? [
          data[0],
          {
            ...data[0],
            date: data[0].date,
            value: data[0].value,
          },
        ]
      : data;

  const chartLabels =
    data.length === 1
      ? [
          shortDate(data[0].date),
          '',
        ]
      : labels;

  return (
    <ChartCard title="TOTAL TRAINING VOLUME">
      {/* ====================================
          SELECTED VALUE
          ==================================== */}

      <View
        style={
          styles.selectedChartValue
        }
      >
        <View>
          <Text
            style={
              styles.selectedChartNumber
            }
          >
            {formatVolume(
              selected.value
            )}
          </Text>

          <Text
            style={styles.metricCaption}
          >
            TOTAL VOLUME
          </Text>
        </View>

        <View
          style={
            styles.selectedDateBox
          }
        >
          <Text
            style={
              styles.selectedChartDate
            }
          >
            {shortDate(
              selected.date
            )}
          </Text>

          <Text
            style={
              styles.selectedPointLabel
            }
          >
            SESSION
          </Text>
        </View>
      </View>

      {/* ====================================
          GRAPH
          ==================================== */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.chartScrollContent
        }
      >
        <LineChart
          data={{
            labels:
              chartLabels,

            datasets: [
              {
                data:
                  chartData.map(
                    (item) =>
                      item.value
                  ),
              },
            ],
          }}
          width={getChartWidth(
            chartData.length
          )}
          height={240}
          chartConfig={
            chartConfig
          }
          bezier
          fromZero
          withInnerLines
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLabels
          withVerticalLabels
          withShadow={false}
          onDataPointClick={({
            index,
          }) => {
            if (
              index >= data.length
            ) {
              return;
            }

            setSelectedIndex(
              index
            );
          }}
          style={styles.chart}
        />
      </ScrollView>

      <ChartLegend
        left="LOWER"
        center="TRAINING VOLUME"
        right="HIGHER"
      />

      <Text style={styles.chartHint}>
        TAP A POINT TO INSPECT
      </Text>
    </ChartCard>
  );
}

/*
 * ========================================
 * PERFORMANCE CHART
 * ========================================
 *
 * STYLE:
 * BAR GRAPH
 *
 * Positive = above historical average
 * Negative = below historical average
 */

function PerformanceChart({
  workoutHistory,
}: {
  workoutHistory: any[];
}) {
  const data = useMemo(
    () =>
      getPerformanceTrend(
        workoutHistory
      ),
    [workoutHistory]
  );

  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState(
    data.length > 0
      ? data.length - 1
      : 0
  );

  if (data.length === 0) {
    return (
      <ChartCard title="PERFORMANCE">
        <Text style={styles.noChartData}>
          NO PERFORMANCE DATA AVAILABLE.
        </Text>
      </ChartCard>
    );
  }

  const safeIndex = Math.min(
    selectedIndex,
    data.length - 1
  );

  const selected = data[safeIndex];

  const labels = data.map(
    (item, index) => {
      if (
        data.length <= 6 ||
        index === 0 ||
        index ===
          data.length - 1
      ) {
        return shortDate(
          item.date
        );
      }

      return '';
    }
  );

  const chartData =
    data.length === 1
      ? [
          data[0],
          {
            ...data[0],
            value: 0,
          },
        ]
      : data;

  const chartLabels =
    data.length === 1
      ? [
          shortDate(data[0].date),
          '',
        ]
      : labels;

  const performance =
    selected.value;

  return (
    <ChartCard title="PERFORMANCE VS HISTORY">
      {/* ====================================
          SELECTED VALUE
          ==================================== */}

      <View
        style={
          styles.selectedChartValue
        }
      >
        <View>
          <Text
            style={[
              styles.selectedChartNumber,
              performance > 0 &&
                styles.positiveText,
              performance < 0 &&
                styles.negativeText,
            ]}
          >
            {formatPercentage(
              performance
            )}
          </Text>

          <Text
            style={styles.metricCaption}
          >
            VS HISTORICAL AVG
          </Text>
        </View>

        <View
          style={
            styles.selectedDateBox
          }
        >
          <Text
            style={
              styles.selectedChartDate
            }
          >
            {shortDate(
              selected.date
            )}
          </Text>

          <Text
            style={
              styles.selectedPointLabel
            }
          >
            SESSION
          </Text>
        </View>
      </View>

      {/* ====================================
          PERFORMANCE STATUS
          ==================================== */}

      <View
        style={[
          styles.performanceBanner,
          performance > 0 &&
            styles.performanceBannerPositive,
          performance < 0 &&
            styles.performanceBannerNegative,
        ]}
      >
        <Text
          style={
            styles.performanceBannerText
          }
        >
          {performance > 0
            ? '▲ ABOVE YOUR HISTORICAL AVERAGE'
            : performance < 0
              ? '▼ BELOW YOUR HISTORICAL AVERAGE'
              : '■ AROUND YOUR HISTORICAL AVERAGE'}
        </Text>
      </View>

      {/* ====================================
          BAR GRAPH
          ==================================== */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.chartScrollContent
        }
      >
        <BarChart
  data={{
    labels,
    datasets: [
      {
        data: data.map(
          (item) => item.value
        ),
      },
    ],
  }}
  width={getChartWidth(data.length)}
  height={240}
  yAxisLabel=""
  yAxisSuffix=" KG"
  chartConfig={chartConfig}
  fromZero
  showValuesOnTopOfBars
  withInnerLines
  withVerticalLabels
  withHorizontalLabels
  style={styles.chart}
/>
      </ScrollView>

      <ChartLegend
        left="BELOW AVG"
        center="PERFORMANCE"
        right="ABOVE AVG"
      />

      <Text style={styles.chartHint}>
        TAP A BAR TO INSPECT
      </Text>
    </ChartCard>
  );
}

/*
 * ========================================
 * EXERCISE CHART
 * ========================================
 *
 * STYLE:
 * EXERCISE-SPECIFIC LINE GRAPH
 *
 * Allows the user to switch between
 * exercises.
 */

function ExerciseChart({
  workoutHistory,
  exercises,
  selectedExerciseId,
  onSelectExercise,
}: {
  workoutHistory: any[];
  exercises: ExerciseProgressSummary[];
  selectedExerciseId: string | null;
  onSelectExercise: (
    id: string
  ) => void;
}) {
  const selectedExercise =
    exercises.find(
      (exercise) =>
        exercise.exerciseId ===
        selectedExerciseId
    ) ??
    exercises[0];

  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState(0);

  const data = useMemo(() => {
    if (!selectedExercise) {
      return [];
    }

    return getExerciseProgress(
      selectedExercise.exerciseId,
      workoutHistory
    );
  }, [
    selectedExercise,
    workoutHistory,
  ]);

  /*
   * Reset selected point when
   * exercise changes.
   */

  React.useEffect(() => {
    setSelectedIndex(
      data.length > 0
        ? data.length - 1
        : 0
    );
  }, [
    selectedExerciseId,
    data.length,
  ]);

  if (!selectedExercise) {
    return (
      <ChartCard title="EXERCISE VOLUME">
        <Text style={styles.noChartData}>
          NO EXERCISE DATA AVAILABLE.
        </Text>
      </ChartCard>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.chartCard}>
        <ExerciseSelector
          exercises={exercises}
          selectedExerciseId={
            selectedExercise.exerciseId
          }
          onSelectExercise={
            onSelectExercise
          }
          onResetPoint={() =>
            setSelectedIndex(0)
          }
        />

        <Text style={styles.chartTitle}>
          {selectedExercise.exerciseName.toUpperCase()}
        </Text>

        <Text style={styles.noChartData}>
          NO HISTORY AVAILABLE.
        </Text>
      </View>
    );
  }

  const safeIndex = Math.min(
    selectedIndex,
    data.length - 1
  );

  const selected =
    data[safeIndex];

  const labels = data.map(
    (item, index) => {
      if (
        data.length <= 6 ||
        index === 0 ||
        index ===
          data.length - 1
      ) {
        return shortDate(
          item.date
        );
      }

      return '';
    }
  );

  const chartData =
    data.length === 1
      ? [
          data[0],
          {
            ...data[0],
            volume: data[0].volume,
          },
        ]
      : data;

  const chartLabels =
    data.length === 1
      ? [
          shortDate(data[0].date),
          '',
        ]
      : labels;

  return (
    <View style={styles.chartCard}>
      {/* ====================================
          EXERCISE SELECTOR
          ==================================== */}

      <ExerciseSelector
        exercises={exercises}
        selectedExerciseId={
          selectedExercise.exerciseId
        }
        onSelectExercise={
          onSelectExercise
        }
        onResetPoint={() =>
          setSelectedIndex(0)
        }
      />

      <Text style={styles.chartTitle}>
        {selectedExercise.exerciseName.toUpperCase()}
      </Text>

      {/* ====================================
          SELECTED VALUE
          ==================================== */}

      <View
        style={
          styles.selectedChartValue
        }
      >
        <View>
          <Text
            style={
              styles.selectedChartNumber
            }
          >
            {formatVolume(
              selected.volume
            )}
          </Text>

          <Text
            style={styles.metricCaption}
          >
            SESSION VOLUME
          </Text>
        </View>

        <View
          style={
            styles.selectedDateBox
          }
        >
          <Text
            style={
              styles.selectedChartDate
            }
          >
            {shortDate(
              selected.date
            )}
          </Text>

          <Text
            style={
              styles.selectedPointLabel
            }
          >
            SESSION
          </Text>
        </View>
      </View>

      {/* ====================================
          EXERCISE STATS
          ==================================== */}

      <View
        style={
          styles.miniStatsRow
        }
      >
        <MiniStat
          label="CURRENT"
          value={formatVolume(
            selected.volume
          )}
        />

        <MiniStat
          label="AVG"
          value={formatVolume(
            selected.averageVolume
          )}
        />

        <MiniStat
          label="SETS"
          value={String(
            selected.sets
          )}
        />

        <MiniStat
          label="REPS"
          value={String(
            selected.reps
          )}
        />
      </View>

      {/* ====================================
          GRAPH
          ==================================== */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.chartScrollContent
        }
      >
        <LineChart
          data={{
            labels:
              chartLabels,

            datasets: [
              {
                data:
                  chartData.map(
                    (item) =>
                      item.volume
                  ),
              },
            ],
          }}
          width={getChartWidth(
            chartData.length
          )}
          height={240}
          chartConfig={
            chartConfig
          }
          bezier
          fromZero
          withInnerLines
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLabels
          withVerticalLabels
          withShadow={false}
          onDataPointClick={({
            index,
          }) => {
            if (
              index >= data.length
            ) {
              return;
            }

            setSelectedIndex(
              index
            );
          }}
          style={styles.chart}
        />
      </ScrollView>

      <ChartLegend
        left="EARLIER"
        center="EXERCISE VOLUME"
        right="LATEST"
      />

      <Text style={styles.chartHint}>
        TAP A POINT TO INSPECT
      </Text>
    </View>
  );
}

/*
 * ========================================
 * EXERCISE SELECTOR
 * ========================================
 */

function ExerciseSelector({
  exercises,
  selectedExerciseId,
  onSelectExercise,
  onResetPoint,
}: {
  exercises: ExerciseProgressSummary[];
  selectedExerciseId: string;
  onSelectExercise: (
    id: string
  ) => void;
  onResetPoint: () => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={
        false
      }
      contentContainerStyle={
        styles.exerciseSelector
      }
    >
      {exercises.map(
        (exercise) => {
          const active =
            exercise.exerciseId ===
            selectedExerciseId;

          return (
            <TouchableOpacity
              key={
                exercise.exerciseId
              }
              style={[
                styles.exerciseChip,
                active &&
                  styles.exerciseChipActive,
              ]}
              onPress={() => {
                onSelectExercise(
                  exercise.exerciseId
                );

                onResetPoint();
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.exerciseChipText,
                  active &&
                    styles.exerciseChipTextActive,
                ]}
                numberOfLines={1}
              >
                {exercise.exerciseName}
              </Text>
            </TouchableOpacity>
          );
        }
      )}
    </ScrollView>
  );
}

/*
 * ========================================
 * MINI STAT
 * ========================================
 */

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.miniStat}>
      <Text
        style={
          styles.miniStatValue
        }
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <Text
        style={
          styles.miniStatLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

/*
 * ========================================
 * CHART LEGEND
 * ========================================
 */

function ChartLegend({
  left,
  center,
  right,
}: {
  left: string;
  center: string;
  right: string;
}) {
  return (
    <View
      style={styles.chartLegend}
    >
      <Text
        style={
          styles.chartLegendText
        }
      >
        {left}
      </Text>

      <View
        style={
          styles.chartLegendCenter
        }
      >
        <View
          style={
            styles.chartLegendDot
          }
        />

        <Text
          style={
            styles.chartLegendText
          }
        >
          {center}
        </Text>
      </View>

      <Text
        style={
          styles.chartLegendText
        }
      >
        {right}
      </Text>
    </View>
  );
}

/*
 * ========================================
 * WORKOUT HISTORY
 * ========================================
 */

function WorkoutProgressSection({
  progress,
}: {
  progress: WorkoutProgressPoint[];
}) {
  if (progress.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          NO WORKOUT DATA AVAILABLE.
        </Text>
      </View>
    );
  }

  const recentProgress = [
    ...progress,
  ]
    .reverse()
    .slice(0, 10);

  return (
    <View style={styles.progressCard}>
      <Text style={styles.cardHeader}>
        RECENT SESSIONS
      </Text>

      {recentProgress.map(
        (item, index) => (
          <WorkoutProgressRow
            key={item.workoutId}
            item={item}
            isLast={
              index ===
              recentProgress.length -
                1
            }
          />
        )
      )}
    </View>
  );
}

/*
 * ========================================
 * WORKOUT ROW
 * ========================================
 */

function WorkoutProgressRow({
  item,
  isLast,
}: {
  item: WorkoutProgressPoint;
  isLast: boolean;
}) {
  const performance =
    item.performance;

  const improved =
    performance > 0;

  const decreased =
    performance < 0;

  return (
    <View
      style={[
        styles.progressRow,
        !isLast &&
          styles.progressRowBorder,
      ]}
    >
      <View style={styles.progressDate}>
        <Text style={styles.progressIndex}>
          {formatWorkoutNumber(item)}
        </Text>

        <Text style={styles.dateText}>
          {formatDate(item.date)}
        </Text>
      </View>

      <View style={styles.progressVolume}>
        <Text style={styles.volumeText}>
          {formatVolume(
            item.volume
          )}
        </Text>

        <Text style={styles.volumeLabel}>
          VOLUME
        </Text>
      </View>

      <View
        style={styles.performanceValue}
      >
        <Text
          style={[
            styles.performanceText,
            improved &&
              styles.improvedText,
            decreased &&
              styles.decreasedText,
          ]}
        >
          {formatPercentage(
            performance
          )}
        </Text>

        <Text
          style={styles.performanceLabel}
        >
          PERFORMANCE
        </Text>
      </View>
    </View>
  );
}

/*
 * ========================================
 * EXERCISE SUMMARY
 * ========================================
 */

function ExerciseProgressCard({
  exercise,
}: {
  exercise: ExerciseProgressSummary;
}) {
  const improvement =
    exercise.improvement;

  const improved =
    improvement > 0;

  const decreased =
    improvement < 0;

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View
          style={
            styles.exerciseTitleContainer
          }
        >
          <Text style={styles.exerciseName}>
            {exercise.exerciseName}
          </Text>

          <Text
            style={
              styles.exerciseSessions
            }
          >
            {exercise.workoutCount}{' '}
            SESSION
            {exercise.workoutCount ===
            1
              ? ''
              : 'S'}
          </Text>
        </View>

        <View
          style={
            styles.improvementContainer
          }
        >
          <Text
            style={[
              styles.improvementValue,
              improved &&
                styles.improvedText,
              decreased &&
                styles.decreasedText,
            ]}
          >
            {formatPercentage(
              improvement
            )}
          </Text>

          <Text
            style={
              styles.improvementLabel
            }
          >
            IMPROVEMENT
          </Text>
        </View>
      </View>

      <View style={styles.exerciseStats}>
        <ExerciseStat
          label="CURRENT"
          value={`${exercise.currentVolume} KG`}
        />

        <ExerciseStat
          label="AVERAGE"
          value={`${roundNumber(
            exercise.averageVolume
          )} KG`}
        />

        <ExerciseStat
          label="BEST"
          value={`${exercise.bestVolume} KG`}
        />
      </View>

      <View
        style={styles.exerciseSecondary}
      >
        <SecondaryStat
          label="TOTAL SETS"
          value={String(
            exercise.totalSets
          )}
        />

        <SecondaryStat
          label="TOTAL REPS"
          value={String(
            exercise.totalReps
          )}
        />
      </View>
    </View>
  );
}

/*
 * ========================================
 * EXERCISE STAT
 * ========================================
 */

function ExerciseStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.exerciseStat}>
      <Text
        style={
          styles.exerciseStatValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.exerciseStatLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

/*
 * ========================================
 * SECONDARY STAT
 * ========================================
 */

function SecondaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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
        style={
          styles.secondaryStatValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

/*
 * ========================================
 * FORMATTING
 * ========================================
 */

function formatVolume(
  value: number
): string {
  return `${roundNumber(value)} KG`;
}

function formatPercentage(
  value: number
): string {
  if (value === 0) {
    return '0.0%';
  }

  return value > 0
    ? `+${value.toFixed(1)}%`
    : `${value.toFixed(1)}%`;
}

function roundNumber(
  value: number
): number {
  return Number(
    value.toFixed(1)
  );
}

function formatDate(
  date: string
): string {
  if (!date) {
    return '--';
  }

  const parsed = new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return '--';
  }

  return parsed
    .toLocaleDateString(
      undefined,
      {
        day: '2-digit',
        month: 'short',
      }
    )
    .toUpperCase();
}

function formatWorkoutNumber(
  item: WorkoutProgressPoint
): string {
  const numeric =
    Math.abs(
      hashString(
        item.workoutId
      )
    ) % 99;

  return String(
    numeric + 1
  ).padStart(2, '0');
}

function hashString(
  value: string
): number {
  let hash = 0;

  for (
    let i = 0;
    i < value.length;
    i++
  ) {
    hash =
      (hash * 31 +
        value.charCodeAt(i)) |
      0;
  }

  return hash;
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

  /* ====================================
     HEADER
     ==================================== */

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
    fontFamily: 'VT323',
    fontSize: 20,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.xl,
  },

  /* ====================================
     SECTION
     ==================================== */

  sectionHeader: {
    marginBottom:
      spacing.md,
    marginTop:
      spacing.sm,
  },

  sectionTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      colors.text,
  },

  /* ====================================
     OVERVIEW
     ==================================== */

  statsGrid: {
    flexDirection:
      'row',
    flexWrap:
      'wrap',
    gap: spacing.sm,
    marginBottom:
      spacing.xl,
  },

  statCard: {
    width: '48%',
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding:
      spacing.md,
    minHeight: 82,
  },

  statValue: {
    fontFamily:
      'VT323',
    fontSize: 27,
    color:
      colors.primary,
    marginBottom:
      spacing.sm,
  },

  statLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 7,
    color:
      colors.textSecondary,
  },

  /* ====================================
     EMPTY
     ==================================== */

  emptyCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding:
      spacing.lg,
    marginTop:
      spacing.sm,
  },

  emptyTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      colors.primary,
    marginBottom:
      spacing.md,
  },

  emptyText: {
    fontFamily:
      'VT323',
    fontSize: 20,
    lineHeight: 22,
    color:
      colors.textSecondary,
  },

  /* ====================================
     CHART CARD
     ==================================== */

  chartCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding:
      spacing.md,
    marginBottom:
      spacing.xl,
    overflow:
      'hidden',
  },

  chartTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.md,
  },

  /* ====================================
     SELECTED CHART VALUE
     ==================================== */

  selectedChartValue: {
    flexDirection:
      'row',
    alignItems:
      'center',
    justifyContent:
      'space-between',
    marginBottom:
      spacing.md,
  },

  selectedChartNumber: {
    fontFamily:
      'VT323',
    fontSize: 32,
    color:
      colors.primary,
  },

  metricCaption: {
    fontFamily:
      'PressStart2P',
    fontSize: 5,
    color:
      colors.textSecondary,
    marginTop: 1,
  },

  selectedDateBox: {
    alignItems:
      'flex-end',
  },

  selectedChartDate: {
    fontFamily:
      'VT323',
    fontSize: 19,
    color:
      colors.textSecondary,
  },

  selectedPointLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 5,
    color:
      colors.textSecondary,
    marginTop: 2,
  },

  /* ====================================
     CHART
     ==================================== */

  chartScrollContent: {
    paddingRight:
      spacing.lg,
  },

  chart: {
    marginLeft: -8,
    borderRadius: 0,
  },

  chartHint: {
    fontFamily:
      'PressStart2P',
    fontSize: 5,
    color:
      colors.textSecondary,
    textAlign:
      'center',
    marginTop:
      spacing.sm,
  },

  noChartData: {
    fontFamily:
      'VT323',
    fontSize: 20,
    color:
      colors.textSecondary,
    paddingVertical:
      spacing.xl,
  },

  /* ====================================
     CHART LEGEND
     ==================================== */

  chartLegend: {
    flexDirection:
      'row',
    alignItems:
      'center',
    justifyContent:
      'space-between',
    marginTop:
      spacing.sm,
    paddingHorizontal:
      spacing.sm,
  },

  chartLegendCenter: {
    flexDirection:
      'row',
    alignItems:
      'center',
    gap: 5,
  },

  chartLegendDot: {
    width: 6,
    height: 6,
    backgroundColor:
      colors.primary,
  },

  chartLegendText: {
    fontFamily:
      'PressStart2P',
    fontSize: 4,
    color:
      colors.textSecondary,
  },

  /* ====================================
     PERFORMANCE BANNER
     ==================================== */

  performanceBanner: {
    borderWidth: 1,
    borderColor:
      colors.border,
    paddingVertical:
      spacing.sm,
    paddingHorizontal:
      spacing.sm,
    marginBottom:
      spacing.sm,
    backgroundColor:
      colors.background,
  },

  performanceBannerPositive: {
    borderColor:
      colors.primary,
  },

  performanceBannerNegative: {
    borderColor:
      colors.border,
  },

  performanceBannerText: {
    fontFamily:
      'PressStart2P',
    fontSize: 5,
    color:
      colors.textSecondary,
    textAlign:
      'center',
  },

  /* ====================================
     POSITIVE / NEGATIVE
     ==================================== */

  positiveText: {
    color:
      colors.primary,
  },

  negativeText: {
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

  /* ====================================
     EXERCISE SELECTOR
     ==================================== */

  exerciseSelector: {
    gap: spacing.sm,
    paddingBottom:
      spacing.md,
  },

  exerciseChip: {
    borderWidth: 1,
    borderColor:
      colors.border,
    paddingHorizontal:
      spacing.md,
    paddingVertical:
      spacing.sm,
    backgroundColor:
      colors.background,
    maxWidth: 180,
  },

  exerciseChipActive: {
    borderWidth: 2,
    borderColor:
      colors.primary,
  },

  exerciseChipText: {
    fontFamily:
      'PressStart2P',
    fontSize: 6,
    color:
      colors.textSecondary,
  },

  exerciseChipTextActive: {
    color:
      colors.primary,
  },

  /* ====================================
     MINI STATS
     ==================================== */

  miniStatsRow: {
    flexDirection:
      'row',
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
    paddingVertical:
      spacing.sm,
    marginBottom:
      spacing.sm,
  },

  miniStat: {
    flex: 1,
    alignItems:
      'center',
  },

  miniStatValue: {
    fontFamily:
      'VT323',
    fontSize: 19,
    color:
      colors.primary,
    marginBottom: 2,
  },

  miniStatLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 4,
    color:
      colors.textSecondary,
  },

  /* ====================================
     WORKOUT PROGRESS
     ==================================== */

  progressCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 2,
    borderColor:
      colors.border,
    padding:
      spacing.md,
    marginBottom:
      spacing.xl,
  },

  cardHeader: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color:
      colors.textSecondary,
    marginBottom:
      spacing.md,
  },

  progressRow: {
    flexDirection:
      'row',
    alignItems:
      'center',
    paddingVertical:
      spacing.md,
  },

  progressRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  progressDate: {
    width: '34%',
  },

  progressIndex: {
    fontFamily:
      'VT323',
    fontSize: 18,
    color:
      colors.primary,
    marginBottom: 2,
  },

  dateText: {
    fontFamily:
      'VT323',
    fontSize: 17,
    color:
      colors.textSecondary,
  },

  progressVolume: {
    width: '33%',
  },

  volumeText: {
    fontFamily:
      'VT323',
    fontSize: 21,
    color:
      colors.text,
  },

  volumeLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 6,
    color:
      colors.textSecondary,
  },

  performanceValue: {
    width: '33%',
    alignItems:
      'flex-end',
  },

  performanceText: {
    fontFamily:
      'VT323',
    fontSize: 22,
    color:
      colors.text,
  },

  performanceLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 5,
    color:
      colors.textSecondary,
    textAlign:
      'right',
  },

  /* ====================================
     EXERCISES
     ==================================== */

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
    justifyContent:
      'space-between',
    alignItems:
      'flex-start',
    marginBottom:
      spacing.md,
  },

  exerciseTitleContainer: {
    flex: 1,
    paddingRight:
      spacing.sm,
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

  exerciseSessions: {
    fontFamily:
      'VT323',
    fontSize: 17,
    color:
      colors.textSecondary,
  },

  improvementContainer: {
    alignItems:
      'flex-end',
  },

  improvementValue: {
    fontFamily:
      'VT323',
    fontSize: 25,
    color:
      colors.text,
  },

  improvementLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 5,
    color:
      colors.textSecondary,
  },

  exerciseStats: {
    flexDirection:
      'row',
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    paddingTop:
      spacing.md,
  },

  exerciseStat: {
    flex: 1,
  },

  exerciseStatValue: {
    fontFamily:
      'VT323',
    fontSize: 21,
    color:
      colors.primary,
    marginBottom: 2,
  },

  exerciseStatLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 5,
    color:
      colors.textSecondary,
  },

  exerciseSecondary: {
    flexDirection:
      'row',
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    marginTop:
      spacing.md,
    paddingTop:
      spacing.sm,
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
    fontSize: 5,
    color:
      colors.textSecondary,
    marginRight:
      spacing.sm,
  },

  secondaryStatValue: {
    fontFamily:
      'VT323',
    fontSize: 19,
    color:
      colors.text,
  },
});