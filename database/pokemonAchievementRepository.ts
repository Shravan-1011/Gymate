import {
  getDatabase,
} from './database';

export type UserPokemonAchievementRow = {
  profile_id: string;
  achievement_id: string;
  unlocked_at: string;
};

/*
 * ========================================
 * HAS ACHIEVEMENT
 * ========================================
 */

export async function hasAchievement(
  profileId: string,
  achievementId: string
): Promise<boolean> {

  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      profile_id: string;
    }>(
      `
        SELECT profile_id
        FROM user_achievements
        WHERE profile_id = ?
          AND achievement_id = ?
        LIMIT 1;
      `,
      profileId,
      achievementId
    );

  return row !== null;
}

/*
 * ========================================
 * GET UNLOCKED ACHIEVEMENT IDS
 * ========================================
 */

export async function getUnlockedAchievementIds(
  profileId: string
): Promise<string[]> {

  const db =
    await getDatabase();

  const rows =
    await db.getAllAsync<{
      achievement_id: string;
    }>(
      `
        SELECT achievement_id
        FROM user_achievements
        WHERE profile_id = ?;
      `,
      profileId
    );

  return rows.map(
    (row) =>
      row.achievement_id
  );
}

/*
 * ========================================
 * UNLOCK ACHIEVEMENT
 * ========================================
 */

export async function unlockAchievement(
  profileId: string,
  achievementId: string
): Promise<boolean> {

  if (
    !profileId ||
    !achievementId
  ) {
    throw new Error(
      'PROFILE_ID_AND_ACHIEVEMENT_ID_REQUIRED'
    );
  }

  const db =
    await getDatabase();

  const now =
    new Date().toISOString();

  try {

    await db.runAsync(
      `
        INSERT INTO user_achievements (
          profile_id,
          achievement_id,
          unlocked_at
        )
        VALUES (?, ?, ?);
      `,
      profileId,
      achievementId,
      now
    );

  } catch (error) {

    const already =
      await hasAchievement(
        profileId,
        achievementId
      );

    if (already) {
      return false;
    }

    throw error;
  }

  return true;
}