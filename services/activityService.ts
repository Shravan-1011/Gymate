import {
  getDailySteps,
  getOrCreateDailySteps,
  updateDailyStepCount,
  setStepEvaluation,

  createRunningSession,
  getRunningSessionById,
  getActiveRunningSession,
  updateRunningSession,
  getRunningHistory,

  ensureTodoSlots,
  getTodoSlots,

  ensureDailyTodo,
  getDailyTodos,
  updateDailyTodo,
  createDailyTodo,

} from '../database/activityRepository';

import {
  getTodayDeviceSteps,
  getPedometerStatus,
  requestPedometerPermission,
  subscribeToPedometer,
  type PedometerStatus,
  type PedometerPermissionState,
} from './pedometerService';

import {
  award10KStepsXP,
  awardRunningXP,
  awardTodoXP,
} from './xpService';

import {
  ACTIVITY_CONSTANTS,
} from '../types/activity';

import type {
  ActivityTodoSlot,
  DailyActivitySteps,
  DailyActivityTodo,
  RunLocationPoint,
  RunningSession,
} from '../types/activity';


/*
 * ========================================
 * DATE
 * ========================================
 */

export function getActivityDate(
  date = new Date()
): string {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      date.getDate()
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


/*
 * ======================================================================
 * STEPS
 * ======================================================================
 */


/*
 * ========================================
 * GET TODAY'S STEPS
 * ========================================
 */

export async function getTodaySteps(
  profileId: string
): Promise<
  DailyActivitySteps
> {

  return getOrCreateDailySteps(
    profileId,
    getActivityDate()
  );
}


/*
 * ========================================
 * SAVE TODAY'S STEPS
 * ========================================
 */

export async function saveTodayStepCount(
  profileId: string,
  stepCount: number
): Promise<
  DailyActivitySteps
> {

  return updateDailyStepCount(
    profileId,
    getActivityDate(),
    stepCount
  );
}


/*
 * ========================================
 * EVALUATE STEPS
 * ========================================
 *
 * 10,000+ = 100 XP
 * below 10,000 = 0 XP
 *
 * Existing XP service handles
 * duplicate protection.
 * ========================================
 */

export async function evaluateStepsForDate(
  profileId: string,
  activityDate: string
) {

  const steps =
    await getDailySteps(
      profileId,
      activityDate
    );


  if (!steps) {
    return null;
  }


  /*
   * Already evaluated.
   */

  if (steps.evaluated) {

    return {
      steps,

      xpAwarded:
        steps.stepsXP,

      alreadyEvaluated:
        true,

      alreadyAwarded:
        true,
    };
  }


  /*
   * Award through the existing
   * Gymate XP system.
   */

 const result =
  await award10KStepsXP(
    profileId,
    activityDate,
    steps.stepCount,
    steps.stepsXP
  );

const xpAwarded =
  result?.xpAwarded ??
  0;

const totalStepsXP =
  steps.stepsXP +
  xpAwarded;

const goalReached =
  steps.stepCount >=
  ACTIVITY_CONSTANTS.STEP_GOAL;

const updated =
  await setStepEvaluation(
    profileId,
    activityDate,
    goalReached,
    totalStepsXP
  );


  return {

    steps:
      updated ??
      steps,

    xpAwarded,

    alreadyEvaluated:
      false,

    alreadyAwarded:
      result?.alreadyAwarded ??
      false,

  };
}


/*
 * ========================================
 * EVALUATE TODAY'S STEPS
 * ========================================
 */

export async function evaluateTodaySteps(
  profileId: string
) {

  return evaluateStepsForDate(
    profileId,
    getActivityDate()
  );
}


/*
 * ======================================================================
 * RUNNING
 * ======================================================================
 */


/*
 * ========================================
 * START RUN
 * ========================================
 */

export async function startRun(
  profileId: string
): Promise<
  RunningSession
> {

  const active =
    await getActiveRunningSession(
      profileId
    );


  if (active) {

    throw new Error(
      'RUN_ALREADY_ACTIVE'
    );

  }


  return createRunningSession(
    profileId
  );
}


/*
 * ========================================
 * GET ACTIVE RUN
 * ========================================
 */

export async function getActiveRun(
  profileId: string
): Promise<
  RunningSession | null
> {

  return getActiveRunningSession(
    profileId
  );
}


/*
 * ========================================
 * ADD LOCATION POINT
 * ========================================
 */

export async function addRunLocationPoint(
  profileId: string,
  runningId: string,
  point: RunLocationPoint
): Promise<
  RunningSession | null
> {

  const run =
    await getRunningSessionById(
      profileId,
      runningId
    );


  if (!run) {
    return null;
  }


  if (
    run.status !== 'active'
  ) {

    return run;

  }


  const route = [
    ...run.route,
    point,
  ];


  return updateRunningSession(
    profileId,
    runningId,
    {
      route,
    }
  );
}


/*
 * ========================================
 * UPDATE RUN STATS
 * ========================================
 */

export async function updateRunStats(
  profileId: string,
  runningId: string,
  stats: {
    durationSeconds: number;

    distanceMeters: number;

    averagePaceSecondsPerKm:
      number | null;

    fastestPaceSecondsPerKm:
      number | null;
  }
): Promise<
  RunningSession | null
> {

  return updateRunningSession(
    profileId,
    runningId,
    stats
  );
}


/*
 * ========================================
 * PAUSE RUN
 * ========================================
 */

export async function pauseRun(
  profileId: string,
  runningId: string
): Promise<
  RunningSession | null
> {

  const run =
    await getRunningSessionById(
      profileId,
      runningId
    );


  if (!run) {
    return null;
  }


  if (
    run.status !== 'active'
  ) {
    return run;
  }


  return updateRunningSession(
    profileId,
    runningId,
    {
      status:
        'paused',
    }
  );
}


/*
 * ========================================
 * RESUME RUN
 * ========================================
 */

export async function resumeRun(
  profileId: string,
  runningId: string
): Promise<
  RunningSession | null
> {

  const run =
    await getRunningSessionById(
      profileId,
      runningId
    );


  if (!run) {
    return null;
  }


  if (
    run.status !== 'paused'
  ) {
    return run;
  }


  return updateRunningSession(
    profileId,
    runningId,
    {
      status:
        'active',
    }
  );
}


/*
 * ======================================================================
 * PEDOMETER
 * ======================================================================
 */

export async function getDevicePedometerStatus(): Promise<PedometerStatus> {
  return getPedometerStatus();
}


export async function requestDevicePedometerPermission(): Promise<PedometerPermissionState> {
  return requestPedometerPermission();
}


/*
 * ========================================
 * SYNC TODAY'S DEVICE STEPS
 * ========================================
 */

export async function syncTodayStepsFromDevice(
  profileId: string,
) {

  const steps =
    await getTodayDeviceSteps();


  return saveTodayStepCount(
    profileId,
    steps,
  );
}


/*
 * ========================================
 * SUBSCRIBE TO DEVICE STEPS
 * ========================================
 */

export async function subscribeToDeviceSteps(
  profileId: string,
  onStepsUpdated?: (
    steps: number
  ) => void,
) {

  return subscribeToPedometer(
    async () => {

      try {

        const steps =
          await getTodayDeviceSteps();


        await saveTodayStepCount(
          profileId,
          steps,
        );


        onStepsUpdated?.(
          steps
        );

      } catch (error) {

        console.error(
          'Failed to sync live step count:',
          error,
        );

      }

    }
  );
}


/*
 * ========================================
 * REFRESH TODAY'S STEPS
 * ========================================
 */

export async function refreshTodaySteps(
  profileId: string,
) {

  try {

    return await syncTodayStepsFromDevice(
      profileId,
    );

  } catch (error) {

    console.error(
      'Failed to refresh todays steps:',
      error,
    );

    return null;

  }
}


/*
 * ========================================
 * STEPS PROGRESS
 * ========================================
 */

export type StepsProgress = {
  stepCount: number;
  goal: number;
  progressPercent: number;
  remaining: number;
  goalReached: boolean;
  xp: number;
  evaluated: boolean;
};


export async function getTodayStepsProgress(
  profileId: string,
): Promise<StepsProgress> {

  const steps =
    await getTodaySteps(
      profileId
    );


  const goal =
    ACTIVITY_CONSTANTS.STEP_GOAL;


  const stepCount =
    Math.max(
      0,
      Math.floor(
        steps.stepCount
      ),
    );


  const progressPercent =
    Math.min(
      100,
      Math.floor(
        (stepCount / goal) *
        100
      ),
    );


  const remaining =
    Math.max(
      0,
      goal -
      stepCount,
    );


  /*
   * Steps XP is proportional to
   * the percentage of the goal.
   *
   * 5,000 / 10,000 = 50 XP
   * 7,500 / 10,000 = 75 XP
   * 10,000 / 10,000 = 100 XP
   */

  const xp =
    Math.min(
      ACTIVITY_CONSTANTS.STEP_XP,
      Math.floor(
        (
          stepCount /
          goal
        ) *
        ACTIVITY_CONSTANTS.STEP_XP
      ),
    );


  return {

    stepCount,

    goal,

    progressPercent,

    remaining,

    goalReached:
      stepCount >= goal,

    xp,

    evaluated:
      steps.evaluated,

  };
}


export async function evaluateTodayStepsXP(
  profileId: string,
) {

  return evaluateStepsForDate(
    profileId,
    getActivityDate(),
  );
}


/*
 * ======================================================================
 * FINISH RUN
 * ======================================================================
 */

export async function finishRun(
  profileId: string,
  runningId: string,
  stats: {
    durationSeconds: number;

    distanceMeters: number;

    averagePaceSecondsPerKm:
      number | null;

    fastestPaceSecondsPerKm:
      number | null;

    route?: RunLocationPoint[];
  }
): Promise<
  RunningSession | null
> {

  const now =
    new Date().toISOString();


  return updateRunningSession(
    profileId,
    runningId,
    {

      endedAt:
        now,

      durationSeconds:
        stats.durationSeconds,

      distanceMeters:
        stats.distanceMeters,

      averagePaceSecondsPerKm:
        stats.averagePaceSecondsPerKm,

      fastestPaceSecondsPerKm:
        stats.fastestPaceSecondsPerKm,

      route:
        stats.route,

      status:
        'completed',

    }
  );
}


/*
 * ======================================================================
 * EVALUATE RUN
 * ======================================================================
 */

export async function evaluateRun(
  profileId: string,
  runningId: string
) {

  const run =
    await getRunningSessionById(
      profileId,
      runningId
    );


  if (!run) {
    return null;
  }


  if (
    run.status !== 'completed'
  ) {

    return {

      run,

      xpAwarded:
        0,

      alreadyEvaluated:
        false,

      alreadyAwarded:
        false,

    };

  }


  /*
   * Already evaluated.
   */

  if (
    run.evaluated
  ) {

    return {

      run,

      xpAwarded:
        run.runningXP,

      alreadyEvaluated:
        true,

      alreadyAwarded:
        true,

    };

  }


  /*
   * Award 100 XP through the
   * existing XP system.
   */

  const result =
    await awardRunningXP(
      profileId,
      run.activityDate,
      true
    );


  const xpAwarded =
    result?.xpAwarded ??
    0;


  /*
   * Save evaluation.
   */

  const updated =
    await updateRunningSession(
      profileId,
      runningId,
      {

        runningXP:
          xpAwarded,

        evaluated:
          true,

      }
    );


  return {

    run:
      updated ??
      run,

    xpAwarded,

    alreadyEvaluated:
      false,

    alreadyAwarded:
      result?.alreadyAwarded ??
      false,

  };
}


/*
 * ======================================================================
 * RUN HISTORY
 * ======================================================================
 */

export async function getRunHistory(
  profileId: string,
  limit = 90
): Promise<
  RunningSession[]
> {

  return getRunningHistory(
    profileId,
    limit
  );
}


/*
 * ======================================================================
 * TODO
 * ======================================================================
 */


/*
 * ========================================
 * GET TODO SLOTS
 * ========================================
 */

export async function getActivityTodoSlots(
  profileId: string,
): Promise<ActivityTodoSlot[]> {

  return ensureTodoSlots(
    profileId
  );
}


/*
 * ========================================
 * GET TODAY'S TODOS
 * ========================================
 *
 * The repository currently exposes
 * ensureDailyTodo() for a SINGLE task.
 *
 * Therefore this function:
 *
 * 1. Checks for today's existing tasks.
 * 2. Ensures the persistent slots exist.
 * 3. Creates today's snapshot for each
 *    populated slot when necessary.
 * 4. Returns the complete daily list.
 * ========================================
 */

export async function getTodayTodos(
  profileId: string,
): Promise<DailyActivityTodo[]> {

  const activityDate =
    getActivityDate();


  /*
   * Get today's existing daily
   * TODO snapshots.
   */
  const existingTodos =
    await getDailyTodos(
      profileId,
      activityDate,
    );


  /*
   * If today's snapshots already
   * exist, return them.
   */
  if (
    existingTodos.length > 0
  ) {
    return existingTodos;
  }


  /*
   * Make sure the persistent TODO
   * slots exist.
   *
   * ActivityTodoSlot contains only
   * slot information, not the task
   * title, so we don't read a title
   * from it here.
   */
  await ensureTodoSlots(
    profileId,
  );


  /*
   * No daily snapshots exist yet.
   *
   * The existing repository API
   * handles creation of individual
   * daily TODOs when a title is
   * provided.
   *
   * Since there are no titles available
   * from ActivityTodoSlot, return the
   * current daily state.
   */
  return getDailyTodos(
    profileId,
    activityDate,
  );
}

/*
 * ========================================
 * EDIT TODAY'S TODO
 * ========================================
 */

export async function editTodayTodo(
  profileId: string,
  slotNumber: number,
  updates: {
    title?: string;
    completed?: boolean;
  },
): Promise<
  DailyActivityTodo | null
> {

  if (
    !Number.isInteger(
      slotNumber
    ) ||
    slotNumber < 1 ||
    slotNumber >
      ACTIVITY_CONSTANTS.TODO_MAX_SLOTS
  ) {

    throw new Error(
      'INVALID_TODO_SLOT',
    );

  }


  const nextUpdates: {
    title?: string;
    completed?: boolean;
  } = {};


  if (
    updates.title !== undefined
  ) {

    nextUpdates.title =
      updates.title.trim();

  }


  if (
    updates.completed !== undefined
  ) {

    nextUpdates.completed =
      updates.completed;

  }


  return updateDailyTodo(
    profileId,
    getActivityDate(),
    slotNumber,
    nextUpdates,
  );
}


/*
 * ========================================
 * CREATE TODAY'S TODO
 * ========================================
 */

export async function createTodayTodo(
  profileId: string,
  title: string,
): Promise<DailyActivityTodo> {

  const cleanTitle =
    title.trim();


  if (!cleanTitle) {

    throw new Error(
      'TODO_TITLE_REQUIRED',
    );

  }


  const todos =
    await getTodayTodos(
      profileId
    );


  const usedSlots =
    new Set(
      todos.map(
        todo =>
          todo.slotNumber
      )
    );


  let nextSlot =
    1;


  while (
    usedSlots.has(nextSlot) &&
    nextSlot <=
      ACTIVITY_CONSTANTS.TODO_MAX_SLOTS
  ) {

    nextSlot += 1;

  }


  if (
    nextSlot >
    ACTIVITY_CONSTANTS.TODO_MAX_SLOTS
  ) {

    throw new Error(
      'ALL_TODO_SLOTS_FILLED',
    );

  }


  return createDailyTodo(
    profileId,
    getActivityDate(),
    nextSlot,
    cleanTitle,
  );
}


/*
 * ======================================================================
 * TODO SUMMARY
 * ======================================================================
 */

export type TodayTodoSummary = {
  todos: DailyActivityTodo[];

  completed: number;

  populated: number;

  requiredSlots: number;

  remaining: number;

  allSlotsPopulated: boolean;

  completionPercent: number;

  xp: number;

  canEvaluate: boolean;

  evaluated: boolean;
};


export async function getTodayTodoSummary(
  profileId: string,
): Promise<TodayTodoSummary> {

  const todos =
    await getTodayTodos(
      profileId,
    );


  const requiredSlots =
    ACTIVITY_CONSTANTS
      .TODO_MAX_SLOTS;


  const populatedTodos =
    todos.filter(
      todo =>
        todo.title.trim().length > 0,
    );


  const completed =
    populatedTodos.filter(
      todo =>
        todo.completed,
    ).length;


  const populated =
    populatedTodos.length;


  const allSlotsPopulated =
    populated >=
    requiredSlots;


  const completionPercent =
    allSlotsPopulated
      ? Math.floor(
          (
            completed /
            requiredSlots
          ) *
          100,
        )
      : 0;


  let xp =
    0;


  if (
    allSlotsPopulated
  ) {

    if (
      completed >= 5
    ) {

      xp =
        ACTIVITY_CONSTANTS
          .TODO_ALL_XP;

    } else if (
      completed >= 3
    ) {

      xp =
        ACTIVITY_CONSTANTS
          .TODO_THREE_OR_FOUR_XP;

    }

  }


  return {

    todos,

    completed,

    populated,

    requiredSlots,

    remaining:
      Math.max(
        0,
        requiredSlots -
          completed,
      ),

    allSlotsPopulated,

    completionPercent,

    xp,

    canEvaluate:
      allSlotsPopulated &&
      completed >=
        ACTIVITY_CONSTANTS
          .TODO_MIN_FOR_XP,

    evaluated:
      todos.some(
        todo =>
          todo.completed
      ),

  };
}


/*
 * ========================================
 * GET TODO COMPLETION
 * ========================================
 */

export async function getTodayTodoCompletion(
  profileId: string,
): Promise<{
  completed: number;
  total: number;
}> {

  const summary =
    await getTodayTodoSummary(
      profileId,
    );


  return {

    completed:
      summary.completed,

    total:
      summary.populated,

  };
}


/*
 * ======================================================================
 * EVALUATE TODAY TODO XP
 * ======================================================================
 *
 * 0–2 completed = 0 XP
 * 3 completed   = 50 XP
 * 4 completed   = 50 XP
 * 5 completed   = 100 XP
 *
 * ALL 5 slots must contain tasks.
 * ======================================================================
 */

export async function evaluateTodayTodoXP(
  profileId: string,
) {

  const todos =
    await getTodayTodos(
      profileId,
    );


  const populatedTodos =
    todos.filter(
      todo =>
        todo.title.trim().length > 0,
    );


  const completed =
    populatedTodos.filter(
      todo =>
        todo.completed,
    ).length;


  const total =
    ACTIVITY_CONSTANTS
      .TODO_MAX_SLOTS;


  /*
   * Don't award XP if all five slots
   * are not populated.
   */

  if (
    populatedTodos.length <
    total
  ) {

    return {

      todos,

      completed,

      total:
        populatedTodos.length,

      requiredSlots:
        total,

      xpAwarded:
        0,

      incompleteSetup:
        true,

      alreadyAwarded:
        false,

    };

  }


  /*
   * 0–2 completed gives no XP.
   */

  if (
    completed <
    ACTIVITY_CONSTANTS
      .TODO_MIN_FOR_XP
  ) {

    return {

      todos,

      completed,

      total,

      requiredSlots:
        total,

      xpAwarded:
        0,

      incompleteSetup:
        false,

      alreadyAwarded:
        false,

    };

  }


  const result =
    await awardTodoXP(
      profileId,
      getActivityDate(),
      completed,
      total,
    );


  return {

    todos,

    completed,

    total,

    requiredSlots:
      total,

    xpAwarded:
      result?.xpAwarded ??
      0,

    incompleteSetup:
      false,

    alreadyAwarded:
      result?.alreadyAwarded ??
      false,

  };
}