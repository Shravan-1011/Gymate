import { ActiveWorkout } from '../types/workout';

export function createWorkoutSession(
  splitId: string,
  name: string
): ActiveWorkout {
  return {
    id: `session-${Date.now()}`,
    splitId,
    name,
    startedAt: new Date().toISOString(),
    exercises: [],
  };
}