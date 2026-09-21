import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
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
  deleteDailyNutritionFood,
} from '../../database/dietRepository';

import {
  getNutritionProgress,
  getOrCreateTodayNutrition,
  setWaterForDay,
  updateNutritionGoals,
} from '../../services/dietService';

import {
  evaluatePreviousNutritionDays,
} from '../../services/dietXPService';

import type {
  DailyNutrition,
  NutritionProgress,
} from '../../types/diet';

import PixelCard from '../../components/PixelCard';
import ProgressBar from '../../components/ProgressBar';

import {
  colors,
  spacing,
} from '../../constants/theme';


/*
 * ============================================================
 * DATE
 * ============================================================
 */

function getTodayDate(): string {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(2, '0');

  const day =
    String(
      now.getDate(),
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


/*
 * ============================================================
 * FORMAT HELPERS
 * ============================================================
 */

function formatDisplayDate(
  isoDate: string,
): string {
  const [
    year,
    month,
    day,
  ] = isoDate
    .split('-')
    .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day,
    );

  return date
    .toLocaleDateString(
      'en-US',
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      },
    )
    .toUpperCase();
}


function formatNumber(
  value: number,
  decimals = 0,
): string {
  return Number(
    value.toFixed(decimals),
  ).toString();
}


function remainingLabel(
  total: number,
  goal: number,
  unit: string,
  decimals = 0,
): string {
  const difference =
    goal - total;

  if (difference >= 0) {
    return `${formatNumber(
      difference,
      decimals,
    )} ${unit} LEFT`;
  }

  return `${formatNumber(
    Math.abs(difference),
    decimals,
  )} ${unit} OVER`;
}


/*
 * ============================================================
 * CUSTOM ANIMATED PROGRESS BAR
 * ============================================================
 */

function AnimatedDietProgressBar({
  progress,
  over = false,
}: {
  progress: number;
  over?: boolean;
}) {
  const safeProgress =
    Math.min(
      100,
      Math.max(
        0,
        progress,
      ),
    );

  const animated =
    useRef(
      new Animated.Value(0),
    ).current;

  useEffect(() => {
    Animated.timing(
      animated,
      {
        toValue:
          safeProgress,

        duration: 600,

        easing:
          Easing.out(
            Easing.cubic,
          ),

        useNativeDriver:
          false,
      },
    ).start();
  }, [
    animated,
    safeProgress,
  ]);

  const width =
    animated.interpolate({
      inputRange: [
        0,
        100,
      ],

      outputRange: [
        '0%',
        '100%',
      ],
    });

  return (
    <View
      style={
        styles.progressTrack
      }
    >
      <Animated.View
        style={[
          styles.progressFill,

          over &&
            styles.progressFillOver,

          {
            width,
          },
        ]}
      />
    </View>
  );
}


/*
 * ============================================================
 * TARGET EDITOR
 * ============================================================
 */

type TargetEditorProps = {
  visible: boolean;
  calorieGoal: number;
  proteinGoal: number;
  waterGoal: number;
  saving: boolean;
  onClose: () => void;
  onSave: (
    calorieGoal: number,
    proteinGoal: number,
    waterGoal: number,
  ) => void;
};


