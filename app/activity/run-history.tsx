import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { getRunningHistory } from '../../database/activityRepository';
import type { RunningSession } from '../../types/activity';
import { colors } from '../../constants/theme';
import RunsGraph from '../../components/RunsGraph';

type SortOption =
  | 'newest'
  | 'oldest'
  | 'distance-high'
  | 'distance-low'
  | 'duration-high'
  | 'pace-fast'
  | 'xp-high';

type DistanceFilter = 'all' | '1km' | '5km' | '10km' | 'route';

type PeriodFilter = 'all' | 'week' | 'month' | 'year';

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
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getPeriodStart(period: PeriodFilter) {
  const now = new Date();

  if (period === 'week') {
    const start = new Date(now);
    const day = start.getDay();

    const daysSinceMonday = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - daysSinceMonday);

    start.setHours(0, 0, 0, 0);

    return start;
  }

  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  if (period === 'year') {
    return new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  }

  return null;
}

function matchesPeriod(run: RunningSession, period: PeriodFilter) {
  if (period === 'all') {
    return true;
  }

  const runDate = new Date(run.activityDate);

  if (Number.isNaN(runDate.getTime())) {
    return false;
  }

  const start = getPeriodStart(period);

  if (!start) {
    return true;
  }

  return runDate >= start;
}

function sortRuns(runs: RunningSession[], sort: SortOption) {
  const sorted = [...runs];

  sorted.sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return (
          new Date(a.activityDate).getTime() -
          new Date(b.activityDate).getTime()
        );

      case 'distance-high':
        return b.distanceMeters - a.distanceMeters;

      case 'distance-low':
        return a.distanceMeters - b.distanceMeters;

      case 'duration-high':
        return b.durationSeconds - a.durationSeconds;

      case 'pace-fast': {
        const aPace =
          a.averagePaceSecondsPerKm ?? Number.MAX_SAFE_INTEGER;

        const bPace =
          b.averagePaceSecondsPerKm ?? Number.MAX_SAFE_INTEGER;

        return aPace - bPace;
      }

      case 'xp-high':
        return b.runningXP - a.runningXP;

      case 'newest':
      default:
        return (
          new Date(b.activityDate).getTime() -
          new Date(a.activityDate).getTime()
        );
    }
  });

  return sorted;
}

