import { getDatabase } from './database';

import {
  UserPokemon,
  PokemonSource,
} from '../types/pokemon';

import {
  registerPokedexSpecies,
} from './pokedexRepository';

/*
 * ========================================
 * DATABASE ROW TYPE
 * ========================================
 */

type UserPokemonRow = {
  id: string;

  profile_id: string;

  species_id: string;

  nickname: string | null;

  xp: number;

  level: number;

  obtained_at: string;

  source: string;

  created_at: string;
};

function mapUserPokemon(
  row: UserPokemonRow
): UserPokemon {
  return {
    id: row.id,

    profileId: row.profile_id,

    speciesId: row.species_id,

    nickname: row.nickname,

    xp: row.xp,

    level: row.level,

    obtainedAt: row.obtained_at,

    source: row.source as PokemonSource,

    createdAt: row.created_at,
  };
}

/*
 * ========================================
 * CREATE USER POKÉMON
 * ========================================
 *
 * Adds a new owned Pokémon instance for a
 * profile. This does NOT touch the team —
 * new Pokémon go to the PC by default
 * (i.e. simply not present in
 * pokemon_team). Adding a starter to the
 * team is a separate, explicit call in
 * pokemonTeamRepository.ts.
 * ========================================
 */

export async function createUserPokemon(
  profileId: string,
  speciesId: string,
  source: PokemonSource,
  startingXP: number = 0
): Promise<UserPokemon> {
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

  const id = `pokemon-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  const now = new Date().toISOString();

  const xp = Math.max(
    0,
    Math.floor(startingXP)
  );

  /*
   * level = floor(xp / 50), computed
   * here rather than imported from
   * pokemonConfig to keep this a pure
   * data-access file — callers that
   * need the "real" level/XP curve
   * should go through
   * services/pokemonProgressionService.ts,
   * which owns that math. This inline
   * copy only matters for xp=0 (level 0)
   * in practice, since new Pokémon are
   * always created at 0 XP today.
   */

  const level = Math.min(
    100,
    Math.floor(xp / 50)
  );

    await db.runAsync(
    `
      INSERT INTO user_pokemon (
        id,
        profile_id,
        species_id,
        nickname,
        xp,
        level,
        obtained_at,
        source,
        created_at
      )
      VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?);
    `,
    id,
    profileId,
    speciesId,
    xp,
    level,
    now,
    source,
    now
  );


  /*
   * ======================================
   * POKÉDEX REGISTRATION
   * ======================================
   *
   * Obtaining a Pokémon immediately
   * registers its species.
   *
   * Duplicate species are ignored by the
   * Pokédex repository.
   * ======================================
   */

  await registerPokedexSpecies(
    profileId,
    speciesId
  );


  const created =
    await getUserPokemonById(id);

  if (!created) {
    throw new Error(
      'FAILED_TO_CREATE_USER_POKEMON'
    );
  }

  return created;
}

/*
 * ========================================
 * UPDATE XP / LEVEL / SPECIES
 * ========================================
 *
 * The one write path for individual
 * Pokémon progression: XP-share gains,
 * level-derived changes, and evolution
 * (species_id swap) all land through
 * here in a single UPDATE, so a Pokémon
 * is never left with an XP/level/species
 * combination that didn't exist at any
 * point in time.
 *
 * newSpeciesId is optional — omit it
 * when the Pokémon leveled up without
 * evolving.
 * ========================================
 */

export async function updatePokemonProgress(
  userPokemonId: string,
  newXP: number,
  newLevel: number,
  newSpeciesId?: string
): Promise<UserPokemon | null> {
  const db = await getDatabase();

  if (newSpeciesId) {
    await db.runAsync(
      `
        UPDATE user_pokemon
        SET
          xp = ?,
          level = ?,
          species_id = ?
        WHERE id = ?;
      `,
      Math.max(0, Math.floor(newXP)),
      Math.max(0, Math.floor(newLevel)),
      newSpeciesId,
      userPokemonId
    );
  } else {
    await db.runAsync(
      `
        UPDATE user_pokemon
        SET
          xp = ?,
          level = ?
        WHERE id = ?;
      `,
      Math.max(0, Math.floor(newXP)),
      Math.max(0, Math.floor(newLevel)),
      userPokemonId
    );
  }

  return getUserPokemonById(
    userPokemonId
  );
}

/*
 * ========================================
 * GET USER POKÉMON BY ID
 * ========================================
 */

export async function getUserPokemonById(
  userPokemonId: string
): Promise<UserPokemon | null> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<UserPokemonRow>(
      `
        SELECT *
        FROM user_pokemon
        WHERE id = ?
        LIMIT 1;
      `,
      userPokemonId
    );

  if (!row) {
    return null;
  }

  return mapUserPokemon(row);
}

/*
 * ========================================
 * GET ALL POKÉMON FOR PROFILE
 * ========================================
 */

export async function getUserPokemonForProfile(
  profileId: string
): Promise<UserPokemon[]> {
  const db = await getDatabase();

  if (!profileId) {
    return [];
  }

  const rows =
    await db.getAllAsync<UserPokemonRow>(
      `
        SELECT *
        FROM user_pokemon
        WHERE profile_id = ?
        ORDER BY obtained_at DESC;
      `,
      profileId
    );

  return rows.map(mapUserPokemon);
}

/*
 * ========================================
 * GET PC POKÉMON (owned, not on team)
 * ========================================
 */

export async function getPCPokemonForProfile(
  profileId: string
): Promise<UserPokemon[]> {
  const db = await getDatabase();

  if (!profileId) {
    return [];
  }

  const rows =
    await db.getAllAsync<UserPokemonRow>(
      `
        SELECT up.*
        FROM user_pokemon up
        WHERE up.profile_id = ?
          AND up.id NOT IN (
            SELECT user_pokemon_id
            FROM pokemon_team
            WHERE profile_id = ?
          )
        ORDER BY up.obtained_at DESC;
      `,
      profileId,
      profileId
    );

  return rows.map(mapUserPokemon);
}

/*
 * ========================================
 * RENAME (NICKNAME) POKÉMON
 * ========================================
 *
 * Future-facing — not wired into any UI
 * yet, but the spec calls out nicknames
 * as an optional/future field, so the
 * column and this helper already exist.
 * ========================================
 */

export async function setUserPokemonNickname(
  userPokemonId: string,
  nickname: string | null
): Promise<UserPokemon | null> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE user_pokemon
      SET nickname = ?
      WHERE id = ?;
    `,
    nickname,
    userPokemonId
  );

  return getUserPokemonById(
    userPokemonId
  );
}

/*
 * ========================================
 * COUNT OWNED POKÉMON
 * ========================================
 */

export async function countUserPokemon(
  profileId: string
): Promise<number> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<{
      total: number;
    }>(
      `
        SELECT COUNT(*) AS total
        FROM user_pokemon
        WHERE profile_id = ?;
      `,
      profileId
    );

  return row?.total ?? 0;
}
