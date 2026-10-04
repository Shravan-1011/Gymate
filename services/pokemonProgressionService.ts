import { getPokemonTeam } from '../database/pokemonTeamRepository';

import {
  getUserPokemonById,
  updatePokemonProgress,
} from '../database/userPokemonRepository';

import { addPokeballShards } from '../database/pokemonCurrencyRepository';

import {
  registerPokedexSpecies,
} from '../database/pokedexRepository';

import {
  publishPokemonEvolution,
} from './pokemonEvolutionEventService';

import {
  getSpeciesById,
  getPokemonLevelForXP,
  getEvolutionLevelStage2,
  getEvolutionLevelStage3,
  getLevelMilestoneShardReward,
  getPokemonMaxLevel,
} from './pokemonDataService';

import { safelyEvaluateAchievements } from './pokemonAchievementService';

/*
 * ========================================
 * POKÉMON PROGRESSION SERVICE
 * ========================================
 *
 * "XP Share": whenever the profile earns
 * Gymate XP (workout, nutrition, running,
 * steps, todo, streak — via
 * xpService.awardXP), that SAME amount is
 * split evenly across the profile's
 * current TEAM members (max 3) and added
 * to each one's individual Pokémon XP.
 * PC'd Pokémon get nothing — this is
 * meant to make team choice matter.
 *
 * Example: team of 3, a 400 XP day →
 * each team member gets floor(400/3)
 * = 133 individual XP.
 *
 * A Pokémon's own level is derived from
 * its individual XP (50 XP/level, capped
 * at 100 — see data/pokemonConfig.ts),
 * completely separate from Trainer Level.
 *
 * Crossing level 16 or 36 evolves the
 * Pokémon in place (species_id swap) if
 * its current species has an evolution
 * waiting there. Reaching level 16, 36,
 * or 100 always pays a shard bonus,
 * whether or not the species evolves —
 * that's what keeps leveling worthwhile
 * for Pokémon with no evolution.
 * ========================================
 */

export type PokemonLevelUpEvent = {
  userPokemonId: string;

  previousLevel: number;

  newLevel: number;

  previousSpeciesId: string;

  evolvedToSpeciesId?: string;

  shardsAwarded: number;
};

/*
 * ========================================
 * ADD XP TO A SINGLE POKÉMON
 * ========================================
 *
 * Handles the full pipeline for one
 * Pokémon: XP add → level recompute →
 * evolution cascade → milestone shards.
 * ========================================
 */
async function addXPToPokemon(
  profileId: string,
  userPokemonId: string,
  xpToAdd: number
): Promise<PokemonLevelUpEvent | null> {
  if (xpToAdd <= 0) {
    return null;
  }

  const pokemon = await getUserPokemonById(
    userPokemonId
  );

  if (!pokemon) {
    return null;
  }

  const maxLevel = getPokemonMaxLevel();

  const previousLevel = pokemon.level;

  if (previousLevel >= maxLevel) {
    /*
     * Already maxed out — XP Share has
     * nothing left to do for this
     * Pokémon. (Its would-be share is
     * simply not distributed elsewhere;
     * see distributeTeamXPShare.)
     */
    return null;
  }

  const newXP = pokemon.xp + xpToAdd;

  const newLevel = getPokemonLevelForXP(
    newXP
  );

  /*
   * ======================================
   * EVOLUTION CASCADE
   * ======================================
   *
   * A large XP burst can cross both
   * evolution thresholds in one go
   * (e.g. level 10 → level 40), so this
   * walks the chain rather than checking
   * each threshold once.
   * ======================================
   */

  let currentSpeciesId =
    pokemon.speciesId;

  let evolvedToSpeciesId: string | undefined;

  const stage2Level =
    getEvolutionLevelStage2();

  const stage3Level =
    getEvolutionLevelStage3();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const species = getSpeciesById(
      currentSpeciesId
    );

    if (!species || !species.evolvesToSpeciesId) {
      break;
    }

    const requiredLevel =
      species.evolutionStage === 1
        ? stage2Level
        : stage3Level;

    if (newLevel < requiredLevel) {
      break;
    }

    currentSpeciesId =
      species.evolvesToSpeciesId;

    evolvedToSpeciesId = currentSpeciesId;
  }

  if (evolvedToSpeciesId) {
  console.log(
    '[POKEMON] Evolution',
    userPokemonId,
    pokemon.speciesId,
    '->',
    evolvedToSpeciesId
  );


  /*
   * ======================================
   * POKÉDEX REGISTRATION
   * ======================================
   *
   * Evolution permanently registers the
   * newly reached species.
   *
   * Example:
   *
   * Charmander → Charmeleon
   *
   * Charmander remains in the Pokédex,
   * while Charmeleon is added.
   * ======================================
   */

  await registerPokedexSpecies(
    profileId,
    evolvedToSpeciesId
  );
}

  await updatePokemonProgress(
    userPokemonId,
    newXP,
    newLevel,
    evolvedToSpeciesId
  );

  /*
   * ======================================
   * MILESTONE SHARDS
   * ======================================
   *
   * Independent of evolution — paid for
   * REACHING the level. Sum every
   * milestone threshold newly crossed in
   * this single update (handles the same
   * big-XP-burst multi-crossing case as
   * evolution above).
   * ======================================
   */

  let shardsAwarded = 0;

  for (
    let level = previousLevel + 1;
    level <= newLevel;
    level++
  ) {
    shardsAwarded +=
      getLevelMilestoneShardReward(level);
  }

  if (shardsAwarded > 0) {
    await addPokeballShards(
      profileId,
      shardsAwarded
    );

    console.log(
      '[POKEMON] Level milestone shards',
      userPokemonId,
      `level ${newLevel}`,
      shardsAwarded
    );
  }

  if (newLevel === getPokemonMaxLevel()) {
    await safelyEvaluateAchievements(
      profileId
    );
  }

  return {
    userPokemonId,

    previousLevel,

    newLevel,

    previousSpeciesId:
    pokemon.speciesId,

    evolvedToSpeciesId,

    shardsAwarded,
  };
}

/*
 * ========================================
 * DISTRIBUTE TEAM XP SHARE
 * ========================================
 *
 * Called from xpService.awardXP right
 * after a Gymate XP award succeeds.
 * Splits xpAwarded evenly across the
 * profile's current team (1-3 Pokémon).
 * No-ops if the team is empty (e.g.
 * before the starter has been chosen).
 * ========================================
 */
export async function distributeTeamXPShare(
  profileId: string,
  xpAwarded: number
): Promise<PokemonLevelUpEvent[]> {
  if (xpAwarded <= 0) {
    return [];
  }

  const team = await getPokemonTeam(
    profileId
  );

  if (team.length === 0) {
    return [];
  }

  const share = Math.floor(
    xpAwarded / team.length
  );

  if (share <= 0) {
    return [];
  }

  const events: PokemonLevelUpEvent[] = [];

  for (const slot of team) {
    const event = await addXPToPokemon(
      profileId,
      slot.userPokemonId,
      share
    );

    if (event) {
  events.push(event);

  if (event.evolvedToSpeciesId) {
    publishPokemonEvolution(
      event
    );
  }
}
  }

  return events;
}
