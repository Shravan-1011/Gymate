import { getDatabase } from './database';

import { MAX_TEAM_SIZE } from '../types/pokemon';

/*
 * ========================================
 * TEAM SLOT TYPE
 * ========================================
 */

export type PokemonTeamSlot = {
  profileId: string;

  slot: number;

  userPokemonId: string;

  addedAt: string;
};

type PokemonTeamRow = {
  profile_id: string;

  slot: number;

  user_pokemon_id: string;

  added_at: string;
};

function mapTeamSlot(
  row: PokemonTeamRow
): PokemonTeamSlot {
  return {
    profileId: row.profile_id,

    slot: row.slot,

    userPokemonId: row.user_pokemon_id,

    addedAt: row.added_at,
  };
}

/*
 * ========================================
 * GET TEAM
 * ========================================
 *
 * Returns up to MAX_TEAM_SIZE slots,
 * ordered by slot number.
 * ========================================
 */

export async function getPokemonTeam(
  profileId: string
): Promise<PokemonTeamSlot[]> {
  const db = await getDatabase();

  if (!profileId) {
    return [];
  }

  const rows =
    await db.getAllAsync<PokemonTeamRow>(
      `
        SELECT *
        FROM pokemon_team
        WHERE profile_id = ?
        ORDER BY slot ASC;
      `,
      profileId
    );

  return rows.map(mapTeamSlot);
}

/*
 * ========================================
 * GET NEXT OPEN SLOT
 * ========================================
 *
 * Returns the lowest unused slot number
 * (1-3), or null if the team is full.
 * ========================================
 */

export async function getNextOpenTeamSlot(
  profileId: string
): Promise<number | null> {
  const team = await getPokemonTeam(
    profileId
  );

  const usedSlots = new Set(
    team.map((entry) => entry.slot)
  );

  for (
    let slot = 1;
    slot <= MAX_TEAM_SIZE;
    slot++
  ) {
    if (!usedSlots.has(slot)) {
      return slot;
    }
  }

  return null;
}

/*
 * ========================================
 * ADD POKÉMON TO TEAM
 * ========================================
 *
 * Fails with a clear error rather than
 * silently truncating if the team is
 * already full — the UI is expected to
 * check getNextOpenTeamSlot()/team length
 * before offering this action, but the
 * repository enforces it regardless.
 *
 * A Pokémon cannot be added twice — the
 * unique index on user_pokemon_id makes
 * that a database-level guarantee, but we
 * also check up front for a clean error
 * message.
 * ========================================
 */

export async function addPokemonToTeam(
  profileId: string,
  userPokemonId: string,
  slot?: number
): Promise<PokemonTeamSlot> {
  const db = await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (!userPokemonId) {
    throw new Error(
      'USER_POKEMON_ID_REQUIRED'
    );
  }

  const existingSlot =
    await db.getFirstAsync<{
      profile_id: string;
    }>(
      `
        SELECT profile_id
        FROM pokemon_team
        WHERE user_pokemon_id = ?
        LIMIT 1;
      `,
      userPokemonId
    );

  if (existingSlot) {
    throw new Error(
      'POKEMON_ALREADY_ON_A_TEAM'
    );
  }

  const targetSlot =
    slot ??
    (await getNextOpenTeamSlot(
      profileId
    ));

  if (targetSlot === null) {
    throw new Error('TEAM_IS_FULL');
  }

  if (
    targetSlot < 1 ||
    targetSlot > MAX_TEAM_SIZE
  ) {
    throw new Error(
      'INVALID_TEAM_SLOT'
    );
  }

  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO pokemon_team (
        profile_id,
        slot,
        user_pokemon_id,
        added_at
      )
      VALUES (?, ?, ?, ?)
      ON CONFLICT(profile_id, slot)
      DO UPDATE SET
        user_pokemon_id = excluded.user_pokemon_id,
        added_at = excluded.added_at;
    `,
    profileId,
    targetSlot,
    userPokemonId,
    now
  );

  return {
    profileId,

    slot: targetSlot,

    userPokemonId,

    addedAt: now,
  };
}

/*
 * ========================================
 * REMOVE POKÉMON FROM TEAM (→ PC)
 * ========================================
 *
 * Removing from pokemon_team is all that
 * "sending to PC" requires — a Pokémon
 * not present in pokemon_team is, by
 * definition, in the PC. See
 * userPokemonRepository.getPCPokemonForProfile().
 * ========================================
 */

export async function removePokemonFromTeam(
  profileId: string,
  userPokemonId: string
): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `
      DELETE FROM pokemon_team
      WHERE profile_id = ?
        AND user_pokemon_id = ?;
    `,
    profileId,
    userPokemonId
  );

  return result.changes > 0;
}

/*
 * ========================================
 * IS TEAM FULL
 * ========================================
 */

export async function isTeamFull(
  profileId: string
): Promise<boolean> {
  const team = await getPokemonTeam(
    profileId
  );

  return team.length >= MAX_TEAM_SIZE;
}
