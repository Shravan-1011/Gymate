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
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../constants/theme';


/*
 * ========================================
 * CONSTANTS
 * ========================================
 */

const CHART_HEIGHT = 150;
const Y_AXIS_WIDTH = 34;
const X_LABEL_WIDTH = 44;
const MAX_SINGLE_RUN_BARS = 24;

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

const WEEKDAYS = [
  'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT',
];


/*
 * ========================================
 * TYPES
 * (structurally compatible with RunningSession)
 * ========================================
 */

type GraphRun = {
  activityDate: string;
  distanceMeters: number;
  durationSeconds: number;
  runningXP: number;
};

type Metric = 'DISTANCE' | 'TIME' | 'XP';

type Mode = 'RUN' | 'WEEK' | 'MONTH';

type Bucket = {
  key: string;
  label: string;
  rangeLabel: string;
  runs: number;
  distanceMeters: number;
  durationSeconds: number;
  xp: number;
};


/*
 * ========================================
 * FORMAT HELPERS
 * ========================================
 */

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(
      minutes,
    ).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(
    secs,
  ).padStart(2, '0')}`;
}

function formatPace(secondsPerKm: number | null) {
  if (
    secondsPerKm == null ||
    !Number.isFinite(secondsPerKm) ||
    secondsPerKm <= 0
  ) {
    return '--';
  }

  const total = Math.round(secondsPerKm);

  return `${Math.floor(total / 60)}:${String(
    total % 60,
  ).padStart(2, '0')}`;
}

function formatTick(value: number) {
  if (value === 0) {
    return '0';
  }

  const rounded = Math.round(value * 10) / 10;

  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1);
}

function shortDate(date: Date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function startOfWeek(date: Date) {
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const day = start.getDay();

  start.setDate(
    start.getDate() - (day === 0 ? 6 : day - 1),
  );

  return start;
}


/*
 * ========================================
 * BUCKETS
 * Few runs → one bar per run
 * Many runs → weekly / monthly totals
 * ========================================
 */

function makeBucket(
  key: string,
  label: string,
  rangeLabel: string,
  list: GraphRun[],
): Bucket {
  return {
    key,
    label,
    rangeLabel,
    runs: list.length,
    distanceMeters: list.reduce(
      (sum, run) => sum + Math.max(0, run.distanceMeters),
      0,
    ),
    durationSeconds: list.reduce(
      (sum, run) => sum + Math.max(0, run.durationSeconds),
      0,
    ),
    xp: list.reduce(
      (sum, run) => sum + Math.max(0, run.runningXP),
      0,
    ),
  };
}

function buildBuckets(runs: GraphRun[]): {
  buckets: Bucket[];
  mode: Mode;
} {
  const valid = runs
    .map(run => ({
      run,
      date: new Date(run.activityDate),
    }))
    .filter(item => !Number.isNaN(item.date.getTime()))
    .sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

  if (valid.length === 0) {
    return { buckets: [], mode: 'RUN' };
  }

  const first = valid[0].date;
  const last = valid[valid.length - 1].date;

  const spanDays =
    (last.getTime() - first.getTime()) / 86400000;

  const mode: Mode =
    valid.length <= MAX_SINGLE_RUN_BARS
      ? 'RUN'
      : spanDays <= 210
        ? 'WEEK'
        : 'MONTH';

  if (mode === 'RUN') {
    return {
      mode,
      buckets: valid.map(({ run, date }, index) =>
        makeBucket(
          `${index}-${run.activityDate}`,
          shortDate(date),
          `${WEEKDAYS[date.getDay()]}, ${shortDate(date)} ${date.getFullYear()}`,
          [run],
        ),
      ),
    };
  }

  const buckets: Bucket[] = [];

  if (mode === 'WEEK') {
    const groups = new Map<string, GraphRun[]>();

    valid.forEach(({ run, date }) => {
      const key = dayKey(startOfWeek(date));

      groups.set(key, [...(groups.get(key) ?? []), run]);
    });

    const cursor = startOfWeek(first);
    const end = startOfWeek(last);

    while (cursor.getTime() <= end.getTime()) {
      const key = dayKey(cursor);

      const weekEnd = new Date(cursor);

      weekEnd.setDate(weekEnd.getDate() + 6);

      buckets.push(
        makeBucket(
          key,
          shortDate(cursor),
          `${shortDate(cursor)} - ${shortDate(weekEnd)}`,
          groups.get(key) ?? [],
        ),
      );

      cursor.setDate(cursor.getDate() + 7);
    }

    return { mode, buckets };
  }

  const groups = new Map<string, GraphRun[]>();

  valid.forEach(({ run, date }) => {
    const key = `${date.getFullYear()}-${date.getMonth()}`;

    groups.set(key, [...(groups.get(key) ?? []), run]);
  });

  const cursor = new Date(
    first.getFullYear(),
    first.getMonth(),
    1,
  );

  const end = new Date(
    last.getFullYear(),
    last.getMonth(),
    1,
  );

  while (cursor.getTime() <= end.getTime()) {
    const month = cursor.getMonth();
    const year = cursor.getFullYear();

    buckets.push(
      makeBucket(
        `${year}-${month}`,
        month === 0
          ? `${MONTHS[0]} '${String(year).slice(2)}`
          : MONTHS[month],
        `${MONTHS[month]} ${year}`,
        groups.get(`${year}-${month}`) ?? [],
      ),
    );

    cursor.setMonth(month + 1);
  }

  return { mode, buckets };
}


