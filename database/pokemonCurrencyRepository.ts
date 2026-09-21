import { getDatabase } from './database';

/*
 * ========================================
 * POKÉMON CURRENCY TYPE
 * ========================================
 */

export type PokemonCurrency = {
  profileId: string;

  pokeballShards: number;

  createdAt: string;

  updatedAt: string;
};

/*
 * ========================================
 * DATABASE ROW TYPE
 * ========================================
 */

type PokemonCurrencyRow = {
  profile_id: string;

  pokeball_shards: number;

  created_at: string;

  updated_at: string;
};

/*
 * ========================================
 * ROW → CURRENCY
 * ========================================
 */

function mapCurrency(
  row: PokemonCurrencyRow
): PokemonCurrency {
  return {
    profileId: row.profile_id,

    pokeballShards: row.pokeball_shards,

    createdAt: row.created_at,

    updatedAt: row.updated_at,
  };
}

/*
 * ========================================
 * GET CURRENCY
 * ========================================
 */

export async function getPokemonCurrency(
  profileId: string
): Promise<PokemonCurrency | null> {
  const db = await getDatabase();

  if (!profileId) {
    return null;
  }

  const row =
    await db.getFirstAsync<PokemonCurrencyRow>(
      `
        SELECT *
        FROM pokemon_currency
        WHERE profile_id = ?
        LIMIT 1;
      `,
      profileId
    );

  if (!row) {
    return null;
  }

  return mapCurrency(row);
}

/*
 * ========================================
 * CREATE CURRENCY
 * ========================================
 */

export async function createPokemonCurrency(
  profileId: string
): Promise<PokemonCurrency> {
  const db = await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  const existing =
    await getPokemonCurrency(profileId);

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO pokemon_currency (
        profile_id,
        pokeball_shards,
        created_at,
        updated_at
      )
      VALUES (?, 0, ?, ?);
    `,
    profileId,
    now,
    now
  );

  const created =
    await getPokemonCurrency(profileId);

  if (!created) {
    throw new Error(
      'FAILED_TO_CREATE_POKEMON_CURRENCY'
    );
  }

  return created;
}

/*
 * ========================================
 * GET OR CREATE CURRENCY
 * ========================================
 */

export async function getOrCreatePokemonCurrency(
  profileId: string
): Promise<PokemonCurrency> {
  const existing =
    await getPokemonCurrency(profileId);

  if (existing) {
    return existing;
  }

  return createPokemonCurrency(profileId);
}

/*
 * ========================================
 * ADD SHARDS
 * ========================================
 *
 * amount must be a positive integer.
 * ========================================
 */

export async function addPokeballShards(
  profileId: string,
  amount: number
): Promise<PokemonCurrency> {
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      'INVALID_SHARD_AMOUNT'
    );
  }

  const db = await getDatabase();

  const current =
    await getOrCreatePokemonCurrency(
      profileId
    );

  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE pokemon_currency
      SET
        pokeball_shards = pokeball_shards + ?,
        updated_at = ?
      WHERE profile_id = ?;
    `,
    Math.floor(amount),
    now,
    profileId
  );

  const updated =
    await getPokemonCurrency(profileId);

  if (!updated) {
    throw new Error(
      'FAILED_TO_UPDATE_POKEMON_CURRENCY'
    );
  }

  return updated;
}

/*
 * ========================================
 * SPEND SHARDS
 * ========================================
 *
 * Fails (returns null) if the profile does
 * not have enough shards. Never allows the
 * balance to go negative.
 * ========================================
 */

export async function spendPokeballShards(
  profileId: string,
  amount: number
): Promise<PokemonCurrency | null> {
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      'INVALID_SHARD_AMOUNT'
    );
  }

  const db = await getDatabase();

  const current =
    await getOrCreatePokemonCurrency(
      profileId
    );

  const cost = Math.floor(amount);

  if (current.pokeballShards < cost) {
    return null;
  }

  const now = new Date().toISOString();

  /*
   * The WHERE clause double-checks the
   * balance at write time, so two rapid
   * purchases cannot both succeed against
   * a stale read.
   */

  const result = await db.runAsync(
    `
      UPDATE pokemon_currency
      SET
        pokeball_shards = pokeball_shards - ?,
        updated_at = ?
      WHERE profile_id = ?
        AND pokeball_shards >= ?;
    `,
    cost,
    now,
    profileId,
    cost
  );

  if (result.changes === 0) {
    return null;
  }

  return getPokemonCurrency(profileId);
}