function TargetEditor({
  visible,
  calorieGoal,
  proteinGoal,
  waterGoal,
  saving,
  onClose,
  onSave,
}: TargetEditorProps) {
  const [
    calories,
    setCalories,
  ] = useState(
    String(calorieGoal),
  );

  const [
    protein,
    setProtein,
  ] = useState(
    String(proteinGoal),
  );

  const [
    water,
    setWater,
  ] = useState(
    String(waterGoal),
  );


  useEffect(() => {
    if (!visible) {
      return;
    }

    setCalories(
      String(calorieGoal),
    );

    setProtein(
      String(proteinGoal),
    );

    setWater(
      String(waterGoal),
    );
  }, [
    visible,
    calorieGoal,
    proteinGoal,
    waterGoal,
  ]);


  function handleSave() {
    const calorieValue =
      Number(
        calories.replace(',', '.'),
      );

    const proteinValue =
      Number(
        protein.replace(',', '.'),
      );

    const waterValue =
      Number(
        water.replace(',', '.'),
      );


    if (
      !Number.isFinite(
        calorieValue,
      ) ||
      calorieValue <= 0
    ) {
      Alert.alert(
        'INVALID CALORIES',
        'ENTER A CALORIE TARGET GREATER THAN 0.',
      );

      return;
    }


    if (
      !Number.isFinite(
        proteinValue,
      ) ||
      proteinValue <= 0
    ) {
      Alert.alert(
        'INVALID PROTEIN',
        'ENTER A PROTEIN TARGET GREATER THAN 0.',
      );

      return;
    }


    if (
      !Number.isFinite(
        waterValue,
      ) ||
      waterValue <= 0
    ) {
      Alert.alert(
        'INVALID WATER',
        'ENTER A WATER TARGET GREATER THAN 0.',
      );

      return;
    }


    onSave(
      calorieValue,
      proteinValue,
      waterValue,
    );
  }


  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={
        saving
          ? undefined
          : onClose
      }
    >
      <View style={styles.modalOverlay}>
        <View style={styles.targetModal}>

          <View
            style={
              styles.modalHeader
            }
          >
            <View>
              <Text
                style={
                  styles.modalTitle
                }
              >
                EDIT TARGETS
              </Text>

              <Text
                style={
                  styles.modalSubtitle
                }
              >
                TODAY'S NUTRITION GOALS
              </Text>
            </View>

            <Pressable
              disabled={saving}
              onPress={onClose}
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed &&
                  styles.buttonPressed,
                saving &&
                  styles.disabled,
              ]}
            >
              <Text
                style={
                  styles.modalCloseText
                }
              >
                ×
              </Text>
            </Pressable>
          </View>


          {/* CALORIES */}

          <View
            style={
              styles.targetInputGroup
            }
          >
            <Text
              style={
                styles.targetInputLabel
              }
            >
              CALORIES
            </Text>

            <View
              style={
                styles.targetInputRow
              }
            >
              <TextInput
                value={calories}
                onChangeText={
                  setCalories
                }
                keyboardType="numeric"
                editable={!saving}
                selectTextOnFocus
                style={
                  styles.targetInput
                }
              />

              <Text
                style={
                  styles.targetInputUnit
                }
              >
                KCAL
              </Text>
            </View>
          </View>


          {/* PROTEIN */}

          <View
            style={
              styles.targetInputGroup
            }
          >
            <Text
              style={
                styles.targetInputLabel
              }
            >
              PROTEIN
            </Text>

            <View
              style={
                styles.targetInputRow
              }
            >
              <TextInput
                value={protein}
                onChangeText={
                  setProtein
                }
                keyboardType="decimal-pad"
                editable={!saving}
                selectTextOnFocus
                style={
                  styles.targetInput
                }
              />

              <Text
                style={
                  styles.targetInputUnit
                }
              >
                GRAMS
              </Text>
            </View>
          </View>


          {/* WATER */}

          <View
            style={
              styles.targetInputGroup
            }
          >
            <Text
              style={
                styles.targetInputLabel
              }
            >
              WATER
            </Text>

            <View
              style={
                styles.targetInputRow
              }
            >
              <TextInput
                value={water}
                onChangeText={
                  setWater
                }
                keyboardType="decimal-pad"
                editable={!saving}
                selectTextOnFocus
                style={
                  styles.targetInput
                }
              />

              <Text
                style={
                  styles.targetInputUnit
                }
              >
                LITRES
              </Text>
            </View>
          </View>


          <Text
            style={
              styles.targetHint
            }
          >
            CHANGES APPLY TO TODAY ONLY.
          </Text>


          <View
            style={
              styles.modalActions
            }
          >
            <Pressable
              disabled={saving}
              onPress={onClose}
              style={({ pressed }) => [
                styles.modalButton,
                styles.modalCancelButton,
                pressed &&
                  styles.buttonPressed,
                saving &&
                  styles.disabled,
              ]}
            >
              <Text
                style={
                  styles.modalCancelText
                }
              >
                CANCEL
              </Text>
            </Pressable>


            <Pressable
              disabled={saving}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.modalButton,
                styles.modalSaveButton,
                pressed &&
                  styles.buttonPressed,
                saving &&
                  styles.disabled,
              ]}
            >
              <Text
                style={
                  styles.modalSaveText
                }
              >
                {saving
                  ? 'SAVING...'
                  : 'SAVE TARGETS'}
              </Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}


/*
 * ============================================================
 * SCREEN
 * ============================================================
 */

