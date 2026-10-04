import {
  getOrCreateProgression,
  updateProgression,
  getXPProgress,
  markDayActive,
  type ProfileProgression,
} from '../database/progressionRepository';

import {
  createXPTransaction,
  findXPTransaction,
} from '../database/xpRepository';

import {
  getTrainerProgression,
  type TrainerProgression,
} from '../utils/progression';

import {
  grantShardsForLevelUp,
} from './pokeballShardService';

import {
  distributeTeamXPShare,
} from './pokemonProgressionService';

import {
  grantStreakMilestoneShards,
} from './pokemonStreakShardService';

import {
  safelyEvaluateAchievements,
} from './pokemonAchievementService';

/*
 * ========================================
 * RE-EXPORT PROGRESSION HELPERS
 * ========================================
 */

export {
  getOrCreateProgression,
  updateProgression,
  getXPProgress,
  markDayActive,
};

export type {
  ProfileProgression,
};

/*
 * ========================================
 * XP REWARDS
 * ========================================
 */

export const XP_REWARDS = {
  WORKOUT_COMPLETED: 100,

  NUTRITION_COMPLETED: 100,

  RUNNING_COMPLETED: 100,

  STEPS_10K_COMPLETED: 100,

  TODO_3_COMPLETED: 50,

  TODO_5_COMPLETED: 100,

  DAILY_STREAK_MAX: 100,
} as const;

/*
 * ========================================
 * XP SOURCES
 * ========================================
 */

export const XP_REASONS = {
  WORKOUT_COMPLETED:
    'WORKOUT_COMPLETED',

  NUTRITION_COMPLETED:
    'NUTRITION_COMPLETED',

  RUNNING_COMPLETED:
    'RUNNING_COMPLETED',

  STEPS_10K_COMPLETED:
    'STEPS_10K_COMPLETED',

  TODO_COMPLETED:
    'TODO_COMPLETED',

  DAILY_STREAK:
    'DAILY_STREAK',
} as const;

/*
 * ========================================
 * XP AWARD RESULT
 * ========================================
 */

export type XPAwardResult = {
  profileId: string;

  xpAwarded: number;

  previousXP: number;

  totalXP: number;

  previousLevel: number;

  currentLevel: number;

  didLevelUp: boolean;

  alreadyAwarded: boolean;

  progression: TrainerProgression;

  databaseProgression:
    ProfileProgression;
};

/*
 * ========================================
 * DATE HELPER
 * ========================================
 */

