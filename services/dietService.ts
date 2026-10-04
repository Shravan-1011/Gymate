import {
  addDietTemplateFood,
  addDailyNutritionFood,
  applyDietTemplateToDay,
  calculateNutritionTotals,
  createDietTemplate,
  deleteDietTemplate,
  deleteDietTemplateFood,
  deleteDailyNutritionFood,
  getDietTemplateById,
  getDietTemplates,
  getDailyNutrition,
  getOrCreateDailyNutrition,
  updateDietTemplate,
  updateDietTemplateFood,
  updateDailyNutritionFood,
  updateDailyNutritionGoals,
  updateWaterConsumed,
} from '../database/dietRepository';

import type {
  DailyNutrition,
  DailyNutritionFood,
  DietTemplate,
  DietTemplateFood,
  FoodUnit,
  NutritionProgress,
} from '../types/diet';

import {
  DEFAULT_CALORIE_GOAL,
  DEFAULT_PROTEIN_GOAL,
  DEFAULT_WATER_GOAL,
} from '../types/diet';

import {
  getRecommendedNutritionGoals,
} from './nutritionGoalService';


/*
 * ========================================
 * DATE
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
 * TEMPLATE
 * ========================================
 */

export async function createTemplate(
  profileId: string,
  name: string
): Promise<DietTemplate> {
  return createDietTemplate(
    profileId,
    name
  );
}


export async function getTemplates(
  profileId: string
): Promise<DietTemplate[]> {
  return getDietTemplates(
    profileId
  );
}


export async function getTemplate(
  profileId: string,
  templateId: string
): Promise<DietTemplate | null> {
  return getDietTemplateById(
    profileId,
    templateId
  );
}


export async function renameTemplate(
  profileId: string,
  templateId: string,
  name: string
): Promise<DietTemplate | null> {
  return updateDietTemplate(
    profileId,
    templateId,
    name
  );
}


export async function removeTemplate(
  profileId: string,
  templateId: string
): Promise<boolean> {
  return deleteDietTemplate(
    profileId,
    templateId
  );
}


/*
 * ========================================
 * TEMPLATE FOODS
 * ========================================
 */

export async function addTemplateFood(
  profileId: string,
  templateId: string,
  food: Omit<
    DietTemplateFood,
    | 'id'
    | 'templateId'
    | 'createdAt'
    | 'updatedAt'
  >
): Promise<DietTemplateFood> {
  return addDietTemplateFood(
    profileId,
    templateId,
    food
  );
}


export async function editTemplateFood(
  profileId: string,
  foodId: string,
  updates: Partial<
    Pick<
      DietTemplateFood,
      | 'foodName'
      | 'quantity'
      | 'unit'
      | 'calories'
      | 'protein'
      | 'carbs'
      | 'fat'
      | 'sortOrder'
    >
  >
): Promise<DietTemplateFood | null> {
  return updateDietTemplateFood(
    profileId,
    foodId,
    updates
  );
}


export async function removeTemplateFood(
  profileId: string,
  foodId: string
): Promise<boolean> {
  return deleteDietTemplateFood(
    profileId,
    foodId
  );
}


/*
 * ========================================
 * DAILY NUTRITION
 * ========================================
 */

export async function getNutritionForDate(
  profileId: string,
  activityDate: string
): Promise<DailyNutrition | null> {
  return getDailyNutrition(
    profileId,
    activityDate
  );
}


export async function getTodayNutrition(
  profileId: string
): Promise<DailyNutrition | null> {
  return getDailyNutrition(
    profileId,
    getTodayDate()
  );
}


export async function getOrCreateTodayNutrition(
  profileId: string
): Promise<DailyNutrition> {
  return getOrCreateDailyNutrition(
    profileId,
    getTodayDate(),
    DEFAULT_CALORIE_GOAL,
    DEFAULT_PROTEIN_GOAL,
    DEFAULT_WATER_GOAL
  );
}


