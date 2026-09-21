import {
  GYMATE_BACKUP_FORMAT,
  GYMATE_BACKUP_VERSION,
  type BackupRow,
  type GymateBackup,
  type GymateBackupResult,
} from '../types/backup';

import {
  getDatabase,
} from '../database/database';


/*
 * ========================================
 * APP VERSION
 * ========================================
 */

const GYMATE_APP_VERSION =
  '1.0.0';


/*
 * ========================================
 * TABLE DEFINITIONS
 * ========================================
 */

const BACKUP_TABLES = {
  profileDetails:
    'profile_details',

  progression:
    'profile_progression',

  xpTransactions:
    'xp_transactions',

  workoutSessions:
    'workout_sessions',

  workoutExercises:
    'workout_exercises',

  workoutSets:
    'workout_sets',

  customExercises:
    'custom_exercises',

  pokemonStarterState:
    'pokemon_starter_state',

  pokemonCurrency:
    'pokemon_currency',

  pokemonShardGrants:
    'pokemon_shard_grants',

  pokemonInventory:
    'pokemon_inventory',

  userPokemon:
    'user_pokemon',

  pokemonTeam:
    'pokemon_team',

  pokedexEntries:
    'pokedex_entries',

  pokemonStreakShardGrants:
    'pokemon_streak_shard_grants',

  userAchievements:
    'user_achievements',

  userGymBadges:
    'user_gym_badges',

  dietTemplates:
    'diet_templates',

  dietTemplateFoods:
    'diet_template_foods',

  dailyNutrition:
    'daily_nutrition',

  dailyNutritionFoods:
    'daily_nutrition_foods',

  dailyActivitySteps:
    'daily_activity_steps',

  runningSessions:
    'running_sessions',

  activityTodoSlots:
    'activity_todo_slots',

  dailyActivityTodos:
    'daily_activity_todos',
} as const;


/*
 * ========================================
 * ID VALIDATION
 * ========================================
 */

function requireString(
  value: unknown,
  field: string
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      `INVALID_BACKUP_${field.toUpperCase()}`
    );
  }

  return value;
}


/*
 * ========================================
 * BACKUP ROW VALIDATION
 * ========================================
 */

function isBackupRow(
  value: unknown
): value is BackupRow {

  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  return Object.values(
    value as Record<string, unknown>
  ).every(
    item =>
      item === null ||
      typeof item === 'string' ||
      typeof item === 'number' ||
      typeof item === 'boolean'
  );
}


/*
 * ========================================
 * ARRAY VALIDATION
 * ========================================
 */

function requireRows(
  value: unknown,
  field: string
): BackupRow[] {

  if (!Array.isArray(value)) {
    throw new Error(
      `INVALID_BACKUP_${field.toUpperCase()}`
    );
  }

  if (
    !value.every(
      isBackupRow
    )
  ) {
    throw new Error(
      `INVALID_BACKUP_${field.toUpperCase()}`
    );
  }

  return value;
}


/*
 * ========================================
 * SINGLE ROW VALIDATION
 * ========================================
 */

function requireRowOrNull(
  value: unknown,
  field: string
): BackupRow | null {

  if (value === null) {
    return null;
  }

  if (!isBackupRow(value)) {
    throw new Error(
      `INVALID_BACKUP_${field.toUpperCase()}`
    );
  }

  return value;
}


/*
 * ========================================
 * VALIDATE BACKUP
 * ========================================
 */

