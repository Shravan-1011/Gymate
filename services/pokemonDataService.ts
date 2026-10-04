import {
  pokemonSpecies,
  getPokemonSpeciesById,
  getStarterSpecies,
  getCatchableSpeciesByRule,
  getDexCompletionTotal,
} from '../data/pokemonSpecies';

import {
  POKEBALL_CATALOG,
  getPokeballConfig,
  SHARDS_PER_TRAINER_LEVEL,
  STREAK_SHARD_INTERVAL_DAYS,
  STREAK_SHARD_REWARD,
  POKEMON_XP_PER_LEVEL,
  POKEMON_MAX_LEVEL,
  EVOLUTION_LEVEL_STAGE_2,
  EVOLUTION_LEVEL_STAGE_3,
  LEVEL_MILESTONE_SHARD_REWARDS,
  PC_CAPACITY,
} from '../data/pokemonConfig';

import {
  getAllAchievements,
  getAchievementById,
} from '../data/pokemonAchievements';

import {
  getAllGymBadges,
  getGymBadgeById,
  getGymBadgesByRegion,
  getAllRegions,
} from '../data/pokemonGymBadges';

import {
  PokemonSpecies,
  PokeballConfig,
  PokeballType,
   PokemonRarity,
} from '../types/pokemon';

/*
 * ========================================
 * POKÉMON DATA SERVICE
 * ========================================
 *
 * Read-only access to STATIC Pokémon
 * content (species catalog, ball
 * catalogue, leveling/evolution
 * constants, achievements, gym badges).
 *
 * Per the project's code-quality rules,
 * UI components should read static
 * Pokémon data through this service, not
 * by importing the data/ files directly:
 *
 *   UI
 *    ↓
 *   Pokémon data service (this file)
 *    ↓
 *   Species/config data
 * ========================================
 */

export function getAllPokemonSpecies(): PokemonSpecies[] {
  return pokemonSpecies;
}

export function getSpeciesById(
  speciesId: string
): PokemonSpecies | null {
  return getPokemonSpeciesById(speciesId);
}

export function getStarterOptions(): PokemonSpecies[] {
  return getStarterSpecies();
}

export function getAllPokeballConfigs(): PokeballConfig[] {
  return POKEBALL_CATALOG;
}

export function getBallConfig(
  ballType: PokeballType
): PokeballConfig {
  return getPokeballConfig(ballType);
}

export function getShardsPerTrainerLevel(): number {
  return SHARDS_PER_TRAINER_LEVEL;
}

export function getStreakShardIntervalDays(): number {
  return STREAK_SHARD_INTERVAL_DAYS;
}

export function getStreakShardReward(): number {
  return STREAK_SHARD_REWARD;
}

export function getPokemonXPPerLevel(): number {
  return POKEMON_XP_PER_LEVEL;
}

export function getPokemonMaxLevel(): number {
  return POKEMON_MAX_LEVEL;
}

export function getEvolutionLevelStage2(): number {
  return EVOLUTION_LEVEL_STAGE_2;
}

export function getEvolutionLevelStage3(): number {
  return EVOLUTION_LEVEL_STAGE_3;
}

export function getLevelMilestoneShardReward(
  level: number
): number {
  return (
    LEVEL_MILESTONE_SHARD_REWARDS[level] ??
    0
  );
}

export function getPCCapacity(): number | null {
  return PC_CAPACITY;
}

export function getAllPokemonAchievements() {
  return getAllAchievements();
}

export function getPokemonAchievementById(
  achievementId: string
) {
  return getAchievementById(achievementId);
}

export function getAllPokemonGymBadges() {
  return getAllGymBadges();
}

export function getPokemonGymBadgeById(
  badgeId: string
) {
  return getGymBadgeById(badgeId);
}

export function getPokemonGymBadgesByRegion(
  region: string
) {
  return getGymBadgesByRegion(region);
}

export function getAllPokemonRegions() {
  return getAllRegions();
}

export function getPokedexCompletionTotal(): number {
  return getDexCompletionTotal();
}

/*
 * ========================================
 * POKÉMON LEVEL FROM XP
 * ========================================
 */

export function getPokemonLevelForXP(
  xp: number
): number {
  return Math.min(
    POKEMON_MAX_LEVEL,
    Math.floor(
      Math.max(0, xp) /
        POKEMON_XP_PER_LEVEL
    )
  );
}

/*
 * ========================================
 * ROLL SPECIES FOR A BALL
 * ========================================
 *
 * Ball → evolution-stage catch rule (see
 * PokeballCatchRule in types/pokemon.ts):
 *
 *   Poké Ball   → basic_form
 *   Great Ball  → short_final_form
 *   Ultra Ball  → mid_evolution_form
 *   Master Ball → legendary
 *
 * GS Ball has catchRule "mega_evolution"
 * and is never rolled here — it doesn't
 * catch anything, it mega-evolves an
 * owned Pokémon. See
 * pokemonService.megaEvolvePokemon().
 *
 * excludeSpeciesIds lets the caller keep
 * "no duplicate species from any ball" —
 * pass the profile's currently owned
 * species ids and they will never be
 * rolled again. Returns null if every
 * eligible species for this ball is
 * already owned.
 * ========================================
 */

export function rollSpeciesForBall(
  ballType: PokeballType,
  excludeSpeciesIds: string[] = []
): PokemonSpecies | null {
  const config = getBallConfig(ballType);

  if (
    config.catchRule ===
    'mega_evolution'
  ) {
    throw new Error(
      'GS_BALL_DOES_NOT_ROLL_A_SPECIES'
    );
  }

  const excluded =
    new Set(excludeSpeciesIds);

  let pool =
    getCatchableSpeciesByRule(
      config.catchRule
    ).filter(
      (species) =>
        species.evolutionStage === 1
    );

  pool = pool.filter(
    (species) =>
      !excluded.has(species.id)
  );

  if (pool.length === 0) {
    return null;
  }

  /*
   * ========================================
   * JESTER BALL
   * ========================================
   *
   * Rarity weights:
   *
   * Common     80%
   * Uncommon   12%
   * Rare        5%
   * Legendary   3%
   * ========================================
   */

  if (
    config.catchRule ===
    'jester_ball'
  ) {
    const rarityWeights: Record<
      PokemonRarity,
      number
    > = {
      common: 80,
      uncommon: 12,
      rare: 5,
      legendary: 3,
    };

    const weightedPool =
      pool.flatMap((species) => {
        const weight =
          rarityWeights[
            species.rarity
          ];

        return Array(
          weight
        ).fill(species);
      });

    const index =
      Math.floor(
        Math.random() *
          weightedPool.length
      );

    return (
      weightedPool[index] ?? null
    );
  }

  const index =
    Math.floor(
      Math.random() * pool.length
    );

  return pool[index];
}
