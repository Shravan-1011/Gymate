import { getDatabase } from './database';
import * as SQLite from 'expo-sqlite';

import type {
  Exercise,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
} from '../types/workout';

/*
 * ========================================
 * DATABASE ROW TYPES
 * ========================================
 */

type WorkoutSessionRow = {
  id: string;
  profile_id: string;
  split_id: string;
  name: string;
  started_at: string | null;
  ended_at: string | null;
  status:
    | 'draft'
    | 'active'
    | 'completed';
};

type WorkoutExerciseRow = {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  primary_muscle: string;
  secondary_muscles: string;
  equipment: string;
  is_custom: number;
  notes: string | null;
};

type WorkoutSetRow = {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  type:
    | 'warmup'
    | 'working'
    | 'drop'
    | 'failure';
  weight: number;
  reps: number;
  completed: number;
};

/*
 * ========================================
 * CUSTOM EXERCISE ROW
 * ========================================
 */

type CustomExerciseRow = {
  id: string;
  profile_id: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string;
  equipment: string;
  created_at: string;
  updated_at: string;
};

/*
 * ========================================
 * CREATE WORKOUT
 * ========================================
 */

export async function createWorkout(
  profileId: string,
  splitId: string,
  name: string
): Promise<WorkoutSession> {
  const db = await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (!splitId) {
    throw new Error(
      'SPLIT_ID_REQUIRED'
    );
  }

  if (!name.trim()) {
    throw new Error(
      'WORKOUT_NAME_REQUIRED'
    );
  }

  const profile =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM profiles
        WHERE id = ?
        LIMIT 1;
      `,
      profileId
    );

  if (!profile) {
    throw new Error(
      'PROFILE_NOT_FOUND'
    );
  }

  const id =
    `workout-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

  const now =
    new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO workout_sessions (
        id,
        profile_id,
        split_id,
        name,
        started_at,
        ended_at,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    id,
    profileId,
    splitId,
    name.trim(),
    now,
    null,
    'active'
  );

  const workout =
    await getWorkoutById(
      profileId,
      id
    );

  if (!workout) {
    throw new Error(
      'FAILED_TO_CREATE_WORKOUT'
    );
  }

  return workout;
}

/*
 * ========================================
 * ADD WORKOUT EXERCISE
 * ========================================
 */

export async function addWorkoutExercise(
  profileId: string,
  workoutId: string,
  exercise: Exercise,
  notes?: string
): Promise<void> {
  const db = await getDatabase();

  const workout =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM workout_sessions
        WHERE id = ?
          AND profile_id = ?
        LIMIT 1;
      `,
      workoutId,
      profileId
    );

  if (!workout) {
    throw new Error(
      'WORKOUT_NOT_FOUND'
    );
  }

  const existing =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM workout_exercises
        WHERE workout_id = ?
          AND exercise_id = ?
        LIMIT 1;
      `,
      workoutId,
      exercise.id
    );

  if (existing) {
    return;
  }

  const id =
    `workout-exercise-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

  await db.runAsync(
    `
      INSERT INTO workout_exercises (
        id,
        workout_id,
        exercise_id,
        exercise_name,
        primary_muscle,
        secondary_muscles,
        equipment,
        is_custom,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    id,
    workoutId,
    exercise.id,
    exercise.name,
    exercise.primaryMuscle,
    JSON.stringify(
      exercise.secondaryMuscles
    ),
    exercise.equipment,
    exercise.isCustom ? 1 : 0,
    notes ?? null
  );
}

/*
 * ========================================
 * REMOVE WORKOUT EXERCISE
 * ========================================
 */

