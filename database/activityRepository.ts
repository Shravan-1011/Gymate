import { getDatabase } from './database';

import type {
  ActivityTodoSlot,
  DailyActivitySteps,
  DailyActivityTodo,
  RunLocationPoint,
  RunningSession,
  RunningStatus,
} from '../types/activity';


/*
 * ========================================
 * DATABASE ROW TYPES
 * ========================================
 */

type DailyStepsRow = {
  id: string;

  profile_id: string;

  activity_date: string;

  step_count: number;

  evaluated: number;

  steps_xp: number;

  created_at: string;

  updated_at: string;
};


type RunningSessionRow = {
  id: string;

  profile_id: string;

  activity_date: string;

  started_at: string;

  ended_at: string | null;

  paused_at: string | null;

  total_paused_seconds: number;

  duration_seconds: number;

  distance_meters: number;

  average_pace_seconds_per_km:
    number | null;

  fastest_pace_seconds_per_km:
    number | null;

  status: string;

  running_xp: number;

  evaluated: number;

  route_json: string;

  created_at: string;

  updated_at: string;
};


type TodoSlotRow = {
  id: string;

  profile_id: string;

  slot_number: number;

  created_at: string;

  updated_at: string;
};


type DailyTodoRow = {
  id: string;

  profile_id: string;

  activity_date: string;

  slot_number: number;

  title: string;

  completed: number;

  created_at: string;

  updated_at: string;
};


/*
 * ========================================
 * ID HELPER
 * ========================================
 */

function createId(
  prefix: string
): string {

  return (
    `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`
  );
}


/*
 * ========================================
 * DATE HELPER
 * ========================================
 */

