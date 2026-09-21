import type {
  GymBadgeDefinition,
  GymBadgeRegion,
} from '../types/pokemonGymBadge';

/*
 * ========================================
 * GYMATE GYM BADGES
 * ========================================
 *
 * Exactly 8 badge families.
 *
 * Each family has:
 *
 *   1 NORMAL
 *   1 GOLD
 *
 * Total:
 *
 *   16 badge definitions
 *
 * Profile:
 *
 *   GOLD > NORMAL > LOCKED
 * ========================================
 */

export const pokemonGymBadges:
  GymBadgeDefinition[] = [

  /*
   * ======================================
   * BADGE 01 — POKÉDEX MASTER
   * ======================================
   */

  {
    id: 'badge_01',
    familyId: 'badge_01',

    name: 'Pokédex Master',

    region: 'Johto',

    description:
      'Own at least 50% of all Pokémon species.',

    variant: 'normal',

    achievementId:
      'badge-01-pokedex-master',

    assetId:
      'badge_01',
  },

  {
    id: 'badge_01_gold',
    familyId: 'badge_01',

    name: 'Pokédex Master',

    region: 'Johto',

    description:
      'Own every Pokémon species in the Gymate Pokédex.',

    variant: 'gold',

    achievementId:
      'badge-01-pokedex-master-gold',

    assetId:
      'badge_01_gold',
  },

  /*
   * ======================================
   * BADGE 02 — POKÉMON TRAINER
   * ======================================
   */

  {
    id: 'badge_02',
    familyId: 'badge_02',

    name: 'Pokémon Trainer',

    region: 'Johto',

    description:
      'Train at least 50% of all Pokémon species to level 100.',

    variant: 'normal',

    achievementId:
      'badge-02-pokemon-trainer',

    assetId:
      'badge_02',
  },

  {
    id: 'badge_02_gold',
    familyId: 'badge_02',

    name: 'Pokémon Trainer',

    region: 'Johto',

    description:
      'Train every Pokémon species to level 100.',

    variant: 'gold',

    achievementId:
      'badge-02-pokemon-trainer-gold',

    assetId:
      'badge_02_gold',
  },

  /*
   * ======================================
   * BADGE 03 — UNBREAKABLE
   * ======================================
   */

  {
    id: 'badge_03',
    familyId: 'badge_03',

    name: 'Unbreakable',

    region: 'Johto',

    description:
      'Maintain a 100-day fitness activity streak.',

    variant: 'normal',

    achievementId:
      'badge-03-unbreakable',

    assetId:
      'badge_03',
  },

  {
    id: 'badge_03_gold',
    familyId: 'badge_03',

    name: 'Unbreakable',

    region: 'Johto',

    description:
      'Maintain a 365-day fitness activity streak.',

    variant: 'gold',

    achievementId:
      'badge-03-unbreakable-gold',

    assetId:
      'badge_03_gold',
  },

  /*
   * ======================================
   * BADGE 04 — IRON CHAMPION
   * ======================================
   */

  {
    id: 'badge_04',
    familyId: 'badge_04',

    name: 'Iron Champion',

    region: 'Johto',

    description:
      'Complete 500 workouts.',

    variant: 'normal',

    achievementId:
      'badge-04-iron-champion',

    assetId:
      'badge_04',
  },

  {
    id: 'badge_04_gold',
    familyId: 'badge_04',

    name: 'Iron Champion',

    region: 'Johto',

    description:
      'Complete 1,000 workouts.',

    variant: 'gold',

    achievementId:
      'badge-04-iron-champion-gold',

    assetId:
      'badge_04_gold',
  },

  /*
   * ======================================
   * BADGE 05 — PERFECT NUTRITION
   * ======================================
   */

  {
    id: 'badge_05',
    familyId: 'badge_05',

    name: 'Perfect Nutrition',

    region: 'Johto',

    description:
      'Complete 180 perfect diet days.',

    variant: 'normal',

    achievementId:
      'badge-05-perfect-nutrition',

    assetId:
      'badge_05',
  },

  {
    id: 'badge_05_gold',
    familyId: 'badge_05',

    name: 'Perfect Nutrition',

    region: 'Johto',

    description:
      'Complete 365 perfect diet days.',

    variant: 'gold',

    achievementId:
      'badge-05-perfect-nutrition-gold',

    assetId:
      'badge_05_gold',
  },

  /*
   * ======================================
   * BADGE 06 — WALKING LEGEND
   * ======================================
   */

  {
    id: 'badge_06',
    familyId: 'badge_06',

    name: 'Walking Legend',

    region: 'Johto',

    description:
      'Complete 250 days with at least 10,000 steps.',

    variant: 'normal',

    achievementId:
      'badge-06-walking-legend',

    assetId:
      'badge_06',
  },

  {
    id: 'badge_06_gold',
    familyId: 'badge_06',

    name: 'Walking Legend',

    region: 'Johto',

    description:
      'Complete 1,000 days with at least 10,000 steps.',

    variant: 'gold',

    achievementId:
      'badge-06-walking-legend-gold',

    assetId:
      'badge_06_gold',
  },

  /*
   * ======================================
   * BADGE 07 — ROAD WARRIOR
   * ======================================
   */

  {
    id: 'badge_07',
    familyId: 'badge_07',

    name: 'Road Warrior',

    region: 'Johto',

    description:
      'Run a total distance of 1,000 kilometers.',

    variant: 'normal',

    achievementId:
      'badge-07-road-warrior',

    assetId:
      'badge_07',
  },

  {
    id: 'badge_07_gold',
    familyId: 'badge_07',

    name: 'Road Warrior',

    region: 'Johto',

    description:
      'Run a total distance of 5,000 kilometers.',

    variant: 'gold',

    achievementId:
      'badge-07-road-warrior-gold',

    assetId:
      'badge_07_gold',
  },

  /*
   * ======================================
   * BADGE 08 — GYMATE COMPLETIONIST
   * ======================================
   */

  {
    id: 'badge_08',
    familyId: 'badge_08',

    name: 'Gymate Completionist',

    region: 'Johto',

    description:
      'Earn 5 of the other Gymate Gym Badges.',

    variant: 'normal',

    achievementId:
      'badge-08-gymate-completionist',

    assetId:
      'badge_08',
  },

  {
    id: 'badge_08_gold',
    familyId: 'badge_08',

    name: 'Gymate Completionist',

    region: 'Johto',

    description:
      'Earn all 8 Gymate Gym Badges.',

    variant: 'gold',

    achievementId:
      'badge-08-gymate-completionist-gold',

    assetId:
      'badge_08_gold',
  },
];

/*
 * ========================================
 * GET ALL BADGES
 * ========================================
 */

export function getAllGymBadges():
  GymBadgeDefinition[] {

  return pokemonGymBadges;
}

/*
 * ========================================
 * GET BADGE BY ID
 * ========================================
 */

export function getGymBadgeById(
  badgeId: string
): GymBadgeDefinition | null {

  return (
    pokemonGymBadges.find(
      (badge) =>
        badge.id === badgeId
    ) ?? null
  );
}

/*
 * ========================================
 * GET BADGES BY REGION
 * ========================================
 */

export function getGymBadgesByRegion(
  region: GymBadgeRegion
): GymBadgeDefinition[] {

  return pokemonGymBadges.filter(
    (badge) =>
      badge.region === region
  );
}

/*
 * ========================================
 * GET ALL REGIONS
 * ========================================
 */

export function getAllRegions():
  GymBadgeRegion[] {

  return Array.from(
    new Set(
      pokemonGymBadges.map(
        (badge) =>
          badge.region
      )
    )
  );
}