export async function removeWorkoutExercise(
  profileId: string,
  workoutId: string,
  exerciseId: string
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM workout_exercises
      WHERE workout_id = ?
        AND exercise_id = ?
        AND workout_id IN (
          SELECT id
          FROM workout_sessions
          WHERE id = ?
            AND profile_id = ?
        );
    `,
    workoutId,
    exerciseId,
    workoutId,
    profileId
  );
}

/*
 * ========================================
 * ADD WORKOUT SET
 * ========================================
 */

export async function addWorkoutSet(
  profileId: string,
  workoutId: string,
  exerciseId: string,
  set: WorkoutSet
): Promise<void> {
  const db = await getDatabase();

  const workoutExercise =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT we.id
        FROM workout_exercises we

        INNER JOIN workout_sessions ws
          ON ws.id = we.workout_id

        WHERE ws.id = ?
          AND ws.profile_id = ?
          AND we.exercise_id = ?

        LIMIT 1;
      `,
      workoutId,
      profileId,
      exerciseId
    );

  if (!workoutExercise) {
    throw new Error(
      'WORKOUT_EXERCISE_NOT_FOUND'
    );
  }

  await db.runAsync(
    `
      INSERT INTO workout_sets (
        id,
        workout_exercise_id,
        set_number,
        type,
        weight,
        reps,
        completed
      )
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    set.id,
    workoutExercise.id,
    set.setNumber,
    set.type,
    set.weight,
    set.reps,
    set.completed ? 1 : 0
  );
}

/*
 * ========================================
 * UPDATE WORKOUT SET
 * ========================================
 */

export async function updateWorkoutSet(
  profileId: string,
  workoutId: string,
  setId: string,
  updates: Partial<WorkoutSet>
): Promise<void> {
  const db = await getDatabase();

  const existing =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT ws.id
        FROM workout_sets ws

        INNER JOIN workout_exercises we
          ON we.id =
             ws.workout_exercise_id

        INNER JOIN workout_sessions workout
          ON workout.id =
             we.workout_id

        WHERE ws.id = ?
          AND workout.id = ?
          AND workout.profile_id = ?

        LIMIT 1;
      `,
      setId,
      workoutId,
      profileId
    );

  if (!existing) {
    throw new Error(
      'WORKOUT_SET_NOT_FOUND'
    );
  }

  const fields: string[] = [];

  const values: SQLite.SQLiteBindValue[] =
    [];

  if (
    updates.setNumber !==
    undefined
  ) {
    fields.push(
      'set_number = ?'
    );

    values.push(
      updates.setNumber
    );
  }

  if (
    updates.type !==
    undefined
  ) {
    fields.push(
      'type = ?'
    );

    values.push(
      updates.type
    );
  }

  if (
    updates.weight !==
    undefined
  ) {
    fields.push(
      'weight = ?'
    );

    values.push(
      updates.weight
    );
  }

  if (
    updates.reps !==
    undefined
  ) {
    fields.push(
      'reps = ?'
    );

    values.push(
      updates.reps
    );
  }

  if (
    updates.completed !==
    undefined
  ) {
    fields.push(
      'completed = ?'
    );

    values.push(
      updates.completed
        ? 1
        : 0
    );
  }

  if (fields.length === 0) {
    return;
  }

  values.push(setId);

  await db.runAsync(
    `
      UPDATE workout_sets
      SET ${fields.join(', ')}
      WHERE id = ?;
    `,
    ...values
  );
}

/*
 * ========================================
 * DELETE WORKOUT SET
 * ========================================
 *
 * Deletes a set from the current workout
 * and automatically renumbers the remaining
 * sets for that exercise.
 */

