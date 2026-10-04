import { useState } from 'react';

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

import {
  colors,
  spacing,
} from '../../constants/theme';

import { useWorkout } from '../../context/WorkoutContext';

import type { SetType } from '../../types/workout';

export default function AddSetScreen() {
  const {
    workout,
    addSet,
  } = useWorkout();

  const {
    exerciseId,
  } = useLocalSearchParams<{
    exerciseId: string;
  }>();

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [setType, setSetType] =
    useState<SetType>('working');

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  /*
   * ========================================
   * FIND EXERCISE
   * ========================================
   */

  const workoutExercise =
    workout?.exercises.find(
      (item) =>
        item.exercise.id === exerciseId
    );

  /*
   * ========================================
   * INVALID EXERCISE / WORKOUT
   * ========================================
   */

  if (
    !workoutExercise ||
    !workout ||
    workout.status !== 'active'
  ) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          WORKOUT NOT ACTIVE
        </Text>

        <Text style={styles.errorSubtext}>
          START A WORKOUT BEFORE ADDING SETS.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
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
   * SAVE SET
   * ========================================
   */

  const handleSaveSet = async () => {
  if (isSaving) {
    return;
  }

  setError('');

  const trimmedWeight =
    weight.trim();

  const trimmedReps =
    reps.trim();

  if (!trimmedWeight || !trimmedReps) {
    setError(
      'ENTER WEIGHT AND REPS'
    );
    return;
  }

  const parsedWeight =
    Number(trimmedWeight);

  const parsedReps =
    Number(trimmedReps);

  if (
    !Number.isFinite(parsedWeight) ||
    !Number.isFinite(parsedReps)
  ) {
    setError(
      'ENTER VALID NUMBERS'
    );
    return;
  }

  if (parsedWeight < 0) {
    setError(
      'WEIGHT CANNOT BE NEGATIVE'
    );
    return;
  }

  if (parsedReps <= 0) {
    setError(
      'REPS MUST BE GREATER THAN 0'
    );
    return;
  }

  if (!Number.isInteger(parsedReps)) {
    setError(
      'REPS MUST BE A WHOLE NUMBER'
    );
    return;
  }

  setIsSaving(true);

  try {
    /*
     * Read the latest workout state
     * before determining the set number.
     */
    const latestWorkoutExercise =
      workout?.exercises.find(
        (item) =>
          item.exercise.id ===
          exerciseId
      );

    if (!latestWorkoutExercise) {
      setError(
        'EXERCISE NO LONGER EXISTS'
      );
      setIsSaving(false);
      return;
    }

    const nextSetNumber =
      latestWorkoutExercise.sets.length + 1;

    await addSet(
      exerciseId,
      {
        id: `set-${Date.now()}`,
        setNumber: nextSetNumber,
        type: setType,
        weight: parsedWeight,
        reps: parsedReps,
        completed: false,
      }
    );

    router.back();
  } catch (error) {
    console.error(
      'Failed to add workout set:',
      error
    );

    setError(
      'FAILED TO SAVE SET'
    );

    setIsSaving(false);
  }
};

  /*
   * ========================================
   * SET TYPES
   * ========================================
   */

  const setTypes: SetType[] = [
    'warmup',
    'working',
    'drop',
    'failure',
  ];

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
      {/* BACK */}

      <Pressable
        style={styles.backRow}
        onPress={() => router.back()}
      >
        <Text style={styles.backArrow}>
          ‹
        </Text>

        <Text style={styles.backText}>
          BACK
        </Text>
      </Pressable>

      {/* HEADER */}

      <Text style={styles.title}>
        ADD SET
      </Text>

      <Text style={styles.exerciseName}>
        {workoutExercise.exercise.name}
      </Text>

      {/* WEIGHT */}

      <View style={styles.field}>
        <Text style={styles.label}>
          WEIGHT (KG)
        </Text>

        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder="0"
          placeholderTextColor={
            colors.textMuted
          }
          keyboardType="decimal-pad"
          style={styles.input}
          returnKeyType="next"
        />
      </View>

      {/* REPS */}

      <View style={styles.field}>
        <Text style={styles.label}>
          REPS
        </Text>

        <TextInput
          value={reps}
          onChangeText={setReps}
          placeholder="0"
          placeholderTextColor={
            colors.textMuted
          }
          keyboardType="number-pad"
          style={styles.input}
          returnKeyType="done"
        />
      </View>

      {/* SET TYPE */}

      <View style={styles.field}>
        <Text style={styles.label}>
          SET TYPE
        </Text>

        <View style={styles.typeList}>
          {setTypes.map((type) => {
            const selected =
              setType === type;

            return (
              <Pressable
                key={type}
                style={[
                  styles.typeButton,
                  selected &&
                    styles.typeButtonSelected,
                ]}
                onPress={() =>
                  setSetType(type)
                }
              >
                <Text
                  style={[
                    styles.typeText,
                    selected &&
                      styles.typeTextSelected,
                  ]}
                >
                  {type.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ERROR */}

      {error ? (
        <View style={styles.errorMessage}>
          <Text style={styles.errorMessageText}>
            {error}
          </Text>
        </View>
      ) : null}

      {/* SAVE */}

      <Pressable
  disabled={isSaving}
  style={({ pressed }) => [
    styles.saveButton,
    isSaving && styles.saveButtonDisabled,
    pressed &&
      !isSaving &&
      styles.buttonPressed,
  ]}
  onPress={handleSaveSet}
>
  <Text style={styles.saveButtonText}>
    {isSaving
      ? 'SAVING...'
      : 'SAVE SET'}
  </Text>
</Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: 150,
  },

  /* BACK */

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  backArrow: {
    fontFamily: 'VT323',
    fontSize: 36,
    color: colors.primary,
    marginRight: spacing.sm,
  },

  backText: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.textSecondary,
  },

  /* HEADER */

  title: {
    fontFamily: 'PressStart2P',
    fontSize: 20,
    color: colors.text,
    marginBottom: spacing.md,
  },

  exerciseName: {
    fontFamily: 'VT323',
    fontSize: 24,
    color: colors.primary,
    marginBottom: spacing.xl,
  },

  /* FIELDS */

  field: {
    marginBottom: spacing.xl,
  },

  label: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  input: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,

    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,

    fontFamily: 'VT323',
    fontSize: 24,
    color: colors.text,
  },

  /* SET TYPES */

  typeList: {
    gap: spacing.sm,
  },

  typeButton: {
    borderWidth: 2,
    borderColor: colors.border,

    backgroundColor: colors.surface,

    paddingVertical: spacing.md,

    alignItems: 'center',
  },

  typeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  typeText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.textSecondary,
  },

  typeTextSelected: {
    color: colors.background,
  },

  /* ERROR */

  errorMessage: {
    borderWidth: 2,
    borderColor: colors.primary,

    backgroundColor: colors.surface,

    padding: spacing.md,

    marginBottom: spacing.md,
  },

  errorMessageText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.primary,
    textAlign: 'center',
  },

  /* SAVE */

  saveButton: {
    borderWidth: 2,
    borderColor: colors.primary,

    backgroundColor: colors.primary,

    paddingVertical: spacing.lg,

    alignItems: 'center',

    marginTop: spacing.md,
  },

  saveButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.background,
  },

  buttonPressed: {
    opacity: 0.65,
  },

  /* ERROR SCREEN */

  errorContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.background,

    padding: spacing.lg,
  },

  errorText: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: colors.primary,

    marginBottom: spacing.md,
    textAlign: 'center',
  },

  errorSubtext: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.textSecondary,

    marginBottom: spacing.xl,
    textAlign: 'center',
  },

  backButton: {
    borderWidth: 2,
    borderColor: colors.border,

    padding: spacing.md,
  },

  backButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.text,
  },

  saveButtonDisabled: {
  opacity: 0.5,
},
});