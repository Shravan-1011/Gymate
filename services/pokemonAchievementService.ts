import {
  getUnlockedAchievementIds,
  unlockAchievement,
} from '../database/pokemonAchievementRepository';

import {
  grantGymBadge,
  getEarnedGymBadgeIds,
} from '../database/pokemonGymBadgeRepository';

import {
  getUserPokemonForProfile,
} from '../database/userPokemonRepository';

import {
  addPokeballShards,
} from '../database/pokemonCurrencyRepository';

import {
  getOrCreateProgression,
} from '../database/progressionRepository';

import {
  getDatabase,
} from '../database/database';

import {
  getAllPokemonAchievements,
  getPokedexCompletionTotal,
  getAllPokemonGymBadges,
} from './pokemonDataService';

import type {
  PokemonAchievementDefinition,
} from '../types/pokemon';



import type {
  GymBadgeDefinition,
} from '../types/pokemonGymBadge';

import {
  countPokedexEntries,
} from '../database/pokedexRepository'; 

/*
 * ========================================
 * POKÉMON ACHIEVEMENT SERVICE
 * ========================================
 */

/*
 * ========================================
 * RESULT
 * ========================================
 */

export type AchievementEvaluationResult = {
  newlyUnlocked:
    PokemonAchievementDefinition[];

  badgesGranted:
    string[];

  shardsAwarded:
    number;
};

/*
 * ========================================
 * ACHIEVEMENT PROGRESS
 * ========================================
 *
 * current:
 *   Current real-world progress.
 *
 * target:
 *   Target required by this achievement.
 *
 * percentage:
 *   Progress toward THIS achievement's
 *   target, capped at 100.
 *
 * unit:
 *   Used by the UI to format the value.
 * ========================================
 */

export type AchievementProgressUnit =
  | 'pokemon'
  | 'level_100_pokemon'
  | 'days'
  | 'workouts'
  | 'perfect_nutrition_days'
  | 'ten_k_step_days'
  | 'kilometers'
  | 'badges'
  | 'pokemon_owned';

export type AchievementProgress = {
  current: number;

  target: number;

  percentage: number;

  unit: AchievementProgressUnit;
};

/*
 * ========================================
 * PROGRESS PERCENTAGE
 * ========================================
 */

function calculateProgressPercentage(
  current: number,
  target: number
): number {

  if (
    target <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (current / target) * 100
    )
  );
}

/*
 * ========================================
 * GET DISTINCT OWNED SPECIES
 * ========================================
 */

async function getDistinctOwnedSpeciesCount(
  profileId: string
): Promise<number> {

  const owned =
    await getUserPokemonForProfile(
      profileId
    );

  const distinctSpecies =
    new Set<string>();

  for (
    const pokemon
    of owned
  ) {

    if (
      pokemon.speciesId
    ) {

      distinctSpecies.add(
        pokemon.speciesId
      );
    }
  }

  return distinctSpecies.size;
}

/*
 * ========================================
 * GET LEVEL 100 SPECIES COUNT
 * ========================================
 *
 * Counts DISTINCT species currently
 * represented by a level 100 Pokémon.
 * ========================================
 */

async function getLevel100SpeciesCount(
  profileId: string
): Promise<number> {

  const owned =
    await getUserPokemonForProfile(
      profileId
    );

  const level100Species =
    new Set<string>();

  for (
    const pokemon
    of owned
  ) {

    if (
      pokemon.level >= 100 &&
      pokemon.speciesId
    ) {

      level100Species.add(
        pokemon.speciesId
      );
    }
  }

  return level100Species.size;
}

/*
 * ========================================
 * GET COMPLETED WORKOUT COUNT
 * ========================================
 */

async function getCompletedWorkoutCount(
  profileId: string
): Promise<number> {

  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      count: number;
    }>(
      `
        SELECT COUNT(*) AS count

        FROM workout_sessions

        WHERE profile_id = ?

          AND status = 'completed';
      `,
      profileId
    );

  return row?.count ?? 0;
}

/*
 * ========================================
 * GET PERFECT NUTRITION DAY COUNT
 * ========================================
 *
 * Perfect nutrition day:
 *
 * calories >= goal
 * protein >= goal
 * water >= goal
 * ========================================
 */

