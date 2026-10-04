import type { BuiltInFood } from '../data/foodDatabase';

export type CalculatedFoodNutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateFoodNutrition(
  food: BuiltInFood,
  quantity: number
): CalculatedFoodNutrition {
  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
  }

  const multiplier =
    quantity / food.baseQuantity;

  return {
    calories: round(
      food.calories * multiplier
    ),
    protein: round(
      food.protein * multiplier
    ),
    carbs: round(
      food.carbs * multiplier
    ),
    fat: round(
      food.fat * multiplier
    ),
  };
}