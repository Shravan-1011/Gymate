import {
  getDatabase,
} from './database';

/*
 * ========================================
 * HAS BADGE
 * ========================================
 */

export async function hasGymBadge(
  profileId: string,
  badgeId: string
): Promise<boolean> {

  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      profile_id: string;
    }>(
      `
        SELECT profile_id
        FROM user_gym_badges
        WHERE profile_id = ?
          AND badge_id = ?
        LIMIT 1;
      `,
      profileId,
      badgeId
    );

  return row !== null;
}

/*
 * ========================================
 * GET EARNED BADGE IDS
 * ========================================
 */

export async function getEarnedGymBadgeIds(
  profileId: string
): Promise<string[]> {

  const db =
    await getDatabase();

  const rows =
    await db.getAllAsync<{
      badge_id: string;
    }>(
      `
        SELECT badge_id
        FROM user_gym_badges
        WHERE profile_id = ?;
      `,
      profileId
    );

  return rows.map(
    (row) =>
      row.badge_id
  );
}

/*
 * ========================================
 * GRANT BADGE
 * ========================================
 *
 * Idempotent.
 * ========================================
 */

export async function grantGymBadge(
  profileId: string,
  badgeId: string
): Promise<boolean> {

  if (
    !profileId ||
    !badgeId
  ) {
    throw new Error(
      'PROFILE_ID_AND_BADGE_ID_REQUIRED'
    );
  }

  const db =
    await getDatabase();

  const now =
    new Date().toISOString();

  try {

    await db.runAsync(
      `
        INSERT INTO user_gym_badges (
          profile_id,
          badge_id,
          earned_at
        )
        VALUES (?, ?, ?);
      `,
      profileId,
      badgeId,
      now
    );

  } catch (error) {

    const already =
      await hasGymBadge(
        profileId,
        badgeId
      );

    if (already) {
      return false;
    }

    throw error;
  }

  return true;
}