export async function getOrCreateNutritionForDate(
  profileId: string,
  activityDate: string
): Promise<DailyNutrition> {
  return getOrCreateDailyNutrition(
    profileId,
    activityDate,
    DEFAULT_CALORIE_GOAL,
    DEFAULT_PROTEIN_GOAL,
    DEFAULT_WATER_GOAL
  );
}


/*
 * ========================================
 * GOALS
 * ========================================
 */

export async function updateNutritionGoals(
  profileId: string,
  activityDate: string,
  updates: {
    calorieGoal?: number;
    proteinGoal?: number;
    waterGoal?: number;
  }
): Promise<DailyNutrition | null> {
  return updateDailyNutritionGoals(
    profileId,
    activityDate,
    updates
  );
}


/*
 * ========================================
 * WATER
 * ========================================
 */

export async function setWaterForDay(
  profileId: string,
  activityDate: string,
  amount: number
): Promise<DailyNutrition | null> {
  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error(
      'INVALID_WATER_AMOUNT'
    );
  }

  return updateWaterConsumed(
    profileId,
    activityDate,
    amount
  );
}


/*
 * ========================================
 * DAILY FOOD
 * ========================================
 */

export async function addFoodToDay(
  profileId: string,
  dailyNutritionId: string,
  food: Omit<
    DailyNutritionFood,
    | 'id'
    | 'dailyNutritionId'
    | 'createdAt'
    | 'updatedAt'
  >
): Promise<DailyNutritionFood> {
  return addDailyNutritionFood(
    profileId,
    dailyNutritionId,
    food
  );
}


export async function editFoodForDay(
  profileId: string,
  foodId: string,
  updates: Partial<
    Pick<
      DailyNutritionFood,
      | 'foodName'
      | 'quantity'
      | 'unit'
      | 'calories'
      | 'protein'
      | 'carbs'
      | 'fat'
      | 'sortOrder'
    >
  >
): Promise<DailyNutritionFood | null> {
  return updateDailyNutritionFood(
    profileId,
    foodId,
    updates
  );
}


export async function removeFoodFromDay(
  profileId: string,
  foodId: string
): Promise<boolean> {
  return deleteDailyNutritionFood(
    profileId,
    foodId
  );
}


/*
 * ========================================
 * NUTRITION PROGRESS
 * ========================================
 */

export async function getNutritionProgress(
  profileId: string,
  activityDate: string
): Promise<NutritionProgress> {
  const nutrition =
    await getDailyNutrition(
      profileId,
      activityDate
    );

  if (!nutrition) {
    throw new Error(
      'DAILY_NUTRITION_NOT_FOUND'
    );
  }

  const totals =
    calculateNutritionTotals(
      nutrition.foods
    );

  const caloriePercent =
    nutrition.calorieGoal > 0
      ? Math.min(
          100,
          (
            totals.calories /
            nutrition.calorieGoal
          ) * 100
        )
      : 0;

  const proteinPercent =
    nutrition.proteinGoal > 0
      ? Math.min(
          100,
          (
            totals.protein /
            nutrition.proteinGoal
          ) * 100
        )
      : 0;

  const waterPercent =
    nutrition.waterGoal > 0
      ? Math.min(
          100,
          (
            nutrition.waterConsumed /
            nutrition.waterGoal
          ) * 100
        )
      : 0;

  return {
    caloriePercent,
    proteinPercent,
    waterPercent,
    totals,
  };
}


/*
 * ========================================
 * APPLY TEMPLATE
 * ========================================
 */

export async function applyTemplateToDay(
  profileId: string,
  templateId: string,
  activityDate: string,
  calorieGoal: number,
  proteinGoal: number,
  waterGoal: number
): Promise<DailyNutrition> {
  return applyDietTemplateToDay(
    profileId,
    templateId,
    activityDate,
    calorieGoal,
    proteinGoal,
    waterGoal
  );
}