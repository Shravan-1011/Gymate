import { getDatabase } from './database';

/*
 * ========================================
 * STREAK SHARD GRANT
 * ========================================
 *
 * Ledger of 7-day streak milestones
 * already paid out, mirroring the pattern
 * in pokemonShardGrantRepository.ts.
 * ========================================
 */

export async function hasStreakShardGrant(
  profileId: string,
  streakMilestone: number
): Promise<boolean> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<{ id: string }>(
      `
        SELECT id
        FROM pokemon_streak_shard_grants
        WHERE profile_id = ?
          AND streak_milestone = ?
        LIMIT 1;
      `,
      profileId,
      streakMilestone
    );

  return row !== null;
}

export async function createStreakShardGrant(
  profileId: string,
  streakMilestone: number,
  shardsAwarded: number
): Promise<boolean> {
  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (
    !Number.isInteger(streakMilestone) ||
    streakMilestone < 1
  ) {
    throw new Error(
      'INVALID_STREAK_MILESTONE'
    );
  }

  const db = await getDatabase();

  const id = `streak-shard-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  const now = new Date().toISOString();

  try {
    await db.runAsync(
      `
        INSERT INTO pokemon_streak_shard_grants (
          id,
          profile_id,
          streak_milestone,
          shards_awarded,
          granted_at
        )
        VALUES (?, ?, ?, ?, ?);
      `,
      id,
      profileId,
      streakMilestone,
      Math.floor(shardsAwarded),
      now
    );
  } catch (error) {
    const alreadyGranted =
      await hasStreakShardGrant(
        profileId,
        streakMilestone
      );

    if (alreadyGranted) {
      return false;
    }

    throw error;
  }

  return true;
}