export default function DietScreen() {
  const router =
    useRouter();

  const insets =
    useSafeAreaInsets();

  const {
    profile,
    isLoading:
      profileLoading,
  } = useProfile();

  const profileId =
    profile?.id ?? null;

  const [
    nutrition,
    setNutrition,
  ] =
    useState<
      DailyNutrition | null
    >(null);

  const [
    progress,
    setProgress,
  ] =
    useState<
      NutritionProgress | null
    >(null);

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

  const [
    savingWater,
    setSavingWater,
  ] =
    useState(false);

  const [
    editingTargets,
    setEditingTargets,
  ] =
    useState(false);

  const [
    savingTargets,
    setSavingTargets,
  ] =
    useState(false);

  const today =
    getTodayDate();


  /*
   * ==========================================================
   * LOAD TODAY
   * ==========================================================
   */

  const loadToday =
    useCallback(
      async () => {

        if (!profileId) {
          setNutrition(null);
          setProgress(null);
          setLoading(false);
          return;
        }

        try {

          setLoading(true);

          await evaluatePreviousNutritionDays(
            profileId,
          );

          const todayNutrition =
            await getOrCreateTodayNutrition(
              profileId,
            );

          const nutritionProgress =
            await getNutritionProgress(
              profileId,
              today,
            );

          setNutrition(
            todayNutrition,
          );

          setProgress(
            nutritionProgress,
          );

        } catch (error) {

          console.error(
            '[DIET] Failed to load:',
            error,
          );

          Alert.alert(
            'DIET',
            'UNABLE TO LOAD TODAY\'S NUTRITION.',
          );

        } finally {

          setLoading(false);
          setRefreshing(false);

        }

      },
      [
        profileId,
        today,
      ],
    );


  /*
   * ==========================================================
   * RELOAD ON TAB FOCUS
   * ==========================================================
   */

  useFocusEffect(
    useCallback(
      () => {
        loadToday();
      },
      [loadToday],
    ),
  );


  /*
   * ==========================================================
   * REFRESH
   * ==========================================================
   */

  async function refresh() {
    setRefreshing(true);

    await loadToday();
  }


  /*
   * ==========================================================
   * WATER
   * ==========================================================
   */

  async function changeWater(
    amount: number,
  ) {
    if (
      !profileId ||
      !nutrition ||
      savingWater
    ) {
      return;
    }

    const nextAmount =
      Math.max(
        0,
        nutrition.waterConsumed +
          amount,
      );

    try {

      setSavingWater(true);

      const updated =
        await setWaterForDay(
          profileId,
          today,
          nextAmount,
        );

      if (updated) {
        setNutrition(
          updated,
        );
      }

      const updatedProgress =
        await getNutritionProgress(
          profileId,
          today,
        );

      setProgress(
        updatedProgress,
      );

    } catch (error) {

      console.error(
        '[DIET] Failed to update water:',
        error,
      );

      Alert.alert(
        'WATER',
        'UNABLE TO UPDATE WATER INTAKE.',
      );

    } finally {

      setSavingWater(false);

    }
  }


  /*
   * ==========================================================
   * TARGETS
   * ==========================================================
   */

  async function saveTargets(
    calorieGoal: number,
    proteinGoal: number,
    waterGoal: number,
  ) {
    if (
      !profileId ||
      !nutrition ||
      savingTargets
    ) {
      return;
    }

    try {

      setSavingTargets(true);

      const updated =
        await updateNutritionGoals(
          profileId,
          today,
          {
            calorieGoal,
            proteinGoal,
            waterGoal,
          },
        );

      if (!updated) {
        throw new Error(
          'FAILED_TO_UPDATE_TARGETS',
        );
      }

      setNutrition(
        updated,
      );

      const updatedProgress =
        await getNutritionProgress(
          profileId,
          today,
        );

      setProgress(
        updatedProgress,
      );

      setEditingTargets(false);

    } catch (error) {

      console.error(
        '[DIET] Failed to update targets:',
        error,
      );

      Alert.alert(
        'DAILY TARGETS',
        'UNABLE TO UPDATE YOUR NUTRITION TARGETS.',
      );

    } finally {

      setSavingTargets(false);

    }
  }


  /*
   * ==========================================================
   * DELETE FOOD
   * ==========================================================
   */

  async function deleteFood(
    foodId: string,
  ) {
    if (!profileId) {
      return;
    }

    Alert.alert(
      'DELETE FOOD?',
      'THIS FOOD WILL BE REMOVED FROM TODAY\'S NUTRITION.',
      [
        {
          text: 'CANCEL',
          style: 'cancel',
        },

        {
          text: 'DELETE',
          style: 'destructive',

          onPress:
            async () => {

              try {

                await deleteDailyNutritionFood(
                  profileId,
                  foodId,
                );

                await loadToday();

              } catch (error) {

                console.error(
                  '[DIET] Failed to delete food:',
                  error,
                );

                Alert.alert(
                  'DIET',
                  'UNABLE TO DELETE THIS FOOD.',
                );

              }
            },
        },
      ],
    );
  }


  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (
    profileLoading ||
    loading
  ) {
    return (
      <View
        style={[
          styles.loadingScreen,
          {
            paddingTop:
              insets.top,
            paddingBottom:
              insets.bottom,
          },
        ]}
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
          LOADING DIET...
        </Text>

      </View>
    );
  }


  /*
   * ==========================================================
   * PROFILE REQUIRED
   * ==========================================================
   */

  if (!profileId) {
    return (
      <View
        style={[
          styles.emptyScreen,
          {
            paddingTop:
              insets.top +
              spacing.xl,
            paddingBottom:
              insets.bottom +
              spacing.xl,
          },
        ]}
      >

        <Text
          style={
            styles.emptyTitle
          }
        >
          PROFILE REQUIRED
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          CREATE A PROFILE TO START
          YOUR GYMATE JOURNEY.
        </Text>

      </View>
    );
  }


  /*
   * ==========================================================
   * NO DATA
   * ==========================================================
   */

  if (
    !nutrition ||
    !progress
  ) {
    return (
      <View
        style={[
          styles.emptyScreen,
          {
            paddingTop:
              insets.top +
              spacing.xl,
            paddingBottom:
              insets.bottom +
              spacing.xl,
          },
        ]}
      >

        <Text
          style={
            styles.emptyTitle
          }
        >
          NO NUTRITION DATA
        </Text>

        <Pressable
          onPress={
            loadToday
          }

          style={({ pressed }) => [
            styles.primaryButton,

            pressed &&
              styles.buttonPressed,
          ]}
        >

          <Text
            style={
              styles.primaryButtonText
            }
          >
            RETRY
          </Text>

        </Pressable>

      </View>
    );
  }


  /*
   * ==========================================================
   * DERIVED VALUES
   * ==========================================================
   */

  const caloriesOver =
    progress.totals.calories >
    nutrition.calorieGoal;

  const waterMinusDisabled =
    savingWater ||
    nutrition.waterConsumed <=
      0;


  /*
   * ==========================================================
   * SCREEN
   * ==========================================================
   */

  return (
    <>
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

            paddingBottom:
              insets.bottom +
              spacing.xxxl +
              spacing.lg,
          },
        ]}

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

        showsVerticalScrollIndicator={
          false
        }
      >

        {/* ==================================================
            HEADER
            ================================================== */}

        <View
          style={
            styles.header
          }
        >

          <View>

            <Text
              style={
                styles.smallText
              }
            >
              GYMATE
            </Text>

            <Text
              style={
                styles.greeting
              }
            >
              DAILY NUTRITION
            </Text>

          </View>


          <Pressable
            style={({ pressed }) => [
              styles.historyButton,

              pressed &&
                styles.buttonPressed,
            ]}

            onPress={() =>
              router.push(
                '/diet/history',
              )
            }
          >

            <Text
              style={
                styles.historyButtonText
              }
            >
              HISTORY
            </Text>

          </Pressable>

        </View>


        {/* ==================================================
            TODAY
            ================================================== */}

        <View
          style={
            styles.dateRow
          }
        >

          <Text
            style={
              styles.todayTitle
            }
          >
            TODAY
          </Text>

          <Text
            style={
              styles.date
            }
          >
            {formatDisplayDate(
              today,
            )}
          </Text>

        </View>


        {/* ==================================================
            NUTRITION SUMMARY
            ================================================== */}

        <PixelCard
          style={
            styles.summaryCard
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            NUTRITION
          </Text>


          {/* CALORIES */}

          <View
            style={
              styles.metric
            }
          >

            <View
              style={
                styles.metricHeader
              }
            >

              <Text
                style={
                  styles.metricName
                }
              >
                CALORIES
              </Text>

              <Text
                style={
                  styles.metricValue
                }
              >
                {formatNumber(
                  progress.totals.calories,
                )}
                {' / '}
                {formatNumber(
                  nutrition.calorieGoal,
                )}
                {' KCAL'}
              </Text>

            </View>


            <AnimatedDietProgressBar
              progress={
                progress.caloriePercent
              }
              over={
                caloriesOver
              }
            />


            <View
              style={
                styles.metricFooter
              }
            >

              <Text
                style={
                  styles.metricPercent
                }
              >
                {Math.round(
                  progress.caloriePercent,
                )}
                %
              </Text>

              <Text
                style={[
                  styles.metricRemaining,

                  caloriesOver &&
                    styles.metricOver,
                ]}
              >
                {remainingLabel(
                  progress.totals.calories,
                  nutrition.calorieGoal,
                  'KCAL',
                )}
              </Text>

            </View>

          </View>


          {/* PROTEIN */}

          <View
            style={
              styles.metric
            }
          >

            <View
              style={
                styles.metricHeader
              }
            >

              <Text
                style={
                  styles.metricName
                }
              >
                PROTEIN
              </Text>

              <Text
                style={
                  styles.metricValue
                }
              >
                {formatNumber(
                  progress.totals.protein,
                  1,
                )}
                {' / '}
                {formatNumber(
                  nutrition.proteinGoal,
                  1,
                )}
                {' G'}
              </Text>

            </View>


            <AnimatedDietProgressBar
              progress={
                progress.proteinPercent
              }
            />


            <View
              style={
                styles.metricFooter
              }
            >

              <Text
                style={
                  styles.metricPercent
                }
              >
                {Math.round(
                  progress.proteinPercent,
                )}
                %
              </Text>

              <Text
                style={
                  styles.metricRemaining
                }
              >
                {remainingLabel(
                  progress.totals.protein,
                  nutrition.proteinGoal,
                  'G',
                  1,
                )}
              </Text>

            </View>

          </View>


          {/* WATER */}

          <View
            style={[
              styles.metric,
              styles.lastMetric,
            ]}
          >

            <View
              style={
                styles.metricHeader
              }
            >

              <Text
                style={
                  styles.metricName
                }
              >
                WATER
              </Text>

              <Text
                style={
                  styles.metricValue
                }
              >
                {formatNumber(
                  nutrition.waterConsumed,
                  2,
                )}
                {' / '}
                {formatNumber(
                  nutrition.waterGoal,
                  2,
                )}
                {' L'}
              </Text>

            </View>


            <AnimatedDietProgressBar
              progress={
                progress.waterPercent
              }
            />


            <View
              style={
                styles.metricFooter
              }
            >

              <Text
                style={
                  styles.metricPercent
                }
              >
                {Math.round(
                  progress.waterPercent,
                )}
                %
              </Text>

              <Text
                style={
                  styles.metricRemaining
                }
              >
                {remainingLabel(
                  nutrition.waterConsumed,
                  nutrition.waterGoal,
                  'L',
                  2,
                )}
              </Text>

            </View>

          </View>

        </PixelCard>


        {/* ==================================================
            ACTIONS
            ================================================== */}

        <View
          style={
            styles.actions
          }
        >

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,

              pressed &&
                styles.buttonPressed,
            ]}

            onPress={() =>
              router.push(
                '/diet/daily-food',
              )
            }
          >

            <Text
              style={
                styles.actionSymbol
              }
            >
              +
            </Text>

            <Text
              style={
                styles.actionText
              }
            >
              ADD FOOD
            </Text>

          </Pressable>


          <Pressable
            style={({ pressed }) => [
              styles.actionButton,

              pressed &&
                styles.buttonPressed,
            ]}

            onPress={() =>
              router.push(
                '/diet/select-template',
              )
            }
          >

            <Text
              style={
                styles.actionSymbol
              }
            >
              ▣
            </Text>

            <Text
              style={
                styles.actionText
              }
            >
              TEMPLATE
            </Text>

          </Pressable>

        </View>


        {/* ==================================================
            WATER
            ================================================== */}

        <PixelCard
          style={
            styles.sectionCard
          }
        >

          <View
            style={
              styles.sectionHeader
            }
          >

            <View>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                WATER
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                TRACK DAILY INTAKE
              </Text>

            </View>

            <Text
              style={
                styles.highlightValue
              }
            >
              {formatNumber(
                nutrition.waterConsumed,
                2,
              )}
              L
            </Text>

          </View>


          <View
            style={
              styles.waterControls
            }
          >

            <Pressable
              style={({ pressed }) => [
                styles.controlButton,

                waterMinusDisabled &&
                  styles.disabled,

                pressed &&
                  !waterMinusDisabled &&
                  styles.buttonPressed,
              ]}

              disabled={
                waterMinusDisabled
              }

              onPress={() =>
                changeWater(
                  -0.25,
                )
              }
            >

              <Text
                style={
                  styles.controlText
                }
              >
                −0.25L
              </Text>

            </Pressable>


            <Pressable
              style={({ pressed }) => [
                styles.controlButton,

                savingWater &&
                  styles.disabled,

                pressed &&
                  !savingWater &&
                  styles.buttonPressed,
              ]}

              disabled={
                savingWater
              }

              onPress={() =>
                changeWater(
                  0.25,
                )
              }
            >

              <Text
                style={
                  styles.controlText
                }
              >
                +0.25L
              </Text>

            </Pressable>


            <Pressable
              style={({ pressed }) => [
                styles.controlButton,

                savingWater &&
                  styles.disabled,

                pressed &&
                  !savingWater &&
                  styles.buttonPressed,
              ]}

              disabled={
                savingWater
              }

              onPress={() =>
                changeWater(
                  0.5,
                )
              }
            >

              <Text
                style={
                  styles.controlText
                }
              >
                +0.5L
              </Text>

            </Pressable>

          </View>

        </PixelCard>


        {/* ==================================================
            FOOD
            ================================================== */}

        <View
          style={
            styles.section
          }
        >

          <View
            style={
              styles.sectionHeader
            }
          >

            <View>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                TODAY'S FOOD
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                {nutrition.foods.length}{' '}
                ITEM
                {nutrition.foods.length === 1
                  ? ''
                  : 'S'}
              </Text>

            </View>


            {nutrition.foods.length >
              0 && (
              <Text
                style={
                  styles.highlightValue
                }
              >
                {formatNumber(
                  progress.totals.calories,
                )}{' '}
                KCAL
              </Text>
            )}

          </View>


          {nutrition.foods.length === 0 ? (

            <PixelCard
              style={
                styles.emptyFood
              }
            >

              <Text
                style={
                  styles.emptyFoodIcon
                }
              >
                +
              </Text>

              <Text
                style={
                  styles.emptyFoodTitle
                }
              >
                NO FOOD ADDED
              </Text>

              <Text
                style={
                  styles.emptyFoodText
                }
              >
                ADD FOOD MANUALLY OR APPLY
                ONE OF YOUR TEMPLATES.
              </Text>


              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,

                  pressed &&
                    styles.buttonPressed,
                ]}

                onPress={() =>
                  router.push(
                    '/diet/daily-food',
                  )
                }
              >

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  ADD FIRST FOOD
                </Text>

              </Pressable>

            </PixelCard>

          ) : (

            nutrition.foods.map(
              food => (

                <Pressable
                  key={
                    food.id
                  }

                  style={({ pressed }) => [
                    styles.foodCard,

                    pressed &&
                      styles.foodCardPressed,
                  ]}

                  onPress={() =>
                    router.push({
                      pathname:
                        '/diet/daily-food',

                      params: {
                        foodId:
                          food.id,
                      },
                    })
                  }
                >

                  <View
                    style={
                      styles.foodInfo
                    }
                  >

                    <Text
                      numberOfLines={
                        1
                      }

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
                      styles.foodNutrition
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
                      P{' '}
                      {formatNumber(
                        food.protein,
                        1,
                      )}
                      G
                    </Text>

                  </View>


                  <Pressable
                    hitSlop={
                      12
                    }

                    onPress={() =>
                      deleteFood(
                        food.id,
                      )
                    }

                    style={({ pressed }) => [
                      styles.deleteButton,

                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >

                    <Text
                      style={
                        styles.deleteText
                      }
                    >
                      ×
                    </Text>

                  </Pressable>

                </Pressable>

              ),
            )

          )}

        </View>


        {/* ==================================================
            DAILY TARGETS
            ================================================== */}

        <PixelCard
          style={
            styles.sectionCard
          }
        >

          <View
            style={
              styles.sectionHeader
            }
          >

            <View>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                DAILY TARGETS
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                CURRENT NUTRITION GOALS
              </Text>

            </View>

            <Pressable
              onPress={() =>
                setEditingTargets(
                  true,
                )
              }
              style={({ pressed }) => [
                styles.editTargetsButton,

                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text
                style={
                  styles.editTargetsText
                }
              >
                EDIT
              </Text>
            </Pressable>

          </View>


          <View
            style={
              styles.goalGrid
            }
          >

            <View
              style={
                styles.goalCard
              }
            >

              <Text
                style={
                  styles.goalLabel
                }
              >
                CALORIES
              </Text>

              <Text
                style={
                  styles.goalValue
                }
              >
                {formatNumber(
                  nutrition.calorieGoal,
                )}
              </Text>

              <Text
                style={
                  styles.goalUnit
                }
              >
                KCAL
              </Text>

            </View>


            <View
              style={
                styles.goalCard
              }
            >

              <Text
                style={
                  styles.goalLabel
                }
              >
                PROTEIN
              </Text>

              <Text
                style={
                  styles.goalValue
                }
              >
                {formatNumber(
                  nutrition.proteinGoal,
                )}
              </Text>

              <Text
                style={
                  styles.goalUnit
                }
              >
                GRAMS
              </Text>

            </View>


            <View
              style={
                styles.goalCard
              }
            >

              <Text
                style={
                  styles.goalLabel
                }
              >
                WATER
              </Text>

              <Text
                style={
                  styles.goalValue
                }
              >
                {formatNumber(
                  nutrition.waterGoal,
                  2,
                )}
              </Text>

              <Text
                style={
                  styles.goalUnit
                }
              >
                LITRES
              </Text>

            </View>

          </View>

        </PixelCard>


      </ScrollView>


      {/* ==================================================
          TARGET EDIT MODAL
          ================================================== */}

      <TargetEditor
        visible={
          editingTargets
        }

        calorieGoal={
          nutrition.calorieGoal
        }

        proteinGoal={
          nutrition.proteinGoal
        }

        waterGoal={
          nutrition.waterGoal
        }

        saving={
          savingTargets
        }

        onClose={() =>
          setEditingTargets(
            false,
          )
        }

        onSave={
          saveTargets
        }
      />
    </>
  );
}


/*
 * ============================================================
 * STYLES
 * ============================================================
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
    },


    loadingScreen: {
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


    emptyScreen: {
      flex: 1,

      backgroundColor:
        colors.background,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding:
        spacing.xl,
    },


    emptyTitle: {
      color:
        colors.text,

      fontFamily:
        'PressStart2P',

      fontSize: 13,

      textAlign:
        'center',
    },


    emptyText: {
      color:
        colors.textSecondary,

      fontFamily:
        'VT323',

      fontSize: 18,

      textAlign:
        'center',

      marginTop:
        spacing.md,

      lineHeight: 24,
    },


    /* =====================================
       HEADER
       ===================================== */

    header: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'flex-start',

      marginBottom:
        spacing.lg,
    },


    smallText: {
      fontFamily:
        'PressStart2P',

      fontSize: 12,

      color:
        colors.primary,

      marginBottom:
        spacing.md,
    },


    greeting: {
      fontFamily:
        'VT323',

      fontSize: 22,

      color:
        colors.textSecondary,
    },


    historyButton: {
      borderWidth: 2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      paddingHorizontal:
        spacing.sm,

      paddingVertical:
        spacing.sm,
    },


    historyButtonText: {
      fontFamily:
        'PressStart2P',

      fontSize: 7,

      color:
        colors.primary,
    },


    buttonPressed: {
      opacity: 0.65,

      transform: [
        {
          translateY: 2,
        },
      ],
    },


    /* =====================================
       DATE
       ===================================== */

    dateRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-end',

      justifyContent:
        'space-between',

      marginBottom:
        spacing.lg,
    },


    todayTitle: {
      fontFamily:
        'PressStart2P',

      fontSize: 18,

      color:
        colors.text,
    },


    date: {
      fontFamily:
        'VT323',

      fontSize: 18,

      color:
        colors.textSecondary,
    },


    /* =====================================
       SECTION
       ===================================== */

    sectionTitle: {
      fontFamily:
        'PressStart2P',

      fontSize: 11,

      color:
        colors.text,

      marginBottom:
        spacing.lg,
    },


    sectionSubtitle: {
      fontFamily:
        'VT323',

      fontSize: 16,

      color:
        colors.textSecondary,

      marginTop:
        -spacing.md,

      marginBottom:
        spacing.sm,
    },


    /* =====================================
       SUMMARY
       ===================================== */

    summaryCard: {
      marginBottom:
        spacing.lg,
    },


    metric: {
      marginBottom:
        spacing.lg,
    },


    lastMetric: {
      marginBottom: 0,
    },


    metricHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom:
        spacing.sm,
    },


    metricName: {
      fontFamily:
        'PressStart2P',

      fontSize: 8,

      color:
        colors.textSecondary,
    },


    metricValue: {
      fontFamily:
        'VT323',

      fontSize: 19,

      color:
        colors.text,

      fontVariant:
        ['tabular-nums'],
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


    metricFooter: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginTop:
        spacing.xs,
    },


    metricPercent: {
      fontFamily:
        'VT323',

      fontSize: 16,

      color:
        colors.primary,
    },


    metricRemaining: {
      fontFamily:
        'VT323',

      fontSize: 15,

      color:
        colors.textMuted,

      fontVariant:
        ['tabular-nums'],
    },


    metricOver: {
      color:
        colors.warning,
    },


    /* =====================================
       ACTIONS
       ===================================== */

    actions: {
      flexDirection:
        'row',

      gap:
        spacing.sm,

      marginBottom:
        spacing.lg,
    },


    actionButton: {
      flex: 1,

      minHeight: 64,

      borderWidth: 2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    actionSymbol: {
      fontFamily:
        'VT323',

      fontSize: 28,

      lineHeight: 28,

      color:
        colors.primary,
    },


    actionText: {
      fontFamily:
        'PressStart2P',

      fontSize: 7,

      color:
        colors.text,

      marginTop:
        spacing.xs,
    },


    /* =====================================
       GENERIC SECTION CARD
       ===================================== */

    sectionCard: {
      marginBottom:
        spacing.lg,
    },


    sectionHeader: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',

      marginBottom:
        spacing.sm,
    },


    highlightValue: {
      fontFamily:
        'VT323',

      fontSize: 21,

      color:
        colors.primary,

      fontVariant:
        ['tabular-nums'],
    },


    /* =====================================
       WATER
       ===================================== */

    waterControls: {
      flexDirection:
        'row',

      gap:
        spacing.sm,

      marginTop:
        spacing.sm,
    },


    controlButton: {
      flex: 1,

      minHeight: 44,

      borderWidth: 2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.background,

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    controlText: {
      fontFamily:
        'VT323',

      fontSize: 18,

      color:
        colors.text,
    },


    disabled: {
      opacity:
        0.35,
    },


    /* =====================================
       FOOD
       ===================================== */

    section: {
      marginBottom:
        spacing.lg,
    },


    emptyFood: {
      alignItems:
        'center',

      paddingVertical:
        spacing.xl,
    },


    emptyFoodIcon: {
      fontFamily:
        'VT323',

      fontSize: 38,

      color:
        colors.primary,

      lineHeight: 38,
    },


    emptyFoodTitle: {
      fontFamily:
        'PressStart2P',

      fontSize: 10,

      color:
        colors.text,

      marginTop:
        spacing.sm,
    },


    emptyFoodText: {
      fontFamily:
        'VT323',

      fontSize: 17,

      lineHeight: 21,

      color:
        colors.textSecondary,

      textAlign:
        'center',

      marginTop:
        spacing.sm,

      marginBottom:
        spacing.lg,
    },


    primaryButton: {
      borderWidth: 2,

      borderColor:
        colors.primary,

      backgroundColor:
        colors.primary,

      paddingHorizontal:
        spacing.md,

      paddingVertical:
        spacing.sm,
    },


    primaryButtonText: {
      fontFamily:
        'PressStart2P',

      fontSize: 7,

      color:
        '#000',
    },


    foodCard: {
      minHeight: 64,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        colors.surface,

      borderWidth: 2,

      borderColor:
        colors.border,

      paddingHorizontal:
        spacing.sm,

      paddingVertical:
        spacing.sm,

      marginBottom:
        spacing.sm,
    },


    foodCardPressed: {
      opacity:
        0.7,

      transform: [
        {
          translateY: 2,
        },
      ],
    },


    foodInfo: {
      flex: 1,

      marginRight:
        spacing.sm,
    },


    foodName: {
      fontFamily:
        'PressStart2P',

      fontSize: 7,

      color:
        colors.text,
    },


    foodQuantity: {
      fontFamily:
        'VT323',

      fontSize: 16,

      color:
        colors.textSecondary,

      marginTop:
        3,
    },


    foodNutrition: {
      alignItems:
        'flex-end',

      marginRight:
        spacing.sm,
    },


    foodCalories: {
      fontFamily:
        'VT323',

      fontSize: 17,

      color:
        colors.text,

      fontVariant:
        ['tabular-nums'],
    },


    foodProtein: {
      fontFamily:
        'VT323',

      fontSize: 15,

      color:
        colors.primary,

      marginTop:
        2,

      fontVariant:
        ['tabular-nums'],
    },


    deleteButton: {
      width: 30,

      height: 30,

      borderWidth: 1,

      borderColor:
        colors.border,

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    deleteText: {
      fontFamily:
        'VT323',

      fontSize: 24,

      color:
        colors.textMuted,

      lineHeight: 24,
    },


    /* =====================================
       DAILY TARGETS
       ===================================== */

    editTargetsButton: {
      borderWidth: 2,

      borderColor:
        colors.primary,

      backgroundColor:
        colors.surface,

      paddingHorizontal:
        spacing.sm,

      paddingVertical:
        spacing.sm,

      marginTop:
        -spacing.xs,
    },


    editTargetsText: {
      fontFamily:
        'PressStart2P',

      fontSize: 7,

      color:
        colors.primary,
    },


    goalGrid: {
      flexDirection:
        'row',

      gap:
        spacing.sm,
    },


    goalCard: {
      flex: 1,

      minHeight: 88,

      backgroundColor:
        colors.background,

      borderWidth: 1,

      borderColor:
        colors.border,

      padding:
        spacing.sm,
    },


    goalLabel: {
      fontFamily:
        'PressStart2P',

      fontSize: 6,

      color:
        colors.textMuted,
    },


    goalValue: {
      fontFamily:
        'VT323',

      fontSize: 27,

      color:
        colors.primary,

      marginTop:
        spacing.sm,

      fontVariant:
        ['tabular-nums'],
    },


    goalUnit: {
      fontFamily:
        'VT323',

      fontSize: 14,

      color:
        colors.textSecondary,

      marginTop:
        -2,
    },


    /* =====================================
       TARGET MODAL
       ===================================== */

    modalOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(0, 0, 0, 0.82)',

      alignItems:
        'center',

      justifyContent:
        'center',

      padding:
        spacing.lg,
    },


    targetModal: {
      width:
        '100%',

      maxWidth:
        440,

      backgroundColor:
        colors.surface,

      borderWidth: 2,

      borderColor:
        colors.borderStrong,

      padding:
        spacing.lg,
    },


    modalHeader: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',

      marginBottom:
        spacing.lg,
    },


    modalTitle: {
      fontFamily:
        'PressStart2P',

      fontSize: 11,

      color:
        colors.primary,
    },


    modalSubtitle: {
      fontFamily:
        'VT323',

      fontSize: 16,

      color:
        colors.textSecondary,

      marginTop:
        spacing.sm,
    },


    modalCloseButton: {
      width: 36,

      height: 36,

      borderWidth: 2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.background,

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    modalCloseText: {
      fontFamily:
        'VT323',

      fontSize: 28,

      lineHeight: 28,

      color:
        colors.primary,
    },


    targetInputGroup: {
      marginBottom:
        spacing.md,
    },


    targetInputLabel: {
      fontFamily:
        'PressStart2P',

      fontSize: 7,

      color:
        colors.textSecondary,

      marginBottom:
        spacing.xs,
    },


    targetInputRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      borderWidth: 2,

      borderColor:
        colors.border,

      backgroundColor:
        colors.background,
    },


    targetInput: {
      flex: 1,

      minHeight: 48,

      paddingHorizontal:
        spacing.sm,

      paddingVertical:
        spacing.sm,

      fontFamily:
        'VT323',

      fontSize: 22,

      color:
        colors.text,
    },


    targetInputUnit: {
      fontFamily:
        'PressStart2P',

      fontSize: 6,

      color:
        colors.textMuted,

      paddingHorizontal:
        spacing.sm,
    },


    targetHint: {
      fontFamily:
        'VT323',

      fontSize: 15,

      color:
        colors.textMuted,

      marginTop:
        spacing.xs,

      marginBottom:
        spacing.lg,
    },


    modalActions: {
      flexDirection:
        'row',

      gap:
        spacing.sm,
    },


    modalButton: {
      flex: 1,

      minHeight: 46,

      borderWidth: 2,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        spacing.sm,
    },


    modalCancelButton: {
      borderColor:
        colors.border,

      backgroundColor:
        colors.background,
    },


    modalSaveButton: {
      borderColor:
        colors.primary,

      backgroundColor:
        colors.primary,
    },


    modalCancelText: {
      fontFamily:
        'PressStart2P',

      fontSize: 7,

      color:
        colors.textSecondary,
    },


    modalSaveText: {
      fontFamily:
        'PressStart2P',

      fontSize: 7,

      color:
        '#000',
    },

  });