function getTodayDate(): string {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      now.getDate()
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/*
 * ========================================
 * DAILY STREAK XP
 * ========================================
 */

function getDailyStreakXP(
  streak: number
): number {
  return Math.min(
    streak * 10,
    XP_REWARDS.DAILY_STREAK_MAX
  );
}

/*
 * ========================================
 * GENERIC XP AWARD
 * ========================================
 *
 * IMPORTANT:
 *
 * Repository signature:
 *
 * createXPTransaction(
 *   profileId,
 *   amount,
 *   source,
 *   activityDate,
 *   referenceId
 * )
 *
 * ========================================
 */

export async function awardXP(
  profileId: string,
  amount: number,
  source: string,
  activityDate: string,
  referenceId?:
    | string
    | null
): Promise<XPAwardResult> {
  /*
   * ======================================
   * VALIDATION
   * ======================================
   */

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      'INVALID_XP_AMOUNT'
    );
  }

  if (!source.trim()) {
    throw new Error(
      'XP_SOURCE_REQUIRED'
    );
  }

  if (!activityDate.trim()) {
    throw new Error(
      'XP_ACTIVITY_DATE_REQUIRED'
    );
  }

  /*
   * ======================================
   * CURRENT PROGRESSION
   * ======================================
   */

  const currentProgression =
    await getOrCreateProgression(
      profileId
    );

  const previousXP =
    currentProgression.totalXP;

  const previousLevel =
    getTrainerProgression(
      previousXP
    ).level;

  /*
   * ======================================
   * DUPLICATE PROTECTION
   * ======================================
   */

  if (referenceId) {
    const existingTransaction =
      await findXPTransaction(
        profileId,
        source,
        referenceId
      );

    if (existingTransaction) {
      const progression =
        getTrainerProgression(
          previousXP
        );

      return {
        profileId,

        xpAwarded: 0,

        previousXP,

        totalXP:
          previousXP,

        previousLevel,

        currentLevel:
          progression.level,

        didLevelUp: false,

        alreadyAwarded: true,

        progression,

        databaseProgression:
          currentProgression,
      };
    }
  }

  /*
   * ======================================
   * FINAL XP
   * ======================================
   */

  const xpAwarded =
    Math.floor(amount);

  if (xpAwarded <= 0) {
    throw new Error(
      'XP_AMOUNT_TOO_LOW'
    );
  }

  const newTotalXP =
    previousXP + xpAwarded;

  /*
   * ======================================
   * CREATE XP TRANSACTION
   * ======================================
   *
   * CORRECT ORDER:
   *
   * profileId
   * amount
   * source
   * activityDate
   * referenceId
   *
   * ======================================
   */

  await createXPTransaction(
    profileId,
    xpAwarded,
    source,
    activityDate,
    referenceId ??
      undefined
  );

  /*
   * ======================================
   * UPDATE TOTAL XP
   * ======================================
   */

  const updatedProgression =
    await updateProgression(
      profileId,
      {
        totalXP:
          newTotalXP,
      }
    );

  if (!updatedProgression) {
    throw new Error(
      'FAILED_TO_UPDATE_PROGRESSION'
    );
  }

  /*
   * ======================================
   * TRAINER PROGRESSION
   * ======================================
   */

  const progression =
    getTrainerProgression(
      newTotalXP
    );

  const currentLevel =
    progression.level;

  const didLevelUp =
    currentLevel >
    previousLevel;

  /*
   * ======================================
   * POKÉMON SYSTEM: POKÉBALL SHARDS
   * ======================================
   *
   * The Pokémon system listens to Trainer
   * Level-ups here, the single place every
   * XP source (workout, nutrition,
   * running, steps, todo, streak) already
   * funnels through. It does not know or
   * care which source triggered this.
   *
   * Wrapped defensively: a failure in the
   * Pokémon layer must NEVER break XP
   * awarding, which is the core system
   * this file exists for.
   * ======================================
   */

  if (didLevelUp) {
    try {
      await grantShardsForLevelUp(
        profileId,
        previousLevel,
        currentLevel
      );
    } catch (error) {
      console.error(
        '[POKEMON] Failed to grant shards for level-up:',
        error
      );
    }
  }

  /*
   * ======================================
   * POKÉMON SYSTEM: TEAM XP SHARE
   * ======================================
   *
   * Every Gymate XP award (not just
   * level-ups) is split evenly across
   * the profile's current team. See
   * pokemonProgressionService.ts.
   * ======================================
   */

  try {
    await distributeTeamXPShare(
      profileId,
      xpAwarded
    );
  } catch (error) {
    console.error(
      '[POKEMON] Failed to distribute team XP share:',
      error
    );
  }

  /*
   * ======================================
   * RESULT
   * ======================================
   */

  return {
    profileId,

    xpAwarded,

    previousXP,

    totalXP:
      newTotalXP,

    previousLevel,

    currentLevel,

    didLevelUp,

    alreadyAwarded:
      false,

    progression,

    databaseProgression:
      updatedProgression,
  };
}

/*
 * ========================================
 * WORKOUT XP
 * ========================================
 *
 * BASE:
 * 100 XP
 *
 * POSITIVE:
 * performance × 4
 *
 * NEGATIVE:
 * performance × 1
 *
 * Examples:
 *
 * +25% → 200 XP
 * +10% → 140 XP
 *  +4% → 116 XP
 *   0% → 100 XP
 *  -4% → 96 XP
 * -10% → 90 XP
 * -25% → 75 XP
 * -50% → 50 XP
 * -100% → 0 XP
 *
 * ONLY ONE WORKOUT XP REWARD
 * PER CALENDAR DAY.
 *
 * ========================================
 */