export function validateGymateBackup(
  value: unknown
): GymateBackup {

  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      'INVALID_GYMATE_BACKUP'
    );
  }

  const backup =
    value as Record<
      string,
      unknown
    >;


  /*
   * ======================================
   * HEADER
   * ======================================
   */

  if (
    backup.format !==
    GYMATE_BACKUP_FORMAT
  ) {
    throw new Error(
      'UNSUPPORTED_BACKUP_FORMAT'
    );
  }

  if (
    backup.version !==
    GYMATE_BACKUP_VERSION
  ) {
    throw new Error(
      'UNSUPPORTED_BACKUP_VERSION'
    );
  }

  requireString(
    backup.appVersion,
    'app_version'
  );

  requireString(
    backup.createdAt,
    'created_at'
  );


  /*
   * ======================================
   * PROFILE
   * ======================================
   */

  if (
    typeof backup.profile !==
      'object' ||
    backup.profile === null ||
    Array.isArray(
      backup.profile
    )
  ) {
    throw new Error(
      'INVALID_BACKUP_PROFILE'
    );
  }

  const profile =
    backup.profile as Record<
      string,
      unknown
    >;

  const profileId =
    requireString(
      profile.id,
      'profile_id'
    );

  const username =
    requireString(
      profile.username,
      'username'
    );

  const profileCreatedAt =
    requireString(
      profile.createdAt,
      'profile_created_at'
    );

  const profileUpdatedAt =
    requireString(
      profile.updatedAt,
      'profile_updated_at'
    );


  /*
   * ======================================
   * SECTIONS
   * ======================================
   */

  const profileDetails =
    requireRowOrNull(
      backup.profileDetails,
      'profile_details'
    );

  const progression =
    requireRowOrNull(
      backup.progression,
      'progression'
    );

  const xpTransactions =
    requireRows(
      backup.xpTransactions,
      'xp_transactions'
    );


  /*
   * ======================================
   * WORKOUTS
   * ======================================
   */

  if (
    typeof backup.workouts !==
      'object' ||
    backup.workouts === null ||
    Array.isArray(
      backup.workouts
    )
  ) {
    throw new Error(
      'INVALID_BACKUP_WORKOUTS'
    );
  }

  const workouts =
    backup.workouts as Record<
      string,
      unknown
    >;

  const workoutSessions =
    requireRows(
      workouts.sessions,
      'workout_sessions'
    );

  const workoutExercises =
    requireRows(
      workouts.exercises,
      'workout_exercises'
    );

  const workoutSets =
    requireRows(
      workouts.sets,
      'workout_sets'
    );


  /*
   * ======================================
   * CUSTOM EXERCISES
   * ======================================
   */

  const customExercises =
    requireRows(
      backup.customExercises,
      'custom_exercises'
    );


  /*
   * ======================================
   * POKÉMON
   * ======================================
   */

  if (
    typeof backup.pokemon !==
      'object' ||
    backup.pokemon === null ||
    Array.isArray(
      backup.pokemon
    )
  ) {
    throw new Error(
      'INVALID_BACKUP_POKEMON'
    );
  }

  const pokemon =
    backup.pokemon as Record<
      string,
      unknown
    >;

  const starterState =
    requireRowOrNull(
      pokemon.starterState,
      'pokemon_starter_state'
    );

  const currency =
    requireRowOrNull(
      pokemon.currency,
      'pokemon_currency'
    );

  const shardGrants =
    requireRows(
      pokemon.shardGrants,
      'pokemon_shard_grants'
    );

  const inventory =
    requireRows(
      pokemon.inventory,
      'pokemon_inventory'
    );

  const userPokemon =
    requireRows(
      pokemon.userPokemon,
      'user_pokemon'
    );

  const team =
    requireRows(
      pokemon.team,
      'pokemon_team'
    );

  const pokedex =
    requireRows(
      pokemon.pokedex,
      'pokedex_entries'
    );

  const streakShardGrants =
    requireRows(
      pokemon.streakShardGrants,
      'pokemon_streak_shard_grants'
    );

  const achievements =
    requireRows(
      pokemon.achievements,
      'user_achievements'
    );

  const gymBadges =
    requireRows(
      pokemon.gymBadges,
      'user_gym_badges'
    );


  /*
   * ======================================
   * DIET
   * ======================================
   */

  if (
    typeof backup.diet !==
      'object' ||
    backup.diet === null ||
    Array.isArray(
      backup.diet
    )
  ) {
    throw new Error(
      'INVALID_BACKUP_DIET'
    );
  }

  const diet =
    backup.diet as Record<
      string,
      unknown
    >;

  const dietTemplates =
    requireRows(
      diet.templates,
      'diet_templates'
    );

  const dietTemplateFoods =
    requireRows(
      diet.templateFoods,
      'diet_template_foods'
    );

  const dailyNutrition =
    requireRows(
      diet.dailyNutrition,
      'daily_nutrition'
    );

  const dailyFoods =
    requireRows(
      diet.dailyFoods,
      'daily_nutrition_foods'
    );


  /*
   * ======================================
   * ACTIVITY
   * ======================================
   */

  if (
    typeof backup.activity !==
      'object' ||
    backup.activity === null ||
    Array.isArray(
      backup.activity
    )
  ) {
    throw new Error(
      'INVALID_BACKUP_ACTIVITY'
    );
  }

  const activity =
    backup.activity as Record<
      string,
      unknown
    >;

  const steps =
    requireRows(
      activity.steps,
      'daily_activity_steps'
    );

  const runningSessions =
    requireRows(
      activity.runningSessions,
      'running_sessions'
    );

  const todoSlots =
    requireRows(
      activity.todoSlots,
      'activity_todo_slots'
    );

  const dailyTodos =
    requireRows(
      activity.dailyTodos,
      'daily_activity_todos'
    );


  /*
   * ======================================
   * RETURN NORMALIZED BACKUP
   * ======================================
   */

  return {
    format:
      GYMATE_BACKUP_FORMAT,

    version:
      GYMATE_BACKUP_VERSION,

    appVersion:
      backup.appVersion as string,

    createdAt:
      backup.createdAt as string,

    profile: {
      id:
        profileId,

      username,

      createdAt:
        profileCreatedAt,

      updatedAt:
        profileUpdatedAt,
    },

    profileDetails,

    progression,

    xpTransactions,

    workouts: {
      sessions:
        workoutSessions,

      exercises:
        workoutExercises,

      sets:
        workoutSets,
    },

    customExercises,

    pokemon: {
      starterState,

      currency,

      shardGrants,

      inventory,

      userPokemon,

      team,

      pokedex,

      streakShardGrants,

      achievements,

      gymBadges,
    },

    diet: {
      templates:
        dietTemplates,

      templateFoods:
        dietTemplateFoods,

      dailyNutrition,

      dailyFoods,
    },

    activity: {
      steps,

      runningSessions,

      todoSlots,

      dailyTodos,
    },
  };
}


