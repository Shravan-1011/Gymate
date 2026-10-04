
import { useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { useProfile } from '../../context/ProfileContext';

import {
  colors,
  spacing,
} from '../../constants/theme';

import {
  getOrCreateTodayNutrition,
  updateNutritionGoals,
} from '../../services/dietService';

const FITNESS_GOALS = [
  'BUILD MUSCLE',
  'LOSE FAT',
  'GET STRONGER',
  'IMPROVE FITNESS',
  'MAINTAIN',
];

const ACTIVITY_LEVELS = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
];

/*
 * ========================================
 * NUTRITION CALCULATION
 * ========================================
 */

function roundToNearest(
  value: number,
  nearest: number
): number {
  return Math.round(
    value / nearest
  ) * nearest;
}

function getActivityMultiplier(
  activityLevel: string | null
): number {
  switch (
    activityLevel?.toUpperCase()
  ) {
    case 'ADVANCED':
      return 1.60;

    case 'INTERMEDIATE':
      return 1.50;

    case 'BEGINNER':
      return 1.40;

    default:
      return 1.40;
  }
}

function getCalorieAdjustment(
  fitnessGoal: string | null
): number {
  switch (
    fitnessGoal?.toUpperCase()
  ) {
    case 'LOSE FAT':
      return -300;

    case 'BUILD MUSCLE':
      return 250;

    case 'GET STRONGER':
      return 150;

    case 'IMPROVE FITNESS':
      return 0;

    case 'MAINTAIN':
      return 0;

    default:
      return 0;
  }
}

function getProteinMultiplier(
  fitnessGoal: string | null
): number {
  switch (
    fitnessGoal?.toUpperCase()
  ) {
    case 'LOSE FAT':
      return 1.8;

    case 'BUILD MUSCLE':
      return 1.8;

    case 'GET STRONGER':
      return 1.8;

    case 'IMPROVE FITNESS':
      return 1.6;

    case 'MAINTAIN':
      return 1.6;

    default:
      return 1.6;
  }
}

function calculateNutritionGoals(
  age: number | null,
  heightCm: number | null,
  weightKg: number | null,
  fitnessGoal: string | null,
  activityLevel: string | null
) {
  /*
   * If height or weight is missing,
   * use the existing Diet defaults.
   */
  if (
    weightKg == null ||
    heightCm == null
  ) {
    return {
      calorieGoal: 2000,
      proteinGoal: 120,
    };
  }

  const safeAge =
    age ?? 25;

  /*
   * BMR
   *
   * Profile does not currently store
   * biological sex, so we use the same
   * midpoint formula used by Gymate.
   */
  const bmr =
    (10 * weightKg) +
    (6.25 * heightCm) -
    (5 * safeAge) -
    78;

  const maintenanceCalories =
    bmr *
    getActivityMultiplier(
      activityLevel
    );

  const calorieGoal =
    roundToNearest(
      Math.max(
        1200,
        maintenanceCalories +
          getCalorieAdjustment(
            fitnessGoal
          )
      ),
      50
    );

  const proteinGoal =
    roundToNearest(
      Math.max(
        60,
        weightKg *
          getProteinMultiplier(
            fitnessGoal
          )
      ),
      5
    );

  return {
    calorieGoal,
    proteinGoal,
  };
}

/*
 * ========================================
 * SCREEN
 * ========================================
 */

