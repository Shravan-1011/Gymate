import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import PixelCard from './PixelCard';

import {
  colors,
  spacing,
} from '../constants/theme';


/*
 * ========================================
 * CONSTANTS
 * ========================================
 */

const STEP_GOAL = 10000;
const CHART_HEIGHT = 150;
const Y_AXIS_WIDTH = 34;
const X_LABEL_WIDTH = 44;

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];


/*
 * ========================================
 * TYPES
 * (structurally compatible with your
 *  StepHistoryRecord / PeriodFilter)
 * ========================================
 */

type PeriodFilter =
  | '30D'
  | '6M'
  | '1Y'
  | 'ALL';

type GraphRecord = {
  activityDate: string;
  stepCount: number;
  stepsXP: number;
};

type Granularity =
  | 'DAY'
  | 'WEEK'
  | 'MONTH';

type Bucket = {
  key: string;
  label: string;
  rangeLabel: string;
  value: number;
  recordedDays: number;
  goalDays: number;
  xp: number;
};


/*
 * ========================================
 * DATE HELPERS
 * ========================================
 */

function toIso(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function parseIso(iso: string): Date {
  const [year, month, day] =
    iso.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function addDays(
  iso: string,
  days: number,
): string {
  const date = parseIso(iso);

  date.setDate(date.getDate() + days);

  return toIso(date);
}

function diffDays(
  start: string,
  end: string,
): number {
  return Math.round(
    (
      parseIso(end).getTime() -
      parseIso(start).getTime()
    ) / 86400000,
  );
}

function shortDate(iso: string): string {
  const date = parseIso(iso);

  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function longDate(iso: string): string {
  const date = parseIso(iso);

  return `${shortDate(iso)} ${date.getFullYear()}`;
}

function getStartDate(
  period: PeriodFilter,
  history: GraphRecord[],
): string | null {
  if (period === 'ALL') {
    if (history.length === 0) {
      return null;
    }

    return history.reduce(
      (oldest, day) =>
        day.activityDate < oldest
          ? day.activityDate
          : oldest,
      history[0].activityDate,
    );
  }

  const days =
    period === '30D'
      ? 30
      : period === '6M'
        ? 183
        : 365;

  return addDays(toIso(new Date()), -(days - 1));
}


/*
 * ========================================
 * NUMBERS
 * ========================================
 */

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-IN');
}

function formatAxis(value: number): string {
  return value === 0
    ? '0'
    : `${value / 1000}K`;
}


/*
 * ========================================
 * BUCKETS
 * Day → daily bars
 * Week → weekly average
 * Month → monthly average
 * Keeps every bar big enough to tap.
 * ========================================
 */

function buildBuckets(
  history: GraphRecord[],
  period: PeriodFilter,
): {
  buckets: Bucket[];
  granularity: Granularity;
} {
  const start =
    getStartDate(period, history);

  if (!start) {
    return {
      buckets: [],
      granularity: 'DAY',
    };
  }

  const today = toIso(new Date());

  const dayCount =
    Math.max(1, diffDays(start, today) + 1);

  const granularity: Granularity =
    dayCount <= 45
      ? 'DAY'
      : dayCount <= 210
        ? 'WEEK'
        : 'MONTH';

  const byDate = new Map(
    history.map(day => [
      day.activityDate,
      day,
    ]),
  );

  const groups: {
    key: string;
    dates: string[];
  }[] = [];

  for (let i = 0; i < dayCount; i += 1) {
    const date = addDays(start, i);

    const key =
      granularity === 'DAY'
        ? date
        : granularity === 'WEEK'
          ? String(Math.floor(i / 7))
          : date.slice(0, 7);

    const last =
      groups[groups.length - 1];

    if (last && last.key === key) {
      last.dates.push(date);
    } else {
      groups.push({
        key,
        dates: [date],
      });
    }
  }

  const buckets = groups.map(group => {
    const records = group.dates
      .map(date => byDate.get(date))
      .filter(
        (record): record is GraphRecord =>
          Boolean(record),
      );

    const total = records.reduce(
      (sum, record) => sum + record.stepCount,
      0,
    );

    const goalDays = records.filter(
      record => record.stepCount >= STEP_GOAL,
    ).length;

    const xp = records.reduce(
      (sum, record) => sum + record.stepsXP,
      0,
    );

    const first = group.dates[0];

    const last =
      group.dates[group.dates.length - 1];

    const date = parseIso(first);

    let label = '';
    let rangeLabel = '';

    if (granularity === 'DAY') {
      label = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;

      rangeLabel = longDate(first).toUpperCase();
    } else if (granularity === 'WEEK') {
      label = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;

      rangeLabel = `${shortDate(first)} - ${shortDate(last)}`;
    } else {
      const yy = String(date.getFullYear()).slice(2);

      label =
        date.getMonth() === 0
          ? `${MONTHS[0]} '${yy}`
          : MONTHS[date.getMonth()];

      rangeLabel = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    }

    return {
      key: group.key,
      label,
      rangeLabel,
      value:
        granularity === 'DAY'
          ? records[0]?.stepCount ?? 0
          : records.length > 0
            ? Math.round(total / records.length)
            : 0,
      recordedDays: records.length,
      goalDays,
      xp,
    };
  });

  return {
    buckets,
    granularity,
  };
}


/*
 * ========================================
 * Y SCALE
 * ========================================
 */

function buildScale(maxValue: number) {
  const raw =
    Math.ceil(
      Math.max(STEP_GOAL, maxValue) / 5000,
    ) * 5000;

  const step =
    raw <= 15000
      ? 5000
      : Math.ceil(raw / 5000 / 3) * 5000;

  const max =
    Math.ceil(raw / step) * step;

  const ticks: number[] = [];

  for (let tick = 0; tick <= max; tick += step) {
    ticks.push(tick);
  }

  return {
    max,
    ticks,
  };
}


/*
 * ========================================
 * COMPONENT
 * ========================================
 */

export default function StepsGraph({
  history,
  period,
}: {
  history: GraphRecord[];
  period: PeriodFilter;
}) {
  const { buckets, granularity } =
    useMemo(
      () => buildBuckets(history, period),
      [history, period],
    );

  const scale = useMemo(
    () =>
      buildScale(
        buckets.reduce(
          (max, bucket) =>
            Math.max(max, bucket.value),
          0,
        ),
      ),
    [buckets],
  );

  const [plotWidth, setPlotWidth] =
    useState(0);

  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null);

  const grow =
    useRef(new Animated.Value(0)).current;


  /*
   * Gesture refs (PanResponder is created once,
   * so it reads live values from refs)
   */

  const countRef = useRef(0);
  const widthRef = useRef(0);

  countRef.current = buckets.length;
  widthRef.current = plotWidth;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:
        (_, gesture) =>
          Math.abs(gesture.dx) >
          Math.abs(gesture.dy),

      // lets the page scroll vertically
      onPanResponderTerminationRequest:
        () => true,

      onPanResponderGrant: event =>
        select(event.nativeEvent.locationX),

      onPanResponderMove: event =>
        select(event.nativeEvent.locationX),
    }),
  ).current;

  function select(x: number) {
    const count = countRef.current;
    const width = widthRef.current;

    if (count === 0 || width === 0) {
      return;
    }

    const index = Math.min(
      count - 1,
      Math.max(
        0,
        Math.floor(x / (width / count)),
      ),
    );

    setSelectedIndex(index);
  }


  /*
   * Re-animate + reset selection when the
   * period / amount of bars changes
   */

  const animationKey =
    `${period}-${buckets.length}`;

  useEffect(() => {
    setSelectedIndex(null);

    grow.setValue(0);

    Animated.timing(grow, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animationKey, grow]);


  /*
   * Empty state
   */

  if (buckets.length === 0) {
    return (
      <PixelCard style={styles.card}>
        <Text style={styles.title}>
          DAILY STEPS
        </Text>

        <Text style={styles.empty}>
          NO STEP DATA YET
        </Text>
      </PixelCard>
    );
  }


  /*
   * Derived
   */

  const activeIndex =
    selectedIndex !== null &&
    selectedIndex < buckets.length
      ? selectedIndex
      : buckets.length - 1;

  const active = buckets[activeIndex];

  const activeComplete =
    active.value >= STEP_GOAL;

  const activePercent = Math.min(
    100,
    Math.round(
      (active.value / STEP_GOAL) * 100,
    ),
  );

  const hasData =
    active.recordedDays > 0;

  const slot =
    plotWidth > 0
      ? plotWidth / buckets.length
      : 0;

  const gap =
    slot >= 10
      ? 3
      : slot >= 5
        ? 1.5
        : 1;

  const barWidth = Math.max(
    2,
    Math.min(24, Math.floor(slot - gap)),
  );

  const goalTop =
    CHART_HEIGHT -
    (STEP_GOAL / scale.max) * CHART_HEIGHT;

  const periodText =
    period === 'ALL'
      ? 'ALL TIME'
      : period === '6M'
        ? 'LAST 6 MONTHS'
        : period === '1Y'
          ? 'LAST 12 MONTHS'
          : 'LAST 30 DAYS';

  const granularityText =
    granularity === 'DAY'
      ? 'DAILY'
      : granularity === 'WEEK'
        ? 'WEEKLY AVG'
        : 'MONTHLY AVG';

  // evenly spaced x labels
  const labelCount = Math.min(5, buckets.length);

  const labelIndexes = Array.from(
    new Set(
      Array.from(
        { length: labelCount },
        (_, i) =>
          labelCount === 1
            ? 0
            : Math.round(
                (i * (buckets.length - 1)) /
                  (labelCount - 1),
              ),
      ),
    ),
  );

  return (
    <PixelCard style={styles.card}>

      {/* HEADER */}

      <View style={styles.header}>

        <View>
          <Text style={styles.title}>
            DAILY STEPS
          </Text>

          <Text style={styles.subtitle}>
            {periodText}
            {'  •  '}
            {granularityText}
          </Text>
        </View>

        <Text style={styles.goalTag}>
          GOAL 10K
        </Text>

      </View>


      {/* INSPECTOR */}

      <View style={styles.inspector}>

        <View style={styles.inspectorLeft}>

          <Text style={styles.inspectorRange}>
            {active.rangeLabel}
          </Text>

          <View style={styles.inspectorValueRow}>

            <Text
              style={[
                styles.inspectorValue,
                activeComplete &&
                  styles.inspectorValueComplete,
              ]}
            >
              {formatNumber(active.value)}
            </Text>

            <Text style={styles.inspectorUnit}>
              {granularity === 'DAY'
                ? 'STEPS'
                : 'AVG / DAY'}
            </Text>

          </View>

        </View>


        <View style={styles.inspectorRight}>

          <View
            style={[
              styles.badge,
              activeComplete &&
                styles.badgeComplete,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                activeComplete &&
                  styles.badgeTextComplete,
              ]}
            >
              {activeComplete
                ? '10K HIT'
                : `${activePercent}%`}
            </Text>
          </View>

          <Text style={styles.inspectorMeta}>
            {!hasData
              ? 'NO DATA'
              : granularity === 'DAY'
                ? `+${active.xp} XP`
                : `${active.goalDays}/${active.recordedDays} DAYS 10K`}
          </Text>

        </View>

      </View>


      {/* CHART */}

      <View style={styles.viewport}>

        <View style={styles.chartRow}>

          {/* Y AXIS */}

          <View
            style={[
              styles.yAxis,
              { height: CHART_HEIGHT },
            ]}
          >
            {scale.ticks
              .filter(tick => tick !== STEP_GOAL)
              .map(tick => (
                <Text
                  key={`y-${tick}`}
                  style={[
                    styles.yLabel,
                    {
                      top:
                        CHART_HEIGHT -
                        (tick / scale.max) *
                          CHART_HEIGHT -
                        7,
                    },
                  ]}
                >
                  {formatAxis(tick)}
                </Text>
              ))}

            <Text
              style={[
                styles.yLabel,
                styles.yLabelGoal,
                { top: goalTop - 7 },
              ]}
            >
              10K
            </Text>
          </View>


          {/* PLOT (touch surface) */}

          <View
            style={[
              styles.plot,
              { height: CHART_HEIGHT },
            ]}
            onLayout={(
              event: LayoutChangeEvent,
            ) =>
              setPlotWidth(
                event.nativeEvent.layout.width,
              )
            }
            {...panResponder.panHandlers}
          >
            <View
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            >

              {/* GRID */}

              {scale.ticks.map(tick => (
                <View
                  key={`grid-${tick}`}
                  style={[
                    tick === 0
                      ? styles.baseline
                      : styles.gridLine,
                    {
                      top:
                        CHART_HEIGHT -
                        (tick / scale.max) *
                          CHART_HEIGHT,
                    },
                  ]}
                />
              ))}


              {/* BARS */}

              {slot > 0 && (
                <View style={styles.barRow}>

                  {buckets.map((bucket, index) => {
                    const complete =
                      bucket.value >= STEP_GOAL;

                    const isActive =
                      index === activeIndex;

                    const targetHeight =
                      bucket.value <= 0
                        ? 1
                        : Math.max(
                            2,
                            Math.round(
                              (bucket.value /
                                scale.max) *
                                CHART_HEIGHT,
                            ),
                          );

                    return (
                      <View
                        key={bucket.key}
                        style={[
                          styles.slot,
                          { width: slot },
                        ]}
                      >

                        {isActive && (
                          <View
                            style={styles.cursor}
                          />
                        )}

                        <Animated.View
                          style={[
                            styles.bar,

                            complete &&
                              styles.barComplete,

                            isActive &&
                              !complete &&
                              styles.barActive,

                            {
                              width: barWidth,
                              height:
                                grow.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [
                                    0,
                                    targetHeight,
                                  ],
                                }),
                            },
                          ]}
                        />

                      </View>
                    );
                  })}

                </View>
              )}


              {/* GOAL LINE (on top) */}

              <View
                style={[
                  styles.goalLine,
                  { top: goalTop },
                ]}
              />

            </View>
          </View>

        </View>


        {/* X AXIS */}

        <View style={styles.xAxis}>

          {slot > 0 &&
            labelIndexes.map((index, position) => {
              const isFirst = position === 0;

              const isLast =
                position ===
                labelIndexes.length - 1;

              const center =
                (index + 0.5) * slot;

              const left = isFirst
                ? 0
                : isLast
                  ? plotWidth - X_LABEL_WIDTH
                  : Math.min(
                      plotWidth - X_LABEL_WIDTH,
                      Math.max(
                        0,
                        center - X_LABEL_WIDTH / 2,
                      ),
                    );

              return (
                <Text
                  key={`x-${index}`}
                  style={[
                    styles.xLabel,
                    {
                      left,
                      textAlign: isFirst
                        ? 'left'
                        : isLast
                          ? 'right'
                          : 'center',
                    },
                  ]}
                >
                  {buckets[index].label}
                </Text>
              );
            })}

        </View>

      </View>


      {/* LEGEND */}

      <View style={styles.legend}>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.swatch,
              styles.swatchNormal,
            ]}
          />
          <Text style={styles.legendText}>
            STEPS
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.swatch,
              styles.swatchComplete,
            ]}
          />
          <Text style={styles.legendText}>
            10K+
          </Text>
        </View>

        <Text style={styles.hint}>
          TAP / DRAG TO INSPECT
        </Text>

      </View>

    </PixelCard>
  );
}