/*
 * ========================================
 * SELECT PROFILE
 * ========================================
 */

async function getProfile(
  profileId: string
): Promise<{
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
} | null> {

  const db =
    await getDatabase();

  return db.getFirstAsync(
    `
      SELECT
        id,
        username,
        created_at,
        updated_at
      FROM profiles
      WHERE id = ?
      LIMIT 1;
    `,
    profileId
  );
}


/*
 * ========================================
 * CHECK PROFILE COLUMN
 * ========================================
 *
 * Used only for tables that are expected
 * to contain profile_id.
 * ========================================
 */

async function assertProfileColumn(
  table: string
): Promise<void> {

  const db =
    await getDatabase();

  const columns =
    await db.getAllAsync<{
      name: string;
    }>(
      `
        PRAGMA table_info(${table});
      `
    );

  const hasProfileId =
    columns.some(
      column =>
        column.name === 'profile_id'
    );

  if (!hasProfileId) {
    throw new Error(
      `BACKUP_SCHEMA_ERROR:${table}:profile_id`
    );
  }
}


/*
 * ========================================
 * SELECT ONE ROW
 * ========================================
 */

async function getSingleRow(
  table: string,
  profileId: string
): Promise<BackupRow | null> {

  const db =
    await getDatabase();

  await assertProfileColumn(
    table
  );

  return (
    await db.getFirstAsync(
      `
        SELECT *
        FROM ${table}
        WHERE profile_id = ?
        LIMIT 1;
      `,
      profileId
    )
  ) as BackupRow | null;
}