async function getPerfectNutritionDayCount(
  profileId: string
): Promise<number> {

  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      count: number;
    }>(
      `
        SELECT COUNT(*) AS count

        FROM daily_nutrition dn

        WHERE dn.profile_id = ?

          AND dn.calorie_goal > 0

          AND dn.protein_goal > 0

          AND dn.water_goal > 0

          AND (
            SELECT COALESCE(
              SUM(dnf.calories),
              0
            )
            FROM daily_nutrition_foods dnf
            WHERE dnf.daily_nutrition_id =
              dn.id
          ) >= dn.calorie_goal

          AND (
            SELECT COALESCE(
              SUM(dnf.protein),
              0
            )
            FROM daily_nutrition_foods dnf
            WHERE dnf.daily_nutrition_id =
              dn.id
          ) >= dn.protein_goal

          AND dn.water_consumed >=
              dn.water_goal;
      `,
      profileId
    );

  return row?.count ?? 0;
}

/*
 * ========================================
 * GET 10K STEP DAY COUNT
 * ========================================
 */

async function getTenKStepDayCount(
  profileId: string
): Promise<number> {

  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      count: number;
    }>(
      `
        SELECT COUNT(*) AS count

        FROM daily_activity_steps

        WHERE profile_id = ?

          AND step_count >= 10000;
      `,
      profileId
    );

  return row?.count ?? 0;
}

/*
 * ========================================
 * GET RUNNING DISTANCE
 * ========================================
 *
 * Database:
 *   meters
 *
 * Achievement:
 *   kilometers
 * ========================================
 */

async function getRunningDistanceKm(
  profileId: string
): Promise<number> {

  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      distanceMeters:
        number | null;
    }>(
      `
        SELECT
          COALESCE(
            SUM(distance_meters),
            0
          ) AS distanceMeters

        FROM running_sessions

        WHERE profile_id = ?

          AND status = 'completed';
      `,
      profileId
    );

  const distanceMeters =
    row?.distanceMeters ?? 0;

  return distanceMeters / 1000;
}

/*
 * ========================================
 * GET EARNED BADGE FAMILY COUNT
 * ========================================
 *
 * Normal + Gold of the same family count
 * as ONE badge family.
 *
 * Example:
 *
 * badge_01
 * badge_01_gold
 *
 * = 1 family
 *
 * IMPORTANT:
 *
 * badge_08 / Completionist is excluded
 * because it cannot count itself toward
 * its own requirement.
 * ========================================
 */

async function getEarnedBadgeFamilyCount(
  profileId: string
): Promise<number> {

  const earnedIds =
    await getEarnedGymBadgeIds(
      profileId
    );

  const earnedSet =
    new Set(
      earnedIds
    );

  const allBadges =
    getAllPokemonGymBadges();

  const earnedFamilies =
    new Set<string>();

  for (
    const badge
    of allBadges
  ) {

    /*
     * Completionist must not count
     * toward its own requirement.
     */

    if (
      badge.familyId ===
      'badge_08'
    ) {
      continue;
    }

    if (
      earnedSet.has(
        badge.id
      )
    ) {

      earnedFamilies.add(
        badge.familyId
      );
    }
  }

  return earnedFamilies.size;
}

/*
 * ========================================
 * GET TOTAL EARNED BADGE FAMILIES
 * ========================================
 *
 * Used only for displaying Completionist
 * Gold progress after Badge #8 itself
 * has been earned.
 *
 * Unlike getEarnedBadgeFamilyCount(),
 * this includes badge_08.
 * ========================================
 */

async function getTotalEarnedBadgeFamilyCount(
  profileId: string
): Promise<number> {

  const earnedIds =
    await getEarnedGymBadgeIds(
      profileId
    );

  const earnedSet =
    new Set(
      earnedIds
    );

  const allBadges =
    getAllPokemonGymBadges();

  const earnedFamilies =
    new Set<string>();

  for (
    const badge
    of allBadges
  ) {

    if (
      earnedSet.has(
        badge.id
      )
    ) {

      earnedFamilies.add(
        badge.familyId
      );
    }
  }

  return earnedFamilies.size;
}

/*
 * ========================================
 * GET ACHIEVEMENT PROGRESS
 * ========================================
 */

