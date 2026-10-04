import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  useEffect,
  useState,
} from 'react';

import {
  colors,
  spacing,
} from '../../constants/theme';

import {
  useWorkout,
} from '../../context/WorkoutContext';

import type {
  WorkoutSession,
} from '../../types/workout';

export default function ExerciseScreen() {
  const { exerciseId } =
    useLocalSearchParams<{
      exerciseId: string;
    }>();

  const {
    workout,
    updateSet,
    deleteSet,
    getPreviousWorkout,
  } = useWorkout();

  /*
   * ========================================
   * PREVIOUS WORKOUT
   * ========================================
   */

  const [
    previousWorkout,
    setPreviousWorkout,
  ] = useState<WorkoutSession | null>(
    null
  );

  const [
    isLoadingPrevious,
    setIsLoadingPrevious,
  ] = useState(true);

  const [
    deletingSetId,
    setDeletingSetId,
  ] = useState<string | null>(
    null
  );

  /*
   * ========================================
   * CURRENT EXERCISE
   * ========================================
   */

  const workoutExercise =
    workout?.exercises.find(
      (item) =>
        item.exercise.id === exerciseId
    );

  /*
   * ========================================
   * LOAD PREVIOUS SESSION
   * ========================================
   */

  useEffect(() => {
    let mounted = true;

    const loadPreviousWorkout =
      async () => {
        if (!workout || !exerciseId) {
          if (mounted) {
            setPreviousWorkout(null);
            setIsLoadingPrevious(false);
          }

          return;
        }

        try {
          setIsLoadingPrevious(true);

          const previous =
            await getPreviousWorkout(
              workout.splitId,
              workout.id
            );

          if (mounted) {
            setPreviousWorkout(previous);
          }
        } catch (error) {
          console.error(
            'Failed to load previous workout:',
            error
          );

          if (mounted) {
            setPreviousWorkout(null);
          }
        } finally {
          if (mounted) {
            setIsLoadingPrevious(false);
          }
        }
      };

    loadPreviousWorkout();

    return () => {
      mounted = false;
    };
  }, [
    workout?.id,
    workout?.splitId,
    exerciseId,
  ]);

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

  const {
    exercise,
    sets,
  } = workoutExercise;

  /*
   * ========================================
   * PREVIOUS EXERCISE
   * ========================================
   */

  const previousExercise =
    previousWorkout?.exercises.find(
      (item) =>
        item.exercise.id === exerciseId
    ) ?? null;

  /*
   * ========================================
   * TOGGLE COMPLETE
   * ========================================
   */

  const handleToggleSet = async (
    setId: string,
    completed: boolean
  ) => {
    try {
      await updateSet(
        exerciseId,
        setId,
        {
          completed: !completed,
        }
      );
    } catch (error) {
      console.error(
        'Failed to update workout set:',
        error
      );
    }
  };

  /*
   * ========================================
   * DELETE SET
   * ========================================
   */

  const handleDeleteSet = (
    setId: string,
    setNumber: number
  ) => {
    if (deletingSetId) {
      return;
    }

    Alert.alert(
      'DELETE SET',
      `DELETE SET ${setNumber}? THIS CANNOT BE UNDONE.`,
      [
        {
          text: 'CANCEL',
          style: 'cancel',
        },

        {
          text: 'DELETE',
          style: 'destructive',

          onPress: async () => {
            try {
              setDeletingSetId(
                setId
              );

              await deleteSet(
                exerciseId,
                setId
              );
            } catch (error) {
              console.error(
                'Failed to delete workout set:',
                error
              );

              Alert.alert(
                'DELETE FAILED',
                'THE SET COULD NOT BE DELETED.'
              );
            } finally {
              setDeletingSetId(null);
            }
          },
        },
      ]
    );
  };

  /*
   * ========================================
   * EDIT SET
   * ========================================
   */

  const handleEditSet = (
    setId: string
  ) => {
    router.push({
      pathname:
        '/workout/edit-set',
      params: {
        exerciseId,
        setId,
      },
    });
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
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* BACK */}

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

      {/* HEADER */}

      <Text style={styles.title}>
        {exercise.name}
      </Text>

      <Text style={styles.subtitle}>
        {exercise.primaryMuscle.toUpperCase()}
        {' • '}
        {exercise.equipment.toUpperCase()}
      </Text>

      {/* ================================== */}
      {/* YOUR SETS */}
      {/* ================================== */}

      <View style={styles.sectionHeader}>
        <Text
          style={styles.sectionTitle}
        >
          YOUR SETS
        </Text>
      </View>

      {sets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text
            style={styles.emptyTitle}
          >
            NO SETS YET
          </Text>

          <Text
            style={styles.emptyText}
          >
            ADD YOUR FIRST SET TO START
            TRACKING THIS EXERCISE.
          </Text>
        </View>
      ) : (
        <View style={styles.setList}>
          {sets.map((set) => {
            const isDeleting =
              deletingSetId === set.id;

            return (
              <View
                key={set.id}
                style={[
                  styles.setCard,

                  set.completed &&
                    styles.setCardCompleted,

                  isDeleting &&
                    styles.setCardDeleting,
                ]}
              >
                {/* SET INFORMATION */}

                <View style={styles.setMain}>
                  <Text
                    style={
                      styles.setNumber
                    }
                  >
                    SET {set.setNumber}
                  </Text>

                  <Text
                    style={
                      styles.setInfo
                    }
                  >
                    {set.weight} KG ×{' '}
                    {set.reps}
                  </Text>

                  <Text
                    style={
                      styles.setType
                    }
                  >
                    {set.type.toUpperCase()}
                  </Text>
                </View>

                {/* EDIT / DELETE */}

                <View
                  style={
                    styles.actionRow
                  }
                >
                  <Pressable
                    disabled={isDeleting}
                    style={({ pressed }) => [
                      styles.smallButton,
                      pressed &&
                        styles.buttonPressed,
                      isDeleting &&
                        styles.disabledButton,
                    ]}
                    onPress={() =>
                      handleEditSet(
                        set.id
                      )
                    }
                  >
                    <Text
                      style={
                        styles.editButtonText
                      }
                    >
                      EDIT
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={isDeleting}
                    style={({ pressed }) => [
                      styles.smallButton,
                      styles.deleteButton,
                      pressed &&
                        styles.buttonPressed,
                      isDeleting &&
                        styles.disabledButton,
                    ]}
                    onPress={() =>
                      handleDeleteSet(
                        set.id,
                        set.setNumber
                      )
                    }
                  >
                    <Text
                      style={
                        styles.deleteButtonText
                      }
                    >
                      {isDeleting
                        ? '...'
                        : 'DELETE'}
                    </Text>
                  </Pressable>
                </View>

                {/* COMPLETE */}

                <Pressable
                  disabled={isDeleting}
                  style={({ pressed }) => [
                    styles.completeButton,

                    set.completed &&
                      styles.completeButtonDone,

                    pressed &&
                      !isDeleting &&
                      styles.buttonPressed,

                    isDeleting &&
                      styles.disabledButton,
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
            );
          })}
        </View>
      )}

      {/* ================================== */}
      {/* PREVIOUS SESSION */}
      {/* ================================== */}

      <View
        style={styles.previousSection}
      >
        <View
          style={styles.sectionHeader}
        >
          <Text
            style={styles.sectionTitle}
          >
            PREVIOUS SESSION
          </Text>
        </View>

        {isLoadingPrevious ? (
          <View
            style={styles.previousCard}
          >
            <Text
              style={
                styles.previousMuted
              }
            >
              LOADING PREVIOUS SESSION...
            </Text>
          </View>
        ) : !previousExercise ||
          previousExercise.sets.length ===
            0 ? (
          <View
            style={styles.previousCard}
          >
            <Text
              style={
                styles.previousTitle
              }
            >
              NO PREVIOUS DATA
            </Text>

            <Text
              style={
                styles.previousMuted
              }
            >
              THIS IS YOUR FIRST LOGGED
              SESSION FOR THIS EXERCISE.
            </Text>
          </View>
        ) : (
          <View
            style={styles.previousCard}
          >
            {previousExercise.sets.map(
              (
                previousSet,
                index
              ) => (
                <View
                  key={
                    previousSet.id
                  }
                  style={[
                    styles.previousSetRow,

                    index ===
                      previousExercise
                        .sets.length -
                        1 &&
                      styles.previousSetRowLast,
                  ]}
                >
                  <Text
                    style={
                      styles.previousSetNumber
                    }
                  >
                    SET{' '}
                    {
                      previousSet.setNumber
                    }
                  </Text>

                  <Text
                    style={
                      styles.previousSetValue
                    }
                  >
                    {previousSet.weight} KG ×{' '}
                    {
                      previousSet.reps
                    }
                  </Text>

                  <Text
                    style={
                      styles.previousSetType
                    }
                  >
                    {previousSet.type.toUpperCase()}
                  </Text>
                </View>
              )
            )}
          </View>
        )}
      </View>

      {/* ================================== */}
      {/* ADD SET */}
      {/* ================================== */}

      <Pressable
        style={({ pressed }) => [
          styles.addSetButton,
          pressed &&
            styles.buttonPressed,
        ]}
        onPress={() =>
          router.push({
            pathname:
              '/workout/add-set',
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
    backgroundColor:
      colors.surface,

    borderWidth: 2,
    borderColor:
      colors.border,

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
    color:
      colors.textSecondary,
    lineHeight: 22,
  },

  /* SET LIST */

  setList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  /* SET CARD */

  setCard: {
    backgroundColor:
      colors.surface,

    borderWidth: 2,
    borderColor:
      colors.border,

    padding: spacing.md,
  },

  setCardCompleted: {
    borderColor:
      colors.primary,
  },

  setCardDeleting: {
    opacity: 0.5,
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
    color:
      colors.textSecondary,

    marginLeft: spacing.sm,
  },

  /* ACTIONS */

  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,

    marginTop: spacing.md,
  },

  smallButton: {
    flex: 1,

    borderWidth: 2,
    borderColor:
      colors.border,

    paddingVertical: spacing.sm,

    alignItems: 'center',

    backgroundColor:
      colors.background,
  },

  editButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: colors.primary,
  },

  deleteButton: {
    borderColor:
      colors.primary,
  },

  deleteButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: colors.primary,
  },

  /* COMPLETE */

  completeButton: {
    marginTop: spacing.sm,

    borderWidth: 2,
    borderColor:
      colors.primary,

    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,

    alignItems: 'center',

    backgroundColor:
      colors.background,
  },

  completeButtonDone: {
    backgroundColor:
      colors.primary,
  },

  completeButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: colors.primary,
  },

  completeButtonTextDone: {
    color:
      colors.background,
  },

  /* PREVIOUS SESSION */

  previousSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },

  previousCard: {
    backgroundColor:
      colors.surface,

    borderWidth: 2,
    borderColor:
      colors.border,

    padding: spacing.md,
  },

  previousTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: colors.text,

    marginBottom: spacing.sm,
  },

  previousMuted: {
    fontFamily: 'VT323',
    fontSize: 18,
    color:
      colors.textSecondary,
    lineHeight: 21,
  },

  previousSetRow: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: spacing.sm,

    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  previousSetRowLast: {
    borderBottomWidth: 0,
  },

  previousSetNumber: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: colors.primary,

    width: 65,
  },

  previousSetValue: {
    flex: 1,

    fontFamily: 'VT323',
    fontSize: 21,
    color: colors.text,
  },

  previousSetType: {
    fontFamily: 'PressStart2P',
    fontSize: 7,
    color:
      colors.textSecondary,
  },

  /* ADD SET */

  addSetButton: {
    borderWidth: 2,
    borderColor:
      colors.primary,

    paddingVertical: spacing.lg,

    alignItems: 'center',

    backgroundColor:
      colors.background,
  },

  addSetText: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: colors.primary,
  },

  /* GENERAL */

  buttonPressed: {
    opacity: 0.65,
  },

  disabledButton: {
    opacity: 0.5,
  },

  /* ERROR */

  errorContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      colors.background,

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