/*
 * ========================================
 * DIET TYPES
 * ========================================
 */

/*
 * ========================================
 * FOOD UNIT
 * ========================================
 *
 * The quantity unit used for a food.
 * ========================================
 */

export type FoodUnit =
  | 'g'
  | 'ml'
  | 'piece'
  | 'scoop'
  | 'serving'
  | 'cup'
  | 'tbsp'
  | 'tsp';


/*
 * ========================================
 * DIET TEMPLATE FOOD
 * ========================================
 */

export type DietTemplateFood = {
  id: string;

  templateId: string;

  foodName: string;

  quantity: number;

  unit: FoodUnit;

  calories: number;

  protein: number;

  carbs: number;

  fat: number;

  sortOrder: number;

  createdAt: string;

  updatedAt: string;
};


/*
 * ========================================
 * DIET TEMPLATE
 * ========================================
 */

export type DietTemplate = {
  id: string;

  profileId: string;

  name: string;

  createdAt: string;

  updatedAt: string;

  foods: DietTemplateFood[];
};


/*
 * ========================================
 * DAILY NUTRITION FOOD
 * ========================================
 *
 * This is an independent snapshot.
 *
 * Editing the original template must
 * NEVER modify this record.
 * ========================================
 */

export type DailyNutritionFood = {
  id: string;

  dailyNutritionId: string;

  foodName: string;

  quantity: number;

  unit: FoodUnit;

  calories: number;

  protein: number;

  carbs: number;

  fat: number;

  sortOrder: number;

  createdAt: string;

  updatedAt: string;
};


/*
 * ========================================
 * DAILY NUTRITION
 * ========================================
 */

export type DailyNutrition = {
  id: string;

  profileId: string;

  activityDate: string;

  calorieGoal: number;

  proteinGoal: number;

  waterGoal: number;

  waterConsumed: number;

  evaluated: boolean;

  nutritionXP: number;

  createdAt: string;

  updatedAt: string;

  foods: DailyNutritionFood[];
};


/*
 * ========================================
 * NUTRITION TOTALS
 * ========================================
 */

export type NutritionTotals = {
  calories: number;

  protein: number;

  carbs: number;

  fat: number;
};


/*
 * ========================================
 * NUTRITION PROGRESS
 * ========================================
 */

export type NutritionProgress = {
  caloriePercent: number;

  proteinPercent: number;

  waterPercent: number;

  totals: NutritionTotals;
};


/*
 * ========================================
 * DEFAULT NUTRITION GOALS
 * ========================================
 *
 * These are only defaults.
 *
 * Later the user can configure these
 * from the Diet settings/profile.
 * ========================================
 */

export const DEFAULT_CALORIE_GOAL = 2000;

export const DEFAULT_PROTEIN_GOAL = 120;

export const DEFAULT_WATER_GOAL = 3;