export async function getAchievementProgress(
  profileId: string,
  achievement:
    PokemonAchievementDefinition
): Promise<AchievementProgress> {

  let current = 0;

  let unit:
    AchievementProgressUnit =
      'days';

  switch (
    achievement.requirementType
  ) {

    /*
     * ====================================
     * STREAK
     * ====================================
     */

    case 'longest_streak_days': {

      const progression =
        await getOrCreateProgression(
          profileId
        );

      current =
        progression.longestStreak;

      unit =
        'days';

      break;
    }

    /*
     * ====================================
     * POKÉDEX
     * ====================================
     */

    case 'pokedex_percent': {
  const pokedexCount =
    await countPokedexEntries(
      profileId
    );

  const target =
    Math.ceil(
      (721 * achievement.targetValue) / 100
    );

  return {
    current: pokedexCount,
    target,
    percentage:
      calculateProgressPercentage(
        pokedexCount,
        target
      ),
    unit: 'pokemon',
  };
}

    /*
     * ====================================
     * EXISTING MAX LEVEL ACHIEVEMENT
     * ====================================
     */

    case 'pokemon_max_level': {

      const owned =
        await getUserPokemonForProfile(
          profileId
        );

      current =
        owned.some(
          (pokemon) =>
            pokemon.level >=
            achievement.targetValue
        )
          ? 1
          : 0;

      unit =
        'pokemon_owned';

      return {
        current,

        target: 1,

        percentage:
          current > 0
            ? 100
            : 0,

        unit,
      };
    }

    /*
     * ====================================
     * TOTAL POKÉMON
     * ====================================
     */

    case 'total_pokemon_caught': {

      const owned =
        await getUserPokemonForProfile(
          profileId
        );

      current =
        owned.length;

      unit =
        'pokemon_owned';

      break;
    }

    /*
     * ====================================
     * LEVEL 100 SPECIES
     * ====================================
     */

    case 'pokemon_level_100_percent': {

      current =
        await getLevel100SpeciesCount(
          profileId
        );

      unit =
        'level_100_pokemon';

      const total =
        getPokedexCompletionTotal();

      const target =
        Math.ceil(
          total *
          (achievement.targetValue / 100)
        );

      return {
        current,

        target,

        percentage:
          calculateProgressPercentage(
            current,
            target
          ),

        unit,
      };
    }

    /*
     * ====================================
     * WORKOUTS
     * ====================================
     */

    case 'total_workouts': {

      current =
        await getCompletedWorkoutCount(
          profileId
        );

      unit =
        'workouts';

      break;
    }

    /*
     * ====================================
     * PERFECT NUTRITION
     * ====================================
     */

    case 'perfect_nutrition_days': {

      current =
        await getPerfectNutritionDayCount(
          profileId
        );

      unit =
        'perfect_nutrition_days';

      break;
    }

    /*
     * ====================================
     * 10K STEPS
     * ====================================
     */

    case 'ten_k_steps_days': {

      current =
        await getTenKStepDayCount(
          profileId
        );

      unit =
        'ten_k_step_days';

      break;
    }

    /*
     * ====================================
     * RUNNING
     * ====================================
     */

    case 'running_distance_km': {

      current =
        await getRunningDistanceKm(
          profileId
        );

      unit =
        'kilometers';

      break;
    }

    /*
     * ====================================
     * GYM BADGES
     * ====================================
     */

    case 'gym_badges_earned': {

      unit =
        'badges';

      /*
       * ==================================
       * COMPLETIONIST GOLD
       * ==================================
       *
       * Gold is displayed as:
       *
       * 7 / 8
       *
       * until Normal Completionist is
       * earned.
       *
       * Once Normal Completionist exists:
       *
       * 8 / 8
       *
       * This makes the UI represent the
       * actual 8-badge goal.
       */

      const isCompletionistGold =
        achievement.id ===
        'badge-08-gymate-completionist-gold';

      if (
        isCompletionistGold
      ) {

        current =
          await getTotalEarnedBadgeFamilyCount(
            profileId
          );

        /*
         * The displayed target is
         * always the complete 8 badges.
         */

        const target = 8;

        return {
          current: Math.min(
            current,
            target
          ),

          target,

          percentage:
            calculateProgressPercentage(
              current,
              target
            ),

          unit,
        };
      }

      /*
       * Normal Completionist uses
       * its configured target:
       *
       * 5 / 5
       */

      current =
        await getEarnedBadgeFamilyCount(
          profileId
        );

      break;
    }

    /*
     * ====================================
     * FALLBACK
     * ====================================
     */

    default: {

      current = 0;

      unit =
        'days';

      break;
    }
  }

  return {
    current,

    target:
      achievement.targetValue,

    percentage:
      calculateProgressPercentage(
        current,
        achievement.targetValue
      ),

    unit,
  };
}

