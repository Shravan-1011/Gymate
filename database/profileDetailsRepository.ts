import { getDatabase } from './database';

/*
 * ========================================
 * PROFILE DETAILS TYPE
 * ========================================
 */

export type ProfileDetails = {
  profileId: string;

  displayName: string;

  age: number | null;

  heightCm: number | null;

  weightKg: number | null;

  fitnessGoal: string | null;

  activityLevel: string | null;

  createdAt: string;

  updatedAt: string;
};

/*
 * ========================================
 * DATABASE ROW TYPE
 * ========================================
 */

type ProfileDetailsRow = {
  profile_id: string;

  display_name: string;

  age: number | null;

  height_cm: number | null;

  weight_kg: number | null;

  fitness_goal: string | null;

  activity_level: string | null;

  created_at: string;

  updated_at: string;
};

/*
 * ========================================
 * ROW → PROFILE DETAILS
 * ========================================
 */

function mapProfileDetails(
  row: ProfileDetailsRow
): ProfileDetails {
  return {
    profileId: row.profile_id,

    displayName: row.display_name,

    age: row.age,

    heightCm: row.height_cm,

    weightKg: row.weight_kg,

    fitnessGoal: row.fitness_goal,

    activityLevel: row.activity_level,

    createdAt: row.created_at,

    updatedAt: row.updated_at,
  };
}

/*
 * ========================================
 * CREATE PROFILE DETAILS
 * ========================================
 */

export async function createProfileDetails(
  profileId: string,
  details: {
    displayName: string;
    age?: number | null;
    heightCm?: number | null;
    weightKg?: number | null;
    fitnessGoal?: string | null;
    activityLevel?: string | null;
  }
): Promise<ProfileDetails> {
  const db = await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  const displayName =
    details.displayName.trim();

  if (!displayName) {
    throw new Error(
      'DISPLAY_NAME_REQUIRED'
    );
  }

  /*
   * Make sure the profile actually exists.
   */

  const profileExists =
    await db.getFirstAsync<{ id: string }>(
      `
        SELECT id
        FROM profiles
        WHERE id = ?
        LIMIT 1;
      `,
      profileId
    );

  if (!profileExists) {
    throw new Error(
      'PROFILE_NOT_FOUND'
    );
  }

  /*
   * Prevent duplicate profile details.
   */

  const existingDetails =
    await getProfileDetails(profileId);

  if (existingDetails) {
    throw new Error(
      'PROFILE_DETAILS_ALREADY_EXISTS'
    );
  }

  const now =
    new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO profile_details (
        profile_id,
        display_name,
        age,
        height_cm,
        weight_kg,
        fitness_goal,
        activity_level,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    profileId,
    displayName,
    details.age ?? null,
    details.heightCm ?? null,
    details.weightKg ?? null,
    details.fitnessGoal ?? null,
    details.activityLevel ?? null,
    now,
    now
  );

  const createdDetails =
    await getProfileDetails(profileId);

  if (!createdDetails) {
    throw new Error(
      'FAILED_TO_CREATE_PROFILE_DETAILS'
    );
  }

  return createdDetails;
}

/*
 * ========================================
 * GET PROFILE DETAILS
 * ========================================
 */

export async function getProfileDetails(
  profileId: string
): Promise<ProfileDetails | null> {
  const db = await getDatabase();

  if (!profileId) {
    return null;
  }

  const row =
    await db.getFirstAsync<ProfileDetailsRow>(
      `
        SELECT *
        FROM profile_details
        WHERE profile_id = ?
        LIMIT 1;
      `,
      profileId
    );

  if (!row) {
    return null;
  }

  return mapProfileDetails(row);
}

/*
 * ========================================
 * UPDATE PROFILE DETAILS
 * ========================================
 */

export async function updateProfileDetails(
  profileId: string,
  updates: {
    displayName?: string;
    age?: number | null;
    heightCm?: number | null;
    weightKg?: number | null;
    fitnessGoal?: string | null;
    activityLevel?: string | null;
  }
): Promise<ProfileDetails | null> {
  const db = await getDatabase();

  const existingDetails =
    await getProfileDetails(profileId);

  if (!existingDetails) {
    return null;
  }

  const displayName =
    updates.displayName !== undefined
      ? updates.displayName.trim()
      : existingDetails.displayName;

  if (!displayName) {
    throw new Error(
      'DISPLAY_NAME_REQUIRED'
    );
  }

  const age =
    updates.age !== undefined
      ? updates.age
      : existingDetails.age;

  const heightCm =
    updates.heightCm !== undefined
      ? updates.heightCm
      : existingDetails.heightCm;

  const weightKg =
    updates.weightKg !== undefined
      ? updates.weightKg
      : existingDetails.weightKg;

  const fitnessGoal =
    updates.fitnessGoal !== undefined
      ? updates.fitnessGoal
      : existingDetails.fitnessGoal;

  const activityLevel =
    updates.activityLevel !== undefined
      ? updates.activityLevel
      : existingDetails.activityLevel;

  const now =
    new Date().toISOString();

  await db.runAsync(
    `
      UPDATE profile_details
      SET
        display_name = ?,
        age = ?,
        height_cm = ?,
        weight_kg = ?,
        fitness_goal = ?,
        activity_level = ?,
        updated_at = ?
      WHERE profile_id = ?;
    `,
    displayName,
    age,
    heightCm,
    weightKg,
    fitnessGoal,
    activityLevel,
    now,
    profileId
  );

  return getProfileDetails(profileId);
}

/*
 * ========================================
 * DELETE PROFILE DETAILS
 * ========================================
 *
 * Normally this won't be called directly.
 *
 * Deleting the parent profile automatically
 * deletes these details because of:
 *
 *   ON DELETE CASCADE
 *
 * This function is still useful if we ever
 * want to reset a profile's fitness data
 * without deleting the account itself.
 */

export async function deleteProfileDetails(
  profileId: string
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM profile_details
      WHERE profile_id = ?;
    `,
    profileId
  );
}