export async function awardWorkoutXP(
  profileId: string,
  workoutId: string,
  performancePercent: number = 0,
  activityDate: string =
    getTodayDate()
): Promise<
  XPAwardResult | null
> {
  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (!workoutId) {
    throw new Error(
      'WORKOUT_ID_REQUIRED'
    );
  }

  if (
    !Number.isFinite(
      performancePercent
    )
  ) {
    throw new Error(
      'INVALID_WORKOUT_PERFORMANCE'
    );
  }

  /*
   * ======================================
   * CALCULATE XP
   * ======================================
   */

  let workoutXP =
    XP_REWARDS.WORKOUT_COMPLETED;

  /*
   * POSITIVE PERFORMANCE
   *
   * +28%
   *
   * 100 + (28 × 4)
   *
   * = 212 XP
   */

  if (
    performancePercent > 0
  ) {
    workoutXP +=
      Math.floor(
        performancePercent
      ) * 4;
  }

  /*
   * NEGATIVE PERFORMANCE
   *
   * -25%
   *
   * 100 + (-25)
   *
   * = 75 XP
   */

  else if (
    performancePercent < 0
  ) {
    workoutXP +=
      Math.ceil(
        performancePercent
      );
  }

  /*
   * ======================================
   * CLAMP
   * ======================================
   */

  const finalXP =
    Math.max(
      0,
      workoutXP
    );

  /*
   * ======================================
   * ZERO XP
   * ======================================
   */

  if (
    finalXP <= 0
  ) {
    return null;
  }

  /*
   * ======================================
   * DAILY REFERENCE
   * ======================================
   */

  const dailyReference = `workout-${activityDate}`;



return awardXP(
  profileId,
  finalXP,
  XP_REASONS.WORKOUT_COMPLETED,
  activityDate,
  dailyReference
);
}

/*
 * ========================================
 * NUTRITION XP
 * ========================================
 */

export async function awardNutritionXP(
  profileId: string,
  nutritionDate: string,
  dietCompleted: boolean,
  proteinCompletionPercent?: number
): Promise<
  XPAwardResult | null
> {
  let nutritionXP: number;

  /*
   * COMPLETE DIET
   */

  if (
    dietCompleted
  ) {
    nutritionXP =
      XP_REWARDS.NUTRITION_COMPLETED;
  }

  /*
   * PARTIAL DIET
   */

  else {
    if (
      proteinCompletionPercent ===
      undefined
    ) {
      throw new Error(
        'PROTEIN_COMPLETION_REQUIRED'
      );
    }

    if (
      !Number.isFinite(
        proteinCompletionPercent
      )
    ) {
      throw new Error(
        'INVALID_PROTEIN_COMPLETION'
      );
    }

    const completion =
      Math.max(
        0,
        Math.min(
          100,
          proteinCompletionPercent
        )
      );

    nutritionXP =
      Math.floor(
        completion
      );
  }

  /*
   * No XP for zero completion.
   */

  if (
    nutritionXP <= 0
  ) {
    return null;
  }

  return awardXP(
    profileId,

    nutritionXP,

    XP_REASONS.NUTRITION_COMPLETED,

    nutritionDate,

    nutritionDate
  );
}

/*
 * ========================================
 * RUNNING XP
 * ========================================
 */

export async function awardRunningXP(
  profileId: string,
  runningDate: string,
  completed: boolean
): Promise<
  XPAwardResult | null
> {
  if (!completed) {
    return null;
  }

  return awardXP(
    profileId,

    XP_REWARDS.RUNNING_COMPLETED,

    XP_REASONS.RUNNING_COMPLETED,

    runningDate,

    runningDate
  );
}

/*
 * ========================================
 * 10K STEPS XP
 * ========================================
 */

