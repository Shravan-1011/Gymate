import {
  getOrCreatePokemonCurrency,
  addPokeballShards,
  type PokemonCurrency,
} from '../database/pokemonCurrencyRepository';

import {
  createShardGrant,
  getHighestGrantedLevel,
} from '../database/pokemonShardGrantRepository';

import { getShardsPerTrainerLevel } from './pokemonDataService';

/*
 * ========================================
 * POKÉBALL SHARD SERVICE
 * ========================================
 *
 * This is the ONLY place that turns a
 * Trainer Level-up into Pokéball Shards.
 *
 * It deliberately knows NOTHING about
 * where XP came from (workout, nutrition,
 * running, steps, todo, streak) — it only
 * cares about the level range being
 * crossed. This keeps the Pokémon system
 * decoupled from individual XP sources,
 * per the product spec:
 *
 *   "The Pokémon system should NOT care
 *    where the XP came from."
 *
 * ========================================
 */

export type ShardGrantResult = {
  profileId: string;

  levelsGranted: number[];

  shardsAwarded: number;

  currency: PokemonCurrency;
};

/*
 * ========================================
 * GRANT SHARDS FOR LEVEL-UP
 * ========================================
 *
 * Call this any time a profile's Trainer
 * Level may have increased (i.e. right
 * after services/xpService.ts computes a
 * new currentLevel).
 *
 * Safe to call even if the level did not
 * actually change, or if some/all of the
 * levels in range were already granted —
 * the unique (profile_id, trainer_level)
 * index in pokemon_shard_grants makes
 * re-granting a no-op rather than a
 * duplicate payout.
 *
 * Handles multi-level jumps (e.g. a huge
 * workout XP award that crosses several
 * Trainer Levels in one go) by granting
 * one shard per level in the range, not
 * just one shard total.
 *
 * previousLevel/currentLevel should come
 * from the SAME linear 500 XP/level
 * formula used by
 * database/progressionRepository.ts —
 * see utils/progression.ts, which was
 * reconciled to delegate to that formula
 * specifically so this stays correct.
 * ========================================
 */

export async function grantShardsForLevelUp(
  profileId: string,
  previousLevel: number,
  currentLevel: number
): Promise<ShardGrantResult | null> {
  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (currentLevel <= previousLevel) {
    return null;
  }

  /*
   * ======================================
   * DEFENSIVE FLOOR
   * ======================================
   *
   * Even if previousLevel/currentLevel
   * are ever computed inconsistently by
   * a caller, never re-grant a level this
   * profile has already been paid for.
   * ======================================
   */

  const highestGranted =
    await getHighestGrantedLevel(
      profileId
    );

  const startLevel = Math.max(
    previousLevel + 1,
    highestGranted + 1
  );

  if (startLevel > currentLevel) {
    return null;
  }

  const shardsPerLevel =
    getShardsPerTrainerLevel();

  const levelsGranted: number[] = [];

  for (
    let level = startLevel;
    level <= currentLevel;
    level++
  ) {
    const grant = await createShardGrant(
      profileId,
      level,
      shardsPerLevel
    );

    /*
     * grant is null if this level was
     * already granted by a concurrent
     * call — skip it rather than
     * double-paying.
     */

    if (grant) {
      levelsGranted.push(level);
    }
  }

  if (levelsGranted.length === 0) {
    const currency =
      await getOrCreatePokemonCurrency(
        profileId
      );

    return {
      profileId,

      levelsGranted: [],

      shardsAwarded: 0,

      currency,
    };
  }

  const totalShards =
    levelsGranted.length *
    shardsPerLevel;

  const currency = await addPokeballShards(
    profileId,
    totalShards
  );

  console.log(
    '[POKEMON] Shard grant',
    profileId,
    levelsGranted,
    totalShards
  );

  return {
    profileId,

    levelsGranted,

    shardsAwarded: totalShards,

    currency,
  };
}

export async function devAddPokeballShards(
  profileId: string,
  amount: number
): Promise<PokemonCurrency> {
  return addPokeballShards(profileId, amount);
}