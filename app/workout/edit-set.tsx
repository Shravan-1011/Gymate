import {
  useState,
} from 'react';

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

import {
  useWorkout,
} from '../../context/WorkoutContext';

import type {
  SetType,
} from '../../types/workout';

export default function EditSetScreen() {
  const {
    workout,
    updateSet,
  } = useWorkout();

  const {
    exerciseId,
    setId,
  } =
    useLocalSearchParams<{
      exerciseId: string;
      setId: string;
    }>();

  /*
   * ========================================
   * FIND SET
   * ========================================
   */

  const workoutExercise =
    workout?.exercises.find(
      (item) =>
        item.exercise.id ===
        exerciseId
    );

  const currentSet =
    workoutExercise?.sets.find(
      (set) =>
        set.id === setId
    );

  /*
   * ========================================
   * STATE
   * ========================================
   */

  const [weight, setWeight] =
    useState(
      currentSet
        ? String(currentSet.weight)
        : ''
    );

  const [reps, setReps] =
    useState(
      currentSet
        ? String(currentSet.reps)
        : ''
    );

  const [setType, setSetType] =
    useState<SetType>(
      currentSet?.type ??
        'working'
    );

  const [error, setError] =
    useState('');

  const [isSaving, setIsSaving] =
    useState(false);

  /*
   * ========================================
   * INVALID SET
   * ========================================
   */

  if (
    !workout ||
    workout.status !== 'active' ||
    !workoutExercise ||
    !currentSet
  ) {
    return (
      <View
        style={styles.errorContainer}
      >
        <Text
          style={styles.errorTitle}
        >
          SET NOT FOUND
        </Text>

        <Text
          style={styles.errorText}
        >
          THIS SET NO LONGER EXISTS
          IN THE ACTIVE WORKOUT.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={styles.backButtonText}
          >
            GO BACK
          </Text>
        </Pressable>
      </View>
    );
  }

  /*
   * ========================================
   * SAVE
   * ========================================
   */

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setError('');

    const trimmedWeight =
      weight.trim();

    const trimmedReps =
      reps.trim();

    if (
      !trimmedWeight ||
      !trimmedReps
    ) {
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
      !Number.isFinite(
        parsedWeight
      ) ||
      !Number.isFinite(
        parsedReps
      )
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

    if (
      !Number.isInteger(
        parsedReps
      )
    ) {
      setError(
        'REPS MUST BE A WHOLE NUMBER'
      );

      return;
    }

    setIsSaving(true);

    try {
      await updateSet(
        exerciseId,
        setId,
        {
          weight: parsedWeight,
          reps: parsedReps,
          type: setType,
        }
      );

      router.back();
    } catch (error) {
      console.error(
        'Failed to update workout set:',
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
   * SCREEN
   * ========================================
   */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        style={styles.backRow}
        onPress={() =>
          router.back()
        }
      >
        <Text
          style={styles.backArrow}
        >
          ‹
        </Text>

        <Text
          style={styles.backText}
        >
          BACK
        </Text>
      </Pressable>

      <Text style={styles.title}>
        EDIT SET {currentSet.setNumber}
      </Text>

      <Text style={styles.subtitle}>
        {workoutExercise.exercise.name.toUpperCase()}
      </Text>

      {/* WEIGHT */}

      <View style={styles.field}>
        <Text style={styles.label}>
          WEIGHT KG
        </Text>

        <TextInput
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={
            colors.textSecondary
          }
          style={styles.input}
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
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={
            colors.textSecondary
          }
          style={styles.input}
        />
      </View>

      {/* SET TYPE */}

      <View style={styles.field}>
        <Text style={styles.label}>
          SET TYPE
        </Text>

        <View style={styles.typeGrid}>
          {(
            [
              'warmup',
              'working',
              'drop',
              'failure',
            ] as SetType[]
          ).map((type) => {
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

      {error ? (
        <View style={styles.errorCard}>
          <Text
            style={styles.errorCardText}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <Pressable
        disabled={isSaving}
        style={({ pressed }) => [
          styles.saveButton,

          isSaving &&
            styles.disabledButton,

          pressed &&
            !isSaving &&
            styles.buttonPressed,
        ]}
        onPress={handleSave}
      >
        <Text
          style={styles.saveButtonText}
        >
          {isSaving
            ? 'SAVING...'
            : 'SAVE CHANGES'}
        </Text>
      </Pressable>
    </ScrollView>
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
    paddingBottom: 100,
  },

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

  title: {
    fontFamily: 'PressStart2P',
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontFamily: 'VT323',
    fontSize: 22,
    color: colors.primary,
    marginBottom: spacing.xl,
  },

  field: {
    marginBottom: spacing.lg,
  },

  label: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  input: {
    backgroundColor:
      colors.surface,

    borderWidth: 2,
    borderColor:
      colors.border,

    color: colors.text,

    fontFamily: 'VT323',
    fontSize: 24,

    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  typeGrid: {
    gap: spacing.sm,
  },

  typeButton: {
    borderWidth: 2,
    borderColor:
      colors.border,

    paddingVertical: spacing.md,

    alignItems: 'center',

    backgroundColor:
      colors.surface,
  },

  typeButtonSelected: {
    borderColor:
      colors.primary,

    backgroundColor:
      colors.primary,
  },

  typeText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color:
      colors.textSecondary,
  },

  typeTextSelected: {
    color:
      colors.background,
  },

  errorCard: {
    borderWidth: 2,
    borderColor:
      colors.primary,

    padding: spacing.md,

    marginBottom: spacing.lg,
  },

  errorCardText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.primary,
  },

  saveButton: {
    borderWidth: 2,
    borderColor:
      colors.primary,

    backgroundColor:
      colors.primary,

    paddingVertical: spacing.lg,

    alignItems: 'center',
  },

  saveButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color:
      colors.background,
  },

  disabledButton: {
    opacity: 0.5,
  },

  buttonPressed: {
    opacity: 0.65,
  },

  errorContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      colors.background,

    padding: spacing.lg,
  },

  errorTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: colors.primary,

    marginBottom: spacing.md,
  },

  errorText: {
    fontFamily: 'VT323',
    fontSize: 20,
    color:
      colors.textSecondary,

    textAlign: 'center',

    marginBottom: spacing.xl,
  },

  backButton: {
    borderWidth: 2,
    borderColor:
      colors.border,

    padding: spacing.md,
  },

  backButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.text,
  },
});