export async function deleteWorkoutSet(
  profileId: string,
  workoutId: string,
  exerciseId: string,
  setId: string
): Promise<void> {
  const db = await getDatabase();

  /*
   * Find the workout exercise belonging
   * to the current profile/workout.
   */

  const workoutExercise =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT we.id
        FROM workout_exercises we

        INNER JOIN workout_sessions ws
          ON ws.id = we.workout_id

        WHERE ws.id = ?
          AND ws.profile_id = ?
          AND we.exercise_id = ?

        LIMIT 1;
      `,
      workoutId,
      profileId,
      exerciseId
    );

  if (!workoutExercise) {
    throw new Error(
      'WORKOUT_EXERCISE_NOT_FOUND'
    );
  }

  /*
   * Make sure the set actually belongs
   * to this workout exercise.
   */

  const existingSet =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM workout_sets

        WHERE id = ?
          AND workout_exercise_id = ?

        LIMIT 1;
      `,
      setId,
      workoutExercise.id
    );

  if (!existingSet) {
    throw new Error(
      'WORKOUT_SET_NOT_FOUND'
    );
  }

  /*
   * Delete the set.
   */

  await db.runAsync(
    `
      DELETE FROM workout_sets

      WHERE id = ?
        AND workout_exercise_id = ?;
    `,
    setId,
    workoutExercise.id
  );

  /*
   * Renumber remaining sets:
   *
   * 1
   * 2
   * 3
   * ...
   *
   * This prevents:
   *
   * SET 1
   * SET 3
   * SET 4
   */

  const remainingSets =
    await db.getAllAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM workout_sets

        WHERE workout_exercise_id = ?

        ORDER BY set_number ASC, rowid ASC;
      `,
      workoutExercise.id
    );

  for (
    let index = 0;
    index < remainingSets.length;
    index++
  ) {
    await db.runAsync(
      `
        UPDATE workout_sets

        SET set_number = ?

        WHERE id = ?
          AND workout_exercise_id = ?;
      `,
      index + 1,
      remainingSets[index].id,
      workoutExercise.id
    );
  }
}

/*
 * ========================================
 * COMPLETE WORKOUT
 * ========================================
 */

export async function completeWorkout(
  profileId: string,
  workoutId: string
): Promise<WorkoutSession | null> {
  const db = await getDatabase();

  const now =
    new Date().toISOString();

  const result =
    await db.runAsync(
      `
        UPDATE workout_sessions
        SET
          status = 'completed',
          ended_at = ?

        WHERE id = ?
          AND profile_id = ?
          AND status = 'active';
      `,
      now,
      workoutId,
      profileId
    );

  if (result.changes === 0) {
    return null;
  }

  return getWorkoutById(
    profileId,
    workoutId
  );
}

/*
 * ========================================
 * GET WORKOUT BY ID
 * ========================================
 */

export async function getWorkoutById(
  profileId: string,
  workoutId: string
): Promise<WorkoutSession | null> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<WorkoutSessionRow>(
      `
        SELECT *
        FROM workout_sessions

        WHERE id = ?
          AND profile_id = ?

        LIMIT 1;
      `,
      workoutId,
      profileId
    );

  if (!row) {
    return null;
  }

  return buildWorkout(
    db,
    row
  );
}

/*
 * ========================================
 * GET WORKOUT HISTORY
 * ========================================
 */

export async function getWorkoutHistory(
  profileId: string
): Promise<WorkoutSession[]> {
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<WorkoutSessionRow>(
      `
        SELECT *
        FROM workout_sessions

        WHERE profile_id = ?
          AND status = 'completed'

        ORDER BY ended_at DESC;
      `,
      profileId
    );

  const workouts: WorkoutSession[] =
    [];

  for (const row of rows) {
    workouts.push(
      await buildWorkout(
        db,
        row
      )
    );
  }

  return workouts;
}

/*
 * ========================================
 * GET ACTIVE WORKOUT
 * ========================================
 */

export async function getActiveWorkout(
  profileId: string
): Promise<WorkoutSession | null> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<WorkoutSessionRow>(
      `
        SELECT *
        FROM workout_sessions

        WHERE profile_id = ?
          AND status = 'active'

        ORDER BY started_at DESC

        LIMIT 1;
      `,
      profileId
    );

  if (!row) {
    return null;
  }

  return buildWorkout(
    db,
    row
  );
}

/*
 * ========================================
 * GET PREVIOUS WORKOUT
 * ========================================
 */

export async function getPreviousWorkout(
  profileId: string,
  splitId: string,
  excludeWorkoutId?: string
): Promise<WorkoutSession | null> {
  const db = await getDatabase();

  let row:
    | WorkoutSessionRow
    | null;

  if (excludeWorkoutId) {
    row =
      await db.getFirstAsync<WorkoutSessionRow>(
        `
          SELECT *
          FROM workout_sessions

          WHERE profile_id = ?
            AND split_id = ?
            AND status = 'completed'
            AND id != ?

          ORDER BY ended_at DESC

          LIMIT 1;
        `,
        profileId,
        splitId,
        excludeWorkoutId
      );
  } else {
    row =
      await db.getFirstAsync<WorkoutSessionRow>(
        `
          SELECT *
          FROM workout_sessions

          WHERE profile_id = ?
            AND split_id = ?
            AND status = 'completed'

          ORDER BY ended_at DESC

          LIMIT 1;
        `,
        profileId,
        splitId
      );
  }

  if (!row) {
    return null;
  }

  return buildWorkout(
    db,
    row
  );
}

/*
 * ========================================
 * CUSTOM EXERCISES
 * ========================================
 *
 * Everything below is NEW.
 *
 * This is what moves custom exercises
 * from React memory into SQLite.
 */

/*
 * ========================================
 * GET CUSTOM EXERCISES
 * ========================================
 */

export async function getCustomExercises(
  profileId: string
): Promise<Exercise[]> {
  const db = await getDatabase();

  if (!profileId) {
    return [];
  }

  const rows =
    await db.getAllAsync<CustomExerciseRow>(
      `
        SELECT *
        FROM custom_exercises

        WHERE profile_id = ?

        ORDER BY name COLLATE NOCASE ASC;
      `,
      profileId
    );

  return rows.map(
    (row): Exercise => ({
      id: row.id,

      name: row.name,

      primaryMuscle:
        row.primary_muscle as Exercise['primaryMuscle'],

      secondaryMuscles:
        JSON.parse(
          row.secondary_muscles || '[]'
        ),

      equipment:
        row.equipment,

      isCustom: true,
    })
  );
}

/*
 * ========================================
 * CREATE CUSTOM EXERCISE
 * ========================================
 */

export async function createCustomExercise(
  profileId: string,
  exercise: Exercise
): Promise<Exercise> {
  const db = await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  const name =
    exercise.name.trim();

  if (!name) {
    throw new Error(
      'EXERCISE_NAME_REQUIRED'
    );
  }

  /*
   * Check profile exists.
   */

  const profile =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM profiles

        WHERE id = ?

        LIMIT 1;
      `,
      profileId
    );

  if (!profile) {
    throw new Error(
      'PROFILE_NOT_FOUND'
    );
  }

  /*
   * Check duplicate name.
   */

  const existing =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM custom_exercises

        WHERE profile_id = ?
          AND LOWER(name) = LOWER(?)

        LIMIT 1;
      `,
      profileId,
      name
    );

  if (existing) {
    throw new Error(
      'CUSTOM_EXERCISE_ALREADY_EXISTS'
    );
  }

  /*
   * Generate permanent ID.
   */

  const id =
    `custom-exercise-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

  const now =
    new Date().toISOString();

  /*
   * Always force custom = true
   * when returning the exercise.
   */

  await db.runAsync(
    `
      INSERT INTO custom_exercises (
        id,
        profile_id,
        name,
        primary_muscle,
        secondary_muscles,
        equipment,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    id,
    profileId,
    name,
    exercise.primaryMuscle,
    JSON.stringify(
      exercise.secondaryMuscles
    ),
    exercise.equipment.trim(),
    now,
    now
  );

  /*
   * Return the newly created exercise.
   */

  return {
    id,

    name,

    primaryMuscle:
      exercise.primaryMuscle,

    secondaryMuscles:
      exercise.secondaryMuscles,

    equipment:
      exercise.equipment.trim(),

    isCustom: true,
  };
}

/*
 * ========================================
 * DELETE CUSTOM EXERCISE
 * ========================================
 */

export async function deleteCustomExercise(
  profileId: string,
  exerciseId: string
): Promise<void> {
  const db = await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (!exerciseId) {
    throw new Error(
      'EXERCISE_ID_REQUIRED'
    );
  }

  /*
   * Only delete an exercise belonging
   * to the current profile.
   */

  await db.runAsync(
    `
      DELETE FROM custom_exercises

      WHERE id = ?
        AND profile_id = ?;
    `,
    exerciseId,
    profileId
  );
}

/*
 * ========================================
 * BUILD WORKOUT
 * ========================================
 */

async function buildWorkout(
  db: Awaited<
    ReturnType<typeof getDatabase>
  >,
  row: WorkoutSessionRow
): Promise<WorkoutSession> {
  const exerciseRows =
    await db.getAllAsync<WorkoutExerciseRow>(
      `
        SELECT *
        FROM workout_exercises

        WHERE workout_id = ?

        ORDER BY rowid ASC;
      `,
      row.id
    );

  const exercises: WorkoutExercise[] =
    [];

  for (
    const exerciseRow of exerciseRows
  ) {
    const setRows =
      await db.getAllAsync<WorkoutSetRow>(
        `
          SELECT *
          FROM workout_sets

          WHERE workout_exercise_id = ?

          ORDER BY set_number ASC;
        `,
        exerciseRow.id
      );

    const exercise: Exercise = {
      id:
        exerciseRow.exercise_id,

      name:
        exerciseRow.exercise_name,

      primaryMuscle:
        exerciseRow.primary_muscle as Exercise['primaryMuscle'],

      secondaryMuscles:
        JSON.parse(
          exerciseRow.secondary_muscles ||
            '[]'
        ),

      equipment:
        exerciseRow.equipment,

      isCustom:
        exerciseRow.is_custom === 1,
    };

    const sets: WorkoutSet[] =
      setRows.map(
        (setRow) => ({
          id:
            setRow.id,

          setNumber:
            setRow.set_number,

          type:
            setRow.type,

          weight:
            setRow.weight,

          reps:
            setRow.reps,

          completed:
            setRow.completed === 1,
        })
      );

    exercises.push({
      exercise,

      sets,

      notes:
        exerciseRow.notes ??
        undefined,
    });
  }

  return {
    id:
      row.id,

    splitId:
      row.split_id,

    name:
      row.name,

    startedAt:
      row.started_at ??
      undefined,

    endedAt:
      row.ended_at ??
      undefined,

    status:
      row.status,

    exercises,
  };
}