export async function award10KStepsXP(
  profileId: string,
  stepDate: string,
  stepCount: number,
  alreadyAwardedXP: number = 0
): Promise<XPAwardResult | null> {
  if (!Number.isFinite(stepCount)) {
    throw new Error('INVALID_STEP_COUNT');
  }

  const STEP_GOAL = 10000;

  const completion = Math.max(
    0,
    Math.min(
      1,
      stepCount / STEP_GOAL
    )
  );

  const totalEligibleXP = Math.floor(
    completion *
      XP_REWARDS.STEPS_10K_COMPLETED
  );

  const newXP = Math.max(
    0,
    totalEligibleXP - alreadyAwardedXP
  );

  if (newXP <= 0) {
    return null;
  }

  return awardXP(
    profileId,
    newXP,
    XP_REASONS.STEPS_10K_COMPLETED,
    `${stepDate}:${totalEligibleXP}`
  );
}

/*
 * ========================================
 * TODO XP
 * ========================================
 */

export async function awardTodoXP(
  profileId: string,
  todoDate: string,
  completedActivities: number,
  totalActivities: number
): Promise<
  XPAwardResult | null
> {
  if (
    !Number.isInteger(
      completedActivities
    ) ||
    !Number.isInteger(
      totalActivities
    )
  ) {
    throw new Error(
      'INVALID_TODO_COUNT'
    );
  }

  /*
   * Only 3–5 activities.
   */

  if (
    totalActivities < 3 ||
    totalActivities > 5
  ) {
    throw new Error(
      'TODO_ACTIVITY_COUNT_MUST_BE_3_TO_5'
    );
  }

  if (
    completedActivities < 0 ||
    completedActivities >
      totalActivities
  ) {
    throw new Error(
      'INVALID_COMPLETED_TODO_COUNT'
    );
  }

  let todoXP = 0;

  /*
   * 5/5 = 100 XP
   */

  if (
    completedActivities === 5
  ) {
    todoXP =
      XP_REWARDS.TODO_5_COMPLETED;
  }

  /*
   * 3/5 or 4/5 = 50 XP
   */

  else if (
    completedActivities >= 3
  ) {
    todoXP =
      XP_REWARDS.TODO_3_COMPLETED;
  }

  if (
    todoXP <= 0
  ) {
    return null;
  }

  return awardXP(
    profileId,

    todoXP,

    XP_REASONS.TODO_COMPLETED,

    todoDate,

    todoDate
  );
}

/*
 * ========================================
 * DAILY STREAK XP
 * ========================================
 *
 * Day 1  → 10 XP
 * Day 2  → 20 XP
 * ...
 * Day 10 → 100 XP
 *
 * ========================================
 */

export async function awardDailyStreakXP(
  profileId: string,
  streakDate: string
): Promise<
  XPAwardResult | null
> {
  const progression =
    await getOrCreateProgression(
      profileId
    );

  /*
   * Activity must actually exist
   * for this date.
   */

  if (
    progression.lastActivityDate !==
    streakDate
  ) {
    return null;
  }

  const streakXP =
    getDailyStreakXP(
      progression.currentStreak
    );

  if (
    streakXP <= 0
  ) {
    return null;
  }

  /*
   * ======================================
   * POKÉMON SYSTEM: STREAK SHARD BONUS
   * ======================================
   *
   * Every 7-day streak milestone pays an
   * extra Pokéball Shard bonus, on top
   * of the streak XP above. Also a good
   * moment to re-check streak-based
   * achievements (e.g. 100 day streak).
   * ======================================
   */

  try {
    await grantStreakMilestoneShards(
      profileId,
      progression.currentStreak
    );
  } catch (error) {
    console.error(
      '[POKEMON] Failed to grant streak shard bonus:',
      error
    );
  }

  await safelyEvaluateAchievements(
    profileId
  );

  return awardXP(
    profileId,

    streakXP,

    XP_REASONS.DAILY_STREAK,

    streakDate,

    streakDate
  );
}