/*
 * ========================================
 * SELECT MANY ROWS
 * ========================================
 */

async function getRows(
  table: string,
  profileId: string
): Promise<BackupRow[]> {

  const db =
    await getDatabase();

  await assertProfileColumn(
    table
  );

  const rows =
    await db.getAllAsync(
      `
        SELECT *
        FROM ${table}
        WHERE profile_id = ?;
      `,
      profileId
    );

  return rows as BackupRow[];
}


/*
 * ========================================
 * EXPORT BACKUP
 * ========================================
 */

export async function exportGymateBackup(
  profileId: string
): Promise<GymateBackup> {

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }


  /*
   * ======================================
   * LOAD PROFILE
   * ======================================
   */

  const profile =
    await getProfile(
      profileId
    );

  if (!profile) {
    throw new Error(
      'PROFILE_NOT_FOUND'
    );
  }


  /*
   * ======================================
   * LOAD DATABASE
   * ======================================
   */

  const db =
    await getDatabase();


  /*
   * ======================================
   * PROFILE DATA
   * ======================================
   */

  const profileDetails =
    await getSingleRow(
      BACKUP_TABLES.profileDetails,
      profileId
    );

  const progression =
    await getSingleRow(
      BACKUP_TABLES.progression,
      profileId
    );

  const xpTransactions =
    await getRows(
      BACKUP_TABLES.xpTransactions,
      profileId
    );


  /*
   * ======================================
   * WORKOUTS
   * ======================================
   */

  const workoutSessions =
    await getRows(
      BACKUP_TABLES.workoutSessions,
      profileId
    );


  /*
   * workout_exercises does NOT contain
   * profile_id.
   *
   * It belongs to workout_sessions through
   * workout_id.
   */

  const workoutExercises =
    await db.getAllAsync(
      `
        SELECT we.*
        FROM workout_exercises we

        INNER JOIN workout_sessions w
          ON w.id =
             we.workout_id

        WHERE w.profile_id = ?;
      `,
      profileId
    ) as BackupRow[];


  /*
   * workout_sets does NOT contain
   * profile_id.
   *
   * It belongs to workout_exercises through
   * workout_exercise_id.
   */

  const workoutSets =
    await db.getAllAsync(
      `
        SELECT ws.*
        FROM workout_sets ws

        INNER JOIN workout_exercises we
          ON we.id =
             ws.workout_exercise_id

        INNER JOIN workout_sessions w
          ON w.id =
             we.workout_id

        WHERE w.profile_id = ?;
      `,
      profileId
    ) as BackupRow[];


  /*
   * ======================================
   * CUSTOM EXERCISES
   * ======================================
   */

  const customExercises =
    await getRows(
      BACKUP_TABLES.customExercises,
      profileId
    );


  /*
   * ======================================
   * POKÉMON
   * ======================================
   */

  const starterState =
    await getSingleRow(
      BACKUP_TABLES.pokemonStarterState,
      profileId
    );

  const currency =
    await getSingleRow(
      BACKUP_TABLES.pokemonCurrency,
      profileId
    );

  const shardGrants =
    await getRows(
      BACKUP_TABLES.pokemonShardGrants,
      profileId
    );

  const inventory =
    await getRows(
      BACKUP_TABLES.pokemonInventory,
      profileId
    );

  const userPokemon =
    await getRows(
      BACKUP_TABLES.userPokemon,
      profileId
    );

  const team =
    await getRows(
      BACKUP_TABLES.pokemonTeam,
      profileId
    );

  const pokedex =
    await getRows(
      BACKUP_TABLES.pokedexEntries,
      profileId
    );

  const streakShardGrants =
    await getRows(
      BACKUP_TABLES.pokemonStreakShardGrants,
      profileId
    );

  const achievements =
    await getRows(
      BACKUP_TABLES.userAchievements,
      profileId
    );

  const gymBadges =
    await getRows(
      BACKUP_TABLES.userGymBadges,
      profileId
    );


  /*
   * ======================================
   * DIET
   * ======================================
   */

  const dietTemplates =
    await getRows(
      BACKUP_TABLES.dietTemplates,
      profileId
    );


  /*
   * diet_template_foods does NOT contain
   * profile_id.
   *
   * It belongs to diet_templates through
   * template_id.
   */

  const dietTemplateFoods =
    await db.getAllAsync(
      `
        SELECT dtf.*
        FROM diet_template_foods dtf

        INNER JOIN diet_templates dt
          ON dt.id =
             dtf.template_id

        WHERE dt.profile_id = ?;
      `,
      profileId
    ) as BackupRow[];


  const dailyNutrition =
    await getRows(
      BACKUP_TABLES.dailyNutrition,
      profileId
    );


  /*
   * daily_nutrition_foods does NOT contain
   * profile_id.
   *
   * It belongs to daily_nutrition through
   * daily_nutrition_id.
   */

  const dailyFoods =
    await db.getAllAsync(
      `
        SELECT dnf.*
        FROM daily_nutrition_foods dnf

        INNER JOIN daily_nutrition dn
          ON dn.id =
             dnf.daily_nutrition_id

        WHERE dn.profile_id = ?;
      `,
      profileId
    ) as BackupRow[];


  /*
   * ======================================
   * ACTIVITY
   * ======================================
   */

  const steps =
    await getRows(
      BACKUP_TABLES.dailyActivitySteps,
      profileId
    );

  const runningSessions =
    await getRows(
      BACKUP_TABLES.runningSessions,
      profileId
    );

  const todoSlots =
    await getRows(
      BACKUP_TABLES.activityTodoSlots,
      profileId
    );

  const dailyTodos =
    await getRows(
      BACKUP_TABLES.dailyActivityTodos,
      profileId
    );


  /*
   * ======================================
   * BUILD BACKUP
   * ======================================
   */

  return {
    format:
      GYMATE_BACKUP_FORMAT,

    version:
      GYMATE_BACKUP_VERSION,

    appVersion:
      GYMATE_APP_VERSION,

    createdAt:
      new Date().toISOString(),

    profile: {
      id:
        profile.id,

      username:
        profile.username,

      createdAt:
        profile.created_at,

      updatedAt:
        profile.updated_at,
    },

    profileDetails,

    progression,

    xpTransactions,

    workouts: {
      sessions:
        workoutSessions,

      exercises:
        workoutExercises,

      sets:
        workoutSets,
    },

    customExercises,

    pokemon: {
      starterState,

      currency,

      shardGrants,

      inventory,

      userPokemon,

      team,

      pokedex,

      streakShardGrants,

      achievements,

      gymBadges,
    },

    diet: {
      templates:
        dietTemplates,

      templateFoods:
        dietTemplateFoods,

      dailyNutrition,

      dailyFoods,
    },

    activity: {
      steps,

      runningSessions,

      todoSlots,

      dailyTodos,
    },
  };
}


