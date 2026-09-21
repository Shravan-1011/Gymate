/*
 * ========================================
 * GYMATE ACTIVITY TYPES
 * ========================================
 *
 * Activity V1 contains:
 *
 *   1. Steps
 *   2. Running
 *   3. Daily To-Do
 *
 * ========================================
 */


/*
 * ========================================
 * ACTIVITY TYPE
 * ========================================
 */

export type ActivityType =
  | 'steps'
  | 'running'
  | 'todo';


/*
 * ========================================
 * GPS LOCATION POINT
 * ========================================
 *
 * A single point recorded during a run.
 * ========================================
 */

export type RunLocationPoint = {
  latitude: number;

  longitude: number;

  timestamp: string;

  altitude?: number | null;

  accuracy?: number | null;

  speed?: number | null;
};


/*
 * ========================================
 * DAILY STEPS
 * ========================================
 */

export type DailyActivitySteps = {
  id: string;

  profileId: string;

  activityDate: string;

  stepCount: number;

  evaluated: boolean;

  stepsXP: number;

  createdAt: string;

  updatedAt: string;
};


/*
 * ========================================
 * RUN STATUS
 * ========================================
 */

export type RunningStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';


/*
 * ========================================
 * RUNNING SESSION
 * ========================================
 */

export type RunningSession = {
  id: string;

  profileId: string;

  activityDate: string;

  startedAt: string;

  endedAt: string | null;

  /*
   * Timestamp at which the CURRENT pause
   * began.
   *
   * null while the run is active.
   */
  pausedAt: string | null;

  /*
   * Total accumulated pause time from
   * all completed pauses.
   */
  totalPausedSeconds: number;

  durationSeconds: number;

  distanceMeters: number;

  averagePaceSecondsPerKm: number | null;

  fastestPaceSecondsPerKm: number | null;

  status: RunningStatus;

  runningXP: number;

  evaluated: boolean;

  route: RunLocationPoint[];

  createdAt: string;

  updatedAt: string;
};


/*
 * ========================================
 * TODO SLOT
 * ========================================
 *
 * These are the five persistent slots.
 *
 * Example:
 *
 *   Slot 1 = Running
 *   Slot 2 = Study
 *   Slot 3 = Reading
 *
 * They persist across days.
 * ========================================
 */

export type ActivityTodoSlot = {
  id: string;

  profileId: string;

  slotNumber: number;

  createdAt: string;

  updatedAt: string;
};


/*
 * ========================================
 * DAILY TODO
 * ========================================
 *
 * This is the daily snapshot.
 *
 * Changing tomorrow's task does NOT
 * change yesterday's task.
 * ========================================
 */

export type DailyActivityTodo = {
  id: string;

  profileId: string;

  activityDate: string;

  slotNumber: number;

  title: string;

  completed: boolean;

  createdAt: string;

  updatedAt: string;
};


/*
 * ========================================
 * ACTIVITY TODO SUMMARY
 * ========================================
 */

export type ActivityTodoSummary = {
  completedCount: number;

  totalCount: number;

  xp: number;
};


/*
 * ========================================
 * ACTIVITY DAY SUMMARY
 * ========================================
 */

export type ActivityDaySummary = {
  activityDate: string;

  steps: DailyActivitySteps | null;

  runs: RunningSession[];

  todos: DailyActivityTodo[];

  stepXP: number;

  runningXP: number;

  todoXP: number;

  totalXP: number;
};


/*
 * ========================================
 * CONSTANTS
 * ========================================
 */

export const ACTIVITY_CONSTANTS = {

  /*
   * Steps
   */

  STEP_GOAL:
    10_000,

  STEP_XP:
    100,


  /*
   * To-do
   */

  TODO_MAX_SLOTS:
    5,

  TODO_MIN_FOR_XP:
    3,

  TODO_THREE_OR_FOUR_XP:
    50,

  TODO_ALL_XP:
    100,


  /*
   * Running
   */

  RUNNING_XP:
    100,

} as const;