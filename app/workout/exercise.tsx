import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { colors, spacing } from '../../constants/theme';
import { useWorkout } from '../../context/WorkoutContext';

export default function ExerciseScreen() {
  const { exerciseId } =
    useLocalSearchParams<{
      exerciseId: string;
    }>();

  const {
    workout,
    updateSet,
  } = useWorkout();

  const workoutExercise =
    workout?.exercises.find(
      (item) =>
        item.exercise.id === exerciseId
    );

  /*
   * ========================================
   * EXERCISE NOT FOUND
   * ========================================
   */

  if (!workoutExercise) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          EXERCISE NOT FOUND
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

  const { exercise, sets } =
    workoutExercise;

  /*
   * ========================================
   * TOGGLE SET COMPLETE
   * ========================================
   */

  const handleToggleSet = (
    setId: string,
    completed: boolean
  ) => {
    updateSet(
      exerciseId,
      setId,
      {
        completed: !completed,
      }
    );
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
        {exercise.name}
      </Text>

      <Text style={styles.subtitle}>
        {exercise.primaryMuscle.toUpperCase()}
        {' • '}
        {exercise.equipment.toUpperCase()}
      </Text>

      {/* SETS */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          YOUR SETS
        </Text>
      </View>

      {sets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            NO SETS YET
          </Text>

          <Text style={styles.emptyText}>
            ADD YOUR FIRST SET TO START
            TRACKING THIS EXERCISE.
          </Text>
        </View>
      ) : (
        <View style={styles.setList}>
          {sets.map((set) => (
            <View
              key={set.id}
              style={[
                styles.setCard,
                set.completed &&
                  styles.setCardCompleted,
              ]}
            >
              {/* SET INFORMATION */}

              <View style={styles.setMain}>
                <Text style={styles.setNumber}>
                  SET {set.setNumber}
                </Text>

                <Text style={styles.setInfo}>
                  {set.weight} KG × {set.reps}
                </Text>

                <Text style={styles.setType}>
                  {set.type.toUpperCase()}
                </Text>
              </View>

              {/* COMPLETE BUTTON */}

              <Pressable
                style={({ pressed }) => [
                  styles.completeButton,

                  set.completed &&
                    styles.completeButtonDone,

                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={() =>
                  handleToggleSet(
                    set.id,
                    set.completed
                  )
                }
              >
                <Text
                  style={[
                    styles.completeButtonText,

                    set.completed &&
                      styles.completeButtonTextDone,
                  ]}
                >
                  {set.completed
                    ? '✓ DONE'
                    : 'COMPLETE SET'}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* ADD SET */}

      <Pressable
        style={({ pressed }) => [
          styles.addSetButton,
          pressed &&
            styles.buttonPressed,
        ]}
        onPress={() =>
          router.push({
            pathname: '/workout/add-set',
            params: {
              exerciseId,
            },
          })
        }
      >
        <Text style={styles.addSetText}>
          + ADD SET
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
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontFamily: 'VT323',
    fontSize: 22,
    color: colors.primary,
    marginBottom: spacing.xl,
  },

  /* SECTION */

  sectionHeader: {
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: colors.text,
  },

  /* EMPTY */

  emptyCard: {
    backgroundColor: colors.surface,

    borderWidth: 2,
    borderColor: colors.border,

    padding: spacing.lg,

    marginBottom: spacing.md,
  },

  emptyTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.text,

    marginBottom: spacing.md,
  },

  emptyText: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  /* SET LIST */

  setList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  /* SET CARD */

  setCard: {
    backgroundColor: colors.surface,

    borderWidth: 2,
    borderColor: colors.border,

    padding: spacing.md,
  },

  setCardCompleted: {
    borderColor: colors.primary,
  },

  setMain: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },

  setNumber: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.primary,

    width: 70,
  },

  setInfo: {
    flex: 1,

    fontFamily: 'VT323',
    fontSize: 22,
    color: colors.text,
  },

  setType: {
    fontFamily: 'PressStart2P',
    fontSize: 7,
    color: colors.textSecondary,

    marginLeft: spacing.sm,
  },

  /* COMPLETE SET */

  completeButton: {
    marginTop: spacing.md,

    borderWidth: 2,
    borderColor: colors.primary,

    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,

    alignItems: 'center',

    backgroundColor: colors.background,
  },

  completeButtonDone: {
    backgroundColor: colors.primary,
  },

  completeButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.primary,
  },

  completeButtonTextDone: {
    color: colors.background,
  },

  /* ADD SET */

  addSetButton: {
    borderWidth: 2,
    borderColor: colors.primary,

    paddingVertical: spacing.lg,

    alignItems: 'center',

    backgroundColor: colors.background,
  },

  addSetText: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.primary,
  },

  /* PRESSED */

  buttonPressed: {
    opacity: 0.65,
  },

  /* ERROR */

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

    marginBottom: spacing.xl,
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
});