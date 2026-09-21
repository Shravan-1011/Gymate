import { Pressable, StyleSheet, Text, View } from 'react-native';

import { exercises } from '../../data/exercises';
import { colors, spacing } from '../../constants/theme';
import { Exercise } from '../../types/workout';

type ExerciseSelectorProps = {
  selectedExerciseIds: string[];
  recommendedExerciseIds: string[];
  onToggleExercise: (exerciseId: string) => void;
};

export default function ExerciseSelector({
  selectedExerciseIds,
  recommendedExerciseIds,
  onToggleExercise,
}: ExerciseSelectorProps) {
  const recommendedExercises = exercises.filter(exercise =>
    recommendedExerciseIds.includes(exercise.id)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        RECOMMENDED EXERCISES
      </Text>

      {recommendedExercises.map(exercise => {
        const isSelected = selectedExerciseIds.includes(
          exercise.id
        );

        return (
          <Pressable
            key={exercise.id}
            style={[
              styles.exercise,
              isSelected && styles.selectedExercise,
            ]}
            onPress={() => onToggleExercise(exercise.id)}
          >
            <View style={styles.info}>
              <Text
                style={[
                  styles.name,
                  isSelected && styles.selectedName,
                ]}
              >
                {exercise.name}
              </Text>

              <Text style={styles.muscle}>
                {exercise.primaryMuscle
                  .replace('-', ' ')
                  .toUpperCase()}
              </Text>
            </View>

            <View
              style={[
                styles.checkbox,
                isSelected && styles.selectedCheckbox,
              ]}
            >
              <Text style={styles.checkboxText}>
                {isSelected ? '✓' : ''}
              </Text>
            </View>
          </Pressable>
        );
      })}

      <Pressable style={styles.addButton}>
        <Text style={styles.addButtonText}>
          + ADD EXERCISE MANUALLY
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
  },

  heading: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.primary,
    marginBottom: spacing.md,
  },

  exercise: {
    minHeight: 76,

    padding: spacing.md,

    marginBottom: spacing.sm,

    backgroundColor: colors.surface,

    borderWidth: 2,
    borderColor: colors.border,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedExercise: {
    borderColor: colors.primary,
  },

  info: {
    flex: 1,
    paddingRight: spacing.md,
  },

  name: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },

  selectedName: {
    color: colors.primary,
  },

  muscle: {
    fontFamily: 'VT323',
    fontSize: 17,
    color: colors.textSecondary,
  },

  checkbox: {
    width: 28,
    height: 28,

    borderWidth: 2,
    borderColor: colors.border,

    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedCheckbox: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  checkboxText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.background,
  },

  addButton: {
    marginTop: spacing.md,

    padding: spacing.md,

    borderWidth: 2,
    borderColor: colors.primary,

    alignItems: 'center',
  },

  addButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.primary,
    textAlign: 'center',
  },
});