/*
 * ========================================
 * CHECK REQUIREMENT
 * ========================================
 */

async function meetsRequirement(
  profileId: string,
  achievement:
    PokemonAchievementDefinition
): Promise<boolean> {

  /*
   * ====================================
   * GYMATE COMPLETIONIST GOLD
   * ====================================
   *
   * Badge #8 cannot require itself.
   *
   * Therefore Gold requires all OTHER
   * seven badge families.
   *
   * Once those seven are earned:
   *
   *   1. Normal Completionist unlocks.
   *   2. Badge #8 now exists.
   *   3. Gold Completionist unlocks.
   *
   * Final state:
   *
   *   8 / 8 badge families
   * ====================================
   */

  if (
    achievement.requirementType ===
      'gym_badges_earned' &&
    achievement.id ===
      'badge-08-gymate-completionist-gold'
  ) {

    const otherBadgeFamilies =
      await getEarnedBadgeFamilyCount(
        profileId
      );

    return (
      otherBadgeFamilies >= 7
    );
  }

  const progress =
    await getAchievementProgress(
      profileId,
      achievement
    );

  return (
    progress.current >=
    progress.target
  );
}

/*
 * ========================================
 * EVALUATE ACHIEVEMENTS
 * ========================================
 */

export async function evaluateAchievements(
  profileId: string
): Promise<AchievementEvaluationResult> {

  const alreadyUnlocked =
    new Set(
      await getUnlockedAchievementIds(
        profileId
      )
    );

  const candidates =
    getAllPokemonAchievements()
      .filter(
        (achievement) =>
          !alreadyUnlocked.has(
            achievement.id
          )
      );

  const newlyUnlocked:
    PokemonAchievementDefinition[] =
      [];

  const badgesGranted:
    string[] =
      [];

  let shardsAwarded = 0;

  for (
    const achievement
    of candidates
  ) {

    const met =
      await meetsRequirement(
        profileId,
        achievement
      );

    if (
      !met
    ) {
      continue;
    }

    const unlocked =
      await unlockAchievement(
        profileId,
        achievement.id
      );

    if (
      !unlocked
    ) {
      continue;
    }

    console.log(
      '[POKEMON] Achievement unlocked',
      profileId,
      achievement.id
    );

    newlyUnlocked.push(
      achievement
    );

    /*
     * ====================================
     * SHARDS
     * ====================================
     */

    if (
      achievement.rewardShards > 0
    ) {

      await addPokeballShards(
        profileId,
        achievement.rewardShards
      );

      shardsAwarded +=
        achievement.rewardShards;
    }

    /*
     * ====================================
     * BADGE
     * ====================================
     */

    if (
      achievement.rewardBadgeId
    ) {

      const granted =
        await grantGymBadge(
          profileId,
          achievement.rewardBadgeId
        );

      if (
        granted
      ) {

        console.log(
          '[POKEMON] Gym badge granted',
          profileId,
          achievement.rewardBadgeId
        );

        badgesGranted.push(
          achievement.rewardBadgeId
        );
      }
    }
  }

  return {
    newlyUnlocked,

    badgesGranted,

    shardsAwarded,
  };
}

/*
 * ========================================
 * SAFE EVALUATE
 * ========================================
 */

export async function safelyEvaluateAchievements(
  profileId: string
): Promise<void> {

  try {

    await evaluateAchievements(
      profileId
    );

  } catch (
    error
  ) {

    console.error(
      '[POKEMON] Failed to evaluate achievements:',
      error
    );
  }
}

/*
 * ========================================
 * PROFILE ACHIEVEMENT STATUS
 * ========================================
 */