/*
 * ========================================
 * COUNT BACKUP RECORDS
 * ========================================
 */

function countBackupRecords(
  backup: GymateBackup
): number {

  return (
    1 +

    (backup.profileDetails
      ? 1
      : 0) +

    (backup.progression
      ? 1
      : 0) +

    backup.xpTransactions.length +

    backup.workouts.sessions.length +
    backup.workouts.exercises.length +
    backup.workouts.sets.length +

    backup.customExercises.length +

    (backup.pokemon.starterState
      ? 1
      : 0) +

    (backup.pokemon.currency
      ? 1
      : 0) +

    backup.pokemon.shardGrants.length +
    backup.pokemon.inventory.length +
    backup.pokemon.userPokemon.length +
    backup.pokemon.team.length +
    backup.pokemon.pokedex.length +
    backup.pokemon.streakShardGrants.length +
    backup.pokemon.achievements.length +
    backup.pokemon.gymBadges.length +

    backup.diet.templates.length +
    backup.diet.templateFoods.length +
    backup.diet.dailyNutrition.length +
    backup.diet.dailyFoods.length +

    backup.activity.steps.length +
    backup.activity.runningSessions.length +
    backup.activity.todoSlots.length +
    backup.activity.dailyTodos.length
  );
}


/*
 * ========================================
 * INSERT ROW
 * ========================================
 */

