import { getDatabase } from './database';

/*
 * ========================================
 * CONSTANTS
 * ========================================
 */

export const XP_PER_LEVEL = 500;


/*
 * ========================================
 * XP SOURCES
 * ========================================
 *
 * These are the only sources that can
 * generate XP in Gymate.
 * ========================================
 */

export const XP_SOURCE = {
  WORKOUT: 'workout',

  NUTRITION: 'nutrition',

  RUNNING: 'running',

  STEPS: 'steps',

  TODO: 'todo',

  STREAK: 'streak',
} as const;

export type XPSource =
  (typeof XP_SOURCE)[keyof typeof XP_SOURCE];


/*
 * ========================================
 * QUALIFYING ACTIVITY SOURCES
 * ========================================
 *
 * These sources keep the daily streak
 * alive.
 *
 * STREAK itself is NOT included.
 * ========================================
 */

export const STREAK_ACTIVITY_SOURCES = [
  XP_SOURCE.WORKOUT,

  XP_SOURCE.NUTRITION,

  XP_SOURCE.RUNNING,

  XP_SOURCE.STEPS,

  XP_SOURCE.TODO,
] as const;


/*
 * ========================================
 * PROFILE PROGRESSION TYPE
 * ========================================
 */

export type ProfileProgression = {
  profileId: string;

  totalXP: number;

  currentStreak: number;

  longestStreak: number;

  lastActivityDate: string | null;

  createdAt: string;

  updatedAt: string;
};


/*
 * ========================================
 * DATABASE ROW TYPE
 * ========================================
 */

type ProfileProgressionRow = {
  profile_id: string;

  total_xp: number;

  current_streak: number;

  longest_streak: number;

  last_activity_date: string | null;

  created_at: string;

  updated_at: string;
};


/*
 * ========================================
 * ROW → PROGRESSION
 * ========================================
 */

