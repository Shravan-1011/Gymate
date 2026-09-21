import { getDatabase } from './database';

import type {
  DailyNutrition,
  DailyNutritionFood,
  DietTemplate,
  DietTemplateFood,
  FoodUnit,
  NutritionTotals,
} from '../types/diet';


/*
 * ========================================
 * DATABASE ROW TYPES
 * ========================================
 */

type DietTemplateRow = {
  id: string;

  profile_id: string;

  name: string;

  created_at: string;

  updated_at: string;
};


type DietTemplateFoodRow = {
  id: string;

  template_id: string;

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
 * ID HELPERS
 * ========================================
 */

function createId(
  prefix: string
): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
}


/*
 * ========================================
 * DATE HELPER
 * ========================================
 *
 * Local calendar date.
 *
 * YYYY-MM-DD
 * ========================================
 */

export function getDietTodayDate(): string {
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
 * ROW → TEMPLATE FOOD
 * ========================================
 */

function mapTemplateFood(
  row: DietTemplateFoodRow
): DietTemplateFood {
  return {
    id: row.id,

    templateId:
      row.template_id,

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
 * ROW → DAILY FOOD
 * ========================================
 */

function mapDailyNutritionFood(
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
 * ROW → TEMPLATE
 * ========================================
 */

function mapTemplate(
  row: DietTemplateRow,
  foods: DietTemplateFood[]
): DietTemplate {
  return {
    id: row.id,

    profileId:
      row.profile_id,

    name:
      row.name,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    foods,
  };
}


/*
 * ========================================
 * ROW → DAILY NUTRITION
 * ========================================
 */

function mapDailyNutrition(
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
 * TEMPLATE FOOD
 * ========================================
 */

export async function addDietTemplateFood(
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
  const db = await getDatabase();

  const template =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM diet_templates
        WHERE id = ?
          AND profile_id = ?
        LIMIT 1;
      `,
      templateId,
      profileId
    );

  if (!template) {
    throw new Error(
      'DIET_TEMPLATE_NOT_FOUND'
    );
  }

  if (!food.foodName.trim()) {
    throw new Error(
      'FOOD_NAME_REQUIRED'
    );
  }

  if (
    !Number.isFinite(food.quantity) ||
    food.quantity <= 0
  ) {
    throw new Error(
      'INVALID_FOOD_QUANTITY'
    );
  }

  const now =
    new Date().toISOString();

  const id =
    createId(
      'diet-template-food'
    );

  await db.runAsync(
    `
      INSERT INTO diet_template_foods (
        id,
        template_id,
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
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    id,
    templateId,
    food.foodName.trim(),
    food.quantity,
    food.unit,
    food.calories,
    food.protein,
    food.carbs,
    food.fat,
    food.sortOrder,
    now,
    now
  );

  const created =
    await db.getFirstAsync<DietTemplateFoodRow>(
      `
        SELECT *
        FROM diet_template_foods
        WHERE id = ?
        LIMIT 1;
      `,
      id
    );

  if (!created) {
    throw new Error(
      'FAILED_TO_CREATE_DIET_TEMPLATE_FOOD'
    );
  }

  return mapTemplateFood(
    created
  );
}


/*
 * ========================================
 * GET TEMPLATE FOODS
 * ========================================
 */

export async function getDietTemplateFoods(
  profileId: string,
  templateId: string
): Promise<DietTemplateFood[]> {
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<DietTemplateFoodRow>(
      `
        SELECT dtf.*
        FROM diet_template_foods dtf

        INNER JOIN diet_templates dt
          ON dt.id = dtf.template_id

        WHERE dtf.template_id = ?
          AND dt.profile_id = ?

        ORDER BY
          dtf.sort_order ASC,
          dtf.created_at ASC;
      `,
      templateId,
      profileId
    );

  return rows.map(
    mapTemplateFood
  );
}


/*
 * ========================================
 * CREATE TEMPLATE
 * ========================================
 */

export async function createDietTemplate(
  profileId: string,
  name: string
): Promise<DietTemplate> {
  const db = await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  const trimmedName =
    name.trim();

  if (!trimmedName) {
    throw new Error(
      'DIET_TEMPLATE_NAME_REQUIRED'
    );
  }

  const profile =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM profiles
        WHERE id = ?
        LIMIT 1;
      `,
      profileId
    );

  if (!profile) {
    throw new Error(
      'PROFILE_NOT_FOUND'
    );
  }

  const existing =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM diet_templates
        WHERE profile_id = ?
          AND LOWER(TRIM(name)) = LOWER(TRIM(?))
        LIMIT 1;
      `,
      profileId,
      trimmedName
    );

  if (existing) {
    throw new Error(
      'DIET_TEMPLATE_ALREADY_EXISTS'
    );
  }

  const now =
    new Date().toISOString();

  const id =
    createId(
      'diet-template'
    );

  await db.runAsync(
    `
      INSERT INTO diet_templates (
        id,
        profile_id,
        name,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?);
    `,
    id,
    profileId,
    trimmedName,
    now,
    now
  );

  const created =
    await getDietTemplateById(
      profileId,
      id
    );

  if (!created) {
    throw new Error(
      'FAILED_TO_CREATE_DIET_TEMPLATE'
    );
  }

  return created;
}


/*
 * ========================================
 * GET TEMPLATE BY ID
 * ========================================
 */

export async function getDietTemplateById(
  profileId: string,
  templateId: string
): Promise<DietTemplate | null> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<DietTemplateRow>(
      `
        SELECT *
        FROM diet_templates
        WHERE id = ?
          AND profile_id = ?
        LIMIT 1;
      `,
      templateId,
      profileId
    );

  if (!row) {
    return null;
  }

  const foods =
    await getDietTemplateFoods(
      profileId,
      templateId
    );

  return mapTemplate(
    row,
    foods
  );
}


/*
 * ========================================
 * GET ALL TEMPLATES
 * ========================================
 */

export async function getDietTemplates(
  profileId: string
): Promise<DietTemplate[]> {
  const db = await getDatabase();

  if (!profileId) {
    return [];
  }

  const rows =
    await db.getAllAsync<DietTemplateRow>(
      `
        SELECT *
        FROM diet_templates
        WHERE profile_id = ?
        ORDER BY updated_at DESC;
      `,
      profileId
    );

  const templates: DietTemplate[] =
    [];

  for (const row of rows) {
    const foods =
      await getDietTemplateFoods(
        profileId,
        row.id
      );

    templates.push(
      mapTemplate(
        row,
        foods
      )
    );
  }

  return templates;
}


/*
 * ========================================
 * UPDATE TEMPLATE NAME
 * ========================================
 */

export async function updateDietTemplate(
  profileId: string,
  templateId: string,
  name: string
): Promise<DietTemplate | null> {
  const db = await getDatabase();

  const trimmedName =
    name.trim();

  if (!trimmedName) {
    throw new Error(
      'DIET_TEMPLATE_NAME_REQUIRED'
    );
  }

  const existing =
    await getDietTemplateById(
      profileId,
      templateId
    );

  if (!existing) {
    return null;
  }

  const duplicate =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM diet_templates
        WHERE profile_id = ?
          AND LOWER(TRIM(name)) = LOWER(TRIM(?))
          AND id != ?
        LIMIT 1;
      `,
      profileId,
      trimmedName,
      templateId
    );

  if (duplicate) {
    throw new Error(
      'DIET_TEMPLATE_ALREADY_EXISTS'
    );
  }

  const now =
    new Date().toISOString();

  await db.runAsync(
    `
      UPDATE diet_templates
      SET
        name = ?,
        updated_at = ?
      WHERE id = ?
        AND profile_id = ?;
    `,
    trimmedName,
    now,
    templateId,
    profileId
  );

  return getDietTemplateById(
    profileId,
    templateId
  );
}


/*
 * ========================================
 * DELETE TEMPLATE
 * ========================================
 *
 * CASCADE removes its foods.
 * ========================================
 */

export async function deleteDietTemplate(
  profileId: string,
  templateId: string
): Promise<boolean> {
  const db = await getDatabase();

  const result =
    await db.runAsync(
      `
        DELETE FROM diet_templates
        WHERE id = ?
          AND profile_id = ?;
      `,
      templateId,
      profileId
    );

  return result.changes > 0;
}


/*
 * ========================================
 * UPDATE TEMPLATE FOOD
 * ========================================
 */

export async function updateDietTemplateFood(
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
  const db = await getDatabase();

  const existing =
    await db.getFirstAsync<DietTemplateFoodRow>(
      `
        SELECT dtf.*
        FROM diet_template_foods dtf

        INNER JOIN diet_templates dt
          ON dt.id = dtf.template_id

        WHERE dtf.id = ?
          AND dt.profile_id = ?

        LIMIT 1;
      `,
      foodId,
      profileId
    );

  if (!existing) {
    return null;
  }

  const fields: string[] = [];

  const values: (
    | string
    | number
  )[] = [];

  if (
    updates.foodName !==
    undefined
  ) {
    const foodName =
      updates.foodName.trim();

    if (!foodName) {
      throw new Error(
        'FOOD_NAME_REQUIRED'
      );
    }

    fields.push(
      'food_name = ?'
    );

    values.push(
      foodName
    );
  }

  if (
    updates.quantity !==
    undefined
  ) {
    if (
      !Number.isFinite(
        updates.quantity
      ) ||
      updates.quantity <= 0
    ) {
      throw new Error(
        'INVALID_FOOD_QUANTITY'
      );
    }

    fields.push(
      'quantity = ?'
    );

    values.push(
      updates.quantity
    );
  }

  if (
    updates.unit !==
    undefined
  ) {
    fields.push(
      'unit = ?'
    );

    values.push(
      updates.unit
    );
  }

  if (
    updates.calories !==
    undefined
  ) {
    fields.push(
      'calories = ?'
    );

    values.push(
      updates.calories
    );
  }

  if (
    updates.protein !==
    undefined
  ) {
    fields.push(
      'protein = ?'
    );

    values.push(
      updates.protein
    );
  }

  if (
    updates.carbs !==
    undefined
  ) {
    fields.push(
      'carbs = ?'
    );

    values.push(
      updates.carbs
    );
  }

  if (
    updates.fat !==
    undefined
  ) {
    fields.push(
      'fat = ?'
    );

    values.push(
      updates.fat
    );
  }

  if (
    updates.sortOrder !==
    undefined
  ) {
    fields.push(
      'sort_order = ?'
    );

    values.push(
      updates.sortOrder
    );
  }

  if (fields.length === 0) {
    return mapTemplateFood(
      existing
    );
  }

  const now =
    new Date().toISOString();

  fields.push(
    'updated_at = ?'
  );

  values.push(now);

  values.push(foodId);

  await db.runAsync(
    `
      UPDATE diet_template_foods
      SET ${fields.join(', ')}
      WHERE id = ?;
    `,
    ...values
  );

  const updated =
    await db.getFirstAsync<DietTemplateFoodRow>(
      `
        SELECT *
        FROM diet_template_foods
        WHERE id = ?
        LIMIT 1;
      `,
      foodId
    );

  if (!updated) {
    return null;
  }

  return mapTemplateFood(
    updated
  );
}


/*
 * ========================================
 * DELETE TEMPLATE FOOD
 * ========================================
 */

export async function deleteDietTemplateFood(
  profileId: string,
  foodId: string
): Promise<boolean> {
  const db = await getDatabase();

  const result =
    await db.runAsync(
      `
        DELETE FROM diet_template_foods
        WHERE id = ?
          AND template_id IN (
            SELECT id
            FROM diet_templates
            WHERE profile_id = ?
          );
      `,
      foodId,
      profileId
    );

  return result.changes > 0;
}


/*
 * ========================================
 * DAILY NUTRITION
 * ========================================
 */

/*
 * ========================================
 * CREATE DAILY NUTRITION
 * ========================================
 */

export async function createDailyNutrition(
  profileId: string,
  activityDate: string,
  calorieGoal: number,
  proteinGoal: number,
  waterGoal: number
): Promise<DailyNutrition> {
  const db = await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (!activityDate.trim()) {
    throw new Error(
      'ACTIVITY_DATE_REQUIRED'
    );
  }

  if (
    !Number.isFinite(calorieGoal) ||
    calorieGoal <= 0
  ) {
    throw new Error(
      'INVALID_CALORIE_GOAL'
    );
  }

  if (
    !Number.isFinite(proteinGoal) ||
    proteinGoal <= 0
  ) {
    throw new Error(
      'INVALID_PROTEIN_GOAL'
    );
  }

  if (
    !Number.isFinite(waterGoal) ||
    waterGoal <= 0
  ) {
    throw new Error(
      'INVALID_WATER_GOAL'
    );
  }

  const existing =
    await getDailyNutrition(
      profileId,
      activityDate
    );

  if (existing) {
    return existing;
  }

  const now =
    new Date().toISOString();

  const id =
    createId(
      'daily-nutrition'
    );

  await db.runAsync(
    `
      INSERT INTO daily_nutrition (
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
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?);
    `,
    id,
    profileId,
    activityDate.trim(),
    calorieGoal,
    proteinGoal,
    waterGoal,
    now,
    now
  );

  const created =
    await getDailyNutrition(
      profileId,
      activityDate
    );

  if (!created) {
    throw new Error(
      'FAILED_TO_CREATE_DAILY_NUTRITION'
    );
  }

  return created;
}


/*
 * ========================================
 * GET DAILY NUTRITION
 * ========================================
 */

export async function getDailyNutrition(
  profileId: string,
  activityDate: string
): Promise<DailyNutrition | null> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<DailyNutritionRow>(
      `
        SELECT *
        FROM daily_nutrition
        WHERE profile_id = ?
          AND activity_date = ?
        LIMIT 1;
      `,
      profileId,
      activityDate
    );

  if (!row) {
    return null;
  }

  const foods =
    await getDailyNutritionFoods(
      profileId,
      row.id
    );

  return mapDailyNutrition(
    row,
    foods
  );
}


/*
 * ========================================
 * GET OR CREATE DAILY NUTRITION
 * ========================================
 */

export async function getOrCreateDailyNutrition(
  profileId: string,
  activityDate: string,
  calorieGoal: number,
  proteinGoal: number,
  waterGoal: number
): Promise<DailyNutrition> {
  const existing =
    await getDailyNutrition(
      profileId,
      activityDate
    );

  if (existing) {
    return existing;
  }

  return createDailyNutrition(
    profileId,
    activityDate,
    calorieGoal,
    proteinGoal,
    waterGoal
  );
}

/*
 * ========================================
 * APPLY TEMPLATE TO DAY
 * ========================================
 *
 * Copies the complete template into a
 * daily nutrition record.
 *
 * IMPORTANT:
 *
 * Template foods are copied as snapshots.
 *
 * Future template edits therefore cannot
 * change this day's nutrition.
 *
 * The entire operation happens inside one
 * SQLite transaction:
 *
 *   create/get daily record
 *          ↓
 *   remove existing daily foods
 *          ↓
 *   copy template foods
 *          ↓
 *   commit
 *
 * If anything fails:
 *
 *   rollback
 *
 * Nothing is partially applied.
 * ========================================
 */

export async function applyDietTemplateToDay(
  profileId: string,
  templateId: string,
  activityDate: string,
  calorieGoal: number,
  proteinGoal: number,
  waterGoal: number
): Promise<DailyNutrition> {
  const db =
    await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (!templateId) {
    throw new Error(
      'DIET_TEMPLATE_ID_REQUIRED'
    );
  }

  if (!activityDate.trim()) {
    throw new Error(
      'ACTIVITY_DATE_REQUIRED'
    );
  }

  if (
    !Number.isFinite(
      calorieGoal
    ) ||
    calorieGoal <= 0
  ) {
    throw new Error(
      'INVALID_CALORIE_GOAL'
    );
  }

  if (
    !Number.isFinite(
      proteinGoal
    ) ||
    proteinGoal <= 0
  ) {
    throw new Error(
      'INVALID_PROTEIN_GOAL'
    );
  }

  if (
    !Number.isFinite(
      waterGoal
    ) ||
    waterGoal <= 0
  ) {
    throw new Error(
      'INVALID_WATER_GOAL'
    );
  }


  /*
   * ======================================
   * VERIFY TEMPLATE
   * ======================================
   */

  const template =
    await db.getFirstAsync<
      DietTemplateRow
    >(
      `
        SELECT *
        FROM diet_templates
        WHERE id = ?
          AND profile_id = ?
        LIMIT 1;
      `,
      templateId,
      profileId
    );

  if (!template) {
    throw new Error(
      'DIET_TEMPLATE_NOT_FOUND'
    );
  }


  /*
   * ======================================
   * GET TEMPLATE FOODS
   * ======================================
   */

  const templateFoods =
    await db.getAllAsync<
      DietTemplateFoodRow
    >(
      `
        SELECT *
        FROM diet_template_foods
        WHERE template_id = ?
        ORDER BY
          sort_order ASC,
          created_at ASC;
      `,
      templateId
    );


  /*
   * ======================================
   * TRANSACTION
   * ======================================
   */

  let dailyNutritionId: string;


  try {
    await db.withTransactionAsync(
      async () => {
        /*
         * ==================================
         * FIND EXISTING DAY
         * ==================================
         */

        const existing =
          await db.getFirstAsync<{
            id: string;
          }>(
            `
              SELECT id
              FROM daily_nutrition
              WHERE profile_id = ?
                AND activity_date = ?
              LIMIT 1;
            `,
            profileId,
            activityDate.trim()
          );


        /*
         * ==================================
         * CREATE DAY IF NEEDED
         * ==================================
         */

        if (existing) {
          dailyNutritionId =
            existing.id;


          /*
           * Preserve water and evaluation
           * state when replacing the food
           * plan.
           *
           * The user may already have
           * tracked water today.
           */

          await db.runAsync(
            `
              UPDATE daily_nutrition
              SET
                calorie_goal = ?,
                protein_goal = ?,
                water_goal = ?,
                updated_at = ?
              WHERE id = ?
                AND profile_id = ?;
            `,
            calorieGoal,
            proteinGoal,
            waterGoal,
            new Date().toISOString(),
            existing.id,
            profileId
          );
        } else {
          dailyNutritionId =
            createId(
              'daily-nutrition'
            );

          const now =
            new Date().toISOString();

          await db.runAsync(
            `
              INSERT INTO daily_nutrition (
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
              )
              VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                0,
                0,
                0,
                ?,
                ?
              );
            `,
            dailyNutritionId,
            profileId,
            activityDate.trim(),
            calorieGoal,
            proteinGoal,
            waterGoal,
            now,
            now
          );
        }


        /*
         * ==================================
         * REMOVE EXISTING DAILY FOODS
         * ==================================
         *
         * This makes "Use Template" mean:
         *
         * replace today's food plan
         *
         * rather than:
         *
         * append the template again.
         * ==================================
         */

        await db.runAsync(
          `
            DELETE FROM daily_nutrition_foods
            WHERE daily_nutrition_id = ?;
          `,
          dailyNutritionId
        );


        /*
         * ==================================
         * COPY TEMPLATE FOODS
         * ==================================
         */

        for (
          let index = 0;
          index < templateFoods.length;
          index += 1
        ) {
          const food =
            templateFoods[index];

          const foodId =
            createId(
              'daily-nutrition-food'
            );

          const now =
            new Date().toISOString();

          await db.runAsync(
            `
              INSERT INTO daily_nutrition_foods (
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
              )
              VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
              );
            `,
            foodId,
            dailyNutritionId,
            food.food_name,
            food.quantity,
            food.unit,
            food.calories,
            food.protein,
            food.carbs,
            food.fat,
            index,
            now,
            now
          );
        }
      }
    );
  } catch (error) {
    console.error(
      'Failed to apply diet template:',
      error
    );

    throw new Error(
      'FAILED_TO_APPLY_DIET_TEMPLATE'
    );
  }


  /*
   * ======================================
   * RETURN COMPLETE DAILY SNAPSHOT
   * ======================================
   */

  const result =
    await getDailyNutrition(
      profileId,
      activityDate
    );

  if (!result) {
    throw new Error(
      'FAILED_TO_LOAD_APPLIED_NUTRITION'
    );
  }

  return result;
}

/*
 * ========================================
 * UPDATE DAILY GOALS
 * ========================================
 */

export async function updateDailyNutritionGoals(
  profileId: string,
  activityDate: string,
  updates: {
    calorieGoal?: number;
    proteinGoal?: number;
    waterGoal?: number;
  }
): Promise<DailyNutrition | null> {
  const db = await getDatabase();

  const existing =
    await getDailyNutrition(
      profileId,
      activityDate
    );

  if (!existing) {
    return null;
  }

  const calorieGoal =
    updates.calorieGoal ??
    existing.calorieGoal;

  const proteinGoal =
    updates.proteinGoal ??
    existing.proteinGoal;

  const waterGoal =
    updates.waterGoal ??
    existing.waterGoal;

  if (
    calorieGoal <= 0 ||
    proteinGoal <= 0 ||
    waterGoal <= 0
  ) {
    throw new Error(
      'INVALID_NUTRITION_GOALS'
    );
  }

  const now =
    new Date().toISOString();

  await db.runAsync(
    `
      UPDATE daily_nutrition
      SET
        calorie_goal = ?,
        protein_goal = ?,
        water_goal = ?,
        updated_at = ?
      WHERE id = ?
        AND profile_id = ?;
    `,
    calorieGoal,
    proteinGoal,
    waterGoal,
    now,
    existing.id,
    profileId
  );

  return getDailyNutrition(
    profileId,
    activityDate
  );
}


/*
 * ========================================
 * UPDATE WATER
 * ========================================
 */

export async function updateWaterConsumed(
  profileId: string,
  activityDate: string,
  waterConsumed: number
): Promise<DailyNutrition | null> {
  const db = await getDatabase();

  if (
    !Number.isFinite(
      waterConsumed
    ) ||
    waterConsumed < 0
  ) {
    throw new Error(
      'INVALID_WATER_AMOUNT'
    );
  }

  const existing =
    await getDailyNutrition(
      profileId,
      activityDate
    );

  if (!existing) {
    return null;
  }

  const now =
    new Date().toISOString();

  await db.runAsync(
    `
      UPDATE daily_nutrition
      SET
        water_consumed = ?,
        updated_at = ?
      WHERE id = ?
        AND profile_id = ?;
    `,
    waterConsumed,
    now,
    existing.id,
    profileId
  );

  return getDailyNutrition(
    profileId,
    activityDate
  );
}


/*
 * ========================================
 * ADD WATER
 * ========================================
 */

export async function addWater(
  profileId: string,
  activityDate: string,
  amount: number
): Promise<DailyNutrition | null> {
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      'INVALID_WATER_AMOUNT'
    );
  }

  const existing =
    await getDailyNutrition(
      profileId,
      activityDate
    );

  if (!existing) {
    return null;
  }

  return updateWaterConsumed(
    profileId,
    activityDate,
    existing.waterConsumed +
      amount
  );
}


/*
 * ========================================
 * ADD DAILY FOOD
 * ========================================
 */

export async function addDailyNutritionFood(
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
  const db = await getDatabase();

  const nutrition =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM daily_nutrition
        WHERE id = ?
          AND profile_id = ?
        LIMIT 1;
      `,
      dailyNutritionId,
      profileId
    );

  if (!nutrition) {
    throw new Error(
      'DAILY_NUTRITION_NOT_FOUND'
    );
  }

  if (!food.foodName.trim()) {
    throw new Error(
      'FOOD_NAME_REQUIRED'
    );
  }

  if (
    !Number.isFinite(food.quantity) ||
    food.quantity <= 0
  ) {
    throw new Error(
      'INVALID_FOOD_QUANTITY'
    );
  }

  const now =
    new Date().toISOString();

  const id =
    createId(
      'daily-nutrition-food'
    );

  await db.runAsync(
    `
      INSERT INTO daily_nutrition_foods (
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
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    id,
    dailyNutritionId,
    food.foodName.trim(),
    food.quantity,
    food.unit,
    food.calories,
    food.protein,
    food.carbs,
    food.fat,
    food.sortOrder,
    now,
    now
  );

  const created =
    await db.getFirstAsync<DailyNutritionFoodRow>(
      `
        SELECT *
        FROM daily_nutrition_foods
        WHERE id = ?
        LIMIT 1;
      `,
      id
    );

  if (!created) {
    throw new Error(
      'FAILED_TO_CREATE_DAILY_NUTRITION_FOOD'
    );
  }

  return mapDailyNutritionFood(
    created
  );
}


/*
 * ========================================
 * GET DAILY FOODS
 * ========================================
 */

export async function getDailyNutritionFoods(
  profileId: string,
  dailyNutritionId: string
): Promise<DailyNutritionFood[]> {
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<DailyNutritionFoodRow>(
      `
        SELECT dnf.*
        FROM daily_nutrition_foods dnf

        INNER JOIN daily_nutrition dn
          ON dn.id =
             dnf.daily_nutrition_id

        WHERE dnf.daily_nutrition_id = ?
          AND dn.profile_id = ?

        ORDER BY
          dnf.sort_order ASC,
          dnf.created_at ASC;
      `,
      dailyNutritionId,
      profileId
    );

  return rows.map(
    mapDailyNutritionFood
  );
}


/*
 * ========================================
 * UPDATE DAILY FOOD
 * ========================================
 */

export async function updateDailyNutritionFood(
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
  const db = await getDatabase();

  const existing =
    await db.getFirstAsync<DailyNutritionFoodRow>(
      `
        SELECT dnf.*
        FROM daily_nutrition_foods dnf

        INNER JOIN daily_nutrition dn
          ON dn.id =
             dnf.daily_nutrition_id

        WHERE dnf.id = ?
          AND dn.profile_id = ?

        LIMIT 1;
      `,
      foodId,
      profileId
    );

  if (!existing) {
    return null;
  }

  const fields: string[] = [];

  const values: (
    | string
    | number
  )[] = [];

  if (
    updates.foodName !==
    undefined
  ) {
    const foodName =
      updates.foodName.trim();

    if (!foodName) {
      throw new Error(
        'FOOD_NAME_REQUIRED'
      );
    }

    fields.push(
      'food_name = ?'
    );

    values.push(
      foodName
    );
  }

  if (
    updates.quantity !==
    undefined
  ) {
    if (
      !Number.isFinite(
        updates.quantity
      ) ||
      updates.quantity <= 0
    ) {
      throw new Error(
        'INVALID_FOOD_QUANTITY'
      );
    }

    fields.push(
      'quantity = ?'
    );

    values.push(
      updates.quantity
    );
  }

  if (
    updates.unit !==
    undefined
  ) {
    fields.push(
      'unit = ?'
    );

    values.push(
      updates.unit
    );
  }

  if (
    updates.calories !==
    undefined
  ) {
    fields.push(
      'calories = ?'
    );

    values.push(
      updates.calories
    );
  }

  if (
    updates.protein !==
    undefined
  ) {
    fields.push(
      'protein = ?'
    );

    values.push(
      updates.protein
    );
  }

  if (
    updates.carbs !==
    undefined
  ) {
    fields.push(
      'carbs = ?'
    );

    values.push(
      updates.carbs
    );
  }

  if (
    updates.fat !==
    undefined
  ) {
    fields.push(
      'fat = ?'
    );

    values.push(
      updates.fat
    );
  }

  if (
    updates.sortOrder !==
    undefined
  ) {
    fields.push(
      'sort_order = ?'
    );

    values.push(
      updates.sortOrder
    );
  }

  if (fields.length === 0) {
    return mapDailyNutritionFood(
      existing
    );
  }

  const now =
    new Date().toISOString();

  fields.push(
    'updated_at = ?'
  );

  values.push(now);

  values.push(foodId);

  await db.runAsync(
    `
      UPDATE daily_nutrition_foods
      SET ${fields.join(', ')}
      WHERE id = ?;
    `,
    ...values
  );

  const updated =
    await db.getFirstAsync<DailyNutritionFoodRow>(
      `
        SELECT *
        FROM daily_nutrition_foods
        WHERE id = ?
        LIMIT 1;
      `,
      foodId
    );

  if (!updated) {
    return null;
  }

  return mapDailyNutritionFood(
    updated
  );
}


/*
 * ========================================
 * DELETE DAILY FOOD
 * ========================================
 */

export async function deleteDailyNutritionFood(
  profileId: string,
  foodId: string
): Promise<boolean> {
  const db = await getDatabase();

  const result =
    await db.runAsync(
      `
        DELETE FROM daily_nutrition_foods
        WHERE id = ?
          AND daily_nutrition_id IN (
            SELECT id
            FROM daily_nutrition
            WHERE profile_id = ?
          );
      `,
      foodId,
      profileId
    );

  return result.changes > 0;
}


/*
 * ========================================
 * CALCULATE TOTALS
 * ========================================
 */

export function calculateNutritionTotals(
  foods: DailyNutritionFood[]
): NutritionTotals {
  return foods.reduce(
    (
      totals,
      food
    ) => ({
      calories:
        totals.calories +
        food.calories,

      protein:
        totals.protein +
        food.protein,

      carbs:
        totals.carbs +
        food.carbs,

      fat:
        totals.fat +
        food.fat,
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  );
}


/*
 * ========================================
 * SET DAILY EVALUATION
 * ========================================
 */

export async function setDailyNutritionEvaluation(
  profileId: string,
  activityDate: string,
  evaluated: boolean,
  nutritionXP: number
): Promise<DailyNutrition | null> {
  const db = await getDatabase();

  const existing =
    await getDailyNutrition(
      profileId,
      activityDate
    );

  if (!existing) {
    return null;
  }

  const now =
    new Date().toISOString();

  await db.runAsync(
    `
      UPDATE daily_nutrition
      SET
        evaluated = ?,
        nutrition_xp = ?,
        updated_at = ?
      WHERE id = ?
        AND profile_id = ?;
    `,
    evaluated ? 1 : 0,
    Math.max(
      0,
      Math.floor(
        nutritionXP
      )
    ),
    now,
    existing.id,
    profileId
  );

  return getDailyNutrition(
    profileId,
    activityDate
  );
}