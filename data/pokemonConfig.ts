import {
  PokeballConfig,
  POKEBALL_TYPE,
  PokeballType,
} from '../types/pokemon';

/*
 * ========================================
 * POKÉMON SYSTEM CONFIGURATION
 * ========================================
 *
 * Confirmed values (from product owner):
 *
 *   - Ball shard costs
 *   - Ball catch rules
 *   - +5 shards every 7-day streak
 *   - Pokémon XP-per-level (50)
 *   - Evolution levels (16 / 36)
 *   - Milestone shard rewards
 *     (16 → 3, 36 → 5, 100 → 15)
 *   - Max Pokémon level (100)
 *
 * Still explicitly NOT finalized: PC
 * capacity, the full species roster,
 * and the full achievement/gym badge
 * list (a small starter set exists in
 * data/pokemonAchievements.ts /
 * data/pokemonGymBadges.ts to prove the
 * systems out).
 *
 * Nothing in this file should be
 * hard-coded anywhere else — always read
 * through this file (or the service that
 * wraps it, services/pokemonDataService.ts)
 * so values can change without touching
 * UI or business logic.
 * ========================================
 */

/*
 * ========================================
 * BALL CATALOGUE
 * ========================================
 */

export const POKEBALL_CATALOG: PokeballConfig[] = [

  {
    type: POKEBALL_TYPE.POKE_BALL,
    displayName: 'Poké Ball',
    shardCost: 3,
    catchRule: 'basic_form',
  },

  {
    type: POKEBALL_TYPE.GREAT_BALL,
    displayName: 'Great Ball',
    shardCost: 5,
    catchRule: 'short_final_form',
  },

  {
    type: POKEBALL_TYPE.ULTRA_BALL,
    displayName: 'Ultra Ball',
    shardCost: 8,
    catchRule: 'mid_evolution_form',
  },

  {
    type: POKEBALL_TYPE.MASTER_BALL,
    displayName: 'Master Ball',
    shardCost: 10,
    catchRule: 'legendary',
  },

  

];

const ballConfigByType: Record<
  PokeballType,
  PokeballConfig
> = POKEBALL_CATALOG.reduce(
  (accumulator, config) => {
    accumulator[config.type] = config;

    return accumulator;
  },
  {} as Record<PokeballType, PokeballConfig>
);

export function getPokeballConfig(
  ballType: PokeballType
): PokeballConfig {
  const config =
    ballConfigByType[ballType];

  if (!config) {
    throw new Error(
      `UNKNOWN_POKEBALL_TYPE: ${ballType}`
    );
  }

  return config;
}

/*
 * ========================================
 * POKÉBALL SHARDS PER TRAINER LEVEL
 * ========================================
 */

export const SHARDS_PER_TRAINER_LEVEL = 1;

/*
 * ========================================
 * STREAK SHARD BONUS
 * ========================================
 *
 * Every STREAK_SHARD_INTERVAL_DAYS-day
 * streak milestone (7, 14, 21, ...)
 * grants STREAK_SHARD_REWARD shards.
 * ========================================
 */

export const STREAK_SHARD_INTERVAL_DAYS = 7;

export const STREAK_SHARD_REWARD = 3;

/*
 * ========================================
 * POKÉMON LEVELING
 * ========================================
 *
 * Flat XP-per-level, same philosophy as
 * the reconciled Trainer Level formula:
 * predictable over cute-but-inconsistent.
 *
 *   level = floor(pokemonXP / 50)
 *
 * capped at POKEMON_MAX_LEVEL.
 * ========================================
 */

export const POKEMON_XP_PER_LEVEL = 50;

export const POKEMON_MAX_LEVEL = 100;

/*
 * ========================================
 * EVOLUTION LEVELS
 * ========================================
 *
 * Flat thresholds applied to every
 * family, rather than per-species
 * thresholds like the mainline games —
 * simpler, and every 3-stage family here
 * evolves at the same two levels.
 * ========================================
 */

export const EVOLUTION_LEVEL_STAGE_2 = 16;

export const EVOLUTION_LEVEL_STAGE_3 = 36;

/*
 * ========================================
 * LEVEL MILESTONE SHARD REWARDS
 * ========================================
 *
 * Paid out for REACHING the level,
 * regardless of whether the Pokémon
 * actually has an evolution waiting at
 * that threshold — this is what keeps
 * leveling worthwhile even for Pokémon
 * with no evolution (e.g. Articuno).
 * ========================================
 */

export const LEVEL_MILESTONE_SHARD_REWARDS: Record<
  number,
  number
> = {
  [EVOLUTION_LEVEL_STAGE_2]: 3,
  [EVOLUTION_LEVEL_STAGE_3]: 5,
  [POKEMON_MAX_LEVEL]: 15,
};

/*
 * ========================================
 * PC CAPACITY
 * ========================================
 *
 * NOT FINALIZED. `null` means unlimited
 * for now.
 * ========================================
 */

export const PC_CAPACITY: number | null = null;
