import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useRouter,
} from 'expo-router';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useProfile } from '../../context/ProfileContext';

import {
  getDailyNutritionHistory,
} from '../../database/dietHistoryRepository';

import {
  evaluateNutritionForDate,
  evaluatePreviousNutritionDays,
} from '../../services/dietXPService';

import type {
  DailyNutrition,
} from '../../types/diet';

import PixelCard from '../../components/PixelCard';

import {
  colors,
  spacing,
} from '../../constants/theme';


/*
 * ========================================
 * TYPES
 * ========================================
 */

type PeriodFilter =
  | '7D'
  | '30D'
  | '90D';

type GoalFilter =
  | 'ALL'
  | 'ALL_GOALS'
  | 'CALORIES'
  | 'PROTEIN'
  | 'WATER';

type EvaluationFilter =
  | 'ALL'
  | 'EVALUATED'
  | 'PENDING';

type SortOption =
  | 'NEWEST'
  | 'OLDEST'
  | 'CALORIES'
  | 'PROTEIN'
  | 'WATER'
  | 'XP';


/*
 * ========================================
 * DATE
 * ========================================
 */

function formatDate(
  isoDate: string,
): string {
  const [
    year,
    month,
    day,
  ] = isoDate
    .split('-')
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  )
    .toLocaleDateString(
      'en-US',
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    )
    .toUpperCase();
}


