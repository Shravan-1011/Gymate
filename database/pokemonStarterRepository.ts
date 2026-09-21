import { getDatabase } from './database';

/*
 * ========================================
 * STARTER STATE TYPE
 * ========================================
 */

export type PokemonStarterState = {
  profileId: string;

  starterSelected: boolean;

  starterSpeciesId: string | null;

  selectedAt: string | null;

  createdAt: string;

  updatedAt: string;
};

type PokemonStarterStateRow = {
  profile_id: string;

  starter_selected: number;

  starter_species_id: string | null;

  selected_at: string | null;

  created_at: string;

  updated_at: string;
};

function mapStarterState(
  row: PokemonStarterStateRow
): PokemonStarterState {
  return {
    profileId: row.profile_id,

    starterSelected:
      row.starter_selected === 1,

    starterSpeciesId:
      row.starter_species_id,

    selectedAt: row.selected_at,

    createdAt: row.created_at,

    updatedAt: row.updated_at,
  };
}

/*
 * ========================================
 * GET STARTER STATE
 * ========================================
 */

export async function getPokemonStarterState(
  profileId: string
): Promise<PokemonStarterState | null> {
  const db = await getDatabase();

  if (!profileId) {
    return null;
  }

  const row =
    await db.getFirstAsync<PokemonStarterStateRow>(
      `
        SELECT *
        FROM pokemon_starter_state
        WHERE profile_id = ?
        LIMIT 1;
      `,
      profileId
    );

  if (!row) {
    return null;
  }

  return mapStarterState(row);
}

/*
 * ========================================
 * CREATE STARTER STATE
 * ========================================
 *
 * Creates the "not yet selected" row for
 * a profile the first time the Pokémon
 * tab needs to check starter status.
 * ========================================
 */

export async function createPokemonStarterState(
  profileId: string
): Promise<PokemonStarterState> {
  const db = await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  const existing =
    await getPokemonStarterState(
      profileId
    );

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO pokemon_starter_state (
        profile_id,
        starter_selected,
        starter_species_id,
        selected_at,
        created_at,
        updated_at
      )
      VALUES (?, 0, NULL, NULL, ?, ?);
    `,
    profileId,
    now,
    now
  );

  const created =
    await getPokemonStarterState(
      profileId
    );

  if (!created) {
    throw new Error(
      'FAILED_TO_CREATE_STARTER_STATE'
    );
  }

  return created;
}

/*
 * ========================================
 * GET OR CREATE STARTER STATE
 * ========================================
 */

export async function getOrCreatePokemonStarterState(
  profileId: string
): Promise<PokemonStarterState> {
  const existing =
    await getPokemonStarterState(
      profileId
    );

  if (existing) {
    return existing;
  }

  return createPokemonStarterState(
    profileId
  );
}

/*
 * ========================================
 * MARK STARTER SELECTED
 * ========================================
 *
 * One-time transition. If the starter has
 * already been selected, this is a no-op
 * that returns the existing state — it
 * will NOT overwrite an earlier choice,
 * which is what stops starter selection
 * from being re-triggerable by navigating
 * away and back.
 * ========================================
 */

export async function markStarterSelected(
  profileId: string,
  starterSpeciesId: string
): Promise<PokemonStarterState> {
  const db = await getDatabase();

  const current =
    await getOrCreatePokemonStarterState(
      profileId
    );

  if (current.starterSelected) {
    return current;
  }

  const now = new Date().toISOString();

  const result = await db.runAsync(
    `
      UPDATE pokemon_starter_state
      SET
        starter_selected = 1,
        starter_species_id = ?,
        selected_at = ?,
        updated_at = ?
      WHERE profile_id = ?
        AND starter_selected = 0;
    `,
    starterSpeciesId,
    now,
    now,
    profileId
  );

  /*
   * Someone else already completed
   * starter selection for this profile
   * between our read and write (e.g. a
   * double-tap). Return the state as it
   * actually is now rather than trusting
   * our own write.
   */

  const updated =
    await getPokemonStarterState(
      profileId
    );

  if (!updated) {
    throw new Error(
      'FAILED_TO_UPDATE_STARTER_STATE'
    );
  }

  return updated;
}
