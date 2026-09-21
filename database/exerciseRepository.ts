import { getDatabase } from './database';

import type {
  Exercise,
  MuscleGroup,
} from '../types/workout';

/*
 * ========================================
 * DATABASE ROW TYPE
 * ========================================
 */

type ExerciseRow = {
  id: string;

  profile_id: string;

  name: string;

  primary_muscle: string;

  secondary_muscles: string;

  equipment: string;

  is_custom: number;

  created_at: string;
};

/*
 * ========================================
 * CREATE CUSTOM EXERCISE
 * ========================================
 *
 * Saves a custom exercise to SQLite.
 *
 * The exercise belongs to the profile
 * that created it.
 * ========================================
 */

export async function createCustomExercise(
  profileId: string,
  exercise: Exercise
): Promise<Exercise> {
  const db = await getDatabase();

  /*
   * ======================================
   * VALIDATION
   * ======================================
   */

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (!exercise.name.trim()) {
    throw new Error(
      'EXERCISE_NAME_REQUIRED'
    );
  }

  /*
   * ======================================
   * CHECK PROFILE
   * ======================================
   */

  const profile =
    await db.getFirstAsync<{ id: string }>(
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
   * ======================================
   * NORMALIZED NAME
   * ======================================
   */

  const normalizedName =
    exercise.name
      .trim()
      .toLowerCase();

  /*
   * ======================================
   * CHECK DUPLICATE NAME
   * ======================================
   *
   * A profile should not have two custom
   * exercises with the same name.
   */

  const existing =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM exercises
        WHERE profile_id = ?
          AND LOWER(TRIM(name)) = ?
        LIMIT 1;
      `,
      profileId,
      normalizedName
    );

  if (existing) {
    throw new Error(
      'EXERCISE_ALREADY_EXISTS'
    );
  }

  /*
   * ======================================
   * GENERATE ID
   * ======================================
   */

  const id =
    exercise.id ||
    `exercise-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

  /*
   * ======================================
   * CREATED TIME
   * ======================================
   */

  const createdAt =
    new Date().toISOString();

  /*
   * ======================================
   * INSERT
   * ======================================
   */

  await db.runAsync(
    `
      INSERT INTO exercises (
        id,
        profile_id,
        name,
        primary_muscle,
        secondary_muscles,
        equipment,
        is_custom,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    id,
    profileId,
    exercise.name.trim(),
    exercise.primaryMuscle,
    JSON.stringify(
      exercise.secondaryMuscles
    ),
    exercise.equipment.trim(),
    1,
    createdAt
  );

  /*
   * ======================================
   * RETURN EXERCISE
   * ======================================
   */

  const created =
    await getCustomExerciseById(
      profileId,
      id
    );

  if (!created) {
    throw new Error(
      'FAILED_TO_CREATE_EXERCISE'
    );
  }

  return created;
}

/*
 * ========================================
 * GET CUSTOM EXERCISES
 * ========================================
 *
 * Returns all custom exercises belonging
 * to the current profile.
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
    await db.getAllAsync<ExerciseRow>(
      `
        SELECT *
        FROM exercises
        WHERE profile_id = ?
          AND is_custom = 1
        ORDER BY created_at ASC;
      `,
      profileId
    );

  return rows.map(
    mapExerciseRow
  );
}

/*
 * ========================================
 * GET CUSTOM EXERCISE BY ID
 * ========================================
 */

export async function getCustomExerciseById(
  profileId: string,
  exerciseId: string
): Promise<Exercise | null> {
  const db = await getDatabase();

  if (!profileId) {
    return null;
  }

  if (!exerciseId) {
    return null;
  }

  const row =
    await db.getFirstAsync<ExerciseRow>(
      `
        SELECT *
        FROM exercises
        WHERE id = ?
          AND profile_id = ?
          AND is_custom = 1
        LIMIT 1;
      `,
      exerciseId,
      profileId
    );

  if (!row) {
    return null;
  }

  return mapExerciseRow(
    row
  );
}

/*
 * ========================================
 * DELETE CUSTOM EXERCISE
 * ========================================
 *
 * Deletes a custom exercise belonging
 * to the current profile.
 *
 * IMPORTANT:
 *
 * This does NOT delete old workout data.
 *
 * workout_exercises stores a snapshot of
 * the exercise information used during
 * that workout.
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
   * Only delete the exercise if it belongs
   * to the current profile.
   */

  await db.runAsync(
    `
      DELETE FROM exercises
      WHERE id = ?
        AND profile_id = ?
        AND is_custom = 1;
    `,
    exerciseId,
    profileId
  );
}

/*
 * ========================================
 * UPDATE CUSTOM EXERCISE
 * ========================================
 *
 * Allows editing a custom exercise.
 * ========================================
 */

export async function updateCustomExercise(
  profileId: string,
  exerciseId: string,
  updates: Partial<
    Pick<
      Exercise,
      | 'name'
      | 'primaryMuscle'
      | 'secondaryMuscles'
      | 'equipment'
    >
  >
): Promise<Exercise | null> {
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
   * ======================================
   * CHECK EXISTING
   * ======================================
   */

  const existing =
    await db.getFirstAsync<ExerciseRow>(
      `
        SELECT *
        FROM exercises
        WHERE id = ?
          AND profile_id = ?
          AND is_custom = 1
        LIMIT 1;
      `,
      exerciseId,
      profileId
    );

  if (!existing) {
    return null;
  }

  /*
   * ======================================
   * BUILD UPDATE
   * ======================================
   */

  const fields: string[] = [];

  const values: (
    | string
    | number
    | null
  )[] = [];

  /*
   * NAME
   */

  if (updates.name !== undefined) {
    const name =
      updates.name.trim();

    if (!name) {
      throw new Error(
        'EXERCISE_NAME_REQUIRED'
      );
    }

    /*
     * Check duplicate name.
     */

    const normalizedName =
      name.toLowerCase();

    const duplicate =
      await db.getFirstAsync<{
        id: string;
      }>(
        `
          SELECT id
          FROM exercises
          WHERE profile_id = ?
            AND LOWER(TRIM(name)) = ?
            AND id != ?
          LIMIT 1;
        `,
        profileId,
        normalizedName,
        exerciseId
      );

    if (duplicate) {
      throw new Error(
        'EXERCISE_ALREADY_EXISTS'
      );
    }

    fields.push(
      'name = ?'
    );

    values.push(
      name
    );
  }

  /*
   * PRIMARY MUSCLE
   */

  if (
    updates.primaryMuscle !==
    undefined
  ) {
    fields.push(
      'primary_muscle = ?'
    );

    values.push(
      updates.primaryMuscle
    );
  }

  /*
   * SECONDARY MUSCLES
   */

  if (
    updates.secondaryMuscles !==
    undefined
  ) {
    fields.push(
      'secondary_muscles = ?'
    );

    values.push(
      JSON.stringify(
        updates.secondaryMuscles
      )
    );
  }

  /*
   * EQUIPMENT
   */

  if (
    updates.equipment !==
    undefined
  ) {
    fields.push(
      'equipment = ?'
    );

    values.push(
      updates.equipment.trim()
    );
  }

  /*
   * Nothing to update.
   */

  if (fields.length === 0) {
    return mapExerciseRow(
      existing
    );
  }

  /*
   * ======================================
   * UPDATE
   * ======================================
   */

  values.push(
    exerciseId
  );

  await db.runAsync(
    `
      UPDATE exercises
      SET ${fields.join(', ')}
      WHERE id = ?;
    `,
    ...values
  );

  /*
   * ======================================
   * RETURN UPDATED EXERCISE
   * ======================================
   */

  return getCustomExerciseById(
    profileId,
    exerciseId
  );
}

/*
 * ========================================
 * CONVERT DATABASE ROW
 * ========================================
 *
 * SQLite:
 *
 * primary_muscle
 * secondary_muscles
 * is_custom
 *
 *        ↓
 *
 * Exercise object
 * ========================================
 */

function mapExerciseRow(
  row: ExerciseRow
): Exercise {
  let secondaryMuscles: MuscleGroup[] =
    [];

  try {
    const parsed =
      JSON.parse(
        row.secondary_muscles || '[]'
      );

    if (Array.isArray(parsed)) {
      secondaryMuscles =
        parsed as MuscleGroup[];
    }
  } catch {
    secondaryMuscles = [];
  }

  return {
    id: row.id,

    name: row.name,

    primaryMuscle:
      row.primary_muscle as MuscleGroup,

    secondaryMuscles,

    equipment:
      row.equipment,

    isCustom:
      row.is_custom === 1,
  };
}