/*
 * ========================================
 * METRICS + SCALE
 * ========================================
 */

function metricValue(bucket: Bucket, metric: Metric) {
  switch (metric) {
    case 'TIME':
      return bucket.durationSeconds / 60;

    case 'XP':
      return bucket.xp;

    case 'DISTANCE':
    default:
      return bucket.distanceMeters / 1000;
  }
}

function buildScale(maxValue: number) {
  const max = maxValue > 0 ? maxValue : 1;

  const raw = max / 3;

  const magnitude = Math.pow(
    10,
    Math.floor(Math.log10(raw)),
  );

  const normalized = raw / magnitude;

  const step =
    (normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 5
          ? 5
          : 10) * magnitude;

  const count = Math.max(1, Math.ceil(max / step - 1e-9));

  const ticks = Array.from(
    { length: count + 1 },
    (_, index) => index * step,
  );

  return {
    max: count * step,
    ticks,
  };
}


/*
 * ========================================
 * COMPONENT
 * ========================================
 */

export default function RunsGraph({
  runs,
}: {
  runs: GraphRun[];
}) {
  const [metric, setMetric] =
    useState<Metric>('DISTANCE');

  const { buckets, mode } = useMemo(
    () => buildBuckets(runs),
    [runs],
  );

  const values = useMemo(
    () =>
      buckets.map(bucket =>
        metricValue(bucket, metric),
      ),
    [buckets, metric],
  );

  const average = useMemo(
    () =>
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) /
          values.length
        : 0,
    [values],
  );

  const maxValue = useMemo(
    () => Math.max(0, ...values),
    [values],
  );

  const scale = useMemo(
    () => buildScale(Math.max(maxValue, average)),
    [maxValue, average],
  );

  const [plotWidth, setPlotWidth] = useState(0);

  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null);

  const grow = useRef(new Animated.Value(0)).current;


  /*
   * Gesture (refs because PanResponder is created once)
   */

  const countRef = useRef(0);
  const widthRef = useRef(0);

  countRef.current = buckets.length;
  widthRef.current = plotWidth;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy),

      // lets the page keep scrolling vertically
      onPanResponderTerminationRequest: () => true,

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

    setSelectedIndex(
      Math.min(
        count - 1,
        Math.max(0, Math.floor(x / (width / count))),
      ),
    );
  }


  /*
   * Reset selection when the data set changes,
   * re-animate when data OR metric changes
   */

  const dataKey = `${mode}-${buckets.length}-${buckets[0]?.key ?? ''}-${buckets[buckets.length - 1]?.key ?? ''}`;

  useEffect(() => {
    setSelectedIndex(null);
  }, [dataKey]);

  useEffect(() => {
    grow.setValue(0);

    Animated.timing(grow, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [dataKey, metric, grow]);


  if (buckets.length === 0) {
    return null;
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

  const activeValue = values[activeIndex];

  const activePace =
    active.distanceMeters > 0
      ? active.durationSeconds /
        (active.distanceMeters / 1000)
      : null;

  const isBest =
    buckets.length > 1 &&
    maxValue > 0 &&
    activeValue === maxValue;

  const badge =
    active.runs === 0
      ? 'NO RUNS'
      : isBest
        ? 'BEST'
        : buckets.length > 1 && average > 0
          ? `${activeValue >= average ? '+' : ''}${Math.round(
              ((activeValue - average) / average) * 100,
            )}% AVG`
          : null;

  const slot =
    plotWidth > 0 ? plotWidth / buckets.length : 0;

  const gap = slot >= 10 ? 3 : slot >= 5 ? 1.5 : 1;

  const barWidth = Math.max(
    2,
    Math.min(24, Math.floor(slot - gap)),
  );

  const averageTop =
    CHART_HEIGHT -
    (average / scale.max) * CHART_HEIGHT;

  const modeText =
    mode === 'RUN'
      ? 'EACH RUN'
      : mode === 'WEEK'
        ? 'WEEKLY TOTALS'
        : 'MONTHLY TOTALS';

  const metricText =
    metric === 'DISTANCE'
      ? 'KM'
      : metric === 'TIME'
        ? 'MIN'
        : 'XP';

  const labelCount = Math.min(5, buckets.length);

  const labelIndexes = Array.from(
    new Set(
      Array.from({ length: labelCount }, (_, i) =>
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
    <View style={styles.card}>

      {/* HEADER */}

      <View style={styles.header}>

        <View>
          <Text style={styles.title}>
            RUN ACTIVITY
          </Text>

          <Text style={styles.subtitle}>
            {modeText}
            {'  •  '}
            {metricText}
          </Text>
        </View>

        <View style={styles.metricRow}>
          {(
            [
              ['DISTANCE', 'DIST'],
              ['TIME', 'TIME'],
              ['XP', 'XP'],
            ] as [Metric, string][]
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setMetric(key)}
              style={[
                styles.metricChip,
                metric === key &&
                  styles.metricChipActive,
              ]}
            >
              <Text
                style={[
                  styles.metricChipText,
                  metric === key &&
                    styles.metricChipTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

      </View>


      {/* INSPECTOR */}

      <View style={styles.inspector}>

        <View style={styles.inspectorTop}>

          <Text
            style={styles.inspectorRange}
            numberOfLines={1}
          >
            {active.rangeLabel}
            {mode !== 'RUN'
              ? `  •  ${active.runs} ${active.runs === 1 ? 'RUN' : 'RUNS'}`
              : ''}
          </Text>

          {badge && (
            <View
              style={[
                styles.badge,
                isBest && styles.badgeBest,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isBest && styles.badgeTextBest,
                ]}
              >
                {badge}
              </Text>
            </View>
          )}

        </View>

        <View style={styles.statsRow}>

          <InspectorStat
            label="DIST"
            value={(active.distanceMeters / 1000).toFixed(2)}
            unit="KM"
            highlight={metric === 'DISTANCE'}
          />

          <InspectorStat
            label="TIME"
            value={formatDuration(active.durationSeconds)}
            highlight={metric === 'TIME'}
          />

          <InspectorStat
            label="PACE"
            value={formatPace(activePace)}
            unit="/KM"
          />

          <InspectorStat
            label="XP"
            value={`+${active.xp}`}
            highlight={metric === 'XP'}
          />

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
            {scale.ticks.map(tick => (
              <Text
                key={`y-${tick}`}
                style={[
                  styles.yLabel,
                  {
                    top:
                      CHART_HEIGHT -
                      (tick / scale.max) * CHART_HEIGHT -
                      7,
                  },
                ]}
              >
                {formatTick(tick)}
              </Text>
            ))}
          </View>


          {/* PLOT (touch surface) */}

          <View
            style={[
              styles.plot,
              { height: CHART_HEIGHT },
            ]}
            onLayout={(event: LayoutChangeEvent) =>
              setPlotWidth(event.nativeEvent.layout.width)
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
                        (tick / scale.max) * CHART_HEIGHT,
                    },
                  ]}
                />
              ))}


              {/* BARS */}

              {slot > 0 && (
                <View style={styles.barRow}>

                  {buckets.map((bucket, index) => {
                    const value = values[index];

                    const aboveAverage =
                      value > 0 &&
                      (buckets.length === 1 ||
                        value >= average);

                    const isActive = index === activeIndex;

                    const targetHeight =
                      value <= 0
                        ? 1
                        : Math.max(
                            2,
                            Math.round(
                              (value / scale.max) *
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
                          <View style={styles.cursor} />
                        )}

                        <Animated.View
                          style={[
                            styles.bar,

                            aboveAverage &&
                              styles.barAbove,

                            isActive &&
                              !aboveAverage &&
                              styles.barActive,

                            {
                              width: barWidth,
                              height: grow.interpolate({
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


              {/* AVERAGE LINE */}

              {buckets.length > 1 && average > 0 && (
                <>
                  <View
                    style={[
                      styles.averageLine,
                      { top: averageTop },
                    ]}
                  />

                  <Text
                    style={[
                      styles.averageLabel,
                      { top: averageTop - 11 },
                    ]}
                  >
                    AVG
                  </Text>
                </>
              )}

            </View>
          </View>

        </View>


        {/* X AXIS */}

        <View style={styles.xAxis}>

          {slot > 0 &&
            labelIndexes.map((index, position) => {
              const isFirst = position === 0;

              const isLast =
                position === labelIndexes.length - 1;

              const center = (index + 0.5) * slot;

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
              styles.swatchAbove,
            ]}
          />
          <Text style={styles.legendText}>
            ABOVE AVG
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.swatch,
              styles.swatchBelow,
            ]}
          />
          <Text style={styles.legendText}>
            BELOW
          </Text>
        </View>

        <Text style={styles.hint}>
          TAP / DRAG TO INSPECT
        </Text>

      </View>

    </View>
  );
}


/*
 * ========================================
 * INSPECTOR STAT
 * ========================================
 */

function InspectorStat({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.stat}>

      <Text style={styles.statLabel}>{label}</Text>

      <View style={styles.statValueRow}>

        <Text
          style={[
            styles.statValue,
            highlight && styles.statValueHighlight,
          ]}
        >
          {value}
        </Text>

        {unit ? (
          <Text style={styles.statUnit}>{unit}</Text>
        ) : null}

      </View>

    </View>
  );
}


/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles = StyleSheet.create({

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
  },


  /* header */

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  title: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 9,
  },

  subtitle: {
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 15,
    marginTop: 6,
  },

  metricRow: {
    flexDirection: 'row',
    gap: 5,
  },

  metricChip: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },

  metricChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#172712',
  },

  metricChipText: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  metricChipTextActive: {
    color: colors.primary,
  },


  /* inspector */

  inspector: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  inspectorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  inspectorRange: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
    lineHeight: 10,
    marginRight: 8,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },

  badgeBest: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  badgeText: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  badgeTextBest: {
    color: colors.background,
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },

  stat: {
    flex: 1,
  },

  statLabel: {
    color: colors.textMuted,
    fontFamily: 'PressStart2P',
    fontSize: 5,
    marginBottom: 4,
  },

  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  statValue: {
    color: colors.text,
    fontFamily: 'VT323',
    fontSize: 20,
  },

  statValueHighlight: {
    color: colors.primary,
  },

  statUnit: {
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 12,
    marginLeft: 3,
  },


  /* chart */

  viewport: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    paddingTop: 14,
    paddingBottom: 4,
    paddingHorizontal: 8,
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
    right: 4,
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 12,
    lineHeight: 14,
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

  averageLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    opacity: 0.75,
  },

  averageLabel: {
    position: 'absolute',
    right: 2,
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 5,
    backgroundColor: colors.background,
    paddingHorizontal: 2,
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
    borderRadius: 3,
  },

  bar: {
    backgroundColor: colors.borderStrong,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  barAbove: {
    backgroundColor: colors.primary,
  },

  barActive: {
    backgroundColor: colors.textSecondary,
  },

  xAxis: {
    height: 18,
    marginLeft: Y_AXIS_WIDTH,
    marginTop: 4,
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
    marginTop: 12,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },

  swatch: {
    width: 8,
    height: 8,
    marginRight: 5,
    borderRadius: 2,
  },

  swatchAbove: {
    backgroundColor: colors.primary,
  },

  swatchBelow: {
    backgroundColor: colors.borderStrong,
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