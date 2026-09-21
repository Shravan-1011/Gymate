import { getDatabase } from './database';

/*
 * ========================================
 * PROFILE TYPE
 * ========================================
 */

export type Profile = {
  id: string;
  username: string;
  passwordHash: string;

  /*
   * Selected trainer sprite.
   *
   * null = no trainer selected yet.
   */
  trainerSpriteId: string | null;

  createdAt: string;
  updatedAt: string;
};

/*
 * ========================================
 * DATABASE ROW TYPE
 * ========================================
 */

type ProfileRow = {
  id: string;
  username: string;
  password_hash: string;

  trainer_sprite_id: string | null;

  created_at: string;
  updated_at: string;
};

/*
 * ========================================
 * ROW → PROFILE
 * ========================================
 */

function mapProfile(
  row: ProfileRow
): Profile {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,

    trainerSpriteId:
      row.trainer_sprite_id ?? null,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/*
 * ========================================
 * CREATE PROFILE
 * ========================================
 */

export async function createProfile(
  username: string,
  passwordHash: string
): Promise<Profile> {
  const db = await getDatabase();

  const trimmedUsername =
    username.trim();

  if (!trimmedUsername) {
    throw new Error(
      'Username cannot be empty.'
    );
  }

  if (!passwordHash) {
    throw new Error(
      'Password hash cannot be empty.'
    );
  }

  /*
   * Check whether username already exists.
   */

  const existingProfile =
    await db.getFirstAsync<ProfileRow>(
      `
        SELECT *
        FROM profiles
        WHERE username = ?
        LIMIT 1;
      `,
      trimmedUsername
    );

  if (existingProfile) {
    throw new Error(
      'USERNAME_ALREADY_EXISTS'
    );
  }

  const now =
    new Date().toISOString();

  const id =
    `profile-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

  await db.runAsync(
    `
      INSERT INTO profiles (
        id,
        username,
        password_hash,
        trainer_sprite_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?);
    `,
    id,
    trimmedUsername,
    passwordHash,
    null,
    now,
    now
  );

  const createdProfile =
    await db.getFirstAsync<ProfileRow>(
      `
        SELECT *
        FROM profiles
        WHERE id = ?
        LIMIT 1;
      `,
      id
    );

  if (!createdProfile) {
    throw new Error(
      'Failed to create profile.'
    );
  }

  return mapProfile(
    createdProfile
  );
}

/*
 * ========================================
 * FIND PROFILE BY USERNAME
 * ========================================
 */

export async function findProfileByUsername(
  username: string
): Promise<Profile | null> {
  const db = await getDatabase();

  const trimmedUsername =
    username.trim();

  if (!trimmedUsername) {
    return null;
  }

  const row =
    await db.getFirstAsync<ProfileRow>(
      `
        SELECT *
        FROM profiles
        WHERE username = ?
        LIMIT 1;
      `,
      trimmedUsername
    );

  if (!row) {
    return null;
  }

  return mapProfile(row);
}

/*
 * ========================================
 * GET PROFILE BY ID
 * ========================================
 */

export async function getProfileById(
  profileId: string
): Promise<Profile | null> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<ProfileRow>(
      `
        SELECT *
        FROM profiles
        WHERE id = ?
        LIMIT 1;
      `,
      profileId
    );

  if (!row) {
    return null;
  }

  return mapProfile(row);
}

/*
 * ========================================
 * GET ALL PROFILES
 * ========================================
 */

export async function getAllProfiles(): Promise<
  Profile[]
> {
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<ProfileRow>(
      `
        SELECT *
        FROM profiles
        ORDER BY created_at ASC;
      `
    );

  return rows.map(mapProfile);
}

/*
 * ========================================
 * UPDATE PROFILE
 * ========================================
 */

export async function updateProfile(
  profileId: string,
  updates: {
    username?: string;
    passwordHash?: string;

    /*
     * Pass null to remove the trainer.
     */
    trainerSpriteId?: string | null;
  }
): Promise<Profile | null> {
  const db = await getDatabase();

  const existingProfile =
    await getProfileById(profileId);

  if (!existingProfile) {
    return null;
  }

  const username =
    updates.username !== undefined
      ? updates.username.trim()
      : existingProfile.username;

  const passwordHash =
    updates.passwordHash !== undefined
      ? updates.passwordHash
      : existingProfile.passwordHash;

  const trainerSpriteId =
    updates.trainerSpriteId !== undefined
      ? updates.trainerSpriteId
      : existingProfile.trainerSpriteId;

  if (!username) {
    throw new Error(
      'Username cannot be empty.'
    );
  }

  if (!passwordHash) {
    throw new Error(
      'Password hash cannot be empty.'
    );
  }

  /*
   * Make sure another profile isn't
   * already using this username.
   */

  const usernameOwner =
    await db.getFirstAsync<ProfileRow>(
      `
        SELECT *
        FROM profiles
        WHERE username = ?
        AND id != ?
        LIMIT 1;
      `,
      username,
      profileId
    );

  if (usernameOwner) {
    throw new Error(
      'USERNAME_ALREADY_EXISTS'
    );
  }

  const now =
    new Date().toISOString();

  await db.runAsync(
    `
      UPDATE profiles
      SET
        username = ?,
        password_hash = ?,
        trainer_sprite_id = ?,
        updated_at = ?
      WHERE id = ?;
    `,
    username,
    passwordHash,
    trainerSpriteId,
    now,
    profileId
  );

  return getProfileById(
    profileId
  );
}

/*
 * ========================================
 * DELETE PROFILE
 * ========================================
 */

export async function deleteProfile(
  profileId: string
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM profiles
      WHERE id = ?;
    `,
    profileId
  );
}