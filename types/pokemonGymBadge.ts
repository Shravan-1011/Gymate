/*
 * ========================================
 * GYMATE GYM BADGE TYPES
 * ========================================
 *
 * 8 badge families.
 *
 * Every family has:
 *
 *   NORMAL
 *   GOLD
 *
 * GOLD replaces NORMAL on the Profile
 * once it is unlocked.
 * ========================================
 */

export type GymBadgeVariant =
  | 'normal'
  | 'gold';

export type GymBadgeDisplayState =
  | 'locked'
  | 'normal'
  | 'gold';

export type GymBadgeRegion = string;

export type GymBadgeDefinition = {
  /*
   * Unique badge ID.
   *
   * Examples:
   *
   * badge_01
   * badge_01_gold
   */

  id: string;

  /*
   * Shared family ID.
   *
   * badge_01
   * badge_01_gold
   *
   * both belong to:
   *
   * badge_01
   */

  familyId: string;

  /*
   * Display name.
   */

  name: string;

  /*
   * Region/category used by
   * the existing Gym Badges screen.
   */

  region: GymBadgeRegion;

  /*
   * Description used by the
   * existing Gym Badges screen.
   */

  description: string;

  /*
   * Normal / Gold.
   */

  variant: GymBadgeVariant;

  /*
   * Achievement that unlocks
   * this specific badge variant.
   */

  achievementId: string;

  /*
   * Image asset ID.
   */

  assetId: string;
};