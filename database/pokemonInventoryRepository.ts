import { getDatabase } from './database';

import { PokeballType } from '../types/pokemon';

/*
 * ========================================
 * INVENTORY ITEM TYPE
 * ========================================
 */

export type PokemonInventoryItem = {
  profileId: string;

  ballType: PokeballType;

  count: number;

  updatedAt: string;
};

type PokemonInventoryRow = {
  profile_id: string;

  ball_type: string;

  count: number;

  updated_at: string;
};

function mapInventoryItem(
  row: PokemonInventoryRow
): PokemonInventoryItem {
  return {
    profileId: row.profile_id,

    ballType: row.ball_type as PokeballType,

    count: row.count,

    updatedAt: row.updated_at,
  };
}

/*
 * ========================================
 * GET INVENTORY (all ball types)
 * ========================================
 */

export async function getPokemonInventory(
  profileId: string
): Promise<PokemonInventoryItem[]> {
  const db = await getDatabase();

  if (!profileId) {
    return [];
  }

  const rows =
    await db.getAllAsync<PokemonInventoryRow>(
      `
        SELECT *
        FROM pokemon_inventory
        WHERE profile_id = ?;
      `,
      profileId
    );

  return rows.map(mapInventoryItem);
}

/*
 * ========================================
 * GET BALL COUNT
 * ========================================
 */

export async function getPokeballCount(
  profileId: string,
  ballType: PokeballType
): Promise<number> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<{
      count: number;
    }>(
      `
        SELECT count
        FROM pokemon_inventory
        WHERE profile_id = ?
          AND ball_type = ?
        LIMIT 1;
      `,
      profileId,
      ballType
    );

  return row?.count ?? 0;
}

/*
 * ========================================
 * ADD BALLS
 * ========================================
 *
 * Increments the count for a ball type,
 * creating the row if it doesn't exist
 * yet (SQLite UPSERT).
 * ========================================
 */

export async function addPokeballs(
  profileId: string,
  ballType: PokeballType,
  quantity: number = 1
): Promise<number> {
  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      'INVALID_BALL_QUANTITY'
    );
  }

  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO pokemon_inventory (
        profile_id,
        ball_type,
        count,
        updated_at
      )
      VALUES (?, ?, ?, ?)
      ON CONFLICT(profile_id, ball_type)
      DO UPDATE SET
        count = count + excluded.count,
        updated_at = excluded.updated_at;
    `,
    profileId,
    ballType,
    quantity,
    now
  );

  return getPokeballCount(
    profileId,
    ballType
  );
}

/*
 * ========================================
 * CONSUME BALL
 * ========================================
 *
 * Decrements a ball's count by 1.
 *
 * Returns false if the profile does not
 * own one, so callers know the open
 * attempt should be rejected. The WHERE
 * clause guards against the count going
 * negative under concurrent calls.
 * ========================================
 */

export async function consumePokeball(
  profileId: string,
  ballType: PokeballType
): Promise<boolean> {
  const db = await getDatabase();

  const now = new Date().toISOString();

  const result = await db.runAsync(
    `
      UPDATE pokemon_inventory
      SET
        count = count - 1,
        updated_at = ?
      WHERE profile_id = ?
        AND ball_type = ?
        AND count >= 1;
    `,
    now,
    profileId,
    ballType
  );

  return result.changes > 0;
}
