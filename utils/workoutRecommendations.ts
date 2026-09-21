import { exercises } from '../data/exercises';
import { Exercise, WorkoutSplit } from '../types/workout';

export function getRecommendedExercises(
  split: WorkoutSplit
): Exercise[] {
  if (split.recommendedExerciseIds.length === 0) {
    return [];
  }

  return split.recommendedExerciseIds
    .map((exerciseId: string) =>
      exercises.find(
        (exercise: Exercise) => exercise.id === exerciseId
      )
    )
    .filter(
      (exercise): exercise is Exercise =>
        exercise !== undefined
    );
}