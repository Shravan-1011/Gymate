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
  completeWorkout,
  getWorkoutHistory,
  getActiveWorkout,
  getPreviousWorkout as getPreviousWorkoutFromDatabase,
  getWorkoutById as getWorkoutByIdFromDatabase,

  /*
   * CUSTOM EXERCISE FUNCTIONS
   */
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
  /*
   * Active workout.
   */

  workout: WorkoutSession | null;

  /*
   * Completed workout history.
   */

  workoutHistory: WorkoutSession[];

  /*
   * Custom exercises loaded from SQLite.
   */

  customExercises: Exercise[];

  /*
   * Loading state.
   */

  isLoading: boolean;

  /*
   * Workout operations.
   */

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

  /*
   * Custom exercise operations.
   */

  addCustomExercise: (
    exercise: Exercise
  ) => Promise<void>;

  removeCustomExercise: (
    exerciseId: string
  ) => Promise<void>;

  /*
   * Database queries.
   */

  getPreviousWorkout: (
    splitId: string,
    excludeWorkoutId?: string
  ) => Promise<WorkoutSession | null>;

  getWorkoutById: (
    workoutId: string
  ) => Promise<WorkoutSession | null>;

  /*
   * Refresh everything.
   */

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
  /*
   * ======================================
   * PROFILE
   * ======================================
   */

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

  /*
   * ======================================
   * CUSTOM EXERCISES
   * ======================================
   *
   * IMPORTANT:
   *
   * This state is ONLY the UI copy of the
   * SQLite data.
   *
   * The actual permanent data lives in:
   *
   * SQLite
   *   ↓
   * custom_exercises
   *
   * This state gets reloaded from SQLite.
   */

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
          /*
           * No logged-in profile.
           *
           * Clear everything.
           */

          if (!profile) {
            setWorkout(null);

            setWorkoutHistory([]);

            setCustomExercises([]);

            return;
          }

          /*
           * Load:
           *
           * 1. Active workout
           * 2. Workout history
           * 3. Custom exercises
           *
           * All from SQLite.
           */

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

          /*
           * Update React state.
           */

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

          /*
           * Prevent stale data.
           */

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
      /*
       * No profile.
       */

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

      /*
       * SQLite creates the workout.
       */

      const newWorkout =
        await createWorkout(
          profile.id,
          splitId,
          name
        );

      /*
       * Update UI.
       */

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

      /*
       * Complete inside SQLite.
       */

      const completedWorkout =
        await completeWorkout(
          profile.id,
          workout.id
        );

      if (!completedWorkout) {
        await refreshWorkoutData();

        return;
      }

      /*
       * No active workout anymore.
       */

      setWorkout(null);

      /*
       * Add to history.
       */

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
   * ADD EXERCISE TO WORKOUT
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

      /*
       * Save to SQLite.
       */

      await addWorkoutExercise(
        profile.id,
        workout.id,
        exercise
      );

      /*
       * Reload from SQLite.
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
   * REMOVE EXERCISE FROM WORKOUT
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

      /*
       * Kept because the UI passes it.
       *
       * Repository only needs:
       *
       * profileId
       * workoutId
       * setId
       */

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
   * ADD CUSTOM EXERCISE
   * ========================================
   *
   * THIS IS NOW SQLITE.
   *
   * Before:
   *
   * setCustomExercises(...)
   *
   * Now:
   *
   * SQLite
   *   ↓
   * custom_exercises
   *   ↓
   * React state
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

      /*
       * Save permanently to SQLite.
       */

      await createCustomExercise(
        profile.id,
        {
          ...exercise,
          isCustom: true,
        }
      );

      /*
       * Reload custom exercises
       * from SQLite.
       */

      const updatedExercises =
        await getCustomExercises(
          profile.id
        );

      /*
       * Update UI.
       */

      setCustomExercises(
        updatedExercises
      );
    };

  /*
   * ========================================
   * REMOVE CUSTOM EXERCISE
   * ========================================
   *
   * THIS ALSO USES SQLITE NOW.
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

      /*
       * Delete from SQLite.
       */

      await deleteCustomExercise(
        profile.id,
        exerciseId
      );

      /*
       * Reload from SQLite.
       */

      const updatedExercises =
        await getCustomExercises(
          profile.id
        );

      /*
       * Update UI.
       */

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
        /*
         * Workout
         */

        workout,

        /*
         * History
         */

        workoutHistory,

        /*
         * Custom exercises
         *
         * Loaded from SQLite.
         */

        customExercises,

        /*
         * Loading
         */

        isLoading,

        /*
         * Workout operations
         */

        startWorkout,

        finishWorkout,

        addExercise,

        removeExercise,

        addSet,

        updateSet,

        /*
         * Custom exercise operations
         *
         * These now talk to SQLite.
         */

        addCustomExercise,

        removeCustomExercise,

        /*
         * Queries
         */

        getPreviousWorkout,

        getWorkoutById,

        /*
         * Refresh
         */

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