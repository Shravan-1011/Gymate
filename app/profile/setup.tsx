import { useEffect, useState } from 'react';

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

/*
 * ========================================
 * OPTIONS
 * ========================================
 */

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
 * SCREEN
 * ========================================
 */

export default function ProfileSetupScreen() {
  const {
    profile,
    profileDetails,
    createProfileDetails,
    updateProfileDetails,
  } = useProfile();

  /*
   * ======================================
   * STATE
   * ======================================
   */

  const [displayName, setDisplayName] =
    useState('');

  const [age, setAge] =
    useState('');

  const [heightCm, setHeightCm] =
    useState('');

  const [weightKg, setWeightKg] =
    useState('');

  const [fitnessGoal, setFitnessGoal] =
    useState<string | null>(null);

  const [activityLevel, setActivityLevel] =
    useState<string | null>(null);

  const [error, setError] =
    useState('');

  const [isSaving, setIsSaving] =
    useState(false);

  /*
   * ========================================
   * EDIT MODE
   * ========================================
   */

  const isEditMode =
    profileDetails !== null;

  /*
   * ========================================
   * LOAD EXISTING DETAILS
   * ========================================
   *
   * When editing an existing profile,
   * populate the form with the current data.
   */

  useEffect(() => {
    if (!profileDetails) {
      return;
    }

    setDisplayName(
      profileDetails.displayName
    );

    setAge(
      profileDetails.age !== null
        ? String(profileDetails.age)
        : ''
    );

    setHeightCm(
      profileDetails.heightCm !== null
        ? String(profileDetails.heightCm)
        : ''
    );

    setWeightKg(
      profileDetails.weightKg !== null
        ? String(profileDetails.weightKg)
        : ''
    );

    setFitnessGoal(
      profileDetails.fitnessGoal
    );

    setActivityLevel(
      profileDetails.activityLevel
    );
  }, [profileDetails]);

  /*
   * ========================================
   * SAVE PROFILE
   * ========================================
   */

  const handleContinue = async () => {
    setError('');

    /*
     * ======================================
     * AUTHENTICATION CHECK
     * ======================================
     */

    if (!profile) {
      setError(
        'NO ACTIVE PROFILE FOUND.'
      );

      return;
    }

    /*
     * ======================================
     * DISPLAY NAME
     * ======================================
     */

    const trimmedDisplayName =
      displayName.trim();

    if (!trimmedDisplayName) {
      setError(
        'PLEASE ENTER YOUR TRAINER NAME.'
      );

      return;
    }

    if (
      trimmedDisplayName.length < 2
    ) {
      setError(
        'TRAINER NAME MUST BE AT LEAST 2 CHARACTERS.'
      );

      return;
    }

    /*
     * ======================================
     * AGE
     * ======================================
     */

    const parsedAge =
      age.trim()
        ? Number(age)
        : null;

    if (
      parsedAge !== null &&
      (!Number.isInteger(parsedAge) ||
        parsedAge < 10 ||
        parsedAge > 100)
    ) {
      setError(
        'PLEASE ENTER A VALID AGE.'
      );

      return;
    }

    /*
     * ======================================
     * HEIGHT
     * ======================================
     */

    const parsedHeight =
      heightCm.trim()
        ? Number(heightCm)
        : null;

    if (
      parsedHeight !== null &&
      (!Number.isFinite(parsedHeight) ||
        parsedHeight < 80 ||
        parsedHeight > 250)
    ) {
      setError(
        'PLEASE ENTER A VALID HEIGHT.'
      );

      return;
    }

    /*
     * ======================================
     * WEIGHT
     * ======================================
     */

    const parsedWeight =
      weightKg.trim()
        ? Number(weightKg)
        : null;

    if (
      parsedWeight !== null &&
      (!Number.isFinite(parsedWeight) ||
        parsedWeight < 20 ||
        parsedWeight > 400)
    ) {
      setError(
        'PLEASE ENTER A VALID WEIGHT.'
      );

      return;
    }

    /*
     * ======================================
     * FITNESS GOAL
     * ======================================
     */

    if (!fitnessGoal) {
      setError(
        'PLEASE SELECT YOUR FITNESS GOAL.'
      );

      return;
    }

    /*
     * ======================================
     * ACTIVITY LEVEL
     * ======================================
     */

    if (!activityLevel) {
      setError(
        'PLEASE SELECT YOUR ACTIVITY LEVEL.'
      );

      return;
    }

    /*
     * ======================================
     * SAVE
     * ======================================
     */

    try {
      setIsSaving(true);

      /*
       * EXISTING PROFILE DETAILS
       *
       * Update instead of creating another row.
       */

      if (profileDetails) {
        await updateProfileDetails({
          displayName:
            trimmedDisplayName,

          age: parsedAge,

          heightCm: parsedHeight,

          weightKg: parsedWeight,

          fitnessGoal,

          activityLevel,
        });
      }

      /*
       * NEW PROFILE DETAILS
       *
       * First-time profile setup.
       */

      else {
        await createProfileDetails({
          displayName:
            trimmedDisplayName,

          age: parsedAge,

          heightCm: parsedHeight,

          weightKg: parsedWeight,

          fitnessGoal,

          activityLevel,
        });
      }

      /*
       * Return to Profile tab.
       */

      router.replace('/(tabs)/profile');
    } catch (error) {
      console.error(
        'Failed to save profile details:',
        error
      );

      if (error instanceof Error) {
        switch (error.message) {
          case 'DISPLAY_NAME_REQUIRED':
            setError(
              'PLEASE ENTER YOUR TRAINER NAME.'
            );
            break;

          case 'PROFILE_NOT_FOUND':
            setError(
              'PROFILE COULD NOT BE FOUND.'
            );
            break;

          case 'PROFILE_DETAILS_ALREADY_EXISTS':
            setError(
              'PROFILE DETAILS ALREADY EXIST.'
            );
            break;

          case 'NOT_AUTHENTICATED':
            setError(
              'NO ACTIVE PROFILE FOUND.'
            );
            break;

          default:
            setError(
              'COULD NOT SAVE PROFILE. PLEASE TRY AGAIN.'
            );
        }
      } else {
        setError(
          'COULD NOT SAVE PROFILE. PLEASE TRY AGAIN.'
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
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ==================================
            HEADER
            ================================== */}

        <View style={styles.header}>
          <Text style={styles.logo}>
            GYMATE
          </Text>

          <Text style={styles.title}>
            {isEditMode
              ? 'EDIT PROFILE'
              : 'TRAINER SETUP'}
          </Text>

          <Text style={styles.subtitle}>
            {isEditMode
              ? 'UPDATE YOUR DATA'
              : 'BUILD YOUR PROFILE'}
          </Text>
        </View>

        {/* ==================================
            TRAINER CARD
            ================================== */}

        <View style={styles.card}>
          <Text
            style={styles.sectionTitle}
          >
            TRAINER DATA
          </Text>

          {/* TRAINER NAME */}

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

          {/* AGE */}

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

          {/* HEIGHT */}

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

          {/* WEIGHT */}

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

          {/* ==================================
              FITNESS GOAL
              ================================== */}

          <Text
            style={[
              styles.label,
              styles.optionLabel,
            ]}
          >
            FITNESS GOAL
          </Text>

          <View style={styles.optionList}>
            {FITNESS_GOALS.map(
              (goal) =>
                renderOption(
                  goal,
                  fitnessGoal,
                  setFitnessGoal
                )
            )}
          </View>

          {/* ==================================
              ACTIVITY LEVEL
              ================================== */}

          <Text
            style={[
              styles.label,
              styles.optionLabel,
            ]}
          >
            TRAINING LEVEL
          </Text>

          <View style={styles.optionList}>
            {ACTIVITY_LEVELS.map(
              (level) =>
                renderOption(
                  level,
                  activityLevel,
                  setActivityLevel
                )
            )}
          </View>

          {/* ==================================
              ERROR
              ================================== */}

          {error ? (
            <View
              style={styles.errorBox}
            >
              <Text
                style={styles.errorText}
              >
                {error}
              </Text>
            </View>
          ) : null}

          {/* ==================================
              CONTINUE
              ================================== */}

          <Pressable
            disabled={isSaving}
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueButton,

              pressed &&
                !isSaving &&
                styles.buttonPressed,

              isSaving &&
                styles.buttonDisabled,
            ]}
          >
            {isSaving ? (
              <View
                style={
                  styles.loadingRow
                }
              >
                <ActivityIndicator
                  size="small"
                  color={
                    colors.background
                  }
                />

                <Text
                  style={
                    styles.continueButtonText
                  }
                >
                  SAVING...
                </Text>
              </View>
            ) : (
              <Text
                style={
                  styles.continueButtonText
                }
              >
                {isEditMode
                  ? 'SAVE CHANGES'
                  : 'BEGIN JOURNEY'}
              </Text>
            )}
          </Pressable>
        </View>

        {/* ==================================
            FOOTER
            ================================== */}

        <View style={styles.footer}>
          <Text
            style={styles.footerText}
          >
            YOUR DATA STAYS ON THIS DEVICE.
          </Text>

          <Text
            style={styles.footerText}
          >
            YOU CAN CHANGE IT LATER.
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

  /* HEADER */

  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  logo: {
    fontFamily: 'PressStart2P',
    fontSize: 22,
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

  /* CARD */

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

  /* INPUTS */

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

  /* OPTIONS */

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
    backgroundColor: colors.background,
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

  /* ERROR */

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

  /* BUTTON */

  continueButton: {
    minHeight: 56,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },

  continueButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.background,
    textAlign: 'center',
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

  /* FOOTER */

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
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});