export type ProfileAchievementStatus = {
  achievement:
    PokemonAchievementDefinition;

  unlocked: boolean;

  progress:
    AchievementProgress;
};

export async function getProfileAchievementStatus(
  profileId: string
): Promise<
  ProfileAchievementStatus[]
> {

  const unlockedIds =
    new Set(
      await getUnlockedAchievementIds(
        profileId
      )
    );

  const achievements =
    getAllPokemonAchievements();

  const statuses:
    ProfileAchievementStatus[] =
      [];

  for (
    const achievement
    of achievements
  ) {

    const progress =
      await getAchievementProgress(
        profileId,
        achievement
      );

    statuses.push({
      achievement,

      unlocked:
        unlockedIds.has(
          achievement.id
        ),

      progress,
    });
  }

  return statuses;
}

/*
 * ========================================
 * PROFILE GYM BADGE STATUS
 * ========================================
 */

export type ProfileGymBadgeStatus = {
  badge:
    GymBadgeDefinition;

  earned: boolean;
};

export async function getProfileGymBadgeStatus(
  profileId: string
): Promise<
  ProfileGymBadgeStatus[]
> {

  const earnedIds =
    new Set(
      await getEarnedGymBadgeIds(
        profileId
      )
    );

  return getAllPokemonGymBadges()
    .map(
      (badge) => ({
        badge,

        earned:
          earnedIds.has(
            badge.id
          ),
      })
    );
}

/*
 * ========================================
 * PROFILE DISPLAY BADGES
 * ========================================
 */

export type ProfileDisplayGymBadge = {
  badge:
    GymBadgeDefinition;

  earned: boolean;

  displayVariant:
    | 'locked'
    | 'normal'
    | 'gold';
};

/*
 * ========================================
 * GET PROFILE DISPLAY BADGES
 * ========================================
 */

export async function getProfileDisplayGymBadges(
  profileId: string
): Promise<
  ProfileDisplayGymBadge[]
> {

  const earnedIds =
    new Set(
      await getEarnedGymBadgeIds(
        profileId
      )
    );

  const allBadges =
    getAllPokemonGymBadges();

  const families =
    new Map<
      string,
      GymBadgeDefinition[]
    >();

  for (
    const badge
    of allBadges
  ) {

    const existing =
      families.get(
        badge.familyId
      ) ?? [];

    existing.push(
      badge
    );

    families.set(
      badge.familyId,
      existing
    );
  }

  const result:
    ProfileDisplayGymBadge[] =
      [];

  for (
    const [, familyBadges]
    of families
  ) {

    const goldBadge =
      familyBadges.find(
        (
          badge:
            GymBadgeDefinition
        ) =>
          badge.variant ===
          'gold'
      );

    const normalBadge =
      familyBadges.find(
        (
          badge:
            GymBadgeDefinition
        ) =>
          badge.variant ===
          'normal'
      );

    /*
     * ====================================
     * GOLD
     * ====================================
     */

    if (
      goldBadge &&
      earnedIds.has(
        goldBadge.id
      )
    ) {

      result.push({
        badge:
          goldBadge,

        earned:
          true,

        displayVariant:
          'gold',
      });

      continue;
    }

    /*
     * ====================================
     * NORMAL
     * ====================================
     */

    if (
      normalBadge &&
      earnedIds.has(
        normalBadge.id
      )
    ) {

      result.push({
        badge:
          normalBadge,

        earned:
          true,

        displayVariant:
          'normal',
      });

      continue;
    }

    /*
     * ====================================
     * LOCKED
     * ====================================
     */

    if (
      normalBadge
    ) {

      result.push({
        badge:
          normalBadge,

        earned:
          false,

        displayVariant:
          'locked',
      });
    }
  }

  /*
   * ====================================
   * NUMERICAL FAMILY ORDER
   * ====================================
   */

  result.sort(
    (
      a:
        ProfileDisplayGymBadge,
      b:
        ProfileDisplayGymBadge
    ) => {

      const aNumber =
        Number(
          a.badge.id.match(
            /\d+/
          )?.[0] ?? 0
        );

      const bNumber =
        Number(
          b.badge.id.match(
            /\d+/
          )?.[0] ?? 0
        );

      return (
        aNumber -
        bNumber
      );
    }
  );

  return result;
}