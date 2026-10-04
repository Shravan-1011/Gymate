import type { FoodUnit } from '../types/diet';

export type FoodCategory =
  | 'PROTEIN'
  | 'CARBS'
  | 'FRUIT'
  | 'DAIRY'
  | 'INDIAN'
  | 'FATS'
  | 'OTHER';

export type BuiltInFood = {
  id: string;
  name: string;
  category: FoodCategory;

  /*
   * Nutrition represented by this base quantity.
   *
   * Example:
   * 100g chicken breast = 165 kcal, 31g protein
   */
  baseQuantity: number;
  unit: FoodUnit;

  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const FOOD_DATABASE: BuiltInFood[] = [
  // ========================================
  // PROTEIN
  // ========================================

  {
    id: 'chicken-breast-cooked',
    name: 'Chicken Breast (cooked)',
    category: 'PROTEIN',
    baseQuantity: 100,
    unit: 'g',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },

  {
    id: 'chicken-breast-raw',
    name: 'Chicken Breast (raw)',
    category: 'PROTEIN',
    baseQuantity: 100,
    unit: 'g',
    calories: 120,
    protein: 22.5,
    carbs: 0,
    fat: 2.6,
  },

  {
    id: 'chicken-thigh-cooked',
    name: 'Chicken Thigh (cooked)',
    category: 'PROTEIN',
    baseQuantity: 100,
    unit: 'g',
    calories: 209,
    protein: 26,
    carbs: 0,
    fat: 10.9,
  },

  {
    id: 'egg',
    name: 'Egg',
    category: 'PROTEIN',
    baseQuantity: 1,
    unit: 'piece',
    calories: 72,
    protein: 6.3,
    carbs: 0.4,
    fat: 4.8,
  },

  {
    id: 'egg-white',
    name: 'Egg White',
    category: 'PROTEIN',
    baseQuantity: 1,
    unit: 'piece',
    calories: 17,
    protein: 3.6,
    carbs: 0.2,
    fat: 0.1,
  },

  {
    id: 'soya-chunks-dry',
    name: 'Soya Chunks (dry)',
    category: 'PROTEIN',
    baseQuantity: 100,
    unit: 'g',
    calories: 345,
    protein: 52,
    carbs: 33,
    fat: 0.5,
  },

  {
    id: 'whey-protein',
    name: 'Whey Protein',
    category: 'PROTEIN',
    baseQuantity: 1,
    unit: 'scoop',
    calories: 120,
    protein: 24,
    carbs: 3,
    fat: 2,
  },

  // ========================================
  // DAIRY
  // ========================================

  {
    id: 'milk',
    name: 'Milk',
    category: 'DAIRY',
    baseQuantity: 100,
    unit: 'ml',
    calories: 61,
    protein: 3.2,
    carbs: 4.8,
    fat: 3.3,
  },

  {
    id: 'curd',
    name: 'Curd',
    category: 'DAIRY',
    baseQuantity: 100,
    unit: 'g',
    calories: 61,
    protein: 3.5,
    carbs: 4.7,
    fat: 3.3,
  },

  {
    id: 'greek-yogurt',
    name: 'Greek Yogurt',
    category: 'DAIRY',
    baseQuantity: 100,
    unit: 'g',
    calories: 59,
    protein: 10,
    carbs: 3.6,
    fat: 0.4,
  },

  {
    id: 'paneer',
    name: 'Paneer',
    category: 'DAIRY',
    baseQuantity: 100,
    unit: 'g',
    calories: 265,
    protein: 18.3,
    carbs: 6.1,
    fat: 20.8,
  },

  // ========================================
  // CARBS
  // ========================================

  {
    id: 'rice-white-cooked',
    name: 'White Rice (cooked)',
    category: 'CARBS',
    baseQuantity: 100,
    unit: 'g',
    calories: 130,
    protein: 2.7,
    carbs: 28.2,
    fat: 0.3,
  },

  {
    id: 'rice-brown-cooked',
    name: 'Brown Rice (cooked)',
    category: 'CARBS',
    baseQuantity: 100,
    unit: 'g',
    calories: 123,
    protein: 2.7,
    carbs: 25.6,
    fat: 1,
  },

  {
    id: 'oats',
    name: 'Oats (dry)',
    category: 'CARBS',
    baseQuantity: 100,
    unit: 'g',
    calories: 389,
    protein: 16.9,
    carbs: 66.3,
    fat: 6.9,
  },

  {
    id: 'roti',
    name: 'Roti / Chapati',
    category: 'CARBS',
    baseQuantity: 1,
    unit: 'piece',
    calories: 100,
    protein: 3,
    carbs: 18,
    fat: 2,
  },

  {
    id: 'potato',
    name: 'Potato (boiled)',
    category: 'CARBS',
    baseQuantity: 100,
    unit: 'g',
    calories: 87,
    protein: 1.9,
    carbs: 20.1,
    fat: 0.1,
  },

  {
    id: 'sweet-potato',
    name: 'Sweet Potato',
    category: 'CARBS',
    baseQuantity: 100,
    unit: 'g',
    calories: 86,
    protein: 1.6,
    carbs: 20.1,
    fat: 0.1,
  },

  // ========================================
  // FRUIT
  // ========================================

  {
    id: 'banana',
    name: 'Banana',
    category: 'FRUIT',
    baseQuantity: 1,
    unit: 'piece',
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
  },

  {
    id: 'apple',
    name: 'Apple',
    category: 'FRUIT',
    baseQuantity: 1,
    unit: 'piece',
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
  },

  // ========================================
  // INDIAN
  // ========================================

  {
    id: 'dal-cooked',
    name: 'Dal (cooked)',
    category: 'INDIAN',
    baseQuantity: 100,
    unit: 'g',
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
  },

  {
    id: 'rajma-cooked',
    name: 'Rajma (cooked)',
    category: 'INDIAN',
    baseQuantity: 100,
    unit: 'g',
    calories: 127,
    protein: 8.7,
    carbs: 22.8,
    fat: 0.5,
  },

  {
    id: 'chana-cooked',
    name: 'Chana (cooked)',
    category: 'INDIAN',
    baseQuantity: 100,
    unit: 'g',
    calories: 164,
    protein: 8.9,
    carbs: 27.4,
    fat: 2.6,
  },

  {
    id: 'poha',
    name: 'Poha',
    category: 'INDIAN',
    baseQuantity: 100,
    unit: 'g',
    calories: 180,
    protein: 3.5,
    carbs: 30,
    fat: 5,
  },

  {
    id: 'idli',
    name: 'Idli',
    category: 'INDIAN',
    baseQuantity: 1,
    unit: 'piece',
    calories: 58,
    protein: 2,
    carbs: 12,
    fat: 0.3,
  },

  {
    id: 'dosa',
    name: 'Dosa',
    category: 'INDIAN',
    baseQuantity: 1,
    unit: 'piece',
    calories: 168,
    protein: 4,
    carbs: 28,
    fat: 5,
  },

  // ========================================
  // FATS
  // ========================================

  {
    id: 'peanut-butter',
    name: 'Peanut Butter',
    category: 'FATS',
    baseQuantity: 1,
    unit: 'tbsp',
    calories: 94,
    protein: 4,
    carbs: 3.2,
    fat: 8,
  },

  {
    id: 'peanuts',
    name: 'Peanuts',
    category: 'FATS',
    baseQuantity: 100,
    unit: 'g',
    calories: 567,
    protein: 25.8,
    carbs: 16.1,
    fat: 49.2,
  },

  {
    id: 'almonds',
    name: 'Almonds',
    category: 'FATS',
    baseQuantity: 100,
    unit: 'g',
    calories: 579,
    protein: 21.2,
    carbs: 21.6,
    fat: 49.9,
  },

  {
    id: 'cashews',
    name: 'Cashews',
    category: 'FATS',
    baseQuantity: 100,
    unit: 'g',
    calories: 553,
    protein: 18.2,
    carbs: 30.2,
    fat: 43.8,
  },

  {
    id: 'cooking-oil',
    name: 'Cooking Oil',
    category: 'FATS',
    baseQuantity: 1,
    unit: 'tbsp',
    calories: 119,
    protein: 0,
    carbs: 0,
    fat: 13.5,
  },
];