/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles = StyleSheet.create({

  card: {
    marginBottom: spacing.md,
  },


  /* header */

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  title: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 8,
  },

  subtitle: {
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 15,
    marginTop: spacing.xs,
  },

  goalTag: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  empty: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 18,
    marginTop: spacing.md,
  },


  /* inspector */

  inspector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },

  inspectorLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },

  inspectorRange: {
    color: colors.textMuted,
    fontFamily: 'PressStart2P',
    fontSize: 6,
    lineHeight: 10,
  },

  inspectorValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },

  inspectorValue: {
    color: colors.text,
    fontFamily: 'VT323',
    fontSize: 28,
    lineHeight: 30,
  },

  inspectorValueComplete: {
    color: colors.primary,
  },

  inspectorUnit: {
    color: colors.textMuted,
    fontFamily: 'PressStart2P',
    fontSize: 5,
    marginLeft: spacing.xs,
  },

  inspectorRight: {
    alignItems: 'flex-end',
  },

  badge: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },

  badgeComplete: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  badgeText: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  badgeTextComplete: {
    color: colors.background,
  },

  inspectorMeta: {
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 15,
    marginTop: spacing.xs,
  },


  /* chart */

  viewport: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  chartRow: {
    flexDirection: 'row',
  },

  yAxis: {
    width: Y_AXIS_WIDTH,
    position: 'relative',
  },

  yLabel: {
    position: 'absolute',
    right: spacing.xs,
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 12,
    lineHeight: 14,
  },

  yLabelGoal: {
    color: colors.primary,
  },

  plot: {
    flex: 1,
    position: 'relative',
  },

  baseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.borderStrong,
  },

  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.45,
  },

  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    opacity: 0.75,
  },

  barRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  slot: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  cursor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.border,
    opacity: 0.4,
  },

  bar: {
    backgroundColor: colors.borderStrong,
  },

  barComplete: {
    backgroundColor: colors.primary,
  },

  barActive: {
    backgroundColor: colors.textSecondary,
  },

  xAxis: {
    height: 18,
    marginLeft: Y_AXIS_WIDTH,
    marginTop: spacing.xs,
  },

  xLabel: {
    position: 'absolute',
    top: 0,
    width: X_LABEL_WIDTH,
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 12,
  },


  /* legend */

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  swatch: {
    width: 8,
    height: 8,
    marginRight: spacing.xs,
  },

  swatchNormal: {
    backgroundColor: colors.borderStrong,
  },

  swatchComplete: {
    backgroundColor: colors.primary,
  },

  legendText: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 5,
  },

  hint: {
    marginLeft: 'auto',
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 13,
  },

});