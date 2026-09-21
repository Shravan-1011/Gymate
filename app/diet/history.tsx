import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
 * PROGRESS BAR
 * ========================================
 */

function ProgressBar({
  value,
  over = false,
}: {
  value: number;
  over?: boolean;
}) {
  const safeValue =
    Math.min(
      100,
      Math.max(
        0,
        value,
      ),
    );

  return (
    <View
      style={
        styles.progressTrack
      }
    >
      <View
        style={[
          styles.progressFill,
          over &&
            styles.progressFillOver,
          {
            width:
              `${safeValue}%`,
          },
        ]}
      />
    </View>
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
      ? (
          value /
          target
        ) * 100
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
          {formatNumber(
            value,
          )}
          {' / '}
          {formatNumber(
            target,
          )}
          {' '}
          {unit}
        </Text>

      </View>


      <ProgressBar
        value={
          percent
        }
        over={
          isOver
        }
      />


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
          {formatNumber(
            percent,
          )}%
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
  onEvaluate,
}: {
  day: DailyNutrition;

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


  return (
    <PixelCard
      style={
        styles.card
      }
    >

      {/* ==================================
          HEADER
          ================================== */}

      <View
        style={
          styles.cardHeader
        }
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

          <Text
            style={
              styles.foodCount
            }
          >
            {day.foods.length}{' '}
            {day.foods.length === 1
              ? 'FOOD'
              : 'FOODS'}
          </Text>

        </View>


        {/* XP */}

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

      </View>


      {/* ==================================
          METRICS
          ================================== */}

      <View
        style={
          styles.metrics
        }
      >

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

      </View>


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
              ? 'EVALUATED'
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

        <Text
          style={
            styles.foodSectionTitle
          }
        >
          FOOD LOG
        </Text>


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
                    )}{' '}
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
                    )}{' '}
                    KCAL
                  </Text>

                  <Text
                    style={
                      styles.foodProtein
                    }
                  >
                    {formatNumber(
                      food.protein,
                    )}G PROTEIN
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
           * Evaluate old pending days
           * before loading history.
           */

          await evaluatePreviousNutritionDays(
            profileId,
          );


          /*
           * Load latest history.
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

      console.log(
        '================================',
      );

      console.log(
        'DEV NUTRITION EVALUATION',
      );

      console.log(
        'Profile:',
        profileId,
      );

      console.log(
        'Date:',
        activityDate,
      );


      const result =
        await evaluateNutritionForDate(
          profileId,
          activityDate,
        );


      console.log(
        'Evaluation result:',
        result,
      );

      console.log(
        '================================',
      );


      await loadHistory();

    } catch (error) {

      console.error(
        'DEV nutrition evaluation failed:',
        error,
      );

    }
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
          EMPTY STATE
          ================================== */}

      {history.length === 0 ? (

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
            NO HISTORY
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            YOUR NUTRITION DAYS
            {'\n'}
            WILL APPEAR HERE.
          </Text>

        </PixelCard>

      ) : (

        history.map(
          day => (

            <HistoryCard
              key={
                day.id
              }

              day={
                day
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


    /* ====================================
       HEADER
       ==================================== */

    header: {
      marginBottom:
        spacing.xl,
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


    /* ====================================
       HISTORY CARD
       ==================================== */

    card: {
      marginBottom:
        spacing.lg,
    },


    cardHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom:
        spacing.lg,
    },


    dateContainer: {
      flex: 1,
    },


    date: {
      color:
        colors.text,

      fontFamily:
        'PressStart2P',

      fontSize: 8,

      lineHeight: 15,
    },


    foodCount: {
      color:
        colors.textSecondary,

      fontFamily:
        'VT323',

      fontSize: 16,

      marginTop:
        spacing.xs,
    },


    /* ====================================
       XP
       ==================================== */

    xpBox: {
      minWidth: 62,

      paddingVertical:
        spacing.sm,

      paddingHorizontal:
        spacing.sm,

      borderWidth: 2,

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

      fontSize: 23,

      lineHeight: 23,
    },


    xpLabel: {
      color:
        colors.textMuted,

      fontFamily:
        'PressStart2P',

      fontSize: 6,

      marginTop: 2,
    },


    /* ====================================
       METRICS
       ==================================== */

    metrics: {
      marginBottom:
        spacing.sm,
    },


    metric: {
      marginBottom:
        spacing.lg,
    },


    metricTop: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom:
        spacing.sm,
    },


    metricLabel: {
      color:
        colors.textSecondary,

      fontFamily:
        'PressStart2P',

      fontSize: 7,
    },


    metricValue: {
      color:
        colors.text,

      fontFamily:
        'VT323',

      fontSize: 18,

      fontVariant:
        ['tabular-nums'],
    },


    metricValueOver: {
      color:
        colors.warning,
    },


    progressTrack: {
      height: 8,

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
        spacing.xs,
    },


    metricPercent: {
      color:
        colors.primary,

      fontFamily:
        'VT323',

      fontSize: 16,
    },


    metricTarget: {
      color:
        colors.textMuted,

      fontFamily:
        'VT323',

      fontSize: 14,
    },


    /* ====================================
       MACROS
       ==================================== */

    macroRow: {
      flexDirection:
        'row',

      borderTopWidth: 2,

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

      fontSize: 6,
    },


    macroValue: {
      color:
        colors.text,

      fontFamily:
        'VT323',

      fontSize: 17,

      marginTop:
        spacing.xs,
    },


    evaluated: {
      color:
        colors.primary,

      fontSize: 14,
    },


    pending: {
      color:
        colors.warning,

      fontSize: 14,
    },


    /* ====================================
       FOOD LOG
       ==================================== */

    foodSection: {
      marginTop:
        spacing.md,

      paddingTop:
        spacing.md,

      borderTopWidth: 2,

      borderTopColor:
        colors.border,
    },


    foodSectionTitle: {
      color:
        colors.textSecondary,

      fontFamily:
        'PressStart2P',

      fontSize: 7,

      marginBottom:
        spacing.sm,
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

      fontSize: 7,
    },


    foodQuantity: {
      color:
        colors.textSecondary,

      fontFamily:
        'VT323',

      fontSize: 15,

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

      fontSize: 16,
    },


    foodProtein: {
      color:
        colors.primary,

      fontFamily:
        'VT323',

      fontSize: 14,

      marginTop: 2,
    },


    emptyFood: {
      color:
        colors.textMuted,

      fontFamily:
        'VT323',

      fontSize: 16,
    },


    /* ====================================
       DEV
       ==================================== */

    devEvaluateButton: {
      marginTop:
        spacing.md,

      minHeight: 40,

      borderWidth: 2,

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

      fontSize: 6,
    },


    /* ====================================
       EMPTY
       ==================================== */

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

  });