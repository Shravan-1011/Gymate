import { getDatabase } from './database';

import type {
  DailyNutrition,
  DailyNutritionFood,
  FoodUnit,
} from '../types/diet';


type DailyNutritionRow = {
  id: string;
  profile_id: string;
  activity_date: string;
  calorie_goal: number;
  protein_goal: number;
  water_goal: number;
  water_consumed: number;
  evaluated: number;
  nutrition_xp: number;
  created_at: string;
  updated_at: string;
};


type DailyNutritionFoodRow = {
  id: string;
  daily_nutrition_id: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};


/*
 * ========================================
 * FOOD MAPPER
 * ========================================
 */

function mapFood(
  row: DailyNutritionFoodRow
): DailyNutritionFood {
  return {
    id: row.id,

    dailyNutritionId:
      row.daily_nutrition_id,

    foodName:
      row.food_name,

    quantity:
      row.quantity,

    unit:
      row.unit as FoodUnit,

    calories:
      row.calories,

    protein:
      row.protein,

    carbs:
      row.carbs,

    fat:
      row.fat,

    sortOrder:
      row.sort_order,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}


/*
 * ========================================
 * NUTRITION MAPPER
 * ========================================
 */

function mapNutrition(
  row: DailyNutritionRow,
  foods: DailyNutritionFood[]
): DailyNutrition {
  return {
    id: row.id,

    profileId:
      row.profile_id,

    activityDate:
      row.activity_date,

    calorieGoal:
      row.calorie_goal,

    proteinGoal:
      row.protein_goal,

    waterGoal:
      row.water_goal,

    waterConsumed:
      row.water_consumed,

    evaluated:
      row.evaluated === 1,

    nutritionXP:
      row.nutrition_xp,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    foods,
  };
}


/*
 * ========================================
 * GET DIET HISTORY
 * ========================================
 *
 * Newest day → oldest day.
 *
 * Each day includes its food snapshots.
 *
 * The food values are historical snapshots,
 * so changing a template later will NOT
 * change previous days.
 * ========================================
 */

export async function getDailyNutritionHistory(
  profileId: string,
  limit = 90
): Promise<DailyNutrition[]> {

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  const db =
    await getDatabase();


  const safeLimit =
    Math.min(
      365,
      Math.max(
        1,
        Math.floor(limit)
      )
    );


  const rows =
    await db.getAllAsync<DailyNutritionRow>(
      `
        SELECT
          id,
          profile_id,
          activity_date,
          calorie_goal,
          protein_goal,
          water_goal,
          water_consumed,
          evaluated,
          nutrition_xp,
          created_at,
          updated_at
        FROM daily_nutrition
        WHERE profile_id = ?
        ORDER BY activity_date DESC
        LIMIT ${safeLimit};
      `,
      profileId
    );


  const history:
    DailyNutrition[] = [];


  for (const row of rows) {

    const foodRows =
      await db.getAllAsync<DailyNutritionFoodRow>(
        `
          SELECT
            id,
            daily_nutrition_id,
            food_name,
            quantity,
            unit,
            calories,
            protein,
            carbs,
            fat,
            sort_order,
            created_at,
            updated_at
          FROM daily_nutrition_foods
          WHERE daily_nutrition_id = ?
          ORDER BY
            sort_order ASC,
            created_at ASC;
        `,
        row.id
      );


    history.push(
      mapNutrition(
        row,
        foodRows.map(
          mapFood
        )
      )
    );
  }


  return history;
}