function mapProgression(
  row: ProfileProgressionRow
): ProfileProgression {
  return {
    profileId:
      row.profile_id,

    totalXP:
      row.total_xp,

    currentStreak:
      row.current_streak,

    longestStreak:
      row.longest_streak,

    lastActivityDate:
      row.last_activity_date,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}


/*
 * ========================================
 * DATE HELPERS
 * ========================================
 *
 * Gymate streaks use LOCAL calendar dates.
 *
 * Format:
 *
 *   YYYY-MM-DD
 * ========================================
 */

export function getTodayDate(): string {
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
 * GET YESTERDAY
 * ========================================
 */

export function getYesterdayDate(): string {
  const date =
    new Date();

  date.setDate(
    date.getDate() - 1
  );

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
 * ========================================
 * DATE DIFFERENCE
 * ========================================
 */

export function getDateDifferenceInDays(
  olderDate: string,
  newerDate: string
): number {
  const older =
    new Date(
      `${olderDate}T00:00:00`
    );

  const newer =
    new Date(
      `${newerDate}T00:00:00`
    );

  const difference =
    newer.getTime() -
    older.getTime();

  return Math.round(
    difference /
      (1000 * 60 * 60 * 24)
  );
}


/*
 * ========================================
 * GET PROGRESSION
 * ========================================
 */

export async function getProgression(
  profileId: string
): Promise<ProfileProgression | null> {
  const db =
    await getDatabase();

  if (!profileId) {
    return null;
  }

  const row =
    await db.getFirstAsync<ProfileProgressionRow>(
      `
        SELECT *
        FROM profile_progression
        WHERE profile_id = ?
        LIMIT 1;
      `,
      profileId
    );

  if (!row) {
    return null;
  }

  return mapProgression(
    row
  );
}


/*
 * ========================================
 * CREATE PROGRESSION
 * ========================================
 */

export async function createProgression(
  profileId: string
): Promise<ProfileProgression> {
  const db =
    await getDatabase();

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }


  /*
   * ======================================
   * VERIFY PROFILE
   * ======================================
   */

  const profileExists =
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

  if (!profileExists) {
    throw new Error(
      'PROFILE_NOT_FOUND'
    );
  }


  /*
   * ======================================
   * PREVENT DUPLICATE
   * ======================================
   */

  const existing =
    await getProgression(
      profileId
    );

  if (existing) {
    return existing;
  }


  const now =
    new Date().toISOString();


  /*
   * ======================================
   * CREATE
   * ======================================
   */

  await db.runAsync(
    `
      INSERT INTO profile_progression (
        profile_id,
        total_xp,
        current_streak,
        longest_streak,
        last_activity_date,
        created_at,
        updated_at
      )
      VALUES (
        ?,
        0,
        0,
        0,
        NULL,
        ?,
        ?
      );
    `,
    profileId,
    now,
    now
  );


  const progression =
    await getProgression(
      profileId
    );

  if (!progression) {
    throw new Error(
      'FAILED_TO_CREATE_PROGRESSION'
    );
  }

  return progression;
}


/*
 * ========================================
 * GET OR CREATE
 * ========================================
 */

export async function getOrCreateProgression(
  profileId: string
): Promise<ProfileProgression> {
  const existing =
    await getProgression(
      profileId
    );

  if (existing) {
    return existing;
  }

  return createProgression(
    profileId
  );
}


/*
 * ========================================
 * TRAINER LEVEL
 * ========================================
 *
 * Every level requires another 500 XP.
 *
 * 0 XP     → Level 0
 * 500 XP   → Level 1
 * 1000 XP  → Level 2
 * 1500 XP  → Level 3
 * 2000 XP  → Level 4
 *
 * The UI can decide whether to display
 * Level 0 as a special starting state.
 * ========================================
 */

export function calculateTrainerLevel(
  totalXP: number
): number {
  const safeXP =
    Math.max(
      0,
      Math.floor(totalXP)
    );

  return Math.floor(
    safeXP /
      XP_PER_LEVEL
  );
}


/*
 * ========================================
 * XP REQUIRED FOR LEVEL
 * ========================================
 */

export function getXPForLevel(
  level: number
): number {
  if (level <= 0) {
    return 0;
  }

  return (
    level *
    XP_PER_LEVEL
  );
}


/*
 * ========================================
 * XP REQUIRED FOR NEXT LEVEL
 * ========================================
 */

export function getXPForNextLevel(
  totalXP: number
): number {
  const currentLevel =
    calculateTrainerLevel(
      totalXP
    );

  return (
    (currentLevel + 1) *
    XP_PER_LEVEL
  );
}


/*
 * ========================================
 * XP PROGRESS TYPE
 * ========================================
 */

export type XPProgress = {
  currentLevel: number;

  currentXP: number;

  xpForCurrentLevel: number;

  xpForNextLevel: number;

  xpIntoLevel: number;

  xpRemaining: number;

  progressPercent: number;
};


/*
 * ========================================
 * GET XP PROGRESS
 * ========================================
 */

export function getXPProgress(
  totalXP: number
): XPProgress {
  const safeXP =
    Math.max(
      0,
      Math.floor(totalXP)
    );


  const currentLevel =
    calculateTrainerLevel(
      safeXP
    );


  const xpForCurrentLevel =
    currentLevel *
    XP_PER_LEVEL;


  const xpForNextLevel =
    (currentLevel + 1) *
    XP_PER_LEVEL;


  const xpIntoLevel =
    safeXP -
    xpForCurrentLevel;


  const xpRemaining =
    Math.max(
      0,
      xpForNextLevel -
        safeXP
    );


  const progressPercent =
    Math.min(
      100,
      Math.max(
        0,
        (
          xpIntoLevel /
          XP_PER_LEVEL
        ) *
          100
      )
    );


  return {
    currentLevel,

    currentXP:
      safeXP,

    xpForCurrentLevel,

    xpForNextLevel,

    xpIntoLevel,

    xpRemaining,

    progressPercent,
  };
}


/*
 * ========================================
 * UPDATE PROGRESSION
 * ========================================
 */

export async function updateProgression(
  profileId: string,
  updates: {
    totalXP?: number;

    currentStreak?: number;

    longestStreak?: number;

    lastActivityDate?: string | null;
  }
): Promise<ProfileProgression | null> {
  const db =
    await getDatabase();


  const existing =
    await getProgression(
      profileId
    );

  if (!existing) {
    return null;
  }


  const totalXP =
    updates.totalXP !==
    undefined
      ? Math.max(
          0,
          Math.floor(
            updates.totalXP
          )
        )
      : existing.totalXP;


  const currentStreak =
    updates.currentStreak !==
    undefined
      ? Math.max(
          0,
          Math.floor(
            updates.currentStreak
          )
        )
      : existing.currentStreak;


  const longestStreak =
    updates.longestStreak !==
    undefined
      ? Math.max(
          0,
          Math.floor(
            updates.longestStreak
          )
        )
      : existing.longestStreak;


  const lastActivityDate =
    updates.lastActivityDate !==
    undefined
      ? updates.lastActivityDate
      : existing.lastActivityDate;


  const now =
    new Date().toISOString();


  await db.runAsync(
    `
      UPDATE profile_progression
      SET
        total_xp = ?,
        current_streak = ?,
        longest_streak = ?,
        last_activity_date = ?,
        updated_at = ?
      WHERE profile_id = ?;
    `,
    totalXP,
    currentStreak,
    longestStreak,
    lastActivityDate,
    now,
    profileId
  );


  return getProgression(
    profileId
  );
}


/*
 * ========================================
 * CALCULATE NEXT STREAK
 * ========================================
 *
 * This function ONLY calculates what the
 * streak should become.
 *
 * It does NOT modify the database.
 * ========================================
 */

export function calculateNextStreak(
  progression: ProfileProgression,
  activityDate: string
): number {

  /*
   * First qualifying activity ever.
   */

  if (
    !progression.lastActivityDate
  ) {
    return 1;
  }


  const difference =
    getDateDifferenceInDays(
      progression.lastActivityDate,
      activityDate
    );


  /*
   * Same day.
   *
   * Do not increase it.
   */

  if (difference === 0) {
    return progression.currentStreak;
  }


  /*
   * Exactly the next day.
   *
   * Continue streak.
   */

  if (difference === 1) {
    return (
      progression.currentStreak +
      1
    );
  }


  /*
   * Missed one or more days.
   *
   * Reset.
   */

  return 1;
}


/*
 * ========================================
 * MARK DAY ACTIVE
 * ========================================
 *
 * Call this after a qualifying activity.
 *
 * Qualifying activities:
 *
 *   workout
 *   nutrition
 *   running
 *   steps
 *   todo
 *
 * The streak itself NEVER calls this.
 *
 * IMPORTANT:
 *
 * This function only updates the streak.
 *
 * XP service is responsible for awarding
 * the actual streak XP transaction.
 * ========================================
 */

export async function markDayActive(
  profileId: string,
  activityDate: string = getTodayDate()
): Promise<ProfileProgression> {

  const progression =
    await getOrCreateProgression(
      profileId
    );


  /*
   * ======================================
   * ALREADY ACTIVE TODAY
   * ======================================
   */

  if (
    progression.lastActivityDate ===
    activityDate
  ) {
    return progression;
  }


  const newStreak =
    calculateNextStreak(
      progression,
      activityDate
    );


  const newLongestStreak =
    Math.max(
      progression.longestStreak,
      newStreak
    );


  const updated =
    await updateProgression(
      profileId,
      {
        currentStreak:
          newStreak,

        longestStreak:
          newLongestStreak,

        lastActivityDate:
          activityDate,
      }
    );


  if (!updated) {
    throw new Error(
      'FAILED_TO_UPDATE_STREAK'
    );
  }


  return updated;
}


/*
 * ========================================
 * RESET STREAK IF MISSED
 * ========================================
 *
 * Useful when loading the profile.
 *
 * If the user had a streak yesterday but
 * has not done anything today, we don't
 * immediately destroy the streak.
 *
 * The streak is considered active until
 * another day is missed.
 *
 * Example:
 *
 * Last activity = Monday
 * Today         = Tuesday
 *
 * currentStreak remains.
 *
 * If user performs an activity Tuesday:
 * streak continues.
 *
 * If user performs an activity Wednesday:
 * streak resets to 1.
 *
 * This avoids destroying the streak just
 * because the app was opened before the
 * user completed today's activity.
 * ========================================
 */

export function isStreakActiveToday(
  progression: ProfileProgression,
  activityDate: string = getTodayDate()
): boolean {
  return (
    progression.lastActivityDate ===
    activityDate
  );
}


/*
 * ========================================
 * IS STREAK QUALIFYING SOURCE
 * ========================================
 */

export function isStreakQualifyingSource(
  source: XPSource
): boolean {
  return (
    source !== XP_SOURCE.STREAK
  );
}