async function insertRow(
  table: string,
  row: BackupRow
): Promise<void> {

  const db =
    await getDatabase();

  const columns =
    Object.keys(row);

  if (
    columns.length === 0
  ) {
    return;
  }

  const placeholders =
    columns
      .map(() => '?')
      .join(', ');

  const values =
    columns.map(
      column => row[column]
    );

  await db.runAsync(
    `
      INSERT OR REPLACE INTO
      ${table} (
        ${columns.join(', ')}
      )
      VALUES (
        ${placeholders}
      );
    `,
    ...values
  );
}


/*
 * ========================================
 * DELETE EXISTING PROFILE DATA
 * ========================================
 */

async function clearProfileData(
  profileId: string
): Promise<void> {

  const db =
    await getDatabase();


  /*
   * ======================================
   * ACTIVITY
   * ======================================
   */

  await db.runAsync(
    `
      DELETE FROM daily_activity_todos
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM activity_todo_slots
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM running_sessions
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM daily_activity_steps
      WHERE profile_id = ?;
    `,
    profileId
  );


  /*
   * ======================================
   * DIET CHILDREN
   * ======================================
   */

  await db.runAsync(
    `
      DELETE FROM daily_nutrition_foods
      WHERE daily_nutrition_id IN (
        SELECT id
        FROM daily_nutrition
        WHERE profile_id = ?
      );
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM daily_nutrition
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM diet_template_foods
      WHERE template_id IN (
        SELECT id
        FROM diet_templates
        WHERE profile_id = ?
      );
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM diet_templates
      WHERE profile_id = ?;
    `,
    profileId
  );


  /*
   * ======================================
   * POKÉMON
   * ======================================
   */

  await db.runAsync(
    `
      DELETE FROM pokemon_team
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM user_achievements
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM user_gym_badges
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM pokemon_streak_shard_grants
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM pokemon_shard_grants
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM pokemon_inventory
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM pokemon_currency
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM pokemon_starter_state
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM pokedex_entries
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM user_pokemon
      WHERE profile_id = ?;
    `,
    profileId
  );


  /*
   * ======================================
   * XP
   * ======================================
   */

  await db.runAsync(
    `
      DELETE FROM xp_transactions
      WHERE profile_id = ?;
    `,
    profileId
  );


  /*
   * ======================================
   * WORKOUT CHILDREN
   * ======================================
   */

  await db.runAsync(
    `
      DELETE FROM workout_sets
      WHERE workout_exercise_id IN (
        SELECT we.id
        FROM workout_exercises we
        INNER JOIN workout_sessions ws
          ON ws.id = we.workout_id
        WHERE ws.profile_id = ?
      );
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM workout_exercises
      WHERE workout_id IN (
        SELECT id
        FROM workout_sessions
        WHERE profile_id = ?
      );
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM workout_sessions
      WHERE profile_id = ?;
    `,
    profileId
  );


  /*
   * ======================================
   * CUSTOM EXERCISES
   * ======================================
   */

  await db.runAsync(
    `
      DELETE FROM custom_exercises
      WHERE profile_id = ?;
    `,
    profileId
  );


  /*
   * ======================================
   * PROGRESSION / DETAILS
   * ======================================
   */

  await db.runAsync(
    `
      DELETE FROM profile_progression
      WHERE profile_id = ?;
    `,
    profileId
  );

  await db.runAsync(
    `
      DELETE FROM profile_details
      WHERE profile_id = ?;
    `,
    profileId
  );
}


