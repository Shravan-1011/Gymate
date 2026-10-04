import React, { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfile } from '../../context/ProfileContext';

import { getDatabase } from '../../database/database';

import PixelCard from '../../components/PixelCard';

import StepsGraph from '../../components/StepsGraph';

import { colors, spacing } from '../../constants/theme';


/*
 * ========================================
 * CONSTANTS
 * ========================================
 */

const STEP_GOAL = 10000;


/*
 * ========================================
 * TYPES
 * ========================================
 */

type StepHistoryRecord = {
  id: string;
  profileId: string;
  activityDate: string;
  stepCount: number;
  evaluated: boolean;
  stepsXP: number;
  createdAt: string;
  updatedAt: string;
};

type PeriodFilter = '30D' | '6M' | '1Y' | 'ALL';

type GoalFilter = 'ALL' | 'COMPLETED' | 'UNDER';

type EvaluationFilter = 'ALL' | 'EVALUATED' | 'PENDING';

type SortOption =
  | 'NEWEST'
  | 'OLDEST'
  | 'HIGHEST_STEPS'
  | 'LOWEST_STEPS'
  | 'HIGHEST_XP';


/*
 * ========================================
 * DATE
 * ========================================
 */

function getTodayIso(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


function getDateDaysAgo(days: number): string {
  const date = new Date();

  date.setDate(date.getDate() - days + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


function getDateRangeStart(
  period: PeriodFilter,
  history: StepHistoryRecord[],
): string | null {
  if (period === 'ALL') {
    if (history.length === 0) {
      return null;
    }

    return history.reduce(
      (oldest, day) =>
        day.activityDate < oldest ? day.activityDate : oldest,
      history[0].activityDate,
    );
  }

  const days =
    period === '30D'
      ? 30
      : period === '6M'
        ? 183
        : 365;

  return getDateDaysAgo(days);
}


function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);

  return new Date(year, month - 1, day)
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}


/*
 * ========================================
 * NUMBER
 * ========================================
 */

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-IN');
}


/*
 * ========================================
 * DATABASE
 * ========================================
 */

async function getStepHistory(
  profileId: string,
): Promise<StepHistoryRecord[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    profile_id: string;
    activity_date: string;
    step_count: number;
    evaluated: number;
    steps_xp: number;
    created_at: string;
    updated_at: string;
  }>(
    `
      SELECT
        id,
        profile_id,
        activity_date,
        step_count,
        evaluated,
        steps_xp,
        created_at,
        updated_at
      FROM daily_activity_steps
      WHERE profile_id = ?
      ORDER BY
        activity_date DESC;
    `,
    profileId,
  );

  return rows.map(row => ({
    id: row.id,
    profileId: row.profile_id,
    activityDate: row.activity_date,
    stepCount: Math.max(0, Math.floor(row.step_count)),
    evaluated: row.evaluated === 1,
    stepsXP: Math.max(0, Math.floor(row.steps_xp)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}


/*
 * ========================================
 * FILTER CHIP
 * ========================================
 */

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          active && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}


/*
 * ========================================
 * MINI PROGRESS
 * ========================================
 */

function MiniProgress({ steps }: { steps: number }) {
  const percent = Math.min(
    100,
    Math.max(0, (steps / STEP_GOAL) * 100),
  );

  const completed = steps >= STEP_GOAL;

  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          completed && styles.progressFillComplete,
          { width: `${percent}%` },
        ]}
      />
    </View>
  );
}


/*
 * ========================================
 * STEP CARD
 * ========================================
 */