export default function RunHistoryScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    profileId: string;
  }>();

  const profileId = params.profileId;

  const [runs, setRuns] = useState<RunningSession[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [sort, setSort] = useState<SortOption>('newest');

  const [distanceFilter, setDistanceFilter] =
    useState<DistanceFilter>('all');

  const [periodFilter, setPeriodFilter] =
    useState<PeriodFilter>('all');

  const [showSort, setShowSort] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      if (!profileId) {
        setLoading(false);
        return;
      }

      try {
        const history = await getRunningHistory(profileId);

        if (mounted) {
          setRuns(history);
        }
      } catch (error) {
        console.error('Failed to load run history:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [profileId]);

  const filteredRuns = useMemo(() => {
    let result = [...runs];

    /*
     * Search by date.
     */
    const searchTerm = search.trim().toLowerCase();

    if (searchTerm) {
      result = result.filter(run => {
        const date = formatDate(run.activityDate).toLowerCase();

        return date.includes(searchTerm);
      });
    }

    /*
     * Period.
     */
    result = result.filter(run => matchesPeriod(run, periodFilter));

    /*
     * Distance / route filters.
     */
    result = result.filter(run => {
      const distance = run.distanceMeters / 1000;

      switch (distanceFilter) {
        case '1km':
          return distance >= 1;

        case '5km':
          return distance >= 5;

        case '10km':
          return distance >= 10;

        case 'route':
          return run.route.length >= 2;

        case 'all':
        default:
          return true;
      }
    });

    return sortRuns(result, sort);
  }, [runs, search, sort, distanceFilter, periodFilter]);

  const stats = useMemo(() => {
    const totalRuns = filteredRuns.length;

    const totalDistance = filteredRuns.reduce(
      (sum, run) => sum + run.distanceMeters,
      0,
    );

    const totalTime = filteredRuns.reduce(
      (sum, run) => sum + run.durationSeconds,
      0,
    );

    const totalXP = filteredRuns.reduce(
      (sum, run) => sum + run.runningXP,
      0,
    );

    const averageDistance =
      totalRuns > 0 ? totalDistance / totalRuns : 0;

    return {
      totalRuns,
      totalDistance,
      totalTime,
      totalXP,
      averageDistance,
    };
  }, [filteredRuns]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    sort !== 'newest' ||
    distanceFilter !== 'all' ||
    periodFilter !== 'all';

  function resetFilters() {
    setSearch('');
    setSort('newest');
    setDistanceFilter('all');
    setPeriodFilter('all');
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />

        <Text style={styles.loadingText}>LOADING HISTORY...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* BACK */}

        <Pressable
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/activity')}
        >
          <Text style={styles.backArrow}>←</Text>

          <Text style={styles.backText}>ACTIVITY</Text>
        </Pressable>

        {/* HEADER */}

        <Text style={styles.title}>RUN HISTORY</Text>

        <Text style={styles.subtitle}>YOUR RUNNING JOURNEY</Text>

        {/* =========================
            SUMMARY
           ========================= */}

        {runs.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <SummaryStat
                value={`${stats.totalRuns}`}
                label="RUNS"
              />

              <SummaryDivider />

              <SummaryStat
                value={formatDistance(stats.totalDistance)}
                label="KM"
              />

              <SummaryDivider />

              <SummaryStat
                value={`+${stats.totalXP}`}
                label="XP"
              />
            </View>

            <View style={styles.summaryBottom}>
              <Text style={styles.summaryBottomText}>
                AVG DISTANCE
              </Text>

              <Text style={styles.summaryBottomValue}>
                {formatDistance(stats.averageDistance)} KM / RUN
              </Text>

              <Text style={styles.summaryBottomText}>
                TOTAL TIME
              </Text>

              <Text style={styles.summaryBottomValue}>
                {formatDuration(stats.totalTime)}
              </Text>
            </View>
          </View>
        )}

        {/* =========================
            GRAPH
           ========================= */}

        {runs.length > 0 && filteredRuns.length > 0 && (
          <RunsGraph runs={filteredRuns} />
        )}

        {/* =========================
            SEARCH
           ========================= */}

        {runs.length > 0 && (
          <View style={styles.searchContainer}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="SEARCH BY DATE..."
              placeholderTextColor="#5F6F64"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {search.length > 0 && (
              <Pressable
                style={styles.clearSearch}
                onPress={() => setSearch('')}
              >
                <Text style={styles.clearSearchText}>×</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* =========================
            CONTROLS
           ========================= */}

        {runs.length > 0 && (
          <View style={styles.controlsRow}>
            <Pressable
              style={[
                styles.controlButton,
                showSort && styles.controlButtonActive,
              ]}
              onPress={() => setShowSort(value => !value)}
            >
              <Text
                style={[
                  styles.controlText,
                  showSort && styles.controlTextActive,
                ]}
              >
                ↕ SORT
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.controlButton,
                showFilters && styles.controlButtonActive,
              ]}
              onPress={() => setShowFilters(value => !value)}
            >
              <Text
                style={[
                  styles.controlText,
                  showFilters && styles.controlTextActive,
                ]}
              >
                ⚙ FILTER
              </Text>
            </Pressable>

            {hasActiveFilters && (
              <Pressable
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>RESET</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* =========================
            SORT PANEL
           ========================= */}

        {showSort && runs.length > 0 && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>SORT BY</Text>

            <View style={styles.optionGrid}>
              <SortOptionButton
                label="NEWEST"
                active={sort === 'newest'}
                onPress={() => {
                  setSort('newest');
                  setShowSort(false);
                }}
              />

              <SortOptionButton
                label="OLDEST"
                active={sort === 'oldest'}
                onPress={() => {
                  setSort('oldest');
                  setShowSort(false);
                }}
              />

              <SortOptionButton
                label="DISTANCE ↓"
                active={sort === 'distance-high'}
                onPress={() => {
                  setSort('distance-high');
                  setShowSort(false);
                }}
              />

              <SortOptionButton
                label="DISTANCE ↑"
                active={sort === 'distance-low'}
                onPress={() => {
                  setSort('distance-low');
                  setShowSort(false);
                }}
              />

              <SortOptionButton
                label="LONGEST"
                active={sort === 'duration-high'}
                onPress={() => {
                  setSort('duration-high');
                  setShowSort(false);
                }}
              />

              <SortOptionButton
                label="FASTEST PACE"
                active={sort === 'pace-fast'}
                onPress={() => {
                  setSort('pace-fast');
                  setShowSort(false);
                }}
              />

              <SortOptionButton
                label="HIGHEST XP"
                active={sort === 'xp-high'}
                onPress={() => {
                  setSort('xp-high');
                  setShowSort(false);
                }}
              />
            </View>
          </View>
        )}

        {/* =========================
            FILTER PANEL
           ========================= */}

        {showFilters && runs.length > 0 && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>TIME PERIOD</Text>

            <View style={styles.chipRow}>
              <FilterChip
                label="ALL TIME"
                active={periodFilter === 'all'}
                onPress={() => setPeriodFilter('all')}
              />

              <FilterChip
                label="THIS WEEK"
                active={periodFilter === 'week'}
                onPress={() => setPeriodFilter('week')}
              />

              <FilterChip
                label="THIS MONTH"
                active={periodFilter === 'month'}
                onPress={() => setPeriodFilter('month')}
              />

              <FilterChip
                label="THIS YEAR"
                active={periodFilter === 'year'}
                onPress={() => setPeriodFilter('year')}
              />
            </View>

            <Text
              style={[styles.panelTitle, styles.secondPanelTitle]}
            >
              DISTANCE
            </Text>

            <View style={styles.chipRow}>
              <FilterChip
                label="ALL"
                active={distanceFilter === 'all'}
                onPress={() => setDistanceFilter('all')}
              />

              <FilterChip
                label="1+ KM"
                active={distanceFilter === '1km'}
                onPress={() => setDistanceFilter('1km')}
              />

              <FilterChip
                label="5+ KM"
                active={distanceFilter === '5km'}
                onPress={() => setDistanceFilter('5km')}
              />

              <FilterChip
                label="10+ KM"
                active={distanceFilter === '10km'}
                onPress={() => setDistanceFilter('10km')}
              />

              <FilterChip
                label="HAS ROUTE"
                active={distanceFilter === 'route'}
                onPress={() => setDistanceFilter('route')}
              />
            </View>
          </View>
        )}

        {/* =========================
            RESULTS
           ========================= */}

        {runs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>NO RUNS YET</Text>

            <Text style={styles.emptyText}>
              Complete your first run and it will appear here.
            </Text>

            <Pressable
              style={styles.startButton}
              onPress={() =>
                router.push({
                  pathname: '/activity/run',
                  params: {
                    profileId,
                  },
                })
              }
            >
              <Text style={styles.startButtonText}>START RUN</Text>
            </Pressable>
          </View>
        ) : filteredRuns.length === 0 ? (
          <View style={styles.noResultsCard}>
            <Text style={styles.noResultsTitle}>NO MATCHES</Text>

            <Text style={styles.noResultsText}>
              No runs match the current search and filters.
            </Text>

            <Pressable
              style={styles.resetLargeButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetLargeText}>
                CLEAR FILTERS
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                {filteredRuns.length}{' '}
                {filteredRuns.length === 1 ? 'RUN' : 'RUNS'}
              </Text>

              {hasActiveFilters && (
                <Text style={styles.filteredText}>FILTERED</Text>
              )}
            </View>

            {filteredRuns.map(run => (
              <Pressable
                key={run.id}
                style={styles.runCard}
                onPress={() =>
                  router.push({
                    pathname: '/activity/run-details',
                    params: {
                      profileId,
                      runId: run.id,
                    },
                  })
                }
              >
                <View style={styles.cardTop}>
                  <Text style={styles.date}>
                    {formatDate(run.activityDate)}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      run.status === 'completed'
                        ? styles.completedBadge
                        : styles.otherBadge,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {run.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.mainDistanceRow}>
                  <Text style={styles.distance}>
                    {formatDistance(run.distanceMeters)}
                  </Text>

                  <Text style={styles.km}>KM</Text>
                </View>

                <View style={styles.statsRow}>
                  <SmallStat
                    value={formatDuration(run.durationSeconds)}
                    label="TIME"
                  />

                  <SmallStat
                    value={formatPace(run.averagePaceSecondsPerKm)}
                    label="PACE"
                  />

                  <SmallStat
                    value={`+${run.runningXP}`}
                    label="XP"
                  />
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.points}>
                    {run.route.length} GPS POINTS
                  </Text>

                  <Text style={styles.arrow}>→</Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryValue}>{value}</Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SummaryDivider() {
  return <View style={styles.summaryDivider} />;
}

function SortOptionButton({
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
      style={[
        styles.optionButton,
        active && styles.optionButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionText,
          active && styles.optionTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

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
      style={[
        styles.filterChip,
        active && styles.filterChipActive,
      ]}
      onPress={onPress}
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

function SmallStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.smallStat}>
      <Text style={styles.smallValue}>{value}</Text>

      <Text style={styles.smallLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },

  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 20,
    marginTop: 15,
  },

  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },

  backArrow: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    marginRight: 7,
    lineHeight: 20,
  },

  backText: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 8,
  },

  title: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 24,
    textAlign: 'center',
  },

  subtitle: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 25,
  },

  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },

  summaryValue: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 13,
  },

  summaryLabel: {
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 14,
    marginTop: 5,
  },

  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },

  summaryBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  summaryBottomText: {
    color: colors.textMuted,
    fontFamily: 'VT323',
    fontSize: 12,
  },

  summaryBottomValue: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 15,
    fontWeight: '700',
  },

  searchContainer: {
    position: 'relative',
    marginBottom: 12,
  },

  searchInput: {
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingRight: 42,
    color: colors.text,
    fontFamily: 'VT323',
    fontSize: 18,
  },

  clearSearch: {
    position: 'absolute',
    right: 10,
    top: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearSearchText: {
    color: colors.textSecondary,
    fontSize: 24,
    lineHeight: 24,
  },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },

  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  controlButtonActive: {
    borderColor: colors.primary,
    backgroundColor: '#172712',
  },

  controlText: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 7,
  },

  controlTextActive: {
    color: colors.primary,
  },

  resetButton: {
    marginLeft: 'auto',
    paddingHorizontal: 9,
    paddingVertical: 8,
  },

  resetButtonText: {
    color: '#C77777',
    fontFamily: 'PressStart2P',
    fontSize: 7,
  },

  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
  },

  panelTitle: {
    color: colors.textMuted,
    fontFamily: 'PressStart2P',
    fontSize: 7,
    marginBottom: 10,
  },

  secondPanelTitle: {
    marginTop: 15,
  },

  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  optionButton: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 7,
    backgroundColor: colors.background,
  },

  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: '#172712',
  },

  optionText: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  optionTextActive: {
    color: colors.primary,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },

  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#172712',
  },

  filterChipText: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  filterChipTextActive: {
    color: colors.primary,
  },

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },

  resultsText: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 16,
  },

  filteredText: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 6,
  },

  runCard: {
    backgroundColor: '#181818',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#292929',
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  date: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 19,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },

  completedBadge: {
    backgroundColor: '#1c3016',
  },

  otherBadge: {
    backgroundColor: '#292929',
  },

  statusText: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 7,
  },

  mainDistanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 18,
  },

  distance: {
    color: colors.primary,
    fontFamily: 'PressStart2P',
    fontSize: 34,
  },

  km: {
    color: colors.textSecondary,
    fontFamily: 'PressStart2P',
    fontSize: 12,
    marginBottom: 5,
    marginLeft: 8,
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: 22,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },

  smallStat: {
    flex: 1,
  },

  smallValue: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 12,
  },

  smallLabel: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 14,
    marginTop: 6,
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },

  points: {
    color: '#666666',
    fontFamily: 'VT323',
    fontSize: 15,
  },

  arrow: {
    color: colors.primary,
    fontSize: 25,
  },

  emptyCard: {
    backgroundColor: '#181818',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 15,
  },

  emptyText: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },

  startButton: {
    marginTop: 22,
    backgroundColor: colors.primary,
    paddingHorizontal: 25,
    paddingVertical: 16,
    borderRadius: 12,
  },

  startButtonText: {
    color: '#101010',
    fontFamily: 'PressStart2P',
    fontSize: 11,
  },

  noResultsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 25,
    alignItems: 'center',
    marginTop: 10,
  },

  noResultsTitle: {
    color: colors.text,
    fontFamily: 'PressStart2P',
    fontSize: 13,
  },

  noResultsText: {
    color: colors.textSecondary,
    fontFamily: 'VT323',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },

  resetLargeButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },

  resetLargeText: {
    color: '#101010',
    fontFamily: 'PressStart2P',
    fontSize: 8,
  },
});