import { getDatabase } from './database';

/*
 * ========================================
 * POKÉDEX ENTRY
 * ========================================
 */

export type PokedexEntry = {
  profileId: string;
  speciesId: string;
  registeredAt: string;
};


/*
 * ========================================
 * DATABASE ROW
 * ========================================
 */

type PokedexEntryRow = {
  profile_id: string;
  species_id: string;
  registered_at: string;
};


/*
 * ========================================
 * MAP ROW
 * ========================================
 */

function mapPokedexEntry(
  row: PokedexEntryRow
): PokedexEntry {
  return {
    profileId: row.profile_id,
    speciesId: row.species_id,
    registeredAt: row.registered_at,
  };
}


/*
 * ========================================
 * REGISTER SPECIES
 * ========================================
 *
 * Registers a species permanently in the
 * user's Pokédex.
 *
 * INSERT OR IGNORE is intentional:
 *
 * - first registration creates the entry
 * - registering the same species again
 *   does nothing
 *
 * This makes the operation safe to call
 * whenever a Pokémon is obtained or
 * evolved.
 * ========================================
 */

export async function registerPokedexSpecies(
  profileId: string,
  speciesId: string
): Promise<PokedexEntry | null> {
  const db = await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (!speciesId) {
    throw new Error(
      'SPECIES_ID_REQUIRED'
    );
  }

  const existing =
    await db.getFirstAsync<PokedexEntryRow>(
      `
        SELECT
          profile_id,
          species_id,
          registered_at
        FROM pokedex_entries
        WHERE profile_id = ?
          AND species_id = ?
        LIMIT 1;
      `,
      profileId,
      speciesId
    );

  if (existing) {
    return mapPokedexEntry(existing);
  }

  const registeredAt =
    new Date().toISOString();

  await db.runAsync(
    `
      INSERT OR IGNORE INTO pokedex_entries (
        profile_id,
        species_id,
        registered_at
      )
      VALUES (?, ?, ?);
    `,
    profileId,
    speciesId,
    registeredAt
  );

  const created =
    await db.getFirstAsync<PokedexEntryRow>(
      `
        SELECT
          profile_id,
          species_id,
          registered_at
        FROM pokedex_entries
        WHERE profile_id = ?
          AND species_id = ?
        LIMIT 1;
      `,
      profileId,
      speciesId
    );

  if (!created) {
    return null;
  }

  return mapPokedexEntry(created);
}


/*
 * ========================================
 * REGISTER MULTIPLE SPECIES
 * ========================================
 *
 * Useful for future migrations or bulk
 * registration.
 * ========================================
 */

export async function registerPokedexSpeciesBatch(
  profileId: string,
  speciesIds: string[]
): Promise<void> {
  const db = await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  const uniqueSpeciesIds =
    Array.from(
      new Set(
        speciesIds.filter(Boolean)
      )
    );

  if (
    uniqueSpeciesIds.length === 0
  ) {
    return;
  }

  const registeredAt =
    new Date().toISOString();

  for (const speciesId of uniqueSpeciesIds) {
    await db.runAsync(
      `
        INSERT OR IGNORE INTO pokedex_entries (
          profile_id,
          species_id,
          registered_at
        )
        VALUES (?, ?, ?);
      `,
      profileId,
      speciesId,
      registeredAt
    );
  }
}


/*
 * ========================================
 * GET ALL POKÉDEX ENTRIES
 * ========================================
 */

export async function getPokedexEntriesForProfile(
  profileId: string
): Promise<PokedexEntry[]> {
  const db = await getDatabase();

  if (!profileId) {
    return [];
  }

  const rows =
    await db.getAllAsync<PokedexEntryRow>(
      `
        SELECT
          profile_id,
          species_id,
          registered_at
        FROM pokedex_entries
        WHERE profile_id = ?
        ORDER BY registered_at ASC;
      `,
      profileId
    );

  return rows.map(
    mapPokedexEntry
  );
}


/*
 * ========================================
 * GET REGISTERED SPECIES IDS
 * ========================================
 */

export async function getRegisteredPokedexSpeciesIds(
  profileId: string
): Promise<string[]> {
  const entries =
    await getPokedexEntriesForProfile(
      profileId
    );

  return entries.map(
    entry => entry.speciesId
  );
}


/*
 * ========================================
 * COUNT POKÉDEX
 * ========================================
 */

export async function countPokedexEntries(
  profileId: string
): Promise<number> {
  const db = await getDatabase();

  if (!profileId) {
    return 0;
  }

  const row =
    await db.getFirstAsync<{
      total: number;
    }>(
      `
        SELECT COUNT(*) AS total
        FROM pokedex_entries
        WHERE profile_id = ?;
      `,
      profileId
    );

  return row?.total ?? 0;
}


/*
 * ========================================
 * CHECK SPECIES
 * ========================================
 */

export async function isPokedexSpeciesRegistered(
  profileId: string,
  speciesId: string
): Promise<boolean> {
  const db = await getDatabase();

  if (
    !profileId ||
    !speciesId
  ) {
    return false;
  }

  const row =
    await db.getFirstAsync<{
      species_id: string;
    }>(
      `
        SELECT species_id
        FROM pokedex_entries
        WHERE profile_id = ?
          AND species_id = ?
        LIMIT 1;
      `,
      profileId,
      speciesId
    );

  return !!row;
}


export async function getPokedexSpeciesIds(
  profileId: string
): Promise<string[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    species_id: string;
  }>(
    `
      SELECT species_id
      FROM pokedex_entries
      WHERE profile_id = ?
      ORDER BY registered_at ASC
    `,
    [profileId]
  );

  return rows.map(
    row => row.species_id
  );
}