import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type {
  Exercise,
  WorkoutSession,
  WorkoutSet,
} from '../types/workout';

import {
  createWorkout,
  addWorkoutExercise,
  removeWorkoutExercise,
  addWorkoutSet,
  updateWorkoutSet,
  deleteWorkoutSet,
  completeWorkout,
  getWorkoutHistory,
  getActiveWorkout,
  getPreviousWorkout as getPreviousWorkoutFromDatabase,
  getWorkoutById as getWorkoutByIdFromDatabase,

  getCustomExercises,
  createCustomExercise,
  deleteCustomExercise,
} from '../database/workoutRepository';

import { useProfile } from './ProfileContext';

/*
 * ========================================
 * CONTEXT TYPE
 * ========================================
 */

type WorkoutContextType = {
  workout: WorkoutSession | null;

  workoutHistory: WorkoutSession[];

  customExercises: Exercise[];

  isLoading: boolean;

  startWorkout: (
    splitId: string,
    name: string
  ) => Promise<void>;

  finishWorkout: () => Promise<void>;

  addExercise: (
    exercise: Exercise
  ) => Promise<void>;

  removeExercise: (
    exerciseId: string
  ) => Promise<void>;

  addSet: (
    exerciseId: string,
    set: WorkoutSet
  ) => Promise<void>;

  updateSet: (
    exerciseId: string,
    setId: string,
    updates: Partial<WorkoutSet>
  ) => Promise<void>;

  deleteSet: (
    exerciseId: string,
    setId: string
  ) => Promise<void>;

  addCustomExercise: (
    exercise: Exercise
  ) => Promise<void>;

  removeCustomExercise: (
    exerciseId: string
  ) => Promise<void>;

  getPreviousWorkout: (
    splitId: string,
    excludeWorkoutId?: string
  ) => Promise<WorkoutSession | null>;

  getWorkoutById: (
    workoutId: string
  ) => Promise<WorkoutSession | null>;

  refreshWorkoutData: () => Promise<void>;
};

/*
 * ========================================
 * CONTEXT
 * ========================================
 */

const WorkoutContext =
  createContext<
    WorkoutContextType | undefined
  >(undefined);

/*
 * ========================================
 * PROVIDER
 * ========================================
 */

