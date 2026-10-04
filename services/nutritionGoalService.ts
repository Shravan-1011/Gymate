import {
  getProfileDetails,
} from '../database/profileDetailsRepository';

import {
  DEFAULT_CALORIE_GOAL,
  DEFAULT_PROTEIN_GOAL,
} from '../types/diet';


/*
 * ========================================
 * TYPES
 * ========================================
 */

export type NutritionGoalRecommendation = {
  calorieGoal: number;
  proteinGoal: number;
  isPersonalized: boolean;
};


/*
 * ========================================
 * CONSTANTS
 * ========================================
 */

const DEFAULT_AGE = 25;


/*
 * ========================================
 * HELPERS
 * ========================================
 */

function roundToNearest(
  value: number,
  nearest: number
): number {
  return Math.round(
    value / nearest
  ) * nearest;
}


/*
 * ========================================
 * ACTIVITY MULTIPLIER
 * ========================================
 *
 * Gymate currently stores training level,
 * not a separate daily-activity level.
 *
 * Therefore we use training level as a
 * conservative activity multiplier.
 */

function getActivityMultiplier(
  activityLevel: string | null
): number {
  switch (
    activityLevel?.toUpperCase()
  ) {
    case 'ADVANCED':
      return 1.60;

    case 'INTERMEDIATE':
      return 1.50;

    case 'BEGINNER':
      return 1.40;

    default:
      return 1.40;
  }
}


/*
 * ========================================
 * FITNESS GOAL ADJUSTMENT
 * ========================================
 */

function getCalorieAdjustment(
  fitnessGoal: string | null
): number {
  switch (
    fitnessGoal?.toUpperCase()
  ) {
    case 'LOSE FAT':
      return -300;

    case 'BUILD MUSCLE':
      return 250;

    case 'GET STRONGER':
      return 150;

    case 'IMPROVE FITNESS':
      return 0;

    case 'MAINTAIN':
      return 0;

    default:
      return 0;
  }
}


/*
 * ========================================
 * PROTEIN TARGET
 * ========================================
 */

function getProteinMultiplier(
  fitnessGoal: string | null
): number {
  switch (
    fitnessGoal?.toUpperCase()
  ) {
    case 'LOSE FAT':
      return 1.8;

    case 'BUILD MUSCLE':
      return 1.8;

    case 'GET STRONGER':
      return 1.8;

    case 'IMPROVE FITNESS':
      return 1.6;

    case 'MAINTAIN':
      return 1.6;

    default:
      return 1.6;
  }
}


/*
 * ========================================
 * CALCULATE RECOMMENDATION
 * ========================================
 */

export async function getRecommendedNutritionGoals(
  profileId: string
): Promise<NutritionGoalRecommendation> {
  const profileDetails =
    await getProfileDetails(
      profileId
    );

  /*
   * Profile details are required for
   * personalized nutrition.
   */

  if (
    !profileDetails ||
    profileDetails.weightKg == null ||
    profileDetails.heightCm == null
  ) {
    return {
      calorieGoal:
        DEFAULT_CALORIE_GOAL,

      proteinGoal:
        DEFAULT_PROTEIN_GOAL,

      isPersonalized: false,
    };
  }


  const weight =
    profileDetails.weightKg;

  const height =
    profileDetails.heightCm;

  /*
   * Age is optional in Gymate.
   *
   * If the user has not entered an age,
   * use a neutral adult estimate rather
   * than blocking nutrition tracking.
   */

  const age =
    profileDetails.age ??
    DEFAULT_AGE;


  /*
   * ======================================
   * BASE METABOLIC ESTIMATE
   * ======================================
   *
   * The current profile schema does not
   * contain biological sex, so Gymate uses
   * the midpoint of the standard
   * Mifflin-St Jeor constants rather than
   * pretending we have sex-specific data.
   */

  const bmr =
    (
      10 * weight
    ) +
    (
      6.25 * height
    ) -
    (
      5 * age
    ) -
    78;


  /*
   * ======================================
   * MAINTENANCE CALORIES
   * ======================================
   */

  const activityMultiplier =
    getActivityMultiplier(
      profileDetails.activityLevel
    );

  const maintenanceCalories =
    bmr *
    activityMultiplier;


  /*
   * ======================================
   * GOAL CALORIES
   * ======================================
   */

  const calorieAdjustment =
    getCalorieAdjustment(
      profileDetails.fitnessGoal
    );

  const calorieGoal =
    roundToNearest(
      Math.max(
        1200,
        maintenanceCalories +
          calorieAdjustment
      ),
      50
    );


  /*
   * ======================================
   * PROTEIN
   * ======================================
   */

  const proteinMultiplier =
    getProteinMultiplier(
      profileDetails.fitnessGoal
    );

  const proteinGoal =
    roundToNearest(
      Math.max(
        60,
        weight *
          proteinMultiplier
      ),
      5
    );


  return {
    calorieGoal,
    proteinGoal,
    isPersonalized: true,
  };
}