export default function EditProfileScreen() {
  const {
    profile,
    profileDetails,
    updateProfileDetails,
  } = useProfile();

  const [displayName, setDisplayName] =
    useState(
      profileDetails?.displayName ?? ''
    );

  const [age, setAge] =
    useState(
      profileDetails?.age != null
        ? String(profileDetails.age)
        : ''
    );

  const [heightCm, setHeightCm] =
    useState(
      profileDetails?.heightCm != null
        ? String(profileDetails.heightCm)
        : ''
    );

  const [weightKg, setWeightKg] =
    useState(
      profileDetails?.weightKg != null
        ? String(profileDetails.weightKg)
        : ''
    );

  const [fitnessGoal, setFitnessGoal] =
    useState<string | null>(
      profileDetails?.fitnessGoal ?? null
    );

  const [activityLevel, setActivityLevel] =
    useState<string | null>(
      profileDetails?.activityLevel ?? null
    );

  const [error, setError] =
    useState('');

  const [isSaving, setIsSaving] =
    useState(false);

  /*
   * ========================================
   * SAVE
   * ========================================
   */

  const handleSave = async () => {
    setError('');

    const trimmedDisplayName =
      displayName.trim();

    if (!trimmedDisplayName) {
      setError(
        'PLEASE ENTER YOUR TRAINER NAME.'
      );
      return;
    }

    if (trimmedDisplayName.length < 2) {
      setError(
        'TRAINER NAME MUST BE AT LEAST 2 CHARACTERS.'
      );
      return;
    }

    const parsedAge =
      age.trim()
        ? Number(age)
        : null;

    if (
      parsedAge !== null &&
      (
        !Number.isInteger(parsedAge) ||
        parsedAge < 10 ||
        parsedAge > 100
      )
    ) {
      setError(
        'PLEASE ENTER A VALID AGE.'
      );
      return;
    }

    const parsedHeight =
      heightCm.trim()
        ? Number(heightCm)
        : null;

    if (
      parsedHeight !== null &&
      (
        !Number.isFinite(parsedHeight) ||
        parsedHeight < 80 ||
        parsedHeight > 250
      )
    ) {
      setError(
        'PLEASE ENTER A VALID HEIGHT.'
      );
      return;
    }

    const parsedWeight =
      weightKg.trim()
        ? Number(weightKg)
        : null;

    if (
      parsedWeight !== null &&
      (
        !Number.isFinite(parsedWeight) ||
        parsedWeight < 20 ||
        parsedWeight > 400
      )
    ) {
      setError(
        'PLEASE ENTER A VALID WEIGHT.'
      );
      return;
    }

    if (!fitnessGoal) {
      setError(
        'PLEASE SELECT YOUR FITNESS GOAL.'
      );
      return;
    }

    if (!activityLevel) {
      setError(
        'PLEASE SELECT YOUR ACTIVITY LEVEL.'
      );
      return;
    }

    try {
      setIsSaving(true);

      /*
       * =====================================
       * CHECK NUTRITION CHANGES
       * =====================================
       *
       * Compare against the OLD profile
       * BEFORE saving the new profile.
       *
       * Trainer name alone does NOT count.
       */
      const nutritionSettingsChanged =
        profileDetails?.age !== parsedAge ||
        profileDetails?.heightCm !== parsedHeight ||
        profileDetails?.weightKg !== parsedWeight ||
        profileDetails?.fitnessGoal !== fitnessGoal ||
        profileDetails?.activityLevel !== activityLevel;

      /*
       * =====================================
       * SAVE PROFILE
       * =====================================
       */
      await updateProfileDetails({
        displayName:
          trimmedDisplayName,

        age:
          parsedAge,

        heightCm:
          parsedHeight,

        weightKg:
          parsedWeight,

        fitnessGoal,
        activityLevel,
      });

      /*
       * =====================================
       * UPDATE TODAY'S DIET GOALS
       * =====================================
       *
       * Only happens when a nutrition-related
       * Profile setting actually changed.
       *
       * Uses profile.id, which is the same
       * profile ID used by the Diet screen.
       */
      if (
        nutritionSettingsChanged &&
        profile?.id
      ) {
        const profileId =
          profile.id;

        /*
         * Calculate from the NEW values
         * entered in this form.
         */
        const goals =
          calculateNutritionGoals(
            parsedAge,
            parsedHeight,
            parsedWeight,
            fitnessGoal,
            activityLevel
          );

        /*
         * Make sure today's nutrition
         * record exists.
         *
         * Existing records are NOT reset.
         */
        const todayNutrition =
          await getOrCreateTodayNutrition(
            profileId
          );

        /*
         * Profile nutrition settings changed,
         * so explicitly overwrite today's
         * calorie and protein targets.
         */
        const updatedNutrition =
          await updateNutritionGoals(
            profileId,
            todayNutrition.activityDate,
            {
              calorieGoal:
                goals.calorieGoal,

              proteinGoal:
                goals.proteinGoal,
            }
          );

        /*
         * Never silently pretend the update
         * succeeded if the database update
         * returned null.
         */
        if (!updatedNutrition) {
          throw new Error(
            'FAILED_TO_UPDATE_NUTRITION_GOALS'
          );
        }

        console.log(
          '[GYMATE] PROFILE NUTRITION UPDATED',
          {
            calorieGoal:
              goals.calorieGoal,

            proteinGoal:
              goals.proteinGoal,

            activityDate:
              todayNutrition.activityDate,
          }
        );
      }

      router.back();

    } catch (error) {
      console.error(
        'Failed to update profile:',
        error
      );

      if (error instanceof Error) {
        switch (error.message) {
          case 'DISPLAY_NAME_REQUIRED':
            setError(
              'PLEASE ENTER YOUR TRAINER NAME.'
            );
            break;

          case 'NOT_AUTHENTICATED':
            setError(
              'NO ACTIVE PROFILE FOUND.'
            );
            break;

          case 'FAILED_TO_UPDATE_NUTRITION_GOALS':
            setError(
              'PROFILE SAVED, BUT DAILY NUTRITION GOALS COULD NOT BE UPDATED.'
            );
            break;

          default:
            setError(
              'COULD NOT UPDATE PROFILE. PLEASE TRY AGAIN.'
            );
        }
      } else {
        setError(
          'COULD NOT UPDATE PROFILE. PLEASE TRY AGAIN.'
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * ========================================
   * OPTION BUTTON
   * ========================================
   */

  const renderOption = (
    value: string,
    selectedValue: string | null,
    onSelect: (value: string) => void
  ) => {
    const selected =
      selectedValue === value;

    return (
      <Pressable
        key={value}
        disabled={isSaving}
        onPress={() => {
          onSelect(value);
          setError('');
        }}
        style={({ pressed }) => [
          styles.optionButton,

          selected &&
            styles.optionButtonSelected,

          pressed &&
            !isSaving &&
            styles.optionButtonPressed,

          isSaving &&
            styles.optionButtonDisabled,
        ]}
      >
        <Text
          style={[
            styles.optionText,

            selected &&
              styles.optionTextSelected,
          ]}
        >
          {selected ? '◆ ' : '◇ '}
          {value}
        </Text>
      </Pressable>
    );
  };

  /*
   * ========================================
   * SCREEN
   * ========================================
   */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>
            GYMATE
          </Text>

          <Text style={styles.title}>
            EDIT PROFILE
          </Text>

          <Text style={styles.subtitle}>
            UPDATE YOUR TRAINER DATA
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            TRAINER DATA
          </Text>

          <Text style={styles.label}>
            TRAINER NAME
          </Text>

          <TextInput
            value={displayName}
            onChangeText={(value) => {
              setDisplayName(value);
              setError('');
            }}
            placeholder="ENTER YOUR NAME"
            placeholderTextColor={
              colors.textSecondary
            }
            style={styles.input}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isSaving}
            maxLength={24}
          />

          <Text style={styles.label}>
            AGE
          </Text>

          <TextInput
            value={age}
            onChangeText={(value) => {
              setAge(
                value.replace(
                  /[^0-9]/g,
                  ''
                )
              );
              setError('');
            }}
            placeholder="OPTIONAL"
            placeholderTextColor={
              colors.textSecondary
            }
            style={styles.input}
            keyboardType="number-pad"
            editable={!isSaving}
            maxLength={3}
          />

          <Text style={styles.label}>
            HEIGHT — CM
          </Text>

          <TextInput
            value={heightCm}
            onChangeText={(value) => {
              setHeightCm(
                value.replace(
                  /[^0-9.]/g,
                  ''
                )
              );
              setError('');
            }}
            placeholder="OPTIONAL"
            placeholderTextColor={
              colors.textSecondary
            }
            style={styles.input}
            keyboardType="decimal-pad"
            editable={!isSaving}
            maxLength={6}
          />

          <Text style={styles.label}>
            WEIGHT — KG
          </Text>

          <TextInput
            value={weightKg}
            onChangeText={(value) => {
              setWeightKg(
                value.replace(
                  /[^0-9.]/g,
                  ''
                )
              );
              setError('');
            }}
            placeholder="OPTIONAL"
            placeholderTextColor={
              colors.textSecondary
            }
            style={styles.input}
            keyboardType="decimal-pad"
            editable={!isSaving}
            maxLength={6}
          />

          <Text
            style={[
              styles.label,
              styles.optionLabel,
            ]}
          >
            FITNESS GOAL
          </Text>

          <View style={styles.optionList}>
            {FITNESS_GOALS.map((goal) =>
              renderOption(
                goal,
                fitnessGoal,
                setFitnessGoal
              )
            )}
          </View>

          <Text
            style={[
              styles.label,
              styles.optionLabel,
            ]}
          >
            TRAINING LEVEL
          </Text>

          <View style={styles.optionList}>
            {ACTIVITY_LEVELS.map((level) =>
              renderOption(
                level,
                activityLevel,
                setActivityLevel
              )
            )}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          <Pressable
            disabled={isSaving}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,

              pressed &&
                !isSaving &&
                styles.buttonPressed,

              isSaving &&
                styles.buttonDisabled,
            ]}
          >
            {isSaving ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator
                  size="small"
                  color={colors.background}
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  SAVING...
                </Text>
              </View>
            ) : (
              <Text
                style={
                  styles.saveButtonText
                }
              >
                SAVE CHANGES
              </Text>
            )}
          </Pressable>

          <Pressable
            disabled={isSaving}
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <Text
              style={
                styles.cancelButtonText
              }
            >
              CANCEL
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            CHANGES ARE SAVED LOCALLY.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/*
 * ========================================
 * STYLES
 * ========================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
    paddingBottom: 100,
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  logo: {
    fontFamily: 'PressStart2P',
    fontSize: 20,
    color: colors.primary,
    marginBottom: spacing.lg,
  },

  title: {
    fontFamily: 'PressStart2P',
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontFamily: 'VT323',
    fontSize: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.primary,
    marginBottom: spacing.xl,
  },

  label: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  input: {
    height: 52,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontFamily: 'VT323',
    fontSize: 21,
    color: colors.text,
    marginBottom: spacing.lg,
  },

  optionLabel: {
    marginTop: spacing.sm,
  },

  optionList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  optionButton: {
    minHeight: 46,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },

  optionButtonSelected: {
    borderColor: colors.primary,
  },

  optionButtonPressed: {
    opacity: 0.65,
    transform: [
      {
        translateX: 2,
      },
    ],
  },

  optionButtonDisabled: {
    opacity: 0.55,
  },

  optionText: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.textSecondary,
  },

  optionTextSelected: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.primary,
  },

  errorBox: {
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  errorText: {
    fontFamily: 'VT323',
    fontSize: 19,
    color: colors.primary,
    textAlign: 'center',
  },

  saveButton: {
    minHeight: 56,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  saveButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.background,
    textAlign: 'center',
  },

  cancelButton: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.textSecondary,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  buttonPressed: {
    opacity: 0.65,
    transform: [
      {
        translateY: 2,
      },
    ],
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  footer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },

  footerText: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
