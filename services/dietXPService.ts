import {
  calculateNutritionTotals,
  getDailyNutrition,
  setDailyNutritionEvaluation,
} from '../database/dietRepository';

import {
  getDailyNutritionHistory,
} from '../database/dietHistoryRepository';

import {
  awardDailyStreakXP,
  awardNutritionXP,
  markDayActive,
} from './xpService';


/*
 * ========================================
 * DATE
 * ========================================
 */

function getTodayDate(): string {
  const now =
    new Date();

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
 * EVALUATE ONE NUTRITION DAY
 * ========================================
 *
 * FULL COMPLETION:
 *
 * Calories >= target
 * Protein >= target
 * Water >= target
 *
 * => 100 XP
 *
 *
 * PARTIAL:
 *
 * XP = protein completion %
 *
 * capped at 100.
 *
 *
 * IMPORTANT:
 *
 * Eating fewer calories is NOT treated
 * as automatically better.
 * ========================================
 */

export async function evaluateNutritionForDate(
  profileId: string,
  activityDate: string
) {

  const nutrition =
    await getDailyNutrition(
      profileId,
      activityDate
    );


  /*
   * No nutrition record.
   */

  if (!nutrition) {
    return null;
  }


  /*
   * Already evaluated.
   */

  if (nutrition.evaluated) {

    return {
      nutrition,

      xpAwarded:
        nutrition.nutritionXP,

      alreadyEvaluated:
        true,

      alreadyAwarded:
        true,
    };
  }


  /*
   * Calculate totals.
   */

  const totals =
    calculateNutritionTotals(
      nutrition.foods
    );


  /*
   * Completion checks.
   */

  const calorieComplete =
    nutrition.calorieGoal > 0 &&
    totals.calories >=
      nutrition.calorieGoal;


  const proteinComplete =
    nutrition.proteinGoal > 0 &&
    totals.protein >=
      nutrition.proteinGoal;


  const waterComplete =
    nutrition.waterGoal > 0 &&
    nutrition.waterConsumed >=
      nutrition.waterGoal;


  const dietCompleted =
    calorieComplete &&
    proteinComplete &&
    waterComplete;


  /*
   * Protein completion percentage.
   */

  const proteinCompletionPercent =
    nutrition.proteinGoal > 0
      ? Math.min(
          100,
          (
            totals.protein /
            nutrition.proteinGoal
          ) * 100
        )
      : 0;


  /*
   * Award nutrition XP.
   *
   * Existing XP system handles:
   *
   * - profile ID
   * - duplicate protection
   * - total XP
   * - trainer level
   */

  const result =
    await awardNutritionXP(
      profileId,
      activityDate,
      dietCompleted,
      proteinCompletionPercent
    );


  const xpAwarded =
    result?.xpAwarded ?? 0;


  /*
   * Persist evaluation.
   *
   * Even 0 XP days are marked evaluated
   * so they aren't repeatedly processed.
   */

  const updatedNutrition =
    await setDailyNutritionEvaluation(
      profileId,
      activityDate,
      true,
      xpAwarded
    );


  /*
   * ======================================
   * TODAY'S STREAK
   * ======================================
   *
   * Only today's nutrition activity can
   * activate today's live streak.
   *
   * Historical backfill must NOT change
   * the current streak.
   */

  if (
    result &&
    result.xpAwarded > 0 &&
    activityDate === getTodayDate() &&
    !result.alreadyAwarded
  ) {

    await markDayActive(
      profileId,
      activityDate
    );


    await awardDailyStreakXP(
      profileId,
      activityDate
    );
  }


  return {
    nutrition:
      updatedNutrition ??
      nutrition,

    xpAwarded,

    alreadyEvaluated:
      false,

    alreadyAwarded:
      result?.alreadyAwarded ??
      false,

    dietCompleted,

    calorieComplete,

    proteinComplete,

    waterComplete,

    proteinCompletionPercent,
  };
}


/*
 * ========================================
 * EVALUATE PREVIOUS DAYS
 * ========================================
 *
 * The user does NOT need to keep the app
 * open at midnight.
 *
 * When Diet opens later, we find previous
 * unevaluated days and process them.
 *
 * Maximum lookback:
 * 365 recorded days.
 * ========================================
 */

export async function evaluatePreviousNutritionDays(
  profileId: string
): Promise<number> {

  const today =
    getTodayDate();


  const history =
    await getDailyNutritionHistory(
      profileId,
      365
    );


  const pendingDays =
    history.filter(
      (day) =>
        day.activityDate <
          today &&
        !day.evaluated
    );


  let evaluatedCount =
    0;


  for (
    const day of pendingDays
  ) {

    await evaluateNutritionForDate(
      profileId,
      day.activityDate
    );

    evaluatedCount += 1;
  }


  return evaluatedCount;
}