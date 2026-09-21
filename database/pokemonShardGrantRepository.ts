import { getDatabase } from './database';

/*
 * ========================================
 * SHARD GRANT TYPE
 * ========================================
 */

export type PokemonShardGrant = {
  id: string;

  profileId: string;

  trainerLevel: number;

  shardsAwarded: number;

  grantedAt: string;
};

/*
 * ========================================
 * DATABASE ROW TYPE
 * ========================================
 */

type PokemonShardGrantRow = {
  id: string;

  profile_id: string;

  trainer_level: number;

  shards_awarded: number;

  granted_at: string;
};

function mapGrant(
  row: PokemonShardGrantRow
): PokemonShardGrant {
  return {
    id: row.id,

    profileId: row.profile_id,

    trainerLevel: row.trainer_level,

    shardsAwarded: row.shards_awarded,

    grantedAt: row.granted_at,
  };
}

/*
 * ========================================
 * HAS BEEN GRANTED
 * ========================================
 *
 * Checks whether a profile has already
 * received the shard reward for reaching
 * a specific Trainer Level.
 * ========================================
 */

export async function hasShardGrantForLevel(
  profileId: string,
  trainerLevel: number
): Promise<boolean> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<{ id: string }>(
      `
        SELECT id
        FROM pokemon_shard_grants
        WHERE profile_id = ?
          AND trainer_level = ?
        LIMIT 1;
      `,
      profileId,
      trainerLevel
    );

  return row !== null;
}

/*
 * ========================================
 * CREATE SHARD GRANT
 * ========================================
 *
 * Records that a profile has been paid
 * shards for reaching trainerLevel.
 *
 * IMPORTANT:
 *
 * The unique index on
 * (profile_id, trainer_level) is the real
 * duplicate-prevention mechanism. This
 * function relies on that constraint
 * rather than a read-then-write check
 * alone, so it stays correct even under
 * concurrent calls.
 *
 * Returns null (instead of throwing) if
 * the level was already granted, so
 * callers can treat it the same way
 * awardXP() treats an already-awarded XP
 * transaction.
 * ========================================
 */

export async function createShardGrant(
  profileId: string,
  trainerLevel: number,
  shardsAwarded: number
): Promise<PokemonShardGrant | null> {
  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (
    !Number.isInteger(trainerLevel) ||
    trainerLevel < 1
  ) {
    throw new Error(
      'INVALID_TRAINER_LEVEL'
    );
  }

  if (
    !Number.isFinite(shardsAwarded) ||
    shardsAwarded <= 0
  ) {
    throw new Error(
      'INVALID_SHARD_AMOUNT'
    );
  }

  const db = await getDatabase();

  const id = `shard-grant-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  const now = new Date().toISOString();

  try {
    await db.runAsync(
      `
        INSERT INTO pokemon_shard_grants (
          id,
          profile_id,
          trainer_level,
          shards_awarded,
          granted_at
        )
        VALUES (?, ?, ?, ?, ?);
      `,
      id,
      profileId,
      trainerLevel,
      Math.floor(shardsAwarded),
      now
    );
  } catch (error) {
    /*
     * Unique constraint violation means
     * this level was already granted by
     * a previous call. Treat as a
     * no-op, not an error.
     */

    const alreadyGranted =
      await hasShardGrantForLevel(
        profileId,
        trainerLevel
      );

    if (alreadyGranted) {
      return null;
    }

    throw error;
  }

  const row =
    await db.getFirstAsync<PokemonShardGrantRow>(
      `
        SELECT *
        FROM pokemon_shard_grants
        WHERE id = ?
        LIMIT 1;
      `,
      id
    );

  if (!row) {
    throw new Error(
      'FAILED_TO_CREATE_SHARD_GRANT'
    );
  }

  return mapGrant(row);
}

/*
 * ========================================
 * GET HIGHEST GRANTED LEVEL
 * ========================================
 *
 * Used to figure out which levels still
 * need shards granted after a jump in XP
 * (e.g. a big workout that crosses
 * multiple Trainer Levels at once).
 * ========================================
 */

export async function getHighestGrantedLevel(
  profileId: string
): Promise<number> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<{
      max_level: number | null;
    }>(
      `
        SELECT MAX(trainer_level) AS max_level
        FROM pokemon_shard_grants
        WHERE profile_id = ?;
      `,
      profileId
    );

  return row?.max_level ?? 0;
}
