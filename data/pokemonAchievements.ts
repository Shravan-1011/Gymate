import { PokemonAchievementDefinition } from '../types/pokemon';

/*
 * ========================================
 * POKÉMON ACHIEVEMENTS
 * ========================================
 *
 * Static achievement definitions.
 *
 * This file contains:
 *
 * 1. Normal Pokémon achievements
 * 2. The 16 elite Gym Badge achievements
 *
 * Gym Badge achievements:
 *
 *   8 badge families
 *   ×
 *   Normal + Gold
 *
 * = 16 achievement definitions
 *
 * Only the fact that an achievement was
 * unlocked is stored in SQLite.
 *
 * ========================================
 */

export const pokemonAchievements: PokemonAchievementDefinition[] = [

  /*
   * ======================================
   * NORMAL POKÉMON ACHIEVEMENTS
   * ======================================
   */

  {
    id: 'streak-100-days',
    name: '100 Day Streak',
    description:
      'Maintain a fitness activity streak for 100 days.',
    requirementType: 'longest_streak_days',
    targetValue: 100,
    rewardShards: 20,
  },

  {
    id: 'pokedex-complete',
    name: 'Gotta Catch ’Em All',
    description:
      'Own every catchable Pokémon species.',
    requirementType: 'pokedex_percent',
    targetValue: 100,
    rewardShards: 25,
  },

  {
    id: 'pokemon-max-level',
    name: 'Peak Condition',
    description:
      'Train a Pokémon all the way to level 100.',
    requirementType: 'pokemon_max_level',
    targetValue: 100,
    rewardShards: 15,
  },

  {
    id: 'streak-7-days',
    name: 'One Week Strong',
    description:
      'Maintain a fitness activity streak for 7 days.',
    requirementType: 'longest_streak_days',
    targetValue: 7,
    rewardShards: 5,
  },

  {
    id: 'first-ten-pokemon',
    name: 'Growing Collection',
    description:
      'Own 10 Pokémon.',
    requirementType: 'total_pokemon_caught',
    targetValue: 10,
    rewardShards: 10,
  },

  /*
   * ======================================
   * GYM BADGE #1
   * POKÉDEX MASTER
   * ======================================
   *
   * 721 total species.
   *
   * 50% = 360.5
   * Rounded up = 361 species.
   */

  {
    id: 'badge-01-pokedex-master',
    name: 'Pokédex Master',
    description:
      'Own at least 50% of all Pokémon species.',
    requirementType: 'pokedex_percent',
    targetValue: 50,
    rewardShards: 0,
    rewardBadgeId: 'badge_01',
  },

  {
    id: 'badge-01-pokedex-master-gold',
    name: 'Pokédex Master — Gold',
    description:
      'Own every Pokémon species in the Gymate Pokédex.',
    requirementType: 'pokedex_percent',
    targetValue: 100,
    rewardShards: 0,
    rewardBadgeId: 'badge_01_gold',
  },

  /*
   * ======================================
   * GYM BADGE #2
   * POKÉMON TRAINER
   * ======================================
   *
   * 721 total species.
   *
   * 50% = 360.5
   * Rounded up = 361 species.
   *
   * The requirement means 361 DISTINCT
   * Pokémon species must individually
   * reach level 100.
   */

  {
    id: 'badge-02-pokemon-trainer',
    name: 'Pokémon Trainer',
    description:
      'Train at least 50% of all Pokémon species to level 100.',
    requirementType: 'pokemon_level_100_percent',
    targetValue: 50,
    rewardShards: 0,
    rewardBadgeId: 'badge_02',
  },

  {
    id: 'badge-02-pokemon-trainer-gold',
    name: 'Pokémon Trainer — Gold',
    description:
      'Train every Pokémon species to level 100.',
    requirementType: 'pokemon_level_100_percent',
    targetValue: 100,
    rewardShards: 0,
    rewardBadgeId: 'badge_02_gold',
  },

  /*
   * ======================================
   * GYM BADGE #3
   * UNBREAKABLE
   * ======================================
   */

  {
    id: 'badge-03-unbreakable',
    name: 'Unbreakable',
    description:
      'Maintain a 100-day fitness activity streak.',
    requirementType: 'longest_streak_days',
    targetValue: 100,
    rewardShards: 0,
    rewardBadgeId: 'badge_03',
  },

  {
    id: 'badge-03-unbreakable-gold',
    name: 'Unbreakable — Gold',
    description:
      'Maintain a 365-day fitness activity streak.',
    requirementType: 'longest_streak_days',
    targetValue: 365,
    rewardShards: 0,
    rewardBadgeId: 'badge_03_gold',
  },

  /*
   * ======================================
   * GYM BADGE #4
   * IRON CHAMPION
   * ======================================
   */

  {
    id: 'badge-04-iron-champion',
    name: 'Iron Champion',
    description:
      'Complete 500 workouts.',
    requirementType: 'total_workouts',
    targetValue: 500,
    rewardShards: 0,
    rewardBadgeId: 'badge_04',
  },

  {
    id: 'badge-04-iron-champion-gold',
    name: 'Iron Champion — Gold',
    description:
      'Complete 1,000 workouts.',
    requirementType: 'total_workouts',
    targetValue: 1000,
    rewardShards: 0,
    rewardBadgeId: 'badge_04_gold',
  },

  /*
   * ======================================
   * GYM BADGE #5
   * PERFECT NUTRITION
   * ======================================
   */

  {
    id: 'badge-05-perfect-nutrition',
    name: 'Perfect Nutrition',
    description:
      'Complete 180 perfect diet days.',
    requirementType: 'perfect_nutrition_days',
    targetValue: 180,
    rewardShards: 0,
    rewardBadgeId: 'badge_05',
  },

  {
    id: 'badge-05-perfect-nutrition-gold',
    name: 'Perfect Nutrition — Gold',
    description:
      'Complete 365 perfect diet days.',
    requirementType: 'perfect_nutrition_days',
    targetValue: 365,
    rewardShards: 0,
    rewardBadgeId: 'badge_05_gold',
  },

  /*
   * ======================================
   * GYM BADGE #6
   * WALKING LEGEND
   * ======================================
   */

  {
    id: 'badge-06-walking-legend',
    name: 'Walking Legend',
    description:
      'Complete 250 days with at least 10,000 steps.',
    requirementType: 'ten_k_steps_days',
    targetValue: 250,
    rewardShards: 0,
    rewardBadgeId: 'badge_06',
  },

  {
    id: 'badge-06-walking-legend-gold',
    name: 'Walking Legend — Gold',
    description:
      'Complete 1,000 days with at least 10,000 steps.',
    requirementType: 'ten_k_steps_days',
    targetValue: 1000,
    rewardShards: 0,
    rewardBadgeId: 'badge_06_gold',
  },

  /*
   * ======================================
   * GYM BADGE #7
   * ROAD WARRIOR
   * ======================================
   */

  {
    id: 'badge-07-road-warrior',
    name: 'Road Warrior',
    description:
      'Run a total distance of 1,000 kilometers.',
    requirementType: 'running_distance_km',
    targetValue: 1000,
    rewardShards: 0,
    rewardBadgeId: 'badge_07',
  },

  {
    id: 'badge-07-road-warrior-gold',
    name: 'Road Warrior — Gold',
    description:
      'Run a total distance of 5,000 kilometers.',
    requirementType: 'running_distance_km',
    targetValue: 5000,
    rewardShards: 0,
    rewardBadgeId: 'badge_07_gold',
  },

  /*
   * ======================================
   * GYM BADGE #8
   * GYMATE COMPLETIONIST
   * ======================================
   *
   * IMPORTANT:
   *
   * The Gold requirement is conceptually
   * "all 8 badges".
   *
   * The evaluator will handle this as a
   * special case so the badge cannot depend
   * on itself being earned first.
   */

  {
    id: 'badge-08-gymate-completionist',
    name: 'Gymate Completionist',
    description:
      'Earn 5 of the other Gymate Gym Badges.',
    requirementType: 'gym_badges_earned',
    targetValue: 5,
    rewardShards: 0,
    rewardBadgeId: 'badge_08',
  },

  {
    id: 'badge-08-gymate-completionist-gold',
    name: 'Gymate Completionist — Gold',
    description:
      'Earn all 8 Gymate Gym Badges.',
    requirementType: 'gym_badges_earned',
    targetValue: 8,
    rewardShards: 0,
    rewardBadgeId: 'badge_08_gold',
  },
];

/*
 * ========================================
 * ACHIEVEMENT LOOKUP
 * ========================================
 */

const achievementById:
  Record<
    string,
    PokemonAchievementDefinition
  > = {};

for (
  const achievement
  of pokemonAchievements
) {
  achievementById[
    achievement.id
  ] = achievement;
}

/*
 * ========================================
 * GET ACHIEVEMENT
 * ========================================
 */

export function getAchievementById(
  achievementId: string
): PokemonAchievementDefinition | null {

  return (
    achievementById[
      achievementId
    ] ?? null
  );
}

/*
 * ========================================
 * GET ALL ACHIEVEMENTS
 * ========================================
 */

export function getAllAchievements():
  PokemonAchievementDefinition[] {

  return pokemonAchievements;
}