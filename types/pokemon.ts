/*
 * ========================================
 * GYMATE POKÉMON SYSTEM — TYPES
 * ========================================
 *
 * This file defines the shared TypeScript
 * types for the Pokémon gamification layer.
 *
 * IMPORTANT:
 *
 * A "species" is a STATIC definition
 * (Bulbasaur, Charmander, ...).
 *
 * A "user pokemon" is an OWNED INSTANCE of
 * a species, stored in SQLite.
 *
 * This mirrors the existing exercises.ts
 * (static) vs custom_exercises (DB) split
 * already used elsewhere in Gymate.
 *
 * ========================================
 */

/*
 * ========================================
 * RARITY
 * ========================================
 */

export const POKEMON_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  
  LEGENDARY: 'legendary',
} as const;

export type PokemonRarity =
  (typeof POKEMON_RARITY)[keyof typeof POKEMON_RARITY];

/*
 * ========================================
 * POKÉMON TYPE
 * ========================================
 */

export type PokemonElementType =
  | 'normal'
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy';

/*
 * ========================================
 * POKÉMON SPECIES
 * ========================================
 */

export type PokemonSpecies = {
  id: string;

  pokedexNumber: number;

  name: string;

  rarity: PokemonRarity;

  types: PokemonElementType[];

  spriteAssetId: string;

  iconAssetId: string;

  cryAssetId?: string;

  isStarter: boolean;

  evolutionStage: 1 | 2 | 3;

  evolvesFromSpeciesId?: string;

  evolvesToSpeciesId?: string;

  canMegaEvolve?: boolean;

  megaFormSpeciesId?: string;

  isMegaForm?: boolean;

  baseFormSpeciesId?: string;
};

/*
 * ========================================
 * BALL TYPE
 * ========================================
 */

export const POKEBALL_TYPE = {
   JESTER_BALL: 'jester_ball',
  POKE_BALL: 'poke_ball',
  GREAT_BALL: 'great_ball',
  ULTRA_BALL: 'ultra_ball',
  MASTER_BALL: 'master_ball',

} as const;

export type PokeballType =
  (typeof POKEBALL_TYPE)[keyof typeof POKEBALL_TYPE];

/*
 * ========================================
 * CATCH RULE
 * ========================================
 */

export type PokeballCatchRule =
  | 'jester_ball'
  | 'basic_form'
  | 'short_final_form'
  | 'mid_evolution_form'
  | 'legendary'
  | 'mega_evolution';

/*
 * ========================================
 * BALL CONFIGURATION
 * ========================================
 */

export type PokeballConfig = {
  type: PokeballType;

  displayName: string;

  shardCost: number;

  catchRule: PokeballCatchRule;
};

/*
 * ========================================
 * USER POKÉMON
 * ========================================
 */

export type PokemonSource =
  | 'starter'
  | 'jester_ball'
  | 'poke_ball'
  | 'great_ball'
  | 'ultra_ball'
  | 'master_ball';

export type UserPokemon = {
  id: string;

  profileId: string;

  speciesId: string;

  nickname: string | null;

  xp: number;

  level: number;

  obtainedAt: string;

  source: PokemonSource;

  createdAt: string;
};

/*
 * ========================================
 * TEAM SLOT
 * ========================================
 */

export const MAX_TEAM_SIZE = 3;

export type PokemonTeamSlot = {
  profileId: string;

  slot: number;

  userPokemonId: string;
};

/*
 * ========================================
 * CURRENCY
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
 * INVENTORY
 * ========================================
 */

export type PokemonInventoryItem = {
  profileId: string;

  ballType: PokeballType;

  count: number;
};

/*
 * ========================================
 * STARTER STATE
 * ========================================
 */

export type PokemonStarterState = {
  profileId: string;

  starterSelected: boolean;

  starterSpeciesId: string | null;

  selectedAt: string | null;
};

/*
 * ========================================
 * ACHIEVEMENTS
 * ========================================
 *
 * Definitions are static data
 * (data/pokemonAchievements.ts).
 *
 * Only the fact that an achievement was
 * unlocked is stored in SQLite.
 *
 * requirementType + targetValue determine
 * how the achievement is evaluated.
 *
 * ========================================
 */

export type PokemonAchievementRequirementType =
  /*
   * Existing achievement requirements
   */

  | 'longest_streak_days'
  | 'pokedex_percent'
  | 'pokemon_max_level'
  | 'total_pokemon_caught'

  /*
   * Gym Badge requirements
   */

  | 'pokemon_level_100_percent'
  | 'total_workouts'
  | 'perfect_nutrition_days'
  | 'ten_k_steps_days'
  | 'running_distance_km'
  | 'gym_badges_earned';

export type PokemonAchievementDefinition = {
  id: string;

  name: string;

  description: string;

  requirementType: PokemonAchievementRequirementType;

  targetValue: number;

  rewardShards: number;

  /*
   * If set, unlocking this achievement
   * also grants this Gym Badge.
   */
  rewardBadgeId?: string;
};

export type UserPokemonAchievement = {
  profileId: string;

  achievementId: string;

  unlockedAt: string;
};

/*
 * ========================================
 * GYM BADGES
 * ========================================
 *
 * Grouped into badge families.
 *
 * Each family has:
 *
 *   NORMAL
 *   GOLD
 *
 * Example:
 *
 * badge_01
 * badge_01_gold
 *
 * The badge is earned automatically when
 * its linked achievement is unlocked.
 *
 * ========================================
 */

export type PokemonGymBadgeDefinition = {
  id: string;

  name: string;

  region: string;

  description: string;

  iconAssetId: string;
};

export type UserGymBadge = {
  profileId: string;

  badgeId: string;

  earnedAt: string;
};