function StepHistoryCard({
  day,
  expanded,
  onToggle,
}: {
  day: StepHistoryRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const completed = day.stepCount >= STEP_GOAL;

  const percent = Math.min(
    100,
    Math.round((day.stepCount / STEP_GOAL) * 100),
  );

  return (
    <PixelCard style={styles.card}>

      {/* HEADER */}

      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`Steps for ${day.activityDate}`}
        style={({ pressed }) => [
          styles.cardHeader,
          pressed && styles.cardPressed,
        ]}
      >

        <View style={styles.dateContainer}>

          <Text style={styles.date}>
            {formatDate(day.activityDate)}
          </Text>

          <View style={styles.metaRow}>

            <Text
              style={
                completed
                  ? styles.completeText
                  : styles.pendingText
              }
            >
              {completed ? '10K COMPLETE' : 'IN PROGRESS'}
            </Text>

            <Text style={styles.dot}>•</Text>

            <Text style={styles.evaluatedText}>
              {day.evaluated ? 'EVALUATED' : 'PENDING'}
            </Text>

          </View>

        </View>


        <View style={styles.headerRight}>

          <View style={styles.xpBox}>
            <Text style={styles.xpValue}>
              +{day.stepsXP}
            </Text>

            <Text style={styles.xpLabel}>XP</Text>
          </View>

          <Text style={styles.expandIcon}>
            {expanded ? '−' : '+'}
          </Text>

        </View>

      </Pressable>


      {/* STEP SUMMARY */}

      <View style={styles.stepSummary}>

        <View style={styles.stepNumberContainer}>

          <Text style={styles.stepNumber}>
            {formatNumber(day.stepCount)}
          </Text>

          <Text style={styles.stepLabel}>STEPS</Text>

        </View>


        <View style={styles.goalContainer}>

          <View style={styles.goalTop}>

            <Text style={styles.goalLabel}>
              DAILY GOAL
            </Text>

            <Text
              style={
                completed
                  ? styles.goalComplete
                  : styles.goalPercent
              }
            >
              {completed ? 'COMPLETE' : `${percent}%`}
            </Text>

          </View>

          <MiniProgress steps={day.stepCount} />

          <Text style={styles.goalText}>
            {formatNumber(day.stepCount)}
            {' / '}
            {formatNumber(STEP_GOAL)}
          </Text>

        </View>

      </View>


      {/* EXPANDED */}

      {expanded && (

        <View style={styles.expandedSection}>

          <View style={styles.detailRow}>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>STEPS</Text>
              <Text style={styles.detailValue}>
                {formatNumber(day.stepCount)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>GOAL</Text>
              <Text style={styles.detailValue}>
                {formatNumber(STEP_GOAL)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>XP</Text>
              <Text style={styles.detailValueXP}>
                +{day.stepsXP}
              </Text>
            </View>

          </View>


          <View style={styles.statusBox}>

            <Text style={styles.statusLabel}>
              DAY STATUS
            </Text>

            <Text
              style={
                completed
                  ? styles.statusComplete
                  : styles.statusIncomplete
              }
            >
              {completed
                ? '10,000 STEP GOAL COMPLETED'
                : `${formatNumber(
                    STEP_GOAL - day.stepCount,
                  )} MORE STEPS NEEDED`}
            </Text>

          </View>

        </View>

      )}

    </PixelCard>
  );
}


/*
 * ========================================
 * SCREEN
 * ========================================
 */

export default function StepsHistoryScreen() {
  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { profile, isLoading: profileLoading } = useProfile();

  const profileId = profile?.id ?? null;


  /*
   * STATE
   */

  const [history, setHistory] = useState<StepHistoryRecord[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [periodFilter, setPeriodFilter] =
    useState<PeriodFilter>('30D');

  const [goalFilter, setGoalFilter] =
    useState<GoalFilter>('ALL');

  const [evaluationFilter, setEvaluationFilter] =
    useState<EvaluationFilter>('ALL');

  const [sortOption, setSortOption] =
    useState<SortOption>('NEWEST');

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [expandedId, setExpandedId] =
    useState<string | null>(null);


  /*
   * LOAD
   */

  const loadHistory = useCallback(async () => {
    if (!profileId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      const result = await getStepHistory(profileId);

      setHistory(result);
    } catch (error) {
      console.error('[STEPS HISTORY] Failed to load:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profileId]);


  /*
   * FOCUS
   */

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );


  /*
   * REFRESH
   */

  async function refresh() {
    setRefreshing(true);

    await loadHistory();
  }


  /*
   * FILTER + SORT
   */

  const filteredHistory = useMemo(() => {
    const today = getTodayIso();

    const startDate = getDateRangeStart(periodFilter, history);

    let result = history.filter(
      day =>
        (startDate === null || day.activityDate >= startDate) &&
        day.activityDate <= today,
    );

    result = result.filter(day => {
      switch (goalFilter) {
        case 'COMPLETED':
          return day.stepCount >= STEP_GOAL;

        case 'UNDER':
          return day.stepCount < STEP_GOAL;

        default:
          return true;
      }
    });

    result = result.filter(day => {
      switch (evaluationFilter) {
        case 'EVALUATED':
          return day.evaluated;

        case 'PENDING':
          return !day.evaluated;

        default:
          return true;
      }
    });

    result.sort((first, second) => {
      switch (sortOption) {
        case 'NEWEST':
          return second.activityDate.localeCompare(
            first.activityDate,
          );

        case 'OLDEST':
          return first.activityDate.localeCompare(
            second.activityDate,
          );

        case 'HIGHEST_STEPS':
          return second.stepCount - first.stepCount;

        case 'LOWEST_STEPS':
          return first.stepCount - second.stepCount;

        case 'HIGHEST_XP':
          return second.stepsXP - first.stepsXP;

        default:
          return 0;
      }
    });

    return result;
  }, [
    history,
    periodFilter,
    goalFilter,
    evaluationFilter,
    sortOption,
  ]);


  /*
   * SUMMARY
   */

  const summary = useMemo(() => {
    if (filteredHistory.length === 0) {
      return {
        totalSteps: 0,
        averageSteps: 0,
        bestSteps: 0,
        completedDays: 0,
        xp: 0,
      };
    }

    let totalSteps = 0;
    let completedDays = 0;
    let xp = 0;
    let bestSteps = 0;

    for (const day of filteredHistory) {
      totalSteps += day.stepCount;

      xp += day.stepsXP;

      bestSteps = Math.max(bestSteps, day.stepCount);

      if (day.stepCount >= STEP_GOAL) {
        completedDays += 1;
      }
    }

    return {
      totalSteps,
      averageSteps: Math.round(
        totalSteps / filteredHistory.length,
      ),
      bestSteps,
      completedDays,
      xp,
    };
  }, [filteredHistory]);


  /*
   * FILTER COUNT
   */

  const activeFilterCount =
    (periodFilter !== '30D' ? 1 : 0) +
    (goalFilter !== 'ALL' ? 1 : 0) +
    (evaluationFilter !== 'ALL' ? 1 : 0);


  /*
   * CLEAR
   */

  function clearFilters() {
    setPeriodFilter('30D');
    setGoalFilter('ALL');
    setEvaluationFilter('ALL');
  }


  /*
   * LOADING
   */

  if (profileLoading || loading) {
    return (
      <View style={styles.center}>

        <ActivityIndicator
          size="small"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          LOADING STEPS...
        </Text>

      </View>
    );
  }


  /*
   * SCREEN
   */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }
    >

      {/* HEADER */}

      <View style={styles.header}>

        <View style={styles.headerLeft}>

          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.smallText}>ACTIVITY</Text>
            <Text style={styles.title}>STEPS HISTORY</Text>
          </View>

        </View>

      </View>


      {/* OVERVIEW */}

      <PixelCard style={styles.overviewCard}>

        <View style={styles.overviewHeader}>

          <View>

            <Text style={styles.overviewTitle}>
              STEP SUMMARY
            </Text>

            <Text style={styles.overviewSubtitle}>
              {filteredHistory.length}
              {' '}
              {filteredHistory.length === 1 ? 'DAY' : 'DAYS'}
              {' '}
              SHOWN
            </Text>

          </View>

          <Text style={styles.overviewXP}>
            +{summary.xp} XP
          </Text>

        </View>


        <View style={styles.summaryGrid}>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TOTAL</Text>
            <Text style={styles.summaryValue}>
              {formatNumber(summary.totalSteps)}
            </Text>
            <Text style={styles.summaryUnit}>STEPS</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>AVERAGE</Text>
            <Text style={styles.summaryValue}>
              {formatNumber(summary.averageSteps)}
            </Text>
            <Text style={styles.summaryUnit}>/ DAY</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>BEST</Text>
            <Text style={styles.summaryValue}>
              {formatNumber(summary.bestSteps)}
            </Text>
            <Text style={styles.summaryUnit}>STEPS</Text>
          </View>

        </View>


        <View style={styles.completedSummary}>

          <Text style={styles.completedLabel}>10K DAYS</Text>

          <Text style={styles.completedValue}>
            {summary.completedDays}
            {' / '}
            {filteredHistory.length}
          </Text>

        </View>

      </PixelCard>


      {/* DAILY GRAPH */}

      <StepsGraph
        history={history}
        period={periodFilter}
      />


      {/* FILTER HEADER */}

      <View style={styles.filterHeader}>

        <Pressable
          onPress={() => setFiltersOpen(previous => !previous)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.filterButton,
            filtersOpen && styles.filterButtonActive,
            pressed && styles.buttonPressed,
          ]}
        >

          <Text style={styles.filterButtonText}>FILTERS</Text>

          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {activeFilterCount}
              </Text>
            </View>
          )}

          <Text style={styles.filterArrow}>
            {filtersOpen ? '−' : '+'}
          </Text>

        </Pressable>

        <Text style={styles.resultCount}>
          {filteredHistory.length}
          {' '}
          RESULTS
        </Text>

      </View>


      {/* FILTER PANEL */}

      {filtersOpen && (

        <PixelCard style={styles.filterPanel}>

          <Text style={styles.filterTitle}>TIME RANGE</Text>

          <View style={styles.chipRow}>
            <FilterChip
              label="30 DAYS"
              active={periodFilter === '30D'}
              onPress={() => setPeriodFilter('30D')}
            />
            <FilterChip
              label="6 MONTHS"
              active={periodFilter === '6M'}
              onPress={() => setPeriodFilter('6M')}
            />
            <FilterChip
              label="1 YEAR"
              active={periodFilter === '1Y'}
              onPress={() => setPeriodFilter('1Y')}
            />
            <FilterChip
              label="ALL TIME"
              active={periodFilter === 'ALL'}
              onPress={() => setPeriodFilter('ALL')}
            />
          </View>


          <Text style={styles.filterTitle}>GOAL</Text>

          <View style={styles.chipRow}>
            <FilterChip
              label="ALL"
              active={goalFilter === 'ALL'}
              onPress={() => setGoalFilter('ALL')}
            />
            <FilterChip
              label="10K COMPLETED"
              active={goalFilter === 'COMPLETED'}
              onPress={() => setGoalFilter('COMPLETED')}
            />
            <FilterChip
              label="UNDER 10K"
              active={goalFilter === 'UNDER'}
              onPress={() => setGoalFilter('UNDER')}
            />
          </View>


          <Text style={styles.filterTitle}>EVALUATION</Text>

          <View style={styles.chipRow}>
            <FilterChip
              label="ALL"
              active={evaluationFilter === 'ALL'}
              onPress={() => setEvaluationFilter('ALL')}
            />
            <FilterChip
              label="EVALUATED"
              active={evaluationFilter === 'EVALUATED'}
              onPress={() => setEvaluationFilter('EVALUATED')}
            />
            <FilterChip
              label="PENDING"
              active={evaluationFilter === 'PENDING'}
              onPress={() => setEvaluationFilter('PENDING')}
            />
          </View>


          {activeFilterCount > 0 && (
            <Pressable
              onPress={clearFilters}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.clearButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.clearButtonText}>
                CLEAR FILTERS
              </Text>
            </Pressable>
          )}

        </PixelCard>

      )}


      {/* SORT */}

      <View style={styles.sortSection}>

        <Text style={styles.sortLabel}>SORT BY</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortScroll}
        >
          <FilterChip
            label="NEWEST"
            active={sortOption === 'NEWEST'}
            onPress={() => setSortOption('NEWEST')}
          />
          <FilterChip
            label="OLDEST"
            active={sortOption === 'OLDEST'}
            onPress={() => setSortOption('OLDEST')}
          />
          <FilterChip
            label="MOST STEPS"
            active={sortOption === 'HIGHEST_STEPS'}
            onPress={() => setSortOption('HIGHEST_STEPS')}
          />
          <FilterChip
            label="LEAST STEPS"
            active={sortOption === 'LOWEST_STEPS'}
            onPress={() => setSortOption('LOWEST_STEPS')}
          />
          <FilterChip
            label="XP"
            active={sortOption === 'HIGHEST_XP'}
            onPress={() => setSortOption('HIGHEST_XP')}
          />
        </ScrollView>

      </View>


      {/* HISTORY */}

      {filteredHistory.length === 0 ? (

        <PixelCard style={styles.emptyContainer}>

          <Text style={styles.emptyIcon}>◈</Text>

          <Text style={styles.emptyTitle}>
            NO STEP HISTORY
          </Text>

          <Text style={styles.emptyText}>
            NO DAYS MATCH YOUR
            {'\n'}
            CURRENT FILTERS.
          </Text>

          {activeFilterCount > 0 && (
            <Pressable
              onPress={clearFilters}
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.emptyButtonText}>
                CLEAR FILTERS
              </Text>
            </Pressable>
          )}

        </PixelCard>

      ) : (

        filteredHistory.map(day => (
          <StepHistoryCard
            key={day.id}
            day={day}
            expanded={expandedId === day.id}
            onToggle={() =>
              setExpandedId(current =>
                current === day.id ? null : day.id,
              )
            }
          />
        ))

      )}

    </ScrollView>
  );
}