export function WorkoutProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } =
    useProfile();

  /*
   * ======================================
   * STATE
   * ======================================
   */

  const [workout, setWorkout] =
    useState<WorkoutSession | null>(
      null
    );

  const [
    workoutHistory,
    setWorkoutHistory,
  ] = useState<WorkoutSession[]>(
    []
  );

  const [
    customExercises,
    setCustomExercises,
  ] = useState<Exercise[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  /*
   * ========================================
   * LOAD ALL WORKOUT DATA
   * ========================================
   */

  useEffect(() => {
    const loadWorkoutData =
      async () => {
        setIsLoading(true);

        try {
          if (!profile) {
            setWorkout(null);
            setWorkoutHistory([]);
            setCustomExercises([]);
            return;
          }

          const [
            activeWorkout,
            history,
            customExercisesFromDatabase,
          ] = await Promise.all([
            getActiveWorkout(
              profile.id
            ),

            getWorkoutHistory(
              profile.id
            ),

            getCustomExercises(
              profile.id
            ),
          ]);

          setWorkout(
            activeWorkout
          );

          setWorkoutHistory(
            history
          );

          setCustomExercises(
            customExercisesFromDatabase
          );
        } catch (error) {
          console.error(
            'Failed to load workout data:',
            error
          );

          setWorkout(null);
          setWorkoutHistory([]);
          setCustomExercises([]);
        } finally {
          setIsLoading(false);
        }
      };

    loadWorkoutData();
  }, [profile?.id]);

  /*
   * ========================================
   * REFRESH WORKOUT DATA
   * ========================================
   */

  const refreshWorkoutData =
    async (): Promise<void> => {
      if (!profile) {
        setWorkout(null);
        setWorkoutHistory([]);
        setCustomExercises([]);
        return;
      }

      try {
        const [
          activeWorkout,
          history,
          customExercisesFromDatabase,
        ] = await Promise.all([
          getActiveWorkout(
            profile.id
          ),

          getWorkoutHistory(
            profile.id
          ),

          getCustomExercises(
            profile.id
          ),
        ]);

        setWorkout(
          activeWorkout
        );

        setWorkoutHistory(
          history
        );

        setCustomExercises(
          customExercisesFromDatabase
        );
      } catch (error) {
        console.error(
          'Failed to refresh workout data:',
          error
        );
      }
    };

  /*
   * ========================================
   * START WORKOUT
   * ========================================
   */

  const startWorkout =
    async (
      splitId: string,
      name: string
    ): Promise<void> => {
      if (!profile) {
        throw new Error(
          'NOT_AUTHENTICATED'
        );
      }

      const existingWorkout =
        await getActiveWorkout(
          profile.id
        );

      if (existingWorkout) {
        setWorkout(
          existingWorkout
        );

        return;
      }

      const newWorkout =
        await createWorkout(
          profile.id,
          splitId,
          name
        );

      setWorkout(
        newWorkout
      );
    };

  /*
   * ========================================
   * FINISH WORKOUT
   * ========================================
   */

  const finishWorkout =
    async (): Promise<void> => {
      if (!profile) {
        throw new Error(
          'NOT_AUTHENTICATED'
        );
      }

      if (!workout) {
        return;
      }

      const completedWorkout =
        await completeWorkout(
          profile.id,
          workout.id
        );

      if (!completedWorkout) {
        await refreshWorkoutData();
        return;
      }

      setWorkout(null);

      setWorkoutHistory(
        (currentHistory) => {
          const alreadyExists =
            currentHistory.some(
              (item) =>
                item.id ===
                completedWorkout.id
            );

          if (alreadyExists) {
            return currentHistory;
          }

          return [
            completedWorkout,
            ...currentHistory,
          ];
        }
      );
    };

  /*
   * ========================================
   * ADD EXERCISE
   * ========================================
   */

  const addExercise =
    async (
      exercise: Exercise
    ): Promise<void> => {
      if (!profile) {
        throw new Error(
          'NOT_AUTHENTICATED'
        );
      }

      if (!workout) {
        throw new Error(
          'NO_ACTIVE_WORKOUT'
        );
      }

      await addWorkoutExercise(
        profile.id,
        workout.id,
        exercise
      );

      const updatedWorkout =
        await getActiveWorkout(
          profile.id
        );

      setWorkout(
        updatedWorkout
      );
    };

  /*
   * ========================================
   * REMOVE EXERCISE
   * ========================================
   */

  const removeExercise =
    async (
      exerciseId: string
    ): Promise<void> => {
      if (!profile) {
        throw new Error(
          'NOT_AUTHENTICATED'
        );
      }

      if (!workout) {
        throw new Error(
          'NO_ACTIVE_WORKOUT'
        );
      }

      await removeWorkoutExercise(
        profile.id,
        workout.id,
        exerciseId
      );

      const updatedWorkout =
        await getActiveWorkout(
          profile.id
        );

      setWorkout(
        updatedWorkout
      );
    };

  /*
   * ========================================
   * ADD SET
   * ========================================
   */

  const addSet =
    async (
      exerciseId: string,
      set: WorkoutSet
    ): Promise<void> => {
      if (!profile) {
        throw new Error(
          'NOT_AUTHENTICATED'
        );
      }

      if (!workout) {
        throw new Error(
          'NO_ACTIVE_WORKOUT'
        );
      }

      await addWorkoutSet(
        profile.id,
        workout.id,
        exerciseId,
        set
      );

      const updatedWorkout =
        await getActiveWorkout(
          profile.id
        );

      setWorkout(
        updatedWorkout
      );
    };

  /*
   * ========================================
   * UPDATE SET
   * ========================================
   */

  const updateSet =
    async (
      exerciseId: string,
      setId: string,
      updates: Partial<WorkoutSet>
    ): Promise<void> => {
      if (!profile) {
        throw new Error(
          'NOT_AUTHENTICATED'
        );
      }

      if (!workout) {
        throw new Error(
          'NO_ACTIVE_WORKOUT'
        );
      }

      void exerciseId;

      await updateWorkoutSet(
        profile.id,
        workout.id,
        setId,
        updates
      );

      const updatedWorkout =
        await getActiveWorkout(
          profile.id
        );

      setWorkout(
        updatedWorkout
      );
    };

  /*
   * ========================================
   * DELETE SET
   * ========================================
   */

  const deleteSet =
    async (
      exerciseId: string,
      setId: string
    ): Promise<void> => {
      if (!profile) {
        throw new Error(
          'NOT_AUTHENTICATED'
        );
      }

      if (!workout) {
        throw new Error(
          'NO_ACTIVE_WORKOUT'
        );
      }

      /*
       * Delete from SQLite.
       */

      await deleteWorkoutSet(
        profile.id,
        workout.id,
        exerciseId,
        setId
      );

      /*
       * Reload the complete active
       * workout from SQLite.
       */

      const updatedWorkout =
        await getActiveWorkout(
          profile.id
        );

      setWorkout(
        updatedWorkout
      );
    };

  /*
   * ========================================
   * ADD CUSTOM EXERCISE
   * ========================================
   */

  const addCustomExercise =
    async (
      exercise: Exercise
    ): Promise<void> => {
      if (!profile) {
        throw new Error(
          'NOT_AUTHENTICATED'
        );
      }

      await createCustomExercise(
        profile.id,
        {
          ...exercise,
          isCustom: true,
        }
      );

      const updatedExercises =
        await getCustomExercises(
          profile.id
        );

      setCustomExercises(
        updatedExercises
      );
    };

  /*
   * ========================================
   * REMOVE CUSTOM EXERCISE
   * ========================================
   */

  const removeCustomExercise =
    async (
      exerciseId: string
    ): Promise<void> => {
      if (!profile) {
        throw new Error(
          'NOT_AUTHENTICATED'
        );
      }

      await deleteCustomExercise(
        profile.id,
        exerciseId
      );

      const updatedExercises =
        await getCustomExercises(
          profile.id
        );

      setCustomExercises(
        updatedExercises
      );
    };

  /*
   * ========================================
   * GET PREVIOUS WORKOUT
   * ========================================
   */

  const getPreviousWorkout =
    async (
      splitId: string,
      excludeWorkoutId?: string
    ): Promise<WorkoutSession | null> => {
      if (!profile) {
        return null;
      }

      return getPreviousWorkoutFromDatabase(
        profile.id,
        splitId,
        excludeWorkoutId
      );
    };

  /*
   * ========================================
   * GET WORKOUT BY ID
   * ========================================
   */

  const getWorkoutById =
    async (
      workoutId: string
    ): Promise<WorkoutSession | null> => {
      if (!profile) {
        return null;
      }

      return getWorkoutByIdFromDatabase(
        profile.id,
        workoutId
      );
    };

  /*
   * ========================================
   * PROVIDER
   * ========================================
   */

  return (
    <WorkoutContext.Provider
      value={{
        workout,
        workoutHistory,
        customExercises,
        isLoading,

        startWorkout,
        finishWorkout,

        addExercise,
        removeExercise,

        addSet,
        updateSet,
        deleteSet,

        addCustomExercise,
        removeCustomExercise,

        getPreviousWorkout,
        getWorkoutById,

        refreshWorkoutData,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

/*
 * ========================================
 * USE WORKOUT
 * ========================================
 */

export function useWorkout() {
  const context =
    useContext(
      WorkoutContext
    );

  if (!context) {
    throw new Error(
      'useWorkout must be used inside WorkoutProvider'
    );
  }

  return context;
}