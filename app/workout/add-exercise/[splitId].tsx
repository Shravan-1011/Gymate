import { useMemo, useState } from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { workoutSplits } from '../../../data/workoutSplits';
import { exercises } from '../../../data/exercises';
import { colors, spacing } from '../../../constants/theme';
import { useWorkout } from '../../../context/WorkoutContext';
import {
  Exercise,
  MuscleGroup,
} from '../../../types/workout';

/*
 * ========================================
 * MUSCLE GROUPS
 * ========================================
 */

const muscleGroups: MuscleGroup[] = [
  'chest',
  'upper-chest',
  'back',
  'lats',
  'traps',
  'shoulders',
  'rear-delts',
  'biceps',
  'triceps',
  'forearms',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'abs',
  'hip-flexors',
];

/*
 * ========================================
 * EQUIPMENT
 * ========================================
 */

const equipmentOptions = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'ez-bar',
  'kettlebell',
  'smith-machine',
  'resistance-band',
  'other',
];

/*
 * ========================================
 * SCREEN
 * ========================================
 */

export default function AddExerciseScreen() {
  const {
    addExercise,
    customExercises,
    addCustomExercise,
  } = useWorkout();

  const params = useLocalSearchParams<{
    splitId?: string | string[];
  }>();

  /*
   * ========================================
   * SAFE SPLIT ID
   * ========================================
   */

  const splitId = Array.isArray(params.splitId)
    ? params.splitId[0]
    : params.splitId;

  /*
   * ========================================
   * STATE
   * ========================================
   */

  const [search, setSearch] =
    useState('');

  const [showCustomForm, setShowCustomForm] =
    useState(false);

  const [customName, setCustomName] =
    useState('');

  const [customMuscle, setCustomMuscle] =
    useState<MuscleGroup>('chest');

  const [customEquipment, setCustomEquipment] =
    useState('barbell');

  const [secondaryMuscles, setSecondaryMuscles] =
    useState<MuscleGroup[]>([]);

  const [customError, setCustomError] =
    useState('');

  /*
   * ========================================
   * FIND SELECTED SPLIT
   * ========================================
   */

  const selectedSplit = workoutSplits.find(
    (split) => split.id === splitId
  );

  /*
   * ========================================
   * COMPLETE EXERCISE LIBRARY
   * ========================================
   */

  const allExercises = useMemo(
    () => [
      ...exercises,
      ...customExercises,
    ],
    [customExercises]
  );

  /*
   * ========================================
   * SPLIT NOT FOUND
   * ========================================
   */

  if (!selectedSplit) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          SPLIT NOT FOUND
        </Text>

        <Text style={styles.errorSubtext}>
          INVALID OR MISSING WORKOUT SPLIT
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
        >
          <Text style={styles.backButtonText}>
            GO BACK
          </Text>
        </Pressable>
      </View>
    );
  }

  /*
   * ========================================
   * RECOMMENDED EXERCISES
   * ========================================
   */

  const recommendedExercises =
    selectedSplit.recommendedExerciseIds
      .map((exerciseId) =>
        allExercises.find(
          (exercise) =>
            exercise.id === exerciseId
        )
      )
      .filter(
        (
          exercise
        ): exercise is Exercise =>
          exercise !== undefined
      );

  /*
   * ========================================
   * SEARCH
   * ========================================
   */

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredExercises =
    normalizedSearch.length === 0
      ? []
      : allExercises.filter((exercise) =>
          exercise.name
            .toLowerCase()
            .includes(normalizedSearch)
        );

  /*
   * ========================================
   * ADD EXISTING EXERCISE
   * ========================================
   */

  const handleAddExercise = (
    exercise: Exercise
  ) => {
    addExercise(exercise);
    router.back();
  };

  /*
   * ========================================
   * TOGGLE SECONDARY MUSCLE
   * ========================================
   */

  const toggleSecondaryMuscle = (
    muscle: MuscleGroup
  ) => {
    if (muscle === customMuscle) {
      return;
    }

    setSecondaryMuscles(
      (currentMuscles) => {
        if (
          currentMuscles.includes(muscle)
        ) {
          return currentMuscles.filter(
            (item) => item !== muscle
          );
        }

        return [
          ...currentMuscles,
          muscle,
        ];
      }
    );
  };

  /*
   * ========================================
   * CREATE CUSTOM EXERCISE
   * ========================================
   */

  const handleCreateCustomExercise =
    () => {
      setCustomError('');

      const trimmedName =
        customName.trim();

      /*
       * NAME VALIDATION
       */

      if (!trimmedName) {
        setCustomError(
          'ENTER AN EXERCISE NAME.'
        );
        return;
      }

      if (trimmedName.length < 2) {
        setCustomError(
          'EXERCISE NAME IS TOO SHORT.'
        );
        return;
      }

      if (trimmedName.length > 60) {
        setCustomError(
          'EXERCISE NAME IS TOO LONG.'
        );
        return;
      }

      /*
       * DUPLICATE NAME CHECK
       */

      const duplicateName =
        allExercises.some(
          (exercise) =>
            exercise.name
              .trim()
              .toLowerCase() ===
            trimmedName.toLowerCase()
        );

      if (duplicateName) {
        setCustomError(
          'AN EXERCISE WITH THIS NAME ALREADY EXISTS.'
        );
        return;
      }

      /*
       * GENERATE UNIQUE ID
       */

      const normalizedId =
        trimmedName
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            '-'
          )
          .replace(
            /^-+|-+$/g,
            ''
          );

      const uniqueId =
        `custom-${normalizedId}-${Date.now()}`;

      /*
       * CREATE EXERCISE
       */

      const customExercise: Exercise = {
        id: uniqueId,

        name:
          trimmedName.toUpperCase(),

        primaryMuscle:
          customMuscle,

        secondaryMuscles:
          secondaryMuscles.filter(
            (muscle) =>
              muscle !== customMuscle
          ),

        equipment:
          customEquipment,

        isCustom: true,
      };

      /*
       * SAVE CUSTOM EXERCISE
       */

      addCustomExercise(
        customExercise
      );

      /*
       * ALSO ADD IT DIRECTLY
       * TO THE CURRENT WORKOUT.
       *
       * This means the user doesn't
       * have to create the exercise,
       * go back, search for it and
       * add it again.
       */

      addExercise(
        customExercise
      );

      /*
       * RESET FORM
       */

      setCustomName('');
      setCustomMuscle('chest');
      setCustomEquipment('barbell');
      setSecondaryMuscles([]);
      setCustomError('');
      setShowCustomForm(false);

      /*
       * RETURN TO ACTIVE WORKOUT
       */

      router.back();
    };

  /*
   * ========================================
   * SCREEN
   * ========================================
   */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ====================================
          BACK
          ==================================== */}

      <Pressable
        style={styles.backRow}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/');
          }
        }}
      >
        <Text style={styles.backArrow}>
          ‹
        </Text>

        <Text style={styles.backText}>
          BACK
        </Text>
      </Pressable>

      {/* ====================================
          HEADER
          ==================================== */}

      <Text style={styles.title}>
        ADD EXERCISE
      </Text>

      <Text style={styles.subtitle}>
        {selectedSplit.name} DAY
      </Text>

      {/* ====================================
          SEARCH
          ==================================== */}

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="SEARCH EXERCISES..."
        placeholderTextColor={
          colors.textSecondary
        }
        style={styles.searchInput}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      {/* ====================================
          RECOMMENDED
          ==================================== */}

      {normalizedSearch.length === 0 &&
        !showCustomForm && (
          <>
            <Text style={styles.sectionTitle}>
              RECOMMENDED FOR YOU
            </Text>

            {recommendedExercises.length >
            0 ? (
              <View
                style={
                  styles.exerciseList
                }
              >
                {recommendedExercises.map(
                  (exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onAdd={
                        handleAddExercise
                      }
                    />
                  )
                )}
              </View>
            ) : (
              <View
                style={
                  styles.emptyCard
                }
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  NO RECOMMENDATIONS
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  NO EXERCISES HAVE BEEN
                  ASSIGNED TO THIS SPLIT
                  YET.
                </Text>
              </View>
            )}
          </>
        )}

      {/* ====================================
          SEARCH RESULTS
          ==================================== */}

      {normalizedSearch.length > 0 &&
        !showCustomForm && (
          <>
            <Text style={styles.sectionTitle}>
              SEARCH RESULTS
            </Text>

            {filteredExercises.length >
            0 ? (
              <View
                style={
                  styles.exerciseList
                }
              >
                {filteredExercises.map(
                  (exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onAdd={
                        handleAddExercise
                      }
                    />
                  )
                )}
              </View>
            ) : (
              <View
                style={
                  styles.emptyCard
                }
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  NO EXERCISES FOUND
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  TRY A DIFFERENT SEARCH
                  OR CREATE A CUSTOM
                  EXERCISE.
                </Text>
              </View>
            )}
          </>
        )}

      {/* ====================================
          CUSTOM EXERCISE BUTTON
          ==================================== */}

      {!showCustomForm && (
        <Pressable
          style={({ pressed }) => [
            styles.customButton,
            pressed &&
              styles.buttonPressed,
          ]}
          onPress={() => {
            setSearch('');
            setCustomError('');
            setShowCustomForm(true);
          }}
        >
          <Text
            style={
              styles.customButtonText
            }
          >
            + CREATE CUSTOM EXERCISE
          </Text>
        </Pressable>
      )}

      {/* ====================================
          CUSTOM EXERCISE FORM
          ==================================== */}

      {showCustomForm && (
        <View
          style={styles.customForm}
        >
          {/* FORM HEADER */}

          <View
            style={
              styles.customFormHeader
            }
          >
            <Text
              style={
                styles.customFormTitle
              }
            >
              CREATE EXERCISE
            </Text>

            <Pressable
              onPress={() => {
                setShowCustomForm(
                  false
                );
                setCustomError('');
              }}
            >
              <Text
                style={
                  styles.cancelText
                }
              >
                CANCEL
              </Text>
            </Pressable>
          </View>

          {/* NAME */}

          <Text
            style={
              styles.formLabel
            }
          >
            EXERCISE NAME
          </Text>

          <TextInput
            value={customName}
            onChangeText={(value) => {
              setCustomName(value);
              setCustomError('');
            }}
            placeholder="E.G. PREACHER CURL"
            placeholderTextColor={
              colors.textSecondary
            }
            style={styles.formInput}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={60}
          />

          {/* PRIMARY MUSCLE */}

          <Text
            style={
              styles.formLabel
            }
          >
            PRIMARY MUSCLE
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.optionScroll
            }
          >
            {muscleGroups.map(
              (muscle) => {
                const active =
                  muscle ===
                  customMuscle;

                return (
                  <Pressable
                    key={muscle}
                    style={[
                      styles.optionChip,
                      active &&
                        styles.optionChipActive,
                    ]}
                    onPress={() => {
                      setCustomMuscle(
                        muscle
                      );

                      setSecondaryMuscles(
                        (
                          current
                        ) =>
                          current.filter(
                            (item) =>
                              item !==
                              muscle
                          )
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        active &&
                          styles.optionChipTextActive,
                      ]}
                    >
                      {muscle
                        .replace(
                          '-',
                          ' '
                        )
                        .toUpperCase()}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>

          {/* EQUIPMENT */}

          <Text
            style={
              styles.formLabel
            }
          >
            EQUIPMENT
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.optionScroll
            }
          >
            {equipmentOptions.map(
              (equipment) => {
                const active =
                  equipment ===
                  customEquipment;

                return (
                  <Pressable
                    key={equipment}
                    style={[
                      styles.optionChip,
                      active &&
                        styles.optionChipActive,
                    ]}
                    onPress={() =>
                      setCustomEquipment(
                        equipment
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        active &&
                          styles.optionChipTextActive,
                      ]}
                    >
                      {equipment
                        .replace(
                          '-',
                          ' '
                        )
                        .toUpperCase()}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>

          {/* SECONDARY MUSCLES */}

          <Text
            style={
              styles.formLabel
            }
          >
            SECONDARY MUSCLES
          </Text>

          <Text
            style={
              styles.formHint
            }
          >
            OPTIONAL — SELECT ANY MUSCLES
            INVOLVED.
          </Text>

          <View
            style={
              styles.secondaryGrid
            }
          >
            {muscleGroups.map(
              (muscle) => {
                const disabled =
                  muscle ===
                  customMuscle;

                const active =
                  secondaryMuscles.includes(
                    muscle
                  );

                return (
                  <Pressable
                    key={muscle}
                    disabled={disabled}
                    style={[
                      styles.secondaryChip,
                      active &&
                        styles.secondaryChipActive,
                      disabled &&
                        styles.secondaryChipDisabled,
                    ]}
                    onPress={() =>
                      toggleSecondaryMuscle(
                        muscle
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.secondaryChipText,
                        active &&
                          styles.secondaryChipTextActive,
                      ]}
                    >
                      {muscle
                        .replace(
                          '-',
                          ' '
                        )
                        .toUpperCase()}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>

          {/* ERROR */}

          {customError.length > 0 && (
            <View
              style={
                styles.errorMessage
              }
            >
              <Text
                style={
                  styles.errorMessageText
                }
              >
                {customError}
              </Text>
            </View>
          )}

          {/* CREATE */}

          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={
              handleCreateCustomExercise
            }
          >
            <Text
              style={
                styles.createButtonText
              }
            >
              CREATE & ADD TO WORKOUT
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

/*
 * ========================================
 * EXERCISE CARD
 * ========================================
 */

type ExerciseCardProps = {
  exercise: Exercise;

  onAdd: (
    exercise: Exercise
  ) => void;
};

function ExerciseCard({
  exercise,
  onAdd,
}: ExerciseCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.exerciseCard,
        pressed &&
          styles.exerciseCardPressed,
      ]}
      onPress={() => onAdd(exercise)}
    >
      <View
        style={styles.exerciseInfo}
      >
        <View
          style={
            styles.exerciseNameRow
          }
        >
          <Text
            style={
              styles.exerciseName
            }
          >
            {exercise.name}
          </Text>

          {exercise.isCustom && (
            <View
              style={
                styles.customBadge
              }
            >
              <Text
                style={
                  styles.customBadgeText
                }
              >
                CUSTOM
              </Text>
            </View>
          )}
        </View>

        <Text
          style={
            styles.exerciseMeta
          }
        >
          {exercise.primaryMuscle.toUpperCase()}
          {' • '}
          {exercise.equipment.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.addIcon}>
        +
      </Text>
    </Pressable>
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
    backgroundColor:
      colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: 150,
  },

  /* BACK */

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom:
      spacing.xl,
  },

  backArrow: {
    fontFamily: 'VT323',
    fontSize: 36,
    color: colors.primary,
    marginRight:
      spacing.sm,
  },

  backText: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      colors.textSecondary,
  },

  /* HEADER */

  title: {
    fontFamily:
      'PressStart2P',
    fontSize: 20,
    color: colors.text,
    marginBottom:
      spacing.sm,
  },

  subtitle: {
    fontFamily: 'VT323',
    fontSize: 22,
    color: colors.primary,
    marginBottom:
      spacing.xl,
  },

  /* SEARCH */

  searchInput: {
    borderWidth: 2,
    borderColor:
      colors.border,

    backgroundColor:
      colors.surface,

    paddingHorizontal:
      spacing.md,
    paddingVertical:
      spacing.md,

    fontFamily: 'VT323',
    fontSize: 21,
    color: colors.text,

    marginBottom:
      spacing.xl,
  },

  /* SECTION */

  sectionTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color: colors.text,
    marginBottom:
      spacing.md,
  },

  /* EXERCISES */

  exerciseList: {
    gap: spacing.sm,
    marginBottom:
      spacing.xl,
  },

  exerciseCard: {
    minHeight: 70,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    paddingHorizontal:
      spacing.md,
    paddingVertical:
      spacing.md,

    backgroundColor:
      colors.surface,

    borderWidth: 2,
    borderColor:
      colors.border,
  },

  exerciseCardPressed: {
    opacity: 0.65,

    transform: [
      {
        translateX: 2,
      },
    ],
  },

  exerciseInfo: {
    flex: 1,
    paddingRight:
      spacing.md,
  },

  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom:
      spacing.sm,
  },

  exerciseName: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color: colors.text,
    marginRight:
      spacing.sm,
  },

  customBadge: {
    borderWidth: 1,
    borderColor:
      colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },

  customBadgeText: {
    fontFamily:
      'PressStart2P',
    fontSize: 5,
    color:
      colors.primary,
  },

  exerciseMeta: {
    fontFamily: 'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,
  },

  addIcon: {
    fontFamily: 'VT323',
    fontSize: 32,
    color:
      colors.primary,
  },

  /* EMPTY */

  emptyCard: {
    backgroundColor:
      colors.surface,

    borderWidth: 2,
    borderColor:
      colors.border,

    padding: spacing.lg,

    marginBottom:
      spacing.xl,
  },

  emptyTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color: colors.text,

    marginBottom:
      spacing.md,
  },

  emptyText: {
    fontFamily: 'VT323',
    fontSize: 20,
    color:
      colors.textSecondary,
    lineHeight: 22,
  },

  /* CUSTOM BUTTON */

  customButton: {
    borderWidth: 2,
    borderColor:
      colors.primary,

    paddingVertical:
      spacing.md,

    alignItems: 'center',

    backgroundColor:
      colors.background,
  },

  customButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color:
      colors.primary,
  },

  buttonPressed: {
    opacity: 0.65,
  },

  /* CUSTOM FORM */

  customForm: {
    backgroundColor:
      colors.surface,

    borderWidth: 2,
    borderColor:
      colors.primary,

    padding: spacing.md,

    marginBottom:
      spacing.xl,
  },

  customFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    marginBottom:
      spacing.xl,
  },

  customFormTitle: {
    fontFamily:
      'PressStart2P',
    fontSize: 11,
    color:
      colors.primary,
  },

  cancelText: {
    fontFamily:
      'PressStart2P',
    fontSize: 7,
    color:
      colors.textSecondary,
  },

  formLabel: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color:
      colors.text,

    marginBottom:
      spacing.sm,
    marginTop:
      spacing.md,
  },

  formInput: {
    borderWidth: 2,
    borderColor:
      colors.border,

    backgroundColor:
      colors.background,

    paddingHorizontal:
      spacing.md,
    paddingVertical:
      spacing.md,

    fontFamily: 'VT323',
    fontSize: 21,
    color: colors.text,
  },

  formHint: {
    fontFamily: 'VT323',
    fontSize: 17,
    color:
      colors.textSecondary,

    marginBottom:
      spacing.sm,
  },

  optionScroll: {
    gap: spacing.sm,
    paddingBottom:
      spacing.sm,
  },

  optionChip: {
    borderWidth: 1,
    borderColor:
      colors.border,

    backgroundColor:
      colors.background,

    paddingHorizontal:
      spacing.md,
    paddingVertical:
      spacing.sm,
  },

  optionChipActive: {
    borderWidth: 2,
    borderColor:
      colors.primary,
    backgroundColor:
      colors.background,
  },

  optionChipText: {
    fontFamily:
      'PressStart2P',
    fontSize: 6,
    color:
      colors.textSecondary,
  },

  optionChipTextActive: {
    color:
      colors.primary,
  },

  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  secondaryChip: {
    borderWidth: 1,
    borderColor:
      colors.border,

    paddingHorizontal:
      spacing.sm,
    paddingVertical:
      spacing.sm,

    backgroundColor:
      colors.background,
  },

  secondaryChipActive: {
    borderWidth: 2,
    borderColor:
      colors.primary,
  },

  secondaryChipDisabled: {
    opacity: 0.3,
  },

  secondaryChipText: {
    fontFamily:
      'PressStart2P',
    fontSize: 5,
    color:
      colors.textSecondary,
  },

  secondaryChipTextActive: {
    color:
      colors.primary,
  },

  errorMessage: {
    borderWidth: 1,
    borderColor:
      colors.primary,

    padding: spacing.sm,

    marginTop:
      spacing.lg,
  },

  errorMessageText: {
    fontFamily: 'VT323',
    fontSize: 18,
    color:
      colors.primary,
  },

  createButton: {
    borderWidth: 2,
    borderColor:
      colors.primary,

    backgroundColor:
      colors.primary,

    paddingVertical:
      spacing.md,

    alignItems: 'center',

    marginTop:
      spacing.lg,
  },

  createButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 8,
    color:
      colors.background,
    textAlign: 'center',
  },

  /* ERROR */

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent:
      'center',

    backgroundColor:
      colors.background,

    padding: spacing.lg,
  },

  errorText: {
    fontFamily:
      'PressStart2P',
    fontSize: 14,
    color:
      colors.primary,

    marginBottom:
      spacing.md,
  },

  errorSubtext: {
    fontFamily: 'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,

    marginBottom:
      spacing.xl,
    textAlign: 'center',
  },

  backButton: {
    borderWidth: 2,
    borderColor:
      colors.border,

    padding: spacing.md,
  },

  backButtonText: {
    fontFamily:
      'PressStart2P',
    fontSize: 10,
    color: colors.text,
  },
});