function getTodayDate(): string {

  const now =
    new Date();

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
 * STEPS MAPPER
 * ========================================
 */

function mapSteps(
  row: DailyStepsRow
): DailyActivitySteps {

  return {

    id:
      row.id,

    profileId:
      row.profile_id,

    activityDate:
      row.activity_date,

    stepCount:
      row.step_count,

    evaluated:
      row.evaluated === 1,

    stepsXP:
      row.steps_xp,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

  };
}


/*
 * ========================================
 * RUNNING MAPPER
 * ========================================
 */

function mapRunningSession(
  row: RunningSessionRow
): RunningSession {

  let route:
    RunLocationPoint[] = [];


  try {

    const parsed =
      JSON.parse(
        row.route_json
      );


    if (
      Array.isArray(parsed)
    ) {

      route =
        parsed;

    }

  } catch {

    route = [];

  }


  return {

    id:
      row.id,

    profileId:
      row.profile_id,

    activityDate:
      row.activity_date,

    startedAt:
      row.started_at,

    endedAt:
      row.ended_at,

    pausedAt:
      row.paused_at,

    totalPausedSeconds:
      row.total_paused_seconds,

    durationSeconds:
      row.duration_seconds,

    distanceMeters:
      row.distance_meters,

    averagePaceSecondsPerKm:
      row.average_pace_seconds_per_km,

    fastestPaceSecondsPerKm:
      row.fastest_pace_seconds_per_km,

    status:
      row.status as RunningStatus,

    runningXP:
      row.running_xp,

    evaluated:
      row.evaluated === 1,

    route,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

  };
}


/*
 * ========================================
 * TODO SLOT MAPPER
 * ========================================
 */

function mapTodoSlot(
  row: TodoSlotRow
): ActivityTodoSlot {

  return {

    id:
      row.id,

    profileId:
      row.profile_id,

    slotNumber:
      row.slot_number,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

  };
}


/*
 * ========================================
 * DAILY TODO MAPPER
 * ========================================
 */

function mapDailyTodo(
  row: DailyTodoRow
): DailyActivityTodo {

  return {

    id:
      row.id,

    profileId:
      row.profile_id,

    activityDate:
      row.activity_date,

    slotNumber:
      row.slot_number,

    title:
      row.title,

    completed:
      row.completed === 1,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

  };
}


/*
 * ======================================================================
 * STEPS
 * ======================================================================
 */


/*
 * ========================================
 * GET DAILY STEPS
 * ========================================
 */

export async function getDailySteps(
  profileId: string,
  activityDate: string
): Promise<
  DailyActivitySteps | null
> {

  const db =
    await getDatabase();


  const row =
    await db.getFirstAsync<DailyStepsRow>(
      `
        SELECT *
        FROM daily_activity_steps
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


  return mapSteps(
    row
  );
}


/*
 * ========================================
 * CREATE DAILY STEPS
 * ========================================
 */

export async function createDailySteps(
  profileId: string,
  activityDate: string
): Promise<
  DailyActivitySteps
> {

  const db =
    await getDatabase();


  const existing =
    await getDailySteps(
      profileId,
      activityDate
    );


  if (existing) {
    return existing;
  }


  const id =
    createId(
      'steps'
    );


  const now =
    new Date().toISOString();


  await db.runAsync(
    `
      INSERT INTO daily_activity_steps (
        id,
        profile_id,
        activity_date,
        step_count,
        evaluated,
        steps_xp,
        created_at,
        updated_at
      )
      VALUES (
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
    id,
    profileId,
    activityDate,
    now,
    now
  );


  const created =
    await getDailySteps(
      profileId,
      activityDate
    );


  if (!created) {
    throw new Error(
      'FAILED_TO_CREATE_DAILY_STEPS'
    );
  }


  return created;
}


/*
 * ========================================
 * GET OR CREATE DAILY STEPS
 * ========================================
 */

export async function getOrCreateDailySteps(
  profileId: string,
  activityDate: string
): Promise<
  DailyActivitySteps
> {

  const existing =
    await getDailySteps(
      profileId,
      activityDate
    );


  if (existing) {
    return existing;
  }


  return createDailySteps(
    profileId,
    activityDate
  );
}


/*
 * ========================================
 * UPDATE STEP COUNT
 * ========================================
 */

export async function updateDailyStepCount(
  profileId: string,
  activityDate: string,
  stepCount: number
): Promise<
  DailyActivitySteps
> {

  const db =
    await getDatabase();


  if (
    !Number.isFinite(
      stepCount
    ) ||
    stepCount < 0
  ) {

    throw new Error(
      'INVALID_STEP_COUNT'
    );

  }


  const daily =
    await getOrCreateDailySteps(
      profileId,
      activityDate
    );


  const now =
    new Date().toISOString();


  await db.runAsync(
    `
      UPDATE daily_activity_steps
      SET
        step_count = ?,
        updated_at = ?
      WHERE
        id = ?
        AND profile_id = ?;
    `,
    Math.floor(stepCount),
    now,
    daily.id,
    profileId
  );


  const updated =
    await getDailySteps(
      profileId,
      activityDate
    );


  if (!updated) {
    throw new Error(
      'FAILED_TO_UPDATE_DAILY_STEPS'
    );
  }


  return updated;
}


/*
 * ========================================
 * SET STEP EVALUATION
 * ========================================
 */

export async function setStepEvaluation(
  profileId: string,
  activityDate: string,
  evaluated: boolean,
  stepsXP: number
): Promise<
  DailyActivitySteps | null
> {

  const db =
    await getDatabase();


  const now =
    new Date().toISOString();


  await db.runAsync(
    `
      UPDATE daily_activity_steps
      SET
        evaluated = ?,
        steps_xp = ?,
        updated_at = ?
      WHERE
        profile_id = ?
        AND activity_date = ?;
    `,
    evaluated ? 1 : 0,
    Math.max(
      0,
      Math.floor(stepsXP)
    ),
    now,
    profileId,
    activityDate
  );


  return getDailySteps(
    profileId,
    activityDate
  );
}


/*
 * ========================================
 * GET STEP HISTORY
 * ========================================
 */

export async function getStepHistory(
  profileId: string,
  limit = 90
): Promise<
  DailyActivitySteps[]
> {

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
    await db.getAllAsync<DailyStepsRow>(
      `
        SELECT *
        FROM daily_activity_steps
        WHERE profile_id = ?
        ORDER BY activity_date DESC
        LIMIT ${safeLimit};
      `,
      profileId
    );


  return rows.map(
    mapSteps
  );
}


/*
 * ======================================================================
 * RUNNING
 * ======================================================================
 */


/*
 * ========================================
 * CREATE RUN
 * ========================================
 */

export async function createRunningSession(
  profileId: string,
  startedAt:
    string = new Date().toISOString()
): Promise<RunningSession> {

  const db =
    await getDatabase();


  const id =
    createId(
      'run'
    );


  const activityDate =
    startedAt.substring(
      0,
      10
    );


  const now =
    new Date().toISOString();


  await db.runAsync(
    `
      INSERT INTO running_sessions (
        id,
        profile_id,
        activity_date,
        started_at,
        ended_at,
        paused_at,
        total_paused_seconds,
        duration_seconds,
        distance_meters,
        average_pace_seconds_per_km,
        fastest_pace_seconds_per_km,
        status,
        running_xp,
        evaluated,
        route_json,
        created_at,
        updated_at
      )
      VALUES (
        ?,
        ?,
        ?,
        ?,
        NULL,
        NULL,
        0,
        0,
        0,
        NULL,
        NULL,
        'active',
        0,
        0,
        '[]',
        ?,
        ?
      );
    `,
    id,
    profileId,
    activityDate,
    startedAt,
    now,
    now
  );


  const created =
    await getRunningSessionById(
      profileId,
      id
    );


  if (!created) {
    throw new Error(
      'FAILED_TO_CREATE_RUNNING_SESSION'
    );
  }


  return created;
}


/*
 * ========================================
 * GET RUN BY ID
 * ========================================
 */

export async function getRunningSessionById(
  profileId: string,
  runningId: string
): Promise<
  RunningSession | null
> {

  const db =
    await getDatabase();


  const row =
    await db.getFirstAsync<RunningSessionRow>(
      `
        SELECT *
        FROM running_sessions
        WHERE profile_id = ?
        AND id = ?
        LIMIT 1;
      `,
      profileId,
      runningId
    );


  if (!row) {
    return null;
  }


  return mapRunningSession(
    row
  );
}


/*
 * ========================================
 * GET ACTIVE RUN
 * ========================================
 */

export async function getActiveRunningSession(
  profileId: string
): Promise<
  RunningSession | null
> {

  const db =
    await getDatabase();


  const row =
    await db.getFirstAsync<RunningSessionRow>(
      `
        SELECT *
        FROM running_sessions
        WHERE profile_id = ?
        AND status IN ('active', 'paused')
        ORDER BY created_at DESC
        LIMIT 1;
      `,
      profileId
    );


  if (!row) {
    return null;
  }


  return mapRunningSession(
    row
  );
}


/*
 * ========================================
 * GET ANY ACTIVE RUN
 * ========================================
 */

export async function getAnyActiveRunningSession():
  Promise<
    RunningSession | null
  > {

  const db =
    await getDatabase();


  const row =
    await db.getFirstAsync<RunningSessionRow>(
      `
        SELECT *
        FROM running_sessions
        WHERE status IN ('active', 'paused')
        ORDER BY created_at DESC
        LIMIT 1;
      `
    );


  if (!row) {
    return null;
  }


  return mapRunningSession(
    row
  );
}


/*
 * ========================================
 * UPDATE RUN
 * ========================================
 */

export async function updateRunningSession(
  profileId: string,
  runningId: string,
  updates: {
    endedAt?: string | null;

    pausedAt?: string | null;

    totalPausedSeconds?: number;

    durationSeconds?: number;

    distanceMeters?: number;

    averagePaceSecondsPerKm?:
      number | null;

    fastestPaceSecondsPerKm?:
      number | null;

    status?: RunningStatus;

    runningXP?: number;

    evaluated?: boolean;

    route?: RunLocationPoint[];
  }
): Promise<
  RunningSession | null
> {

  const db =
    await getDatabase();


  const existing =
    await getRunningSessionById(
      profileId,
      runningId
    );


  if (!existing) {
    return null;
  }


  const now =
    new Date().toISOString();


  const endedAt =
    updates.endedAt !== undefined
      ? updates.endedAt
      : existing.endedAt;


  const pausedAt =
    updates.pausedAt !== undefined
      ? updates.pausedAt
      : existing.pausedAt;


  const totalPausedSeconds =
    updates.totalPausedSeconds !== undefined
      ? Math.max(
          0,
          Math.floor(
            updates.totalPausedSeconds
          )
        )
      : existing.totalPausedSeconds;


  const durationSeconds =
    updates.durationSeconds !== undefined
      ? Math.max(
          0,
          Math.floor(
            updates.durationSeconds
          )
        )
      : existing.durationSeconds;


  const distanceMeters =
    updates.distanceMeters !== undefined
      ? Math.max(
          0,
          updates.distanceMeters
        )
      : existing.distanceMeters;


  const averagePace =
    updates.averagePaceSecondsPerKm !== undefined
      ? updates.averagePaceSecondsPerKm
      : existing.averagePaceSecondsPerKm;


  const fastestPace =
    updates.fastestPaceSecondsPerKm !== undefined
      ? updates.fastestPaceSecondsPerKm
      : existing.fastestPaceSecondsPerKm;


  const status =
    updates.status !== undefined
      ? updates.status
      : existing.status;


  const runningXP =
    updates.runningXP !== undefined
      ? Math.max(
          0,
          Math.floor(
            updates.runningXP
          )
        )
      : existing.runningXP;


  const evaluated =
    updates.evaluated !== undefined
      ? updates.evaluated
      : existing.evaluated;


  const routeJson =
    updates.route !== undefined
      ? JSON.stringify(
          updates.route
        )
      : JSON.stringify(
          existing.route
        );


  await db.runAsync(
    `
      UPDATE running_sessions
      SET
        ended_at = ?,
        paused_at = ?,
        total_paused_seconds = ?,
        duration_seconds = ?,
        distance_meters = ?,
        average_pace_seconds_per_km = ?,
        fastest_pace_seconds_per_km = ?,
        status = ?,
        running_xp = ?,
        evaluated = ?,
        route_json = ?,
        updated_at = ?
      WHERE
        id = ?
        AND profile_id = ?;
    `,
    endedAt,
    pausedAt,
    totalPausedSeconds,
    durationSeconds,
    distanceMeters,
    averagePace,
    fastestPace,
    status,
    runningXP,
    evaluated ? 1 : 0,
    routeJson,
    now,
    runningId,
    profileId
  );


  return getRunningSessionById(
    profileId,
    runningId
  );
}


/*
 * ========================================
 * DELETE RUN
 * ========================================
 */

export async function deleteRunningSession(
  profileId: string,
  runningId: string
): Promise<void> {

  const db =
    await getDatabase();


  await db.runAsync(
    `
      DELETE FROM running_sessions
      WHERE
        profile_id = ?
        AND id = ?;
    `,
    profileId,
    runningId
  );
}


/*
 * ========================================
 * RUN HISTORY
 * ========================================
 */

export async function getRunningHistory(
  profileId: string,
  limit = 90
): Promise<
  RunningSession[]
> {

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
    await db.getAllAsync<RunningSessionRow>(
      `
        SELECT *
        FROM running_sessions
        WHERE profile_id = ?
        AND status = 'completed'
        ORDER BY started_at DESC
        LIMIT ${safeLimit};
      `,
      profileId
    );


  return rows.map(
    mapRunningSession
  );
}


/*
 * ======================================================================
 * TODO SLOTS
 * ======================================================================
 */


/*
 * ========================================
 * GET TODO SLOTS
 * ========================================
 */

export async function getTodoSlots(
  profileId: string
): Promise<
  ActivityTodoSlot[]
> {

  const db =
    await getDatabase();


  const rows =
    await db.getAllAsync<TodoSlotRow>(
      `
        SELECT *
        FROM activity_todo_slots
        WHERE profile_id = ?
        ORDER BY slot_number ASC;
      `,
      profileId
    );


  return rows.map(
    mapTodoSlot
  );
}


/*
 * ========================================
 * ENSURE TODO SLOTS
 * ========================================
 *
 * Creates missing persistent slots.
 *
 * It does NOT create daily tasks.
 * ========================================
 */

export async function ensureTodoSlots(
  profileId: string
): Promise<
  ActivityTodoSlot[]
> {

  const db =
    await getDatabase();


  const existing =
    await getTodoSlots(
      profileId
    );


  const existingNumbers =
    new Set(
      existing.map(
        slot =>
          slot.slotNumber
      )
    );


  const now =
    new Date().toISOString();


  for (
    let slotNumber = 1;
    slotNumber <= 5;
    slotNumber++
  ) {

    if (
      existingNumbers.has(
        slotNumber
      )
    ) {
      continue;
    }


    await db.runAsync(
      `
        INSERT INTO activity_todo_slots (
          id,
          profile_id,
          slot_number,
          created_at,
          updated_at
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?
        );
      `,
      createId(
        'todo-slot'
      ),
      profileId,
      slotNumber,
      now,
      now
    );
  }


  return getTodoSlots(
    profileId
  );
}


/*
 * ========================================
 * UPDATE TODO SLOT
 * ========================================
 */

export async function updateTodoSlot(
  profileId: string,
  slotNumber: number
): Promise<
  ActivityTodoSlot | null
> {

  const db =
    await getDatabase();


  const now =
    new Date().toISOString();


  await db.runAsync(
    `
      UPDATE activity_todo_slots
      SET
        updated_at = ?
      WHERE
        profile_id = ?
        AND slot_number = ?;
    `,
    now,
    profileId,
    slotNumber
  );


  const row =
    await db.getFirstAsync<TodoSlotRow>(
      `
        SELECT *
        FROM activity_todo_slots
        WHERE profile_id = ?
        AND slot_number = ?
        LIMIT 1;
      `,
      profileId,
      slotNumber
    );


  if (!row) {
    return null;
  }


  return mapTodoSlot(
    row
  );
}


/*
 * ========================================
 * GET DAILY TODOS
 * ========================================
 */

export async function getDailyTodos(
  profileId: string,
  activityDate: string
): Promise<
  DailyActivityTodo[]
> {

  const db =
    await getDatabase();


  const rows =
    await db.getAllAsync<DailyTodoRow>(
      `
        SELECT *
        FROM daily_activity_todos
        WHERE profile_id = ?
        AND activity_date = ?
        ORDER BY slot_number ASC;
      `,
      profileId,
      activityDate
    );


  return rows.map(
    mapDailyTodo
  );
}


/*
 * ========================================
 * GET DAILY TODO
 * ========================================
 */

export async function getDailyTodo(
  profileId: string,
  activityDate: string,
  slotNumber: number
): Promise<
  DailyActivityTodo | null
> {

  const db =
    await getDatabase();


  const row =
    await db.getFirstAsync<DailyTodoRow>(
      `
        SELECT *
        FROM daily_activity_todos
        WHERE profile_id = ?
        AND activity_date = ?
        AND slot_number = ?
        LIMIT 1;
      `,
      profileId,
      activityDate,
      slotNumber
    );


  if (!row) {
    return null;
  }


  return mapDailyTodo(
    row
  );
}


/*
 * ========================================
 * CREATE DAILY TODO
 * ========================================
 */

export async function createDailyTodo(
  profileId: string,
  activityDate: string,
  slotNumber: number,
  title: string
): Promise<
  DailyActivityTodo
> {

  const db =
    await getDatabase();


  const existing =
    await getDailyTodo(
      profileId,
      activityDate,
      slotNumber
    );


  if (existing) {
    return existing;
  }


  const now =
    new Date().toISOString();


  await db.runAsync(
    `
      INSERT INTO daily_activity_todos (
        id,
        profile_id,
        activity_date,
        slot_number,
        title,
        completed,
        created_at,
        updated_at
      )
      VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        0,
        ?,
        ?
      );
    `,
    createId(
      'daily-todo'
    ),
    profileId,
    activityDate,
    slotNumber,
    title,
    now,
    now
  );


  const created =
    await getDailyTodo(
      profileId,
      activityDate,
      slotNumber
    );


  if (!created) {
    throw new Error(
      'FAILED_TO_CREATE_DAILY_TODO'
    );
  }


  return created;
}


/*
 * ========================================
 * UPDATE DAILY TODO
 * ========================================
 */

export async function updateDailyTodo(
  profileId: string,
  activityDate: string,
  slotNumber: number,
  updates: {
    title?: string;

    completed?: boolean;
  }
): Promise<
  DailyActivityTodo | null
> {

  const db =
    await getDatabase();


  const existing =
    await getDailyTodo(
      profileId,
      activityDate,
      slotNumber
    );


  if (!existing) {
    return null;
  }


  const title =
    updates.title !== undefined
      ? updates.title
      : existing.title;


  const completed =
    updates.completed !== undefined
      ? updates.completed
      : existing.completed;


  const now =
    new Date().toISOString();


  await db.runAsync(
    `
      UPDATE daily_activity_todos
      SET
        title = ?,
        completed = ?,
        updated_at = ?
      WHERE
        profile_id = ?
        AND activity_date = ?
        AND slot_number = ?;
    `,
    title,
    completed ? 1 : 0,
    now,
    profileId,
    activityDate,
    slotNumber
  );


  return getDailyTodo(
    profileId,
    activityDate,
    slotNumber
  );
}


/*
 * ========================================
 * DELETE DAILY TODO
 * ========================================
 */

export async function deleteDailyTodo(
  profileId: string,
  activityDate: string,
  slotNumber: number
): Promise<void> {

  const db =
    await getDatabase();


  await db.runAsync(
    `
      DELETE FROM daily_activity_todos
      WHERE
        profile_id = ?
        AND activity_date = ?
        AND slot_number = ?;
    `,
    profileId,
    activityDate,
    slotNumber
  );
}


/*
 * ========================================
 * GET TODO HISTORY
 * ========================================
 */

export async function getTodoHistory(
  profileId: string,
  limit = 90
): Promise<
  DailyActivityTodo[]
> {

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
    await db.getAllAsync<DailyTodoRow>(
      `
        SELECT *
        FROM daily_activity_todos
        WHERE profile_id = ?
        ORDER BY activity_date DESC,
                 slot_number ASC
        LIMIT ${safeLimit * 5};
      `,
      profileId
    );


  return rows.map(
    mapDailyTodo
  );
}


/*
 * ========================================
 * ENSURE DAILY TODO
 * ========================================
 */

export async function ensureDailyTodo(
  profileId: string,
  activityDate: string,
  slotNumber: number,
  title: string
): Promise<
  DailyActivityTodo
> {

  const existing =
    await getDailyTodo(
      profileId,
      activityDate,
      slotNumber
    );


  if (existing) {
    return existing;
  }


  return createDailyTodo(
    profileId,
    activityDate,
    slotNumber,
    title
  );
}


/*
 * ========================================
 * GET TODAY DATE
 * ========================================
 */

export function getActivityTodayDate(): string {
  return getTodayDate();
}