function getTodayIso(): string {
  const date = new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, '0');

  const day =
    String(
      date.getDate(),
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


function getDateDaysAgo(
  days: number,
): string {
  const date = new Date();

  date.setDate(
    date.getDate() - days + 1,
  );

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, '0');

  const day =
    String(
      date.getDate(),
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


/*
 * ========================================
 * NUMBER
 * ========================================
 */

function formatNumber(
  value: number,
  decimals = 0,
): string {
  return Number(
    value.toFixed(decimals),
  ).toString();
}


/*
 * ========================================
 * TOTALS
 * ========================================
 */

function getCalories(
  day: DailyNutrition,
): number {
  return day.foods.reduce(
    (
      total,
      food,
    ) =>
      total + food.calories,
    0,
  );
}


function getProtein(
  day: DailyNutrition,
): number {
  return day.foods.reduce(
    (
      total,
      food,
    ) =>
      total + food.protein,
    0,
  );
}


function getCarbs(
  day: DailyNutrition,
): number {
  return day.foods.reduce(
    (
      total,
      food,
    ) =>
      total + food.carbs,
    0,
  );
}


function getFat(
  day: DailyNutrition,
): number {
  return day.foods.reduce(
    (
      total,
      food,
    ) =>
      total + food.fat,
    0,
  );
}


/*
 * ========================================
 * GOAL HELPERS
 * ========================================
 */

function isCaloriesMet(
  day: DailyNutrition,
): boolean {
  return (
    day.calorieGoal > 0 &&
    getCalories(day) >=
      day.calorieGoal
  );
}


function isProteinMet(
  day: DailyNutrition,
): boolean {
  return (
    day.proteinGoal > 0 &&
    getProtein(day) >=
      day.proteinGoal
  );
}


function isWaterMet(
  day: DailyNutrition,
): boolean {
  return (
    day.waterGoal > 0 &&
    day.waterConsumed >=
      day.waterGoal
  );
}


function areAllGoalsMet(
  day: DailyNutrition,
): boolean {
  return (
    isCaloriesMet(day) &&
    isProteinMet(day) &&
    isWaterMet(day)
  );
}


/*
 * ========================================
 * PROGRESS
 * ========================================
 */

function getProgress(
  value: number,
  target: number,
): number {
  if (target <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (value / target) * 100,
    ),
  );
}


/*
 * ========================================
 * MINI PROGRESS
 * ========================================
 */

function MiniProgress({
  value,
  target,
}: {
  value: number;
  target: number;
}) {
  const percent =
    getProgress(
      value,
      target,
    );

  const over =
    target > 0 &&
    value > target;

  return (
    <View
      style={
        styles.miniProgressTrack
      }
    >
      <View
        style={[
          styles.miniProgressFill,
          over &&
            styles.miniProgressOver,
          {
            width:
              `${percent}%`,
          },
        ]}
      />
    </View>
  );
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
      style={({
        pressed,
      }) => [
        styles.filterChip,
        active &&
          styles.filterChipActive,
        pressed &&
          styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          active &&
            styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}


/*
 * ========================================
 * METRIC
 * ========================================
 */

function Metric({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const percent =
    target > 0
      ? (value / target) * 100
      : 0;

  const isOver =
    percent > 100;

  return (
    <View
      style={
        styles.metric
      }
    >
      <View
        style={
          styles.metricTop
        }
      >
        <Text
          style={
            styles.metricLabel
          }
        >
          {label}
        </Text>

        <Text
          style={[
            styles.metricValue,
            isOver &&
              styles.metricValueOver,
          ]}
        >
          {formatNumber(value)}
          {' / '}
          {formatNumber(target)}
          {' '}
          {unit}
        </Text>
      </View>

      <View
        style={
          styles.progressTrack
        }
      >
        <View
          style={[
            styles.progressFill,
            isOver &&
              styles.progressFillOver,
            {
              width:
                `${Math.min(
                  100,
                  Math.max(
                    0,
                    percent,
                  ),
                )}%`,
            },
          ]}
        />
      </View>

      <View
        style={
          styles.metricBottom
        }
      >
        <Text
          style={
            styles.metricPercent
          }
        >
          {formatNumber(percent)}%
        </Text>

        <Text
          style={
            styles.metricTarget
          }
        >
          TARGET
        </Text>
      </View>
    </View>
  );
}


/*
 * ========================================
 * HISTORY CARD
 * ========================================
 */

function HistoryCard({
  day,
  expanded,
  onToggle,
  onEvaluate,
}: {
  day: DailyNutrition;
  expanded: boolean;
  onToggle: () => void;
  onEvaluate: (
    activityDate: string,
  ) => void;
}) {
  const calories =
    getCalories(day);

  const protein =
    getProtein(day);

  const carbs =
    getCarbs(day);

  const fat =
    getFat(day);

  const caloriesMet =
    isCaloriesMet(day);

  const proteinMet =
    isProteinMet(day);

  const waterMet =
    isWaterMet(day);

  const allGoalsMet =
    areAllGoalsMet(day);

  return (
    <PixelCard
      style={
        styles.card
      }
    >

      {/* ==================================
          COMPACT HEADER
          ================================== */}

      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={
          `${formatDate(
            day.activityDate,
          )} nutrition history`
        }
        style={({
          pressed,
        }) => [
          styles.cardHeader,
          pressed &&
            styles.cardHeaderPressed,
        ]}
      >

        <View
          style={
            styles.dateContainer
          }
        >

          <Text
            style={
              styles.date
            }
          >
            {formatDate(
              day.activityDate,
            )}
          </Text>

          <View
            style={
              styles.headerMeta
            }
          >
            <Text
              style={
                styles.foodCount
              }
            >
              {day.foods.length}
              {' '}
              {day.foods.length === 1
                ? 'FOOD'
                : 'FOODS'}
            </Text>

            <Text
              style={
                styles.headerDot
              }
            >
              •
            </Text>

            <Text
              style={
                styles.statusText
              }
            >
              {allGoalsMet
                ? 'GOALS MET'
                : 'IN PROGRESS'}
            </Text>
          </View>

        </View>


        <View
          style={
            styles.headerRight
          }
        >

          <View
            style={
              styles.xpBox
            }
          >
            <Text
              style={
                styles.xpValue
              }
            >
              +{day.nutritionXP}
            </Text>

            <Text
              style={
                styles.xpLabel
              }
            >
              XP
            </Text>
          </View>

          <Text
            style={
              styles.expandIcon
            }
          >
            {expanded
              ? '−'
              : '+'}
          </Text>

        </View>

      </Pressable>


      {/* ==================================
          QUICK SUMMARY
          ================================== */}

      <View
        style={
          styles.summaryGrid
        }
      >

        <View
          style={
            styles.summaryItem
          }
        >
          <Text
            style={
              styles.summaryLabel
            }
          >
            CAL
          </Text>

          <Text
            style={
              styles.summaryValue
            }
          >
            {formatNumber(
              calories,
            )}
          </Text>

          <Text
            style={
              caloriesMet
                ? styles.summaryGoalMet
                : styles.summaryGoalMiss
            }
          >
            / {formatNumber(
              day.calorieGoal,
            )}
          </Text>

          <MiniProgress
            value={
              calories
            }
            target={
              day.calorieGoal
            }
          />
        </View>


        <View
          style={
            styles.summaryItem
          }
        >
          <Text
            style={
              styles.summaryLabel
            }
          >
            PROTEIN
          </Text>

          <Text
            style={
              styles.summaryValue
            }
          >
            {formatNumber(
              protein,
            )}
          </Text>

          <Text
            style={
              proteinMet
                ? styles.summaryGoalMet
                : styles.summaryGoalMiss
            }
          >
            / {formatNumber(
              day.proteinGoal,
            )}G
          </Text>

          <MiniProgress
            value={
              protein
            }
            target={
              day.proteinGoal
            }
          />
        </View>


        <View
          style={
            styles.summaryItem
          }
        >
          <Text
            style={
              styles.summaryLabel
            }
          >
            WATER
          </Text>

          <Text
            style={
              styles.summaryValue
            }
          >
            {formatNumber(
              day.waterConsumed,
              1,
            )}
          </Text>

          <Text
            style={
              waterMet
                ? styles.summaryGoalMet
                : styles.summaryGoalMiss
            }
          >
            / {formatNumber(
              day.waterGoal,
              1,
            )}L
          </Text>

          <MiniProgress
            value={
              day.waterConsumed
            }
            target={
              day.waterGoal
            }
          />
        </View>

      </View>


      {/* ==================================
          EXPANDED CONTENT
          ================================== */}

      {expanded && (

        <View
          style={
            styles.expandedSection
          }
        >

          {/* ==================================
              GOAL METRICS
              ================================== */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            GOAL PROGRESS
          </Text>

          <Metric
            label="CALORIES"
            value={
              calories
            }
            target={
              day.calorieGoal
            }
            unit="KCAL"
          />

          <Metric
            label="PROTEIN"
            value={
              protein
            }
            target={
              day.proteinGoal
            }
            unit="G"
          />

          <Metric
            label="WATER"
            value={
              day.waterConsumed
            }
            target={
              day.waterGoal
            }
            unit="L"
          />


          {/* ==================================
              MACROS
              ================================== */}

          <View
            style={
              styles.macroRow
            }
          >

            <View
              style={
                styles.macro
              }
            >
              <Text
                style={
                  styles.macroLabel
                }
              >
                CARBS
              </Text>

              <Text
                style={
                  styles.macroValue
                }
              >
                {formatNumber(
                  carbs,
                )}G
              </Text>
            </View>


            <View
              style={
                styles.macro
              }
            >
              <Text
                style={
                  styles.macroLabel
                }
              >
                FAT
              </Text>

              <Text
                style={
                  styles.macroValue
                }
              >
                {formatNumber(
                  fat,
                )}G
              </Text>
            </View>


            <View
              style={
                styles.macro
              }
            >
              <Text
                style={
                  styles.macroLabel
                }
              >
                STATUS
              </Text>

              <Text
                style={[
                  styles.macroValue,
                  day.evaluated
                    ? styles.evaluated
                    : styles.pending,
                ]}
              >
                {day.evaluated
                  ? 'DONE'
                  : 'PENDING'}
              </Text>
            </View>

          </View>


          {/* ==================================
              FOOD LOG
              ================================== */}

          <View
            style={
              styles.foodSection
            }
          >

            <View
              style={
                styles.sectionHeader
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                FOOD LOG
              </Text>

              <Text
                style={
                  styles.sectionCount
                }
              >
                {day.foods.length}
              </Text>
            </View>


            {day.foods.length === 0 ? (

              <Text
                style={
                  styles.emptyFood
                }
              >
                NO FOOD RECORDED.
              </Text>

            ) : (

              day.foods.map(
                food => (

                  <View
                    key={
                      food.id
                    }
                    style={
                      styles.foodRow
                    }
                  >

                    <View
                      style={
                        styles.foodInfo
                      }
                    >
                      <Text
                        style={
                          styles.foodName
                        }
                      >
                        {food.foodName}
                      </Text>

                      <Text
                        style={
                          styles.foodQuantity
                        }
                      >
                        {formatNumber(
                          food.quantity,
                          2,
                        )}
                        {' '}
                        {food.unit}
                      </Text>
                    </View>


                    <View
                      style={
                        styles.foodStats
                      }
                    >
                      <Text
                        style={
                          styles.foodCalories
                        }
                      >
                        {formatNumber(
                          food.calories,
                        )}
                        {' '}
                        KCAL
                      </Text>

                      <Text
                        style={
                          styles.foodProtein
                        }
                      >
                        {formatNumber(
                          food.protein,
                        )}
                        G PROTEIN
                      </Text>
                    </View>

                  </View>

                ),
              )

            )}

          </View>


          {/* ==================================
              DEV EVALUATION
              ================================== */}

          {!day.evaluated && (

            <Pressable
              onPress={() =>
                onEvaluate(
                  day.activityDate,
                )
              }
              accessibilityRole="button"
              accessibilityLabel={
                `Evaluate nutrition for ${day.activityDate}`
              }
              style={({
                pressed,
              }) => [
                styles.devEvaluateButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text
                style={
                  styles.devEvaluateButtonText
                }
              >
                DEV: EVALUATE DAY
              </Text>
            </Pressable>

          )}

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

export default function DietHistoryScreen() {

  const router =
    useRouter();

  const insets =
    useSafeAreaInsets();


  const {
    profile,
    isLoading:
      profileLoading,
  } =
    useProfile();


  const profileId =
    profile?.id ??
    null;


  /*
   * ======================================
   * DATA STATE
   * ======================================
   */

  const [
    history,
    setHistory,
  ] =
    useState<
      DailyNutrition[]
    >([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);


  /*
   * ======================================
   * FILTER STATE
   * ======================================
   */

  const [
    periodFilter,
    setPeriodFilter,
  ] =
    useState<PeriodFilter>(
      '30D',
    );


  const [
    goalFilter,
    setGoalFilter,
  ] =
    useState<GoalFilter>(
      'ALL',
    );


  const [
    evaluationFilter,
    setEvaluationFilter,
  ] =
    useState<EvaluationFilter>(
      'ALL',
    );


  const [
    sortOption,
    setSortOption,
  ] =
    useState<SortOption>(
      'NEWEST',
    );


  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState('');


  const [
    filtersOpen,
    setFiltersOpen,
  ] =
    useState(false);


  const [
    expandedId,
    setExpandedId,
  ] =
    useState<string | null>(
      null,
    );


  /*
   * ======================================
   * LOAD HISTORY
   * ======================================
   */

  const loadHistory =
    useCallback(
      async () => {

        if (!profileId) {

          setHistory([]);

          setLoading(false);

          return;
        }


        try {

          /*
           * Evaluate pending days first.
           */

          await evaluatePreviousNutritionDays(
            profileId,
          );


          /*
           * Keep loading the existing
           * 90-day history source.
           */

          const result =
            await getDailyNutritionHistory(
              profileId,
              90,
            );


          setHistory(
            result,
          );

        } catch (error) {

          console.error(
            '[DIET HISTORY] Failed to load:',
            error,
          );

        } finally {

          setLoading(false);

          setRefreshing(false);

        }

      },
      [
        profileId,
      ],
    );


  /*
   * ======================================
   * RELOAD ON FOCUS
   * ======================================
   */

  useFocusEffect(
    useCallback(
      () => {
        loadHistory();
      },
      [
        loadHistory,
      ],
    ),
  );


  /*
   * ======================================
   * REFRESH
   * ======================================
   */

  async function refresh() {

    setRefreshing(
      true,
    );

    await loadHistory();

  }


  /*
   * ======================================
   * DEV EVALUATION
   * ======================================
   */

  async function evaluateDayAsDev(
    activityDate: string,
  ) {

    if (!profileId) {
      return;
    }


    try {

      const result =
        await evaluateNutritionForDate(
          profileId,
          activityDate,
        );


      console.log(
        '[DIET HISTORY] Evaluation result:',
        result,
      );


      await loadHistory();

    } catch (error) {

      console.error(
        '[DIET HISTORY] Evaluation failed:',
        error,
      );

    }

  }


  /*
   * ======================================
   * FILTER + SORT
   * ======================================
   */

  const filteredHistory =
    useMemo(() => {

      const today =
        getTodayIso();

      let result =
        [...history];


      /*
       * PERIOD
       */

      const periodDays =
        periodFilter === '7D'
          ? 7
          : periodFilter === '30D'
            ? 30
            : 90;

      const startDate =
        getDateDaysAgo(
          periodDays,
        );


      result =
        result.filter(
          day =>
            day.activityDate >=
              startDate &&
            day.activityDate <=
              today,
        );


      /*
       * GOAL FILTER
       */

      result =
        result.filter(
          day => {

            switch (
              goalFilter
            ) {

              case 'ALL':
                return true;

              case 'ALL_GOALS':
                return areAllGoalsMet(
                  day,
                );

              case 'CALORIES':
                return isCaloriesMet(
                  day,
                );

              case 'PROTEIN':
                return isProteinMet(
                  day,
                );

              case 'WATER':
                return isWaterMet(
                  day,
                );

              default:
                return true;

            }

          },
        );


      /*
       * EVALUATION FILTER
       */

      result =
        result.filter(
          day => {

            switch (
              evaluationFilter
            ) {

              case 'ALL':
                return true;

              case 'EVALUATED':
                return day.evaluated;

              case 'PENDING':
                return !day.evaluated;

              default:
                return true;

            }

          },
        );


      /*
       * SEARCH
       */

      const normalizedSearch =
        searchQuery
          .trim()
          .toLowerCase();


      if (
        normalizedSearch
      ) {

        result =
          result.filter(
            day =>
              day.foods.some(
                food =>
                  food.foodName
                    .toLowerCase()
                    .includes(
                      normalizedSearch,
                    ),
              ),
          );

      }


      /*
       * SORT
       */

      result.sort(
        (
          first,
          second,
        ) => {

          switch (
            sortOption
          ) {

            case 'NEWEST':
              return second.activityDate.localeCompare(
                first.activityDate,
              );

            case 'OLDEST':
              return first.activityDate.localeCompare(
                second.activityDate,
              );

            case 'CALORIES':
              return (
                getCalories(
                  second,
                ) -
                getCalories(
                  first,
                )
              );

            case 'PROTEIN':
              return (
                getProtein(
                  second,
                ) -
                getProtein(
                  first,
                )
              );

            case 'WATER':
              return (
                second.waterConsumed -
                first.waterConsumed
              );

            case 'XP':
              return (
                second.nutritionXP -
                first.nutritionXP
              );

            default:
              return 0;

          }

        },
      );


      return result;

    }, [
      history,
      periodFilter,
      goalFilter,
      evaluationFilter,
      sortOption,
      searchQuery,
    ]);


  /*
   * ======================================
   * FILTER SUMMARY
   * ======================================
   */

  const filteredStats =
    useMemo(() => {

      let calories = 0;
      let protein = 0;
      let water = 0;
      let xp = 0;


      for (
        const day
        of filteredHistory
      ) {

        calories +=
          getCalories(day);

        protein +=
          getProtein(day);

        water +=
          day.waterConsumed;

        xp +=
          day.nutritionXP;

      }


      return {
        calories,
        protein,
        water,
        xp,
      };

    }, [
      filteredHistory,
    ]);


  /*
   * ======================================
   * ACTIVE FILTER COUNT
   * ======================================
   */

  const activeFilterCount =
    (
      periodFilter !== '30D'
        ? 1
        : 0
    ) +
    (
      goalFilter !== 'ALL'
        ? 1
        : 0
    ) +
    (
      evaluationFilter !== 'ALL'
        ? 1
        : 0
    ) +
    (
      searchQuery.trim()
        ? 1
        : 0
    );


  /*
   * ======================================
   * CLEAR FILTERS
   * ======================================
   */

  function clearFilters() {

    setPeriodFilter(
      '30D',
    );

    setGoalFilter(
      'ALL',
    );

    setEvaluationFilter(
      'ALL',
    );

    setSearchQuery('');

  }


  /*
   * ======================================
   * LOADING
   * ======================================
   */

  if (
    profileLoading ||
    loading
  ) {

    return (
      <View
        style={
          styles.center
        }
      >

        <ActivityIndicator
          size="small"
          color={
            colors.primary
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          LOADING HISTORY...
        </Text>

      </View>
    );

  }


  /*
   * ======================================
   * SCREEN
   * ======================================
   */

  return (
    <ScrollView
      style={
        styles.container
      }

      contentContainerStyle={[
        styles.content,
        {
          paddingTop:
            insets.top +
            spacing.lg,
        },
      ]}

      showsVerticalScrollIndicator={
        false
      }

      refreshControl={
        <RefreshControl
          refreshing={
            refreshing
          }
          onRefresh={
            refresh
          }
          tintColor={
            colors.primary
          }
          colors={[
            colors.primary,
          ]}
          progressBackgroundColor={
            colors.surface
          }
        />
      }
    >

      {/* ==================================
          HEADER
          ================================== */}

      <View
        style={
          styles.header
        }
      >

        <View
          style={
            styles.headerLeft
          }
        >

          <Pressable
            onPress={() =>
              router.back()
            }
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({
              pressed,
            }) => [
              styles.backButton,
              pressed &&
                styles.buttonPressed,
            ]}
          >
            <Text
              style={
                styles.backText
              }
            >
              ‹
            </Text>
          </Pressable>


          <View>
            <Text
              style={
                styles.smallText
              }
            >
              DIET
            </Text>

            <Text
              style={
                styles.title
              }
            >
              HISTORY
            </Text>
          </View>

        </View>

      </View>


      {/* ==================================
          SUMMARY
          ================================== */}

      <PixelCard
        style={
          styles.overviewCard
        }
      >

        <View
          style={
            styles.overviewHeader
          }
        >

          <View>
            <Text
              style={
                styles.overviewTitle
              }
            >
              NUTRITION LOG
            </Text>

            <Text
              style={
                styles.overviewSubtitle
              }
            >
              {filteredHistory.length}
              {' '}
              {filteredHistory.length === 1
                ? 'DAY'
                : 'DAYS'}
              {' '}
              SHOWN
            </Text>
          </View>


          <Text
            style={
              styles.overviewXP
            }
          >
            +{filteredStats.xp} XP
          </Text>

        </View>


        <View
          style={
            styles.overviewStats
          }
        >

          <View
            style={
              styles.overviewStat
            }
          >
            <Text
              style={
                styles.overviewStatLabel
              }
            >
              KCAL
            </Text>

            <Text
              style={
                styles.overviewStatValue
              }
            >
              {formatNumber(
                filteredStats.calories,
              )}
            </Text>
          </View>


          <View
            style={
              styles.overviewDivider
            }
          />


          <View
            style={
              styles.overviewStat
            }
          >
            <Text
              style={
                styles.overviewStatLabel
              }
            >
              PROTEIN
            </Text>

            <Text
              style={
                styles.overviewStatValue
              }
            >
              {formatNumber(
                filteredStats.protein,
              )}G
            </Text>
          </View>


          <View
            style={
              styles.overviewDivider
            }
          />


          <View
            style={
              styles.overviewStat
            }
          >
            <Text
              style={
                styles.overviewStatLabel
              }
            >
              WATER
            </Text>

            <Text
              style={
                styles.overviewStatValue
              }
            >
              {formatNumber(
                filteredStats.water,
                1,
              )}L
            </Text>
          </View>

        </View>

      </PixelCard>


      {/* ==================================
          SEARCH
          ================================== */}

      <View
        style={
          styles.searchContainer
        }
      >

        <Text
          style={
            styles.searchIcon
          }
        >
          /
        </Text>

        <TextInput
          value={
            searchQuery
          }
          onChangeText={
            setSearchQuery
          }
          placeholder="SEARCH FOOD..."
          placeholderTextColor={
            colors.textMuted
          }
          autoCapitalize="none"
          style={
            styles.searchInput
          }
        />

        {searchQuery.length > 0 && (

          <Pressable
            onPress={() =>
              setSearchQuery('')
            }
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={
              styles.clearSearch
            }
          >
            <Text
              style={
                styles.clearSearchText
              }
            >
              ×
            </Text>
          </Pressable>

        )}

      </View>


      {/* ==================================
          FILTER HEADER
          ================================== */}

      <View
        style={
          styles.filterHeader
        }
      >

        <Pressable
          onPress={() =>
            setFiltersOpen(
              previous =>
                !previous,
            )
          }
          accessibilityRole="button"
          style={({
            pressed,
          }) => [
            styles.filterButton,
            filtersOpen &&
              styles.filterButtonActive,
            pressed &&
              styles.buttonPressed,
          ]}
        >

          <Text
            style={
              styles.filterButtonText
            }
          >
            FILTERS
          </Text>

          {activeFilterCount > 0 && (

            <View
              style={
                styles.filterBadge
              }
            >
              <Text
                style={
                  styles.filterBadgeText
                }
              >
                {activeFilterCount}
              </Text>
            </View>

          )}

          <Text
            style={
              styles.filterArrow
            }
          >
            {filtersOpen
              ? '−'
              : '+'}
          </Text>

        </Pressable>


        <View
          style={
            styles.resultCount
          }
        >
          <Text
            style={
              styles.resultCountText
            }
          >
            {filteredHistory.length}
            {' '}
            RESULTS
          </Text>
        </View>

      </View>


      {/* ==================================
          FILTER PANEL
          ================================== */}

      {filtersOpen && (

        <PixelCard
          style={
            styles.filterPanel
          }
        >

          {/* PERIOD */}

          <Text
            style={
              styles.filterTitle
            }
          >
            TIME RANGE
          </Text>

          <View
            style={
              styles.chipRow
            }
          >

            <FilterChip
              label="7 DAYS"
              active={
                periodFilter === '7D'
              }
              onPress={() =>
                setPeriodFilter(
                  '7D',
                )
              }
            />

            <FilterChip
              label="30 DAYS"
              active={
                periodFilter === '30D'
              }
              onPress={() =>
                setPeriodFilter(
                  '30D',
                )
              }
            />

            <FilterChip
              label="90 DAYS"
              active={
                periodFilter === '90D'
              }
              onPress={() =>
                setPeriodFilter(
                  '90D',
                )
              }
            />

          </View>


          {/* GOALS */}

          <Text
            style={
              styles.filterTitle
            }
          >
            GOAL FILTER
          </Text>

          <View
            style={
              styles.chipRow
            }
          >

            <FilterChip
              label="ALL"
              active={
                goalFilter === 'ALL'
              }
              onPress={() =>
                setGoalFilter(
                  'ALL',
                )
              }
            />

            <FilterChip
              label="ALL GOALS"
              active={
                goalFilter === 'ALL_GOALS'
              }
              onPress={() =>
                setGoalFilter(
                  'ALL_GOALS',
                )
              }
            />

            <FilterChip
              label="CALORIES"
              active={
                goalFilter === 'CALORIES'
              }
              onPress={() =>
                setGoalFilter(
                  'CALORIES',
                )
              }
            />

            <FilterChip
              label="PROTEIN"
              active={
                goalFilter === 'PROTEIN'
              }
              onPress={() =>
                setGoalFilter(
                  'PROTEIN',
                )
              }
            />

            <FilterChip
              label="WATER"
              active={
                goalFilter === 'WATER'
              }
              onPress={() =>
                setGoalFilter(
                  'WATER',
                )
              }
            />

          </View>


          {/* EVALUATION */}

          <Text
            style={
              styles.filterTitle
            }
          >
            EVALUATION
          </Text>

          <View
            style={
              styles.chipRow
            }
          >

            <FilterChip
              label="ALL"
              active={
                evaluationFilter === 'ALL'
              }
              onPress={() =>
                setEvaluationFilter(
                  'ALL',
                )
              }
            />

            <FilterChip
              label="EVALUATED"
              active={
                evaluationFilter ===
                'EVALUATED'
              }
              onPress={() =>
                setEvaluationFilter(
                  'EVALUATED',
                )
              }
            />

            <FilterChip
              label="PENDING"
              active={
                evaluationFilter ===
                'PENDING'
              }
              onPress={() =>
                setEvaluationFilter(
                  'PENDING',
                )
              }
            />

          </View>


          {/* CLEAR */}

          {activeFilterCount > 0 && (

            <Pressable
              onPress={
                clearFilters
              }
              accessibilityRole="button"
              style={({
                pressed,
              }) => [
                styles.clearFiltersButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text
                style={
                  styles.clearFiltersText
                }
              >
                CLEAR FILTERS
              </Text>
            </Pressable>

          )}

        </PixelCard>

      )}


      {/* ==================================
          SORT
          ================================== */}

      <View
        style={
          styles.sortSection
        }
      >

        <Text
          style={
            styles.sortLabel
          }
        >
          SORT BY
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.sortScroll
          }
        >

          <FilterChip
            label="NEWEST"
            active={
              sortOption === 'NEWEST'
            }
            onPress={() =>
              setSortOption(
                'NEWEST',
              )
            }
          />

          <FilterChip
            label="OLDEST"
            active={
              sortOption === 'OLDEST'
            }
            onPress={() =>
              setSortOption(
                'OLDEST',
              )
            }
          />

          <FilterChip
            label="CALORIES"
            active={
              sortOption === 'CALORIES'
            }
            onPress={() =>
              setSortOption(
                'CALORIES',
              )
            }
          />

          <FilterChip
            label="PROTEIN"
            active={
              sortOption === 'PROTEIN'
            }
            onPress={() =>
              setSortOption(
                'PROTEIN',
              )
            }
          />

          <FilterChip
            label="WATER"
            active={
              sortOption === 'WATER'
            }
            onPress={() =>
              setSortOption(
                'WATER',
              )
            }
          />

          <FilterChip
            label="XP"
            active={
              sortOption === 'XP'
            }
            onPress={() =>
              setSortOption(
                'XP',
              )
            }
          />

        </ScrollView>

      </View>


      {/* ==================================
          HISTORY
          ================================== */}

      {filteredHistory.length === 0 ? (

        <PixelCard
          style={
            styles.emptyContainer
          }
        >

          <Text
            style={
              styles.emptyIcon
            }
          >
            ◈
          </Text>

          <Text
            style={
              styles.emptyTitle
            }
          >
            NO MATCHES
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            NO NUTRITION DAYS
            {'\n'}
            MATCH YOUR CURRENT
            {'\n'}
            FILTERS.
          </Text>

          {activeFilterCount > 0 && (

            <Pressable
              onPress={
                clearFilters
              }
              accessibilityRole="button"
              style={({
                pressed,
              }) => [
                styles.emptyButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text
                style={
                  styles.emptyButtonText
                }
              >
                CLEAR FILTERS
              </Text>
            </Pressable>

          )}

        </PixelCard>

      ) : (

        filteredHistory.map(
          day => (

            <HistoryCard
              key={
                day.id
              }
              day={
                day
              }
              expanded={
                expandedId ===
                day.id
              }
              onToggle={() =>
                setExpandedId(
                  current =>
                    current ===
                    day.id
                      ? null
                      : day.id,
                )
              }
              onEvaluate={
                evaluateDayAsDev
              }
            />

          ),
        )

      )}

    </ScrollView>
  );
}


/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        colors.background,
    },


    content: {
      padding:
        spacing.lg,
      paddingBottom:
        spacing.xxxl,
    },


    center: {
      flex: 1,
      backgroundColor:
        colors.background,
      alignItems:
        'center',
      justifyContent:
        'center',
    },


    loadingText: {
      color:
        colors.textSecondary,
      fontFamily:
        'VT323',
      fontSize: 18,
      marginTop:
        spacing.sm,
    },


    buttonPressed: {
      opacity: 0.65,
      transform: [
        {
          translateY: 2,
        },
      ],
    },


    /*
     * ====================================
     * HEADER
     * ====================================
     */

    header: {
      marginBottom:
        spacing.lg,
    },


    headerLeft: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },


    backButton: {
      width: 40,
      height: 40,
      borderWidth: 2,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surface,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight:
        spacing.sm,
    },


    backText: {
      color:
        colors.primary,
      fontFamily:
        'VT323',
      fontSize: 31,
      lineHeight: 31,
    },


    smallText: {
      fontFamily:
        'PressStart2P',
      fontSize: 9,
      color:
        colors.primary,
      marginBottom:
        spacing.sm,
    },


    title: {
      fontFamily:
        'PressStart2P',
      fontSize: 16,
      color:
        colors.text,
    },


    /*
     * ====================================
     * OVERVIEW
     * ====================================
     */

    overviewCard: {
      marginBottom:
        spacing.md,
    },


    overviewHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginBottom:
        spacing.lg,
    },


    overviewTitle: {
      color:
        colors.text,
      fontFamily:
        'PressStart2P',
      fontSize: 9,
    },


    overviewSubtitle: {
      color:
        colors.textSecondary,
      fontFamily:
        'VT323',
      fontSize: 16,
      marginTop:
        spacing.xs,
    },


    overviewXP: {
      color:
        colors.primary,
      fontFamily:
        'VT323',
      fontSize: 22,
    },


    overviewStats: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },


    overviewStat: {
      flex: 1,
    },


    overviewStatLabel: {
      color:
        colors.textMuted,
      fontFamily:
        'PressStart2P',
      fontSize: 6,
      marginBottom:
        spacing.xs,
    },


    overviewStatValue: {
      color:
        colors.text,
      fontFamily:
        'VT323',
      fontSize: 21,
    },


    overviewDivider: {
      width: 1,
      height: 32,
      backgroundColor:
        colors.border,
      marginHorizontal:
        spacing.sm,
    },


    /*
     * ====================================
     * SEARCH
     * ====================================
     */

    searchContainer: {
      minHeight: 46,
      flexDirection:
        'row',
      alignItems:
        'center',
      borderWidth: 2,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surface,
      paddingHorizontal:
        spacing.md,
      marginBottom:
        spacing.md,
    },


    searchIcon: {
      color:
        colors.primary,
      fontFamily:
        'VT323',
      fontSize: 24,
      marginRight:
        spacing.sm,
    },


    searchInput: {
      flex: 1,
      color:
        colors.text,
      fontFamily:
        'VT323',
      fontSize: 18,
      paddingVertical:
        spacing.sm,
    },


    clearSearch: {
      width: 28,
      height: 28,
      alignItems:
        'center',
      justifyContent:
        'center',
    },


    clearSearchText: {
      color:
        colors.textSecondary,
      fontFamily:
        'VT323',
      fontSize: 25,
    },


    /*
     * ====================================
     * FILTER HEADER
     * ====================================
     */

    filterHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginBottom:
        spacing.sm,
    },


    filterButton: {
      minHeight: 38,
      flexDirection:
        'row',
      alignItems:
        'center',
      borderWidth: 2,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surface,
      paddingHorizontal:
        spacing.md,
    },


    filterButtonActive: {
      borderColor:
        colors.primary,
    },


    filterButtonText: {
      color:
        colors.textSecondary,
      fontFamily:
        'PressStart2P',
      fontSize: 7,
    },


    filterBadge: {
      minWidth: 20,
      height: 20,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        colors.primary,
      marginLeft:
        spacing.sm,
    },


    filterBadgeText: {
      color:
        colors.background,
      fontFamily:
        'PressStart2P',
      fontSize: 7,
    },


    filterArrow: {
      color:
        colors.primary,
      fontFamily:
        'VT323',
      fontSize: 22,
      marginLeft:
        spacing.sm,
    },


    resultCount: {
      flex: 1,
      alignItems:
        'flex-end',
    },


    resultCountText: {
      color:
        colors.textMuted,
      fontFamily:
        'VT323',
      fontSize: 15,
    },


    /*
     * ====================================
     * FILTER PANEL
     * ====================================
     */

    filterPanel: {
      marginBottom:
        spacing.md,
    },


    filterTitle: {
      color:
        colors.textSecondary,
      fontFamily:
        'PressStart2P',
      fontSize: 7,
      marginBottom:
        spacing.sm,
    },


    chipRow: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      marginBottom:
        spacing.lg,
    },


    filterChip: {
      minHeight: 34,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.background,
      paddingHorizontal:
        spacing.sm,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight:
        spacing.xs,
      marginBottom:
        spacing.xs,
    },


    filterChipActive: {
      borderColor:
        colors.primary,
      backgroundColor:
        colors.primary,
    },


    filterChipText: {
      color:
        colors.textSecondary,
      fontFamily:
        'PressStart2P',
      fontSize: 6,
    },


    filterChipTextActive: {
      color:
        colors.background,
    },


    clearFiltersButton: {
      minHeight: 38,
      borderWidth: 1,
      borderColor:
        colors.borderStrong,
      alignItems:
        'center',
      justifyContent:
        'center',
    },


    clearFiltersText: {
      color:
        colors.primary,
      fontFamily:
        'PressStart2P',
      fontSize: 6,
    },


    /*
     * ====================================
     * SORT
     * ====================================
     */

    sortSection: {
      marginBottom:
        spacing.lg,
    },


    sortLabel: {
      color:
        colors.textMuted,
      fontFamily:
        'PressStart2P',
      fontSize: 7,
      marginBottom:
        spacing.sm,
    },


    sortScroll: {
      paddingRight:
        spacing.lg,
    },


    /*
     * ====================================
     * HISTORY CARD
     * ====================================
     */

    card: {
      marginBottom:
        spacing.md,
    },


    cardHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      minHeight: 48,
    },


    cardHeaderPressed: {
      opacity: 0.7,
    },


    dateContainer: {
      flex: 1,
      marginRight:
        spacing.sm,
    },


    date: {
      color:
        colors.text,
      fontFamily:
        'PressStart2P',
      fontSize: 8,
      lineHeight: 15,
    },


    headerMeta: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop:
        spacing.xs,
    },


    foodCount: {
      color:
        colors.textSecondary,
      fontFamily:
        'VT323',
      fontSize: 15,
    },


    headerDot: {
      color:
        colors.textMuted,
      fontFamily:
        'VT323',
      fontSize: 15,
      marginHorizontal:
        spacing.xs,
    },


    statusText: {
      color:
        colors.primary,
      fontFamily:
        'VT323',
      fontSize: 15,
    },


    headerRight: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },


    xpBox: {
      minWidth: 56,
      paddingVertical:
        spacing.xs,
      paddingHorizontal:
        spacing.sm,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.background,
      alignItems:
        'center',
    },


    xpValue: {
      color:
        colors.primary,
      fontFamily:
        'VT323',
      fontSize: 19,
      lineHeight: 19,
    },


    xpLabel: {
      color:
        colors.textMuted,
      fontFamily:
        'PressStart2P',
      fontSize: 5,
      marginTop: 1,
    },


    expandIcon: {
      width: 26,
      color:
        colors.primary,
      fontFamily:
        'VT323',
      fontSize: 24,
      textAlign:
        'right',
      marginLeft:
        spacing.xs,
    },


    /*
     * ====================================
     * SUMMARY GRID
     * ====================================
     */

    summaryGrid: {
      flexDirection:
        'row',
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
      marginTop:
        spacing.md,
      paddingTop:
        spacing.md,
    },


    summaryItem: {
      flex: 1,
      marginRight:
        spacing.sm,
    },


    summaryLabel: {
      color:
        colors.textMuted,
      fontFamily:
        'PressStart2P',
      fontSize: 5,
      marginBottom:
        2,
    },


    summaryValue: {
      color:
        colors.text,
      fontFamily:
        'VT323',
      fontSize: 18,
    },


    summaryGoalMet: {
      color:
        colors.primary,
      fontFamily:
        'VT323',
      fontSize: 14,
    },


    summaryGoalMiss: {
      color:
        colors.textMuted,
      fontFamily:
        'VT323',
      fontSize: 14,
    },


    miniProgressTrack: {
      height: 4,
      backgroundColor:
        colors.background,
      borderWidth: 1,
      borderColor:
        colors.border,
      marginTop:
        3,
      overflow:
        'hidden',
    },


    miniProgressFill: {
      height:
        '100%',
      backgroundColor:
        colors.primary,
    },


    miniProgressOver: {
      backgroundColor:
        colors.warning,
    },


    /*
     * ====================================
     * EXPANDED SECTION
     * ====================================
     */

    expandedSection: {
      marginTop:
        spacing.lg,
      paddingTop:
        spacing.lg,
      borderTopWidth: 2,
      borderTopColor:
        colors.border,
    },


    sectionHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginBottom:
        spacing.sm,
    },


    sectionTitle: {
      color:
        colors.textSecondary,
      fontFamily:
        'PressStart2P',
      fontSize: 7,
      marginBottom:
        spacing.sm,
    },


    sectionCount: {
      minWidth: 22,
      height: 22,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        colors.background,
      borderWidth: 1,
      borderColor:
        colors.border,
      color:
        colors.primary,
      fontFamily:
        'VT323',
      fontSize: 16,
      textAlign:
        'center',
    },


    /*
     * ====================================
     * METRICS
     * ====================================
     */

    metric: {
      marginBottom:
        spacing.md,
    },


    metricTop: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginBottom:
        spacing.xs,
    },


    metricLabel: {
      color:
        colors.textSecondary,
      fontFamily:
        'PressStart2P',
      fontSize: 6,
    },


    metricValue: {
      color:
        colors.text,
      fontFamily:
        'VT323',
      fontSize: 17,
      fontVariant:
        ['tabular-nums'],
    },


    metricValueOver: {
      color:
        colors.warning,
    },


    progressTrack: {
      height: 7,
      backgroundColor:
        colors.background,
      borderWidth: 1,
      borderColor:
        colors.border,
      overflow:
        'hidden',
    },


    progressFill: {
      height:
        '100%',
      backgroundColor:
        colors.primary,
    },


    progressFillOver: {
      backgroundColor:
        colors.warning,
    },


    metricBottom: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginTop:
        2,
    },


    metricPercent: {
      color:
        colors.primary,
      fontFamily:
        'VT323',
      fontSize: 14,
    },


    metricTarget: {
      color:
        colors.textMuted,
      fontFamily:
        'VT323',
      fontSize: 13,
    },


    /*
     * ====================================
     * MACROS
     * ====================================
     */

    macroRow: {
      flexDirection:
        'row',
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
      paddingTop:
        spacing.md,
      marginTop:
        spacing.xs,
    },


    macro: {
      flex: 1,
    },


    macroLabel: {
      color:
        colors.textMuted,
      fontFamily:
        'PressStart2P',
      fontSize: 5,
    },


    macroValue: {
      color:
        colors.text,
      fontFamily:
        'VT323',
      fontSize: 16,
      marginTop:
        spacing.xs,
    },


    evaluated: {
      color:
        colors.primary,
      fontSize: 13,
    },


    pending: {
      color:
        colors.warning,
      fontSize: 13,
    },


    /*
     * ====================================
     * FOOD LOG
     * ====================================
     */

    foodSection: {
      marginTop:
        spacing.lg,
      paddingTop:
        spacing.md,
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
    },


    foodRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingVertical:
        spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.border,
    },


    foodInfo: {
      flex: 1,
      marginRight:
        spacing.sm,
    },


    foodName: {
      color:
        colors.text,
      fontFamily:
        'PressStart2P',
      fontSize: 6,
      lineHeight: 12,
    },


    foodQuantity: {
      color:
        colors.textSecondary,
      fontFamily:
        'VT323',
      fontSize: 14,
      marginTop: 2,
    },


    foodStats: {
      alignItems:
        'flex-end',
    },


    foodCalories: {
      color:
        colors.text,
      fontFamily:
        'VT323',
      fontSize: 15,
    },


    foodProtein: {
      color:
        colors.primary,
      fontFamily:
        'VT323',
      fontSize: 13,
      marginTop: 1,
    },


    emptyFood: {
      color:
        colors.textMuted,
      fontFamily:
        'VT323',
      fontSize: 16,
    },


    /*
     * ====================================
     * DEV
     * ====================================
     */

    devEvaluateButton: {
      marginTop:
        spacing.md,
      minHeight: 38,
      borderWidth: 1,
      borderColor:
        colors.borderStrong,
      backgroundColor:
        colors.background,
      alignItems:
        'center',
      justifyContent:
        'center',
    },


    devEvaluateButtonText: {
      color:
        colors.primary,
      fontFamily:
        'PressStart2P',
      fontSize: 5,
    },


    /*
     * ====================================
     * EMPTY
     * ====================================
     */

    emptyContainer: {
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingVertical:
        spacing.xxxl,
    },


    emptyIcon: {
      color:
        colors.primary,
      fontFamily:
        'VT323',
      fontSize: 34,
      marginBottom:
        spacing.md,
    },


    emptyTitle: {
      color:
        colors.text,
      fontFamily:
        'PressStart2P',
      fontSize: 12,
    },


    emptyText: {
      color:
        colors.textSecondary,
      fontFamily:
        'VT323',
      fontSize: 18,
      lineHeight: 22,
      textAlign:
        'center',
      marginTop:
        spacing.sm,
    },


    emptyButton: {
      marginTop:
        spacing.lg,
      minHeight: 38,
      paddingHorizontal:
        spacing.lg,
      borderWidth: 1,
      borderColor:
        colors.primary,
      alignItems:
        'center',
      justifyContent:
        'center',
    },


    emptyButtonText: {
      color:
        colors.primary,
      fontFamily:
        'PressStart2P',
      fontSize: 6,
    },

  });