/*
 * ========================================
 * IMPORT BACKUP
 * ========================================
 */

export async function importGymateBackup(
  profileId: string,
  input: unknown
): Promise<GymateBackupResult> {

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }


  /*
   * ======================================
   * VALIDATE BEFORE DATABASE CHANGES
   * ======================================
   */

  const backup =
    validateGymateBackup(
      input
    );


  /*
   * ======================================
   * VERIFY PROFILE
   * ======================================
   */

  const existingProfile =
    await getProfile(
      profileId
    );

  if (!existingProfile) {
    throw new Error(
      'PROFILE_NOT_FOUND'
    );
  }


  /*
   * ======================================
   * PROFILE SAFETY CHECK
   * ======================================
   */

  if (
    backup.profile.id !==
    profileId
  ) {
    throw new Error(
      'BACKUP_PROFILE_MISMATCH'
    );
  }


  /*
   * ======================================
   * TRANSACTION
   * ======================================
   */

  const db =
    await getDatabase();

  let restoredRecords = 0;


  await db.withTransactionAsync(
    async () => {

      /*
       * ====================================
       * CLEAR CURRENT DATA
       * ====================================
       */

      await clearProfileData(
        profileId
      );


      /*
       * ====================================
       * PROFILE DETAILS
       * ====================================
       */

      if (
        backup.profileDetails
      ) {

        await insertRow(
          BACKUP_TABLES.profileDetails,
          backup.profileDetails
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * PROGRESSION
       * ====================================
       */

      if (
        backup.progression
      ) {

        await insertRow(
          BACKUP_TABLES.progression,
          backup.progression
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * XP
       * ====================================
       */

      for (
        const row of
        backup.xpTransactions
      ) {

        await insertRow(
          BACKUP_TABLES.xpTransactions,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * WORKOUT SESSIONS
       * ====================================
       */

      for (
        const row of
        backup.workouts.sessions
      ) {

        await insertRow(
          BACKUP_TABLES.workoutSessions,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * WORKOUT EXERCISES
       * ====================================
       */

      for (
        const row of
        backup.workouts.exercises
      ) {

        await insertRow(
          BACKUP_TABLES.workoutExercises,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * WORKOUT SETS
       * ====================================
       */

      for (
        const row of
        backup.workouts.sets
      ) {

        await insertRow(
          BACKUP_TABLES.workoutSets,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * CUSTOM EXERCISES
       * ====================================
       */

      for (
        const row of
        backup.customExercises
      ) {

        await insertRow(
          BACKUP_TABLES.customExercises,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * POKÉMON STARTER STATE
       * ====================================
       */

      if (
        backup.pokemon.starterState
      ) {

        await insertRow(
          BACKUP_TABLES.pokemonStarterState,
          backup.pokemon.starterState
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * POKÉMON CURRENCY
       * ====================================
       */

      if (
        backup.pokemon.currency
      ) {

        await insertRow(
          BACKUP_TABLES.pokemonCurrency,
          backup.pokemon.currency
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * POKÉMON SHARD GRANTS
       * ====================================
       */

      for (
        const row of
        backup.pokemon.shardGrants
      ) {

        await insertRow(
          BACKUP_TABLES.pokemonShardGrants,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * POKÉMON INVENTORY
       * ====================================
       */

      for (
        const row of
        backup.pokemon.inventory
      ) {

        await insertRow(
          BACKUP_TABLES.pokemonInventory,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * USER POKÉMON
       * ====================================
       */

      for (
        const row of
        backup.pokemon.userPokemon
      ) {

        await insertRow(
          BACKUP_TABLES.userPokemon,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * POKÉMON TEAM
       * ====================================
       */

      for (
        const row of
        backup.pokemon.team
      ) {

        await insertRow(
          BACKUP_TABLES.pokemonTeam,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * POKÉDEX
       * ====================================
       */

      for (
        const row of
        backup.pokemon.pokedex
      ) {

        await insertRow(
          BACKUP_TABLES.pokedexEntries,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * STREAK SHARD GRANTS
       * ====================================
       */

      for (
        const row of
        backup.pokemon.streakShardGrants
      ) {

        await insertRow(
          BACKUP_TABLES.pokemonStreakShardGrants,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * ACHIEVEMENTS
       * ====================================
       */

      for (
        const row of
        backup.pokemon.achievements
      ) {

        await insertRow(
          BACKUP_TABLES.userAchievements,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * GYM BADGES
       * ====================================
       */

      for (
        const row of
        backup.pokemon.gymBadges
      ) {

        await insertRow(
          BACKUP_TABLES.userGymBadges,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * DIET TEMPLATES
       * ====================================
       */

      for (
        const row of
        backup.diet.templates
      ) {

        await insertRow(
          BACKUP_TABLES.dietTemplates,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * DIET TEMPLATE FOODS
       * ====================================
       */

      for (
        const row of
        backup.diet.templateFoods
      ) {

        await insertRow(
          BACKUP_TABLES.dietTemplateFoods,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * DAILY NUTRITION
       * ====================================
       */

      for (
        const row of
        backup.diet.dailyNutrition
      ) {

        await insertRow(
          BACKUP_TABLES.dailyNutrition,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * DAILY NUTRITION FOODS
       * ====================================
       */

      for (
        const row of
        backup.diet.dailyFoods
      ) {

        await insertRow(
          BACKUP_TABLES.dailyNutritionFoods,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * STEPS
       * ====================================
       */

      for (
        const row of
        backup.activity.steps
      ) {

        await insertRow(
          BACKUP_TABLES.dailyActivitySteps,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * RUNNING SESSIONS
       * ====================================
       */

      for (
        const row of
        backup.activity.runningSessions
      ) {

        await insertRow(
          BACKUP_TABLES.runningSessions,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * TODO SLOTS
       * ====================================
       */

      for (
        const row of
        backup.activity.todoSlots
      ) {

        await insertRow(
          BACKUP_TABLES.activityTodoSlots,
          row
        );

        restoredRecords += 1;
      }


      /*
       * ====================================
       * DAILY TODOS
       * ====================================
       */

      for (
        const row of
        backup.activity.dailyTodos
      ) {

        await insertRow(
          BACKUP_TABLES.dailyActivityTodos,
          row
        );

        restoredRecords += 1;
      }
    }
  );


  /*
   * ======================================
   * SUCCESS
   * ======================================
   */

  return {
    success: true,

    message:
      'Gymate backup restored successfully.',

    restoredRecords,
  };
}


/*
 * ========================================
 * SERIALIZE BACKUP
 * ========================================
 */

export function serializeGymateBackup(
  backup: GymateBackup
): string {

  validateGymateBackup(
    backup
  );

  return JSON.stringify(
    backup,
    null,
    2
  );
}


/*
 * ========================================
 * PARSE BACKUP
 * ========================================
 */

export function parseGymateBackup(
  json: string
): GymateBackup {

  if (
    typeof json !== 'string' ||
    !json.trim()
  ) {
    throw new Error(
      'BACKUP_FILE_EMPTY'
    );
  }

  let parsed: unknown;

  try {

    parsed =
      JSON.parse(json);

  } catch {

    throw new Error(
      'INVALID_BACKUP_JSON'
    );
  }

  return validateGymateBackup(
    parsed
  );
}


/*
 * ========================================
 * GET BACKUP SUMMARY
 * ========================================
 */

export function getGymateBackupSummary(
  backup: GymateBackup
): {
  createdAt: string;
  username: string;
  recordCount: number;
} {

  validateGymateBackup(
    backup
  );

  return {
    createdAt:
      backup.createdAt,

    username:
      backup.profile.username,

    recordCount:
      countBackupRecords(
        backup
      ),
  };
}