/*
 * ========================================
 * STYLES
 * (graph styles now live in StepsGraph.tsx)
 * ========================================
 */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 18,
    marginTop: spacing.sm,
  },

  buttonPressed: {
    opacity: 0.65,
    transform: [{ translateY: 2 }],
  },


  /* HEADER */

  header: {
    marginBottom: spacing.lg,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  backText: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 31,
    lineHeight: 31,
  },

  smallText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  title: {
    fontFamily: 'PressStart2P',
    fontSize: 15,
    color: colors.text,
  },


  /* OVERVIEW */

  overviewCard: {
    marginBottom: spacing.md,
  },

  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },

  overviewTitle: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 8,
  },

  overviewSubtitle: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 16,
    marginTop: spacing.xs,
  },

  overviewXP: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 22,
  },

  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryItem: {
    flex: 1,
  },

  summaryLabel: {
    color: colors.textMuted,
    fontFamily: 'PressStart2P',
    fontSize: 5,
    marginBottom: spacing.xs,
  },

  summaryValue: {
    color: colors.text,
    fontFamily: 'VT323',
    fontSize: 20,
  },

  summaryUnit: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 13,
  },

  divider: {
    width: 1,
    height: 35,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },

  completedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },

  completedLabel: {
    color: colors.textMuted,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  completedValue: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 18,
  },


  /* FILTER */

  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  filterButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },

  filterButtonActive: {
    borderColor: colors.primary,
  },

  filterButtonText: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  filterBadge: {
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },

  filterBadgeText: {
    color: colors.background,
    fontFamily: 'PressStart2P',
    fontSize: 7,
  },

  filterArrow: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 22,
    marginLeft: spacing.sm,
  },

  resultCount: {
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 15,
  },

  filterPanel: {
    marginBottom: spacing.md,
  },

  filterTitle: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 7,
    marginBottom: spacing.sm,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },

  filterChip: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },

  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  filterChipText: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 5,
  },

  filterChipTextActive: {
    color: colors.background,
  },

  clearButton: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },


  /* SORT */

  sortSection: {
    marginBottom: spacing.lg,
  },

  sortLabel: {
    color: colors.textMuted,
    fontFamily: 'PressStart2P',
    fontSize: 7,
    marginBottom: spacing.sm,
  },

  sortScroll: {
    paddingRight: spacing.lg,
  },


  /* CARD */

  card: {
    marginBottom: spacing.md,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },

  cardPressed: {
    opacity: 0.7,
  },

  dateContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },

  date: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 8,
    lineHeight: 15,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },

  completeText: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 15,
  },

  pendingText: {
    color: colors.warning,
    fontFamily: 'VT323',
    fontSize: 15,
  },

  dot: {
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 15,
    marginHorizontal: spacing.xs,
  },

  evaluatedText: {
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 14,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  xpBox: {
    minWidth: 55,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },

  xpValue: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 19,
    lineHeight: 19,
  },

  xpLabel: {
    color: colors.textMuted,
    fontFamily: 'PressStart2P',
    fontSize: 5,
  },

  expandIcon: {
    width: 26,
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 24,
    textAlign: 'right',
    marginLeft: spacing.xs,
  },


  /* STEP SUMMARY */

  stepSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },

  stepNumberContainer: {
    width: 105,
    marginRight: spacing.md,
  },

  stepNumber: {
    color: colors.text,
    fontFamily: 'VT323',
    fontSize: 28,
    fontVariant: ['tabular-nums'],
  },

  stepLabel: {
    color: colors.textMuted,
    fontFamily: 'PressStart2P',
    fontSize: 5,
    marginTop: 1,
  },

  goalContainer: {
    flex: 1,
  },

  goalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },

  goalLabel: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  goalPercent: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 16,
  },

  goalComplete: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  progressTrack: {
    height: 7,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },

  progressFillComplete: {
    backgroundColor: colors.primary,
  },

  goalText: {
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 13,
    marginTop: 2,
  },


  /* EXPANDED */

  expandedSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  detailRow: {
    flexDirection: 'row',
  },

  detailItem: {
    flex: 1,
  },

  detailLabel: {
    color: colors.textMuted,
    fontFamily: 'PressStart2P',
    fontSize: 5,
  },

  detailValue: {
    color: colors.text,
    fontFamily: 'VT323',
    fontSize: 18,
    marginTop: spacing.xs,
  },

  detailValueXP: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 18,
    marginTop: spacing.xs,
  },

  statusBox: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  statusLabel: {
    color: colors.textMuted,
    fontFamily: 'PressStart2P',
    fontSize: 5,
  },

  statusComplete: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 17,
    marginTop: spacing.xs,
  },

  statusIncomplete: {
    color: colors.warning,
    fontFamily: 'VT323',
    fontSize: 17,
    marginTop: spacing.xs,
  },


  /* EMPTY */

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },

  emptyIcon: {
    color: colors.primary,
    fontFamily: 'VT323',
    fontSize: 34,
    marginBottom: spacing.md,
  },

  emptyTitle: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 11,
  },

  emptyText: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  emptyButton: {
    marginTop: spacing.lg,
    minHeight: 38,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyButtonText: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

});